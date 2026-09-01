# Active Team — nmi-portal

Generated: 2026-09-02
Source: `INIT.md` (root, authoritative) · A Team plugin v1.4.0 (RBraga01, MIT)
Install method: official "Adding A Team to an Existing Project" — `cp -rn` (no-clobber) from
`a-team/`, which was then **deleted**. Root is now the sole source of truth.
Roster: **18 of 26 agents active** · **19 of 20 skills active**

---

## Install Record

| Step | Result |
| --- | --- |
| `cp -rn a-team/.claude ./` | Merged. `.claude/agents/` (26), `.claude/commands/` (10), `.claude/docs/`, `.claude/rules/` (8) installed. |
| `cp -rn a-team/skills ./` | 20 skills installed at repo root `skills/` — **not** under `.claude/`. |
| `cp -rn a-team/hooks ./` | `hooks/session-start.md` installed. |
| `cp -rn a-team/templates ./` | `SOUL.md`, `relationships.md`, `watcher.py` installed. |
| `cp -rn a-team/scripts ./` | 10 plugin scripts merged into the existing root `scripts/`. All 6 project files (`Run-MigrationChecks.ps1`, `audit-coverage-report.ts`, `audit-storybook-log.ts`, `clean-storybook-output.mjs`, `coverage-gap-queue.mjs`, `verify-storybook-docs.mjs`) preserved by `-n`. **Not in the README's existing-project list — added because the full install (Options B/C/D) includes it and the plugin hooks depend on it.** |
| `cp a-team/INIT.md ./INIT.md` | Placed the **filled** init document, not the blank `INIT_TEMPLATE.md`. |
| `.claude/settings.json` | **Preserved by `-n`.** Project file untouched. Plugin settings deliberately unmerged — see Deferred Items. |
| `.claude/skills/react-aria/` | **Preserved by `-n`.** Pre-existing project skill untouched. |

**Authoritative source (resolves the open housekeeping point in `INIT.md` §CLI Environment):**
root `.claude/agents/` and root `skills/` are the **sole** source of truth. The vendored `a-team/`
directory was **deleted in commit `95dc32e` (2026-09-02, 137 files / 13,964 deletions)** once the
install was verified.

**Why deletion rather than keeping it as a vendor reference.** Claude Code loads agents only from
`.claude/agents/`; all 26 definitions sat unread in `a-team/` for a full session and *none*
registered. Of its 137 tracked files, 82 were byte-duplicates of root and ~45 were A Team's own
self-test harness — including a nested `package.json` that added noise to knip, depcheck and the
Problems panel. Only 10 files were unique and worth keeping; those are preserved under
`.agent-sync/pruned/`. The upstream README's install options B, C and D all end in `rm -rf a-team`
for the same reason.

**To upgrade the plugin:** re-clone `https://github.com/RBraga01/a-team`, repeat the `cp -rn`
install, re-run `/orchestrate init` to re-apply the prune, then delete the clone again.

---

## Active Agents (18)

| Agent | Reason kept |
| --- | --- |
| `typescript-reviewer` | The entire application is TypeScript — 471 `.tsx` + 387 `.ts`, `strict: true`. |
| `code-reviewer` | Core engineering loop. CI is the only reviewer (1 developer, automated-only review). |
| `debugger` | Active remediation on a legacy base. |
| `refactor-cleaner` | Active remediation. Must not run during feature development (plugin rule `agents.md`). |
| `build-error-resolver` | Dual Webpack 5 / Vite 8 pipeline; blocking type-check and lint gates. |
| `security-reviewer` | Azure AD B2C + MSAL, myID/RAM Digital ID, ABNs and business/personal data. |
| `compliance-reviewer` | **Scoped: WCAG 2.2 AA only.** See Scope Restrictions. |
| `e2e-runner` | 33 Gherkin features, two Playwright projects (`app-bdd`, `storybook-bdd`), already in CI. |
| `tdd-guide` | 100% coverage thresholds configured; `COVERAGE-GATE-001` open at ~74%. |
| `architect` | Active migration programme to the `React19DesignSystem` workspace. |
| `planner` | Same. |
| `doc-updater` | 959 tracked `.md` files; governed Master Change Record + Open Items Backlog. |
| `orchestrator` | Infrastructure. |
| `chief-of-staff` | Infrastructure. GitHub and Notion are the declared collaboration tools. |
| `harness-optimizer` | Always keep (plugin rule). |
| `python-reviewer` | **Scoped: tooling only.** See Scope Restrictions. |
| `performance-profiler` | **Keep, low priority.** No performance budget or SLA is declared — `INIT.md` flags that absence as a gap, not a decision. |
| `infra-reviewer` | **Keep, CI/CD scope only — corrected at init.** See Scope Restrictions and Deviations. |

## Pruned Agents (8)

| Agent | Reason removed |
| --- | --- |
| `database-reviewer` | No database of any kind. No driver, ORM, migration tool or connection string. Client-side persistence is `sessionStorage` only. |
| `go-reviewer` | Go is not present. |
| `rust-reviewer` | Rust is not present. |
| `kotlin-reviewer` | Kotlin / Java / Android is not present. |
| `swift-reviewer` | Swift / iOS is not present. |
| `flutter-reviewer` | Flutter / Dart is not present. |
| `ai-reviewer` | No LLM SDK is a dependency. Nothing reaches an LLM at runtime; LLM use is development-loop only. |
| `loop-operator` | No autonomous loops. No cron or routine definitions; all agent work is human-initiated. |

Restore any of these with `cp .agent-sync/pruned/agents/<name>.md .claude/agents/`.

---

## Active Skills (19)

| Skill | Reason kept |
| --- | --- |
| `brainstorming` | Status is active-development. |
| `writing-plans` | Active-development. |
| `executing-plans` | Active-development. |
| `subagent-driven-development` | Complex migration features expected. |
| `systematic-debugging` | Active development on a legacy base. |
| `dispatching-parallel-agents` | Multiple independent problem streams (migration, coverage, a11y). |
| `finishing-a-development-branch` | Git workflow is feature-branches → PR → `main`. |
| `using-git-worktrees` | Same. |
| `api-contract-first` | The SPA consumes a same-origin ASP.NET API via an NSwag-generated client. |
| `incident-response` | `portal.measurement.gov.au` is a live Australian Government production service. |
| `test-driven-development` | 100% coverage thresholds; `COVERAGE-GATE-001` open. |
| `verification-before-completion` | CI is the only reviewer — claims must carry evidence. |
| `architecture-audit` | Active migration; ADRs and a governed roadmap. |
| `five-whys` | Root-cause discipline for the remediation backlog. |
| `performance-audit` | **Keep, low priority** — mirrors `performance-profiler`. No targets declared; the gap itself is flagged for the service owner. |
| `skill-duplication-audit` | Directly relevant — 11 root `skills/` names collide with `superpowers:*`. See Deferred Items. |
| `using-a-team` | Infrastructure. |
| `writing-skills` | Infrastructure. |
| `smart-init` | **Dormant, retained.** Its trigger is "`INIT.md` missing"; `INIT.md` exists and is authoritative, so it will not fire. Kept so a future re-init is possible. |

## Pruned Skills (1)

| Skill | Reason removed |
| --- | --- |
| `data-migration` | Plugin rule keeps it only if the project uses a database. This project has none. |

Restore with `cp -r .agent-sync/pruned/skills/data-migration skills/`.

---

## Scope Restrictions (enforced by the orchestrator at dispatch)

| Agent | Allowed surface | Forbidden |
| --- | --- | --- |
| `python-reviewer` | `.github/skills/**`, `analysis/`, `scripts/*.py` — tooling only, none of it built, shipped or covered by CI | `ClientApp/src/**`. There is **zero** Python application code. |
| `compliance-reviewer` | **WCAG 2.2 AA only** — `docs/accessibility/wcag-2.2-aa-98-plan.md`, target ≥ 98/100 | Must not assume GDPR, SOC2, PCI-DSS, HIPAA or COPPA. None applies. |
| `infra-reviewer` | `.github/workflows/**`, `sonar-project.properties`, Chromatic config | `ClientApp/src/**`. No Terraform, Docker, K8s or Helm exists; deployment is outside this repo. |
| `performance-profiler` | Advisory only, low priority | Must not invent a performance budget. None is declared. |
| `refactor-cleaner` | Dedicated refactor tasks | Must not run during active feature development (plugin rule). |

---

## Deviations from the plugin's generic INIT rules

| Item | Plugin rule | Applied here | Why |
| --- | --- | --- | --- |
| `infra-reviewer` | Keep if Terraform / Docker / K8s **or CI/CD** in stack | **Kept, CI/CD-scoped** | `INIT.md` originally said prune, citing only the absence of Terraform/Docker/K8s. But the repo owns `.github/workflows/{pr,release,chromatic}.yml`, 8 required statuses and a blocking SonarCloud gate, and CI is the only reviewer. Human decision at init 2026-09-02; `INIT.md` row corrected. |
| `compliance-reviewer` | Keep only if GDPR / COPPA / PCI-DSS / SOC2 / HIPAA | **Kept, WCAG-scoped** | None of the five listed regimes applies, but WCAG 2.2 AA is documented and gated. Project doc overrides the generic list. |
| `chief-of-staff` | Keep if email / Slack / comms tools listed | **Kept** | Slack, Linear and email are pruned surfaces, but GitHub and Notion are declared in use. |
| Pruning mechanism | `rm` from `.claude/agents/` and `skills/` | **Applied to the root copies; `a-team/` then deleted entirely** | The official existing-project install copies to root, and options B/C/D end in `rm -rf a-team`. Pruning at root keeps the decision re-appliable after any future plugin update. |
| Skill deletion | Delete skills failing their rule | **Only `data-migration` deleted** | Deliberately conservative — the official guidance is to review this file and restore anything wrongly pruned. |

---

## Deferred Items (require a human decision — not resolved at init)

1. **`.claude/settings.json` is unmerged.** `cp -rn` preserved the project file, as the official
   install note requires. The plugin's own settings were **not** applied, so the following are
   inactive: the `PreToolUse` security gate, the `SessionStart` roster echo, the `PostToolUse`
   review reminder, the `Stop` metrics/export hooks, `worktreeDirectory: .claude/worktrees`, and
   ~100 permission entries. Merging it as-is would also grant `Write(*)`, `Edit(*)`,
   `Bash(git push*)` and `Bash(pip install *)`, and pin `model: claude-sonnet-4-6` — all of which
   should be a deliberate choice, not an install side effect.
2. ~~**Hook scripts missing from the repo root.**~~ **RESOLVED at init.** The README's
   "Adding A Team to an Existing Project" list omits `scripts/`, but the full-install options
   (B/C/D) all include `cp -r a-team/scripts`, and the plugin hooks reference `scripts/*.py` at the
   root. Copied with `cp -rn`. All five hook targets now resolve: `pre_tool_use.py`, `watcher.py`,
   `status.py`, `metrics.py`, `session_export.py`. They remain **inert until item 1 is done** —
   the hooks that invoke them live in the unmerged plugin `settings.json`.
3. **11 of the 19 active root skills duplicate `superpowers:*` skills already loaded in-session** —
   `brainstorming`, `systematic-debugging`, `test-driven-development`, `writing-plans`,
   `executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`,
   `using-git-worktrees`, `verification-before-completion`, `writing-skills`,
   `finishing-a-development-branch`. Root `skills/` is outside `.claude/`, so neither shadows the
   other and nothing is currently broken. Run `skill-duplication-audit` before promoting any of them
   into `.claude/skills/`.
4. **Two MCP servers failed to connect this session** — `my-storybook-mcp-server`
   (`http://localhost:6006/mcp`, ConnectionRefused) and `sonarqube` (CONNECTION_CLOSED). `INIT.md`
   marks the Storybook server **mandatory before any UI or component work**. **No UI task may be
   dispatched until `npm run storybook` is up and the endpoint is healthy.**

---

## Next Step

Per the official guidance: review this file, restore any agent pruned in error, then run
`/orchestrate morning` to let the orchestrator read repo state before touching anything.

**Backlog substitution applies** — there is no `TASKS.md` and one must not be created. See
`.agent-sync/ROUTING.md` § Backlog Substitution.
