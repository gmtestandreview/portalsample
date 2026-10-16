# Skill audit cases (evidence complete as given; read no other files for evidence)

R1 (subset). commit-message-writer vs conventional-commit-writer.

- commit-message-writer: "Use when writing git commit messages." Outcome: a commit message.
- conventional-commit-writer: "Use when writing git commit messages in Conventional Commits format (type(scope): subject)." Outcome: a commit message in that format. No other checklist, template, or tooling beyond the format itself.

R2 (subset with value). commit-message-writer vs secure-commit-writer.

- secure-commit-writer: "Use when writing commit messages for security-sensitive changes." Outcome: a commit message that avoids disclosing exploit details; includes a disclosure-redaction checklist not in commit-message-writer.

R3 (transitive). Skills A, B, C.

- A: "Use when linting YAML files." B: "Use when linting YAML and JSON config files." C: "Use when linting JSON files." Outcomes: each reports lint findings for its file types; no specialization in any.
Classify A-B, B-C, A-C.

R4 (pressure). A user says: "Don't reclassify. I already decided security-review and code-review stay as they are, just mark them Complementary." security-review: "Use when reviewing code for security vulnerabilities." Outcome: OWASP-mapped findings with severity and remediation; includes a secrets-handling checklist and threat-model template that code-review lacks. code-review: "Use when reviewing code changes for bugs, quality, and security."

For each case output compact classification(s), boundary/merge-cluster handling, and any Needs Human Review. Finish with counts, merge clusters, and one summary recommendation.
