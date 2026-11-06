# Quick Merge Plan — consolidate `vitest` and `vitest-skill-validated`

Early-planning deliverable only. This plan does **not** merge the skills, modify
source files, or execute scripts. A full audit and conditional merge require a
separate, explicit request. Statuses here describe the **planning deliverable**,
not a merged `SKILL.md`.

Sources reviewed (quick-review depth):

- `.claude/skills/vitest/SKILL.md` (full), `MAINTENANCE.md`, `GENERATION.md`,
  `references/project-nmi-portal.md` (full).
- `.claude/skills/vitest-skill-validated/SKILL.md` (full),
  `OPTIMIZATION-REPORT.md`, `GREEN-RED-AMBER-VALIDATION.md`,
  `references/project-contract.md` (full),
  `references/supplied-test-contracts.md` (full).
- Directory listings of both skills (all reference/eval filenames).

**Not deep-read** (filenames + provenance summaries only, so claims about their
bodies are INFERRED): the 16 granular API references in `vitest/references/*`,
the 5 consolidated references in `vitest-skill-validated/references/*`
(`test-api`, `mocking`, `utilities`, `advanced`, `config`),
`storybook-browser.md`, `version-and-configuration.md`,
`vitest-5-compatibility.md`, and all eval files (`evals/*.md`, `evals/*.json`).
Exhaustiveness of Preserve/Conflicts is bounded to this depth.

---

## 1. Executive Summary

Both skills are **divergent optimization branches of the same original**
`vitest` Agent Skill, both generated from the identical upstream Vitest snapshot
(`GENERATION.md` SHA `4a7321e10672f00f0bb698823a381c2cc245b8f7`, 2026-01-28) and
both hardened against the **same** supplied `nmi-portal` config snapshots.
SOURCE-SUPPORTED: `vitest/MAINTENANCE.md` and
`vitest-skill-validated/OPTIMIZATION-REPORT.md` both cite the same upstream SHA,
the same Vitest `5.0.5` / Node `>=24.21.0` / Storybook `10.6.5` pins, and the
same runner-ownership model.

- **`vitest` (Branch A):** longer SKILL (116 lines), rich `metadata:`
  frontmatter (author/version/source/revisions), **16 granular** API topic
  references, dedicated `vitest-5-compatibility.md`, Markdown evals (P17–P22
  governance, R01–R04 retrieval near-misses), `MAINTENANCE.md` + `GENERATION.md`
  provenance.
- **`vitest-skill-validated` (Branch B):** leaner SKILL (58 lines),
  `license: MIT` frontmatter (no author/version metadata), **~5 consolidated**
  API references, and three pieces of unique governance:
  `supplied-test-contracts.md` (a 7-suite GREEN/RED/AMBER playbook over real
  `.test.ts` files), `storybook-browser.md`, and JSON evals with recorded static
  source-mapping results.

**Main overlap:** purpose (project governance + Vitest 5 API), the runner-
ownership matrix, coverage policy, version guards, and NHR evidence discipline
are near-equivalent in substance. **Complementary strengths:** A = granular API
disclosure + migration reference + provenance discipline; B = per-suite contract
governance + Storybook-addon depth + machine-checkable evals.

**Significant redundancy:** two project-contract references
(`project-nmi-portal.md` vs `project-contract.md`) state the **same** repo
policy with **no contradictory facts** — redundant, not conflicting.

**Major conflict / risk:** both declare `name: vitest`. HIGH — two skills with
the same activation name cannot coexist cleanly; this is the core reason to
consolidate. Secondary conflicts are structural (frontmatter schema, reference
granularity, eval format), not behavioral.

**Suitability:** Good candidate for consolidation. The two are the same skill on
two evolution paths; merging into one canonical `vitest` skill removes the name
collision and unions complementary material. **A full audit is recommended**
before merging, because reference bodies were not deep-read and all behavioral/
runtime evidence in both branches is self-declared `NHR`.

**Verification approach:** traceable document inspection and instruction
comparison at quick-review depth. No runtime, agent-activation, or CI validation
was performed or is implied. **Material limitation:** reference-file bodies and
eval files were not opened; behavioral equivalence is asserted from SKILL.md and
provenance docs only.

---

## 2. Source Summary

| Source                                                | Purpose                                              | Key Responsibilities                                                                              | Notable Constraints                                                                        | Unique Material                                                                                                                                                                         |
| ----------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Branch A** `.claude/skills/vitest/`                 | Vitest 5 API reference **and** nmi-portal governance | Ownership/precedence routing; smallest-change + evidence discipline; 16-topic conditional loading | Vitest 5.0.5; activate only on established Vitest ownership; snapshot ≠ global default     | `metadata:` provenance frontmatter; `vitest-5-compatibility.md`; 16 granular API refs; Markdown evals (P17–P22, R01–R04); `MAINTENANCE.md`, `GENERATION.md`                             |
| **Branch B** `.claude/skills/vitest-skill-validated/` | nmi-portal Vitest governance + Vitest 5 API          | "Decide ownership first" routing; execution boundaries; per-suite contract preservation           | Vitest 5.0.5; `license: MIT`; `watch:false`, unit 100% threshold, Storybook runtime bridge | `supplied-test-contracts.md` (7-suite GREEN/RED/AMBER); `storybook-browser.md`; JSON evals + recorded source-mapping results; `OPTIMIZATION-REPORT.md`, `GREEN-RED-AMBER-VALIDATION.md` |

**Reviewed in full:** both `SKILL.md`; A `project-nmi-portal.md`; B
`project-contract.md`, `supplied-test-contracts.md`; both branches' provenance/
validation `.md` reports.

**Named but not examined (bodies unavailable to this review):** A's
`references/{core-cli,core-config,core-describe,core-expect,core-hooks,core-test-api,features-concurrency,features-context,features-coverage,features-filtering,features-mocking,features-snapshots,advanced-environments,advanced-projects,advanced-type-testing,advanced-vi}.md`
and `vitest-5-compatibility.md`; B's
`references/{test-api,mocking,utilities,advanced,config,storybook-browser,version-and-configuration}.md`;
all `evals/*` in both branches.

---

## 3. Target Skill

- **Name:** `vitest` — SOURCE-SUPPORTED (both branches already use this; the
  merge must resolve to exactly one skill with this name).
- **Purpose:** Hybrid — enforce nmi-portal Vitest testing contracts **and**
  supply version-correct Vitest 5.0.5 API guidance. SOURCE-SUPPORTED (both state
  this).
- **Activation description:** `[missing]` as a single agreed string.
  **RECOMMENDED** synthesis: adopt Branch B's concrete config-file naming
  (`vitest.config.ts`, `vitest.unit.config.ts`, `vitest.storybook.config.ts`,
  `@storybook/addon-vitest`, Browser Mode, Vitest 5 migration) **plus** Branch
  A's sharper non-activation list (Playwright-only E2E/BDD/API-contract;
  Jest-only / `node:test` / runner-neutral; "matcher names or the word
  _Playwright_ alone are insufficient"; Storybook BDD via
  `playwright.storybook.config.ts` is **not** Vitest Browser Mode). Label
  RECOMMENDED, not source-established.
- **Intended users:** `[missing]` (not stated in either skill). INFERRED:
  agents/ developers doing Vitest work in the nmi-portal snapshot repo.
- **Expected outputs:** smallest correct test/config/diagnosis/review that is
  behaviorally correct, Vitest 5.0.5-compatible, project-consistent, with run
  commands + outcomes or explicit `Needs Human Review`. SOURCE-SUPPORTED (both
  "Objective/Acceptance" sections agree).

---

## 4. Preserve

Priorities: Critical / High / Medium / Low. Exhaustiveness limited to
quick-review depth; unexamined reference bodies may hold further unique
material.

| Source / Section                                                      | Content to Preserve                                                                                                                                                                 | Reason                                                                 | Priority     |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------ |
| B `supplied-test-contracts.md`                                        | 7-suite GREEN/RED/AMBER playbook; negative-assertion-is-success rule; "tested subject ≠ runner owner"; exact regex/path/sentinel preservation                                       | Unique, safety/correctness-critical governance with no equivalent in A | **Critical** |
| A + B — runner/ownership matrix                                       | Unit vs Storybook Browser Mode vs Playwright E2E/BDD/API-contract separation; no cross-owner migration without authorization                                                        | Core correct-execution contract; prevents mis-routing                  | **Critical** |
| A `project-nmi-portal.md` + B `project-contract.md` — coverage policy | Unit 100% thresholds; verbatim exclusion arrays; `reportOnFailure`; Storybook ≠ unit thresholds; never add `coverage.all`                                                           | Safety: prevents silent coverage weakening                             | **Critical** |
| A + B — version guard                                                 | Vitest 5.0.5 only; reject `coverage.all`, legacy string Browser provider, `poolOptions.threads`; verify against installed types                                                     | Correctness/compat; prevents removed-API regressions                   | **Critical** |
| A + B — evidence/NHR discipline                                       | Run narrowest check first; report exact commands/outcomes or `Needs Human Review`; never claim unexecuted passes; don't mask with `.only`/`allowOnly`/retries/relaxed thresholds    | Reliability + integrity guardrail                                      | **Critical** |
| A `project-nmi-portal.md` runtime constraints                         | `VITEST_STORYBOOK` direct-leaf branch (~2s vs ~50s, 30s addon abort); `watch:false` default; `127.0.0.1:47005`; `optimizeDeps`; `vitest.storybook.runtime.ts` JSON-exclusion bridge | Project-specific workarounds that must survive edits                   | **High**     |
| B `storybook-browser.md` (INFERRED from reports)                      | Addon child fast path, Chromium `playwright({})` provider, runtime bridge, scoped error filtering                                                                                   | Storybook-addon depth not clearly present in A                         | **High**     |
| A `vitest-5-compatibility.md` (INFERRED)                              | Consolidated Vitest 4→5 migration exclusions + supported alternatives                                                                                                               | Migration coverage; verify overlap vs B `version-and-configuration.md` | **High**     |
| A — conditional load table (16 topics)                                | Granular per-topic API routing                                                                                                                                                      | Progressive disclosure; smaller context loads                          | **Medium**   |
| B — "Decide ownership first" numbered routing                         | Ownership-before-API decision order                                                                                                                                                 | Clear decision structure                                               | **Medium**   |
| A `metadata:` frontmatter + `GENERATION.md`/`MAINTENANCE.md`          | author/version/source/revision + upstream provenance + rollback record                                                                                                              | Provenance/traceability; B lacks explicit version/source               | **Medium**   |
| B JSON evals + source-mapping results                                 | Machine-checkable activation + GREEN/RED/AMBER definitions                                                                                                                          | Test definitions (not executed evidence); reusable for audit           | **Medium**   |
| A Markdown evals P17–P22, R01–R04                                     | Governance + retrieval near-miss cases                                                                                                                                              | Additional activation coverage to port into canonical eval set         | **Medium**   |

---

## 5. Remove or Relocate

| Source / Section                                     | Content                                                                                      | Proposed Action                                                                            | Reason / Risk                                                                                                                                                                                                                |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A `project-nmi-portal.md` vs B `project-contract.md` | Two project-contract references                                                              | **Deduplicate** into one (keep the superset)                                               | Same repo policy, no contradictory facts; keeping both duplicates governance. Risk: lossy merge could drop A's narrowest-validation steps or exclusion discussion — merge as **superset**, verify line-by-line in full audit |
| A vs B generic API references                        | 16 granular (A) vs ~5 consolidated (B) covering overlapping Vitest APIs                      | **Needs user decision** (granular vs consolidated), then Deduplicate                       | Overlapping API content; equivalence NOT established at quick-review depth (bodies unread). Do not delete either set until full audit confirms coverage parity                                                               |
| A Markdown evals vs B JSON evals                     | Two eval formats                                                                             | **Relocate/Reword** into one canonical format (JSON RECOMMENDED — already machine-checked) | Divergent formats fragment the eval harness. Port A's unique cases into the chosen format; do not drop cases                                                                                                                 |
| Duplicated frontmatter identity                      | Two `name: vitest`                                                                           | **Reword** to one skill directory, one name                                                | Name collision (see Conflicts). The merged skill keeps `name: vitest`; the other directory is retired                                                                                                                        |
| Both — provenance/validation reports                 | `MAINTENANCE.md`, `GENERATION.md`, `OPTIMIZATION-REPORT.md`, `GREEN-RED-AMBER-VALIDATION.md` | **Keep as optional note** / consolidate into one provenance + validation record            | Historical value; keep but merge to avoid contradictory version histories                                                                                                                                                    |

No content is recommended for outright **Remove** at this depth; unverified
equivalence defaults to preservation/relocation per the planner rules.

---

## 6. Conflicts

| Conflict / Sources                                                                               | Branch A Position                                                                          | Branch B Position                      | Recommended Resolution                                                                                                                                                                    | Risk       |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Activation name (A SKILL fm vs B SKILL fm)                                                       | `name: vitest`                                                                             | `name: vitest`                         | Produce ONE skill named `vitest`; retire the other directory. Core driver of the merge                                                                                                    | **High**   |
| Frontmatter schema (A fm vs B fm)                                                                | `metadata:` block (author, version, source, source-revision, local-revision); no `license` | `license: MIT`; no metadata block      | Keep author/version/source **and** `license`. **[REVIEW REQUIRED]**: validate field names/nesting against the skill frontmatter spec via the `writing-skills` validator before finalizing | **Medium** |
| Reference granularity (A table vs B table)                                                       | 16 granular topic files                                                                    | ~5 consolidated files                  | **Needs user decision**; default RECOMMENDED = granular (smaller context loads), but only after confirming consolidated files contain no unique examples                                  | **Medium** |
| Eval format (A `evals/*.md` vs B `evals/*.json`)                                                 | Markdown cases                                                                             | JSON cases + recorded results          | Adopt JSON as canonical (machine-checkable); port A's Markdown cases in                                                                                                                   | **Low**    |
| Project-contract naming/detail (A `project-nmi-portal.md` vs B `project-contract.md`)            | More detailed (exclusion discussion, narrowest-validation steps)                           | More compact                           | Merge to superset under one filename; no factual conflict found                                                                                                                           | **Low**    |
| Vitest-5 migration placement (A `vitest-5-compatibility.md` vs B `version-and-configuration.md`) | Dedicated migration reference                                                              | Migration folded into config reference | Pick one home for migration guidance; **[REVIEW REQUIRED]** confirm neither drops exclusions (bodies unread)                                                                              | **Medium** |

No behavioral/policy contradiction (thresholds, scripts, ownership, version
pins) was found between the branches at quick-review depth.
