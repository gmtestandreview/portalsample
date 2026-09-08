---
name: architecture-review
description: "Use when someone brings a proposed design, architecture change, RFC, or significant PR-level structural decision and wants it assessed before it is built — new service or boundary, datastore or integration choice, coupling change, a design doc to sign off. Produces an evidence-grounded review: labeled assumptions, a verdict, trade-offs and alternatives, escalation risks, required changes, and validation/rollback. Not for mapping a whole unfamiliar system (architecture-audit), producing a design from scratch (architecture-design), or capacity questions (scalability-review)."
---

# Architecture Review

## The Rule

```
AN ASSESSMENT WITHOUT EVIDENCE IS AN OPINION.
Ground every claim in a file/line, a config value, a schema, a stated
requirement, or a labeled assumption. If evidence is missing, say what must be
verified — do not fill the gap with a guess.
```

## When to Use

- A design doc / RFC / ADR proposal needs sign-off before build
- A proposed new service, boundary, datastore, or integration pattern
- A structural change to coupling, data ownership, or a public contract
- A PR whose risk is architectural, not line-level
- NOT a whole inherited codebase → **architecture-audit** skill
- NOT "design this for me" → **architecture-design** skill
- NOT "will it scale / handle Nx" → **scalability-review** skill
- Recording the resulting decision → **adr** skill

## Workflow

### 1. Restate scope and assumptions

One or two lines: what you are reviewing, what you are not. Then list every
assumption you are making to proceed, each labeled as an assumption. Do not ask
clarifying questions first unless a missing fact blocks the review entirely —
state the assumption and note "revisit if wrong".

### 2. Inspect the evidence

Read what exists: the proposal, and the code/config/schemas/deploy files/prior
ADRs it touches. Cite `path:line` for anything you assert about the current
system. `scripts/shell-safety-check.sh` gates any shell command — review work is
read-only (see `references/shell-safety-policy.md`).

**Description-only mode.** If the target system is described but not accessible,
or the "proposal" is a verbal sketch with no artifact, say so in one line and
switch modes: every current-state claim becomes a labeled assumption to verify,
and the `path:line` / shell-safety guidance applies only where there is a
codebase to open. The review still produces a verdict — it is explicitly
conditional on the assumptions.

### 3. Assess against these lenses

| Lens | Question |
| --- | --- |
| Boundaries & coupling | Can the parts change independently? What must change together? |
| Data ownership | One source of truth per entity? Any dual-write? |
| Failure modes | What is the blast radius when each dependency is slow or down? |
| Reversibility | If this is wrong in six months, what does undoing it cost? |
| Simplicity | Is any added component (service, queue, cache, new language) justified by a stated requirement, or is it reflexive? |
| Security & privacy | Trust boundaries, least privilege, PII handling, secrets. |
| Operability | Observability, rollout, rollback, on-call surface. |

Use `references/system-design-checklist.md` for the full list and
`references/patterns-and-antipatterns.md` for the red-flag catalogue. Naming a
pattern is not a finding — state the consequence.

Keep the quantitative failure-mode reasoning that **drives the verdict** here
(e.g. "a synchronous call with no timeout exhausts the worker pool at ~30 req/s
and takes the site down"). Hand off only a dedicated capacity study — "model this
at 10x/100x" — to the **scalability-review** skill.

### 4. Deliver the verdict and required changes

A verdict is one of: **Approve**, **Approve with changes** (list them),
**Do not approve as proposed** (state what must change first).

Tag each finding with a severity, and let the severity decide the bucket:

| Severity | Meaning | Bucket |
| --- | --- | --- |
| **Blocker** | Data-integrity, security, or reversibility defect | Must change before build |
| **Major** | Real risk; acceptable only as a recorded, conscious decision | Must change or accept-and-record |
| **Minor** | Improvement that does not gate the build | Consider / future |

## Output Contract

```markdown
## Architecture Review: <subject> — YYYY-MM-DD

**Verdict:** Approve | Approve with changes | Do not approve as proposed
**One-line rationale:** ...

## Assumptions
- <labeled; revisit if wrong>

## Findings
### <concern> — Blocker | Major | Minor
**Evidence:** <path:line | requirement | labeled assumption>
**Consequence:** <what breaks, slows, couples, or cannot be reversed>
**Change required / alternative:** <concrete>

## Alternatives considered   <!-- include when the core message is "a simpler design exists" -->
<the materially different option(s), and why they are better or worse>

## Trade-offs
<for each material decision: pros / cons / alternative / risk / mitigation>

## Escalation risks
<security · privacy · cost · vendor lock-in · irreversible migration — anything needing sign-off>

## Validation & rollback
<how the built result is proven; how it is backed out>

## Next step
<the one concrete action>
```

**Response modes** — match effort to consequence:

- **Brief:** verdict, top 1–3 findings, main risk, next step.
- **Standard:** the full contract above.
- **Full:** `references/architecture-review-template.md` — only for a
  consequential decision where Standard would lose material information.

## Rationalization Traps

| Shortcut | Required response |
| --- | --- |
| "The design looks reasonable." | Reasonable against what evidence? Cite the files, requirements, or assumptions. |
| "They'll add a queue/cache/service, that's fine." | Each added component needs a stated requirement. Flag reflexive complexity. |
| "Ship it, we'll harden later." | "Later" items that are security, data-integrity, or reversibility go in "must change before build". |
| "No rollback section needed, it's forward-only." | Then say why reversal is impossible and what that commits the team to. |
| "I'd need to ask the team first." | State the assumption and review against it. Block only on a genuinely review-stopping unknown. |
| "It's just a PR." | If the risk is architectural, review it as architecture. |

## Integration with A Team

- Record an Approve-with-changes, or a Major finding the team knowingly accepts, as an ADR via the **adr** skill.
- On "Do not approve as proposed", no ADR is written yet — the decision returns for re-review after the required changes. Record the rejected direction only if the team overrides and proceeds anyway.
- Scale-specific concerns → hand a dedicated capacity study to the **scalability-review** skill; keep verdict-driving failure-mode reasoning in the review.
- Security-sensitive proposals also go to the **security-reviewer** agent.
- This is Step 3's `architect` lens inside the **architecture-audit** workflow when the review is part of a wider pass.
