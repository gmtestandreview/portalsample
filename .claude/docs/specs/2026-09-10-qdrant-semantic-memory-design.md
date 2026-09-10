# Design: Qdrant semantic memory layer — 2026-09-10

## Summary

Add a semantic (natural-language) search layer over this repo's source, docs, and agent memory notes, backed by a **locally self-hosted Qdrant instance** (Docker, no cloud) and the official `mcp-server-qdrant` MCP server. Agents (Claude Code, Codex, Copilot) get a `qdrant-find`/`qdrant-store` tool surface for semantic recall; a Python ingestion script (re)builds the index from the repo's own files. Chosen over the originally-provisioned Qdrant Cloud cluster because self-hosting eliminates the third-party data-egress question entirely for an NMI government portal snapshot, at negligible added resource cost (Docker is already a dependency here for the `github` MCP server; Qdrant's own footprint for this corpus size is tens of MB).

## Assumptions

- Docker is installed and working on this machine (confirmed: `docker version` → 29.6.2; already load-bearing for `scripts/github-mcp-server.cmd`).
- Corpus is bounded to this repo: `ClientApp/src`, `docs/**`, `.claude/docs/specs/**`, `memory/*.md`, `MEMORY.md`. Not a multi-repo or enterprise-scale corpus.
- Single machine, local use only — no CI involvement (confirmed by user).
- Node ≥24's native TypeScript type-stripping and this repo's existing `scripts/*.py` convention (stdlib-only, no `requirements.txt` anywhere yet) are both real and current.

## Open questions

None blocking — all material forks were resolved during design (see Trade-offs). One deferred item: whether to remove the now-unused Qdrant Cloud `QDRANT_API_KEY` from local env / GitHub repo secrets is the user's call, out of scope here.

## Requirements

**Functional**
- Agents can semantically search source code, docs/ADRs, and memory notes via `qdrant-find`, scoped by collection.
- A bulk ingestion script (re)builds the index from repo files on demand and automatically at session end.
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
| `docker-compose.qdrant.yml` | Single-node Qdrant, port bound to `127.0.0.1:6333` only (not `0.0.0.0` — Qdrant has no auth by default, so local-only binding is the actual security boundary), storage bind-mounted to git-ignored `.qdrant/storage/`, `restart: unless-stopped`. |
| `mcp-server-qdrant` wiring | Added to `.mcp.json`, `.vscode/mcp.json`, `.codex/config.toml` via `uvx mcp-server-qdrant`. `QDRANT_URL=http://localhost:6333`, no `QDRANT_API_KEY` (local, unauthenticated by design). `EMBEDDING_PROVIDER=fastembed`, `EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2` pinned explicitly in every config surface (see Trade-offs — this value must never drift). Custom `TOOL_STORE_DESCRIPTION`/`TOOL_FIND_DESCRIPTION` telling agents which collection to use for what. |
| `scripts/requirements-qdrant.txt` | `qdrant-client`, `fastembed`, `tree-sitter-language-pack` — this repo's first Python dependency manifest. |
| `scripts/qdrant_index.py` | The ingestion script (see Pipeline below). |
| Collection `portal-source` | `ClientApp/src/**` (minus CLAUDE.md exclusions) + `docs/**` + `.claude/docs/specs/**`. |
| Collection `agent-memory` | `memory/*.md` + `MEMORY.md` aggregated across **every worktree of this repo** (see "Resolving the memory directory" below) — not a single repo-relative path. Populated **only** by the indexer — no ad hoc `qdrant-store` writes in v1 (see Trade-offs, #7). |
| `.claude/settings.json` Stop hook | `test -f scripts/qdrant_index.py && (python scripts/qdrant_index.py || python3 scripts/qdrant_index.py) 2>/dev/null || true` — matches this repo's exact existing Stop-hook idiom. Invokes the script unconditionally; safe to do so because the script's own fast-exit check (pipeline step 1) makes a no-op run cheap. Never blocks session close; a broken indexer logs and moves on. Written at implementation time (once the script exists and can be pipe-tested per the `update-config` skill's verification workflow), not now. |

### Why two collections, not one

Originally justified by differing rebuild policy (source = full rebuild, memory = incremental, to avoid clobbering ad hoc agent writes). That justification evaporated once ad hoc writes were dropped (#7) — both collections now rebuild identically. The surviving reason is **query-scoping**: an agent asking "what does `AuthenticatedElement` do" and one asking "what did we decide about SEC-010" are different intents, and passing `collection_name` on `qdrant-find` is free — no `FilterableField`/`QDRANT_ALLOW_ARBITRARY_FILTER` config needed. A single collection with a `content_type` payload filter was considered and rejected as strictly more setup for the same effect.

### Resolving the memory directory (worktree-aware)

The auto-memory system lives at `~/.claude/projects/<sanitized-cwd>/memory/`, outside the repo, where `<sanitized-cwd>` is every non-alphanumeric character in the absolute working-directory path replaced with `-` (verified against this session's own actual directory name). Because this repo uses git worktrees for isolated feature work, each worktree has a *different* absolute path and therefore a *different* memory directory under this scheme.

Since `agent-memory` does a full rebuild every run, naively indexing only the current session's `cwd` (available on the Stop hook's stdin JSON) would let whichever worktree's session runs last silently wipe out memory content contributed from other worktrees. To avoid this, the indexer:

1. Runs `git worktree list --porcelain` to enumerate every worktree of this repo (including the main checkout).
2. Applies the sanitization algorithm to each worktree's absolute path to derive its memory directory.
3. Unions `memory/*.md` + `MEMORY.md` found across *all* resolved directories into the one `agent-memory` rebuild.

This makes the rebuild correct regardless of which worktree's session happens to trigger it.

### Ingestion pipeline (`scripts/qdrant_index.py`)

1. **Fast-exit check**: before touching FastEmbed or Qdrant, compare current state (git status of watched paths in `portal-source`, plus mtimes/hashes of the resolved memory directories for `agent-memory`) against a marker stored from the last successful run (`.qdrant/last_indexed.json`). If nothing relevant changed, print "nothing changed since last index (commit <hash>), skipping" and exit 0 immediately. This is what makes it safe for the Stop hook (below) to invoke the script unconditionally on every session end — most invocations exit here, cheaply, without a model load or a Qdrant connection.
2. **Walk** watched paths, applying exclusions: CLAUDE.md's generated/vendor list, `node_modules`, build/coverage output, and a filename-level secret guard (`*.env*`, `*secret*`, `*.pem`, `*.key`, `*token*`) regardless of directory.
3. **Chunk**, symbol-aware, not line-window-blind (line windows chop mid-function/mid-sentence — confirmed by Qdrant's own search-quality guidance as a 30-40% relevance hit):
   - `.ts`/`.tsx`: parsed with `tree-sitter-language-pack` (pre-compiled wheels, no C compiler needed — verified: Windows `win_amd64` wheels available). One chunk per top-level symbol (function/class/component/interface/type/enum, including `export const Foo = () => {}` patterns). Bare imports/top-level statements bundle into one small file-header chunk.
   - `.md` (docs/memory): chunk by `##` header section.
   - **Token-limit safety net**: `sentence-transformers/all-MiniLM-L6-v2` silently truncates anything over ~256 tokens (confirmed — no error, just quiet data loss). Any chunk measured (via the real tokenizer, not line-count guessing) over ~230 tokens is sub-split further. This replaces line-count-based sizing entirely.
   - Each chunk's content is scanned with a lightweight secret-pattern regex before embedding (common key/token shapes); matches are skipped and logged, not embedded.
4. **Embed** via `fastembed.TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")` — same library, same explicit model name as the MCP server, for guaranteed vector parity. An on-disk embedding cache (`.qdrant/embedding_cache.json`, keyed by content hash) skips re-embedding unchanged chunks across runs — a performance optimization, not a correctness mechanism.
5. **Build to staging, then atomic swap**: create `portal-source__staging_<ts>` (and `agent-memory__staging_<ts>`), populate fully, verify point count matches expected chunk count, then use Qdrant's collection-alias API to atomically point `portal-source`/`agent-memory` at the new backing collection and delete the old one. This is the fix for the non-atomic-rebuild risk identified during review — a crash mid-run leaves the *previous* good index live, never an empty one.
6. **Summarize**: files scanned/skipped, chunks embedded (vs. served from cache), points written, current `git rev-parse HEAD` (short) printed as the "last indexed at" marker, elapsed time.
7. **Validate**: after (5), run the fixed golden-set query→expected-file pairs stored in `scripts/qdrant_golden_set.json` (3-5 pairs, e.g. `{"query": "authentication guard component", "expected_file": "ClientApp/src/authentication/AuthenticatedElement.tsx"}`) against the new collection and warn (non-fatal) if any miss — a lightweight recall check, not full `ranx`/`Ragas` machinery, sized to this corpus. Updating this file when a referenced file is renamed/removed is part of that change, the same way updating a test fixture is.

### What was deliberately left out (and why)

- **Hybrid (dense+sparse) search**: `mcp-server-qdrant`'s `qdrant-find` tool only wires a single dense FastEmbed vector — no sparse/BM25 provider in its settings. Building sparse vectors in the ingestion script wouldn't help, since the tool agents actually call can't use them.
- **Reranking**: warranted for large/noisy result sets; this corpus is one small portal app. Revisit only if the golden-set check (step 7) shows real precision problems.
- **Ad hoc `qdrant-store` writes to `agent-memory`**: dropped for v1 (see Trade-offs, #7) to avoid two divergent, unsynced "memory" systems.

### Failure behaviour

- Ingestion script: unreachable Qdrant → fail loud, non-zero exit. Per-chunk embedding/secret-scan errors are logged and skipped (not fatal to the whole run); a non-zero exit and summary if any occurred.
- MCP tool calls: if Qdrant isn't running, `qdrant-find`/`qdrant-store` fail with a plain connection error — no silent fallback.
- Stop hook: never blocks session close, regardless of indexer outcome (matches this repo's existing Stop-hook convention exactly).

### Observability

Ingestion summary (step 5 above) is the only surfaced signal — no dashboards/metrics infrastructure, appropriate for single-user local tooling.

### Testing

- `tests/qdrant/test_chunker.py`, `tests/qdrant/test_exclusions.py` — pure-function unit tests (tree-sitter chunk boundaries, token-limit sub-splitting, exclusion matcher), matching the existing `tests/hooks/` pytest convention.
- `tests/qdrant/test_embedding_model_consistency.py` — greps `.mcp.json`, `.vscode/mcp.json`, `.codex/config.toml`, and `scripts/qdrant_index.py` for the `EMBEDDING_MODEL`/`model_name` value and asserts all four match. Directly targets the exact bug class already caught once during this design's review (mismatched defaults between `mcp-server-qdrant` and `fastembed`).
- Manual/integration validation: `docker compose -f docker-compose.qdrant.yml up -d` → run the indexer → confirm point counts → confirm a live `qdrant-find` call via the MCP server returns the expected file for a known query.
- The golden-set check (pipeline step 7) doubles as an automated regression gate for future changes (embedding model bumps, chunking changes).

### Security

- No API key required or configured (local, unauthenticated by default) — bound to `127.0.0.1` only, never `0.0.0.0`.
- `.qdrant/storage/` is git-ignored. Correction from earlier discussion: Qdrant stores full chunk **text** as payload, not just vectors — this directory is a real (if local-only) second copy of portal source, and the gitignore entry is load-bearing.
- Filename-level and content-level (regex) secret guards, both applied before anything is embedded or stored.
- The cloud `QDRANT_API_KEY` (env + GitHub repo secret, provisioned before this design) is unused by this design and left untouched — user's call whether to revoke it later.

## Trade-offs

| # | Decision | Why | Alternative considered | Rejected because |
|---|---|---|---|---|
| 1 | Local Docker, not Qdrant Cloud | Resolves data-egress concern for portal source at negligible resource cost (Docker already required here) | Qdrant Cloud (already provisioned) | Sends portal source to a third party for no benefit once local was shown to be cheap |
| 2 | Python ingestion script | Guarantees vector parity with the MCP server (same `fastembed` library, same explicit model) | TypeScript + `@mastra/fastembed` | JS FastEmbed port is a fork of an archived package repurposed from an agent framework; parity "likely" not guaranteed |
| 3 | `EMBEDDING_MODEL` pinned explicitly everywhere | `mcp-server-qdrant`'s default (MiniLM) and `fastembed`'s own default (BAAI/bge-small) differ despite matching dimensions — silent vector-space mismatch otherwise | Rely on each tool's own default | Already caused one caught-in-review bug; unpinned defaults are a real config-drift risk |
| 4 | Two collections (`portal-source`, `agent-memory`) | Free query-scoping via `collection_name` param | One collection + `content_type` payload filter | Strictly more setup (`FilterableField`/`QDRANT_ALLOW_ARBITRARY_FILTER`) for the same effect |
| 5 | Symbol-aware chunking (tree-sitter / markdown headers) | Line-window chunking measurably degrades retrieval quality (30-40% per Qdrant's own guidance) and this design prioritizes actually-good results over shipping the naive version | Fixed line-window chunking | Explicitly rejected by the user — "good experience" over a known limitation |
| 6 | Build-to-staging + atomic alias swap | A crash mid-rebuild must never leave a live collection empty | Delete-then-repopulate in place | Non-atomic; a crash between delete and repopulate silently degrades search with no error surfaced |
| 7 | No ad hoc `qdrant-store` writes in v1 | Avoids two systems of record (this + the existing file-based memory workflow) drifting apart with no sync guarantee | Wire `qdrant-store` into the existing memory-write workflow | More moving parts; the existing file-based system is already authoritative and the indexer picks up everything written there regardless |
| 8 | No hybrid search / no reranking | `qdrant-find` can't use sparse vectors even if built; corpus is too small for reranking to matter yet | Dense+sparse RRF; cross-encoder reranking | Real complexity, no reachable benefit at this scale/tool surface |
| 9 | Automated reindex via Claude Code `Stop` hook | Matches this repo's existing hook-heavy tooling and the right cadence (once per session, not per-edit) | Git post-commit hook; scheduled task | Git hooks aren't shareable across clones without `husky` (not a dependency); scheduled tasks are less responsive and don't fit this repo's existing automation style |

## Decisions needing an ADR

- Hosting model for the semantic memory layer (local Docker vs. Qdrant Cloud) — record via the `adr` skill once implemented, since it's the kind of infra/data-flow decision this repo's own rules flag for ADRs.

## Validation & rollback

- **Validation**: bring the container up, run the indexer, confirm point counts and the golden-set check pass, confirm `qdrant-find` works end-to-end through the MCP server from a live Claude Code session.
- **Rollback**: `docker compose down`, delete `.qdrant/` — no residual footprint. MCP config entries are additive and can be removed from the three config files independently. The Stop hook is guarded by `test -f scripts/qdrant_index.py`, so removing the script alone silently disables it.

## Next step

Hand off to `writing-plans` for the phased implementation plan (Docker/compose → MCP wiring → ingestion script incl. tree-sitter chunking and alias-swap rebuild → Stop hook, pipe-tested per `update-config`'s verification workflow → tests → golden-set validation).
