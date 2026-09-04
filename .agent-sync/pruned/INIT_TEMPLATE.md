# Project Init Document

> **Filled in for this project on 2026-09-01.** Every answer below was verified against the codebase,
> not inferred. Counts are machine-derived; versions come from the installed tree
> (`node_modules/<pkg>/package.json`), not from `package.json` ranges.
>
> **To use with the orchestrator:** copy this file to the repository root as `INIT.md`, then run
> `/orchestrate init`. The Lead Orchestrator reads `INIT.md` at the project root — it does not read
> this file in place (`.claude/commands/orchestrate.md` → "`INIT.md` must exist"; the session-start
> hook checks the same path).
>
> **Note:** `a-team/` is a vendored third-party plugin (RBraga01/a-team v1.4.0, MIT). Edits here may
> be overwritten when the plugin updates; the root `INIT.md` copy is the durable one.

---

## Project Identity

**Name:** `nmi-portal` — NMI Customer Portal (`portal.measurement.gov.au`)
**Type:** web-app (browser SPA, no SSR)
**Status:** active-development on a legacy base

**Owner:** Australian Government National Measurement Institute (NMI)
**Repository:** `https://github.com/gmtestandreview/portalsample.git`

This workspace is a **source-map capture snapshot** of the production portal, reconstructed from
published source maps and under active remediation ahead of a platform migration. It is neither
greenfield nor idle maintenance.

**Treat the code as upstream-authoritative.** Defects found here are defects in production, not
artefacts of the snapshot. Do not discount a finding as "just a snapshot".

**Reference Documents:**
docs\ARCHITECTURE.md

---

## Primary Programming Languages

- [x] **TypeScript / JavaScript** — the entire application. 471 `.tsx` + 387 `.ts` tracked files.
      `tsconfig.json` sets `"strict": true`, `target: ES2022`, `jsx: react-jsx`.
- [x] **Python** — **tooling only, zero application code.** 12 files under `.github/skills/**`
      (diagram generators, codebase-knowledge scanners, `quality_gate.py`) plus
      `analysis/extract_topology.py`, and a further 10 in `a-team/scripts/` (vendored plugin tooling —
      metrics, watcher, session export, `pre_tool_use.py` hook). None is built, shipped, or covered
      by CI. **Agents must never treat any of this as application code.**
- [ ] Go
- [ ] Rust
- [ ] Kotlin / Java (Android)
- [ ] Swift (iOS / macOS)
- [ ] Dart (Flutter)
- [x] **Other: SCSS** — 29 partials under `ClientApp/src/styles/**` (Bootstrap 5 + custom NMI theme)
- [x] **Other: PowerShell** — 5 files; `scripts/Run-MigrationChecks.ps1` and
      `.github/migration-verifier/**` fixtures
- [x] **Other: Gherkin** — 33 `.feature` files driving the Playwright BDD suites

**Agent-pruning guidance:** only TypeScript/JavaScript agents are needed for application work.
Python agents apply *only* to `.github/skills/**`, `analysis/` and `a-team/scripts/` — never to
`ClientApp/src/**`; PowerShell agents only to the migration-verifier harness. **Do not prune SCSS or
Gherkin capability** — both are load-bearing.

---

## Tech Stack

**Frontend:** React 18.3.1 (functional components + hooks), React Router 7.18.2 (`createBrowserRouter`)
**Backend:** **none in this repository.** The SPA calls a co-hosted ASP.NET API at same-origin
relative paths (`/api/...`). The client is NSwag-generated into `ClientApp/src/api/web-api-client.ts`
with an empty `baseUrl`. The backend lives in a separate repository and team.
**Database:** **none.** No driver, ORM, migration tool or connection string exists here. Client-side
persistence is `sessionStorage` only (`ClientApp/src/storage/**`).
**Runtime:** Node.js **>= 24.0.0** (`engines` + `devEngines.runtime` with `onFail: "error"`); local
dev pinned to **24.20.0** via `.node-version`
**CI/CD:** **GitHub Actions** — `pr.yml`, `release.yml`, `chromatic.yml`; plus **SonarCloud** (EU) and
**Chromatic** as external gates

**Package manager:** npm **11.17.0** (`packageManager` field). CI invokes `npx npm@11.17.0 ci`
explicitly so the lockfile is resolved by the declared npm, not the runner's bundled one.

**Key libraries** (installed versions): `react-aria-components` 1.19.0 (**67 files** — the largest UI
dependency), `formik` 2.4.9 (63 files), `yup` 1.7.1 with 19 custom string validators, `@azure/msal-browser`
3.30.0 / `@azure/msal-react` 2.2.0, `bootstrap` 5.3.8, `react-bootstrap` 2.10.10, `dompurify` 3.4.14,
`date-fns` 3.6.0, `lodash` 4.18.1, `slate` 0.124.1, App Insights 3.4.2, `react-ga4` 2.1.0.

**Build:** dual pipeline — Webpack 5 for production bundles, Vite 8 for Storybook and Vitest Browser
Mode. This is a deliberate transitional choice; a change green in Storybook is **not** thereby green
in the production bundle.

---

## Communication & Collaboration Tools

- [ ] Gmail / email
- [ ] Slack
- [x] **GitHub Issues / PRs** — code review, CI status, and the PR gate
- [ ] Linear
- [x] **Notion** — declared in use by the project owner. In-repo traces exist in
      `.github/agents/agentic-workflows.agent.md`, `.github/agents/se-ux-ui-designer.agent.md` and
      `.github/skills/roundup-setup/SKILL.md`, but no Notion credential, database ID or sync config
      is committed — so the integration surface is not derivable from this repository. Record the
      workspace/database IDs somewhere durable before an agent is asked to use it.
- [ ] None — this is a pure engineering project

**External SaaS in the pipeline** (not communication tools, but they post status to PRs):

| Service | Role | Secret |
| --- | --- | --- |
| SonarCloud (EU) | Static analysis + quality gate; `sonar.qualitygate.wait=true` makes a red gate fail the job | `SONAR_TOKEN` |
| Chromatic | Storybook publishing + visual baselines | `CHROMATIC_PROJECT_TOKEN` |

**Agent-pruning guidance:** prune Slack, Linear and email agents. **Keep GitHub and Notion agents.**

---

## Scope Boundaries

**Will this project have E2E tests?** **yes — already present.** 33 Gherkin features across two
Playwright projects (`app-bdd`, `storybook-bdd`), run in CI by `e2e-node24`. `tests/e2e/route-coverage.ts`
maps all 41 routes to scenarios: 25 `app-bdd`, 16 `storybook-bdd`, **0 exclusions**.

**Will this project use a PostgreSQL database?** **no.** No database of any kind.

**Will this project handle authentication or user data?** **yes — both, and it is the central risk.**
Azure AD B2C via MSAL (OAuth2 + PKCE). Sign-in requires **myID** (Australian Government Digital ID)
and **RAM** (Relationship Authorisation Manager), which provisions the user's default organisation
before the first user fetch. Handles ABNs, business names, contact details, instrument records and
quotation data for Australian businesses.

**Is there a multi-channel communication workflow?** **no.** Single channel: browser → same-origin API.

**Are there autonomous agent loops running unattended?** **no.** All agent work is human-initiated.
Agent tooling is present but nothing runs on a schedule; there are no cron or routine definitions.

**Will there be regular documentation / codemaps?** **yes — heavily.** 959 tracked `.md` files.
Governed artefacts: Master Change Record, Open Items Backlog, ADRs, `analysis/ARCHITECTURE.mmd`,
code tours (`.tours/`), Storybook autodocs.

**Does this project make LLM API calls?** **no — not in shipped code.** No LLM SDK is a dependency.
LLM usage is entirely in the *development* loop (agent CLIs, Storybook MCP on `localhost:6006/mcp`,
`@react-aria/mcp`). Nothing reaches an LLM at runtime.

**Does this project use Terraform / Docker / Kubernetes?** **no.** No Dockerfile, compose file, `.tf`,
Helm chart or manifest is tracked. Deployment is handled outside this repo by the ASP.NET host.

**Does this project have a production environment?** **yes.** `portal.measurement.gov.au` is a live
Australian Government service. `REACT_APP_ENVIRONMENT` distinguishes `development` from everything else.

**Are there performance targets or SLAs?** **no — none declared.** No performance budget, Lighthouse
gate, Core Web Vitals threshold or SLA appears anywhere in this repository. **This is a gap, not a
decision** — a government service of this profile would normally carry one. (The replacement platform
does add `e2e/lighthouse.lh.ts` with a threshold policy.)

---

## Compliance Scope

- [ ] GDPR / RGPD — no EU user base identified
- [ ] COPPA — not directed at children
- [ ] PCI-DSS — no card data; no payment flow in this SPA
- [ ] SOC2 — not B2B SaaS
- [ ] HIPAA — not US healthcare
- [x] **Other: WCAG 2.2 AA** — the one regime this repository documents and gates

`docs/accessibility/wcag-2.2-aa-98-plan.md` sets a weighted target of **>= 98/100** with hard score
caps (keyboard trap caps at 59; modal without focus trap at 79; no CI regression gate at 96).
Enforced by `@storybook/addon-a11y` and the Storybook interaction suite.

> **Flagged for the service owner — "not declared" is not "does not apply."** This is an Australian
> Government service that authenticates via **myID** and **RAM** and collects business and personal
> contact data. The **Privacy Act 1988** and **Australian Privacy Principles**, the **Digital ID Act
> 2024**, and the DTA **Digital Service Standard** would ordinarily be in scope — but **none is
> mentioned anywhere in this repository**, so this document cannot declare them. Confirm the real
> obligations with the NMI service owner and record the answer here.
>
> The `compliance-reviewer` agent should currently activate for **WCAG only**.

Note: `docs/design-platform/DESIGN-PLATFORM-INPUTS.md` still says WCAG **2.1** AA while the
accessibility plan targets **2.2** AA. Reconcile to 2.2.

---

## Team & Workflow

**Number of developers:** **1** (agent-assisted). All 134 commits carry the author `GitHub Copilot`.
**Branching model:** feature-branches → PR → `main`. Live branches: `main`,
`fix/dependency-vulnerability-remediation`, `refactor/storybook-autodocs`.
**Review process:** **automated-only** — 8 required CI statuses plus a blocking SonarCloud quality
gate. There is no human peer reviewer.

**Implication for agents:** with no second human in the loop, **CI is the reviewer**. Never weaken a
gate to make a build pass; a green build obtained by relaxing a threshold is a silent regression with
nobody left to catch it.

---

## Quality Standards

**Minimum test coverage:** **100%** statements / branches / functions / lines, configured in
`vitest.unit.config.ts`. **Not currently met** — `COVERAGE-GATE-001` is an open Priority 1 backlog
item; the last recorded measurement (2026-06-28) was 74.43% statements / 75.51% branches / 72.56%
functions / 74.92% lines, taken against 114 test files. The suite is now **163 files / 1,734 tests**;
the percentage has not been re-measured.

**Linting enforced:** **yes** — blocking. `npm run lint` (ESLint 10.9.0, flat config
`eslint.config.mjs`) plus `npm run lint:mdx` (remark).
**Type checking enforced:** **yes** — blocking. `npm run type-check` (`tsc --noEmit`, `strict: true`).

**Test surfaces:**

| Surface | Size | Runner |
| --- | --- | --- |
| Unit | 163 files / 1,734 tests | Vitest 4.1.11 + jsdom, `pool: 'forks'`, `maxWorkers: 1` |
| Storybook interaction | 132 story files | Vitest **Browser Mode** → real Chromium via Playwright |
| Quality regression | 8 checks (`BUG-001`…`BUG-008`) | Vitest + jsdom |
| E2E / BDD | 33 `.feature` files | Playwright 1.61.1 + playwright-bdd 9.2.0 |

`maxWorkers: 1` everywhere is deliberate — the unit suite runs single-worker under
`--max-old-space-size=8192`, and the Storybook suite uses a single orchestrator so broad MCP-triggered
runs cannot exhaust the shared browser. Raising worker counts destabilises both.

---

## Special Constraints

Domain-specific guardrails the orchestrator must enforce across all agents. Each is load-bearing and
each has bitten this codebase before.

- **Never edit generated or vendored files:** `ClientApp/src/api/web-api-client.ts`,
  `ClientApp/src/main.*.js`, `ClientApp/css/main.*.css`, `ClientApp/src/external/**`,
  `ClientApp/src/parent/**`, `ClientApp/webpack/**`, `ClientApp/source-map-http-downloads/**`.
  Mirrored in `sonar.exclusions` and the Vitest coverage `exclude` list so all three tools agree.
- **Never use `process.env` in application code.** Runtime config is injected into `window.*` by a
  server-side template before the bundle loads. Read it only via the `env` object in
  `ClientApp/src/env.ts`. `process.env.X` is `undefined` in the browser and fails silently.
- **Prefer `globalThis` over `window`** in handwritten app code, tests and mocks — avoids SonarLint
  `typescript:S7764`. Use `window` only where browser-specific typing or the runtime config contract
  requires it.
- **Any schema calling a custom Yup string method must import the side-effect module**
  (`import '../../validationSchemas/yupExtensions';`). 19 methods are registered this way. Omitting
  it produces a **runtime** `schema.method is not a function` with **no build-time error**. Guarded by
  regression `BUG-007`.
- **All new SCSS uses `@use` / `@forward`, never `@import`.** The single permitted Bootstrap `@import`
  is isolated in `styles/_bootstrap-import.scss`. All Sass division uses `math.div()`, and any file
  using it must declare `@use 'sass:math';` first. Full module migration is blocked until Bootstrap 6
  by `_variables.scss:68`'s call to Bootstrap's internal `negativify-map()`.
- **Never suppress React `act(...)` warnings** in Storybook stories or setup. Derive state
  synchronously from props/context, or await the settled state with `canvas.findBy...` / `waitFor`.
  Do not put purely derived visibility behind `useEffect` + `setState`.
- **Wrap protected routes in `<AuthenticatedElement>`**, and read auth state through the hooks in
  `authentication/hooks.tsx` — never by importing `AccountContext` directly.
- **Use `<UnsavedFormPrompt>` for unsaved-change detection.** Do not re-implement navigation guards.
- **Lint / Vitest / Storybook dependency versions are pinned exactly, on purpose.** Do not let
  `syncpack` rewrite them to `^` ranges — its default behaviour silently breaks the
  `dependencySecurity` policy test.
- **Verify Storybook component properties through MCP before use.** Never assume a prop exists from
  naming convention; query `get-documentation` first. A story name is not evidence of a prop name.
- **Pass `--reporter=default` when piping a Vitest run.** Without it a piped run emits no console
  warnings and a broken suite can look clean.
- **Do not treat the Problems panel as a work queue.** It aggregates across vendored plugins
  (`a-team/`, `.agents/skills/`), generated output (`dist/`, `storybook-static/`, `quality/_phase5_*`)
  and reference docs. Attribute a diagnostic to owned source before acting on it.

---

## CLI Environment

- [x] **Claude Code** (native — uses `.claude/`)
- [x] Codex CLI (uses `.codex-plugin/`) — **see deviation below**
- [ ] Cursor (uses `.cursor-plugin/`)
- [ ] OpenCode (uses `.opencode/`)
- [x] **Multiple CLIs simultaneously**

**Layout status — verified 2026-09-01:**

The multi-CLI note refers to the plugin's own directories. Both are present as shipped:

| Location | Status |
| --- | --- |
| `a-team/.claude/agents/` | **present** — the 26 shared agent definitions (plugin source of truth) |
| `a-team/.agent-sync/` | **present** — shared state directory, kept by `.gitkeep` |

Additionally, root-level copies now exist so Claude Code picks the agents up natively for this project:

| Location | Status |
| --- | --- |
| `.claude/agents/` | **present, populated** — the 26 definitions copied to the project root |
| `.agent-sync/` | **present, tracked via `.gitkeep`** — `/orchestrate init` writes `TEAM.md` and `ROUTING.md` here |

**One genuine deviation from the template's assumption:**

| Template expects | This repository has |
| --- | --- |
| `.codex-plugin/` for Codex CLI | **`.codex/`** (`config.toml`). `.codex-plugin/` does not exist; the Codex config is read from `.codex/config.toml`. |

> **Open housekeeping point.** The root `.claude/agents/` is a **copy** of the plugin's 26
> definitions at `a-team/.claude/agents/`. If the plugin updates, the two will silently diverge.
> Decide which is authoritative and record it in `.agent-sync/ROUTING.md` at init.
>
> *(Resolved 2026-09-01: `.agent-sync/.gitkeep` added, so the empty state directory is tracked and
> survives a clone — matching `a-team/.agent-sync/.gitkeep`.)*

### Agent pruning decisions

Derived from the answers above. Apply at `/orchestrate init`.

| Agent | Decision | Reason |
| --- | --- | --- |
| `typescript-reviewer` | **keep** | The entire application is TypeScript |
| `code-reviewer`, `debugger`, `refactor-cleaner`, `build-error-resolver` | **keep** | Core engineering loop; CI is the only reviewer (§Team & Workflow) |
| `security-reviewer` | **keep** | Azure AD B2C, myID/RAM, business + personal data |
| `compliance-reviewer` | **keep — WCAG 2.2 AA scope only** | The one declared regime. Do not let it assume GDPR/SOC2/PCI. |
| `e2e-runner` | **keep** | 33 Gherkin features, two Playwright projects, already in CI |
| `tdd-guide` | **keep** | 100% coverage thresholds configured; `COVERAGE-GATE-001` open |
| `architect`, `planner`, `doc-updater` | **keep** | Active migration programme with governed documentation |
| `orchestrator`, `chief-of-staff`, `harness-optimizer` | **keep** | Infrastructure |
| `python-reviewer` | **keep, scoped** | Python exists **only** in `.github/skills/**` and `analysis/`. Must never touch application code. |
| `performance-profiler` | **keep, low priority** | No performance budget or SLA is declared — that gap is itself flagged for the service owner |
| `database-reviewer` | **prune** | No database, driver, ORM or connection string in this repository |
| `infra-reviewer` | **prune** | No Terraform, Docker, Kubernetes or Helm; deployment is outside this repo |
| `flutter-reviewer`, `go-reviewer`, `kotlin-reviewer`, `rust-reviewer`, `swift-reviewer` | **prune** | None of these languages are present |
| `ai-reviewer` | **prune** | No LLM SDK is a dependency; nothing reaches an LLM at runtime |
| `loop-operator` | **prune** | No autonomous loops; all agent work is human-initiated |

**Also present:** `.agents/` (plugins, skills), `.superpowers/`, `.remember/`, `.testagent/`,
`.github/skills/**` (12 Python-backed skills), `.tours/` (code tours).

**MCP servers this project expects:**

| Server | Endpoint | Required for |
| --- | --- | --- |
| `my-storybook-mcp-server` | `http://localhost:6006/mcp` | **Mandatory** before any UI/component work. Start `npm run storybook` and confirm the endpoint is healthy first; if the client started before Storybook was ready, restart the client — do not bypass. |
| `sonarqube` | via `sonar run mcp` | Issue, quality-gate and coverage queries; auto-discovers the project from `sonar-project.properties` |
| `react-aria` | `npx @react-aria/mcp@latest` | React Aria Components guidance |

**Known environment traps** (both have cost real time here):

- Two `sonar` CLIs can collide on `PATH` (`sonarqube-cli` vs npm `@sonar/scan`); hooks calling bare
  `sonar` fail open to the wrong binary until VS Code is *fully* relaunched.
- `claudeCode.environmentVariables` in VS Code `settings.json` holds a frozen `PATH` snapshot that
  overrides the registry — check it first when a `PATH` change refuses to stick.

---

## Daily Workflow Mode

- [ ] Daily standup mode (morning / tick / report cycle)
- [x] **On-demand dispatch** (ad hoc per feature/bug) — the primary mode
- [x] **CI/CD triggered** — `pr.yml` on every PR to `main`; `release.yml` on every push to `main`;
      `chromatic.yml` on every push

---

## Existing TASKS.md

**no — but do NOT create one.** This project already has a governed backlog with a formal intake
process, and a second list would fragment it.

| Artefact | Path | Role |
| --- | --- | --- |
| **Open Items Backlog** | `docs/change-record/OPEN-ITEMS-BACKLOG.md` | Authoritative prioritised list. P1 = production security / auth / data isolation / runtime config / CI / rollback blockers. P2 = blocks a migration batch. P3 = accepted post-migration debt. |
| **Master Change Record** | `docs/change-record/MASTER-CHANGE-RECORD.md` | Every change carries a `CRD-*` ID cross-linked from the backlog |
| **ADRs** | `docs/adr/` | Architecture decisions |
| **Migration roadmap** | `docs/MIGRATION_ROADMAP.md` | Migration units, placement map, risk register |
| **Migration runbook** | `docs/migration/MIGRATION-RUNBOOK.md`, `docs/migration/PRE-FLIGHT-CHECKLIST.md` | Execution gates |
| **Security** | `docs/sec/` | SEC-010 IDOR (CWE-639) — CLOSED / PASS 2026-06-04 |

**Intake rule:** any unresolved finding gets a backlog item *immediately* — never left only in commit
messages, meeting notes or issue comments. Items reach Resolved only when closure evidence is recorded.

**Currently open P1:** `COVERAGE-GATE-001`.

> **Known conflict with the orchestrator's state-machine protocol.**
> `a-team/.claude/rules/orchestration.md` instructs the orchestrator to "Read `TASKS.md` for backlog"
> on every invocation. **This project has no `TASKS.md` and should not gain one.** Point the
> orchestrator at `docs/change-record/OPEN-ITEMS-BACKLOG.md` instead, and record the substitution in
> `.agent-sync/ROUTING.md` at init — otherwise every session reads an empty backlog and concludes
> there is no outstanding work, while `COVERAGE-GATE-001` and the migration items sit unseen.
>
> **Known conflict with the testing rules.** `a-team/.claude/rules/testing.md` sets a minimum of 80%
> coverage. This project configures **100%** thresholds in `vitest.unit.config.ts`. The project
> standard is the higher one — do not let an agent relax the gate to 80% on the basis of the plugin
> rule.

---

## Migration Context (project-specific — not in the base template)

The orchestrator should know this before planning any work:

**A rebuild onto a new platform is already ~61% executed.** The target is the `React19DesignSystem`
pnpm/turbo workspace; `apps/portal-spa` (v0.2.0) holds the full 41-route skeleton, of which **25
render real pages and 16 render `StubPage` placeholders**. The Type Approval vertical is migrated;
the **RFQ → Quote → Accept → Report vertical is not**.

Target stack differences: React 19 + React Compiler, react-hook-form + zod, TanStack Query,
`openapi-typescript` (not NSwag), **no Bootstrap**, and `@nmi/design-tokens` /
`@nmi/react-components` / `@nmi/portal-patterns`. Notably `react-aria-components` is pinned at the
**same 1.19.0** on both sides — the largest reuse lever.

**Consequences for agent planning:**

- Treat this repository as the **behavioural specification and test oracle**, not as the codebase to
  be moved. `tests/e2e/route-coverage.ts` and the 33 feature files are the acceptance criteria for
  the 16 stubbed routes.
- The validation layer is **already ported at 19/19 parity** into
  `packages/portal-patterns/src/validation/`. Do not re-plan it.
- **69 of 344 first-party source files are unreachable** from `index.tsx` / `App.tsx` — including all
  36 `AriaComponents` files and every colour-picker family. They inflate the coverage denominator.
  Unreachable-from-app is not the same as deletable (Storybook stories may still reference them), so
  confirm before removing.

---

> Once this file is complete, copy it to the repository root as `INIT.md` and run `/orchestrate init`
> to initialize the team.
