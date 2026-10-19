# natural-1-answer

**Combine them.** Classify `commit-message-writer` and `conventional-commit-writer` as **True duplicate**, with `commit-message-writer` as the proposed survivor.

| Evidence | Assessment |
|---|---|
| Activation | “Write a git commit message in Conventional Commits format” activates both. Every request covered by the narrower skill also fits the broader skill. |
| Outcome | Both produce a commit message; the narrower one constrains its format. |
| Specialization | You explicitly exclude any additional checklist, template, tooling, or specialization. The applicable audit rules state that a format variant alone is not material specialization. |
| Functional relationship | They are alternatives for the same task and workflow stage. |

The audit’s **strict-subset rule** therefore applies: retain the broad skill and incorporate the narrower format instruction.

Preserve the ability to produce `type(scope): subject` when Conventional Commits is requested. Preserve the broader ability to write other commit-message formats. No other unique material or conflicting guidance appears in the supplied evidence.

Validation: a Conventional Commits request maps to the survivor’s format option; an unrestricted commit-message request maps to its general behavior. A near-miss would be a narrower skill with a distinct release-validation checklist or safety control—that would warrant **Partial overlap**, but your evidence expressly excludes it.

No files were modified. Each instruction file read was first scanned successfully with `sonar analyze secrets`.

```text
skill-duplication-audit result.
Mode: explicit pairs
Skills analyzed: 2
Pairs evaluated: 1 (excluded: NONE)
True duplicates: 1 — commit-message-writer / conventional-commit-writer
Partial overlaps: 0 — NONE
Complementary pairs: 0 — NONE
False positives: 0 — NONE
Needs Human Review: 0 (classified: 0; merge/group holds: 0) — NONE
Boundary docs needed: 0 — NONE
Merge clusters: 1 — {commit-message-writer, conventional-commit-writer};
  survivor: commit-message-writer
Preservation review: Preserve general commit-message scope and the
  Conventional Commits format option; no supplied conflicts.
Contradictions / evidence gaps: NONE within supplied evidence
User decision: Recommendation only; no file modifications.
Recommendation: Combine into commit-message-writer.
```
