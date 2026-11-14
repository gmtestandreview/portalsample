# Devil's Advocate Rubric: subagent-driven-development

Adversarial rubric for `SKILL.md` and its templates and scripts. It is not
loaded during normal use; it is an evaluation asset. Its job is to **argue that
the skill does not work** in seven areas, then see whether the skill's own text
defeats the argument. A probe the text cannot defeat is a defect, however
polished the prose.

## Rules of engagement

- **Independent attacker.** The evaluator must not be the author of the revision
  under test. A self-run result is labeled `Self-scored (non-independent)` and
  cannot support `deploy`.
- **Cite or concede.** A probe is `Defeated` only with a quoted line from the
  skill, a template, or a script, or an executed result. Reasoning that the
  agent "would probably" do the right thing is `Stands`.
- **Execution beats reading.** Where a probe names a runnable check, a read-only
  answer earns at most `Partly`.
- **Score kind:** adversarial static/behavioral. Do not compare it with the
  generic 100-point rubrics or the earlier 67 / 81 scores.

## Scoring

Each dimension has four probes. Probe outcomes: `Defeated` = 1, `Partly` = 0.5,
`Stands` = 0, `NHR` (evidence unavailable) = 0 and listed as a blocker.
Dimension score = weight x (sum of probe outcomes / 4). Severity is H (high) or
M (medium).

| Dimension                              |  Weight |
| -------------------------------------- | ------: |
| 1. Purpose                             |      12 |
| 2. Objective                           |      12 |
| 3. Goal (end state)                    |      16 |
| 4. Test (how the skill is proven)      |      18 |
| 5. Validation (how each run is proven) |      18 |
| 6. Expected output                     |      12 |
| 7. Self-review of its own output       |      12 |
| **Total**                              | **100** |

**Caps:** any `Stands` or `NHR` on an H probe caps the total at 84 and blocks
`deploy`. Two or more `Stands` on H probes cap it at 69.

## 1. Purpose: why should this skill exist?

| #   | Sev | Attack                                                                                       | Defeated when                                                                                                                                                        |
| --- | --- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | H   | "It is a fork of `superpowers:subagent-driven-development`. Delete it and nothing is lost."  | The skill lists behaviors the upstream lacks and a repo rule that requires each (human gates, `.agent-sync/` workspace, Veto Buffer), and each is cited in the text. |
| P2  | M   | "The governance purpose is not in the description, so the skill can never be chosen for it." | The description or `When to use` lets an agent pick this skill over the upstream variant for a stated reason.                                                        |
| P3  | M   | "Context isolation is asserted, not enforced."                                               | A rule or script forces it (briefs as files, report files, no pasted history) and an example shows it.                                                               |
| P4  | H   | "When the upstream plugin changes, the two drift silently."                                  | The skill names an owner or a re-merge trigger, or states that divergence is intentional and where it is recorded.                                                   |

## 2. Objective: what must the activated agent accomplish?

| #   | Sev | Attack                                                                                                       | Defeated when                                                                                                                          |
| --- | --- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| O1  | H   | "The objective is a sequence of steps, not a result. An agent can do every step and deliver nothing usable." | An objective statement exists apart from the procedure and names the deliverable (a reviewed, validated branch plus a rulings report). |
| O2  | M   | "'Mostly independent' is undefined, so activation is a coin flip."                                           | A test or threshold separates "mostly independent" from "tightly coupled", or tells the agent how to decide and what to record.        |
| O3  | H   | "A one-task or two-task plan pays the full ledger, review and final-review cost for nothing."                | The skill says when not to use it (size or coupling) with a cheaper route.                                                             |
| O4  | M   | "Batching small tasks contradicts one-reviewer-per-task."                                                    | Batching rules state the review unit and the escape hatch back to per-task dispatch.                                                   |

## 3. Goal: what end state counts as done?

| #   | Sev | Attack                                                                                                            | Defeated when                                                                                             |
| --- | --- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| G1  | H   | "Every 'done' criterion can be true while the code is wrong: ledger lines and verdicts are process artifacts."    | At least one criterion is an outcome measured outside the agents' own reports (command output at HEAD).   |
| G2  | H   | "If the plan names no validation commands, the HEAD-validation criterion is vacuous."                             | The skill says what to run when the plan names none, or stops the run.                                    |
| G3  | M   | "'Minimal' and 'nothing not requested' are judged by the same reviewers who share the implementer's blind spots." | A mechanical check exists (diff-stat vs the plan's file list) or the limit is acknowledged and escalated. |
| G4  | M   | "Parked findings let the run end 'done' with known defects."                                                      | Parking requires a human-approved ruling, appears in the final message, and cannot hide Critical items.   |

## 4. Test: how is the skill itself proven?

| #   | Sev | Attack                                                                                              | Defeated when                                                                                                                              |
| --- | --- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| T1  | H   | "There is no behavioral evidence. The skill has only been read, never followed under pressure."     | A recorded run or eval shows a controller following it: baseline (without) vs with, raw output retained.                                   |
| T2  | H   | "Nobody has tested the stop conditions. The first time an agent should stop, it will rule instead." | Cases exist where the agent must stop (destructive op, merge, fix-round cap) and must not stop (routine progress), with expected outcomes. |
| T3  | M   | "The scripts were checked ad hoc in a scratch repo; nothing re-runs them."                          | A runnable script test covers: `5` vs `5.1`, slug collision, empty range, wrong-direction range, non-repo plan.                            |
| T4  | M   | "Activation was never tested: no positive and near-miss prompts."                                   | Listed prompts (for example "execute this plan in this session" vs "execute this plan in parallel worktrees") with expected skill choice.  |

## 5. Validation: how is each run proven?

| #   | Sev | Attack                                                                                                          | Defeated when                                                                          |
| --- | --- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| V1  | H   | "The controller validates itself: it runs the checks and reports the result, with no required evidence format." | The skill requires command, exit status and output location recorded in the ledger.    |
| V2  | H   | "Reviewers judge from the diff and the report; nobody confirms the tests ran on the final HEAD."                | A step runs or checks the validation at the final HEAD and records it.                 |
| V3  | M   | "⚠️ 'cannot verify from diff' items are resolved by the controller, which has the least independent view."      | The skill requires evidence (a command or a read) for each resolution, not a judgment. |
| V4  | M   | "A recovered ledger (rebuilt from `git log`) cannot prove tests passed."                                        | Recovery says to re-validate, not trust, any task whose evidence is lost.              |

## 6. Expected output: what exactly comes out?

| #   | Sev | Attack                                                                                                                   | Defeated when                                                                                                                            |
| --- | --- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | H   | "The final message has one defined section (rulings). Everything else is improvised."                                    | A final-message shape is defined: delivered, verified (with commands), unverified, deferred minors, parked findings, rulings, next step. |
| E2  | M   | "Implementer and reviewer outputs are specified, but the controller's ledger entries are not machine-checkable."         | The ledger line formats are fixed strings a script or grep can verify.                                                                   |
| E3  | M   | "The final review reuses the per-task reviewer template, whose spec-compliance part targets a task brief, not a branch." | The final-review dispatch states what replaces the brief (the plan and global constraints) and the template supports it.                 |
| E4  | M   | "Reports can claim success in prose."                                                                                    | Templates require evidence fields (command, output) and reject a claim without them.                                                     |

## 7. Self-review of its own output: who checks the checkers?

| #   | Sev | Attack                                                                                                                  | Defeated when                                                                                                      |
| --- | --- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| S1  | H   | "The controller has no self-review step: it declares done without comparing its final message to the Outcome criteria." | A pre-completion step checks each Outcome criterion against evidence and lists any that fail.                      |
| S2  | H   | "Nobody reviews the reviewers: a rubber-stamp ✅ ends the loop."                                                        | The skill requires a spot-check or a counter-signal (cited file:line for every ✅, or sampling by the controller). |
| S3  | M   | "Implementer self-review is a checklist of questions, not evidence."                                                    | Self-review must produce findings or an explicit 'none found, checked X, Y, Z'.                                    |
| S4  | M   | "Re-review only verifies the fixes; a fix can pass while weakening a test."                                             | The re-review prompt checks that tests were not weakened, or the skill says where that is checked.                 |

## Score record

```text
Skill revision:        <git SHA or content hash>
Evaluator:             <name/model>  Independent of author: yes | no
Evidence root:         <path to raw outputs>
Probe results:         P1..P4, O1..O4, G1..G4, T1..T4, V1..V4, E1..E4, S1..S4
                       each: Defeated | Partly | Stands | NHR, with cited evidence
Dimension scores:      ...
Total:                 <n>/100   Caps applied: none | 84 | 69 (probe ids)
Blockers:              <every H probe not Defeated>
Recommendation:        deploy | revise | split | merge | deprecate | hold
```

`deploy` requires: independent evaluator, every H probe `Defeated`, no `NHR`,
and a total above the owner's stated threshold.
