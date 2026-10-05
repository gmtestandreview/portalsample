# Evidence applicability

Date: 2026-10-05

## Historical conformance

The
[2026-09-15 pressure/conformance report](python-code-review-pressure-test-report.md)
is preserved unchanged. Its 17 GREEN probes, 1 RED finding, and NHR RED baseline
describe that historical current-context assessment. Its GREEN labels concern
instruction clarity/adherence in an already exposed conversation; they are not
isolated behavioral PASS, deployment approval, or proof of current skill
performance. Its RED finding remains part of the historical record even if later
instructions address the boundary.

## Current and future execution evidence

The
[2026-10-05 performance retest campaign](runs/2026-10-05-performance-retest/) is
a separate evidence location. Its `manifest.json` and `results.json` will be
produced from completed runs there. Directory existence establishes availability
of a campaign location only. This applicability note does not assert that its
runs completed, passed, or used the final candidate.

Current/future conclusions require actual run artifacts identifying the
candidate revision/hash, prompt/input scope, executed checks and environments,
and observed/grading outcomes. Link those artifacts when available; do not carry
historical GREEN counts or a prior analyzer result forward after changes.

The seven new regression cases in [cases.json](cases.json) and their static
[QAQ/RMI mappings](qaq-rmi.md) are test definitions, not observed behavior.
Their status is NHR until representative runs establish evidence for the current
candidate. Missing execution or environment equivalence remains explicit rather
than being converted to PASS.
