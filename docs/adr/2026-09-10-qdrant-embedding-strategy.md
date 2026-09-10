# ADR: Embedding model for the Qdrant semantic-memory layer

**Date:** 2026-09-10
**Status:** Proposed
**Deciders:** Portal rebuild team (gregm)

## Context

The semantic-memory layer is specified in
`.claude/docs/specs/2026-09-10-qdrant-semantic-memory-design.md`: a **self-hosted
Docker Qdrant** (bound to `127.0.0.1:6333`, unauthenticated, storage in
git-ignored `.qdrant/`), the official `mcp-server-qdrant` (`uvx`) giving agents a
`qdrant-find` / `qdrant-store` surface, and a Python ingestion script
(`scripts/qdrant_index.py`) that rebuilds the index from repo files and runs at
session end via a `Stop` hook. Two collections: `portal-source`
(`ClientApp/src/**` + `docs/**` + `.claude/docs/specs/**`) and `agent-memory`
(`memory/*.md` + `MEMORY.md`). Nothing is indexed yet — the plan is still to be
written.

Two code paths produce vectors and **must use the identical embedding model** or
retrieval silently breaks:

- **Query path** — `mcp-server-qdrant`. Provider hard-wired to **FastEmbed**;
  only `EMBEDDING_MODEL` is configurable. Ships defaulting to
  `sentence-transformers/all-MiniLM-L6-v2`.
- **Index path** — `scripts/qdrant_index.py`, calling `fastembed.TextEmbedding`
  directly.

The spec's **Trade-off #3** already dealt with the parity hazard: `mcp-server-qdrant`'s
default (`all-MiniLM-L6-v2`) and FastEmbed's *own* library default
(`BAAI/bge-small-en-v1.5`) **differ despite both being 384-dim** — an unpinned
setup produces a silent vector-space mismatch, and this bit once in review. The
spec's fix: pin `EMBEDDING_MODEL` **explicitly in every config surface**
(`.mcp.json`, `.vscode/mcp.json`, `.codex/config.toml`) and in the indexer, with
`all-MiniLM-L6-v2` as the pinned value. This ADR revisits **which value** to pin;
it keeps the pin-everywhere mechanism.

Skill analysis run against the question (`qdrant-search-quality`,
`qdrant-model-migration`; both vendored 2026-09-10):

- **diagnosis** — "Most quality issues come from the embedding model or the data,
  not Qdrant's config." Do not pick a model a priori: build a labeled query set,
  score `Recall@k` (RAG → `Recall@k` primary; `MRR`/`Hits@1` for single-answer)
  with `ranx`, gate changes on a threshold. Use `exact=true` as ground truth;
  keep approximate (HNSW) recall ≥ 0.95 of exact. `all-MiniLM-L6-v2` is
  English-only with a **256-token** cap — the spec's chunker already carries a
  "token-limit safety net" (sub-split anything > ~230 tokens) *specifically to
  work around that truncation*.
- **model-migration** — different-model vectors are incompatible, but on Qdrant
  **≥ v1.18** a second **named vector** can be added to an existing collection
  and backfilled with `UpdateVectors`, enabling an A/B (`using: "a"` vs
  `using: "b"`) with no new collection. At this corpus size ("< 25 MB →
  re-indexing from source is faster than the migration tool") re-embedding is
  minutes. "If you anticipate future model migrations, define both vector fields
  upfront."

Constraints and assumptions:

- Qdrant **Cloud Inference is Cloud-only** and is not a `mcp-server-qdrant`
  provider — unavailable without abandoning the self-hosted Docker decision
  (spec Trade-off #1). (Assumption: that decision holds. It is not yet its own
  ADR — spec line 117 flags one is owed; this ADR assumes it.)
- An external embedding API needs a fork of `mcp-server-qdrant` for a
  non-FastEmbed provider, plus a key, cost, and network — and drops the
  local-only / no-egress property that is a hard NFR for this government-portal
  snapshot.
- Corpus is single-repo, low tens of thousands of chunks, mixed prose +
  TypeScript source. No throughput or latency pressure.
- `mcp-server-qdrant`'s `qdrant-find` wires exactly **one dense vector** — no
  sparse/BM25 input (spec "left out" #1), so hybrid search is not a config
  toggle.
- A `QDRANT_API_KEY` for a previously-provisioned Qdrant Cloud cluster still sits
  in local env and GitHub secrets, unused by this design; revocation is a
  separate call.

## Decision

Embed **locally with FastEmbed**, keeping the spec's "pin `EMBEDDING_MODEL`
explicitly in every config surface and the indexer" rule — but set the pinned
value to **`BAAI/bge-small-en-v1.5`** (384-dim, 512-token, FastEmbed-native),
**not** `all-MiniLM-L6-v2`. Create both collections with **named vectors** on
Qdrant **≥ v1.18** so the model stays a cheaply reversible, evaluation-gated
choice: it stands only while it clears the retrieval gate in Validation, and is
replaced via a named-vector A/B, not a re-architecture.

**Qdrant Cloud Inference and external embedding APIs are rejected.** This
supersedes the model value in spec Trade-off #3 (`all-MiniLM-L6-v2` → retained
only as the eval baseline); the spec's pin-everywhere mechanism is unchanged.

## Consequences

### Positive

- Local, one provider, no keys, no per-call cost, no egress — the local-only NFR
  and the self-hosted decision are preserved.
- `bge-small-en-v1.5` is FastEmbed's *own* default, so pinning to it removes the
  very default-divergence Trade-off #3 works around — the pinned value now
  matches what one side already picks unprompted.
- Same 384-dim as MiniLM → identical storage / HNSW footprint, no schema or
  chunk-count change, and a MiniLM↔bge-small A/B needs no dimension juggling.
- 512-token window (vs 256): the chunker's token safety net (spec pipeline step
  2) fires far less often, so fewer sub-split fragments and less mid-idea
  chopping — the 30–40% relevance risk the spec cites is reduced at the source.
- Consistently higher MTEB retrieval than MiniLM at comparable CPU cost.
- Named vectors from day one bank the "define both vector fields upfront"
  guidance: a later model change is a background `UpdateVectors` backfill plus a
  `using:` switch, minutes at this size.
- The eval gate (`ranx`, `Recall@10` + `MRR`) upgrades the spec's 3–5-pair smoke
  check (pipeline step 6) into an objective "good enough" line and a
  regression gate for future model / chunking / index changes.

### Negative (accepted)

- `bge-small-en-v1.5` is general-English, not code-trained; source-chunk
  retrieval will trail a code-aware model
  (`jinaai/jina-embeddings-v2-base-code`) until the eval says otherwise.
- It overrides a value in a spec that was already devil's-advocate reviewed this
  session. Accepted because nothing is indexed yet (zero migration cost now) and
  the change is small and reversible; if the eval shows no gain over MiniLM, the
  pin reverts.
- Model download ~130 MB vs MiniLM's ~90 MB, and marginally slower per-chunk
  embed. Negligible at this corpus size; real on a storage-constrained machine.
- Hybrid (dense + BM25) is **not** a cheap follow-up: `qdrant-find` cannot
  consume a sparse vector, so hybrid needs a forked MCP server or a custom find
  path. It stays out of scope, as the spec already concluded.
- Building and refreshing a ~50-query labeled set is real upkeep; a stale set
  makes the gate lie.
- Pins the Qdrant image to ≥ v1.18 (current `latest` satisfies this). Below that,
  named-vector-on-existing is unavailable and model changes need
  new-collection + alias-swap.
- English-only: non-English memory content later forces a model change (same A/B
  path).

## Alternatives Considered

### Option A — Keep `all-MiniLM-L6-v2` (the spec's current pin)

- Description: pin the spec's value unchanged; rely on pipeline step 6's 3–5
  query smoke check for quality.
- Advantages: zero churn against a reviewed spec; smallest/fastest FastEmbed
  model; the parity fix is already written down.
- Why not selected: the 256-token cap is a known, already-worked-around defect in
  this exact pipeline; MiniLM is the weakest retrieval of the FastEmbed English
  models; `bge-small-en-v1.5` gives 2× context at the same dimension and near
  the same speed, and is the more natural pin (it is FastEmbed's default).
  Retained as the eval baseline so the gain is measured, not assumed.

### Option B — Qdrant Cloud Inference

- Description: embed server-side on Qdrant Cloud; no local model.
- Advantages: no embedding compute locally; model swap becomes a config change;
  larger hosted models.
- Why not selected: Cloud-only, so it reverses the self-hosted Docker decision
  and the no-egress NFR; not a `mcp-server-qdrant` provider. Revisit only if the
  hosting decision is superseded.

### Option C — External embedding API (OpenAI `text-embedding-3-small` / Cohere / Voyage)

- Description: embed via a third party from a forked MCP server and the indexer.
- Advantages: strong quality including on code; no local model.
- Why not selected: needs a `mcp-server-qdrant` fork, a key, network, and
  per-call cost; breaks local-only. Disproportionate for one small repo. Kept as
  the fallback if no FastEmbed model clears the gate.

### Option D — Start on a 768-dim model (`bge-base-en-v1.5` / `nomic-embed-text-v1.5` / `jina-v2-base-code`)

- Description: skip the small bootstrap; index straight onto a larger model.
- Advantages: likely better retrieval out of the gate, especially on source.
- Why not selected: doubles vector storage/memory and (for 8192-token models)
  changes chunk-size assumptions before any measurement calls for it — the "10×
  resources for a marginal gain" trap. These are the **A/B challengers** for the
  eval; the named-vector path makes promoting one cheap.

### Option E — Do nothing (leave it at the spec, don't record this)

- Why not selected: the model choice would then rest on an unexamined default
  inside a trade-off table, with no eval gate and no record that Cloud Inference
  and external APIs were considered and why they lose.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Bootstrap model weak on source-code queries | Poor `qdrant-find` for code questions | Eval set includes code queries; `jina-v2-base-code` / `bge-base` pre-named as challengers; named-vector swap ready |
| Index path and query path drift to different models | Silent near-zero recall (the Trade-off #3 bug) | Pinned string in all 3 MCP configs + indexer, ideally from one shared constant; indexer asserts its model == `EMBEDDING_MODEL` at startup; store model id in collection metadata |
| Overriding a freshly reviewed spec value | Rework, confusion | Change made pre-first-index (zero migration cost); `Proposed` until ratified; reverts cleanly if the eval shows no gain |
| Eval set not built / goes stale | No objective "good enough"; silent regressions | This ADR makes the gate a precondition for calling retrieval "done"; refresh condition in Review Trigger |
| Qdrant image downgraded below v1.18 | Loses cheap named-vector migration | Pin minimum version in `docker-compose.qdrant.yml` with a comment |

## Validation

- **Eval harness:** grow the spec's 3–5 query smoke check (pipeline step 6) to
  ~50 labeled queries (hand-curated real questions + LLM-synthetic), each with
  known-relevant chunk ids, scored with `ranx`. Cover both `portal-source` (incl.
  code-retrieval queries) and `agent-memory`.
- **Gate:** `Recall@10 ≥ 0.80` and `MRR ≥ 0.60` for the pinned model with
  production chunking. (Opening proposal — ratify against the first real run.)
- **HNSW sanity:** approximate vs `exact=true` `recall@10 ≥ 0.95` on the same set.
- **A/B proven:** MiniLM (baseline) and at least one 768-dim challenger indexed
  as extra named vectors and scored on the same set; keep-or-promote recorded
  (note appended here or a follow-up ADR).
- **Parity check:** indexer refuses to run if its model id ≠ `EMBEDDING_MODEL`.

## Rollback / Reversal

- Before first index: change the pinned string back to `all-MiniLM-L6-v2` in the
  MCP configs and the indexer — one edit, nothing to migrate.
- After indexing, changing model: index the new model as a second named vector,
  backfill with `UpdateVectors`, switch `using:` / `EMBEDDING_MODEL`, drop the
  old field. Minutes at this size; no collection recreation on v1.18+ (the spec's
  staging + alias-swap rebuild also just re-runs).
- Abandoning local FastEmbed for Cloud Inference or an API: this ADR is
  superseded, `mcp-server-qdrant` is forked/replaced for the provider, the corpus
  is re-embedded once. The cost is the fork and new operational surface, not the
  re-embed.

## Review Trigger

Revisit when any of:

- The first eval run lands — ratify or adjust the `Recall@10` / `MRR` thresholds.
- The pinned model fails the gate, or a challenger beats it by a margin worth the
  resource cost.
- Source-code retrieval quality is reported as insufficient in practice.
- The corpus grows past ~100k chunks, or re-embedding stops being minutes-scale.
- Non-English content needs indexing.
- The self-hosted Docker Qdrant decision is superseded (reopens Cloud Inference).
- `mcp-server-qdrant` gains non-FastEmbed providers, named-vector collections, or
  a sparse-vector `qdrant-find` (reopens hybrid search).
- The eval set has not been refreshed in ~2 quarters while the corpus changed.

## References

- Design spec: `.claude/docs/specs/2026-09-10-qdrant-semantic-memory-design.md`
  (esp. Trade-offs #1, #3, #5, #6; "What was deliberately left out" #1; pipeline
  step 6; "Decisions needing an ADR").
- Skills: `skills/qdrant-search-quality/diagnosis/SKILL.md`,
  `skills/qdrant-search-quality/search-strategies/hybrid-search/SKILL.md`,
  `skills/qdrant-model-migration/SKILL.md` (vendored 2026-09-10; see
  `skills/QDRANT-SKILLS-PROVENANCE.md`).
- Qdrant: "How to choose an embedding model"; Cloud Inference docs; "Measuring
  Retrieval Relevance" (`ranx`).
- `mcp-server-qdrant` (Apache-2.0): FastEmbed-only provider, `EMBEDDING_MODEL`
  configurable, default `all-MiniLM-L6-v2`; FastEmbed library default is
  `BAAI/bge-small-en-v1.5`.
- Owed: an ADR for the hosting model (local Docker vs Qdrant Cloud), spec line
  117 — assumed accepted here.
