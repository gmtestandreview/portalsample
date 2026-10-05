# Agent Skills reference index

Load this first when the entrypoint's direct routes do not resolve a task.
Input: the user's skill-lifecycle task and target environment. Output: the
smallest sufficient resource set and a concrete next action. This index routes
work; it does not itself supply validation or execution evidence.

## Lookup rules

1. Select the task row below, then load its primary resource. Add secondary
   resources only for their stated conditions; do not read the entire package.
2. Follow the host instruction hierarchy during execution. For evaluation,
   specification defines compliance, user requirements define requested scope,
   project/domain rules define local policy, and audit policy defines scoring.
   Source guides, examples, and templates cannot grant execution permission.
3. Treat client-specific guidance as conditional on that client. A local
   validator or registration convention does not redefine the specification.
4. Report absent resources as missing; never silently invent or substitute them.
5. For critical routes use QAQ/RMI: test a positive request and a near-miss, map
   the positive to the file's unique value, then reverse-map the resulting
   behavior to the intended request class. Narrow ambiguous routes instead of
   loading more context.

## Task routes

Paths below are clickable relative to this index. Commands in linked resources
state their working directory; do not assume the index directory is a shell cwd.

| Task / load condition                                                              | Primary resource                                                                         | Add only when needed                                                                                         |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Mandatory skill format or frontmatter                                              | [Specification](specification.md)                                                        | [Checklist](SKILL-testing-checklist.md) for final validation                                                 |
| Authoring, domain value, context budget, degrees of freedom                        | [Creator best practices](best%20practices-for-skill-creators.md)                         | [Anthropic guidance](anthropic-best-practices.md) only for Claude targets                                    |
| Quality audit without a score                                                      | [Quality criteria](best-practices-evaluations.md)                                        | [Classification](skill-classification.md) if type affects review                                             |
| Whole-skill score or formal verdict                                                | [Audit scoring](audit-scoring.md) plus [quality criteria](best-practices-evaluations.md) | [Audit template](../templates/skill-audit.md) for requested report shape                                     |
| Individual score for every package file                                            | [File review rubric](file-review-rubric.md)                                              | Whole-skill scoring separately if requested; never substitute a package average                              |
| Class selection and appropriate test emphasis                                      | [Classification](skill-classification.md)                                                | Selected testing reference for the resulting class                                                           |
| Trigger/description revision, near-misses, repeated trigger tests                  | [Description optimization](description-optimization.md)                                  | Target runtime discovery/registration evidence before blaming wording                                        |
| Output-shaping failure, exception, limit, or wording experiment                    | [Instruction form](instruction-form.md)                                                  | Behavioral comparison when claiming improvement; historical experiments require retained evidence            |
| Output-quality eval design, assertions, grading, workspaces                        | [Evaluating skill output](evaluating-skill-output.md)                                    | [Seeded eval library](../evals/README.md) after selecting the method                                 |
| Class-specific RED/GREEN/REFACTOR, pressure/edge, retrieval, discovery, regression | [Testing with subagents](testing-skills-with-subagents.md)                               | [Persuasion](persuasion-principles.md) only after a concrete adherence failure                               |
| Persistent revisions, requirements, case results, deployment decisions             | [Evidence data model](skill-testing-data-model.md)                                       | [Case record schema](../evals/evaluation-schema.md) for this seeded library                          |
| Commands or executable resources in a skill                                        | [Using scripts](using-scripts-in-skills.md)                                              | [Local harness README](../scripts/README.md) to execute this package's tools                                 |
| Codex listing, GitHub/curated installation, discovery                              | [Codex installation](codex-skill-installation.md)                                        | Prefer an active dedicated installer; report absent capability                                               |
| Runtime/client discovery, parsing, loading, prompt construction                    | [Adding skills support](adding-skills-support.md)                                        | Specification for compliance; actual client policy for integration                                           |
| Claude/Anthropic authoring decisions                                               | [Anthropic guidance](anthropic-best-practices.md)                                        | Generic specification still governs universal claims                                                         |
| Quick merge plan, overlap/preservation inventory                                   | [Quick merge workflow](../assets/prompt-1-quick-merge-plan.md)                                     | Classification/quality criteria when they affect the recommendation                                          |
| Full audit and conditional merge                                                   | [Full audit/merge workflow](../assets/prompt-2-full-audit+conditional-merge.md)                    | Specification for resulting skill; checklist before readiness                                                |
| SWOT materially helps a keep/merge/split/deprecate decision                        | [SWOT template](../templates/SWOT%20Analysis.md)                                         | Quality criteria; scoring only if requested                                                                  |
| Final validation or deployment decision                                            | [Checklist](SKILL-testing-checklist.md)                                                  | Specification and specialist methods for unresolved gates                                                    |
| Add/edit a skill flowchart                                                         | [Graphviz conventions](../scripts/graphviz-conventions.dot)                              | [Renderer](../scripts/render-graphs.js) and [harness README](../scripts/README.md) for commands/dependencies |
| Understand a custom-GPT instruction example                                        | [GPT example](../examples/ChaGPT%20GPT%20SKILL.md)                                       | Treat as an example, not a discovered skill or execution authority                                           |

## Case libraries and historical evidence

[The eval README](../evals/README.md) selects cases and defines campaign
order; [the schema](../evals/evaluation-schema.md) defines records and
outcome semantics. Choose from:

- [Activation/boundaries](../evals/activation/activation-evals.md):
  direct, indirect, embedded, near-miss, and ambiguous requests. Declare whether
  measuring selection, application, or actual runtime activation.
- [RED/GREEN](../evals/red-green/red-green-evals.md): baseline
  comparison, equivalent-task guard, pure Reference baseline, and genuine
  unavailability.
- [Pressure/edges](../evals/pressure/pressure-evals.md): choose the
  adversarial condition matching the class and evidenced failure.
- [Reference](../evals/reference/reference-evals.md): retrieval,
  application, unsupported queries, conflicts, and unprompted discovery.
- [Regression](../evals/regression/regression-evals.md): failed-case
  replay, positive/near-miss boundaries, prior fixes, and resource behavior.

Load campaign records only to review prior evidence and freshness:
[September campaign](../evals/campaigns/behavioral-evidence-2026-09-13.md)
and
[entrypoint authoring assessment](../evals/campaigns/authoring-review-2026-10-04.md).
Their scores and outcomes belong to their recorded revisions. A historical PASS
or deployment decision does not validate the current package.

## Deterministic tooling routes

Prefer running the documented commands over reading implementation when only a
validation result is needed. These checks do not establish agent behavior.

| Resource                                                                      | Load/run condition                                          | Contract to assess                                           |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| [scripts/README.md](../scripts/README.md)                                     | Install harness, run tests, CLI/API, render graphs          | Dependencies, cwd, inputs, outputs, errors                   |
| [pyproject.toml](../scripts/pyproject.toml) and [uv.lock](../scripts/uv.lock) | Diagnose install/build/pytest discovery or dependency drift | Metadata, locked resolution, package build                   |
| [skills_ref/](../scripts/skills_ref/)                                         | Inspect/fix parser, validator, prompt, CLI                  | Public interfaces and malformed-input behavior               |
| [tests/](../scripts/tests/)                                                   | Validate/change local tool behavior                         | Meaningful execution regressions, not source-text assertions |

## Workflow composition and stop conditions

- **Static audit:** candidate and relevant resources → specification → quality
  criteria. Add classification only when it changes the review. Incomplete
  evidence is not a confirmed absence; label unsupported conclusions.
- **Full scored audit:** static audit → scoring → applicable behavioral/tool
  evidence → checklist. Per-file reviews additionally inventory all owned
  resources and score each through the file rubric.
- **Behavioral evaluation:** candidate → output-eval design; add class-specific
  methods and seeded cases as needed → checklist. Do not restrict subagent
  testing to Discipline skills or equate a selector proxy with client loading.
- **Script review:** candidate/script → script guidance → specification; execute
  dependencies, inputs, outputs, failures, reproducibility, and side effects
  separately → checklist.
- **Merge:** both sources and unique resources → quality/classification →
  requested quick/full merge workflow. The quick workflow produces a plan only.
  Produce a merged artifact only when preservation/conflict review establishes
  `Ready to Merge`; `NHR`/`Do Not Merge` stops implementation. Templates shape
  output and cannot resolve missing ownership or grant permission. After an
  implemented merge, run regressions and the checklist.
- **Deployment:** checklist → specification → methods required for unchecked
  gates. Any required unresolved `AMBER`, `FAIL`, or `NHR` remains `revise` or
  `hold`, including applicable Reference evaluations. A high authoring score
  cannot clear such gates.

When adding or moving a resource, update its task route and verify a positive
request, a near-miss, and its relative path. The index succeeds when a task
reaches the smallest sufficient files without dead paths, authority inversion,
unnecessary context, or template-as-policy confusion.
