# Test Case 1 — historical v2.1 application observation

Date: 2026-11-26. Source: user-declared A/B roles and the completed interactive
comparison, followed by separately authorised source remediation. Not an
independent host evaluation or a current v2.2 PASS. Project source and reports
are not copied into this portable package. Identifiers below refer to externally
supplied artifacts, not required bundled paths.

| External artifact                                      | SHA-256                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `GoogleAnalytics.tsx`                                  | `dad3656c083d72965201fe431a54b29fe5fbd85e8068ea17d69272201875c479` |
| `re_GoogleAnalytics.ts`                                | `f65da5ef470b0342f18887a7f5b0ad8eb3da8eeaeddf75554dda1e4937e1863a` |
| `re_GoogleAnalyticsTracker.tsx`                        | `dde6f98fbadd20cc2ef2b3b1905fd8437547ae12a4fc4cc359517acc31a7cfa6` |
| `test-case-1-google-analytics-comparison.md`           | `e21adcc5b0dd5b43cefebddeaa799b0a237d5c3c6a529ed4f25124c42a87e2c2` |
| `google-analytics-remediated.zip`                      | `08939ba5267e83f2175a08d51deb68860693a723e33a7447ba52477d007d2819` |
| `google-analytics-remediated/verification/results.txt` | `c84e00206740364ec19056b4ade094bf6f75b8139a45d56dd79591333569fd50` |
| `reverse-engineered-file-compare-optimized-v2.1.zip`   | `72c1575fdc322b5ac3e7f21042a379039da62ead5bb2e1bac0b9c712894467ff` |

## Observed evidence and limitations

- A: one `GoogleAnalytics.tsx`; B: `re_GoogleAnalytics.ts` plus
  `re_GoogleAnalyticsTracker.tsx`. User declared no C. This is 1:2 at the
  assessment revision. The v2.1 input contract said one source file per side;
  the actual assessment manually treated the two B members as one
  implementation.
- Source inspection found missing route-aware automatic page views and ignored
  `sendPageView`; it separately identified PII batching and removal of raw
  collection/logging as beneficial but behaviour-changing. It identified unknown
  environment/SDK/consumer contracts and did not infer historical origin.
- The report recorded 26 A atoms, 4 confirmed declarations, 6 missing, 2
  divergent, 14 unverified; shared M=93, BLOCKED. These are historical reported
  values, not a frozen general-purpose oracle or an independent replication.
- After the user explicitly approved remediation, a separate implementation
  added a compatibility facade and restored route tracking while retaining the
  utilities. That changed the B manifest to three source files. The isolated
  verification artifact records strict TypeScript 5.8.3 compilation with local
  declarations and 18 passing mock-based contract tests. Real React/SDK,
  application integration, project lint/coverage and privacy remain unverified.
  This is implementation evidence for a different candidate revision, not proof
  of the skill's behavioural adherence or production readiness.

## Corrective requirements for v2.2

Define side membership, explicit internal/external edges and public entry-point
contracts before mapping; freeze a unique A inventory independent of B layout;
score A and B once per logical implementation; reconcile all member paths in
reports and acceptance gates. Keep historical C optional and evidence-specific.
Synthetic FC-011–FC-017 cover generalisation without redistributing project
code. Independent repeatability and automatic host activation are NHR.
