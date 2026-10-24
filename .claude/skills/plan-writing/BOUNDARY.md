# plan-writing — Skill Boundary

## Role

Lightweight file-saved plan creation. Produces a concise (≤1 page, 5–10 tasks) `{task-slug}.md` file in the project root, principles-based with project-type-specific verification guidance.

## Boundary 1: File-saved plan vs. response plan

| Situation | Use this skill | Use instead |
|-----------|---------------|-------------|
| Plan must be saved as a file in the project root | **Yes** | — |
| Plan should be delivered in chat, no files written | No | `create-plan` |

**Type: Mutually exclusive.** If the user needs a persistent plan file, use `plan-writing`. If a chat-response plan is sufficient, use `create-plan`.

## Boundary 2: Lightweight vs. engineering-grade plan

| Situation | Use this skill | Use instead |
|-----------|---------------|-------------|
| Concise task breakdown (≤1 page, ≤10 tasks) is sufficient | **Yes** | — |
| Feature or bug fix without complex rollback requirements | **Yes** | — |
| Plan requires requirement-to-task traceability | No | `writing-plans` |
| Plan requires exact repository file paths and commands | No | `writing-plans` |
| Plan requires test-first sequencing with exact run commands | No | `writing-plans` |
| Plan requires rollback, migration safety, or authorization gates | No | `writing-plans` |
| Driving from a PRD, spec, migration doc, or architecture change | No | `writing-plans` |
| Plan must pass a 100-point quality rubric | No | `writing-plans` |

**Type: Precedence-aware.** Use `writing-plans` when the full plan contract is required. Use `plan-writing` for lightweight, concise planning where brevity and speed are the priority.

## Boundary 3: File plan vs. execution tracking

| Situation | Use this skill | Use instead |
|-----------|---------------|-------------|
| User needs a planning artifact saved before coding begins | **Yes** | — |
| Work is already underway and AI context tracking is needed | No | `planning-with-files` |

**Type: Mutually exclusive.** `plan-writing` creates a pre-task planning document. `planning-with-files` manages execution context during active work.

## Validation cases

**Activates this skill:**
- "Save a plan file for adding the address validation form"
- "Create a task breakdown for this refactor and save it"
- "Plan this UI feature — keep it concise, save to the project"

**Does NOT activate this skill:**
- "Give me a quick plan in chat" (no file needed) → `create-plan`
- "Create an implementation plan for the MSAL migration with rollback steps" → `writing-plans`
- "Set up tracking as I build this feature" → `planning-with-files`

## Complementary relationship

`plan-writing` may precede `planning-with-files`: create the lightweight plan file first, then activate `planning-with-files` to track execution. These are sequential, not competing.
