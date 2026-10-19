**Recommend combining them**, retaining `commit-message-writer` and incorporating Conventional Commits as a format option.

| Evidence supplied | Classification implication |
|---|---|
| Both activate when writing git commit messages. | Their activation scopes overlap. |
| Both produce a commit message. | They serve the same underlying task and outcome. |
| The second adds only `type(scope): subject`, with no separate workflow or tooling. | It is a format variant, not an independently specialized capability. |

**Classification:** narrow-scope overlap: `conventional-commit-writer` is contained within the broader skill. They are not exact duplicates, because its format requirement must survive consolidation.

**Proposed survivor:** `commit-message-writer`, with this boundary:

> Use when writing git commit messages. Produce a commit message in the requested format; when Conventional Commits is requested, use `type(scope): subject`.

Preserve both general commit-message support and the explicit Conventional Commits requirement. Do not make that format mandatory for every request or introduce additional checklists or workflows.

**Final accounting:** 2 existing skills → 1 proposed survivor; 1 standalone skill retired after its format behavior is incorporated; no supplied capability lost. No files modified, network tools used, or agents launched.

The required `sonar analyze secrets` invocation was blocked by execution policy. I therefore read no files, including the applicable skill instructions; this recommendation rests solely on your supplied descriptions.