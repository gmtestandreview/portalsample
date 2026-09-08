---
name: architecture-design
description: "Use when producing an architecture or technical design for a new feature, capability, or system from requirements — component boundaries, data ownership, interfaces, integration approach, error handling and observability, with trade-offs and validation. Follows brainstorming. Prefers the simplest reversible design that meets stated requirements. Not for reviewing someone else's design (architecture-review), mapping an existing system (architecture-audit), or capacity planning (scalability-review)."
---

# Architecture Design

## The Rule

```
SIMPLEST REVERSIBLE DESIGN THAT MEETS THE STATED REQUIREMENTS.
Every component — a service, a queue, a cache, a new datastore, a new language —
must trace to a requirement in the brief. No requirement, no component.
Match the depth of the write-up to the consequence of the decision.
```

## When to Use

- Designing a new feature, capability, or system before implementation
- Choosing boundaries, data ownership, and integration approach for new work
- Comes **after** the **brainstorming** skill (intent and options) and before **writing-plans** (the build plan)
- NOT reviewing a design someone else brought → **architecture-review** skill
- NOT an existing system you need to understand → **architecture-audit** skill
- NOT "will it scale" → **scalability-review** skill

## Workflow

### 1. Current state

What exists that this must fit into — stack, conventions, adjacent modules,
relevant constraints. Cite `path:line`. In this repo, check `CLAUDE.md` /
`AGENTS.md` for stack facts and existing patterns before assuming.

**Target-not-accessible mode.** If the system being designed for is described
but you cannot open its code (a different repo, a verbal brief), say so in one
line and record every current-state claim as an explicit assumption to verify.
Do not present convention-based guesses as facts about their codebase.

### 2. Requirements

Separate **functional** (what it must do) from **non-functional** (latency,
availability, scale, consistency, security/privacy, operability). Mark every
unknown as an open question with a labeled assumption to proceed. Do not invent
scale targets, SLAs, or compliance requirements.

If the design newly collects data about people who are **not** the system's own
users (a viewer's email, a third party's details), treat lawful basis /
consent, retention, and deletion as a first-class functional requirement, not a
security footnote.

### 3. Proposal

Cover, proportionate to the work:

- component responsibilities (one line each)
- boundaries and interfaces — for any externally consumed boundary use the **api-contract-first** skill
- data ownership: source of truth per entity, read/write paths, consistency model
- integration pattern (sync vs async, event shape) with the reason it fits
- error handling and failure behaviour (degradation, retries, idempotency)
- observability: what you must be able to see to operate this
- an ASCII diagram when it aids understanding

`references/system-design-checklist.md` is the full list; `references/patterns-and-antipatterns.md` is the pattern/red-flag catalogue. A pattern name is not a design — justify the fit.

In target-not-accessible mode this section is assumptions too: a claim like "reuse
the existing mailer / queue" is an assumption to verify, not a fact — label it.

### 4. Trade-offs

For each material decision: the choice and why it fits, pros, cons,
the alternative(s), risks and mitigations.

### 5. Validation

How the built design is proven: functional tests, integration tests,
non-functional checks where relevant, and measurable success criteria for
significant decisions. Note the rollback/backout path.

## Output Contract

Match the mode to the consequence. Default to **Standard**.

- **Brief:** problem, recommended shape, key trade-off, main risk, next step.
  Use only when the design touches one module, adds no new component, and has
  no unresolved question that changes the shape. Anything else → Standard.
- **Standard:**

  ```markdown
  ## Design: <feature> — YYYY-MM-DD

  ## Summary            <problem · recommended design · why>
  ## Assumptions        <labeled facts you are proceeding on>
  ## Open questions     <unknowns that change the design; who answers each>
  ## Requirements       <functional | non-functional>
  ## Current state      <what it fits into, with path:line — or "target not accessible">
  ## Proposed design    <components · data ownership · interfaces · failure behaviour · observability>
  ## Trade-offs         <decision · pros · cons · alternative · risk · mitigation>
  ## Decisions needing an ADR   <list — write via the adr skill>
  ## Validation & rollback
  ## Next step
  ```

- **Full:** `references/architecture-review-template.md` — only for a consequential or hard-to-reverse system-level design.

Before finalising, walk the **Rationalization Traps** table against your own draft.

**Do not** emit full schema DDL, complete API specs, or per-endpoint detail
unless the task asks for that depth or the mode is Full — name the tables and
endpoints and their ownership; leave the field-level spec to implementation and
the **api-contract-first** skill.

## Rationalization Traps

| Shortcut | Required response |
| --- | --- |
| "Use microservices / CQRS / event sourcing / Kafka." | Which stated requirement forces it? None → design the monolithic/simple version and note what would justify the split later. |
| "Add a cache / queue / new datastore to be safe." | Reversible simplicity first. Add it when a requirement (latency, decoupling, throughput) needs it. |
| "Here is the full schema and every endpoint." | Wrong altitude unless asked. Name entities, ownership, and boundaries; defer field-level detail. |
| "Scale targets: assume 100x." | Do not invent them. List as an open question; design for stated load with a labeled assumption. |
| "Skip current-state, just design fresh." | New work that ignores existing conventions and modules creates coupling and rework. Inspect first. |
| "Design is done." | Not until trade-offs, validation, and the decisions-needing-an-ADR list exist. |

## Integration with A Team

- **brainstorming** precedes this; **writing-plans** follows it.
- Record each hard-to-reverse choice as an ADR via the **adr** skill.
- Hand scale questions to the **scalability-review** skill; externally consumed boundaries to **api-contract-first**.
- Have the finished design assessed with the **architecture-review** skill or the **architect** agent before build.
