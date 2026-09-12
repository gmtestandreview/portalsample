# /incident-response

Run the production incident playbook when production is degraded or down.

**Invokes:** `incident-response` skill

**Usage:**
```
/incident-response
/incident-response "Portal login failing for all users since 09:15"
```

**The five phases (in order):**
1. Detect — confirm scope and impact
2. Contain — stop the bleeding
3. Diagnose — evidence, not speculation
4. Resolve — fix and verify recovery
5. Post-mortem — capture lasting improvements

**Not for:** non-urgent bugs — use `/debug` (`systematic-debugging`) instead.
