# AGENTS

## Purpose

This workspace is a **source-map capture snapshot** of portal.measurement.gov.au — the Australian Government National Measurement Institute (NMI) customer portal. The repository **does** include a root `package.json` with validation and test scripts. You may run `npm`, `pnpm`, or `yarn` commands from the workspace root for validation, type-checking, linting, and tests.

**Validation scripts:**

The following scripts are available in the root `package.json`:

- `npm run type-check` — TypeScript type checking (tsc --noEmit)
- `npm run lint` — Lint all JS/TS files
- `npm run lint:fix` — Lint with automatic safe fixes
- `npm run test:unit` — Run unit tests (Vitest)
- `npm run test:unit:coverage` — Unit test coverage
- `npm run test:unit:watch` — Unit tests in watch mode
- `npm run test:storybook` — Run Storybook interaction tests (Vitest)
- `npm run test:all` — Run all Vitest suites
- `npm run test:quality:regression` — Run regression quality tests
- `npm run test:ci` — Full CI gate: type-check + tests with coverage + regression
- `npm run test:e2e` — Run Playwright E2E tests (app + storybook BDD)
- `npm run test:e2e:app` — App BDD tests only
- `npm run test:e2e:storybook` — Storybook BDD tests only
- `npm run storybook` — Run Storybook dev server (port 6006)
- `npm run build-storybook` — Build static Storybook
- `npm run migration-check` — Full pre-migration gate (type-check + tests + storybook build)

See `package.json` for the full list.

## Technology Stack

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
| Bundler | Webpack (bundled artifacts only; config not present in snapshot) |
| CSP | Trusted Types policy via `trustedtypes.ts` + DOMPurify |

## Repository Shape

```text
ClientApp/src/                       ← primary editable app source (TypeScript/TSX)
ClientApp/src/styles/                ← editable SCSS partials
ClientApp/src/api/web-api-client.ts  ← generated NSwag/OpenAPI API client, do not edit
ClientApp/source-map-http-downloads/ ← third-party source mirrors, do not edit
ClientApp/src/external/              ← vendor copies, do not edit
ClientApp/webpack/                   ← webpack runtime bootstrap, do not edit
ClientApp/media/                     ← captured media assets
```

## Architecture Pointers

| Concern | Path |
| --- | --- |
| App bootstrap | `ClientApp/src/index.tsx` |
| Router | `ClientApp/src/App.tsx` |
| Route modules | `ClientApp/src/routes/**` |
| Reusable UI | `ClientApp/src/components/**` |
| Auth config (MSAL) | `ClientApp/src/authentication/authConfig.ts` |
| Auth context / hooks | `ClientApp/src/authentication/accountContext.tsx`, `ClientApp/src/authentication/hooks.tsx` |
| Auth guard | `ClientApp/src/authentication/AuthenticatedElement.tsx` |
| Runtime env vars | `ClientApp/src/env.ts` (reads from `window.*` at runtime, not `process.env`) |
| API client | `ClientApp/src/api/web-api-client.ts` |
| Shared types | `ClientApp/src/types.ts` |
| Validation schemas | `ClientApp/src/validationSchemas/**` |
| Yup custom methods | `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` |
| App Insights | `ClientApp/src/instrumentation/AppInsightsService.ts` |
| Session storage | `ClientApp/src/storage/**` |
| Styles | `ClientApp/src/styles/**` |
| Utilities | `ClientApp/src/utils/index.ts` |

## Critical Patterns

### Environment Variables

Config is injected at runtime into `window.*` — **not** `process.env`. Always use the `env` object from `ClientApp/src/env.ts`:

```ts
import { env } from '../env';
env.REACT_APP_B2C_CLIENTID  // correct
process.env.REACT_APP_B2C_CLIENTID  // wrong — will be undefined at runtime
```

### Global Object Usage

Prefer `globalThis` over `window` in handwritten app code, tests, and mocks. This avoids SonarLint `typescript:S7764` findings and keeps shared runtime access working across browser-like test environments.

Use `window` only where browser-specific typing or the runtime config contract requires it, such as the `window.*` injection consumed by `ClientApp/src/env.ts`.

### Authentication Guard

Wrap protected routes with `<AuthenticatedElement>`. Routes with multi-step forms pass `displayHeaderAndFooter={false}` to suppress the main chrome:

```tsx
<AuthenticatedElement displayHeaderAndFooter={false}>
  <CreateAccount />
</AuthenticatedElement>
```

### Yup Validation — Custom String Methods

`ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` augments `Yup.StringSchema` with 19 project-specific methods: `.allowedFormat()`, `.nameAllowedFormat()`, `.businessName()`, `.maxLength()`, `.isRequired()`, `.minEntered()`, `.fixedDigits()`, `.phone()`, `.email()`, `.postcode()`, `.numbersOnly()`, `.decimalNumbersOnly()`, `.addressFormat()`, `.minValue()`, `.maxValue()`, `.noConsecutiveChars()`, `.atLeastOneChar()`, `.noConsecutivePuncuation()`, `.numberWithinRange()`.

**Always import the side-effect module** in any file that uses these methods:

```ts
import '../../validationSchemas/yupExtensions';
```

Failing to import it causes silent runtime errors where custom validators are undefined.

### Account Context

`AccountContext` (`ClientApp/src/authentication/accountContext.tsx`) holds the full authenticated user state. Access it via the hooks in `ClientApp/src/authentication/hooks.tsx`, not by importing the context directly.

### Forms

Forms use Formik. For unsaved-change detection use `<UnsavedFormPrompt>` (wraps `RouteLeavingGuard` using `useFormikContext`). Do not re-implement navigation guards.

### SCSS Module System

All new SCSS files must use `@use` / `@forward`, not `@import`. The `@import` rule is deprecated in Dart Sass and will be removed in Sass 3.

**Bootstrap shim**: `ClientApp/src/styles/_bootstrap-import.scss` isolates the Bootstrap `@import` to a single file. `index.scss` imports the shim (`@import './bootstrap-import'`) rather than Bootstrap directly. Do not add `@import 'bootstrap/scss/bootstrap'` anywhere else.

**Division**: All Sass division must use `math.div()`. Any file using `math.div()` must declare `@use 'sass:math';` as its first `@use` statement:

```scss
@use 'sass:math';
// ...
font-size: math.div($h1-font-size, 1.375);
```

**Module migration blocker**: `_variables.scss:68` calls `negativify-map()`, a Bootstrap 5 internal available only via the global `@import` cascade. Full `@use`-based migration is deferred until Bootstrap 6. Until then, `silenceDeprecations: ['import']` in `webpack.config.js` and `.storybook/main.ts` suppresses deprecation warnings from our own partials; `quietDeps: true` suppresses Bootstrap's internal deprecations.

## Storybook

When working on UI components, always use the `my-storybook-mcp-server` MCP tools to access Storybook's component and documentation knowledge before answering or taking any action.

### Storybook async/render hygiene

Do not suppress React `act(...)` warnings in Storybook stories or setup. Treat them as ownership signals. For Formik, lookup-driven, or route stories, make component state either synchronously derived from props/context or explicitly await the user-visible settled state in the story play function with `canvas.findBy...` or `waitFor`. Do not put purely derived visibility/state behind `useEffect` + `setState`; it creates post-render updates outside the Storybook test interaction boundary.

Before the first Storybook MCP call, ensure `npm run storybook` is running and `http://localhost:6006/mcp` responds successfully. Confirm `codex mcp list` shows `my-storybook-mcp-server` enabled and `codex mcp get my-storybook-mcp-server` reports the expected URL. If Codex started before Storybook was ready and the tools are absent, restart the Codex client or extension after the endpoint is healthy; do not bypass the MCP requirement.

- **CRITICAL: Never hallucinate component properties!** Before using ANY property on a component from a design system (including common-sounding ones like `shadow`, etc.), you MUST use the MCP tools to check if the property is actually documented for that component.
- Query `list-all-documentation` to get a list of all components
- Query `get-documentation` for that component to see all available properties and examples
- Only use properties that are explicitly documented or shown in example stories
- If a property isn't documented, do not assume properties based on naming conventions or common patterns from other libraries. Check back with the user in these cases.
- Use the `get-storybook-story-instructions` tool to fetch the latest instructions for creating or updating stories. This will ensure you follow current conventions and recommendations.
- Check your work by running `run-story-tests`.

Remember: A story name might not reflect the property name correctly, so always verify properties through documentation or example stories before using them.

## Edit Boundaries

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

## Validation Guidance

Validation is performed using the root `package.json` scripts. Use `npm`, `pnpm`, or `yarn` as appropriate. Validate changes by:

1. Static TypeScript type consistency (read related files, confirm types align).
2. Checking that Yup extension imports are present in any schema file that uses custom methods.
3. Verifying auth-guard usage is consistent with existing route patterns in `ClientApp/src/App.tsx`.
4. Reporting any limitation clearly if a command cannot be run.

### ESLint

Run ESLint from the repository root:

```bash
npm run lint
```

Apply safe automatic fixes:

```bash
npm run lint:fix
```

The lint gate covers handwritten React/TypeScript app source, Storybook/test files, and root config files. Generated NSwag API output, vendor mirrors, build output, and source-map capture directories are excluded.

## Skills

A Team skills live in `skills/**`. Each is mandatory when its trigger applies — `skills/using-a-team/SKILL.md` holds the enforced trigger tables. Invoke via the `Skill` tool.

| Skill | Use when |
| --- | --- |
| `adr` | Recording or revisiting a consequential, hard-to-reverse decision — datastore/stack choice, service or module boundary, data-ownership shift, integration pattern, major dependency, or superseding a past ADR. |
| `api-contract-first` | Before implementing or changing any externally consumed boundary — REST/OpenAPI, gRPC, GraphQL, webhooks, inter-service. Write and review the contract first. |
| `architecture-audit` | Before major work on an unfamiliar or inherited codebase, before a scaling milestone, or as a periodic health check. |
| `architecture-design` | Producing an architecture or technical design for a new feature, capability, or system from requirements. Follows `brainstorming`; prefers the simplest reversible design. |
| `architecture-review` | Assessing a design, RFC, proposal, or PR-level structural decision someone brings you, before it is built. |
| `brainstorming` | Before any creative work — new feature, component, or capability. Explore intent and design before code. |
| `dispatching-parallel-agents` | Two or more independent tasks with no shared state or sequential dependency. |
| `executing-plans` | You have a written implementation plan to execute in the current session. |
| `finishing-a-development-branch` | A branch is ready for pre-merge verification, cleanup, and pull-request preparation. |
| `five-whys` | A bug persists despite surface fixes, or a failure or process keeps recurring — target the root, not the symptom. |
| `incident-response` | Production is degraded or down — use immediately. |
| `managing-github-actions` | Reviewing, diagnosing, securing, or changing `.github/workflows/**` or `.github/actions/**`, or changing `packageManager` / `engines` / `devEngines` / `allowScripts` / root `postinstall`. |
| `mcp2cli` | Calling an MCP server, OpenAPI/REST API, or GraphQL API from a shell — especially useful here since Codex has no native MCP tool-calling — or generating a new skill from an API. |
| `performance-audit` | A performance regression is suspected, before and after optimisation, or as a pre-release gate for performance-critical features. |
| `qdrant-clients-sdk` | Vendored (skills.qdrant.tech). Integrating the Qdrant client SDK for the semantic-memory-layer tooling — install commands, REST vs gRPC, curated snippets. |
| `qdrant-deployment-options` | Vendored. Choosing a Qdrant deployment (local / Docker / Cloud / Hybrid / EDGE) for the semantic-memory layer; feeds an `adr`, does not replace one. |
| `qdrant-model-migration` | Vendored. Switching or A/B-testing the embedding model behind Qdrant — re-embedding, named vectors vs alias swap, dimension changes, zero downtime. |
| `qdrant-search-quality` | Vendored. Qdrant retrieval returns bad/irrelevant/missing results, or choosing embedding model / hybrid search / reranking / recall@k evaluation. Routes to `diagnosis` + `search-strategies` sub-skills. Reviewing a whole RAG pipeline for sign-off is the `rag-pipeline-reviewer` agent instead. |
| `receiving-code-review` | Evaluating incoming code-review feedback — verify before implementing, technical pushback over performative agreement. Pairs with the `code-reviewer` agent. |
| `scalability-review` | Asked whether a system or design will scale, will handle projected growth, or needs a capacity/headroom assessment for a traffic or data milestone. |
| `skill-duplication-audit` | Two or more skills appear to overlap in scope and need classification. |
| `smart-init` | `INIT.md` is missing and the project needs conversational onboarding. |
| `subagent-driven-development` | Executing a plan with independent tasks in the current session — fresh subagent per task, two-stage review. |
| `systematic-debugging` | Any bug, failing or flaky test, regression, crash, or incorrect output whose cause is not established. |
| `test-driven-development` | Implementing or changing observable behavior — new feature, bug fix, or refactor. RED before GREEN. |
| `using-a-team` | The meta-skill, injected at every session start — defines which skills and agents are mandatory. |
| `using-git-worktrees` | Before a feature, bug fix, or repository change that needs isolation from the current workspace. |
| `verification-before-completion` | Before claiming any objectively verifiable work succeeded — edits, fixes, tests, builds, generated artifacts. Evidence before assertions. |
| `writing-plans` | Turn a chosen or approved engineering direction into a repository-grounded implementation plan before coding. |
| `writing-skills` | Creating, editing, optimizing, testing, validating, or deploying a `SKILL.md`. |

## Instruction Files

| Topic | File |
| --- | --- |
| Markdown rules | [.github/instructions/markdown.instructions.md](.github/instructions/markdown.instructions.md) |
| Policy-sensitive files | [.github/instructions/config-policy.instructions.md](.github/instructions/config-policy.instructions.md) |
| App code conventions | [.github/instructions/app-code.instructions.md](.github/instructions/app-code.instructions.md) |
| JS/TS change discipline | [.github/instructions/code-change-discipline.instructions.md](.github/instructions/code-change-discipline.instructions.md) |
| Generated/tracked boundaries | [.github/instructions/generated-and-tracked-boundaries.instructions.md](.github/instructions/generated-and-tracked-boundaries.instructions.md) |
| Route security review | [.github/instructions/Route-security-review.instructions.md](.github/instructions/Route-security-review.instructions.md) |
| Snapshot edit boundaries | [.github/instructions/snapshot-boundaries.instructions.md](.github/instructions/snapshot-boundaries.instructions.md) |
| Yup extension import guard | [.github/instructions/yup-extension-guard.instructions.md](.github/instructions/yup-extension-guard.instructions.md) |
