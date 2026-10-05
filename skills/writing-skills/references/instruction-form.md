# Instruction Form for Observed Skill Failures

Load this reference only after a concrete evaluation or review finding shows
that instruction form is contributing to incorrect behavior. Do not strengthen
wording by default.

Map the observed failure to the smallest corrective form:

| Observed failure | Preferred corrective form |
| --- | --- |
| Rule skipped under pressure | Explicit prohibition, red flag, or rationalization counter scoped to that rule |
| Wrong output shape | Positive output contract or template |
| Required element omitted | Required structural field, slot, or completion check |
| Conditional behavior applied incorrectly | Condition keyed to an observable predicate |

Use these rules when refining the correction:

- express exceptions as observable conditions;
- scope the change to the affected instruction or field;
- do not broaden activation merely to make one case pass;
- treat findings from other agents, tasks, or environments as hypotheses until
  tested against the target skill;
- after changing instruction form, rerun the affected positive, near-miss,
  pressure, and regression cases when execution is available.

This guidance was extracted from the supplied baseline `SKILL.md`; it is not a
new specification requirement.
