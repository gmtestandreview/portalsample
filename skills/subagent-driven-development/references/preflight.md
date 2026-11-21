# The Pre-flight Scan

Read this once, before dispatching Task 1.

Scan the plan for conflicts, writing down what you checked as you check it:

- tasks that contradict each other or the plan's Global Constraints;
- anything the plan explicitly mandates that the review rubric treats as a
  defect (a test that asserts nothing, verbatim duplication of a logic block).

The output is a table in the ledger, not a verdict:

- one row per pair of tasks that share a file or an interface: the two tasks,
  what one produces against what the other consumes, and what you found;
- one row per task: whether its own text agrees with itself (the tests it
  specifies against the code it specifies, the files it creates against the
  files it later touches).

"The scan is clean" without those rows is not a scan you ran.

Also record the activation call from SKILL.md's "When to use": the task count
and which tasks depend on an earlier task's code.

Rule on every finding before Task 1, against the plan text that mandates it. The
spec is the binding authority and the plan is its argument. Record each ruling
beside its row as

`Ruling: <what you decided> — <why> — <what it costs if wrong>`

A ruling that changes architecture, public API, data, security, or billing, or
that the spec does not settle, also goes to the Veto Buffer for the human; never
resolve those alone. If the scan is clean, proceed without comment. The review
loop remains the net for conflicts that only emerge from implementation.
