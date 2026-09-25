# Skill Creator Three-Mode Evaluation Pipeline Implementation Plan

**Goal:** Add a `check` / `smoke` / `release` pipeline that makes basic skill
testing deterministic and free of Claude calls while bounding, checkpointing,
and stopping all live evaluation work before it can exhaust the Claude quota,
with user-verifiable evidence kept separate from execution status.

**Architecture:** Add a small shared evaluation-control module that owns model
call permits, JSONL checkpoints, deadlines, and the `429` circuit breaker. Keep
the existing evaluators as execution adapters, but make them consume the shared
control object and schedule only a bounded number of in-flight attempts. Add a
pipeline CLI that composes deterministic checks and fixed live suites; keep
description optimization separate and explicitly budgeted. Make the final
pipeline summary an exact, semantically validated evidence artifact rather than
deriving readiness from internal evaluator state alone.

**Tech Stack:** Python 3.10+, `argparse`, `concurrent.futures`, JSON/JSONL,
SHA-256 fingerprints, `unittest`, `pytest`, and the existing Claude CLI
stream-JSON protocol.

## Source Inputs

- User requirement: implement a three-mode `check` / `smoke` / `release`
  pipeline, beginning with call budgets, resumable checkpoints, and a `429`
  circuit breaker.
- User-supplied lessons:
  `C:/Users/gregm/.codex/attachments/70710e15-46cd-429d-8bf1-368a5c049e23/Pasted text.txt`.
  Relevant conclusions are that execution safety, evidence completeness, and
  readiness are separate gates; user-visible artifacts must retain exact
  identities; unexecuted cases must be explicit; and static review scores are
  not behavioral evidence.
- Architecture review evidence:
  - `.claude/skills/skill-creator/evals/runs/2026-09-14/closeout-summary.md:70`
    records complete train and holdout batches lost to `429` responses.
  - `.claude/skills/skill-creator/evals/runs/2026-09-21/closeout-summary.md:13`
    demonstrates that one run per query plus targeted reruns has been sufficient
    for routine verification.
- Relevant files inspected:
  - `.claude/skills/skill-creator/SKILL.md:36`: current request routing and
    validation contract.
  - `.claude/skills/skill-creator/references/description-optimization.md:99`:
    repeated trigger evaluation and optimizer workflow.
  - `.claude/skills/skill-creator/references/evaluation-workflow.md:172`:
    behavioral execution, retry, and evidence requirements.
  - `.claude/skills/skill-creator/scripts/run_eval.py:1037`: eager trigger-eval
    scheduling and result aggregation.
  - `.claude/skills/skill-creator/scripts/run_loop.py:597`: iterative
    description optimization.
  - `.claude/skills/skill-creator/scripts/improve_description.py:347`: direct
    Claude invocation used by the optimizer.
  - `.claude/skills/skill-creator/scripts/run_early_exit_eval.py:188`: serial
    behavioral probes.
  - `.claude/skills/skill-creator/scripts/run_red_green_eval.py:205`: shared
    RED/GREEN Claude runner.
  - `.claude/skills/skill-creator/scripts/run_readiness_pressure_eval.py:664`:
    readiness RED/GREEN orchestration.
  - `.claude/skills/skill-creator/scripts/Regression tests/test_run_eval.py:60`:
    current fake-executor and stream-parser coverage.
  - `.claude/skills/skill-creator/scripts/Regression tests/test_run_early_exit_eval.py:29`:
    current early-exit fixture coverage.
  - `.claude/skills/skill-creator/references/schemas.md:44`: persisted-evidence
    semantics, including the distinction between missing values and zero.

## Assumptions and Unknowns

- Assumption: this pipeline validates the bundled `skill-creator` skill itself;
  the lower-level `run_eval.py` command remains usable for other target skills.
- Assumption: `check` consists of `quick_validate`, the smoke-compatible
  `unittest` suite, and the full `pytest` regression suite documented in
  `SKILL.md`.
- Assumption: `smoke` uses four fixed activation cases and performs one attempt
  per case, with a default hard cap of six model calls.
- Assumption: `release` preserves existing coverage with a 34-call base: the
  20-case activation set, 8-case holdout, four early-exit cases, and one
  readiness-pressure RED/GREEN pair. Its default 40-call cap reserves six calls
  for targeted confirmation of failures after the base completes.
- Assumption: the release pipeline validates a frozen description; it does not
  call `improve_description.py`. Optimization remains a separate command.
- Assumption: successful attempts are reusable from a checkpoint; execution
  errors and `429` records are retained as evidence but retried on a later run.
- Assumption: the checkpoint is durable execution state, not proof that a mode
  passed. Only the validated user-visible pipeline summary and its referenced
  artifacts determine evidence completeness and readiness.
- Assumption: every live mode and standalone live evaluator requires an explicit
  full model ID through `--model`. Dry runs and `check` require no model. The
  exact model ID is part of every attempt key, so a checkpoint can never
  silently mix configured-default models.
- Assumption: `--deadline-seconds` is a start deadline measured with
  `time.monotonic()`. After it expires, no new Claude process starts; an already
  running process may finish within its existing per-query timeout. It is not a
  hard wall-clock cancellation deadline.
- Human decision, not an implementation blocker: a real `smoke` or `release` run
  consumes external quota and must be explicitly requested after the local
  implementation tests pass.
- Blocking unknowns: none.

## Requirement Traceability

| Requirement                               | Task(s)    | Notes                                                                        |
| ----------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `check` makes no Claude calls             | 1, 5, 7    | Enforced by a subprocess-spy regression test.                                |
| `smoke` is small and bounded              | 5, 6       | Four fixed probes; default budget six.                                       |
| `release` preserves meaningful evidence   | 5, 6       | 34-call base plus at most six targeted confirmation calls.                   |
| Hard call budget                          | 1, 2, 3, 4 | One shared permit counter covers every Claude invocation.                    |
| Resume completed work                     | 1, 2, 4, 6 | Successful attempts are keyed and stored in JSONL.                           |
| Stop on Claude `429`                      | 1, 2, 4    | Typed error opens the circuit and prevents new submissions.                  |
| Avoid a large queued blast radius         | 2          | Keep at most `num_workers` futures in flight; default two.                   |
| Do not misclassify errors as non-triggers | 2, 4       | Partial/unavailable results remain explicit failures.                        |
| Bound the optimizer too                   | 3          | Trigger probes and rewrite calls share one budget.                           |
| Stop optimizer plateaus                   | 3          | Detect unchanged/seen descriptions and configurable no-improvement patience. |
| Explain modes and evidence limits         | 5, 6       | Update skill and evaluation references.                                      |
| Preserve compatibility and rollback       | 2, 3, 4, 7 | Keep existing entrypoints and additive output fields.                        |
| Separate execution, evidence, and verdict | 5, 6, 7    | No single PASS can hide a partial run or incomplete artifacts.               |
| Make release evidence reconstructable     | 4, 5, 7    | Exact inputs, cases, tool identity, artifact paths, and digests remain visible. |
| Audit the complete case matrix            | 5, 7       | Every expected case is present; unexecuted entries are `not_run`/`NHR`.       |

## Framework Fit

- Use vertical slices and test-first sequencing because each control behavior
  can be proved independently before it is wired into live evaluators.
- Use ADR-lite in this plan's architecture and assumptions sections only. A
  separate ADR is unnecessary because the change is internal, reversible, and
  retains the existing CLI adapters.
- Use incremental migration: add the controller, adapt one evaluator at a time,
  then make the new pipeline the documented default.
- Do not add DDD, C4, a database, or a service. A parent-process controller and
  append-only JSONL checkpoint are sufficient.
- Threat-model scope is limited to outbound prompt content, quota consumption,
  checkpoint integrity, and subprocess control; no auth or permission model is
  changing.

## Files and Responsibilities

| Path                                                                                        | Action | Responsibility                                                                                                        |
| ------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| `.claude/skills/skill-creator/scripts/eval_control.py`                                      | Create | Call permits, deadline, circuit breaker, typed Claude errors, fingerprints, and JSONL checkpoint storage.             |
| `.claude/skills/skill-creator/scripts/run_pipeline.py`                                      | Create | Three-mode CLI, shared controller, exact evidence manifest, reference validator, readiness gates, and exit codes.     |
| `.claude/skills/skill-creator/evals/activation-smoke.json`                                  | Create | Two representative positive and two hard-negative activation probes.                                                  |
| `.claude/skills/skill-creator/scripts/Regression tests/test_eval_control.py`                | Create | Unit coverage for budgets, fingerprints, checkpoints, deadlines, and rate-limit circuit behavior.                     |
| `.claude/skills/skill-creator/scripts/Regression tests/test_run_pipeline.py`                | Create | Mode selection, zero-call `check`, evidence completeness, adversarial manifests, readiness, and exit-code coverage.   |
| `.claude/skills/skill-creator/scripts/Regression tests/test_run_loop.py`                    | Create | Optimizer budget propagation and plateau-stop coverage.                                                               |
| `.claude/skills/skill-creator/scripts/Regression tests/test_improve_description.py`         | Create | Standalone optimizer CLI budget, checkpoint, and shortening-call coverage.                                            |
| `.claude/skills/skill-creator/scripts/Regression tests/test_run_red_green_eval.py`          | Create | Direct RED/GREEN parser, permit, usage, checkpoint, artifact, and CLI coverage.                                       |
| `.claude/skills/skill-creator/scripts/run_eval.py`                                          | Modify | Typed CLI errors, bounded scheduling, checkpoint reuse, execution metadata, safe defaults, and live CLI flags.        |
| `.claude/skills/skill-creator/scripts/run_loop.py`                                          | Modify | Shared call controller, preflight totals, bounded defaults, and plateau detection.                                    |
| `.claude/skills/skill-creator/scripts/improve_description.py`                               | Modify | Consume a call permit for every rewrite, including over-limit shortening, and checkpoint successful responses.        |
| `.claude/skills/skill-creator/scripts/run_early_exit_eval.py`                               | Modify | Shared budget/checkpoint support and explicit CLI-error detection.                                                    |
| `.claude/skills/skill-creator/scripts/run_red_green_eval.py`                                | Modify | Shared typed error parsing and budget-aware RED/GREEN invocation.                                                     |
| `.claude/skills/skill-creator/scripts/run_readiness_pressure_eval.py`                       | Modify | Extract a callable orchestration function for the release pipeline and preserve partial evidence safely.              |
| `.claude/skills/skill-creator/scripts/Regression tests/test_run_eval.py`                    | Modify | Bounded scheduler, `429`, checkpoint resume, skipped-run, and worker-default coverage.                                |
| `.claude/skills/skill-creator/scripts/Regression tests/test_run_early_exit_eval.py`         | Modify | Ensure a result-event error cannot pass as an early exit and cached successes are reused.                             |
| `.claude/skills/skill-creator/scripts/Regression tests/test_run_readiness_pressure_eval.py` | Modify | Budget/circuit propagation and resumable RED/GREEN evidence coverage.                                                 |
| `.claude/skills/skill-creator/scripts/test_regressions.py`                                  | Modify | Add new CLI entrypoints to the `--help` smoke list and retain Windows invocation checks.                              |
| `.claude/skills/skill-creator/references/schemas.md`                                        | Modify | Document checkpoint ownership, reuse rules, and partial-run semantics.                                                |
| `.claude/skills/skill-creator/references/description-optimization.md`                       | Modify | Make optimization explicitly live, budgeted, resumable, and separate from testing.                                    |
| `.claude/skills/skill-creator/references/evaluation-workflow.md`                            | Modify | Define the three modes, call accounting, circuit-breaker behavior, and evidence semantics.                            |
| `.claude/skills/skill-creator/SKILL.md`                                                     | Modify | Route ordinary testing to `check`; document explicit `smoke` and `release` escalation.                                |

## Tasks

### Task 1: Define call-control and checkpoint contracts

**Files**

- Create: `.claude/skills/skill-creator/scripts/eval_control.py`
- Create:
  `.claude/skills/skill-creator/scripts/Regression tests/test_eval_control.py`

- [ ] **Step 1: Write failing controller tests**

Add tests that define these contracts before the module exists:

1. `EvaluationControl(max_calls=2, ...)` grants exactly two permits and rejects
   the third without incrementing `attempted_calls`.
2. An expired deadline rejects a permit with stop reason `deadline_exceeded`.
3. `ClaudeCliError(status=429, message="You've hit your limit")` opens the
   circuit; every later permit is rejected with `rate_limited`.
4. `AttemptSpec.key()` is stable for identical inputs and changes when the
   attempt kind, full model ID, Claude CLI version, query, run index,
   skill-content digest, distractor digest, or harness version changes.
5. `CheckpointStore` appends one JSON object per line, returns the active typed
   `CachedResult`, keeps errors and invalidations as history rather than cache
   hits, and tolerates only a malformed final partial line.
6. The versioned record parser rejects missing keys, non-string attempt keys,
   incomplete or key-mismatched `spec` objects, unknown statuses, success
   records without an outcome, and error records without an error message.
7. Identical duplicate active successes are idempotent; conflicting active
   successes for one attempt key fail closed. An intervening `invalidated`
   record retires the old success and permits a fresh replacement.
8. Accounting always satisfies
   `planned_calls = resumed_calls + attempted_calls + skipped_calls` and
   `attempted_calls = successful_calls + error_calls` after all granted calls
   settle.
9. A cache candidate increments `resumed_calls` only after a caller-supplied
   validator accepts it. A rejected description or corrupt artifact manifest is
   synchronously invalidated in JSONL, then rerun without changing resumed
   accounting.
10. Cancelling a reserved future before it starts moves that attempt from
    `attempted_calls` to `skipped_calls`; a future that cannot be cancelled must
    settle normally.
11. `validate_model_id()` rejects moving aliases such as `sonnet`, `opus`, and
    `haiku`, and accepts only lowercase `claude-...` identifiers containing a
    numeric version segment, matched by `^claude-[a-z0-9-]*\d[a-z0-9-]*$`.
12. Double cancellation, double settlement, or a `mark_skipped()` count larger
    than the unaccounted planned remainder raises without changing counters.
13. A cache validator exception raises `CacheValidationError` and does not
    increment `resumed_calls`, invalidate evidence, or permit a fresh live call.

Use concrete record fields:

```json
{
  "schema_version": 1,
  "attempt_key": "sha256-hex",
  "kind": "activation:train",
  "spec": {
    "query": "complete unabridged query",
    "run_index": 0,
    "skill_name": "skill-creator",
    "skill_content_sha256": "sha256-hex",
    "model": "claude-sonnet-4-6",
    "claude_version": "complete version string",
    "distractor_sha256": "sha256-hex",
    "harness_version": 1
  },
  "status": "success",
  "outcome": "trigger",
  "value": null,
  "payload": null,
  "artifacts": [],
  "error_status": null,
  "error_message": null,
  "invalidation_reason": null,
  "recorded_at": "2026-09-25T00:00:00Z"
}
```

The parser accepts `success`, `error`, and `invalidated` statuses and the
outcome values `trigger`, `no_trigger`, `engaged`, `not_engaged`,
`red_complete`, `green_complete`, and `description`. Description checkpoints
store a non-empty `value`. Behavioral successes may store a JSON-serializable
`payload` and an ordered artifact manifest containing workspace-relative paths
and SHA-256 digests. An invalidation record requires a non-empty
`invalidation_reason` and no outcome. Unknown schema versions fail closed.

Persist the complete `AttemptSpec` beside its key. Never abbreviate queries,
case IDs, model/version strings, paths, digests, or other evidence-bearing
values in the checkpoint or final pipeline summary; presentation layers may
summarize only when they retain a direct path to the complete artifact.

- [ ] **Step 2: Verify the tests fail**

From `.claude/skills/skill-creator`, run:

```powershell
python -m pytest "scripts/Regression tests/test_eval_control.py" -q
```

Expected: collection fails because `scripts/eval_control.py` does not exist.

- [ ] **Step 3: Implement the minimal controller**

Create these public interfaces in `eval_control.py`:

- `ClaudeCliError(RuntimeError)` with `status: int | None` and a preserved
  message, plus an explicit `__reduce__()` returning constructor arguments so
  the exception is pickle-safe across `ProcessPoolExecutor` workers;
- `CacheValidationError(RuntimeError)` for a validator that raises instead of
  returning an acceptance result;
- `validate_model_id(value: str) -> str` using the single shared versioned-ID
  rule tested above;
- immutable `AttemptSpec` with `kind`, `query`, `run_index`, `skill_name`,
  `skill_content_sha256`, `model`, `claude_version`, `distractor_sha256`, and
  `harness_version=1`, plus `key() -> str` over canonical sorted-key JSON;
- immutable `ArtifactEvidence(relative_path: str, sha256: str)`;
- immutable `CachedResult` with `outcome: str`, optional `value: str`, optional
  `payload: dict[str, object]`, and `artifacts: tuple[ArtifactEvidence, ...]`;
- immutable `CounterSnapshot` with exact fields `planned_calls`,
  `attempted_calls`, `resumed_calls`, `successful_calls`, `error_calls`, and
  `skipped_calls`;
- `CheckpointStore(path: Path)`;
- `CheckpointStore.lookup(attempt_key) -> CachedResult | None`;
- `CheckpointStore.append_success(spec, result: CachedResult) -> None`;
- `CheckpointStore.append_error(spec, error) -> None`;
- `CheckpointStore.append_invalidation(spec, reason: str) -> None`;
- `EvaluationControl(*, max_calls: int, planned_calls: int, checkpoint: CheckpointStore | None, deadline_seconds: float | None, clock: Callable[[], float] = time.monotonic)`;
- `EvaluationControl.consume_cached(spec, validator: Callable[[CachedResult], str | None]) -> CachedResult | None`,
  where `None` accepts and a reason string rejects;
- `EvaluationControl.extend_plan(additional_calls: int) -> None` for an adaptive
  stage known only after earlier results;
- `EvaluationControl.reserve_call(spec) -> bool`;
- `EvaluationControl.cancel_reserved(spec) -> None`;
- `EvaluationControl.record_success(spec, result: CachedResult) -> None`;
- `EvaluationControl.record_error(spec, error) -> None`;
- `EvaluationControl.mark_skipped(count: int) -> None`;
- `EvaluationControl.snapshot() -> CounterSnapshot`.

Expose read-only `planned_calls`, `attempted_calls`, `resumed_calls`,
`successful_calls`, `error_calls`, `skipped_calls`, `stop_reason`, and
`circuit_open` properties. `reserve_call()` increments `attempted_calls` only
when it grants permission immediately before executor submission.
`consume_cached()` looks up the result and runs the validator. It increments
`resumed_calls` only on acceptance; on rejection it appends and fsyncs an
`invalidated` record before returning `None`. `record_success()` and
`record_error()` settle one granted call; status `429` sets `circuit_open` and
`stop_reason` to `rate_limited`. `cancel_reserved()` is valid only for an
unsettled reservation whose `Future.cancel()` returned true; it decrements
attempted and increments skipped. Internally track outstanding attempt keys and
reject double settlement. `mark_skipped(count)` accounts for attempts never
reserved when the current stage stops. A rejected permit sets `budget_exhausted`
or `deadline_exceeded` once and never mutates the attempted count. `stop_reason`
starts as `None`; the first permit rejection fixes it, except a later observed
`429` always upgrades it to `rate_limited`. `extend_plan()` is the only way to
change `planned_calls` and is used by release confirmation after the 34-call
base; it may take the plan above a user-supplied lower cap because `max_calls`
limits launches, not declared work. All fixed evaluators set their full plan at
controller construction. Attempt kinds are distinct and stable:
`activation:smoke`, `activation:train`, `activation:holdout`,
`activation:train-confirmation`, `activation:holdout-confirmation`,
`early-exit`, `early-exit:confirmation`, `readiness:red`, `readiness:green`,
`description:rewrite`, and `description:shorten`.

If a validator raises, wrap it in `CacheValidationError` without changing the
checkpoint or counters; the caller returns a partial result and starts no live
replacement. Guard every accounting transition so cancelled, skipped, resumed,
and attempted totals cannot exceed `planned_calls`.

Keep checkpoint writes in the parent process. Open the JSONL file in append
mode, write one complete line, flush it, and call `os.fsync()` before reporting
the attempt as persisted. Never treat an error record as a reusable outcome. Use
the injected monotonic clock in deadline tests; do not patch global time.

- [ ] **Step 4: Verify the controller and schema pass**

Run:

```powershell
python -m pytest "scripts/Regression tests/test_eval_control.py" -q
```

Expected: all controller and checkpoint-parser tests pass without resolving or
launching the Claude CLI.

- [ ] **Step 5: Commit the contract slice**

```powershell
git add ".claude/skills/skill-creator/scripts/eval_control.py" ".claude/skills/skill-creator/scripts/Regression tests/test_eval_control.py"
git commit -m "feat(skill-creator): add bounded eval control contract"
```

### Task 2: Make activation evaluation bounded, resumable, and rate-limit safe

**Files**

- Modify: `.claude/skills/skill-creator/scripts/run_eval.py`
- Modify: `.claude/skills/skill-creator/scripts/run_loop.py`
- Modify:
  `.claude/skills/skill-creator/scripts/Regression tests/test_run_eval.py`
- Create:
  `.claude/skills/skill-creator/scripts/Regression tests/test_run_loop.py`

- [ ] **Step 1: Write failing activation scheduler tests**

Extend `test_run_eval.py` with tests proving:

1. `_result_event_decision()` raises `ClaudeCliError` and preserves numeric
   status `429`.
2. The scheduler never has more than `num_workers` futures submitted and not
   completed; it does not enqueue the full matrix.
3. After the first `429`, no new attempts are submitted and not-started futures
   are cancelled. A fixture with one rate-limited future, one successfully
   cancelled pending future, and one successful in-flight future proves both
   cancellation accounting and late-success persistence.
4. A budget of two permits on a five-attempt matrix produces exactly two
   submissions and three skipped attempts.
5. Successful checkpoint outcomes are inserted into the normal result matrix
   without launching a worker.
6. Error checkpoints are retried rather than counted as completed.
7. A partial result includes top-level execution metadata and cannot pass:

```json
{
  "execution": {
    "status": "partial",
    "stop_reason": "rate_limited",
    "planned_calls": 5,
    "attempted_calls": 2,
    "successful_calls": 1,
    "error_calls": 1,
    "resumed_calls": 1,
    "skipped_calls": 2
  }
}
```

1. Existing fields retain their meanings: `runs` remains planned runs,
   `completed_runs` includes fresh and cached successes, `execution_errors`
   counts attempted failures, and the new `skipped_runs` counts attempts that
   never started.
2. The CLI defaults to two workers and requires a positive `--max-model-calls`
   and an explicit full `--model` ID for a live run.
3. A legacy programmatic caller that omits `control` receives an implicit
    controller capped at `min(6, planned_calls)`, with no checkpoint or
    deadline; the result marks `implicit_safe_default: true`.
4. `_evaluate_cases()` in `run_loop.py` treats any partial activation result as
    unavailable and stops before rewrite or holdout work.
5. `pickle.loads(pickle.dumps(ClaudeCliError(429, ...)))` preserves status and
    message, and one minimal real `ProcessPoolExecutor` invocation of
    `_result_event_decision()` transports a stubbed `429` result event back to
    the parent without launching Claude.
6. With a controller planned for the 34-call release base, the first 20-call
    activation adapter reports a locally complete stage while the global
    controller remains in progress.

- [ ] **Step 2: Verify the new tests fail**

Run:

```powershell
python -m pytest "scripts/Regression tests/test_run_eval.py" "scripts/Regression tests/test_run_loop.py" -q
```

Expected: failures show the current eager submission, untyped `RuntimeError`,
missing execution metadata, and missing control parameters.

- [ ] **Step 3: Refactor error parsing and scheduling**

Make these exact changes:

- Replace the result-event `RuntimeError` for Claude API failures with
  `ClaudeCliError(status, message)`.
- Replace submit-all scheduling with a deterministic ordered attempt list and a
  bounded producer loop. Submit only until the in-flight set reaches
  `min(num_workers, remaining_attempts)`; after each completion, checkpoint the
  result and submit the next attempt only if the controller still grants
  permits.
- On `429`, call `control.record_error()`, open the circuit, cancel futures that
  have not started, allow only already-running workers to finish, and do not
  refill the queue. For each `future.cancel()` that returns true, call
  `control.cancel_reserved(spec)`; if cancellation returns false, let that
  future settle normally.
- Build `AttemptSpec` from the actual query, run index, model, resolved Claude
  CLI version, SHA-256 of the generated skill content, and the digest of sorted
  distractor `SKILL.md` contents.
- Replace the UUID-derived temporary skill name with a bounded stable name based
  on the original skill name plus the first eight characters of the skill
  content digest. Separate temporary directories still provide filesystem
  isolation.
- Add `control: EvaluationControl | None = None` to `run_eval()` and keep
  `run_single_query()` free of shared mutable control state; the parent reserves
  permits before process submission. When `control` is omitted, create the
  documented implicit controller capped at `min(6, planned_calls)`, set
  `implicit_safe_default: true`, and never inherit an unbounded default.
- Add `execution`, `attempted_runs`, and `skipped_runs` as additive result
  fields. Preserve all existing result fields for viewer and report
  compatibility.
- Take a `CounterSnapshot` at adapter entry and compute `execution` from deltas
  for that adapter's ordered attempt set. Mark only that stage's unstarted
  attempts skipped. A stage is `complete` only when every local attempt has a
  fresh or cached successful outcome; any local error or skip is `partial`.
  Never derive stage completion from the controller's still-unfinished global
  plan. Only `pipeline-summary.json` reports controller-global totals.
- Update `run_loop._evaluate_cases()` in this slice so a partial result is
  immediately propagated as unavailable. This keeps the repository safe and
  internally consistent before Task 3 passes one shared controller.
- Change CLI worker default from 10 to 2. Require a positive `--max-model-calls`
  and explicit full `--model`; add optional `--checkpoint` and positive
  `--deadline-seconds` flags. All entrypoints call the shared
  `validate_model_id()` function rather than implementing their own checks.
- When a `429` completes alongside another in-flight success, persist that
  success before closing the batch. Cancel only not-started futures; let
  already-running calls settle and checkpoint their results without refilling
  the queue.

- [ ] **Step 4: Verify activation tests pass**

Run:

```powershell
python -m pytest "scripts/Regression tests/test_run_eval.py" "scripts/Regression tests/test_run_loop.py" -q
python -m unittest scripts.test_regressions
```

Expected: activation tests pass with fake executors/stub Claude binaries, and
the compatibility suite makes no external model call.

- [ ] **Step 5: Commit the activation slice**

```powershell
git add ".claude/skills/skill-creator/scripts/run_eval.py" ".claude/skills/skill-creator/scripts/run_loop.py" ".claude/skills/skill-creator/scripts/Regression tests/test_run_eval.py" ".claude/skills/skill-creator/scripts/Regression tests/test_run_loop.py"
git commit -m "fix(skill-creator): bound and resume activation probes"
```

### Task 3: Bound description optimization and stop plateaus

**Files**

- Modify: `.claude/skills/skill-creator/scripts/run_loop.py`
- Modify: `.claude/skills/skill-creator/scripts/improve_description.py`
- Modify:
  `.claude/skills/skill-creator/scripts/Regression tests/test_run_loop.py`
- Create:
  `.claude/skills/skill-creator/scripts/Regression tests/test_improve_description.py`

- [ ] **Step 1: Write failing optimizer-control tests**

Cover these behaviors with patched `run_eval()` and `_call_claude()` functions:

1. `run_loop()` passes the same `EvaluationControl` instance to every trigger
   batch and description rewrite.
2. A rewrite and its optional over-limit shortening each consume one distinct
   permit.
3. A cached rewrite response is reused without invoking Claude.
4. If the proposed description is identical to or has already appeared in
   history, the loop exits with `duplicate_description` before another trigger
   batch.
5. With `patience=1`, a second evaluated description that does not improve
   `train_passed` exits with `no_improvement`.
6. A rate-limit or exhausted budget returns a partial result with the controller
   stop reason and does not evaluate holdout.
7. Preflight calculation reports the maximum trigger probes plus up to two
   rewrite calls per non-final iteration; it does not claim those calls have
   occurred.
8. Both the `run_loop.py` and `improve_description.py` live CLIs reject a
   missing full `--model` or non-positive `--max-model-calls` before resolving
   Claude.
9. Standalone `improve_description.py` with cap one permits the rewrite but
   blocks an over-limit shortening call; cap two permits both. A cached rewrite
   consumes no call.
10. A cached description that is empty, malformed, or still exceeds the length
    limit fails its `consume_cached()` validator, does not increment
    `resumed_calls`, and is regenerated under a fresh permit.

- [ ] **Step 2: Verify the optimizer tests fail**

Run:

```powershell
python -m pytest "scripts/Regression tests/test_run_loop.py" "scripts/Regression tests/test_improve_description.py" -q
```

Expected: failures identify missing control propagation and missing plateau
termination.

- [ ] **Step 3: Implement bounded optimization**

- Add `control: EvaluationControl` and `patience: int` to `run_loop()`.
- Pass the controller into every `_evaluate_cases()` call and into
  `improve_description()`.
- Add the controller and an `AttemptSpec` to `_call_claude()`; format attempt
  kinds as `description:rewrite` and `description:shorten`, with the iteration
  number in `run_index` and the optimizer prompt in `query`.
- Persist successful description text as
  `CachedResult(outcome="description", value=<text>)`. Do not reuse malformed or
  over-limit responses. Pass a description-specific validator to
  `consume_cached()` so rejection occurs before resumed accounting.
- Track normalized descriptions already evaluated and the best training score.
  Implement `duplicate_description` and `no_improvement` exits before another
  costly evaluation.
- Require explicit full `--model` and positive `--max-model-calls` in both live
  CLIs. Add optional `--checkpoint` and `--deadline-seconds` to both; add
  `--patience` to `run_loop.py`; set its worker default to two. The standalone
  `improve_description.py` entrypoint constructs its own controller and cannot
  bypass the permit/checkpoint path.
- Print the worst-case call plan before starting. A cap lower than the
  worst-case plan is allowed, but the output must say the run may stop partial.
  On any plateau or early stop, mark every unstarted planned attempt skipped so
  the final accounting invariant still holds.

- [ ] **Step 4: Verify optimizer tests pass**

Run:

```powershell
python -m pytest "scripts/Regression tests/test_run_loop.py" "scripts/Regression tests/test_improve_description.py" -q
python -m py_compile scripts/run_loop.py scripts/improve_description.py
```

Expected: all optimizer tests and compilation pass without a live Claude call.

- [ ] **Step 5: Commit the optimizer slice**

```powershell
git add ".claude/skills/skill-creator/scripts/run_loop.py" ".claude/skills/skill-creator/scripts/improve_description.py" ".claude/skills/skill-creator/scripts/Regression tests/test_run_loop.py" ".claude/skills/skill-creator/scripts/Regression tests/test_improve_description.py"
git commit -m "fix(skill-creator): cap description optimization loops"
```

### Task 4: Apply the controller to behavioral evaluators

**Files**

- Modify: `.claude/skills/skill-creator/scripts/run_early_exit_eval.py`
- Modify: `.claude/skills/skill-creator/scripts/run_red_green_eval.py`
- Modify: `.claude/skills/skill-creator/scripts/run_readiness_pressure_eval.py`
- Modify:
  `.claude/skills/skill-creator/scripts/Regression tests/test_run_early_exit_eval.py`
- Create:
  `.claude/skills/skill-creator/scripts/Regression tests/test_run_red_green_eval.py`
- Modify:
  `.claude/skills/skill-creator/scripts/Regression tests/test_run_readiness_pressure_eval.py`

- [ ] **Step 1: Write failing behavioral-control tests**

Add tests proving:

1. A stream `result` with `is_error: true` and `api_error_status: 429` raises
   `ClaudeCliError`; it cannot be interpreted as `not_engaged`.
2. Early-exit cases reuse successful checkpoint outcomes and stop scheduling
   immediately after the circuit opens.
3. Readiness RED and GREEN attempts consume separate permits under one shared
   controller.
4. A cached RED or GREEN attempt is reusable only when every artifact in its
   manifest exists under the workspace and matches its SHA-256 digest; otherwise
   that side is rerun without incrementing `resumed_calls`.
5. A partial RED/GREEN pair produces `unavailable`, never PASS, and preserves
   evidence already written by the completed side.
6. A cached RED side plus missing GREEN side reconstructs the RED `CaseSummary`
   from checkpoint payload, runs only GREEN, and then performs the normal pair
   comparison.
7. Direct `run_red_green_eval.py` tests cover `429` parsing, usage extraction,
   permit rejection, success checkpointing after artifact flush, and required
   live CLI flags.

- [ ] **Step 2: Verify the behavioral tests fail**

Run:

```powershell
python -m pytest "scripts/Regression tests/test_run_early_exit_eval.py" "scripts/Regression tests/test_run_red_green_eval.py" "scripts/Regression tests/test_run_readiness_pressure_eval.py" -q
```

Expected: current code misclassifies or lacks the new budget/checkpoint
interfaces.

- [ ] **Step 3: Wire the shared controller**

- Reuse `ClaudeCliError` parsing rather than matching error strings.
- Add `EvaluationControl` to `run_cases()` and each RED/GREEN orchestration
  function.
- Extract
  `run_readiness_evaluation(candidate: Path, output_dir: Path, control: EvaluationControl)`
  from the current `main()` so `run_pipeline.py` can call it without a nested
  subprocess.
- Make `run_red_green_eval.run_claude()` return explicit error status and usage
  data when present in the terminal result event.
- Reserve the permit before launching Claude, append checkpoint success only
  after required evidence files are flushed, and append typed errors otherwise.
- For each RED/GREEN success, serialize the complete `CaseSummary` into
  `CachedResult.payload`. Build a sorted artifact manifest for every file under
  that side's case directory using workspace-relative paths and SHA-256 digests.
  On resume, reject paths escaping the workspace, verify every digest,
  reconstruct the typed summary from the payload, and pass that validation into
  `consume_cached()`. Run only the missing or invalid side before comparing the
  pair. Early-exit results have no artifact manifest and validate/reuse their
  boolean outcome directly.
- Add the same budget, checkpoint, and deadline CLI flags to the standalone
  behavioral commands so bypassing the pipeline does not restore unbounded
  behavior. Require an explicit full `--model` and positive `--max-model-calls`
  for every standalone live invocation.

- [ ] **Step 4: Verify behavioral tests pass**

Run:

```powershell
python -m pytest "scripts/Regression tests/test_run_early_exit_eval.py" "scripts/Regression tests/test_run_red_green_eval.py" "scripts/Regression tests/test_run_readiness_pressure_eval.py" -q
python -m unittest scripts.test_regressions
```

Expected: all behavioral tests pass using fixtures/mocks only.

- [ ] **Step 5: Commit the behavioral slice**

```powershell
git add ".claude/skills/skill-creator/scripts/run_early_exit_eval.py" ".claude/skills/skill-creator/scripts/run_red_green_eval.py" ".claude/skills/skill-creator/scripts/run_readiness_pressure_eval.py" ".claude/skills/skill-creator/scripts/Regression tests/test_run_early_exit_eval.py" ".claude/skills/skill-creator/scripts/Regression tests/test_run_red_green_eval.py" ".claude/skills/skill-creator/scripts/Regression tests/test_run_readiness_pressure_eval.py"
git commit -m "fix(skill-creator): protect behavioral eval calls"
```

### Task 5: Add fixed smoke coverage and the three-mode pipeline CLI

**Files**

- Create: `.claude/skills/skill-creator/evals/activation-smoke.json`
- Create: `.claude/skills/skill-creator/scripts/run_pipeline.py`
- Create:
  `.claude/skills/skill-creator/scripts/Regression tests/test_run_pipeline.py`
- Modify: `.claude/skills/skill-creator/scripts/test_regressions.py`

- [ ] **Step 1: Add failing pipeline tests and the smoke fixture**

Create `activation-smoke.json` with these existing representative cases:

- positive: create a new Agent Skill;
- positive: organize scripts, references, and assets around an existing
  `SKILL.md`;
- negative: package a Python project as a wheel;
- hard negative: optimize activation conditions for a browser extension.

In `test_run_pipeline.py`, patch local command execution and every live adapter,
then assert:

1. `check` runs `quick_validate`, `unittest`, and `pytest`, never resolves the
   Claude executable, reports zero planned/attempted calls, and exits zero when
   all local commands pass.
2. `check` stops and exits one after the first failed local gate.
3. `smoke --dry-run` reports four planned calls and a default cap of six without
   running local or live adapters.
4. `release --dry-run` reports a 34-call base and 40-call maximum: 20
   activation, 8 holdout, 4 early-exit, 2 readiness-pressure, and a six-call
   adaptive confirmation reserve.
5. Live modes always run `check` first and make no live call when `check` fails.
6. The same `EvaluationControl` instance reaches every live stage.
7. Exit codes are stable: `0` complete/pass, `1` complete/fail, `2`
   partial/unavailable/invalid input.
8. `--max-model-calls` below the base plan is accepted only with a clear
   partial-run warning; it never exceeds the cap.
9. Dry runs require neither `--workspace` nor `--model`, create no directories,
   and print both fields as `not-applicable`.
10. After a completed release base, at most three failed activation, holdout, or
    early-exit cases receive exactly two confirmation attempts each. Selection
    order is holdout positives, activation positives, early-exit cases, then
    remaining failed cases in fixture order. Readiness pairs are never retried
    automatically.
11. The 20-call activation stage can be locally complete while the shared
    34-call base controller is globally in progress; the final pipeline summary
    alone reports global counters.
12. When any release stage returns partial, the pipeline does not invoke later
    adapters; it marks exactly their fixed base attempts skipped and writes a
    partial summary with valid global accounting.
13. The user-visible summary reports independent `execution_status`,
    `evidence_status`, `verdict`, `mode_ready`, and `release_ready` gates. A safe
    or complete execution cannot conceal incomplete evidence, and smoke can be
    `mode_ready` without ever being `release_ready`.
14. Every fixture case appears exactly once in the applicable stage matrix with
    its complete ID, expected result, attempt records, and `pass`, `fail`,
    `error`, or `not_run` status. Every `not_run` entry carries
    `evidence_code: "NHR"` and a reason.
15. An adversarial summary that omits a case, truncates an ID, references a
    missing or digest-mismatched artifact, violates counter invariants, or sets
    `release_ready: true` after a partial stage yields blocking
    `EvidenceFinding` records.
16. Validator process status and findings remain independent: a validator error
    with zero findings is still `evidence_status: "incomplete"` and cannot make
    either readiness flag true.
17. A fully passing checkpoint with a missing user-visible result artifact does
    not support readiness; internal/cache success cannot substitute for
    retained evidence.
18. The complete summary and retained artifacts allow a fresh process to rerun
    `validate_pipeline_summary()` without evaluator memory and reproduce the
    same readiness gates.

- [ ] **Step 2: Verify pipeline tests fail**

Run:

```powershell
python -m pytest "scripts/Regression tests/test_run_pipeline.py" -q
```

Expected: collection fails because `run_pipeline.py` does not exist.

- [ ] **Step 3: Implement the pipeline**

Create immutable `EvidenceFinding(code, category, severity, message)`, plus
`build_execution_plan(mode)`, `run_check(skill_root)`,
`run_smoke(skill_root, workspace, control)`,
`run_release(skill_root, workspace, control)`,
`build_pipeline_summary(...)`, `validate_pipeline_summary(summary, workspace)`,
`write_pipeline_summary(...)`, and `main(argv=None)`. Runner and builder
functions return `dict[str, object]`; the validator returns
`list[EvidenceFinding]`; `main` returns the documented process exit code.

`run_check()` invokes, in order and with `cwd=skill_root`,
`[sys.executable, "-m", "scripts.quick_validate", "."]`,
`[sys.executable, "-m", "unittest", "scripts.test_regressions"]`, and
`[sys.executable, "-m", "pytest", "scripts/Regression tests", "-q"]`. Use
argument arrays with `shell=False`, stop after the first nonzero result, and
capture the exact command, Python/tool version, exit code, and complete stdout
and stderr. In a live workspace, write logs beneath
`workspace / "evidence" / "check"`; standalone `check` emits the same complete
structured result to stdout without requiring a workspace.

CLI contract:

```text
python -m scripts.run_pipeline check
python -m scripts.run_pipeline smoke --dry-run
python -m scripts.run_pipeline release --dry-run
python -m scripts.run_pipeline smoke --workspace PATH --model FULL_MODEL_ID
python -m scripts.run_pipeline release --workspace PATH --model FULL_MODEL_ID
```

Add `--dry-run`, `--max-model-calls`, `--checkpoint`, `--deadline-seconds`, and
`--num-workers`. Use mode defaults of zero, six, and 40 calls; use two workers
for live activation probes. Require `--workspace` and a full explicit `--model`
only for non-dry live modes. Default the checkpoint to
`workspace / "checkpoints" / f"{mode}.jsonl"`. A dry run must not resolve
Claude, create the workspace, or create a checkpoint. The smoke cap of six is
intentional two-call safety headroom; smoke has no automatic retry policy, so
its declared plan remains four calls.

`release` must evaluate a frozen candidate and must not import or invoke
`improve_description`. Its stages are:

1. deterministic `check`;
2. `activation-eval.json`, one run per query;
3. `activation-holdout.json`, one run per query;
4. `early-exit-cases.json`, one run per case;
5. one readiness-pressure RED/GREEN pair;
6. if the 34-call base completed, select up to three failed non-readiness cases
   in the documented priority order, call `control.extend_plan(2 * count)`, and
   run each twice more, stopping at the shared cap;
7. build and validate the authoritative evidence summary;
8. write `workspace / "pipeline-summary.json"` atomically.

If a base stage returns partial, that adapter owns accounting for its own
unstarted attempts. `run_release()` must not invoke any later adapter; it calls
`control.mark_skipped()` once with the sum of the untouched downstream base
stage sizes. It does not extend the plan for adaptive confirmation because the
base did not complete. Tests cover an activation-stage partial (14 downstream
skips) and a holdout-stage partial (six downstream skips) to prevent double
accounting.

The adaptive policy preserves every distinct current case while avoiding the old
three-runs-for-every-case multiplier. A selected case passes confirmation only
when at least half of all its attempts trigger or engage as expected; with one
failed base attempt, both confirmation attempts must pass. Unselected base
failures remain failures. The final execution plan is 34 plus the selected
confirmation attempts, from zero to six; only then finalize the accounting
invariant `planned_calls = resumed_calls + attempted_calls + skipped_calls`.
Report `base_calls: 34` and `maximum_calls: 40` separately.

Before live execution, print the mode, each stage's planned calls, the total,
the hard cap, checkpoint path, workspace, model source, and concurrency. Each
adapter writes its complete result under `workspace / "evidence" / <stage>`;
the summary references every retained file with its workspace-relative path,
byte size, and SHA-256 digest.

The authoritative `pipeline-summary.json` contains:

- `schema_version`, mode, timestamps, exact CLI arguments, workspace-relative
  checkpoint path/digest, and global controller counters;
- `harness` identity: harness version, complete Python and Claude CLI versions,
  full model ID, and the path/digest of `run_pipeline.py`, `eval_control.py`, and
  each invoked evaluator script;
- an `inputs` manifest with the complete source path and SHA-256 for the target
  `SKILL.md`, applicable eval fixtures, and every behavior-affecting input
  already represented in `AttemptSpec`;
- one record per planned stage and case, including exact ID/query, expected and
  observed outcomes, attempts, local counters, status, `NHR` reason when not
  run, and retained artifact references;
- top-level `execution_status` (`complete`, `short_circuited`, `partial`, or
  `not_run`), `evidence_status` (`complete` or `incomplete`), `verdict` (`pass`,
  `fail`, `unavailable`, or `not_applicable`), `mode_ready`, and
  `release_ready`;
- `evidence_validation` with validator version, SHA-256 identity, execution
  status, and the complete structured findings list.

`validate_pipeline_summary()` performs both structural and semantic checks: all
expected stages/cases are present exactly once; IDs are unabridged; input and
artifact digests match; local/global counters reconcile; skipped calls map to
`not_run` cases; and readiness is derived rather than trusted. Build the
candidate with `evidence_validation.status: "pending"`, validate every other
field, then attach the validator identity, execution status, and findings. A
fresh-process revalidation ignores the recorded findings, recomputes them, and
compares the derived gates. If the validator itself raises, catch it at the CLI
boundary and record `status: "error"`, the exception class/message, incomplete
evidence, and false readiness. `release_ready` is true only for a release with complete
execution, complete validated evidence, and a passing verdict. `mode_ready` may
be true for a passing `check` or `smoke`, but `release_ready` remains false.
Write through a temporary sibling plus `os.replace()` only after validation;
on blocking findings, still write the exact summary with
`evidence_status: "incomplete"`, readiness false, and all findings visible.

Exit codes are projections of the separate gates, not replacements for them:
`0` for dry-run or a ready selected mode; `1` for conclusive complete or
short-circuited failure; `2` for invalid input, unavailable execution, validator
failure, or incomplete evidence.

Add `run_pipeline.py` to the script `--help` regression list. Do not add
`eval_control.py` because it is a library module rather than a CLI.

- [ ] **Step 4: Verify pipeline tests and dry runs pass**

Run:

```powershell
python -m pytest "scripts/Regression tests/test_run_pipeline.py" -q
python -m scripts.run_pipeline smoke --dry-run
python -m scripts.run_pipeline release --dry-run
```

Expected: tests pass; smoke reports four base calls under cap six; release
reports 34 base calls and a 40-call maximum; each dry run prints its complete
case matrix as `not_run`/`NHR` with false readiness. Neither invokes Claude,
creates a directory, or requires a model.

- [ ] **Step 5: Commit the pipeline slice**

```powershell
git add ".claude/skills/skill-creator/evals/activation-smoke.json" ".claude/skills/skill-creator/scripts/run_pipeline.py" ".claude/skills/skill-creator/scripts/Regression tests/test_run_pipeline.py" ".claude/skills/skill-creator/scripts/test_regressions.py"
git commit -m "feat(skill-creator): add check smoke release pipeline"
```

### Task 6: Update skill routing and evaluation documentation

**Files**

- Modify: `.claude/skills/skill-creator/SKILL.md`
- Modify: `.claude/skills/skill-creator/references/description-optimization.md`
- Modify: `.claude/skills/skill-creator/references/evaluation-workflow.md`
- Modify: `.claude/skills/skill-creator/references/schemas.md`

- [ ] **Step 1: Write documentation acceptance assertions**

Add focused assertions to `test_run_pipeline.py` that read the documentation and
require:

- `check` is the default for ordinary validation/testing and promises zero
  Claude calls;
- `smoke` and `release` require explicit selection;
- model-backed description optimization is not part of any pipeline mode;
- budget exhaustion, deadlines, and `429` produce partial/unavailable evidence,
  never a pass;
- rerunning with the same checkpoint resumes successful attempts;
- generated workspaces and checkpoints stay outside the deployable skill;
- production readiness still requires the release evidence applicable to the
  claimed scope;
- checkpoint completion is not itself evidence completeness or readiness;
- user-visible summaries expose independent execution, evidence, verdict,
  mode-readiness, and release-readiness gates;
- every applicable case is visible, including `not_run`/`NHR` entries, and
  summaries never abbreviate evidence-bearing identifiers;
- the static plan-review score is explicitly distinguished from observed
  pipeline reliability.

- [ ] **Step 2: Verify documentation assertions fail**

Run:

```powershell
python -m pytest "scripts/Regression tests/test_run_pipeline.py" -q
```

Expected: the new documentation contract assertions fail against the current
skill text.

- [ ] **Step 3: Update the smallest responsible documentation sections**

- In `SKILL.md`, replace the ambiguous validation/evaluation routing with the
  three modes and their exact commands. Keep the existing production-readiness
  evidence boundary.
- In `description-optimization.md`, label `run_loop` as a separate, live,
  quota-consuming tuning workflow. Add the required budget/checkpoint flags,
  preflight behavior, and plateau stops.
- In `evaluation-workflow.md`, add one concise mode table near the beginning and
  update execution/retry sections to use checkpoints and circuit-breaker
  semantics. Explain the 34-call release base, six-call targeted confirmation
  reserve, case priority, majority threshold, separate readiness gates, and
  authoritative evidence artifact. Do not duplicate other implementation
  details already documented in the CLI help.
- In `schemas.md`, document the checkpoint record as append-only execution
  evidence, specify that only active successful outcomes are reusable, and
  distinguish planned, attempted, completed, error, resumed, and skipped calls.
  Document value/payload/artifact fields, invalidation records, and the digest
  verification required before a behavioral cache hit. Document the pipeline
  summary gate values and the rule that `not_run` cases carry `NHR` rather than
  silently disappearing.

- [ ] **Step 4: Verify documentation and skill validation pass**

Run:

```powershell
python -m pytest "scripts/Regression tests/test_run_pipeline.py" -q
python -m scripts.quick_validate .
```

Expected: documentation assertions pass and the skill validator prints
`Skill is valid`.

- [ ] **Step 5: Commit the documentation slice**

```powershell
git add ".claude/skills/skill-creator/SKILL.md" ".claude/skills/skill-creator/references/description-optimization.md" ".claude/skills/skill-creator/references/evaluation-workflow.md" ".claude/skills/skill-creator/references/schemas.md"
git commit -m "docs(skill-creator): document bounded evaluation modes"
```

### Task 7: Run the deterministic final gate

**Files**

- Test: `.claude/skills/skill-creator/scripts/*.py`
- Test: `.claude/skills/skill-creator/scripts/Regression tests/*.py`
- Test: `.claude/skills/skill-creator/SKILL.md`

- [ ] **Step 1: Run syntax and focused regression checks**

From `.claude/skills/skill-creator`, run:

```powershell
python -m py_compile scripts/eval_control.py scripts/run_eval.py scripts/run_loop.py scripts/improve_description.py scripts/run_early_exit_eval.py scripts/run_red_green_eval.py scripts/run_readiness_pressure_eval.py scripts/run_pipeline.py
python -m pytest "scripts/Regression tests/test_eval_control.py" "scripts/Regression tests/test_run_eval.py" "scripts/Regression tests/test_run_loop.py" "scripts/Regression tests/test_improve_description.py" "scripts/Regression tests/test_run_early_exit_eval.py" "scripts/Regression tests/test_run_red_green_eval.py" "scripts/Regression tests/test_run_readiness_pressure_eval.py" "scripts/Regression tests/test_run_pipeline.py" -q
```

Expected: compilation succeeds and every focused regression test passes with no
network or Claude call.

- [ ] **Step 2: Run the complete local gate**

Run:

```powershell
python -m scripts.run_pipeline check
```

Expected: the command runs `quick_validate`, `unittest`, and the full regression
suite exactly once, exits zero, and reports `planned_model_calls: 0`,
`attempted_model_calls: 0`, separate complete evidence/execution gates, and
`mode_ready: true` without claiming release readiness.

- [ ] **Step 3: Prove the live plans without spending quota**

Run:

```powershell
python -m scripts.run_pipeline smoke --dry-run
python -m scripts.run_pipeline release --dry-run
```

Expected: smoke reports four base calls under cap six; release reports 34 base
calls and a 40-call maximum; both report zero attempted calls, enumerate all
planned cases as `not_run`/`NHR`, set readiness false, and create no workspace or
checkpoint.

- [ ] **Step 4: Defer real live evidence to an explicit authorized run**

Do not run live smoke or release evaluation as part of normal implementation
verification. When explicitly requested and quota is available, run from the
skill root:

```powershell
python -m scripts.run_pipeline smoke --workspace ../../../skill-creator-workspace --model claude-sonnet-4-6
```

Expected: at most six calls, an append-only checkpoint at
`../../../skill-creator-workspace/checkpoints/smoke.jsonl`, and exit code `0`,
`1`, or `2` according to the documented complete-pass, complete-fail, or
partial/unavailable contract. Independently rerun
`validate_pipeline_summary()` against `pipeline-summary.json`; do not infer the
smoke verdict or evidence status from the checkpoint alone.

## Safety, Rollback, and Verification

- Risk: model calls continue after quota exhaustion.
  - Mitigation: typed `429` errors open a shared circuit; the bounded scheduler
    has at most two calls already in flight.
  - Verification: injected-`429` tests assert no later submission.
- Risk: checkpoint reuse hides changed inputs.
  - Mitigation: fingerprints include all behavior-affecting inputs and the
    harness version; live runs require an explicit full model ID; cached
    behavioral evidence also requires every recorded artifact digest to match.
  - Verification: mutation tests change one fingerprint field at a time.
- Risk: a truncated checkpoint corrupts a resume.
  - Mitigation: append one flushed JSON line at a time and tolerate only the
    final partial line.
  - Verification: crash-tail fixture followed by successful resume.
- Risk: `check` accidentally resolves or launches Claude.
  - Mitigation: keep live adapters out of `run_check()` and enforce with a
    subprocess-spy test.
- Risk: smaller live suites weaken production claims.
  - Mitigation: `smoke` is explicitly non-production evidence; `release`
    preserves all current activation, holdout, early-exit, and readiness cases,
    then uses its six-call reserve to confirm up to three failures twice rather
    than repeating every successful case.
- Risk: counters obscure calls that were never started.
  - Mitigation: reserve a permit immediately before process launch, settle every
    granted permit as success or error, account for cache hits separately, and
    mark all remaining planned attempts skipped.
  - Verification: every complete or partial summary asserts
    `planned_calls = resumed_calls + attempted_calls + skipped_calls` and
    `attempted_calls = successful_calls + error_calls`.
- Risk: internally successful attempts produce an incomplete or misleading
  user-visible artifact.
  - Mitigation: enumerate the full case matrix, retain exact artifacts with
    digests, identify the validator/harness, and derive readiness only after
    semantic validation of the final summary.
  - Verification: adversarial summaries cover omitted/truncated IDs, missing or
    changed artifacts, validator failure, false readiness, and checkpoint-only
    success.
- Risk: proprietary skill text is sent externally.
  - Mitigation: only explicit live modes can invoke Claude; preflight prints the
    scope and model source before execution.
- Rollback: each slice is additive or maintains existing entrypoints. Revert
  `run_pipeline.py` and the controller wiring commits to restore the prior
  commands. Checkpoints are evidence-only JSONL files and require no data
  migration or destructive rollback.
- Compatibility: keep existing `run_eval` result fields and add new metadata;
  update all internal callers while retaining the bounded implicit controller
  for third-party programmatic callers.

## Final Validation

This section scores the implementation plan's static executability only. It is
not an observed reliability score for the future pipeline. Behavioral readiness
remains unverified until the implemented deterministic tests pass and an
explicit live release run produces complete, independently revalidated
evidence.

- Requirement coverage: PASS
- Exact paths: PASS
- Tests before implementation: PASS
- Exact commands and expected outputs: PASS
- No placeholders or undefined references: PASS
- Safety and rollback covered where needed: PASS
- Score: 98/100
- Critical failures: None

## Execution Handoff

- Plan path: `docs/plans/2026-09-25-skill-creator-evaluation-pipeline.md`
- Blocking unknowns: None.
- Required human decision: authorize any real `smoke` or `release` run after
  deterministic implementation verification; implementation itself does not
  require that external run.
- Supported execution mode: execute tasks in order with the repository's
  `executing-plans` or `subagent-driven-development` skill. Tasks 1-6 are
  independently reviewable slices; Task 7 is the deterministic final gate.
- Planned tests versus tests already run: every command in this plan is planned;
  no implementation or pipeline test has been run as part of writing the plan,
  so the plan-review score must not be presented as behavioral evidence.
