---
name: using-a-team
description: The meta-skill. Loaded at every session start. Defines which A Team skills and agents MUST be used for which situations. If a skill or agent applies, you do not have a choice — you must use it.
---

# Using A Team

This skill is injected at every session start. It defines mandatory skill and agent usage.

<HARD-GATE>
IF A SKILL OR AGENT IN THIS DOCUMENT APPLIES TO YOUR CURRENT TASK,
YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
Skipping a mandatory skill to save time is not allowed.
</HARD-GATE>

## Before ANY Code Is Written

| Situation | Required Skill/Agent |
|-----------|---------------------|
| New feature, component, or capability | **brainstorming** skill first |
| Have a spec, need an implementation plan | **writing-plans** skill |
| Have a plan, executing it | **subagent-driven-development** or **executing-plans** skill |
| Starting development work | **using-git-worktrees** skill (create isolation first) |

## During Development

| Situation | Required Skill/Agent |
|-----------|---------------------|
| Writing any new function or feature | **test-driven-development** skill (RED before GREEN) |
| Any bug, test failure, unexpected behavior | **systematic-debugging** skill (Phase 1 first), via the **debugger** agent |
| Bug persists after a surface fix, or a failure or process keeps recurring | **five-whys** skill (fix the root, not the symptom) |
| Multiple independent problems | **dispatching-parallel-agents** skill |
| Build or type errors | **build-error-resolver** agent (minimal diffs only) |
| Writing or changing tests, want a TDD persona | **tdd-guide** agent (persona alternative to the test-driven-development skill) |

## Before Claiming Completion

| Claim | Required Skill |
|-------|---------------|
| "The tests pass" | **verification-before-completion** (run tests, read output) |
| "The build succeeds" | **verification-before-completion** (run build, read output) |
| "The bug is fixed" | **verification-before-completion** (reproduce fix, read output) |
| "The feature works" | **verification-before-completion** (run the feature, read output) |
| "Done" / "Complete" | **verification-before-completion** (ALWAYS, no exceptions) |

After verification passes, Step 5 of `verification-before-completion` is mandatory: delete all log files, stack traces, and debug dumps generated during this task before reporting done.

## After Code Changes

| Situation | Required Agent |
|-----------|---------------|
| After writing or modifying code | **code-reviewer** agent |
| Auth, API, input handling, DB changes | **security-reviewer** agent |
| Before any PR merge | **quality-gate** command (runs both) |
| Wrapping up a branch | **finishing-a-development-branch** skill |
| Docs or codemaps drift after a feature lands | **doc-updater** agent |
| Dead code, unused deps, duplication (never during active feature work) | **refactor-cleaner** agent |
| Acting on code-review feedback | **receiving-code-review** skill (verify before implementing) |

## Architectural Decisions

| Situation | Required Skill/Agent |
|-----------|---------------------|
| Designing an architecture for new work from requirements | **architecture-design** skill (after **brainstorming**) |
| Assessing a design, RFC, proposal, or structural PR someone brings you | **architecture-review** skill |
| Recording or revisiting a hard-to-reverse decision | **adr** skill |
| "Will it scale / handle Nx / survive the launch" | **scalability-review** skill |
| Inherited/unfamiliar codebase, scaling milestone, or periodic health check | **architecture-audit** skill |
| System design or tech-stack/pattern decision needing a specialist | **architect** agent (routes to the skills above) |
| Complex feature planning | **planner** agent |

## Language & Domain Reviews

| Situation | Required Agent |
|-----------|---------------|
| TypeScript / React / frontend files changed | **typescript-reviewer** |
| Python files changed | **python-reviewer** |
| Terraform / Docker / K8s / CI files changed | **infra-reviewer** |
| Any privacy / payment / regulated-data code | **compliance-reviewer** |

> Other language reviewers (Go, Rust, Kotlin, Swift, Flutter, database) are added on demand when that stack enters the repo.

## CI / CD Changes

| Situation | Required Skill |
|-----------|---------------|
| `.github/workflows/**`, `.github/actions/**`, or CI/CD behaviour reviewed, diagnosed, or changed | **managing-github-actions** skill |
| `packageManager`, `engines`, `devEngines`, `allowScripts`, or root `postinstall` changed | **managing-github-actions** skill (reaches CI via corepack) |

## Before Any API Endpoint

| Situation | Required Skill |
|-----------|---------------|
| Writing a new REST / gRPC / GraphQL / event endpoint | **api-contract-first** (write the contract first) |

## Performance & Production

| Situation | Required |
|-----------|---------|
| Performance regression reported | **performance-profiler** agent (measure first) |
| Performance-critical feature pre-release | **performance-audit** skill |
| Production is degraded or down | **incident-response** skill (immediately) |
| Critical user-flow E2E coverage needed | **e2e-runner** agent |

## During Code Changes — Surgical Changes Rule

Every change must be scoped to what was requested. Before committing:

| Violation | What it looks like |
|-----------|-------------------|
| Drive-by refactoring | Renamed variables, added type hints, changed quote style — none of it was in the task |
| Style normalization | Rewrote adjacent code to match your preferences instead of the existing style |
| Orphan overreach | Removed dead code that existed before this task (only YOUR orphans are your responsibility) |

**Self-check:** "Would a reviewer see any line in this diff that cannot be explained by the task description?" If yes → undo it.

## Rationalization Red Flags

These thoughts mean you are about to skip a mandatory step. Stop.

- "This change is too small to need a review"
- "I'll write the test after I confirm it works"
- "The plan is in my head, I don't need to write it"
- "The tests were passing before so they're probably still passing"
- "I know this language well enough, no need for the reviewer"
- "The skill overhead slows me down" (it doesn't — it prevents the rework that slows you down)

## Skill & Project Authoring

| Situation | Required Skill |
|-----------|---------------|
| `INIT.md` is missing and the project needs onboarding | **smart-init** skill |
| Creating, editing, optimizing, or deploying a `SKILL.md` | **writing-skills** skill |
| Two or more skills appear to overlap in scope | **skill-duplication-audit** skill |

## Session Start Checklist

On every session start, confirm:
- [ ] Is `INIT.md` present? If not → fill out `INIT_TEMPLATE.md` first
- [ ] Is `.agent-sync/TEAM.md` present? If not → run `/orchestrate init` first
- [ ] What is the current task? → identify which skills/agents apply before starting

## Skill Registration (For New Skills)

When a new skill is added to A Team, add it to the trigger table above so it gets enforced from day one.

The primitive responsibility model (skill vs agent vs command vs rule) is in `.claude/rules/patterns.md`.

The A Team is only as good as the discipline with which it is applied.
Skills consulted are skills that work. Skills skipped are skills that don't exist.
