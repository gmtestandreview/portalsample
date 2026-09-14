# QAQ/RMI map

These are static mappings for critical activation, branch, and load conditions. They are **not behavioral execution evidence**. Until representative runs are recorded, evidence status is `NHR`.

| Item | Positive | Near-miss | Governing instruction | Expected behavior | Reverse mapping | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Review activation | Audit an existing Python module for correctness/typing | Explain `zip()` | Frontmatter + Scope boundary | Activate only for review/audit/hardening/remediation | Existing-code quality review | NHR |
| Greenfield boundary | Review a new endpoint after implementation | Implement a new FastAPI endpoint | Scope boundary | Do not activate for greenfield implementation alone | Implementation without review intent | NHR |
| Focused debug boundary | Audit recurring `None` semantics across a module | Why does one function return `None`? | Scope boundary | Reserve full discipline for broader review/remediation | Narrow debugging | NHR |
| Performance branch | Review memory/N+1/concurrency risks | Write a faster loop from scratch | Conditional references | Load `python-general-review.md` for review | Performance review of existing code | NHR |
| Static-analysis branch | Audit mypy/Ruff/Pyright diagnostics | Explain what mypy is | Conditional references | Load verification reference only for diagnostics/remediation | Static-analysis remediation | NHR |
| Async branch | Review cancellation/blocking I/O | Explain `asyncio.gather` | Conditional references | Load remediation reference; avoid unrelated references | Async code review | NHR |
| Specialist composition | Review Django middleware security and Python errors | General security policy review | Scope boundary + general reference | Cover Python-specific issues; compose with specialist security skill if available | Python review inside specialist domain | NHR |
| High-impact remediation | Repo-wide auto-fix/refactor | One-line local lint fix | Workflow step 6 | Checkpoint/stage/diff/rollback for broad/high-impact change | High-impact code remediation | NHR |
| Reporting branch | Produce formal defect report | Give one quick code comment | Conditional references | Load reporting reference only for formal/material reporting | Structured review report | NHR |

Behavioral PASS requires observed activation/load behavior from representative runs. A static direct mapping only establishes test readiness.
