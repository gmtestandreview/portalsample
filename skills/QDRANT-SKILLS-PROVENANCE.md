# Vendored Qdrant Skills — Provenance

**Source:** https://skills.qdrant.tech/ (`llms.txt` index)
**Vendored:** 2026-09-10, on branch `feat/a-team-agents-commands-docs`
**License:** the skills site declares no explicit license. Presumed to follow the Qdrant
org default (Apache-2.0, as used by `github.com/qdrant/mcp-server-qdrant`). Vendored for
internal agent use in this repo. Re-sync from source rather than editing in place.

## Why these four (and not the other 20)

This repo is a React/TypeScript SPA snapshot; Qdrant is **not** in the portal runtime.
These skills serve the **semantic-memory-layer tooling** — self-hosted Docker Qdrant +
`mcp-server-qdrant` indexing memory notes, docs, ADRs, and source. That use case is
single-node, single-user, thousands-to-tens-of-thousands of chunks: no QPS, scaling,
monitoring, sizing, or multi-tenancy dimension.

| Vendored | Role |
| --- | --- |
| `qdrant-search-quality/` (tree: `diagnosis`, `search-strategies`, `hybrid-search`, `hybrid-search/search-types`, `hybrid-search/combining-searches`, `relevance-feedback`) | Primary. Retrieval relevance, embedding-model fit, chunking, hybrid/RRF, recall@k / golden sets. |
| `qdrant-model-migration/` | Primary. Switching embedding models (the open FastEmbed vs cloud-inference decision), A/B testing, dimension changes, named vectors vs alias swap. |
| `qdrant-clients-sdk/` | Supporting. `mcp-server-qdrant` wraps the Python client; forks/extensions are client-level. |
| `qdrant-deployment-options/` | Supporting. Backs the Docker-over-Cloud decision with Qdrant-specific trade-offs; feeds the `adr` skill. |

**Deliberately not vendored:** `qdrant-edge`, `qdrant-sizing`, `qdrant-scaling` (+4),
`qdrant-performance-optimization` (+3), `qdrant-monitoring` (+2), `qdrant-multitenancy`,
`qdrant-version-upgrade`. Pull `qdrant-performance-optimization/indexing-performance-optimization`
on demand if a full source-tree ingest turns out slow; pull `qdrant-multitenancy` if the
layer ever indexes multiple repos into one Qdrant with per-repo isolation.

## Duplication audit (2026-09-10)

No true duplication with installed skills/agents. Boundaries recorded:

- **`ecc:rag-pipeline-reviewer` vs `qdrant-search-quality`** — adjacent, not duplicate.
  Reviewer = read-only judgement of a whole pipeline. `qdrant-search-quality` =
  Qdrant-specific diagnosis + implementation. Route: *pipeline brought for sign-off* →
  reviewer; *diagnose or build Qdrant retrieval* → `qdrant-search-quality`.
- **`qdrant-deployment-options` vs `adr` / `architecture-design`** — producer/consumer.
  Skill supplies the option space; `adr` records the decision.
- **`qdrant-scaling` / `qdrant-performance-optimization` vs `scalability-review` /
  `performance-audit`** — different altitude (generic methodology vs Qdrant knobs). Moot
  while unvendored; noted so nobody adds them assuming a gap.

## Link behaviour

Parent->child links inside `qdrant-search-quality/` are relative and resolve within the
vendored tree. All `https://skills.qdrant.tech/md/...` documentation links point back to
the live site and require network access.

## Related

- MCP server: https://github.com/qdrant/mcp-server-qdrant (Apache-2.0) — `qdrant-store` /
  `qdrant-find`, FastEmbed `sentence-transformers/all-MiniLM-L6-v2` default, no hybrid /
  rerank out of the box.
