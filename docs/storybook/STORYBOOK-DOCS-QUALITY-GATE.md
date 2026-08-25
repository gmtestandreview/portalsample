# Storybook Documentation Quality Gate

## Baseline

- Storybook version: `10.5.10`
- Branch: `refactor/storybook-autodocs`
- Final implementation commit verified: `01b3625`
- Verification date: 2026-08-25

## Automated verification

| Check                      | Command                                                           | Result                                                                 |
| -------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Static policy              | prohibited-architecture `rg` searches                             | PASS; production and configuration files contain no prohibited pattern |
| Governance                 | `npx vitest run tests/unit/storybook/storybookDocsConfig.test.ts` | PASS; 13 assertions                                                    |
| Workflow policy            | `npx vitest run tests/unit/config/workflowPolicy.test.ts`         | PASS; 25 assertions                                                    |
| TypeScript                 | `npm run type-check`                                              | PASS                                                                   |
| Lint                       | `npm run lint` and `npm run lint:mdx`                             | PASS                                                                   |
| Unit                       | `npm run test:unit`                                               | PASS; 121 files and 1,333 tests                                        |
| Storybook interaction      | `npm run test:storybook`                                          | PASS; 87 files and 218 tests                                           |
| BDD generation and runtime | `npm run test:e2e:storybook`                                      | PASS; 135 scenarios                                                    |
| Docs build                 | `npm run storybook:verify:docs`                                   | PASS; 315 entries, including 97 docs and 218 stories                   |

The completed docs build retains non-fatal baseline warnings for unresolved
Public Sans light/medium font references and third-party Application Insights
pure annotations. Neither warning changes the generated index or runtime
documentation behaviour.

## Feature behaviour

- [x] Global Autodocs is enabled.
- [x] `!autodocs` is documented.
- [x] Ordinary stories inherit the global tag without local repetition.
- [x] Component JSDoc populates descriptions.
- [x] Args drive representative story state.
- [x] ArgTypes enhance rather than duplicate inference.
- [x] Controls render and sort required props first.
- [x] The table of contents renders.
- [x] The Code Panel renders with current-story source.
- [x] Generated source renders without preview decorators.
- [x] Standalone MDX pages render.
- [x] GFM tables render as HTML tables.
- [x] `Typeset`, `ColorPalette`, and `IconGallery` render.
- [x] Style Guide story references render through the `Stories` Doc Block.
- [x] `storybook build --docs` succeeds.
- [x] `storybook-static` contains both docs and stories.

## Rubric

| Category                             |  Weight |  Score | Evidence                                                                         |
| ------------------------------------ | ------: | -----: | -------------------------------------------------------------------------------- |
| Autodocs and tag model               |      15 |     15 | Global `autodocs`, documented `!autodocs`, and governance coverage               |
| MDX architecture                     |      10 |     10 | Standalone guides and component-attached MDX remain distinct                     |
| Doc Blocks                           |      12 |     12 | Native Autodocs plus `Stories`, `Typeset`, `ColorPalette`, and `IconGallery`     |
| Code Panel and Source                |       8 |      8 | Global configuration and passing runtime scenarios                               |
| Args, ArgTypes and inference         |      13 |     13 | Three representative components verified through MCP and runtime docs            |
| Parameters and inheritance           |      10 |     10 | Global policy with documented project/component/story precedence                 |
| Docs build and publishing            |       8 |      8 | Structural verifier and PR/release CI gates                                      |
| `main.ts`, addons and TypeScript     |       8 |      8 | 10.5.10 alignment, obsolete addons removed, CSF override removed by A/B evidence |
| Architecture and maintainability     |       6 |      6 | Canonical globs, one preview policy, executable governance                       |
| Evidence, currency and actionability |      10 |      9 | Current stable versions, repeatable commands, baseline and A/B records           |
| **Total**                            | **100** | **99** | **Exceeds the 95-point gate**                                                    |

## Critical-error caps

- [x] Does not claim `docs` is the Autodocs trigger.
- [x] Does not claim addon configuration alone activates Autodocs.
- [x] Does not recommend Storysource instead of Code Panel.
- [x] Does not reverse parameter precedence.
- [x] Does not replace metadata inference with manual ArgTypes by default.
- [x] Records the tested Storybook version.
- [x] Uses official Storybook references as the architectural baseline.

## Final result

- Target: at least 95/100
- Actual: 99/100
- Critical cap triggered: No
- Documentation build: PASS
- Runtime documentation tests: PASS
- Status: PASS
