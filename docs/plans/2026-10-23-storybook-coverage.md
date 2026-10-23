# ATOMIC REMEDIATION DIRECTIVE v3

## Storybook Evidence Pipeline — Security, Correctness, and Verifiable Closure

### ROLE

Act as a principal Node.js security engineer, TypeScript/JavaScript architect, code-quality specialist, and evidence-integrity auditor.

Apply atomic decomposition, Graph-of-Thought dependency analysis, bounded iterative remediation, and test-driven verification to resolve the supplied findings.

Your objective is to remediate the reported **17 Critical and 119 High findings across the Storybook evidence pipeline**, alongside all 16 documented atomic-audit findings, while preserving existing intended functionality.

These totals are provisional until reconciled with the individual scanner records and current repository state.

This is an implementation task when authorised repository editing and testing capabilities are available. Otherwise, provide actionable patches and explicitly label verification limitations.

---

## 1. AUTHORITATIVE INPUTS

Read the complete versions of:

**Source files**

- `scripts/storybook-closure.mjs`
- `scripts/storybook-coverage.mjs`
- `scripts/storybook-coverage-worklist.mjs`
- `scripts/storybook-coverage-eslint.config.mjs`

**Audit documents**

- `storybook-closure.audit.md`
- `storybook-coverage.audit.md`
- `storybook-coverage-worklist.audit.md`
- `storybook-coverage-eslint.audit.md`
- `storybook-coverage-integrated.audit.md`

**Scanner reports**

- Original `storybook-closure.mjs` findings: 4 Critical, 68 High.
- `storybook-coverage.mjs` findings: 13 Critical, 48 High.
- `storybook-coverage-worklist.mjs` findings: 3 High.

Inspect `package.json`, `tsconfig.json`, relevant Storybook configuration, source manifests, and existing tests when available.

Do not assume that the audit's historical line numbers remain current.

Treat the scanned source, audit observations, and current runtime results as distinct evidence classes.

---

## 2. PRIMARY SUCCESS CONTRACT

The required outcome is not simply zero warnings.

Success requires:

1. Every original Critical and High finding is accounted for.
2. All confirmed security weaknesses have genuine fixes.
3. All audit findings F-01 through F-16 have documented dispositions.
4. No regression in the Storybook coverage denominator.
5. No incomplete or forged MCP evidence can qualify as complete.
6. Frozen-input identity remains valid throughout the closure workflow.
7. ACL and process cleanup are truthful and recoverable.
8. Public CLI and validation contracts remain compatible unless a necessary security change is documented.
9. All four maintained scripts are included in appropriate static-quality checks.
10. Final verification clearly distinguishes passing tests from unexecuted tests.

Do not fabricate results, weaken checks, or claim completion before sufficient evidence exists.

---

## 3. STAGE 0 — BASELINE AND FINDING RECONCILIATION

Before editing any file:

- Confirm the current checkout and working-tree state.
- Read the supplied scanner reports completely.
- Enumerate every reported finding by severity, file, rule, line, and occurrence.
- Reconcile the reported totals of 17 Critical and 119 High.
- Resolve the previous discrepancy between four reported Critical closure findings and three explicitly visible entries.
- Identify duplicate scanner warnings associated with one underlying defect.
- Cross-reference findings with F-01 through F-16.
- Verify whether a scanner finding remains applicable to the current source.
- Preserve baseline results, commands, and relevant outputs.

The 16 audit findings are additional correctness obligations, not 16 extra scanner occurrences.

Never invent a missing finding.

Classify each finding as:

- Confirmed defect.
- Reproduced security vulnerability.
- Conditional risk requiring testing.
- Scanner configuration issue.
- Potential false positive requiring justification.
- Not reproducible in the current revision.
- Insufficient evidence.

### Historical baseline

The audit recorded 193 focused tests passing with an extended timeout, successful Storybook build, successful explicit linting, and five source-mode evidence diagnostics.

Managed closure, live MCP, BDD, and accessibility testing were not performed.

Do not present historical results as current execution evidence.

---

## 4. STAGE 1 — CONSTRUCT THE ATOMIC GRAPH

Use the 31 functional atoms defined by the audits:

- CLOSURE-01 through CLOSURE-11.
- COVERAGE-01 through COVERAGE-12.
- WORKLIST-01 through WORKLIST-05.
- LINT-01 through LINT-03.

For every atom, identify:

- Inputs and outputs.
- Trust boundaries.
- Side effects.
- Security invariants.
- Public contracts.
- Upstream dependencies.
- Downstream consumers.
- Related audit findings.
- Related scanner findings.
- Regression tests.

Create a directed dependency graph with:

`DEPENDS_ON`, `PRODUCES`, `VALIDATES`, `SHARES_CONTRACT`, `SECURITY_BOUNDARY`, `BLOCKS`, `VERIFIED_BY`, and `OVERLAPS_FINDING` relationships.

Determine a dependency-safe remediation order.

Identify strongly connected or tightly coupled contracts that should be updated together.

Do not use speculative graph relationships as proof of a defect. Confirm dependencies against source.

---

## 5. STAGE 2 — SHARED CONTRACTS FIRST

Before broad refactoring, stabilise the contracts used across scripts.

### Failure codes

- Establish one authoritative failure-code vocabulary.
- Resolve F-01: missing `INPUT_STALE`.
- Preserve expected return shapes and exit codes.
- Verify machine-readable error classification.

### Canonical JSON and digests

- Maintain deterministic canonicalisation.
- Preserve existing digest semantics unless a versioned migration is necessary.
- Ensure object-key ordering is deterministic.
- Reject duplicate JSON keys in all relevant CLI modes.
- Validate schema and size/depth limits where appropriate.
- Protect against malformed or unexpectedly large inputs.

### Paths and ownership

- Define explicit authorised roots for input files, reports, ACL backups, receipts, and generated artifacts.
- Use path-aware containment checks.
- Resolve symlinks safely.
- Handle missing paths and platform-specific behaviour correctly.
- Address race conditions where feasible.
- Do not confuse lexical normalisation with filesystem authorisation.
- Never write, overwrite, or delete outside approved targets.

### Identity and provenance

- Bind producer identity, input digest, freeze ID, MCP endpoint, and child observation consistently.
- Verify observations independently.
- Reject stale or inconsistent evidence.

Keep shared contracts narrowly scoped rather than introducing a large framework.

---

## 6. STAGE 3 — CRITICAL REMEDIATION

### 6.1 `storybook-closure.mjs`

Address all Critical findings, including the reported excessive length of `runClosure`, unsafe HTTP use, and any additional confirmed Critical findings.

Refactor complex functions into cohesive units preserving:

- Gate ordering.
- Adapter contracts.
- Failure codes.
- Abort semantics.
- Cleanup.
- Input identity.
- Receipt production.
- Owned server lifecycle.

For HTTP/SSRF risks:

- Validate permitted URL schemes and hosts.
- Distinguish authorised local targets from prohibited destinations.
- Assess DNS resolution, redirects, private/link-local destinations, and rebinding.
- Use appropriate request timeouts.
- Apply the destination policy consistently across readiness and MCP calls.

Do not break authorised Storybook local-development workflows merely to satisfy a generic rule.

### 6.2 `storybook-coverage.mjs`

The scanner reports 13 Critical findings, including:

- Whole-file complexity threshold.
- `parseValue` cyclomatic complexity.
- Dynamic regular expression construction.
- `normalizeMcpReceipt` length and cyclomatic complexity.
- `validateProducerIdentity` length.
- `validateState` cyclomatic complexity.
- `validateStoryEvidence` length and cyclomatic complexity.
- `validateClosure` length and cyclomatic complexity.
- A reported HTTP header-injection issue near `statement.importClause`.

Investigate and remediate each individual occurrence.

#### Dynamic regular expressions

The `markdownSectionEntries` function constructs a `RegExp` using an escaped heading.

Prefer a simpler bounded parser using line iteration or exact heading comparison if it preserves the intended behaviour.

- Avoid dynamically constructing regex patterns from untrusted values where unnecessary.
- Preserve markdown section semantics.
- Handle CRLF/LF and Unicode correctly.
- Test long and adversarial inputs.
- Apply `u` where compatible.
- Verify scanner findings are actually resolved.

The same source line may have multiple scanner findings. Preserve one ledger row for each occurrence while linking them to the common repair.

#### JSON parser

Review `assertUniqueJsonKeys`, `parseJsonString`, and `parseValue`.

Refactor the parser for readability and controlled complexity without weakening duplicate-key detection.

Prefer a well-tested, bounded implementation.

Validate:

- Nested objects and arrays.
- Escaped string keys.
- Unicode.
- Duplicate decoded keys.
- Numbers and malformed literals.
- Trailing garbage.
- Truncated JSON.
- Excessive nesting and input length.
- Property names that can affect prototypes.

Avoid implementing an incomplete JSON parser merely to eliminate complexity findings.

If a project-compatible, audited parser is already available, evaluate its suitability before introducing a new dependency.

#### MCP receipt and closure validators

Refactor `normalizeMcpReceipt`, `validateProducerIdentity`, `validateState`, `validateStoryEvidence`, and `validateClosure`.

Extract focused validation helpers with stable error contracts.

The extracted helpers must not merely conceal complexity through delegation. Each should have one understandable responsibility.

Preserve:

- Exact successful status requirements.
- Story identity matching.
- Count equality.
- Accessibility results.
- Producer provenance.
- Freeze identity.
- Stale-input rejection.
- Manifest schema enforcement.

Do not change a validator from fail-closed to fail-open.

#### HTTP header-injection scanner finding

The reported location near `const importClause = statement.importClause` is TypeScript AST parsing code, not an obvious HTTP response-header operation.

Perform source-to-sink analysis.

If no HTTP header sink exists, document the scanner rule, inspected data flow, and evidence supporting a false-positive disposition.

Do not add unrelated HTTP sanitisation or alter AST parsing solely to silence this diagnostic.

---

## 7. STAGE 4 — ALL HIGH FINDINGS

### 7.1 Coverage script: 48 High

Address each original scanner item, including:

**Object injection**

- Validate indexed access and property keys.
- Inspect `text[index]`, canonical JSON property access, producer and receipt field lookups, digest-key indexing, and inventory-region indexing.
- Distinguish ordinary bounded array/string access from dangerous object-key assignment.
- Use controlled key sets, Maps, or null-prototype structures where appropriate.
- Protect against prototype manipulation without unnecessary interface changes.

**Regular expressions**

- Inspect whitespace recognition and JSON literal patterns.
- Assess actual regex backtracking complexity.
- Replace unsafe patterns where warranted.
- Preserve valid input recognition.

**Runtime globals**

- Resolve reported `Buffer`, `TextDecoder`, `process`, and `console` diagnostics using the correct Node.js runtime and lint configuration.
- Consider explicit built-in imports where beneficial.
- Verify supported runtime versions.
- Do not add needless polyfills.

**Deterministic object handling**

- Validate stable canonical ordering.
- Avoid relying on insertion order where the persistence or digest contract requires sorted keys.

**Use-before-definition**

- Review `resolveModuleReExport` and `visitSourceFile`.
- Resolve findings by preserving a coherent module dependency structure.
- Avoid changing recursion semantics while reorganising definitions.

**Iterator callbacks**

- Review direct references such as `.filter(nonEmptyString)` and `.map(inventoryRow)`.
- Use explicit callbacks where required without changing argument semantics.

**Filesystem access**

- Restrict dynamic receipt reads and directory enumeration to authorised roots.
- Validate receipt filenames.
- Reject escaping symlinks.
- Use an appropriate ownership and race-resistance strategy.

### 7.2 Worklist script: 3 High

Address all three findings.

#### HIGH-WORKLIST-01 — `mkdirSync`

Location: approximately line 124.

`mkdirSync(path.dirname(filePath), { recursive: true })`

#### HIGH-WORKLIST-02 — `writeFileSync`

Location: approximately line 125.

`writeFileSync(filePath, JSON.stringify(...), 'utf8')`

Required correction:

- Define the legitimate report output root.
- Validate `--out`, `--summary`, and `--source-root` according to their different read/write privileges.
- Prevent traversal and symlink escapes.
- Restrict generated output to authorised destinations unless explicitly permitted by existing policy.
- Consider existing file and directory symlinks, parent-directory races, and safe replacement.
- Prefer safe temporary-file/atomic-replacement semantics where suitable.
- Preserve deterministic JSON output and newline behaviour.
- Avoid partial output claiming successful worklist generation.
- Preserve intended CLI defaults and exit codes.

Do not simply replace `mkdirSync`/`writeFileSync` with `mkdir`/`writeFile` and assume the security issue is fixed.

Do not hard-code a path without verifying repository conventions.

#### HIGH-WORKLIST-03 — `console` undefined

Location: approximately line 197.

`console.error(...)`

The script is Node ESM and already imports `process` from `node:process`.

Resolve the lint/scanner environment mismatch.

- Ensure the script is included in the correct ESLint configuration.
- Use the appropriate Node globals.
- Preserve stderr diagnostics.
- Do not suppress `no-undef` globally.
- Avoid changing error reporting into silent failure.

### 7.3 ESLint configuration

The provided `storybook-coverage-eslint.config.mjs` lists:

- `storybook-coverage.mjs`
- `verify-storybook-docs.mjs`
- `storybook-closure.mjs`

It omits `storybook-coverage-worklist.mjs`.

Add the worklist script to the intended task-scoped rule coverage.

Check configuration ordering, `@eslint/js` recommendations, Node globals, and any inherited overrides.

Ensure the normal package quality path runs this configuration for all intended maintained scripts.

Preserve the existing console policy allowing `warn` and `error` if it remains appropriate.

Confirm effective configuration using actual ESLint commands instead of assuming the config applies.

### 7.4 Closure script: 68 High

Complete every original item, including:

- Dynamic filesystem operations.
- Object-injection warnings.
- Regular-expression safety.
- Missing Node globals.
- Promise executor issues.
- Other error-prone diagnostics.

Preserve each finding in the ledger even when one common code change addresses multiple occurrences.

---

## 8. STAGE 5 — ATOMIC AUDIT FINDINGS

Resolve F-01 through F-16 as first-class requirements.

### P1 — Evidence integrity

**F-01:** Define the missing `INPUT_STALE` failure code.

**F-02:** Correct default export discovery so `export default function X(){}` does not incorrectly emit both `X` and `default`.

**F-03:** Freeze or revalidate all digest-covered root inputs.

**F-04:** Never conceal ACL restoration failures or discard recovery backups prematurely.

**F-05:** Independently observe child provenance rather than copying producer metadata.

**F-06:** Add the required post-build references gate.

**F-07:** Require receipts covering the complete executable final-index story set.

**F-08:** Integrate all audited scripts into normal quality gates and correct worklist provenance/classification gaps.

### P2 — Contract hardening

**F-09:** Add correct `.mts`/`.cts` extensionless module resolution.

**F-10:** Use duplicate-key-aware parsing for CLI JSON inputs.

**F-11:** Require assertion-shaped evidence, not arbitrary matching string literals.

**F-12:** Enforce valid MCP JSON-RPC/SSE envelopes and result structure.

**F-13:** Differentiate permission denials from unrelated I/O probe errors.

**F-14:** Track and terminate owned managed-server process descendants appropriately.

**F-15:** Establish meaningful type-safety coverage for the maintained `.mjs` scripts.

### P3 — Determinism

**F-16:** Sort caller-provided excluded candidates inside the exported worklist builder.

Also ensure consumer/forwarding classifications are based on actual discovery provenance.

Do not invent provenance where it cannot be established.

---

## 9. STAGE 6 — ROOT-CAUSE DEDUPLICATION

Group findings into root-cause clusters:

1. Lint environment and coverage.
2. Dynamic filesystem path ownership.
3. URL/network trust boundaries.
4. JSON parser safety.
5. Regex safety.
6. Object-key/index safety.
7. Complexity and responsibility separation.
8. Export discovery and provenance.
9. Canonical identity and freeze enforcement.
10. MCP protocol and receipt completeness.
11. Child-process ownership.
12. ACL recovery.
13. Deterministic worklist generation.
14. Verification and quality-gate coverage.

For every group:

- Identify all scanner occurrences.
- Identify overlapping audit findings.
- Define the minimum secure change set.
- Identify affected atoms.
- Add or update relevant tests.
- Recheck downstream dependencies.

A root-cause grouping does not eliminate the need to individually account for each reported scanner finding.

---

## 10. STAGE 7 — DEPENDENCY-SAFE IMPLEMENTATION

Use the following work packages.

**WP-0 — Baseline**

- Reconcile all findings.
- Preserve pre-change evidence.
- Confirm current source versions.

**WP-1 — Shared contracts**

- Failure codes.
- JSON validation.
- Input identity.
- Path ownership.
- Producer provenance.

**WP-2 — Closure integrity**

- Freeze and revalidation.
- ACL recovery.
- Post-build references gate.
- Complete receipts.
- Independent child records.

**WP-3 — Source denominator**

- Default and alias exports.
- Module resolution.
- Discovery provenance.
- Deterministic worklist.

**WP-4 — Security boundaries**

- Filesystem access.
- SSRF/HTTP.
- JSON/regex/object injection.
- MCP transport.
- Process-tree ownership.

**WP-5 — Maintainability**

- Complexity reduction.
- Validator decomposition.
- Promise/cancellation corrections.
- Static-analysis compliance.

**WP-6 — Quality gates**

- ESLint coverage.
- Node globals.
- Script type checking.
- Actual-file lint tests.

**WP-7 — Regression and closure verification**

- Security tests.
- Unit tests.
- Build.
- Source/references validation.
- MCP and a11y.
- Storybook BDD.
- Final closure.
- ACL and process cleanup.

These packages express logical sequencing. Reorder or combine closely coupled corrections when the dependency graph demonstrates that doing so is safer.

Do not run the stateful stages without appropriate authorisation and test isolation.

---

## 11. STAGE 8 — VALIDATION MATRIX

Add focused negative and positive tests.

### Parser tests

- Valid nested JSON.
- Duplicate keys including escaped equivalents.
- Malformed literals and trailing content.
- Excessive depth/size.
- Prototype-related keys.
- Unicode edge cases.
- Adversarial long inputs.
- Markdown heading matching without unsafe dynamic regex.

### Filesystem tests

- Legal report destinations.
- Escaping `..` paths.
- Absolute paths outside allowed roots.
- Parent symlinks.
- Output-file symlinks.
- Existing files and atomic replacement.
- Failed creates/writes.
- No partial success after a write failure.
- Owned checkout enforcement.
- Cross-platform path behaviour.

### Discovery tests

- Named and anonymous default exports.
- Aliases.
- Local and forwarded exports.
- `.mts` and `.cts` imports.
- Re-export cycles.
- Identical worklist results under permuted inputs.

### Evidence tests

- Stale root input.
- Incomplete receipt set.
- Forged child provenance.
- Duplicate receipt identifiers.
- Malformed JSON-RPC/SSE responses.
- Missing accessibility outcomes.
- Non-assertive marker text.
- Final-index mismatch.

### Cleanup tests

- ACL restoration failure.
- Backup retention.
- Gate failure plus cleanup failure.
- Cancellation.
- Server parent/child shutdown.
- No termination of unrelated processes.

### Quality-gate tests

- Actual scripts are linted.
- Worklist script receives Node globals.
- Type coverage is genuinely enabled.
- No security rule was disabled to hide failures.
- Original scanner findings are re-evaluated.

Use safe fixtures, mocks, and temporary directories for negative tests.

---

## 12. STAGE 9 — BOUNDED ITERATIVE REVIEW

For each work package:

1. Baseline the relevant findings.
2. Inspect the exact implementation and dependency edges.
3. Make the smallest adequate changes.
4. Run focused tests.
5. Recheck affected graph nodes.
6. Investigate failed checks and adjust.
7. Stop after three substantial remediation/review iterations per package and report unresolved blockers if necessary.

Do not run unbounded loops.

Do not broadly refactor unrelated application code.

Avoid premature extraction of additional modules unless correctness or maintainability clearly benefits.

---

## 13. REQUIRED OUTPUTS

### A. Executive remediation status

Report:

- Original scanner totals.
- Reconciled individual finding counts.
- Fixed and verified.
- Fixed but unverified.
- False positives with evidence.
- Blocked/open.
- Newly introduced findings.

### B. Atomic dependency graph

| Atom | Dependencies | Scanner findings | Audit findings | Contract | Verification |
|---|---|---|---|---|---|

### C. Root-cause remediation ledger

| Root cause | Affected files | Related findings | Remediation | Regression risk |
|---|---|---|---|---|

### D. Full finding traceability

| Original finding ID | Severity | Location | Root cause | Change | Verification | Status |
|---|---|---|---|---|---|---|

Account individually for every scanner finding and all F-01 through F-16 findings.

### E. Implementation evidence

Provide changed files and patch summary, including security-sensitive behaviour changes.

When edits are unavailable, provide applicable patches instead of claiming implementation.

### F. Test and scanner ledger

| Command/check | Executed? | Result | Evidence | Limitations |
|---|---|---|---|---|

Never report unexecuted tests as passed.

### G. Residual risk report

Identify any remaining:

- Security vulnerabilities.
- Unverified scanner findings.
- Recovery risks.
- Integration gaps.
- Portability concerns.
- Contract-breaking changes.

---

## 14. COMPLETION AND STOP RULES

The target is zero unresolved verified Critical and High defects, without introducing new ones.

A scanner count of zero is not sufficient if evidence-integrity or recovery defects remain.

If a scanner finding is a false positive, preserve it in the ledger with direct technical justification and the appropriate approved review disposition.

Stop unsafe actions when:

- Checkout ownership is uncertain.
- An output path escapes authorised boundaries.
- ACL restoration could affect uncontrolled files.
- Process-tree ownership is unclear.
- Live MCP or BDD execution requires unavailable infrastructure.
- Authorisation is missing for a destructive operation.

Do not weaken invariants or fabricate evidence to reach numerical targets.

## FINAL DIRECTIVE

Start with complete baseline reconciliation.

Construct the 31-atom graph and map the reported 136 scanner findings and 16 audit findings onto it.

Repair root causes in dependency order, preserving the existing four-script architecture unless tested changes justify a narrower extraction.

Validate changes with focused tests, then available integration and scanner checks.

Finish with an evidence-based remediation ledger.

Explicitly distinguish:

- Scanner compliance.
- Security correctness.
- Functional correctness.
- Evidence completeness.
- Release readiness.

Never declare the Storybook evidence pipeline trustworthy until its required identity, receipt completeness, recovery, and verification contracts have actually been demonstrated.
