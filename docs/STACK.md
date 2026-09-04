# Technology Stack

**Last reviewed:** 2026-09-01
**Reviewed against:** branch `fix/dependency-vulnerability-remediation`, working tree at commit `03f5171`
**Method:** every version below was resolved from the installed tree (`node_modules/<pkg>/package.json`), not from the `package.json` range. Every "used by" count is a real import-site count over `ClientApp/src`, excluding the vendored `src/parent/**` and `src/external/**` trees.

---

## 1) Project Identity

| Field | Value |
| --- | --- |
| **Name** | `nmi-portal` — NMI Customer Portal (`portal.measurement.gov.au`) |
| **Type** | `web-app` — browser SPA, no SSR |
| **Status** | `active-development` on a `legacy` base |
| **Owner** | Australian Government National Measurement Institute (NMI) |
| **Repository** | `https://github.com/gmtestandreview/portalsample.git` |

**On "Status":** this workspace is a **source-map capture snapshot** of the production portal, reconstructed from published source maps and now under active remediation ahead of a platform migration. It is not greenfield and it is not idle maintenance — there is an open migration programme with a governed backlog (§12). Treat the code as **upstream-authoritative**: defects found here are defects in production, not artefacts of the snapshot.

---

## 2) Primary Programming Languages

- [x] **TypeScript / JavaScript** — the entire application. 471 `.tsx` + 387 `.ts` tracked files; `tsconfig.json` sets `"strict": true`, `target: ES2022`, `jsx: react-jsx`.
- [x] **Python** — **tooling only, zero application code.** 12 files, all under `.github/skills/**` (diagram generators, codebase-knowledge scanners, `quality_gate.py`) plus `analysis/extract_topology.py`. Not built, not shipped, not covered by CI.
- [x] **Other: SCSS** — 29 files under `ClientApp/src/styles/**` (Bootstrap 5 + custom NMI theme).
- [x] **Other: PowerShell** — 5 files; `scripts/Run-MigrationChecks.ps1` plus `.github/migration-verifier/**` fixtures.
- [x] **Other: Gherkin** — 33 `.feature` files driving the Playwright BDD suites.
- [ ] Go
- [ ] Rust
- [ ] Kotlin / Java (Android)
- [ ] Swift (iOS / macOS)
- [ ] Dart (Flutter)

> **Agent-pruning note:** only TypeScript/JavaScript agents are needed for application work. Python agents are relevant *only* to `.github/skills/**` and `analysis/`; PowerShell agents only to the migration-verifier harness. Do not prune SCSS or Gherkin capability — both are load-bearing.

---

## 3) Tech Stack

| Layer | Value |
| --- | --- |
| **Frontend** | React 18.3.1 SPA (`createRoot`), React Router 7.18.2 (`createBrowserRouter`) |
| **Backend** | **none in this repository.** The SPA calls a co-hosted ASP.NET API at same-origin relative paths (`/api/...`); the client is NSwag-generated into `ClientApp/src/api/web-api-client.ts` with an empty `baseUrl`. The backend lives in a separate repository and team. |
| **Database** | **none.** No DB driver, ORM, migration tool, or connection string exists in this repo. Client-side persistence is `sessionStorage` only (`ClientApp/src/storage/**`). |
| **Runtime** | Node.js **>= 24.0.0** (`engines` + `devEngines.runtime` with `onFail: "error"`); local dev pinned to **24.20.0** via `.node-version` |
| **Package manager** | npm **11.17.0** (`packageManager` field; CI invokes `npx npm@11.17.0 ci` explicitly so the lockfile is resolved by the declared npm, not the runner's bundled one) |
| **CI/CD** | **GitHub Actions** — `pr.yml`, `release.yml`, `chromatic.yml`. Plus **SonarCloud** (EU) and **Chromatic** as external gates. |

---

## 4) Communication & Collaboration Tools

- [x] **GitHub Issues / PRs** — code review and the CI gate. `pr.yml` gates `pull_request` into `main`; `release.yml` gates `push` to `main`.
- [x] **Notion** — declared in use by the project owner (2026-09-01). In-repo traces appear in `.github/agents/` and `.github/skills/roundup-setup/`, but no credential, database ID or sync config is committed, so the integration surface is not derivable from this repository.
- [ ] Gmail / email
- [ ] Slack
- [ ] Linear

**External SaaS in the pipeline** (not communication tools, but they post status back to PRs):

| Service | Role | Secret |
| --- | --- | --- |
| SonarCloud (EU) | Static analysis + quality gate; `sonar.qualitygate.wait=true` makes a red gate fail the job | `SONAR_TOKEN` |
| Chromatic | Storybook publishing + visual baselines | `CHROMATIC_PROJECT_TOKEN` |

> **Agent-pruning note:** prune Slack, Linear, and email agents. Keep GitHub and Notion agents.

---

## 5) Scope Boundaries

| Question | Answer | Evidence |
| --- | --- | --- |
| **Will this project have E2E tests?** | **yes — already present.** 33 Gherkin features across two Playwright projects (`app-bdd`, `storybook-bdd`), run in CI by the `e2e-node24` job. | `tests/e2e/features/**`, `playwright.config.ts`, `playwright.storybook.config.ts` |
| **Will this project use a PostgreSQL database?** | **no.** No database of any kind in this repo. | §3 |
| **Will this project handle authentication or user data?** | **yes — both, and it is the central risk.** Azure AD B2C via MSAL (OAuth2 + PKCE). Handles ABNs, business names, contact details, instrument records, and quotation data for Australian businesses. | `ClientApp/src/authentication/**` |
| **Is there a multi-channel communication workflow?** | **no.** Single channel: browser to same-origin API. | §3 |
| **Are there autonomous agent loops running unattended?** | **no.** All agent work is human-initiated. Agent tooling is present (`.claude/`, `.codex/`, `.agents/`, `a-team/`) but nothing runs on a schedule. | no cron/routine definitions in repo |
| **Will there be regular documentation / codemaps?** | **yes — heavily.** 959 tracked `.md` files. Governed artefacts: Master Change Record, Open Items Backlog, ADRs, `analysis/ARCHITECTURE.mmd`, code tours (`.tours/`), Storybook autodocs. | `docs/**`, `analysis/**` |
| **Does this project make LLM API calls?** | **no — not in shipped code.** No LLM SDK is a dependency. LLM usage is entirely in the *development* loop (agent CLIs, Storybook MCP server on `localhost:6006/mcp`, `@react-aria/mcp`). Nothing reaches an LLM at runtime. | `package.json` dependencies |
| **Does this project use Terraform / Docker / Kubernetes?** | **no.** No Dockerfile, compose file, `.tf`, Helm chart, or manifest is tracked. Deployment is handled outside this repo by the ASP.NET host. | `git ls-files` sweep |
| **Does this project have a production environment?** | **yes.** `portal.measurement.gov.au` is a live Australian Government service. `REACT_APP_ENVIRONMENT` distinguishes `development` from everything else. | `ClientApp/src/env.ts` |
| **Are there performance targets or SLAs?** | **no — none declared.** No performance budget, Lighthouse gate, Core Web Vitals threshold, or SLA appears anywhere in the repo. **This is a gap, not a decision** — a government service of this profile would normally carry one. Raise with the service owner. | grep sweep of `docs/**` |

---

## 6) Compliance Scope

**Declared in-repo:**

- [x] **WCAG 2.2 AA** — the one compliance regime this repository actually documents and gates. `docs/accessibility/wcag-2.2-aa-98-plan.md` sets a weighted target of **>= 98/100** with hard score caps (keyboard trap caps at 59; modal without focus trap caps at 79; no CI regression gate caps at 96). Enforced in CI by `@storybook/addon-a11y` and the Storybook interaction suite. Note that `docs/design-platform/DESIGN-PLATFORM-INPUTS.md` still says WCAG **2.1** AA — that inconsistency should be reconciled to 2.2.

**Not declared:**

- [ ] GDPR / RGPD — no EU user base identified
- [ ] COPPA — not directed at children
- [ ] PCI-DSS — no card data; no payment flow in this SPA
- [ ] SOC2 — not B2B SaaS
- [ ] HIPAA — not US healthcare

> **Flagged for the service owner — do not treat "not declared" as "does not apply."** This is an Australian Government service collecting business and personal contact data. The **Privacy Act 1988** and the **Australian Privacy Principles**, and the DTA **Digital Service Standard**, would ordinarily be in scope — but **neither is mentioned anywhere in this repository**, so this document cannot declare them. Confirm the real obligations with the NMI service owner and record the answer here. The `compliance-reviewer` agent should currently activate for **WCAG only**.

---

## 7) Team & Workflow

| Field | Value | Evidence |
| --- | --- | --- |
| **Number of developers** | **1** (agent-assisted). All 133 commits carry the author `GitHub Copilot`. | `git log --format='%an'` |
| **Branching model** | **feature-branches** to PR to `main`. Live branches: `main`, `fix/dependency-vulnerability-remediation`, `refactor/storybook-autodocs`. | `git branch -a` |
| **Review process** | **automated-only**, and unusually strict for a solo repo — 8 required CI statuses (§16) plus a blocking SonarCloud quality gate. There is no human peer reviewer. | `.github/workflows/pr.yml` |

**Implication for agents:** with no second human in the loop, CI *is* the reviewer. Never weaken a gate to make a build pass; a green build obtained by relaxing a threshold is a silent regression with nobody left to catch it.

---

## 8) Quality Standards

| Standard | Setting | Reality |
| --- | --- | --- |
| **Minimum test coverage** | **100%** statements / branches / functions / lines, configured in `vitest.unit.config.ts` | **Not currently met.** `COVERAGE-GATE-001` is an open Priority-1 backlog item; the last recorded measurement (2026-06-28) was 74.43% statements / 75.51% branches / 72.56% functions / 74.92% lines. The 100% figure is the *target*, enforced by config; the gap is tracked, not hidden. |
| **Linting enforced** | **yes** — blocking | `npm run lint` (ESLint 10.9.0, flat config `eslint.config.mjs`) runs in `static-quality-node24`, `lower-bound-node24`, and `release.yml`. MDX linted separately via `npm run lint:mdx` (remark). |
| **Type checking enforced** | **yes** — blocking | `npm run type-check` (`tsc --noEmit`, `strict: true`) in the same three jobs. |

**Test surfaces:**

| Surface | Files | Runner | Config |
| --- | --- | --- | --- |
| Unit | 163 test files | Vitest 4.1.11 + jsdom, `pool: 'forks'`, `maxWorkers: 1` | `vitest.unit.config.ts` |
| Storybook interaction | 132 story files | Vitest **Browser Mode** driving real Chromium via Playwright | `vitest.storybook.config.ts` |
| Quality regression | 8 checks | Vitest + jsdom | `quality/vitest.regression.config.ts` |
| E2E / BDD | 33 `.feature` files | Playwright 1.61.1 + playwright-bdd 9.2.0 | `playwright.config.ts`, `playwright.storybook.config.ts` |

> **Why `maxWorkers: 1` everywhere:** the unit suite runs single-worker under `--max-old-space-size=8192`, and the Storybook suite runs a single orchestrator so broad MCP-triggered runs cannot exhaust the shared browser. Raising worker counts to speed up CI will destabilise both — the constraint is deliberate.

---

## 9) Special Constraints

These are the guardrails an orchestrator must enforce across every agent. Each is load-bearing and each has bitten this codebase before.

1. **Never edit generated or vendored files.** `ClientApp/src/api/web-api-client.ts`, `ClientApp/src/main.*.js`, `ClientApp/css/main.*.css`, `ClientApp/src/external/**`, `ClientApp/src/parent/**`, `ClientApp/webpack/**`, `ClientApp/source-map-http-downloads/**`. Mirrored in `sonar.exclusions` and the Vitest coverage `exclude` list so all three tools agree.
2. **Never use `process.env` in application code.** Runtime config is injected into `window.*` by a server-side template before the bundle loads. Read it only through the `env` object in `ClientApp/src/env.ts`. `process.env.X` is `undefined` in the browser and fails silently.
3. **Prefer `globalThis` over `window`** in handwritten app code, tests, and mocks — this avoids SonarLint `typescript:S7764` and keeps shared runtime access working across browser-like test environments. Use `window` only where browser-specific typing or the runtime config contract requires it.
4. **Any schema calling a custom Yup string method must import the side-effect module** — `import '../../validationSchemas/yupExtensions';`. 19 custom methods are registered this way (`.allowedFormat()`, `.businessName()`, `.phone()`, `.postcode()`, and so on). Omitting the import produces a **runtime** `schema.method is not a function` with **no build-time error**.
5. **All new SCSS uses `@use` / `@forward`, never `@import`.** The single permitted `@import` of Bootstrap is isolated in `ClientApp/src/styles/_bootstrap-import.scss`. All Sass division uses `math.div()`, and any file using it must declare `@use 'sass:math';` first. Full module migration is blocked until Bootstrap 6 by `_variables.scss:68`'s call to Bootstrap's internal `negativify-map()`.
6. **Never suppress React `act(...)` warnings** in Storybook stories or setup. Treat them as ownership signals: derive state synchronously from props/context, or explicitly await the user-visible settled state with `canvas.findBy...` / `waitFor`. Do not put purely derived visibility behind `useEffect` + `setState`.
7. **Wrap protected routes in `<AuthenticatedElement>`**, and read auth state through the hooks in `ClientApp/src/authentication/hooks.tsx` — never by importing `AccountContext` directly.
8. **Use `<UnsavedFormPrompt>` for unsaved-change detection.** Do not re-implement navigation guards.
9. **Dependency versions for lint, Vitest, and Storybook are pinned exactly, on purpose.** Do not let `syncpack` rewrite them to `^` ranges — its default behaviour silently breaks the `dependencySecurity` policy test.
10. **Verify Storybook component properties through MCP before use.** Never assume a prop exists from naming convention; query `get-documentation` first. A story name is not evidence of a prop name.

---

## 10) CLI Environment

**Multiple CLIs are configured simultaneously.**

- [x] **Claude Code** — `.claude/settings.json`, `.claude/settings.local.json`, `.claude/skills/`
- [x] **Codex CLI** — `.codex/config.toml` (registers `my-storybook-mcp-server` at `http://localhost:6006/mcp` and `@react-aria/mcp`)
- [ ] Cursor
- [ ] OpenCode
- [x] **Multiple CLIs simultaneously**

**Additional agent infrastructure in-tree:** `.agents/plugins`, `.agents/skills`, `.superpowers/`, `.remember/`, `.testagent/`, `a-team/` (hooks, skills, templates, tests), `.github/skills/**` (12 Python-backed skills), `.tours/` (code tours).

**MCP servers this project expects:**

| Server | Endpoint | Required for |
| --- | --- | --- |
| `my-storybook-mcp-server` | `http://localhost:6006/mcp` | **Mandatory** before any UI/component work. Start `npm run storybook` and confirm the endpoint is healthy first; if the client started before Storybook was ready, restart the client — do not bypass. |
| `sonarqube` | via `sonar run mcp` | Issue, quality-gate, and coverage queries; auto-discovers the project from `sonar-project.properties` |
| `react-aria` | `npx @react-aria/mcp@latest` | React Aria Components guidance |

> **Known environment traps** (both have cost real time here): two `sonar` CLIs can collide on `PATH` (`sonarqube-cli` vs npm `@sonar/scan`), and hooks calling bare `sonar` fail open to the wrong binary until VS Code is *fully* relaunched. And `claudeCode.environmentVariables` in VS Code `settings.json` holds a frozen `PATH` snapshot that overrides the registry — check it first when a `PATH` change refuses to stick.

---

## 11) Daily Workflow Mode

- [x] **On-demand dispatch** (ad hoc per feature/bug) — the primary mode
- [x] **CI/CD triggered** — `pr.yml` on every PR to `main`; `release.yml` on every push to `main`; `chromatic.yml` on every push
- [ ] Daily standup mode

---

## 12) Existing Backlog

**There is no `TASKS.md`** — and one should not be created. This project already has a governed backlog with a formal intake process; a second list would fragment it.

| Artefact | Path | Role |
| --- | --- | --- |
| **Open Items Backlog** | `docs/change-record/OPEN-ITEMS-BACKLOG.md` | Authoritative prioritised list. P1 = production security, auth, data isolation, runtime config, CI, or rollback blockers. P2 = blocks a migration batch. P3 = accepted post-migration debt. |
| **Master Change Record** | `docs/change-record/MASTER-CHANGE-RECORD.md` | Every change carries a `CRD-*` ID cross-linked from the backlog |
| **ADRs** | `docs/adr/` | Architecture decisions |
| **Migration runbook** | `docs/migration/MIGRATION-RUNBOOK.md`, `docs/migration/PRE-FLIGHT-CHECKLIST.md` | Migration execution gates |
| **Security** | `docs/sec/` | SEC-010 IDOR (CWE-639) — **CLOSED / PASS 2026-06-04** |

**Intake rule:** any unresolved finding gets a backlog item *immediately* — never left only in commit messages, meeting notes, or issue comments. Items reach Resolved only when closure evidence is recorded.

**Currently open P1:** `COVERAGE-GATE-001` (see §8).

---

## 13) Runtime Summary

| Area | Value | Evidence |
| --- | --- | --- |
| Primary language | TypeScript, `strict: true` | `tsconfig.json`; `ClientApp/src/**/*.{ts,tsx}` |
| Rendering target | Browser SPA, no SSR | `ClientApp/src/index.tsx` — `createRoot` |
| Package manager | npm 11.17.0 | `packageManager` field + `package-lock.json` |
| Module/build system | **Dual:** Webpack 5 (production) + Vite 8 (Storybook and test tooling) | `webpack.config.js`; `@storybook/react-vite` |
| React version | 18.3.1 | `node_modules/react/package.json` |
| Node.js | >= 24.0.0 required; 24.20.0 pinned locally | `engines`, `devEngines.runtime` (`onFail: error`), `.node-version` |
| CSP | Trusted Types policy + DOMPurify | `ClientApp/src/trustedtypes.ts` |

---

## 14) Production Dependencies

Versions are **as installed**. "Used by" is the count of files under `ClientApp/src` importing the package, excluding vendored trees.

| Dependency | Installed | Used by | Role |
| --- | --- | ---: | --- |
| `react` | 18.3.1 | — | UI rendering (`createRoot`) |
| `react-dom` | 18.3.1 | — | DOM reconciler |
| `react-router` | **7.18.2** | — | Client-side routing; **41 registered routes** in `App.tsx` |
| `react-aria-components` | **1.19.0** | **67** | Accessible UI primitives — the largest UI dependency by import count, and central to the WCAG 2.2 AA programme |
| `formik` | 2.4.9 | 63 | Form state across all multi-step wizards |
| `yup` | 1.7.1 | 13 | Schema validation; extended with 19 custom string methods |
| `@azure/msal-browser` | 3.30.0 | — | Azure AD B2C OAuth2 + PKCE |
| `@azure/msal-react` | 2.2.0 | — | React bindings (`MsalProvider`, hooks) |
| `bootstrap` | 5.3.8 | — | CSS framework (custom NMI theme) |
| `react-bootstrap` | 2.10.10 | — | Bootstrap React bindings |
| `lodash` | 4.18.1 | 12 | Object/array utilities |
| `date-fns` | 3.6.0 | 6 | Date parsing and formatting |
| `react-number-format` | 5.4.5 | 4 | ABN / number pattern display |
| `dompurify` | **3.4.14** | 3 | HTML sanitisation behind the Trusted Types policy |
| `html-react-parser` | 6.1.3 | 2 | Server-supplied HTML to React elements |
| `react-ga4` | 2.1.0 | 2 | Google Analytics 4 |
| `slate` | 0.124.1 | 1 | Rich-text model (`SlateEditor`) |
| `slate-react` | 0.124.2 | 1 | Slate React bindings |
| `react-datepicker` | 7.6.0 | 1 | Date picker (timezone-sensitive — see §16) |
| `react-error-boundary` | 4.1.2 | 1 | Error boundary |
| `@popperjs/core` | 2.11.8 | 1 | Positioning |
| `@microsoft/applicationinsights-web` | 3.4.2 | — | Azure App Insights telemetry |
| `@microsoft/applicationinsights-react-js` | 3.4.3 | — | App Insights React plugin |
| `@react-aria/optimize-locales-plugin` | 2.0.0 | — | Build-time locale trimming |

**Corrections applied in this revision — previously documented, now verified false:**

- **`luxon` is not a dependency of this application.** It is absent from `package.json` `dependencies`; its only presence in the tree is inside the vendored `ClientApp/src/parent/node_modules/`, which is excluded from the build, from coverage, and from Sonar analysis. `@types/luxon` remains a devDependency but types no first-party code. Date handling is `date-fns` only. *(The prior revision listed luxon as a production dependency used by `ClientApp/src/utils/index.ts`; it is not imported there or anywhere else in first-party source.)*
- **`react-aria-components` was entirely absent** from the previous revision despite 67 import sites.
- Version drift corrected: `react-router` 7.18.0 to **7.18.2**; `dompurify` 3.4.11 to **3.4.14**.

---

## 15) Development Toolchain

| Tool | Installed | Purpose |
| --- | --- | --- |
| TypeScript | **5.9.3** | Type checking (`tsc --noEmit`), `strict: true` |
| ESLint | **10.9.0** | Flat config `eslint.config.mjs`; with `typescript-eslint` 8.67.0, `@eslint-react/eslint-plugin` 5.18.6, `eslint-plugin-react-hooks` 7.1.1, `@stylistic/eslint-plugin` 5.10.0, `eslint-plugin-storybook` |
| remark | 12.0.1 (CLI) | MDX/Markdown linting — `npm run lint:mdx --frail` |
| Webpack | **5.108.4** | Production bundling + dev server |
| Vite | **8.1.3** | Storybook and Vitest Browser Mode pipeline |
| Sass | **1.101.0** | SCSS compilation |
| Vitest | **4.1.11** | All three test surfaces; `@vitest/browser`, `@vitest/browser-playwright`, `@vitest/coverage-v8` all at matched 4.1.11 |
| jsdom | 29.1.1 | Unit-test DOM environment |
| Testing Library | react 16.3.2 / jest-dom 6.9.1 / user-event 14.6.1 | Component testing |
| Playwright | **1.61.1** | E2E + Storybook Browser Mode |
| playwright-bdd | 9.2.0 | Gherkin to Playwright generation (`bddgen`) |
| Storybook | **10.5.10** | Component sandbox + autodocs; `@storybook/react-vite` |
| Storybook addons | 10.5.10 | `addon-a11y`, `addon-docs`, `addon-links`, `addon-vitest`, `addon-mcp` 0.7.0, `@chromatic-com/storybook` 5.3.0 |
| MSW | 2.14.6 | API mocking (`msw-storybook-addon` 3.0.0; worker in `ClientApp/public`) |
| Chromatic | 18.5.0 | Visual regression baselines |
| syncpack | 15.3.2 | Dependency-range consistency — **see constraint 9 in §9** |
| patch-package | 8.0.0 | Applies `patches/` on `postinstall` |
| mockdate | 3.0.5 | Deterministic clock in tests |
| SonarCloud scanner | `@sonar/scan@4.3.6` (pinned) | Static analysis |

**Storybook config highlights** (`.storybook/main.ts`): `changeDetection`, `componentsManifest`, and `experimentalReview` features enabled; `react-docgen-typescript` with `shouldExtractLiteralValuesFromEnum`; `remark-gfm` for MDX.

### Dual-build rationale and verification scope

Two pipelines are intentionally live: **Webpack 5** for production bundles, **Vite-backed Storybook/Vitest** for fast local feedback. This is a transitional choice while the portal remains on its legacy production packaging path.

When validating UI changes, treat these divergence points as mandatory checks:

- CSS/SCSS loader behaviour differences
- module resolution and alias differences (the `@` to `ClientApp/src` alias is defined per-config, not globally)
- static asset base-path differences
- code-splitting and lazy-chunk loading behaviour

A change that is green in Storybook is **not** thereby green in the production bundle. See `docs/architecture/storybook-vs-webpack-runtime.md` for the full divergence matrix.

---

## 16) CI/CD Pipeline

### `pr.yml` — on `pull_request` into `main`

Eight independently-reporting statuses. `fail-fast: false` on every matrix, so one red leg never hides another.

| Job | What it proves |
| --- | --- |
| `static-quality-node24` | type-check + lint + lint:mdx |
| `vitest` x 3 (`unit`, `storybook`, `quality`) | Each test environment is its own required status. The `storybook` leg provisions Chromium. |
| `build-node24` | Production Webpack build + `storybook:verify:docs` |
| `date-timezone` x 3 (`UTC`, `Australia/Sydney`, `America/Los_Angeles`) | The date suite is timezone-sensitive by construction; each zone is a separate leg so a failure stays attributable |
| `e2e-node24` | Both BDD suites; each Playwright project starts its own server (app on `:3000`, Storybook on `:6006`) and mocks API + MSAL, so no backend is needed |
| `lower-bound-node24` | Installs on the **exact declared floor** (Node 24.0.0, `--strict-peer-deps`) and runs the dependency-security policy tests. Proves the floor itself works, not merely "some Node 24". |
| `sonarcloud` | `needs: vitest` — consumes that job's coverage artifact rather than re-running the suite. `fetch-depth: 0` so SCM blame drives new-code attribution. `sonar.qualitygate.wait=true` makes a red gate block the merge. |

**Two recurring CI mechanics worth knowing before you touch these files:**

- Every job repeats a **`@rolldown/binding-linux-x64-gnu` verification step**. npm's own satisfaction check does not detect a missing optional native binding (npm/cli#4828), so each job probes with `require.resolve` and force-reinstalls the locked version if absent.
- `defaults.run.shell: bash` is set deliberately. GitHub's implicit runner shell is `bash -e` **without** `pipefail`, so any step piping into `tee` would report `tee`'s exit code instead of the real command's. Naming bash explicitly restores `pipefail`. Do not remove it — every evidence-capturing step depends on it.

All jobs upload evidence artifacts with `if: always()` and `if-no-files-found: error`, retained 14 days.

### `release.yml` — on `push` to `main`

Runs the same partitioned commands as the PR workflow, deliberately: a release cannot pass through a coarser gate than the pull request that produced it.

### `chromatic.yml` — on every `push`

Publishes Storybook to Chromatic with `fetch-depth: 0` (baseline selection) and `exitOnceUploaded: true`.

---

## 17) Key Commands

```bash
npm install                     # install deps (runs patch-package on postinstall)

# Build & serve
npm run build                   # Webpack production build
npm run start                   # Webpack dev server
npm run storybook               # Storybook dev server on :6006 (required for MCP)
npm run build-storybook         # static Storybook build
npm run storybook:verify:docs   # docs build + verification script

# Static quality
npm run type-check              # tsc --noEmit
npm run lint                    # ESLint over src, .storybook, tests, configs
npm run lint:fix                # ESLint --fix
npm run lint:mdx                # remark over MDX (--frail)

# Tests
npm run test:unit               # Vitest unit suite (jsdom)
npm run test:unit:coverage      # + coverage (text, html, json-summary, json, lcov)
npm run test:storybook          # story play functions in real Chromium
npm run test:quality:regression # 8 quality regression checks
npm run test:all                # all Vitest projects
npm run test:e2e                # app-bdd + storybook-bdd
npm run test:e2e:app            # application workflows only
npm run test:e2e:storybook      # Storybook BDD only
npm run test:e2e:ui             # Playwright UI mode
npm run test:e2e:report         # open the last Playwright report

# Gates
npm run test:ci                 # type-check + unit + storybook + quality (CI-equivalent)
npm run migration-check         # type-check + all Vitest suites + Storybook build
```

> **Always pass `--reporter=default`** when piping a Vitest run. Without it, a piped run emits no console warnings and a broken suite can look clean.

---

## 18) Environment and Config

Config is injected at runtime by a server-side template into `globalThis` **before** the React bundle loads.

**Never use `process.env`** — those values are `undefined` in the browser bundle.

```ts
import { env } from '../env';
env.REACT_APP_B2C_CLIENTID          // correct
process.env.REACT_APP_B2C_CLIENTID  // WRONG — undefined at runtime
```

### Runtime variables

| Variable | Purpose | Required |
| --- | --- | --- |
| `REACT_APP_B2C_CLIENTID` | Azure AD B2C application (client) ID | yes |
| `REACT_APP_B2C_AUTHORITY` | B2C authority URL (user-flow endpoint) | yes |
| `REACT_APP_B2C_KNOWN_AUTHORITIES` | Known authority domain for token validation | yes |
| `REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL` | Redirect URI after sign-out | yes |
| `REACT_APP_B2C_READ_SCOPE` | API read scope | yes |
| `REACT_APP_B2C_USER_IMPERSONATION_SCOPE` | API impersonation scope | yes |
| `REACT_APP_B2C_REDIRECT_URL` | Post-login redirect URI | yes |
| `EXTERNAL_REDIRECT_URL` | External portal URL | yes — **host-validated** |
| `REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY` | App Insights key (legacy) | yes outside development |
| `REACT_APP_APPINSIGHTS_CONN_STRING` | App Insights connection string (preferred) | yes |
| `REACT_APP_GA_TRACKINGID` | Google Analytics tracking ID | yes outside development |
| `REACT_APP_ENVIRONMENT` | Environment discriminator (`development` relaxes telemetry checks) | — |

**Two behaviours in `env.ts` worth knowing:**

- `EXTERNAL_REDIRECT_URL` is validated against an allow-list (`measurement.gov.au` and its subdomains, or `localhost`) and **throws at module load** if it fails. This is an open-redirect guard, not a convenience check — do not widen the list casually.
- Telemetry variables are optional **only** when `REACT_APP_ENVIRONMENT === 'development'`. Local dev and Storybook have no instrumentation backend, so an absent key there is deliberate configuration; everywhere else a missing key is still reported.

**Historical note:** the `REACT_APP_AUTH_BYPASS` development auth bypass and its five mock variables were **removed** on 2026-05-29 along with `devAuth.ts`. There is no auth bypass path. Do not reintroduce one.

---

## 19) Evidence

| Claim | Source |
| --- | --- |
| React 18 entry point | `ClientApp/src/index.tsx` |
| 41 registered routes | `ClientApp/src/App.tsx` |
| Runtime config contract | `ClientApp/src/env.ts` |
| MSAL / Azure AD B2C config | `ClientApp/src/authentication/authConfig.ts` |
| Trusted Types + DOMPurify | `ClientApp/src/trustedtypes.ts` |
| App Insights singleton | `ClientApp/src/instrumentation/AppInsightsService.ts` |
| Custom Yup string methods (19) | `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` |
| Scripts, dependency ranges, Node engine | `package.json` |
| Installed versions | `node_modules/<pkg>/package.json` |
| Coverage config + 100% thresholds | `vitest.unit.config.ts` |
| Storybook Browser Mode config | `vitest.storybook.config.ts` |
| Storybook framework + addons | `.storybook/main.ts` |
| CI gates | `.github/workflows/pr.yml`, `release.yml`, `chromatic.yml` |
| Sonar scope, exclusions, coverage path | `sonar-project.properties` |
| Backlog, change record | `docs/change-record/OPEN-ITEMS-BACKLOG.md`, `docs/change-record/MASTER-CHANGE-RECORD.md` |
| WCAG target and score caps | `docs/accessibility/wcag-2.2-aa-98-plan.md` |
| Build/runtime divergence matrix | `docs/architecture/storybook-vs-webpack-runtime.md` |
| Related documents | `docs/ARCHITECTURE.md`, `docs/STRUCTURE.md`, `docs/TESTING.md`, `docs/CONVENTIONS.md`, `docs/INTEGRATIONS.md`, `docs/CONCERNS.md` |
