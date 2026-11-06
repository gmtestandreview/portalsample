# Vitest skill GREEN / RED / AMBER evidence assessment

## Scope

Evaluated 7 newly supplied `.test.ts` source files against the optimized Vitest skill's project governance. Source-level pattern assertions were executed in Python, checking that each file actually contains a set of positive and deliberate rejection expectations. The 21 GREEN/RED/AMBER agent-evaluation cases are authored but **were not run against an agent**. No npm/Vitest/browser runtime was present; dependencies and referenced repository modules are unavailable.

## Results

| Test | GREEN static mapping | RED static mapping | AMBER runtime and agent |
| --- | --- | --- | --- |
| `mcpMarkdownReport.test.ts` | PASS | PASS | NHR |
| `moduleCoverage.test.ts` | PASS | PASS | NHR |
| `mswHandlers.test.ts` | PASS | PASS | NHR |
| `previewEnvStubs.test.ts` | PASS | PASS | NHR |
| `producerIdentity.test.ts` | PASS | PASS | NHR |
| `reactAriaEvaluationContract.test.ts` | PASS | PASS | NHR |
| `rollupOnLog.test.ts` | PASS | PASS | NHR |

**GREEN:** 7/7 source mappings PASS: source assertions establish intended success contracts. These are NOT Vitest run passes.
**RED:** 7/7 source mappings PASS: source contains specific negative-assertion contracts which the skill must preserve. These are NOT observed failing tests or executed RED baselines.
**AMBER:** 7/7 require human/runtime review (NHR); no installed dependencies, full repository, or actual agent with/without-skill invocation were supplied.

### Important learned boundary

Storybook-focused test source can still execute in the **unit** lane. `mswHandlers.test.ts`, `previewEnvStubs.test.ts`, and `rollupOnLog.test.ts` import `.storybook` internals but that does not change ownership. Confirm the real checkout path against `vitest.unit.config.ts` include globs; uploaded basename alone cannot prove it.

### QAQ/RMI

- Positive unit-contract review -> inspect `tests/unit/**/*.test.{ts,tsx}` inclusion, unit setup, mocks and assertions; near-miss "must run Storybook Chromium because it tests Storybook configuration" -> reject.
- Positive Storybook story `play()` editing -> Storybook Vitest Browser Mode; near-miss Playwright BDD/MCP scenario -> Playwright Test, not Vitest Browser Mode.
- Positive explicit fail-closed 501 and missing evidence assertions -> retain; near-miss converting negative `expect(false)` or `rejects.toThrow()` to a false test failure -> reject.
- Positive strong error/log diagnostic signal -> retain; near-miss silencing broad warnings or allowing MSW passthrough -> reject.
- Source mappings are direct (`PASS` static inspection); agent behavior and reverse-mapping in actual invocation remain `NHR`.

## Check execution and limitations

- PASS: read seven exact supplied source files in sandbox.
- PASS: checked positive and negative required source markers in each file (14 static source checks).
- PASS: YAML metadata parsable and mandatory fields nonempty; all local reference links in revised `SKILL.md` resolve.
- PASS: parsed 21 new test definitions as JSON and verified 7 × 3 structure.
- NHR: running Vitest suites, TS typechecking, Browser Mode/Storybook Test panel, project CLI/coverage.
- NHR: RED/GREEN agent comparisons, actual activation accuracy, pressure and regression execution.
- AMBER (retained): addon compatibility bridge comment cites Storybook 10.5.10 while supplied `package.json` pins 10.6.5.

## Changes to candidate

1. Added `references/supplied-test-contracts.md` (conditional 7-suite project guidance with GREEN/RED/AMBER distinctions).
2. Routed the main `SKILL.md` to that reference; emphasized that the tested component does not determine the test runner.
3. Added 21 unexecuted evaluation definitions and source-level validation results.
4. Retained all earlier skill references and original baseline untouched.

## Score / recommendation

**97/100 static document quality (unchanged).** New test files improve evidence coverage but cannot justify increasing the validation-discipline point without demonstrated agent and runtime tests.

**Blockers:** required behavioral RED/GREEN and positive/near-miss activation evidence; actual full project/Vitest 5.0.5 runtime; Storybook addon Test-panel compatibility. The mandatory behavior-critical `NHR` states prevent deployment.

**Recommendation: hold.**
