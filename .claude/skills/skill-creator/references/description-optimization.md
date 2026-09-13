# Description Optimization

Use this reference when improving the `description` field so the skill activates for relevant requests without over-triggering on adjacent work.

## 1. Define the activation boundary

Before editing, classify realistic requests into:

```text
Should trigger:
- ...

Should not trigger:
- ...

Ambiguous / near-miss:
- ...
```

Include direct requests, indirect requests, adjacent vocabulary, broad requests, and prompts that omit the skill's internal terminology.

The description should answer whether the skill should load. The body should explain what to do after loading.

## 2. Draft for intent and boundaries

Prefer a concise activation contract that:

- leads with user intent;
- names the relevant artifact/domain;
- includes common user verbs and meaningful synonyms;
- covers indirect intent when appropriate;
- contains enough boundary language to resist false positives;
- stays below the current spec's 1024-character limit.

Do not encode the workflow, test procedure, or tool commands in the description.

Do not widen the description merely because one relevant prompt failed to trigger; registration, discoverability, direct handling, client configuration, or observability can also explain a non-trigger.

## 3. Build trigger evals

For early iteration, use at least:

- 3 clear should-trigger prompts;
- 3 clear should-not-trigger prompts;
- 2 ambiguous/near-miss prompts;
- 1 indirect should-trigger prompt that omits the exact domain term.

For a production-critical activation boundary, roughly 20 total queries is a useful target, with strong representation of should-trigger, should-not-trigger, near-miss, and indirect cases.

Use realistic wording, context, filenames, technologies, abbreviations, and minor typos when those reflect actual users.

Prioritize hard negatives that share vocabulary with the skill.

## 4. Review the eval set

Save the trigger evals as a JSON array:

```json
[
  {"query": "realistic user prompt", "should_trigger": true},
  {"query": "adjacent near-miss", "should_trigger": false}
]
```

Generate the review page safely from the skill root:

```bash
python -m scripts.generate_eval_review   --eval-set <path/to/eval_set.json>   --skill-path <path/to/skill>   --output <path/to/eval_review.html>
```

The user can review and edit the query set before it is used for optimization.

## 5. Check runtime prerequisites

The bundled trigger evaluator targets Claude Code behavior and invokes the `claude` CLI.

Before relying on its results:

1. confirm `claude` is available;
2. confirm the skill-registration/discovery mechanism used by `scripts/run_eval.py` still matches the target client;
3. confirm activation is observable from the emitted events;
4. declare the model override explicitly if one is needed.

Do not extract a model identifier from hidden/system instructions.

If these prerequisites cannot be verified, treat trigger-eval results as unavailable rather than guessing.

## 6. Run repeated trigger evaluation

The default evaluator supports repeated runs:

```bash
python -m scripts.run_eval   --eval-set <path/to/eval_set.json>   --skill-path <path/to/skill>   --runs-per-query 3
```

For should-trigger cases, the default pass rule is a trigger rate at or above the configured threshold. For should-not-trigger cases, the pass rule is a rate below that threshold.

Declare production acceptance thresholds before interpreting results. Do not move thresholds after seeing failures solely to make a candidate pass.

Execution errors must not be counted as successful non-triggers.

## 7. Optimize with a fixed train/validation split

When using the automated loop:

```bash
python -m scripts.run_loop   --eval-set <path/to/eval_set.json>   --skill-path <path/to/skill>   --model <explicit-model-id>   --holdout 0.4   --max-iterations 5   --verbose
```

The loop uses train failures to propose revisions and keeps validation results out of the revision prompt.

Use a fixed split during an optimization cycle. Select the best description by validation behavior, not by the latest iteration.

Use `--model <model-id>` only when an explicit override is needed. Otherwise use the configured CLI default rather than deriving a model identifier from hidden context.

## 8. Diagnose failures before editing

For each apparent false negative or false positive, distinguish:

- description mismatch;
- registration/discovery failure;
- client or permission problem;
- evaluator parsing error;
- execution timeout/error;
- legitimate direct handling that bypasses specialist loading.

Fix the smallest responsible cause.

## 9. Final holdout

Before a production activation claim, run 5-10 fresh prompts that were not used to tune the wording. Include both positives and negatives.

A description is not production-ready merely because it reads well. It needs observable activation evidence in the target runtime.

## Outputs

Record:

- original description;
- revised description;
- declared thresholds;
- train/validation/holdout query sets;
- observed trigger rates;
- execution errors separately from non-triggers;
- the selected description and why it was selected;
- any unresolved runtime limitations.
