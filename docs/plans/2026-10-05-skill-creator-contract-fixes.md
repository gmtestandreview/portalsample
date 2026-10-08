# Skill-creator contract fixes implementation plan

## Goal and source inputs

Correct the demonstrated contracts from
[the SWOT assessment](../skill-reviews/2026-10-05-writing-skills-vs-skill-creator-swot.md),
preserve historical evidence, and establish fresh claim-matched verification.
Source inputs are that report's C0–C12 findings and the current
`.claude/skills/skill-creator` package. The parent inspected
`aggregate_benchmark.validate_summary`, `_validate_run_semantics`,
`utils.parse_skill_md`, packager exclusions, trigger-review CLI, comparison
schema and review-page rendering before planning.

## Assumptions and unknowns

- Existing accepted legacy grading without expectations remains explicitly
  supported.
- No supplied requirement mandates a new live provider campaign; current
  activation remains NHR and must not be upgraded by local fixes.
- No historical campaign, outcome, or date is silently rewritten. Clarifications
  live in a separate applicability/errata index.
- Main description/name remain unchanged. Packaging and UI fixes must preserve
  valid artifacts and escaping.
- Worktree `fix/skill-creator-contracts-20261005` isolates changes; baseline
  package copy is in
  `C:/Users/gregm/AppData/Local/Temp/skill-creator-contract-fix-20261005/baseline`.
- Blocking unknowns: none for demonstrated deterministic/prose corrections.
  Browser execution and current provider behavior require actual evidence before
  corresponding claims.

## Requirement traceability, files and responsibilities

All paths in this table are relative to `.claude/skills/skill-creator/`.

| Findings             | Exact files                                                                                                                                                      | Action and owner                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| C1                   | `scripts/aggregate_benchmark.py`, `scripts/Regression tests/test_aggregate_benchmark.py`                                                                         | Data-contract agent: reject grading summaries that contradict actual expectation truth counts                                                |
| C4                   | `references/schemas/comparison.schema.json`, `agents/comparator.md`, `references/schemas.md`, new `scripts/Regression tests/test_comparison_schema.py` if needed | Data-contract agent: synchronize absent-expectations contract, correct complete example, document controlled unrepresentable comparison path |
| C10                  | `scripts/utils.py`, `scripts/Regression tests/test_utils.py`                                                                                                     | Data-contract agent: decode valid YAML consistently with validator, retain deliberate compatibility                                          |
| C6                   | `scripts/package_skill.py`, `scripts/Regression tests/test_package_skill.py`                                                                                     | Distribution/UI agent: exclude environment, VCS and graph state without discarding legitimate nested eval resources                          |
| C8/C9                | `assets/eval_review.html`, `scripts/generate_eval_review.py`, `scripts/Regression tests/test_generate_review.py`, focused UI test if required                    | Distribution/UI agent: real DOM/browser label/focus checks and controlled CLI errors                                                         |
| C2/C3/C7/C11/C12     | `references/evaluation-workflow.md`, `references/authoring-craft.md`, six `references/claude-code-*.md`, `agents/grader.md`, `agents/analyzer.md`                | Parent: fix ordering, current protocol, navigation and actual example matching; preserve specialization                                      |
| C0/C5                | `SKILL.md`, `references/validation-results.json`, new development evidence/index under `evals/`                                                                  | Parent: explicit companion ownership and revision-bound evidence applicability; preserve immutable histories                                 |
| Verification/closure | New dated correction report and evidence/manifest in `docs/skill-reviews/`                                                                                       | Parent: current checks, issue disposition and revision identity; retain the original SWOT unchanged                                          |

## Framework fit

Use narrow independent file scopes, RED/GREEN regression tests and
evidence-based document verification. No architectural migration, new framework,
dependency, policy revision or deployment is needed. Existing Python/pytest/JSON
Schema tooling and the standalone browser UI are sufficient.

## Tasks

### 1. Establish preserved baseline

Completed before implementation: copy the package, create the ignored sparse
worktree, and run `python -B -m unittest scripts.test_regressions` and
`python -B -m pytest "scripts/Regression tests" -q -p no:cacheprovider --basetemp <task-scratch>/baseline-pytest`
from the creator root. Observed: 15 smoke tests and 143 regression tests plus
231 subtests pass; one Windows permission-bit skip. The existing audit supplies
actual independent counterexamples, not invented RED.

### 2. Correct data contracts, tests first

Add regression cases through the real aggregator, metadata parser and
comparison-schema consumer. Run each focused test before implementation and
observe the intended rejection/decoded-equality/optional-field failure.
Implement truth-count equality after validated expectation inputs; use YAML
semantics for accepted metadata; allow omission of comparison expectations while
retaining validation when supplied. Make the comparator example complete and
consistent. Run
`python -B -m pytest "scripts/Regression tests/test_aggregate_benchmark.py" "scripts/Regression tests/test_utils.py" "scripts/Regression tests/test_comparison_schema.py" -q -p no:cacheprovider`
after the final applicable test files exist; expected all pass with legacy
branches preserved.

### 3. Correct distribution and review behavior, tests first

Write actual archive-member assertions for task-owned `.venv`, `.git` and
`.tokensave` state; run RED before adding exclusions. Execute the CLI with
malformed trigger type/JSON and missing input; require concise nonzero errors
and no invalid new artifact. Execute the rendered review page against mixed
positive/negative rows; assert row-specific accessible names and that add
focuses the new positive query. Establish real browser/DOM RED before UI edits.
Run focused package/review tests after minimal fixes; valid fixture output
remains deterministic and escaped. Do not substitute source-string assertions
for UI behavior.

### 4. Correct instructional dependencies and authority

Move expectation definition/freeze before candidate execution and update all
downstream step references. Update hook output guidance from current official
docs, retaining event exceptions and local applicability. Resolve all 18 footer
links and the actual example mismatches. Add targeted navigation for long
conditional references/agent protocols. For prose, inspect links, headings and
example matching rather than inventing unit tests. Source/date-bound provider
guidance; do not claim local host enforcement from documentation alone.

### 5. Correct evidence applicability and handoff

Keep historical eval bytes unchanged. Add an index binding older description
PASS and current-description interrupted campaigns to their actual
applicability, with explicit NHR for current runtime acceptance. Replace the
unbound runtime validation PASS map with a pointer to dated development
evidence, preserving its original bytes in excluded `evals/` if relocated.
Generate fresh schema-validation evidence with command, runtime/dependencies,
source hashes and actual results. Main routing must distinguish this evidence
from production readiness and define creator's specialist ownership when
writing-skills is also active.

### 6. Integrate and independently verify

Run both complete local suites after the last source change, local quick
validation, JSON Schema checks, negative contract probes, actual browser
interaction, and targeted formatter/link checks. Request an independent
code/security review when an agent slot is available; inspect findings and fix
demonstrated issues. Compare baseline hashes to preserve history,
names/descriptions and unrelated writing-skills bytes. Copy only reviewed
changed/new creator resources into the user's working tree after checking source
baselines still match; run final relevant verification there. No commit,
installation or deployment is requested.

## Safety, rollback and verification

Worktree and baseline snapshot isolate and preserve recovery. Generated
fixtures/evidence stay task-owned or under excluded development evals. Do not
alter canonical policies or pre-existing writing-skills edits. Restore an
individual changed creator file from the baseline only if needed; never reset
the whole repository. Do not distribute actual local credentials/state. Before
each source read, apply the repository secrets scanner and stop on a real secret
finding.

## Final validation and execution handoff

Manual plan review: requirements map to independent exact file scopes; code
corrections require meaningful RED before GREEN; document corrections use
claim-matched checks; source preservation and NHR boundaries are explicit. No
critical drafting gaps identified. This is a local self-review, not independent
approval or executed outcome. The supported mode is concurrent execution of
Tasks 2–3 with the parent owning Tasks 4–6. User authorization covers the
corrections; no additional confirmation is needed. Planned checks are not PASS
until observed.
