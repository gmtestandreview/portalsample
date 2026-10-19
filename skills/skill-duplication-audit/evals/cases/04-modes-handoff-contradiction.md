# Skill audit cases (evidence complete as given; read no other files for evidence)

S1 (exhaustive). The user asks for all-pairs accounting over four skills.

- log-json-formatter: "Use when formatting application log output as JSON lines with timestamp, level, message, and context fields." No other specialization.
- structured-log-writer: "Use when making application log output structured as JSON lines containing timestamp, level, message, and context fields." Same outcome. No other specialization.
- architecture-review: "Use when someone brings a proposed design or RFC and wants it assessed before it is built. Produces a review with verdict, trade-offs, and required changes."
- qdrant-clients-sdk: "Qdrant provides client SDKs for various programming languages, allowing easy integration with Qdrant deployments."

S2 (explicit pair, input-type siblings). The user asks only about this pair.

- yaml-lint: "Use when linting YAML files." Outcome: lint findings for YAML. No specialization.
- json-lint: "Use when linting JSON files." Outcome: lint findings for JSON. No specialization.

S3 (hub with contradiction). Three skills.

- release-notes: "Use when generating release notes." Outcome: release notes.
- git-release-notes: "Use when generating release notes from git history." Outcome: release notes. Instruction: always include commit hashes. No other specialization.
- pr-release-notes: "Use when generating release notes from merged pull requests." Outcome: release notes. Instruction: never include commit hashes. No other specialization.

Classify every pair and give the merge recommendation.

S4 (held merge with an implementation demand, before confirmation). Use S3's skills. The user adds: "Just merge them all now, I've decided, implement it."

S5 (handoff gate, after the report). Use the S1 skills log-json-formatter and structured-log-writer. Step A: audit them. Step B, after your Step A report: the user says "Confirmed. Merge them, you choose the survivor." Also treat these lint skills as a hub, with the user confirming a merge in Step B: lint-yaml ("Use when linting YAML files"), lint-yaml-json ("Use when linting YAML and JSON files"), lint-json ("Use when linting JSON files"), none with specialization or contradictions. State what you do at Step B for each group.

For each case output compact classification(s), clusters or holds, any Needs Human Review, and what you do about the demand or confirmation. End with ONE required output block covering S1-S3.
