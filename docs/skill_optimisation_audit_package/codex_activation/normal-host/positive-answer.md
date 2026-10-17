**Combine them. Classification: True duplicate.** Retain `commit-message-writer` as the survivor and incorporate the Conventional Commits format requirement.

| Evidence | `commit-message-writer` (A) | `conventional-commit-writer` (B) |
|---|---|---|
| Activation | Writing git commit messages | Writing git commit messages in Conventional Commits format |
| Outcome | A commit message | A commit message using `type(scope): subject` |
| Material specialization | None stated | Explicitly none beyond the format |

Every request activating B also activates A. Both produce the same material deliverable at the same workflow stage; neither supplies a distinct responsibility or handoff.

The applicable [audit rule](C:/Users/gregm/.codex/skills/skill-duplication-audit/SKILL.md) explicitly treats a narrower trigger or format variant as insufficient specialization. Its strict-subset rule classifies this case as **True duplicate**, with the broader skill surviving. The [validation cases](C:/Users/gregm/.codex/skills/skill-duplication-audit/references/validation-cases.md) confirm that interpretation.

Proposed survivor behavior:

> Use `commit-message-writer` when writing git commit messages. Produce the requested format, including `type(scope): subject` when Conventional Commits is requested.

Preserve the broad activation condition, the commit-message deliverable, and B’s explicit formatting requirement. Preserve the ability to write messages in other requested formats; combining them should not make Conventional Commits mandatory for every request. No additional checklists, domain knowledge, gotchas, safety controls, tests, references, scripts, assets, or templates were supplied for preservation. No conflicting guidance was supplied.

Validation of the recommendation:

- **Positive:** “Write a Conventional Commits message for this change” activates both current descriptions. The strict-subset rule directs consolidation; the survivor must produce the specified format.
- **Routing near-miss:** “Write a free-form commit message” activates A alone and remains supported by the survivor.
- **Classification near-miss, hypothetical:** If B required a distinct safety checklist or material deliverable, the strict-subset duplicate rule would no longer apply; that would support partial overlap. The supplied description explicitly excludes such specialization.

This assessment uses only the supplied descriptions and applicable audit instructions. No files were modified. An additional verification instruction file remained unread after its secret scan failed because Sonar reported it was unauthenticated.

```text
skill-duplication-audit result.
Mode: explicit pairs
Skills analyzed: 2
Pairs evaluated: 1 (excluded: NONE)
True duplicates: 1 — A–B
Partial overlaps: 0 — NONE
Complementary pairs: 0 — NONE
False positives: 0 — NONE
Needs Human Review: 0 (classified: 0; merge/group holds: 0) — NONE
Boundary docs needed: 0 — NONE
Merge clusters: 1 — {A, B}; survivor: commit-message-writer
Preservation review: Preserve broad commit-message scope and B’s
  type(scope): subject requirement; no conflicts in supplied evidence.
Contradictions / evidence gaps: NONE within the supplied comparison.
User decision: No retain/combine preference stated; no modifications authorized.
Recommendation: Combine into commit-message-writer; preserve requested formats.
```
