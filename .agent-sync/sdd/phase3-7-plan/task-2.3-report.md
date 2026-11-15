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
