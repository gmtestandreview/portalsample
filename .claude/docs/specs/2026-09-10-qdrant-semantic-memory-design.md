# Design: Qdrant semantic memory layer — 2026-09-10

## Summary

Add a semantic (natural-language) search layer over this repo's source, docs, and agent memory notes, backed by a **locally self-hosted Qdrant instance** (Docker, no cloud) and the official `mcp-server-qdrant` MCP server. Agents (Claude Code, Codex, Copilot) get a `qdrant-find`/`qdrant-store` tool surface for semantic recall; a Python ingestion script (re)builds the index from the repo's own files and this project's Claude Code memory directories. Chosen over the originally-provisioned Qdrant Cloud cluster because self-hosting eliminates the third-party data-egress question entirely for an NMI government portal snapshot, at negligible added resource cost (Docker is already a dependency here for the `github` MCP server; Qdrant's own footprint for this corpus size is tens of MB).

## Assumptions

- Docker is installed and working on this machine (confirmed: `docker version` → 29.6.2; already load-bearing for `scripts/github-mcp-server.cmd`).
- Corpus is bounded to this project: `ClientApp/src`, `docs/**`, `.claude/docs/specs/**` from the repo, plus `memory/*.md` + `MEMORY.md` from this project's Claude Code memory directories (outside the repo — see "Resolving the memory directory"). Not a multi-repo or enterprise-scale corpus.
- Single machine, local use only — no CI involvement (confirmed by user).
- Node ≥24's native TypeScript type-stripping and this repo's existing `scripts/*.py` convention (stdlib-only, no `requirements.txt` anywhere yet) are both real and current.

## Open questions

None blocking — all material forks were resolved during design (see Trade-offs). The previously-deferred item (removing the unused Qdrant Cloud `QDRANT_API_KEY`) is done: GitHub repo secret deleted 2026-09-10 (see Security).

## Requirements

**Functional**
- Agents can semantically search source code, docs/ADRs, and memory notes via `qdrant-find`, scoped by collection.
- A bulk ingestion script (re)builds the index from repo files and Claude Code memory directories on demand and automatically at session end.
- Index freshness is visible (last-indexed commit hash), without requiring the index to always be current.

**Non-functional**
- Must not meaningfully burden a resource/storage-constrained machine.
- No portal source or config content may leave the machine (local-only, no cloud fallback for this feature).
- Rebuilds must never leave a collection empty/degraded due to a crash mid-run (atomicity).
- Search quality must be checked against a baseline, not assumed.

## Current state

- `scripts/github-mcp-server.cmd` already runs `docker run ... ghcr.io/github/github-mcp-server` — Docker is a live, existing dependency, not new.
- `.mcp.json` / `.vscode/mcp.json` / `.codex/config.toml` already register MCP servers (github, react-aria, tokensave, sonarqube) with env-sourced config — the same pattern extends directly to `mcp-server-qdrant`.
- `.claude/settings.json` already has a `Stop` hook block (`scripts/metrics.py`, `scripts/session_export.py`, tokensave's `hook-stop`), each guarded `test -f <script> && (python <script> || python3 <script>) || true` — never blocks session close on failure. The new indexer hook follows this exact pattern.
- `tests/hooks/test_pre_tool_use.py`, `tests/hooks/test_watcher_pid.py` establish the pytest convention for this repo's Python tooling.
- `@qdrant/js-client-rest` is already a dependency in `package.json` (pre-added, unused) — not used by this design (ingestion is Python, for embedding parity with the MCP server — see Trade-offs); left in place, out of scope to remove.
- No `requirements.txt`/`pyproject.toml` exists anywhere in the repo today for the Python scripts (`metrics.py`, `pre_tool_use.py`, etc. — apparently stdlib-only).
- CLAUDE.md's generated/vendor edit-boundary list (`web-api-client.ts`, `external/**`, `webpack/**`, generated `main.*.js/css`, `source-map-http-downloads/**`) is reused verbatim as the ingestion exclusion list.
- **Corrected during audit**: `Glob("memory/*.md")` and `Glob("MEMORY.md")` against the repo root both return zero results. The auto-memory system does not live in this git repository — it lives at `~/.claude/projects/<sanitized-cwd>/memory/`, a per-machine directory keyed by a sanitized form of the absolute working-directory path (verified: replacing every non-alphanumeric character with `-` reproduces this session's actual directory name exactly). Since this repo uses git worktrees for isolated feature work, different worktrees resolve to *different* memory directories under this scheme — see "Resolving the memory directory" below.

## Proposed design

### Components

| Component | Description |
|---|---|
| `docker-compose.qdrant.yml` | Single-node Qdrant, image pinned to `qdrant/qdrant:v1.18.x` (not `:latest` — the embedding ADR depends on ≥ v1.18 for named-vector-on-existing; pin with a comment saying why), port bound to `127.0.0.1:6333` only (not `0.0.0.0` — Qdrant has no auth by default, so local-only binding is the actual security boundary), storage bind-mounted to git-ignored `.qdrant/storage/`, `restart: unless-stopped`. |
| `mcp-server-qdrant` wiring | Added to `.mcp.json`, `.vscode/mcp.json`, `.codex/config.toml` via `uvx mcp-server-qdrant`. `QDRANT_URL=http://localhost:6333`, no `QDRANT_API_KEY` (local, unauthenticated by design). `EMBEDDING_PROVIDER=fastembed`, `EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2` pinned explicitly in every config surface (see Trade-offs #3 — this value must never drift). `QDRANT_READ_ONLY=true` so the server exposes only `qdrant-find`, never `qdrant-store` — Trade-off #7's "indexer is the sole writer" is then enforced by config, not convention (the indexer writes through `qdrant-client` directly and is unaffected). `TOOL_STORE_DESCRIPTION` is consequently unset; a custom `TOOL_FIND_DESCRIPTION` still tells agents which collection to use for what. **Named-vector note:** `mcp-server-qdrant`'s `qdrant-find` queries the collection's *default (unnamed)* vector and has no `using:` knob. The primary model is stored as the default unnamed vector (MCP works unmodified); challenger models (per the ADR's A/B) are added as *named* vectors and scored only from the standalone eval script. Promoting a challenger = recreate the collection with it as the new default (minutes at this corpus size — the staging + alias-swap rebuild just re-runs). |
| `scripts/requirements-qdrant.txt` | `qdrant-client==X.Y.Z`, `fastembed==X.Y.Z`, `tree-sitter-language-pack==X.Y.Z` — **exact** pins (resolved at implementation time), this repo's first Python dependency manifest. A `fastembed` bump can change embedding output even with the model string unchanged, so **bumping `fastembed` requires a full reindex** (delete `.qdrant/last_indexed.json` to force it) and the pinned version is asserted by the consistency test below. |
| `scripts/qdrant_index.py` | The ingestion script (see Pipeline below). |
| Collection `portal-source` | `ClientApp/src/**` (minus CLAUDE.md exclusions) + `docs/**` + `.claude/docs/specs/**` (minus `**/archive/**` — see pipeline step 2). |
| Collection `agent-memory` | `memory/*.md` + `MEMORY.md` aggregated across **every live worktree of this repo** (see "Resolving the memory directory" below) — not a single repo-relative path, and not by reproducing Claude Code's path-sanitization algorithm. Populated **only** by the indexer — no ad hoc `qdrant-store` writes in v1 (see Trade-offs, #7). |
| `.claude/settings.json` Stop hook | `test -f scripts/qdrant_index.py && (python scripts/qdrant_index.py || python3 scripts/qdrant_index.py) 2>/dev/null || true`, registered with **`async: true`** so it never blocks session close (it fires on Stop — session end, `/compact`, `/clear`). Matches this repo's existing Stop-hook idiom otherwise. Safe to invoke unconditionally because the script's own fast-exit check (pipeline step 1) makes a no-op run cheap. A broken indexer logs and moves on. Written at implementation time (once the script exists and can be pipe-tested per the `update-config` skill's verification workflow), not now. |

### Why two collections, not one

Originally justified by differing rebuild policy (source = full rebuild, memory = incremental, to avoid clobbering ad hoc agent writes). That justification evaporated once ad hoc writes were dropped (#7) — both collections now rebuild identically. The surviving reason is **query-scoping**: an agent asking "what does `AuthenticatedElement` do" and one asking "what did we decide about SEC-010" are different intents, and passing `collection_name` on `qdrant-find` is free — no `FilterableField`/`QDRANT_ALLOW_ARBITRARY_FILTER` config needed. A single collection with a `content_type` payload filter was considered and rejected as strictly more setup for the same effect.

### Resolving the memory directory (worktree-aware)

The auto-memory system lives under `~/.claude/projects/<sanitized-cwd>/memory/`, outside the repo. The sanitization is *roughly* "non-alphanumeric → `-`" (that form reproduces this session's actual directory name), but Claude Code also has a documented truncate-at-200-chars-plus-hash branch that this repo's long, deeply-nested worktree paths could plausibly hit — and that branch is **not** independently verified. Reproducing an internal algorithm whose hard case is unconfirmed is a standing fragility, so the indexer does **not** reproduce it.

Instead, because `agent-memory` does a full rebuild every run and indexing only the current session's `cwd` would let one worktree's run silently wipe another's contributed memory, the indexer resolves memory directories by **discovery, not derivation**:

1. Enumerate this repo's worktrees with `git worktree list --porcelain`; keep only those whose working directory still exists on disk and whose branch is not already merged into the main branch (stale/removed worktrees don't resurrect dead context).
2. Glob `<claude-projects-root>/*/memory/` (root resolved from `$CLAUDE_CONFIG_DIR` if set, else `$HOME`/`$USERPROFILE` + `.claude/projects` — git-bash on Windows is the only runtime, so both env vars are handled).
3. Match a candidate `memory/` directory to this repo by identity, not by path shape: its sibling transcript metadata / `MEMORY.md` content references this repo's remote URL or root path. Keep the matches whose originating worktree survived step 1.
4. Union `memory/*.md` + `MEMORY.md` across the surviving directories into the one `agent-memory` rebuild.

If step 3 yields nothing (fresh machine, no memory written yet), `agent-memory` is built empty and the summary says so explicitly — it is not a silent no-op.

### Ingestion pipeline (`scripts/qdrant_index.py`)

1. **Fast-exit check**: before touching FastEmbed or Qdrant, compute a single change-token and compare it to the one in `.qdrant/last_indexed.json` from the last successful run. The token is `sha256(` concatenation of: `git ls-files -s -- <portal-source watched paths>` (blob SHAs + paths — stable across branch switches, stashes, and detached-HEAD checkouts because it hashes tree content, not refs), the sorted list of resolved `agent-memory` files with their `sha256`, the pinned `EMBEDDING_MODEL`, and the pinned `fastembed` version `)`. If it matches, print `nothing changed since last index (commit <short-sha>, <ISO-8601 timestamp>), skipping` and exit 0 immediately — no model load, no Qdrant connection. Marker fields: `{change_token, commit_hash, timestamp}`. Including the model + `fastembed` version in the token means a dependency bump auto-invalidates without a manual step. This is what makes it safe for the `async` Stop hook to invoke the script on every Stop. If `import fastembed` / `qdrant_client` fails (dependencies never installed), the script writes `{error: "dependencies not installed"}` into the marker and exits 0 — inert, not broken — so `status.py` surfaces `memory index: error` instead of the layer just silently returning nothing.
2. **Walk** watched paths, applying exclusions: CLAUDE.md's generated/vendor list, `node_modules`, build/coverage output, `**/archive/**`, and a filename-level secret guard (`*.env*`, `*secret*`, `*.pem`, `*.key`, `*token*`) regardless of directory. **Superseded-doc hygiene:** Qdrant has no notion that a v2 doc supersedes a v1 — it indexes whatever is on disk (per Qdrant's "Incremental Embedding Updates" tutorial, a full rebuild already handles *changed/deleted* files for free; a superseded file that still exists does not). So when a spec/ADR is superseded, move it to an `archive/` subdirectory (`.claude/docs/specs/archive/`, `docs/adr/archive/`); the `**/archive/**` exclusion keeps it out of the index with zero query-time filtering. (Considered and rejected as heavier: a `status: superseded` front-matter flag → payload field → `FilterableField` filter on `qdrant-find`.)
3. **Chunk**, symbol-aware, not line-window-blind (line windows chop mid-function/mid-sentence — confirmed by Qdrant's own search-quality guidance as a 30-40% relevance hit):
   - `.ts`/`.tsx`: parsed with `tree-sitter-language-pack` (pre-compiled wheels, no C compiler needed — verified: Windows `win_amd64` wheels available). One chunk per top-level symbol (function/class/component/interface/type/enum, including `export const Foo = () => {}` patterns). Bare imports/top-level statements bundle into one small file-header chunk.
   - `.md` (docs/memory): chunk by `##` header section.
   - **Token-limit safety net**: `sentence-transformers/all-MiniLM-L6-v2` silently truncates anything over ~256 tokens (confirmed — no error, just quiet data loss). Any chunk measured (via the real tokenizer, not line-count guessing) over ~230 tokens is sub-split further. This replaces line-count-based sizing entirely.
   - Each chunk's content is scanned with a lightweight secret-pattern regex before embedding (common key/token shapes); matches are skipped and logged, not embedded.
4. **Embed** via `fastembed.TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")` — same library, same explicit model name as the MCP server, for guaranteed vector parity. An on-disk embedding cache (`.qdrant/embedding_cache.json`) skips re-embedding unchanged chunks across runs — a performance optimization, not a correctness mechanism. Entries are keyed by `sha256(model_name + "\0" + chunk_text)`, **not** content alone: after a model swap the change-token in step 1 forces a full reindex, but within that reindex a content-only key would still hand back vectors from the *old* model's space for unchanged chunks — the mismatch Trade-off #3 exists to prevent. The file is written atomically (temp + rename); a cache that fails to load is discarded and rebuilt, never fatal.
5. **Build to staging, then atomic swap**: first sweep any `*__staging_*` collections left by a previously crashed run (match the `<base>__staging_` prefix) — otherwise a run of crashes accumulates orphaned full copies of the corpus on disk. Then create `portal-source__staging_<ts>` (and `agent-memory__staging_<ts>`) with the **primary model as the default (unnamed) vector** so `mcp-server-qdrant`'s `qdrant-find` works unmodified (per the ADR, collections are created on Qdrant ≥ v1.18 so a challenger model can later be added as a *named* vector via `UpdateVectors` without recreating). Populate fully, verify point count matches expected chunk count, then use Qdrant's collection-alias API to atomically point `portal-source`/`agent-memory` at the new backing collection and delete the old one. This is the fix for the non-atomic-rebuild risk identified during review — a crash mid-run leaves the *previous* good index live, never an empty one.
6. **Summarize**: files scanned/skipped, chunks embedded (vs. served from cache), points written, current `git rev-parse HEAD` (short) printed as the "last indexed at" marker, elapsed time.
7. **Validate**: after (5), run the labeled eval set in `scripts/qdrant_golden_set.json` against the new collection. Per the embedding ADR this is **~50 labeled queries** (hand-curated real questions + LLM-synthetic), each with known-relevant chunk ids, covering both collections and deliberately including (a) code / literal-identifier queries — the case dense-only + a general model handles worst — and (b) a subset framed as head-to-head against `tokensave` so "does this beat the tool we already mandate" is measured, not assumed. Score with `ranx`. **Gate** (opening proposal, ratify against the first real run): `Recall@10 ≥ 0.80`, `MRR ≥ 0.60`, and approximate-vs-`exact=true` `recall@10 ≥ 0.95`. A miss is a non-fatal warning on a Stop-hook run and a hard failure in the `test:*` gate. Keeping the set current when a referenced file is renamed/removed is part of that change, like a test fixture. A minimal ~5-query smoke subset runs on every reindex; the full ~50 runs in the `test:*` gate and after a model/chunking change.

### What was deliberately left out (and why)

- **Hybrid (dense+sparse) search**: `mcp-server-qdrant`'s `qdrant-find` tool only wires a single dense FastEmbed vector — no sparse/BM25 provider in its settings. Building sparse vectors in the ingestion script wouldn't help, since the tool agents actually call can't use them. Adding hybrid later is a forked MCP server or a custom find path — a project, not a config toggle, so the cost is asymmetric. The eval set's code/identifier queries (step 7) are the trigger: if dense-only fails there, that's the signal to pay that cost.
- **Reranking**: warranted for large/noisy result sets; this corpus is one small portal app. Revisit only if the eval gate (step 7) shows real precision problems.
- **Ad hoc `qdrant-store` writes**: dropped for v1 (see Trade-offs, #7) to avoid two divergent, unsynced "memory" systems — and enforced with `QDRANT_READ_ONLY=true`, which removes `qdrant-store` from the tool surface entirely rather than trusting agents not to call it.

### Failure behaviour

- Ingestion script: unreachable Qdrant → fail loud, non-zero exit. Per-chunk embedding/secret-scan errors are logged and skipped (not fatal to the whole run); a non-zero exit and summary if any occurred.
- MCP tool calls: if Qdrant isn't running, `qdrant-find`/`qdrant-store` fail with a plain connection error — no silent fallback.
- Stop hook: `async: true`, so it never blocks session close regardless of indexer outcome. Because it runs detached and stderr is discarded, a persistent break (Python env drift, Qdrant down, corrupt marker) is otherwise invisible — the staleness signal below is what surfaces it.

### Observability

- Ingestion summary (step 6 above): files scanned/skipped, chunks embedded vs. cached, points written, last-indexed commit + timestamp, elapsed time.
- **Staleness signal**: `scripts/status.py` (this repo's existing status-line command) reads `.qdrant/last_indexed.json` and shows `memory index: <N>d stale` (or `unbuilt` / `error` if the marker is missing or its last run recorded a failure) once older than a threshold. This is the one always-visible cue that the silent `async` hook has stopped working — without it, index drift has no signal at all.
- No dashboards / metrics infrastructure beyond that — appropriate for single-user local tooling.

### Testing

- `tests/qdrant/test_chunker.py`, `tests/qdrant/test_exclusions.py` — pure-function unit tests (tree-sitter chunk boundaries, token-limit sub-splitting, exclusion matcher), matching the existing `tests/hooks/` pytest convention.
- `tests/qdrant/test_embedding_model_consistency.py` — asserts the `EMBEDDING_MODEL`/`model_name` value matches across `.mcp.json`, `.vscode/mcp.json`, `.codex/config.toml`, and `scripts/qdrant_index.py` (ideally all four read one shared constant), **and** that the `fastembed` version pinned in `scripts/requirements-qdrant.txt` matches the installed version. Targets the exact bug class caught once in review (mismatched `mcp-server-qdrant` vs `fastembed` defaults) plus the silent-output-change risk of an unpinned `fastembed` bump.
- Manual/integration validation: `docker compose -f docker-compose.qdrant.yml up -d` → run the indexer → confirm point counts → confirm a live `qdrant-find` call via the MCP server returns the expected file for a known query.
- The eval set (pipeline step 7, `ranx`-scored per the ADR) is the automated regression gate for future model / chunking / index-config changes, run in full in the `test:*` gate.

### Security

- No API key required or configured (local, unauthenticated by default) — bound to `127.0.0.1` only, never `0.0.0.0`.
- `.qdrant/` is git-ignored (added alongside the other runtime-output entries). Correction from earlier discussion: Qdrant stores full chunk **text** as payload, not just vectors — `.qdrant/storage/` is a real (if local-only) second copy of portal source and memory notes. It does not read as "source", so it must also be kept out of any file-sync or backup tooling on the machine (OneDrive/Dropbox, `tar` of the working tree, IDE workspace indexers) — the same handling the repo itself gets.
- Filename-level and content-level (regex) secret guards, both applied before anything is embedded or stored. Both are denylists — they catch common key/token shapes, not an internal hostname, a customer name in a fixture, or a JWT in a comment; anything they miss lands in `.qdrant/storage/` as payload.
- **Accepted residual risk**: the local Qdrant has no authentication, so any process on the machine (an npm `postinstall`, a VS Code extension, `uvx`-run tooling) can read the entire index over `http://127.0.0.1:6333`. The `127.0.0.1` bind stops *remote* access only. Accepted for single-user local tooling; a local API key would be theatre (it would sit in the same config surfaces the reader can already read). Revisit if the machine becomes multi-user or runs untrusted workloads.
- The cloud `QDRANT_API_KEY` (previously in local env + GitHub repo secret) is unused by this design and was **revoked on 2026-09-10**: the GitHub repo secret is deleted; any copy in the operator's shell/OS environment is theirs to clear, and the key should also be invalidated in the Qdrant Cloud console since the cluster endpoint appears in this session's chat logs.

## Trade-offs

| # | Decision | Why | Alternative considered | Rejected because |
|---|---|---|---|---|
| 1 | Local Docker, not Qdrant Cloud | Resolves data-egress concern for portal source at negligible resource cost (Docker already required here) | Qdrant Cloud (already provisioned) | Sends portal source to a third party for no benefit once local was shown to be cheap |
| 2 | Python ingestion script | Guarantees vector parity with the MCP server (same `fastembed` library, same explicit model) | TypeScript + `@mastra/fastembed` | JS FastEmbed port is a fork of an archived package repurposed from an agent framework; parity "likely" not guaranteed |
| 3 | `EMBEDDING_MODEL` pinned explicitly everywhere | `mcp-server-qdrant`'s default (MiniLM) and `fastembed`'s own default (BAAI/bge-small) differ despite matching dimensions — silent vector-space mismatch otherwise | Rely on each tool's own default | Already caused one caught-in-review bug; unpinned defaults are a real config-drift risk |
| 4 | Two collections (`portal-source`, `agent-memory`) | Free query-scoping via `collection_name` param | One collection + `content_type` payload filter | Strictly more setup (`FilterableField`/`QDRANT_ALLOW_ARBITRARY_FILTER`) for the same effect |
| 5 | Symbol-aware chunking (tree-sitter / markdown headers) | Line-window chunking measurably degrades retrieval quality (30-40% per Qdrant's own guidance) and this design prioritizes actually-good results over shipping the naive version | Fixed line-window chunking | Explicitly rejected by the user — "good experience" over a known limitation |
| 6 | Build-to-staging + atomic alias swap | A crash mid-rebuild must never leave a live collection empty | Delete-then-repopulate in place | Non-atomic; a crash between delete and repopulate silently degrades search with no error surfaced |
| 7 | No ad hoc `qdrant-store` writes in v1, enforced by `QDRANT_READ_ONLY=true` | Avoids two systems of record (this + the existing file-based memory workflow) drifting apart with no sync guarantee; config-enforced so an agent that just calls the tool can't violate it | Wire `qdrant-store` into the existing memory-write workflow | More moving parts; the existing file-based system is already authoritative and the indexer picks up everything written there regardless |
| 8 | No hybrid search / no reranking | `qdrant-find` can't use sparse vectors even if built; corpus is too small for reranking to matter yet | Dense+sparse RRF; cross-encoder reranking | Real complexity, no reachable benefit at this scale/tool surface. Cost is asymmetric (a fork, not a toggle), so the eval set (step 7) carries code/identifier + `tokensave`-head-to-head queries as the explicit trigger to reconsider |
| 9 | Automated reindex via Claude Code `Stop` hook | Matches this repo's existing hook-heavy tooling and the right cadence (once per session, not per-edit) | Git post-commit hook; scheduled task | Git hooks aren't shareable across clones without `husky` (not a dependency); scheduled tasks are less responsive and don't fit this repo's existing automation style |
| 10 | `agent-memory` resolves memory dirs by **discovery** (glob `claude-projects-root/*/memory/` + repo-identity match + live-worktree filter), not by reproducing Claude Code's path-sanitization algorithm | The sanitization has an unverified truncate-plus-hash branch this repo's long worktree paths could hit; reproducing an internal algorithm whose hard case is unconfirmed is a standing fragility. Discovery also lets one worktree's full-rebuild avoid wiping another's contributed memory | (a) Reproduce the algorithm; (b) index only the main checkout | (a) breaks silently if the hash branch fires and our reproduction is wrong; (b) silently drops any worktree-session memory — both audit-caught |
| 11 | Collections created with **named-vector-capable** schema (Qdrant ≥ v1.18), primary model as the default unnamed vector | Keeps `mcp-server-qdrant`'s `qdrant-find` working unmodified while making a later model swap a background `UpdateVectors` backfill instead of a migration — "define both vector fields upfront" per the model-migration skill | Single plain vector, recreate collection on any model change | Recreate-on-change is fine at this corpus size but throws away the cheap A/B path the ADR's eval process depends on |

## Decisions needing an ADR

- **Embedding model** — DONE. `docs/adr/2026-09-10-qdrant-embedding-strategy.md`
  (Accepted): keep `all-MiniLM-L6-v2` pinned everywhere; English-only + 256-token
  cap accepted (mitigated by the pipeline step-3 token safety net); Cloud
  Inference and external embedding APIs rejected; collections built with named
  vectors so the model stays a cheaply reversible, eval-gated choice. Trade-off
  #3's pin-everywhere rule stands; its pinned *value* is confirmed, not changed.
- **Hosting model** (local Docker vs. Qdrant Cloud) — TODO. Owner: gregm. Write
  via the `adr` skill alongside the implementation plan; it is the infra /
  data-flow decision this repo's rules flag for an ADR. The embedding ADR above
  assumes it is accepted.

## Validation & rollback

- **Validation**: bring the container up, run the indexer, confirm point counts, confirm the ~50-query `ranx` eval clears the ADR gate (`Recall@10 ≥ 0.80`, `MRR ≥ 0.60`, approx-vs-exact `recall@10 ≥ 0.95`) — including the code/identifier and `tokensave`-head-to-head subsets — and confirm `qdrant-find` works end-to-end through the MCP server from a live Claude Code session. Retrieval is not "done" until the gate is cleared, per the ADR.
- **Rollback**: `docker compose down`, delete `.qdrant/` — no residual footprint. MCP config entries are additive and can be removed from the three config files independently. The Stop hook is guarded by `test -f scripts/qdrant_index.py`, so removing the script alone silently disables it. A pre-first-index model change is one edit to the shared `EMBEDDING_MODEL` constant; a post-index model change goes through the ADR's named-vector A/B path.

## Next step

Hand off to `writing-plans` for the phased implementation plan (Docker/compose → MCP wiring → ingestion script incl. tree-sitter chunking and alias-swap rebuild → `async` Stop hook, pipe-tested per `update-config`'s verification workflow → staleness signal in `status.py` → unit + consistency tests → ~50-query `ranx` eval set and gate).
