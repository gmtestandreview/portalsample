# Evaluation Workflow

Use this reference when testing whether a skill materially improves output quality or execution reliability.

## Principles

- Test realistic user tasks, not synthetic demonstrations.
- Compare a candidate against an appropriate baseline when the runtime permits.
- Keep qualitative review and machine-checkable expectations separate.
- Record only observed timing, token, tool, and error data.
- Treat missing runs or unavailable tooling as missing evidence, not as a pass.
- Do not infer user approval from blank feedback.

## 1. Define representative evals

**Intent:** Define a small, realistic eval set that represents the user outcomes and materially different behaviors the skill is expected to improve.

**Entry criteria:** The skill's intended tasks, outputs, important boundaries, and target users are understood well enough to identify representative work.

**Upstream impact:** The skill contract determines what must be represented. Do not invent capabilities, requirements, or edge cases that are outside the intended scope.

Start with 2-3 realistic user prompts for early iteration. Each prompt should exercise a materially different task, branch, constraint, or failure mode rather than being a paraphrase of another eval.

For each eval, store in `evals/evals.json`:

- a unique `id`;
- the exact user `prompt`;
- a human-readable `expected_output`;
- required input `files`, when applicable;
- `expectations` only for outcomes that can be verified objectively.

Use the schema in `references/schemas.md`.

Prefer tasks that reflect normal user behavior and meaningful boundaries. Do not use synthetic demonstrations merely because they are easy to grade. Keep subjective writing, design, or judgment quality for human or rubric-based review rather than weak machine checks.

For early iteration, optimize for coverage rather than count. Before making high-confidence deployment claims, expand the set to cover the major workflows, material branches, important failure modes, and regression-sensitive behaviors relevant to the claimed scope.

Do not add or rewrite evals solely to match behavior already observed from the candidate. If an eval changes materially, treat it as a new or revised test case and preserve the previous evidence separately.

**Exit criteria:** The eval set is schema-valid, realistic, non-redundant, and covers the materially different behaviors needed for the current evaluation claim. Each eval has a clear expected outcome, and any machine-checkable expectations are objectively verifiable.

**Downstream impact:** This set becomes the fixed task contract for baseline preservation, candidate/baseline execution, grading, benchmarking, and later regression comparison. Coverage gaps or biased eval selection weaken every downstream conclusion.

## 2. Preserve the baseline

**Intent:** Establish a fixed comparison control so differences observed later can be attributed to the candidate rather than changed inputs, instructions, or baseline drift.

**Entry criteria:** The representative eval set for the iteration is defined, and it is clear whether the candidate is a new skill or a revision of an existing skill.

**Upstream impact:** Step 1 defines the tasks and inputs that both sides must receive. Once the comparison begins, do not silently change those inputs or redefine the baseline.

Choose the baseline before candidate evaluation:

- **New skill:** use the same task without access to the candidate skill.
- **Existing skill:** snapshot the original before editing and use that unchanged snapshot as the baseline.
- **Later iteration:** freeze the intended prior version before modifying the next candidate.

Record enough provenance to identify both sides unambiguously, such as their path, snapshot/version, or equivalent immutable identifier.

Keep candidate and baseline task inputs identical. The baseline must not receive candidate instructions, resources, or modifications.

Use one configuration pair consistently within an iteration:

- `with_skill` / `without_skill`; or
- `new_skill` / `old_skill`.

Do not replace, mutate, or relabel either side after runs begin. If the baseline or comparison contract changes materially, start a new iteration rather than mixing the evidence.

**Exit criteria:** The candidate and baseline are separately identifiable, the baseline is preserved and unchanged, the comparison pair is fixed, and both sides are ready to receive the same eval inputs under equivalent execution constraints.

**Downstream impact:** This pair becomes the comparison identity used by the workspace, executors, graders, benchmark aggregation, blind comparison, and iteration history. Baseline contamination or drift invalidates downstream attribution and requires affected comparisons to be rerun.

## 3. Establish workspace layout

**Intent:** Create an isolated, deterministic workspace where every eval, configuration, run, and generated artifact can be traced without contaminating the deployable skill.

**Entry criteria:** The eval set is defined, the candidate/baseline pair is frozen, and the iteration identity is known.

**Upstream impact:** Step 1 determines the eval identities and Step 2 determines the comparison pair. Preserve both exactly in the workspace structure.

Use a sibling workspace rather than placing generated evaluation evidence inside the deployable skill:

```text
<skill-name>-workspace/
└── iteration-<n>/
    └── eval-<id-or-name>/
        ├── eval_metadata.json
        ├── with_skill/
        │   └── run-1/
        │       ├── outputs/
        │       ├── transcript.md
        │       ├── grading.json
        │       └── timing.json
        └── without_skill/
            └── run-1/
                └── ...
```

Equivalent `new_skill` / `old_skill` configuration directories are supported. Use the configuration pair chosen in Step 2 consistently throughout the iteration.

Treat each run directory as immutable evidence after the run completes. Repeated execution should create a new `run-N` rather than overwrite prior evidence.

Use deterministic, collision-resistant eval and run identities. Do not depend on filesystem discovery order or lexical ordering when numbered runs are consumed later.

Create only the directories required before execution. Do **not** pre-create or synthesize `transcript`, `timing`, `grading`, metrics, or output evidence that the responsible executor, runtime, or grader did not actually produce.

Keep generated benchmark, review, and feedback artifacts inside the workspace or iteration evidence area, not in the deployable skill.

**Exit criteria:** A clean sibling workspace exists with one unambiguous path for every eval/configuration/run, configuration names match the frozen baseline pair, prior runs cannot be silently overwritten, and no unobserved evidence files have been fabricated.

**Downstream impact:** Step 4 receives stable output locations for execution; Steps 5-10 depend on these paths for metadata, transcripts, grading, timing, aggregation, and review. Ambiguous identities, overwritten runs, or fabricated placeholder evidence can invalidate provenance and downstream benchmark conclusions.

## 4. Execute candidate and baseline runs

**Intent:** Produce comparable behavioral evidence for the candidate and baseline while minimizing environmental drift, cross-contamination, and execution bias.

**Entry criteria:** The eval set is fixed, the candidate/baseline pair is frozen, and isolated run directories exist for both configurations.

**Upstream impact:** Steps 1-3 determine the exact task, comparison identities, inputs, and evidence locations. Do not alter them during execution.

For each eval, execute the candidate and baseline under equivalent conditions.

When independent subagents or task concurrency are available, dispatch both sides together to minimize environmental drift. When concurrency is unavailable, run them serially using the same:

- exact task prompt;
- input files and starting state;
- model/runtime configuration where controllable;
- permissions and tool availability;
- execution limits and constraints;
- requested output requirements.

For each executor, provide only what that configuration is entitled to receive:

- the exact task prompt;
- the candidate or baseline skill path, when applicable;
- input file paths;
- its dedicated output directory;
- which outputs matter for evaluation.

Do not expose the baseline to candidate instructions, resources, transcripts, outputs, or conclusions. Do not allow one run to modify shared inputs subsequently consumed by the other; use isolated copies when execution can mutate state.

Record the run that actually occurred. Preserve successful, failed, timed-out, and unavailable executions as distinct outcomes. Do not replace a failed run with a silent retry or fabricate outputs, transcripts, timing, or success evidence.

If a retry is justified by an execution or infrastructure failure, create a new `run-N`, preserve the failed attempt, and apply the same retry policy to both configurations where fairness requires it.

Do not interpret or grade the outputs during execution.

**Exit criteria:** Each attempted configuration has an isolated, provenance-identifiable run whose prompt, inputs, execution constraints, and outcome are known. Comparable runs were executed under materially equivalent conditions, and unavailable or failed runs remain explicit rather than being converted into passes.

**Downstream impact:** These runs become the raw behavioral evidence consumed by metadata recording, execution metrics, grading, benchmarking, blind comparison, and human review. Unequal conditions, contamination, overwritten failures, or asymmetric retries weaken or invalidate downstream candidate-versus-baseline conclusions.

## 5. Record metadata

**Intent:** Bind each eval's execution evidence to the exact task and expectation contract it was created to evaluate.

**Entry criteria:** The eval definition is frozen for the iteration, its workspace exists, and the eval has an unambiguous identity.

**Upstream impact:** Step 1 supplies the eval ID, prompt, and expectations; Step 3 supplies its workspace location; Step 4 produces runs against that contract. Metadata must reflect the frozen eval definition rather than being inferred from the resulting output.

Create one `eval_metadata.json` in each eval directory:

```json
{
  "eval_id": 1,
  "eval_name": "descriptive-name",
  "prompt": "The user's task prompt",
  "expectations": []
}
```

Use a concise, descriptive `eval_name` that distinguishes the task from other evals without becoming a second source of task requirements.

Copy `eval_id`, `prompt`, and `expectations` from the authoritative eval definition. Preserve independently recoverable metadata fields independently; do not discard one valid field because another is missing or unavailable.

Do not store grading decisions, timing, token counts, outputs, inferred success, or other run-derived evidence in `eval_metadata.json`. Those belong to their responsible downstream artifacts.

Treat metadata as immutable for evidence already produced. If the prompt or evaluation contract changes materially, write new metadata under the appropriate new eval or iteration rather than silently reinterpreting existing runs.

**Exit criteria:** `eval_metadata.json` is valid, uniquely identifies the eval, matches the frozen prompt and expectations for the iteration, contains no run-derived conclusions, and does not contradict the authoritative eval definition.

**Downstream impact:** Graders, benchmark aggregation, viewers, analyzers, and later iterations use this metadata to associate evidence with the correct task. Stale, ambiguous, or retrospectively changed metadata can misattribute runs and invalidate downstream comparisons.

## 6. Define expectations

**Intent:** Convert objective task-success criteria into a small set of discriminating assertions that can reliably distinguish genuine completion from superficial compliance.

**Entry criteria:** The eval prompt, expected outcome, inputs, and metadata are frozen, and the task's objectively verifiable success conditions are understood.

**Upstream impact:** Expectations must derive from the Step 1 success criteria and the frozen Step 5 eval contract. Do not design or rewrite them around accidental properties of candidate or baseline outputs already observed.

For each objectively verifiable outcome, write an expectation that:

- tests one meaningful condition;
- can be resolved as pass or fail from available evidence;
- is difficult to satisfy without actually completing the required work;
- checks correctness or substance, not merely presence;
- is stated in user-visible outcome terms when possible.

Prefer checks such as:

- the required artifact exists **and is valid/parseable**;
- a required field contains the **correct** value;
- a generated spreadsheet contains the required formula in the correct location;
- output data matches the relevant source input;
- a contractually required workflow step is evidenced in the transcript.

Avoid expectations such as:

- "the file exists" when it may be empty or incorrect;
- "the output mentions X" when X could appear coincidentally;
- assertions about style or quality that require subjective judgment;
- implementation details unless the process itself is part of the task contract;
- multiple independent requirements bundled into one ambiguous assertion.

When a condition can be checked deterministically, write or reuse a verification script rather than relying on visual inspection.

If an important outcome cannot be verified objectively from the available evidence, keep it out of machine-checkable expectations and route it to qualitative, rubric-based, human review, or mark the required evidence unavailable.

Do not weaken an expectation because one configuration fails it, and do not strengthen it after seeing a particular output unless the eval contract is explicitly revised for a new iteration.

**Exit criteria:** Every machine-checkable expectation is objective, atomic enough for an unambiguous pass/fail decision, discriminating, evidence-accessible, and resistant to superficial compliance. Important subjective outcomes are explicitly assigned to qualitative review rather than represented by weak proxy assertions.

**Downstream impact:** Step 8 uses these expectations as the grading contract, and Step 9 aggregates their results into comparative evidence. Weak, redundant, unverifiable, or output-tuned expectations can create false pass rates, hide real failures, and distort candidate-versus-baseline conclusions.

## 7. Capture execution evidence

**Intent:** Preserve the execution facts actually observed for each run without estimating, reconstructing, or fabricating unavailable measurements.

**Entry criteria:** A candidate or baseline run has been attempted, its run identity is fixed, and the executor/runtime has returned whatever outputs, transcript, metrics, or status it can provide.

**Upstream impact:** Step 4 determines what execution actually occurred and Step 3 determines where its evidence belongs. Capture evidence for that specific run only; do not inherit metrics from another run or configuration.

Record execution evidence at the time it becomes available.

When the runtime exposes timing or token data, save the observed values to `timing.json`, for example:

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3
}
```

When executor metrics are available, preserve observed tool, step, output, and error counts in the applicable metrics artifact using the documented schema.

For every metric:

- preserve its original meaning and unit;
- distinguish observed zero from unavailable data;
- keep independently available fields independently;
- record only values attributable to the current run;
- do not infer a missing value from another metric unless the schema explicitly defines that derivation.

If the runtime does not expose a metric, omit it or mark it unavailable. Never encode missing timing, token, tool, or error evidence as `0`, and never present an estimate or proxy as a measured value.

Preserve failed, timed-out, interrupted, and unavailable runs as explicit outcomes. Do not create a successful transcript, timing file, or metrics record merely because the workspace schema allows one.

Capture ephemeral runtime measurements immediately when they cannot be recovered later.

**Exit criteria:** Every recorded execution metric is traceable to the current run and was actually observed; units and meanings are unambiguous; observed zero is distinguishable from missing data; unavailable evidence remains explicitly absent or unavailable; and no synthetic execution evidence has been introduced.

**Downstream impact:** Step 8 may incorporate execution metrics into grading, and Step 9 may aggregate them across runs. Incorrect zeros, stale metrics, mixed units, or reconstructed values can fabricate reliability, cost, or performance differences and invalidate candidate-versus-baseline conclusions.

## 8. Grade each run

**Intent:** Determine whether each predefined expectation was genuinely satisfied by the run, using inspectable evidence rather than inference, surface compliance, or configuration identity.

**Entry criteria:** The run has completed or terminated with an explicit outcome; its transcript, outputs, available execution evidence, and frozen expectations are identifiable.

**Upstream impact:** Step 6 defines the grading contract and Step 7 supplies observed execution evidence. Do not modify expectations, reconstruct missing evidence, or change the success threshold while grading.

Read `agents/grader.md` when using a dedicated grader.

For each run:

1. inspect the transcript completely;
2. inspect all output files relevant to the expectations;
3. use the appropriate inspection method for non-text artifacts rather than relying only on transcript claims;
4. evaluate each frozen expectation independently.

Grade each expectation as:

- **PASS** only when specific transcript or output evidence clearly demonstrates the expectation is true and reflects genuine task completion;
- **FAIL** when evidence is absent, contradictory, unverifiable, superficial, coincidental, or shows the underlying task outcome is incomplete or incorrect.

When evidence is uncertain, the burden of proof is on **PASS**. Do not award partial credit.

Write `grading.json` using the exact expectation fields required by downstream tooling:

```json
{
  "expectations": [
    {
      "text": "The output includes X",
      "passed": true,
      "evidence": "Observed in ..."
    }
  ]
}
```

Preserve the original expectation text. Evidence should identify the specific observation supporting or contradicting the verdict rather than restating the expectation.

Beyond predefined expectations:

- extract material factual, process, and quality claims from the transcript and outputs;
- verify those claims where the available evidence permits;
- flag unsupported or unverifiable claims;
- incorporate executor-noted uncertainties, review needs, and workarounds when available;
- identify important outcomes the current expectations failed to test;
- flag expectations that pass too easily or cannot discriminate correct from incorrect work.

Keep **run grading** separate from **eval critique**. A weak expectation may technically pass while still being reported as an eval-design weakness; do not silently change its verdict or rewrite the expectation during grading.

Copy execution metrics or timing into grading output only when Step 7 actually captured them. Missing metrics remain unavailable rather than becoming zero.

Apply the same grading standard to candidate and baseline runs. When independent or blind grading is available, avoid exposing configuration identity unless it is required to verify a process-specific expectation.

**Exit criteria:** Every frozen expectation has exactly one PASS/FAIL verdict with specific supporting or contradicting evidence; material output claims have been checked where possible; unsupported claims and eval-design gaps are identified; available metrics retain their provenance; and `grading.json` conforms to the documented schema.

**Downstream impact:** Step 9 converts these verdicts into benchmark statistics, while Step 10 exposes them for human review. Unsupported passes, inconsistent grading standards, altered expectations, or fabricated evidence directly corrupt comparative pass rates and can produce false conclusions about candidate improvement.

## 9. Aggregate benchmark results

**Intent:** Combine valid run-level evidence into a trustworthy comparison summary without hiding missing data, incomplete coverage, variance, or materially different execution conditions.

**Entry criteria:** Grading is complete for the runs being aggregated, configuration identities are known, and all execution metrics included in the benchmark were actually observed.

**Upstream impact:** Steps 4-8 determine which runs exist, what they proved, and which metrics are available. Aggregation must preserve those semantics; it must not repair missing evidence by inventing values.

From the skill root, run:

```bash
python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
```

This writes `benchmark.json` and `benchmark.md`.

Read `references/schemas.md` before generating or modifying benchmark JSON manually.

Before calculating comparative statistics:

- identify the intended candidate/baseline pair explicitly;
- reject ambiguous comparison pairs rather than relying on directory or dictionary order;
- verify the expected configuration × eval coverage;
- preserve natural run ordering such as `run-1`, `run-2`, `run-10`;
- distinguish an observed numeric zero from missing or unavailable evidence;
- omit or mark unavailable any metric that is not valid for both sides of a comparison;
- preserve variable run counts rather than implying uniform coverage.

Aggregate only valid observations. Do not create zero-valued summaries for missing runs, configurations, timing, tokens, or other absent metrics.

For each reported metric, preserve its unit and comparison meaning:

- pass rate as a ratio internally and percentage when displayed;
- pass-rate delta as percentage points;
- duration in consistent time units;
- tokens as observed token counts, never a character-count proxy;
- counts as non-negative integral values where the schema requires them.

Report means and variance only when observations exist. Retain the underlying per-run results so aggregate statistics remain auditable.

Interpret results with care:

- expectations that pass equally in candidate and baseline may be non-discriminating;
- expectations that fail equally may indicate a broken or overly difficult eval;
- high variance may indicate instability or a flaky eval;
- mean improvement can hide individual regressions or outliers;
- quality gains may carry time, token, tool, or error costs;
- unequal or incomplete coverage weakens direct comparison;
- an aggregate delta does not replace inspection of material failures.

Use `agents/analyzer.md` for a structured analysis of per-expectation, cross-eval, variance, cost, and outlier patterns. Analyzer notes must describe observations grounded in benchmark data rather than speculate about causes or propose skill changes.

**Exit criteria:** `benchmark.json` and `benchmark.md` represent only observed, schema-valid evidence; the comparison pair is unambiguous; missing evidence remains unavailable rather than zero; units and deltas are correct; coverage and run-count limitations are visible; and material variance or failure patterns are not hidden by means.

**Downstream impact:** Step 10 presents these summaries alongside individual outputs for human review, and later iteration decisions may rely on them. Fabricated zeros, incomplete matrices, ambiguous configuration ordering, incorrect units, or averages that conceal material regressions can produce false conclusions about skill improvement.

## 10. Generate the review view

**Intent:** Present run outputs, formal grades, benchmark evidence, and iteration context in one inspectable view so a human can review the evidence before further interpretation or revision.

**Entry criteria:** At least one valid run exists. Run outputs and grading are available where produced, and benchmark results are available when Step 9 was applicable.

**Upstream impact:** Steps 4-9 determine what evidence exists and what it means. The review view may organize and display that evidence, but must not invent missing results, reinterpret grades, or hide failed or unavailable runs.

Use the bundled viewer rather than hand-writing a review page.

Interactive local mode:

```bash
python eval-viewer/generate_review.py \
  <workspace>/iteration-N \
  --skill-name "<name>" \
  --benchmark <workspace>/iteration-N/benchmark.json
```

Headless/static mode:

```bash
python eval-viewer/generate_review.py \
  <workspace>/iteration-N \
  --skill-name "<name>" \
  --benchmark <workspace>/iteration-N/benchmark.json \
  --static <workspace>/iteration-N/review.html
```

For later iterations, add:

```text
--previous-workspace <workspace>/iteration-<N-1>
```

Use interactive mode when a local browser/server is available. Use static mode when browser, display, or server interaction is unavailable.

The review should expose, where available:

- the exact eval prompt and run identity;
- candidate/baseline configuration context;
- generated outputs in an inspectable form;
- formal expectation grades and evidence;
- benchmark summaries;
- failed, incomplete, or unavailable evidence states;
- previous-iteration outputs and explicit feedback when requested;
- a feedback field associated with the reviewed run.

Preserve raw artifacts behind summaries. A benchmark or grade should help navigation, not replace inspection of the underlying output.

Do not pre-judge outputs before presenting them to the human. Do not use visual ordering, labels, or commentary that implies a preferred candidate unless that identity is intentionally part of the review.

Do not interpret an empty feedback field as approval. In interactive mode, save explicit feedback to `feedback.json`. In static mode, allow the completed review to produce or download the equivalent feedback artifact.

If benchmark data is unavailable, show that state explicitly rather than rendering fabricated zero values. If a run has no grading or output artifact, preserve that absence visibly rather than synthesizing placeholder evidence.

For later iterations, show prior outputs or feedback as historical context without allowing stale feedback to overwrite the current iteration's review state.

**Exit criteria:** The review view is successfully generated and exposes all available run evidence without fabricating missing data, obscuring failures, or adding evaluator conclusions. The human can inspect individual outputs and grades, distinguish current from prior iteration evidence, and record explicit feedback.

**Downstream impact:** Step 11 consumes explicit human feedback from this review. The review view therefore becomes the human-observation boundary between generated evaluation evidence and revision decisions. Missing evidence, misleading presentation, stale feedback, or pre-judged conclusions can bias the feedback that drives subsequent iteration.

## 11. Interpret feedback conservatively

**Intent:** Convert explicit human feedback into traceable revision evidence without inferring approval, intent, severity, or required changes that the reviewer did not actually state.

**Entry criteria:** The review view has been presented and a `feedback.json` or equivalent explicit feedback artifact is available, or the reviewer has supplied feedback directly.

**Upstream impact:** Step 10 determines which output/run the reviewer saw. Feedback must remain associated with that exact run and iteration; do not apply stale feedback to a different artifact without confirming relevance.

Treat only explicit comments as feedback evidence.

For each review entry:

- preserve the associated `run_id` and iteration;
- trim whitespace before determining whether feedback is substantive;
- treat an empty or whitespace-only field as **no comment**;
- do not interpret review completion, navigation, or a blank field as approval;
- distinguish current feedback from previous-iteration feedback.

For each substantive comment:

1. identify the specific output, behavior, expectation, or workflow issue being described;
2. separate observed facts from reviewer preference or suggested remedy;
3. correlate the comment with transcript, output, grade, or benchmark evidence where applicable;
4. map the issue to the **smallest responsible** instruction, branch, script, resource, description boundary, or eval definition;
5. preserve uncertainty when more than one cause remains plausible.

Do not automatically implement the reviewer's proposed fix. Treat the complaint as evidence of the problem; determine the smallest justified correction from the available evidence.

Combine feedback with failed expectations only when they concern the same underlying issue. Do not use multiple comments to inflate severity unless they represent independent evidence or repeated behavior.

If feedback conflicts with machine grading or other evidence, preserve both observations and investigate the discrepancy rather than silently choosing one.

If a comment is ambiguous, subjective, or lacks enough evidence to identify a responsible cause, record it as needing interpretation or human judgment rather than inventing a root cause.

**Exit criteria:** Every substantive feedback item is tied to the correct run/iteration, classified as an observation, preference, or suggested remedy where relevant, and mapped to the smallest defensible responsible component. Blank feedback remains neutral, conflicts and ambiguities are explicit, and no revision has been justified by inferred approval or unstated intent.

**Downstream impact:** Step 12 uses this interpretation to decide whether and where revision is justified. Over-interpreting blank, ambiguous, stale, or solution-prescriptive feedback can cause unnecessary changes, overfitting, or modifications to the wrong part of the skill.

## 12. Iterate without overfitting

**Intent:** Improve the candidate from observed evidence while preventing one-example fixes, regression, baseline drift, and repeated changes that no longer improve representative performance.

**Entry criteria:** Step 11 identified a justified revision from failed expectations, explicit human feedback, benchmark evidence, or another reproducible evaluation weakness. The prior candidate and its evidence remain preserved.

**Upstream impact:** Steps 8-11 define what failed, how strong the evidence is, and the smallest responsible component. Revise only from supported evidence; do not optimize against imagined failures, blank feedback, or aggregate scores alone.

For each justified revision:

1. preserve the current candidate as the rollback and comparison point;
2. identify the smallest instruction, branch, script, resource, description boundary, or eval defect responsible for the observed weakness;
3. apply the smallest change that addresses the underlying issue rather than the specific example;
4. rerun the originally affected eval first;
5. rerun relevant regression cases, including nearby positive, negative, boundary, or near-miss cases;
6. compare the revised candidate with the preserved baseline or prior candidate when that comparison remains meaningful;
7. regenerate benchmark and review evidence affected by the change;
8. retain the revision only when the improvement generalizes without introducing material regressions.

Do not rewrite representative evals merely to make the revised candidate pass. If an eval is genuinely defective, revise it explicitly as a new evaluation contract and preserve prior evidence separately.

For behavior-preserving changes, compare old and new behavior on the same fixtures and inspect relevant outputs, ordering, schemas, exit behavior, side effects, and other contractual properties.

If a revision affects activation, routing, or a behavioral boundary, rerun both the failed case and representative direct/near-miss cases rather than testing only the motivating prompt.

If results regress, become materially more variable, or improve only the motivating example, revert or revise the change rather than accumulating compensating instructions.

Continue only while each iteration produces new, decision-relevant evidence.

Stop when:

- the requested quality bar is supported by representative evidence;
- required failures and regressions are resolved without material new regressions;
- further revisions no longer improve representative results;
- repeated changes oscillate between cases rather than generalizing;
- required tooling or execution capability is unavailable;
- stronger conclusions require human judgment;
- the next proposed change would exceed the authorized compatibility or change-risk boundary.

Do not convert unavailable evidence into success merely to terminate the loop.

**Exit criteria:** The retained candidate is traceable to a preserved predecessor; each retained change has an evidence-backed rationale; affected failures and relevant regressions were rerun; no known material regression was introduced; and the stopping decision is supported by observed evidence or an explicit evidence limitation.

**Downstream impact:** A successful iteration becomes the next candidate and may re-enter execution, grading, benchmarking, and review. The final retained version defines the evidence basis for any readiness or quality claim. Overfitted revisions, unpreserved predecessors, stale verification, or changes retained without regression evidence weaken or invalidate that claim.
