# NMI Customer Portal

The Australian Government **National Measurement Institute** (NMI) customer portal — `portal.measurement.gov.au`.

This workspace is a source-map capture snapshot of the live deployment, extended with a full local development, testing, and Storybook toolchain.

## Tech Stack

| Layer | Technology |
| --- | --- |
| UI framework | React 18 (functional components, hooks) |
| Language | TypeScript 5 |
| Routing | React Router v7 |
| Auth | Azure AD B2C (`@azure/msal-browser` / `@azure/msal-react`) |
| Forms | Formik + Yup with custom string extensions |
| CSS | Bootstrap 5 (custom NMI theme) + SCSS |
| API client | Auto-generated NSwag/OpenAPI (`web-api-client.ts`) |
| Bundler | Webpack 5 |
| Unit tests | Vitest + React Testing Library |
| E2E tests | Playwright BDD (`playwright-bdd`) |
| Component catalogue | Storybook 10 |

## Prerequisites

- **Node.js** >= 24.0.0 (enforced by `engines` and `devEngines` in `package.json`)
- **npm** 11 (`npm@11.17.0` - declared as `packageManager`)

## Setup

```bash
npm install
```

Runtime configuration is injected via `window.*` variables at deploy time. For local development, provide the required values through your environment's host configuration — see [ClientApp/src/env.ts](ClientApp/src/env.ts) for the full list.

## Commands

### Development

```bash
npm start                   # Webpack dev server (port configured in webpack.config.js)
npm run storybook           # Storybook dev server on port 6006
```

### Validation

```bash
npm run type-check          # TypeScript — tsc --noEmit
npm run lint                # ESLint across src, tests, and config files
npm run lint:fix            # ESLint with automatic safe fixes
```

### Testing

```bash
npm run test:unit           # Unit tests (Vitest)
npm run test:unit:coverage  # Unit tests with coverage report
npm run test:unit:watch     # Unit tests in watch mode
npm run test:storybook      # Storybook interaction tests (Vitest)
npm run test:all            # All Vitest suites
npm run test:e2e            # Playwright BDD — app + Storybook
npm run test:e2e:app        # Playwright BDD — app only
npm run test:ci             # Full CI gate: type-check + coverage + regression
```

### Build

```bash
npm run build               # Production Webpack build
npm run build-storybook     # Static Storybook build
```

### Migration gate

```bash
npm run migration-check     # type-check + all tests + storybook build
```

## Project Structure

```text
ClientApp/src/
├── routes/             # Page-level route components
│   ├── dashboard/
│   ├── account/
│   ├── quotation/
│   ├── requestForQuote/
│   ├── acceptQuote/
│   ├── measurementReport/
│   ├── ta/                 # Pattern/type approval wizard and management routes
│   └── ...
├── components/         # Reusable UI components
├── authentication/     # MSAL auth config, context, hooks, guard
├── api/                # Auto-generated API client (do not edit)
├── validationSchemas/  # Yup schemas + custom string extensions
├── instrumentation/    # Azure Application Insights
├── storage/            # Session storage utilities
├── styles/             # SCSS partials (Bootstrap theme + NMI overrides)
└── utils/
docs/                   # Architecture, testing, and sprint documentation
tests/
├── unit/               # Vitest unit tests
└── e2e/                # Playwright BDD feature files and steps
quality/                # Regression quality suite
```

## Key Documentation

| Document | Location |
| --- | --- |
| Agent and AI assistant guidance | [AGENTS.md](AGENTS.md) |
| Claude Code guidance | [CLAUDE.md](CLAUDE.md) |
| Project brief | [PROJECT_BRIEF.md](PROJECT_BRIEF.md) |
| Architecture overview | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Tech stack detail | [docs/STACK.md](docs/STACK.md) |
| Testing guide | [docs/TESTING.md](docs/TESTING.md) |
| Storybook coverage matrix | [docs/STORYBOOK-COVERAGE-MATRIX.md](docs/STORYBOOK-COVERAGE-MATRIX.md) |
| Migration readiness | [docs/STORYBOOK-MIGRATION-READINESS.md](docs/STORYBOOK-MIGRATION-READINESS.md) |
| Code conventions | [docs/CONVENTIONS.md](docs/CONVENTIONS.md) |
| Component inventory | [ClientApp/src/components/ComponentInventory.docs.mdx](ClientApp/src/components/ComponentInventory.docs.mdx) |
| Route inventory | [ClientApp/src/routes/RouteInventory.docs.mdx](ClientApp/src/routes/RouteInventory.docs.mdx) |
| Migration runbook | [docs/migration/MIGRATION-RUNBOOK.md](docs/migration/MIGRATION-RUNBOOK.md) |
| Open migration items | [docs/change-record/OPEN-ITEMS-BACKLOG.md](docs/change-record/OPEN-ITEMS-BACKLOG.md) |
| Master change record | [docs/change-record/MASTER-CHANGE-RECORD.md](docs/change-record/MASTER-CHANGE-RECORD.md) |

## Edit Boundaries

**Edit freely:** `ClientApp/src/**/*.ts`, `ClientApp/src/**/*.tsx`, `ClientApp/src/styles/**/*.scss`

**Never edit (generated / vendor):** `ClientApp/src/api/web-api-client.ts`, `ClientApp/src/main.*.js`, `ClientApp/css/main.*.css`, `ClientApp/source-map-http-downloads/**`, `ClientApp/src/external/**`, `ClientApp/webpack/**`

See [CLAUDE.md](CLAUDE.md) for critical patterns (env vars, auth guard, Yup import guard, SCSS rules).
