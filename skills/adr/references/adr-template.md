# Architecture Decision Record Template

## Before you use this template

This repository already has ADR conventions. Follow them rather than this
template's defaults where they differ:

- **Location:** `docs/adr/`.
- **Read the most recent files in `docs/adr/` first** and match their structure,
  front matter, and file naming. Conventions in this repo have drifted (a
  date-prefixed freeform style and a numbered `adr-NNNN-slug.md` coded-bullet
  style both exist) — match the most recent precedent, do not invent a third. If
  only 0–1 real ADRs exist, take format from what is there (or from
  `adr-generator.agent.md`) and section structure from this template. See
  `SKILL.md` → "Match Repo Precedent First" for the precedence rule.
- `.github/agents/adr-generator.agent.md` is the fuller in-repo spec (Status,
  Context, Decision, Consequences plus/minus, Alternatives Considered with
  rejection reasons, Implementation Notes, References, coded bullets like
  `POS-001`).
- Whichever base structure you match, **also include Rollback / Reversal and a
  Review Trigger** — these carry the reversibility discipline and are often
  missing from existing ADRs.

The block below is a complete superset. Fill every heading. Delete a heading
only if you can state why it does not apply.

```markdown
# ADR-NNN: <decision title>

## Status

Proposed | Accepted | Superseded by ADR-NNN

## Date

YYYY-MM-DD

## Context

- why the decision is needed now
- the relevant functional and non-functional requirements
- constraints (team, time, budget, platform, compliance)
- architectural forces in tension
- current limitations that prompted the decision
- assumptions being made

## Decision

State the decision clearly and concretely. One or two sentences that name the
choice, not a discussion of options.

## Consequences

### Positive

- <benefit>

### Negative

- <drawback, cost, or risk accepted>

## Alternatives Considered

### Option A - <name>

- Description:
- Advantages:
- Disadvantages:
- Why not selected:

### Option B - <name>

- Description:
- Advantages:
- Disadvantages:
- Why not selected:

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| | | |

## Validation

How the team will verify the decision works as intended. Include measurable
success criteria where possible (latency target, error budget, migration
completion date, cost ceiling).

## Rollback / Reversal

How the decision could be reversed or replaced, and what makes it hard to
reverse. If reversal requires data migration or a compatibility window, say so.

## Review Trigger

Conditions that should cause this ADR to be revisited:

- traffic or data growth beyond a stated threshold
- new regulatory requirements
- reliability incidents attributable to this decision
- cost crossing a stated threshold
- vendor or platform changes
- a key assumption in Context becoming false
```
