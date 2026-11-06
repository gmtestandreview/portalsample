# Activation, retrieval, and application cases

These are test definitions for behavioral evaluation. They are not execution
evidence. Record each executed case separately with the candidate revision,
environment/model, retrieved resources, observable output, and
`PASS | AMBER | FAIL | NHR`.

> **Post-merge note (2026-11-06):** API-topic references named below as
> `references/core-*.md`, `references/features-*.md`, and
> `references/advanced-*.md` now live in the separate **`vitest-api-snapshot`**
> skill, not under this skill's `references/`. Read the retrieval expectations
> as "retrieve the corresponding topic from the `vitest-api-snapshot` skill."
> The project-policy references (`project-nmi-portal.md`,
> `supplied-test-contracts.md`, `storybook-browser.md`,
> `vitest-5-compatibility.md`) remain in this skill.
>
> **Topic→reference routing is now tested first-class in the snapshot skill:**
> `vitest-api-snapshot/evals/retrieval-cases.md` (cases S01–S21) is authoritative
> for *which API file a topic resolves to*. The API-topic rows below are retained
> only for this skill's **activation and route-to-snapshot** decision; do not
> maintain their file-path detail here — update routing in the snapshot eval.

## Required cases

| Case                         | Request                                                                     | Expected behavior                                                                                                                                                   | Acceptance evidence                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Positive: mocking            | "Mock a module in Vitest and reset it between tests."                       | Activate; start with `references/features-mocking.md`; add `references/advanced-vi.md` only if broader `vi` utilities are actually needed.                          | Trace/resource log shows minimal retrieval; answer correctly applies the retrieved API to the requested reset behavior.     |
| Positive: config + coverage  | "How do I configure Vitest coverage in a Vite project?"                     | Activate; use `references/features-coverage.md`, `references/core-config.md`, and the compatibility guard if version 5 is established. | Retrieve just the relevant resources and avoid `coverage.all` in Vitest 4+. |
| Positive: indirect migration | "Convert this Jest test suite to run under Vitest."                         | Activate because Vitest migration is explicit; retrieve only references needed by the supplied suite.                                                               | Activation occurs despite Jest vocabulary; output changes Jest-specific behavior only where supported by Vitest references. |
| Positive: application        | "This Vitest hook leaks state between tests. Show the smallest correction." | Activate and retrieve `references/core-hooks.md` plus another topic only when the concrete code requires it.                                                        | Output changes the user's code/config correctly rather than merely summarizing hook documentation.                          |
| Near-miss: Jest only         | "How does `jest.mock` work in Jest?"                                        | Do not activate solely from shared testing vocabulary.                                                                                                              | Skill remains inactive or contributes no Vitest-specific reference content.                                                 |
| Near-miss: other runner      | "Write this test in Node's built-in test runner."                           | Do not activate.                                                                                                                                                    | Skill remains inactive.                                                                                                     |
| Ambiguous shared API         | "Why is `expect(...).toEqual(...)` failing?"                                | Do not assume Vitest from the API name alone; use the skill only when surrounding context establishes Vitest.                                                       | Activation decision follows explicit runtime/context evidence, not the shared matcher name.                                 |
| Cross-topic                  | "Run browser-like Vitest tests with coverage in two projects."              | Activate; retrieve `advanced-environments.md`, `features-coverage.md`, and `advanced-projects.md`; add config only if needed.                                       | Retrieval is sufficient but not broader than the request; answer integrates all three topics without contradiction.         |
| Unsupported-version boundary | "What changed in Vitest after the bundled source revision?"                 | Load `references/vitest-5-compatibility.md` for evidenced 4→5 changes; do not infer uncovered later changes from the old snapshot; verify external docs when permitted. | Clear separation of documented 5.0 changes, still-unknown behavior, and unexecuted checks. |
| Unsupported query            | "Does this undocumented Vitest flag exist?"                                 | Search the relevant bundled CLI/config reference; if unsupported there, report the evidence gap rather than inventing syntax.                                       | No fabricated flag or option; missing coverage is explicit.                                                                 |
| Resource discovery           | "How do I shard Vitest tests across CI jobs?"                               | Activate and discover `references/features-concurrency.md` without the prompt naming the file.                                                                      | Correct resource is selected from intent alone.                                                                             |
| Scope coverage               | "Which bundled reference covers type-level Vitest assertions?"              | Activate and retrieve `references/advanced-type-testing.md`.                                                                                                        | Correct resource is located without loading unrelated references.                                                           |

## Comparative baseline cases

For at least the positive mocking, migration, application, cross-topic, and
unsupported-query cases, execute the same request once without the skill and
once with the candidate skill.

A with-skill run passes the comparative criterion only when it materially
improves at least one relevant dimension without regressing another critical
dimension:

- factual/reference fidelity;
- selection of Vitest-specific APIs or configuration;
- correct application to the user's task;
- explicit handling of unsupported or post-snapshot claims;
- retrieval efficiency and avoidance of irrelevant material.

Do not award comparative improvement from stylistic differences alone.

## Regression set

After any routing, activation, description, or reference change, rerun:

1. every previously failed required case;
2. all positive activation cases;
3. both near-misses;
4. unsupported-version and unsupported-query cases;
5. resource discovery.

A case definition or expected result is not evidence that the case passed.

## Added retrieval boundaries (definitions, not results)

| Pair | Positive/expected reference | Near-miss/expected non-loading |
| --- | --- | --- |
| R01 tags | "Vitest 5 tagged tests are not filtering" → `features-filtering` + `vitest-5-compatibility`; inspect tag registration | "Playwright tags are not filtering" → no Vitest reference |
| R02 fixtures | "How do Vitest scoped fixtures override a suite default?" → `features-context` + compatibility | "How do Playwright fixtures use `test.use`?" → no Vitest fixture reference |
| R03 failure handling | "My Vitest aroundEach teardown is skipped on a failed test" → `core-hooks` | "My Jest afterEach crashes" → no Vitest reference unless migration requested |
| R04 project inheritance | "Vitest 5 referenced config ignores root alias" → `advanced-projects` + compatibility | "A Vite app build ignores root alias" → no Vitest reference without test runner context |

For every pair, record exact reference files loaded, source-rule mapping,
answer correctness, trigger precision, and whether the near-miss stayed out
of scope. Missing execution evidence is `NHR`.
