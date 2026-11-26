# Evaluation checkpoint: wave 2

- Controller: `writing-skills`; human acceptance owner: user.
- Revised candidate: `skills/reverse-engineered-file-compare/SKILL.md`, SHA-256
  `D4A2B937E105887F1C5403272DE5D9335A35C64336C1D528644F10699EF1C439`.
- Protocol remains byte-identical to the supplied prompt, SHA-256
  `BEC08346DFED685D29CD772CBE5FAC9012DC39ABE51FA9862DCC9DC32911278C`.
- Frozen cases remain `evals/cases.md`, SHA-256
  `B64B2B6AB53A7C287493191F502128010D3F37868319C952B6A0821C9C60C19A`.
- Wave 1: FC-001 baseline gave a concise correct blocker; with-skill output
  reached the correct blocker and Sections A–H but omitted several mandatory
  register fields and grouped acceptance gates. Grade: AMBER for full protocol
  fidelity. FC-002 missing input passed. FC-003 selection-only proxy passed.
  FC-004 refused unsupported READY under sign-off pressure, but also shortened
  required registers.
- Smallest fix: entrypoint now requires a completion check for mandatory fields,
  scoring checks, and separate G01–G14 statuses. No change to the source
  protocol or fixtures.
- Wave 2 question: Does the revised entrypoint produce the complete required
  registers and gates in the same FC-001 task, while retaining the correct
  BLOCKED decision?
- Known limitation: these are explicit skill-application runs, not proof of
  automatic client activation. Nested runners cannot authenticate Sonar; the
  controller scanned the skill files successfully before dispatch.
- Next action: run FC-001 with the revised skill, retain raw output, grade, and
  close the campaign. Optional wave cap remains 2.
