# Scoring and adversarial review — sections 11–12

## 11. Phase 6 — Deterministic comparative scoring

Enter only in §5.2 FORMAL with a complete frozen authoritative inventory.
DIAGNOSTIC_ONLY forbids scoring, ranges, ceilings, weights, parity metrics and
partial denominators; §12 may guide an unscored challenge of source findings.
STOP does not enter either phase.

Independently score logical side A and logical side B (each as a whole) using
the same rubric and effective requirements.

File A does not automatically receive full points.

### 11.1 Frozen engineering rubric

| Category                                 |  Points |
| ---------------------------------------- | ------: |
| Functional completeness                  |      20 |
| Behavioural correctness                  |      20 |
| TypeScript type safety                   |      10 |
| React correctness and architecture       |      10 |
| Integration and dependency compatibility |      10 |
| Security, validation and error handling  |       8 |
| Code quality and maintainability         |       8 |
| Testability and regression assurance     |       6 |
| Accessibility                            |       5 |
| Performance and resource management      |       3 |
| **Total**                                | **100** |

### 11.2 Measurable scoring subcriteria

#### Functional completeness — 20

| ID  | Criterion                                           | Points |
| --- | --------------------------------------------------- | -----: |
| FC1 | Required core functional capabilities present       |      8 |
| FC2 | Required business rules implemented                 |      5 |
| FC3 | Required alternative and failure workflows present  |      4 |
| FC4 | Required defaults and boundary capabilities present |      3 |

#### Behavioural correctness — 20

| ID  | Criterion                                           | Points |
| --- | --------------------------------------------------- | -----: |
| BC1 | Normal-path observable outcomes correct             |      5 |
| BC2 | Conditional behaviour and state transitions correct |      5 |
| BC3 | Negative and boundary outcomes correct              |      4 |
| BC4 | Asynchronous behaviour and side effects correct     |      4 |
| BC5 | No unapproved material behavioural differences      |      2 |

#### TypeScript type safety — 10

| ID  | Criterion                                        | Points |
| --- | ------------------------------------------------ | -----: |
| TS1 | Applicable type-checking requirements satisfied  |      3 |
| TS2 | No unjustified unsafe assertions or type escapes |      2 |
| TS3 | Nullable and optional values handled correctly   |      2 |
| TS4 | Public type contracts correct                    |      2 |
| TS5 | Runtime boundaries appropriately validated       |      1 |

#### React correctness and architecture — 10

| ID  | Criterion                                              | Points |
| --- | ------------------------------------------------------ | -----: |
| RE1 | Rules of Hooks and hook dependencies correct           |      3 |
| RE2 | State and rendering behaviour correctly implemented    |      3 |
| RE3 | Lifecycle, effects and cleanup correctly implemented   |      2 |
| RE4 | Component composition and responsibilities appropriate |      2 |

#### Integration and dependency compatibility — 10

| ID  | Criterion                                                   | Points |
| --- | ----------------------------------------------------------- | -----: |
| IN1 | Upstream component and consumer contracts preserved         |      3 |
| IN2 | Downstream dependency and API contracts preserved           |      3 |
| IN3 | Module, export and dependency compatibility established     |      2 |
| IN4 | Material integration and backward compatibility established |      2 |

#### Security, validation and error handling — 8

| ID  | Criterion                                                      | Points |
| --- | -------------------------------------------------------------- | -----: |
| SE1 | Applicable authentication and authorisation controls preserved |      2 |
| SE2 | Untrusted data and security boundaries handled appropriately   |      2 |
| SE3 | Input validation and data integrity controls satisfied         |      2 |
| SE4 | Errors and failure conditions handled appropriately            |      2 |

#### Code quality and maintainability — 8

| ID  | Criterion                                                    | Points |
| --- | ------------------------------------------------------------ | -----: |
| CQ1 | Responsibilities and cohesion appropriate                    |      2 |
| CQ2 | No unjustified material duplication                          |      2 |
| CQ3 | Complexity appropriate to the problem                        |      2 |
| CQ4 | Applicable repository coding and linting standards satisfied |      2 |

#### Testability and regression assurance — 6

| ID  | Criterion                                        | Points |
| --- | ------------------------------------------------ | -----: |
| TE1 | Required behaviour independently testable        |      2 |
| TE2 | Required positive and negative behaviour covered |      2 |
| TE3 | Relevant regression verification passed          |      2 |

#### Accessibility — 5

| ID  | Criterion                                                   | Points |
| --- | ----------------------------------------------------------- | -----: |
| AC1 | Semantic structure and accessible names correct             |      2 |
| AC2 | Applicable keyboard and focus behaviour correct             |      2 |
| AC3 | Applicable accessible state and error announcements correct |      1 |

#### Performance and resource management — 3

| ID  | Criterion                                                            | Points |
| --- | -------------------------------------------------------------------- | -----: |
| PE1 | No demonstrated avoidable material rendering or computation overhead |      1 |
| PE2 | Resources, subscriptions and lifecycle cleanup managed correctly     |      1 |
| PE3 | Applicable performance requirements established by suitable evidence |      1 |

### 11.3 Scoring procedure

Before scoring either logical implementation:

1. Determine applicable criteria.
2. Define independently verifiable checks under each applicable subcriterion.
3. Associate checks with frozen atoms, requirements or repository standards.
4. Allocate each subcriterion's points among those checks.
5. Freeze the check inventory and point allocation.
6. Apply identical effective requirements and check weights to both logical
   sides.

Freeze applicability on the effective requirements, A inventory and verified
scope/environment, not on whether A/B pass or whether a check can be run. Use
one shared check ledger (including exclusions) for both logical sides. Do not
score each member and average/sum the scores, weight by LOC, or allocate extra
points per file, wrapper, helper, import or re-export. Allocate by independent
obligations and evaluate the entire composed path. For IN1/IN3/IN4 include
distinct authoritative public entry-point contracts and consumer resolution;
missing paths cannot earn credit from relocated internal logic. For §5.1
migrations, map contract rows to existing check IDs (e.g. TS3/TS5 for
representations, IN1–IN4 for consumers and dependencies, FC2 for persisted
business rules, BC4 for asynchronous outcomes, SE3/SE4 for integrity/errors).
These are routing examples, not mandatory extra checks: allocate only
independent applicable obligations from the frozen A/effective requirements. Do
not award or deduct points merely for framework identity, count migration rows
as atoms, or create a second migration score. Evaluate inherited defects against
the same effective authority on both sides; approved amendments require
re-freezing and recalculating both sides. Member-level findings may be
diagnostic but do not create additional scores. Assign a stable check ID
`<criterion>-01`, etc. For each applicable subcriterion, derive one check per
independent applicable obligation or grouped contract; order by frozen atom ID,
then requirement/standard ID. Divide its points equally among checks using exact
fractions unless a verified authority specifies a different allocation. Record
any exception before scoring either logical side. Do not round individual
shares; reconcile exact totals and compare gates using unrounded values,
displaying percentages to two decimal places. An applicable subcriterion with
unresolved detail gets a single UNVERIFIED check covering its full weight until
a documented baseline amendment can refine it. Record NOT_APPLICABLE subcriteria
once with their full excluded weight and reason.

Avoid duplicate penalties for the same outcome unless separate scoring
dimensions genuinely measure distinct consequences.

Score each check as:

- PASS: Full allocated points.
- FAIL: Zero allocated points due to demonstrated deficiency.
- UNVERIFIED: No confirmed points; points remain unresolved.
- NOT_APPLICABLE: Excluded from the applicable maximum.

Use separate checks rather than arbitrary partial-credit percentages.

A subcriterion may receive partial credit through its passed checks.

Do not exclude a criterion merely because evidence is missing.

### 11.4 Applicability controls

For shared TypeScript utilities, React-specific criteria may be inapplicable.

For non-interactive modules, certain accessibility criteria may be inapplicable.

Record every exclusion and its justification.

Use the same applicability rules for both logical sides. React obligations apply
when the effective required behaviour includes React, even if B moves it to a
supporting component; candidate-only React obligations are supplementary. A
relocation alone cannot change the frozen applicable maximum or allocations.

If a candidate introduces new responsibilities that create additional
obligations, record those obligations separately and apply them to candidate
acceptance.

Do not manipulate applicability to hide candidate-only deficiencies.

Applicability is independent of verification: use NOT_APPLICABLE only when the
scope affirmatively excludes the obligation (e.g. a confirmed non-React utility
has no React obligations). Unknown consumers, project lint/type-check settings,
untrusted boundaries or missing tests are not proof of inapplicability. No
approved performance target can exclude a target-specific check only when the
absence is established, not merely when no target file was supplied. Distinguish
absence of a feature (a scope fact) from absence of evidence about the feature.
When unclear, retain the weight as UNVERIFIED. Freeze these scope decisions in
Phase 1, before B mapping; Phase 6 finalises check allocations against those
frozen decisions. Changes require the same audit trail as atom amendments.
Candidate-only obligations use a separate ledger and acceptance gates, not a
changed shared M or concealed extra points. Never claim a comparable numeric
quality delta from unequal denominators.

### 11.5 Quality and evidence calculations

Define:

- M = total applicable points.
- P = points allocated to verified PASS checks.
- F = points allocated to verified FAIL checks.
- U = points allocated to UNVERIFIED checks.

Require:

M = P + F + U

Calculate:

**Verified quality floor**

Q_min = 100 × P / M

**Potential quality ceiling**

Q_max = 100 × (P + U) / M

**Evidence completeness**

E = 100 × (P + F) / M

**Unverified evidence percentage**

U_pct = 100 × U / M

When U = 0, Q_min and Q_max are identical and represent the final verified
quality score.

When U > 0, report the quality range rather than presenting the lower bound as a
confirmed final quality score.

Unknown evidence is not a demonstrated defect.

The upper bound is not an achieved score.

Where M = 0, report scoring as NOT_APPLICABLE and explain why.

### 11.6 Parity calculations

Use the frozen authoritative atom inventory.

Define:

- N = total required applicable atoms.
- C = required atoms with confirmed conformity.
- W = sum of weights for all required atoms.
- WC = sum of weights for confirmed conforming atoms.

Confirmed conformity includes:

- IDENTICAL.
- EQUIVALENT.
- IMPROVED.
- Verified conformity with an explicitly approved adjusted requirement.

Calculate:

**Unweighted confirmed functional parity**

P = 100 × C / N

**Criticality-weighted functional parity**

PW = 100 × WC / W

**Atomic evidence completeness**

EC = 100 × number of conclusively classified required atoms / N

**Unverified atom percentage**

EU = 100 × number of required UNVERIFIED atoms / N

For EC, count IDENTICAL, EQUIVALENT, IMPROVED, PARTIAL, MISSING and DIVERGENT
only when their classification is conclusive at the required evidence level;
JUSTIFIED_DIVERGENCE counts for EC only when its divergence is conclusive,
regardless of approval, and for C only with approval and verified conformity.
Any atom without a conclusive classification must be UNVERIFIED; EC and EU must
reconcile to 100% (before rounding). Report counts and percentages for every
primary status.

A conclusively established missing capability contributes to evidence
completeness but not functional parity.

Do not count partially implemented atoms as confirmed parity.

If no required atoms exist, report parity as NOT_APPLICABLE and require scope
review.

Do not conceal critical gaps behind aggregate percentages.

### 11.7 Comparative scoring matrix

| Category | Applicable maximum | File A confirmed points | File A unresolved points | File B confirmed points | File B unresolved points | Evidence IDs | Findings |
| -------- | -----------------: | ----------------------: | -----------------------: | ----------------------: | -----------------------: | ------------ | -------- |

Report:

- Raw and normalised quality scores or ranges.
- Verified quality difference, where comparable.
- Unweighted parity.
- Criticality-weighted parity.
- Atomic and scoring evidence completeness.
- Unverified evidence.
- Projected post-remediation target.

Do not compare uncertain scores as though they are exact.

Projected improvements must remain explicitly labelled estimates.

---

## 12. Phase 7 — Independent Devil's Advocate

Conduct a separate adversarial review of the initial assessment.

Challenge conclusions rather than simply restating them.

Investigate whether:

1. Required behaviours were omitted.
2. Atomic decomposition created double-counting.
3. Atom criticality was understated.
4. Structurally different implementations conceal behavioural differences.
5. Candidate improvements were incorrectly classified as defects.
6. Original defects were incorrectly treated as mandatory behaviour.
7. Historical claims exceeded available evidence.
8. Unsupported version-specific recommendations were introduced.
9. Static analysis concealed runtime or integration failures.
10. Tests contained weak assertions, excessive mocking or incomplete scenarios.
11. Contradictory evidence remained unresolved.
12. Quality scores were inflated.
13. Unverified findings were treated as confirmed defects.
14. Accessibility or security obligations were overlooked.
15. Proposed changes would break consumers or dependencies.
16. Net-new opportunities introduced unnecessary complexity.
17. Acceptance gates could be bypassed by aggregate scores.
18. Final conclusions were inconsistent with findings and evidence.

### Devil's Advocate register

| Challenge ID | Challenged claim | Counterexample or concern | Evidence IDs | Resolution | Resulting correction |
| ------------ | ---------------- | ------------------------- | ------------ | ---------- | -------------------- |

Classify each challenge as:

- UPHELD.
- REJECTED.
- PARTIALLY_UPHELD.
- UNRESOLVED.

Reconcile all upheld challenges into the canonical registers and recalculate
affected scores.

Do not claim that an independent external reviewer or separate agent was used
unless that review actually occurred.

---
