# /adr

Record or revisit a consequential, hard-to-reverse technical decision as an Architecture Decision Record.

**Invokes:** `adr` skill

**Usage:**
```
/adr Choose the session datastore for the portal
/adr Revisit ADR-0007 now that B2C token lifetimes changed
```

**Produces:**
- An ADR in `docs/adr/` matching repo precedent
- Context, the decision, honest consequences, alternatives with rejection reasons
- Rollback plan and a review trigger

**Not for:** reversible implementation choices or routine library picks — leave a code comment or a plan note instead.
