# A Team Wiring Review — Design

- **Date:** 2026-09-09
- **Status:** Draft — revised after devil's-advocate review (2026-09-09)
- **Author:** Claude (Sonnet 5), with gregm
- **Supersedes / relates to:** commits `5e2cac1`, `45d3bf8`, `c4bd7d7` (incremental skill registration)

## Revision log

| Rev | Change |
|---|---|
| r1 | Initial draft (26 skills: port both review skills). |
| r2 | Governed the two full-body adoptions under `writing-skills` (§3.3). |
| r3 | Devil's-advocate review: **port `receiving-code-review` only** → canonical set **25**. Added Phase-0 symlink-shadow spike with abort criteria (§6, §9). Session-reload gate before invocation checks. Delivery split into **PR1 (skills + wiring)** and **PR2 (agents + commands + docs)** (§9). superpowers merge source pinned to an in-repo snapshot. `.superpowers/` SDD scratch remapped to `.agent-sync/sdd/`. |

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
| **superpowers-only skills** | `receiving-code-review`, `requesting-code-review`, `using-superpowers` exist in `superpowers` with no A Team equivalent. **Only `receiving-code-review` is in scope to port** (see §4.2); `requesting-code-review` is deferred (§8) — the `code-reviewer` agent + `/quality-gate` already orchestrate review dispatch. |

---

## 2. Goals and non-goals

### Goals

1. **One canonical A Team skill set.** Every skill name resolves to the A Team
   version by bare name. No silent shadowing by a plugin. **(Gated by the
   Phase-0 spike in §9 — if a project symlink does not shadow a plugin skill,
   stop and re-decide.)**
2. **Best-of-both bodies.** Where `superpowers` carries material the A Team fork
   dropped, merge it back in (per the audit in §3).
3. **25 skills** after porting `receiving-code-review` (24 existing + 1 ported).
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
- Building per-skill command files for all 25 (rejected — see §5, Alternatives).
- Porting `requesting-code-review` (deferred — §8).

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
| 5 | `subagent-driven-development` | Replace body with SP's: ledger/recovery discipline, pre-flight conflict scan, task loop, 5-round fix-loop circuit breaker, adjudication rules, batching, final review, "Rulings I made" hand-off. Keep A Team's Model-Selection table but map tiers to [`.claude/rules/performance.md`](../../rules/performance.md). Rewrite `superpowers:finishing-a-development-branch` → `finishing-a-development-branch`, `superpowers:using-git-worktrees` → `using-git-worktrees`. The SP final-review step points at `superpowers:requesting-code-review`'s `code-reviewer.md`; since that skill is **not** ported, retarget it to **the `code-reviewer` agent** (`.claude/agents/code-reviewer.md`) — dispatch that agent for the whole-branch review. Remap the SP scratch dir `.superpowers/sdd/<plan>/` → `.agent-sync/sdd/<plan>/` (add `.agent-sync/sdd/` to `.gitignore`). | `scripts/sdd-workspace`, `scripts/task-brief`, `scripts/review-package`, `implementer-prompt.md`, `task-reviewer-prompt.md`, `re-review-prompt.md` |
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

### 4.2 New skill to port from `superpowers`

| Skill | Why it is not a duplicate | Boundary vs existing A Team primitives |
|---|---|---|
| `receiving-code-review` | No A Team equivalent. Governs how the *recipient* evaluates feedback (verify before implementing, technical pushback, no performative agreement). | **Complementary** to the `code-reviewer` agent and `/code-review`: those *produce* findings; this skill governs *acting on* them. Pairs with `.claude/rules/coding-style.md` "Surgical Changes". |

Ported from `superpowers` 6.3.0 with A Team frontmatter style and `superpowers:`
prefixes stripped. Canonical skill count becomes **25**.

`requesting-code-review` is **deferred** (§8): the `code-reviewer` agent,
`/code-review`, and `/quality-gate` step 2 already own review dispatch, and
`skill-duplication-audit` cannot formally adjudicate a skill-vs-agent pair. If a
gap surfaces during use, port it then.

### 4.3 Command surface (Workstream D)

**Keep all 10 existing commands.** Add:

| New command | Type | Composes |
|---|---|---|
| `/skills` | Dispatcher / index | Lists all 25 skills: exact invoke token, one-line trigger, executing agent(s), related command(s). Body instructs: "to run one, invoke `Skill(<name>)`". |
| `/adr` | Thin alias | `adr` skill |
| `/incident-response` | Thin alias | `incident-response` skill |
| `/architecture-review` | Thin alias | `architecture-review` skill |

Wire `receiving-code-review` into the review commands:
[`/code-review`](../../commands/code-review.md) and
[`/quality-gate`](../../commands/quality-gate.md) each gain a "Reception
protocol" line → when acting on findings, follow `receiving-code-review`.

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

0. **Spike first (Phase 0, §9).** Symlink one skill (`verification-before-completion`),
   reload the session, confirm `Skill(verification-before-completion)` returns the
   A Team body and not `superpowers:`. If it does **not**, stop — the approach is
   invalid; bring the observed failure mode back for a re-decision.
1. **Symlink** the 11 merged skills + `receiving-code-review` into
   `.claude/skills/<name>`. The existing symlinks are git-tracked as mode
   `120000` (verified via `git ls-files -s`); create the new ones the same way
   (`ln -s ../../skills/<name> <name>` in Git Bash, then confirm
   `git ls-files -s` shows `120000` — if `ln -s` produced a copy, use
   `git update-index --add --cacheinfo 120000,$(git hash-object -w <target>),<path>`).
   Result: **25/25** resolve to the A Team version by bare name; `react-aria`
   symlink stays.
2. **Permissions:** add to `permissions.allow` in `.claude/settings.json`, both
   `Skill(<name>)` and `Skill(<name>:*)` forms:
   `adr`, `architecture-design`, `architecture-review`, `managing-github-actions`,
   `scalability-review`, `receiving-code-review`. (`settings.local.json` has no
   blanket `Skill(*)` and no `deny`/`ask` for skills — verified — so this file is
   the operative gate.)
3. **Reload gate.** Symlinks and allow-list changes do not take effect in a
   running session. Reload/restart before the invocation checks.
4. **Verify** each of the 25 resolves un-prefixed and un-prompted (see §7).

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
| **Defer to `superpowers` for the 11, delete local forks** | Loses eval-tested A Team refinements (`writing-plans`, `systematic-debugging`, `verification-before-completion` are stronger locally); hard runtime dependency on the plugin staying installed and version-pinned. (Remains the **Plan B** if the Phase-0 spike fails — decided at the gate.) |
| **Symlink the 11 stripped forks as-is** | Bodies reference files that would 404 (`visual-companion.md`, `writing-good-tests.md`, prompt templates). Latent breakage. |
| **One command file per skill (25 files)** | Redundant with harness `/<name>` skill invocation; near-identical shims to maintain; `/skills` index is more discoverable. |
| **Stub the 7 phantom language reviewers** | This is a React 18 / TypeScript SPA. Seven unused personas is noise; `using-a-team` says add on demand. |
| **Port `requesting-code-review` too** | Overlaps the `code-reviewer` agent + `/quality-gate` dispatch; `skill-duplication-audit` can't adjudicate skill-vs-agent. Deferred, not rejected. |

---

## 6. Risks and rollback

| Risk | Mitigation | Rollback |
|---|---|---|
| **A project `.claude/skills/<name>` symlink does not actually shadow the plugin's `superpowers:<name>`** — the load-bearing assumption is unverified | **Phase-0 spike** (§9): symlink one skill, reload, check resolution before any merge work. Abort criteria explicit. | n/a — the spike gates everything after it; Plan B decided at the gate (§5). |
| Symlinks / allow-list don't take effect in the running session | Explicit **reload gate** after Phase 4 (§4.5 step 3); invocation checks run only post-reload. Execution mode accounts for a controller not being able to self-restart (§9). | n/a |
| A merged body changes behaviour of a skill mid-workflow | Merge is additive (SP material into A Team base) except `brainstorming` and `subagent-driven-development`, which are full SP adoptions under `writing-skills` RED→GREEN→REFACTOR (§3.3) with before/after behavioural baselines. | `git revert` the skill commit; symlink removal restores `superpowers:` resolution. |
| `writing-skills` itself is merged (§3.2 #11) before it is used to govern the two full adoptions (§3.3) | Sequence: Task 1.6 completes and is verified before Phase 2 starts; the merge is additive-only. | `git revert` Task 1.6; the full adoptions can proceed against the pre-merge `writing-skills`. |
| SP `subagent-driven-development` scripts write scratch to `.superpowers/sdd/` which this repo does **not** gitignore | Remap to `.agent-sync/sdd/`; add `.agent-sync/sdd/` to `.gitignore` (§3.2 #5). | delete the stray dir; `git rm --cached` if committed. |
| superpowers plugin updates off 6.3.0 mid-implementation → every merge-source path breaks | Phase 0 snapshots `superpowers/6.3.0/skills/` into an in-repo dir; all merges read the snapshot, not the live plugin cache. | n/a — snapshot is immutable in the branch. |
| Symlink form wrong on Windows (`ln -s` makes a copy) | Existing symlinks are git-tracked as mode `120000` (verified); §4.5 step 1 checks `git ls-files -s` and falls back to `git update-index --cacheinfo 120000`. | `rm` the entry; skill falls back to `superpowers:`. |
| Editing session-injected `using-a-team/SKILL.md` drops a real trigger row | Task verifies row-count and `git diff` of the trigger tables — only target rows may change. | `git checkout skills/using-a-team/SKILL.md`. |
| `Skill()` allow-list entry typo silently re-introduces prompts | §7 verification invokes each of the 26. | Edit `settings.json`; no history rewrite. |
| Deleting `chief-of-staff` breaks a hook/command reference | Grep for `chief-of-staff` before delete. | `git checkout` the file. |
| `.codex/config.toml` has no skills table — nothing to reconcile there | Confirmed: it holds MCP server config only. AGENTS.md is the Codex-facing surface. | n/a |
| Ported `scripts/` are bash; repo is Windows/PowerShell-primary | Scripts run under the Bash tool (Git Bash) which the repo already uses. Mark any that need `python`/`sh` in the traceability doc. | Skills degrade to their no-script path (SP bodies document it). |

---

## 7. Success criteria

- [ ] **Phase-0 spike passed**: a single project symlink shadows the plugin skill; `Skill(verification-before-completion)` returns the A Team body. (If failed — this spec is superseded by the gate decision.)
- [ ] `skill-duplication-audit` table (§3.1) committed in this spec; all 11 pairs classified with merge direction.
- [ ] 25 `skills/*/SKILL.md` exist; the 11 merged ones carry the provenance comment; no `superpowers:` prefixes remain in any A Team `SKILL.md`.
- [ ] `brainstorming` and `subagent-driven-development` replacements completed under `writing-skills` RED→GREEN→REFACTOR (§3.3): baseline behaviour recorded, preserved-items 1–5 present, `writing-skills` §9 validation checklist passed for each.
- [ ] Every supporting file listed in §3.2 and §4.2 exists at the stated path; no dangling in-body reference (grep each `SKILL.md` for `.md)` / `.sh` / `.ts` refs and confirm the target exists).
- [ ] `.claude/skills/` contains 25 skill symlinks (+ `react-aria`), each git-tracked as mode `120000` and pointing at `../../skills/<name>`.
- [ ] `.claude/settings.json` `permissions.allow` contains `Skill(<name>)` + `Skill(<name>:*)` for all 25 (50 entries).
- [ ] After a session reload: invoking each of the 25 by bare name resolves to the A Team body (spot-check 5, including 3 formerly-shadowed) with no permission prompt.
- [ ] `.claude/agents/chief-of-staff.md` deleted; `grep -r chief-of-staff` over `**/*.md`, `**/*.json`, `**/*.toml`, `hooks/`, `scripts/` clean.
- [ ] `using-a-team/SKILL.md`: no `go-/rust-/kotlin-/swift-/flutter-/database-/ai-reviewer`, no `data-migration`; `doc-updater`, `e2e-runner`, `tdd-guide`, `typescript-reviewer`, `refactor-cleaner` present; 25 skills in trigger tables; `git diff` shows only intended trigger rows changed.
- [ ] `CLAUDE.md`, `AGENTS.md` skills tables list all 25; `.claude/rules/` (agents.md, orchestration.md, patterns.md, performance.md) reference only real agents/skills and state the §4.1 responsibility model.
- [ ] `.claude/commands/` has 14 files: 10 existing + `/skills`, `/adr`, `/incident-response`, `/architecture-review`. `/code-review` and `/quality-gate` reference `receiving-code-review`.
- [ ] `.claude/docs/traceability.md` committed: skill table (25 rows), agent table (17 rows), command table (14 rows); every row's cross-references resolve.
- [ ] Every agent `model:` matches its [`.claude/rules/performance.md`](../../rules/performance.md) tier, or a deliberate exception is noted in the traceability doc.
- [ ] Repo validation gate unaffected: `npm run test:ci` behaviour unchanged (A Team files are outside the lint/test scope — `lint:mdx` covers only `.storybook/**` and `ClientApp/src/**` `.mdx`). New Markdown follows the `| --- |` table style used in `CLAUDE.md` / `AGENTS.md`.

---

## 8. Out of scope / deferred

- **`requesting-code-review`** — deferred. The `code-reviewer` agent + `/code-review` + `/quality-gate` step 2 already own review dispatch. Port it only if a concrete gap appears in use.
- `superpowers:using-superpowers` — a harness bootstrap skill; not an A Team concern.
- Any change to `.claude/settings.json` hooks or `scripts/*.py` enforcement.
- Porting `superpowers` `elements-of-style:*` referenced in its `brainstorming` body — replace that reference with "write concisely" prose.
- Automated CI check that `.claude/skills/` stays in sync with `skills/` — worth a follow-up issue, not this change.
- Rewriting agent bodies beyond the `model:` tier check.
- Disabling or pinning the `superpowers` plugin globally — out of this repo's control; the symlink-shadow approach avoids needing it.

---

## 9. Delivery

### 9.1 Phase 0 — spike gate

Before any merge work: snapshot `superpowers/6.3.0/skills/` into the repo,
symlink **one** skill (`verification-before-completion`), reload the session, and
confirm `Skill(verification-before-completion)` returns the A Team body (carrying
the provenance comment) and not `superpowers:`.

- **Pass** → proceed to PR1.
- **Fail** → stop. Report the observed resolution behaviour. Plan B is decided at
  this gate (candidates in §5: defer-to-superpowers with upstream merges;
  rename the forks `ateam-*`; investigate a global plugin control). Do not
  continue on this spec.

### 9.2 Two PRs

The plan's phases are **not** independently mergeable as one unit, so the work
ships as two branches:

| PR | Branch | Phases | Delivers | Independently verifiable |
|---|---|---|---|---|
| **PR1** | `feat/a-team-skills-canonical` (this branch, continued) | 0–4 | 25/25 skills resolve to the A Team version, unshadowed, unprompted; merged bodies + support files; `receiving-code-review` ported | Yes — spike + resolution spot-checks + reference-integrity + `settings.json` valid |
| **PR2** | `feat/a-team-agents-commands-docs` (from PR1 tip or `main` after PR1 merges) | 5–7 | `chief-of-staff` removed; phantom refs purged; real agents listed; `/skills` + 3 alias commands; `traceability.md`; `CLAUDE.md` / `AGENTS.md` / `using-a-team` / `.claude/rules` / `.codex` reconciled | Yes — grep sweeps + doc cross-reference resolution |

PR1 carries this spec, the plan, and the Phase-0 RED baselines. PR2's doc
reconciliation (skill counts, agent roster) assumes PR1 is merged.

### 9.3 Execution mode

**Subagent-driven + user restart.** A subagent-driven controller cannot restart
its own session, and symlinks/allow-list need a reload:

1. `subagent-driven-development` runs **Phase 1** (6 parallel-safe tasks) and
   **Phase 3** (1 task); the two full-body adoptions in **Phase 2** each get
   their own subagent + review seat.
2. The **main session** applies **Phase 4** (symlinks + `settings.json`).
3. **User reloads / restarts** the session.
4. The **main session** runs the Phase 4 verification and, for PR2,
   `subagent-driven-development` for **Phases 5–7**, then Phase 8 +
   `finishing-a-development-branch`.

`brainstorming` and `subagent-driven-development` full-body adoptions run under
`writing-skills` (§3.3): RED baseline captured before the replacement, the §9
validation checklist as the phase gate. Note these two Phase-2 tasks are large
(250–568-line body swap + 5–6 support files + checklist + behavioural diff) —
~30–60 min each, not the plan's nominal "2–5 min per step".
