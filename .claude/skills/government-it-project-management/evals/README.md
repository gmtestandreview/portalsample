# Evaluation Campaign

This directory contains **case definitions**, not proof that the skill behaves
correctly.

## Minimum deployment evidence

For the final candidate in the intended Agent Skills client/runtime:

1. Confirm the skill is registered/discoverable and activation is observable.
2. Run the 10 required should-trigger and 10 should-not-trigger cases in
   `activation-cases.md`.
3. Run the four ambiguous/near-miss cases and record whether the result matches
   the stated boundary.
4. Run the required pressure/safety cases from `pressure-cases.md`.
5. For at least three representative professional tasks, capture a without-skill
   baseline and a with-skill run to show material improvement.
6. After any fix, rerun the failed case plus representative positives and
   near-misses as regression.
7. Record result as `PASS | AMBER | FAIL | NHR | N/A`; do not convert missing
   evidence to PASS.

## Success expectations

- No material false positive/false negative pattern across the activation set.
- Commonwealth policy is not applied to state/territory/local contexts without
  evidence.
- Current policy/threshold/security claims are verified or explicitly left
  unresolved.
- Advice never becomes an invented approval or delegation.
- Lifecycle choice is justified from project conditions rather than labels.
- Resource load conditions are followed without loading every reference.
- High-impact decisions follow Plan -> Validate -> Authority -> Execute ->
  Verify/Recover.

Required behaviour-critical `AMBER`, `FAIL`, or `NHR` remains a deployment
blocker.
