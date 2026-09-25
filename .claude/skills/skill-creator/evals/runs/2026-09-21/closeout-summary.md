# Skill Creator Activation Re-Verification (F1)

Date: 2026-09-21

Target skill: `.claude/skills/skill-creator`, current description (includes the readiness-guard
update). Harness: isolated single-skill project, `claude -p`, serial, `claude` CLI 2.1.143.

## Evidence

| Run | Result | Evidence |
| --- | --- | --- |
| Train, 1 run/query, 30s timeout | 19/20 | `activation-eval-serial-final-results.json`. The one miss is a near-miss row that hit `trigger evaluation exceeded 30s` (execution error, no trigger observed). |
| Hold-out, 1 run/query, 30s timeout | 7/8 | `activation-holdout-serial-final-results.json`. The miss is the positive "Turn the workflow we just developed into a reusable SKILL.md..." (0/1). |
| Timed-out near-miss rerun, 3 runs, 90s | PASS | `activation-nearmiss-rerun-results.json`. Triggered 1/3 (threshold 0.5), no errors. |
| Missed positive rerun, 3 runs, 90s | PASS | `activation-positive-rerun-results.json`. Triggered 3/3, no errors. |

The `_rerun-*.json` files are the one-query eval sets used for the reruns.

## Reading

- No CLI or rate-limit errors, unlike the 2026-09-14 post-readiness-guard runs.
- Both single-run misses are explained: one execution timeout, one non-reproducing positive miss.
- Residual risk: the near-miss "Optimize the activation conditions for my browser extension's
  content script" triggered 1/3. It passes the threshold but is the weakest boundary; the phrase
  "activation" overlaps the skill's vocabulary. No description change made: no failing evidence.
- Single-run evidence at 1 run/query is noisy; this supersedes the NHR rows for the current
  description but is not a multi-run trigger-rate study.

## Verdict

Activation evidence for the current description: PASS with the residual risk above.
