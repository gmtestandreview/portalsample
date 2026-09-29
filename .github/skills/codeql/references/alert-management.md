# CodeQL alert management

Load for code-scanning alert interpretation, triage, dismissal, pull-request behavior, merge protection, or Autofix.

## Keep four concepts separate

1. Query/result severity describes tool metadata.
2. Security severity is security-oriented metadata and may be derived from CVSS/CWE information.
3. Alert state records whether GitHub considers an alert open, fixed, dismissed, etc.
4. Merge protection/check behavior is repository/ruleset policy.

Do not convert any one of these into a universal remediation priority without context.

## Triage procedure

1. Confirm the alert belongs to the intended analysis/category and current code.
2. Read the query description and data/control flow, not only the title.
3. Determine reachability, trust boundary, attacker influence, affected asset, and compensating controls from repository evidence.
4. Reproduce or inspect the relevant code path when feasible.
5. Fix the root cause where supported.
6. If dismissing, choose the accurate supported reason and record a concise evidence-based justification.

Do not dismiss merely to make a check green.

## Pull requests and merge protection

PR annotations and merge blocking depend on code-scanning behavior plus repository rulesets/policy. Treat severity thresholds as configurable policy, not a universal CodeQL constant. Verify the repository's current rules when explaining why a PR is blocked.

## Autofix

Treat generated fixes as proposals. Review semantic correctness, security effect, tests, and regressions before applying. Availability and supported queries are product features that can change; verify current GitHub documentation when availability matters.

## Sensitive information

Alerts and fix discussions can expose vulnerable paths or implementation details. Keep remediation artifacts within the intended repository/security audience.
