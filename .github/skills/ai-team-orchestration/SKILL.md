---
name: ai-team-orchestration
description: "Skill for orchestrating AI agent teams in project development with a producer and specialized roles. Designed for complex projects requiring coordination between development, QA, and DevOps agents, with a human acting as the message bus to enable parallel workflows and cross-chat context survival. See PROJECT_BRIEF.md setup, brainstorm format, sprint planning, execution phases, QA sign-off, and context recovery." 
---

# AI Team Orchestration

## When to Use
- Starting a new project that needs planning, development, testing, and deployment
- Setting up parallel AI agent teams (dev, QA, DevOps)
- Writing brainstorm prompts that produce real debate (not generic output)
- Creating sprint plans with cross-chat context survival
- Recovering from context overflow mid-sprint

## Team Roles

| Agent | Name | Role | Focus |
|-------|------|------|-------|
| Producer | **Remy** | Sprint planning, coordination, merging PRs | Scope control, handoffs, issue triage |
| Product Designer | **Kira** | UX, mechanics, user experience | Fun factor, user flows, feature design |
| Visual/Art Director | **Milo** | CSS, animations, visual identity | Design system, polish, accessibility |
| Frontend Engineer | **Nova** | UI framework, state management, components | React/Vue/Svelte, client-side logic |
| Backend Engineer | **Sage** | API, database, auth, security | Server-side logic, infrastructure |
| DevOps Engineer | **Dash** | CI/CD, cloud deployment, pipelines | GitHub Actions, Azure/AWS/GCP |
| QA Engineer | **Ivy** | E2E tests, automation, playtesting | Playwright/Cypress, bug filing, sign-off |

Customize names and roles for your project. If a role is not needed, remove it entirely from the table. Do not leave unused roles marked as inactive or commented out. If a team member becomes unavailable mid-sprint, reassign their tasks to remaining team members and notify the producer.

## Chat Architecture

The human (CEO) is the message bus between parallel chats:

```
┌────────────────────────────────────────┐
│  @ai-team-producer — Plans, merges     │
│  Does not write code (except emergency  │
│  fixes with team consent)              │
└────────────────┬───────────────────────┘
                 │ Human carries messages
      ┌──────────┼──────────┐
      ▼          ▼          ▼
┌──────────┐ ┌────────┐ ┌────────┐
│@ai-team  │ │@ai-team│ │DevOps  │
│-dev      │ │-qa     │ │(on     │
│          │ │        │ │demand) │
│ Nova     │ │ Ivy    │ │        │
│ Sage     │ │        │ │        │
│ Milo     │ │        │ │        │
│          │ │feature/│ │feature/│
│ feature/ │ │qa-N    │ │devops-N│
│ sprint-N │ └────────┘ └────────┘
└──────────┘
```

Each team works in a **separate VS Code window** with its own clone:
```bash
git clone <repo> project-dev    # Dev team
git clone <repo> project-qa     # QA
git clone <repo> project-devops # DevOps (only when needed)
```

## Project Bootstrap

### 1. Create PROJECT_BRIEF.md

The single source of truth across all chats. See the [project brief template](./references/project-brief-template.md).

**Phase A: Foundation (sections 1–6)**
- Project Overview, Concept, Tech Stack, Architecture, Key Files Map, Team Roles

**Phase B: Execution (sections 7–8)**
- Sprint Status, Current State (updated every sprint)

**Phase C: Governance (sections 9–14)**
- Security Rules, How to Run, How to Deploy, Cross-Chat Handoff, Bug & Fix Tracking, Multi-Repo Setup

Do not abbreviate any section. If corrupted or missing, recreate immediately from template and notify all team members.

### 2. Run a Brainstorm

See the [brainstorm format](./references/brainstorm-format.md). Key: name each agent explicitly with distinct personality and perspective. Require exactly 2 disagreements where agents propose **conflicting solutions to the same problem** (e.g., Agent A suggests a microservices architecture, Agent B proposes a monolith). This ensures substantive debate, not just stylistic variation.

### 3. Create Sprint Plans

See the [sprint plan template](./references/sprint-plan-template.md). Every sprint gets:
- `docs/sprint-N/plan.md` — prioritized tasks, success criteria
- `docs/sprint-N/progress.md` — live tracker, enables recovery
- `docs/sprint-N/done.md` — handoff doc written at sprint end

### 4. Execute Sprints

Break sprint execution into 5 sequential phases:

**Phase A: Setup**
- Step 1: Read PROJECT_BRIEF.md, then read docs/sprint-N/plan.md
- Step 2: `git pull origin main && git checkout -b feature/sprint-N`

**Phase B: Verification**
- Step 3: Verify each GitHub Issue referenced in the plan exists (e.g., #NN)
- Step 4: If any issue is missing, halt and notify the producer before continuing

**Phase C: Implementation**
- Step 5: Work through tasks in priority order; commit with issue references: `fix: description (Fixes #NN)`
- Step 6: If a referenced issue does not exist at commit time, halt immediately

**Phase D: Progress Tracking**
- Step 7: After each major task, update `docs/sprint-N/progress.md` with completed tasks and blockers

**Phase E: Merge**
- Step 8: `git push origin feature/sprint-N` and create PR
- Step 9: Follow Sections 12-14 of PROJECT_BRIEF.md (merge rules, testing, deployment)

### 5. QA Sign-off

After dev merges, QA does a full playthrough:
```
Read PROJECT_BRIEF.md. You are Ivy (QA).
Sprint N is merged to main. Do full playthrough.
File bugs as GitHub Issues. Write docs/qa/sprint-N-signoff.md.
```

## Context Recovery

When a chat gets long (>100 messages), save state and start fresh:

**Before closing:**
1. Update `docs/sprint-N/progress.md` with current status, blockers, and issue references
2. Update `PROJECT_BRIEF.md` sections 7–8 (Sprint Status and Current State)
3. Write `docs/sprint-N/done.md` with all issues referenced in commits

**Error recovery — Missing or corrupted PROJECT_BRIEF.md:**
If PROJECT_BRIEF.md is missing or corrupted, immediately:
1. Recreate from [project brief template](./references/project-brief-template.md)
2. Restore all Phase A–C sections (foundation, execution, governance)
3. Notify the producer and all team members
4. Do not continue sprint work until recovered

**Error recovery — Missing sprint docs:**
If `progress.md` or `done.md` is missing, recreate from template or notify the producer.

**Cold start prompt:**
```
Read PROJECT_BRIEF.md and docs/sprint-N/progress.md.
Verify PROJECT_BRIEF.md sections 1-14 are complete.
Verify all referenced GitHub Issues still exist before continuing.
Continue from where it left off.
```

## Anti-Patterns

See [anti-patterns reference](./references/anti-patterns.md) for the full list. Top 5:

| Don't | Do Instead |
|-------|------------|
| Rebase feature branches | Merge (rebase loses commits) |
| Producer writes code | Producer only plans, merges, files issues |
| Batch "fix everything" commits | One commit per fix with issue reference |
| Vague brainstorm prompts | Name each agent with distinct perspective |
| Keep bugs only in chat | File GitHub Issues (chat context dies) |

## Tips for Better Results

- **"Take your time, do it right"** in prompts produces better output than rushing
- **Test before merge** — you playtest, file issues, dev fixes, then merge
- **Run team consiliums** before major sprints — each agent reviews the plan from their perspective
- **Save lessons to memory** after every milestone
