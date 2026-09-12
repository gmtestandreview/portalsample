# Behavioral Evaluation Schema

This file defines the common record format and scoring semantics for every case in `evals/`.

Parameters shown in braces, such as `{candidate_skill}` or `{representative_request}`, are evaluator-supplied campaign values. They are intentional inputs, not missing content.

## Required campaign header

Record this once per campaign:

```yaml
campaign_id: skill-YYYYMMDD-short-name
candidate_skill: path/or/stable-identifier
candidate_revision: commit-hash-or-version
skill_class: Discipline | Technique | Pattern | Reference | Hybrid
target_environment: client/repository/model context
evaluator: model-or-human identifier
available_tools:
  - tool-or-capability
known_limitations:
  - limitation-or-none
required_cases:
  - ACT-001
  - RG-001
```

## Required case record

Use this structure for every executed case:

```yaml
case_id: ACT-001
case_title: Direct positive activation
required: true
phase: activation | RED | GREEN | pressure | reference | regression
skill_classes:
  - Discipline
objective: One sentence describing what this case proves.
candidate_skill_state: unavailable | available | revised
source_case: null
comparison_case: null
parameters:
  representative_request: exact request used for this run
expected_activation: activate | do_not_activate | conditional | not_applicable
expected_behavior:
  - observable requirement
success_criteria:
  - observable criterion
evidence_required:
  - exact prompt/task
  - observed output or sufficient excerpt
observed:
  activation: activated | not_activated | unclear | not_applicable
  behavior_summary: concise factual observation
  evidence_ref: transcript/file/run identifier
result: PASS | AMBER | FAIL | NHR | N/A
rationale: Why the evidence supports this result.
blocked_by: null
missing_evidence: null
required_follow_up: null
regression_links:
  - REG-001
```

## Result decision rules

### PASS

Assign PASS only when every applicable success criterion is supported by the evidence collected in this run.

A plausible answer is not enough. A reviewer should be able to point to the evidence that satisfies each criterion.

### AMBER

Assign AMBER when the case executed and the evidence is useful, but a defensible PASS is not available because behavior is partial, ambiguous, inconsistent, unstable, or weakly evidenced.

Typical AMBER conditions:

- correct outcome with incomplete required safeguards;
- inconsistent activation across equivalent requests;
- correct retrieval mixed with unsupported embellishment that is not severe enough to make the whole answer unusable;
- repeated runs disagree materially;
- correct high-level branch but incomplete execution.

AMBER is a diagnostic result. It never upgrades to PASS merely because the evaluator believes the intent was good.

### FAIL

Assign FAIL when an expected behavior is materially violated or the claimed behavior is disproved, including:

- material false positive or false negative activation;
- explicit rule violation;
- failure to materially reduce the observed RED problem;
- fabricated Reference content;
- unsafe bypass of an applicable gate;
- regression of a previously passing behavior.

### NHR

Assign NHR when the case cannot be verified because a required capability or evidence source is genuinely unavailable.

Required NHR fields:

```yaml
blocked_by: concrete unavailable capability or evidence
missing_evidence: what could not be observed
required_follow_up: exact verification needed before resolution
```

Do not use NHR for an inconvenient test, a difficult setup, time pressure, or uncertainty that can be resolved with available evidence.

### Requiredness and deployment impact

Outcome and requiredness are independent. `result` records what happened in the case; `required: true|false` determines whether an unresolved result automatically blocks deployment. A material expectation violation is `FAIL` whether the case is required or optional.

- Required `AMBER`, `FAIL`, or `NHR` blocks `deploy` until resolved.
- Optional `AMBER`, `FAIL`, or `NHR` does not automatically block deployment, but the limitation and risk must be documented and judged under the governing campaign/checklist.

### N/A

Assign N/A only when the case does not apply to the candidate's execution model or target environment. Record the reason.

## RED/GREEN comparability record

For a GREEN case linked to RED, record:

```yaml
comparison:
  red_case_id: RG-001-RED
  same_task: true | false
  equivalence_rationale: null | explanation
  preserved_inputs: true
  preserved_constraints: true
  preserved_success_criteria: true
  preserved_pressure_conditions: true
  preserved_activation_context: true
```

If `same_task: false`, every preservation field must be true and `equivalence_rationale` must explain why the changed task remains a valid comparison. Otherwise the GREEN evidence is AMBER at best and may be invalid.

## Activation interpretation

Activation cases evaluate two distinct questions:

1. **Did the skill activate when intended?**
2. **Did it remain inactive for near-misses?**

Do not infer activation correctness only from final-answer quality. Capture activation/load evidence where the harness exposes it; otherwise use the strongest available behavioral evidence and mark uncertainty AMBER or NHR rather than inventing activation telemetry.

## Reference interpretation

Reference cases distinguish:

- **resource discovery** — the agent selects the correct supporting resource from the task and documented load conditions without being artificially told the file/path when discovery is part of the contract;
- **retrieval accuracy** — the correct source information is found;
- **application accuracy** — the retrieved information is used correctly;
- **coverage honesty** — missing or unsupported material is identified rather than invented;
- **conflict handling** — contradictory sources are surfaced and handled according to the skill's precedence rules.

A fluent answer that fabricates missing reference content is FAIL.

## Regression interpretation

A fix is not complete when only the failed scenario passes. Regression evidence must show that the fix did not:

- break established positive cases;
- swallow near-misses;
- reintroduce a previously fixed defect;
- cause unrelated supporting resources to load;
- create a new material safety or execution failure.

## Campaign recommendation

Use the following mapping after all required cases are resolved:

| Evidence state | Recommendation |
| --- | --- |
| All required cases PASS | `deploy` may be recommended if non-behavioral gates also pass |
| Any required case AMBER | `revise` or `hold` |
| Any required case FAIL | `revise` or `hold` |
| Any required case NHR | `hold`, unless the governing checklist explicitly allows the item to be non-blocking |
| Only optional cases AMBER/NHR | Document limitation; apply campaign-specific risk judgement |

Do not derive `deploy` from this behavioral suite alone. Specification, deterministic, resource, safety, and local-policy gates remain separate.
