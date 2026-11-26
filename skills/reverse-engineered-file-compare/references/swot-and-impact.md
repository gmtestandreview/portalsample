# SWOT and architecture impact — sections 9–10

## 9. Phase 4 — Comparative SWOT analysis

In §5.2 DIAGNOSTIC_ONLY, use these lenses for supported source findings only;
link DR/MR IDs instead of formal atoms and do not claim exhaustive coverage.
STOP does not enter this analysis.

Conduct the SWOT analysis from File B's perspective relative to File A.

### 9.1 Strengths

Identify evidence-supported advantages of File B:

- Equivalent or improved functionality.
- Superior type safety.
- Better component composition.
- Reduced complexity.
- Reduced duplication.
- Improved maintainability.
- Stronger separation of concerns.
- Better testability.
- Improved accessibility.
- Stronger security.
- More robust error handling.
- Measurable performance improvements.

Do not classify a different implementation as a strength without explaining its
benefit.

### 9.2 Weaknesses

Identify internal limitations of File B:

- Missing capabilities.
- Incomplete business rules.
- Behavioural inconsistencies.
- Weak type contracts.
- Architectural deficiencies.
- Security or accessibility weaknesses.
- Insufficient error handling.
- Excessive complexity.
- Inadequate regression assurance.
- Integration incompatibilities.

### 9.3 Opportunities

Classify opportunities into four distinct categories.

#### O1 — Functional gap closure

Required functionality in File A that is absent, incomplete or incorrect in File
B.

This category includes current gaps whose historical origin cannot be
established.

These are mandatory parity remediation opportunities unless the governing
requirement is formally adjusted.

#### O2 — Evolutionary enhancement adoption

Capabilities demonstrably introduced into File A after the verified historical
reverse-engineering baseline.

Determine how File B can incorporate these capabilities without sacrificing its
superior architecture.

Where historical evidence is insufficient, use O1 and record the unresolved
chronology.

#### O3 — Retain and leverage candidate improvements

Beneficial implementations already present in File B.

Determine whether they should be:

- Retained.
- Extended.
- Reused.
- Consolidated.
- Adopted elsewhere through separately approved work.

Do not regress these improvements to reproduce File A's implementation
structure.

#### O4 — Net-new engineering improvements

Justified improvements that neither logical implementation currently provides.

Examples include:

- Stronger type contracts.
- Improved abstractions.
- Better component composition.
- Reduced cognitive complexity.
- Reduced duplication.
- Better resilience.
- Improved security.
- Improved accessibility.
- Improved testability.
- Measurable resource or performance improvements.

Every O4 recommendation must document:

- Demonstrated problem.
- Expected measurable benefit.
- Implementation complexity.
- Dependency implications.
- Regression risk.
- Alternatives, including no change.
- Verification strategy.

Reject speculative optimisation, unnecessary abstraction and changes whose costs
exceed the supported benefit.

Separate mandatory baseline remediation from discretionary enhancements.

### 9.4 Threats

Identify risks affecting adoption, retention or future evolution of File B:

- Breaking upstream or downstream contracts.
- Behavioural regressions.
- Security vulnerabilities.
- Data integrity failures.
- Race conditions.
- Accessibility regressions.
- Dependency incompatibility.
- Incomplete historical context.
- Insufficient verification.
- Uncontrolled scope expansion.
- Over-engineering.
- Technical debt accumulation.

### 9.5 Consolidated findings register

Maintain one canonical findings register.

| Finding ID | Atom IDs | Primary SWOT category | Opportunity category | Finding | Evidence IDs | Severity | Confidence | Recommended action |
| ---------- | -------- | --------------------- | -------------------- | ------- | ------------ | -------- | ---------- | ------------------ |

Assign each root issue one canonical finding identifier.

Where a weakness also creates an opportunity or threat, cross-reference the
existing finding rather than duplicating the root issue.

If an opportunity qualifies as both O1 and O2, use O2 as its primary category
and O1 as a secondary classification without counting the finding twice.

Preserve separate findings when their causes, acceptance criteria or remediation
requirements differ materially.

---

## 10. Phase 5 — Architecture and change-impact analysis

For triggered migration assessments (§5.1), include affected form/provider,
field-path, persisted DTO/API, callback and mutation-order boundaries where
applicable. Distinguish approved implementation substitution, compatibility
adapter work and business-contract changes. Map inherited defects and proposed
corrections to the same canonical findings; do not infer their chronology.

For every material gap, divergence, additional behaviour or proposed change,
trace the affected side members, dependency edges and public entry-point
contracts (including split/merged implementations). Identify relocation-only
changes separately from consumer breakage, cyclic dependencies, duplicated
effects and shared-state changes. Evaluate:

- Upstream component consumers.
- Downstream dependencies.
- Public TypeScript exports.
- Component props.
- Shared hooks.
- Context providers.
- API contracts.
- Routing.
- State management.
- Design-system integration.
- Storybook stories.
- Existing unit and integration tests.
- Security and accessibility controls.
- Backward compatibility.

### Impact classification

- CONFIRMED: Directly supported by evidence.
- POTENTIAL: Credible impact requiring verification.
- UNRESOLVED: Insufficient dependency information.
- NONE: No material impact established, with justification.

### Impact matrix

| Impact ID | Finding ID | Affected consumer/dependency | Contract | Impact classification | Consequence | Severity | Evidence IDs | Required verification |
| --------- | ---------- | ---------------------------- | -------- | --------------------- | ----------- | -------- | ------------ | --------------------- |

Do not expand implementation scope based on speculative downstream effects.

Escalate dependencies that require separate authorisation.

---
