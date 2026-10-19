# skill-duplication-audit evals

Behavioral evidence for `SKILL.md`. Cases are synthetic or reference real skill descriptions inline, so a run needs no repository access beyond `SKILL.md`.

## Layout

| Path | Contents |
| --- | --- |
| `cases/` | Audit prompts (evidence given inline). Run them as one audit, or per file. |
| `expected.md` | Expected classification per case. Hide it from the agent under test. |
| `results/` | One file per campaign: arm (RED = no skill, GREEN = with skill), skill version, outputs, grading. |

## Running a campaign

Before dispatch, freeze candidate, references, case files, oracle and rubric
hashes and save a usable checkpoint. Apply the controller's
[bounded optimisation contract](../../writing-skills/references/bounded-optimisation.md).
The current oracle is `expected.md` revision v1.3.1; prior revisions are archived under
`oracles/`. Oracle corrections invalidate affected old comparisons; retain
historical raw outputs and do not silently upgrade their scores.

1. RED: give an agent only a case file and the five classification labels. No skill.
2. GREEN: give an agent `SKILL.md` and the case files. Allow `references/validation-cases.md` only when `SKILL.md` directs it; forbid other reads.
3. Grade each case against `expected.md`: `PASS`, `AMBER` (right outcome, but a boundary form, count, or secondary pair label differs from `expected.md` without changing clusters or the overall recommendation), `FAIL`, or `NHR`.
4. Each case stands on its own text: an answer that borrows evidence from another case is graded AMBER at best. A correct `Needs Human Review` that names the missing evidence is PASS. Where `expected.md` lists "either" for a secondary label, either is PASS.
5. Check the output block: classification counts sum to pairs evaluated; the `Needs Human Review` total reconciles with its `classified` and `merge/group holds` parts.
6. Store the graded summary in `results/` and each agent's raw output in `results/raw/`, named by version, arm, and sample.

## Known gaps

- A pure non-transitive chain without a hub shape is not constructible from equivalence-style duplicates; S3 covers the hub-with-contradiction form.
- Results files hold graded summaries, not raw agent outputs; store raw outputs for any run you intend to rely on.
- One to two samples per arm. Treat results as consistency evidence, not statistics.
