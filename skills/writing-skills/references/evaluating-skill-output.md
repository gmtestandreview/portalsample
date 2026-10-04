---
title: 'Evaluating skill output quality'
sidebarTitle: 'Evaluating skills'
description:
  'How to test whether your skill produces good outputs using eval-driven
  iteration.'
---

<!-- markdownlint-disable MD013 MD025 -->

# Evaluating skill output quality

<!-- markdownlint-disable MD033 -->

You wrote a skill, tried it on a prompt, and it seemed to work. But does it work
reliably - across varied prompts, in edge cases, better than no skill at all?
Running structured evaluations (evals) answers these questions and gives you a
feedback loop for improving the skill systematically.

Load when designing or reviewing output-quality comparisons. Inputs: exact
candidate/baseline revisions, permitted environment, representative prompts and
fixtures, and success criteria. Output: run artifacts, evidence-backed grades,
comparable summaries, and bounded revision decisions. Missing inputs, isolation,
or required runtime evidence must remain `NHR`; a quality comparison is not a
deployment verdict. Use the [final checklist](SKILL-testing-checklist.md).

This is a local adaptation of the
[Agent Skills evaluation guide](https://agentskills.io/skill-creation/evaluating-skills),
reviewed on 2026-10-04. JSON/code examples and numbers illustrate a record
format, not observed runs. Recheck provider APIs when the client changes. This
guide's `evals/evals.json` format is illustrative; this package's seeded cases
use [the local schema](../scripts/evals/evaluation-schema.md) under
`scripts/evals/`.

Navigation: [cases](#designing-test-cases), [runs](#running-evals),
[assertions](#writing-assertions), [grading](#grading-outputs),
[aggregation](#aggregating-results), [iteration](#iterating-on-the-skill).

## Designing test cases

A test case has three parts:

- **Prompt**: a realistic user message - the kind of thing someone would
  actually type.
- **Expected output**: a human-readable description of what success looks like.
- **Input files** (optional): files the skill needs to work with.

Store test cases in `evals/evals.json` inside your skill directory:

```json evals/evals.json
{
  "skill_name": "csv-analyzer",
  "evals": [
    {
      "id": 1,
      "prompt": "Use evals/files/sales_2025.csv to find the top 3 months by revenue and make a bar chart.",
      "expected_output": "A bar chart image showing the top 3 months by revenue, with labeled axes and values.",
      "files": ["evals/files/sales_2025.csv"]
    },
    {
      "id": 2,
      "prompt": "Use evals/files/customers.csv. Keep every row, replace missing emails with an empty string, and tell me how many were missing.",
      "expected_output": "A cleaned CSV preserving all rows and replacing missing emails with empty strings, plus a count of affected rows.",
      "files": ["evals/files/customers.csv"]
    }
  ]
}
```

**Tips for writing good test prompts:**

- **Start with 2-3 test cases.** Don't over-invest before you've seen your first
  round of results. You can expand the set later.
- **Vary the prompts.** Use different phrasings, levels of detail, and
  formality. Some prompts should be casual ("hey can you clean up this csv"),
  others precise ("Parse the CSV at data/input.csv, drop rows where column B is
  null, and write the result to data/output.csv").
- **Cover edge cases.** Include at least one prompt that tests a boundary
  condition - a malformed input, an unusual request, or a case where the skill's
  instructions might be ambiguous.
- **Use realistic context.** Real users mention file paths, column names, and
  personal context. Prompts like "process this data" are too vague to test
  anything useful.

Define mandatory success criteria and case requiredness before a scored run.
Exploratory runs may reveal additional assertions; label those exploratory,
freeze the revised checks, and rerun both configurations. Do not change criteria
after seeing results and present the old run as an unbiased comparison.

## Running evals

The core pattern is to run each test case twice: once **with the skill** and
once **without it** (or with a previous version). This gives you a baseline to
compare against.

### Workspace structure

Organize eval results in a workspace directory alongside your skill directory.
Each pass through the full eval loop gets its own `iteration-N/` directory.
Within that, each test case gets an eval directory with `with_skill/` and
`without_skill/` subdirectories:

```text
csv-analyzer/
├── SKILL.md
└── evals/
    └── evals.json
csv-analyzer-workspace/
└── iteration-1/
    ├── eval-top-months-chart/
    │   ├── with_skill/
    │   │   ├── outputs/       # Files produced by the run
    │   │   ├── timing.json    # Tokens and duration
    │   │   └── grading.json   # Assertion results
    │   └── without_skill/
    │       ├── outputs/
    │       ├── timing.json
    │       └── grading.json
    ├── eval-clean-missing-emails/
    │   ├── with_skill/
    │   │   ├── outputs/
    │   │   ├── timing.json
    │   │   └── grading.json
    │   └── without_skill/
    │       ├── outputs/
    │       ├── timing.json
    │       └── grading.json
    └── benchmark.json         # Aggregated statistics
```

The main file you author by hand is `evals/evals.json`. The other JSON files
(`grading.json`, `timing.json`, `benchmark.json`) are produced during the eval
process - by the agent, by scripts, or by you.

### Spawning runs

Each eval run should start with a clean context - no leftover state from
previous runs or from the skill development process. This ensures the agent is
not contaminated by candidate-specific guidance or prior outputs. Host
instructions still apply. Subagents can inherit history and share filesystem
state; verify their isolation settings instead of assuming a fresh child is
independent. Delegate only when authorized. Without usable isolation, use a
separate session or mark required evidence `NHR`.

For each run, provide:

- The skill path (or no skill for the baseline)
- The test prompt
- Any input files
- The output directory

Stage fixtures at the paths actually named in the prompt and prevent one run's
outputs from entering another's input. Bound side effects to authorized
temporary artifacts; do not run live destructive tasks merely to test
discipline.

Record a measurement target: selector recommendation, supplied-guidance
application, or actual client discovery/loading. Naming the skill tests
application, not implicit activation. Only observed client load events support
runtime-activation claims; otherwise that result is `NHR`. These are separate
from output-quality grades.

Here's an example of the instructions you'd give the agent for a single
with-skill run:

```text
Execute this task:
- Skill path: /path/to/csv-analyzer
- Task: I have a CSV of monthly sales data in data/sales_2025.csv.
  Can you find the top 3 months by revenue and make a bar chart?
- Input files: evals/files/sales_2025.csv
- Save outputs to: csv-analyzer-workspace/iteration-1/eval-top-months-chart/with_skill/outputs/
```

For the baseline, use the same prompt but without the skill path, saving to
`without_skill/outputs/`.

When improving an existing skill, use the previous version as your baseline.
Snapshot it before editing (`cp -r <skill-path> <workspace>/skill-snapshot/`),
point the baseline run at the snapshot, and save to `old_skill/outputs/` instead
of `without_skill/`.

### Capturing timing data

Timing data lets you compare how much time and tokens the skill costs relative
to the baseline - a skill that dramatically improves output quality but triples
token usage is a different trade-off than one that's both better and cheaper.
When each run completes, record the token count and duration:

```json timing.json
{
  "total_tokens": 84852,
  "duration_ms": 23332
}
```

Use the target client's documented metrics when exposed. Save observed timing
and token data with their source; record unavailable metrics as `null`/`NHR`,
not invented values or zero. Client-specific notification fields and persistence
are not portable assumptions.

## Writing assertions

Assertions are verifiable statements about what the output should contain or
achieve. Freeze the checks before scored runs; exploratory outputs may inform
the next iteration's checks without retroactively changing the current verdict.

Good assertions:

- `"The output file is valid JSON"` - programmatically verifiable.
- `"The bar chart has labeled axes"` - specific and observable.
- `"The report includes at least 3 recommendations"` - countable.

Weak assertions:

- `"The output is good"` - too vague to grade.
- `"The output uses exactly the phrase 'Total Revenue: $X'"` - too brittle;
  correct output with different wording would fail.

Not everything needs an assertion. Some qualities - writing style, visual
design, whether the output "feels right" - are hard to decompose into pass/fail
checks. These are better caught during
[human review](#reviewing-results-with-a-human). Reserve assertions for things
that can be checked objectively.

Add assertions to each test case in `evals/evals.json`:

```json evals/evals.json highlight={9-14}
{
  "skill_name": "csv-analyzer",
  "evals": [
    {
      "id": 1,
      "prompt": "Use evals/files/sales_2025.csv to find the top 3 months by revenue and make a bar chart.",
      "expected_output": "A bar chart image showing the top 3 months by revenue, with labeled axes and values.",
      "files": ["evals/files/sales_2025.csv"],
      "assertions": [
        "The 3 months and their values match totals computed from the supplied CSV, with a recorded tie policy",
        "The output includes a bar chart image file",
        "The chart shows exactly 3 months",
        "Both axes are labeled",
        "The chart title or caption mentions revenue"
      ]
    }
  ]
}
```

## Grading outputs

Grading means evaluating each assertion against the actual outputs and recording
**PASS** or **FAIL** with specific evidence when verifiable; mark unavailable
evidence `NHR`, not false success or observed failure. The evidence should quote
or reference the output, not just state an opinion.

The simplest approach is to give the outputs and assertions to an LLM and ask it
to evaluate each one. For assertions that can be checked by code (valid JSON,
correct row count, file exists with expected dimensions), use a verification
script - scripts are more reliable than LLM judgment for mechanical checks and
reusable across iterations.

The illustrative Boolean `passed` field below is suitable only for verified
PASS/FAIL assertions. For missing evidence, store `result: "NHR"`, `passed: null`,
the missing evidence, and required follow-up; use an adapter or the local schema
if the target grader rejects nullable values. Exclude missing grades from any
claimed verified pass count and report their count separately.

```json grading.json
{
  "assertion_results": [
    {
      "text": "The 3 months and their values match totals computed from the supplied CSV, with a recorded tie policy",
      "passed": true,
      "evidence": "Example totals comparison artifact matches March, July, and November; no ties occurred"
    },
    {
      "text": "The output includes a bar chart image file",
      "passed": true,
      "evidence": "Found chart.png (45KB) in outputs directory"
    },
    {
      "text": "The chart shows exactly 3 months",
      "passed": true,
      "evidence": "Chart displays bars for March, July, and November"
    },
    {
      "text": "Both axes are labeled",
      "passed": false,
      "evidence": "Y-axis is labeled 'Revenue ($)' but X-axis has no label"
    },
    {
      "text": "The chart title or caption mentions revenue",
      "passed": true,
      "evidence": "Chart title reads 'Top 3 Months by Revenue'"
    }
  ],
  "summary": {
    "passed": 4,
    "failed": 1,
    "total": 5,
    "pass_rate": 0.8
  }
}
```

### Grading principles

- **Require concrete evidence for a PASS.** Don't give the benefit of the doubt.
  If an assertion says "includes a summary" and the output has a section titled
  "Summary" with one vague sentence, that's a FAIL - the label is there but the
  substance isn't.
- **Review the assertions themselves, not just the results.** While grading,
  notice when assertions are too easy (always pass regardless of skill quality),
  too hard (always fail even when the output is good), or unverifiable (can't be
  checked from the output alone). Fix these for the next iteration.

**Blind comparison:** For comparing two skill versions, try **blind
comparison**: present both outputs to an LLM judge without revealing which came
from which version. The judge scores holistic qualities - organization,
formatting, usability, polish - on a predefined rubric, reducing bias about
which version "should" be better. This complements assertion grading: two
outputs might both pass all assertions but differ significantly in overall
quality.

## Aggregating results

Once every run in the iteration is graded, compute summary statistics per
configuration and save them to `benchmark.json` alongside the eval directories
(e.g., `csv-analyzer-workspace/iteration-1/benchmark.json`):

```json benchmark.json
{
  "run_summary": {
    "with_skill": {
      "pass_rate": { "mean": 0.83, "stddev": 0.06 },
      "time_seconds": { "mean": 45.0, "stddev": 12.0 },
      "tokens": { "mean": 3800, "stddev": 400 }
    },
    "without_skill": {
      "pass_rate": { "mean": 0.33, "stddev": 0.1 },
      "time_seconds": { "mean": 32.0, "stddev": 8.0 },
      "tokens": { "mean": 2100, "stddev": 300 }
    },
    "delta": {
      "pass_rate": 0.5,
      "time_seconds": 13.0,
      "tokens": 1700
    }
  }
}
```

The `delta` tells you what the skill costs (more time, more tokens) and what it
buys (higher pass rate). A skill that adds 13 seconds but improves pass rate by
50 percentage points is probably worth it. A skill that doubles token usage for
a 2-point improvement might not be.

**Small-sample limits:** Standard deviation across cases describes case
variation; repeated runs per case are needed to inspect that case's consistency.
In early iterations with 2–3 cases and single runs, emphasize raw counts and
comparable deltas, without claiming stability or significance. Report sample
counts, missing grades, the aggregation denominator, and whether variation is
across different cases or repeated runs of one case. Do not infer reliability or
statistical significance from a small illustrative summary.

## Analyzing patterns

Aggregate statistics can hide important patterns. After computing the
benchmarks:

- **Separate invariants from improvement-sensitive assertions.** Always-passing
  validity, safety, and required output checks remain regression gates. Optional
  nondiscriminating checks may move out of the comparison metric with an
  explicit rationale; never remove required checks to inflate the skill's
  improvement.
- **Investigate assertions that always fail in both configurations.** Either the
  assertion is broken (asking for something the model can't do), the test case
  is too hard, or the assertion is checking for the wrong thing. Fix these
  before the next iteration.
- **Study assertions that pass with the skill but fail without.** These suggest
  added value when conditions are comparable. Investigate _why_ - which
  instructions or scripts made the difference?
- **Tighten instructions when results are inconsistent across runs.** If the
  same eval passes sometimes and fails others (reflected as high `stddev` in the
  benchmark), the eval may be flaky (sensitive to model randomness), or the
  skill's instructions may be ambiguous enough that the model interprets them
  differently each time. Add examples or more specific guidance to reduce
  ambiguity.
- **Check time and token outliers.** If one eval takes 3x longer than the
  others, read its execution transcript (the full log of what the model did
  during the run) to find the bottleneck.

## Reviewing results with a human

Assertion grading and pattern analysis catch a lot, but they only check what you
thought to write assertions for. A human reviewer brings a fresh perspective -
catching issues you didn't anticipate, noticing when the output is technically
correct but misses the point, or spotting problems that are hard to express as
pass/fail checks. For each test case, review the actual outputs alongside the
grades.

Record specific feedback for each test case and save it in the workspace (e.g.,
as a `feedback.json` alongside the eval directories):

```json feedback.json
{
  "eval-top-months-chart": {
    "reviewed": true,
    "reviewer": "example-reviewer",
    "outcome": "FAIL",
    "feedback": "The chart is missing an axis label."
  },
  "eval-clean-missing-emails": {
    "reviewed": false,
    "reviewer": null,
    "outcome": "NHR",
    "feedback": "Human review not yet performed."
  }
}
```

"The chart is missing axis labels" is actionable; "looks bad" is not. Empty
feedback is ambiguous; record explicit `reviewed`, reviewer identity, outcome,
and evidence. Unreviewed output is not a human-review pass. During the
[iteration step](#iterating-on-the-skill), focus your improvements on the test
cases where you had specific complaints.

## Iterating on the skill

After grading and reviewing, you have three sources of signal:

- **Failed assertions** point to specific gaps - a missing step, an unclear
  instruction, or a case the skill doesn't handle.
- **Human feedback** points to broader quality issues - the approach was wrong,
  the output was poorly structured, or the skill produced a technically correct
  but unhelpful result.
- **Execution transcripts** reveal _why_ things went wrong. If the agent ignored
  an instruction, the instruction may be ambiguous. If the agent spent time on
  unproductive steps, those instructions may need to be simplified or removed.

The most effective way to turn these signals into skill improvements is to give
all three - along with the current `SKILL.md` - to an LLM and ask it to propose
changes. The LLM can synthesize patterns across failed assertions, reviewer
complaints, and transcript behavior that would be tedious to connect manually.
When prompting the LLM, include these guidelines:

- **Generalize from feedback.** The skill will be used across many different
  prompts, not just the test cases. Fixes should address underlying issues
  broadly rather than adding narrow patches for specific examples.
- **Keep the skill lean.** Fewer, better instructions often outperform
  exhaustive rules. If transcripts show wasted work (unnecessary validation,
  unneeded intermediate outputs), remove those instructions. If pass rates
  plateau despite adding more rules, the skill may be over-constrained - try
  removing instructions and see if results hold or improve.
- **Match wording to the failure.** Compare explanation, explicit rules,
  structural slots, and conditional recipes as appropriate; no form is
  universally more reliable. See [instruction form](instruction-form.md).
- **Bundle repeated work.** If every test run independently wrote a similar
  helper script (a chart builder, a data parser), that's a signal to bundle the
  script into the skill's `scripts/` directory. See
  [Using scripts](using-scripts-in-skills.md) for how to do this.

### The loop

1. Give the eval signals and current `SKILL.md` to an LLM and ask it to propose
   improvements.
2. Review and apply the changes.
3. Rerun all test cases in a new `iteration-<N+1>/` directory.
4. Grade and aggregate the new results.
5. Review with a human. Repeat.

Stop at predefined acceptance criteria or when there is no meaningful
improvement, unavailable evidence, or an authorization/scope barrier. Report
unresolved required outcomes; do not equate satisfaction or empty feedback with
readiness. The final checklist owns the deployment gate.

**Optional automation:** The
[`skill-creator`](https://github.com/anthropics/skills/tree/main/skills/skill-creator)
Skill automates much of this workflow - running evals, grading assertions,
aggregating benchmarks, and presenting results for human review. Check the
automation's actual interface and availability before use. Its output does not
replace inspection of artifacts or unresolved required gates.
