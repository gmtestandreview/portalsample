# Atomic inventory, parity and history — sections 6–8

## 6. Phase 1 — Deterministic atomic decomposition

Formal decomposition, weights and parity calculations require §5.2 FORMAL. In
DIAGNOSTIC_ONLY, these sections may guide source observations only; use DR IDs
without formal atom counts/weights, parity statuses or frozen denominators. STOP
does not enter this phase.

### 6.1 Definition of a functional atom

A functional atom is one independently verifiable behavioural responsibility or
enforceable contract.

Each atom must have:

1. An identifiable trigger, input or precondition.
2. A defined responsibility.
3. An observable outcome or enforceable contract.
4. Independently assessable acceptance criteria.

### 6.2 Decomposition rules

- Separate behaviours when they have distinct triggers, outcomes, business rules
  or failure conditions.
- Combine implementation details that cannot be meaningfully verified
  independently.
- Do not count individual syntax statements as functional atoms.
- Do not count parent and child behaviours twice.
- Distinguish functional behaviour from structural implementation details.
- Include normal, negative and material boundary behaviours.
- Include public integration contracts.
- Support one-to-one, one-to-many, many-to-one and many-to-many mappings across
  symbols and file boundaries; map by responsibility, not file name.

For example, if File A implements three validation functions and File B
consolidates them into one function, assess each required validation behaviour
independently without penalising consolidation.

### 6.2.1 Repeatable inventory procedure

Build the authoritative inventory from verified requirements, then public
contracts, then required source behaviours not already mapped. Do this without
using B or C to decide the number, granularity or weights of A atoms. List each
finite, named business discriminator (e.g. delivery method, role or mode) as a
separate atom when its required outcome can independently regress, even when
several outcomes currently share the same implementation or value. Pair that
discriminator with each distinct required rule/branch. Do not create an atom per
numeric sample; use below/at/above boundaries as acceptance cases within a rule
atom. Group a public function's signature and its directly dependent exported
type as one contract if they are assessed together; independently consumed
public contracts get separate atoms. Separate independent failure rules, not
every test input. Explicitly record grouping/splitting rationale.

Deduplicate shared implementation responsibilities by enforceable outcome, not
file occurrence: a re-export of a contract is not a second functional rule, but
independently supported public import paths are separate contract atoms when
they can independently regress. If multiple A members collaborate on one
responsibility, record all required locations in one atom. A repeated runtime
effect with independently observable cardinality is not a duplicate atom.

Order contract atoms by canonical A-member order then source location; order
rule atoms by verified requirement order (or A-member/source order when no
requirement IDs exist), and named alternatives by declaration order. Assign
stable IDs in that order. Candidate-only atoms use B IDs; candidate
implementation consolidation must not merge A IDs. Record the frozen input
revision, effective requirements, atom IDs, weights, applicability and
denominator before mapping B. Later amendments require a reason, old/new
inventory, affected checks and recomputation. If two decompositions remain
credible and materially affect metrics, record the ambiguity and mark G02
UNVERIFIED until resolved; do not select the more favourable denominator.

### 6.3 Atomic register

| Field               | Definition                                                        |
| ------------------- | ----------------------------------------------------------------- |
| Atom ID             | Stable identifier                                                 |
| Requirement ID      | Related verified requirement, if available                        |
| Location            | Side-qualified member ID(s), path(s), symbol(s) and line range(s) |
| Responsibility      | Independently assessable behaviour                                |
| Trigger/input       | Triggering condition or input                                     |
| Preconditions       | Conditions required                                               |
| Outcome             | Expected observable result                                        |
| Business rule       | Applicable rule                                                   |
| Dependencies        | Upstream and downstream relationships                             |
| Side effects        | State or external effects                                         |
| Failure conditions  | Negative and boundary behaviour                                   |
| Criticality         | Critical, High, Medium or Low                                     |
| Acceptance criteria | Independently verifiable outcome                                  |
| Evidence IDs        | Supporting evidence                                               |

Use A-001 for authoritative atoms and B-001 for candidate atoms.

### 6.4 Criticality weighting

Assign criticality based on business and technical consequences.

| Criticality | Weight | Definition                                                            |
| ----------- | -----: | --------------------------------------------------------------------- |
| Critical    |      5 | Security, authorisation, data integrity or essential system behaviour |
| High        |      3 | Material user workflow or public integration contract                 |
| Medium      |      2 | Recoverable or non-critical functional behaviour                      |
| Low         |      1 | Minor observable behaviour with limited consequence                   |

Do not assign criticality based on implementation complexity.

### 6.5 Freeze the baseline

Freeze File A's required atomic inventory, criticality and applicability before
Phase 2 mapping, not merely before comparative scoring.

If later discovery identifies an omitted or incorrectly decomposed atom:

- Record the change.
- Explain the reason.
- Reconcile dependent mappings and tests.
- Recalculate all affected metrics.

Do not adjust the denominator merely to improve a parity score.

---

## 7. Phase 2 — Bidirectional functional and behavioural parity

### 7.1 Comparison directions

Perform both comparisons:

**File A → File B:** Identify missing, incomplete, equivalent, corrected or
regressive required behaviour.

**File B → File A:** Identify additional behaviour, beneficial implementations,
unintended side effects and unauthorised changes.

### 7.2 TypeScript assessment dimensions

Assess applicable characteristics:

- Type safety and type narrowing.
- Interfaces and generics.
- Public type contracts.
- Discriminated unions.
- Optional and nullable values.
- Undefined handling.
- Type assertions.
- Return types.
- Compile-time compatibility.
- Runtime boundary validation.
- Error propagation.
- Module and export compatibility.

### 7.3 React assessment dimensions

Assess applicable characteristics:

- Component contracts and props.
- State initialisation and updates.
- Rendering and conditional rendering.
- Component identity and keys.
- Rules of Hooks.
- Hook dependency arrays.
- Effects and cleanup.
- Strict Mode behaviour.
- Event handlers.
- Context consumption.
- Controlled and uncontrolled components.
- Form state and validation.
- Loading, empty, success and error states.
- Asynchronous behaviour.
- Race conditions.
- Stale closures.
- Unmount behaviour.
- Routing and navigation.
- Accessibility semantics.
- Keyboard interaction.
- Focus management.
- Re-render and resource management behaviour.

### 7.4 Business and integration dimensions

Assess:

- Business rules.
- Data transformations.
- API request construction.
- Response handling.
- Authentication and authorisation.
- Error messages.
- User workflows.
- Observable side effects.
- Default values.
- Boundary conditions.
- Integration contracts.
- Backward compatibility.

For triggered migration assessments, apply §5.1 and the
[migration contract reference](migration-contracts.md) to map representation,
producer/consumer, persisted-value and mutation obligations. A changed adapter
is not itself a functional regression. Record distinct externally observable
outcomes once; use schedule variants and representation samples as test cases
unless they represent independently regressible required rules.

### 7.5 Mutually exclusive parity statuses

Assign one primary status per authoritative atom.

| Status               | Definition                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------- |
| IDENTICAL            | Implementation and required behaviour are materially identical and verified                 |
| EQUIVALENT           | Different implementation with verified equivalent required behaviour                        |
| IMPROVED             | Verified equivalent required behaviour with demonstrable technical improvement              |
| PARTIAL              | Some required behaviour is present, but incomplete                                          |
| MISSING              | Required behaviour is demonstrably absent                                                   |
| DIVERGENT            | Required behaviour differs from the baseline                                                |
| JUSTIFIED_DIVERGENCE | Different behaviour is supported by an authoritative requirement or demonstrated correction |
| UNVERIFIED           | Evidence is insufficient to establish the required classification                           |

For candidate-only behaviours use ADDITIONAL.

Use NOT_APPLICABLE only for assessment dimensions that genuinely do not apply.

A demonstrable missing capability may be classified MISSING even if its exact
runtime effects remain unverified. A required atom with mixed verified and
unverified outcomes is UNVERIFIED unless a demonstrated deficiency already
establishes PARTIAL, MISSING or DIVERGENT. Structural identity is not proof of
behavioural identity. Record the minimum evidence level for each atom.

Use UNMAPPED for unresolved mapping work; resolve it to an appropriate final
status or retain it as UNVERIFIED.

### 7.6 Independent quality and risk tags

Assign separate tags where applicable:

- REGRESSION.
- DEFECT_CORRECTION.
- SECURITY_RISK.
- ACCESSIBILITY_RISK.
- CONTRACT_CHANGE.
- PERFORMANCE_RISK.
- ARCHITECTURAL_IMPROVEMENT.
- TECHNICAL_DEBT.
- APPROVAL_REQUIRED.

A divergent behaviour may also be a regression.

Do not use overlapping risk tags as competing parity statuses.

### 7.7 Divergence governance

For each JUSTIFIED_DIVERGENCE, record:

- Original behaviour.
- Candidate behaviour.
- Higher-authority requirement or defect evidence.
- Reason the original behaviour should not be reproduced.
- Required tests.
- Approval status.

Approval status must be PENDING, APPROVED or REJECTED.

Pending approval does not count as confirmed parity.

An approved adjustment updates the effective required behaviour, with an
auditable baseline change record.

Assess the candidate against the adjusted requirement before awarding
conformity. For inherited defects, classify A and B independently against the
effective authority. Record defect evidence, correction or reproduction, and any
unapproved change; never count a pending correction as confirmed parity. Where a
correction is required by higher authority, retain that requirement and record
the proposed/approved baseline adjustment under §2.2; do not redefine the
original observed behaviour or erase the defect finding.

### 7.8 Parity matrix

| Atom ID | A member location(s) | B member/symbol/line mapping(s) | Composition | Edge/contract IDs | Expected behaviour | Observed behaviour | Status | Risk tags | Criticality | Evidence IDs | Confidence | Test IDs |
| ------- | -------------------- | ------------------------------- | ----------- | ----------------- | ------------------ | ------------------ | ------ | --------- | ----------- | ------------ | ---------- | -------- |

For each A atom, map zero, one or several B member/symbol/line locations;
identify the composition (single implementation, split, consolidated, shared, or
absent), material dependency edges and evidence for the complete execution path.
A single B symbol may implement several independent A atoms; keep each A row
separate. Do not count a facade, re-export or helper again as candidate-only
behaviour solely because it exists in another file. If the mapped path cannot be
resolved, distinguish known absence from unresolved external evidence.

### 7.8.1 Public contract compatibility across modules

For each authoritative entry point, trace declared import specifier, resolution,
default/named/type exports, signatures and consumer usage to the candidate's
actual entry point and implementation members. Check re-exports/barrels/facades,
path aliases, extension and case resolution, type-only exports, circular
imports, initialisation order, duplicate side effects and shared state/singleton
identity where material. A symbol present elsewhere does not prove the original
import path still resolves. E1 verifies declarations only; resolved type/module
and consumer contracts require E2, lifecycle/side-effect paths require the
applicable E3/E4 evidence. Record confirmed breakage or UNVERIFIED resolution
separately from internal functional parity. A facade or approved consumer
migration may preserve compatibility; never assume either exists. Link each
public contract to its A atom, edge IDs, evidence and required test; new public
paths or behaviour are B-only obligations if independently observable.

Every required authoritative atom must appear exactly once in the parity
denominator.

Every additional candidate behaviour must be separately reconciled.

---

## 8. Phase 3 — Evolutionary gap analysis

Determine which current differences represent missing capabilities, historical
enhancements or intentional implementation divergence.

### 8.1 Three-way comparison

Where File C is available and its provenance and relevant member/contract
coverage are verified (across split or consolidated layouts):

1. File C → File A: Identify changes introduced into the original since the
   historical baseline.
2. File C → File B: Identify observable differences between the historical
   source and candidate.
3. File A → File B: Identify current functional and technical differences.

### 8.2 Historical and causal classification

| Classification                         | Evidence required                                           |
| -------------------------------------- | ----------------------------------------------------------- |
| Confirmed historical enhancement       | Verified difference between historical and latest originals |
| Current functional gap                 | Verified difference against the authoritative baseline      |
| Confirmed reverse-engineering omission | Historical evidence plus verified reverse-engineering scope |
| Intentional exclusion                  | Documented and authorised implementation decision           |
| Subsequent candidate removal           | Verified candidate version history                          |
| Potential original defect              | Supporting requirement or defect evidence                   |
| Unknown historical origin              | Insufficient historical evidence                            |
| Unknown causal origin                  | Insufficient evidence explaining why the difference exists  |

Separate the fact that a difference exists from the reason it exists.

Do not infer causation from file chronology alone.

If File C is unavailable or incomplete for the relevant responsibility, identify
current gaps without claiming their historical origin. Match history by
contract/behaviour and member evidence, not by identical filenames. Verify
coverage before claiming a rule was absent from C.

### 8.3 Evolutionary register

| Delta ID | Historical behaviour | Latest original behaviour | Candidate behaviour | Historical classification | Causal confidence | Evidence IDs | Required action |
| -------- | -------------------- | ------------------------- | ------------------- | ------------------------- | ----------------- | ------------ | --------------- |

---
