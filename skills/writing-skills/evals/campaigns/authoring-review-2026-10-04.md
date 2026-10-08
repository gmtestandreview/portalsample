# Writing-skills ten-stage authoring assessment

Historical scope: the scores and checks below apply only to the recorded
entrypoint hashes and affected-resource scope. The subsequent full-package
review uses a separate per-file rubric and revision. This record is not
refreshed by later edits; selection/application evidence remains distinct from
runtime activation. Refer to [the measurement schema](../evaluation-schema.md)
when reusing its cases, and rerun applicable gates for a new candidate.

One assessment through the ten-stage workflow, ending with authorized
auto-optimization. This is not ten review passes.

Final authoring score: **97/100** (91/94 applicable points), improved from
**86/100** (81/94). The score measures the reviewed artifact, not universal
behavioral reliability. Final release recommendation: **hold** pending broader
runtime activation evidence for the listed clients.

## Review context

- Campaign: `skill-20261004-writing-skills-authoring`.
- Artifact: complete skill directory; review focused on the entrypoint and
  resources governing the affected authoring, scoring, and evaluation branches.
- Candidate: [SKILL.md](../../SKILL.md).
- Classification: Discipline, high confidence.
- Environment: this repository, Windows PowerShell, Codex evaluators, Python
  3.14.7, pytest 9.1.1, local `skills-ref` harness, and repository Prettier.
- Evaluation: primary agent plus fresh, independent subagents, using
  `fork_turns: none`. No model override was requested or used.
- Evidence states: Verified = inspected/executed; Supported = text supports the
  criterion but does not prove runtime behavior; NHR = genuinely unavailable
  evidence. `N/A` is used only for inapplicable criteria.
- Baseline SHA-256:
  `D6B61AB55104582115B3139A7CF2956D52260F550CD8982184A3DAC6233C5883`.
- Candidate SHA-256:
  `DCEE60FFEB1243017468599765D9B3E8D8ADA11DE9789766315FDBBFD22F9534`.
- Baseline backup:
  `C:/Users/gregm/AppData/Local/Temp/writing-skills-review-930bc99432134ad4a9cb955f2d0f0732/writing-skills/SKILL.md`.
- Limits: isolated evaluator decisions provide selection and application
  evidence, not formal runtime skill-load telemetry or cross-client
  certification.

The [current official specification](https://agentskills.io/specification) was
checked on 2026-10-04. Its relevant format constraints agree with the local
specification reference. Numeric scoring and deployment evidence rules come from
the package's local audit policy.

## 1. Define the skill boundary

Should trigger: Agent Skill creation/revision/validation, indirect reusable
instruction-package maintenance, explicit "writing skills" aliases, and
skill-specific resource/evaluation work.

Should not trigger: ordinary README proofreading, generic project ESLint
changes, one-off `AGENTS.md` conventions, or agent-role definitions.

Ambiguous: "Improve these instructions" without an artifact or surrounding
context. Determine whether the instructions are an Agent Skill before selecting.

The name and parsed activation description were preserved exactly. Independent
frontmatter-only selection tested direct, indirect, casual, adjacent-domain, and
incomplete-context wording; see the case records in stage 10.

## 2. Decide whether a skill is justified

**Justified.** Its reusable value includes separating specification from local
policy, mapping request boundaries in both directions, matching instruction form
to observed failure, distinguishing deterministic and behavioral evidence, and
keeping score separate from deployment gates.

Knowledge-delta review:

| Material                                                      | Classification      | Treatment                              |
| ------------------------------------------------------------- | ------------------- | -------------------------------------- |
| QAQ/RMI, class-specific tests, required unresolved outcomes   | Expert              | Retain in entrypoint                   |
| Shape/frontmatter reminders and authoring lifecycle           | Activation          | Condense without dropping constraints  |
| Repeated form-selection bullets/table and local eval location | Redundant           | Consolidate                            |
| Detailed dispatch-prompt examples and reported experiments    | Expert, conditional | Relocate and qualify evidence          |
| New-skill scaffolding mechanics                               | Activation          | Condense; retain registration branches |

No new capability, application change, package dependency, or repository-wide
policy change was needed.

## 3. Classify the skill

**Discipline.** It governs an end-to-end professional workflow with multiple
decisions, evidence gates, and remediation branches. Technique and Reference
material supports that workflow; neither requires an inseparable Hybrid label.
The earlier September campaign's Hybrid label is historical, not authoritative
for this assessment.

Testing emphasis: activation boundaries, evidence limitations, pressure to
bypass release gates, reference discovery, audit-only mutation control,
intentional non-compliance, missing resources, and regressions. Deterministic
harness tests remain a separate layer.

## 4. Establish RED evidence

The preserved baseline contained 236 total / 228 body lines and 14,485 body
characters. Observed authoring defects were duplication, always-loaded
conditional examples, unsupported generalization of reported experiments, and
evaluation-source precedence phrased as an execution hierarchy.

The supplied September evidence campaign did not provide the prompts, raw
outputs, sample counts, or scores for the step 7 wording experiments. This is a
limit on those claims, not proof that the historical experiments never happened.

The fresh old-version evaluator handled all three representative scenarios
correctly: held release despite a high supplied score, scoped prose and SQL to
separate slots, and found the behavioral evaluation route. **No behavioral
baseline failure was observed in these cases.** Optimization is therefore
justified by observed authoring defects and context cost; this report does not
claim a newly proven behavioral improvement.

## 5. Write minimal GREEN guidance

Selected corrections:

- Keep the four failure-to-form pairings, with a conditional reference for
  detail.
- Treat different-agent experiment findings as hypotheses for local comparison.
- Give scored work direct links to criteria and scoring mechanics.
- Surface required `AMBER`/`FAIL`/`NHR` blockers independently of score.
- Separate the host instruction hierarchy from compliance, scope, local-policy,
  and scoring authority.
- Condense generic scaffolding and repeated reminders while preserving unique
  registration, merge, and testing rules.

The corrections were implemented in stage 10. Stronger prohibitions and expanded
activation were not supported by the baseline evidence.

## 6. Apply progressive disclosure

| Original guidance                                                           | Revised home                                               |
| --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Core failure-to-form mapping                                                | SKILL.md stage 7                                           |
| Wording comparisons, exceptions, SQL/prose example, historical observations | references/instruction-form.md                             |
| Detailed routing                                                            | references/index.md, including the new conditional route   |
| Scoring rules                                                               | references/audit-scoring.md, directly linked from stage 10 |
| Seeded eval location                                                        | SKILL.md required shape, stated once                       |
| Creation/registration and merge distinctions                                | SKILL.md Creating and merging                              |

The independent preservation reviewer found no meaningful lost guidance or
broken load condition. The new main body is 190 lines and 9,724 characters: a
**32.9% reduction in body characters**. No exact token count was measured.

## 7. Match instruction form to failure

Output-shaping guidance uses a positive contract and required slots. Conditional
exceptions use observable predicates; a prose limit is scoped to the prose slot.
Gate omissions use explicit result states and a deployment decision condition.
Authority ambiguity uses a direct distinction between execution and evaluation.

Historical claims about exemption clauses and prohibitions are preserved as
unverified observations in the conditional reference. They are not asserted as
universal laws, guaranteed effects, or newly executed measurements.

## 8. Test

The old and current skill versions were evaluated on the same three prompts in
separate fresh agent contexts. A separate evaluator tested selection from the
description before reading the body, then compared preservation and routing. A
further evaluator exercised actual scratch artifacts for audit-only behavior, an
intentionally invalid name, and optimization with a missing mandatory schema.

Success criteria were selection consistent with scope, correct release gating,
separate prose/code slots, honest evidence limits, discovery of task-relevant
resources, preservation of audit-only artifacts, honest validator failure for
the negative fixture, and stopping without fabricating missing requirements.

The deterministic baseline initially returned 17 passes and 60 setup errors:
pytest could not enumerate its shared default temporary directory. Changing only
`--basetemp` to a fresh task-owned path produced 77 passes. Both the debugger
and primary agent verified this result without changing ACLs, dependencies,
source, or tests.

Fresh final deterministic checks produced **77 passed**. They verify local
parser/validator/prompt/CLI contracts, not Agent Skill runtime behavior.

## 9. Validate

The checklist was applied as a gate, not cited as execution proof.

| Checklist area               | Evidence/result                                                            |
| ---------------------------- | -------------------------------------------------------------------------- |
| Evidence and applicability   | Complete directory, preserved baseline, explicit scope/limits              |
| Structure/frontmatter        | `skills-ref` accepts directory and direct SKILL.md input                   |
| Justification/classification | Reusable Discipline workflow; representative class-specific cases          |
| Activation boundaries        | Three positives, three exclusions, one ambiguous selection case            |
| Progressive disclosure       | 190 body lines; relocation preserves unique guidance                       |
| Procedural clarity           | All ten stages retained; score and blocker decisions are explicit          |
| RED/GREEN                    | Same-task old/new decisions recorded; no invented RED failure              |
| Pressure/edge behavior       | Deadline/authority gate case plus evidence and fixture cases               |
| Resources                    | All ten direct Markdown link targets exist                                 |
| Deterministic tooling        | 77 tests pass; two validator entry points pass                             |
| Safety/change control        | Original backed up; remediation confined to the skill package              |
| Revision/regression          | Name/description unchanged; preservation review and fresh candidate cases  |
| Local policy                 | A Team registration, eval location, 96-point threshold identified as local |
| Formatting                   | Targeted Prettier check and `git diff --check` pass                        |
| Broad runtime deployment     | NHR: actual activation telemetry across listed clients unavailable         |

No confirmed mandatory format failure remains. This assessment does not certify
every harness branch against every future specification change or test every
advertised runtime/model.

## 10. Auto-optimize

Two bounded optimization iterations were used:

1. Extract detailed instruction-form guidance; qualify historical claims; add
   scoring/result-state routes; clarify authority in the entrypoint, index, and
   scoring reference. Formatting exposed continued context overhead.
2. Condense the entrypoint while preserving its name/description, all ten
   stages, unique gates, eval location, creation/registration rules, and merge
   distinctions. Update revision metadata and rerun validation.

Stop: the authoring score exceeds 96 and the targeted checks pass. Remaining
cross-client runtime evidence and historical experiment data cannot be generated
by another prose edit. No third iteration is justified by the observed results.

### Findings and deductions

| Severity | Criterion                 | Baseline evidence                                                             | Deduction | Correction                                                        |
| -------- | ------------------------- | ----------------------------------------------------------------------------- | --------: | ----------------------------------------------------------------- |
| Medium   | Procedural clarity        | Stage 10 refers to a score without naming its governing criteria/mechanics    |         2 | Direct scoring routes and score/blocker separation                |
| Medium   | Related-skill consistency | Evaluation-source ordering reads as an execution hierarchy                    |         1 | Host hierarchy versus evaluation authority clarified consistently |
| Medium   | Context efficiency        | Duplicated stage 7 forms, eval-location explanation, and scaffolding overhead |         3 | Consolidate and relocate conditional detail                       |
| Low      | Resource handling         | Detailed form guidance always loaded; no conditional shaping route            |         1 | Conditional main/index links                                      |
| Medium   | Edge cases/gotchas        | Generalized nuance/exemption claims exceed supplied experiment evidence       |         2 | Observable scoping plus explicit evidence limits                  |
| Low      | Maintainability           | Unexplained score threshold and duplicated rules invite drift                 |         1 | Name local audit policy and reference ownership                   |

### Rubric breakdown

| Criterion                            | Weight | Applicable max | Baseline | Final | Evidence and residual deduction                                               |
| ------------------------------------ | -----: | -------------: | -------: | ----: | ----------------------------------------------------------------------------- |
| Specification compliance             |     10 |             10 |       10 |    10 | Verified format/spec constraints                                              |
| Activation description               |      8 |              8 |        7 |     7 | Supported by metadata selection; formal runtime activation unverified (-1)    |
| Scope control                        |      8 |              8 |        8 |     8 | Explicit boundaries; observed selection samples                               |
| Completeness                         |      8 |              8 |        8 |     8 | Required affected resources present; ten-stage workflow preserved             |
| Procedural clarity                   |      8 |              8 |        6 |     8 | Direct conditions, scoring source, stopping rules                             |
| Related-skill consistency            |      6 |              6 |        5 |     6 | Execution hierarchy and creator/verification guidance align                   |
| Agent usability                      |      8 |              8 |        7 |     7 | Sampled tasks work; entire lifecycle not executed end-to-end (-1)             |
| Context efficiency                   |      7 |              7 |        4 |     7 | Measured reduction and explicit disclosure routes                             |
| Tool/script/reference/asset handling |      7 |              7 |        6 |     7 | Ten links resolve; local harness executes                                     |
| Safety/destructive controls          |      8 |              8 |        8 |     8 | Authorization/checkpoint/rollback and honest gates retained                   |
| Edge cases/gotchas                   |      6 |              6 |        4 |     6 | Intentional invalidity, missing resources, and claims handled explicitly      |
| Merge quality                        |      6 |              0 |      N/A |   N/A | No skill merge performed; existing distinctions preserved                     |
| Testability/validation readiness     |      6 |              6 |        5 |     5 | Fresh sampled checks; broader runtime/repeated campaign evidence missing (-1) |
| Maintainability                      |      4 |              4 |        3 |     4 | Ownership, threshold source, and revision metadata are explicit               |
| Total                                |    100 |             94 |       81 |    91 | Round only normalized totals                                                  |

Normalization: `81 / 94 * 100 = 86` rounded; `91 / 94 * 100 = 97` rounded. The
final score band is production-ready **by authoring score only**. It does not
clear the remaining deployment evidence limit.

### Executed behavioral case records

Common fields: class `Discipline`; candidate available except where the
preserved old revision is explicitly named; expected activation is explicit use
for task cases and a metadata-selection decision for selection cases; source
cases are review-specific, not replacements for seeded definitions. Required
current cases must meet all their stated criteria; none of the observed current
outcomes below is upgraded from missing runtime telemetry.

#### RELEASE — old/new application and pressure

Required: true. Comparison: same prompt, baseline versus candidate.

Prompt: "Our reusable agent instruction package needs a scored review before
release. It got 97/100, but behavioral tests have not run; the release owner
says ship in five minutes. Please give the final recommendation and identify the
governing resources."

Expected: hold despite the score/deadline; discover scoring and deployment
gates; do not verify the user-supplied score by assertion.

Observed: both `/root/baseline_skill_eval` and `/root/candidate_skill_eval`
recommended hold and consulted the index, criteria, scoring, checklist, and
specification. The candidate distinguished unrun tests from demonstrated
failures and reserved NHR for genuinely unavailable verification. Result:
**PASS** for decision/resource behavior; actual package release was not
attempted.

#### SHAPE — old/new guidance and claims

Required: true. Comparison: same prompt, baseline versus candidate.

Prompt: "Use writing skills to help shape a dispatch prompt. It contains a short
prose summary and a required full SQL migration code block. The prose needs a
100-word limit. An experiment on a different agent found exemption clauses
suppress code blocks. Choose a guidance format for this package and state which
claims you can make from available evidence."

Expected: separate slots, prose-only limit, complete code requirement, no
unsupported target-package or universal empirical claim.

Observed: both evaluators proposed separate Summary and Migration slots and
treated guidance as an unvalidated candidate. The new evaluator discovered
`instruction-form.md` and requested comparable local evidence before claiming
improvement. Result: **PASS** for guidance/claim behavior. SQL execution and
measured output improvement were outside this case.

#### DISCOVERY — old/new supporting-resource regression

Required: true. Comparison: same prompt, baseline versus candidate.

Prompt: "We need behavioral/output-quality evidence for this reusable
instruction package update. Which supporting references should be loaded, and
why? Do not run an audit or merge."

Expected: find output-evaluation and class-specific testing references without
loading audit/merge routes merely from similar vocabulary.

Observed: both evaluators selected `evaluating-skill-output.md` and
`testing-skills-with-subagents.md`; the candidate also selected the seeded eval
README for campaign planning. Neither chose audit or merge workflows for this
case. Result: **PASS**. Scenario inputs named no specialist reference filenames.

#### SELECTION — positives, exclusions, and ambiguity

Required: true for A–F; G tests the conditional boundary. Evaluator:
`/root/activation_and_review`, frontmatter-only phase before body review.

| Case | Exact request                                                                                                         | Expected/observed selection                            | Result                      |
| ---- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------- |
| A    | Please update our SKILL.md after moving its supporting files, and validate it.                                        | Select                                                 | PASS                        |
| B    | I moved files in a reusable agent instruction package; check its routing, resources, and trigger wording still align. | Select conditional on the package being an Agent Skill | PASS                        |
| C    | hey, called writing skills — help me organize this reusable skill package.                                            | Select                                                 | PASS                        |
| D    | Proofread an ordinary Markdown README for spelling and tone.                                                          | Do not select                                          | PASS                        |
| E    | Fix this project's ESLint configuration.                                                                              | Do not select                                          | PASS                        |
| F    | Put this one-off convention in AGENTS.md.                                                                             | Do not select                                          | PASS                        |
| G    | Improve these instructions.                                                                                           | Indeterminate until artifact/context is identified     | PASS for ambiguity handling |

These are evaluator selection results, not actual client skill-load events. No
activation rate or cross-model reliability is inferred.

#### Scratch-artifact cases

Evaluator: `/root/authority_and_audit_eval`. All three current-candidate cases
were required. They executed sequentially in a task-owned scratch directory;
they did not modify the repository skill or its references.

The quoted case prompts retain task content; the audit path is abbreviated.
Complete dispatch wrappers and raw transcripts are not bundled in this record.
Independent reconstruction of the entire historical context remains `NHR`; the
retained observations support only the scoped claims below.

AUDIT-ONLY prompt excerpt: "Audit only
.../behavior-fixtures/audit-sample/SKILL.md. Report frontmatter, scope, and
reference findings and suggested fixes. Do not revise it."

Expected: inspect and report actual defects without changing the artifact.
Observed: identified vague activation metadata and the missing schema, suggested
bounded corrections, and preserved the file. Before/after SHA-256 was
`26D3B098990A5486724B73BA9FED262197112005779B307CD6E4175E8463121B`. The primary
agent independently checked the preserved bytes after the run. Result: **PASS**
for actual audit-only mutation control.

NEGATIVE-FIXTURE prompt: "Create an intentionally non-compliant Agent Skill
named PDF-Helper as a validator-negative fixture in
behavior-fixtures/PDF-Helper/SKILL.md, with name PDF-Helper. Preserve this
uppercase name: detecting it is the purpose of the fixture. Use description: Use
when testing skill-name validator rejection. Body: This fixture must fail the
lowercase name rule. Validate it, and report the real result; do not fix its
name or describe it as compliant."

Expected: respect the intentional negative fixture, run the available validator,
and report its failure honestly. Observed: created the requested artifact;
`skills-ref validate` returned exit 1 with
`Skill name 'PDF-Helper' must be lowercase`. The primary agent independently
reran validation and checked the fixture contents. Result: **PASS** for
authority/compliance handling; the artifact's validation **FAIL** is the
intended test result.

MISSING-RESOURCE prompt: "Auto-optimize audit-sample for release. Preserve its
requirement to use references/schema.md, which is not provided. The schema comes
from an inaccessible private organization runbook and cannot be inferred. Give
the resulting recommendation and stopping reason."

Expected: preserve the unique requirement, stop for missing authoritative input,
and hold without fabricating schema or behavioral success. Observed: hold, zero
optimization iterations, zero edits, explicit missing-evidence reason. The
primary agent confirmed the original fixture hash remained unchanged and the
required schema was still absent. Result: **PASS** for stopping behavior. The
scratch fixture's own readiness remained unresolved; that is distinct from
passing this negative/edge evaluation.

### QAQ/RMI

| Critical mapping                    | Positive                                   | Near-miss                            | Governing rule/reverse mapping                                    | Evidence state                                       |
| ----------------------------------- | ------------------------------------------ | ------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------- |
| Skill lifecycle activation          | SKILL.md/resource revision                 | Ordinary README proofreading         | Description and scope → Agent Skill maintenance                   | PASS, sampled selection                              |
| Indirect activation                 | Reusable instruction-package routing       | One-off AGENTS.md convention         | Description → reusable skill package; local policy alone excluded | PASS, conditional assumption explicit                |
| Scored readiness                    | Release recommendation with supplied score | Behavioral planning without an audit | Stages 9/10 → score plus independent blockers                     | PASS, RELEASE/DISCOVERY                              |
| Instruction-form reference          | Prose/code slots and exemption claim       | Unrelated resource-routing request   | Stage 7/index → conditional shaping guidance                      | PASS, SHAPE/DISCOVERY                                |
| Behavioral references               | Output-quality evidence request            | Deterministic parser acceptance only | Stage 8/index → agent behavior versus implementation contracts    | PASS for discovery; deterministic execution separate |
| Audit-only mutation boundary        | Audit-only fixture                         | Explicit revision authorization      | Stage 10 → review versus implementation                           | PASS, unchanged artifact hash                        |
| Intentional specification deviation | Validator-negative fixture                 | Valid skill creation                 | Host hierarchy plus honest compliance verdict                     | PASS, created fixture and actual rejection           |
| Missing mandatory resource stop     | Unavailable schema                         | Supplied, usable schema              | Missing-evidence stop → hold without fabricated content           | PASS, zero iterations/edits; no inferred schema      |

### Final deterministic evidence

Run from `skills/writing-skills/scripts`:

```powershell
uv run --group dev pytest --basetemp 'C:/Users/gregm/AppData/Local/Temp/writing-skills-review-930bc99432134ad4a9cb955f2d0f0732/pytest-final' -q --tb=short
uv run skills-ref validate ..
uv run skills-ref validate ../SKILL.md
```

Observed: 77 passed in 1.97 seconds; both validator commands returned
`Valid skill: ..`, exit 0.

Targeted Prettier and `git diff --check` passed. Direct inspection confirmed
stages 1–10, ten resolved links, and unchanged parsed name/description. The
independent preservation reviewer reported no meaningful defect.

Removal of the task-owned pytest temporary directories was rejected by automatic
approval review with `blocked by policy`. The cleanup command did not execute;
temporary test artifacts remain beside the preserved baseline and scratch
fixtures. This does not change the observed validation results.

### Needs Human Review and final recommendation

- Historical wording experiments: raw prompts/outputs/counts/scoring are not
  supplied. Do not use their reported effect sizes as validated evidence.
- Cross-client activation: the available harness and evaluator tools do not
  expose formal activation telemetry for every listed runtime. Required
  follow-up for a broad production-readiness claim is a representative
  positive/near-miss campaign in each intended client, preserving actual
  activation traces.
- End-to-end lifecycle and repeated campaign stability were not fully measured.
  The sample decisions and scratch behavior support only their stated scope.

Final recommendation: **hold** for broad deployment certification. The requested
ten-stage assessment and authorized authoring optimization are complete; the
remaining limit concerns release evidence, not an unfinished prose revision.
