Classification: **True duplicate**

Evidence:

| Skill | Activation | Outcome | Specialization |
|---|---|---|---|
| `commit-message-writer` | Writing git commit messages | A commit message | None stated |
| `conventional-commit-writer` | Writing git commit messages in Conventional Commits format | A commit message in that format | Format only; explicitly no additional checklist, tooling, or specialization |

The second skill’s activation is a strict subset of the first, and its only distinction is output formatting. Under the applicable audit rule, a format variant of the broader skill’s outcome is not material specialization.

Recommendation: combine them, retaining `commit-message-writer` as the survivor. Its instructions should preserve the ability to produce Conventional Commits format when requested. No separate boundary is needed.

QAQ/RMI validation:

- Positive: “Write a Conventional Commits message for this change.” Both skills would activate, produce the same deliverable, and have no distinct responsibilities.
- Near-miss: “Write a commit message, but do not use Conventional Commits format.” This maps only to the broader skill.

No credential, authentication, configuration, or session files were read. No files were modified.

```text
skill-duplication-audit result.
Mode: explicit pairs
Skills analyzed: 2
Pairs evaluated: 1 (excluded: NONE)
True duplicates: 1 — commit-message-writer ↔ conventional-commit-writer
Partial overlaps: 0 — NONE
Complementary pairs: 0 — NONE
False positives: 0 — NONE
Needs Human Review: 0 (classified: 0; merge/group holds: 0) — NONE
Boundary docs needed: 0 — NONE
Merge clusters: 1 — {commit-message-writer survivor, conventional-commit-writer member}
Preservation review: preserve Conventional Commits output when requested; no conflicts found
Contradictions / evidence gaps: NONE
User decision: NONE
Recommendation: combine; retain commit-message-writer and fold in the Conventional Commits formatting behavior
```
