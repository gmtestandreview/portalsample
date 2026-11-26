# Remediation, verification and acceptance — sections 13–17

## 13. Phase 8 — Prioritised remediation and verification planning

In §5.2 DIAGNOSTIC_ONLY, use task and verification fields with DR/MR links
instead of unavailable atom/scoring links. Do not claim formal phase completion.
STOP returns only the input-stop record.

### 13.1 Remediation priority

| Priority | Definition                                                                           |
| -------- | ------------------------------------------------------------------------------------ |
| P0       | Critical security, data integrity or essential functional failure                    |
| P1       | Material functional gap, regression, broken contract or mandatory acceptance failure |
| P2       | Non-critical quality, resilience or maintainability deficiency                       |
| P3       | Discretionary enhancement or minor optimisation                                      |

Order remediation by dependencies, criticality, regression risk and expected
benefit.

Mandatory parity work takes precedence over discretionary optimisation unless a
prerequisite refactor is demonstrably necessary.

### 13.2 Recommended action

Assign one primary action to each task:

- RETAIN — Preserve beneficial existing implementation.
- INCORPORATE — Introduce missing required behaviour.
- ADAPT — Incorporate behaviour through the candidate's architecture.
- REFACTOR — Improve implementation while preserving required behaviour.
- CORRECT — Resolve a demonstrated defect.
- REMOVE — Remove confirmed harmful or unnecessary behaviour.
- INVESTIGATE — Resolve missing evidence or uncertainty.
- DEFER — Record discretionary work for future consideration.

### 13.3 Remediation task contract

For every task, provide:

- Task ID and title.
- Related atom, finding, impact and evidence identifiers.
- Opportunity category.
- Priority and severity.
- Recommended action.
- Current behaviour.
- Required target behaviour.
- Implementation approach.
- Alternative approaches, including no change where applicable.
- Rationale.
- Prerequisites and dependencies.
- Upstream effects.
- Downstream effects.
- Behaviour and improvements to preserve.
- Regression risks.
- Estimated effort with stated uncertainty.
- Expected measurable benefit.
- Required verification.
- Acceptance criteria.
- Scope and approval requirements.

Do not create unrelated implementation tasks.

Use RETAIN decisions to protect demonstrated candidate improvements during later
remediation.

### 13.4 Verification strategy

Use the project's existing authorised verification infrastructure.

Where applicable, plan:

- Type checking.
- Linting and static analysis.
- Unit tests.
- React component tests.
- Storybook interaction tests.
- Integration tests.
- API contract tests.
- End-to-end tests.
- Accessibility tests.
- Error and failure-path tests.
- Asynchronous and race-condition tests.
- Performance measurements.

Do not invent available commands or frameworks.

Derive exact commands from the repository's verified configuration where
available.

Otherwise provide proposed verification methods and mark commands as requiring
confirmation.

### 13.5 Distinct test purposes

| Test type        | Purpose                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| Characterisation | Document observed original behaviour without asserting that it is correct |
| Differential     | Compare both implementations under controlled equivalent conditions       |
| Specification    | Verify approved intended behaviour                                        |
| Regression       | Preserve previously verified correct behaviour                            |
| Improvement      | Verify approved behavioural corrections or enhancements                   |
| Negative         | Verify rejection, errors and failure conditions                           |
| Contract         | Verify upstream and downstream integration obligations                    |
| Performance      | Measure relevant performance characteristics against defined conditions   |

Where original behaviour conflicts with higher-authority requirements, use
specification tests as the correctness oracle.

Do not reproduce original defects solely to achieve differential equivalence.

### 13.6 Behavioural test contract

Each proposed test must include:

- Test ID.
- Requirement and atom identifiers.
- Finding and remediation identifiers where applicable.
- Test purpose.
- Preconditions.
- Inputs.
- Expected observable outcome.
- Authoritative expected-result source.
- Boundary and failure conditions.
- Test environment.
- Required evidence level.
- Existing or proposed test location.

Use Given/When/Then scenarios for behavioural tests where practical.

### 13.7 Test execution evidence

Use the following statuses:

- PASS: Existing test executed successfully.
- FAIL: Existing test executed and failed.
- BLOCKED: Execution prevented by an identified blocker.
- NOT_EXECUTED: Existing test identified but not run.
- PROPOSED: Test does not yet exist.
- NOT_APPLICABLE: Test type does not apply, with justification.

For executed tests record:

- Actual command.
- Environment and relevant versions.
- Exit status.
- Relevant output.
- Assertions or behaviours exercised.
- Limitations.

Do not claim an entire test suite verifies an atom unless its assertions
actually cover that atom.

Do not count proposed tests as passing evidence.

### 13.8 End-to-end traceability matrix

| Requirement ID | Atom ID | File A location | File B mapping | Finding ID | Impact ID | Remediation ID | Test ID | Evidence ID | Verification status |
| -------------- | ------- | --------------- | -------------- | ---------- | --------- | -------------- | ------- | ----------- | ------------------- |

Every mandatory remediation must trace to a verified finding or an explicitly
identified evidence gap.

Every required behavioural atom must have an appropriate verification method.
For cross-member implementations list every material A/B location and edge ID;
trace public-contract tests from original consumer import through the composed
candidate, not just direct calls to relocated utilities.

---

## 14. Phase 9 — Acceptance gates and final reconciliation

### 14.1 Mandatory acceptance gates

| Gate | Requirement                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------ |
| G01  | Authoritative and candidate source provenance recorded; material identity uncertainties resolved |
| G02  | Complete required atomic inventory established and reconciled                                    |
| G03  | Unweighted and criticality-weighted required functional parity equal 100%                        |
| G04  | No unresolved critical or high-severity findings                                                 |
| G05  | No unapproved material behavioural or integration divergence                                     |
| G06  | All required applicable regression and behavioural verification passed                           |
| G07  | Applicable TypeScript type-checking and linting requirements passed                              |
| G08  | Mandatory security, accessibility and coverage requirements maintained                           |
| G09  | Beneficial candidate improvements preserved or removal explicitly justified and authorised       |
| G10  | Final verified engineering quality score at least 96/100                                         |
| G11  | Mandatory claims meet minimum evidence levels and HIGH confidence                                |
| G12  | No unresolved material evidence contradictions                                                   |
| G13  | No unverified mandatory assessment criteria                                                      |
| G14  | Findings, remediation tasks, tests and scoring calculations reconciled                           |

Discretionary O4 opportunities do not prevent acceptance unless they address a
verified mandatory deficiency. G09 evaluates the current candidate, not a
promise to preserve an improvement during future remediation. If compatibility
or benefit is unverified, do not use a conditional RETAIN plan as proof of PASS.
G10 is FAIL if the exact ceiling is below 96; UNVERIFIED if U > 0 and the
ceiling is at least 96; PASS only if U = 0 and the final score is at least 96.
G13 is FAIL when a mandatory criterion is known to remain UNVERIFIED. G14 is not
PASS if any required applicable register field, scoring check or trace link is
absent, or reconciliation is incomplete. Mark it FAIL for a demonstrated
contract omission, UNVERIFIED if not yet inspected. Gates are independent;
report all G01–G14 even when G03 already fails.

For composite sides apply the same fourteen gates, not separate per-file gates:
G01 requires resolved member identity and scope manifests; G02 requires unique A
atoms and complete cross-member mappings; G05 includes public entry-point
compatibility or approved migration; G06–G08 and G11 require applicable
verification of the composed implementation; G09 checks retained benefits across
all B members; G10 uses the single logical B score; G13 retains unresolved
mandatory dependencies; G14 reconciles manifests, dependency edges, public
contracts, cross-member mappings and ledgers. §5.2 controls entry: a missing
required functional member is a pre-assessment STOP rather than an invented gate
result; a local type contract gap permits DIAGNOSTIC_ONLY gate observations but
no formal score or readiness verdict. Gate counts, score threshold and
precedence are unchanged.

For triggered §5.1 migration assessments, reconcile each applicable contract row
against its existing atoms, checks, findings, evidence and tests. G05 requires
approved material contract changes; G06/G11 require evidence of the applicable
producer/consumer and asynchronous outcomes; G13 covers unresolved mandatory
migration contracts; G14 includes the conditional register and its trace links.
An inherited defect is not a waiver of any gate.

A high quality score must never override a failed mandatory gate.

### 14.2 Gate statuses

Assign each evaluated applicable gate one status:

- PASS.
- FAIL.
- UNVERIFIED.

NOT_APPLICABLE is permitted only for genuinely inapplicable conditional
requirements, with justification. For an interrupted assessment only, record
NOT_EVALUATED as a progress marker (not a gate outcome); give the exact next
check. An evaluated gate with insufficient evidence is UNVERIFIED, not
NOT_EVALUATED. An interruption cannot hide a known FAIL or evaluated UNVERIFIED.
Do not mark an incomplete assessment READY.

### 14.3 Deterministic readiness decision

Apply these rules in order only in FORMAL. For DIAGNOSTIC_ONLY, use §5.2's
non-ready diagnostic adoption label and gate observations, not a formal verdict.
STOP has no gate-based decision.

1. **BLOCKED:** At least one applicable mandatory gate has demonstrably failed.
2. **UNVERIFIED:** No mandatory gate is known to have failed, but at least one
   mandatory gate lacks sufficient evidence.
3. **PARTIAL:** Assessment execution was incomplete before all gates could be
   evaluated, and no known failure or evaluated unresolved evidence gate takes
   precedence.
4. **READY:** Assessment is complete and every applicable mandatory gate passes.

If a failure and an evidence gap coexist, report BLOCKED and separately identify
the evidence gap.

PARTIAL and UNVERIFIED are not acceptance decisions.

If scoring evidence remains unresolved, a potential quality ceiling above the
acceptance threshold does not establish readiness.

### 14.4 Final reconciliation

For FORMAL, before delivering the assessment, verify the following. For
DIAGNOSTIC_ONLY, reconcile the bounded template only; never claim G14 PASS. STOP
does not enter this section.

- A/B manifests, topology, dependency edges and public entry-point contracts are
  reconciled; no missing required member or unresolved material scope.
- Every authoritative atom is represented exactly once in parity calculations,
  including cross-member mappings and independent public contracts.
- Candidate-only behaviours are reconciled.
- If §5.1 applies, the migration trigger/dimensions, contract register,
  inherited defect decisions, approval and cross-register links reconcile;
  otherwise the non-applicability rationale is recorded.
- Atom weights and denominators match the frozen register.
- Historical claims have sufficient provenance.
- Findings reference valid evidence identifiers.
- Root issues are not counted twice.
- SWOT opportunities reference canonical findings.
- Impact assessments cover material changes.
- Remediation tasks reference valid findings.
- Required tests trace to authoritative behaviours.
- Executed and proposed tests remain distinguished.
- Quality scoring satisfies M = P + F + U once per logical side, with identical
  allocations unaffected by file count.
- Evidence completeness and uncertainty calculations reconcile.
- Accepted divergences have explicit approval.
- Acceptance gate statuses match the evidence.
- The readiness decision follows the deterministic decision rules.

Correct inconsistencies before issuing the final assessment.

If inconsistencies cannot be resolved, disclose them and prevent unsupported
acceptance.

---

## 15. Required output structure

In FORMAL, produce one consolidated assessment containing the following eight
sections. In DIAGNOSTIC_ONLY, use the bounded A–H branch specified in §5.2 and
the report template; do not represent unestablished metrics as empty scores. In
STOP, return only the input-stop record specified in §5.2. Use the mandatory
report field template listed in SKILL.md; it is a rendering and completeness
aid, subordinate to the numbered protocol. Draft registers as phases run; render
the final report only after reconciliation. All mandatory fields must be present
as named columns or labelled card fields. Use NONE for a verified absence,
NOT_APPLICABLE with a reason for a genuinely inapplicable field, and UNVERIFIED
with a missing-evidence reason otherwise. Do not collapse fields into an unnamed
narrative. Empty registers must explicitly state why there are no rows. Record
omitted work if interrupted; do not silently skip a register, scoring check,
gate or executive question.

### Section A — Executive decision

Include:

- Scope and purpose.
- Comparative quality scores or ranges.
- Confirmed functional parity.
- Criticality-weighted parity.
- Evidence completeness.
- Significant findings.
- Final readiness decision.

### Section B — Scope, evidence and atomic baseline

Include:

- Side manifests, topology, member/version inventory, dependency edges and
  public entry-point inventory.
- Evidence register.
- Technology context.
- Scope limitations.
- Frozen atomic inventory.
- Migration trigger/dimensions and A-side contract freeze (§5.1), or explicit
  reason not applicable.

### Section C — Functional parity and evolutionary gaps

Include:

- Bidirectional parity matrix with cross-member mappings and entry-point
  compatibility.
- Candidate-only behaviour.
- Approved and pending divergences.
- Evolutionary gap register.
- Historical and causal limitations.
- Applicable migration contract rows, B mapping, defect decisions and approval
  links (§5.1).

### Section D — Comparative SWOT and opportunities

Include:

- SWOT summary.
- Canonical findings register.
- O1 functional gap closure.
- O2 evolutionary enhancement adoption.
- O3 retained candidate improvements.
- O4 net-new engineering opportunities.

### Section E — Architecture, impact and comparative scoring

Include:

- Material change-impact matrix.
- Frozen scoring checks.
- Comparative quality assessment.
- Parity calculations.
- Evidence uncertainty.

### Section F — Devil's Advocate review

Include:

- Material challenges.
- Evidence contradictions.
- Resolutions.
- Corrections to findings and scores.
- Unresolved challenges.

### Section G — Remediation and verification plan

Include:

- Prioritised remediation backlog.
- Implementation dependencies.
- Behaviour to preserve.
- Verification scenarios.
- Test execution evidence.
- End-to-end traceability matrix.

### Section H — Final acceptance and recommendations

Include:

- Acceptance gate matrix.
- Reconciliation results.
- Outstanding blockers.
- Remaining evidence requirements.
- Recommended implementation sequence.
- Definitive readiness decision.

---

## 16. Execution efficiency and output controls

Maintain canonical registers instead of repeatedly reproducing findings. Load
the next phase reference only at its phase boundary; keep the shared frozen
ledger and IDs rather than re-reading prior material unless a rule or
contradiction needs reconciliation. Load the applicable report template branch
once after §5.2 routing. If output exceeds the available response capacity and a
user-facing artifact can be created safely outside the assessed repository,
provide the complete report as that artifact plus an executive summary;
otherwise preserve the partial register state and explicitly name all remaining
work. Never compress away mandatory fields to fit a response.

Use stable identifiers and cross-references.

Summarise evidence rather than reproducing entire source files.

Provide detailed analysis for material findings, but use concise entries for
routine equivalent atoms.

Never omit required atoms merely to shorten the assessment.

For large files or multi-file implementations:

1. Assess in logical component or responsibility groups.
2. Maintain the shared frozen inventory.
3. Reconcile group results into the canonical registers.
4. Identify incomplete assessment explicitly if execution limits are reached.

If context or execution limits prevent completion, provide the completed
evidence, remaining scope and next required action.

Do not falsely claim exhaustive assessment.

Do not continue repetitive analysis after all required exit conditions and
reconciliation checks are satisfied.

---

## 17. Final executive recommendation

Explicitly answer:

1. Is File B functionally complete?
2. Is File B behaviourally equivalent to the effective authoritative baseline?
3. Is File B technically superior, inferior or mixed in engineering quality?
4. Which missing capabilities must be incorporated?
5. Which historical enhancements must be adopted?
6. Which candidate improvements must be retained?
7. Which net-new opportunities provide justified engineering value?
8. Which risks prevent adoption?
9. Which dependencies or contracts could be affected?
10. What evidence and verification remain outstanding?
11. What is the recommended implementation sequence?
12. Is File B ready for acceptance?

Support every material conclusion with traceable evidence.

Do not declare technical superiority solely from a higher aggregate quality
score when material behavioural, security or integration issues remain.

Stop after delivering the assessment, remediation plan and verification plan.

Await explicit approval before modifying source files or commencing remediation.
