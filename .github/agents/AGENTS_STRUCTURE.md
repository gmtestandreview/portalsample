# Agents Structure

This document captures the current safe-state execution of the agents reorganization plan.

## Phase 1: Documentation and Registry Completed

- `AGENT_REGISTRY.json` contains workflow groupings and category mappings.
- `AGENTS_INDEX.md` is the top-level discovery index.
- `ORCHESTRATORS.md`, `FRAMEWORKS.md`, `DOMAINS.md`, and `ROLES.md` provide focused browsing.

## Phase 2: Deduplication Reviewed

A current scan did not identify any byte-for-byte companion `*.md` and `*.agent.md` duplicates that were still safe to delete in the present tree.

No additional deletions were performed as part of this execution pass.

### Kept Intentionally

- `*.instructions.md`
- `*.prompt.md`
- Unique references such as `index.md`, `code-blocks.md`, `documentation-template.md`

## Phase 3: Supporting Docs Reorganization Completed

A new docs landing area was created:

- `docs/react-best-practices/AGENTS.md`
- `docs/react-composition-patterns/AGENTS.md`

Legacy supporting folders were removed after migration.

## Phase 4: Nested Reorganization Deferred

The current workflow-family co-location under `workflows/` remains in place and is documented by the catalog files, but no additional path changes should be made until agent resolution is validated.

Current workflow folders:

- `workflows/react18/`
- `workflows/react19/`
- `workflows/polyglot-test/`
- `workflows/rug/`
- `workflows/ai-team/`
- `workflows/tdd/`

Non-workflow agents remain at the root of `.github/agents`.

## Workflow Integrity Guarantee

The following workflow groupings were preserved without further relocation in this pass:

- React 18 orchestrator workflow
- React 19 orchestrator workflow
- Polyglot test orchestrator workflow
- RUG orchestration (`SWE`, `QA`)
- AI team coordination (`ai-team-producer`, `ai-team-dev`, `ai-team-qa`)
- TDD loop (`tdd-red`, `tdd-green`, `tdd-refactor`)
