# /adr

Record or supersede a consequential, hard-to-reverse technical decision as an
Architecture Decision Record, deprecate one (a status-line edit only), or read
and maintain the ADR log (onboarding, history review, process setup).

**Invokes:** `adr` skill

**Usage:**

```text
/adr Choose the session datastore for the portal
/adr Revisit ADR-0007 now that B2C token lifetimes changed
/adr Deprecate ADR-0004; the legacy reporting module is gone
/adr I'm new here — which decisions are current and which are out of date?
/adr Review docs/adr/ for gaps and set up an index
```

**Produces:**

- A new ADR in `docs/adr/` (when recording or superseding) matching repo
  precedent
- Context, the decision, honest consequences, alternatives with rejection
  reasons
- Rollback plan and a review trigger
- Status per the skill's lifecycle: `Proposed` unless a named decider has
  ratified it; `Superseded by <ref>` or `Deprecated` for retired decisions
- Deprecating: a status-line edit on the existing ADR (date and reason); no new
  ADR
- For onboarding, history review, and process setup: findings and proposals —
  no new ADR and no edits to Accepted ADRs; files such as an index are created
  only if you ask

**Not for:** reversible implementation choices or routine library picks — leave
a code comment or a plan note instead.
