<!-- markdownlint-disable-file -->

# Rubric: Simplify npm Script Workflows

### 1) Rubric scope

- What this rubric evaluates: Whether a software development plan for
  simplifying and rationalising the repository's npm scripts is ready for
  controlled implementation.
- In scope:
  - Removal or retention of aliases and duplicate entry points.
  - Correct naming and separation of development, checking, testing, CI,
    Storybook, E2E, and release workflows.
  - Preservation of required behavior and compatibility for existing callers.
  - Resource usage, command portability, sequencing, validation, migration, and
    rollback planning.
- Out of scope:
  - Whether the scripts have already been edited successfully.
  - Whether the application, tests, Storybook, or CI actually pass.
  - New product requirements, infrastructure changes, or performance targets not
    stated in the available inputs.
  - Generating Green, Red, or Edge test cases.

### 2) Inputs used

- Source inputs:
  - User-provided npm `scripts` inventory from `package.json`.
  - Prior planning discussion identifying aliases, overlapping workflows,
    misleading aggregate names, CI duplication, heap configuration, and possible
    CI parallelisation.
  - Repository instructions describing the available validation scripts and
    expected command environment.
- Missing inputs:
  - Formal research artifact under `.copilot-tracking/research/`.
  - Formal plan artifact under `.copilot-tracking/plans/`.
  - Details artifact under `.copilot-tracking/details/`.
  - Implementation prompt under `.copilot-tracking/prompts/`.
  - Evidence from the implementations of custom scripts such as
    `verify-vite-runtime.mjs`, `lint-remediation-gate.mjs`, and
    `run-storybook-build.mjs`.
  - Evidence of external CI, hosting, developer, or automation callers of the
    current script names.
- Assumptions:
  - The objective is limited to simplifying npm script entry points and
    workflows without changing application behavior.
  - The pasted script inventory is the current intended baseline, but the plan
    must verify repository reality before implementation.
  - Missing upstream artifacts limit the rubric to observable planning quality,
    not implementation-specific acceptance details.

### 3) Critical fail conditions

- The plan removes, renames, or changes the semantics of a script without an
  explicit caller-impact check and compatibility or migration decision.
- The plan proposes deleting an alias or aggregate command without identifying
  its replacement and the evidence needed to confirm that no required automation
  depends on it.
- The plan changes CI, test, build, or release command behavior without defining
  regression validation that covers the affected workflow.
- The plan relies on unsupported assumptions about custom script behavior, CI
  configuration, hosting requirements, package-manager behavior, or memory
  limits and provides no repository inspection step to verify them.
- The plan recommends running potentially expensive or parallel commands without
  addressing resource contention, especially where multiple commands reserve
  large Node.js heaps.

### 4) Scoring model

- Total points: 100.
- Scoring scale: Each criterion is scored independently using the full, partial,
  and no-credit guidance in the rubric table.
- Critical fail rule: Any critical fail makes the overall rating `Failing`
  regardless of numeric score.
- Evidence rule: Unsupported claims receive no credit for the affected portion
  of a criterion.
- No plan score is produced in this rubric-creation phase; the table defines the
  scoring model for the later validation phase.

### 5) Rubric table

|   # | Criterion                                                  | Weight | What success looks like                                                                                                                                                                                    | Observable evidence required                                                                                                                                                              | Scoring guidance                                                                                                                                                                                                                                                                                               | Common failure patterns                                                                                                                                                                             |
| --: | ---------------------------------------------------------- | -----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Goal and requirements alignment                            |     10 | The plan states that the goal is to reduce script duplication and ambiguity while preserving required development, test, build, CI, and release capabilities.                                              | A clear objective, affected script categories, explicit non-goals, and a definition of simplification that does not equate to deletion alone.                                             | Full: objective and non-goals are explicit and aligned. Partial: objective is present but one major workflow or boundary is unclear. None: the plan is a generic cleanup or changes behavior without stating the goal.                                                                                         | Treating fewer scripts as the only success measure; introducing unrelated application changes; omitting CI or release behavior.                                                                     |
|   2 | Current-state evidence and traceability                    |     12 | The plan verifies the current package scripts, custom script implementations, repository instructions, and relevant automation callers before deciding what to remove or rename.                           | Named files or inspection steps, an inventory of aliases and aggregates, and a mapping from each proposed change to its evidence source.                                                  | Full: every proposed change is traceable to verified repository evidence. Partial: the main inventory is checked but custom scripts or callers are not. None: decisions rely only on names or the prior discussion.                                                                                            | Assuming aliases are unused; treating script names as proof of behavior; ignoring custom `.mjs` implementations or CI configuration.                                                                |
|   3 | Duplicate and overlap analysis                             |     12 | The plan distinguishes exact aliases, intentional variants, and genuinely redundant workflows, including differences in coverage, reporters, watch mode, configuration, build steps, and output files.     | A classification table or equivalent mapping for aliases such as `dev`/`start`, formatting aliases, Storybook docs aliases, BDD aliases, and CI variants.                                 | Full: categories are complete and semantic differences are documented. Partial: obvious aliases are identified but variant behavior is incompletely explained. None: commands are called duplicates solely because their names are similar.                                                                    | Deleting CI variants because they resemble local tests; merging watch and one-shot commands; overlooking JUnit or coverage differences.                                                             |
|   4 | Simplification design and naming                           |     14 | The plan proposes a coherent, small public command surface with predictable naming, clear aggregate boundaries, and explicit replacements for retained or removed commands.                                | Before/after command taxonomy, rename/remove/retain decisions, replacement commands, and rationale for names such as `test:all`, `test:e2e`, `lint`, and `migration-check`.               | Full: the target model is internally consistent and every changed entry point has a disposition. Partial: a useful target model exists but one category or replacement is vague. None: the plan only lists cleanup ideas without an implementable target structure.                                            | Calling `test:all` complete while excluding suites; hiding builds or coverage inside ordinary test commands; adding more aliases to solve naming confusion.                                         |
|   5 | Workflow semantics and dependency sequencing               |     12 | The plan preserves required ordering, makes prerequisites explicit, and separates normal development commands from CI, release, coverage, and diagnostic workflows.                                        | Dependency graph or ordered workflow descriptions covering Vite verification, Storybook builds, generated BDD tests, coverage, reports, and post-install behavior.                        | Full: dependencies and side effects are explicit for each aggregate workflow. Partial: primary ordering is covered but one prerequisite or generated-output step is omitted. None: commands are reorganised without considering sequencing or generated artifacts.                                             | Running Storybook E2E before building the required Storybook output; making runtime verification depend on an undocumented prior build; treating `postinstall` as an ordinary test.                 |
|   6 | Portability, resource use, and operational safety          |     12 | The plan specifies the intended shell/package manager context, avoids fragile platform assumptions, and justifies heap limits, parallelism, generated paths, and cleanup behavior.                         | Commands or command patterns compatible with the repository environment, expected pass/fail behavior, memory assumptions, and a decision on whether CI parallelisation is safe.           | Full: portability and resource trade-offs are explicit and validated. Partial: command execution is clear but memory, parallelism, or shell portability is under-specified. None: the plan proposes broad parallelism, heap changes, or destructive cleanup without safeguards.                                | Removing the 8 GB heap without measuring; parallelising several 8 GB processes on a constrained runner; using shell-specific syntax without a fallback; cleaning broad directories.                 |
|   7 | Testing and validation strategy                            |     16 | The plan validates both the new command surface and unchanged behavior, including type-checking, linting, unit tests, Storybook tests/builds, regression tests, API contracts, and relevant E2E workflows. | A validation matrix with commands, affected workflow, expected exit code or observable output, report locations where applicable, and regression coverage for renamed or removed scripts. | Full: every changed workflow has a concrete pass/fail check and at least one regression check beyond the original command. Partial: core tests are listed but one affected workflow or expected result is missing. None: validation is limited to inspecting `package.json` or running one happy-path command. | Validating only that npm can parse the file; omitting Storybook or E2E after changing their orchestration; not checking JUnit/coverage outputs; relying on stale servers or generated tests.        |
|   8 | Migration, adoption, rollback, and documentation readiness |      8 | The plan explains how developers and automation move from old names to new names, when compatibility aliases remain, how changes are rolled back, and when documentation is updated.                       | Caller migration steps, deprecation/removal policy, rollback path, changed documentation locations, and a requirement to rerun documented commands after documentation changes.           | Full: adoption and rollback are executable and tied to validation evidence. Partial: migration is described but rollback or documentation verification is incomplete. None: names are changed with no consumer migration or recovery plan.                                                                     | Breaking external CI or hosting callers; deleting aliases immediately; updating docs without rerunning commands; claiming rollback is `git revert` without identifying generated or external state. |
|   9 | Tracking, risks, and handoff completeness                  |      4 | The plan records unresolved decisions, deferred items, blockers, and follow-up ownership without inventing facts.                                                                                          | A concise TODO or decision register with stable IDs, status, evidence, dependencies, and next steps for unresolved caller, custom-script, and resource questions.                         | Full: all material uncertainties are tracked with actionable next steps. Partial: risks are listed but lack evidence or next action. None: open questions are hidden or presented as settled facts.                                                                                                            | Leaving caller discovery as an informal note; marking an item resolved without evidence; inventing owners, dates, or CI constraints.                                                                |

### 6) Overall rating bands

- Excellent: 90-100. Implementation-ready with strong evidence, clear scope, and
  executable validation. Proceed to implementation after normal review.
- Strong: 80-89. Ready with minor clarifications that do not change the chosen
  direction.
- Adequate: 70-79. Plausible but requires targeted revisions before
  implementation.
- Weak: 50-69. Significant gaps in evidence, sequencing, compatibility, or
  validation. Do not implement yet.
- Failing: 0-49. The plan is not implementation-ready.
- Critical fail effect: Any critical fail sets the rating to `Failing`,
  regardless of numeric score.

### 7) Boundary and ambiguity notes

| Area                       | Ambiguity                                                                                                            | Tie-break rule                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Alias removal              | A script may look redundant but still be called by external CI, hosting, or developer tooling.                       | Require caller inspection or retain a compatibility alias. Do not award full credit for removal based on `package.json` alone.              |
| Custom script behavior     | Names such as `verify:vite-runtime` and `lint:remediation:gate` do not establish what the scripts inspect or modify. | Treat behavior as unverified until the implementation is inspected or the plan includes an explicit inspection step.                        |
| `test:all` scope           | “All” may mean all local Vitest suites or every validation workflow.                                                 | Award full naming credit only if the plan defines the scope or renames the command to reflect its actual contents.                          |
| CI parallelism             | Independent commands may still compete for memory, ports, files, or generated output.                                | Require resource and output isolation evidence before awarding full parallelisation credit.                                                 |
| Coverage placement         | Coverage can be a required gate or an expensive optional workflow.                                                   | Do not require removal; require an explicit rationale, threshold/output validation, and placement appropriate to the stated CI goal.        |
| Documentation-only impact  | Script renames may not change application runtime but can change contributor and automation behavior.                | Require adoption and rollback notes even when deployment steps are out of scope.                                                            |
| Exact file paths           | The final target files for script changes may be known only after repository inspection.                             | Award credit when the plan defines inspection, update-versus-create rules, and validation of selected paths; do not require invented paths. |
| Missing upstream artifacts | Formal research and plan files were not provided for this rubric.                                                    | Evaluate only the pasted inventory, prior planning discussion, and repository instructions; mark unsupported details as missing inputs.     |

### 8) Rubric quality check

- Are all criteria measurable? Yes; each criterion requires observable plan
  evidence and defines full, partial, and no-credit outcomes.
- Are any criteria duplicated or overlapping? No material overlap; duplicate
  analysis, target design, sequencing, and validation are separated by decision
  purpose.
- Are any criteria too vague to support test cases? No; later validation can
  inspect the named evidence and failure signals without relying on subjective
  terms alone.
- Are there any missing software-development-plan quality dimensions? The
  relevant dimensions for npm workflow simplification are covered: scope,
  evidence, semantics, portability, resources, validation, migration, rollback,
  and tracking.
- Would two evaluators likely score the same software development plan
  similarly? Yes, provided they use the stated evidence and tie-break rules.
- Are the criteria strict enough to separate green, red, and edge cases? Yes;
  critical fails and boundary notes distinguish unsupported removals, incomplete
  aggregates, resource conflicts, and documentation-only changes.
- Total points check: 100.
- Test cases generated: No.
- Plan scored: No.
- Final self-check result: Pass.
