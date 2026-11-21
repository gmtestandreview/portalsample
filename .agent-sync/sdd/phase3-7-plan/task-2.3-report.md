# Task 2.3 implementation report

## Status and scope

**DONE.** Refactored only the three remaining Lizard spans in `tests/unit/routes/ta/props.test.ts`: the application/instrument test, the client failure test, and their enclosing `describe`. The two historical findings resolved before this task were left intact. No application source, generated files, configuration, or policy files were changed. No agent or reviewer was used.

The two pre-existing working-tree edits, `.codacy/codacy.config.baseline.json` and `.codacy/codacy.config.json`, were left untouched and are excluded from this task's commit.

## RED–GREEN–REFACTOR evidence

- **RED / baseline:** `python -m lizard -L 100 tests/unit/routes/ta/props.test.ts` exited 1 with exactly three warnings: application/instrument callback 124 lines, client failure callback 166 lines, and enclosing `describe` callback 827 lines. `npx vitest run tests/unit/routes/ta/props.test.ts` passed all 11 existing tests before the edit, establishing the behavioral baseline for a refactor.
- **GREEN:** Split the application/instrument test into independent load/visibility and save tests. Split the eight failure cases into two independent tests, grouped by application/organisation and documents/summary. Each extracted test resets the mocks and creates its own abort signal. Kept all eight case operations, expected thrown messages, logger arguments, IDs, branch inputs, save payloads, and assertions. Split the oversized enclosing `describe` into focused groups without changing the already-resolved test bodies.
- **REFACTOR / verification:** The final diff adds only test boundaries, a duplicated per-test setup and failure assertion loop, and focused descriptions. It removes no case, assertion, or original input. The target suite passes 13 tests. Lizard exits 0 with zero warnings; its longest new `describe` is 98 lines and longest new test callback is 96 lines.

## Validation

| Command | Result |
| --- | --- |
| `npx eslint tests/unit/routes/ta/props.test.ts` | Exit 0; no diagnostics. |
| `npm run type-check` | Exit 0; `tsc --noEmit`. |
| `npx vitest run tests/unit/routes/ta/props.test.ts` | Exit 0; one file, 13/13 tests passed. |
| `python -m lizard -L 100 tests/unit/routes/ta/props.test.ts` | Exit 0; zero threshold warnings. |
| `git diff --check` | Exit 0; no whitespace errors. |

## Concerns and limits

The focused Vitest command printed an advisory about a future Vite native config loader and an extensionless import in `vitest.config.ts`; it did not affect the run. The 98-line failure `describe` is under the requested threshold but has little room for future additions. No full unit suite, coverage run, or end-to-end run was requested or performed. TokenSave exploration saved approximately 20,745 tokens; its index was synced before source inspection.

## Fix round 1 — shared failure assertions

The reviewer identified identical failure assertion loops at the former lines
925 and 1020. A literal TokenSave search confirmed two copies before the edit.
The focused Vitest baseline passed 13/13 tests before the refactor.

Added `LoggedFailureCase` and `expectLoggedFailures(failureCases)` in
`tests/unit/routes/ta/props.test.ts`. Both failure tests now pass their own case
arrays to the one helper. The helper retains the original
`Promise.resolve(operation())` rejection assertion and the exact logger, error,
and ID assertion. All eight case definitions, thrown messages, mock rejection
inputs, `expect.hasAssertions()` calls, per-test fixture resets, and abort
signals remain in their respective tests. The post-edit literal search finds one
failure assertion loop, in the helper; `git diff` shows no case data changes.

### Fix-round command and output evidence

| Command                                                      | Observed output and exit                                                                                                                        |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx eslint tests/unit/routes/ta/props.test.ts`              | Exit 0; no lint diagnostics.                                                                                                                    |
| `npm run type-check`                                         | `tsc --noEmit`; exit 0, no diagnostics.                                                                                                         |
| `npx vitest run tests/unit/routes/ta/props.test.ts`          | `Test Files 1 passed (1)` and `Tests 13 passed (13)`; exit 0.                                                                                   |
| `python -m lizard -L 100 tests/unit/routes/ta/props.test.ts` | `No thresholds exceeded` and `Warning cnt 0`; exit 0. The new helper is 16 lines, and the two failure `describe` callbacks are 87 and 83 lines. |
| `git diff --check`                                           | Exit 0; no whitespace errors.                                                                                                                   |
| `npx oxfmt --check tests/unit/routes/ta/props.test.ts`      | `All matched files use the correct format`; exit 0.                                                                                             |

The same non-failing Vite native config loader advisory appeared during Vitest.
No broader test or coverage suite was run. The two pre-existing Codacy edits
were not touched. Separate modifications to `skills/writing-skills/SKILL.md`
and `.github/instructions/codacy.instructions.md` appeared in the working tree
during this fix round; they were not part of this task and are not staged. No
agent or reviewer was spawned for this fix round.
