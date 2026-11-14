# CLAUDE.md

## Workspace

This is a source-map capture snapshot of `portal.measurement.gov.au`, the NMI
customer portal. Work from the repository root; `package.json` contains the
validation scripts.

- Node >= 24 is required by `engines` and `devEngines.onFail`.
- `postinstall` runs `patch-package`; patched dependencies in `patches/` are
  applied automatically.

## Validation

- Type and lint: `npm run type-check`, `npm run lint`, `npm run lint:rules`.
- Data and tests: `npm run validate:json`, `npm run test:unit`,
  `npm run test:storybook`.
- Full gates: `npm run test:ci`, `npm run migration-check`.
- BDD: `npm run test:e2e:app` and `npm run test:e2e:storybook`.

Vitest runs use
`node --max-old-space-size=8192 ./node_modules/vitest/vitest.mjs` with
`--configLoader runner`; the flag avoids a child-process warning. Use the
appropriate `vitest.unit.config.ts` or `vitest.storybook.config.ts` config for
targeted tests. The watch script retains the heap setting.

BDD configs enable `aiFix.promptAttachment`; for a failing suite, open the HTML
report under `reports/playwright/app` or `reports/playwright/storybook` and copy
the AI-fix attachment into the coding assistant.

## Markdown

`MD013/line-length` is disabled. Wrap only for readability or Oxfmt. Use real
Markdown headings; do not use emphasis as headings or weaken
`MD036/no-emphasis-as-heading`.

## Stack

React 18, TypeScript, React Router v7, Azure AD B2C/MSAL, Formik/Yup, Bootstrap
5/SCSS, NSwag API client, Application Insights/Google Analytics, Vite 8, Trusted
Types, and DOMPurify.

## Storybook

For UI work, use the configured `my-storybook-mcp-server` for component and
documentation knowledge. If unavailable, record that limitation and do not infer
undocumented properties. Verify every design-system property with `docs-list`
and `docs-show`; use `get-storybook-story-instructions` and finish with
`test-run`.

Do not suppress React `act(...)` warnings. Formik, lookup, and route stories
must derive state synchronously or await settled UI with `findBy...`/`waitFor`;
do not hide derived visibility behind `useEffect` plus `setState`.

When using Storybook MCP, start `npm run storybook`, verify
`http://localhost:6006/mcp` and the configured server, and restart the client if
the tools were unavailable before Storybook became ready. Never guess a prop;
ask the user when documentation or examples do not establish it.

## Edit boundaries

Edit freely: `ClientApp/src/**/*.ts`, `ClientApp/src/**/*.tsx`, and
`ClientApp/src/styles/**/*.scss`.

Do not directly edit generated or vendor files: the NSwag client,
`ClientApp/src/main.*.js`, `ClientApp/css/main.*.css`,
`ClientApp/source-map-http-downloads/**`, or `ClientApp/src/external/**`, unless
the task explicitly requires snapshot repair and the generator/upstream source
is unavailable. Confirm before editing any other unsafe target.

## Architecture pointers

Bootstrap: `ClientApp/src/index.tsx`; router: `ClientApp/src/App.tsx`; routes:
`ClientApp/src/routes/**`; components: `ClientApp/src/components/**`;
authentication: `ClientApp/src/authentication/**`; runtime environment:
`ClientApp/src/env.ts`; API: `ClientApp/src/api/web-api-client.ts`; shared
types: `ClientApp/src/types.ts`; schemas: `ClientApp/src/validationSchemas/**`;
instrumentation: `ClientApp/src/instrumentation/AppInsightsService.ts`; storage:
`ClientApp/src/storage/**`; utilities: `ClientApp/src/utils/index.ts`.

## Critical patterns

- Browser runtime configuration is injected through `window.*`; handwritten
  browser code must use `env` from `ClientApp/src/env.ts`, not `process.env`.
- Prefer `globalThis` over `window` except where browser-specific typing or the
  runtime configuration contract requires `window`.
- Protect routes with `<AuthenticatedElement>`; multi-step forms pass
  `displayHeaderAndFooter={false}`. Use authentication hooks, not
  `AccountContext` directly.
- Custom Yup methods live in
  `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts`. Schema
  files using them must import the side-effect module, for example
  `import '../../validationSchemas/yupExtensions';`.
- Forms use Formik and `<UnsavedFormPrompt>` for unsaved-change detection; do
  not reimplement navigation guards.
- New authored SCSS uses `@use`/`@forward`; authored Sass division uses
  `math.div()` with `@use 'sass:math'` first. Do not add Bootstrap imports
  beyond `ClientApp/src/styles/_bootstrap-import.scss`.
- Bootstrap 5's `negativify-map()` keeps full `@use` migration deferred. Keep
  `silenceDeprecations: ['import']` in `vite.config.mts` and
  `.storybook/main.ts` and `quietDeps: true` for Bootstrap's internal
  deprecations.

## Skills

Mandatory A Team triggers and procedures are defined in
`skills/using-a-team/SKILL.md`; follow them rather than duplicating the table
here.

## Instruction files

Use the applicable guidance in `.github/instructions/`, especially
`snapshot-boundaries.instructions.md`, `yup-extension-guard.instructions.md`,
`Route-security-review.instructions.md`, `config-policy.instructions.md`,
`code-change-discipline.instructions.md`, and
`generated-and-tracked-boundaries.instructions.md`.
