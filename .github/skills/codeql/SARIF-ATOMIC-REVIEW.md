# SARIF atomic reference review

Date: 2026-09-29
Scope: GitHub SARIF support plus six GitHub SARIF-upload failure references supplied by the user.

## Outcome

PASS — SARIF reference now separates OASIS conformance, GitHub compatibility, and producer behavior.
PASS — current GitHub object limits and 10 MB gzip-compressed upload limit are represented.
PASS — soft/display truncation is separated from hard rejection.
PASS — missing-token permission branches are explicit.
PASS — invalid-SARIF remediation is distinct from permission/eligibility fixes.
PASS — result-limit remediation includes nondeterministic alert identity and support escalation where documented.
PASS — file-too-large remediation is evidence-led and does not recommend arbitrary security-coverage reduction.
PASS — GitHub Code Security eligibility is separated from SARIF syntax.
PASS — CodeQL default-setup conflict is explicitly CodeQL-result-specific and requires a deliberate setup choice.
PASS — troubleshooting, workflow, and CLI references route consistently to the SARIF failure branches.
PASS — seven new adversarial pressure cases cover the newly sourced failure modes.

NHR — GitHub upload/API behavior was not executed against a live repository.
NHR — behavioral pressure cases require a clean agent/eval runner for RED/GREEN evidence.

Static SARIF-reference assessment: 99/100.
