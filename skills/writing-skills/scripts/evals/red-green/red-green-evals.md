# RED/GREEN Evaluations

These cases demonstrate whether the candidate skill materially changes behavior. Keep RED and GREEN evidence separate and comparable.

Use the shared record format in `../evaluation-schema.md`.

## RG-001 — Same-task behavioral RED/GREEN pair

**Applies to:** new behavior-changing skills and meaningful behavioral revisions.

**Objective:** establish a representative baseline problem and prove that the candidate materially reduces it on the same task.

### RED

**Setup parameters**

- `{representative_task}` — a realistic task exercising the claimed behavior.
- `{success_criteria}` — observable success requirements defined before either run.

Run `{representative_task}` without the candidate skill in a clean context.

Capture:

- exact task;
- observed output;
- failure, ambiguity, inefficiency, unsafe shortcut, or missing guidance;
- rationalization verbatim where relevant.

A valid RED does not require the agent to fail catastrophically. It requires useful baseline evidence about the problem the skill claims to solve.

### GREEN

Run the **same** `{representative_task}` with the candidate skill available.

**Blocking success criteria**

- the skill activates when required;
- the observed RED problem is prevented or materially reduced;
- all predeclared `{success_criteria}` are met;
- no new material failure appears;
- RED and GREEN evidence remain directly comparable.

**Outcome guidance**

- PASS — measurable improvement with no new material failure.
- AMBER — improvement exists but is incomplete, unstable, or weakly evidenced.
- FAIL — no material improvement, new material failure, or incorrect activation.

---

## RG-002 — Equivalent-task comparability guard

**Applies to:** campaigns where the exact RED task cannot be reused for GREEN.

**Objective:** prevent an easier or materially different GREEN scenario from being presented as evidence of improvement.

**Setup parameters**

- `{red_task}` — original baseline task.
- `{green_task}` — proposed equivalent task.
- `{equivalence_rationale}` — why exact reuse is impossible and why comparison remains valid.

Before running GREEN, compare the scenarios across:

- inputs;
- constraints;
- success criteria;
- pressure conditions;
- activation context.

**Blocking success criteria**

- `{equivalence_rationale}` is explicit;
- all materially relevant conditions are preserved;
- the GREEN task is not easier with respect to the failure observed in RED;
- any changed condition is shown not to affect the behavioral claim.

**Outcome guidance**

- PASS — equivalence is demonstrated and comparative evidence is valid.
- AMBER — most conditions are preserved but one material comparability question remains unresolved; linked GREEN evidence cannot count as full PASS.
- FAIL — the changed scenario removes or weakens the condition that caused RED to matter.

---

## RG-003 — Pure Reference retrieval/application baseline

**Applies to:** pure Reference skills with no meaningful process rule to violate.

**Objective:** replace artificial behavioral RED with a meaningful retrieval/application baseline.

**Setup parameters**

- `{reference_question}` — a representative question answerable from the candidate Reference material.
- `{source_fact}` — the exact supported information to retrieve and apply.
- `{application_task}` — a task requiring use of that information rather than simple quotation.

### Baseline

Run `{reference_question}` and `{application_task}` without candidate Reference material available.

Capture whether the agent:

- retrieves equivalent information from existing context;
- guesses;
- leaves a gap;
- applies an incorrect default.

### With Reference

Run the same request with the candidate Reference material available.

**Blocking success criteria**

- the correct `{source_fact}` is retrieved;
- it is applied correctly to `{application_task}`;
- unsupported additions are not invented;
- the Reference material materially improves accuracy, confidence calibration, or execution consistency when the baseline had a gap.

If baseline performance was already correct, record that evidence; do not manufacture a RED failure to justify the Reference skill.

---

## RG-004 — Genuine unavailability / NHR

**Applies to:** any required RED or GREEN case whose execution capability, isolation, or representative input may genuinely be unavailable.

**Objective:** verify that unavailable behavioral evidence is recorded as NHR rather than guessed or converted into a pass.

**Setup parameters**

- `{required_case}` — the RED or GREEN evidence requirement.
- `{unavailable_capability}` — concrete capability/evidence that cannot be obtained.
- `{verification_needed}` — exact follow-up required to resolve the case.

**Procedure**

Attempt only the safe, available setup needed to confirm the blocker. Do not fabricate a simulated run unless simulation is itself a valid representative method for this case.

**Blocking success criteria**

- result is `NHR`;
- `blocked_by` identifies `{unavailable_capability}`;
- `missing_evidence` states what cannot be verified;
- `required_follow_up` records `{verification_needed}`;
- no RED, GREEN, or deployment success is claimed from the missing evidence.

**FAIL condition**

Reporting PASS, GREEN success, or deployment readiness despite the required evidence being unavailable is FAIL.
