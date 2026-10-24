# writing-plans — Skill Boundary

## Role

Engineering-grade implementation planning. Produces repository-grounded plans with requirement traceability, test-first sequencing, exact file paths and commands, rollback guidance, and a 100-point quality gate. Saved to `docs/plans/YYYY-MM-DD-<feature-name>.md`.

## Boundary: Engineering-grade vs. lightweight planning

This skill is the highest-rigor planning option. Use it when the work's complexity, safety requirements, or team coordination demands a plan that a skilled engineer can execute from the document alone.

| Signal | Use this skill | Use instead |
|--------|---------------|-------------|
| Driving from a PRD, spec, RFC, bug report, or architecture change | **Yes** | — |
| Plan requires requirement-to-task traceability | **Yes** | — |
| Plan requires exact repository-relative file paths | **Yes** | — |
| Plan requires exact commands with expected outputs | **Yes** | — |
| Plan requires behavior-first / test-first task sequencing | **Yes** | — |
| Migration, auth, billing, permissions, or security-sensitive work | **Yes** | — |
| Plan requires rollback, verification, or authorization gates | **Yes** | — |
| Multi-team feature or independently reviewable commit structure needed | **Yes** | — |
| Quick conversational plan, no repo grounding required | No | `create-plan` |
| Concise task breakdown (≤1 page) saved as a project file | No | `plan-writing` |
| Execution tracking during active task work | No | `planning-with-files` |

**Type: Precedence-aware.** `writing-plans` is the preferred skill when any of the above signals apply. For requests without those signals, `create-plan` (response) or `plan-writing` (file) are lighter-weight alternatives.

## Boundary type by pairing

| Paired skill | Boundary type |
|---|---|
| `create-plan` | Precedence-aware — `writing-plans` activates when the full plan contract is required; `create-plan` for lightweight conversational planning |
| `plan-writing` | Precedence-aware — `writing-plans` activates when rigor exceeds one page / 10 tasks; `plan-writing` for concise file plans |
| `planning-with-files` | Mutually exclusive — `writing-plans` creates a pre-coding artifact; `planning-with-files` manages execution context during coding |

## Validation cases

**Activates this skill:**
- "Create an implementation plan for migrating the auth system to MSAL v3 — include rollback steps"
- "Write a plan for the new quote submission feature from the PRD"
- "Plan the database schema migration for the accounts endpoint"
- "I need an agent-ready implementation plan for this architectural change"

**Does NOT activate this skill:**
- "Give me a quick plan for fixing this validation bug" → `create-plan`
- "Save a concise task list for this UI refactor" → `plan-writing`
- "Help me track progress as I implement this" → `planning-with-files`

## Complementary relationship

`planning-with-files` may be activated after this skill completes: once the engineering-grade plan is written, use `planning-with-files` to track execution of the plan's phases. These are sequential, not competing.
