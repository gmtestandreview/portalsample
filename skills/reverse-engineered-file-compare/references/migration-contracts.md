# Migration contracts — conditional §5.1 analysis

Load only when §5.1 triggers. A framework change (e.g. Formik to React Hook
Form) or dependency/adapter replacement is an implementation choice, not
permission to change business behaviour. The numbered protocol, §2.2 authority,
§3 evidence minima, §6 freeze, §7 statuses and §11 rubric remain controlling.
This reference adds no points, acceptance gates or standalone workflow.

## 1. Freeze and map contracts

At Phase 0 record trigger evidence, effective versions, consumers, providers,
configuration, persisted schema and service contracts where available. For each
applicable dimension below, freeze one A-side contract ID `MC-001`, etc., in
dimension order then canonical A member/source order, with boundary, authority,
expected outcomes and related A atoms. Append IDs on documented amendments.
B-only obligations use existing B atom IDs and the supplementary ledger; add MC
rows only when needed to trace those obligations, without changing N/W. Unknown
versions/consumers or absent external contracts remain evidence gaps. Apply §5.2
before freeze: required functional members trigger STOP; local type contract
gaps trigger DIAGNOSTIC_ONLY. In that mode use these dimensions only as
diagnostic lenses linked to DR/MR/evidence/findings, without MC freeze or
scoring. Never infer framework versions or approved schema migration from an
import.

After Phase 1 freeze, map each contract to actual B locations, including
helpers, adapters and external edges. Record evidence, status, risk and existing
atom, check, finding, impact, task and test IDs in the report template. Use the
same contract row for a shared root cause; distinguish separate observable
outcomes without creating an atom per representation sample, callback argument
or timing sample unless the requirement independently mandates that outcome. Use
§7.5 statuses for A atoms; use them for A-bound contract rows as diagnostic
mappings, not additional parity counts. Candidate-only rows use ADDITIONAL. Mark
unknown applicable dimensions UNVERIFIED, not NOT_APPLICABLE.

## 2. Five analysis dimensions

| Dimension        | Inspect and freeze                                                                                                                                                                                                                                                                   | Counterexample / required verification                                                                                                                                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FRAMEWORK        | Effective provider/context, public props/exports, registration, field adapters, defaults, validation/touched/dirty/submitted/reset semantics, callback and dependency versions. Separate supported public contracts from private library syntax.                                     | Same visible component can fail when mounted under the wrong provider; changed field registration can lose submission state. Verify actual installed types, caller migration and provider integration; mock or source results do not prove real-library parity.                                                        |
| STATE            | Read/write representations at every boundary: absent/undefined, null, scalar, empty/non-empty arrays, nested paths, DTO identity, invalid entries and duplicates; schema/defaults, validation, reset, serialisation and API payload. Map old/new conversions and index/ID semantics. | Filtering invalid rows before binding index paths can mutate the wrong record; accepting a scalar in a comment but returning [] drops data. Test null/scalar/list, nested paths, invalid/duplicate entries, reorder/delete, payload round-trip and failure without silent data loss.                                   |
| TAXONOMY         | Pair display labels with exact persisted values, casing, spacing, singular/plural, ordering/default/blank where contractually material, validation and existing stored values. Inspect API enum/schema/consumer expectations.                                                        | Equivalent labels do not justify changed wire values; changed labels with identical persisted values may be presentation-only. Verify emitted callback payloads, existing stored values, unknown/blank values and approved mapping if any.                                                                             |
| ASYNC            | Identify operation, trigger, preconditions, callback signature/argument meanings, local and server commits, ordering, in-flight identity, cancellation, error, rollback, cleanup and overlapping external changes. Track original and candidate state transitions.                   | Optimistic delete without rollback loses a row on rejection; server-first delete can still overwrite newer state. Tokens alone cannot prove server commit order. Test rejection, reverse completion, retry, removal/reorder/unmount, stale snapshots and exact payload/count. Verify true server semantics separately. |
| INHERITED_DEFECT | Compare observed A behaviour, required intent, higher-authority evidence, observable harm and B handling. Separate source-demonstrated defects from suspected defects.                                                                                                               | Reproducing A's defect is not quality credit; an improvement is not approved parity merely because safer. Test defect reproduction and correction independently and reconcile §2.2/§7.7 approval.                                                                                                                      |

Record inapplicable sub-dimensions with reason; missing required evidence is
UNVERIFIED. Do not assume all framework changes own every possible form state.
For state representations, identify canonical write schema and any compatibility
read adapters separately. A read adapter does not prove submitted payload
compatibility. Preserve stable identity across index changes; reject or map
invalid rows explicitly rather than silently shifting indices. For taxonomy,
compare exact strings independently of labels; a required label change can still
be a UI divergence. Avoid normalising persisted values without verified
authority and data migration evidence.

## 3. Asynchronous consistency protocol

For each material mutation trace request arguments, snapshot/identity and
local/server commit points on both sides. Freeze expected outcomes based on
requirements and A, not on B implementation. Build a small schedule matrix:
normal success; rejection before commit; overlapping A then B with B resolving
first; external mutation/reorder before completion; cancellation/unmount where
applicable. Include busy state release and safe error presentation. Distinguish
server confirmation from local state; client rollback or an in-memory gate
cannot guarantee distributed consistency, cross-instance ordering or durable
backend success. A serialised/rejected second action is a behaviour change if
the original required concurrent operation; assess authority and UX impact. If
exact backend contract is absent, identify known source mismatch and mark
runtime effect UNVERIFIED. Never claim E3/E4 based on planned schedules or mocks
that omit the relevant runtime. Use existing authorised tests only; no edits.

## 4. Inherited defect and approval decisions

Use a diagnostic classification independent of parity status:

| Class               | Meaning                                                               |
| ------------------- | --------------------------------------------------------------------- |
| REPRODUCED          | Evidence supports a defect in A and B retains it.                     |
| CORRECTED           | A defect is supported and B removes the defect within verified scope. |
| PARTIALLY_CORRECTED | B mitigates but does not fully resolve the defect.                    |
| NEW_REGRESSION      | A meets an obligation and B demonstrably violates it.                 |
| SUSPECTED           | Harm/contract or actual outcome lacks sufficient evidence.            |
| NONE                | No inherited defect evidenced for this contract.                      |

Record the original observed behaviour even if defective. A verified
higher-authority rule governs; if A conflicts with it, score the demonstrated A
deficiency, propose the baseline adjustment and record approval under §2.2. If
no higher authority is verified, keep the current baseline, record evidence of
harm, and propose a justified divergence rather than silently changing the
required atom. Pending or rejected material changes do not count as confirmed
parity. An approved adjustment updates the effective baseline with old/new
requirements, IDs, weights, affected checks and recomputation for both sides;
verify B against it before assigning confirmed parity. No C means no chronology.

## 5. Exit evidence and gates

Populate the conditional register and link to the existing report sections: B
(trigger, freeze), C (observations, parity and approvals), D/E (one finding,
impact and existing shared checks), F (challenge assumptions), G (tests and
traceability), H (gate reconciliation). Check actual installed provider/API
contracts, persisted payloads and asynchronous ordering at the applicable §3.2
minimum. Use static evidence for proven omissions, not assumed runtime success.
Apply G05, G06, G11, G13 and G14 under §14; no migration-only score or separate
deployment verdict. G03 still requires confirmed parity against the approved
effective baseline. Report implementation-only changes separately from
externally observable changes. Stop after assessment/planning.
