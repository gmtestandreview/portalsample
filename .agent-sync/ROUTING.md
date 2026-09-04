# Task Routing — nmi-portal

Generated: 2026-09-02 by `/orchestrate init`
Roster: `.agent-sync/TEAM.md` (18 agents, 19 skills)
Scope source: `INIT.md` (root, authoritative)

---

## 0. Protocol Overrides — read before every dispatch

These four override the A Team plugin defaults for this project. Each exists because the plugin
default is wrong here, and following it silently produces a bad outcome.

### 0.1 Backlog Substitution — there is no `TASKS.md` and none may be created

`.claude/rules/orchestration.md` and the `orchestrator` agent both say "Read `TASKS.md` for
backlog". **This project has no `TASKS.md`.** It has a governed backlog with a formal intake process,
and a second list would fragment it.

**Wherever any A Team instruction says `TASKS.md`, read instead:**

| Read this | Role |
| --- | --- |
| `docs/change-record/OPEN-ITEMS-BACKLOG.md` | **The backlog.** Authoritative prioritised list. P1 = production security / auth / data isolation / runtime config / CI / rollback blockers. P2 = blocks a migration batch. P3 = accepted post-migration debt. |
| `docs/change-record/MASTER-CHANGE-RECORD.md` | Every change carries a `CRD-*` ID cross-linked from the backlog. |
| `docs/adr/` | Architecture decisions. |
| `docs/MIGRATION_ROADMAP.md` | Migration units, placement map, risk register. |
| `docs/migration/MIGRATION-RUNBOOK.md`, `docs/migration/PRE-FLIGHT-CHECKLIST.md` | Execution gates. |

Without this substitution every `/orchestrate morning` reads an empty backlog and concludes there is
no outstanding work, while the open items sit unseen.

**Currently open P1:** `COVERAGE-GATE-001` — unit coverage 74.43% st / 75.51% br / 72.56% fn /
74.92% ln against configured **100%** thresholds. `npm run test:unit:coverage` exits nonzero. Blocks
the full CI gate and the migration pre-flight. *(Percentages last measured 2026-06-28 against 114
test files; the suite is now 163 files / 1,734 tests and has not been re-measured.)*

**Intake rule:** any unresolved finding gets a backlog item *immediately* — never left only in a
commit message or an issue comment. Items reach Resolved only when closure evidence is recorded.

### 0.2 Coverage floor is 100%, not 80%

`.claude/rules/testing.md` sets a minimum of 80%. `vitest.unit.config.ts` configures **100%**
statements / branches / functions / lines. **The project standard is the higher one.** No agent may
relax the gate to 80% citing the plugin rule. `COVERAGE-GATE-001` closes by adding behaviour-focused
tests, or by an explicit reviewed change to the measured-scope policy — never by silently lowering a
threshold.

### 0.3 CI is the reviewer — never weaken a gate to go green

One developer, review process is automated-only: 8 required CI statuses plus a blocking SonarCloud
quality gate (`sonar.qualitygate.wait=true`). There is no human peer reviewer. A green build obtained
by relaxing a threshold is a silent regression with nobody left to catch it.

### 0.4 Authoritative agent source

Root `.claude/agents/` (18, pruned) and root `skills/` (19, pruned) are the **sole** source of
truth. The vendored `a-team/` plugin directory **was deleted in commit `95dc32e` (2026-09-02, 137
files)** once the install was verified — it was installer payload, never a runtime path. Claude Code
loads agents only from `.claude/agents/`; it never loaded any of the 26 definitions while they sat
in `a-team/`.

The 8 pruned agents, the pruned `data-migration` skill and the blank `INIT_TEMPLATE.md` are
preserved under `.agent-sync/pruned/`. To re-install or upgrade the plugin, re-clone it from
`https://github.com/RBraga01/a-team`, repeat the `cp -rn` install, and re-run `/orchestrate init` to
re-apply the prune.

---

## 1. Routing by file path

Most specific match wins. Paths are repo-relative.

| Path | Primary agent | Also dispatch |
| --- | --- | --- |
| `ClientApp/src/**/*.{ts,tsx}` | `typescript-reviewer` | `code-reviewer` |
| `ClientApp/src/authentication/**` | `security-reviewer` | `typescript-reviewer`, `code-reviewer` |
| `ClientApp/src/routes/**` | `typescript-reviewer` | `security-reviewer` (auth guard), `code-reviewer` |
| `ClientApp/src/components/**` | `typescript-reviewer` | `compliance-reviewer` (WCAG) — **Storybook MCP gate applies** |
| `ClientApp/src/validationSchemas/**` | `typescript-reviewer` | `security-reviewer` — validation defects are remote DoS, see §3.1 |
| `ClientApp/src/styles/**/*.scss` | `code-reviewer` | `compliance-reviewer` (contrast) |
| `ClientApp/src/storage/**` | `security-reviewer` | `typescript-reviewer` |
| `ClientApp/src/env.ts` | `security-reviewer` | `code-reviewer` — runtime config contract |
| `ClientApp/src/instrumentation/**` | `code-reviewer` | `security-reviewer` (telemetry PII) |
| `tests/e2e/**`, `**/*.feature` | `e2e-runner` | `tdd-guide` |
| `**/*.test.{ts,tsx}`, `vitest.*.config.ts` | `tdd-guide` | `typescript-reviewer` |
| `**/*.stories.tsx`, `.storybook/**` | `typescript-reviewer` | `compliance-reviewer` — **Storybook MCP gate applies** |
| `.github/workflows/**`, `sonar-project.properties`, `chromatic` config | `infra-reviewer` | `harness-optimizer` |
| `.github/skills/**/*.py`, `analysis/*.py`, `scripts/*.py` | `python-reviewer` | — |
| `scripts/*.ps1`, `.github/migration-verifier/**` | `infra-reviewer` | — |
| `docs/**`, `*.md` | `doc-updater` | — |
| `package.json`, `package-lock.json` | `security-reviewer` | `infra-reviewer` — see §3.8 pinning rule |
| `webpack.config.js`, `tsconfig.json` | `build-error-resolver` | `infra-reviewer` |

### Never routed — generated / vendored, read-only for every agent

`ClientApp/src/api/web-api-client.ts` · `ClientApp/src/main.*.js` · `ClientApp/css/main.*.css` ·
`ClientApp/src/external/**` · `ClientApp/src/parent/**` · `ClientApp/webpack/**` ·
`ClientApp/source-map-http-downloads/**` · `dist/**` · `storybook-static/**`

Mirrored in `sonar.exclusions` and the Vitest coverage `exclude` list so all three tools agree.

---

## 2. Routing by task type

| Task | Agent | Gate before dispatch |
| --- | --- | --- |
| New feature | `brainstorming` skill → `planner` → `subagent-driven-development` | Human approval of the plan |
| Bug report / failing test | `debugger` | Phase 1 (reproduce + isolate) must complete before any fix |
| Build or type failure | `build-error-resolver` | Minimal diffs only — no refactoring |
| Architectural decision | `architect` | ADR written to `docs/adr/` |
| Auth / API / input / session code | `security-reviewer` | Mandatory, not optional |
| Accessibility | `compliance-reviewer` | WCAG 2.2 AA scope only |
| CI / workflow / quality gate | `infra-reviewer` | Never weaken a gate (§0.3) |
| Coverage work (`COVERAGE-GATE-001`) | `tdd-guide` | RED → GREEN → REFACTOR; 100% floor (§0.2) |
| Dead code / duplication | `refactor-cleaner` | Must not run during active feature development |
| Docs / change record | `doc-updater` | Intake rule (§0.1) |
| Pre-merge | `harness-optimizer` → `/quality-gate` | `BLOCK MERGE` in `.agent-sync/AUDIT.md` halts the branch |

---

## 3. Special Constraints — enforced on every dispatch

Each has bitten this codebase before. A sub-agent output violating any of these is marked **FAILED**
and added to the Veto Buffer.

**3.1 — This snapshot is upstream-authoritative.** It is a source-map capture of the live production
portal, and the validation schemas are shared with the Node backend. A defect found here is a defect
in production. **Never discount a finding as "client-side only" or "just a snapshot"** — a validation
defect is a remote DoS on a live Australian Government service.

**3.2 — Never use `process.env` in application code.** Runtime config is injected into `window.*` by
a server-side template before the bundle loads. Read it only via the `env` object in
`ClientApp/src/env.ts`. `process.env.X` is `undefined` in the browser and fails **silently**.

**3.3 — Prefer `globalThis` over `window`** in handwritten app code, tests and mocks (SonarLint
`typescript:S7764`). Use `window` only where browser-specific typing or the runtime config contract
requires it.

**3.4 — Any schema calling a custom Yup string method must import the side-effect module:**
`import '../../validationSchemas/yupExtensions';`. 19 methods are registered this way. Omitting it
produces a **runtime** `schema.method is not a function` with **no build-time error**. Guarded by
regression `BUG-007`.

**3.5 — SCSS uses `@use` / `@forward`, never `@import`.** The single permitted Bootstrap `@import`
is isolated in `styles/_bootstrap-import.scss`. All division uses `math.div()`, and any file using it
must declare `@use 'sass:math';` first. Full module migration is blocked until Bootstrap 6 by
`_variables.scss:68`'s call to Bootstrap's internal `negativify-map()`.

**3.6 — Never suppress React `act(...)` warnings** in Storybook stories or setup. Derive state
synchronously from props/context, or await the settled state with `canvas.findBy...` / `waitFor`. Do
not put purely derived visibility behind `useEffect` + `setState`.

**3.7 — Auth and forms.** Wrap protected routes in `<AuthenticatedElement>`; read auth state through
`authentication/hooks.tsx`, never by importing `AccountContext` directly. Use `<UnsavedFormPrompt>`
for unsaved-change detection — do not re-implement navigation guards.

**3.8 — Lint / Vitest / Storybook dependency versions are pinned exactly, on purpose.** Do not let
`syncpack` rewrite them to `^` ranges — its default behaviour silently breaks the
`dependencySecurity` policy test.

**3.9 — Pass `--reporter=default` when piping a Vitest run.** Without it a piped run emits no console
warnings and a broken suite looks clean.

**3.10 — Do not treat the Problems panel as a work queue.** It aggregates across vendored plugins
(`.agents/skills/`), generated output (`dist/`, `storybook-static/`, `quality/_phase5_*`)
and reference docs. Attribute a diagnostic to owned source before acting on it.

**3.11 — Never raise worker counts.** `maxWorkers: 1` is deliberate everywhere. The unit suite runs
single-worker under `--max-old-space-size=8192`; the Storybook suite uses a single orchestrator so
broad MCP-triggered runs cannot exhaust the shared browser. Raising them destabilises both.

**3.12 — Storybook green is not production green.** Dual build pipeline: Webpack 5 for production
bundles, Vite 8 for Storybook and Vitest Browser Mode. Verify a change on the surface it ships from.

---

## 4. MCP Gate — blocks UI dispatch

| Server | Transport | Status 2026-09-02 |
| --- | --- | --- |
| `my-storybook-mcp-server` | `http://localhost:6006/mcp` | **HEALTHY** — `@storybook/addon-mcp` 0.7.0 answered JSON-RPC `initialize` |
| `sonarqube` | `mcp/sonarqube` Docker container | **RUNNING** — bound to SonarQube Cloud org `gmtestandreview` |
| `react-aria` | `npx @react-aria/mcp@latest` | Started by the operator |
| `playwright` | plugin-provided | Running |

**Hard gate:** no task touching `ClientApp/src/components/**` or `**/*.stories.tsx` may be dispatched
until the Storybook MCP tools are actually present in the session's tool list. **Never hallucinate a
component property** — call `list-all-documentation` once at task start, then `get-documentation`
before using any prop, including plausible-sounding ones. A story name is not evidence of a prop
name. Use `run-story-tests`, never a `package.json` test script, to validate story work.

**Two failure modes that look identical and are not:**

1. **Wrong probe.** `GET /mcp` returns nothing — it is a streamable-HTTP transport. `curl` reporting
   `000` on a GET is **not** evidence the server is down. Probe with a JSON-RPC `initialize` POST
   carrying `Accept: application/json, text/event-stream` (full command in `INIT.md` § MCP servers).
2. **Startup order.** MCP sessions are negotiated **once, when the agent client starts**. A server
   brought up *after* the client is healthy on the wire but permanently absent from that session, and
   nothing done inside the session recovers it. **Order: Storybook + Docker/SonarQube + React Aria
   first, agent client second.** If the tools are missing, restart the client — never bypass the
   gate, and never conclude from an in-session absence that a server is misconfigured.

**Credential hygiene:** the `mcp/sonarqube` container carries `SONARQUBE_TOKEN` in its environment,
readable by anyone who can run `docker inspect`. Treat `docker inspect` output as secret-bearing.
Never paste it into a log, issue, PR or agent transcript, and never commit a compose file or run
script with the token inline — use a gitignored env file or a Docker secret.

**Environment traps that have cost real time here:**

- Two `sonar` CLIs can collide on `PATH` (`sonarqube-cli` vs npm `@sonar/scan`). Hooks calling bare
  `sonar` fail open to the wrong binary until VS Code is **fully** relaunched.
- `claudeCode.environmentVariables` in VS Code `settings.json` holds a frozen `PATH` snapshot that
  overrides the registry. Check it **first** when a `PATH` change refuses to stick.

---

## 5. Migration Context — affects every plan

A rebuild onto the `React19DesignSystem` pnpm/turbo workspace is **~61% executed**.
`apps/portal-spa` (v0.2.0) holds all 41 routes: **25 render real pages, 16 render `StubPage`**.
The Type Approval vertical is migrated; **RFQ → Quote → Accept → Report is not**.

- Treat this repository as the **behavioural specification and test oracle**, not as the codebase to
  be moved. `tests/e2e/route-coverage.ts` and the 33 feature files are the acceptance criteria for
  the 16 stubbed routes.
- The validation layer is **already ported at 19/19 parity** into
  `packages/portal-patterns/src/validation/`. **Do not re-plan it.**
- **69 of 344 first-party source files are unreachable** from `index.tsx` / `App.tsx` — including all
  36 `AriaComponents` files and every colour-picker family. They inflate the coverage denominator and
  therefore bear directly on `COVERAGE-GATE-001`. **Unreachable-from-app is not the same as
  deletable** (Storybook stories may still reference them) — confirm before removing.
- Target stack differs: React 19 + React Compiler, react-hook-form + zod, TanStack Query,
  `openapi-typescript` (not NSwag), **no Bootstrap**. `react-aria-components` is pinned at the **same
  1.19.0** on both sides — the largest reuse lever.

---

## 6. Compliance Routing

`compliance-reviewer` activates for **WCAG 2.2 AA only** — `docs/accessibility/wcag-2.2-aa-98-plan.md`,
weighted target ≥ 98/100, hard caps (keyboard trap → 59, modal without focus trap → 79, no CI
regression gate → 96). Enforced by `@storybook/addon-a11y` and the Storybook interaction suite.

**Open reconciliation:** `docs/design-platform/DESIGN-PLATFORM-INPUTS.md` still says WCAG **2.1** AA
while the accessibility plan targets **2.2** AA. Reconcile to 2.2.

> **Escalated to the service owner — "not declared" is not "does not apply."** This service
> authenticates via **myID** and **RAM** and collects business and personal contact data. The
> **Privacy Act 1988** / Australian Privacy Principles, the **Digital ID Act 2024**, and the DTA
> **Digital Service Standard** would ordinarily be in scope, but none is mentioned anywhere in this
> repository, so `INIT.md` cannot declare them. Until the service owner confirms, `compliance-reviewer`
> stays WCAG-only. **Do not let it assume GDPR / SOC2 / PCI-DSS / HIPAA / COPPA.**

---

## 7. Parallel Dispatch & Path Normalization

Dispatch independent tasks in parallel when they touch different files, share no state, and have no
`depends_on`. Every path written to or read from the File Claims table **must be repo-relative** —
never absolute, never worktree-local:

```bash
REPO_ROOT=$(git worktree list --porcelain | awk 'NR==1 {print $2}')
RELATIVE=$(realpath --relative-to="$REPO_ROOT" "$ABSOLUTE_PATH")
```

Claim source files only (`.ts`, `.tsx`, `.scss`, `.py`) — not config, docs or fixtures. Claim on
dispatch, block on conflict (add `depends_on` rather than dispatching), release on a result with no
blockers. If two agents legitimately need the same file, escalate to the Veto Buffer — never silently
merge conflicting parallel changes.

---

## File Claims

**External claim released 2026-09-02 by the operator (Gate Clearance Plan, Pre-phase 0).**
Evidence for release: all four files landed together in commit `c6391fb` on 2026-09-02, and the
working tree was clean for all four at release time — the diff described below as "uncommitted" had
in fact been committed. Released on the operator's explicit say-so, as this section requires.

| File                                       | Agent                       | Task              | Status |
| ------------------------------------------ | --------------------------- | ----------------- | ------ |
| ClientApp/src/utils/index.ts               | external-session (coverage) | COVERAGE-GATE-001 | done   |
| tests/unit/utils/index.test.ts             | external-session (coverage) | COVERAGE-GATE-001 | done   |
| tests/unit/coverage/coverageConfig.test.ts | external-session (coverage) | COVERAGE-GATE-001 | done   |
| vitest.unit.config.ts                      | external-session (coverage) | COVERAGE-GATE-001 | done   |

No claim is active. Agents dispatched from this session may write to these files.

**Resolved 2026-09-02 — Gate Clearance Plan Phase 1.** Both `ClientApp/src/**/setupTests.ts` and
`ClientApp/src/**/*.stories copy.tsx` have been **removed** from the Vitest coverage `exclude` list,
and the four files they hid are deleted: two accidental `*.stories copy.tsx` duplicates, and
`AriaComponents/setupTests.ts` plus its unreferenced siblings `setupBrowserTests.ts` and
`testStyleMock.ts`. No vitest config loaded any of them — the unit leaf uses `./vitest.setup.ts` and
Storybook uses `./vitest.storybook.setup.ts`. The denominator was therefore widened, not narrowed,
which is the outcome §0.2 requires. `coverageRemapPolicy.test.ts` is 8/8 green.
`coverageConfig.test.ts` now pins both patterns out with `not.toContain`. Two riders remain live,
both from `INIT.md`:

- `sonar.exclusions` and the Vitest coverage `exclude` list are meant to agree. A change to one
  without the other splits the two gates and SonarCloud will disagree with local coverage.
- 69 of 344 first-party files are unreachable from `index.tsx` / `App.tsx` and inflate the
  denominator. Excluding *those* is a defensible scope argument; excluding a stray
  `*.stories copy.tsx` is a sign that file should be deleted, not excluded.

Flagged for the operator, not acted on — the file is claimed.
