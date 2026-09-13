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

Start with 2-3 realistic prompts for early iteration; expand the set before high-confidence deployment claims.

Store evals in `evals/evals.json`. Use the schema in `references/schemas.md`.

Each eval should include:

- a unique id;
- the user's prompt;
- a human-readable expected outcome;
- input files when needed;
- machine-checkable `expectations` only when objective verification is appropriate.

Subjective writing/design quality can still be evaluated, but it should rely on human or rubric-based review rather than weak presence checks.

## 2. Preserve the baseline

For a new skill, the baseline is the same task without the candidate skill.

For an existing skill:

1. snapshot the original before editing;
2. use the snapshot as the baseline;
3. keep the candidate and baseline inputs identical.

The workspace can use these configuration names:

- `with_skill` / `without_skill`; or
- `new_skill` / `old_skill`.

Keep the chosen pair consistent within an iteration.

## 3. Workspace layout

Use a sibling workspace rather than mixing generated evidence into the deployable skill:

```text
<skill-name>-workspace/
└── iteration-1/
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

Equivalent `new_skill` / `old_skill` configuration directories are supported.

Do not create timing, grading, or transcript evidence that the executor did not actually produce.

## 4. Execute candidate and baseline runs

When subagents or task concurrency are available, dispatch the candidate and baseline for the same eval together so environmental drift is minimized.

When concurrency is unavailable, run them serially with the same prompt, inputs, and execution constraints.

For each executor, provide:

- the exact task prompt;
- the candidate or baseline skill path, if applicable;
- input file paths;
- the output directory;
- which outputs matter.

Do not give the baseline access to the candidate instructions.

## 5. Record metadata

Create `eval_metadata.json` per eval:

```json
{
  "eval_id": 1,
  "eval_name": "descriptive-name",
  "prompt": "The user's task prompt",
  "expectations": []
}
```

Use descriptive eval names. If an eval prompt changes, write new metadata rather than assuming previous metadata still applies.

## 6. Define expectations

Draft expectations from the task's success criteria, not from accidental properties of one output.

Strong expectations are:

- objectively verifiable;
- discriminating;
- difficult to satisfy through superficial compliance;
- stated in user-visible terms when possible.

Examples:

- a required file exists and is parseable;
- a specific field contains the correct value;
- a generated spreadsheet contains the required formula;
- a required workflow step is evidenced in the transcript.

Avoid weak checks such as "the file exists" when the file can be empty or wrong.

For checks that can be verified deterministically, write or reuse a script instead of eyeballing the result.

## 7. Capture execution evidence

When the runtime reports timing or token data, save observed values to `timing.json`, for example:

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3
}
```

If the runtime does not expose a metric, omit it or mark it unavailable. Do not estimate it and present the estimate as measured data.

## 8. Grade each run

Read `agents/grader.md` when grading with a dedicated grader.

`grading.json` must use the `expectations` array with the exact fields:

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

The viewer and benchmark tooling depend on `text`, `passed`, and `evidence`.

A grader should also identify weak expectations, unsupported claims, and important outcomes that the eval failed to check.

## 9. Aggregate benchmark results

From the skill root:

```bash
python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
```

This writes `benchmark.json` and `benchmark.md`.

Read `references/schemas.md` before generating benchmark JSON manually.

Interpret aggregate statistics with care:

- expectations that pass equally in candidate and baseline may be non-discriminating;
- high variance may indicate a flaky eval or unstable behavior;
- improved quality can come with time/token cost;
- a mean score does not replace inspection of failures.

Use `agents/analyzer.md` for a structured benchmark-analysis pass.

## 10. Generate the review view

Use the bundled viewer rather than hand-writing a review page.

Interactive local mode:

```bash
python eval-viewer/generate_review.py   <workspace>/iteration-N   --skill-name "<name>"   --benchmark <workspace>/iteration-N/benchmark.json
```

Headless/static mode:

```bash
python eval-viewer/generate_review.py   <workspace>/iteration-N   --skill-name "<name>"   --benchmark <workspace>/iteration-N/benchmark.json   --static <workspace>/iteration-N/review.html
```

For later iterations, add:

```text
--previous-workspace <workspace>/iteration-<N-1>
```

The viewer exposes qualitative outputs, formal grades, benchmark results, and feedback.

## 11. Interpret feedback conservatively

When `feedback.json` is available, use explicit comments as evidence.

An empty feedback field means no comment was recorded. It is not proof that the user approved the output.

Map each concrete complaint or failed expectation to the smallest responsible instruction, branch, script, or resource.

## 12. Iterate without overfitting

After a justified revision:

1. preserve the prior candidate;
2. rerun affected evals plus regression cases;
3. compare candidate and baseline again when the comparison is meaningful;
4. regenerate the review view;
5. keep changes that generalize beyond one example.

Stop when:

- the requested quality bar is supported by evidence;
- further changes stop improving representative results;
- missing tooling or human judgment blocks stronger conclusions.

## Blind comparison

When the user explicitly wants a rigorous A/B comparison, read:

- `agents/comparator.md` for blinded judging;
- `agents/analyzer.md` for post-hoc analysis after the winner is known.

Do not use blind comparison when the runtime cannot keep the judge blind to candidate identity.

## Runtime adaptations

### Claude Code / Cowork-like runtimes

Use subagents only when actually available. If a browser/display is unavailable, prefer the viewer's `--static` mode.

### Claude.ai or runtimes without independent subagents

You can perform a qualitative sanity check serially, but do not present it as independent RED/GREEN evidence. Baseline benchmarking and blind comparison may be unavailable.

### Missing execution capability

When representative runs cannot be executed, static inspection can still find structural defects, but behavior-critical outcomes remain unverified.
