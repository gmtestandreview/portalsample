# The Fix Loop

Read this before every fix round. The task review reported spec ❌, a Critical
or Important finding, or a ⚠️ item you confirmed as a real gap.

Two routes leave the loop immediately:

- **Minor findings** never enter the loop. Ledger them as
  `Task <N>: minor (deferred): <one-liner>`; the final review triages them. A
  roll-up nobody reads is a silent discard.
- **A finding labeled plan-mandated**, or one that conflicts with what the
  plan's text requires, is yours to rule on: weigh it against the plan text,
  decide with the spec as the binding authority, and ledger the ruling before
  you act. Do not dismiss a finding because the plan mandates it, and do not
  dispatch a fix that contradicts the plan without a recorded ruling. If the
  spec does not settle it, or your ruling would override what the plan requires,
  escalate it to the human (Veto Buffer) instead of ruling.

Everything else enters the loop. A fix round is one fix dispatch plus one scoped
re-review. **Five rounds maximum per task.**

**Rounds 1-3: resume the original implementer** with the open findings verbatim.
Its context is intact. If the harness cannot message a live subagent, dispatch a
fresh implementer carrying the brief path, the report path and the findings; the
report file is the persistent memory either way.

**Rounds 4-5: a fresh implementer on a more capable model** (SKILL.md "Model
selection"), with the brief path, the report path, the open findings and this
framing: "A prior implementer attempted this task [N] times; you own it now.
Read the report file for what was tried." A loop that survives three resumes
usually means the implementer cannot see its own problem.

**Every round:** the implementer fixes, re-runs the tests covering the amended
code, appends a fix report to the same report file, and returns the short
contract. Before re-reviewing, confirm the fix report names the covering tests,
the command and the output. Name the covering test files in the fix message; a
one-line fix does not need the whole suite.

**The re-review is scoped.** Run
`scripts/review-package.sh PLAN_FILE FIX_BASE HEAD` (FIX_BASE is the head the
previous review saw) and dispatch `../re-review-prompt.md` with the findings,
the brief, the report and the diff path. The re-reviewer verdicts each finding
ADDRESSED or NOT ADDRESSED, flags new breakage in the fix diff only, and checks
for weakened tests. Before closing the round, spot-check at least one ADDRESSED
verdict's cited `file:line` against the file at HEAD; a verdict with no citation
is not accepted (same rule as SKILL.md Per task step 4). New Critical/Important
breakage joins the open findings; out-of-scope observations go to the ledger as
deferred minors and never extend the loop.

**After each round** append:
`Task <N>: fix round <R>/5 (<X> addressed, <Y> open — <finding one-liners>; commits <a7>..<b7>)`

Never fix findings yourself in the controller session: it pollutes your context
and skips review.

## The cap

When round 5's re-review still leaves findings open, stop dispatching and
escalate to the human with the open findings and the report path. Do not
adjudicate them yourself; a loop that survives five rounds is a plan or
capability problem, and the human decides. The human may:

- name the binding value or decision and authorize one more attempt (a fresh
  implementer on a more capable model);
- re-plan the task;
- park a finding with a recorded ruling:
  `Task <N>: parked — <finding> — Ruling: <why>`. A parked finding is real or
  contestable, and the final review sees both sides; a load-bearing finding that
  a later task builds on must not be parked silently.

Record the human's decision in the ledger as a `Ruling:` line. Never adjudicate
earlier to end a loop: that is pre-judging with a different name. Every
adjudication is a ledger entry; a silent discard is forbidden.
