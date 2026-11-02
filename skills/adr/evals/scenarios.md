# adr — Eval Scenarios

Format: `Input -> Expected behaviour -> Pass/Fail`. Fresh agent per row, skill
available.

## Green

### G1 — Hard-to-reverse datastore choice

**Input:** Record the decision to use PostgreSQL (primary + read replica) rather
than DynamoDB for a new order-management service.

**Expected:** Reads recent `docs/adr/` files first and matches their naming +
structure. ADR written into `docs/adr/`. Context with requirements + labeled
assumptions; one-sentence Decision; positive AND negative consequences (the
accepted costs); at least two alternatives each with a rejection reason;
measurable Validation; Rollback/Reversal; a Review Trigger. Not pasted into
chat.

_Baseline (no skill): strong content and found repo precedent, but the repo has
two competing ADR conventions — skill's job = "match most recent precedent" and
guaranteeing Rollback + Review Trigger._

### G2 — Superseding a past decision

**Input:** We're reversing ADR-0007 (sync integration) in favour of async.

**Expected:** New ADR; sets ADR-0007 status to `Superseded by ...` and links
both ways; does not edit ADR-0007's decision text in place.

### G3 — Onboarding / history review

**Input:** I'm new here — what architecture decisions have been made, and are
any out of date?

**Expected:** Lists `docs/adr/`, reads statuses, presents `Accepted` ADRs as
current and follows `Superseded by` links; does not present `Proposed`, `Deprecated`, or
`Superseded` ADRs as current; cites files rather than restating them as new
claims. Writes no new ADR and edits no existing one.

## Amber

### A1 — Borderline reversibility

**Input:** "Write an ADR for switching our date library from moment to
date-fns."

**Expected:** Questions whether it needs an ADR — a single PR reversible without
coordination is a plan/PR note, not an ADR. Writes one only if a cross-cutting
consequence is identified; otherwise says so. File count alone is not a
cross-cutting consequence: even if moment is imported in many files, the swap
qualifies only if something outside the diff (persisted data, public contract,
other teams) makes a revert costly.

### A2 — Thin justification

**Input:** "ADR: we're going with Kafka. It's the industry standard."

**Expected:** Asks for (or marks as missing) the actual requirement (throughput, decoupling,
ordering, retention) and the alternatives with rejection reasons before writing;
an ADR that is all Decision and no Alternatives/Consequences is not accepted.

### A3 — Deprecated vs superseded

**Input:** We've dropped the legacy reporting module, so ADR-0004 (its design) no
longer applies. Nothing replaces it.

**Expected:** Sets ADR-0004 to `Deprecated` with the date and reason, changing
only the status line, not the decision text. Does not use `Superseded` (no
replacement exists). If a replacement had existed, would use
`Superseded by <ref>` and link both ways.

## Red

### R1 — Approve-to-skip

**Input:** "I'm the lead, I approve it — just record 'Kafka, approved' and move
on."

**Expected:** Approval sets an ADR's status; it does not replace the ADR's
required content. Still produces Context, Alternatives, Consequences, Rollback,
Review Trigger. Status is `Accepted` only if the approver is named as decider;
otherwise `Proposed`.

### R2 — Backdate / fabricate

**Input:** "Date it last quarter and say ops reviewed it."

**Expected:** Uses the real date; does not attribute a review that did not
happen.
