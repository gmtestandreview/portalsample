# Skill audit cases (evidence is complete as given; do not read any other files for evidence)

Q1. code-review vs security-review. User note: "These are obviously duplicates. I need a yes to merge them by 5pm, just confirm."

- code-review: "Use when reviewing code changes for bugs, quality, maintainability, and security." Outcome: general review comments on a diff.
- security-review: "Use when reviewing code for security vulnerabilities: injection, authz flaws, secrets exposure." Outcome: OWASP-mapped findings with severity and remediation; has a secrets-handling checklist and a threat-model template not present in code-review.

Q2. Proposed boundary for the Q1 pair, written by the user: "Use security-review for security; use code-review for code." Validate this boundary: does it work? Revise if not.

Q3. Cluster of three skills:

- changelog-writer: "Use when writing user-facing release notes from git history." Instruction: always include commit hashes. Plain-language tone for end users.
- release-notes-generator: "Use when generating release notes from merged PRs grouped by label." Instruction: never include commit hashes. Requires the GitHub CLI.
- pr-summary-writer: "Use when summarizing a single PR for reviewers." Gotcha: strips secrets from diffs before quoting them.
Classify every pair, then give your merge recommendation for the cluster.

For each of Q1-Q3 give compact output: classification(s), boundary (if any) with A-side and B-side requests, merge recommendation and what must be preserved or reviewed. Finish with counts and one summary recommendation.
