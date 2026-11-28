# React 19 Audit

Date: 2026-11-28 Scope: `ClientApp/src/**/*.{ts,tsx}` (excluding
`ClientApp/src/external/**`, generated and vendor files) Workflow source:
`.github/agents/workflows/react19/react19-commander.agent.md`

This replaces the earlier 2026-05-17 audit, which described a `static/js`
snapshot layout that does not exist in this repository.

## Dependencies

- `react` 19.3.1, `react-dom` 19.3.1
- `@testing-library/react` ^16.3.3

## Total Issue Count

0 actionable issues.

## Issue Counts By Pattern

| Pattern                                             | Count | Notes                          |
| --------------------------------------------------- | ----: | ------------------------------ |
| `ReactDOM.render` / `hydrate`                       |     0 |                                |
| `unmountComponentAtNode`                            |     0 |                                |
| `findDOMNode`                                       |     0 |                                |
| Legacy context (`contextTypes`, `getChildContext`)  |     0 |                                |
| String refs (`this.refs`)                           |     0 |                                |
| Function-component `defaultProps`                   |     0 |                                |
| `useRef()` without initial value                    |     0 |                                |
| `react-dom/test-utils`, `Simulate`                  |     0 | Only UI text in a story        |
| `.propTypes =`                                      |     0 |                                |
| `forwardRef` (optional modernization, not breaking) |     4 | Intentionally kept (see below) |

## Additional scans (auditor phases 2–4)

| Scan                                                       | Scope                    | Count | Notes                                                                                  |
| ---------------------------------------------------------- | ------------------------ | ----: | -------------------------------------------------------------------------------------- |
| `createFactory`                                            | `ClientApp/src`, `tests` |     0 |                                                                                        |
| `react-dom/test-utils`, `Simulate.`, `react-test-renderer` | `ClientApp/src`, `tests` |     0 |                                                                                        |
| `import React from 'react'`                                | `ClientApp/src`          |     3 | All three still use `React.` (`isValidElement`, `ReactNode`, `createElement`); keep    |
| `toHaveBeenCalledTimes(2)` / `(4)`                         | `tests`                  |    16 | Across 13 files; informational only, unit suite passes, no StrictMode delta fix needed |
| `npm ls` peer / invalid / unmet problems                   | repo                     |     0 | Exit 0                                                                                 |

Totals: 0 critical, 0 deprecated, 0 test-specific, 0 files requiring changes.

## Retained `forwardRef` sites

- `ClientApp/src/components/Actions/index.tsx` (`ActionMenuLink`,
  `ActionMenuButton`)
- `ClientApp/src/components/AriaComponents/SearchField/SearchField.tsx`
- `ClientApp/src/components/Inputs/DatePicker/CustomDateInput.tsx`

## Validation

- `npm run type-check`: pass
- `VITE_ENVIRONMENT=Dev npm run build`: pass
- `npm run test:unit`: last full pass 266 files, 3187 tests
