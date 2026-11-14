# Resuming From an Existing Ledger

Read this when `<workspace>/progress.md` already exists, after a compaction, a
new session, or an interrupted run.

Conversation memory does not survive compaction. Controllers that lost their
place have re-dispatched whole completed task sequences, so the ledger and
`git log` outrank your recollection.

- **First line names this plan** (`# SDD ledger — plan: <plan file path>`):
  tasks with a `Task <N>: complete` line are DONE. Do not re-dispatch them;
  resume at the first task without one. A task whose last line is a fix round is
  mid-loop: resume the loop at the next round.
- **First line names a different plan**, or the ledger is missing: it is another
  plan's progress, or there is none. Leave other plans' files alone and start a
  fresh ledger.
- **Ledger destroyed** (compaction does not do this, but `git clean -fdx` does):
  rebuild it from `git log`. The commits it named still exist, so never
  re-dispatch a task whose commits are already in history. A rebuilt ledger
  carries no test evidence: mark those tasks `evidence lost` and cover them in
  the "Validate at HEAD" step.
- **Consent:** a `Consent: <what, who, when>` line is the only record a later
  session can see of an answer the human already gave (for example approval to
  work on `main`). Look for it before asking again.
