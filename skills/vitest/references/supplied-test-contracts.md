# Seven supplied Vitest contract suites — conditional playbook

Load this reference **only** when the request concerns one of these supplied
suites or their tested contracts. All seven are written with `vitest` imports;
Storybook-related _unit contracts_ do not automatically belong to Vitest Browser
Mode. Determine the lane using file location, the config's `test.include`, and
relevant npm script—not the word 'Storybook' or imports from `.storybook` alone.
These supplied test files do not establish their checkout paths. The unit config
includes `tests/unit/**/*.test.{ts,tsx}`; the Storybook Browser Mode leaf
compiles stories via the addon. Do not invent checkout paths for the uploaded
files.

| Supplied test                         | GREEN: preserve behavior                                                                                                                       | RED: reject regressions                                                                                                                                          | AMBER: check unavailable dependencies                                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpMarkdownReport.test.ts`           | preserve exact passing/failed/violation/error sections and distinguish present-but-empty from missing                                          | never interpret missing report sections as passing, or treat MCP BDD execution as Vitest Browser Mode                                                            | report parser and Storybook MCP support source absent; runner behavior NHR                                                 |
| `moduleCoverage.test.ts`              | validate manifest schema and canonical exports, reject ambiguous imports, verify forwarding equivalence and fail-closed missing evidence       | never accept smoke-only evidence, duplicate claims, unresolved exports, invalid wrapper equivalence or generated inventory with invalid manifest                 | scripts/storybook-coverage.mjs, checked-in forwarding wrapper, fixture directory absent; CLI and source-mode execution NHR |
| `mswHandlers.test.ts`                 | use setupServer lifecycle and explicit 200 response plus fixture assertions; preserve Docs iframe isolation and intentional 501 unmapped types | never bypass missing MSW handlers or permit real network fallthrough; do not silence all unhandled requests                                                      | source call sites, .storybook handlers and story files absent; network and Storybook environment results NHR               |
| `previewEnvStubs.test.ts`             | preserve vi.resetModules, vi.doMock and telemetry-disable assertions; distinguish unit jsdom from Chromium                                     | never enable live telemetry by changing stub assumptions or transplant unit setup into Browser Mode                                                              | preview-setup and AppInsightsService source absent; import/mock execution NHR                                              |
| `producerIdentity.test.ts`            | accept only matching producer, freeze, URL and child epoch; treat negative variants as intended rejections                                     | never reuse mismatched PID/epoch, freeze or URL as valid provenance                                                                                              | maintained producer validator unavailable; actual receipt validation NHR                                                   |
| `reactAriaEvaluationContract.test.ts` | retain 48 discoverable evaluation story expectation, import resolution checks, scoped CSS and TS inclusion                                     | do not weaken acceptance by deleting stories, ignoring unresolved imports, bypassing tsconfig, or treating Storybook story count as a Vitest play-function count | React Aria source directories, tsconfig and story bodies absent; filesystem checks NHR                                     |
| `rollupOnLog.test.ts`                 | suppress exactly vendor INVALID_ANNOTATION and PLUGIN_TIMINGS as tested; forward first-party warnings and all other diagnostics                | never silence first-party INVALID_ANNOTATION, unresolved imports, sourcemap errors, or unrelated diagnostics                                                     | actual .storybook/rollupOnLog implementation absent; runtime forwarding NHR                                                |

## Correct handling of the test contracts

- A test's _expected rejection_ (for example `ok: false`, a thrown fetch, `501`,
  or a manifest error code) is a **successful negative assertion**, not evidence
  the test has failed. Conversely, `expect(...).toBe(false)` being present does
  not prove it was executed successfully.
- `mswHandlers.test.ts` uses `setupServer` from `msw/node` in a Vitest suite and
  tests Storybook MSW configuration. Keep the suite owner separate from the
  tested system. An actual Storybook Browser Mode play-function run requires the
  Storybook leaf; Playwright BDD/MCP remains Playwright Test-owned.
- `moduleCoverage.test.ts` imports `scripts/storybook-coverage.mjs` and includes
  CLI invocation plus filesystem evidence; `producerIdentity.test.ts` imports
  the same missing validator. Never claim those validations pass without those
  files and execution.
- `reactAriaEvaluationContract.test.ts` is a static repository contract that
  expects 48 stories; 48 is a _source-specific acceptance assertion_, not a
  universal Storybook or coverage rule. It requires the real story tree and
  `tsconfig.json`.
- `previewEnvStubs.test.ts` depends on Vitest module isolation and typed mock
  helpers whose declarations are not supplied; do not infer their behavior.
  `rollupOnLog.test.ts` permits two narrowly scoped suppressions, not broad
  warning filtering.
- Preserve exact regexes, paths, case-sensitive event names and sentinel strings
  where tests enforce them. Do not rework project code to game passing
  assertions.

## Evidence protocol (GREEN / RED / AMBER)

For each supplied file, record: (1) a positive GREEN case and its asserted
expected contract; (2) a RED counterexample and exact assertion that should
reject it; (3) an AMBER case requiring missing source, installed Vitest, Node,
Storybook, network or browser execution. Mark **static source mapping** PASS
only after verifying the relevant assertions exist. Mark **runtime** and
**agent-with/without-skill behavior** `NHR` unless actually run with
artifacts/logs. A negative case specified but not executed is `NHR` as
behavioral evidence, not `FAIL` or `PASS`.
