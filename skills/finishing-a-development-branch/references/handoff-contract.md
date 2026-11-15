# Completion and handoff contract

**Load when** preparing the final branch-readiness response or a requested PR
handoff. The table is a reporting schema, not evidence; fill with actual
repository observations, omit inapplicable details with rationale, and never
invent unknown owners, URLs, approvals or results.

## Required sections

1. **Pre-action checkpoint and authority:** include a concise ordered/dated
   checkpoint **before any Git mutation** showing intent, scope, actual
   repository/HEAD/target, missing inputs, protected invariants, highest risk,
   authority, tool/runtime plan, verification threshold, deliverable and a
   `PROCEED READ-ONLY | PROCEED AUTHORIZED MUTATION | STOP/BLOCKED` decision.
   Use `NONE` for absent authority. In read-only reviews capture a compact
   checkpoint in the final handoff and verify no earlier mutation in the trace.
   Record requested versus performed actions and approvals.
   `Assessment complete: yes/no` is separate from branch readiness.
2. **Repository identity:** root, branch or detached ref, HEAD object ID, tree
   identity including dirty state, target ref and resolved object ID, upstream,
   observed remote freshness/time. Mark unknown target/remote explicitly.
3. **Change inventory:** committed diff vs base plus staged, unstaged, untracked
   and relevant ignored/generated artifacts; state any inventory limits.
4. **Gate evidence table:** fields below; keep enforced and advisory separate.
5. **Readiness decision:** exactly one of `READY FOR PR REVIEW`,
   `READY TO INTEGRATE`, `NOT READY`; list failures and blocked gates
   separately, smallest next action and owner **if known**. Identify external
   CI/PR actions pending.
6. **Review and delivery:** material risks, approvals and doc requirements;
   concise PR title, summary, test/impact notes and screenshots _only if
   requested and actually available_.
7. **Divergence/deferred/lessons:** expected vs observed, accepted exception and
   authority, deferred item/owner/trigger, and lessons from unexpected failures
   or why none occurred. Documentation claiming command results must be backed
   by rerun evidence after the last relevant edit.
8. **Action ledger:** action, authorised scope, outcome, exact resulting ref or
   path and verification evidence. Explicitly say `No Git mutations performed`
   in review-only runs. Separate attempted from completed operations.

| Gate             | Required or advisory | Exact command + cwd/shell/runner | Tested HEAD + dirty tree | Exit/status + threshold | Time + evidence location | Result                       |
| ---------------- | -------------------- | -------------------------------- | ------------------------ | ----------------------- | ------------------------ | ---------------------------- |
| `<actual check>` | `<policy>`           | `<observed invocation>`          | `<revision>`             | `<actual result>`       | `<actual record>`        | `PASS/FAIL/BLOCKED/ADVISORY` |

## Completion rules

- `Assessment complete` means actual evidence and limitations are fully
  represented; it does **not** mean all gates pass.
- `READY FOR PR REVIEW` permits pending external PR-only checks, which must be
  named; `READY TO INTEGRATE` requires their verification when mandated.
- If a check was not run, no timestamp/result/approval may be fabricated.
- A deleted branch/worktree, opened PR, merge, and pushed commit require
  verification of the actual resulting state before reporting completion.
- A reviewer must be able to audit the claim without reconstructing agent
  reasoning or comparing old chat messages.

## Adversarial audit trail (when evaluation is requested)

The runtime harness, not the agent's narrative, records a timestamped tool
trace, observed skill load, immutable before/after Git state, and the checkpoint
position relative to any mutation. A reviewer scores the exact claims against
`references/scenarios.json`. Missing tool traces are `NHR`; text alone never
proves non-mutation or prior authorisation. Human decisions and approvals must
be recorded as evidence, not inferred from a request to 'finish'.
