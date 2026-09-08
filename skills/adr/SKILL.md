---
name: adr
description: "Use when a consequential, hard-to-reverse technical decision needs to be recorded or revisited — datastore/tech-stack choice, service or module boundary, data-ownership shift, integration pattern, major dependency or infrastructure commitment, or superseding a past decision. Produces an Architecture Decision Record in docs/adr/ that matches repo precedent, with context, the decision, honest consequences, alternatives with rejection reasons, rollback, and a review trigger. Not for reversible implementation choices or routine library picks."
---

# ADR — Architecture Decision Record

## When an ADR Is Warranted

Write one only when at least one is true:

- The decision is **hard to reverse** (data migration, vendor lock-in, public contract, pervasive assumption).
- It affects **multiple teams or modules**.
- It **changes data ownership** or the source of truth.
- It introduces **major infrastructure** or a load-bearing dependency.
- It **sets or changes an integration pattern** (sync/async, event shape, boundary).
- It has **long-term operational consequences** (on-call surface, cost floor, upgrade path).
- It **supersedes** a previous ADR.

Do NOT write one for a reversible implementation choice, a routine library pick, a naming convention, or anything a single PR can undo without coordination. If unsure: if getting it wrong costs a sprint or more to unwind, it needs an ADR.

## Match Repo Precedent First

ADRs live in **`docs/adr/`**. Before writing:

1. **List `docs/adr/` and read the most recent files there** (ignore tool dirs like `.sonar/`).
   - **2 or more real ADRs:** match their structure, front matter, and file-naming convention. The repo has drifted between a date-prefixed freeform style and a numbered `adr-NNNN-slug.md` coded-bullet style — follow the most recent, do not add a third, and do not unilaterally migrate the repo from one to the other (flag the inconsistency for the team instead).
   - **0 or 1 real ADRs:** there is no reliable precedent. Take **naming and format** from the one file if it exists, otherwise from `.github/agents/adr-generator.agent.md`; take **section structure** from `references/adr-template.md`.
2. **Precedence when precedent and required content disagree:** the existing file wins on *style, format, front matter, and file naming*; the **Required Content** table below wins on *which sections must exist*. The sole existing ADR omits four of the eight required sections — you still include all eight.
3. `.github/agents/adr-generator.agent.md` is the fuller in-repo spec (coded bullets `POS-001`/`NEG-001`/`ALT-001`, `Implementation Notes`, `References`).
4. Full superset template: `references/adr-template.md`.

**File name.** Match the prevailing style. Date-prefixed style: `docs/adr/YYYY-MM-DD-slug.md`; if a file for that date already exists, append `-2`, `-3`. Numbered style: next zero-padded `adr-NNNN-slug.md`.

The committed ADR is a real file in `docs/adr/`. A review or validation *draft* may live elsewhere only if its first line is `DRAFT — not for docs/adr/`. Never paste a full ADR into a chat reply or an unrelated document as the deliverable.

## Required Content

Whatever structure you match, every ADR carries these — and these are the ones usually left thin:

| Section | Bar to clear |
| --- | --- |
| Context | The forces and constraints, and the requirements (functional + non-functional). Label assumptions as assumptions. |
| Decision | One or two sentences naming the choice. Not a discussion. |
| Consequences — Positive | Concrete benefits. |
| Consequences — Negative | The costs and risks you are **accepting**. An ADR with no negative consequences is not finished. |
| Alternatives Considered | At least two, each with **why it was not selected** — not just a description. Include "do nothing" when relevant. |
| Validation | How you will know it worked. Measurable where possible (target latency, cost ceiling, migration date). |
| Rollback / Reversal | How it could be undone, and what makes reversal expensive. |
| Review Trigger | The observable condition (growth threshold, incident, cost line, assumption breaking) that reopens this ADR. |

## Status Lifecycle

Canonical values: `Proposed` → `Accepted` (or `Rejected`); later, `Superseded by <ref>`. A trailing qualifier is fine (`Proposed — deferred to migration sprint`). A later ADR that replaces this one sets this ADR to `Superseded by <ref>` and links both ways. Do not edit the decision of an Accepted ADR in place — supersede it.

## Rationalization Traps

| Shortcut | Required response |
| --- | --- |
| "The decision is obvious, skip the alternatives." | The alternatives and their rejection reasons are the record's value. Name at least two. |
| "It's all upside." | Then the Negative Consequences section is incomplete. Every consequential choice has a cost you are accepting. |
| "We'll add rollback later." | Rollback difficulty is decision input. If you cannot describe reversal now, the decision is not understood yet. |
| "This is reversible, but let's ADR it anyway." | If a single PR undoes it without coordination, it is a code comment or a plan note, not an ADR. |
| "Put the ADR in the PR description." | ADRs are durable files in `docs/adr/`, discoverable independent of the PR. |
| "Use a fresh template." | Match the most recent `docs/adr/` precedent first. |

## Integration with A Team

- The **architect** agent, **architecture-design**, **architecture-review**, and **scalability-review** all feed decisions here — they identify *what* needs an ADR; this skill writes it.
- Accepted risks from the **architecture-audit** skill are recorded as ADRs so the next audit can check whether the risk materialised.
- A decision that then needs building goes to the **writing-plans** skill, and the plan references the ADR.
