# create-plan — Skill Boundary

## Role

Lightweight, read-only plan generation. Delivers a single Plan/Scope/Action Items/Validation/Open Questions document in the chat response. Does not write files.

## Boundary 1: Response plan vs. file-saved plan

| Situation | Use this skill | Use instead |
|-----------|---------------|-------------|
| Plan should be delivered in chat, no files written | **Yes** | — |
| Plan must be saved as a file in the project root | No | `plan-writing` |

**Type: Mutually exclusive.** The key question is whether the plan needs to persist as a file. If yes, use `plan-writing`. If no, use `create-plan`.

## Boundary 2: Lightweight vs. engineering-grade plan

| Situation | Use this skill | Use instead |
|-----------|---------------|-------------|
| Quick conversational plan, no repo grounding required | **Yes** | — |
| Bug fix or small feature, user wants a concise checklist | **Yes** | — |
| Plan requires requirement-to-task traceability | No | `writing-plans` |
| Plan requires exact repository file paths and commands | No | `writing-plans` |
| Plan requires test-first sequencing and behavior tests | No | `writing-plans` |
| Plan requires rollback or migration safety steps | No | `writing-plans` |
| Driving from a PRD, spec, migration doc, or architecture change | No | `writing-plans` |

**Type: Precedence-aware.** Use `writing-plans` when the plan contract (traceability, test-first, exact commands, rollback, 100-point quality gate) is required. Use `create-plan` for all lightweight planning that does not require these.

## Boundary 3: Response plan vs. execution tracking

| Situation | Use this skill | Use instead |
|-----------|---------------|-------------|
| User wants a plan document in chat | **Yes** | — |
| Work is already underway and AI context tracking is needed | No | `planning-with-files` |

**Type: Mutually exclusive.** `create-plan` is pre-task and read-only. `planning-with-files` manages context during task execution.

## Validation cases

**Activates this skill:**
- "Give me a plan for adding OAuth to this app"
- "Quick plan for fixing the form validation bug"
- "How should I approach this refactor?" (when a concise checklist suffices)

**Does NOT activate this skill:**
- "Save a plan file for this task" → `plan-writing`
- "Create an implementation plan with file paths and rollback steps" → `writing-plans`
- "Help me track my progress as I implement this" → `planning-with-files`
