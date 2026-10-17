# Independent review evidence — 17 October 2026

Latest independent closeout review: **APPROVE scoped** for the installed native
Codex packages. The reviewer inspected all ten requested documents, both
matrices, active policy, installation/verification records and four final public
transcripts; it independently confirmed 82 source/installed hashes, policy
identity and both protected-hook hashes. Two documentation-precision issues were
corrected. The [public handback](v3_review_raw.md) and
[installed acceptance](V3_NORMAL_HOST_ACCEPTANCE.md) preserve the scope; no IDE,
Claude, unrelated-integration or automatic-enforcement claim is added.

Closeout context:
[authorized normal-host installation and acceptance](V3_NORMAL_HOST_ACCEPTANCE.md)
are now separately recorded in the
[current matrix](v3_implementation_controls.csv). The reviewer statements below
retain their original implementation/oracle scopes; none is recast as a new
normal-host execution. The installed policy, identities, public outputs and
protected-hook hashes provide the latest acceptance evidence. Historical numeric
results remain historical, and the Python/collection baseline is not rerun for
this documentation closeout.

These are preserved reviewer handbacks, not an independently metered campaign.
No reviewer assigned a numeric score or tested natural host activation.

## Target review, before implementation

Scope: current target entrypoint, validation reference, expected results and
specific subset/handoff cases. The reviewer made no edits.

> F07 needs a narrow consistency fix before validation.

Reported defects: reference treated any unique output format as specialization;
S3 oracle allowed classification NHR for known contradictions; S1 oracle
required False positive despite missing Qdrant activation/outcome evidence.
Fixes are recorded in the implementation matrix; original oracle bytes remain
archived.

## Python implementation review

Scope: `skills_ref/evidence.py`, CLI integration, focused tests and bounded
optimisation reference. The reviewer ran a concrete decimal boundary probe.

> One verified P2 finding remains: default JSON float parsing can round scores
> across the deployment threshold.

Exact reproduction: literal JSON value `95.999999999999999999` with `>=96` and
PASS prerequisites incorrectly permitted deploy. The inverse boundary and
capacity comparison were also susceptible. Corrected with Decimal parsing and
exact comparisons; three new regressions were observed failing before the fix.
All now pass. An oversized-integer uncontrolled error was also reproduced and
covered before the decimal fix; the final exact-number validation handles it.

## Narrow oracle follow-up

The independent target reviewer checked S3 from the original prompt and
unchanged rules without reading GREEN output: mandatory sibling Partial overlap
was unsupported. Input-source siblings with no specialization/handoff follow the
False positive guard; contradictory hash instructions separately hold the group.
Oracle v1.3 was archived and S3 invalidated, v1.3.1 was frozen, and a fresh
isolated S3 run was performed. Other unaffected cases were retained, not
regraded to inflate a comparative score.

Reviewer stated no other material findings in the four-file scope. This is
bounded code-review evidence, not a complete repository audit. Fresh tests and
Pyright after the correction are recorded in the final verification artifact.
