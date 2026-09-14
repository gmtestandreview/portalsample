# Skill Creator Corrected-Harness Close-Out

Date: 2026-09-14

Target skill: `.claude/skills/skill-creator`

## Root Cause

The activation harness produced false negatives for positive trigger cases because it:

- registered the candidate as a temporary slash command under `.claude/commands`, not as a skill
  directory under `.claude/skills/<name>/SKILL.md`;
- ran inside the real project, where ambient skills such as `writing-skills` could satisfy
  positive skill-authoring prompts before the temporary candidate;
- loaded user/local settings that caused `claude -p` to initialize and exit with `num_turns: 0`;
- treated early partial `assistant` snapshots without tool calls as definitive non-triggers;
- flattened Claude CLI error details to `claude CLI reported an error result`.

## Fixes Applied

- `scripts/run_eval.py` now creates an isolated temporary Claude project per query with exactly one
  temporary skill under `.claude/skills/<candidate>/SKILL.md`.
- `scripts/run_eval.py` invokes `claude -p` with `--setting-sources project`, which was the verified
  path that produced real API turns.
- `scripts/run_eval.py` ignores partial assistant snapshots until it sees a matching `Skill`/`Read`
  tool use, `message_stop`, or final `result`.
- `scripts/run_eval.py` now preserves Claude CLI error status/message details.
- `scripts/run_eval.py` terminates the Windows process tree before deleting the isolated eval cwd.
- `SKILL.md` frontmatter now explicitly covers turning proven workflows into reusable skills and
  pre-share skill-folder consistency checks while excluding generic packaging/A-B testing.
- `scripts/run_red_green_eval.py` records an isolated structural-cleanup RED/GREEN representative
  task with transcripts, stderr, final fixture snapshots, JSON summary, and markdown report.
- `scripts/run_readiness_pressure_eval.py` records an isolated readiness-pressure RED/GREEN task
  that tests whether `skill-creator` prevents unsupported production-ready claims under schedule
  pressure.
- `SKILL.md` now explicitly distinguishes risk-accepted shipping from production-readiness:
  missing activation or without-skill/with-skill behavioral evidence must remain `HOLD`, `AMBER`,
  or `Needs Human Review (NHR)`.

## Verification

```powershell
python -m scripts.quick_validate .
python -m unittest scripts.test_regressions
python -m py_compile scripts\run_red_green_eval.py scripts\run_readiness_pressure_eval.py
```

Observed:

- `python -m scripts.quick_validate .`: PASS (`Skill is valid`).
- `python -m unittest scripts.test_regressions`: PASS (9 tests).
- `python -m py_compile scripts\run_red_green_eval.py scripts\run_readiness_pressure_eval.py`: PASS.
- Direct positive smoke after harness correction: PASS (`True`).
- Near-miss smoke after harness correction: PASS (`False`).

## Corrected Activation Evidence

| Run | Result | Evidence |
| --- | --- | --- |
| Train, corrected isolated harness, 1 run/query | FAIL | `activation-eval-serial-results.json`: 19/20 passed; no execution errors. The remaining miss was a positive resource-organization query. |
| Holdout, corrected isolated harness, 1 run/query | FAIL | `activation-holdout-serial-results.json`: 6/8 passed; no execution errors. Misses were workflow-to-skill creation and pre-share consistency checks. |
| Train after description update, 1 run/query | NHR | `activation-eval-serial-after-description-results.json`: first 5 positive rows passed, then Claude CLI returned rate-limit errors (`429`, reset 2026-09-14 21:30 Australia/Sydney). Treat as rate-limit evidence, not acceptance evidence. |
| Requested train rerun after description update, 1 run/query | NHR | `activation-eval-serial-post-description-rerun-results.json`: 0/20 passed because every row returned Claude CLI `429` rate-limit errors (`reset 2026-09-14 21:30 Australia/Sydney`). Treat as rate-limit evidence, not acceptance evidence. |
| Requested holdout rerun after description update, 1 run/query | NHR | `activation-holdout-serial-post-description-rerun-results.json`: 0/8 passed because every row returned Claude CLI `429` rate-limit errors (`reset 2026-09-14 21:30 Australia/Sydney`). Treat as rate-limit evidence, not acceptance evidence. |
| Targeted positive misses after multi-turn stream fix | PASS | `activation-failed-positives-after-message-stop-fix-results.txt`: 4/4 previously missed positive prompts triggered. |
| Train after multi-turn stream fix, 1 run/query | PASS | `activation-eval-serial-post-message-stop-fix-results.json`: 20/20 passed, with no execution errors. |
| Holdout after multi-turn stream fix, 1 run/query | PASS | `activation-holdout-serial-post-message-stop-fix-results.json`: 8/8 passed, with no execution errors. |
| Train after readiness-guard description update, 1 run/query | NHR | `activation-eval-serial-post-readiness-guard-results.json`: 2/20 passed before Claude CLI returned `429` rate-limit errors for the remaining 18 cases (`resets 7pm Australia/Sydney`). Treat as rate-limit evidence, not acceptance evidence. |
| Holdout after readiness-guard description update, 1 run/query | NHR | `activation-holdout-serial-post-readiness-guard-results.json`: 0/8 passed because every case returned Claude CLI `429` rate-limit errors (`resets 7pm Australia/Sydney`). Treat as rate-limit evidence, not acceptance evidence. |

## Independent RED/GREEN Evidence

| Run | Result | Evidence |
| --- | --- | --- |
| Structural cleanup representative task | AMBER | `independent-red-green/independent-red-green-report.md`: GREEN activated `skill-creator`, but RED also cleaned the target skill and removed the stale path, so this scenario did not establish an observed RED gap. |
| Readiness-pressure representative task, after guard fix | PASS | `independent-red-green-readiness-pressure/independent-red-green-readiness-pressure-report.md`: RED made an unsupported production-ready claim; GREEN activated `skill-creator`, kept the verdict AMBER, named the unrun activation/behavioral evidence, and separated risk-accepted shipping from production-readiness. |

## Remaining Readiness State

Recommendation: **independent RED/GREEN readiness-pressure behavior is resolved; hold the final
production-ready claim until activation train/holdout are rerun successfully against the final
description after the Claude CLI rate limit resets**.

The activation path is corrected and the pre-readiness-guard post-fix train/holdout suites pass
cleanly. True independent RED/GREEN behavioral execution is no longer NHR for the critical
readiness-pressure behavior. Because the production-readiness guard also changed the activation
description, the full activation train/holdout evidence must be refreshed when the CLI is available;
the 2026-09-14 post-guard attempts are blocked by `429` execution errors.
