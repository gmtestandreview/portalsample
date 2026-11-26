# Historical RFQ final test — v2.3

User-confirmed A = `requestForQuote.zip` (13 supplied files), B =
`requestForQuote(1).zip` (20 supplied files), C unavailable. A's missing local
`./types` was imported in four source members; the original report withheld all
formal parity and engineering metrics, noted a known submission rejection
regression and classified adoption BLOCKED as a bounded diagnostic. The user
authorised only supported source assessment, not a replacement of A's
definitions with B's. No RFQ application tests were executed in that assessment;
source parser inspection did not establish project type safety.

The v2.4 maintenance review independently re-inspected the four A import/use
sites: `instrumentAndRequest.tsx` lines 9,43; `organisationAndContact.tsx` lines
5,26; `requestForQuoteSummary.tsx` lines 8,11; `viewRequestForQuoteSummary.tsx`
lines 5,20. Each supplied imported name is used in a type annotation; imports
are not explicitly `import type`. This supports bounded type-contract
diagnostics, not proof of the missing module's contents, emit semantics or
absence of side effects. The absent A type definition and unresolved project
configuration still block formal scoring. The three-branch rule in §5.2
generalises this situation; FC-026–FC-033 are synthetic maintenance oracles, not
an RFQ rerun.

## Artifact locators and hashes

Not bundled; locators are historical evidence, not runtime dependencies.

| Artifact                                             | SHA-256                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| `requestForQuote.zip`                                | `2e68a163cedc8f9a1b02de18fd2f828377f9c25029b981a863c0be316d9f77f5` |
| `requestForQuote(1).zip`                             | `ee2c018dee5e30799e2f295f96a29ae54881c4fc905922f3eb22033d8514ee08` |
| `rfq-final-test-v2.3-source-assessment.md`           | `ee18a7f38e1e0a0254aca9209d45fa23373ef358f2ffab469dac97860c6e29d1` |
| `reverse-engineered-file-compare-optimized-v2.3.zip` | `3473e97c21bdd87674f56fe84cb79aecd0cd1268aad9b8a23734c971c20a20a2` |
