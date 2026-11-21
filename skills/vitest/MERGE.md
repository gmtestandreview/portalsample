# Consolidation record — 2026-11-06

This records the merge of two duplicate `vitest` skills into a governance skill
plus a quarantined API-snapshot skill. It is **not** a claim of runtime or
deployment validation; behavioral evidence remains `NHR` (see below).

## Inputs (both previously `name: vitest`)

- **Skill A** — `vitest/` (23 files): project governance + a 16-file remediated
  upstream Vitest API snapshot + migration guard + provenance + markdown evals.
- **Skill B** — `vitest-skill-validated/` (15 files): project governance +
  unique seven-suite `supplied-test-contracts.md` + dedicated
  `storybook-browser.md` + JSON evals + optimization/validation reports.

## Decision and rationale

Split by concern, merge by duplication:

- **`vitest/`** = merged governance skill (this directory).
- **`vitest-api-snapshot/`** = the 16 raw API references, quarantined for
  deletion when the project goes online.
- **`vitest-skill-validated/`** = removed after salvage.

Evidence driving the split: the governance halves are near-duplicate and
additive, while the API snapshot has a different owner/decay rate and is
deletable at the online transition. A removed-API grep (2026-11-06) over both
reference sets found **A's 16 refs clean** (0 executable removed-API examples in
the audited pattern set) and **B's consolidated refs carrying 2 defects**
(`test-api.md` `test.sequential`; `utilities.md` bare `vitest --tags`).
Therefore A's reference set became the snapshot base and B's API refs were
retired rather than merged.

## What moved where

| From                                                           | To                                | Treatment                                                            |
| -------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------- |
| A `SKILL.md` + B `SKILL.md`                                    | `vitest/SKILL.md`                 | Merged (governance only; routes API syntax to `vitest-api-snapshot`) |
| A `references/project-nmi-portal.md`                           | kept in `vitest/references/`      | Preserved; + B's snapshot-format note appended                       |
| B `references/supplied-test-contracts.md`                      | `vitest/references/`              | Salvaged (unique)                                                    |
| B `references/storybook-browser.md`                            | `vitest/references/`              | Salvaged (unique; carries 10.5.10/10.6.5 caveat)                     |
| A `references/vitest-5-compatibility.md`                       | kept in `vitest/references/`      | Preserved (version guard; deeper than B's)                           |
| A `evals/*.md`                                                 | kept in `vitest/evals/`           | Preserved                                                            |
| B `evals/*.json` (3)                                           | `vitest/evals/`                   | Salvaged (machine-readable)                                          |
| A 16 `references/{core,features,advanced}-*.md`                | `vitest-api-snapshot/references/` | Relocated (quarantined)                                              |
| A `GENERATION.md`                                              | `vitest-api-snapshot/`            | Relocated (upstream provenance)                                      |
| A `MAINTENANCE.md`                                             | kept in `vitest/`                 | Preserved                                                            |
| B `OPTIMIZATION-REPORT.md`, `GREEN-RED-AMBER-VALIDATION.md`    | `vitest/B-*.md`                   | Salvaged as provenance                                               |
| B `references/{test-api,mocking,utilities,advanced,config}.md` | **not carried**                   | Retired (A's clean set supersedes; B's had 2 removed-API defects)    |

## New governance behavior added at merge

- **Operating-mode boundary** (offline snapshot vs online repository): downgrade
  `NHR` to real checks when the live repo/`node_modules` are reachable; forbid
  fabricating contents/results in offline mode.
- **Coverage exclusion list as monitored debt**: preserve by default, but flag
  exclusion-list growth as coverage-policy drift requiring review.

## Verification at merge time

- Static: directory structure (governance refs = 4, evals = 5, snapshot refs =
  16), removed-API regression grep, internal link check — see the session audit.
- `NHR` (unchanged from both sources): Vitest 5.0.5 runtime, TypeScript
  type-check, Storybook Test-panel, CI, and agent RED/GREEN activation. These
  require the live online repo + installed dependencies.

## Rollback

Pre-merge copies of both original skill directories are preserved at
`…/scratchpad/vitest-merge-backup-20261106/` (session scratchpad). To revert,
restore `vitest/` and `vitest-skill-validated/` from that backup and delete
`vitest-api-snapshot/`. Do not use these skills to rewrite application project
configs without separate authorization.
