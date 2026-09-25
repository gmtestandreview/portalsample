---
name: incident-review
description: Use when writing incident review reports for payment API outages, including timelines, customer impact, root-cause analysis, remediation owners, and evidence handling.
---

# Incident Review

## Required Outcome

Produce a concise incident review with:

- summary;
- customer impact;
- timeline;
- root cause;
- contributing factors;
- remediation owners;
- evidence appendix;
- follow-up validation.

## Workflow

1. Gather the incident timeline.
2. Identify affected customer groups.
3. Separate root cause from contributing factors.
4. Assign remediation owners.
5. Validate that follow-up actions have owners and dates.
6. Add evidence links.

## References

- `references/evaluation.md` - load when evaluating output quality or deployment readiness.

## Domain Guidance

Never treat a customer-impact estimate as confirmed unless the source system, query window, and
deduplication method are recorded. If impact is inferred, label it as inferred.
