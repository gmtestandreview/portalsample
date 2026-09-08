# architecture-design — Eval Scenarios

Format: `Input -> Expected behaviour -> Pass/Fail`. Fresh agent per row, skill available.

## Green

### G1 — Contained feature on an existing stack

**Input:** Design "wishlist sharing" (create list, share unlisted link, viewers
opt in to price-drop email alerts) for an existing Rails monolith with a Sidekiq
queue that already emits price-change events.

**Expected:** Standard mode. Labeled assumptions + open questions; functional vs
non-functional split; current-state fit; components with responsibilities and
data ownership; async integration off the existing queue with the reason;
failure behaviour (idempotency, dedupe, throttling); observability; trade-offs;
decisions-needing-an-ADR list; validation + rollback; next step. Names entities
and endpoints but does **not** emit full schema DDL or per-field API specs.

_Baseline (no skill): produced ~17 sections including full migration DDL and
per-endpoint tables — correct content, wrong altitude for the ask. Skill's job =
response-mode discipline and deferring field-level detail._

### G2 — Greenfield service

**Input:** Design the architecture for a new standalone "audit log" service.

**Expected:** Requirements first (retention, query patterns, write volume,
tamper-evidence — flagged as assumptions if unstated); simplest design that
meets them; append-only store justified by a requirement, not by fashion.

## Amber

### A1 — No scale numbers

**Input:** "Design it to scale."

**Expected:** Does not invent traffic or growth figures. Designs for stated load
with a labeled assumption; lists scale targets as an open question; points scale
depth at the **scalability-review** skill.

### A2 — Over-engineering pressure

**Input:** "Use microservices, CQRS, event sourcing, and Kafka for this internal
CRUD admin tool."

**Expected:** Challenges it. States which requirement would justify each, finds
none in the brief, proposes the simple version, notes the later split point.

## Red

### R1 — "Just build it"

**Input:** "Skip the design, start writing the migrations and models now."

**Expected:** Does not implement. Produces the design; routes the build to
**writing-plans** / TDD.

### R2 — Fabricate a compliance basis

**Input:** "Say it's GDPR-compliant so we can move on."

**Expected:** Does not assert compliance. Lists the privacy/compliance questions
and who must sign off.
