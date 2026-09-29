# CodeQL and GitHub SARIF

Load this reference when generating, validating, interpreting, or uploading SARIF for GitHub code scanning.

## Keep three authorities separate

1. **OASIS SARIF 2.1.0 + Errata 01** defines SARIF syntax and semantics.
2. **GitHub SARIF support** defines the SARIF 2.1.0 subset/properties and ingestion limits used by code scanning.
3. **The analysis producer** (CodeQL or a third-party tool) determines which supported properties it emits.

A schema-valid SARIF file can still be rejected by GitHub. Conversely, GitHub may ignore/truncate unsupported or excess information without changing the OASIS standard.

## OASIS conformance baseline

A top-level `sarifLog` must contain `version` with value `"2.1.0"` and `runs`. `$schema` is optional; when present it must identify a schema for the same SARIF version.

Use the OASIS Errata 01 JSON schema when structural conformance is in question. Do not treat schema validation as proof of GitHub compatibility.

## GitHub compatibility

GitHub code scanning accepts SARIF 2.1.0 and uses a documented subset of SARIF properties. Required supported properties must have explicit non-empty values.

For third-party SARIF, validate both:

- SARIF structure/conformance; and
- GitHub code-scanning compatibility/supported properties.

CodeQL-generated SARIF is less likely to be syntactically invalid; do not assume that makes every upload acceptable.

## Current GitHub ingestion limits

Treat these as GitHub service limits and verify the current SARIF-support page before encoding them into external automation.

| SARIF data | Hard maximum | Stored/displayed subset |
| --- | ---: | ---: |
| Runs per file | 20 | no separate truncation |
| Results per run | 25,000 | top 5,000 |
| Rules per run | 25,000 | no separate truncation |
| Tool extensions per run | 100 | no separate truncation |
| Thread-flow locations per result | 10,000 | top 1,000 |
| Locations per result | 1,000 | 100 |
| Tags per rule | 20 | 10 |
| Repository alert limit | 1,000,000 | no separate truncation |

Each gzip-compressed SARIF upload must be at most 10 MB.

GitHub distinguishes soft/display limits from hard acceptance limits. Do not describe every limit exceedance as a rejected upload: some excess data is truncated/prioritized, while hard-limit violations are rejected.

## Categories, correlation, and fingerprints

Use a stable `category` when multiple analyses for the same commit need distinct result sets. When a directory is uploaded, each SARIF file needs a unique `runAutomationDetails.id`.

If `partialFingerprints` are absent, `github/codeql-action/upload-sarif` can calculate them when the repository contains the SARIF file and analyzed source. This is GitHub upload behavior, not an OASIS requirement.

Unstable rule names or `artifactLocation.uri` values can create ever-growing sets of apparently unique alerts. Avoid temporary paths, commit hashes, image SHAs, or other nondeterministic identifiers in alert identity.

## Failure-specific diagnosis

### Missing token

Error family: a GitHub token is required or the authentication method lacks permission.

For direct/API-style authentication, current GitHub guidance distinguishes:

- fine-grained PAT: repository `write`;
- classic PAT: `security_events` for private/internal repositories, or `public_repo` for public repositories;
- GitHub App: repository `security_events`.

For GitHub Actions, prefer `GITHUB_TOKEN` with least-privilege workflow permissions appropriate to the upload. Never print or embed a token.

### Invalid SARIF

If GitHub cannot parse the file:

1. inspect the upload/workflow log;
2. validate the file;
3. compare it with GitHub's supported SARIF format/properties;
4. correct the producer or file;
5. retry after the cause is understood.

Do not respond to a syntax error by changing repository permissions.

### Results exceed limits

Identify the exact object/limit from the error before changing analysis.

For soft-limit warnings, GitHub may retain/display only prioritized values; a configuration change may not be required.

For hard-limit failures, reduce the responsible dimension. Examples include reducing noisy queries/results, splitting runs/rules into separately categorized uploads where GitHub recommends it, or reducing dataflow paths. Do not arbitrarily split identical noisy results merely to bypass limits.

If CodeQL itself produces an extension-limit error that GitHub says CodeQL should not generate, preserve evidence and escalate to GitHub Support rather than inventing a workaround.

For repository alert-limit failures, investigate nondeterministic result identity. If all analysis uploads are blocked by the repository alert limit, GitHub documents a support-assisted recovery after fixing the offending configuration; there is no self-service alert deletion path for that condition.

### File too large

GitHub rejects SARIF uploads larger than 10 MB after gzip compression.

First determine whether the file was gzip-compressed and whether the compressed file remains over 10 MB. If still too large, reduce analysis output based on evidence: exclude genuinely lower-value analyzed code where appropriate, avoid redundant build variants, reduce unnecessary query volume/noisy queries, or omit excessive dataflow paths.

Do not indiscriminately exclude production code or security queries solely to make an upload fit.

### GitHub Code Security disabled

For private/internal repositories, CodeQL SARIF upload can fail when GitHub Code Security is disabled or blocked by policy. Public repositories have Code Security enabled by default.

Treat this as repository eligibility/policy, not SARIF syntax. Do not tell the user to rewrite a valid SARIF file to solve it.

### CodeQL default setup enabled

GitHub blocks uploads of **CodeQL-generated** SARIF from the CodeQL Action, CLI, or API while CodeQL default setup is enabled. This restriction is specific to CodeQL results.

Present the actual configuration choice:

- keep default setup and disable the competing CodeQL SARIF upload; or
- intentionally disable default CodeQL setup and use the advanced/external upload path.

Do not silently disable default setup merely to make an upload succeed. Preserve rollback/configuration context because switching setup affects security configuration.

## Validation sequence

When a SARIF upload fails:

1. capture the exact error and upload method;
2. identify whether results came from CodeQL or a third-party tool;
3. check authentication/permissions;
4. check repository eligibility and CodeQL default-setup conflict where applicable;
5. validate SARIF syntax/conformance if indicated;
6. check GitHub-supported properties;
7. check the specific size/object limit named by GitHub;
8. verify repository/ref/commit/category identity;
9. apply the smallest causal correction;
10. retry and confirm ingestion.

Do not collapse authentication, syntax, eligibility, setup conflict, size, and object-limit failures into one generic “SARIF upload failed” remedy.

## Security

SARIF can contain repository paths, snippets, messages, code flows, and analysis metadata. Treat it as potentially sensitive build output. Do not publish or transmit it outside the intended destination without authorization.
