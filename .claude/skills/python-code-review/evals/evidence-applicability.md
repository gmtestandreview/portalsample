# Evidence applicability

Date reviewed: 2026-10-11

## Historical conformance

The
[2026-09-15 pressure/conformance report](python-code-review-pressure-test-report.md)
is preserved unchanged. Its GREEN/RED labels are current-context conformance
observations, not isolated behavioral deployment evidence. Its RED baseline is
NHR and remains historical context rather than proof about the current revision.

## 2026-10-05 isolated performance retest

The supplied campaign is available under
`runs/2026-10-05-performance-retest/`, including `manifest.json`,
`contracts.json`, `results.json`, and `parent-verification.json`.

The campaign manifest binds its evidence to exact baseline resource hashes,
environment/tool versions, inputs, and frozen contracts. `results.json` records
18 PASS assertions for the `new_skill` arm and one UNGRADABLE compound assertion
(`C1`); `parent-verification.json` independently records material executed
Pyright/pytest command results. Treat these as execution evidence only for the
revisions/fixtures identified by that campaign.

The UNGRADABLE `C1` discovery-plus-propagation criterion is unresolved evidence,
not a PASS. The campaign also does not establish behavior for later edits to
`SKILL.md`, references, or eval contracts.

## Current revision

`evals/cases.json` and `evals/qaq-rmi.md` define current test and static mapping
expectations. After any edit, representative activation/task-path/load-boundary
and pressure runs must be rerun against the new revision before required
behavior-critical NHR can become PASS. Do not inherit historical GREEN/PASS
labels across a changed content hash.

## Current deterministic validation

The [2026-10-11 static validation](static-validation.json) is historical
for its original 44-case candidate. See the
[2026-10-17 deterministic checks](static-validation-2026-10-17.json) for the
current 47-case record: structural/specification/link/JSON/syntax checks and
hash integrity, including negative tamper checks. All required behavioral
cases remain NHR and runtime readiness is unverified.

The
[validation before the structural-edit gate](static-validation-before-structural-gate.json)
and [prior-revision pressure plan](prior-revision-pressure/run-record.json)
retain their original candidate hash and 43-case contract. Their recorded checks
and outcomes are historical and are not inherited by the current revision.

## 2026-10-17 candidate (this package)

The 2026-10-11 44-case unexecuted plan is archived at
[run-record-2026-10-11.json](prior-revision-pressure/run-record-2026-10-11.json).
The current 47-case [run-record](current-revision-pressure/run-record.json)
freezes the new SKILL hash **and active supporting-resource hashes**. Its
NHR statuses mean the resource split and effort-gate changes have not been
tested in isolated Claude/Codex target-host sessions. The static validator
checks integrity and trace presence only; it cannot establish model adherence.
Previously recorded analyzer, pytest, and pressure results remain scoped to
their historically identified artifacts/environments.
