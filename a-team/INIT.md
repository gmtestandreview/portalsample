# a-team — Orchestration Entry Point

Read this file first. It is the entry point for every agent role working in this
repository under the AI-team model: it says who the roles are, what each one may
touch, which commands prove work is sound, and how context survives a chat
ending.

It is derived from three things already in this repo, and it defers to them:

| Source | What it provides |
| --- | --- |
| [`.github/skills/ai-team-orchestration/SKILL.md`](../.github/skills/ai-team-orchestration/SKILL.md) | The model: roles, chat architecture, sprint lifecycle, context recovery |
| [`.github/skills/ai-team-orchestration/references/`](../.github/skills/ai-team-orchestration/references/) | Templates for the brief, brainstorm, and sprint plan; the anti-pattern list |
| [`CLAUDE.md`](../CLAUDE.md) | This repository's real edit boundaries, stack, and validation commands |

Where this file and `CLAUDE.md` disagree about paths or commands, **`CLAUDE.md`
wins** — it describes the actual repository.

---

## 1. Quick start

```bash
# Orient: what sprint are we in, what is done, what is next
a-team/scripts/status.sh

# Confirm this workspace can do what your role assumes
a-team/scripts/preflight.sh --role dev      # or producer, qa

# Prove a change is sound before pushing
a-team/scripts/validate.sh --role dev

# Before the chat closes — verify the handoff is written
a-team/scripts/handoff.sh --latest
```

Start a new sprint, or a new team clone:

```bash
a-team/scripts/new-sprint.sh --next --name "Story coverage"
a-team/scripts/team-clone.sh qa 2
```

## 2. Scripts

All scripts live in [`a-team/scripts/`](scripts/), take `--help`, and are safe to
run from anywhere in the repo.

| Script | Purpose | Exit codes |
| --- | --- | --- |
| [`preflight.sh`](scripts/preflight.sh) | Probe tooling, git, and source layout before a role acts. Makes the "Preflight" section of each agent file mechanical instead of assumed. | `0` usable · `1` blocker |
| [`status.sh`](scripts/status.sh) | One screen of orchestration state read from the repo: branch, brief, sprint artifacts, task counts, sign-off. | `0` |
| [`new-sprint.sh`](scripts/new-sprint.sh) | Scaffold `docs/sprint-N/{plan,progress,done}.md` from [`a-team/templates/`](templates/). Refuses to overwrite without `--force`. | `0` written · `1` refused · `2` usage |
| [`validate.sh`](scripts/validate.sh) | Run this repo's real quality gates by name or role set. The one place gate names map to `package.json` scripts. | `0` pass · `1` fail · `2` usage |
| [`handoff.sh`](scripts/handoff.sh) | Verify a sprint's handoff artifacts are written and committed before the chat closes. | `0` complete · `1` incomplete · `2` usage |
| [`team-clone.sh`](scripts/team-clone.sh) | Create a separate clone per team on the right branch. Clones, never worktrees. | `0` ready · `1` blocked · `2` usage |

Shared helpers are in [`scripts/lib/common.sh`](scripts/lib/common.sh) — source
it, do not execute it.

## 3. Team roles and their real surfaces

The generic role table in the skill is adapted here to the paths that actually
exist in this repository. A role may edit only what its row lists.

| Role | Name | May edit | Must never edit |
| --- | --- | --- | --- |
| Producer | **Remy** | `docs/**`, `PROJECT_BRIEF.md`, `README.md`, `a-team/**` markdown | Any application source, any test |
| Product Designer | **Kira** | `docs/**` specs, `*.docs.mdx` | Application logic |
| Visual Director | **Milo** | `ClientApp/src/styles/**/*.scss`, component `*.stories.tsx` | `ClientApp/css/main.*.css` |
| Frontend Engineer | **Nova** | `ClientApp/src/**/*.{ts,tsx}` | Generated and vendor paths (§6) |
| Backend/Security Engineer | **Sage** | `ClientApp/src/authentication/**`, `ClientApp/src/validationSchemas/**`, `ClientApp/src/env.ts` | `ClientApp/src/api/web-api-client.ts` (generated) |
| DevOps Engineer | **Dash** | `.github/workflows/**`, `scripts/**` | Application source |
| QA Engineer | **Ivy** | `tests/**`, `docs/qa/**` | All of `ClientApp/src/**` |

Two constraints from the skill that matter more than the rest:

- **Remy writes no application code.** When the coordinator starts coding, the
  coordination stops. Remy files issues and writes plans; the dev team fixes.
- **Ivy does not fix what she finds.** QA files the issue; dev fixes it; QA
  verifies before it closes. Self-closing skips verification.

There is no backend service in this snapshot, so Sage's surface is the
security-adjacent frontend code above — auth config, validation schemas,
runtime env — not a server. Do not invent API or database work.

## 4. Chat architecture

Each team runs in its own chat and its own clone. A human carries messages
between them; no chat can see another's context.

```
              ┌───────────────────────────────┐
              │  Producer (Remy)              │
              │  clone: portalsample-producer │
              │  branch: main                 │
              │  plans · triages · merges     │
              └───────────────┬───────────────┘
                              │ human relays
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Dev              │ │ QA               │ │ DevOps           │
│ Nova·Sage·Milo   │ │ Ivy              │ │ Dash (on demand) │
│ -dev             │ │ -qa              │ │ -devops          │
│ feature/sprint-N │ │ feature/qa-N     │ │ feature/devops-N │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

Separate clones, **not** git worktrees: worktrees share one index, so parallel
teams collide on the staging area. `team-clone.sh` enforces this.

## 5. Sprint lifecycle

| Phase | Who | Action | Command |
| --- | --- | --- | --- |
| Plan | Remy | Scaffold and fill `docs/sprint-N/plan.md`; file the issues it references | `new-sprint.sh --next --name "…"` |
| Setup | Dev | Preflight, then branch | `preflight.sh --role dev` |
| Verify | Dev | Confirm every issue the plan references exists; halt and tell Remy if one does not | — |
| Implement | Dev | Work in priority order, one commit per fix, `fix: description (Fixes #NN)` | `validate.sh --role dev` per phase |
| Track | Dev | Update `docs/sprint-N/progress.md` after each phase | — |
| Close | Dev | Full gate set, write `done.md`, verify handoff, push, open a draft PR | `validate.sh --role closure`, `handoff.sh N` |
| Sign off | Ivy | Full playthrough, file issues, write `docs/qa/sprint-N-signoff.md` | `validate.sh --role qa` |
| Merge | Remy | After QA sign-off: regular merge, update `PROJECT_BRIEF.md` §7–8 | — |

## 6. Edit boundaries

Verbatim from [`CLAUDE.md`](../CLAUDE.md). `preflight.sh` asserts this layout,
so an agent carrying stale paths fails loudly rather than editing nothing.

**Edit freely:** `ClientApp/src/**/*.ts`, `ClientApp/src/**/*.tsx`,
`ClientApp/src/styles/**/*.scss`

**Never edit (generated / vendor):**

- `ClientApp/src/api/web-api-client.ts`
- `ClientApp/src/main.*.js`
- `ClientApp/css/main.*.css`
- `ClientApp/source-map-http-downloads/**`
- `ClientApp/src/external/**`
- `ClientApp/webpack/**`

If a task requires editing outside the safe targets, stop and confirm with the
user first.

## 7. Quality gates

`validate.sh` is the only place gate names map to `package.json` scripts. Run
`validate.sh --list` for the live mapping.

| Gate | Command |
| --- | --- |
| `type-check` | `npm run type-check` |
| `lint` | `npm run lint` |
| `lint-mdx` | `npm run lint:mdx` |
| `unit` | `npm run test:unit` |
| `storybook` | `npm run test:storybook` |
| `regression` | `npm run test:quality:regression` |
| `e2e` | `npm run test:e2e` |
| `build` / `storybook-build` | `npm run build` / `npm run build-storybook` |
| `ci` / `migration` | `npm run test:ci` / `npm run migration-check` |

Role sets:

| Set | Gates |
| --- | --- |
| `dev` | `type-check` `lint` `unit` |
| `qa` | `unit` `storybook` |
| `producer` | `type-check` |
| `closure` | `type-check` `lint` `unit` `storybook` `storybook-build` |

`regression` and `ci` are deliberately **not** in any role set: both need
`quality/vitest.regression.config.ts`, which is gitignored and absent (see §10).
`validate.sh` reports a gate whose precondition is missing as *unavailable* and
exits non-zero — unavailable is not a pass.

A failing gate is a real defect until proven otherwise. Never skip, disable, or
quarantine a test to reach green.

## 8. Git rules

From [`references/anti-patterns.md`](../.github/skills/ai-team-orchestration/references/anti-patterns.md).
Each of these was learned from a real failure.

| Never | Instead | Why |
| --- | --- | --- |
| Rebase a shared feature branch | Regular merge | Rebase rewrites history and loses commits when several chats contribute |
| Squash merge | Regular merge | Squash hides individual commits, so a single fix cannot be reverted |
| Force push | Fix forward, or revert | Force push destroys history other teams already pulled |
| Push to `main` | Branch → PR → merge | Direct pushes bypass review |
| Git worktrees for parallel teams | Separate clones | Worktrees share one index |
| Batch "fix everything" commits | One commit per fix, with issue reference | Batches cannot be reverted selectively |

## 9. Handoff and context recovery

Chat context dies. **The repository is the only shared memory.** Anything left
in conversation is lost.

Before a chat closes, `handoff.sh N` must pass. It checks that
`docs/sprint-N/progress.md` and `done.md` exist and are genuinely filled in,
that `PROJECT_BRIEF.md` mentions the sprint, that no template placeholders are
left, and that the working tree is committed.

To recover after a chat overflows, open a new one with:

> Read `a-team/INIT.md`, `PROJECT_BRIEF.md`, and `docs/sprint-N/progress.md`.
> Continue from where it left off.

If `PROJECT_BRIEF.md` is missing or corrupted, recreate it from
[`references/project-brief-template.md`](../.github/skills/ai-team-orchestration/references/project-brief-template.md)
before doing any sprint work.

## 10. Known divergences in this repository

Real mismatches found while writing this file. They are recorded rather than
silently patched, because resolving them is the Producer's call.

1. **The checked-in ai-team agent files name paths that do not exist here.**
   [`.github/agents/workflows/ai-team/*.agent.md`](../.github/agents/workflows/ai-team/)
   and [`workflows/README.md`](../.github/agents/workflows/README.md) reference
   `static/js/**` and `static/css/styles/**`. This repository uses
   `ClientApp/src/**`. An agent following those files literally would edit
   nothing. `preflight.sh` asserts the real layout and notes the discrepancy.
   `docs/sprint-1/progress.md` records Phase 1 work as landing "in static/js",
   which reads as inherited from the same stale wording.

2. **`workflows/README.md` classifies the `ai-team` family as "reference only"**
   because it assumed `PROJECT_BRIEF.md`, sprint artifacts, and git flow did not
   exist here. All three now do — `PROJECT_BRIEF.md`, `docs/sprint-1/`, and an
   `origin` remote — so that classification is out of date.

3. **The Storybook MCP server is a precondition, not a guarantee.** `CLAUDE.md`
   requires MCP tools for any component property before use, and forbids
   guessing. If the Storybook MCP server is not connected, Milo's and Nova's
   component work is blocked on verifying properties — say so rather than
   inferring a property from its name.

4. **Two `package.json` scripts point at a path that cannot exist in a clone.**
   `test:quality:regression` and `test:ci` both pass
   `--config quality/vitest.regression.config.ts`, but `quality/` is gitignored
   (`.gitignore:21`), untracked, and absent from this checkout. So
   `npm run test:ci` — the documented full CI gate — cannot run from a clean
   clone, and neither can the regression check named in `PROJECT_BRIEF.md`'s
   success criteria. `validate.sh` reports both gates as unavailable with the
   missing path rather than letting them fail opaquely, and keeps them out of
   the role sets. Resolving this is a Producer decision: either commit the
   config, or drop the flag from those scripts.

## 11. Source material

- Orchestration model — [`.github/skills/ai-team-orchestration/SKILL.md`](../.github/skills/ai-team-orchestration/SKILL.md)
- Anti-patterns — [`references/anti-patterns.md`](../.github/skills/ai-team-orchestration/references/anti-patterns.md)
- Brainstorm format — [`references/brainstorm-format.md`](../.github/skills/ai-team-orchestration/references/brainstorm-format.md)
- Brief template — [`references/project-brief-template.md`](../.github/skills/ai-team-orchestration/references/project-brief-template.md)
- Sprint plan template — [`references/sprint-plan-template.md`](../.github/skills/ai-team-orchestration/references/sprint-plan-template.md)
- Role definitions — [`.github/agents/workflows/ai-team/`](../.github/agents/workflows/ai-team/)
- Current program state — [`PROJECT_BRIEF.md`](../PROJECT_BRIEF.md)
