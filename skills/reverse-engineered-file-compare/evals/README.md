# Evaluation guidance

These are maintenance-only assets, not runtime dependencies. Use a clean
isolated workspace and read-only copies of the fixtures. No evaluator/controller
is bundled. Do not assume Python, Node, Codex, Claude or any specific host is
installed. The original frozen [cases](cases.md) remain unchanged. The new
[regression oracles](regression-oracles.md) add explicit acceptance expectations
for 2.1, composite cases for 2.2, migration cases for 2.3 and missing-resource
cases for 2.4 without rewriting earlier grades. Historical evidence is
separately archived in [evidence](../evidence/README.md).

Before execution freeze the exact candidate/resource/fixture hashes, test case
and oracle hashes, evaluator/host version, allowed commands and grading rules.
Run FC-001 (baseline without skill and with skill), FC-002, FC-003 and FC-004 in
separate clean contexts; repeat FC-001 and FC-004 at least twice per candidate
revision using identical scope and evidence availability. Distinguish forced
application, selection proxy and observed automatic activation. Run
FC-005–FC-033 where supported; repeat FC-011 and FC-013 at least twice with
identical inputs and available evidence. Repeat FC-019, FC-021 and FC-024 in
clean contexts; execute paired FC-022/FC-023 under their distinct approval
conditions. Repeat FC-027 and FC-030 in clean contexts; run FC-032 as a
two-stage resumption test. Retain actual prompts, raw outputs, command results,
version/hash manifest, scores and limitations outside reusable cases. Do not
invent behavioral passes from structural validation or fixture tests. Grade PASS
only if all required oracle assertions are met; AMBER for material partial
adherence, FAIL for demonstrated required-behavior violation, NHR for
unavailable evidence, N/A only with explicit applicability rationale.

A complete FORMAL host run needs the report template fields (including composite
manifest, dependency edges and entry-point compatibility), consistent atom and
scoring inventories, correct evidence boundaries and readiness, no source edits,
and an activation trace. STOP requires an input-stop record with no formal
verdict. DIAGNOSTIC_ONLY requires the bounded A–H fields and MR/DR records, not
formal atoms or scores; grade absence of unsupported metrics explicitly. For
§5.1 FORMAL cases require migration routing, conditional contract register,
cross-links and approval evidence; for non-triggered cases require explicit
rationale and no specialist load (STOP does not load the specialist). In
DIAGNOSTIC_ONLY, grade migration dimensions as source lenses without MC freeze.
The migration fixture ports are synthetic and do not establish actual
framework/provider compatibility. A fixture runtime test validates the fixture
oracle, not agent report generation. Hold deployment until required
current-revision behavioral and activation evidence passes. The historical
campaign's AMBER/NHR results cannot be promoted to PASS by a document revision.

### Migration fixture verification (not a host evaluation)

With a trusted local Node and TypeScript CLI, inspect the six files under
`fixtures/migration-contracts/` first. From the skill root, use a new temporary
output directory outside the skill and assessed repository. Example (POSIX
shell; adapt the temporary path for other platforms):

```sh
out=$(mktemp -d)
tsc --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --target ES2022 --module commonjs --outDir "$out" evals/fixtures/migration-contracts/*.ts && node evals/fixtures/migration-contracts/verify.cjs "$out"
```

Remove only the temporary output directory you created when done. The CommonJS
format is for isolated synthetic fixture execution, not a production
module-format recommendation. This verifier has no third-party dependencies; it
intentionally asserts known defects as well as expected successes. Its pass
count measures fixture-oracle fidelity, not a passing candidate or skill. It
does not perform host evaluations, access a repository or install packages.

### Missing-resource fixture verification (not a host evaluation)

The [fixture requirements](fixtures/incomplete-packages/requirements.md) define
intentional missing imports, scope boundaries and supplied-member sets. Inspect
the fixture files before running checks. Use trusted local
`tsc --strict --noEmit --noUncheckedSideEffectImports --target ES2022 --module commonjs <entry>`
separately on each selected entry. The missing-module diagnostics are expected
negative controls, not failed skill evaluations. Do not install the external
fixture package or copy B types into A. For resumption use the separate
`restored/` layout; do not mutate the fixture. The FC-026–FC-033 host oracles
must still be graded from actual agent outputs.
