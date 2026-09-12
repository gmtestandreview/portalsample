# /architecture-review

Assess a proposed design, RFC, or PR-level structural decision before it is built.

**Invokes:** `architecture-review` skill via the `architect` agent

**Usage:**
```
/architecture-review docs/rfc/notification-service.md
/architecture-review "Move session state from cookie to Redis"
```

**Produces:**
- Labeled assumptions and a verdict
- Trade-offs, alternatives, and escalation risks
- Required changes plus validation and rollback

**Not for:** producing a design from scratch (`architecture-design`) or mapping a whole unfamiliar system (`architecture-audit`).
