# Storybook Autodocs Refactor Baseline

## Repository

- Branch: `refactor/storybook-autodocs`
- Commit: `503c9e5d17d10366aa802e083232f046e3d50450`
- Package manager: npm (`package-lock.json`, lockfile version 3)
- Declared Storybook version: `10.4.6`
- Resolved local Storybook version: `10.4.6`
- Approved stable upgrade target: `10.5.10`

The generic plan command `npm exec storybook --version` reported the npm CLI
version (`11.15.0`) rather than the local Storybook version. The resolved
Storybook version was therefore verified from `node_modules`, `npm ls`, the
lockfile, and the local Storybook executable.

The originating checkout contained unrelated edits and untracked files. This
work is isolated in a linked worktree so those files remain untouched:

```text
M ClientApp/src/index.tsx
M tests/unit/runtime/indexBootstrap.test.tsx
?? .claude/settings.json
?? docs/qa/2026-08-23-storybook-autodocs-review.md
?? docs/superpowers/plans/2026-08-23-storybook-autodocs-refactor-plan.md
?? public/
```

## Existing quality commands

- Type check: `npm run type-check`
- Unit: `npm run test:unit`
- Storybook component tests: `npm run test:storybook`
- BDD generation: `bddgen -c playwright.storybook.config.ts`
- Storybook E2E: `npm run test:e2e:storybook`
- Storybook development: `npm run storybook`
- Storybook build: `npm run build-storybook`
- Existing docs build alias: `npm run build-storybook-docs`

## Existing Storybook test paths

- Feature directory: `tests/e2e/features/storybook/**/*.feature`
- Step definition: `tests/e2e/steps/storybook.steps.ts`
- Playwright configuration: `playwright.storybook.config.ts`
- Pull-request CI workflow: `.github/workflows/pr.yml`
- Release CI workflow: `.github/workflows/release.yml`

## Representative components

1. Simple typed props:
   `ClientApp/src/components/Buttons/PrimaryButton/index.tsx` and
   `ClientApp/src/components/Buttons/PrimaryButton/PrimaryButton.stories.tsx`
2. Union/enum props: `ClientApp/src/components/Pill/StatusPill.tsx` and
   `ClientApp/src/components/Pill/Pill.stories.tsx`
3. Difficult inference/Formik wrapper:
   `ClientApp/src/components/Inputs/DatePicker/CustomDateInput.tsx` and
   `ClientApp/src/components/Inputs/DatePicker/CustomDateInput.stories.tsx`

The Storybook MCP catalogue and component documentation were inspected for all
three cases before selection.

## Baseline results

| Check                         | Command                                                                                                                                                | Result                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Type check                    | `npm run type-check`                                                                                                                                   | PASS                                                                    |
| Targeted Storybook unit tests | `npm run test:unit -- tests/unit/storybook-autodocs.test.ts tests/unit/storybook/coverageDrift.test.ts tests/unit/storybookMigrationInventory.test.ts` | PASS: 16 tests                                                          |
| Full unit suite               | `npm run test:unit`                                                                                                                                    | INCONCLUSIVE: no progress output for more than four minutes; terminated |
| Storybook component tests     | `npm run test:storybook`                                                                                                                               | FAIL: 207 passed, 11 failed                                             |
| Storybook BDD                 | `npm run test:e2e:storybook`                                                                                                                           | FAIL: 128 passed, 2 failed                                              |
| Docs build                    | local `storybook build --docs --output-dir storybook-static-baseline`                                                                                  | PASS                                                                    |

The baseline static index contained 315 entries: 97 documentation entries and
218 story entries.

## Known pre-existing failures

### Storybook component tests

`npm run test:storybook` exited 1 with 11 modal-visibility failures across four
story files:

- `ClientApp/src/components/Footer/Footer.stories.tsx`: three failures;
- `ClientApp/src/components/modals/Modals.stories.tsx`: five failures;
- `ClientApp/src/components/RouteLeavingGuard/RouteLeavingGuard.stories.tsx`:
  two failures;
- `ClientApp/src/components/modals/ContentModal/ContentModal.stories.tsx`: one
  failure.

The suite also emitted existing missing-runtime-variable, accessibility-label,
and React `act(...)` warnings. These failures predate the refactor and are not
silently attributed to the Storybook upgrade.

### Storybook BDD

`npm run test:e2e:storybook` exited 1 with two failures:

- the default Footer scenario expected a visible `Help guide` button that was
  not present;
- the ServicesWeOffer scenario remained at `Checking assigned services...`
  instead of rendering its page heading.

### Full unit runner

The full unit command remained active without result output for more than four
minutes and was terminated. The three existing Storybook-focused unit files
were then run directly and passed all 16 tests.

### Docs build warnings

The successful baseline docs build reported unresolved light/medium Public Sans
font references, existing Rolldown pure-annotation warnings from Application
Insights dependencies, and plugin timing notices.

## Configuration findings

High-signal pre-refactor search evidence:

```text
package.json: @storybook/addon-styling-webpack is declared
package.json: @storybook/addon-onboarding is declared but unreferenced
.storybook/main.ts: addon-docs owns autodocs, defaultName, and docsMode
.storybook/main.ts: duplicate story and MDX globs are configured
.storybook/main.ts: typescript.check is true under React/Vite
.storybook/main.ts: @storybook/csf-plugin is injected manually
.storybook/preview.ts: expectedAddonDocsConfig and autoDocsTemplate are imported
.storybook/preview.ts: docs.enabled and docs.autodocs duplicate tag state
.storybook/preview.ts: source.type is dynamic and Canvas source is shown
.storybook/preview.ts: a generic global component description is configured
.storybook/preview-docs.ts: Storybook's default Autodocs template is cloned
.storybook/component-docs-guide.mdx: developers are told to add the 'docs' tag
tests/unit/storybook-autodocs.test.ts: hard-coded constants enforce the obsolete architecture
```

Additional inventory:

- 82 story files repeat the globally inherited `autodocs` tag;
- 9 story files use the incorrect or redundant `docs` tag;
- `DocsTable` remains used by multiple specialist MDX pages and must not be
  deleted as part of the simple-table policy change.

## Approved upgrade extension

The implementation scope was explicitly expanded after baseline discovery:

- align Storybook-owned packages on stable `10.5.10`;
- update compatible Storybook ecosystem addons to their latest stable releases;
- remove obsolete Webpack-only and confirmed unused addons;
- run Storybook upgrade/doctor diagnostics;
- inspect and update Storybook configuration, stories, tests, and documentation
  where the current architecture requires migration.

## RED governance test

Command:

```bash
npm run test:unit -- tests/unit/storybook/storybookDocsConfig.test.ts
```

Result: expected failure, exit code 1. All 13 governance tests failed against
the baseline for the intended reasons, including outdated package versions,
obsolete addons, overlapping globs, misplaced Docs configuration,
Webpack-specific TypeScript checking, absent GFM support, repeated story tags,
duplicate Autodocs state, missing Code Panel configuration, the cloned default
template, the global generic description, and outdated developer guidance.

The obsolete `tests/unit/storybook-autodocs.test.ts` was removed because it
asserted hard-coded local constants rather than repository behaviour and
encoded the architecture this executable governance contract replaces.

## Metadata inference verification

Storybook MCP documentation and a successful `storybook build --docs` on
Storybook 10.5.10 produced the following default `react-docgen` evidence:

| Component | Public props | Required state | Descriptions | Union/enum | Result |
| --- | --- | --- | --- | --- | --- |
| PrimaryButton | Custom props `className`, `mode`, and `size` appear; inherited native button props are omitted by the default parser | All three custom props are correctly optional | Component and custom-prop JSDoc appear | `mode` is shown as `'dark' \| 'light'` and receives an intentional inline-radio ArgType | Acceptable with a documented inherited-native-prop limitation |
| StatusPill | `status` and `className` appear | `status` is required and `className` is optional | Component and prop JSDoc appear | The workflow enum union and string fallback are visible | Pass |
| CustomDateInput | All 22 public integration props appear | Required calendar, Formik, handler, and wrapper props are distinguished from optional props | Meaningful descriptions appear for every public prop | No public union/enum prop requires manual augmentation | Pass |

The representative Default stories use args, and all three focused component
and accessibility checks passed through the Storybook MCP. The default parser
is sufficient for the complex Formik wrapper and enum-union sample. Task 10
will use the PrimaryButton inherited-prop limitation as the explicit decision
input rather than switching parsers pre-emptively.
