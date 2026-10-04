# Match instruction form to failure

Load when choosing guidance for an observed output-shaping failure, scoping an
exception or limit, or assessing claims about wording experiments. The four
failure-to-form pairings in `SKILL.md` remain the default. This reference adds
examples and evidence limits.

Inputs: the actual baseline output, governing requirement, task constraints, and
relevant pressure/context. Output: one scoped candidate instruction and a
comparison plan with observable success criteria. If the baseline or requirement
is missing, obtain it or mark the proposed change unvalidated; do not infer a
failure from stylistic preference.

Follow the host instruction hierarchy. A stronger instruction cannot grant
permission or override the user's authorized scope. Retest when the task,
requirement, model, or instruction form changes. Use
[behavioral methodology](testing-skills-with-subagents.md) for evidence and the
[final checklist](SKILL-testing-checklist.md) for readiness.

## Choose a correction from the observed failure

| Baseline failure                       | Candidate correction                                       | What to compare                                  |
| -------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| A known rule is skipped under pressure | Explicit prohibition, rationalization counter, or red flag | Adherence under the same realistic pressures     |
| Output has the wrong shape             | Positive recipe naming the parts and their order           | Required content, ordering, and unwanted content |
| A required element is omitted          | Required field or slot in the output contract              | Presence and completeness of that element        |
| Behavior depends on a condition        | Conditional keyed to an observable predicate               | Both branches, including a realistic near-miss   |

These are candidates to test, not guarantees. If a baseline already behaves
correctly, record that result; do not invent a failure to justify stronger
wording.

## Scope exceptions and limits directly

If an exception depends on context, name the observable condition rather than
asking the agent to decide whether it "matters". For example, when a supplied
brief exists, reference that brief; otherwise request the missing task details.

If a word limit applies to prose while a complete code block is required, give
each a separate slot:

```text
Produce these parts in order:
1. Summary: at most 100 words describing the intended change.
2. Migration: one fenced sql block containing the full supplied migration.
```

The number illustrates the requested prose limit; it is not a universal limit.
Treat the supplied SQL as output data; this template does not authorize
executing the migration. If the supplied block is absent or incomplete, report
that gap instead of inventing its remainder. Check both prose length and code
completeness in representative runs. A blanket response limit followed by "this
does not apply to code blocks" is an alternative to compare if its behavior is
in question, not an inherently invalid instruction.

## Historical observations and evidence limits

The pre-review `SKILL.md` reported dispatch-prompt wording experiments in which:

- prohibition wording produced more unwanted content than a positive recipe,
  with reportedly separated distributions and a trend worse than no guidance;
- a vague nuance clause made a previously consistent recipe less reliable;
- an exemption clause was associated with omitted or shortened code blocks.

Those reports motivate the candidate corrections above. The review did not
locate the experiment prompts, raw outputs, sample counts, or scoring data in
the supplied evidence campaign. Their effect sizes and generality are
**unverified / Needs Human Review**. The existing campaign covers activation,
reference routing, and local-policy pressure instead.

The exact experiment revision/date is also unavailable here; this is a preserved
summary of an inherited claim, not a reproducible historical campaign record.

Do not present these observations as universal laws or measured results for a
new package. Run comparable baseline/candidate tasks, record actual outputs and
model/environment context, and test relevant regressions before claiming a
behavioral improvement. If those runs are unavailable, label the proposed
wording unvalidated.
