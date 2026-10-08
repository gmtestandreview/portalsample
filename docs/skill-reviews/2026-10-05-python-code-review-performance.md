# Python code review skill: 72-hour performance assessment

## Assessment

**Recommendation: targeted revision. Behavioral confidence: AMBER.** The skill
supported useful correctness and compatibility reviews, including detection of
misleading reports, malformed-input failures, and tests that falsely passed. Its
weakest observed behavior is verification against the user's editor environment:
all four substantial 5 October Python review tasks required a later user
correction for missed diagnostics.

This is a retrospective assessment, not a controlled benchmark or a
production-readiness certification. The four-of-four observation describes this
selected cohort; it is not an estimated failure rate for all uses of the skill.
No skill or application source was changed, and no historical Python test
results were rerun or presented as fresh results of this assessment.

## Scope, window, and evidence

The fixed window is **2 October 2026 09:01:28 UTC through 5 October 2026
09:01:28 UTC**, exactly 72 elapsed hours. In Australia/Sydney, the endpoints are
2 October 19:01:28 AEST and 5 October 20:01:28 AEDT; daylight saving starts
inside the window. Filename dates and modification dates were discovery hints;
inclusion used message timestamps.

The assessed artifact is
[the repository skill](../../.claude/skills/python-code-review/SKILL.md), its
four references, and its three evaluation resources. Its current `SKILL.md`
SHA-256 is `DB1B2D811FF15A825D9A65E74516CBC651ACFB475A9E8690F665B9A4C71F1CFC`.
The Codex-installed main file and all seven corresponding resources currently
match the repository copies byte for byte. They are separate directories, not
links. Most Codex conversations explicitly loaded the installed copy; that
present-day equality connects their subject matter to the requested repository
skill but does not prove the exact historical revision loaded in each run.

Local discovery examined 84 recent Codex session files, 55 recent archived Codex
files, and 52 recent Claude project files for this project and its related
worktrees. Sixteen files contained relevant invocation evidence. Deduplication
by thread ID and parent/source metadata separates inherited subagent prompts and
continuation files from independent user tasks. The resulting evidence comprises
eight distinct Codex threads and one Claude conversation, covering eight task
families; one Codex thread is the report task's corrective follow-up. The
current assessment conversation and catalogue-only mentions are excluded.

The [evidence manifest](2026-10-05-python-code-review-performance-evidence.json)
records paths, hashes, timestamps, thread identities, and source-line locators
without copying raw conversations. Local archives are the available conversation
corpus; conversations not persisted there remain unavailable. Reports are
mutable summaries. Conversations corroborate the corrections and selected
executions; no complete independent reproduction of every historical result was
attempted.

### Supplied artifact coverage

| Supplied artifact                                                                  | Use in this assessment                                                                                                                                             |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Hook review plan](../plans/2026-10-05-hook-tests-python-review.md)                | Requested scope, baseline discovery, preservation of guard policy.                                                                                                 |
| [Guard fixes plan](../plans/2026-10-05-pre-tool-use-guard-fixes.md)                | Context only: proposes fail-open wrapper behavior, while the later hook review preserves the configured fail-closed policy. A proposal is not the active contract. |
| [Report review plan](../plans/2026-10-05-python-report-contract-review.md)         | Data contracts, upstream repairs, frozen code rubric and verification scope.                                                                                       |
| [Renderer refactor plan](../plans/2026-10-05-render-graphs-refactor.md)            | Context only: JavaScript implementation with Python integration tests.                                                                                             |
| [Creator contract fixes plan](../plans/2026-10-05-skill-creator-contract-fixes.md) | Context for pre-existing changes and shared files; planned checks are not observed outcomes.                                                                       |
| [Skills-ref plan](../plans/2026-10-05-skills-ref-python-review.md)                 | Parser and test scope, minimum runtime, differential verification.                                                                                                 |
| [Utils plan](../plans/2026-10-05-utils-python-review.md)                           | Supplied diagnostic provenance, parser constraints and repair sequence.                                                                                            |
| [Hook review](2026-10-05-hook-tests-python-review.md)                              | Behavioral findings, unresolved upstream RED, and assertion follow-up.                                                                                             |
| [Report review](2026-10-05-python-report-contract-review.md)                       | Producer/consumer defects and missed strict-editor diagnostics.                                                                                                    |
| [Renderer review](2026-10-05-render-graphs-review.md)                              | Context for shared tests, analyzer proxies and blocked fixture cleanup; excluded from direct Python-skill effectiveness counts.                                    |
| [Skills-ref review](2026-10-05-skills-ref-python-review.md)                        | Runtime-floor discovery, compatibility results and redundant-cast follow-up.                                                                                       |
| [Utils review](2026-10-05-utils-python-review.md)                                  | YAML correctness, analyzer-stub variation and disposal follow-up.                                                                                                  |

## Observed task outcomes

The scores below are the historical reviewers' **code scores**, not this skill's
score. Test totals overlap and belong to different artifact versions; they must
not be summed into one campaign pass rate.

| Task family                                                          | Reported useful result                                                                                                                                                                                         | Observed limitation or correction                                                                                                                                                                                                           |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Utils metadata reader                                                | 71 → 96; effective duplicate/merge scalar style repaired; malformed tags receive bounded errors; 85 regressions and minimum-runtime parser checks reported.                                                    | User supplied missed `dispose() -> Unknown`. Complete PyYAML stubs in the checker concealed the editor's incomplete-stub variant. Follow-up reproduced that variant and repaired the cleanup interface.                                     |
| Report and benchmark contracts                                       | Benchmark 88 → 97, comparison 82 → 97, report 62 → 96. Null holdout crashes, incorrect winner selection, fabricated missing failures, lost timing siblings and invalid example JSON repaired.                  | User supplied missed Unknown diagnostics and Sonar S5906. Basic Pyright and test-local import resolution did not represent workspace-root strict editor analysis. Follow-up added honest dynamic-module boundaries and reran strict checks. |
| Skills-ref parser and integration tests                              | Combined 85 → 96; deep YAML and Python 3.11 Unicode overflow translated into controlled errors; 100 differential comparisons and two 145-test interpreter runs reported.                                       | User supplied missed `reportUnnecessaryCast`; it was not enabled in the earlier check. User also challenged accumulated test-output `SKILL.md` fixtures. Later verification reported 160 current tests and cleanup.                         |
| Hook test harness                                                    | Per-file 88/48/42/46 → 98/89/91/96. Previously undiscovered matrices became collected cases; injected watcher failures ceased falsely passing. Final report retains 97 passes and 16 actual upstream failures. | User supplied missed Sonar S9073 composite assertion. Follow-up split the checks. Guard logging and Windows process-liveness defects remain upstream; the report correctly retains RED instead of raising scores to force readiness.        |
| Watcher diagnostics, 4 October Sydney                                | Typed task data/callbacks, narrowed JSON, compile/lint/type checks and focused smoke checks recorded.                                                                                                          | Completion equates Pyright evidence with cleared Pylance errors; exact editor execution is not established.                                                                                                                                 |
| Status diagnostics, 4 October Sydney                                 | Small optional-parameter and dynamic stdout-method repair; final Ruff/Pyright/compile/diff checks recorded.                                                                                                    | Static checks support the stated checks, not exhaustive runtime or editor coverage.                                                                                                                                                         |
| Session export diagnostics, 4 October Sydney                         | Minimal `list[object]` annotation preserves arbitrary JSON-line values.                                                                                                                                        | Conversation explicitly notes default Pyright passed before the repair despite a stricter Pylance finding. An executed equivalent strict reproduction is not established in the recorded checks.                                            |
| TypeScript diagnostic helper implemented in Python, 2 October Sydney | Claude invoked `Skill: python-code-review`; 21 tests reported, including an observed RED for byte-valued timeout output, and differential verification.                                                        | Final prose says the Sonar findings are fixed and labels complexity below 15 while also admitting Sonar was not rerun and complexity was not measured. Structural repair supports a narrower conclusion.                                    |

### Conversation anchors

Line numbers refer to the raw JSONL source file named in the manifest. Duplicate
continuations and historical review agents are corroboration, not additional
successful task runs.

| Thread/conversation                           | Evidence anchors                                                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `01a10a05-1fbe-7691-8b15-547cf59b6137`        | Skill load 16; user missed-issue message 293; incomplete-stub explanation 328; corrective completion 367.                                                    |
| `01a10a27-2228-7b90-b298-9fc1c541b997`        | Skill load 16; user status request 193; completion explicitly still pending at 196; original completion 235.                                                 |
| `01a10b26-5190-7232-b8df-3db9c873a007`        | Corrective report thread: user missed-errors message 11 in the initial rollout; skill reread 39 in its continuation.                                         |
| `01a10a2c-1d09-7270-92ef-db61057a89b2`        | Skill load 16; user fixture complaint 199; missed-cast message 321; rule mismatch explained at 365; corrective completion 389.                               |
| `01a10b1d-6d5d-74c3-a5fb-8be22c39a5d0`        | Skill load 16; user missed-assertion message 251; corrective completion 288.                                                                                 |
| `01a102cc-a829-7c13-81f5-ba000f17de5b`        | Watcher request 10; remaining required-key model issue 97; smoke/check completion 143.                                                                       |
| `01a102d1-6b3b-7521-8fdd-6e08a43c529a`        | Status request 10; skill load 15; follow-on stdout typing issue 86; completion 104.                                                                          |
| `01a102d3-8bfd-7f13-afff-be32e2242d5f`        | Export request 10; skill load 20; basic-versus-strict mismatch 62; completion 70.                                                                            |
| Claude `f70fb1c2-3ca8-445c-8570-89ecc56f1e79` | Relevant request 1618; actual Skill invocation 1633; analyzer reference read 1642; byte-timeout RED 1703; qualified but contradictory Sonar completion 1798. |

## What worked

The strongest reusable value is the skill's review order: identify contracts and
missingness before changing types or satisfying analyzers. The report review
tests the real optimizer/report relationship, preserves training-based
selection, and independently recovers duration and tokens. The YAML reviews
retain valid legacy semantics while bounding demonstrated errors. These are
specific applications of steps 3–5, 8, 10 and 12–14, not merely style cleanup.

Compatibility received unusually concrete attention: current dirty copies were
preserved, candidate transfers were hash-checked, public interfaces remained
intact, and old/new outputs were compared. The reported 84-fixture utils and
100-comparison skills-ref campaigns support preservation for their stated
fixtures. They do not establish exhaustive compatibility.

The hook review demonstrates the evidence boundary particularly well. More
honest tests produced failures, and the report kept unresolved implementation
defects RED despite improved test architecture. It also resisted treating the
guard plan's proposed fail-open behavior as the existing policy. Preserve these
instructions and examples.

Most formal reports distinguish executed Pyright from unavailable Pylance and
secrets scanning from unavailable Sonar quality analysis. The Python-floor
campaign caught an exception-class difference that current-runtime testing
missed. These are valuable safeguards to retain.

## Findings and smallest justified revisions

### F1 — High: analyzer environment fidelity remains unreliable

**Observed execution failure.** Four substantial reviews needed user-supplied
diagnostic corrections: dependency-stub variation, strict inference/import
roots, a disabled cast rule, and a Sonar assertion rule. The skill already
requires configuration/profile provenance, names `reportUnnecessaryCast`, and
prohibits claiming Pylance from another checker. Adding generic stronger wording
would duplicate existing rules.

Add a short required **analyzer evidence record** to
`references/ruff-pyright-verification.md`, and make main steps 1, 9 and 15 refer
to it. Before interpreting a checker result, record artifact, tool/version,
execution root, effective mode and rule overrides, interpreter/environment,
import/stub paths, files actually analyzed, and mismatches against supplied
editor evidence. Use available project/editor configuration; do not impose
strict mode universally or change repository policies to manufacture a pass.

If the exact editor is unavailable, reproduce the supplied rule and relevant
dependency/import environment where practical, then label the result an
equivalent reproduction with differences. A clean run with zero analyzed files
cannot establish cleanliness. The hook report already discarded an
absolute-include configuration that checked nothing; the utils correction
transcript also contains a zero-file attempt before later verification. This
needs an explicit acceptance check, not another general reminder to run Pyright.

Success criterion: the initial result catches the supplied diagnostics under the
effective environment, or reports the uncovered editor checks as pending before
claiming completion. A correctly documented limitation is preferable to an
unsupported clean result.

### F2 — Medium: short completion messages lose evidence qualifications

**Observed reporting failure.** The wrapper corrective final says the focused
Sonar CLI scan reports no issues, while its report says Vortex is unavailable
and exact editor equivalence was not established. The archived watcher task
labels Pylance errors cleared from Pyright evidence. The Claude helper review
claims the Sonar findings are fixed and specifies unmeasured threshold
clearance, despite disclosing that the analyzer was not run.

Add a compact positive completion contract to `references/review-reporting.md`:
**artifact and outcome; executed checks with environment/rule scope; unexecuted
or non-equivalent checks; residual behavioral status and compatibility impact**.
Apply it to concise finals as well as long reports. Examples should say “strict
Pyright reproduction passed; Pylance not run” and “structural complexity repair;
Sonar threshold unverified.” Keep each qualifier beside its claim.

This does not make every small change require a formal report. It preserves the
evidence boundary in whatever completion format is appropriate.

### F3 — Medium: fixture hygiene happens too late

**Observed execution/usability failure.** The skills-ref user specifically
challenged accumulated synthetic `SKILL.md` output. The later report documents
cleanup; the renderer context documents removal blocked by automatic approval
review and correctly leaves that cleanup incomplete. Necessary behavioral
fixtures and unnecessary persistent clutter are separate concerns.

In the test/resource section of `references/python-general-review.md`, require a
task-owned scratch location and a lifetime for generated fixtures before running
artifact-producing tests. Add an end-of-review scratch disposition to reporting:
removed, intentionally retained recovery/evidence, or blocked. Preserve baseline
recovery copies and durable reports; do not broadly delete worktrees or existing
files. A main completion pointer is sufficient; avoid a second general cleanup
workflow.

Success criterion: no unaccounted synthetic skill documents remain after an
applicable run, and any intentionally retained or blocked artifacts have a
stated owner, location and purpose.

### F4 — Medium: evaluation resources do not demonstrate current reliability

**Verified evidence gap.** `evals/cases.json` defines 36 cases and
`evals/qaq-rmi.md` correctly marks mappings NHR. The dated 15 September pressure
report explicitly uses contaminated current-context conformance probes: its 17
GREEN labels and one RED are not isolated behavior runs. The current scope text
includes the focused-debug exclusion that the historical report recommended, but
no current rerun is recorded there.

Keep historical evidence unchanged. Add a dated applicability index and actual
run records bound to candidate/reference hashes, scenario, inputs, effective
environment, observed output, and assertion result. Extend the existing
provenance cases with the four real editor regressions, zero-file analyzer
execution, short-final qualification, and fixture cleanup. Do not mark old
conformance probes as current behavioral PASS.

There is no need to duplicate the existing 36 scenarios or replace the skill
with a larger handbook. The missing evidence is execution of the relevant
scenarios, especially negative activation and environment drift.

## Static skill quality and activation mapping

This is a **Discipline** skill with conditional domain references. The main file
is 93 lines and approximately 2,500 tokens by a characters-divided-by-four
estimate. That exceeds writing-skills' approximately 2,000-token target
modestly, while remaining well below its split threshold. The material mostly
earns its context: provenance, missingness, sink tracing, ordering/identity,
compatibility and behavioral gates are specialized review decisions. Repeated
generic verification statements can be consolidated after the observed failures
are protected; size alone does not justify removing unique guidance.

Inspection confirms required frontmatter, a matching valid name, a nonempty
description within the specified length limit, and all six main-file local
resource links. This is local structural validation, not a claim of complete
runtime discovery or provider acceptance.

| Critical mapping       | Positive request and intended behavior                                                              | Near-miss and boundary                                                                                  | Evidence status                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Existing-code review   | Audit an existing parser/report/harness; review semantics, models and consumers.                    | Explain `zip()` or write a tutorial; no review discipline.                                              | Explicit positive invocations observed; autonomous discovery and negative execution NHR.                                    |
| Diagnostic remediation | Repair supplied Pylance/Ruff/Sonar issues; load analyzer reference and reproduce effective context. | Explain what a checker means without requesting review/remediation.                                     | Loads observed; environment fidelity failed in the four October reviews.                                                    |
| Routine refactor/debug | Broad cross-module correctness audit invokes the discipline.                                        | A standalone dataclass rewrite or isolated local bug without broader review intent stays outside scope. | Current wording and mappings align statically; isolated runtime negative tests NHR. Explicit user invocation still governs. |
| Formal assessment      | Requested rubric/impacts/pressure report loads reporting reference.                                 | One quick code comment need not load a formal report workflow.                                          | Report-reference loads observed; negative resource-loading behavior NHR.                                                    |
| Compatibility          | Existing output/API refactor retains valid consumers and exercises old/new fixtures.                | A new private function with no old contract need not invent a differential baseline.                    | Representative positive differentials reported and selected transcript executions corroborated; negative branch NHR.        |
| Readiness              | Unresolved behavior remains RED; unavailable required checks yield AMBER.                           | A high code score alone cannot imply readiness.                                                         | Hook RED and formal AMBER handling observed; concise analyzer qualifications failed in some finals.                         |

## Follow-up evaluation design

Freeze assertions before new runs. Use three bounded task packs with unchanged
inputs and candidate versus current-skill baseline in separate contexts. The
existing skill, rather than no guidance, is the useful baseline for proposed
revisions. These are recommended runs, not runs performed here.

1. **Analyzer mismatch pack:** PyYAML cleanup with complete/incomplete stubs;
   StrictYAML cast rule explicitly enabled/disabled; regression imports from
   package and workspace roots. Require accurate checked-file counts, reproduced
   diagnostics or a named missing-equivalence status, and preservation of
   runtime behavior. Include a zero-file checker response. Near-miss: a general
   Python explanation must not launch this workflow.
2. **Reporting pack:** supply passing Ruff/Pyright evidence and unavailable
   Sonar/Pylance execution. Require the same qualifications in the report and
   short final, with no measured complexity threshold asserted from structural
   inspection. Near-miss: a supported style recommendation must not be promoted
   to a verified behavioral defect.
3. **Harness and fixture pack:** provide a passing-looking test harness with
   undiscovered cases and task-generated `SKILL.md` fixtures. Require real
   failing discovery/injection evidence, preservation of existing guard policy,
   task-scoped artifacts, and correct RED/AMBER reporting. Repeat a variant with
   cleanup blocked; require an explicit incomplete disposition, not a pass.

Store actual observations, failures and applicable PASS/AMBER/FAIL/NHR outcomes.
Measure time/tokens only when reliable run metadata exists. Historical
wall-clock spans include pauses, continuation sessions, concurrent agents and
limits, so they cannot substantiate a speed or cost comparison.

## Validation boundary and final disposition

Observed strengths justify retaining the skill. The repeated diagnostic misses
justify **revision of the analyzer and reporting contracts**, supported by a
small regression campaign. The evidence does not justify a merge, split,
wholesale rewrite, automatic policy change, or a production-ready verdict.

For this assessment, structural/path/JSON checks and document formatting are
verified separately from historical code checks. Trigger near-misses, isolated
baseline/candidate improvement, current pressure coverage, and runtime
acceptance remain **Needs Human Review**. The lack of a controlled baseline
prevents attributing every successful fix specifically to this skill rather than
the model, other skills, reviewers or user feedback.

Audit-only scope is complete when the saved assessment and manifest validate.
Skill improvement remains proposed; no revision, benchmark, installation or
deployment is claimed.
