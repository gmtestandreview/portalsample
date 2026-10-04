# Evaluation Notes

These are maintainer evaluation assets for `import-refactor`; they are not
runtime instructions and should not be loaded merely because the skill
activates.

## Behavioral protocol

For each case in `evals.json`:

1. Run the prompt in a clean context **without** the candidate skill and
   preserve the output as RED/baseline evidence.
2. Run the same prompt in a clean context **with** the candidate skill available
   and preserve the output as GREEN evidence.
3. Grade against `expected_output`, keeping baseline and with-skill evidence
   separate.
4. After any skill edit, rerun the failed case plus the activation positive,
   near-miss, and relevant edge cases.

Record outcomes as `PASS`, `AMBER`, `FAIL`, `NHR`, or `N/A`.

Deterministic tests under `tests/` verify artifact structure and test readiness
only. They do **not** substitute for isolated RED/GREEN agent-behavior evidence.
