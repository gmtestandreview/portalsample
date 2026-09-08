# A Team Wiring Review — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all 26 canonical A Team skills resolve to the A Team version by bare name, unshadowed and unprompted, with full command/agent traceability and reconciled docs.

**Architecture:** Merge `superpowers` 6.3.0 material back into the 11 A Team skill forks (9 additive, 2 full-body replacements governed by `writing-skills`), port 2 new review skills, symlink all 26 into `.claude/skills/`, complete the `Skill()` allow-list, delete one stray agent, purge phantom agent references, add one `/skills` dispatcher plus 3 thin command aliases, and write a `command ↔ skill ↔ agent ↔ rule` matrix. No product code, no `superpowers` plugin files, no hook/MCP changes.

**Tech Stack:** Markdown skill/agent/command definitions; JSON (`.claude/settings.json`); POSIX symlinks via Git Bash; bash verification one-liners. No compiler, no test framework — validation is grep/resolution/invocation checks.

**Spec:** [.claude/docs/specs/2026-09-09-a-team-wiring-review-design.md](../specs/2026-09-09-a-team-wiring-review-design.md) — read it alongside this plan; every task's requirements are the spec section it cites.

## Global Constraints

- Canonical skill count is **26**: the existing 24 in `skills/**` plus ported `receiving-code-review` and `requesting-code-review`.
- Every merged `skills/<name>/SKILL.md` starts with the verbatim comment: `<!-- A Team fork. Merged from superpowers 6.3.0 on 2026-09-09. See .claude/docs/specs/2026-09-09-a-team-wiring-review-design.md -->`
- No `superpowers:` prefix may remain in any file under `skills/**` after this plan. Cross-references use the bare skill name or an agent name that exists in `.claude/agents/**`.
- Keep each A Team skill's existing frontmatter `description` verbatim — it is the tuned trigger. Only the body and supporting files change.
- Spec/plan/doc paths in skill bodies are `.claude/docs/specs/` and `.claude/docs/plans/` — never `docs/superpowers/`.
- `.claude/skills/<name>` symlinks use the exact form already in the repo: `../../skills/<name>` (relative, POSIX). The `react-aria` symlink is left untouched.
- All work happens on branch `feat/a-team-wiring-review`. Commit after every task. Never commit to `main`.
- superpowers source root (read-only reference): `C:/Users/gregm/.claude/plugins/cache/claude-plugins-official/superpowers/6.3.0/skills/` — referred to below as `$SP`.
- Agent model tiers per [.claude/rules/performance.md](../../rules/performance.md): Tier 1 `opus` = `orchestrator`, `architect` only; Tier 3 `haiku` = `doc-updater`, `harness-optimizer`, `performance-profiler`; everything else Tier 2 `sonnet`.

---

## Requirements Traceability

| Spec requirement | Task(s) | Validation |
|---|---|---|
| §3.1 audit table committed | (done in spec) Task 0.1 confirms | `grep -c '| True duplicate |' spec` = 11 |
| §3.2 #2,3,8,9 additive text merges | Task 1.1 | grep provenance + no `superpowers:` in the 4 files |
| §3.2 #4 finishing-a-development-branch + worktree-cleanup.md | Task 1.2 | file exists; body links it |
| §3.2 #6 systematic-debugging + 4 support files | Task 1.3 | 4 files exist; body refs resolve |
| §3.2 #7 test-driven-development + writing-good-tests.md | Task 1.4 | file exists; body refs resolve |
| §3.2 #10 writing-plans + plan-document-reviewer-prompt.md | Task 1.5 | file exists; body refs resolve |
| §3.2 #11 writing-skills + 3 support files + "Match the Form" | Task 1.6 | 3 files exist; section present |
| §3.3 brainstorming full adoption under writing-skills | Task 2.1 | RED baseline recorded; §9 checklist pass |
| §3.3 subagent-driven-development full adoption | Task 2.2 | RED baseline recorded; §9 checklist pass |
| §4.2 port receiving-code-review | Task 3.1 | resolves un-prefixed |
| §4.2 port requesting-code-review + code-reviewer.md | Task 3.2 | resolves; template present |
| §4.5.1 symlink 13 skills into `.claude/skills/` | Task 4.1 | `ls .claude/skills` = 27 entries (26 + react-aria) |
| §4.5.2 allow-list 7 names | Task 4.2 | `grep -c 'Skill(' settings.json` increases by 14 |
| §4.5.3 26/26 resolve un-prefixed, un-prompted | Task 4.3 | spot-check invocations |
| §4.4 delete chief-of-staff | Task 5.1 | file gone; `grep -r chief-of-staff` clean |
| §4.4 model-tier check | Task 5.2 | report table in traceability doc |
| §4.4 purge phantom refs, list real agents | Task 7.1 | grep negatives + positives in using-a-team |
| §4.3 `/skills` dispatcher | Task 6.1 | file lists 26 rows |
| §4.3 `/adr` `/incident-response` `/architecture-review` | Task 6.2 | 3 files exist |
| §4.3 wire review skills into `/code-review`, `/quality-gate` | Task 6.3 | grep both skill names in the 2 commands |
| §4.1 primitive responsibility model in rules | Task 7.4 | section present in `.claude/rules/patterns.md` |
| §4.6 traceability.md | Task 7.5 | 26 skill rows + agent table + command table |
| §8 `.codex` no change (documented) | Task 7.6 | note in traceability doc |
| §7 full success checklist | Task 8.1 | every box ticked |
| CLAUDE.md / AGENTS.md 26 skills | Task 7.2, 7.3 | `grep -c` skill rows = 26 in each |

---

## Repository Findings (verified)

- `.claude/skills/` currently holds 13 skill symlinks + `react-aria`, all of form `<name> -> ../../skills/<name>` (except `react-aria -> <abs path>/.agents/skills/react-aria`).
- `.claude/settings.json` `permissions.allow` is a JSON array of strings; it currently holds 19 `Skill(<name>)` + 19 `Skill(<name>:*)` entries. Missing: `adr`, `architecture-design`, `architecture-review`, `managing-github-actions`, `scalability-review`.
- `skills/brainstorming/` and `skills/subagent-driven-development/` contain **only** `SKILL.md` — no `evals/`.
- `skills/writing-skills/references/` already contains `persuasion-principles.md` and `testing-skills-with-subagents.md` — do NOT re-port those.
- `.claude/agents/` has 18 files including `chief-of-staff.md`. No `go-/rust-/kotlin-/swift-/flutter-/database-/ai-reviewer`.
- `.claude/commands/` has 10 files, no frontmatter (plain `# /name` markdown).
- `npm run lint:mdx` covers only `.storybook/**` and `ClientApp/src/**` `.mdx` — nothing in this plan is in a lint/test gate.
- superpowers ships NO agents.

---

## File Structure

**Created:**

| Path | Responsibility |
|---|---|
| `skills/finishing-a-development-branch/references/worktree-cleanup.md` | SP git-worktree detection + cleanup mechanics |
| `skills/systematic-debugging/references/root-cause-tracing.md` | backward call-stack tracing technique |
| `skills/systematic-debugging/references/condition-based-waiting.md` (+ `condition-based-waiting-example.ts`) | replace arbitrary timeouts with condition polling |
| `skills/systematic-debugging/references/defense-in-depth.md` | multi-layer validation after root cause |
| `skills/systematic-debugging/scripts/find-polluter.sh` | bisect test-pollution source |
| `skills/test-driven-development/references/writing-good-tests.md` | rules that keep tests honest |
| `skills/writing-plans/references/plan-document-reviewer-prompt.md` | reviewer prompt for plan docs |
| `skills/writing-skills/references/anthropic-best-practices.md` | Anthropic skill-authoring guidance |
| `skills/writing-skills/references/graphviz-conventions.dot` | graphviz style rules for skill flowcharts |
| `skills/writing-skills/scripts/render-graphs.js` | render skill flowcharts to SVG |
| `skills/brainstorming/visual-companion.md`, `spec-document-reviewer-prompt.md`, `scripts/*` | SP brainstorming support set |
| `skills/subagent-driven-development/scripts/{sdd-workspace,task-brief,review-package}`, `implementer-prompt.md`, `task-reviewer-prompt.md`, `re-review-prompt.md` | SP SDD support set |
| `skills/receiving-code-review/SKILL.md` | how to evaluate incoming review feedback |
| `skills/requesting-code-review/SKILL.md` (+ `code-reviewer.md`) | how a coordinator dispatches a review |
| `.claude/skills/<name>` (13 new symlinks) | resolve merged/ported skills to A Team version |
| `.claude/commands/skills.md` | dispatcher index of all 26 skills |
| `.claude/commands/adr.md`, `incident-response.md`, `architecture-review.md` | thin aliases |
| `.claude/docs/traceability.md` | command ↔ skill ↔ agent ↔ rule matrix |
| `.claude/docs/plans/_red-baselines/` | RED baseline transcripts for Tasks 2.1, 2.2 (git-ignored scratch OK, or committed) |

**Modified:**

| Path | Change |
|---|---|
| `skills/{dispatching-parallel-agents,executing-plans,using-git-worktrees,verification-before-completion}/SKILL.md` | additive text merge + provenance comment + prefix strip |
| `skills/{finishing-a-development-branch,systematic-debugging,test-driven-development,writing-plans,writing-skills}/SKILL.md` | additive merge + reference new support files + provenance |
| `skills/{brainstorming,subagent-driven-development}/SKILL.md` | full-body replacement (§3.3) |
| `.claude/settings.json` | +14 `Skill()` allow entries |
| `.claude/commands/{code-review,quality-gate}.md` | reference the 2 review skills |
| `skills/using-a-team/SKILL.md` | purge phantom agents + `data-migration`; add real agents; 26 skills; responsibility-model pointer |
| `CLAUDE.md`, `AGENTS.md` | skills tables → 26 rows |
| `.claude/rules/{agents.md,orchestration.md,patterns.md,performance.md}` | real refs only; responsibility model in `patterns.md` |

**Deleted:**

| Path | Reason |
|---|---|
| `.claude/agents/chief-of-staff.md` | unrelated (multi-channel comms triage) |

---

## Implementation Steps

### Phase 0 — Baseline

#### Task 0.1: Confirm branch, spec, and RED baselines for the two full adoptions

**Files:**
- Create: `.claude/docs/plans/_red-baselines/brainstorming-before.md`, `.claude/docs/plans/_red-baselines/subagent-driven-development-before.md`

**Interfaces:**
- Produces: two baseline transcripts referenced by Tasks 2.1 / 2.2 validation.

- [ ] **Step 1: Verify clean branch state**

Run:
```bash
git branch --show-current   # expect: feat/a-team-wiring-review
git status --short           # expect: empty
grep -c '| True duplicate |' .claude/docs/specs/2026-09-09-a-team-wiring-review-design.md   # expect: 11
```

- [ ] **Step 2: Record the `brainstorming` RED baseline**

Invoke the CURRENTLY RESOLVING skill (still `superpowers:brainstorming` — it is not yet symlinked) against a representative prompt and paste the observed behaviour into the baseline file.

Prompt to use: `"Let's build a small CSV export button for the applications list."`
Capture: did it classify the path (spike/bounded/architectural)? did it stop at an approval gate? which questions did it ask?

Write `.claude/docs/plans/_red-baselines/brainstorming-before.md`:
```markdown
# RED baseline — brainstorming (superpowers:brainstorming, pre-merge)
Date: 2026-09-09
Prompt: "Let's build a small CSV export button for the applications list."
Observed:
- Path classification announced: <yes/no — quote it>
- Clarifying questions asked (one at a time?): <list>
- Stopped at approval gate before any code: <yes/no>
- Spec path it would use: <quote>
```

- [ ] **Step 3: Record the `subagent-driven-development` RED baseline**

Prompt: `"Execute this 2-task plan: (1) add a formatDate util with a test, (2) use it in appDetails.tsx."`
Capture: did it create a ledger file? did it dispatch a fresh subagent per task? did it run a two-stage (spec + quality) review after each?

Write `.claude/docs/plans/_red-baselines/subagent-driven-development-before.md` in the same shape.

- [ ] **Step 4: Commit**

```bash
git add .claude/docs/plans/2026-09-09-a-team-wiring-review.md .claude/docs/plans/_red-baselines/
git commit -m "docs: add A Team wiring implementation plan + RED baselines"
```

---

### Phase 1 — Additive skill merges (9 skills)

#### Task 1.1: Additive text merges — dispatching-parallel-agents, executing-plans, using-git-worktrees, verification-before-completion

**Files:**
- Modify: `skills/dispatching-parallel-agents/SKILL.md`, `skills/executing-plans/SKILL.md`, `skills/using-git-worktrees/SKILL.md`, `skills/verification-before-completion/SKILL.md`

**Interfaces:**
- Consumes: `$SP/<name>/SKILL.md` (read-only reference).
- Produces: 4 merged SKILL.md files, still resolving to `superpowers:` until Task 4.1.

- [ ] **Step 1: `dispatching-parallel-agents` — prepend SP framing**

Insert, immediately after the `# Dispatching Parallel Agents` H1, the SP body's `## Overview` paragraph (isolated-context framing: "You delegate tasks to specialized agents with isolated context… never inherit your session's context") and the SP `## When to Use` decision digraph (the ```dot … ``` block). Keep every existing A Team section below. Add the provenance comment as line 1 (before frontmatter `---`? no — after the closing frontmatter `---`, as the first body line).

Exact provenance line (all 9 skills in this phase):
```
<!-- A Team fork. Merged from superpowers 6.3.0 on 2026-09-09. See .claude/docs/specs/2026-09-09-a-team-wiring-review-design.md -->
```

- [ ] **Step 2: `executing-plans` — fold in "return to earlier steps" + worktree step**

Add SP's `## When to Revisit Earlier Steps` section verbatim. In Step 1 of the existing "The Process", add a first sub-step: `1. Ensure an isolated workspace exists — use the \`using-git-worktrees\` skill to create or verify one.` Replace any `superpowers:subagent-driven-development` / `superpowers:finishing-a-development-branch` with the bare names. Add provenance comment.

- [ ] **Step 3: `using-git-worktrees` — parity check only**

Diff against `$SP/using-git-worktrees/SKILL.md`. The A Team body is more thorough (170 vs 167 lines); adopt any SP edge case not already present (expected: none). Add provenance comment even if the body is otherwise unchanged.

Run: `diff <(sed -n '/^#/,$p' skills/using-git-worktrees/SKILL.md) <(sed -n '/^#/,$p' "$SP/using-git-worktrees/SKILL.md") | head -60`

- [ ] **Step 4: `verification-before-completion` — fold unique rationalization rows**

Compare the "Rationalization Checks" table with SP's equivalent. Add any SP row whose "Rationalization" is not already covered. Add provenance comment.

- [ ] **Step 5: Verify no prefixes, provenance present**

Run:
```bash
for s in dispatching-parallel-agents executing-plans using-git-worktrees verification-before-completion; do
  echo "== $s =="
  head -6 "skills/$s/SKILL.md" | grep -q 'Merged from superpowers 6.3.0' && echo "provenance OK" || echo "PROVENANCE MISSING"
  grep -n 'superpowers:' "skills/$s/SKILL.md" && echo "PREFIX LEAK" || echo "no prefix OK"
done
```
Expected: `provenance OK` and `no prefix OK` for all 4.

- [ ] **Step 6: Commit**

```bash
git add skills/dispatching-parallel-agents skills/executing-plans skills/using-git-worktrees skills/verification-before-completion
git commit -m "feat: additive superpowers merges into 4 A Team skills (no new files)"
```

#### Task 1.2: finishing-a-development-branch — rationalizations table + worktree-cleanup reference

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md`
- Create: `skills/finishing-a-development-branch/references/worktree-cleanup.md`

**Interfaces:**
- Produces: `references/worktree-cleanup.md` referenced by the SKILL.md body.

- [ ] **Step 1: Create the reference file**

Create `skills/finishing-a-development-branch/references/worktree-cleanup.md` containing SP `finishing-a-development-branch` **Step 2 (Detect Environment)** and **Step 6 (Cleanup Workspace)** verbatim — the `GIT_DIR`/`GIT_COMMON`/`WORKTREE_PATH` bash, the `.worktrees/` / `worktrees/` ownership test, and the "removal refused" handling. Prepend a one-line heading: `# Worktree cleanup mechanics (concrete bash for Step 5 / Step 7 of the parent skill)`.

- [ ] **Step 2: Add the rationalizations table to SKILL.md**

Append a new section before `## Completion Gate`:
```markdown
## Common Rationalizations

| Excuse | Reality |
|---|---|
| "Tests passed earlier this session" | Run the suite on the tree you are about to integrate. A green run only proves the tree it ran on. |
| "They obviously want it merged" | Integration is the user's decision. Present the options and wait. |
| "The base branch is obviously main" | Confirm the fork point or ask. Merging into the wrong base is expensive to undo. |
| "Removal refused — `--force` finishes the cleanup" | The refusal means files exist only in that worktree. `--force` destroys them. Show the user and ask. |
| "The merged-result failure is probably flaky" | A failing merged result stops everything. Branch and worktree stay put while you investigate. |
| "The push was rejected — force-push will fix it" | A rejected push means the remote moved. Investigate; force-push only on explicit request. |
```

- [ ] **Step 3: Link the reference from SKILL.md**

In the workflow section that covers worktree/branch cleanup (step 7 "Perform requested repository actions"), add: `For git-worktree detection and cleanup mechanics, see [references/worktree-cleanup.md](references/worktree-cleanup.md).`

- [ ] **Step 4: Add provenance comment (first body line).**

- [ ] **Step 5: Verify**

Run:
```bash
test -f skills/finishing-a-development-branch/references/worktree-cleanup.md && echo "ref OK"
grep -q 'references/worktree-cleanup.md' skills/finishing-a-development-branch/SKILL.md && echo "link OK"
grep -q 'Merged from superpowers 6.3.0' skills/finishing-a-development-branch/SKILL.md && echo "provenance OK"
grep -n 'superpowers:' skills/finishing-a-development-branch/SKILL.md || echo "no prefix OK"
```

- [ ] **Step 6: Commit**

```bash
git add skills/finishing-a-development-branch
git commit -m "feat: merge superpowers worktree-cleanup + rationalizations into finishing-a-development-branch"
```

#### Task 1.3: systematic-debugging — 4 support files + rationalization tables

**Files:**
- Modify: `skills/systematic-debugging/SKILL.md`
- Create: `skills/systematic-debugging/references/root-cause-tracing.md`, `.../references/condition-based-waiting.md`, `.../references/condition-based-waiting-example.ts`, `.../references/defense-in-depth.md`, `.../scripts/find-polluter.sh`

- [ ] **Step 1: Copy support files from superpowers**

```bash
mkdir -p skills/systematic-debugging/references skills/systematic-debugging/scripts
cp "$SP/systematic-debugging/root-cause-tracing.md"            skills/systematic-debugging/references/
cp "$SP/systematic-debugging/condition-based-waiting.md"       skills/systematic-debugging/references/
cp "$SP/systematic-debugging/condition-based-waiting-example.ts" skills/systematic-debugging/references/
cp "$SP/systematic-debugging/defense-in-depth.md"             skills/systematic-debugging/references/
cp "$SP/systematic-debugging/find-polluter.sh"                skills/systematic-debugging/scripts/
```
Do NOT copy `test-*.md` (SP's own eval scenarios) or `CREATION-LOG.md`.

- [ ] **Step 2: Fix internal references in the copied files**

In the 4 `.md` files, rewrite any `superpowers:<name>` to bare names and any sibling-path reference (`condition-based-waiting.md` etc.) to `references/<file>` so they resolve from the SKILL.md location.

Run: `grep -rn 'superpowers:' skills/systematic-debugging/references/ || echo clean`

- [ ] **Step 3: Add the two tables to SKILL.md**

Append before `## Completion Criteria`: the SP "Common Rationalizations" table and the SP "Signals You're Doing It Wrong" list (retitle the latter `## Signals The Approach Is Wrong` and drop the possessive phrasing).

- [ ] **Step 4: Reference the technique files from SKILL.md**

In Phase 1 (backward tracing) add: `See [references/root-cause-tracing.md](references/root-cause-tracing.md) for the complete backward-tracing technique.` In Phase 4 add pointers to `defense-in-depth.md` and `condition-based-waiting.md`. Add a `## Supporting Techniques` section listing all four plus `scripts/find-polluter.sh` (one line each, with load condition).

- [ ] **Step 5: Provenance comment. Then verify every body reference resolves:**

```bash
for f in $(grep -oE 'references/[a-z-]+\.(md|ts)|scripts/[a-z-]+\.sh' skills/systematic-debugging/SKILL.md | sort -u); do
  test -f "skills/systematic-debugging/$f" && echo "OK $f" || echo "MISSING $f"
done
grep -q 'Merged from superpowers 6.3.0' skills/systematic-debugging/SKILL.md && echo "provenance OK"
```

- [ ] **Step 6: Commit**

```bash
git add skills/systematic-debugging
git commit -m "feat: port superpowers debugging technique files + tables into systematic-debugging"
```

#### Task 1.4: test-driven-development — writing-good-tests.md + tables

**Files:**
- Modify: `skills/test-driven-development/SKILL.md`
- Create: `skills/test-driven-development/references/writing-good-tests.md`

- [ ] **Step 1: Copy the reference**

```bash
mkdir -p skills/test-driven-development/references
cp "$SP/test-driven-development/writing-good-tests.md" skills/test-driven-development/references/
```
Fix any `superpowers:` refs inside it to bare names.

- [ ] **Step 2: Add tables + digraph to SKILL.md**

Append: SP's `## Common Rationalizations` table and `## When Stuck` table. Add the RED-GREEN-REFACTOR ```dot``` digraph near the "Core rule" section. Keep all existing A Team sections (activation boundary, characterization baseline, completion check).

- [ ] **Step 3: Reference the file**

In the "Test design rules" section add: `When writing or changing any test, read [references/writing-good-tests.md](references/writing-good-tests.md).`

- [ ] **Step 4: Provenance comment. Verify:**

```bash
test -f skills/test-driven-development/references/writing-good-tests.md && echo "ref OK"
grep -q 'references/writing-good-tests.md' skills/test-driven-development/SKILL.md && echo "link OK"
grep -qi 'When Stuck' skills/test-driven-development/SKILL.md && echo "table OK"
grep -n 'superpowers:' skills/test-driven-development/SKILL.md || echo "no prefix OK"
```

- [ ] **Step 5: Commit**

```bash
git add skills/test-driven-development
git commit -m "feat: port writing-good-tests + rationalization tables into test-driven-development"
```

#### Task 1.5: writing-plans — plan-document-reviewer-prompt.md

**Files:**
- Modify: `skills/writing-plans/SKILL.md`
- Create: `skills/writing-plans/references/plan-document-reviewer-prompt.md`

- [ ] **Step 1: Copy the reviewer prompt**

```bash
mkdir -p skills/writing-plans/references
cp "$SP/writing-plans/plan-document-reviewer-prompt.md" skills/writing-plans/references/
```
Strip `superpowers:` refs.

- [ ] **Step 2: Reference it from the "Challenge the plan" / "Self-Review" section**

Add: `For an independent review pass, dispatch a reviewer with [references/plan-document-reviewer-prompt.md](references/plan-document-reviewer-prompt.md).` Keep the A Team body otherwise unchanged (it is already the more developed version).

- [ ] **Step 3: Provenance comment. Verify:**

```bash
test -f skills/writing-plans/references/plan-document-reviewer-prompt.md && echo "ref OK"
grep -q 'plan-document-reviewer-prompt.md' skills/writing-plans/SKILL.md && echo "link OK"
grep -n 'superpowers:' skills/writing-plans/SKILL.md || echo "no prefix OK"
```

- [ ] **Step 4: Commit**

```bash
git add skills/writing-plans
git commit -m "feat: add plan-document-reviewer-prompt reference to writing-plans"
```

#### Task 1.6: writing-skills — 3 support files + "Match the Form to the Failure"

**Files:**
- Modify: `skills/writing-skills/SKILL.md`
- Create: `skills/writing-skills/references/anthropic-best-practices.md`, `.../references/graphviz-conventions.dot`, `.../scripts/render-graphs.js`

- [ ] **Step 1: Copy the 3 files NOT already present**

```bash
mkdir -p skills/writing-skills/scripts
cp "$SP/writing-skills/anthropic-best-practices.md" skills/writing-skills/references/
cp "$SP/writing-skills/graphviz-conventions.dot"    skills/writing-skills/references/
cp "$SP/writing-skills/render-graphs.js"            skills/writing-skills/scripts/
```
Do NOT copy `persuasion-principles.md` or `testing-skills-with-subagents.md` (already in `references/`). Do NOT copy `CLAUDE_MD_TESTING.md`.

- [ ] **Step 2: Add the "Match the Form to the Failure" section**

Insert SP's `## Match the Form to the Failure` section (the 4-row failure→form table + "why prohibitions backfire" note + "no nuance clauses" rules) after the existing `### 7. Match instruction form to failure` step, as a deeper reference block. Reconcile wording so the two don't contradict — the SP table is the detailed version of the existing A Team step.

- [ ] **Step 3: Update `references/index.md`**

Add `anthropic-best-practices.md` and `graphviz-conventions.dot` to the lookup rules with load conditions ("Anthropic-specific authoring guidance"; "graphviz style when adding a flowchart"). Add `scripts/render-graphs.js` note.

- [ ] **Step 4: Provenance comment. Verify:**

```bash
for f in references/anthropic-best-practices.md references/graphviz-conventions.dot scripts/render-graphs.js; do
  test -f "skills/writing-skills/$f" && echo "OK $f" || echo "MISSING $f"
done
grep -qi 'Match the Form to the Failure' skills/writing-skills/SKILL.md && echo "section OK"
grep -n 'superpowers:' skills/writing-skills/SKILL.md || echo "no prefix OK"
```

- [ ] **Step 5: Commit**

```bash
git add skills/writing-skills
git commit -m "feat: port anthropic-best-practices + graphviz + render-graphs into writing-skills"
```

---

### Phase 2 — Full-body adoptions under `writing-skills` (§3.3)

> Both tasks: invoke the `writing-skills` skill first and follow its RED→GREEN→REFACTOR. RED baseline already captured in Task 0.1.

#### Task 2.1: brainstorming — replace body with superpowers, preserve items 1–5

**Files:**
- Modify: `skills/brainstorming/SKILL.md`
- Create: `skills/brainstorming/visual-companion.md`, `skills/brainstorming/spec-document-reviewer-prompt.md`, `skills/brainstorming/scripts/{server.cjs,helper.js,frame-template.html,start-server.sh,stop-server.sh}`

- [ ] **Step 1 (GREEN): Copy support files**

```bash
mkdir -p skills/brainstorming/scripts
cp "$SP/brainstorming/visual-companion.md"              skills/brainstorming/
cp "$SP/brainstorming/spec-document-reviewer-prompt.md" skills/brainstorming/
cp "$SP/brainstorming/scripts/"*                        skills/brainstorming/scripts/
```

- [ ] **Step 2 (GREEN): Replace the body**

Replace everything below the frontmatter `---` of `skills/brainstorming/SKILL.md` with the body of `$SP/brainstorming/SKILL.md`, then apply the 5 preserved items from spec §3.3:
1. keep the existing A Team frontmatter `description` (do not take SP's);
2. `docs/superpowers/specs/` → `.claude/docs/specs/` (2 occurrences: the checklist step and the "After the Design" section);
3. no `superpowers:` prefixes (SP body references `writing-plans` bare already — confirm);
4. add the provenance comment as the first body line;
5. replace the `elements-of-style:writing-clearly-and-concisely` reference with: `Write the spec clearly and concisely.`

- [ ] **Step 3 (GREEN): Re-run the representative task**

Re-run the Task 0.1 `brainstorming` prompt against the now-merged skill (invoke `Skill(brainstorming)` — it still resolves to `superpowers:` until Task 4.1, so instead read `skills/brainstorming/SKILL.md` directly and follow it). Confirm: path classification present, approval gate present, A Team `description` unchanged. Write `.claude/docs/plans/_red-baselines/brainstorming-after.md` with the comparison.

- [ ] **Step 4 (REFACTOR): Run the `writing-skills` §9 validation checklist**

```bash
# frontmatter parses + name matches dir
head -5 skills/brainstorming/SKILL.md
python3 -c "import yaml,sys; d=yaml.safe_load(open('skills/brainstorming/SKILL.md').read().split('---')[1]); assert d['name']=='brainstorming'; print('frontmatter OK')"
# every body reference resolves
for f in $(grep -oE '[a-z-]+\.(md|cjs|js|html|sh)' skills/brainstorming/SKILL.md | sort -u); do
  find skills/brainstorming -name "$f" | grep -q . && echo "OK $f" || echo "CHECK $f"
done
# no forbidden strings
grep -n 'superpowers:\|docs/superpowers\|elements-of-style' skills/brainstorming/SKILL.md || echo "clean OK"
grep -q 'Merged from superpowers 6.3.0' skills/brainstorming/SKILL.md && echo "provenance OK"
```
Also confirm by reading: description matches scope; positive trigger ("let's build X") and a near-miss ("what does this error mean?" → should NOT trigger) behave correctly.

- [ ] **Step 5: Commit**

```bash
git add skills/brainstorming .claude/docs/plans/_red-baselines/brainstorming-after.md
git commit -m "feat: adopt superpowers brainstorming body, preserve A Team description + spec path"
```

#### Task 2.2: subagent-driven-development — replace body with superpowers, preserve items 1–5

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`
- Create: `skills/subagent-driven-development/scripts/{sdd-workspace,task-brief,review-package}`, `.../implementer-prompt.md`, `.../task-reviewer-prompt.md`, `.../re-review-prompt.md`

- [ ] **Step 1 (GREEN): Copy support files**

```bash
mkdir -p skills/subagent-driven-development/scripts
cp "$SP/subagent-driven-development/scripts/"*            skills/subagent-driven-development/scripts/
cp "$SP/subagent-driven-development/implementer-prompt.md"   skills/subagent-driven-development/
cp "$SP/subagent-driven-development/task-reviewer-prompt.md" skills/subagent-driven-development/
cp "$SP/subagent-driven-development/re-review-prompt.md"     skills/subagent-driven-development/
chmod +x skills/subagent-driven-development/scripts/*
```

- [ ] **Step 2 (GREEN): Replace the body**

Replace the body of `skills/subagent-driven-development/SKILL.md` with `$SP/subagent-driven-development/SKILL.md`'s body, then apply §3.3 preserved items:
1. keep the A Team frontmatter `description`;
2. no path changes needed (SP uses `.superpowers/sdd/` for its git-ignored workspace — keep that, it is scratch, not a doc path; but change any `docs/superpowers/plans/` in prose examples → `.claude/docs/plans/`);
3. rewrite `superpowers:finishing-a-development-branch` → `finishing-a-development-branch`, `superpowers:using-git-worktrees` → `using-git-worktrees`, `superpowers:requesting-code-review` → `requesting-code-review`, and `../requesting-code-review/code-reviewer.md` stays (that skill exists after Phase 3 — sequence note: Phase 3 runs before this is wired live, but body text can reference it now);
4. provenance comment first body line;
5. keep the A Team Model-Selection tier table; where SP's "Model Selection" section adds guidance (turn-count, escalation), merge it, and add a line: `Tiers map to .claude/rules/performance.md.`

- [ ] **Step 3 (GREEN): Re-run the representative task**

Follow `skills/subagent-driven-development/SKILL.md` for the Task 0.1 2-task plan prompt. Confirm: ledger file created, fresh subagent per task, two-stage review. Write `.claude/docs/plans/_red-baselines/subagent-driven-development-after.md`.

- [ ] **Step 4 (REFACTOR): `writing-skills` §9 checklist**

```bash
python3 -c "import yaml; d=yaml.safe_load(open('skills/subagent-driven-development/SKILL.md').read().split('---')[1]); assert d['name']=='subagent-driven-development'; print('frontmatter OK')"
for f in $(grep -oE '(scripts/[a-z-]+|[a-z-]+-prompt)\.?[a-z]*' skills/subagent-driven-development/SKILL.md | sort -u); do
  find skills/subagent-driven-development -name "${f##*/}*" | grep -q . && echo "OK $f" || echo "CHECK $f"
done
grep -n 'superpowers:' skills/subagent-driven-development/SKILL.md || echo "no prefix OK"
grep -q 'Merged from superpowers 6.3.0' skills/subagent-driven-development/SKILL.md && echo "provenance OK"
grep -q 'rules/performance.md' skills/subagent-driven-development/SKILL.md && echo "tier link OK"
```

- [ ] **Step 5: Commit**

```bash
git add skills/subagent-driven-development .claude/docs/plans/_red-baselines/subagent-driven-development-after.md
git commit -m "feat: adopt superpowers subagent-driven-development body (ledger, fix-loop, scripts)"
```

---

### Phase 3 — Port the 2 new review skills (§4.2)

#### Task 3.1: receiving-code-review

**Files:**
- Create: `skills/receiving-code-review/SKILL.md`

- [ ] **Step 1: Copy and adapt**

```bash
mkdir -p skills/receiving-code-review
cp "$SP/receiving-code-review/SKILL.md" skills/receiving-code-review/SKILL.md
```
Edits: keep the SP `description` (A Team has none to preserve here). Replace `your human partner` → `the user` throughout. Rewrite any `superpowers:<name>` → bare name. Add provenance comment: `<!-- Ported from superpowers 6.3.0 on 2026-09-09. See .claude/docs/specs/2026-09-09-a-team-wiring-review-design.md -->`

- [ ] **Step 2: Verify frontmatter + name**

```bash
python3 -c "import yaml; d=yaml.safe_load(open('skills/receiving-code-review/SKILL.md').read().split('---')[1]); assert d['name']=='receiving-code-review'; print('OK')"
grep -n 'superpowers:\|your human partner' skills/receiving-code-review/SKILL.md || echo "clean OK"
```

- [ ] **Step 3: Commit**

```bash
git add skills/receiving-code-review
git commit -m "feat: port receiving-code-review skill from superpowers"
```

#### Task 3.2: requesting-code-review + code-reviewer.md template

**Files:**
- Create: `skills/requesting-code-review/SKILL.md`, `skills/requesting-code-review/code-reviewer.md`

- [ ] **Step 1: Copy and adapt**

```bash
mkdir -p skills/requesting-code-review
cp "$SP/requesting-code-review/SKILL.md"        skills/requesting-code-review/SKILL.md
cp "$SP/requesting-code-review/code-reviewer.md" skills/requesting-code-review/code-reviewer.md
```
Edits (both files): `your human partner` → `the user`; `superpowers:<name>` → bare; `docs/superpowers/plans/` → `.claude/docs/plans/`. In `SKILL.md`, add a "Relationship to the `code-reviewer` agent" note: *this skill is the request protocol; `.claude/agents/code-reviewer.md` is the reviewer persona `/code-review` and `/quality-gate` dispatch.* Add provenance comment.

- [ ] **Step 2: Verify**

```bash
python3 -c "import yaml; d=yaml.safe_load(open('skills/requesting-code-review/SKILL.md').read().split('---')[1]); assert d['name']=='requesting-code-review'; print('OK')"
test -f skills/requesting-code-review/code-reviewer.md && echo "template OK"
grep -n 'superpowers:\|your human partner\|docs/superpowers' skills/requesting-code-review/*.md || echo "clean OK"
```

- [ ] **Step 3: Commit**

```bash
git add skills/requesting-code-review
git commit -m "feat: port requesting-code-review skill + code-reviewer template from superpowers"
```

---

### Phase 4 — Wiring (§4.5)

#### Task 4.1: Symlink the 13 skills into `.claude/skills/`

**Files:**
- Create: 13 symlinks under `.claude/skills/`

**Interfaces:**
- Consumes: merged/ported skills from Phases 1–3.
- Produces: bare-name resolution for all 26.

- [ ] **Step 1: Create the symlinks**

```bash
cd .claude/skills
for s in brainstorming dispatching-parallel-agents executing-plans \
         finishing-a-development-branch subagent-driven-development \
         systematic-debugging test-driven-development using-git-worktrees \
         verification-before-completion writing-plans writing-skills \
         receiving-code-review requesting-code-review; do
  ln -s "../../skills/$s" "$s"
done
cd ../..
```

- [ ] **Step 2: Verify count and targets**

```bash
ls -la .claude/skills | grep -c '\->'          # expect: 27 (26 skills + react-aria)
for s in .claude/skills/*; do
  [ -e "$s" ] || echo "BROKEN: $s"
done
echo "no BROKEN lines = all resolve"
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills
git commit -m "feat: symlink 13 merged/ported skills into .claude/skills (26/26 resolve local)"
```

#### Task 4.2: Complete the `Skill()` allow-list

**Files:**
- Modify: `.claude/settings.json`

- [ ] **Step 1: Add 14 entries**

In `permissions.allow`, add (keep the file's existing 2-space indentation and array formatting):
```
"Skill(adr)", "Skill(adr:*)",
"Skill(architecture-design)", "Skill(architecture-design:*)",
"Skill(architecture-review)", "Skill(architecture-review:*)",
"Skill(managing-github-actions)", "Skill(managing-github-actions:*)",
"Skill(scalability-review)", "Skill(scalability-review:*)",
"Skill(receiving-code-review)", "Skill(receiving-code-review:*)",
"Skill(requesting-code-review)", "Skill(requesting-code-review:*)"
```

- [ ] **Step 2: Validate JSON + count**

```bash
python3 -c "import json; d=json.load(open('.claude/settings.json')); print('valid JSON')"
grep -oE '"Skill\([^"]*\)"' .claude/settings.json | sort -u | wc -l   # expect: 52 (26 names x 2 forms)
```

- [ ] **Step 3: Commit**

```bash
git add .claude/settings.json
git commit -m "feat: add adr, architecture-*, managing-github-actions, scalability-review + review skills to Skill() allow-list"
```

#### Task 4.3: Verify 26/26 resolve un-prefixed and un-prompted

**Files:** none (verification only)

- [ ] **Step 1: Enumerate expected skills**

```bash
ls -1 skills | grep -v '\.md$' | sort > /tmp/skills-on-disk.txt
wc -l /tmp/skills-on-disk.txt   # expect: 26
comm -3 /tmp/skills-on-disk.txt <(ls -1 .claude/skills | grep -v react-aria | sort)
echo "no output above = .claude/skills matches skills/ exactly"
```

- [ ] **Step 2: Spot-check 5 invocations (3 formerly shadowed)**

Invoke each and confirm the body shown is the A Team fork (has the provenance comment) and no permission prompt fired:
- `Skill(brainstorming)` → expect three-path body + provenance
- `Skill(subagent-driven-development)` → expect ledger body + provenance
- `Skill(systematic-debugging)` → expect A Team body + "Supporting Techniques"
- `Skill(adr)` → expect no prompt (was missing from allow-list)
- `Skill(requesting-code-review)` → expect ported body

Record results inline in the task ledger. No commit (verification only).

---

### Phase 5 — Agent roster (§4.4)

#### Task 5.1: Delete chief-of-staff

**Files:**
- Delete: `.claude/agents/chief-of-staff.md`

- [ ] **Step 1: Confirm no references, then delete**

```bash
grep -rn 'chief-of-staff' . --include='*.md' --include='*.json' --exclude-dir=node_modules --exclude-dir=.git
# expect: only .claude/agents/chief-of-staff.md itself (and possibly this plan/spec)
git rm .claude/agents/chief-of-staff.md
```

- [ ] **Step 2: Re-grep to confirm clean (excluding plan/spec)**

```bash
grep -rn 'chief-of-staff' . --include='*.md' --exclude-dir=node_modules --exclude-dir=.git | grep -v 'docs/specs/2026-09-09\|docs/plans/2026-09-09' || echo "clean OK"
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove chief-of-staff agent (unrelated to this project)"
```

#### Task 5.2: Agent model-tier audit

**Files:** none yet (feeds Task 7.5 traceability doc)

- [ ] **Step 1: Extract every agent's model**

```bash
for f in .claude/agents/*.md; do
  n=$(basename "$f" .md)
  m=$(grep -m1 '^model:' "$f" | awk '{print $2}')
  echo "$n : $m"
done
```

- [ ] **Step 2: Compare to the tier rule**

Expected per Global Constraints: `orchestrator`, `architect` = `opus`; `doc-updater`, `harness-optimizer`, `performance-profiler` = `haiku`; all others = `sonnet`. Write the pass/mismatch list to a scratch note for Task 7.5. Do NOT edit agent files in this task — mismatches are reported, and only corrected in Task 7.5 if the user confirms.

- [ ] **Step 3: No commit (analysis only).**

---

### Phase 6 — Commands (§4.3)

#### Task 6.1: `/skills` dispatcher command

**Files:**
- Create: `.claude/commands/skills.md`

- [ ] **Step 1: Write the file**

Content:
```markdown
# /skills

Index of every A Team skill. To run one, invoke `Skill(<name>)` (bare name — all 26 resolve to the A Team version).

| Skill | Trigger (short) | Command entry | Executing agent(s) |
|---|---|---|---|
| adr | Hard-to-reverse decision to record/revisit | /adr | architect |
| api-contract-first | Before any external service boundary | — | architect |
| architecture-audit | Inherited/unfamiliar codebase health check | — | architect |
| architecture-design | Design a system from requirements | — | architect |
| architecture-review | Assess a design/RFC/structural PR | /architecture-review | architect |
| brainstorming | Before any creative work | /feature (step 1) | — |
| dispatching-parallel-agents | 2+ independent tasks, no shared state | — | — |
| executing-plans | Execute a written plan in this session | — | — |
| finishing-a-development-branch | Branch ready for pre-merge/PR | /feature (step 5) | — |
| five-whys | Failure recurs after surface fixes | — | debugger |
| incident-response | Production degraded or down | /incident-response | — |
| managing-github-actions | Reviewing/changing .github/workflows/** | — | infra-reviewer |
| performance-audit | Perf regression / pre-release gate | — | performance-profiler |
| receiving-code-review | Evaluating incoming review feedback | /code-review | code-reviewer |
| requesting-code-review | Dispatching a review before merge | /quality-gate | code-reviewer |
| scalability-review | "Will it scale / handle Nx" | — | architect |
| skill-duplication-audit | 2+ skills overlap in scope | — | — |
| smart-init | INIT.md missing, needs onboarding | /orchestrate init | orchestrator |
| subagent-driven-development | Execute plan via fresh subagents | /feature (step 3) | — |
| systematic-debugging | Any bug/failure, cause not established | /debug | debugger |
| test-driven-development | Implement/change observable behaviour | — | tdd-guide |
| using-a-team | Meta-skill, injected at session start | — | orchestrator |
| using-git-worktrees | Isolate before implementing | — | — |
| verification-before-completion | Before claiming any verifiable result | /quality-gate | — |
| writing-plans | Approved direction → implementation plan | /plan | planner |
| writing-skills | Authoring/editing a SKILL.md | — | — |

Full cross-reference: [.claude/docs/traceability.md](../docs/traceability.md).
```

- [ ] **Step 2: Verify 26 data rows**

```bash
awk -F'|' '/^\| [a-z]/ {c++} END{print c}' .claude/commands/skills.md   # expect: 26
```

- [ ] **Step 3: Commit**

```bash
git add .claude/commands/skills.md
git commit -m "feat: add /skills dispatcher command (index of all 26 skills)"
```

#### Task 6.2: Thin alias commands `/adr`, `/incident-response`, `/architecture-review`

**Files:**
- Create: `.claude/commands/adr.md`, `.claude/commands/incident-response.md`, `.claude/commands/architecture-review.md`

- [ ] **Step 1: Write the 3 files** (matching the existing plain `# /name` command style — no frontmatter)

`.claude/commands/adr.md`:
```markdown
# /adr

Record or revisit a consequential, hard-to-reverse technical decision as an Architecture Decision Record.

**Invokes:** `adr` skill

**Usage:**
```
/adr Choose the session storage mechanism for multi-tab auth
/adr Supersede ADR-004 now that B2C replaces the custom flow
```

Produces a dated ADR in `docs/adr/` matching repo precedent: context, decision, honest consequences, alternatives with rejection reasons, rollback, review trigger. Not for reversible implementation choices or routine library picks.
```

`.claude/commands/incident-response.md`:
```markdown
# /incident-response

Production incident playbook. Use immediately when production is degraded or down.

**Invokes:** `incident-response` skill

**Usage:**
```
/incident-response Portal login returning 503 for all users since 14:20
```

Five phases: detect, contain, diagnose, resolve, post-mortem. Coordinates the response and ensures the incident produces a lasting fix.
```

`.claude/commands/architecture-review.md`:
```markdown
# /architecture-review

Assess a proposed design, RFC, or PR-level structural decision before it is built.

**Invokes:** `architecture-review` skill (via the `architect` agent for specialist depth)

**Usage:**
```
/architecture-review docs/rfcs/007-offline-queue.md
/architecture-review Should the submission flow move to a state machine?
```

Produces: labelled assumptions, a verdict, trade-offs and alternatives, escalation risks, required changes, validation/rollback. For producing a design from scratch use `architecture-design`; for a whole-system map use `architecture-audit`.
```

- [ ] **Step 2: Verify**

```bash
for c in adr incident-response architecture-review; do
  test -f ".claude/commands/$c.md" && head -1 ".claude/commands/$c.md"
done
```

- [ ] **Step 3: Commit**

```bash
git add .claude/commands/adr.md .claude/commands/incident-response.md .claude/commands/architecture-review.md
git commit -m "feat: add /adr, /incident-response, /architecture-review thin alias commands"
```

#### Task 6.3: Wire review skills into `/code-review` and `/quality-gate`

**Files:**
- Modify: `.claude/commands/code-review.md`, `.claude/commands/quality-gate.md`

- [ ] **Step 1: `/code-review` — add reception protocol line**

After the `**Invokes:** \`code-reviewer\` agent` line add:
```markdown
**Reception protocol:** when acting on the findings, follow the `receiving-code-review` skill — verify before implementing, push back with technical reasoning, no performative agreement.
```

- [ ] **Step 2: `/quality-gate` — reference the dispatch protocol**

In "Step 2 — Reviews", add a lead line:
```markdown
Dispatch each reviewer per the `requesting-code-review` skill (BASE/HEAD SHAs, scoped context, act-on-feedback loop).
```

- [ ] **Step 3: Verify**

```bash
grep -q 'receiving-code-review' .claude/commands/code-review.md && echo "code-review OK"
grep -q 'requesting-code-review' .claude/commands/quality-gate.md && echo "quality-gate OK"
```

- [ ] **Step 4: Commit**

```bash
git add .claude/commands/code-review.md .claude/commands/quality-gate.md
git commit -m "feat: wire receiving/requesting-code-review skills into /code-review and /quality-gate"
```

---

### Phase 7 — Docs reconciliation

#### Task 7.1: using-a-team/SKILL.md — purge phantoms, add real agents, 26 skills

**Files:**
- Modify: `skills/using-a-team/SKILL.md`

- [ ] **Step 1: Language & Domain Reviews table — trim to real**

Replace the whole table body with only:
```markdown
| TypeScript / React / frontend files changed | **typescript-reviewer** |
| Python files changed | **python-reviewer** |
| Terraform / Docker / K8s / CI changed | **infra-reviewer** |
| Any privacy / payment / regulated-data code | **compliance-reviewer** |
```
Add below the table: `> Other language reviewers (Go, Rust, Kotlin, Swift, Flutter, database) are added on demand when that stack enters the repo.`

- [ ] **Step 2: "Before Any API Endpoint" — remove data-migration row**

Delete the `| Any \`ALTER TABLE\`, \`DROP\`, or backfill in production | **data-migration** ... |` row. Leave the `api-contract-first` row.

- [ ] **Step 3: Add real-but-unlisted agents**

In "After Code Changes" add: `| Docs/codemaps drift after a feature lands | **doc-updater** agent |` and `| Dead code / unused deps / duplication (never during active feature work) | **refactor-cleaner** agent |`.
In "During Development" add: `| Writing a new feature test-first, want a persona to drive it | **tdd-guide** agent (or the test-driven-development skill inline) |`.
In "Performance & Production" or a new "E2E" row add: `| Critical user-flow E2E coverage | **e2e-runner** agent |`.

- [ ] **Step 4: Add the 2 review skills + responsibility-model pointer**

In "After Code Changes": `| Acting on review feedback | **receiving-code-review** skill |` and `| Dispatching a review before merge | **requesting-code-review** skill |`.
Under "Skill Registration (For New Skills)" add a line: `The primitive responsibility model (skill vs agent vs command vs rule) is defined in \`.claude/rules/patterns.md\`.`

- [ ] **Step 5: Verify**

```bash
grep -Ec 'go-reviewer|rust-reviewer|kotlin-reviewer|swift-reviewer|flutter-reviewer|database-reviewer|ai-reviewer|data-migration' skills/using-a-team/SKILL.md  # expect: 0
grep -Ec 'doc-updater|e2e-runner|tdd-guide|refactor-cleaner|typescript-reviewer' skills/using-a-team/SKILL.md  # expect: >= 5
grep -Ec 'receiving-code-review|requesting-code-review' skills/using-a-team/SKILL.md  # expect: >= 2
```

- [ ] **Step 6: Commit**

```bash
git add skills/using-a-team/SKILL.md
git commit -m "fix: reconcile using-a-team triggers — drop phantom agents, add real ones, 26 skills"
```

#### Task 7.2: CLAUDE.md skills table → 26

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add 2 rows** to the `## Skills` table, alphabetical position:
```markdown
| `receiving-code-review` | Evaluating incoming code-review feedback — verify before implementing, technical pushback over performative agreement. |
| `requesting-code-review` | Dispatching a code-review subagent before merge — scoped context, act-on-feedback loop. Pairs with the `code-reviewer` agent. |
```

- [ ] **Step 2: Verify count**

```bash
awk '/^## Skills/,/^## Instruction files/' CLAUDE.md | grep -c '^| `'   # expect: 26
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add receiving/requesting-code-review to CLAUDE.md skills table (26)"
```

#### Task 7.3: AGENTS.md skills table → 26

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Add the same 2 rows** to the `## Skills` table in `AGENTS.md` (same wording as Task 7.2).

- [ ] **Step 2: Verify**

```bash
awk '/^## Skills/,/^## Instruction Files/' AGENTS.md | grep -c '^| `'   # expect: 26
```

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add receiving/requesting-code-review to AGENTS.md skills table (26)"
```

#### Task 7.4: `.claude/rules/` — real refs + responsibility model

**Files:**
- Modify: `.claude/rules/agents.md`, `.claude/rules/orchestration.md`, `.claude/rules/patterns.md`, `.claude/rules/performance.md`

- [ ] **Step 1: `agents.md` — remove any phantom agent, add the model-tier note**

`grep -nE 'go-reviewer|rust-reviewer|kotlin-reviewer|swift-reviewer|flutter-reviewer|database-reviewer|ai-reviewer|chief-of-staff' .claude/rules/agents.md` — delete or rewrite each hit to the real roster. Ensure the "Immediate Agent Triggers" table references only agents that exist in `.claude/agents/`.

- [ ] **Step 2: `orchestration.md` + `performance.md` — same phantom sweep**

Run:
```bash
grep -nE 'go-reviewer|rust-reviewer|kotlin-reviewer|swift-reviewer|flutter-reviewer|database-reviewer|ai-reviewer|chief-of-staff|data-migration' .claude/rules/orchestration.md .claude/rules/performance.md
```
Rewrite each hit to the real roster. `performance.md` already defines the 3 tiers — if the explicit agent→tier assignment is not already present, add it: `Tier 1 (opus): orchestrator, architect. Tier 3 (haiku): doc-updater, harness-optimizer, performance-profiler. Tier 2 (sonnet): all other agents.`

- [ ] **Step 3: `patterns.md` — add the primitive responsibility model**

Append a section:
```markdown
## A Team Primitive Responsibilities

| Primitive | Owns | Does NOT own |
|---|---|---|
| Skill (`skills/**`) | Reusable methodology, decision structure, gates. Model-invoked via `Skill`; user-invocable as `/<name>`. | Persona, tool restriction, model tier. |
| Agent (`.claude/agents/**`) | A persona that executes a methodology under a fixed tool + model-tier budget. Cites the skill it runs. | Defining the methodology. |
| Command (`.claude/commands/**`) | User entry point composing skills + agents into a workflow, or a thin alias to one. | Containing methodology. |
| Rule (`.claude/rules/**`) | Always-on policy. | Task-specific workflow. |

All 26 skills resolve by bare name via `.claude/skills/` symlinks into `skills/**`. See `.claude/docs/traceability.md`.
```

- [ ] **Step 4: Verify**

```bash
grep -rEc 'go-reviewer|rust-reviewer|kotlin-reviewer|swift-reviewer|flutter-reviewer|database-reviewer|ai-reviewer|chief-of-staff|data-migration' .claude/rules/  # expect: 0 across all files
grep -q 'A Team Primitive Responsibilities' .claude/rules/patterns.md && echo "model OK"
```

- [ ] **Step 5: Commit**

```bash
git add .claude/rules
git commit -m "docs: reconcile .claude/rules to real agent roster + add primitive responsibility model"
```

#### Task 7.5: `.claude/docs/traceability.md`

**Files:**
- Create: `.claude/docs/traceability.md`

- [ ] **Step 1: Write the 3 tables**

**Skill table** (26 rows): `| Skill | Invoke | Trigger | Command entry point(s) | Executing agent(s) | Governing rule(s) |` — populate from the `/skills` command (Task 6.1) plus a `Governing rule(s)` column citing files in `.claude/rules/` (e.g. `test-driven-development` → `testing.md`; `finishing-a-development-branch` → `git-workflow.md`; `systematic-debugging` → none).

**Agent table** (17 rows post-deletion): `| Agent | Model tier | Runs skill(s) | Dispatched by command(s) | Tier matches performance.md? |` — fill the last column from Task 5.2 findings.

**Command table** (14 rows): `| Command | Type | Skills composed | Agents dispatched |`.

- [ ] **Step 2: Verify cross-references resolve**

```bash
# every skill named in traceability exists on disk
for s in $(awk -F'|' '/^\| [a-z]/ {gsub(/ /,"",$2); print $2}' .claude/docs/traceability.md | head -26); do
  test -d "skills/$s" || echo "MISSING skill: $s"
done
# every agent named exists
for a in $(grep -oE '`[a-z-]+`' .claude/docs/traceability.md | tr -d '`' | sort -u); do
  test -f ".claude/agents/$a.md" -o -f ".claude/commands/$a.md" -o -d "skills/$a" || true
done
awk -F'|' '/^\| [a-z]/ {c++} END{print "skill rows:", c}' .claude/docs/traceability.md
```

- [ ] **Step 3: Commit**

```bash
git add .claude/docs/traceability.md
git commit -m "docs: add command <-> skill <-> agent <-> rule traceability matrix"
```

#### Task 7.6: `.codex` confirmation note

**Files:**
- Modify: `.claude/docs/traceability.md` (append a short note)

- [ ] **Step 1: Append**

```markdown
## Codex surface

`.codex/config.toml` holds MCP server config only (`my-storybook-mcp-server`, `react-aria`). Codex consumes `AGENTS.md` as its instruction file — the skills table there (Task 7.3) is the Codex-facing skill registration. No skills manifest exists or is expected under `.codex/`.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/docs/traceability.md
git commit -m "docs: record that .codex needs no skills reconciliation"
```

---

### Phase 8 — Final verification

#### Task 8.1: Run the spec §7 success checklist

**Files:** none (verification); then `finishing-a-development-branch`.

- [ ] **Step 1: Mechanical checks**

```bash
# 26 skills, all symlinked
[ $(ls -1 skills | grep -vc '\.md$') -eq 26 ] && echo "26 skills OK"
[ $(ls .claude/skills | grep -vc react-aria) -eq 26 ] && echo "26 symlinks OK"
# no superpowers: prefix anywhere in skills/
grep -rn 'superpowers:' skills/ && echo "PREFIX LEAK" || echo "no prefix OK"
# provenance on all 11 merged
for s in brainstorming dispatching-parallel-agents executing-plans finishing-a-development-branch subagent-driven-development systematic-debugging test-driven-development using-git-worktrees verification-before-completion writing-plans writing-skills; do
  grep -q 'Merged from superpowers 6.3.0' "skills/$s/SKILL.md" || echo "PROVENANCE MISSING: $s"
done
# 52 Skill() allow entries
[ $(grep -oE '"Skill\([^"]*\)"' .claude/settings.json | sort -u | wc -l) -eq 52 ] && echo "allow-list OK"
python3 -c "import json; json.load(open('.claude/settings.json')); print('settings.json valid')"
# chief-of-staff gone
test ! -f .claude/agents/chief-of-staff.md && echo "chief-of-staff gone OK"
# phantom sweep across the whole A Team surface
grep -rEn 'go-reviewer|rust-reviewer|kotlin-reviewer|swift-reviewer|flutter-reviewer|database-reviewer|ai-reviewer|data-migration' skills/using-a-team .claude/rules CLAUDE.md AGENTS.md && echo "PHANTOM LEAK" || echo "phantom sweep OK"
# command count
[ $(ls -1 .claude/commands/*.md | wc -l) -eq 14 ] && echo "14 commands OK"
# skills tables = 26
awk '/^## Skills/,/^## Instruction/' CLAUDE.md | grep -c '^| `'
awk '/^## Skills/,/^## Instruction/' AGENTS.md | grep -c '^| `'
# dangling in-body references across merged skills
for s in skills/*/SKILL.md; do
  d=$(dirname "$s")
  for ref in $(grep -oE '\((references|scripts)/[A-Za-z0-9._-]+\)' "$s" | tr -d '()'); do
    test -e "$d/$ref" || echo "DANGLING: $s -> $ref"
  done
done
echo "no DANGLING lines = refs OK"
```

- [ ] **Step 2: Invocation checks**

Invoke `Skill(brainstorming)`, `Skill(subagent-driven-development)`, `Skill(systematic-debugging)`, `Skill(adr)`, `Skill(architecture-review)`, `Skill(receiving-code-review)`. For each confirm: A Team body (provenance comment visible) and no permission prompt. Record in ledger.

- [ ] **Step 3: Tick every box in spec §7**

Open `.claude/docs/specs/2026-09-09-a-team-wiring-review-design.md` §7 and check each item against the evidence above. Any unchecked item → fix and re-verify before proceeding.

- [ ] **Step 4: Delete RED-baseline scratch (optional) and finish the branch**

```bash
# keep or remove _red-baselines/ per preference; if removing:
git rm -r .claude/docs/plans/_red-baselines && git commit -m "chore: drop RED-baseline scratch after verification"
```
Then use the `finishing-a-development-branch` skill: run the repo's required checks (`npm run test:ci` is unaffected but run it to confirm), review the full branch diff against `main`, prepare the PR summary.

- [ ] **Step 5: Final commit / PR**

```bash
git log --oneline main..HEAD
# hand off per finishing-a-development-branch (merge locally / open PR / keep)
```

---

## Parallelization

- **Sequential backbone:** Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → (Phases 5, 6, 7 parallel-safe) → Phase 8.
- **Phase 1 tasks 1.1–1.6** are independent (different skill directories) — safe to parallelize across subagents. No shared files.
- **Phase 2 tasks 2.1 and 2.2** are independent directories — parallel-safe, but each is a full-body replacement and should get its own review seat.
- **Phase 3 tasks 3.1 and 3.2** independent — parallel-safe.
- **Phase 4 is a hard barrier:** 4.1 (symlinks) must follow all of Phases 1–3; 4.2 (settings.json) can run any time after Phase 3; 4.3 (verify) is last in the phase.
- **Phases 5, 6, 7 can run concurrently** after Phase 4 — they touch disjoint files (`.claude/agents/` vs `.claude/commands/` vs `skills/using-a-team/` + `CLAUDE.md` + `AGENTS.md` + `.claude/rules/` + `.claude/docs/`). Exception: Task 7.5 (traceability) consumes Task 5.2 output and Task 6.1 content — run 7.5 after 5.2 and 6.1.
- **Phase 8** is the final barrier — runs alone.
- `.claude/settings.json` is touched only by Task 4.2. `skills/using-a-team/SKILL.md` only by Task 7.1. No File-Claims collisions.

## Testing Strategy

- **Unit:** n/a (no code).
- **Integration:** skill resolution checks (Task 4.3, 8.1) — bare-name `Skill()` invocation returns the A Team body; permission prompt does not fire.
- **Regression:** `grep -rn 'superpowers:' skills/` stays empty; phantom-agent sweep stays empty; `npm run test:ci` behaviour unchanged (A Team files out of scope, but run once in Phase 8 to confirm no accidental in-scope edit).
- **Reference integrity:** every `(references/…)` / `(scripts/…)` link in every `skills/*/SKILL.md` resolves to an existing file (Task 8.1 Step 1 loop).
- **Manual/operational:** the two `writing-skills` §9 checklists (Tasks 2.1, 2.2) and the 6 spot-check invocations (Task 8.1 Step 2).

## Risks and Rollback

| Risk | Mitigation | Rollback |
|---|---|---|
| Full-body adoption changes a skill's behaviour mid-flight | Tasks 2.1/2.2 capture RED baseline, re-run the same task after, diff behaviour; own review seat each | `git revert` the task commit; the pre-merge fork is in history |
| Symlink form wrong on Windows | Reuse the exact `../../skills/<name>` form already working in `.claude/skills/`; Task 4.1 Step 2 checks every link resolves | `rm .claude/skills/<name>`; skill falls back to `superpowers:` |
| `settings.json` edit breaks JSON | Task 4.2 Step 2 runs `json.load` | `git checkout .claude/settings.json` |
| Copied SP support file has a dangling sibling ref | Task 8.1 dangling-ref loop catches it before Phase 8 exit | fix the ref or `git rm` the file + drop the body link |
| Deleting `chief-of-staff` breaks a hook | Task 5.1 Step 1 greps first | `git checkout .claude/agents/chief-of-staff.md` |
| `subagent-driven-development` body references `requesting-code-review` before Phase 3 lands | Phase 3 runs before Phase 4 wiring; body text may reference it early (Task 2.2 note) | none needed — sequencing handles it |
| Ported bash `scripts/` don't run on this Windows box | They run under the Bash tool (Git Bash), which the repo already uses; mark any needing `python`/extra tools "unvalidated" in traceability | skills degrade to their no-script path (documented in SP bodies) |

## Success Criteria

- [ ] `ls skills | grep -vc '\.md$'` = 26; `ls .claude/skills | grep -vc react-aria` = 26; every symlink resolves.
- [ ] `grep -rn 'superpowers:' skills/` is empty.
- [ ] All 11 merged `SKILL.md` carry the provenance comment; `brainstorming` + `subagent-driven-development` passed the `writing-skills` §9 checklist with RED/after baselines committed.
- [ ] Every `(references/…)` and `(scripts/…)` link in every `skills/*/SKILL.md` resolves (Task 8.1 loop prints no `DANGLING`).
- [ ] `grep -oE '"Skill\([^"]*\)"' .claude/settings.json | sort -u | wc -l` = 52; `settings.json` is valid JSON.
- [ ] 6 spot-check `Skill()` invocations return the A Team body with no permission prompt.
- [ ] `.claude/agents/chief-of-staff.md` deleted; phantom-agent + `data-migration` sweep across `skills/using-a-team`, `.claude/rules`, `CLAUDE.md`, `AGENTS.md` returns 0.
- [ ] `using-a-team/SKILL.md` lists `doc-updater`, `e2e-runner`, `tdd-guide`, `refactor-cleaner`, `typescript-reviewer` and both review skills.
- [ ] `CLAUDE.md` and `AGENTS.md` skills tables each have 26 rows.
- [ ] `.claude/rules/patterns.md` contains the "A Team Primitive Responsibilities" section.
- [ ] `.claude/commands/` has 14 `.md` files; `/code-review` cites `receiving-code-review`; `/quality-gate` cites `requesting-code-review`; `/skills` lists 26 rows.
- [ ] `.claude/docs/traceability.md` exists with skill (26), agent (17), command (14) tables; the `.codex` note is present; every cross-reference resolves.
- [ ] Every agent `model:` matches its performance.md tier, or the mismatch is listed with a rationale in traceability.md.
- [ ] `npm run test:ci` behaviour unchanged from `main`.
- [ ] Branch diff reviewed against `main`; PR summary prepared per `finishing-a-development-branch`.
