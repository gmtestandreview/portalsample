# planning-with-files — Skill Boundary

## Role

Execution context management. Creates `task_plan.md`, `findings.md`, and `progress.md` as persistent working memory **during** active task work, to prevent goal drift across many tool calls.

## Boundary: Execution tracking vs. plan-document creation

This skill is **not** for creating a planning artifact the user will read before work starts. It is for managing the AI's own context while work is already underway.

| Situation | Use this skill | Use instead |
|-----------|---------------|-------------|
| User needs a plan delivered in chat before coding | No | `create-plan` |
| User needs a plan file saved in the project root | No | `plan-writing` |
| User needs an engineering-grade plan with traceability and rollback | No | `writing-plans` |
| Complex task in progress, >5 tool calls, context management needed | **Yes** | — |
| Research project requiring persistent findings log | **Yes** | — |
| Task tracking across tool calls to prevent goal drift | **Yes** | — |

## Boundary type: Mutually exclusive

`planning-with-files` activates for execution management; the three plan-document skills (`create-plan`, `plan-writing`, `writing-plans`) activate for plan-document creation. A single request should not normally invoke both — if a user asks "create a plan", reach for a plan-document skill; if work is already in progress and tracking is needed, use this skill.

## Validation cases

**Activates this skill:**
- "I'm about to implement this migration — set up tracking for my work"
- "Help me stay on track as I build this feature step by step"
- Task involves >5 tool calls and ongoing phase management

**Does NOT activate this skill (use plan-document skills):**
- "Give me a plan for adding authentication" → `create-plan`
- "Save a plan file for this refactor" → `plan-writing`
- "Create an implementation plan with test-first tasks and rollback" → `writing-plans`

## Complementary relationship

`writing-plans` or `plan-writing` may be used before this skill: create the plan first, then activate `planning-with-files` to track execution of that plan. These are sequential, not competing.
