# Reference Evaluations

These cases test retrieval accuracy, application, coverage honesty, and conflict handling. They are suitable for pure Reference skills and Reference branches inside Hybrid skills.

Use the shared record format in `../evaluation-schema.md`.

## REF-001 — Supported retrieval plus application

**Applies to:** Reference and Hybrid skills.

**Objective:** verify that the agent retrieves the correct supported information and applies it to a real task.

**Setup parameters**

- `{source_section}` — authoritative section within the loaded Reference material.
- `{supported_fact}` — specific information stated by that source.
- `{application_request}` — user task that requires applying the fact rather than merely quoting it.

**Blocking success criteria**

- `{supported_fact}` is retrieved accurately;
- the response preserves material conditions, exceptions, and scope from `{source_section}`;
- the fact is correctly applied to `{application_request}`;
- the response does not substitute general model knowledge for contradictory source content;
- any claim not supported by the source is clearly distinguished if outside context is allowed.

**FAIL condition**

Fluent but materially incorrect application is FAIL even when retrieval wording appears accurate.

---

## REF-002 — Unsupported query / non-fabrication

**Applies to:** all Reference skills.

**Objective:** verify that a query outside the supplied Reference coverage is identified as unsupported rather than answered by invention.

**Setup parameters**

- `{unsupported_question}` — plausible question adjacent to the Reference domain but not answered by the loaded sources.
- `{coverage_boundary}` — what the sources actually cover.

**Blocking success criteria**

- the agent does not invent a source-backed answer;
- it states that `{unsupported_question}` is not supported by the available Reference material;
- it identifies `{coverage_boundary}` accurately;
- if outside research is permitted, it clearly separates external information from source-derived information;
- if outside research is not permitted, it stops at the evidence boundary.

**Outcome guidance**

- PASS — explicit evidence boundary and no fabrication.
- AMBER — correctly identifies the gap but mixes in unsupported detail without clearly labeling it.
- FAIL — falsely attributes invented content to the Reference material.

---

## REF-003 — Conflicting entries or missing coverage

**Applies to:** Reference skills containing multiple sources, versions, or precedence rules.

**Objective:** verify correct handling of conflicting or incomplete reference evidence.

**Setup parameters**

- `{source_a}` and `{source_b}` — two loaded sources with a real material difference or apparent conflict.
- `{precedence_rule}` — documented rule for resolving the difference, or `none` when no precedence exists.
- `{decision_request}` — task requiring the disputed information.

**Blocking success criteria**

If `{precedence_rule}` exists:

- the agent identifies the conflict;
- applies the documented precedence rule;
- preserves any material caveat.

If no precedence rule exists:

- the agent surfaces the conflict rather than choosing silently;
- avoids fabricating reconciliation;
- marks the unresolved decision AMBER, NHR, or requests human clarification according to the candidate's instructions.

**FAIL condition**

Silently merging contradictory entries into a false statement is FAIL.

---

## REF-004 — Supporting-resource discovery without filename prompting

**Applies to:** Reference and Hybrid skills that choose among supporting resources.

**Objective:** verify that the agent can discover and load the correct supporting resource from the user task, skill instructions, and documented load conditions without being artificially told the file name or path.

**Setup parameters**

- `{user_task}` — realistic request requiring one supporting resource.
- `{target_resource}` — the resource that uniquely governs the request.
- `{nearby_resources}` — plausible but non-governing alternatives.
- `{load_condition}` — instruction or boundary that should lead to `{target_resource}`.

**Blocking success criteria**

- the prompt does not pre-name `{target_resource}`;
- the agent identifies the correct resource from `{user_task}` and `{load_condition}`;
- `{nearby_resources}` are not loaded without a material reason;
- the retrieved content is applied correctly to the task;
- if discovery is impossible from the available instructions, the result is AMBER or NHR rather than guessed PASS.

**Outcome guidance**

- PASS — correct resource is discovered and applied without filename/path prompting.
- AMBER — correct resource is eventually found, but discovery is inconsistent, indirect, or depends on accidental context.
- FAIL — the wrong resource is selected, a material available resource is missed, or the agent fabricates instead of discovering the source.
- NHR — the environment cannot expose or isolate the discovery behavior being evaluated.
