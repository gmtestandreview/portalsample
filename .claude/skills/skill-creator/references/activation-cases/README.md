# Activation Corpus Contract

These JSON arrays are **frozen input oracles** consumed directly by
`scripts/run_pipeline.py` and `scripts/run_eval.py`. Do not add arbitrary
metadata keys to their cases: `run_eval._parse_eval_set` intentionally accepts
only `query` and `should_trigger` after the pipeline strips the local `id`. This
README holds annotations separately so exact fixture inputs remain valid.

A case passing in a deterministic regex check is not observed target-host
activation. Keep model, host, attempt count, evidence, and NHR separate. Query
strings and expected booleans remain unchanged from the pre-remediation
baseline.

| Case ID | Expected | Rationale / boundary | Evidence status |
| ------- | -------- | -------------------- | --------------- |

## `activation-smoke.json` — Minimal discovery sanity check; no production claim

| `activation-smoke-01` | trigger | Intent is about creating, auditing or
evaluating Agent Skills: “Create a reusable Agent Skill from this incident
response runbook.” | NHR (host unrun) | | `activation-smoke-02` | trigger |
Intent is about creating, auditing or evaluating Agent Skills: “Review this
SKILL.md and fix its unclear activation boundaries.” | NHR (host unrun) | |
`activation-smoke-03` | do not trigger | Similar vocabulary but task is not
about Agent Skills: “Fix the GitHub Actions workflow trigger for our deployment
pipeline.” | NHR (host unrun) | | `activation-smoke-04` | do not trigger |
Similar vocabulary but task is not about Agent Skills: “Package this Python
library as a wheel for PyPI.” | NHR (host unrun) |

## `activation-eval.json` — Primary positive/near-miss discovery regression

| `activation-eval-01` | trigger | Intent is about creating, auditing or
evaluating Agent Skills: “Turn our incident triage steps into a reusable
SKILL.md with references.” | NHR (host unrun) | | `activation-eval-02` |
trigger | Intent is about creating, auditing or evaluating Agent Skills: “Audit
this existing Agent Skill for safety, scope, and missing instructions.” | NHR
(host unrun) | | `activation-eval-03` | trigger | Intent is about creating,
auditing or evaluating Agent Skills: “Compare these two SKILL.md files and
propose a consolidation.” | NHR (host unrun) | | `activation-eval-04` |
trigger | Intent is about creating, auditing or evaluating Agent Skills: “Write
evaluation prompts to test whether this Agent Skill activates.” | NHR (host
unrun) | | `activation-eval-05` | trigger | Intent is about creating, auditing
or evaluating Agent Skills: “Revise my skill description to reduce accidental
triggering.” | NHR (host unrun) | | `activation-eval-06` | trigger | Intent is
about creating, auditing or evaluating Agent Skills: “Benchmark the output of
the updated skill against its previous version.” | NHR (host unrun) | |
`activation-eval-07` | trigger | Intent is about creating, auditing or
evaluating Agent Skills: “Validate the frontmatter and package an Agent Skill
directory.” | NHR (host unrun) | | `activation-eval-08` | trigger | Intent is
about creating, auditing or evaluating Agent Skills: “Check the Claude Code
skill-rules configuration for incorrect skill suggestions.” | NHR (host
unrun) | | `activation-eval-09` | trigger | Intent is about creating, auditing
or evaluating Agent Skills: “Assess the support files and scripts for my
reusable Agent Skill.” | NHR (host unrun) | | `activation-eval-10` | trigger |
Intent is about creating, auditing or evaluating Agent Skills: “Help convert
this repeatable troubleshooting workflow into an Agent Skill.” | NHR (host
unrun) | | `activation-eval-11` | do not trigger | Similar vocabulary but task
is not about Agent Skills: “Please fix the ESLint warnings in this React
component.” | NHR (host unrun) | | `activation-eval-12` | do not trigger |
Similar vocabulary but task is not about Agent Skills: “Optimize the trigger
rules in a GitHub Actions CI workflow.” | NHR (host unrun) | |
`activation-eval-13` | do not trigger | Similar vocabulary but task is not about
Agent Skills: “Review the packaging metadata for a Python distribution.” | NHR
(host unrun) | | `activation-eval-14` | do not trigger | Similar vocabulary but
task is not about Agent Skills: “Compare two implementations of a REST API
without any skills.” | NHR (host unrun) | | `activation-eval-15` | do not
trigger | Similar vocabulary but task is not about Agent Skills: “Rewrite this
marketing email to sound warmer.” | NHR (host unrun) | | `activation-eval-16` |
do not trigger | Similar vocabulary but task is not about Agent Skills: “Create
a skill-building lesson plan for an HR workshop.” | NHR (host unrun) | |
`activation-eval-17` | do not trigger | Similar vocabulary but task is not about
Agent Skills: “Run an A/B test of two ecommerce landing pages.” | NHR (host
unrun) | | `activation-eval-18` | do not trigger | Similar vocabulary but task
is not about Agent Skills: “Troubleshoot the browser extension hook that
intercepts clicks.” | NHR (host unrun) | | `activation-eval-19` | do not
trigger | Similar vocabulary but task is not about Agent Skills: “Fix the
webhook trigger on our customer relationship integration.” | NHR (host
unrun) | | `activation-eval-20` | do not trigger | Similar vocabulary but task
is not about Agent Skills: “Refactor this generic Markdown design document for
clarity.” | NHR (host unrun) |

## `activation-holdout.json` — Public holdout regression; NOT an independent/private evaluation

| `activation-holdout-01` | trigger | Intent is about creating, auditing or
evaluating Agent Skills: “Our support-team checklist is repeated each day. Make
it an Agent Skill others can install.” | NHR (host unrun) | |
`activation-holdout-02` | trigger | Intent is about creating, auditing or
evaluating Agent Skills: “Find which supplemental reference causes this SKILL.md
to contradict itself.” | NHR (host unrun) | | `activation-holdout-03` |
trigger | Intent is about creating, auditing or evaluating Agent Skills: “Can we
establish observable acceptance tests before shipping this skill?” | NHR (host
unrun) | | `activation-holdout-04` | trigger | Intent is about creating,
auditing or evaluating Agent Skills: “Help my Claude Code skill stop activating
for unrelated repository changes.” | NHR (host unrun) | |
`activation-holdout-05` | do not trigger | Similar vocabulary but task is not
about Agent Skills: “Create an internal skills matrix for employee performance
reviews.” | NHR (host unrun) | | `activation-holdout-06` | do not trigger |
Similar vocabulary but task is not about Agent Skills: “Draft a test plan for
our browser extension event triggers.” | NHR (host unrun) | |
`activation-holdout-07` | do not trigger | Similar vocabulary but task is not
about Agent Skills: “Audit the release readiness of our Docker image, not an
Agent Skill.” | NHR (host unrun) | | `activation-holdout-08` | do not trigger |
Similar vocabulary but task is not about Agent Skills: “Consolidate two
overlapping React hooks into a shared utility.” | NHR (host unrun) |

## Falsification and evidence

- Positive: each intended Agent Skill case selects and loads the skill in the
  declared target host.
- Negative: every adjacent CI/webhook/browser/ordinary code task remains outside
  the skill.
- Missing host, model errors, timeouts, ambiguous selection, and skipped probes
  are **NHR or FAIL** according to the frozen acceptance contract; never
  manufacture a negative result.
- The public holdout is a regression corpus only. For generalization evidence,
  use an independently held private corpus per
  `../independent-holdout-protocol.md`.
- Execution: `scripts/run_pipeline.py release --dry-run` checks the planned
  inputs; real host traces are required for a behavioral PASS.
