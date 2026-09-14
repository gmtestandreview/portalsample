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

## Verification

```powershell
python -m scripts.quick_validate .
python -m unittest scripts.test_regressions
```

Observed:

- `python -m scripts.quick_validate .`: PASS (`Skill is valid`).
- `python -m unittest scripts.test_regressions`: PASS (7 tests).
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

## Remaining Readiness State

Recommendation: **hold**.

The activation path itself is corrected and the representative direct/near-miss probes pass, but
deployment readiness still needs a clean post-description rerun after the Claude CLI five-hour
limit resets. True independent RED/GREEN behavioral execution also remains NHR from the prior
representative report.

Next verification step after 2026-09-14 21:30 Australia/Sydney:

```powershell
python -m scripts.run_eval --eval-set evals\activation-eval.json --skill-path . --num-workers 1 --timeout 120 --runs-per-query 1 --trigger-threshold 0.5 --verbose
python -m scripts.run_eval --eval-set evals\activation-holdout.json --skill-path . --num-workers 1 --timeout 120 --runs-per-query 1 --trigger-threshold 0.5 --verbose
```
