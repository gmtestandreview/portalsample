# ADR: Embedding model for the Qdrant semantic-memory layer

**Date:** 2026-09-10
**Status:** Accepted
**Deciders:** Portal rebuild team (gregm)

## Context

The semantic-memory layer is specified in
`.claude/docs/specs/2026-09-10-qdrant-semantic-memory-design.md`: a **self-hosted
Docker Qdrant** (bound to `127.0.0.1:6333`, unauthenticated, storage in
git-ignored `.qdrant/`), the official `mcp-server-qdrant` (`uvx`) giving agents a
`qdrant-find` / `qdrant-store` surface, and a Python ingestion script
(`scripts/qdrant_index.py`) that rebuilds the index from repo files and runs at
session end via a `Stop` hook. Two collections: `portal-source` (`ClientApp/src/**`
+ `docs/**` + `.claude/docs/specs/**`) and `agent-memory` (`memory/*.md` +
`MEMORY.md`). Nothing is indexed yet.

Two code paths produce vectors and **must use the identical embedding model** or
retrieval silently breaks:

- **Query path** — `mcp-server-qdrant`. Provider hard-wired to **FastEmbed**;
  only `EMBEDDING_MODEL` is configurable. Ships defaulting to
  `sentence-transformers/all-MiniLM-L6-v2`.
- **Index path** — `scripts/qdrant_index.py`, calling `fastembed.TextEmbedding`
  directly.

The spec's **Trade-off #3** already handled the parity hazard: `mcp-server-qdrant`'s
default (`all-MiniLM-L6-v2`) and FastEmbed's *own* library default
(`BAAI/bge-small-en-v1.5`) **differ despite both being 384-dim** — an unpinned
setup gives a silent vector-space mismatch, which bit once in review. The fix:
pin `EMBEDDING_MODEL` **explicitly in every config surface** (`.mcp.json`,
`.vscode/mcp.json`, `.codex/config.toml`) and in the indexer, with
`all-MiniLM-L6-v2` as the pinned value. This ADR confirms **which value** to pin
and records the reasoning, the accepted limits, and the escape hatch.

Skill analysis run against the question (`qdrant-search-quality`,
`qdrant-model-migration`; both vendored 2026-09-10):

- **diagnosis** — "Most quality issues come from the embedding model or the data,
  not Qdrant's config." Do not assume a model is adequate: build a labeled query
  set, score `Recall@k` (RAG → `Recall@k` primary; `MRR`/`Hits@1` for
  single-answer) with `ranx`, gate changes on a threshold, and check
  approximate-vs-`exact=true` recall ≥ 0.95. `all-MiniLM-L6-v2` is English-only
  with a **256-token** input cap — the spec's chunker already carries a
  "token-limit safety net" (sub-split anything > ~230 tokens) precisely to work
  around that truncation.
- **model-migration** — different-model vectors are incompatible, but on Qdrant
  **≥ v1.18** a second **named vector** can be added to an existing collection and
  backfilled with `UpdateVectors`, enabling an A/B (`using: "a"` vs `using: "b"`)
  with no new collection. At this corpus size ("< 25 MB → re-indexing from source
  is faster than the migration tool") re-embedding is minutes. "If you anticipate
  future model migrations, define both vector fields upfront."
  **Caveat for this design:** `mcp-server-qdrant`'s `qdrant-find` queries the
  collection's *default (unnamed)* vector and exposes no `using:` parameter. So the
  primary model must be the default unnamed vector (the production query path can't
  select a named one), challengers are added only as *named* vectors, the `using:`
  A/B happens exclusively in the standalone eval script, and **promoting a
  challenger means recreating the collection with it as the new default** — which
  at this size is just the spec's staging + alias-swap rebuild re-running. The
  named-vector path removes the re-*embed* cost of a migration, not the collection
  recreate.

Constraints and assumptions:

- Qdrant **Cloud Inference is Cloud-only** and is not a `mcp-server-qdrant`
  provider — unavailable without abandoning the self-hosted Docker decision (spec
  Trade-off #1). That decision is not yet its own ADR (spec "Decisions needing an
  ADR"); this ADR assumes it is accepted.
- An external embedding API needs a fork of `mcp-server-qdrant` for a
  non-FastEmbed provider, plus a key, cost, and network — and breaks the
  local-only / no-egress NFR (a hard requirement for this government-portal
  snapshot).
- Corpus is single-repo, low tens of thousands of chunks, mixed prose +
  TypeScript source. No throughput or latency pressure. The machine is
  resource/storage-constrained.
- `mcp-server-qdrant`'s `qdrant-find` wires exactly **one dense vector** — no
  sparse/BM25 input (spec "left out" #1), so hybrid search is not a config
  toggle.

## Decision

Keep **`all-MiniLM-L6-v2`** as the embedding model, embedded **locally with
FastEmbed**, pinned explicitly in every config surface and in the indexer (the
spec's Trade-off #3 rule, unchanged). **Accept its English-only scope and
256-token input cap**, mitigated by the chunker's token safety net.

**Qdrant Cloud Inference and external embedding APIs are rejected.** Both
collections are created with **named vectors** on Qdrant **≥ v1.18** so the model
stays a cheaply reversible choice, and its adequacy is confirmed by an evaluation
gate (Validation) before the layer is called done — not assumed.

## Consequences

### Positive

- No divergence from the spec that was already devil's-advocate reviewed this
  session; the parity fix (#3) stands with no value change.
- Smallest and fastest FastEmbed model — lowest RAM, disk, and download on a
  resource-constrained machine.
- Local, one provider, no keys, no per-call cost, no egress — the local-only NFR
  and the self-hosted decision are preserved.
- Named vectors from day one bank the "define both vector fields upfront"
  guidance: a later model change is a background `UpdateVectors` backfill to
  populate the challenger's named vector, then a collection recreate to make it
  the new *default* (the spec's staging + alias-swap rebuild) — minutes at this
  size. `qdrant-find` has no `using:` knob, so the recreate is the switch; the
  named vector is what lets the A/B run first without a throwaway collection. Not
  a lock-in.
- The eval gate (`ranx`, `Recall@10` + `MRR`) upgrades the spec's 3–5-pair smoke
  check (pipeline step 7) into an objective "good enough" line and a regression
  gate for future model / chunking / index changes.

### Negative (accepted)

- **English-only.** Any future need to index non-English memory or doc content
  forces a model change (via the named-vector A/B path).
- **256-token input cap.** The chunker must sub-split aggressively (spec pipeline
  step 3, ~230-token net), so chunks are more numerous and smaller, a coherent
  idea can land split across two chunks, and any single retrieved hit carries
  less surrounding context than a 512+-token model would allow. This is a
  permanent constraint on chunk design, accepted knowingly.
  *Clarification on the token-efficiency motivation:* the cap does keep each
  `qdrant-find` result lean, which serves the "don't bloat the agent's context"
  goal — but the model choice is not what delivers that. What text `qdrant-find`
  returns is governed by chunk size and `QDRANT_SEARCH_LIMIT`, both independent
  knobs; the model's context window is a ceiling, not a forcing function. A
  larger-window model would *permit* bigger chunks, not require them. So MiniLM's
  cap enforces a discipline we could set deliberately with any model — it is a
  fine v1 default but not a prerequisite for token-lean retrieval, and a better
  model would cost vector storage (768-dim doubles it), not context budget.
- General-English model, not code-trained: source-chunk retrieval will trail a
  code-aware model (`jinaai/jina-embeddings-v2-base-code`). The eval set is what
  escalates if this bites.
- Hybrid (dense + BM25) is **not** a cheap follow-up: `qdrant-find` cannot consume
  a sparse vector, so hybrid needs a forked MCP server or a custom find path. Out
  of scope, as the spec already concluded.
- Named vectors are non-default for `mcp-server-qdrant` (it expects a single
  vector); the index script and MCP config carry the named-vector schema, and a
  live A/B runs from a standalone script or a second server instance.
- Pins the Qdrant image to ≥ v1.18 (current `latest` satisfies this). Below that,
  named-vector-on-existing is unavailable and model changes need new-collection +
  alias-swap.
- Building and refreshing a ~50-query labeled set is real upkeep; a stale set
  makes the gate lie.

## Alternatives Considered

### Option A — `BAAI/bge-small-en-v1.5`

- Description: pin FastEmbed's own default instead — 384-dim (same as MiniLM),
  512-token window, English.
- Advantages: doubles the input window at the same dimension and near-identical
  CPU cost, so the chunker's safety net fires far less often and fewer ideas get
  split; higher MTEB retrieval than MiniLM; it is the value one side already
  picks unprompted, so pinning to it also removes the default-divergence
  Trade-off #3 works around.
- Why not selected: the team prefers not to diverge from the freshly-reviewed
  spec, and accepts MiniLM's English-only + 256-token limits as adequate for one
  small single-language repo. Retained as the **first A/B challenger** — indexed
  as a second named vector and scored on the eval set; promote it only if it is
  clearly ahead on real queries.

### Option B — Qdrant Cloud Inference

- Description: embed server-side on Qdrant Cloud; no local model.
- Advantages: no local embedding compute; model swap becomes a config change;
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

### Option D — A 768-dim model (`bge-base-en-v1.5` / `nomic-embed-text-v1.5` / `jina-v2-base-code`)

- Description: index straight onto a larger, higher-quality model.
- Advantages: likely better retrieval, especially on source.
- Why not selected: doubles vector storage/memory and (for 8192-token models)
  changes chunk-size assumptions before any measurement calls for it — the "10×
  resources for a marginal gain" trap. These are **A/B challengers** for the
  eval, not the pick; the named-vector path makes promoting one cheap.

### Option E — Do nothing (don't record this)

- Why not selected: the model choice would rest on an unexamined default inside a
  trade-off table, with no eval gate and no record that Cloud Inference and
  external APIs were considered and why they lose.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| MiniLM weak on source-code queries | Poor `qdrant-find` for code questions | Eval set includes code queries; `jina-v2-base-code` / `bge-base` pre-named as challengers; named-vector swap ready |
| Index path and query path drift to different models | Silent near-zero recall (the Trade-off #3 bug) | Pinned string in all 3 MCP configs + indexer, ideally from one shared constant; indexer asserts its model == `EMBEDDING_MODEL` at startup; store model id in collection metadata |
| 256-token truncation slips past the chunker | Silent data loss on long chunks | Sub-split is measured with the real tokenizer, not line count (spec step 3); golden-set check would surface the recall drop |
| Eval set not built / goes stale | No objective "good enough"; silent regressions | This ADR makes the gate a precondition for calling retrieval "done"; refresh condition in Review Trigger |
| Qdrant image downgraded below v1.18 | Loses cheap named-vector migration | Pin minimum version in `docker-compose.qdrant.yml` with a comment |

## Validation

- **Eval harness:** grow the spec's 3–5 query smoke check (pipeline step 7) to
  ~50 labeled queries (hand-curated real questions + LLM-synthetic), each with
  known-relevant chunk ids, scored with `ranx`. Cover both `portal-source` (incl.
  code-retrieval queries) and `agent-memory`.
- **Gate:** `Recall@10 ≥ 0.80` and `MRR ≥ 0.60` for `all-MiniLM-L6-v2` with
  production chunking. (Opening proposal — ratify against the first real run.)
- **HNSW sanity:** approximate vs `exact=true` `recall@10 ≥ 0.95` on the same set.
- **A/B run:** `BAAI/bge-small-en-v1.5` (and optionally one 768-dim challenger)
  indexed as extra named vectors and scored on the same set; keep-or-promote
  recorded (note appended here or a follow-up ADR).
- **Parity check:** the indexer refuses to run if its model id ≠ `EMBEDDING_MODEL`.

## Rollback / Reversal

- Before first index: change the pinned string in the MCP configs and the indexer
  — one edit, nothing to migrate.
- After indexing, changing model: index the new model as a second named vector
  and score it on the eval set via the standalone script (which *can* pass
  `using:`). To promote it, recreate the collections with the new model as the
  **default** vector — the spec's staging + alias-swap rebuild, re-run — and
  update the shared `EMBEDDING_MODEL` constant. `qdrant-find` has no `using:`
  switch, so promotion is always a recreate, not a config flip; the named vector
  only spares the re-embed during evaluation. Minutes at this size.
- Abandoning local FastEmbed for Cloud Inference or an API: this ADR is
  superseded, `mcp-server-qdrant` is forked/replaced for the provider, and the
  corpus is re-embedded once. The cost is the fork and the new operational
  surface, not the re-embed.

## Review Trigger

Revisit when any of:

- The first eval run lands — ratify or adjust the `Recall@10` / `MRR` thresholds.
- `all-MiniLM-L6-v2` fails the gate, or `bge-small-en-v1.5` beats it on real
  queries by a margin worth the extra ~40 MB and slightly slower embed.
- Source-code retrieval quality is reported as insufficient in practice.
- The 256-token cap is forcing chunk boundaries that visibly hurt answers.
- Non-English content needs indexing.
- The corpus grows past ~100k chunks, or re-embedding stops being minutes-scale.
- The self-hosted Docker Qdrant decision is superseded (reopens Cloud Inference).
- `mcp-server-qdrant` gains non-FastEmbed providers, named-vector collections, or
  a sparse-vector `qdrant-find` (reopens hybrid search).
- The eval set has not been refreshed in ~2 quarters while the corpus changed.

## References

- Design spec: `.claude/docs/specs/2026-09-10-qdrant-semantic-memory-design.md`
  (esp. Trade-offs #1, #3, #5, #6, #11; "What was deliberately left out" #1;
  pipeline step 7; "Decisions needing an ADR").
- Skills: `skills/qdrant-search-quality/diagnosis/SKILL.md`,
  `skills/qdrant-search-quality/search-strategies/hybrid-search/SKILL.md`,
  `skills/qdrant-model-migration/SKILL.md` (vendored 2026-09-10; see
  `skills/QDRANT-SKILLS-PROVENANCE.md`).
- Qdrant: "How to choose an embedding model"; Cloud Inference docs; "Measuring
  Retrieval Relevance" (`ranx`).
- `mcp-server-qdrant` (Apache-2.0): FastEmbed-only provider, `EMBEDDING_MODEL`
  configurable, default `all-MiniLM-L6-v2`; FastEmbed library default is
  `BAAI/bge-small-en-v1.5`.
- Owed: an ADR for the hosting model (local Docker vs Qdrant Cloud) — tracked in
  the spec's "Decisions needing an ADR"; assumed accepted here.
- Follow-up: the ~50-query `ranx` eval harness (extends spec pipeline step 7).
