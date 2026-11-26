# Mandatory A–H report field template

Use after Phase 0 routing (§5.2); the full template below applies only in
FORMAL. The numbered protocol governs all meanings and criteria. Copy the
headings and all applicable named fields; replace placeholders with actual
evidence or an explicit NONE / NOT_APPLICABLE (reason) / UNVERIFIED (reason). A
missing register is not a verified empty register. Never emit blank required
cells, invented facts or placeholder IDs in a final report. Keep evidence
descriptions canonical and link by IDs. For wide tables, labelled cards with the
same fields are acceptable. An incomplete assessment must name every unfinished
register/check and must not pass G14. No separate report is required for an A/B
pre-assessment STOP.

## Phase 0 route and missing-resource register (§5.2)

Include in Section B for FORMAL/DIAGNOSTIC_ONLY, or the input-stop record for
STOP.

| MR ID | Side / locator | Member / edge IDs | Classification | Role evidence IDs | Unavailable content | Affected obligations | Mode contribution | Permitted / prohibited claims | Resolution action and required evidence |
| ----- | -------------- | ----------------- | -------------- | ----------------- | ------------------- | -------------------- | ----------------- | ----------------------------- | --------------------------------------- |

Record selected mode, precedence rationale, inspected versus missing scope,
unknown runtime roles, and amendment/resumption history. If no missing
resources, record NONE with evidence. STOP: return only this register, supplied
inventory, stop reason and restart requirements; no gate table or metrics.

## Bounded A–H template — DIAGNOSTIC_ONLY

Use these fields instead of the full formal template. No formal atom/MC freeze,
weights, scoring checks, parity classifications or quantitative parity/quality
metrics. Every formal metric is NOT_ESTABLISHED with reason; no percentages,
zero substitutes or partial score ranges. Stable DR IDs label observations only.

| Section | Required diagnostic fields                                                                                                                                                                                                                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A       | Scope and topology (supplied counts only); mode and MR IDs; material source findings; formal parity, weighted parity, evidence-completeness and engineering scores/ranges NOT_ESTABLISHED; adoption BLOCKED or UNVERIFIED (diagnostic) and rationale.                                                            |
| B       | Supplied manifests, dependency edges, public entry-point observations, MR register, evidence register, technology context, missing types/consumers, unknowns; no complete baseline freeze.                                                                                                                       |
| C       | Bidirectional diagnostic register (DR ID, A/B locations, observed difference, evidence IDs, limitations, impact, verification needed); candidate benefits; historical limitations; applicable migration dimensions and defect/approval observations (no frozen MC IDs).                                          |
| D       | SWOT and O1–O4 as supported, canonical finding IDs, evidence and limitations.                                                                                                                                                                                                                                    |
| E       | Source-supported impacts, affected contracts and risks; formal scoring NOT_ESTABLISHED, no ledger weights or denominator.                                                                                                                                                                                        |
| F       | Adversarial challenges, alternative explanations, inherited defects and evidence needed.                                                                                                                                                                                                                         |
| G       | Traceable remediation and verification plan, proposed versus executed checks, resumption requirements and affected MR/DR/finding IDs.                                                                                                                                                                            |
| H       | All G01–G14 as diagnostic observations (FAIL/UNVERIFIED/PASS only with sufficient applicable evidence); G02/G03/G10/G14 cannot PASS, G13 FAIL if mandatory evidence is unresolved; adoption non-ready label, all twelve §17 questions with limitations, incomplete registers/phases and exact resumption action. |

Use the corresponding full-template evidence/manifest/impact/task fields where
applicable, without inventing missing freeze or scoring links. Do not present
this as a reconciled formal report. The full template begins below.

## A — Executive decision

- Scope and purpose, A:B file topology and member counts:
- File A quality range / File B quality range / shared applicable maximum:
- Confirmed parity / weighted parity / atomic evidence completeness:
- Scoring evidence completeness A / B:
- Significant finding IDs:
- Readiness decision and controlling gate IDs:

## B — Scope, evidence and atomic baseline

### Side manifests, file inventory and context

| Side / member ID | Member role | Path and symbol(s) | Version/hash/commit | Provenance | Inspection completeness | Limitations |
| ---------------- | ----------- | ------------------ | ------------------- | ---------- | ----------------------- | ----------- |

A:B topology; side membership and scope rationale; canonical path ordering;
manifest revision/amendments; C coverage and unavailable members/dependencies.
Include the §5.2 route and MR register above.

### Dependency edge register (§2.1.1)

| Edge ID | Side | From member/symbol | To member or external target | Import/use kind | Resolution status | Evidence IDs | Material consequence / limitation |
| ------- | ---- | ------------------ | ---------------------------- | --------------- | ----------------- | ------------ | --------------------------------- |

### Public entry-point inventory (§7.8.1)

| Contract ID | Side/member | Import specifier and entry point |
Default/named/type export and signature | Consumer evidence | Resolution
evidence / limitations | | --- | --- | --- | --- | --- | --- | --- |

Populate these registers even for single-file sides; a verified empty register
requires an explicit rationale. Record unknown dependencies/consumers as such,
not as an empty list.

Technology/tool versions; requirements and authority conflicts; dependencies;
repository standards and permitted commands; unavailable context.

### Migration routing and freeze (§5.1)

Trigger(s), evidence IDs, dimension applicability and rationale, dependency/
consumer version gaps, A-only contract IDs and effective authority at freeze; if
not triggered, record the reason. Contract rows describe obligations and link to
existing atoms; they do not independently contribute to N/W.

### Evidence register (§3.4)

| Evidence ID | Source | Version/location | Observation or result | Evidence level | Confidence | Limitations |
| ----------- | ------ | ---------------- | --------------------- | -------------- | ---------- | ----------- |

### Atomic register (§6.3)

Use one row per A or B atom, or cards with the same fields. Required A atoms
alone count in N; preserve their original IDs for all later mappings.

| Atom ID | Requirement ID | Location | Responsibility | Trigger/input |
Preconditions | Outcome | Business rule | Dependencies | Side effects | Failure
conditions | Criticality | Acceptance criteria | Evidence IDs | Minimum evidence
level | | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Freeze record: A manifest revision and member IDs; effective authority; atom
order and grouping rationale; IDs, weights, N/W; scope-based rubric
applicability (refer to shared ledger E); freeze checkpoint; amendment history
(old/new, reason, affected checks and recomputation); unresolved decomposition
alternatives.

## C — Functional parity and evolutionary gaps

### Parity matrix (§7.8)

| Atom ID | A member location(s) | B member/symbol/line mapping(s) | Composition | Edge/contract IDs | Expected behaviour | Observed behaviour | Status | Risk tags | Criticality | Evidence IDs | Confidence | Test IDs |
| ------- | -------------------- | ------------------------------- | ----------- | ----------------- | ------------------ | ------------------ | ------ | --------- | ----------- | ------------ | ---------- | -------- |

### Public contract compatibility (§7.8.1)

| A atom / contract ID | Original import path/export | Candidate path/export and
mapped members | Resolution and signature | Consumer compatibility | Status /
evidence IDs | Test IDs | | --- | --- | --- | --- | --- | --- | --- | --- |

### Conditional migration contract register (§5.1)

Complete only for triggered assessments; retain the A-side fields frozen in
Section B and populate candidate/evidence fields after Phase 1. One canonical
row per distinct contract; reference existing atom/check/finding/test IDs rather
than duplicate findings. See the specialist reference for dimensions and defect
classifications.

| MC ID / dimension | A location and authority | Producer → consumer / boundary | A required contract | B location and observed contract | Evidence IDs / level / limitations | Status and risk | Inherited defect / approval | Atom / check IDs | Finding / impact / task / test IDs |
| ----------------- | ------------------------ | ------------------------------ | ------------------- | -------------------------------- | ---------------------------------- | --------------- | --------------------------- | ---------------- | ---------------------------------- |

Record proposed/approved baseline amendments in the existing freeze and
divergence records; use NOT_APPLICABLE with rationale for non-applicable
dimensions, UNVERIFIED for absent evidence.

### Candidate-only behaviour and divergence (§7.7)

| B atom or A atom | Original behaviour | Candidate behaviour | Higher-authority requirement or defect evidence | Justification | Required tests | Approval status | Effective-baseline amendment |
| ---------------- | ------------------ | ------------------- | ----------------------------------------------- | ------------- | -------------- | --------------- | ---------------------------- |

### Evolutionary register (§8.3)

| Delta ID | Historical behaviour | Latest original behaviour | Candidate behaviour | Historical classification | Causal confidence | Evidence IDs | Required action |
| -------- | -------------------- | ------------------------- | ------------------- | ------------------------- | ----------------- | ------------ | --------------- |

Historical and causal limitations:

## D — Comparative SWOT and opportunities

### Canonical findings (§9.5)

| Finding ID | Atom IDs | Primary SWOT category | Opportunity category | Finding | Evidence IDs | Severity | Confidence | Recommended action |
| ---------- | -------- | --------------------- | -------------------- | ------- | ------------ | -------- | ---------- | ------------------ |

SWOT summary: Strengths / Weaknesses / Opportunities / Threats, with finding
IDs. O1 mandatory functional gaps; O2 verified evolutionary enhancements; O3
preserve candidate benefits; O4 justified net-new value. If O1/O2 overlap, one
finding ID with primary O2, secondary O1. Explicitly state when a category has
no supported finding. For each O4, include problem, measurable benefit,
implementation complexity, dependencies, regression risk, alternatives
(including no change), and verification, referencing the same finding and task
IDs.

## E — Architecture, impact and comparative scoring

### Impact matrix (§10)

| Impact ID | Finding ID | Affected consumer/dependency | Contract | Impact classification | Consequence | Severity | Evidence IDs | Required verification |
| --------- | ---------- | ---------------------------- | -------- | --------------------- | ----------- | -------- | ------------ | --------------------- |

### Frozen shared scoring ledger (§11)

One entry per allocated check or excluded subcriterion. Enumerate all criterion
IDs (FC1–FC4, BC1–BC5, TS1–TS5, RE1–RE4, IN1–IN4, SE1–SE4, CQ1–CQ4, TE1–TE3,
AC1–AC3, PE1–PE3). Use exact shares and the same checks for A/B. Record
exclusions once with excluded points and affirmative scope evidence.
Candidate-only obligations belong in their own supplementary ledger and gates.

| Check ID / criterion ID | Atom/requirement/standard | Check and expected outcome | Applicability and rationale | Allocated/excluded points | Minimum evidence level | A status | A evidence IDs / reason | B status | B evidence IDs / reason |
| ----------------------- | ------------------------- | -------------------------- | --------------------------- | ------------------------- | ---------------------- | -------- | ----------------------- | -------- | ----------------------- |

Freeze revision, applicability, allocation and amendment record:

| Category | Applicable maximum | File A confirmed points | File A unresolved points | File B confirmed points | File B unresolved points | Evidence IDs | Findings |
| -------- | ------------------ | ----------------------- | ------------------------ | ----------------------- | ------------------------ | ------------ | -------- |

For each logical side (not each member): M, P, F, U, M=P+F+U, Q_min, Q_max, E,
U_pct. Explain excluded points, comparable verified difference (or why not),
uncertainty, and projected post-remediation target (estimate only).
Candidate-only obligations and results:

Parity: N, C, W, WC, P, PW, EC, EU; each primary status count and percentage;
verify EC+EU=100% and required atom uniqueness. No parity if N=0; scope review.

## F — Devil's Advocate review

| Challenge ID | Challenged claim | Counterexample or concern | Evidence IDs | Resolution (classification and rationale) | Resulting correction |
| ------------ | ---------------- | ------------------------- | ------------ | ----------------------------------------- | -------------------- |

Contradictions and unresolved challenges; affected registers/metrics recomputed;
state whether the challenge was self-review or an actual separate reviewer.

## G — Remediation and verification plan

### Remediation task contract (§13.3)

Copy for every task (including RETAIN or INVESTIGATE decisions):

- Task ID and title:
- Related atom, finding, impact and evidence identifiers:
- Opportunity category:
- Priority and severity:
- Recommended action:
- Current behaviour:
- Required target behaviour:
- Implementation approach:
- Alternative approaches, including no change where applicable:
- Rationale:
- Prerequisites and dependencies:
- Upstream effects:
- Downstream effects:
- Behaviour and improvements to preserve:
- Regression risks:
- Estimated effort with stated uncertainty:
- Expected measurable benefit:
- Required verification:
- Acceptance criteria:
- Scope and approval requirements:

### Behavioural test contract (§13.6)

Copy for every required proposed test or identified existing verification:

- Test ID:
- Requirement and atom identifiers:
- Finding and remediation identifiers where applicable:
- Test purpose:
- Preconditions:
- Inputs:
- Expected observable outcome:
- Authoritative expected-result source:
- Boundary and failure conditions:
- Test environment:
- Required evidence level:
- Existing or proposed test location:

### Test execution evidence (§13.7)

| Test ID | Status | Actual command | Environment/versions | Exit status | Relevant output | Assertions or behaviours exercised | Limitations |
| ------- | ------ | -------------- | -------------------- | ----------- | --------------- | ---------------------------------- | ----------- |

Do not fill execution fields with hypothetical commands/results. For proposed or
unrun tests mark execution fields NOT_APPLICABLE (not executed); distinguish a
blocked attempt from a proposed test.

### End-to-end traceability (§13.8)

Include all material member locations and dependency edge/contract IDs in the
A/B mapping cells.

| Requirement ID | Atom ID | File A location | File B mapping | Finding ID | Impact ID | Remediation ID | Test ID | Evidence ID | Verification status |
| -------------- | ------- | --------------- | -------------- | ---------- | --------- | -------------- | ------- | ----------- | ------------------- |

## H — Final acceptance and recommendations

### Acceptance gates (§14.1)

| Gate | Requirement                                                                 | Status | Evidence IDs / reason | Next check or action |
| ---- | --------------------------------------------------------------------------- | ------ | --------------------- | -------------------- |
| G01  | Provenance                                                                  |        |                       |                      |
| G02  | Complete reconciled atomic inventory                                        |        |                       |                      |
| G03  | 100% unweighted and weighted parity                                         |        |                       |                      |
| G04  | No unresolved critical/high findings                                        |        |                       |                      |
| G05  | No unapproved material divergence                                           |        |                       |                      |
| G06  | Required verification passed                                                |        |                       |                      |
| G07  | Applicable type-check and lint passed                                       |        |                       |                      |
| G08  | Mandatory security/accessibility/coverage maintained                        |        |                       |                      |
| G09  | Current candidate improvements preserved or justified authorised removal    |        |                       |                      |
| G10  | Final verified score >=96                                                   |        |                       |                      |
| G11  | Mandatory claims meet evidence minimum and HIGH confidence                  |        |                       |                      |
| G12  | No unresolved material contradiction                                        |        |                       |                      |
| G13  | No unverified mandatory criteria                                            |        |                       |                      |
| G14  | Manifests, edges, contracts, registers, tasks, tests and scoring reconciled |        |                       |                      |

Reconciliation: explicitly check every item in §14.4 and field contracts,
including §5.1 migration routing and conditional register when applicable; state
PASS/FAIL/UNVERIFIED and relevant IDs. Missing fields or uninspected registers
prevent G14 PASS. Record outstanding blockers and evidence requirements;
implementation sequence and approval boundary; decision using §14.3.

### Twelve executive answers (§17)

1. Is B functionally complete?
2. Is B behaviourally equivalent to the effective baseline?
3. Is B technically superior, inferior or mixed?
4. Which missing capabilities must be incorporated?
5. Which historical enhancements must be adopted?
6. Which candidate improvements must be retained?
7. Which net-new opportunities provide justified value?
8. Which risks prevent adoption?
9. Which dependencies or contracts could be affected?
10. What evidence and verification remain outstanding?
11. What is the recommended implementation sequence?
12. Is B ready for acceptance?

Use evidence/finding/gate IDs in the answers. Stop; do not modify assessed
files.
