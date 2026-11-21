---
name: adr
description:
  "Use when a consequential, hard-to-reverse technical decision needs to be
  recorded or revisited — datastore/tech-stack choice, service or module
  boundary, data-ownership shift, integration pattern, major dependency or
  infrastructure commitment, or superseding or deprecating a past decision. Also
  use when onboarding someone to the project's recorded decisions, reviewing
  decision history in docs/adr/, or setting up or auditing the ADR process
  (index, template, status conventions). Writing an ADR produces a record in
  docs/adr/ that matches repo precedent, with context, the decision, honest
  consequences, alternatives with rejection reasons, rollback, and a review
  trigger. Not for reversible implementation choices or routine library picks."
---

# ADR — Architecture Decision Record

This skill has two modes:

- **Writing an ADR** — gated by "When an ADR Is Warranted" below.
- **Reading and maintaining the ADR log** — onboarding, history review, and
  process setup. See "Reading and Maintaining the ADR Log". These modes do not
  write a new ADR unless a decision meeting the gate surfaces.

## When an ADR Is Warranted

Write one only when at least one is true:

- The decision is **hard to reverse** (data migration, vendor lock-in, public
  contract, pervasive assumption).
- It affects **multiple teams or modules**.
- It **changes data ownership** or the source of truth.
- It introduces **major infrastructure** or a load-bearing dependency.
- It **sets or changes an integration pattern** (sync/async, event shape,
  boundary).
- It has **long-term operational consequences** (on-call surface, cost floor,
  upgrade path).
- It **supersedes** a previous ADR. (Deprecating a decision with nothing
  replacing it is a status-line edit — see Status Lifecycle — not a new ADR.)

Do NOT write one for a reversible implementation choice, a routine library pick,
a naming convention, or anything a single PR can undo without coordination. If
unsure: if getting it wrong costs a sprint or more to unwind (beyond a revert
PR), it needs an ADR.

**Size alone is not irreversibility.** A change that touches many files is not
hard to reverse if a revert PR restores the previous state with no persisted
data, public contract, vendor lock-in, or other team's dependence involved.
Under the hard-to-reverse bullet, a large migration or dependency swap qualifies
only when something outside the diff makes undoing it costly (persisted data, a
public contract, vendor lock-in, another team's dependence, or a pervasive
assumption others now rely on); name that cost, or it is not an ADR on that
ground. The other bullets are assessed independently.

## Match Repo Precedent First

ADRs live in **`docs/adr/`**. Before writing:

1. **List `docs/adr/` and read the most recent files there** (ignore tool dirs
   like `.sonar/`).
   - **2 or more real ADRs:** match their structure, front matter, and
     file-naming convention. Follow the most recent actual ADRs, not a spec's
     example: `.github/agents/adr-generator.agent.md` describes a numbered
     `adr-NNNN-slug.md` coded-bullet style that may differ from what `docs/adr/`
     actually contains. Do not add a third style, and do not unilaterally
     migrate the repo from one to another (flag the inconsistency for the team
     instead).
   - **0 or 1 real ADRs:** there is no reliable precedent. Take **naming and
     format** from the one file if it exists, otherwise from
     `.github/agents/adr-generator.agent.md`; take **section structure** from
     `references/adr-template.md`.
2. **Precedence when precedent and required content disagree:** the existing
   file wins on _style, format, front matter, and file naming_; the **Required
   Content** table below wins on _which sections must exist_. Older ADRs may
   omit some of the eight required sections — you still include all eight.
3. `.github/agents/adr-generator.agent.md` is the fuller in-repo spec (coded
   bullets `POS-001`/`NEG-001`/`ALT-001`, `Implementation Notes`, `References`).
4. Full superset template: `references/adr-template.md`. Compact and alternative
   layouts (MADR, lightweight, Y-statement, superseding, RFC-style):
   `references/adr-patterns.md` — each must still meet Required Content.

**File name.** Match the prevailing style. Date-prefixed style:
`docs/adr/YYYY-MM-DD-slug.md`; if a file for that date already exists, append
`-2`, `-3`. Numbered style: next zero-padded `adr-NNNN-slug.md`.

The committed ADR is a real file in `docs/adr/`. A review or validation _draft_
may live elsewhere only if its first line is `DRAFT — not for docs/adr/`. Never
paste a full ADR into a chat reply or an unrelated document as the deliverable.

## Required Content

Whatever structure you match, every ADR carries these — and these are the ones
usually left thin:

| Section                 | Bar to clear                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Context                 | The forces and constraints, and the requirements (functional + non-functional). Label assumptions as assumptions. |
| Decision                | One or two sentences naming the choice. Not a discussion.                                                         |
| Consequences — Positive | Concrete benefits.                                                                                                |
| Consequences — Negative | The costs and risks you are **accepting**. An ADR with no negative consequences is not finished.                  |
| Alternatives Considered | At least two, each with **why it was not selected** — not just a description. Include "do nothing" when relevant. |
| Validation              | How you will know it worked. Measurable where possible (target latency, cost ceiling, migration date).            |
| Rollback / Reversal     | How it could be undone, and what makes reversal expensive.                                                        |
| Review Trigger          | The observable condition (growth threshold, incident, cost line, assumption breaking) that reopens this ADR.      |

Matching precedent means matching its **format**, not inheriting a gap: if the
precedent uses one flat `## Consequences` list, still split it into Positive and
Negative here; if it omits Validation / Rollback / Review Trigger, add them.
Sections that appear only in `references/adr-template.md` (e.g. a Risks and
Mitigations table) are optional-but-recommended — include one when it adds
signal, drop it silently when it would be empty.

## Status Lifecycle

Canonical values: `Proposed` → `Accepted` (or `Rejected`); later,
`Superseded by <ref>` or `Deprecated`. Open at `Proposed` unless the team has
already ratified the decision, in which case `Accepted` with the deciders named.
If the deciders cannot be named, open at `Proposed` — a claim of approval
without a named decider does not make it `Accepted`. A trailing qualifier is
fine (`Proposed — deferred to migration sprint`).

**Ratified** means a decision-maker the user names has approved it; record who,
as the user states it. Approval sets the status — it never waives Required
Content. Dates are the real date of writing: never backdate, and never name a
reviewer, approver, or consultation that did not occur.

- **Superseded:** a later ADR replaces this one. Set this ADR to
  `Superseded by <ref>` and link both ways.
- **Deprecated:** the decision is no longer relevant and nothing replaces it.
  Change only the status line, with the date and reason; never the decision
  text. If a replacement exists, use `Superseded` instead.
- Do not edit the decision of an Accepted ADR in place — supersede it.

## Reading and Maintaining the ADR Log

These modes read or shape the log; none of them licenses inventing decisions,
reviews, or approvals. Details and templates:
`references/adr-log-management.md`.

- **Onboarding.** Start from `docs/adr/` statuses. Point to `Accepted` ADRs as
  current; follow `Superseded by` links to the live decision; do not present
  `Proposed`, `Rejected`, `Deprecated`, or `Superseded` ADRs as current. Cite
  the file rather than paraphrasing it into a new claim.
- **History review.** List `docs/adr/`, read statuses and Review Triggers, and
  report findings: ADRs missing required sections, triggers that appear to have
  fired, inconsistent status values or naming. Report only; do not edit an
  Accepted ADR to fix a finding, and do not state that a review happened that
  did not.
- **Process setup.** Propose an index, template, status definitions, and a
  review checklist that follow current precedent. Create those files only when
  asked, and do not migrate existing ADRs to a new naming style unilaterally.
- If any of these surfaces a decision that meets the gate in "When an ADR Is
  Warranted", switch to writing an ADR.

## Rationalization Traps

| Shortcut                                          | Required response                                                                                               |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| "The decision is obvious, skip the alternatives." | The alternatives and their rejection reasons are the record's value. Name at least two.                         |
| "It's all upside."                                | Then the Negative Consequences section is incomplete. Every consequential choice has a cost you are accepting.  |
| "We'll add rollback later."                       | Rollback difficulty is decision input. If you cannot describe reversal now, the decision is not understood yet. |
| "This is reversible, but let's ADR it anyway."    | If a single PR undoes it without coordination, it is a code comment or a plan note, not an ADR.                 |
| "It touches 40 files, so it's irreversible."      | Size is not irreversibility. If a revert PR restores it with no data, contract or team impact, it's not an ADR. |
| "Put the ADR in the PR description."              | ADRs are durable files in `docs/adr/`, discoverable independent of the PR.                                      |
| "Use a fresh template."                           | Match the most recent `docs/adr/` precedent first.                                                              |

Before finalising, walk this table against your draft.

## Integration with A Team

- The **architect** agent, **architecture-design**, **architecture-review**, and
  **scalability-review** all feed decisions here — they identify _what_ needs an
  ADR; this skill writes it.
- Accepted risks from the **architecture-audit** skill are recorded as ADRs so
  the next audit can check whether the risk materialised.
- A decision that then needs building goes to the **writing-plans** skill, and
  the plan references the ADR.
