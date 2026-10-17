# Skill pairs to audit (evidence is complete as given; do not read any other files for evidence)

P1. architecture-review vs architecture-design

- architecture-review: "Use when someone brings a proposed design, architecture change, RFC, or significant PR-level structural decision and wants it assessed before it is built. Produces an evidence-grounded review: verdict, trade-offs, required changes, rollback. Not for mapping a whole unfamiliar system (architecture-audit), producing a design from scratch (architecture-design), or capacity questions (scalability-review)."
- architecture-design: "Use when producing an architecture or technical design for a new feature, capability, or system from requirements — component boundaries, data ownership, interfaces, trade-offs and validation. Follows brainstorming. Not for reviewing someone else's design (architecture-review), mapping an existing system (architecture-audit), or capacity planning (scalability-review)."

P2. systematic-debugging vs five-whys

- systematic-debugging: "Use when diagnosing and fixing software bugs, failing or flaky tests, regressions, crashes, incorrect outputs, integration failures, or other unexpected program behavior when the cause is not already established." Outcome: a verified root-cause fix via a phased investigation.
- five-whys: "Root cause analysis using the Five Whys technique. Use when a bug persists despite surface fixes, a failure recurs, or a process keeps breaking. Ensures the fix targets the root, not the symptom." Outcome: a causal chain to a root cause, including for non-code process failures.

P3. test-driven-development vs qdrant-clients-sdk

- test-driven-development: "Use when implementing or changing observable software behavior (new feature, bug fix, refactor) where automated tests can verify the change. Enforces RED-GREEN-REFACTOR."
- qdrant-clients-sdk: "Qdrant provides client SDKs for various programming languages, allowing easy integration with Qdrant deployments." Outcome: guidance for integrating the Qdrant client SDK.

P4. log-json-formatter vs structured-log-writer (synthetic)

- log-json-formatter: "Use when formatting application log output as JSON lines with timestamp, level, message, and context fields." Outcome: app logs emitted as JSON lines with those fields. No other specialization.
- structured-log-writer: "Use when making application log output structured as JSON lines containing timestamp, level, message, and context fields." Outcome: app logs emitted as JSON lines with those fields. No other specialization.

P5. report-builder vs data-exporter (synthetic, partial evidence)

- report-builder: name only. Activation condition and outcome are NOT available.
- data-exporter: "Use when exporting query results to CSV."

P6. log-json-formatter vs architecture-review

- Use the descriptions given above for each.

For each pair output exactly one line: `Pn | classification | one-sentence reason`. Classification must be one of: True duplicate, Partial overlap, Complementary, False positive, Needs Human Review.
Then, for any Partial overlap, give one boundary sentence plus one A-side and one B-side validation request.
Finish with counts per classification and one summary recommendation. Be compact.
