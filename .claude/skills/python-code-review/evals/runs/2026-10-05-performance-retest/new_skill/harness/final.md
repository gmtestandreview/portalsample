# Repaired

Repaired `project/test_guard.py` and added `project/test_harness_regressions.py`. Matrix mismatches now fail pytest, and synthetic SKILL fixtures are removed after their check, including assertion failure. `project/guard.py` and both decision cases remain unchanged.

Python 3.14.7 / pytest 9.0.2: baseline pytest exited 0 with two passed despite reporting one policy mismatch. Two focused regression defects were reproduced before repair. Final focused tests: four passed, exit 0. Final complete integration: five passed, one failed, exit 1. Fresh in-memory compilation succeeded for all three Python files. The failing integration case is `read-secret`: actual exit decision 0, required 2; `crash` still returns 2. Focused tests monkeypatch decisions to verify harness behavior; they do not prove the active guard passes.

No analyzer configuration, supplied diagnostics, declared Python floor, CI environment, or external hook runner was supplied. Ruff/Pyright/mypy/Sonar and a real hook-process end-to-end invocation were not run. No analyzer-clean or production-readiness claim is made.

Integration is RED, so the requested green assessment is unsupported. The harness repair intentionally changes mismatch reporting from success to failure while preserving function interfaces, policy, guard bytes and decision cases. The guard owner must fix the policy violation under separate authorization before integration can become green.

All current task-owned synthetic SKILL files and pytest scratch were removed after their test lifetime. Exact final generated fixture paths and dispositions are recorded in observations.json. Final reports and regression tests are retained as review evidence until the owner incorporates or discards them.

The supplied blocked-cleanup record says automatic approval review blocked removing `project/older-task-scratch/baseline/SKILL.md`, a previous-task rollback checkpoint. It remains byte-for-byte unchanged; the previous owner must resolve that cleanup restriction and confirm the checkpoint is no longer needed before removing it. The current task's broader cleanup command was also rejected, but narrower literal-path cleanup succeeded without touching that checkpoint.
