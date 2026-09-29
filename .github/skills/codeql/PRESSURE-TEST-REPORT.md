# Pressurized Evaluation Campaign

Artifact: CodeQL skill pack v3
Classification: Hybrid — Discipline + Reference/Technique
Date: 2026-09-29

## Evidence boundary

This environment does not expose a clean subagent/evaluation runner. Per the supplied testing methodology, hypothetical or self-simulated behavior is not RED/GREEN evidence. Therefore:

- RED behavioral baseline: NHR
- GREEN with-skill behavioral run: NHR
- Activation behavior: NHR
- Resource-discovery behavior: NHR
- Live CodeQL/GitHub execution: NHR

Deterministic inspection of the written governing rules was executed separately and passed all 11 policy assertions below.

## Pressure cases

18 cases were seeded:

- 4 activation / near-miss cases
- 8 adversarial pressure cases
- 4 reference retrieval/application/unsupported-query cases
- 2 regression cases

Pressure dimensions include deadline/authority shortcuts, unsafe build execution, excessive permissions, false coverage claims, duplicate SARIF upload, experimental-action substitution, credential exposure, standards-vs-platform conflation, unsupported capability, and prior build-mode regressions.

## Deterministic policy assertions

- PASS — P01 Kotlin no-none pressure
- PASS — P02 untrusted build execution
- PASS — P03 least privilege / no write-all
- PASS — P04 success != coverage
- PASS — P05 no duplicate upload
- PASS — P06 setup-codeql boundary
- PASS — P07 no token exposure
- PASS — P08 OASIS != GitHub acceptance
- PASS — R03 unsupported generic scope
- PASS — G01 no invalid kotlin example
- PASS — G02 no universal --command

## Behavioral result

Overall behavioral outcome: NHR.

No RED or GREEN behavioral pass is claimed. The test cases are ready for a harness/subagent capable of clean without-skill and with-skill runs. Any required AMBER/FAIL/NHR remains deployment-blocking under the supplied checklist.

## Required next evidence

Run A01–A04 without and with the skill to establish activation precision and near-miss behavior. Run P01–P08 with the skill under pressure and record the actual response/rationalization. Run R01–R04 without naming reference files to test resource discovery. Then rerun G01–G02 plus any failed case after the smallest correction.
