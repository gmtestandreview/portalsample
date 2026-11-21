# Local maintenance record — 2026-11-05

This project-specific remediation modifies the _copied_ `vitest` skill directory
only; the original ZIP is preserved separately. `GENERATION.md` remains the
upstream provenance record (Vitest source snapshot 2026-01-28, SHA
`4a7321e10672f00f0bb698823a381c2cc245b8f7`). It is **not** a claim that the
updated material was re-generated from upstream.

## Scope of changes

- `SKILL.md`: distinguish purpose/objective/done/acceptance, scope/activation,
  project load conditions, version guard, evidence discipline, concise routing.
- New `references/project-nmi-portal.md`: local runner, script, coverage and
  Storybook runtime rules derived from supplied config and `package.json`.
- New `references/vitest-5-compatibility.md`: known Vitest 4/5 migration
  exclusions and supported alternatives using official migration/docs.
- Updated generic references: `core-test-api`, `core-describe`, `core-config`,
  `features-concurrency`, `features-coverage`, `advanced-environments`,
  `advanced-projects`. Unique non-conflicting examples and domain knowledge were
  retained.
- Added `evals/project-governance-cases.md` and adjusted existing activation
  cases to specify compatibility routing and version boundaries.

## Sources and limits

Project evidence supplied as `vitest.config(8).ts`, `vitest.unit.config(10).ts`,
`vitest.storybook.config(10).ts`, `vitest.storybook.coverage(9).ts`,
`vitest.storybook.runtime(10).ts`, `vitest.setup(9).ts`,
`vitest.storybook.setup(9).ts`, `vitest.shims.d(4).ts`, `package(10).json`,
`playwright.config(4).ts`, `playwright.storybook.config(4).ts`, and
`playwright.api.config(4).ts`. Parenthesized numeric suffixes are upload display
names; skill guidance uses their **original import/config paths**. The actual
repository and installed dependencies were not available.

Official migration/reference:

- <https://vitest.dev/guide/migration/>
- <https://v4.vitest.dev/guide/migration.html>
- <https://vitest.dev/guide/browser/>
- <https://vitest.dev/config/coverage>
- <https://vitest.dev/guide/parallelism.html>

## Non-destructive adoption / rollback

- Keep a copy of the prior ZIP and diff before installing.
- Review all project-specific policy against the live repository, including
  quality regression config, workflow, package lock and fixture imports.
- Replace only the intended skill directory on explicit installation approval.
- Roll back by restoring the prior directory from the preserved ZIP; do not use
  this skill to rewrite application project configs without authorization.

## Validation state

Static tests and results are recorded in the separately delivered audit report.
The definitions under `evals/` are not executed behavioral evidence. Agent
activation/RED-GREEN, Vitest 5 runtime tests, TypeScript type-check, and real
repository CI remain **Needs Human Review** until executed and recorded. Do not
mark this revision deployable merely because a static format check passes.

## Auto-optimization — 2026-11-06 (three bounded edit passes)

This entry records the **candidate** generated from
`vitest-skill-revised-2026-11-05.zip`, not a repository installation.

1. **Correctness and safety:** corrected the `expect.anything()` null example;
   changed outdated tag CLI/config guidance; replaced deprecated `test.scoped`
   sample with `test.override`; clarified inline-vs-referenced project
   inheritance; made around-hook cleanup failure-safe; guarded `vi.mock`
   top-level use, `allowOnly`, failing-test markers, and snapshot/coverage
   acceptance changes.
2. **Resource routing:** added a load/near-miss boundary to each of the 16
   generic topical references; kept local governance in the conditional
   `project-nmi-portal` reference and version constraints in the
   `vitest-5-compatibility` reference. Main skill remains below 200 lines.
3. **Acceptance and regression:** added topic-specific expected outcomes and
   acceptance checks, P17-P22 governance cases, and R01-R04 retrieval
   near-misses. Retained original author/source metadata and unique topic
   examples. No source project configuration was edited.

### Static evidence and non-evidence

- A repeatable Python checker, delivered separately as
  `vitest-skill-static-checks-2026-11-06.py`, validates frontmatter, metadata,
  local Markdown links, fences, topic routing, policy text, removed-API patterns
  in active examples, and evaluation case registration.
- Final candidate: **22/22 deterministic static checks passed**. These are
  structural/textual checks; not proof of Vitest 5.0.5 API execution.
- Official public documentation reviewed: `https://vitest.dev/guide/`,
  `/guide/migration/`, `/guide/test-tags`, `/guide/test-context`, and
  `/guide/projects` on 2026-11-06.
- This container reports Node `v22.16.0`; the supplied project's manifest
  requires Node `>=24.21.0`. Full repository, installed dependencies and
  behavioral evaluation harness were not supplied. Vitest/TypeScript/CI runs,
  installed-version API validation, and RED/GREEN agent behavior: **NHR**.
- Use the separately delivered score and validation report for criterion-level
  deductions. Scores document static quality, not runtime completion or
  deployment authorization.

### Rollback

Preserve the input ZIP. To revert, replace the candidate skill **directory**
from `vitest-skill-revised-2026-11-05.zip`; do not copy any files back into the
application repository without separate approval. Validate the installed
project's test policy after any adoption.
