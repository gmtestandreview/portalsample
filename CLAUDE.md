# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this workspace is

This is a **source-map capture snapshot** of `portal.measurement.gov.au` — the Australian Government National Measurement Institute (NMI) customer portal. A root `package.json` is present with validation and test scripts; run them from the workspace root.

**Key validation commands:**

- `npm run type-check` — TypeScript type checking
- `npm run lint` / `npm run lint:fix` — ESLint
- `npm run test:unit` — Unit tests (Vitest)
- `npm run test:ci` — Full CI gate (type-check + tests + regression)
- `npm run migration-check` — Pre-migration gate (type-check + tests + storybook build)

See `package.json` for the full script list.

## Technology stack

| Layer | Technology |
| --- | --- |
| UI framework | React 18 (functional components, hooks) |
| Language | TypeScript |
| Routing | React Router v7 (`createBrowserRouter`) |
| Auth | Azure AD B2C via `@azure/msal-browser` / `@azure/msal-react` |
| Forms | Formik + Yup with custom string extensions |
| CSS | Bootstrap 5 (custom NMI theme) + SCSS partials |
| API client | Auto-generated `web-api-client.ts` (NSwag/OpenAPI) |
| Analytics | Azure Application Insights + Google Analytics |
| Bundler | Webpack 5 (config lives in `webpack.config.js`) |
| CSP | Trusted Types policy via `trustedtypes.ts` + DOMPurify |

## Storybook

When working on UI components, always use the `my-storybook-mcp-server` MCP tools to access Storybook's component and documentation knowledge before answering or taking any action.

Before the first Storybook MCP call, ensure `npm run storybook` is running and `http://localhost:6006/mcp` responds successfully. Confirm the configured `my-storybook-mcp-server` points to that endpoint. If the agent client started before Storybook was ready and the tools are absent, restart the client after the endpoint is healthy; do not bypass the MCP requirement.

- **CRITICAL: Never hallucinate component properties!** Before using ANY property on a component from a design system (including common-sounding ones like `shadow`, etc.), you MUST use the MCP tools to check if the property is actually documented for that component.
- Query `list-all-documentation` to get a list of all components
- Query `get-documentation` for that component to see all available properties and examples
- Only use properties that are explicitly documented or shown in example stories
- If a property isn't documented, do not assume properties based on naming conventions or common patterns from other libraries. Check back with the user in these cases.
- Use the `get-storybook-story-instructions` tool to fetch the latest instructions for creating or updating stories. This will ensure you follow current conventions and recommendations.
- Check your work by running `run-story-tests`.

Remember: A story name might not reflect the property name correctly, so always verify properties through documentation or example stories before using them.

## Edit boundaries

**Edit freely:**

- `ClientApp/src/**/*.ts`
- `ClientApp/src/**/*.tsx`
- `ClientApp/src/styles/**/*.scss`

**Never edit (generated / vendor):**

- `ClientApp/src/api/web-api-client.ts`
- `ClientApp/src/main.*.js`
- `ClientApp/css/main.*.css`
- `ClientApp/source-map-http-downloads/**`
- `ClientApp/src/external/**`
- `ClientApp/webpack/**`

If a file you are asked to edit falls outside the safe targets, pause and confirm with the user before proceeding.

## Architecture

| Concern | Path |
| --- | --- |
| App bootstrap | `ClientApp/src/index.tsx` |
| Router | `ClientApp/src/App.tsx` |
| Route modules | `ClientApp/src/routes/**` |
| Reusable UI | `ClientApp/src/components/**` |
| Auth config (MSAL) | `ClientApp/src/authentication/authConfig.ts` |
| Auth context / hooks | `ClientApp/src/authentication/accountContext.tsx`, `hooks.tsx` |
| Auth guard | `ClientApp/src/authentication/AuthenticatedElement.tsx` |
| Runtime env vars | `ClientApp/src/env.ts` |
| API client | `ClientApp/src/api/web-api-client.ts` |
| Shared types | `ClientApp/src/types.ts` |
| Validation schemas | `ClientApp/src/validationSchemas/**` |
| Yup custom methods | `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` |
| App Insights | `ClientApp/src/instrumentation/AppInsightsService.ts` |
| Session storage | `ClientApp/src/storage/**` |
| Utilities | `ClientApp/src/utils/index.ts` |

## Critical patterns

### Environment variables

Config is injected at runtime into `window.*` — **not** `process.env`. Always use the `env` object from `ClientApp/src/env.ts`:

```ts
import { env } from '../env';
env.REACT_APP_B2C_CLIENTID  // correct
process.env.REACT_APP_B2C_CLIENTID  // wrong — undefined at runtime
```

### Global object usage

Prefer `globalThis` over `window` in handwritten app code, tests, and mocks. This avoids SonarLint `typescript:S7764` findings and keeps shared runtime access working across browser-like test environments.

Use `window` only where browser-specific typing or the runtime config contract requires it, such as the `window.*` injection consumed by `ClientApp/src/env.ts`.

### Authentication guard

Wrap protected routes with `<AuthenticatedElement>`. Multi-step form routes pass `displayHeaderAndFooter={false}` to suppress the main chrome:

```tsx
<AuthenticatedElement displayHeaderAndFooter={false}>
  <CreateAccount />
</AuthenticatedElement>
```

Access authenticated user state via hooks in `ClientApp/src/authentication/hooks.tsx`, not by importing `AccountContext` directly.

### Yup validation — custom string methods

`ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` adds `.allowedFormat()`, `.nameAllowedFormat()`, `.businessName()`, `.maxLength()`, `.isRequired()`, `.minEntered()`, `.fixedDigits()`, `.phone()`, `.email()`, `.postcode()`, `.numbersOnly()`, `.decimalNumbersOnly()`, `.addressFormat()`, `.minValue()`, `.maxValue()`, `.noConsecutiveChars()`, `.atLeastOneChar()`, `.noConsecutivePuncuation()`, `.numberWithinRange()` to `Yup.StringSchema` (19 methods total).

Any schema file that calls one of these methods **must** import the side-effect module:

```ts
import '../../validationSchemas/yupExtensions';
```

Omitting this import causes silent runtime failures (`schema.method is not a function`) with no build-time error.

### Forms

Forms use Formik. Use `<UnsavedFormPrompt>` (wraps `RouteLeavingGuard` via `useFormikContext`) for unsaved-change detection. Do not re-implement navigation guards.

### SCSS module system

All new SCSS files must use `@use` / `@forward`, not `@import`. The `@import` rule is deprecated in Dart Sass and will be removed in Sass 3.

**Bootstrap shim**: `ClientApp/src/styles/_bootstrap-import.scss` isolates the Bootstrap `@import` to a single file. `index.scss` imports the shim (`@import './bootstrap-import'`) rather than Bootstrap directly. Do not add `@import 'bootstrap/scss/bootstrap'` anywhere else.

**Division**: All Sass division must use `math.div()`. Any file that uses `math.div()` must declare `@use 'sass:math';` as its first `@use` statement:

```scss
@use 'sass:math';
// ...
font-size: math.div($h1-font-size, 1.375);
```

**Module migration blocker**: `_variables.scss:68` calls `negativify-map()`, a Bootstrap 5 internal function available only via the global `@import` cascade. Full `@use`-based module migration for our partials is deferred until Bootstrap 6 (which supports `@use` natively). Until then, `silenceDeprecations: ['import']` in both `webpack.config.js` and `.storybook/main.ts` suppresses the remaining `@import` deprecations from our own partials, and `quietDeps: true` suppresses Bootstrap's internal deprecations.

## Instruction files

Additional per-concern guidance lives in `.github/instructions/`:

| Topic | File |
| --- | --- |
| Snapshot edit boundaries | `.github/instructions/snapshot-boundaries.instructions.md` |
| Yup extension import guard | `.github/instructions/yup-extension-guard.instructions.md` |
| Route security review | `.github/instructions/Route-security-review.instructions.md` |
| Policy-sensitive files | `.github/instructions/config-policy.instructions.md` |
| JS/TS change discipline | `.github/instructions/code-change-discipline.instructions.md` |
| Generated/tracked boundaries | `.github/instructions/generated-and-tracked-boundaries.instructions.md` |
