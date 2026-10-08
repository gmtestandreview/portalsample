# Activation Evaluations

These cases evaluate intended positive and adjacent/ambiguous request
boundaries. Parameterize the candidate and declare the measurement target before
each run.

Use the [shared record format](../evaluation-schema.md). Choose `selection`,
`behavioral_application`, or `runtime_activation`; make the corresponding
observed decision, behavior, or client load event a blocking criterion. The
expected-activation labels below describe the intended boundary. A selection or
application PASS never proves runtime activation. Missing required load-event
evidence is `NHR`, not a substitute behavioral PASS.

## Target-specific criteria

For **selection**, judge the declared catalog decision and rationale: select the
candidate for positives, another/no skill for near-misses, and resolve the
documented discriminator for ambiguous requests. Do not require task execution
or output production from a description-only selector.

For **behavioral_application**, judge the task behavior/output criteria in each
case below, with the guidance supplied or loaded. For **runtime_activation**,
require the correct target-client selection/load event (or observed absence for
a near-miss); include task behavior only when separately predeclared in the
campaign. Behavior/output bullets below are application criteria, not extra
requirements silently added to a selection-only case. Preserve the measurement
target and all applicable criteria when comparing runs.

## ACT-001 — Direct positive activation

**Applies to:** all skill classes with an activation description.

**Objective:** test the declared measurement target for an explicit request
naming the candidate's domain, artifact, or operation.

### Setup parameters

- `{candidate_skill}` — the skill under test.
- `{direct_request}` — a natural request that explicitly names the
  domain/artifact and clearly requires the skill.
- `{governing_instruction}` — the description or instruction establishing the
  request as in scope.

### Run

Present `{direct_request}` in a clean context with the candidate skill
available.

**Expected activation:** `activate`.

### Blocking success criteria

- the declared selection, application, or runtime-activation criterion is met;
- the response follows `{governing_instruction}`;
- no unrelated skill behavior displaces the candidate;
- the final result addresses the requested task rather than merely reciting the
  skill.

### Evidence to capture

Exact request, activation/load evidence if available, relevant output, and the
governing instruction.

### Outcome guidance

- PASS — all criteria for the declared measurement target are met.
- AMBER — output suggests partial use but activation is uncertain or
  inconsistent.
- FAIL — does not activate or ignores the governing behavior.
- NHR — harness cannot expose enough evidence to determine activation or
  behavior.

---

## ACT-002 — Indirect semantic activation

**Applies to:** all activation-critical skills.

**Objective:** test the declared target from the user's underlying need without
requiring exact skill-name vocabulary.

### Setup parameters

- `{indirect_request}` — a realistic request that describes the need without
  naming the skill, its file, or its formal title.
- `{expected_behavior}` — observable behavior the skill should introduce.

### Run

Present `{indirect_request}` with the skill available.

**Expected activation:** `activate`.

### Blocking success criteria

- semantically equivalent user intent is recognized;
- expected behavior is applied without requiring the user to know the skill
  name;
- the response does not broaden into unrelated functionality.

### Devil's Advocate variant

Repeat with common shorthand, casual phrasing, or a user typo that does not
materially change intent. If equivalent phrasings produce materially different
activation, record AMBER or FAIL depending on severity.

---

## ACT-003 — Embedded multi-step activation

**Applies to:** skills likely to be needed inside larger requests.

**Objective:** verify the declared target when relevant work is embedded inside
a multi-step or context-heavy request.

### Setup parameters

- `{multi_step_request}` — a task containing at least one clearly in-scope step
  and other surrounding work.
- `{in_scope_step}` — the portion that should invoke the candidate.
- `{out_of_scope_steps}` — surrounding work that should not be incorrectly
  governed by the candidate.

**Expected activation:** `activate` for `{in_scope_step}` only.

### Blocking success criteria

- the candidate behavior appears at the correct point in the workflow;
- unrelated steps are not unnecessarily constrained by the skill;
- sequencing requirements are respected where order matters;
- the skill does not take over the entire request merely because one step
  matches.

### AMBER trigger

Use AMBER when the correct in-scope behavior occurs but the candidate also
weakly leaks into unrelated steps without causing a clear material failure.

---

## ACT-004 — Adjacent-domain near-miss

**Applies to:** all skills with plausible neighboring domains or overlapping
vocabulary.

**Objective:** verify non-selection, non-application, or no runtime activation
for a request sharing vocabulary but belonging to another capability.

### Setup parameters

- `{near_miss_request}` — a realistic adjacent-domain request using overlapping
  terminology.
- `{correct_handler}` — another skill, base capability, or no-skill path that
  should handle the request.

**Expected activation:** `do_not_activate`.

### Blocking success criteria

- candidate-specific instructions are not applied;
- the request is handled by `{correct_handler}` or ordinary reasoning as
  appropriate;
- the response does not invent a reason to pull the candidate into scope.

### Failure condition

Any material candidate-specific behavior applied to the near-miss is a false
positive and FAIL.

---

## ACT-005 — Ambiguous boundary / AMBER discriminator

**Applies to:** skills with conditional, fuzzy, or high-overlap boundaries.

**Objective:** verify that ambiguity is handled explicitly rather than converted
into arbitrary activation.

### Setup parameters

- `{ambiguous_request}` — a request intentionally positioned at the documented
  activation boundary.
- `{missing_fact}` — the smallest fact needed to determine whether the candidate
  applies.
- `{documented_boundary}` — the rule governing the decision.

**Expected activation:** `conditional`.

### Blocking success criteria

- the agent identifies `{missing_fact}` or applies a documented default;
- it does not invent the missing fact;
- it does not silently treat the ambiguous request as clearly in scope or
  clearly out of scope;
- once the missing fact is supplied, activation follows `{documented_boundary}`
  consistently.

### Outcome guidance

- PASS — ambiguity is surfaced and resolved according to the documented
  boundary.
- AMBER — the agent reaches an acceptable outcome but the activation rationale
  is inconsistent, implicit, or unstable across equivalent runs.
- FAIL — it fabricates the deciding fact or repeatedly activates contrary to the
  documented boundary.
