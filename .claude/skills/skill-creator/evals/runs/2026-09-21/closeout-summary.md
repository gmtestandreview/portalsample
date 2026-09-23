# Skill Creator Activation Re-Verification (F1)

Date: 2026-09-21

Target skill: `.claude/skills/skill-creator`, current description (includes the
readiness-guard update). Harness: isolated single-skill project, `claude -p`,
serial, `claude` CLI 2.1.143.

## Evidence

| Run                                    | Result | Evidence                                                                                                                                                        |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Train, 1 run/query, 30s timeout        | 19/20  | `activation-eval-serial-final-results.json`. The one miss is a near-miss row that hit `trigger evaluation exceeded 30s` (execution error, no trigger observed). |
| Hold-out, 1 run/query, 30s timeout     | 7/8    | `activation-holdout-serial-final-results.json`. The miss is the positive "Turn the workflow we just developed into a reusable SKILL.md..." (0/1).               |
| Timed-out near-miss rerun, 3 runs, 90s | PASS   | `activation-nearmiss-rerun-results.json`. Triggered 1/3 (threshold 0.5), no errors.                                                                             |
| Missed positive rerun, 3 runs, 90s     | PASS   | `activation-positive-rerun-results.json`. Triggered 3/3, no errors.                                                                                             |

The `_rerun-*.json` files are the one-query eval sets used for the reruns.

## Reading

- No CLI or rate-limit errors, unlike the 2026-09-14 post-readiness-guard runs.
- Both single-run misses are explained: one execution timeout, one
  non-reproducing positive miss.
- Residual risk: the near-miss "Optimize the activation conditions for my
  browser extension's content script" triggered 1/3. It passes the threshold but
  is the weakest boundary; the phrase "activation" overlaps the skill's
  vocabulary. No description change made: no failing evidence.
- Single-run evidence at 1 run/query is noisy; this supersedes the NHR rows for
  the current description but is not a multi-run trigger-rate study.

## Near-miss vocabulary investigation

Set: `evals/activation-near-miss-vocab.json` (5 non-skill "activation/trigger"
prompts, 4 runs each).

Upstream: the description and body share vocabulary with the prompts
("activation", "trigger", "hooks", "guardrails"). The eval harness loads exactly
one skill, so the model has no competing skill; this likely overstates false
triggers relative to the real repo (hundreds of skills). Downstream: a false
trigger loads a ~260-line skill; `CLAUDE.md` treats triggered skills as
mandatory. No destructive path.

| Variant                                                 | Near-miss set                                                | Train (1 run)         | Hold-out (2 runs)       | Files                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------ | --------------------- | ----------------------- | -------------------------------------------------------------------- |
| Baseline                                                | 4/5; Chrome-extension prompt 2/4 (FAIL), original prompt 0/4 | n/a                   | n/a                     | `near-miss-vocab-baseline-results.json`                              |
| Iter 1: exclusion clause for non-skill activation rules | 4/5; Chrome 2/4, original 1/4                                | 20/20                 | 8/8                     | `*-after-rerun-results.json`, `*-after-exclusion-rerun-results.json` |
| Iter 2: skill-anchored vocabulary                       | 4/5; Chrome 2/4, original 1/4                                | 19/20 (positive miss) | 7/8 (near-miss timeout) | `*-iter2-results.json`                                               |

`*-after-results.json` / `*-after-exclusion-results.json` / hold-out equivalents
are all `429` rate-limit errors (0 completed runs): NHR, not evidence.

Iter 2 reverted (no gain, one positive miss). Stopped at 2 iterations: no
improvement.

## Mitigation

Description kept at Iter 1 (745 chars; no positive regression). The trigger rate
for the Chrome prompt was not reduced. Instead the downstream cost is bounded:
`SKILL.md` now opens with an early-exit ("if the request is not about an Agent
Skill ... stop here ... handle the request normally"). That instruction was not
behaviorally tested (run_eval measures triggering only).

## Verdict

Activation evidence for the current description: PASS on train/hold-out.
Residual risk narrowed but not eliminated: "activation rules for a non-skill
browser extension"-style prompts trigger ~50% in the single-skill harness.
Accepted risk, mitigated by the body early-exit (unverified). Open follow-up: a
harness variant with distractor skills, or a behavioral test of the early-exit.
