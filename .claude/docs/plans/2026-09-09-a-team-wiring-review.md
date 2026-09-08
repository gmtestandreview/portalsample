# A Team Wiring Review — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. **The main session — not a subagent — runs Phase 0 Task 0.2, all of Phase 4, and the reload gate**, because a subagent controller cannot restart its own session.

**Goal:** Make all 25 canonical A Team skills resolve to the A Team version by bare name — unshadowed by the `superpowers` plugin, unprompted by permissions — with full command/agent traceability and reconciled docs.

**Architecture:** Merge `superpowers` 6.3.0 material into the 11 A Team skill forks (9 additive, 2 full-body replacements governed by `writing-skills`), port `receiving-code-review`, symlink all 25 into `.claude/skills/`, complete the `Skill()` allow-list, delete one stray agent, purge phantom agent references, add one `/skills` dispatcher plus 3 thin command aliases, and write a `command ↔ skill ↔ agent ↔ rule` matrix. No product code, no `superpowers` plugin files, no hook/MCP changes.

**Tech Stack:** Markdown skill/agent/command definitions; JSON (`.claude/settings.json`); git-tracked POSIX symlinks (mode `120000`); bash + `python3`/`pyyaml` (both verified present) verification one-liners. No compiler, no test framework.

**Spec:** [.claude/docs/specs/2026-09-09-a-team-wiring-review-design.md](../specs/2026-09-09-a-team-wiring-review-design.md) (rev r3) — read it alongside this plan; each task's requirements are the spec section it cites.

## Global Constraints

- Canonical skill count is **25**: the existing 24 in `skills/**` plus ported `receiving-code-review`. `requesting-code-review` is **not** ported (spec §8).
- **Phase 0 is a gate.** If the symlink-shadow spike (Task 0.2) fails, stop and escalate — do not run Phase 1+.
- Every merged `skills/<name>/SKILL.md` starts with the verbatim comment: `<!-- A Team fork. Merged from superpowers 6.3.0 on 2026-09-09. See .claude/docs/specs/2026-09-09-a-team-wiring-review-design.md -->` (ported `receiving-code-review` uses `<!-- Ported from superpowers 6.3.0 on 2026-09-09. ... -->`).
- No `superpowers:` prefix may remain anywhere under `skills/**` after this plan. Cross-references use the bare skill name or an agent name that exists in `.claude/agents/**`.
- Merge source is the **in-repo snapshot** `$SNAP = .claude/docs/plans/_sp-6.3.0-snapshot/` created in Task 0.1 — never the live plugin cache.
- Spec/plan/doc paths in skill bodies are `.claude/docs/specs/` and `.claude/docs/plans/` — never `docs/superpowers/`. SDD scratch is `.agent-sync/sdd/` (git-ignored) — never `.superpowers/`.
- `.claude/skills/<name>` entries must be git-tracked symlinks (mode `120000`) of relative form `../../skills/<name>`. The `react-aria` entry is left untouched.
- Agent model tiers per [.claude/rules/performance.md](../../rules/performance.md): Tier 1 `opus` = `orchestrator`, `architect`; Tier 3 `haiku` = `doc-updater`, `harness-optimizer`, `performance-profiler`; all others Tier 2 `sonnet`.
- **PR split:** PR1 = Phases 0–4 on branch `feat/a-team-skills-canonical` (this branch, `feat/a-team-wiring-review`, continued and renamed at handoff). PR2 = Phases 5–7 on `feat/a-team-agents-commands-docs` from PR1's tip. Commit after every task. Never commit to `main`.

## Requirements Traceability

| Spec requirement | Task(s) | Validation |
|---|---|---|
| §9.1 spike gate | 0.2 | `Skill(verification-before-completion)` returns A Team body post-reload |
| §3.1 audit table committed | (in spec) | `grep -c '| True duplicate |'` = 11 |
| §3.2 #2,3,8,9 additive text merges | 1.1 | provenance + no `superpowers:` in the 4 files |
| §3.2 #4 finishing-a-development-branch + worktree-cleanup.md | 1.2 | file exists; body links it |
| §3.2 #6 systematic-debugging + 4 support files | 1.3 | files exist; body refs resolve |
| §3.2 #7 test-driven-development + writing-good-tests.md | 1.4 | file exists; body refs resolve |
| §3.2 #10 writing-plans + plan-document-reviewer-prompt.md | 1.5 | file exists; body refs resolve |
| §3.2 #11 writing-skills + 3 support files + "Match the Form" | 1.6 | files exist; section present — **must finish before Phase 2** |
| §3.3 brainstorming full adoption | 2.1 | RED + after baselines; `writing-skills` §9 checklist |
| §3.3 subagent-driven-development full adoption | 2.2 | RED + after baselines; `writing-skills` §9 checklist; `.agent-sync/sdd/` remap; final-review → `code-reviewer` agent |
| §4.2 port receiving-code-review | 3.1 | resolves un-prefixed post-reload |
| §4.5.1 symlink 12 skills into `.claude/skills/` | 4.1 | `git ls-files -s .claude/skills` shows 12 new `120000` entries |
| §4.5.2 allow-list 6 names (12 entries) | 4.2 | `grep -c` Skill entries = 50; JSON valid |
| §4.5.3 reload gate | 4.3 | main session; user restarts |
| §4.5.4 25/25 resolve un-prefixed, un-prompted | 4.4 | spot-check invocations post-reload |
| §4.4 delete chief-of-staff | 5.1 | file gone; wide grep clean |
| §4.4 model-tier check | 5.2 | report table feeds 7.5 |
| §4.4 purge phantom refs, list real agents | 7.1 | grep negatives + positives; `git diff` scoped |
| §4.3 `/skills` dispatcher | 6.1 | 25 data rows |
| §4.3 `/adr` `/incident-response` `/architecture-review` | 6.2 | 3 files exist |
| §4.3 wire receiving-code-review into `/code-review`, `/quality-gate` | 6.3 | grep skill name in both |
| §4.1 primitive responsibility model in rules | 7.4 | section present in `.claude/rules/patterns.md` |
| §4.6 traceability.md | 7.5 | 25 skill + 17 agent + 14 command rows |
| §8 `.codex` no change (documented) | 7.6 | note in traceability doc |
| §7 full success checklist | 8.1 | every box ticked |
| CLAUDE.md / AGENTS.md 25 skills | 7.2, 7.3 | `grep -c` skill rows = 25 in each |

## Repository Findings (verified 2026-09-09)

- `.claude/skills/` holds 13 skill symlinks + `react-aria`; `git ls-files -s .claude/skills` shows the symlinks as mode `120000`, target form `../../skills/<name>`.
- `.claude/settings.json` `permissions.allow` is a JSON string array: 19 `Skill(<name>)` + 19 `Skill(<name>:*)`. Missing: `adr`, `architecture-design`, `architecture-review`, `managing-github-actions`, `scalability-review`.
- `.claude/settings.local.json` `permissions.allow` holds only PowerShell one-offs — **no** `Skill(*)`, no `deny`/`ask`. `settings.json` is the operative skill gate. `settings.local.json` `enabledPlugins` lists `ralph-loop`, `playwright`, `code-simplifier` — not `superpowers` (enabled globally elsewhere; no project lever to disable it).
- `python3` = 3.14.7 with `pyyaml`; `node` = 24.20 — frontmatter-parse checks are safe.
- `skills/brainstorming/` and `skills/subagent-driven-development/` contain **only** `SKILL.md` — no `evals/`.
- `skills/writing-skills/references/` already has `persuasion-principles.md` and `testing-skills-with-subagents.md` — do NOT re-port.
- `.gitignore` ignores only `.agent-sync/logs/` — **`.superpowers/` and `.agent-sync/sdd/` are NOT ignored** (Task 2.2 adds `.agent-sync/sdd/`).
- `.claude/agents/` has 18 files incl. `chief-of-staff.md`; no `go-/rust-/kotlin-/swift-/flutter-/database-/ai-reviewer`. `grep` for `chief-of-staff` in `*.toml`/`*.sh`/`*.py` is clean.
- `.claude/commands/` has 10 files, no frontmatter (plain `# /name`).
- `npm run lint:mdx` covers only `.storybook/**` + `ClientApp/src/**` `.mdx` — nothing in this plan is in a lint/test gate.
- superpowers ships NO agents.

## File Structure

**Created:**

| Path | Responsibility |
|---|---|
| `.claude/docs/plans/_sp-6.3.0-snapshot/` | Frozen copy of `superpowers/6.3.0/skills/` — the merge source of truth |
| `.claude/docs/plans/_red-baselines/*.md` | RED + after behavioural transcripts for Tasks 2.1, 2.2 |
| `skills/finishing-a-development-branch/references/worktree-cleanup.md` | SP git-worktree detection + cleanup bash |
| `skills/systematic-debugging/references/{root-cause-tracing,condition-based-waiting,defense-in-depth}.md` + `condition-based-waiting-example.ts` + `scripts/find-polluter.sh` | SP debugging technique set |
| `skills/test-driven-development/references/writing-good-tests.md` | rules that keep tests honest |
| `skills/writing-plans/references/plan-document-reviewer-prompt.md` | reviewer prompt for plan docs |
| `skills/writing-skills/references/{anthropic-best-practices.md,graphviz-conventions.dot}` + `scripts/render-graphs.js` | SP skill-authoring support |
| `skills/brainstorming/visual-companion.md`, `spec-document-reviewer-prompt.md`, `scripts/*` | SP brainstorming support set |
| `skills/subagent-driven-development/scripts/{sdd-workspace,task-brief,review-package}` + `implementer-prompt.md`, `task-reviewer-prompt.md`, `re-review-prompt.md` | SP SDD support set |
| `skills/receiving-code-review/SKILL.md` | how to evaluate incoming review feedback |
| `.claude/skills/<name>` (12 new symlinks) | resolve merged/ported skills to the A Team version |
| `.claude/commands/skills.md`, `adr.md`, `incident-response.md`, `architecture-review.md` | dispatcher index + 3 thin aliases |
| `.claude/docs/traceability.md` | command ↔ skill ↔ agent ↔ rule matrix |

**Modified:**

| Path | Change |
|---|---|
| `skills/{dispatching-parallel-agents,executing-plans,using-git-worktrees,verification-before-completion}/SKILL.md` | additive text merge + provenance + prefix strip |
| `skills/{finishing-a-development-branch,systematic-debugging,test-driven-development,writing-plans,writing-skills}/SKILL.md` | additive merge + reference new support files + provenance |
| `skills/{brainstorming,subagent-driven-development}/SKILL.md` | full-body replacement (§3.3) |
| `.gitignore` | + `.agent-sync/sdd/` |
| `.claude/settings.json` | +12 `Skill()` allow entries (6 names × 2 forms) |
| `.claude/commands/{code-review,quality-gate}.md` | reference `receiving-code-review` |
| `skills/using-a-team/SKILL.md` | purge phantom agents + `data-migration`; add real agents; 25 skills; responsibility-model pointer |
| `CLAUDE.md`, `AGENTS.md` | skills tables → 25 rows |
| `.claude/rules/{agents.md,orchestration.md,patterns.md,performance.md}` | real refs only; responsibility model in `patterns.md` |

**Deleted:** `.claude/agents/chief-of-staff.md` (unrelated — multi-channel comms triage).

---

## Phase 0 — Snapshot + spike gate  *(main session; PR1 branch)*

#### Task 0.1: Snapshot the superpowers 6.3.0 skill source

**Files:** Create `.claude/docs/plans/_sp-6.3.0-snapshot/`

- [ ] **Step 1: Copy the source**

```bash
SP="C:/Users/gregm/.claude/plugins/cache/claude-plugins-official/superpowers/6.3.0/skills"
mkdir -p .claude/docs/plans/_sp-6.3.0-snapshot
cp -r "$SP"/. .claude/docs/plans/_sp-6.3.0-snapshot/
ls .claude/docs/plans/_sp-6.3.0-snapshot   # expect 14 skill dirs
```

- [ ] **Step 2: Commit**

```bash
git add .claude/docs/plans/_sp-6.3.0-snapshot .claude/docs/plans/2026-09-09-a-team-wiring-review.md
git commit -m "chore: snapshot superpowers 6.3.0 skills as the merge source of truth"
```

#### Task 0.2: Symlink-shadow spike  *(GATE)*

**Files:** Create `.claude/skills/verification-before-completion` (symlink)

- [ ] **Step 1: Create one symlink**

```bash
cd .claude/skills && ln -s ../../skills/verification-before-completion verification-before-completion && cd ../..
git ls-files -s .claude/skills/verification-before-completion   # want: 120000 ...
# if NOT 120000:
#   rm .claude/skills/verification-before-completion
#   git update-index --add --cacheinfo 120000,$(printf '../../skills/verification-before-completion' | git hash-object -w --stdin),.claude/skills/verification-before-completion
#   git checkout -- .claude/skills/verification-before-completion
```

- [ ] **Step 2: Reload the session**

Main session: tell the user to restart / reload so the new `.claude/skills/` entry is picked up. Wait for confirmation.

- [ ] **Step 3: Check resolution**

Invoke `Skill(verification-before-completion)`. Inspect the loaded body.
- **PASS:** body is the A Team version (108-line rewrite; "Claim-matched evidence" table) and the skill list no longer shows a separate `superpowers:verification-before-completion`, OR shows both but the bare name resolved local.
- **FAIL:** body is the `superpowers` version, or an error, or the bare name still routes to the plugin.

- [ ] **Step 4: Decide**

- PASS → commit the spike symlink, proceed to Phase 1.
  ```bash
  git add .claude/skills/verification-before-completion
  git commit -m "spike: confirm project skill symlink shadows superpowers plugin skill"
  ```
- FAIL → **STOP.** Write the observed behaviour into `.claude/docs/plans/_red-baselines/spike-result.md`, revert the symlink, and escalate to the user with Plan B options (spec §5). Do not run Phase 1.

#### Task 0.3: RED baselines for the two full adoptions

**Files:** Create `.claude/docs/plans/_red-baselines/{brainstorming,subagent-driven-development}-before.md`

- [ ] **Step 1: `brainstorming` RED baseline**

With the pre-merge skill resolving (spike symlink is for `verification-before-completion` only, so `brainstorming` still routes to `superpowers:` — fine, that IS the baseline), run the prompt: `"Let's build a small CSV export button for the applications list."` Record: path classification announced? clarifying questions (one at a time)? approval gate before code? → `brainstorming-before.md`.

- [ ] **Step 2: `subagent-driven-development` RED baseline**

Prompt: `"Execute this 2-task plan: (1) add a formatDate util with a test, (2) use it in appDetails.tsx."` Record: ledger file created? fresh subagent per task? two-stage (spec + quality) review each? → `subagent-driven-development-before.md`.

- [ ] **Step 3: Commit**

```bash
git add .claude/docs/plans/_red-baselines
git commit -m "docs: RED baselines for brainstorming + subagent-driven-development"
```

---

## Phase 1 — Additive skill merges  *(subagent-driven; PR1 branch)*

> Tasks 1.1–1.5 are parallel-safe (disjoint directories). **Task 1.6 must complete and verify before Phase 2 starts** — Phase 2 uses `writing-skills`.

#### Task 1.1: Additive text merges — 4 skills, no new files

**Files:** Modify `skills/{dispatching-parallel-agents,executing-plans,using-git-worktrees,verification-before-completion}/SKILL.md`

- [ ] **Step 1:** Read each of `$SNAP/<name>/SKILL.md` in full before editing.
- [ ] **Step 2: `dispatching-parallel-agents`** — after the H1, insert the snapshot body's `## Overview` paragraph (isolated-context framing) and its `## When to Use` ```dot``` digraph; keep all existing A Team sections.
- [ ] **Step 3: `executing-plans`** — add the snapshot's `## When to Revisit Earlier Steps`; add a first sub-step to "Step 1": *"Ensure an isolated workspace — use the `using-git-worktrees` skill to create or verify one."*; ensure refs are bare (`using-git-worktrees`, `subagent-driven-development`, `finishing-a-development-branch`).
- [ ] **Step 4: `using-git-worktrees`** — `diff` body vs snapshot; adopt any snapshot edge case not present (expected: none).
- [ ] **Step 5: `verification-before-completion`** — add any snapshot "Rationalization" row not already in the table.
- [ ] **Step 6:** Add the provenance comment as the first body line of all 4.
- [ ] **Step 7: Verify**

```bash
for s in dispatching-parallel-agents executing-plans using-git-worktrees verification-before-completion; do
  head -3 "skills/$s/SKILL.md" | grep -q 'Merged from superpowers 6.3.0' && echo "$s provenance OK" || echo "$s PROVENANCE MISSING"
  grep -n 'superpowers:' "skills/$s/SKILL.md" && echo "$s PREFIX LEAK" || echo "$s no prefix OK"
done
```

- [ ] **Step 8: Commit** — `git add` the 4 dirs; `git commit -m "feat: additive superpowers merges into 4 A Team skills (no new files)"`

#### Task 1.2: finishing-a-development-branch

**Files:** Modify `skills/finishing-a-development-branch/SKILL.md`; Create `skills/finishing-a-development-branch/references/worktree-cleanup.md`

- [ ] **Step 1:** Create `references/worktree-cleanup.md` = snapshot `finishing-a-development-branch` **Step 2 (Detect Environment)** + **Step 6 (Cleanup Workspace)** verbatim, with a one-line heading `# Worktree cleanup mechanics (concrete bash for the parent skill's cleanup step)`.
- [ ] **Step 2:** Append a `## Common Rationalizations` section to `SKILL.md` (6 rows: "Tests passed earlier"; "They obviously want it merged"; "base branch is obviously main"; "`--force` finishes cleanup"; "merged-result failure is flaky"; "force-push will fix the rejected push") — wording from the snapshot, `your human partner` → `the user`.
- [ ] **Step 3:** In step 7 of the workflow add: `For git-worktree detection and cleanup mechanics, see [references/worktree-cleanup.md](references/worktree-cleanup.md).`
- [ ] **Step 4:** Provenance comment.
- [ ] **Step 5: Verify**

```bash
test -f skills/finishing-a-development-branch/references/worktree-cleanup.md && echo ref OK
grep -q 'references/worktree-cleanup.md' skills/finishing-a-development-branch/SKILL.md && echo link OK
grep -q 'Merged from superpowers 6.3.0' skills/finishing-a-development-branch/SKILL.md && echo provenance OK
grep -n 'superpowers:\|your human partner' skills/finishing-a-development-branch/ -r || echo clean OK
```

- [ ] **Step 6: Commit** — `git commit -m "feat: merge superpowers worktree-cleanup + rationalizations into finishing-a-development-branch"`

#### Task 1.3: systematic-debugging

**Files:** Modify `skills/systematic-debugging/SKILL.md`; Create `references/{root-cause-tracing,condition-based-waiting,defense-in-depth}.md`, `references/condition-based-waiting-example.ts`, `scripts/find-polluter.sh`

- [ ] **Step 1: Copy support files from the snapshot**

```bash
mkdir -p skills/systematic-debugging/references skills/systematic-debugging/scripts
cd .claude/docs/plans/_sp-6.3.0-snapshot/systematic-debugging
cp root-cause-tracing.md condition-based-waiting.md condition-based-waiting-example.ts defense-in-depth.md "$OLDPWD/skills/systematic-debugging/references/"
cp find-polluter.sh "$OLDPWD/skills/systematic-debugging/scripts/"
cd "$OLDPWD"
```
Do NOT copy `test-*.md` or `CREATION-LOG.md`.

- [ ] **Step 2:** In the 4 `.md` files, rewrite `superpowers:<name>` → bare, and sibling refs → `references/<file>`. `grep -rn 'superpowers:' skills/systematic-debugging/references/ || echo clean`
- [ ] **Step 3:** Append the snapshot "Common Rationalizations" table and the "Signals the approach is wrong" list (retitled, no possessive) before `## Completion Criteria`.
- [ ] **Step 4:** Add references from the body: Phase 1 → `root-cause-tracing.md`; Phase 4 → `defense-in-depth.md`, `condition-based-waiting.md`; add `## Supporting Techniques` listing all 4 + `scripts/find-polluter.sh` with load conditions.
- [ ] **Step 5:** Provenance comment. Verify:

```bash
for f in $(grep -oE 'references/[a-z-]+\.(md|ts)|scripts/[a-z-]+\.sh' skills/systematic-debugging/SKILL.md | sort -u); do
  test -f "skills/systematic-debugging/$f" && echo "OK $f" || echo "MISSING $f"
done
grep -q 'Merged from superpowers 6.3.0' skills/systematic-debugging/SKILL.md && echo provenance OK
```

- [ ] **Step 6: Commit** — `git commit -m "feat: port superpowers debugging technique files + tables into systematic-debugging"`

#### Task 1.4: test-driven-development

**Files:** Modify `skills/test-driven-development/SKILL.md`; Create `skills/test-driven-development/references/writing-good-tests.md`

- [ ] **Step 1:** `mkdir -p skills/test-driven-development/references && cp .claude/docs/plans/_sp-6.3.0-snapshot/test-driven-development/writing-good-tests.md skills/test-driven-development/references/`; strip `superpowers:` refs inside.
- [ ] **Step 2:** Append snapshot `## Common Rationalizations` and `## When Stuck` tables; add the RED-GREEN-REFACTOR ```dot``` digraph near "Core rule".
- [ ] **Step 3:** In "Test design rules" add: `When writing or changing any test, read [references/writing-good-tests.md](references/writing-good-tests.md).`
- [ ] **Step 4:** Provenance comment. Verify:

```bash
test -f skills/test-driven-development/references/writing-good-tests.md && echo ref OK
grep -q 'references/writing-good-tests.md' skills/test-driven-development/SKILL.md && echo link OK
grep -qi 'When Stuck' skills/test-driven-development/SKILL.md && echo table OK
grep -n 'superpowers:' skills/test-driven-development/SKILL.md || echo no prefix OK
```

- [ ] **Step 5: Commit** — `git commit -m "feat: port writing-good-tests + rationalization tables into test-driven-development"`

#### Task 1.5: writing-plans

**Files:** Modify `skills/writing-plans/SKILL.md`; Create `skills/writing-plans/references/plan-document-reviewer-prompt.md`

- [ ] **Step 1:** `mkdir -p skills/writing-plans/references && cp .claude/docs/plans/_sp-6.3.0-snapshot/writing-plans/plan-document-reviewer-prompt.md skills/writing-plans/references/`; strip `superpowers:` refs.
- [ ] **Step 2:** In the "Challenge the plan" / "Self-Review" section add: `For an independent review pass, dispatch a reviewer with [references/plan-document-reviewer-prompt.md](references/plan-document-reviewer-prompt.md).` Body otherwise unchanged (already the stronger version).
- [ ] **Step 3:** Provenance comment. Verify:

```bash
test -f skills/writing-plans/references/plan-document-reviewer-prompt.md && echo ref OK
grep -q 'plan-document-reviewer-prompt.md' skills/writing-plans/SKILL.md && echo link OK
grep -n 'superpowers:' skills/writing-plans/SKILL.md || echo no prefix OK
```

- [ ] **Step 4: Commit** — `git commit -m "feat: add plan-document-reviewer-prompt reference to writing-plans"`

#### Task 1.6: writing-skills  *(critical path — finish before Phase 2)*

**Files:** Modify `skills/writing-skills/SKILL.md`, `skills/writing-skills/references/index.md`; Create `references/{anthropic-best-practices.md,graphviz-conventions.dot}`, `scripts/render-graphs.js`

- [ ] **Step 1:** Copy the 3 not-already-present files:

```bash
mkdir -p skills/writing-skills/scripts
cp .claude/docs/plans/_sp-6.3.0-snapshot/writing-skills/anthropic-best-practices.md skills/writing-skills/references/
cp .claude/docs/plans/_sp-6.3.0-snapshot/writing-skills/graphviz-conventions.dot    skills/writing-skills/references/
cp .claude/docs/plans/_sp-6.3.0-snapshot/writing-skills/render-graphs.js            skills/writing-skills/scripts/
```
Do NOT copy `persuasion-principles.md`, `testing-skills-with-subagents.md`, `CLAUDE_MD_TESTING.md`.

- [ ] **Step 2:** Insert the snapshot's `## Match the Form to the Failure` section (4-row failure→form table + "why prohibitions backfire" + "no nuance clauses") after the existing `### 7. Match instruction form to failure` step; reconcile so the two don't contradict (SP table = the detailed version of the existing step).
- [ ] **Step 3:** Update `references/index.md` lookup rules to add `anthropic-best-practices.md` (load: Anthropic-specific authoring) and `graphviz-conventions.dot` (load: adding a flowchart); note `scripts/render-graphs.js`.
- [ ] **Step 4:** Provenance comment. Verify:

```bash
for f in references/anthropic-best-practices.md references/graphviz-conventions.dot scripts/render-graphs.js; do
  test -f "skills/writing-skills/$f" && echo "OK $f" || echo "MISSING $f"
done
grep -qi 'Match the Form to the Failure' skills/writing-skills/SKILL.md && echo section OK
grep -n 'superpowers:' skills/writing-skills/SKILL.md || echo no prefix OK
python3 -c "import yaml; d=yaml.safe_load(open('skills/writing-skills/SKILL.md').read().split('---')[1]); assert d['name']=='writing-skills'; print('frontmatter OK')"
```

- [ ] **Step 5: Commit** — `git commit -m "feat: port anthropic-best-practices + graphviz + render-graphs into writing-skills"`

---

## Phase 2 — Full-body adoptions under `writing-skills`  *(subagent-driven, one seat each; PR1 branch)*

> Each task: invoke `writing-skills` and follow RED→GREEN→REFACTOR. RED baselines are Task 0.3. These are large tasks (~30–60 min), not "5-minute steps".

#### Task 2.1: brainstorming — replace body with the snapshot, preserve items 1–5

**Files:** Modify `skills/brainstorming/SKILL.md`; Create `skills/brainstorming/{visual-companion.md,spec-document-reviewer-prompt.md}`, `skills/brainstorming/scripts/*`

- [ ] **Step 1 (GREEN): Copy support files**

```bash
mkdir -p skills/brainstorming/scripts
cp .claude/docs/plans/_sp-6.3.0-snapshot/brainstorming/visual-companion.md              skills/brainstorming/
cp .claude/docs/plans/_sp-6.3.0-snapshot/brainstorming/spec-document-reviewer-prompt.md skills/brainstorming/
cp .claude/docs/plans/_sp-6.3.0-snapshot/brainstorming/scripts/*                         skills/brainstorming/scripts/
```

- [ ] **Step 2 (GREEN): Replace the body.** Replace everything below the frontmatter `---` with the snapshot `brainstorming/SKILL.md` body, then apply §3.3 items:
  1. keep the existing A Team frontmatter `description`;
  2. `docs/superpowers/specs/` → `.claude/docs/specs/` (checklist step + "After the Design");
  3. confirm no `superpowers:` prefixes (snapshot uses bare `writing-plans` — verify);
  4. provenance comment as first body line;
  5. replace `elements-of-style:writing-clearly-and-concisely` → `Write the spec clearly and concisely.`

- [ ] **Step 3 (GREEN): Re-run the representative task** (Task 0.3 prompt) by following `skills/brainstorming/SKILL.md` directly. Confirm path classification + approval gate + unchanged `description`. Write `.claude/docs/plans/_red-baselines/brainstorming-after.md`.

- [ ] **Step 4 (REFACTOR): `writing-skills` §9 checklist**

```bash
python3 -c "import yaml; d=yaml.safe_load(open('skills/brainstorming/SKILL.md').read().split('---')[1]); assert d['name']=='brainstorming'; print('frontmatter OK')"
for f in $(grep -oE '[a-z-]+\.(md|cjs|js|html|sh)' skills/brainstorming/SKILL.md | sort -u); do
  find skills/brainstorming -name "$f" | grep -q . && echo "OK $f" || echo "CHECK $f"
done
grep -n 'superpowers:\|docs/superpowers\|elements-of-style' skills/brainstorming/SKILL.md || echo "clean OK"
grep -q 'Merged from superpowers 6.3.0' skills/brainstorming/SKILL.md && echo provenance OK
```
Plus read-through: description matches scope; positive trigger ("let's build X") fires; near-miss ("what does this error mean?") does not.

- [ ] **Step 5: Commit** — `git add skills/brainstorming .claude/docs/plans/_red-baselines/brainstorming-after.md && git commit -m "feat: adopt superpowers brainstorming body, preserve A Team description + spec path"`

#### Task 2.2: subagent-driven-development — replace body with the snapshot, preserve items 1–5

**Files:** Modify `skills/subagent-driven-development/SKILL.md`, `.gitignore`; Create `skills/subagent-driven-development/scripts/{sdd-workspace,task-brief,review-package}`, `implementer-prompt.md`, `task-reviewer-prompt.md`, `re-review-prompt.md`

- [ ] **Step 1 (GREEN): Copy support files**

```bash
mkdir -p skills/subagent-driven-development/scripts
cp .claude/docs/plans/_sp-6.3.0-snapshot/subagent-driven-development/scripts/*            skills/subagent-driven-development/scripts/
cp .claude/docs/plans/_sp-6.3.0-snapshot/subagent-driven-development/implementer-prompt.md   skills/subagent-driven-development/
cp .claude/docs/plans/_sp-6.3.0-snapshot/subagent-driven-development/task-reviewer-prompt.md skills/subagent-driven-development/
cp .claude/docs/plans/_sp-6.3.0-snapshot/subagent-driven-development/re-review-prompt.md     skills/subagent-driven-development/
chmod +x skills/subagent-driven-development/scripts/*
```

- [ ] **Step 2 (GREEN): Replace the body** with the snapshot body, then apply §3.3 items:
  1. keep the A Team frontmatter `description`;
  2. rewrite scratch-dir refs `.superpowers/sdd/` → `.agent-sync/sdd/` (in SKILL.md **and** in `scripts/sdd-workspace`); rewrite prose `docs/superpowers/plans/` → `.claude/docs/plans/`;
  3. rewrite `superpowers:finishing-a-development-branch` → `finishing-a-development-branch`, `superpowers:using-git-worktrees` → `using-git-worktrees`; the final-review step's `../requesting-code-review/code-reviewer.md` → **dispatch the `code-reviewer` agent** (`.claude/agents/code-reviewer.md`) for the whole-branch review;
  4. provenance comment first body line;
  5. keep the A Team Model-Selection tier table; merge the snapshot's extra guidance (turn-count, escalation rounds 4–5); add `Tiers map to .claude/rules/performance.md.`

- [ ] **Step 3:** Add `.agent-sync/sdd/` to `.gitignore` (below the existing `.agent-sync/logs/` line).

- [ ] **Step 4 (GREEN): Re-run the representative task** (Task 0.3 prompt) by following the merged `SKILL.md`. Confirm ledger creation (under `.agent-sync/sdd/`), fresh subagent per task, two-stage review. Write `.claude/docs/plans/_red-baselines/subagent-driven-development-after.md`.

- [ ] **Step 5 (REFACTOR): `writing-skills` §9 checklist**

```bash
python3 -c "import yaml; d=yaml.safe_load(open('skills/subagent-driven-development/SKILL.md').read().split('---')[1]); assert d['name']=='subagent-driven-development'; print('frontmatter OK')"
grep -n 'superpowers:\|\.superpowers/\|docs/superpowers' skills/subagent-driven-development/SKILL.md skills/subagent-driven-development/scripts/* || echo "clean OK"
grep -q 'rules/performance.md' skills/subagent-driven-development/SKILL.md && echo tier link OK
grep -q 'Merged from superpowers 6.3.0' skills/subagent-driven-development/SKILL.md && echo provenance OK
grep -q '.agent-sync/sdd/' .gitignore && echo gitignore OK
for f in $(grep -oE '(scripts/[a-z-]+|[a-z-]+-prompt\.md)' skills/subagent-driven-development/SKILL.md | sort -u); do
  find skills/subagent-driven-development -path "*${f}*" | grep -q . && echo "OK $f" || echo "CHECK $f"
done
```

- [ ] **Step 6: Commit** — `git add skills/subagent-driven-development .gitignore .claude/docs/plans/_red-baselines/subagent-driven-development-after.md && git commit -m "feat: adopt superpowers subagent-driven-development body (ledger, fix-loop, scripts)"`

---

## Phase 3 — Port receiving-code-review  *(subagent-driven; PR1 branch)*

#### Task 3.1: receiving-code-review

**Files:** Create `skills/receiving-code-review/SKILL.md`

- [ ] **Step 1:** `mkdir -p skills/receiving-code-review && cp .claude/docs/plans/_sp-6.3.0-snapshot/receiving-code-review/SKILL.md skills/receiving-code-review/SKILL.md`
- [ ] **Step 2:** Edits: keep the snapshot `description`; `your human partner` → `the user` throughout; `superpowers:<name>` → bare; provenance comment `<!-- Ported from superpowers 6.3.0 on 2026-09-09. See .claude/docs/specs/2026-09-09-a-team-wiring-review-design.md -->`. Add a short note: *pairs with the `code-reviewer` agent and `.claude/rules/coding-style.md` "Surgical Changes".*
- [ ] **Step 3: Verify**

```bash
python3 -c "import yaml; d=yaml.safe_load(open('skills/receiving-code-review/SKILL.md').read().split('---')[1]); assert d['name']=='receiving-code-review'; print('OK')"
grep -n 'superpowers:\|your human partner' skills/receiving-code-review/SKILL.md || echo "clean OK"
```

- [ ] **Step 4: Commit** — `git commit -m "feat: port receiving-code-review skill from superpowers"`

---

## Phase 4 — Wiring  *(main session; PR1 branch)*

#### Task 4.1: Symlink the 12 skills into `.claude/skills/`

**Files:** Create 12 symlinks under `.claude/skills/`

- [ ] **Step 1: Create the symlinks**

```bash
cd .claude/skills
for s in brainstorming dispatching-parallel-agents executing-plans \
         finishing-a-development-branch subagent-driven-development \
         systematic-debugging test-driven-development using-git-worktrees \
         writing-plans writing-skills receiving-code-review; do
  ln -s "../../skills/$s" "$s"
done
cd ../..
# verification-before-completion was symlinked in Task 0.2 — do not re-add
```

- [ ] **Step 2: Confirm all are git-tracked symlinks**

```bash
git add .claude/skills
git ls-files -s .claude/skills | grep -c '^120000'   # expect: 25 (13 pre-existing + 12 new; react-aria is a dir of blobs, not counted)
git ls-files -s .claude/skills | grep -v '^120000' | grep -v react-aria && echo "NON-SYMLINK ENTRY" || echo "all symlinks OK"
```
If any new entry is not `120000`, redo it via `git update-index --add --cacheinfo 120000,$(printf '../../skills/<name>' | git hash-object -w --stdin),.claude/skills/<name>` then `git checkout -- .claude/skills/<name>`.

- [ ] **Step 3: Count**

```bash
ls .claude/skills | grep -vc react-aria   # expect: 25
comm -3 <(ls -1 skills | grep -v '\.md$' | sort) <(ls -1 .claude/skills | grep -v react-aria | sort)
echo "no output = .claude/skills matches skills/ exactly"
```

- [ ] **Step 4: Commit** — `git commit -m "feat: symlink 12 merged/ported skills into .claude/skills (25/25 resolve local)"`

#### Task 4.2: Complete the `Skill()` allow-list

**Files:** Modify `.claude/settings.json`

- [ ] **Step 1: Add 12 entries** to `permissions.allow` (keep 2-space indent + array style):

```
"Skill(adr)", "Skill(adr:*)",
"Skill(architecture-design)", "Skill(architecture-design:*)",
"Skill(architecture-review)", "Skill(architecture-review:*)",
"Skill(managing-github-actions)", "Skill(managing-github-actions:*)",
"Skill(scalability-review)", "Skill(scalability-review:*)",
"Skill(receiving-code-review)", "Skill(receiving-code-review:*)"
```

- [ ] **Step 2: Validate**

```bash
python3 -c "import json; json.load(open('.claude/settings.json')); print('valid JSON')"
grep -oE '"Skill\([^"]*\)"' .claude/settings.json | sort -u | wc -l   # expect: 50 (25 names x 2)
```

- [ ] **Step 3: Commit** — `git commit -m "feat: add adr, architecture-*, managing-github-actions, scalability-review, receiving-code-review to Skill() allow-list"`

#### Task 4.3: Reload gate

- [ ] **Step 1:** Main session: instruct the user to restart / reload the session so the 12 new symlinks and 12 allow-list entries take effect. Wait for confirmation before Task 4.4.

#### Task 4.4: Verify 25/25 resolve un-prefixed and un-prompted  *(post-reload)*

- [ ] **Step 1:** `comm -3 <(ls -1 skills | grep -v '\.md$' | sort) <(ls -1 .claude/skills | grep -v react-aria | sort)` → no output.
- [ ] **Step 2:** Invoke and confirm A Team body + no prompt for: `brainstorming`, `subagent-driven-development`, `systematic-debugging` (3 formerly shadowed), `adr`, `receiving-code-review` (formerly prompting / new). Record results in the ledger.
- [ ] **Step 3:** No commit. **PR1 is now content-complete** — hand to `finishing-a-development-branch` for the PR1 review/PR (run the subset of §7 that PR1 covers: spike, 25 skills, provenance, reference-integrity, symlinks `120000`, allow-list 50, invocation spot-checks).

---

## Phase 5 — Agent roster  *(subagent-driven; PR2 branch, from PR1 tip)*

#### Task 5.1: Delete chief-of-staff

**Files:** Delete `.claude/agents/chief-of-staff.md`

- [ ] **Step 1: Wide reference sweep**

```bash
grep -rn 'chief-of-staff' . \
  --include='*.md' --include='*.json' --include='*.toml' --include='*.sh' --include='*.py' --include='*.js' \
  --exclude-dir=node_modules --exclude-dir=.git \
  | grep -v 'docs/specs/2026-09-09\|docs/plans/2026-09-09'
# expect: only .claude/agents/chief-of-staff.md
grep -rn 'chief-of-staff' hooks/ .claude/ 2>/dev/null | grep -v 'agents/chief-of-staff.md'
```

- [ ] **Step 2:** `git rm .claude/agents/chief-of-staff.md`
- [ ] **Step 3: Re-grep clean** (excluding spec/plan). Commit — `git commit -m "chore: remove chief-of-staff agent (unrelated to this project)"`

#### Task 5.2: Agent model-tier audit

**Files:** none (feeds Task 7.5)

- [ ] **Step 1:**

```bash
for f in .claude/agents/*.md; do
  printf '%s : ' "$(basename "$f" .md)"; grep -m1 '^model:' "$f" | awk '{print $2}'
done
```

- [ ] **Step 2:** Compare to Global Constraints tiers. Write the pass/mismatch list to a scratch note for Task 7.5. Do NOT edit agent files here — mismatches are reported; corrected in Task 7.5 only if the user confirms.
- [ ] **Step 3:** No commit.

---

## Phase 6 — Commands  *(subagent-driven; PR2 branch)*

#### Task 6.1: `/skills` dispatcher

**Files:** Create `.claude/commands/skills.md`

- [ ] **Step 1:** Write the file: a `# /skills` heading, one line ("To run one, invoke `Skill(<name>)` — all 25 resolve to the A Team version"), then a 25-row table `| Skill | Trigger (short) | Command entry | Executing agent(s) |` covering every dir in `skills/` (no `requesting-code-review` row). End with `Full cross-reference: [.claude/docs/traceability.md](../docs/traceability.md).`
- [ ] **Step 2:** `awk -F'|' '/^\| [a-z]/ {c++} END{print c}' .claude/commands/skills.md` → expect `25`.
- [ ] **Step 3: Commit** — `git commit -m "feat: add /skills dispatcher command (index of all 25 skills)"`

#### Task 6.2: `/adr`, `/incident-response`, `/architecture-review`

**Files:** Create the 3 command files (plain `# /name` style, no frontmatter).

- [ ] **Step 1:** Write each — `**Invokes:** \`<skill>\` skill`, a one-line purpose, a `**Usage:**` block with 1–2 examples, and one line on when NOT to use / which sibling skill to prefer. (`/adr` → `adr`; `/incident-response` → `incident-response`; `/architecture-review` → `architecture-review` via the `architect` agent.)
- [ ] **Step 2:** `for c in adr incident-response architecture-review; do test -f ".claude/commands/$c.md" && head -1 ".claude/commands/$c.md"; done`
- [ ] **Step 3: Commit** — `git commit -m "feat: add /adr, /incident-response, /architecture-review thin alias commands"`

#### Task 6.3: Wire receiving-code-review into `/code-review` and `/quality-gate`

**Files:** Modify `.claude/commands/{code-review,quality-gate}.md`

- [ ] **Step 1:** `/code-review` — after the `**Invokes:**` line add: `**Reception protocol:** when acting on the findings, follow the \`receiving-code-review\` skill — verify before implementing, technical pushback over performative agreement.`
- [ ] **Step 2:** `/quality-gate` — in "Step 2 — Reviews" add the same reception-protocol line for acting on findings.
- [ ] **Step 3:** `grep -l receiving-code-review .claude/commands/code-review.md .claude/commands/quality-gate.md` → both.
- [ ] **Step 4: Commit** — `git commit -m "feat: wire receiving-code-review into /code-review and /quality-gate"`

---

## Phase 7 — Docs reconciliation  *(subagent-driven; PR2 branch)*

#### Task 7.1: using-a-team/SKILL.md

**Files:** Modify `skills/using-a-team/SKILL.md`

- [ ] **Step 1:** Capture a before-image of the trigger tables: `grep -nE '^\| ' skills/using-a-team/SKILL.md > /tmp/uat-before.txt`.
- [ ] **Step 2:** "Language & Domain Reviews" table body → only `typescript-reviewer` (TS/React/frontend), `python-reviewer` (Python), `infra-reviewer` (Terraform/Docker/K8s/CI), `compliance-reviewer` (privacy/payment/regulated data). Add below: `> Other language reviewers (Go, Rust, Kotlin, Swift, Flutter, database) are added on demand when that stack enters the repo.`
- [ ] **Step 3:** Delete the `data-migration` row under "Before Any API Endpoint"; keep `api-contract-first`.
- [ ] **Step 4:** Add rows: `doc-updater` (docs/codemaps drift after a feature), `refactor-cleaner` (dead code/deps/dup — not during active feature work), `tdd-guide` (persona alternative to the `test-driven-development` skill), `e2e-runner` (critical user-flow E2E), `receiving-code-review` skill (acting on review feedback).
- [ ] **Step 5:** Under "Skill Registration": `The primitive responsibility model (skill vs agent vs command vs rule) is in \`.claude/rules/patterns.md\`.`
- [ ] **Step 6: Verify**

```bash
grep -Ec 'go-reviewer|rust-reviewer|kotlin-reviewer|swift-reviewer|flutter-reviewer|database-reviewer|ai-reviewer|data-migration' skills/using-a-team/SKILL.md   # 0
grep -Ec 'doc-updater|e2e-runner|tdd-guide|refactor-cleaner|typescript-reviewer' skills/using-a-team/SKILL.md   # >= 5
grep -c 'receiving-code-review' skills/using-a-team/SKILL.md   # >= 1
git diff skills/using-a-team/SKILL.md | grep -E '^-\| ' # inspect: only intended trigger rows removed
```

- [ ] **Step 7: Commit** — `git commit -m "fix: reconcile using-a-team triggers — drop phantom agents, add real ones"`

#### Task 7.2: CLAUDE.md skills table → 25

**Files:** Modify `CLAUDE.md`

- [ ] **Step 1:** Add one alphabetical row: `| \`receiving-code-review\` | Evaluating incoming code-review feedback — verify before implementing, technical pushback over performative agreement. Pairs with the \`code-reviewer\` agent. |`
- [ ] **Step 2:** `awk '/^## Skills/,/^## Instruction/' CLAUDE.md | grep -c '^| \`'` → `25`.
- [ ] **Step 3: Commit** — `git commit -m "docs: add receiving-code-review to CLAUDE.md skills table (25)"`

#### Task 7.3: AGENTS.md skills table → 25

**Files:** Modify `AGENTS.md`

- [ ] **Step 1:** Add the same row to `AGENTS.md`'s `## Skills` table.
- [ ] **Step 2:** `awk '/^## Skills/,/^## Instruction/' AGENTS.md | grep -c '^| \`'` → `25`.
- [ ] **Step 3: Commit** — `git commit -m "docs: add receiving-code-review to AGENTS.md skills table (25)"`

#### Task 7.4: `.claude/rules/` — real refs + responsibility model

**Files:** Modify `.claude/rules/{agents.md,orchestration.md,patterns.md,performance.md}`

- [ ] **Step 1:** `grep -nE 'go-reviewer|rust-reviewer|kotlin-reviewer|swift-reviewer|flutter-reviewer|database-reviewer|ai-reviewer|chief-of-staff|data-migration' .claude/rules/*.md` — rewrite each hit to the real roster.
- [ ] **Step 2:** `performance.md` — if the explicit agent→tier assignment is absent, add: `Tier 1 (opus): orchestrator, architect. Tier 3 (haiku): doc-updater, harness-optimizer, performance-profiler. Tier 2 (sonnet): all other agents.`
- [ ] **Step 3:** `patterns.md` — append the "A Team Primitive Responsibilities" section (skill / agent / command / rule table from spec §4.1) + a line: `All 25 skills resolve by bare name via .claude/skills/ symlinks. See .claude/docs/traceability.md.`
- [ ] **Step 4: Verify**

```bash
grep -rEc 'go-reviewer|rust-reviewer|kotlin-reviewer|swift-reviewer|flutter-reviewer|database-reviewer|ai-reviewer|chief-of-staff|data-migration' .claude/rules/   # 0 per file
grep -q 'A Team Primitive Responsibilities' .claude/rules/patterns.md && echo model OK
```

- [ ] **Step 5: Commit** — `git commit -m "docs: reconcile .claude/rules to real agent roster + add primitive responsibility model"`

#### Task 7.5: `.claude/docs/traceability.md`

**Files:** Create `.claude/docs/traceability.md`

- [ ] **Step 1:** Write 3 tables:
  - **Skills** (25 rows): `| Skill | Invoke | Trigger | Command entry point(s) | Executing agent(s) | Governing rule(s) |` — from `/skills` (Task 6.1) + a rule column (`test-driven-development` → `testing.md`; `finishing-a-development-branch` → `git-workflow.md`; `verification-before-completion` → `testing.md`; most → none).
  - **Agents** (17 rows): `| Agent | Model tier | Runs skill(s) | Dispatched by command(s) | Tier matches performance.md? |` — last column from Task 5.2.
  - **Commands** (14 rows): `| Command | Type | Skills composed | Agents dispatched |`.
- [ ] **Step 2: Verify cross-references**

```bash
for s in $(awk -F'|' '/^\| [a-z]/ {gsub(/[` ]/,"",$2); print $2}' .claude/docs/traceability.md | head -25); do
  test -d "skills/$s" || echo "MISSING skill: $s"
done
awk -F'|' '/^\| [a-z]/ {c++} END{print "skill rows:", c}' .claude/docs/traceability.md   # 25
```

- [ ] **Step 3: Commit** — `git commit -m "docs: add command <-> skill <-> agent <-> rule traceability matrix"`

#### Task 7.6: `.codex` confirmation note

**Files:** Modify `.claude/docs/traceability.md`

- [ ] **Step 1:** Append a `## Codex surface` section: `.codex/config.toml` holds MCP server config only; Codex consumes `AGENTS.md`, whose skills table (Task 7.3) is the Codex-facing registration; no `.codex/` skills manifest exists or is expected.
- [ ] **Step 2: Commit** — `git commit -m "docs: record that .codex needs no skills reconciliation"`

---

## Phase 8 — Final verification  *(main session; PR2 branch)*

#### Task 8.1: Spec §7 success checklist

- [ ] **Step 1: Mechanical checks**

```bash
[ $(ls -1 skills | grep -vc '\.md$') -eq 25 ] && echo "25 skills OK"
[ $(ls .claude/skills | grep -vc react-aria) -eq 25 ] && echo "25 symlinks OK"
[ $(git ls-files -s .claude/skills | grep -c '^120000') -eq 25 ] && echo "all 120000 OK"
grep -rn 'superpowers:' skills/ && echo "PREFIX LEAK" || echo "no prefix OK"
for s in brainstorming dispatching-parallel-agents executing-plans finishing-a-development-branch subagent-driven-development systematic-debugging test-driven-development using-git-worktrees verification-before-completion writing-plans writing-skills; do
  grep -q 'Merged from superpowers 6.3.0' "skills/$s/SKILL.md" || echo "PROVENANCE MISSING: $s"
done
grep -q 'Ported from superpowers 6.3.0' skills/receiving-code-review/SKILL.md || echo "PROVENANCE MISSING: receiving-code-review"
[ $(grep -oE '"Skill\([^"]*\)"' .claude/settings.json | sort -u | wc -l) -eq 50 ] && echo "allow-list 50 OK"
python3 -c "import json; json.load(open('.claude/settings.json')); print('settings.json valid')"
test ! -f .claude/agents/chief-of-staff.md && echo "chief-of-staff gone OK"
grep -rEn 'go-reviewer|rust-reviewer|kotlin-reviewer|swift-reviewer|flutter-reviewer|database-reviewer|ai-reviewer|data-migration' skills/using-a-team .claude/rules CLAUDE.md AGENTS.md && echo "PHANTOM LEAK" || echo "phantom sweep OK"
[ $(ls -1 .claude/commands/*.md | wc -l) -eq 14 ] && echo "14 commands OK"
awk '/^## Skills/,/^## Instruction/' CLAUDE.md | grep -c '^| `'
awk '/^## Skills/,/^## Instruction/' AGENTS.md | grep -c '^| `'
for s in skills/*/SKILL.md; do d=$(dirname "$s"); for ref in $(grep -oE '\((references|scripts)/[A-Za-z0-9._-]+\)' "$s" | tr -d '()'); do test -e "$d/$ref" || echo "DANGLING: $s -> $ref"; done; done
echo "no DANGLING = refs OK"
```

- [ ] **Step 2: Invocation checks (post-reload):** invoke `brainstorming`, `subagent-driven-development`, `systematic-debugging`, `adr`, `architecture-review`, `receiving-code-review` — A Team body + no prompt each. Record in ledger.
- [ ] **Step 3:** Walk spec §7; check every box against the evidence. Fix + re-verify any gap.
- [ ] **Step 4:** `npm run test:ci` once — confirm behaviour unchanged from `main` (no in-scope file touched).
- [ ] **Step 5:** Optionally `git rm -r .claude/docs/plans/_red-baselines .claude/docs/plans/_sp-6.3.0-snapshot` (keep or drop per preference) and commit.
- [ ] **Step 6:** Use `finishing-a-development-branch` on the PR2 branch: run required checks, review the full diff vs PR1 tip, prepare the PR2 summary. `git log --oneline <PR1-tip>..HEAD`.

---

## Parallelization

- **Backbone:** Phase 0 (gate) → Phase 1 → Phase 2 → Phase 3 → Phase 4 → **[PR1 ships]** → Phase 5 / 6 / 7 (concurrent) → Phase 8 → **[PR2 ships]**.
- **Phase 1:** Tasks 1.1–1.5 parallel-safe (disjoint dirs). **Task 1.6 gates Phase 2** (Phase 2 uses `writing-skills`).
- **Phase 2:** 2.1 and 2.2 independent dirs — parallel-safe; each gets its own review seat.
- **Phase 4:** main-session only; 4.1 and 4.2 independent; 4.3 (reload) then 4.4.
- **Phases 5/6/7:** concurrent — disjoint files (`.claude/agents/` vs `.claude/commands/` vs `skills/using-a-team/` + root docs + `.claude/rules/` + `.claude/docs/`). **Task 7.5 consumes 5.2 + 6.1** — run it after both.
- **Phase 8:** alone, main session.
- `.claude/settings.json` touched only by 4.2. `skills/using-a-team/SKILL.md` only by 7.1. `.gitignore` only by 2.2. No File-Claims collisions.

## Testing Strategy

- **Integration:** post-reload bare-name `Skill()` resolution → A Team body, no prompt (Tasks 0.2, 4.4, 8.1).
- **Regression:** `grep -rn 'superpowers:' skills/` empty; phantom sweep empty; `npm run test:ci` unchanged.
- **Reference integrity:** every `(references/…)` / `(scripts/…)` link in every `skills/*/SKILL.md` resolves (Task 8.1 loop).
- **Manual/operational:** the two `writing-skills` §9 checklists (2.1, 2.2); 6 spot-check invocations (8.1).

## Risks and Rollback

| Risk | Mitigation | Rollback |
|---|---|---|
| Project symlink does not shadow the plugin skill | **Task 0.2 gate** — one symlink, reload, check, before any merge | Task 0.2 FAIL → escalate; nothing else done |
| Symlinks/allow-list not live in the running session | Task 4.3 reload gate; 4.4 + 8.1 run post-reload; main session (not a subagent) owns Phase 4 | n/a |
| `writing-skills` merge (1.6) breaks before it governs Phase 2 | 1.6 verified before Phase 2; additive-only merge | `git revert` 1.6; Phase 2 uses pre-merge `writing-skills` |
| Full-body adoption changes skill behaviour | 2.1/2.2 RED + after baselines; own review seat | `git revert` the task commit |
| `ln -s` makes a copy on Windows | Task 0.2/4.1 check `git ls-files -s` for `120000`; fallback `git update-index --cacheinfo` | `git rm` the entry |
| SP SDD scratch litters repo root | Task 2.2 remaps to `.agent-sync/sdd/` + `.gitignore` | delete dir; `git rm --cached` |
| plugin updates off 6.3.0 mid-run | Task 0.1 in-repo snapshot is the only merge source | n/a (immutable in branch) |
| Editing session-injected `using-a-team` drops a real row | Task 7.1 before-image + `git diff` inspection | `git checkout skills/using-a-team/SKILL.md` |
| Deleting `chief-of-staff` breaks a hook | Task 5.1 wide sweep incl. `hooks/`, `.toml`, `.sh` | `git checkout` the file |

## Success Criteria

- [ ] **Task 0.2 spike PASSED** — a project symlink shadows the plugin skill.
- [ ] `ls skills | grep -vc '\.md$'` = 25; `ls .claude/skills | grep -vc react-aria` = 25; `git ls-files -s .claude/skills | grep -c '^120000'` = 25.
- [ ] `grep -rn 'superpowers:' skills/` empty.
- [ ] All 11 merged `SKILL.md` carry the "Merged from" comment; `receiving-code-review` carries the "Ported from" comment; `brainstorming` + `subagent-driven-development` passed the `writing-skills` §9 checklist with RED + after baselines committed.
- [ ] Every `(references/…)` / `(scripts/…)` link in every `skills/*/SKILL.md` resolves (Task 8.1 loop prints no `DANGLING`).
- [ ] `grep -oE '"Skill\([^"]*\)"' .claude/settings.json | sort -u | wc -l` = 50; `settings.json` valid JSON.
- [ ] Post-reload: 6 spot-check `Skill()` invocations return the A Team body, no permission prompt.
- [ ] `.claude/agents/chief-of-staff.md` deleted; wide `chief-of-staff` sweep clean; phantom + `data-migration` sweep over `skills/using-a-team`, `.claude/rules`, `CLAUDE.md`, `AGENTS.md` = 0.
- [ ] `using-a-team/SKILL.md` lists `doc-updater`, `e2e-runner`, `tdd-guide`, `refactor-cleaner`, `typescript-reviewer` + `receiving-code-review`; `git diff` shows only intended trigger rows changed.
- [ ] `CLAUDE.md` + `AGENTS.md` skills tables = 25 rows each.
- [ ] `.claude/rules/patterns.md` has "A Team Primitive Responsibilities".
- [ ] `.claude/commands/` = 14 `.md` files; `/code-review` + `/quality-gate` cite `receiving-code-review`; `/skills` lists 25 rows.
- [ ] `.claude/docs/traceability.md`: 25 skill + 17 agent + 14 command rows; `.codex` note present; every cross-reference resolves.
- [ ] Every agent `model:` matches its performance.md tier, or the mismatch is listed with a rationale in `traceability.md`.
- [ ] `npm run test:ci` behaviour unchanged from `main`.
- [ ] PR1 diff reviewed vs `main`; PR2 diff reviewed vs PR1 tip; both PR summaries prepared per `finishing-a-development-branch`.
