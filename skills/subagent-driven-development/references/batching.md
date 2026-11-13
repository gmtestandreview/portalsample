# Batching Small Same-Shape Work

Read this when the plan lists several tasks that are each a small, independent
edit of the same kind (the same one-line fix, constant change, or field addition
repeated across files).

Do not dispatch one subagent per task. Compose ONE dispatch brief listing every
file and its change, send the whole batch to a single subagent, and review its
diff as one unit, file by file: every listed file must have its hunk, and a
listed file the diff never touches is a missing requirement.

Reserve one-dispatch-per-task for work that needs its own judgment, its own
tests, or its own review surface. If a batched review finds a problem that needs
its own judgment, split that item out into a per-task dispatch and fix it there.
