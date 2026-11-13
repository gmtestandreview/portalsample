# "Cannot Verify From Diff" Items

Read this when the task reviewer reports "⚠️ Cannot verify from diff" items:
requirements that live in unchanged code or span tasks.

These do not block the rest of the review, but you must resolve each one
yourself before marking the task complete, because you hold the plan and
cross-task context the reviewer lacks. Resolve each with evidence, and record it
in the ledger:

- the command you ran and its result, or
- the file and lines you read.

A judgment without evidence stays open. If you confirm an item is a real gap,
treat it as a failed spec review: it enters the fix loop with the other findings
(`references/fix-loop.md`).
