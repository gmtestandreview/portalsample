# A Team Wiring Review — Design

- **Date:** 2026-09-09
- **Status:** Draft — awaiting user review
- **Author:** Claude (Sonnet 5), with gregm
- **Supersedes / relates to:** commits `5e2cac1`, `45d3bf8`, `c4bd7d7` (incremental skill registration)

---

## 1. Context and problem

The A Team layer in this repo is wired across four primitive types — **skills**
(`skills/**`, methodology), **agents** (`.claude/agents/**`, personas with tool
and model constraints), **commands** (`.claude/commands/**`, user entry points),
and **rules** (`.claude/rules/**`, always-on policy). The trigger authority is
[`skills/using-a-team/SKILL.md`](../../../skills/using-a-team/SKILL.md).

The wiring has drifted. The review below establishes the as-built state, runs a
`skill-duplication-audit` against the `superpowers` plugin (the source the 11
overlapping skills were forked from), and defines a single canonical A Team
skill set with full command/agent traceability.

### 1.1 As-built findings

| Area | Finding |
|---|---|
| **Skills on disk** | 24 in `skills/**`, each with a `SKILL.md`. |
| **Skill resolution** | Only 13 are symlinked into `.claude/skills/`, so they resolve by bare name to the A Team version. The other **11** (`brainstorming`, `dispatching-parallel-agents`, `executing-plans`, `finishing-a-development-branch`, `subagent-driven-development`, `systematic-debugging`, `test-driven-development`, `using-git-worktrees`, `verification-before-completion`, `writing-plans`, `writing-skills`) are **not** symlinked, so `Skill(<name>)` resolves to `superpowers:<name>`. The customised A Team bodies of those 11 never load. |
| **Stripped forks** | All 11 A Team forks differ from `superpowers` 6.3.0 and are missing supporting files the bodies assume (`visual-companion.md`, `root-cause-tracing.md`, `writing-good-tests.md`, sub-agent prompt templates, `scripts/`). |
| **Permissions** | [`.claude/settings.json`](../../settings.json) `permissions.allow` lists 19 `Skill(...)` entries. **Absent:** `adr`, `architecture-design`, `architecture-review`, `managing-github-actions`, `scalability-review` — these prompt on every invocation. |
| **Agents on disk** | 18 in `.claude/agents/**`. |
| **Phantom agent refs** | `using-a-team/SKILL.md` "Language & Domain Reviews" names `go-reviewer`, `rust-reviewer`, `kotlin-reviewer`, `swift-reviewer`, `flutter-reviewer`, `database-reviewer`, `ai-reviewer` — **none exist**. It also names a `data-migration` skill under "Before Any API Endpoint" — **does not exist**. |
| **Real-but-unlisted agents** | `doc-updater`, `e2e-runner`, `tdd-guide`, `typescript-reviewer`, `refactor-cleaner` exist but are absent from the `using-a-team` trigger tables. `chief-of-staff` exists and is unrelated to this project (multi-channel comms triage). |
| **Commands** | 10 in `.claude/commands/**`. All are agent-invokers or multi-step workflows. No command surface — and no traceability matrix — for ~20 of the 24 skills. |
| **superpowers agents** | The `superpowers` plugin ships **no agents**, only 14 skills. No agent-level merge is possible or needed. |
| **superpowers-only skills** | `receiving-code-review`, `requesting-code-review`, `using-superpowers` exist in `superpowers` with no A Team equivalent. The first two are in scope to port (see §4.2). |

---

## 2. Goals and non-goals

### Goals

1. **One canonical A Team skill set.** Every skill name resolves to the A Team
   version by bare name. No silent shadowing by a plugin.
2. **Best-of-both bodies.** Where `superpowers` carries material the A Team fork
   dropped, merge it back in (per the audit in §3).
3. **26 skills** after porting `receiving-code-review` and `requesting-code-review`.
4. **Every skill invocable without a permission prompt** — complete the
   `Skill()` allow-list.
5. **Every skill reachable from a command surface** — the 10 workflow/agent
   commands stay; add one `/skills` dispatcher plus three targeted commands.
6. **Full traceability** — a committed `command ↔ skill ↔ agent ↔ rule` matrix.
7. **Agent roster matches reality** — no phantom references; real agents listed;
   `chief-of-staff` removed.
8. **Docs reconciled** — `CLAUDE.md`, `AGENTS.md`, `using-a-team/SKILL.md`,
   `.claude/rules/**`, `.codex/config.toml` all describe the same final state.

### Non-goals

- Rewriting skill methodology beyond merging in `superpowers` material.
- Adding new agents for stacks this project does not use (Go, Rust, Kotlin,
  Swift, Flutter). Trigger rows for them are removed, not backfilled with stubs.
- Changing `.claude/settings.json` hooks, MCP config, or the Python enforcement
  scripts.
- Touching `superpowers` plugin files. The plugin stays installed; A Team simply
  stops depending on it for these 11 names.
- Building per-skill command files for all 26 (rejected — see §5, Alternatives).

---

## 3. Skill duplication audit (Workstream A)

**Method:** `skill-duplication-audit`. Each pair is *A Team local `X`* vs
*`superpowers:X`*. Both sides share `name`, activation trigger, and intended
outcome by construction (one is a fork of the other), and only one skill of a
given name can be active. Every pair therefore classifies as **True duplicate →
merge**; the audit's work is the **merge direction** and the **unique material
to preserve**.

### 3.1 Classification table

| # | Pair | Classification | Activation evidence | Outcome / specialization evidence | Recommendation |
|---|---|---|---|---|---|
| 1 | brainstorming (local ↔ superpowers) | True duplicate | Identical `name`; both "before any creative work" | Same outcome (spec + approval gate). SP carries a materially larger decision structure. | Merge SP → local |
| 2 | dispatching-parallel-agents | True duplicate | Identical `name`; both "2+ independent tasks" | Same outcome. SP adds isolated-context framing + decision digraph. | Merge SP additions → local |
| 3 | executing-plans | True duplicate | Identical `name`; both "execute a written plan" | Same outcome. Local is cleaner (no `superpowers:` coupling); SP adds a "return to review" path. | Local is base; fold SP path |
| 4 | finishing-a-development-branch | True duplicate | Identical `name`; both "branch ready to integrate" | Same outcome. Local is portable/policy-driven; SP has concrete worktree bash + a rationalizations table. | Local is base; port SP mechanics to `references/` |
| 5 | subagent-driven-development | True duplicate | Identical `name`; both "execute plan via subagents" | Same outcome. SP is **far** more developed (ledger, 5-round breaker, scripts, prompt templates). | Merge SP → local wholesale |
| 6 | systematic-debugging | True duplicate | Identical `name`; both "diagnose a bug" | Same outcome. Local body is a stronger spec-compliant rewrite; SP ships technique files + `find-polluter.sh`. | Local is base; port SP `references/` |
| 7 | test-driven-development | True duplicate | Identical `name`; both "before implementation code" | Same outcome. Local handles characterization baseline better; SP ships `writing-good-tests.md` + tables. | Local is base; port `writing-good-tests.md` |
| 8 | using-git-worktrees | True duplicate | Identical `name`; both "isolate before implementing" | Same outcome. Local is slightly more thorough. | Local is base; parity check only |
| 9 | verification-before-completion | True duplicate | Identical `name`; both "before claiming success" | Same outcome. Local is a careful rewrite. | Local is base; fold unique SP rationalization rows |
| 10 | writing-plans | True duplicate | Identical `name`; both "spec → plan, before coding" | Same outcome. Local is **more** developed (traceability, parallelization, handoff contract). | Local is base; port `plan-document-reviewer-prompt.md` |
| 11 | writing-skills | True duplicate | Identical `name`; both "authoring SKILL.md" | Same outcome. Local ships its own `references/`+`templates/`; SP has "Match the Form to the Failure" + `anthropic-best-practices.md`. | Local is base; port SP's unique refs + section |

**Counts:** Skills analyzed: 22 (11 pairs). Pairs evaluated: 11. True
duplicates: 11. Partial overlaps: 0. Complementary: 0. False positives: 0. Needs
Human Review: 0. Boundary docs needed: 0.

### 3.2 Per-pair merge plan

Every merged skill keeps the A Team frontmatter `description` (they are tuned and
eval-tested) and drops any `superpowers:` name prefixes in cross-references
(replace with bare skill names or agent names that exist in this repo).

| # | Skill | Body action | Files to add under `skills/<name>/` |
|---|---|---|---|
| 1 | `brainstorming` | Replace body with SP's three-path model (spike / bounded / architectural), one-way ratchet, "too simple to need approval" anti-pattern, Red Flags table, process-flow digraph, decomposition guidance. Change spec path from `docs/superpowers/specs/` → `.claude/docs/specs/`. Keep A Team frontmatter. | `visual-companion.md`, `spec-document-reviewer-prompt.md`, `scripts/` (server.cjs, helper.js, frame-template.html, start/stop-server.sh) |
| 2 | `dispatching-parallel-agents` | Prepend SP "Overview" (isolated-context framing); add SP when-to-use digraph and "Verification" section; keep A Team's concrete examples. | none |
| 3 | `executing-plans` | Keep A Team body; add SP's "When to Revisit Earlier Steps"; add explicit "ensure worktree isolation" as step 1; ensure references say `using-git-worktrees` / `subagent-driven-development` / `finishing-a-development-branch` (bare). | none |
| 4 | `finishing-a-development-branch` | Keep A Team body; add a "Common Rationalizations" table (from SP); add pointer to new `references/worktree-cleanup.md`. | `references/worktree-cleanup.md` (SP Step 2 + Step 6 bash: GIT_DIR/GIT_COMMON detection, `.worktrees/` ownership test, refusal handling) |
| 5 | `subagent-driven-development` | Replace body with SP's: ledger/recovery discipline, pre-flight conflict scan, task loop, 5-round fix-loop circuit breaker, adjudication rules, batching, final review, "Rulings I made" hand-off. Keep A Team's Model-Selection table but map tiers to [`.claude/rules/performance.md`](../../rules/performance.md). Replace `superpowers:finishing-a-development-branch` / `superpowers:using-git-worktrees` / `superpowers:requesting-code-review` with bare names. | `scripts/sdd-workspace`, `scripts/task-brief`, `scripts/review-package`, `implementer-prompt.md`, `task-reviewer-prompt.md`, `re-review-prompt.md` |
| 6 | `systematic-debugging` | Keep A Team body; add "Common Rationalizations" + "Partner signals you're doing it wrong" tables; reference the ported technique files. | `references/root-cause-tracing.md`, `references/condition-based-waiting.md` (+`condition-based-waiting-example.ts`), `references/defense-in-depth.md`, `scripts/find-polluter.sh` |
| 7 | `test-driven-development` | Keep A Team body; add RED-GREEN digraph, Good/Bad code examples, "Common Rationalizations" and "When Stuck" tables; reference `writing-good-tests.md`. | `references/writing-good-tests.md` |
| 8 | `using-git-worktrees` | Parity check against SP; adopt any SP edge case not already covered. Expected: no body change — but the skill is still symlinked (§4.5) and still gets the provenance comment. | none |
| 9 | `verification-before-completion` | Keep A Team body; fold any unique SP rationalization rows into the existing table. | none |
| 10 | `writing-plans` | Keep A Team body; reference the plan reviewer prompt. | `references/plan-document-reviewer-prompt.md` |
| 11 | `writing-skills` | Keep A Team body; add SP's "Match the Form to the Failure" section and "Bulletproofing" subsections if not already covered by `references/`. Add `anthropic-best-practices.md`, `graphviz-conventions.dot`, `render-graphs.js`. (`persuasion-principles.md`, `testing-skills-with-subagents.md` already present — skip.) | `references/anthropic-best-practices.md`, `references/graphviz-conventions.dot`, `scripts/render-graphs.js` |

**Provenance note:** each merged `SKILL.md` gets an HTML comment at the top:
`<!-- A Team fork. Merged from superpowers 6.3.0 on 2026-09-09. See .claude/docs/specs/2026-09-09-a-team-wiring-review-design.md -->`

### 3.3 `writing-skills` governance for the two full-body adoptions

`brainstorming` (#1) and `subagent-driven-development` (#5) are **replacements**,
not additive merges, so each is treated as a skill edit governed by
[`skills/writing-skills/SKILL.md`](../../../skills/writing-skills/SKILL.md). The
other nine are additive and covered by the §7 reference-integrity check alone.

Neither fork has an `evals/` directory (verified — both are `SKILL.md`-only), so
there are no local eval scenarios to preserve. The A Team refinements that MUST
survive the replacement are, in full:

1. the A Team frontmatter `description` (kept verbatim — it is the tuned trigger);
2. spec path `.claude/docs/specs/` wherever the SP body writes `docs/superpowers/specs/`;
3. every `superpowers:<name>` cross-reference rewritten to the bare skill name or the matching `.claude/agents/**` name that exists in this repo;
4. the §3.2 provenance comment;
5. `brainstorming` only: the SP body's `elements-of-style:writing-clearly-and-concisely` reference replaced with plain "write concisely" prose (that skill is not installed).

Per `writing-skills`, each of the two replacements is done RED → GREEN → REFACTOR:

- **RED** — before replacing, run one representative task through the *current*
  (shadowed `superpowers:`) skill and record the behaviour, so there is a
  baseline to compare against. For `brainstorming`: a "let's build X" request →
  expect path classification + approval gate. For `subagent-driven-development`:
  a 2-task plan → expect ledger creation + per-task two-stage review.
- **GREEN** — write the merged `SKILL.md` (SP body + the five preserved items),
  add every support file from §3.2, then re-run the same representative task and
  confirm the behaviour is preserved and the A Team `description` still fires on
  the same trigger phrasing.
- **REFACTOR** — run the `writing-skills` §9 validation checklist against the
  result: YAML frontmatter parses; `name` matches the directory; `description`
  matches actual scope; positive **and** near-miss activation both tested; every
  in-body `.md` / `.sh` / `.ts` reference resolves to a file that now exists;
  ported `scripts/` were executed once in Git Bash or are marked unvalidated in
  the traceability doc.

Registration (CLAUDE.md / AGENTS.md / `using-a-team` trigger table — `writing-skills`
scaffolding steps 7–9) is already carried by Workstream D and is not duplicated
here.

---

## 4. Target architecture

### 4.1 Primitive responsibility model (to be documented in `.claude/rules/`)

| Primitive | Owns | Does NOT |
|---|---|---|
| **Skill** (`skills/**`) | Reusable methodology, decision structure, gates. Model-invoked via `Skill` tool; user-invocable as `/<name>`. | Persona, tool restriction, model tier. |
| **Agent** (`.claude/agents/**`) | A persona that *executes* a methodology under a fixed tool + model-tier budget (e.g. `debugger` runs `systematic-debugging`). Dispatched via `Agent`/`Task`. | Define the methodology itself — it cites the skill. |
| **Command** (`.claude/commands/**`) | A user entry point that composes skills + agents into a workflow (`/feature`, `/quality-gate`) or is a thin alias to one skill/agent (`/debug`, `/adr`). | Contain methodology — it points at skills/agents. |
| **Rule** (`.claude/rules/**`) | Always-on, non-negotiable policy (coding style, security checklist, git workflow, orchestration, model tiers). | Task-specific workflow. |

### 4.2 New skills to port from `superpowers`

| Skill | Why it is not a duplicate | Boundary vs existing A Team primitives |
|---|---|---|
| `requesting-code-review` | A Team has a `code-reviewer` **agent** but no skill describing *when/how a coordinator dispatches* a review (SHAs, template, act-on-feedback loop). | **Complementary** to `code-reviewer` agent: skill = the request protocol; agent = the reviewer persona. `subagent-driven-development` (§3.2 #5) references it. |
| `receiving-code-review` | No A Team equivalent. Governs how the *recipient* evaluates feedback (verify before implementing, technical pushback, no performative agreement). | **Complementary** to `code-reviewer` agent and `/code-review`. Pairs with `.claude/rules/coding-style.md` "Surgical Changes". |

Both are ported verbatim from `superpowers` 6.3.0 with: A Team frontmatter style,
`superpowers:` prefixes stripped, and `requesting-code-review/code-reviewer.md`
template retained. Canonical skill count becomes **26**.

### 4.3 Command surface (Workstream D)

**Keep all 10 existing commands.** Add:

| New command | Type | Composes |
|---|---|---|
| `/skills` | Dispatcher / index | Lists all 26 skills: exact invoke token, one-line trigger, executing agent(s), related command(s). Body instructs: "to run one, invoke `Skill(<name>)`". |
| `/adr` | Thin alias | `adr` skill |
| `/incident-response` | Thin alias | `incident-response` skill |
| `/architecture-review` | Thin alias | `architecture-review` skill |

Wire the two new review skills into existing commands:
[`/code-review`](../../commands/code-review.md) gains a "Reception protocol"
line → `receiving-code-review`; [`/quality-gate`](../../commands/quality-gate.md)
step 2 references `requesting-code-review` as the dispatch protocol.

Rationale for *not* adding the other ~19 as thin aliases: skills are already
user-invocable as `/<name>` by the harness, and `/skills` gives a single
discoverable index. `adr` / `incident-response` / `architecture-review` get
dedicated commands because they are common standalone entry points that benefit
from argument hints and a visible slash command.

### 4.4 Agent roster changes (Workstream C)

| Action | Detail |
|---|---|
| **Delete** | `.claude/agents/chief-of-staff.md` — unrelated (multi-channel comms triage). Remove any reference. |
| **Remove phantom refs** | In `using-a-team/SKILL.md` "Language & Domain Reviews", delete rows for `go-reviewer`, `rust-reviewer`, `kotlin-reviewer`, `swift-reviewer`, `flutter-reviewer`, `database-reviewer`, `ai-reviewer`. Keep `typescript-reviewer`, `python-reviewer`, `infra-reviewer`, `compliance-reviewer`. Add a note: "Other language reviewers are added on demand when that stack enters the repo." |
| **Resolve `data-migration`** | Remove the "Any `ALTER TABLE` / `DROP` / backfill" row (no such skill; this is a client SPA). `api-contract-first` + `adr` cover schema-contract decisions. |
| **List real agents** | Add trigger rows: `doc-updater` (after features land / docs drift), `e2e-runner` (critical-flow E2E), `tdd-guide` (alternative to `test-driven-development` skill when a persona is wanted), `typescript-reviewer` (TS/TSX changes — already partly implied), `refactor-cleaner` (dead-code / duplication, not during active feature work). |
| **Model-tier check** | Verify every agent `model:` against [`.claude/rules/performance.md`](../../rules/performance.md): Tier 1 (`opus`) = `orchestrator`, `architect` only; Tier 3 (`haiku`) = `doc-updater`, `harness-optimizer`, `performance-profiler`; everything else Tier 2 (`sonnet`). Flag mismatches in the plan; do not silently rewrite. |

### 4.5 Skill wiring (Workstream B)

1. **Symlink** the 11 merged skills into `.claude/skills/<name> → ../../skills/<name>`
   (Windows: the repo already uses `lrwxrwxrwx` symlinks here, so
   `ln -s ../../skills/<name> .claude/skills/<name>` or `mklink /D`). Add the 2
   new review skills the same way. Result: 26/26 resolve to the A Team version by
   bare name; `react-aria` symlink stays.
2. **Permissions:** add to `permissions.allow` in `.claude/settings.json`, both
   `Skill(<name>)` and `Skill(<name>:*)` forms:
   `adr`, `architecture-design`, `architecture-review`, `managing-github-actions`,
   `scalability-review`, `receiving-code-review`, `requesting-code-review`.
3. **Verify** each of the 26 resolves un-prefixed and un-prompted (see §7).

### 4.6 Traceability matrix

New file `.claude/docs/traceability.md` — one row per skill:

| Skill | Invoke | Trigger (short) | Command entry point(s) | Executing agent(s) | Governing rule(s) |
|---|---|---|---|---|---|

Plus an agent table (agent → skill(s) it runs → command(s) that dispatch it →
model tier) and a command table (command → skills + agents it composes).

---

## 5. Alternatives considered

| Option | Why rejected |
|---|---|
| **Defer to `superpowers` for the 11, delete local forks** | Loses eval-tested A Team refinements (`writing-plans`, `systematic-debugging`, `verification-before-completion` are stronger locally); hard runtime dependency on the plugin staying installed and version-pinned. |
| **Symlink the 11 stripped forks as-is** | Bodies reference files that would 404 (`visual-companion.md`, `writing-good-tests.md`, prompt templates). Latent breakage. |
| **One command file per skill (26 files)** | Redundant with harness `/<name>` skill invocation; 26 near-identical shims to maintain; `/skills` index is more discoverable. |
| **Stub the 7 phantom language reviewers** | This is a React 18 / TypeScript SPA. Seven unused personas is noise; `using-a-team` says add on demand. |

---

## 6. Risks and rollback

| Risk | Mitigation | Rollback |
|---|---|---|
| A merged body changes behaviour of a skill mid-workflow | Merge is additive (SP material into A Team base) except `brainstorming` and `subagent-driven-development`, which are full SP adoptions — call those out for explicit review in the plan. | `git revert` the skill commit; symlink removal restores `superpowers:` resolution. |
| Symlink form wrong on Windows | Repo already contains working `../../skills/*` symlinks in `.claude/skills/`; reuse that exact form. | `rm` the symlink; skill falls back to `superpowers:` or plugin. |
| `Skill()` allow-list entry typo silently re-introduces prompts | §7 verification invokes each of the 26. | Edit `settings.json`; no history rewrite. |
| Deleting `chief-of-staff` breaks a hook/command reference | Grep for `chief-of-staff` before delete. | `git checkout` the file. |
| `.codex/config.toml` has no skills table — nothing to reconcile there | Confirmed: it holds MCP server config only. AGENTS.md is the Codex-facing surface. | n/a |
| Ported `scripts/` are bash; repo is Windows/PowerShell-primary | Scripts run under the Bash tool (Git Bash) which the repo already uses. Mark any that need `python`/`sh` in the traceability doc. | Skills degrade to their no-script path (SP bodies document it). |

---

## 7. Success criteria

- [ ] `skill-duplication-audit` table (§3.1) committed in this spec; all 11 pairs classified with merge direction.
- [ ] 26 `skills/*/SKILL.md` exist; the 11 merged ones carry the provenance comment; no `superpowers:` prefixes remain in any A Team `SKILL.md`.
- [ ] `brainstorming` and `subagent-driven-development` replacements completed under `writing-skills` RED→GREEN→REFACTOR (§3.3): baseline behaviour recorded, preserved-items 1–5 present, `writing-skills` §9 validation checklist passed for each.
- [ ] Every supporting file listed in §3.2 and §4.2 exists at the stated path; no dangling in-body reference (grep each `SKILL.md` for `.md)` / `.sh` / `.ts` refs and confirm the target exists).
- [ ] `.claude/skills/` contains 26 skill symlinks (+ `react-aria`), each pointing at `../../skills/<name>`.
- [ ] `.claude/settings.json` `permissions.allow` contains `Skill(<name>)` + `Skill(<name>:*)` for all 26.
- [ ] Invoking each of the 26 by bare name resolves to the A Team body (spot-check 5, including 3 formerly-shadowed) with no permission prompt.
- [ ] `.claude/agents/chief-of-staff.md` deleted; `grep -r chief-of-staff` clean.
- [ ] `using-a-team/SKILL.md`: no `go-/rust-/kotlin-/swift-/flutter-/database-/ai-reviewer`, no `data-migration`; `doc-updater`, `e2e-runner`, `tdd-guide`, `typescript-reviewer`, `refactor-cleaner` present; 26 skills in trigger tables.
- [ ] `CLAUDE.md`, `AGENTS.md` skills tables list all 26; `.claude/rules/` (agents.md, orchestration.md, patterns.md, performance.md) reference only real agents/skills and state the §4.1 responsibility model.
- [ ] `.claude/commands/` has 14 files: 10 existing + `/skills`, `/adr`, `/incident-response`, `/architecture-review`. `/code-review` and `/quality-gate` reference the two review skills.
- [ ] `.claude/docs/traceability.md` committed: skill table (26 rows), agent table, command table; every row's cross-references resolve.
- [ ] Every agent `model:` matches its [`.claude/rules/performance.md`](../../rules/performance.md) tier, or a deliberate exception is noted in the traceability doc.
- [ ] Repo validation gate unaffected: `npm run test:ci` behaviour unchanged (A Team files are outside the lint/test scope — `lint:mdx` covers only `.storybook/**` and `ClientApp/src/**` `.mdx`). New Markdown follows the `| --- |` table style used in `CLAUDE.md` / `AGENTS.md`.

---

## 8. Out of scope / deferred

- `superpowers:using-superpowers` — a harness bootstrap skill; not an A Team concern.
- Any change to `.claude/settings.json` hooks or `scripts/*.py` enforcement.
- Porting `superpowers` `elements-of-style:*` referenced in its `brainstorming` body — replace that reference with "write concisely" prose.
- Automated CI check that `.claude/skills/` stays in sync with `skills/` — worth a follow-up issue, not this change.
- Rewriting agent bodies beyond the `model:` tier check.

---

## 9. Execution note

This spec is the input to the `writing-plans` skill. The plan will sequence the
work as A → B → C → D with these natural checkpoints: after the 11 skill merges
(§3.2) and before the doc reconciliation (§4). `brainstorming` and
`subagent-driven-development` full-body adoptions each get their own plan phase
executed under `writing-skills` (§3.3), with the RED baseline captured before the
replacement and the §9 validation checklist as the phase's validation gate.
