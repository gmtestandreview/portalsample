# Current-revision isolated pressure and activation evaluation

This is a **reproducible execution plan**, not a run. Every row is `NHR` until a real, separately captured agent execution supplies the result.

1. Freeze `SKILL.md`, referenced resources, and `evals/cases.json`; record hashes and runner/model/environment details. Do not reuse outputs from prior candidate hashes.
2. For each required case, create two separate fresh contexts with the same prompt and any necessary fixture: **without-skill** (candidate unavailable) and **with-skill** (candidate discoverable under normal activation conditions). Ensure the candidate is not visible in the control arm.
3. Capture verbatim assistant output, activation decision, loaded reference paths, invoked tools, commands, tool outputs, observed artifacts and their hashes, and any safety or permission decisions. Record differences in versions, isolation, configuration and fixture setup.
4. Assess expected behavior using the frozen case definition and the *observed* trace; test both positive and near-miss activation, focused-vs-full path, narrow resource loading, pressure boundaries, and revision regression. Grade `PASS`, `AMBER`, `FAIL`, or `NHR` with a concise rationale tied to trace files. Optional `N/A` requires an applicability reason.
5. Enter evidence paths relative to this directory. Update the row's `observation`, `evidence_paths`, and `status` for each arm; set `activation_observed`, `references_loaded`, and `tool_calls_record` from actual telemetry or mark it unavailable. Do not infer activation from prose alone.
6. Run `python scripts/validate_evidence.py` from the skill directory. It validates completeness, status/trace consistency, case IDs, and candidate-hash binding; it **does not judge agent behavior**.
7. Required current `AMBER`, `FAIL`, `NHR`, or incomparable run/isolation evidence blocks `deploy`. Report separately the historical 2026-10-05 campaign; it is not equivalent to this revision.

The 16 pressure cases are included in `run-record.json` together with positive, near-miss, task-path, branch, and reference-loading cases. Use `cases.json` as the immutable expectation source and record a new run file when changing that contract. Never write PASS solely because the instruction text matches the expected behavior.
