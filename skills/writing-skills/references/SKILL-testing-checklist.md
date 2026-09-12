# Testing Checklist for Agent Skills

Use this checklist for final validation of a new or changed `SKILL.md`.

This is a **deployment gate**, not a substitute for the specialist testing references. Apply only the checks relevant to the candidate and target environment, and record evidence for each result.

## Check labels

- **[SPEC]** Mandatory Agent Skills specification requirement.
- **[BP]** Best-practice quality check; failure may justify revision but is not automatically a specification failure.
- **[COND]** Required only when the stated condition applies.
- **[LOCAL]** Client-, repository-, project-, or organization-specific policy. Apply only when that policy is documented for the target.
- **[NHR]** `Needs Human Review` when the result cannot be verified with available evidence or tooling.

Do not promote **[BP]**, **[COND]**, or **[LOCAL]** checks into universal specification requirements.

### Behavioral evaluation outcomes

Behavioral result states are separate from the requirement labels above:

- **PASS** — expected behavior is demonstrated with sufficient representative evidence.
- **AMBER** — the evaluation ran and produced useful evidence, but behavior is partial, inconsistent, ambiguous, boundary-sensitive, unstable, or insufficiently reliable for PASS.
- **FAIL** — an expected behavior is materially violated or the claimed behavior is disproved.
- **NHR** — required evidence cannot be verified with the available capability, isolation, inputs, permissions, or tooling.
- **N/A** — the evaluation does not apply to the candidate's execution model or target environment, with a recorded rationale.

**AMBER is unresolved evidence, not a soft PASS.** A required behavior-critical `AMBER`, `FAIL`, or `NHR` outcome blocks `deploy` until resolved.

**Outcome and requiredness are separate axes.** The result records what happened; case requiredness determines deployment impact. A material expectation violation is `FAIL` whether the case is required or optional.

---

## 0. Evidence and applicability

Before checking the skill:

- [ ] Identify the artifact as a complete skill directory, complete `SKILL.md`, excerpt, or unknown.
- [ ] Identify the target environment/client if environment-specific behavior matters.
- [ ] Read the candidate `SKILL.md` and every supporting file needed for the checks being performed.
- [ ] Preserve a baseline for meaningful revisions or merges.
- [ ] Mark unavailable evidence or unsupported execution as **[NHR]** rather than guessing.
- [ ] Separate specification failures from best-practice, local-policy, and environment-specific failures.

Pass condition: the review scope and evidence limits are explicit.

---

## 1. `SKILL.md` structure and frontmatter

### Mandatory specification checks

- [ ] **[SPEC]** The skill directory contains a file named exactly `SKILL.md`.
- [ ] **[SPEC]** `SKILL.md` contains YAML frontmatter followed by Markdown content.
- [ ] **[SPEC]** YAML frontmatter parses without errors.
- [ ] **[SPEC]** `name` exists.
- [ ] **[SPEC]** `name` is 1-64 characters.
- [ ] **[SPEC]** `name` contains only lowercase letters, numbers, and hyphens.
- [ ] **[SPEC]** `name` does not start or end with a hyphen.
- [ ] **[SPEC]** `name` does not contain consecutive hyphens.
- [ ] **[SPEC]** `name` matches the parent skill-directory name.
- [ ] **[SPEC]** `description` exists and is non-empty.
- [ ] **[SPEC]** `description` is at most 1024 characters.
- [ ] **[SPEC]** `description` states what the skill does and when to use it.
- [ ] **[SPEC]** Optional frontmatter fields, if present, are supported by the current specification: `license`, `compatibility`, `metadata`, `allowed-tools`.
- [ ] **[SPEC]** `compatibility`, if present, is within the specification limit and describes actual environment requirements.
- [ ] **[SPEC]** `allowed-tools`, if present, uses the format required by the current specification.

### Non-spec naming or metadata rules

- [ ] **[LOCAL]** Any additional naming rule-such as gerund naming, reserved words, third-person wording, or organization prefixes-is documented for the target environment before being enforced.
- [ ] **[LOCAL]** Client-specific metadata conventions do not conflict with mandatory specification fields.

Pass condition: all applicable **[SPEC]** checks pass. Local conventions are reported separately.

---

## 2. Skill justification, scope, and coherence

- [ ] **[BP]** The skill contains reusable domain, project, environment, API, workflow, technique, pattern, or reference value that the base agent would not reliably provide unaided.
- [ ] **[BP]** The purpose is clear and internally coherent.
- [ ] **[BP]** Included tasks naturally belong together.
- [ ] **[BP]** Scope is narrow enough for precise activation.
- [ ] **[BP]** Scope is broad enough to avoid unnecessary fragmentation.
- [ ] **[BP]** One-off project instructions are excluded or intentionally treated as project guidance instead.
- [ ] **[BP]** Purely mechanical rules are moved to deterministic validation when a script or linter is the more reliable mechanism.
- [ ] **[BP]** Generic background knowledge is omitted unless it changes execution.
- [ ] **[BP]** Unique domain guidance, edge cases, and corrections are preserved.

Evaluation question:

> Would removing this skill materially increase the chance of incorrect, inefficient, unsafe, or inconsistent execution?

Pass condition: the skill provides a coherent reusable capability rather than generic documentation.

---

## 3. Activation description and trigger boundaries

Create realistic positive and near-miss requests. Use enough cases to cover the meaningful activation boundary; for important skills, a larger measured trigger set is preferable to a fixed minimum.

### Positive coverage

- [ ] **[BP]** Direct request using the domain or artifact name.
- [ ] **[BP]** Indirect request describing the need without naming the skill.
- [ ] **[BP]** Casual or abbreviated phrasing.
- [ ] **[BP]** Context-heavy or multi-step request where the skill need is embedded.
- [ ] **[BP]** Relevant edge-case or incomplete-context request.

### Near-miss coverage

- [ ] **[BP]** Similar vocabulary but a different task.
- [ ] **[BP]** Adjacent domain that should use another skill or base capability.
- [ ] **[BP]** Simple task where this skill would add no material value.
- [ ] **[BP]** One-off project instruction rather than reusable skill work.
- [ ] **[BP]** Mechanical validation better handled by deterministic tooling.

### QAQ/RMI for critical activation

For every critical trigger, branch, or load condition:

- [ ] **[BP]** Define a realistic positive request.
- [ ] **[BP]** Define a realistic near-miss.
- [ ] **[BP]** Map the positive request to the governing instruction and expected behavior.
- [ ] **[BP]** Verify the near-miss does not activate that instruction.
- [ ] **[BP]** Reverse-map the behavior to the intended request class.
- [ ] **[BP]** Revise any indirect, ambiguous, or scope-inconsistent mapping.

Pass condition: intended requests map directly to the skill and near-misses remain outside its activation boundary.

---

## 4. Progressive disclosure and context efficiency

- [ ] **[BP]** `SKILL.md` contains guidance needed when the skill activates, not an exhaustive reference manual.
- [ ] **[BP]** Long examples, API documentation, templates, detailed methodology, and rarely used material are moved to supporting resources when practical.
- [ ] **[BP]** Supporting resources have explicit load conditions.
- [ ] **[BP]** Optional resources are not eagerly loaded without need.
- [ ] **[BP]** Repeated guidance is consolidated.
- [ ] **[BP]** Generic explanations the agent already knows are removed.
- [ ] **[BP]** Terminology is consistent across `SKILL.md` and supporting files.
- [ ] **[BP]** The main file remains concise enough for reliable use; approximately 500 lines / 5,000 tokens is treated as guidance, not a universal validity rule.
- [ ] **[COND]** Multi-domain skills prevent irrelevant domain material from loading for unrelated branches.
- [ ] **[COND]** Time-sensitive information has a refresh/verification strategy when it cannot be avoided.

Pass condition: every always-loaded instruction justifies its context cost.

---

## 5. Procedural clarity and degree of control

- [ ] **[BP]** Instructions are active, atomic, and operational rather than vague declarations.
- [ ] **[BP]** Required sequence is explicit where order matters.
- [ ] **[BP]** Decision branches define their conditions.
- [ ] **[BP]** The skill provides a clear default when several valid tools or approaches exist.
- [ ] **[BP]** Escape hatches are bounded and explain when deviation is allowed.
- [ ] **[BP]** High-freedom guidance is used where multiple approaches are safe.
- [ ] **[BP]** Low-freedom instructions are used for fragile, destructive, or order-sensitive operations.
- [ ] **[BP]** Common failure modes have concrete corrections.
- [ ] **[BP]** Completion/validation criteria are explicit.
- [ ] **[COND]** When output shape materially affects correctness, the skill defines a template or output contract whose strictness matches the actual requirement.
- [ ] **[BP]** Instructions do not contradict each other or related loaded guidance.

Pass condition: an agent can determine what to do, when to branch, and how to know it is finished.

---

## 6. Select the correct behavioral tests

Classify the skill before choosing pressure depth.

- [ ] **[BP]** **Discipline**: pressure-test conflicting requirements, rationalization, safety, long workflows, and escalation.
- [ ] **[BP]** **Technique**: test correct/incorrect inputs, sequencing, reproducibility, expected output, and edge cases.
- [ ] **[BP]** **Pattern**: test recognition, counterexamples, branching, and contextual adaptation.
- [ ] **[BP]** **Reference**: test retrieval accuracy, coverage, application, and unsupported-query handling.
- [ ] **[BP]** **Hybrid**: justify why one category is insufficient and combine only the necessary test types.

Pass condition: the test plan matches the skill's actual execution model.

---

## 7. RED - baseline evidence

For new skills and meaningful behavioral changes:

- [ ] **[COND]** Run at least one representative task **without the candidate skill** when the required execution capability and representative inputs are available.
- [ ] **[COND]** Use a clean context or otherwise prevent candidate instructions from contaminating the baseline.
- [ ] **[COND]** Record the baseline output, failure, ambiguity, inefficiency, or missing context.
- [ ] **[COND]** For adherence/Discipline skills, record rationalizations or shortcut behavior verbatim where possible.
- [ ] **[COND]** Map each observed failure to a missing, weak, or ambiguous instruction.
- [ ] **[COND]** Do not invent hypothetical failures when representative baseline evidence is available.

Time pressure, confidence, sunk cost, convenience, or a request to skip testing do **not** make RED unavailable.

If the required execution capability, isolation, or representative inputs are genuinely unavailable:

- [ ] Mark RED **[NHR]**.
- [ ] Do not claim RED, GREEN, or deployment readiness passed on that basis.

### Reference-skill exception

- [ ] **[COND]** A pure Reference skill may replace behavioral RED with retrieval/application baselines when there is no meaningful rule or process to violate.

Pass condition: there is evidence for the problem the skill is intended to solve, or the missing evidence is explicitly **[NHR]**.

---

## 8. GREEN - with-skill behavior

Run the same representative task with the candidate skill available where practical. If an equivalent task is necessary, record why it is equivalent and preserve the relevant inputs, constraints, success criteria, and pressure conditions.

- [ ] **[COND]** The skill activates or is loaded when it should.
- [ ] **[COND]** The agent follows the governing instructions.
- [ ] **[COND]** The observed RED failure is prevented or materially reduced.
- [ ] **[COND]** The skill does not introduce a new material failure.
- [ ] **[COND]** The skill does not over-apply to unrelated work.
- [ ] **[COND]** Supporting resources load only when their conditions apply.
- [ ] **[COND]** The final task result satisfies the stated success criteria.
- [ ] **[COND]** With-skill and baseline evidence are kept separate.

Pass condition: the skill changes behavior in the intended direction with representative evidence.

---

## 9. REFACTOR - loopholes, pressure, and edge behavior

Apply when the skill contains rules, gates, costly procedures, safety requirements, or behavior an agent may rationalize away.

Create adversarial variants combining realistic pressures rather than asking the agent to recite the skill.

- [ ] **[COND]** Time/deadline pressure.
- [ ] **[COND]** Confidence/familiarity pressure.
- [ ] **[COND]** Sunk-cost/rework pressure.
- [ ] **[COND]** Authority or explicit shortcut pressure.
- [ ] **[COND]** Ambiguous/missing-input pressure.
- [ ] **[COND]** Scope pressure from a near-miss that should not activate.
- [ ] **[COND]** Conflicting instructions or competing goals.
- [ ] **[COND]** Safety/destructive-operation pressure where applicable.

For every failure:

- [ ] **[COND]** Map the rationalization or error to the smallest instruction defect.
- [ ] **[COND]** Fix the trigger, branch, instruction, boundary, or precedence rule-not unrelated wording.
- [ ] **[COND]** Rerun the failed scenario.
- [ ] **[COND]** Rerun relevant positive and near-miss regression cases.

Pass condition: known loopholes are closed without broadening activation or adding unnecessary context.

---

## 10. Supporting files, links, and paths

- [ ] **[COND]** Every referenced local file exists.
- [ ] **[COND]** Every referenced directory exists or is clearly described as optional/generated.
- [ ] **[COND]** Relative paths resolve from the location implied by the skill/harness.
- [ ] **[BP]** Path conventions are consistent; portable skill guidance prefers relative paths.
- [ ] **[COND]** Resource load conditions point to the correct files.
- [ ] **[COND]** External links are still suitable for the skill's purpose.
- [ ] **[COND]** Renamed or relocated files have no stale references.
- [ ] **[COND]** Templates/assets required for successful execution are present.
- [ ] **[COND]** Missing optional resources degrade gracefully rather than causing false success claims.

Pass condition: all required resources can be resolved from the packaged skill.

---

## 11. Scripts, commands, and tools

Apply only when the skill contains or references executable behavior.

- [ ] **[COND]** Dependencies and required system tools are documented.
- [ ] **[COND]** Version pinning or another reproducibility strategy is used where dependency drift matters.
- [ ] **[COND]** Inputs, outputs, side effects, and expected file locations are clear.
- [ ] **[COND]** Commands/scripts have been run in a representative environment after the latest relevant change, or are marked **[NHR]** / unvalidated.
- [ ] **[COND]** Failure modes and recovery behavior are documented.
- [ ] **[COND]** The agent is told what to do when execution fails.
- [ ] **[COND]** Hidden credentials are not assumed.
- [ ] **[COND]** Required permissions/network access are documented where relevant.
- [ ] **[COND]** Commands avoid unsafe broad defaults.
- [ ] **[COND]** Script/tool behavior matches the prose instructions.

Pass condition: executable guidance is reproducible, bounded, and honestly validated.

---

## 11A. Deterministic validator and harness conformance

Apply when the target repository ships parser, validator, prompt-generation, CLI, or other deterministic SKILL.md tooling. Keep universal specification compliance separate from repository-specific implementation contracts.

- [ ] **[COND]** If deterministic tooling enforces `SKILL.md` compliance, it enforces every applicable **[SPEC]** requirement without weakening it; exact `SKILL.md` casing remains governed by the corresponding **[SPEC]** rule.
- [ ] **[COND]** If deterministic tooling validates optional frontmatter, it accepts and validates every supported current-spec optional field, including `allowed-tools`, against the applicable **[SPEC]** requirements.
- [ ] **[LOCAL]** Parser/validator regression tests cover every enforced validation branch that can materially affect acceptance or rejection.
- [ ] **[LOCAL]** Parser tests cover malformed or missing frontmatter, non-mapping YAML, required fields, supported optional fields, rejected fields, normalization behavior, and serialization/model mapping where implemented.
- [ ] **[LOCAL]** Validator tests cover valid and invalid boundaries, including minimum/maximum values and both sides of paired constraints such as leading/trailing hyphens.
- [ ] **[LOCAL]** Repository-specific normalization or compatibility behavior is identified separately and does not silently redefine **[SPEC]** compliance.
- [ ] **[COND]** If prompt metadata is generated, tests cover zero, one, and multiple skills; required output fields; escaping/encoding; serialization; and invalid-input behavior.
- [ ] **[COND]** If a CLI is shipped, tests cover success and error exit codes, directory/direct-file input handling, exact `SKILL.md` casing, and serialized output.
- [ ] **[COND]** Security-sensitive serialization escapes or encodes untrusted SKILL.md-derived values before embedding them in XML, HTML, JSON, shell, or other structured output.
- [ ] **[COND]** Fresh deterministic tests run after the latest relevant change; unavailable dependencies or execution environments are **[NHR]**, not a pass.
- [ ] **[COND]** A deterministic test that intentionally exceeds or differs from the specification is labeled as **[LOCAL]** compatibility behavior and cannot satisfy the corresponding **[SPEC]** gate.

Pass condition: deterministic tooling proves the applicable specification and repository contracts without broadening, weakening, or silently redefining mandatory SKILL.md requirements.

---

## 12. Safety, authorization, and rollback

Apply in proportion to the risk of the skill.

- [ ] **[COND]** Destructive or high-impact operations are identified before execution.
- [ ] **[COND]** Materially destructive/high-impact changes require appropriate authorization.
- [ ] **[COND]** A practical backup, snapshot, or reversible checkpoint exists before destructive changes.
- [ ] **[COND]** Batch, complex, destructive, or high-stakes operations create a reversible intermediate plan or structured representation and validate it against the applicable source of truth before side effects when this materially reduces risk.
- [ ] **[COND]** Changes are staged when staging reduces risk.
- [ ] **[COND]** Rollback instructions are practical and match the operation performed.
- [ ] **[COND]** Reversible and irreversible actions are distinguished.
- [ ] **[COND]** Broad delete, overwrite, force, merge, publish, or deploy operations have safeguards.
- [ ] **[COND]** Unsafe shortcuts remain blocked under pressure testing.
- [ ] **[COND]** Safety requirements take precedence over convenience and optional customization.

Pass condition: foreseeable high-impact failures have authorization, mitigation, validation, and recovery controls.

---

## 13. Revision, merge, and regression checks

Run after every meaningful change.

- [ ] **[BP]** Compare the candidate with the preserved baseline.
- [ ] **[BP]** Existing positive triggers still activate.
- [ ] **[BP]** Existing near-misses still remain outside scope.
- [ ] **[BP]** Previously fixed failures/rationalizations remain fixed.
- [ ] **[COND]** Supporting-file paths still resolve.
- [ ] **[COND]** Scripts/tools still validate after the latest relevant change.
- [ ] **[BP]** No unique domain knowledge, safety rule, edge case, trigger boundary, or load condition was lost unless intentionally relocated.
- [ ] **[BP]** Removed material is duplicated, obsolete, unsafe, generic, or safely relocated.
- [ ] **[COND]** Merge conflicts and contradictory instructions are resolved before deployment.
- [ ] **[BP]** The revision does not broaden activation unintentionally.
- [ ] **[BP]** The revision does not introduce new false negatives.
- [ ] **[BP]** Context size did not grow without execution value.

Pass condition: the candidate improves or preserves intended behavior without material regression.

---

## 14. Environment- and local-policy checks

Apply these only when documented for the target.

Examples include:

- [ ] **[LOCAL]** Client-specific skill installation/discovery paths.
- [ ] **[LOCAL]** Additional naming conventions.
- [ ] **[LOCAL]** Reserved words.
- [ ] **[LOCAL]** Description voice/style requirements.
- [ ] **[LOCAL]** Registration or packaging rules.
- [ ] **[LOCAL]** Model-specific testing requirements.
- [ ] **[LOCAL]** Repository-specific validators or CI checks.
- [ ] **[LOCAL]** Organization-specific security/review gates.

Pass condition: local requirements are satisfied without being misreported as universal Agent Skills specification requirements.

---

## 15. Final deployment gate

Do **not** recommend `deploy` until every applicable blocking item is satisfied.

### Mandatory blocking gates

- [ ] All **[SPEC]** checks pass.
- [ ] No unresolved safety-critical failure remains.
- [ ] All required local resources resolve.
- [ ] Required scripts/tools either pass fresh validation or deployment is explicitly blocked as **[NHR]**.
- [ ] Known limitations and **[NHR]** items are documented.
- [ ] The final recommendation is recorded: `deploy`, `revise`, `split`, `merge`, `deprecate`, or `hold`.

### Behavioral gates

For every skill with applicable behavioral evidence requirements, including pure Reference skills:

- [ ] Trigger boundary has representative positive and near-miss evidence.
- [ ] RED evidence exists; for a pure Reference skill, an applicable retrieval/application baseline may satisfy this gate when behavioral RED is not meaningful; otherwise genuinely unavailable evidence is explicitly **[NHR]**.
- [ ] GREEN or with-skill behavior is verified against representative tasks.
- [ ] Applicable pressure, edge, retrieval, unsupported-query, or resource-discovery tests pass according to the skill class.
- [ ] Relevant regressions pass after the last change.
- [ ] Every required behavioral evaluation records `PASS`, `AMBER`, `FAIL`, `NHR`, or `N/A` with supporting rationale/evidence.

A behavior-critical skill with any required `AMBER`, `FAIL`, or `NHR` outcome, or with otherwise unresolved required behavioral evidence, **MUST** be `revise` or `hold`; `deploy` is prohibited.

### Completion integrity

- [ ] No edit/test/build/script/behavioral success is claimed unless it was actually performed.
- [ ] Validation evidence is fresh after the last relevant change.
- [ ] Unsupported outcomes are marked **[NHR]**.
- [ ] Specification failures are reported separately from best-practice/local-policy failures.

---

## Result summary template

```markdown
# Skill Validation Summary

Artifact:
Classification:
Target environment:

## Specification
- Result:
- Failures:

## Trigger boundary
- Positive cases:
- Near-misses:
- QAQ/RMI:

## Behavioral evidence
- Overall outcome: PASS | AMBER | FAIL | NHR | N/A
- RED:
- GREEN:
- Pressure/edge:
- Regression:
- Unresolved AMBER/FAIL/NHR:

## Resources and execution
- Paths/references:
- Scripts/tools:
- Safety/rollback:

## Local policy
- Applied:
- Failures:

## Needs Human Review
- ...

## Final recommendation
deploy | revise | split | merge | deprecate | hold
```

---

## Reference use

This checklist answers **whether final validation is complete**. Use specialist references for **how** to perform complex checks:

- current specification → mandatory format/compliance;
- description/trigger methodology → activation measurement and near-miss design;
- behavioral eval methodology → with-skill/without-skill runs, assertions, grading, and iteration;
- pressure-testing methodology → RED/GREEN/REFACTOR adherence tests;
- scripts guidance → executable resources and reproducibility;
- classification guidance → choose the correct testing emphasis.

Do not duplicate those full methodologies here.
