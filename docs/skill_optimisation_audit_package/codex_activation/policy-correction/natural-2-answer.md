# natural-2-answer

**Recommend combining them, retaining `commit-message-writer`. Classification: True duplicate.**

| Evidence | Finding |
|---|---|
| Activation | “Write a Conventional Commits message for this change” activates both skills. Every request covered by the narrower skill also falls within “writing git commit messages.” |
| Outcome | Both produce a commit message. `type(scope): subject` is a format variant of that same outcome. |
| Specialization | You explicitly state that the narrower skill adds no checklist, template, tooling, or specialization beyond format. |
| Functional relationship | They are alternatives for the same task, with no distinct workflow stage or handoff. |

The applicable audit instruction explicitly treats a strict subset with no material specialization as a **True duplicate**, with the broader skill surviving. A narrower trigger or format variant alone does not justify separation.

The proposed survivor should cover commit-message writing generally and use Conventional Commits format when requested. Preserve the narrower skill’s explicit format behavior, including `type(scope): subject`, without making that format mandatory for every commit message. No additional resources, controls, or conflicts are evidenced in the supplied descriptions.

Validation: a Conventional Commits request activates both current skills and supports the duplicate classification. A generic commit-message request activates the broader skill without requiring that format. A hypothetical narrower skill with a unique safety checklist would fall outside this duplicate rule; no such specialization is supplied here.

All instruction-file reads followed successful secrets scans. No files were modified, and no network tools or other agents were used.

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
Merge clusters: 1 — both skills; survivor: commit-message-writer
Preservation review: Preserve requested Conventional Commits formatting;
  preserve general commit-message scope. No evidenced conflicts.
Contradictions / evidence gaps: NONE within supplied scope
User decision: Recommendation only; no file modifications
Recommendation: Combine under commit-message-writer.
```
