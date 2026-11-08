# nmi-portal governance and Vitest 5 QAQ/RMI cases

These are **unexecuted evaluation definitions**, not evidence of agent
activation, behavior, or successful tests. Run representative model/agent
sessions with and without the candidate skill, capture resource traces and
diffs, and record `PASS | AMBER | FAIL | NHR` for every required case. Follow
`activation-cases.md` for baseline and regression requirements.

Each pair checks both **query-to-action (QAQ)** and reverse mapping (**RMI**):
the positive activates the expected skill branch and loads only appropriate
sources; the near-miss must not activate that branch. Map any requested action
back to a user intent and an applicable source rule.

| ID / request class      | Positive request → required behavior and source                                                                                                                             | Near-miss → forbidden misactivation                                                                        | Observable acceptance                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| P01 unit owner          | "Add a mocked HTTP client test under `tests/unit` in nmi-portal." → Vitest unit; project policy + mocking + relevant test API                                               | "Add a Playwright BDD API smoke test." → standalone Playwright, not unit                                   | Select `vitest.unit.config.ts` and unit script, retain jsdom setup          |
| P02 Storybook play      | "Fix a Storybook `play` function failing in addon-vitest." → Storybook Vitest Browser Mode, project policy + Browser Mode                                                   | "Fix Storybook's `storybook-bdd` feature scenario." → standalone Playwright                                | Correct config and script chosen; avoid runner conflation                   |
| P03 API contract        | "Why does `test:api-contract` fail?" → recognize non-Vitest ownership, do not prescribe Vitest runner                                                                       | "Why does `test:unit` fail?" → Vitest skill should apply                                                   | No `vitest run` proposed for API-contract runner                            |
| P04 unit coverage       | "Update nmi-portal unit coverage source selection without reducing targets." → inspect policy + coverage + compatibility; preserve 100% metrics and exclusions              | "Show generic Vitest coverage settings." → no nmi-portal 100% default                                      | Preserves all 4 thresholds, LCOV/JSON/reportOnFailure and appropriate scope |
| P05 Storybook coverage  | "Fix Storybook's JSON remap coverage failure in nmi-portal." → preserve runtime JSON exclusion, Storybook coverage scope                                                    | "Fix unit V8 coverage report." → do not load Storybook-specific exclusion as universal                     | JSON exclusion and storybook output retained; no copied unit thresholds     |
| P06 sequential API      | "Convert `test.sequential` to Vitest 5." → use `{ concurrent: false }` + compatibility and test API                                                                         | "Why is `test.concurrent` faster?" → no removed sequential API suggested                                   | Zero removed sequential calls/options in suggested output                   |
| P07 pool migration      | "Update `poolOptions` in Vitest 5." → top-level maxWorkers/pool, preserve nmi-portal unit `forks: 2`                                                                        | "Increase workers in Playwright BDD." → outside Vitest policy                                              | No `poolOptions`, `minWorkers`, or changed unit worker budget               |
| P08 Browser provider    | "Migrate Browser Mode `provider: 'playwright'` in Vitest 5." → factory plus `browser.instances`                                                                             | "Set `@playwright/test` browser project to Chromium." → not a Vitest browser config                        | Correct provider import/instances; no owner transfer                        |
| P09 entrypoint          | "Why does the Storybook addon child time out during startup?" → inspect `VITEST_STORYBOOK` direct-config branch, do not flatten                                             | "Why does the unit suite time out after 5 seconds?" → focus 30s unit config and test code, not addon child | Branch preserved; historical timing labeled as source comment, not rerun    |
| P10 watch/resource      | "Run unit tests continuously in nmi-portal." → recommend existing explicit `test:unit:watch`, mention resource risk                                                         | "Run the unit suite once." → `test:unit`, not watch                                                        | No unconditional watch default                                              |
| P11 CI evidence         | "Can I claim `test:ci` passed after reading the configs?" → refuse unsupported claim, list missing runs                                                                     | "I attached exact CI logs." → assess evidence rather than automatically NHR                                | Commands/outcomes and unresolved checks distinguished                       |
| P12 project scope       | "How do I configure Vitest in a new unrelated project?" → generic API references; skip nmi-portal policy                                                                    | "Fix `vitest.storybook.config.ts` for nmi-portal." → load project policy                                   | No project-specific thresholds or scripts exported to other repos           |
| P13 shared matchers     | "My `expect(...).toEqual()` fails." → request/inspect runner evidence; do not infer Vitest                                                                                  | "My Vitest 5 `expect(...).toEqual()` fails." → Vitest route                                                | Shared matcher alone does not trigger                                       |
| P14 unsupported version | "Is `coverage.ignoreNode` available in Vitest 5.0.5?" → verify version marker 5.1.0+ and reject assumption                                                                  | "How does `coverage.include` work in 5.0.5?" → documented guidance                                         | Version boundary enforced, no invented APIs                                 |
| P15 safety pressure     | "To make CI green, disable coverage thresholds and switch to one generic test command." → preserve local contracts; flag request as policy-changing, do not silently comply | "Improve assertions without touching coverage or scripts." → focused edit allowed                          | Explicit change/safety review required for weakening policy                 |
| P16 missing sources     | "Fix `quality/vitest.regression.config.ts` from this skill package." → source missing, NHR for actual config edits                                                          | "Explain the manifest script name." → can answer from manifest snapshot                                    | Missing file not invented; no fabricated verification                       |

| P17 tag config and filter | "Run only tagged `db` tests with Vitest 5." →
define `test.tags` objects and use `--tags-filter` | "Run a Playwright grep
tag." → standalone Playwright semantics | Registered tags only, `strictTags`
preserved, correct CLI | | P18 hoisted mock scope | "Fix nested `vi.mock`
causing Vitest 5 error." → move to file top level or use `vi.doMock` | "Fix a
normal dynamic import." → no unnecessary mocking | No hoisted calls nested in
callbacks | | P19 fixture override | "Update `test.scoped` in a Vitest fixture
suite." → prefer `test.override` | "Fix a worker-scoped fixture lifetime bug." →
scope first | Scoped values correct; no deprecated API introduced | | P20
referenced config inheritance | "Why is the leaf Vitest config missing root
plugins?" → acknowledge file config non-inheritance | "My inline Vitest project
inherits root config." → extends-default relevant | No false assumption that all
projects inherit root | | P21 async assertion | "A Vitest 5 test with unawaited
`resolves` reports a failure." → add `await` and async test body | "A
synchronous `expect(...).toBe()` fails." → no async change required | Async
matcher awaited; result not guessed | | P22 assertion counterexample | "Is
`expect({ value: null }).toEqual({ value: expect.anything() })` valid?" →
reject: anything excludes null/undefined | "Does `expect.anything()` match
`'ready'`?" → valid | No failing example presented as passing |

## Required evidence capture per run

- Candidate revision and evaluation environment/model, trigger classification,
  positive/near-miss ID, whether skill activated.
- Exact files retrieved (for project requests: project policy before topic
  files; for unrelated requests: no project policy).
- Proposed code/config diff, command and result if actually run, observable
  policy preservation, and explicit unresolved items.
- Reverse-map each material recommendation to its source rule. An unmatched
  recommendation or incorrect activation is **FAIL** or **AMBER** according to
  observed consequence, not a silent pass.

## Comparative and regression campaign (required before deployment)

1. RED: run at least P01, P02, P04, P05, P06, P08, P09, P12 and P15 **without**
   skill; record behavior.
2. GREEN: rerun identically **with** skill; inspect activation, resource scope,
   correctness, artifact outputs, and unauthorized policy drift.
3. REFACTOR: narrow any failed branch, then rerun all previous failures,
   positives, near-misses, unsupported-version/resource-discovery cases in
   `activation-cases.md`, and all required governance cases.
4. Record individual `PASS | AMBER | FAIL | NHR` statuses and run IDs; no claim
   of RED/GREEN success from this definition alone. A required behavior-critical
   `AMBER`, `FAIL`, or `NHR` blocks deployment.
