# Implementation Plan: Qdrant semantic memory layer

## Source

- Design spec: `.claude/docs/specs/2026-09-10-qdrant-semantic-memory-design.md`
  (fully negotiated, devil's-advocate audited)
- Embedding ADR: `docs/adr/2026-09-10-qdrant-embedding-strategy.md` (Accepted)
- Hosting ADR: **not yet written** — a step in this plan (Phase 1), decision
  already made (local Docker), only the record is pending

## Overview

Add a natural-language search layer over `ClientApp/src`, docs/ADRs, and this
project's Claude Code memory notes, backed by a locally self-hosted Docker
Qdrant (`v1.18.x`, bound to `127.0.0.1`, no auth) and the official
`mcp-server-qdrant` (run via `uvx`, `QDRANT_READ_ONLY=true` so only
`qdrant-find` is exposed). A Python ingestion script (`scripts/qdrant_index.py`)
rebuilds two collections (`portal-source`, `agent-memory`) from disk using
tree-sitter symbol-aware chunking and local FastEmbed
(`sentence-transformers/all-MiniLM-L6-v2`), via a build-to-staging +
atomic-alias-swap pattern. An `async` `Stop` hook reindexes at session end,
gated by a cheap change-token so most runs are no-ops. A staleness indicator in
`scripts/status.py` is the visible signal that the silent hook still works. A
~50-query `ranx` eval set gates retrieval quality per the ADR.

This is the repo's first `requirements.txt` and first non-stdlib Python tooling.
Runtime is Windows + git-bash.

**Security note (threat model, brief — full write-up in the spec's "Security"
section):** the local Qdrant instance is unauthenticated by design, bound to
`127.0.0.1` only. Any process on the operator's machine can read the full index
(source + memory-note payload) over `http://127.0.0.1:6333`; the bind stops
remote access, not local cross-process access. Accepted as appropriate for
single-user local tooling — see the spec for the full reasoning and the revisit
condition (multi-user or untrusted-workload machine).

## Blockers

- None. All material decisions (hosting, embedding model, read-only query path,
  discovery-based memory resolution, named-vector schema, async hook) are
  resolved in the spec and embedding ADR. The hosting ADR is a documentation
  step, not an open decision.

## Implementation-time decisions (resolve during execution, do not change the design)

- Exact pinned versions: `qdrant-client`, `fastembed`,
  `tree-sitter-language-pack`, and the `qdrant/qdrant` image tag (must be ≥
  v1.18).
- Exact tree-sitter node types for the TS/TSX chunker (verify against the
  installed `tree-sitter-typescript` grammar).
- The ~50 eval queries and their known-relevant chunk ids.
- Staleness threshold in `status.py` (proposed: 3 days).
- Exact secret-pattern regexes for the content-level guard.
- Whether `mcp-server-qdrant` reads `QDRANT_READ_ONLY` as documented (verify at
  wiring time; spec's Trade-off #7 depends on it).

## Requirements Traceability

| Requirement                                                                                | Steps                                                  | Validation                                                                                                                                                           |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1 — agents semantically search source/docs/memory via `qdrant-find`, scoped by collection | 2.1, 3.5, 3.6                                          | Live `qdrant-find` from a Claude Code session returns the expected file for a known query against each collection                                                    |
| F2 — ingestion script rebuilds on demand + at session end                                  | 3.1–3.7, 4.1                                           | `python scripts/qdrant_index.py` builds both collections; `Stop` hook fires it; point counts > 0                                                                     |
| F3 — index freshness visible (last-indexed commit)                                         | 3.7, 4.2                                               | `.qdrant/last_indexed.json` carries `commit_hash`+`timestamp`; `status.py` prints `memory index: Nd stale`                                                           |
| N1 — must not burden a constrained machine                                                 | 1.1, 3.1, 4.1                                          | Fast-exit path exits in < ~1s with no model load; `async` hook does not block session close                                                                          |
| N2 — no portal source/config leaves the machine                                            | 1.1, 1.4, 2.1                                          | Qdrant bound to `127.0.0.1` only; no cloud endpoint/API key in any config; `.qdrant/` git-ignored (already done)                                                     |
| N3 — rebuild never leaves a collection empty/degraded on crash                             | 3.5                                                    | Kill the script mid-populate; `qdrant-find` still returns the previous index; orphan `*__staging_*` swept next run                                                   |
| N4 — search quality checked against a baseline                                             | 5.1, 5.4, 5.5                                          | ~50-query `ranx` eval clears `Recall@10 ≥ 0.80`, `MRR ≥ 0.60`, approx-vs-exact `recall@10 ≥ 0.95`                                                                    |
| A1 — superseded-doc hygiene                                                                | 3.2, 5.2                                               | A file under `**/archive/**` is absent from the index after a rebuild                                                                                                |
| A2 — version pinning; `fastembed` bump ⇒ full reindex                                      | 1.3, 3.1, 5.3                                          | `requirements-qdrant.txt` uses `==`; change-token includes the `fastembed` version; consistency test asserts installed == pinned                                     |
| A3 — `async` `Stop` hook never blocks close                                                | 4.1                                                    | Hook registered `async: true`; session closes immediately even with Qdrant down                                                                                      |
| A4 — staleness signal                                                                      | 4.2                                                    | `status.py` shows `unbuilt` / `Nd stale` / `error` from the marker                                                                                                   |
| A5 — worktree-safe memory resolution (discovery, not algorithm reproduction)               | 3.4, `test_memory_dirs.py` (written test-first in 3.4) | `python tests/qdrant/test_memory_dirs.py` passes its 5 fixture cases; with two worktrees, both contribute memory; a removed worktree's memory drops out next rebuild |
| A6 — `EMBEDDING_MODEL` consistent across 4 surfaces                                        | 1.2, 5.3                                               | `test_embedding_model_consistency.py` passes; mutating one surface fails it                                                                                          |
| A7 — named-vector schema for cheap model swap                                              | 3.5                                                    | Collections created on v1.18+ with the primary model as the default unnamed vector; a named vector can be added via `UpdateVectors` without recreate                 |
| A8 — no ad hoc `qdrant-store`, config-enforced                                             | 2.1                                                    | `qdrant-store` is absent from the MCP tool list when `QDRANT_READ_ONLY=true`                                                                                         |

## Repository Findings

- **`.qdrant/` is already git-ignored** (`.gitignore` lines 114–121, with a
  load-bearing comment). Step 1.1 only verifies it.
- **Python test convention is NOT pytest.** `tests/hooks/test_*.py` are
  standalone stdlib scripts with `#!/usr/bin/env python3`, a module-level
  `failures = []`, and `Run: python tests/hooks/<file>.py`. CI
  (`.github/workflows/pr.yml` ~lines 128–162) runs each one directly as
  `python3 tests/hooks/<file>.py` in an `agent-tooling` job, plus
  `python3 -m compileall -q scripts templates tests/hooks`. The spec's phrase
  "pytest convention" is loose — the pure-function Qdrant tests should follow
  the **standalone-script** pattern and be wired into that job; `tests/qdrant/`
  must be added to the `compileall` list.
- **The eval harness needs `ranx` + a live Qdrant + `fastembed`** — it cannot be
  stdlib-only and cannot run in the current CI job. It is manual/operational
  (run locally), not PR CI.
- **`scripts/status.py`** builds a single status line from `.agent-sync/` state,
  is stdlib-only, imports `process_utils`, always exits 0, reconfigures stdout
  to UTF-8 on Windows. The staleness segment appends to `parts` in `main()`.
- **MCP config surfaces** (verified this session, unchanged): `.mcp.json`
  (`mcpServers` object; `type`/`command`/`args`/`tools`), `.vscode/mcp.json`
  (`servers` object), `.codex/config.toml` (`[mcp_servers.<name>]` tables with
  `enabled`). Existing stdio servers use
  `command: "cmd", args: ["/c", "scripts\\<x>.cmd"]` or a bare exe path.
- **`.claude/settings.json`** is tracked (ADR
  `2026-09-09-track-claude-settings-json.md`); it already has a `Stop` hook
  array with matcher-less entries
  `test -f scripts/<x>.py && (python … || python3 …) || true`. Changes go
  through review and the `update-config` skill.
- **`.claude/settings.json` `permissions.allow`** already includes
  `Bash(python scripts/*)`, `Bash(python3 scripts/*)`, `Bash(npm run *)`,
  `Bash(node *)`, `Edit(*)`, `Write(*)`. `Bash(uvx *)`, `Bash(docker *)`,
  `Bash(docker compose *)` are likely additions.
- **`package.json`** — scripts are the
  `webpack`/`vitest`/`storybook`/`playwright` family; `.mjs`/`.ts` helpers run
  as `node scripts/<x>`. No Python in `scripts`. Node ≥ 24,
  `packageManager: npm@11`.
- **`.claude/docs/plans/`** exists (one prior plan) — this plan's location.
- **`docs/adr/`** exists with dated ADRs — the hosting ADR goes here. Format
  reference: `docs/adr/2026-09-09-track-claude-settings-json.md`.
- **`@qdrant/js-client-rest`** is in `package.json` deps, unused; the spec
  leaves it in place, out of scope.
- **No `requirements.txt` / `pyproject.toml`** anywhere — Step 1.3 creates the
  first.

## Architecture Changes

- `docker-compose.qdrant.yml` — **New file**. Single-node Qdrant, image
  `qdrant/qdrant:v1.18.x`, `ports: ["127.0.0.1:6333:6333"]`, volume
  `./.qdrant/storage:/qdrant/storage`, `restart: unless-stopped`, comment on the
  version pin.
- `docs/adr/2026-09-10-qdrant-hosting-model.md` — **New file**. Local Docker vs
  Qdrant Cloud, Accepted (local).
- `scripts/requirements-qdrant.txt` — **New file**. `qdrant-client==X.Y.Z`,
  `fastembed==X.Y.Z`, `tree-sitter-language-pack==X.Y.Z`; `ranx` for the eval
  harness may sit in a separate `scripts/requirements-qdrant-dev.txt`.
- `scripts/qdrant_common.py` — **New file**. Shared constants:
  `EMBEDDING_MODEL`, collection names, watched paths, exclusion globs, token
  limit. The single source the consistency test checks.
- `scripts/qdrant_index.py` — **New file**. The ingestion script (Phase 3).
- `scripts/qdrant_chunker.py` — **New file**. Pure chunking logic (extracted so
  it is unit-testable without Qdrant).
- `scripts/qdrant_memory_dirs.py` — **New file**. Pure memory-directory
  discovery logic.
- `scripts/qdrant_eval.py` — **New file**. The `ranx` eval harness (Phase 5).
- `scripts/qdrant_golden_set.json` — **New file**. ~50 labeled queries.
- `scripts/status.py` — **Edit**. Add the staleness segment.
- `.mcp.json`, `.vscode/mcp.json`, `.codex/config.toml` — **Edit**. Add the
  `qdrant` server.
- `.claude/settings.json` — **Edit** (via `update-config`). Add the `async`
  `Stop` hook; add `Bash(uvx *)`, `Bash(docker *)`, `Bash(docker compose *)` to
  `permissions.allow` if required.
- `.github/workflows/pr.yml` — **Edit**. Add `tests/qdrant` to `compileall`; add
  the three pure-function test scripts to the `agent-tooling` job; extend the
  path filter.
- `tests/qdrant/test_chunker.py`, `test_exclusions.py`, `test_memory_dirs.py`,
  `test_embedding_model_consistency.py` — **New files**. Standalone stdlib
  scripts. The first three are written test-first (RED, inside Steps 3.3, 3.2,
  3.4 respectively) per this repo's mandatory TDD rule;
  `test_embedding_model_consistency.py` is written in Phase 5 since it targets
  config-file state that only exists once Phase 2 has run.
- `package.json` — **Edit**. Thin convenience scripts (`qdrant:up`,
  `qdrant:down`, `memory:index`, `memory:eval`).
- `.gitignore` — verify only (`.qdrant/` already present).

## Implementation Steps

### Phase 1: Foundation, hosting record, dependencies

**Outcome:** Qdrant runs locally on `127.0.0.1:6333`; the hosting decision is
recorded; Python deps are declared and pinned; the shared constants module
exists. **Scope:** `docker-compose.qdrant.yml`, `scripts/qdrant_common.py`,
`scripts/requirements-qdrant*.txt`, the hosting ADR, optional
`permissions.allow` additions. **Dependencies:** none. **Validation gate:**
`docker compose -f docker-compose.qdrant.yml up -d` then
`curl -s http://127.0.0.1:6333/healthz` returns healthy;
`pip install -r scripts/requirements-qdrant.txt` succeeds; the constants module
imports.

#### Step 1.1: Add `docker-compose.qdrant.yml`

- Files: `docker-compose.qdrant.yml` (New file)
- Action: Single-node Qdrant; image pinned `qdrant/qdrant:v1.18.x` with a
  comment ("≥ v1.18 required for named-vector-on-existing — embedding ADR");
  `ports: ["127.0.0.1:6333:6333"]` (never `0.0.0.0`);
  `volumes: ["./.qdrant/storage:/qdrant/storage"]`; `restart: unless-stopped`.
- Why: Spec Components table; N1, N2; embedding ADR version pin.
- Dependencies: None
- Risk: Low
- Validation: `docker compose -f docker-compose.qdrant.yml up -d`;
  `curl -s http://127.0.0.1:6333/healthz`; `docker inspect` shows the port bound
  to `127.0.0.1` only.

#### Step 1.2: Add `scripts/qdrant_common.py` (shared constants)

- Files: `scripts/qdrant_common.py` (New file)
- Action: `EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"`,
  `VECTOR_SIZE = 384`, collection→source-path map, `EXCLUDE_GLOBS` (CLAUDE.md
  generated/vendor list + `node_modules` + build/coverage + `**/archive/**`),
  `SECRET_FILENAME_GLOBS`, `TOKEN_LIMIT = 230`. Stdlib-only. The one place the
  model string and paths are defined.
- Why: A6 (single source of truth); Trade-off #3.
- Dependencies: None
- Risk: Low
- Validation: Imports cleanly; `test_embedding_model_consistency.py` (5.3) reads
  from it.

#### Step 1.3: Add `scripts/requirements-qdrant.txt` (+ dev variant)

- Files: `scripts/requirements-qdrant.txt`, optionally
  `scripts/requirements-qdrant-dev.txt` (New files)
- Action: Exact `==` pins for `qdrant-client`, `fastembed`,
  `tree-sitter-language-pack`. `ranx` (eval-only) in the dev file. Header
  comment: "bumping `fastembed` requires a full reindex — delete
  `.qdrant/last_indexed.json`". Resolve exact versions now.
- Why: A2; spec Components table.
- Dependencies: None
- Risk: Medium — `fastembed` pulls `onnxruntime` (native). Mitigation: verify
  `pip install` succeeds on the target Windows machine before proceeding; record
  the installed size in the hosting ADR (spec's "verify on first run" item).
- Validation: `pip install -r scripts/requirements-qdrant.txt` completes;
  `python -c "import fastembed, qdrant_client, tree_sitter_language_pack"`
  succeeds.

#### Step 1.4: Write the hosting-model ADR

- Files: `docs/adr/2026-09-10-qdrant-hosting-model.md` (New file)
- Action: Repo ADR format. Context: local Docker vs the provisioned-then-revoked
  Qdrant Cloud cluster. Decision: local Docker, Accepted. Consequences:
  machine-bound and disposable index, must-be-running dependency, no team share,
  second plaintext copy in `.qdrant/storage/` — from the spec's consequences
  pass. Record the actual `fastembed` install footprint from 1.3.
- Why: Spec "Decisions needing an ADR" — hosting model TODO; `.claude/rules`
  flags infra/data-flow decisions for ADRs.
- Dependencies: 1.3 (footprint number)
- Risk: Low
- Validation: File exists, matches ADR template sections, and the spec's
  "Decisions needing an ADR" hosting bullet is updated from TODO to DONE with
  the path.

#### Step 1.5: Permissions for `uvx` / `docker` (if needed)

- Files: `.claude/settings.json` (Edit, via `update-config` skill)
- Action: Add `Bash(uvx *)`, `Bash(docker *)`, `Bash(docker compose *)` to
  `permissions.allow` if execution prompts for them. Merge into the existing
  array — do not replace.
- Why: The MCP server runs via `uvx`; the compose lifecycle uses `docker`.
- Dependencies: None
- Risk: Low
- Validation: `uvx --version` and `docker compose version` run without a
  permission prompt.

### Phase 2: MCP wiring — read-only query path

**Outcome:** Claude Code / Codex / Copilot expose `qdrant-find` (and **not**
`qdrant-store`) against the local Qdrant, which is empty but reachable.
**Scope:** the three MCP config files. **Dependencies:** Phase 1. **Validation
gate:** From a fresh Claude Code session, `qdrant-find` on any collection
returns an empty-result response cleanly (no crash); the tool list shows
`qdrant-find` and no `qdrant-store`.

#### Step 2.1: Wire `mcp-server-qdrant` into the three config surfaces

- Files: `.mcp.json`, `.vscode/mcp.json`, `.codex/config.toml` (Edit)
- Action: Add a `qdrant` server: `uvx mcp-server-qdrant` with env
  `QDRANT_URL=http://localhost:6333`, `EMBEDDING_PROVIDER=fastembed`,
  `EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2`,
  `QDRANT_READ_ONLY=true`, a custom `TOOL_FIND_DESCRIPTION` naming the two
  collections and when to use each. No `QDRANT_API_KEY`, no `COLLECTION_NAME`.
  Match each file's existing shape. Add a comment in each pointing at
  `scripts/qdrant_common.py` as the model-string source of truth. **First
  verify** `mcp-server-qdrant` honours `QDRANT_READ_ONLY` — if it does not,
  escalate (Trade-off #7 must be met another way before this phase completes).
- Why: F1, A8; spec Components table.
- Dependencies: 1.2, 1.5
- Risk: Medium — three hand-kept-in-sync files; the `EMBEDDING_MODEL` string
  must match 1.2 and 3.6 exactly. Mitigation: 5.3's consistency test.
- Validation: Restart each client; `qdrant-find` present, `qdrant-store` absent;
  a find call against `portal-source` returns cleanly with zero results.

### Phase 3: Ingestion script

**Outcome:** `python scripts/qdrant_index.py` builds `portal-source` and
`agent-memory` from disk; `qdrant-find` returns real, relevant hits. **Scope:**
`scripts/qdrant_index.py` and its extracted pure-logic modules.
**Dependencies:** Phase 1. (Phase 2 helps validation but is not required.)
**Validation gate:** A clean run reports non-zero point counts for both
collections; a re-run with no changes fast-exits in < ~1s;
`qdrant-find "authentication guard component"` returns
`AuthenticatedElement.tsx`.

#### Step 3.1: Skeleton + fast-exit change-token

- Files: `scripts/qdrant_index.py` (New file)
- Action: `#!/usr/bin/env python3`, arg parsing (`--force`,
  `--scope all|source|memory`), logging to `.qdrant/index.log`. Fast-exit:
  compute
  `sha256(git ls-files -s -- <watched paths> ++ sorted(memory files + sha256) ++ EMBEDDING_MODEL ++ fastembed.__version__)`;
  compare to `.qdrant/last_indexed.json.change_token`; on match print
  `nothing changed since last index (commit <short-sha>, <ISO-8601>), skipping`
  and `sys.exit(0)` **before** importing the heavy `fastembed`/`qdrant_client`
  paths.
- Why: F2, F3, N1, A2; spec pipeline step 1.
- Dependencies: 1.2, 1.3
- Risk: Medium — token must be stable across branch switches / stashes /
  detached HEAD. Mitigation: hash `git ls-files -s` (blob SHAs, not refs);
  `--force` bypass for recovery; 5.1 fixtures exercise it indirectly.
- Validation: Run twice with no changes → second run fast-exits. `touch` a
  watched file → next run proceeds.

#### Step 3.2: Walk + exclusions + superseded-doc hygiene

- Files: `tests/qdrant/test_exclusions.py` (New file — written first, RED; full
  case list in 5.2), `scripts/qdrant_index.py` (Edit, GREEN),
  `scripts/qdrant_common.py` (Edit if needed, GREEN)
- **RED (write first, per this repo's mandatory TDD rule —
  `.claude/rules/testing.md`):** write `tests/qdrant/test_exclusions.py`'s
  assertions from 5.2 now, against the not-yet-existing matcher function. Run
  `python tests/qdrant/test_exclusions.py`: expect failure
  (`ModuleNotFoundError` or `AttributeError` — the matcher doesn't exist yet).
- **GREEN — Action:** Enumerate watched paths; apply `EXCLUDE_GLOBS` (incl.
  `**/archive/**`) and `SECRET_FILENAME_GLOBS` at any depth. Add a
  comment/cross-ref: superseded specs/ADRs move to `.claude/docs/specs/archive/`
  or `docs/adr/archive/`. Run `python tests/qdrant/test_exclusions.py` again:
  expect pass.
- Why: N2, A1; spec pipeline step 2.
- Dependencies: 3.1
- Risk: Low
- Validation: `python tests/qdrant/test_exclusions.py` passes (full case list
  unchanged, see 5.2). Manually: a file under `docs/adr/archive/` does not
  appear in the index.

#### Step 3.3: Symbol-aware chunking + token safety net + content secret scan

- Files: `tests/qdrant/test_chunker.py` (New file — written first, RED; full
  case list in 5.1), `scripts/qdrant_chunker.py` (New file, GREEN),
  `scripts/qdrant_index.py` (Edit, GREEN)
- **RED (write first, per this repo's mandatory TDD rule —
  `.claude/rules/testing.md`):** write `tests/qdrant/test_chunker.py`'s fixtures
  from 5.1 now, against the not-yet-existing chunker. Run
  `python tests/qdrant/test_chunker.py`: expect failure (`ModuleNotFoundError` —
  `qdrant_chunker` doesn't exist yet).
- **GREEN — Action:** `.ts`/`.tsx` →
  `tree_sitter_language_pack.get_parser("typescript"|"tsx")`; one chunk per
  top-level symbol (function/class/component/interface/type/enum incl.
  `export const X = () => {}`); bare imports/top-level statements → one
  file-header chunk. `.md` → chunk by `##` section. Any chunk whose
  real-tokenizer length > `TOKEN_LIMIT` (~230) is sub-split. Before emitting,
  run the content-level secret regex; on match drop the chunk and log. Run
  `python tests/qdrant/test_chunker.py` again: expect pass.
- Why: N4, Trade-off #5, pipeline step 3; embedding ADR (256-token cap).
- Dependencies: 3.2
- Risk: Medium — tree-sitter node-type names must match the installed grammar; a
  parse failure must fall back to whole-file (then token-split), never crash.
  Mitigation: wrap parse in try/except → whole-file fallback + logged warning;
  the RED fixtures above (from 5.1) cover boundary + fallback + token-split
  cases before implementation starts.
- Validation: `python tests/qdrant/test_chunker.py` passes (full case list
  unchanged, see 5.1). Manually: a >230-token component yields multiple chunks;
  a broken `.tsx` still produces chunks.

#### Step 3.4: Discovery-based memory-directory resolution

- Files: `tests/qdrant/test_memory_dirs.py` (New file — written first, RED),
  `scripts/qdrant_memory_dirs.py` (New file, GREEN), `scripts/qdrant_index.py`
  (Edit)
- **RED (write first):** `tests/qdrant/test_memory_dirs.py`, standalone stdlib
  script (mirrors `tests/hooks/test_watcher_pid.py`). Fixtures, all pure data
  (no real filesystem/git calls — the matching function takes
  `worktree_paths: list[str]` and `candidates: dict[str, list[str]]` mapping a
  candidate dir to the sampled `cwd` values found in its `*.jsonl` files, both
  passed in): (a) one candidate whose sampled `cwd` exactly matches a worktree
  path → matched; (b) one candidate with no matching `cwd` → not matched; (c)
  one candidate with zero sampled `cwd` values (no `.jsonl` files) → not
  matched; (d) a worktree path present in `worktree_paths` but absent from any
  candidate → contributes nothing, no error; (e) Windows path normalization
  (`C:\\a\\b` vs `C:/a/b` vs trailing slash) → still matches. Run
  `python tests/qdrant/test_memory_dirs.py`: expect failure
  (`ModuleNotFoundError: qdrant_memory_dirs` — the module doesn't exist yet).
- **GREEN:** Files: `scripts/qdrant_memory_dirs.py` (New file),
  `scripts/qdrant_index.py` (Edit). Action: (1) `git worktree list --porcelain`
  → keep worktrees whose dir exists and whose branch is not merged into the main
  branch; resolve each to its absolute toplevel path via
  `git rev-parse --show-toplevel`, normalized (resolved symlinks, lowercase
  drive letter on Windows). (2) Resolve `<claude-projects-root>` from
  `$CLAUDE_CONFIG_DIR` else `$HOME`/`$USERPROFILE` + `.claude/projects`; glob
  `*/` (one level — every subdirectory is a candidate). (3) For each candidate,
  glob its top-level `*.jsonl` files (not `*/subagents/*.jsonl`), read the first
  line of up to 3 of them, parse the `cwd` JSON field from each, normalize
  identically to step 1, and check for exact-string equality against the
  surviving worktree paths — a match on any sampled file counts as a match for
  that candidate. This is the exact format verified directly against this
  project's own transcripts on 2026-09-20 (see spec "Resolving the memory
  directory"): each transcript line is a JSON object with a top-level `"cwd"`
  string field holding the absolute session working directory. (4) Union
  `memory/*.md` + `MEMORY.md` across matched candidates. If none match, build
  `agent-memory` empty and say so in the summary — never a silent no-op. Run
  `python tests/qdrant/test_memory_dirs.py` again: expect pass.
- Why: A5; spec "Resolving the memory directory" (section rewritten 2026-09-20
  to replace the undefined "sibling transcript metadata / remote URL" reference
  with the verified `cwd`-field format — see Plan Review, Blocking Issue on this
  step).
- Dependencies: 3.1
- Risk: Medium (downgraded from High now that the match field is concrete and
  verified, not a heuristic guess) — a wrong match still indexes an unrelated
  project's memory; a missed match still loses memory silently, but both are now
  driven by an exact-string comparison on a confirmed field rather than an
  undefined reference. Mitigation: log every candidate dir, its sampled `cwd`
  values, and the match decision; the summary prints match count + paths;
  `--scope source` skips this path. Rollback: `agent-memory` is rebuilt every
  run, so a bad run self-corrects on the next good one.
- Validation: `python tests/qdrant/test_memory_dirs.py` passes (5 fixture
  cases). Two worktrees on different branches → both memory dirs found and
  logged. `git worktree remove` one → next rebuild drops its content. Fresh
  machine (no memory) → `agent-memory` built empty, summary says "0 memory
  directories matched".

#### Step 3.5: Staging build + orphan sweep + atomic alias swap + named-vector schema

- Files: `scripts/qdrant_index.py` (Edit)
- Action: On start, delete any pre-existing `<base>__staging_*` collections
  (orphans from crashed runs). Create `<base>__staging_<ts>` with the **primary
  model as the default unnamed vector**
  (`VectorParams(size=384, distance=COSINE)`), on Qdrant v1.18+ so a named
  vector can be added later without recreate. Upsert all points (sequential int
  ids). Verify `count == expected chunk count`. Then
  `update_collection_aliases`: point `<base>` at the new backing collection;
  delete the previous backing collection. Per collection.
- Why: N3, A7; spec pipeline step 5, Trade-off #6, #11.
- Dependencies: 3.3, 3.4
- Risk: High (hard-to-reverse: destructive on the live alias). Mitigation: alias
  swap is atomic and last; a crash before it leaves the old collection serving;
  never delete the old backing collection until the alias points at the new one
  and its count is verified. Rollback: the previous backing collection is gone
  after a clean swap, so a bad-but-complete index is fixed by re-running from
  the known-good source commit noted in the marker; `--force` bypasses the
  fast-exit.
- **Partial cross-collection failure (both collections swap independently,
  per-collection loop):** if `portal-source`'s swap succeeds and the process
  then crashes before `agent-memory`'s swap runs, `portal-source` is on the new
  index and `agent-memory` is still on the old one — each individually safe
  (neither is ever empty), but the run as a whole is incomplete. 3.7 must not
  write a success marker in this case: track a per-collection swap-completed
  flag through the run and have 3.7 write
  `{error: "partial: <collection> not swapped"}` instead of the three-field
  success marker if any collection's flag is unset. `status.py` (4.2) then
  reports `memory index: error`, not a stale success, and a plain re-run (no
  `--force` needed, since the change-token hasn't been written) retries both
  collections from scratch.
- Validation: N3 test — `kill -9` during upsert; `qdrant-find` still serves the
  prior index; next run sweeps the orphan. After a clean run,
  `get_collection("portal-source")` shows the default unnamed vector;
  `update_vectors` adds a named vector without error. Partial-failure test:
  `kill -9` between the two collections' swaps (after `portal-source`'s alias
  update, before `agent-memory`'s) → both `qdrant-find` calls still return valid
  (one new, one prior) results; `.qdrant/last_indexed.json` shows the `error`
  marker, not success; the next unforced run retries cleanly.

#### Step 3.6: Embedding + model-keyed cache

- Files: `scripts/qdrant_index.py` (Edit)
- Action: `fastembed.TextEmbedding(model_name=EMBEDDING_MODEL)` (from
  `qdrant_common`). Cache at `.qdrant/embedding_cache.json`, key =
  `sha256(EMBEDDING_MODEL + "\0" + chunk_text)` — model-qualified so a swap
  can't hand back old-space vectors within the forced reindex. Write atomically
  (temp + rename); a cache that fails to load is discarded, never fatal.
- Why: N1 (perf), Trade-off #3; spec pipeline step 4.
- Dependencies: 3.3
- Risk: Low
- Validation: Second run of an unchanged file reports "served from cache";
  deleting the cache forces re-embed with no error.

#### Step 3.7: Summary output + marker write

- Files: `scripts/qdrant_index.py` (Edit)
- Action: Print files scanned/skipped, chunks embedded vs cached, points per
  collection, memory dirs matched, `git rev-parse --short HEAD`, elapsed. Write
  `.qdrant/last_indexed.json` = `{change_token, commit_hash, timestamp}` only on
  full success; on failure write/leave a marker with an `error` field for
  `status.py`.
- Why: F3, A4; spec pipeline step 6, Observability.
- Dependencies: 3.5, 3.6
- Risk: Low
- Validation: Marker has the three fields after a good run; carries `error`
  after a forced failure.

### Phase 4: Automation & observability

**Outcome:** The index refreshes at every `Stop` without blocking session close;
staleness is visible in the status line; convenience npm scripts exist.
**Scope:** `.claude/settings.json`, `scripts/status.py`, `package.json`.
**Dependencies:** Phase 3. **Validation gate:** Ending a session triggers the
script (visible in `.qdrant/index.log`); with Qdrant stopped the session still
closes instantly; `status.py` shows a staleness segment.

#### Step 4.1: `async` `Stop` hook (via `update-config` skill)

- Files: `.claude/settings.json` (Edit — **must** use the `update-config`
  skill's construct-and-verify workflow)
- Action: Append a new entry to the `Stop` hook array:
  `{ "type": "command", "command": "test -f scripts/qdrant_index.py && (python scripts/qdrant_index.py || python3 scripts/qdrant_index.py) 2>/dev/null || true", "async": true }`.
  Pipe-test (`echo '{}' | <cmd>`), confirm it runs, keep `async: true`. Separate
  entry — do not merge into the metrics/export hook.
- Why: F2, A3; spec Components table, Failure behaviour.
- Dependencies: 3.1 (script must exist to pipe-test)
- Risk: Medium — a settings.json syntax error silently disables all hooks from
  that file. Mitigation: the `update-config` skill's `jq -e` schema check +
  fire-proof step; review gate on the tracked file. Rollback:
  `git checkout .claude/settings.json`.
- Validation:
  `jq -e '.hooks.Stop[].hooks[] | select(.command | test("qdrant_index"))' .claude/settings.json`
  prints the command. End a session with Qdrant down → closes with no delay;
  `.qdrant/index.log` shows the attempt.

#### Step 4.2: Staleness segment in `status.py`

- Files: `scripts/status.py` (Edit)
- Action: Add a helper that reads `.qdrant/last_indexed.json`: missing →
  `memory index: unbuilt`; `error` field → `memory index: error`; `timestamp`
  older than the threshold (proposed 3 days) → `memory index: <N>d stale`.
  Append to `parts` in `main()`. Stdlib-only, never raises, still exits 0.
- Why: F3, A4; spec Observability.
- Dependencies: 3.7
- Risk: Low
- Validation: Delete the marker → `unbuilt`. Backdate `timestamp` → `Nd stale`.
  Corrupt the JSON → still prints a line, exits 0.

#### Step 4.3: Convenience npm scripts (Docker + indexer only)

- Files: `package.json` (Edit)
- Action: Add
  `"qdrant:up": "docker compose -f docker-compose.qdrant.yml up -d"`,
  `"qdrant:down": "docker compose -f docker-compose.qdrant.yml down"`,
  `"memory:index": "python scripts/qdrant_index.py || python3 scripts/qdrant_index.py"`.
  `"memory:eval"` is **not** added here — `qdrant_eval.py` doesn't exist until
  Step 5.4, so that script is added there instead (avoids Phase 4 depending on
  Phase 5; see the plan's Blocking Issue on this cross-dependency).
- Why: Repo convention (CLAUDE.md points at `package.json` for the script list).
- Dependencies: 1.1, 3.1
- Risk: Low
- Validation: `qdrant:up`, `qdrant:down`, and `memory:index` each run the
  intended command. `npm pkg get scripts.memory:eval` returns nothing until 5.4
  lands.

### Phase 5: Tests & eval gate

**Outcome:** Pure-function regression guards run in PR CI; the ~50-query `ranx`
eval set exists and clears the ADR gate. **Scope:** `tests/qdrant/**`,
`scripts/qdrant_eval.py`, `scripts/qdrant_golden_set.json`,
`.github/workflows/pr.yml`, an ADR note. **Dependencies:** Phase 3 for 5.4/5.5
(need a populated index) and 5.6 (CI wiring). 5.1, 5.2, and
`test_memory_dirs.py` are written test-first, inside Steps 3.3, 3.2, and 3.4
respectively (see those steps) — they are listed here for completeness and are
done by the time Phase 5 starts. **Validation gate:** The four test scripts
(`test_chunker.py`, `test_exclusions.py`, `test_memory_dirs.py`,
`test_embedding_model_consistency.py`) pass locally and in the `agent-tooling`
job; `python scripts/qdrant_eval.py` reports metrics meeting the gate.

#### Step 5.1: `test_chunker.py`

- Files: `tests/qdrant/test_chunker.py` (already written in Step 3.3, RED-first)
- Action: **Already done in 3.3.** Listed here for traceability only. Standalone
  stdlib script (mirrors `tests/hooks/test_watcher_pid.py`: `failures = []`,
  non-zero exit on any). Fixtures: a small `.tsx` with 3 top-level symbols → 3
  (+1 header) chunks; a >230-token function → sub-split; a syntactically broken
  `.tsx` → whole-file fallback, no crash; a `.md` with two `##` sections → 2
  chunks. Self-skip with a message if `tree-sitter-language-pack` is absent.
- Why: N4; spec Testing.
- Dependencies: none remaining (already satisfied by 3.3's RED step)
- Risk: Low
- Validation: `python tests/qdrant/test_chunker.py` exits 0 (already confirmed
  passing at the end of 3.3).

#### Step 5.2: `test_exclusions.py`

- Files: `tests/qdrant/test_exclusions.py` (already written in Step 3.2,
  RED-first)
- Action: **Already done in 3.2.** Listed here for traceability only. Standalone
  script. Assert the matcher rejects `ClientApp/src/api/web-api-client.ts`,
  `ClientApp/src/external/x.ts`, `node_modules/**`, `docs/adr/archive/old.md`,
  `config/app.env.local`, `deploy/id_rsa.pem`; accepts
  `ClientApp/src/authentication/AuthenticatedElement.tsx`,
  `docs/adr/2026-09-10-qdrant-hosting-model.md`.
- Why: N2, A1; spec Testing.
- Dependencies: none remaining (already satisfied by 3.2's RED step)
- Risk: Low
- Validation: `python tests/qdrant/test_exclusions.py` exits 0 (already
  confirmed passing at the end of 3.2).

#### Step 5.2b: `test_memory_dirs.py`

- Files: `tests/qdrant/test_memory_dirs.py` (already written in Step 3.4,
  RED-first)
- Action: **Already done in 3.4.** Listed here for traceability and CI-wiring
  purposes (5.6). Standalone script; 5 fixture cases (matched, unmatched,
  no-`.jsonl`, orphan-worktree, path-normalization) — see 3.4 for the exact
  list.
- Why: A5; spec "Resolving the memory directory".
- Dependencies: none remaining (already satisfied by 3.4's RED step)
- Risk: Low
- Validation: `python tests/qdrant/test_memory_dirs.py` exits 0 (already
  confirmed passing at the end of 3.4).

#### Step 5.3: `test_embedding_model_consistency.py`

- Files: `tests/qdrant/test_embedding_model_consistency.py` (New file)
- Action: Standalone stdlib script. Parse `EMBEDDING_MODEL`/`model_name` from
  `.mcp.json`, `.vscode/mcp.json`, `.codex/config.toml`,
  `scripts/qdrant_common.py`; assert equal. Parse the `fastembed==` pin from
  `scripts/requirements-qdrant.txt`; assert it equals `fastembed.__version__`
  when importable (else log a skip).
- Why: A2, A6; spec Testing, Trade-off #3.
- Dependencies: 1.2, 1.3, 2.1
- Risk: Low
- Validation: Passes; change the model string in one config file → fails.

#### Step 5.4: `qdrant_eval.py` + `qdrant_golden_set.json` + `memory:eval` script

- Files: `scripts/qdrant_eval.py`, `scripts/qdrant_golden_set.json` (New files),
  `package.json` (Edit)
- Action: Golden set = ~50 `{query, expected_file, relevant_chunk_ids}` —
  hand-curated + LLM-synthetic, both collections, deliberately including (a)
  code/literal-identifier queries and (b) a `tokensave`-head-to-head subset.
  `qdrant_eval.py` runs each query via `qdrant_client`, scores `Recall@10` +
  `MRR` with `ranx`, and separately runs each with `exact=true` for
  approximate-vs-exact `recall@10`. `--smoke` runs a ~5-query subset. Prints a
  table; exits non-zero if the gate is missed. Add
  `"memory:eval": "python scripts/qdrant_eval.py || python3 scripts/qdrant_eval.py"`
  to `package.json` now that the target script exists (moved from Step 4.3 to
  remove the Phase 4→5 cross-dependency).
- Why: N4; spec pipeline step 7, embedding ADR Validation.
- Dependencies: 3.5–3.7 (populated index), `ranx` (dev requirements)
- Risk: Medium — thresholds are an opening proposal; the set is real upkeep.
  Mitigation: the ADR says ratify against the first real run; wire "rename a
  referenced file → update the set" like a fixture.
- Validation: `python scripts/qdrant_eval.py` against a populated index prints
  metrics; `--smoke` runs fast; `npm run memory:eval` runs the same script.

#### Step 5.5: Ratify the gate; record the first eval run

- Files: `docs/adr/2026-09-10-qdrant-embedding-strategy.md` (Edit — append a
  dated note), `scripts/qdrant_common.py` (Edit if thresholds move)
- Action: Run the full eval on the first real index. If `all-MiniLM-L6-v2`
  clears `Recall@10 ≥ 0.80` / `MRR ≥ 0.60` / approx-vs-exact `≥ 0.95`, record
  it. If not, follow the ADR's escalation (index `bge-small-en-v1.5` as a
  named-vector challenger via `qdrant_eval.py`, compare, decide).
- Why: N4; embedding ADR Review Trigger ("first eval run lands — ratify or
  adjust").
- Dependencies: 5.4
- Risk: Low (decision-recording; escalation path pre-designed in the ADR)
- Validation: The ADR carries a dated "first eval run" note with the numbers.

#### Step 5.6: Wire the tests into CI

- Files: `.github/workflows/pr.yml` (Edit)
- Action: verified against the current file (`detect-changes` job classifies
  paths around line 99–109; `agent-tooling` job runs at line ~134–171). Three
  concrete edits:
  1. Extend the `detect-changes` job's `agent-tooling` path match (the
     `match '^(...)'` regex feeding the `if` around line ~99–105) to also match
     `scripts/qdrant_.*\.py` and `tests/qdrant/`, alongside whatever paths it
     already lists — do not replace the existing alternatives, add to them.
  2. Change the "Python tooling syntax" step:

     ```diff
       - name: Python tooling syntax
     -   run: python3 -m compileall -q scripts templates tests/hooks 2>&1 | tee reports/ci/agent-tooling/python-compile.log
     +   run: python3 -m compileall -q scripts templates tests/hooks tests/qdrant 2>&1 | tee reports/ci/agent-tooling/python-compile.log
     ```

  3. Add four new steps after "Watcher pid handling" (line ~161-162), before
     "Upload agent-tooling logs":

     ```yaml
     - name: Chunker unit tests
       run:
         python3 tests/qdrant/test_chunker.py 2>&1 | tee
         reports/ci/agent-tooling/qdrant-chunker.log

     - name: Exclusion matcher unit tests
       run:
         python3 tests/qdrant/test_exclusions.py 2>&1 | tee
         reports/ci/agent-tooling/qdrant-exclusions.log

     - name: Memory-directory resolution unit tests
       run:
         python3 tests/qdrant/test_memory_dirs.py 2>&1 | tee
         reports/ci/agent-tooling/qdrant-memory-dirs.log

     - name: Embedding model consistency
       run:
         python3 tests/qdrant/test_embedding_model_consistency.py 2>&1 | tee
         reports/ci/agent-tooling/qdrant-consistency.log
     ```

     `test_exclusions.py`, `test_memory_dirs.py`, and
     `test_embedding_model_consistency.py` are stdlib-only and always run.
     `test_chunker.py` self-skips (prints a message, exits 0) when
     `tree-sitter-language-pack` is absent — decided at impl time in favor of
     the self-skip over a CI `pip install`, per the Risk line below.

  4. The existing "Upload agent-tooling logs" step's
     `path: reports/ci/agent-tooling/**` glob already covers the four new `.log`
     files — no change needed there. The `ranx` eval (5.4) is **not** added to
     this job — it needs a live Qdrant, which `agent-tooling` (a plain
     `ubuntu-latest` runner with no services block) doesn't have.
- Why: A6, N4 regression protection; Repository Findings (CI convention).
- Dependencies: 5.1, 5.2, 5.2b, 5.3 (all four test files must exist — they do,
  written test-first in 3.2/3.3/3.4, confirmed in 5.1/5.2/5.2b/5.3 above)
- Risk: Medium — a CI `pip install` would lengthen the job and add a network
  dependency. Mitigation: the self-skip approach (chosen above) avoids it
  entirely; no `pip install` step is added to this job.
- Validation: A PR touching `scripts/qdrant_*.py` or `tests/qdrant/**` sets
  `agent-tooling=true` in `detect-changes` and runs all four scripts green in
  the `agent-tooling` job; the four new `.log` files appear in the uploaded
  `agent-tooling-*` artifact.

## Parallelization

- **Phase 1:** 1.1 / 1.3 / (1.5) run concurrently (different files). 1.2 is a
  prerequisite for Phase 3 and 5.3 — do it early. 1.4 depends on 1.3's footprint
  number.
- **Phase 2 (2.1)** depends only on Phase 1; can overlap Phase 3, but both
  consume the `EMBEDDING_MODEL` string — 1.2 must land first and both must read
  it from `qdrant_common.py`, not inline it.
- **Phase 3** is sequential on `scripts/qdrant_index.py` (single owner). The
  pure-logic modules `qdrant_chunker.py` (3.3) and `qdrant_memory_dirs.py` (3.4)
  can be built and unit-tested in parallel by separate agents, then integrated
  in dependency order (3.1 → 3.2 → {3.3, 3.4} → 3.5 → 3.6 → 3.7).
- **Phase 5** 5.1, 5.2, and 5.2b (`test_memory_dirs.py`) are written test-first
  inside Phase 3 (3.3, 3.2, 3.4 respectively), not in Phase 5 itself — they're
  listed under Phase 5 only for traceability. Only 5.3 is a genuinely new Phase
  5 file; it's independent and can run as soon as Phase 2 lands. 5.4 needs a
  populated index (Phase 3 complete). 5.6 needs all four test files, i.e. Phase
  3 complete plus 5.3.
- **Must remain sequential:** anything editing `scripts/qdrant_index.py`; 2.1
  after 1.2; 4.1 after 3.1 (pipe-test needs the script); 3.5's alias swap is the
  last destructive op in a run.
- **Shared-file conflicts:** `.claude/settings.json` (1.5 and 4.1 — do 1.5 first
  or fold into 4.1's `update-config` pass); `scripts/qdrant_common.py` (1.2,
  3.2, 5.5); `package.json` (4.3 only); `.github/workflows/pr.yml` (5.6 only).

## Testing Strategy

- **Unit** (standalone stdlib scripts, `tests/qdrant/`, run as `python3 <file>`,
  written test-first per this repo's mandatory TDD rule except where noted):
  `test_chunker.py` (symbol boundaries, token sub-split, broken-parse fallback,
  markdown sections — written in 3.3), `test_exclusions.py` (exclusion +
  secret-filename matcher — written in 3.2), `test_memory_dirs.py`
  (worktree/`cwd`-field match, no-match, no-`.jsonl`, path normalization —
  written in 3.4), `test_embedding_model_consistency.py` (model string across 4
  surfaces + pinned vs installed `fastembed` — written in Phase 5, since it
  needs Phase 2's config files to exist first).
- **Integration** (manual/operational, local, needs `docker compose up` + deps):
  full `python scripts/qdrant_index.py` run → non-zero point counts, fast-exit
  on re-run, orphan-staging sweep after a killed run; `qdrant-find` end-to-end
  from a Claude Code session returning the expected file per collection;
  `qdrant-store` absent from the tool list.
- **Regression:** the three unit scripts in PR CI's `agent-tooling` job (5.6);
  `qdrant_eval.py` as the local retrieval-quality regression gate for future
  model/chunking/index changes.
- **Manual/operational:** N3 crash test (`kill -9` mid-populate, confirm prior
  index still served); `async` hook non-blocking check (end session with Qdrant
  stopped); staleness-signal states (`unbuilt` / `Nd stale` / `error`);
  `fastembed` install-footprint capture for the hosting ADR.

## Risks and Rollback

| Risk                                                                                    | Phase   | Mitigation                                                                                                                   | Rollback                                                                                                         |
| --------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `mcp-server-qdrant` ignores `QDRANT_READ_ONLY`                                          | 2.1     | Verify before completing the phase; if unsupported, escalate — the no-write guarantee (Trade-off #7) must be met another way | Do not proceed until resolved                                                                                    |
| Non-atomic rebuild leaves an empty live collection                                      | 3.5     | Build to staging; verify count; alias swap is atomic and last; delete old backing only after                                 | Old backing serves until the swap; re-run from a known-good source commit (in the marker)                        |
| Memory-dir identity match wrong (indexes an unrelated project) or missed (loses memory) | 3.4     | Log every candidate + decision; summary prints match count + paths; `--scope source` isolates                                | `agent-memory` rebuilt every run — a bad run self-corrects; worst case `--scope source` disables memory indexing |
| `settings.json` syntax error disables all hooks                                         | 4.1     | `update-config` skill's `jq -e` validation + fire-proof; review gate on the tracked file                                     | `git checkout .claude/settings.json`                                                                             |
| `fastembed`/`onnxruntime` install fails or is heavy on the constrained machine          | 1.3     | Verify `pip install` on the real machine first; record footprint in the ADR; whole feature is gated on this                  | Do not proceed past Phase 1; the feature is not viable without local embedding                                   |
| Silent `async` hook breakage → stale index, no signal                                   | 4.1/4.2 | The `status.py` staleness segment is the required visible cue (`unbuilt`/`error`/`Nd stale`)                                 | Manual `npm run memory:index`; delete `.qdrant/` to fully reset                                                  |
| `EMBEDDING_MODEL` drifts across the 4 surfaces                                          | 2.1/3.6 | All four read `scripts/qdrant_common.py`; `test_embedding_model_consistency.py` in CI                                        | Fix the outlier; force a reindex (delete the marker)                                                             |
| Eval gate thresholds wrong for this corpus                                              | 5.4/5.5 | ADR explicitly says ratify against the first real run; challenger model path pre-designed                                    | Adjust thresholds in `qdrant_common.py`; or promote `bge-small-en-v1.5` per the ADR                              |

## Success Criteria

- [ ] `docker compose -f docker-compose.qdrant.yml up -d` brings up Qdrant
      `v1.18.x` bound to `127.0.0.1:6333` only; `/healthz` is green.
- [ ] `docs/adr/2026-09-10-qdrant-hosting-model.md` exists (Accepted, local
      Docker) and records the `fastembed` install footprint; the spec's
      "Decisions needing an ADR" hosting bullet is updated to DONE.
- [ ] `scripts/requirements-qdrant.txt` uses exact `==` pins and installs
      cleanly on the target Windows machine.
- [ ] `mcp-server-qdrant` is wired into all three config surfaces; a Claude Code
      session exposes `qdrant-find` and **not** `qdrant-store`.
- [ ] `python scripts/qdrant_index.py` builds `portal-source` and `agent-memory`
      with non-zero point counts; a no-change re-run fast-exits in < ~1s without
      loading FastEmbed.
- [ ] Killing the script mid-populate leaves the previous index served; the next
      run sweeps the orphan `*__staging_*` collection.
- [ ] With two worktrees on different branches, both memory directories are
      discovered and logged; a removed worktree's memory drops out on the next
      rebuild; a no-match run builds `agent-memory` empty and says so.
- [ ] The `Stop` hook is registered `async: true`; ending a session with Qdrant
      stopped closes it with no delay; `.qdrant/index.log` shows the attempt.
- [ ] `scripts/status.py` shows `memory index: unbuilt | <N>d stale | error`
      from `.qdrant/last_indexed.json` and still exits 0 on a corrupt marker.
- [ ] `.qdrant/last_indexed.json` carries
      `{change_token, commit_hash, timestamp}` after a good run.
- [ ] `tests/qdrant/test_chunker.py`, `test_exclusions.py`,
      `test_memory_dirs.py`, `test_embedding_model_consistency.py` pass locally
      and in PR CI's `agent-tooling` job; `tests/qdrant` is in the `compileall`
      list.
- [ ] `python scripts/qdrant_eval.py` runs the ~50-query set and reports
      `Recall@10`, `MRR`, approx-vs-exact `recall@10`; the embedding ADR carries
      a dated first-run note; the gate is cleared by `all-MiniLM-L6-v2` or the
      ADR's challenger path is followed.
- [ ] `qdrant-find "authentication guard component"` from a live session returns
      `ClientApp/src/authentication/AuthenticatedElement.tsx`.
- [ ] A file placed under `**/archive/**` is absent from the index after a
      rebuild.

## Next step

Hand to `subagent-driven-development` or `executing-plans`. Phase 1 step 1.3
(verify `fastembed` installs acceptably on the real machine) is the gating check
— if it fails or the footprint is unacceptable, stop and revisit the
hosting/embedding decision before further work.
