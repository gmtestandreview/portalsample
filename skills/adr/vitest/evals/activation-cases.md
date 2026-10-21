# Activation, retrieval, and application cases

These are test definitions for behavioral evaluation. They are not execution
evidence. Record each executed case separately with the candidate revision,
environment/model, retrieved resources, observable output, and
`PASS | AMBER | FAIL | NHR`.

## Required cases

| Case | Request | Expected behavior | Acceptance evidence |
| --- | --- | --- | --- |
| Positive: mocking | "Mock a module in Vitest and reset it between tests." | Activate; start with `references/features-mocking.md`; add `references/advanced-vi.md` only if broader `vi` utilities are actually needed. | Trace/resource log shows minimal retrieval; answer correctly applies the retrieved API to the requested reset behavior. |
| Positive: config + coverage | "How do I configure Vitest coverage in a Vite project?" | Activate; use `references/features-coverage.md` plus `references/core-config.md`. | Both relevant resources are retrieved; no unrelated topic file is loaded; answer combines them coherently. |
| Positive: indirect migration | "Convert this Jest test suite to run under Vitest." | Activate because Vitest migration is explicit; retrieve only references needed by the supplied suite. | Activation occurs despite Jest vocabulary; output changes Jest-specific behavior only where supported by Vitest references. |
| Positive: application | "This Vitest hook leaks state between tests. Show the smallest correction." | Activate and retrieve `references/core-hooks.md` plus another topic only when the concrete code requires it. | Output changes the user's code/config correctly rather than merely summarizing hook documentation. |
| Near-miss: Jest only | "How does `jest.mock` work in Jest?" | Do not activate solely from shared testing vocabulary. | Skill remains inactive or contributes no Vitest-specific reference content. |
| Near-miss: other runner | "Write this test in Node's built-in test runner." | Do not activate. | Skill remains inactive. |
| Ambiguous shared API | "Why is `expect(...).toEqual(...)` failing?" | Do not assume Vitest from the API name alone; use the skill only when surrounding context establishes Vitest. | Activation decision follows explicit runtime/context evidence, not the shared matcher name. |
| Cross-topic | "Run browser-like Vitest tests with coverage in two projects." | Activate; retrieve `advanced-environments.md`, `features-coverage.md`, and `advanced-projects.md`; add config only if needed. | Retrieval is sufficient but not broader than the request; answer integrates all three topics without contradiction. |
| Unsupported-version boundary | "What changed in Vitest after the bundled source revision?" | Do not infer from the bundle; state that the snapshot does not establish post-revision behavior and use a newer authoritative source only when available/permitted. | Output distinguishes bundled evidence from newer external evidence and makes no unsupported snapshot claim. |
| Unsupported query | "Does this undocumented Vitest flag exist?" | Search the relevant bundled CLI/config reference; if unsupported there, report the evidence gap rather than inventing syntax. | No fabricated flag or option; missing coverage is explicit. |
| Resource discovery | "How do I shard Vitest tests across CI jobs?" | Activate and discover `references/features-concurrency.md` without the prompt naming the file. | Correct resource is selected from intent alone. |
| Scope coverage | "Which bundled reference covers type-level Vitest assertions?" | Activate and retrieve `references/advanced-type-testing.md`. | Correct resource is located without loading unrelated references. |

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
