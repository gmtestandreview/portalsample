# Agent Skill Testing Data Model

## Purpose

This data model represents the Agent Skill authoring, validation, behavioral-evaluation, deterministic-testing, audit, and deployment-decision system defined by this reference pack.

It is designed so the same logical model can be implemented as Markdown/YAML evidence records, JSON documents, relational tables, or an analytics store without changing the governing semantics.

## Design principles

1. **Skill identity is separate from revision identity.** A skill can have many immutable revisions.
2. **Specification, best-practice, conditional, and local requirements retain their authority class.** A local or best-practice rule never becomes a universal specification rule through storage or scoring.
3. **Evaluation case definitions are separate from executed runs.** One case may be executed repeatedly against different revisions, models, environments, or candidate-skill states.
4. **Outcome and requiredness are independent axes.** `FAIL` means a material expectation violation; `required` determines automatic deployment impact.
5. **Behavioral and deterministic evidence are separate evidence families.** Both can support the same deployment decision without being conflated.
6. **NHR is an explicit evidence state.** Missing capability or evidence is recorded, not silently converted to PASS, FAIL, or N/A.
7. **Numeric score never overrides a blocker.** Deployment eligibility is derived from mandatory gates and unresolved required evidence, not score alone.
8. **Reference skills remain testable.** Retrieval/application/resource-discovery baselines can replace behavioral RED where ordinary RED is not meaningful.
9. **Evidence is immutable where practical.** Findings, decisions, and regressions should point to exact runs/revisions rather than mutable summaries.

---

# 1. Conceptual model

```text
Skill
  └──< SkillRevision
         ├──< SkillMetadata
         ├──< Resource
         ├──1 SkillClassification
         ├──< RequirementAssessment >── Requirement
         ├──< EvaluationCampaign
         │      └──< EvaluationCase
         │             ├──< EvaluationRun
         │             │      └──< EvidenceArtifact
         │             ├──0..1 RedGreenComparison
         │             └──< RegressionLink
         ├──< DeterministicSuiteRun
         │      └──< DeterministicTestResult >── DeterministicTestCase
         └──< Audit
                ├──< AuditCriterionScore >── RubricCriterion
                ├──< Finding
                ├──< QAQRMIResult
                └──1 DeploymentDecision

Environment ──< EvaluationCampaign
Environment ──< DeterministicSuiteRun
Environment ──< Audit
```

## Core flow

```text
Specification / BP / LOCAL rules
        ↓
Requirement
        ↓
SkillRevision
        ↓
Behavioral evidence + deterministic evidence
        ↓
Audit / validation gates
        ↓
DeploymentDecision
```

---

# 2. Core entities

## 2.1 Skill

Stable identity for a logical Agent Skill across revisions.

| Field | Type | Required | Rules |
|---|---|---:|---|
| `skill_id` | string/UUID | yes | Stable primary key; independent of path or revision. |
| `canonical_name` | string | yes | Current logical skill name for human navigation. |
| `repository_scope` | string | no | Repository/library/organization scope when relevant. |
| `created_at` | datetime | no | Audit metadata. |
| `retired_at` | datetime | no | Set when intentionally deprecated/retired. |

**Cardinality:** `Skill 1 ──< SkillRevision`.

---

## 2.2 SkillRevision

Immutable or snapshot identity for the exact candidate being evaluated.

| Field | Type | Required | Rules |
|---|---|---:|---|
| `revision_id` | string/UUID | yes | Primary key. |
| `skill_id` | FK → Skill | yes | Parent skill. |
| `revision_ref` | string | yes | Commit hash, version, content hash, or snapshot identifier. |
| `directory_name` | string | yes | Must align with the specification-defined skill name contract. |
| `name` | string | yes | `SKILL.md` frontmatter name. |
| `description` | string | yes | What the skill does and when to use it. |
| `license` | string | no | Optional specification field. |
| `compatibility` | string | no | Optional environment requirements. |
| `allowed_tools` | string | no | Optional space-separated pre-approved tool string. |
| `body_hash` | string | no | Hash of Markdown body for evidence freshness. |
| `artifact_completeness` | enum | yes | `complete_directory`, `complete_skill_md`, `excerpt`, `unknown`. |
| `captured_at` | datetime | no | Snapshot timestamp. |

### SkillRevision invariants

- `name` is 1–64 characters.
- `description` is 1–1024 characters.
- `name` follows the current specification's lowercase alphanumeric/hyphen contract and matches `directory_name`.
- Optional fields remain optional; storage must not make them mandatory.
- A change that can invalidate evidence should create a new revision or otherwise change `revision_ref`.

---

## 2.3 SkillMetadata

Normalized representation of the specification `metadata` mapping.

| Field | Type | Required | Rules |
|---|---|---:|---|
| `revision_id` | FK → SkillRevision | yes | Composite PK part. |
| `metadata_key` | string | yes | Composite PK part. |
| `metadata_value` | string | yes | String values only. |

**Primary key:** (`revision_id`, `metadata_key`).

---

## 2.4 Resource

A supporting file packaged with or referenced by a skill revision.

| Field | Type | Required | Rules |
|---|---|---:|---|
| `resource_id` | string/UUID | yes | Primary key. |
| `revision_id` | FK → SkillRevision | yes | Owning revision. |
| `path` | string | yes | Relative path preferred for packaged skill resources. |
| `resource_type` | enum | yes | `script`, `reference`, `asset`, `template`, `other`. |
| `required` | boolean | yes | Whether successful execution depends on it for applicable paths. |
| `load_condition` | string | no | Observable condition under which it should be loaded/used. |
| `content_hash` | string | no | Evidence/version integrity. |
| `exists_verified` | boolean/null | yes | `null` when not verifiable. |
| `executable` | boolean | no | Useful for script resources. |

### Resource invariants

- Every required resource must resolve before deployment unless the governing gate explicitly records NHR and blocks deployment.
- Load conditions should be testable where resource discovery is part of the skill contract.

---

## 2.5 SkillClassification

Classification of one revision as a testing/execution model.

| Field | Type | Required | Rules |
|---|---|---:|---|
| `classification_id` | string/UUID | yes | Primary key. |
| `revision_id` | FK → SkillRevision | yes | Normally one current classification per revision. |
| `skill_class` | enum | yes | `Discipline`, `Technique`, `Pattern`, `Reference`, `Hybrid`. |
| `confidence` | enum | yes | `High`, `Medium`, `Low`. |
| `primary_purpose` | string | yes | One-sentence purpose. |
| `rationale` | text | yes | Why this is the narrowest correct classification. |
| `human_review` | string/null | no | Unresolved classification issue, if any. |

### ClassificationEvidence

For normalized implementations, classification evidence may be stored separately:

| Field | Type |
|---|---|
| `classification_id` | FK → SkillClassification |
| `evidence_id` | FK → EvidenceArtifact or source reference |
| `evidence_role` | `supporting`, `rejected_alternative`, `boundary` |

---

# 3. Authority and requirement model

## 3.1 Requirement

Atomic rule or quality condition against which a revision can be assessed.

| Field | Type | Required | Rules |
|---|---|---:|---|
| `requirement_id` | string | yes | Stable identifier, e.g. `SPEC-NAME-001`. |
| `authority` | enum | yes | `SPEC`, `BP`, `COND`, `LOCAL`. |
| `source_document` | string | yes | Owning reference/specification. |
| `source_locator` | string | no | Heading/line/anchor/version. |
| `statement` | text | yes | Atomic requirement. |
| `condition` | text/null | no | Required when `authority=COND`; useful for LOCAL applicability. |
| `behavior_critical` | boolean | yes | Marks requirements requiring behavioral evidence. |
| `safety_critical` | boolean | yes | Marks safety-sensitive requirements. |
| `active` | boolean | yes | Allows controlled supersession without deleting history. |

### Authority invariant

Authority is intrinsic to the rule. Assessment, scoring, or repetition in another file does not promote `BP`, `COND`, or `LOCAL` to `SPEC`.

---

## 3.2 RequirementAssessment

Assessment of a requirement against one revision/environment.

| Field | Type | Required |
|---|---|---:|
| `assessment_id` | string/UUID | yes |
| `revision_id` | FK → SkillRevision | yes |
| `requirement_id` | FK → Requirement | yes |
| `environment_id` | FK → Environment | no |
| `applicability` | enum | yes |
| `evidence_state` | enum | yes |
| `rationale` | text | yes |
| `evidence_ref` | FK/reference | no |
| `assessed_at` | datetime | no |

### Applicability enum

- `APPLIES`
- `N/A`
- `UNRESOLVED`

### Evidence state enum

- `Verified`
- `Supported`
- `Unverified_NHR`
- `Failed`

This evidence state is deliberately separate from behavioral evaluation outcomes.

---

# 4. Environment model

## 4.1 Environment

Captures the context in which behavior or deterministic validation is meaningful.

| Field | Type | Required |
|---|---|---:|
| `environment_id` | string/UUID | yes |
| `client` | string | no |
| `repository` | string | no |
| `model` | string | no |
| `runtime` | string | no |
| `operating_system` | string | no |
| `dependency_profile` | string | no |
| `network_access` | boolean/null | no |
| `notes` | text | no |

Environment-specific/local rules should reference this entity rather than being baked into universal requirements.

---

# 5. Behavioral evaluation model

## 5.1 EvaluationCampaign

One coordinated behavioral test campaign for a specific revision and environment.

| Field | Type | Required |
|---|---|---:|
| `campaign_id` | string | yes |
| `revision_id` | FK → SkillRevision | yes |
| `classification_id` | FK → SkillClassification | yes |
| `environment_id` | FK → Environment | yes |
| `evaluator` | string | yes |
| `started_at` | datetime | no |
| `completed_at` | datetime | no |
| `known_limitations` | text/list | no |
| `campaign_status` | enum | yes |

### Campaign status enum

- `planned`
- `running`
- `complete`
- `blocked`

Available tools/capabilities may be normalized through `CampaignCapability` or retained as a list/document field.

---

## 5.2 EvaluationCase

Reusable scenario definition. It describes what to test, not what happened in a particular execution.

| Field | Type | Required |
|---|---|---:|
| `case_id` | string | yes |
| `campaign_id` | FK → EvaluationCampaign | yes |
| `case_title` | string | yes |
| `required` | boolean | yes |
| `phase` | enum | yes |
| `objective` | string | yes |
| `expected_activation` | enum | yes |
| `source_case_id` | FK → EvaluationCase | no |
| `comparison_case_id` | FK → EvaluationCase | no |

### Phase enum

- `activation`
- `RED`
- `GREEN`
- `pressure`
- `reference`
- `regression`

### Expected activation enum

- `activate`
- `do_not_activate`
- `conditional`
- `not_applicable`

### EvaluationCaseSkillClass

Many-to-many mapping when a case applies to multiple classes.

| Field | Type |
|---|---|
| `case_id` | FK → EvaluationCase |
| `skill_class` | Discipline / Technique / Pattern / Reference / Hybrid |

---

## 5.3 CaseParameter

Campaign-supplied values inserted into a reusable case.

| Field | Type |
|---|---|
| `case_id` | FK → EvaluationCase |
| `parameter_name` | string |
| `parameter_value` | text/JSON |

Examples: `representative_request`, input file, pressure context, target resource.

---

## 5.4 ExpectedBehavior

Atomic observable behaviors for a case.

| Field | Type |
|---|---|
| `expected_behavior_id` | string/UUID |
| `case_id` | FK → EvaluationCase |
| `statement` | text |
| `ordinal` | integer |

---

## 5.5 SuccessCriterion

Falsifiable criteria used to decide the case result.

| Field | Type |
|---|---|
| `criterion_id` | string/UUID |
| `case_id` | FK → EvaluationCase |
| `statement` | text |
| `critical` | boolean |
| `ordinal` | integer |

---

## 5.6 EvaluationRun

One execution of one case. Repeated runs create new rows rather than overwriting evidence.

| Field | Type | Required |
|---|---|---:|
| `run_id` | string/UUID | yes |
| `case_id` | FK → EvaluationCase | yes |
| `revision_id` | FK → SkillRevision | yes |
| `environment_id` | FK → Environment | yes |
| `candidate_skill_state` | enum | yes |
| `observed_activation` | enum | yes |
| `behavior_summary` | text | yes |
| `result` | enum | yes |
| `rationale` | text | yes |
| `blocked_by` | text/null | conditional |
| `missing_evidence` | text/null | conditional |
| `required_follow_up` | text/null | conditional |
| `executed_at` | datetime | no |

### Candidate skill state enum

- `unavailable`
- `available`
- `revised`

### Observed activation enum

- `activated`
- `not_activated`
- `unclear`
- `not_applicable`

### Behavioral result enum

- `PASS`
- `AMBER`
- `FAIL`
- `NHR`
- `N/A`

### Result invariants

- `PASS`: every applicable success criterion is supported by evidence.
- `AMBER`: executed, useful evidence exists, but a defensible PASS is unavailable because behavior is partial/ambiguous/inconsistent/unstable/weakly evidenced.
- `FAIL`: a material expected behavior is violated or disproved, regardless of requiredness.
- `NHR`: verification is genuinely unavailable; `blocked_by`, `missing_evidence`, and `required_follow_up` are required.
- `N/A`: case does not apply; rationale is required.
- `required=true` + (`AMBER` or `FAIL` or `NHR`) = automatic behavioral deployment blocker.
- `required=false` + (`AMBER` or `FAIL` or `NHR`) = document risk; not automatically blocking.

---

## 5.7 EvidenceArtifact

Evidence attached to an executed behavioral or deterministic run.

| Field | Type | Required |
|---|---|---:|
| `evidence_id` | string/UUID | yes |
| `run_id` | FK → EvaluationRun | no |
| `deterministic_run_id` | FK → DeterministicSuiteRun | no |
| `evidence_type` | enum | yes |
| `locator` | string | yes |
| `content_hash` | string | no |
| `excerpt` | text | no |
| `captured_at` | datetime | no |

### Evidence type enum

- `prompt`
- `input`
- `output`
- `transcript`
- `file`
- `tool_result`
- `screenshot`
- `log`
- `human_review`
- `other`

Exactly one parent family (`run_id` or `deterministic_run_id`) should normally be populated.

---

## 5.8 RedGreenComparison

Formal comparability record for a GREEN run linked to its RED baseline.

| Field | Type | Required |
|---|---|---:|
| `comparison_id` | string/UUID | yes |
| `red_run_id` | FK → EvaluationRun | yes |
| `green_run_id` | FK → EvaluationRun | yes |
| `same_task` | boolean | yes |
| `equivalence_rationale` | text/null | conditional |
| `preserved_inputs` | boolean | yes |
| `preserved_constraints` | boolean | yes |
| `preserved_success_criteria` | boolean | yes |
| `preserved_pressure_conditions` | boolean | yes |
| `preserved_activation_context` | boolean | yes |

### Comparability invariant

If `same_task=false`, every preservation flag must be true and `equivalence_rationale` must be non-empty. Otherwise the GREEN evidence is AMBER at best and may be invalid.

---

## 5.9 RegressionLink

Graph edge connecting failures/fixes to regression cases.

| Field | Type |
|---|---|
| `source_case_id` | FK → EvaluationCase |
| `regression_case_id` | FK → EvaluationCase |
| `relationship` | `guards_fix`, `positive_control`, `near_miss_control`, `prior_failure` |

Regression completion requires the fixed case plus relevant positive and near-miss controls, not only the original failure.

---

# 6. Deterministic testing model

## 6.1 DeterministicTestCase

One parser/validator/prompt/CLI test definition.

| Field | Type | Required |
|---|---|---:|
| `test_id` | string | yes |
| `module` | string | yes |
| `test_name` | string | yes |
| `contract_area` | enum | yes |
| `requirement_id` | FK → Requirement | no |
| `local_contract` | boolean | yes |
| `description` | text | no |

### Contract area enum

- `parser`
- `validator`
- `prompt`
- `cli`
- `security_serialization`
- `other`

`local_contract=true` identifies repository-specific behavior that must not masquerade as universal specification compliance.

---

## 6.2 DeterministicSuiteRun

Execution of the deterministic suite against a revision/environment.

| Field | Type | Required |
|---|---|---:|
| `deterministic_run_id` | string/UUID | yes |
| `revision_id` | FK → SkillRevision | yes |
| `environment_id` | FK → Environment | yes |
| `execution_mode` | enum | yes |
| `status` | enum | yes |
| `started_at` | datetime | no |
| `completed_at` | datetime | no |
| `dependency_notes` | text | no |

### Execution mode enum

- `native`
- `compatibility_shim`
- `static_compile_only`
- `not_executed`

### Suite status enum

- `PASS`
- `FAIL`
- `NHR`

A compatibility-shim pass must not be represented as a native dependency-backed pass.

---

## 6.3 DeterministicTestResult

One test result within one suite run.

| Field | Type |
|---|---|
| `deterministic_run_id` | FK → DeterministicSuiteRun |
| `test_id` | FK → DeterministicTestCase |
| `result` | `PASS`, `FAIL`, `SKIP`, `NHR` |
| `message` | text/null |
| `duration_ms` | integer/null |

**Primary key:** (`deterministic_run_id`, `test_id`).

---

# 7. Audit and scoring model

## 7.1 Audit

One formal quick triage or full audit for a revision.

| Field | Type | Required |
|---|---|---:|
| `audit_id` | string/UUID | yes |
| `revision_id` | FK → SkillRevision | yes |
| `environment_id` | FK → Environment | no |
| `audit_type` | enum | yes |
| `raw_earned_points` | decimal | no |
| `raw_applicable_max` | decimal | no |
| `normalized_score` | decimal | no |
| `score_band` | string | no |
| `completed_at` | datetime | no |

### Audit type enum

- `quick_triage`
- `full_audit`
- `rescore`

A quick triage should not be treated as definitive production-readiness scoring.

---

## 7.2 RubricCriterion

Canonical 100-point scoring dimensions.

| Field | Type |
|---|---|
| `rubric_criterion_id` | string |
| `name` | string |
| `weight` | integer |
| `description` | text |
| `active` | boolean |

The current criterion weights sum to 100 before N/A normalization.

---

## 7.3 AuditCriterionScore

Score for one criterion in one audit.

| Field | Type |
|---|---|
| `audit_id` | FK → Audit |
| `rubric_criterion_id` | FK → RubricCriterion |
| `applicable` | boolean |
| `applicable_max` | decimal |
| `earned` | decimal |
| `evidence_state` | `Verified`, `Supported`, `Unverified_NHR`, `Failed` |
| `notes` | text |

N/A removes the criterion from both numerator and denominator. Missing evidence is not N/A.

---

## 7.4 Finding

Atomic audit finding.

| Field | Type |
|---|---|
| `finding_id` | string/UUID |
| `audit_id` | FK → Audit |
| `severity` | `Critical`, `High`, `Medium`, `Low` |
| `criterion_id` | FK → RubricCriterion / Requirement | no |
| `statement` | text |
| `evidence_ref` | reference |
| `deduction` | decimal/null |
| `recommended_fix` | text |
| `resolved` | boolean |

---

## 7.5 QAQRMIResult

Bidirectional mapping evidence for a critical instruction, trigger, branch, or load condition.

| Field | Type |
|---|---|
| `qaq_rmi_id` | string/UUID |
| `audit_id` | FK → Audit |
| `subject_type` | `instruction`, `trigger`, `branch`, `load_condition`, `classification` |
| `subject_ref` | string |
| `result` | `PASS`, `FAIL`, `NHR` |
| `positive_request` | text |
| `near_miss` | text |
| `governing_instruction` | text/reference |
| `expected_behavior` | text |
| `reverse_mapping` | text |
| `evidence_ref` | reference |

---

# 8. Deployment decision model

## 8.1 DeploymentDecision

Final readiness decision. This is deliberately separate from the numeric score.

| Field | Type | Required |
|---|---|---:|
| `decision_id` | string/UUID | yes |
| `revision_id` | FK → SkillRevision | yes |
| `audit_id` | FK → Audit | no |
| `recommendation` | enum | yes |
| `deployment_eligible` | boolean | yes |
| `decision_rationale` | text | yes |
| `decided_at` | datetime | no |

### Recommendation enum

- `deploy`
- `revise`
- `split`
- `merge`
- `deprecate`
- `hold`

## 8.2 DeploymentBlocker

One reason deployment is prohibited.

| Field | Type |
|---|---|
| `blocker_id` | string/UUID |
| `decision_id` | FK → DeploymentDecision |
| `blocker_type` | enum |
| `source_ref` | FK/reference |
| `statement` | text |
| `resolved` | boolean |

### Blocker type enum

- `mandatory_spec_failure`
- `critical_safety`
- `core_behavior_contradiction`
- `essential_merge_guidance_loss`
- `missing_authorization`
- `required_behavior_amber`
- `required_behavior_fail`
- `required_behavior_nhr`
- `required_resource_unresolved`
- `required_deterministic_validation_nhr`
- `other_required_gate`

### Deployment invariants

`deployment_eligible=false` when any unresolved blocker exists.

A high numeric score cannot set `deployment_eligible=true` while an unresolved blocker remains.

---

# 9. Derived rules

These are calculated rules, not independent mutable facts.

## 9.1 Behavioral blocker derivation

```text
IF EvaluationCase.required = true
AND latest applicable EvaluationRun.result IN (AMBER, FAIL, NHR)
THEN create/retain DeploymentBlocker
```

## 9.2 Reference baseline rule

```text
IF SkillClassification.skill_class = Reference
AND ordinary behavioral RED is not meaningful
THEN a retrieval/application baseline MAY satisfy the RED evidence role
PROVIDED required discovery/retrieval/application/coverage cases are resolved.
```

## 9.3 RED/GREEN validity rule

```text
IF GREEN.same_task = false
AND any preservation flag = false
THEN GREEN cannot be PASS.
```

## 9.4 Evidence freshness rule

```text
IF evidence was produced against revision A
AND a relevant behavior/contract changed in revision B
THEN evidence from A cannot satisfy B's fresh-validation gate without explicit justification.
```

## 9.5 Score normalization

```text
normalized_score =
  earned_applicable_points / maximum_applicable_points * 100
```

Round only the final normalized result. N/A removes points from the denominator; NHR does not.

---

# 10. Recommended identifiers

Use stable prefixes to make evidence human-readable:

| Entity | Example |
|---|---|
| Skill | `SKL-writing-skills` |
| Revision | `REV-20260912-a1b2c3d` |
| Requirement | `SPEC-NAME-001` |
| Campaign | `CMP-20260912-writing-skills` |
| Activation case | `ACT-001` |
| RED/GREEN case | `RG-001-RED`, `RG-001-GREEN` |
| Pressure case | `PRS-001` |
| Reference case | `REF-004` |
| Regression case | `REG-001` |
| Behavioral run | `RUN-<uuid>` |
| Deterministic test | `DET-validator-metadata-string-values` |
| Audit | `AUD-20260912-001` |
| Finding | `FND-001` |
| Deployment decision | `DEC-20260912-001` |

---

# 11. Canonical integrated record example

```yaml
skill:
  skill_id: SKL-writing-skills
  canonical_name: writing-skills

revision:
  revision_id: REV-20260912-a1b2c3d
  revision_ref: a1b2c3d
  directory_name: writing-skills
  name: writing-skills
  description: Use when creating, auditing, optimizing, testing, or validating Agent Skills.
  artifact_completeness: complete_directory

classification:
  skill_class: Discipline
  confidence: High
  primary_purpose: Govern the Agent Skill authoring and validation lifecycle.

campaign:
  campaign_id: CMP-20260912-writing-skills
  target_environment: Claude Code repository context
  evaluator: evaluation-agent
  required_cases:
    - ACT-001
    - RG-001-RED
    - RG-001-GREEN
    - REG-001

case:
  case_id: RG-001-GREEN
  required: true
  phase: GREEN
  objective: Verify the candidate skill materially reduces the RED failure.
  expected_activation: activate

run:
  run_id: RUN-1234
  candidate_skill_state: available
  observed_activation: activated
  result: PASS
  rationale: All applicable success criteria were evidenced.

comparison:
  red_run_id: RUN-1200
  green_run_id: RUN-1234
  same_task: true
  preserved_inputs: true
  preserved_constraints: true
  preserved_success_criteria: true
  preserved_pressure_conditions: true
  preserved_activation_context: true

audit:
  audit_id: AUD-20260912-001
  normalized_score: 98
  score_band: production-ready

decision:
  decision_id: DEC-20260912-001
  recommendation: deploy
  deployment_eligible: true
  blockers: []
```

---

# 12. Minimum viable implementation

If this model is implemented initially as files rather than a database, the minimum useful persistence structure is:

```text
skills/<skill-id>/
  revisions/<revision-id>/
    revision.yaml
    resources.yaml
    classification.yaml
    requirements.yaml
    evals/
      campaigns/<campaign-id>/
        campaign.yaml
        cases/
        runs/
        evidence/
    deterministic/
      suite-runs/
    audits/
      <audit-id>/
        audit.yaml
        findings.yaml
        qaq-rmi.yaml
        deployment-decision.yaml
```

The existing `scripts/evals/activation`, `scripts/evals/red-green`, `scripts/evals/pressure`, `scripts/evals/reference`, and `scripts/evals/regression` folders can remain the **case-definition library**; executed campaign evidence should be stored separately so reusable scenarios are not overwritten by run results.

---

# 13. Source-to-model traceability

| Source contract | Model area |
|---|---|
| `specification.md` | SkillRevision, SkillMetadata, Resource |
| `skill-classification.md` | SkillClassification |
| `best-practices-evaluations.md` | Requirement / BP criteria |
| `SKILL-testing-checklist.md` | RequirementAssessment, DeploymentDecision, DeploymentBlocker |
| `testing-skills-with-subagents.md` | EvaluationCampaign, EvaluationCase, EvaluationRun, RedGreenComparison, RegressionLink |
| `evals/evaluation-schema.md` | Behavioral fields, outcomes, requiredness, evidence rules |
| `audit-scoring.md` | Audit, RubricCriterion, AuditCriterionScore, Finding, QAQRMIResult |
| deterministic Python tests | DeterministicTestCase, DeterministicSuiteRun, DeterministicTestResult |

---

# 14. Recommended ownership boundaries

- **Specification owns:** structural validity and frontmatter/resource contracts.
- **Best-practice evaluation owns:** quality criteria.
- **Classification owns:** test-model selection.
- **Behavioral methodology owns:** how representative behavior evidence is created.
- **Deterministic tooling owns:** executable repository/specification checks it actually implements.
- **Audit scoring owns:** points, severity, QAQ/RMI scoring, and score bands.
- **Deployment checklist owns:** final blocking-gate completeness.
- **DeploymentDecision owns:** the final recommendation and unresolved blocker set.

This ownership model prevents authority inversion and reduces cross-file drift.
