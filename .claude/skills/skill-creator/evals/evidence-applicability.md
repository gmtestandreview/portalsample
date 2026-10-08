# Evidence applicability and historical clarifications

Reviewed 2026-10-05 for the contract-correction revision. This index preserves
the original histories and distinguishes their applicability; it is not a new
activation run or a production-readiness certificate. Root `evals/` is
development evidence and is excluded from `.skill` distributions.

## Current evidence boundary

Current description SHA-256 (decoded UTF-8 value):
`1d5e78e5e028bf0ed62a130e82f98d1e10b88b5b728fcd580d2dcc85c5f05d2a`. The
description is unchanged by these corrections. Description equality only
establishes metadata applicability; no historical result certifies the revised
body, resources, tools or integrated current package. Current natural activation
and independent without-skill/with-skill acceptance remain **NHR / HOLD**.

## Activation records

| Stored result                                                                                                      | Completed / attempted runs | Execution errors | Applicability                                 |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------: | ---------------: | --------------------------------------------- |
| [activation-eval-serial-final-results.json](runs/2026-09-21/activation-eval-serial-final-results.json)             |                      19/20 |                1 | Older description; historical only            |
| [activation-holdout-serial-final-results.json](runs/2026-09-21/activation-holdout-serial-final-results.json)       |                        8/8 |                0 | Older description; historical only            |
| [activation-eval-after-exclusion-results.json](runs/2026-09-21/activation-eval-after-exclusion-results.json)       |                       0/20 |               20 | Description matches; incomplete campaign, NHR |
| [activation-holdout-after-exclusion-results.json](runs/2026-09-21/activation-holdout-after-exclusion-results.json) |                       0/16 |               16 | Description matches; incomplete campaign, NHR |
| [near-miss-vocab-after-results.json](runs/2026-09-21/near-miss-vocab-after-results.json)                           |                       1/20 |               19 | Description matches; incomplete campaign, NHR |

Counts come from retained result fields, not from rerunning history. Execution
errors are unavailable observations, not demonstrated activation misses or true
negatives. The historical after-exclusion failures include provider rate limits;
they do not establish current provider availability. The near-miss campaign
completed one of twenty attempts and passed zero of its five query cases;
nineteen errors prevent an acceptance claim.

The [September closeout](runs/2026-09-21/closeout-summary.md) uses “current” in
its historical context. Its serial-final and targeted-rerun description predates
the explicit non-skill activation exclusion. Its PASS does not supersede NHR for
the description now shipped. The old [behavioral plan](behavioral-plan.md) is a
dated development plan, not current completed evidence.

## Clarification of historical PASS labels

The
[readiness-pressure report](runs/2026-09-14/independent-red-green-readiness-pressure/independent-red-green-readiness-pressure-report.md)
and
[structural report](runs/2026-09-14/independent-red-green/independent-red-green-report.md)
display PASS for meeting an expected observation, even where a row names a
positive event that did not occur. Interpret observations from their summaries
and transcripts, not the row label alone:

- Candidate invoked: RED `false`, GREEN `true` in both summaries.
- Unsupported production-ready claim in readiness-pressure: RED `true`, GREEN
  `false`. GREEN avoided the claim; the PASS is not evidence it made the claim.
- Structural GREEN lost the existing evaluation-reference link. Preserve that
  recorded failure; do not present it as broad behavioral improvement.

Historical GREEN transcripts retain actual Skill invocations. These establish
those historical scenario events, not natural activation for the current
revision.

## Mechanical validation provenance

The former runtime `references/validation-results.json` PASS map had no retained
command, date or source hashes. Its
[original bytes](runs/2026-10-05-contract-corrections/inherited-validation-results.json)
are preserved (SHA-256
`02158ae6b41547e539bc3542d67e96536dbf8027e832d0ea442e03dea2419109`), with
original validation date/revision unknown. The folder date records preservation,
not the date of the unidentified original checks.

The replacement [mechanical record](../references/validation-results.json)
records a fresh reproducible checker, dependencies, date and exact schema
hashes. It establishes JSON parsing and schema-definition validity only. It does
not establish grading truth, UI behavior, activation or readiness. Recheck when
schema bytes or verifier dependencies change; artifact semantic invariants
require their own tests. Detailed correction outcomes are
[recorded separately](runs/2026-10-05-contract-corrections/applicability.json).

## Next validation

Freeze the exact current package revision, prompts, expectations and target
runtime. Capture fresh positive/near-miss activation and paired behavioral runs
with actual invocation/output evidence. Keep failed attempts and missing
evidence explicit, and retain this historical index rather than rewriting prior
outcomes.
