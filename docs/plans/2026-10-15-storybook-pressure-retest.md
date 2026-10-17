# Storybook plan pressure retest

Date: 2026-10-15 (Australia/Sydney). Planning checkout: 9a8575b2. Scope:
[authoritative plan](2026-10-14-storybook-coverage-and-mcp-remediation.md),
[scorecard](2026-10-15-storybook-work-package-scorecard.md), companion test plan
and the four current per-phase task JSONL artifacts. No application, story,
runtime configuration, dependency, CI or policy implementation is included.

## Method and claim boundary

Green tests ordinary execution contracts. Amber tests degraded/change
conditions. Red challenges false-success and unsafe recovery. These labels are
the review's scenario taxonomy, not a claimed formal certification standard.

The retest combines 24 document-contract checks (one scenario per pressure level
per package), bounded in-memory counterexample models, artifact consistency and
an independent reviewer. It does not execute the proposed coverage validator,
real ACL enforcement, application requests, Storybook plays or accessibility
tests. Live MCP documentation discovery proves reachability only.

## Recommendation traceability

| ID  | Required revision                                                   | Acceptance evidence required during implementation                                                       |
| --- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| RT1 | Include patches in freshness and validated install provenance       | Patch-only change/add/delete invalidates inputDigest; mismatched provenance fails                        |
| RT2 | Preparation before enforced freeze; all qualifying gates afterward  | Pre-freeze lint/unit/source/build results rejected; final gates share freeze identity                    |
| RT3 | Nonempty required semantic/behavioral baseline for renderables      | Empty/all-unsupported/smoke-only records fail; sufficient indirect/static claims pass                    |
| RT4 | Consumer-first or atomic dependency rollback                        | Retained consumers cannot depend on a reverted harness; intermediate isolation passes                    |
| RT5 | Startup interception before eager requests can escape               | Inert delayed/rejected/import/loader probes show zero live sends and failed startup blocks execution     |
| RT6 | Prove handler/cleanup ownership in concurrent real Docs             | Conflicting A/B frame responses and independent unmounts remain isolated; controls limitations labeled   |
| RT7 | Bind actual producer/native endpoint and enforce input immutability | Wrong producer/install/URL/PID or writable freeze fails; outputs writable; ACLs restored on cancellation |

## Green, Amber and Red contract scenarios

Covered means the corrected written contract contains the required control and
negative test. It never means the future runtime test passed.

| Package | Green scenario                                      | Amber scenario                                             | Red scenario                                                          |
| ------- | --------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| T1      | Exact-ID component/a11y success                     | Occupied port/upstream blocker preserved                   | Same story IDs from wrong producer/native endpoint rejected           |
| T2      | Recursive classified exports with required baseline | Current migration adds nested exports                      | Patch-only drift and zero-required-state loopholes rejected           |
| T3      | Correct owner/API and stable IDs                    | Docgen fallback and iframe Controls limits                 | Wrong owner/default/controllability claims rejected                   |
| T4      | Approved contracts and semantic/behavior plays      | Missing maintainer approval blocks lane                    | Fake API and assertion-free baseline rejected                         |
| T5      | Sufficient indirect observable evidence retained    | A-to-B-to-A cleanup and overlapping Docs                   | Import-only/unrendered conditional branch rejected                    |
| T6      | Exact route params/request/destination              | Delayed/rejected worker, eager loader and conflicting Docs | Prerequisite-first rollback rejected; consumer-first/atomic required  |
| T7      | Shell-only claim and forwarding equivalence         | Wrapper gains hooks/conditions/effects                     | Stubbed outlet overclaim and incompatible retained shell rejected     |
| T8      | Full/docs index split and serial final gates        | Generated docs changes require a new final freeze          | Pre-freeze evidence, wrong producer and A-to-B-to-A mutation rejected |

## Results

The first independent retest (Gauss) scored the document 93/100 and identified
two RT7 blockers: no assigned freeze/gate launcher and child identity required
before a cold request could create the child. Both were corrected: the plan now
assigns scripts/storybook-closure.mjs/runClosure with an explicit native MCP
handoff, timeout and cleanup; stable producer identity excludes child lifecycle
fields and each response qualifies only after observed child provenance is
joined. This failed review remains part of the evidence, not erased by
reassessment.

Read-only Node assertions run from stdin after the corrections produced:

| Check group                             |         Passed | Failed | What this proves                                                                                |
| --------------------------------------- | -------------: | -----: | ----------------------------------------------------------------------------------------------- |
| Green contract checks                   |              8 |      0 | Normal-path written controls are present for T1–T8                                              |
| Amber contract checks                   |              8 |      0 | Degraded/change scenarios have specified controls                                               |
| Red contract checks                     |              8 |      0 | False-success/recovery scenarios have specified controls                                        |
| Launcher/cold-lifecycle contract checks |              8 |      0 | Explicit entry, handoff/cleanup, BDD environment/reset and stable/per-child identity sequencing |
| Bounded reference-model cases           |             38 |      0 | Counterexample predicates and corrected model controls behave as specified                      |
| Task/traceability checks                | 8 unique tasks |      0 | Four JSONL artifacts parse; all seven RT recommendations map to tasks                           |

The 38 reference-model cases comprise RT1 4, RT2 3, RT3 8, RT4 4, RT5 4, RT6 2
and RT7 13. Models use synthetic files, reviewed-meaningfulness flags,
timestamps, dependency graphs, inert transport counters and frame-local maps.
They are not the proposed validator, MSW, browser lifecycle or Windows ACL code.
The original omitted-patch loophole and A-to-B-to-A boundary-hash limitation are
deliberately reproduced, then contrasted with the corrected requirements.

Independent reviewer Boole approved the corrected plan97/100 with zero critical
blockers; RT1–RT7 are closed at the planning-contract level. Current package
scores are T1 98, T2 99, T3 100, T4 100, T5 100, T6 99, T7 100 and T8 97. Its
nonblocking gate6 child-only URL/external-mode and owned-runner reset
clarification was applied without increasing these scores.

Final formatting, secret scans, diff and current-score arithmetic are rerun
after the last artifact edit. Runtime gates remain unexecuted. “Approved” means
ready to take into the separately authorized implementation workflow, not that
the plan-only request authorizes implementation or proves its future tests.

## Remaining execution prerequisites

Rebaseline the moving checkout; assign owners and obtain API contracts; diagnose
the runner; establish a supported native MCP connection to the owned producer;
prove the Windows freeze adapter in an owned integration copy; run approved
Gherkin, actual validator/unit/lint/build/Docs/BDD/MCP/a11y gates. If
permissions, dependencies, startup or isolation cannot satisfy the contracts,
closure blocks. No absent approval or unexecuted test is converted into a pass
by this report.
