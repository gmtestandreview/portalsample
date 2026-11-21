# Handling a Report That Isn't DONE

Read this when an implementer returns a status other than DONE.

**DONE_WITH_CONCERNS:** the implementer completed the work but flagged doubts.
Read the concerns before proceeding. Concerns about correctness or scope are
addressed before review. Observations (for example "this file is getting large")
are noted in the ledger, then proceed to review.

**NEEDS_CONTEXT:** the implementer needs information that was not provided.
Supply it and re-dispatch.

**BLOCKED:** the implementer cannot complete the task. Assess the blocker:

1. A context problem: provide more context and re-dispatch on the same model.
2. The task needs more reasoning: re-dispatch on a more capable model.
3. The task is too large: split it into smaller pieces.
4. The plan itself is wrong: rule on the correction, ledger it, and re-dispatch
   with the ruling carried in the dispatch.

Never ignore an escalation or make the same model retry unchanged. If the
implementer said it is stuck, something must change.
