# SWOT Analysis: writing-skills vs skill-creator

Keep both packages, with explicit division of responsibility. **writing-skills
scores 97/100; skill-creator scores 79/100** under the shared comparison rubric.
Their general authoring scope partially overlaps, but their distinctive
capabilities justify separate packages. skill-creator needs targeted corrections
before its benchmark results and runtime references can be trusted without
additional checks.

## Scope and recommendation

This report fills the
[SWOT Analysis template](../../skills/writing-skills/templates/SWOT%20Analysis.md)
and uses the ten weights from the existing
[file review rubric](../../skills/writing-skills/references/file-review-rubric.md).
The assessment date is **2026-10-05**. Both complete package inventories are
included; this is an audit, with no package optimization, merger, deployment, or
policy changes.

| Item                       | Skill A: writing-skills                                                                                                     | Skill B: skill-creator                                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Reviewed entrypoint        | [skills/writing-skills/SKILL.md](../../skills/writing-skills/SKILL.md)                                                      | [.claude/skills/skill-creator/SKILL.md](../../.claude/skills/skill-creator/SKILL.md)                                                 |
| Entry SHA-256              | `6c88261f730b88e71f157b312b1813d6ba4121ebf56d2acf8d6850093f32fe3e`                                                          | `2e6f77aae770071e10c011b45afd250eb5b99d91c57ddce12cf0a73cf945b80b`                                                                   |
| Inventory                  | 54 owned files                                                                                                              | 129 checkout files: 56 outside root `evals/`, 73 development/evidence files inside it                                                |
| Completeness               | Entrypoint, references, examples, templates, scripts, tests, configuration, lockfile, seeded evals and historical campaigns | Entrypoint, references, schemas, agent protocols, scripts, regression tests, viewers/assets, eval definitions and retained campaigns |
| Distribution qualification | Runtime environments, caches and ignored execution state excluded from inventory                                            | Packager excludes root `evals/`; the 129-file checkout is not a 129-file runtime payload                                             |
| Exact package revision     | [SHA-256 inventory](2026-10-05-writing-skills-vs-skill-creator-manifest.json)                                               | Same manifest records every inventoried file                                                                                         |

The working-tree revision is authoritative: HEAD was
`ef53dd8f9700bfd6064b956a098a345ae1d8154c`, but pre-existing uncommitted
writing-skills changes were present. All 54 writing file hashes match the
preceding [per-file review](2026-10-05-writing-skills-package-scores.json). That
review supplies retained file-level findings; fresh checks below supplement it.
The comparison does not average those scores or award a new individual score to
every creator file.

Creator's primary instructional resources and tooling were inspected
independently. All 22 stored activation-result JSON summaries were checked for
count consistency; four historical behavioral transcripts were examined for
invocation/result provenance. Historical raw transcripts were not fully regraded
as new campaigns. Both inventories were scanned for secrets before source
inspection; no issues were reported. The stale TokenSave graph was not updated
or treated as current evidence.

Confidence is high for source contracts, local test results and reproduced
defects; limited for natural activation and cross-client effectiveness. Neither
package receives a current production-readiness PASS. The recommended
disposition is **keep separate, intentionally compose when both specializations
are needed; hold merger and unsupported readiness claims**.

## Purpose, goals and expected outcomes

| Dimension          | writing-skills                                                                                                                                                | skill-creator                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary purpose    | Evidence-based authoring discipline across the skill lifecycle                                                                                                | Authoring supported by executable evaluation, benchmark, review and packaging tools, plus a conditional Claude Code integration branch                      |
| Goal               | Produce a justified, scoped skill and an honest validation/disposition decision                                                                               | Produce useful instructions, empirical comparison artifacts and a validated distribution without overstating readiness                                      |
| Inputs             | User intent, supplied skill/resources, target runtime, requirements, baseline and available evidence                                                          | Same authoring inputs; frozen eval prompts/expectations, isolated runs, outputs/transcripts, timing/metrics and explicit feedback                           |
| Expected outputs   | Artifact when revision is authorized; ten-stage assessment; role-aware findings/scores; fresh checks; deploy/revise/split/merge/deprecate/hold recommendation | Artifact when authorized; grading/comparison/analysis/benchmark JSON; review and feedback UI; `.skill` archive; bounded readiness verdict                   |
| Distinctive value  | Classification, knowledge delta, QAQ/RMI boundary mapping, instruction-form decisions, pressure tests, per-file rubric and controlled auto-optimization       | Initializer, paired-run aggregation, grader/comparator/analyzer protocols, schemas, viewers, trigger-description tooling and reproducible fixture packaging |
| Scope limits       | Excludes ordinary Markdown, generic linters and agent-role definitions; installer preference for Codex installation                                           | Excludes ordinary code/doc edits and non-skill activation; Claude hooks/rules are local, not universal specification                                        |
| Validation meaning | Deterministic validators/tests check structure and tools; behavioral/client evidence remains a separate gate                                                  | Schemas and regression suites check tools; actual runs and current-revision activation must independently support behavioral claims                         |

Sources: [writing entrypoint](../../skills/writing-skills/SKILL.md), especially
lines 19–42 and its ten stages;
[writing reference index](../../skills/writing-skills/references/index.md);
[creator entrypoint](../../.claude/skills/skill-creator/SKILL.md), especially
lines 9–62 and its resource map;
[creator evaluation workflow](../../.claude/skills/skill-creator/references/evaluation-workflow.md);
[creator schema contracts](../../.claude/skills/skill-creator/references/schemas.md).

## SWOT comparison

Strengths and weaknesses describe internal package properties. Opportunities and
threats describe external conditions; proposed opportunities are hypotheses, not
measured benefits.

| Category      | Skill A: writing-skills                                                                                                                                                                                                             | Skill B: skill-creator                                                                                                                                                                                                                                                     | Evidence / consequence                                                                                                                                                                                                                                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strengths     | Coherent ten-stage workflow, clear authority boundaries, risk-based testing, honest NHR gates and bounded auto-optimization. Detailed routing keeps specialist material conditional.                                                | Concrete eval/benchmark/package tools, blinded comparison protocols, canonical JSON shapes, human review interfaces and retained actual Claude Skill invocation evidence. Lightweight edits need not force full benchmarks.                                                | Entry contracts above; A's [testing checklist](../../skills/writing-skills/references/SKILL-testing-checklist.md); B's [comparator](../../.claude/skills/skill-creator/agents/comparator.md), [analyzer](../../.claude/skills/skill-creator/agents/analyzer.md) and historical evidence in the evidence appendix. Fresh local suites pass for both. |
| Weaknesses    | Broad authoring triggers overlap creator's. Some conditional guides repeat examples/checklists. Historical campaigns cannot be completely reconstructed from bundled dispatch/transcript evidence, although that limit is explicit. | Aggregation accepts contradictory grading truth; comparator prose conflicts with its schema; numbered evaluation ordering is inconsistent; hook guidance is outdated; 18 reference links are broken. Current-description activation lacks a completed acceptance campaign. | Findings W1–W3 and C1–C10 below. Passing test counts do not rebut independently reproduced counterexamples.                                                                                                                                                                                                                                         |
| Opportunities | Hypothesis: use A as the authoring/review contract while specialist tools implement selected checks. Provider-neutral requirements can survive changes in runtime tooling.                                                          | Hypothesis: retain B as the empirical/tooling companion, with a documented mapping from A's seeded evaluation records to B's JSON artifacts and explicit missingness/revision fields.                                                                                      | Existing repository policy already calls for both on eval/benchmark/package/readiness work. A's [logical testing model](../../skills/writing-skills/references/skill-testing-data-model.md) and B's schema catalog are distinct contracts; no automatic adapter or integration benefit is claimed.                                                  |
| Threats       | External host discovery conventions and changing provider/specification rules can invalidate assumptions. Two broad descriptions can cause duplicate work if orchestration has no owner.                                            | External Claude CLI availability, provider rate limits and protocol changes can prevent current evidence or invalidate local hook guidance. Historical 429 records demonstrate past interruption, not present service status.                                              | [Agent Skills specification](https://agentskills.io/specification) and [current Claude hook protocol](https://code.claude.com/docs/en/hooks); historical after-exclusion runs are retained in B's development evidence. No fresh provider campaign was run here.                                                                                    |

## Shared rubric and scores

The weights are unchanged. **The unit here is the integrated package**, applying
each criterion to its documented role and resource/tool contracts. This is an
explicitly adapted comparative use of the file rubric, not the separate
14-criterion lifecycle rubric, a mean of file scores, or a new per-file
certification. All ten criteria apply; maximum = 100; no normalization is
needed.

Scores measure authoring/tool/resource quality. Honest missing runtime evidence
is not scored as a runtime success. A documented NHR can coexist with a high
quality score and still block release. The prior requirement that each updated
writing file exceed 96 remains a separate 54-file assessment; this comparison
neither extends that certification to creator nor silently fixes it to reach the
target.

| Criterion                                      |     Max |      A |      B | Basis for deductions / credit                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------- | ------: | -----: | -----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose and boundaries (P)                     |      10 |      9 |      9 | W1/C0: both descriptions cover general authoring; neither entrypoint states the cross-package execution ownership. Local policy gives specialties, but a concrete handoff is still implicit.                                                                                                                                     |
| Domain value and context cost (K)              |      10 |      9 |     10 | W2: bounded recap/example duplication in A. B's executable machinery, protocols and retained history have distinct value; excluded history is not penalized as runtime context.                                                                                                                                                  |
| Inputs, outputs, expected outcomes (C)         |      15 |     15 |     11 | C2: B's steps execute and freeze metadata before the later “Define expectations” step, despite earlier frozen expectations. Material dependency ambiguity: retained at most 74% of 15.                                                                                                                                           |
| Correctness and authority (A)                  |      15 |     15 |     11 | C1/C3: contradictory grading can yield 100%; hook protocol claims conflict with current official documentation. Material cap applied jointly, without scoring the same aggregation failure again under V.                                                                                                                        |
| Usability and discovery (U)                    |      10 |     10 |      8 | C7/C8: long conditional protocols lack the contents navigation their craft reference requests; trigger-review controls have static label/focus issues. One point each. No browser accessibility certification claimed.                                                                                                           |
| Failure handling and proportional controls (R) |      10 |     10 |      8 | C6/C9: local execution state can enter fixture archives; malformed trigger-review input produces an uncaught traceback. Two localized deductions; no actual sensitive distribution is alleged.                                                                                                                                   |
| Validation and evidence integrity (V)          |      15 |     14 |     11 | W3: A's admitted historical reconstruction gap, one point. C5: B's permanent validation PASS record lacks revision/command/time provenance and historical “current” activation closeout covers different description bytes; material applicability gap. Absence of a fresh provider run alone is not the differential deduction. |
| Package integration (I)                        |       5 |      5 |      3 | C4/C10: no-expectations comparator instructions contradict the required schema field; validator and evaluator decode YAML differently. Material cap covers the related producer/consumer inconsistencies.                                                                                                                        |
| Maintainability (M)                            |       5 |      5 |      4 | C11: portable craft's unqualified provider-discovery claim lacks a sufficiently bounded provider applicability statement. One localized maintenance deduction, separate from measured result provenance.                                                                                                                         |
| Mechanical integrity (F)                       |       5 |      5 |      4 | C12: 18 broken links in six local-runtime reference footers. Main resource routing still works, so one bounded deduction rather than a core-navigation failure.                                                                                                                                                                  |
| Total                                          | **100** | **97** | **79** | Numeric quality does not clear failed or NHR readiness gates.                                                                                                                                                                                                                                                                    |

Evidence states by criterion are in the
[score record](2026-10-05-writing-skills-vs-skill-creator-scores.json). Document
contracts are Supported; fresh deterministic outcomes are Verified; demonstrated
defects are Failed; current natural activation remains NHR. These states are
scoped, not blanket labels for every behavior in a criterion.

## Devil's-advocate findings

Each deduction identifies a specific consequence; multiple observations in a
material criterion share its cap. Ancillary examples are listed to guide
correction, not multiplied into extra penalties.

| ID      | Source and observed counterexample                                                                                                                                                                                                                                                                                   | Consequence and bounded correction                                                                                                                                                                                                                                                                                                                                                                                  |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1 / C0 | A entrypoint lines 4–8, 38–42; B entrypoint line 3. “Create and evaluate an Agent Skill” falls within both descriptions.                                                                                                                                                                                             | Two workflows can duplicate authoring or grading. Document intentional composition: A owns authoring/review requirements, B owns the selected empirical/package implementation. This is source mapping, not a measured activation collision.                                                                                                                                                                        |
| W2      | A's [creator best practices](../../skills/writing-skills/references/best%20practices-for-skill-creators.md) contains repeated PDF illustrations; [quality criteria](../../skills/writing-skills/references/best-practices-evaluations.md) repeats a final recap. Hash-matched prior review records the bounded cost. | Conditional loading limits the cost. Consolidate only when it preserves distinct teaching/decision value; no arbitrary line-limit deletion.                                                                                                                                                                                                                                                                         |
| W3      | A's [October campaign](../../skills/writing-skills/evals/campaigns/authoring-review-2026-10-04.md), lines 343 onward, explicitly lacks complete dispatch wrappers/raw transcripts.                                                                                                                           | Entire historical campaign is not independently reconstructable. Preserve history and capture exact prompts, revisions and transcripts for the next current-runtime campaign. Do not invent a reconstruction.                                                                                                                                                                                                       |
| C1      | [aggregate_benchmark.py](../../.claude/skills/skill-creator/scripts/aggregate_benchmark.py), lines 500–533 and 990–1008. Independent fixture supplied one `passed:false` expectation and a summary claiming one pass; CLI exited 0 and emitted 100%. Output also passed the benchmark schema.                        | Arithmetic/shape checks cannot establish grading truth. Reject modern summary counts inconsistent with expectation Booleans; keep any legacy absent-expectations branch explicit. Add an independent negative fixture.                                                                                                                                                                                              |
| C2      | [evaluation-workflow.md](../../.claude/skills/skill-creator/references/evaluation-workflow.md), lines 113, 152 and 183. Step 1 has expectations and later steps call them frozen, yet step 6 instructs definition after runs and metadata.                                                                           | Sequential readers receive conflicting dependencies. Define/refine and freeze expectations before execution; preserve the existing prohibition against designing them around observed outputs. This is ambiguity, not evidence an actual run tuned its expectations.                                                                                                                                                |
| C3      | [hook-mechanisms.md](../../.claude/skills/skill-creator/references/claude-code-hook-mechanisms.md), lines 179–194: “Other” exit codes block; exit 2 is the only context channel.                                                                                                                                     | Current official protocol says other exit codes do not block on their own for most events, and structured JSON can supply decisions/context. Correct and version-bound the reference; inspect actual project hook implementation before claiming enforcement. [Official hooks reference](https://code.claude.com/docs/en/hooks#other-exit-codes), [JSON output](https://code.claude.com/docs/en/hooks#json-output). |
| C4      | [comparator.md](../../.claude/skills/skill-creator/agents/comparator.md), line 350 says omit `expectation_results`; [comparison schema](../../.claude/skills/skill-creator/references/schemas/comparison.schema.json), lines 8–14 requires it. Independent schema probe rejects that branch.                         | A producer cannot obey both. Define an optional field or canonical empty/failure shape and align consumers. Also reconcile the illustrative 5.4/5 score and five-total/one-detail example at comparator lines 295–344; schema validity does not ensure semantic consistency.                                                                                                                                        |
| C5      | [validation-results.json](../../.claude/skills/skill-creator/references/validation-results.json) contains PASS maps without command/time/revision. [September closeout](../../.claude/skills/skill-creator/evals/runs/2026-09-21/closeout-summary.md), lines 5 and 31 refers to an earlier description.              | Neither is current-revision acceptance. Preserve original records and add a hash-bound applicability index. Current-description after-exclusion records show train 0/20 and holdout 0/16 completed; near-miss 1/20 completed, with 19 errors and zero of five cases passing. These are historical observations, not a diagnosis of today's API.                                                                     |
| C6      | [package_skill.py](../../.claude/skills/skill-creator/scripts/package_skill.py), lines 31–44 and 138–165. Task-owned `.venv/pyvenv.cfg`, `.git/config` and `.tokensave/branch-meta.json` entered a fixture archive; root evals were excluded.                                                                        | Conditional distribution hygiene gap. Extend documented execution-state exclusions or use an explicit resource allowlist; verify actual archive members. The real packages were not archived/deployed here.                                                                                                                                                                                                         |
| C7      | [authoring-craft.md](../../.claude/skills/skill-creator/references/authoring-craft.md), line 185 requests contents navigation for long references, but evaluation workflow, schema catalog and agent protocols lack a section map.                                                                                   | Targeted loading is harder. Add navigable branch/section maps without deleting unique methodology.                                                                                                                                                                                                                                                                                                                  |
| C8      | [eval_review.html](../../.claude/skills/skill-creator/assets/eval_review.html), lines 94–123. Row textarea/checkbox lack accessible labels; positive insertion sorts rows but focuses the last textarea.                                                                                                             | Static evidence supports label/focus defects. Name controls by row and focus the inserted row's stable identity; verify keyboard/assistive interactions after correction. Browser behavior was not freshly exercised in this audit.                                                                                                                                                                                 |
| C9      | [generate_eval_review.py](../../.claude/skills/skill-creator/scripts/generate_eval_review.py), lines 86–98. Invalid `should_trigger` fixture exits nonzero through an uncaught TypeError traceback.                                                                                                                  | Input rejection works, but CLI failure presentation is inconsistent. Catch expected input errors at the boundary and retain nonzero status.                                                                                                                                                                                                                                                                         |
| C10     | [utils.py](../../.claude/skills/skill-creator/scripts/utils.py), lines 70–114 versus [quick_validate.py](../../.claude/skills/skill-creator/scripts/quick_validate.py), lines 55–75. A valid double-quoted YAML description validates but evaluator parsing retains literal escape sequences.                        | Evaluation can use different description text. Share a YAML-aware parser or align accepted grammars; test decoded equality at the consumer boundary.                                                                                                                                                                                                                                                                |
| C11     | [authoring-craft.md](../../.claude/skills/skill-creator/references/authoring-craft.md), lines 65–70 makes an absolute name/description-only invocation claim.                                                                                                                                                        | Scope guidance to pre-invocation discovery and provider controls; avoid treating loaded-body/application guidance as universally useless. Current provider frontmatter has invocation controls. [Official skill controls](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill).                                                                                                                      |
| C12     | Six `claude-code-*.md` Related Files sections: advanced 224–226; hook 316–318; patterns 176–178; rules 333–335; trigger 317/318/320; troubleshooting 578–580.                                                                                                                                                        | Eighteen relative links point to `references/SKILL.md` or obsolete uppercase names. Use `../SKILL.md` and current siblings, then verify links/anchors.                                                                                                                                                                                                                                                              |

One additional contract caution carries no separate penalty:
[run_eval.py](../../.claude/skills/skill-creator/scripts/run_eval.py), lines
1000–1106 and 1224–1258, returns exit 0 for report generation even when a mocked
worker fails. Its JSON truthfully reports `completed_runs:0`,
`execution_errors:1`, `pass:false`. Consumers must inspect the result fields;
zero exit is not evidence of evaluation PASS. This may be an intentional
reporter convention, not falsified evidence.

## Duplication classification and proposed boundary

| Pair                           | Classification      | Trigger / outcome overlap                                                              | Distinct specializations                                                                                                                                                       | Disposition                                                              |
| ------------------------------ | ------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| writing-skills ↔ skill-creator | **Partial overlap** | Both create/revise/evaluate Agent Skills and return artifacts plus readiness decisions | A: discipline, ten-stage gates, quality/per-file rubrics and class-specific tests. B: executable eval/benchmark/package mechanisms and conditional Claude runtime integration. | Keep both; document intentional composition and shared output ownership. |

Counts: **2 skills, 1 pair, 0 true duplicates, 1 partial overlap, 0 pure
complementary pairs, 0 false positives, 0 NHR classifications; 1
boundary/handoff clarification recommended**. The
[duplication-audit rule](../../skills/skill-duplication-audit/SKILL.md) reserves
“complementary” for requests that would not normally trigger both; practical
companion use does not erase this pair's broad trigger overlap.

| Representative request                                                        | Proposed owner and handoff                                                                                                                        | Assessment limit                                                              |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Assess boundaries, domain value, pressure cases and scores through ten stages | A owns the authoring/review contract; B joins for a selected executable eval or package check                                                     | Source-supported responsibility proposal                                      |
| Run paired output benchmarks, blind review and build a `.skill` artifact      | B owns implementation/artifact contracts; A supplies applicable authoring requirements and readiness gates                                        | Current B contract defects must be corrected first                            |
| Create and evaluate a reusable Agent Skill                                    | Intentional composition: one shared baseline and authoring change owner; A defines acceptance, B runs selected tools; both cite the same revision | No duplicate edits, competing verdicts or automatic schema conversion assumed |
| Diagnose Claude Code PreToolUse enforcement                                   | B's local runtime branch after inspecting registered configuration/hooks; A checks portable boundaries if content changes                         | No universal host-protocol assumption                                         |
| Proofread an ordinary README                                                  | Neither skill applies on that fact alone                                                                                                          | Near-miss source mapping, not a fresh natural-activation test                 |

This implements the repository's existing stated specialties as a proposed
operating boundary; it changes no trigger description, registration or canonical
policy.

## Preservation and conflicts

| Unique item / conflict                                                                          | Source                                | Treatment / resolution                                                                             | Evidence                                                                                                    | Unresolved risk                                                          |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Ten stages, class-specific tests, QAQ/RMI, instruction form, audit and per-file gates           | A main/references/evals               | Preserve under A's ownership                                                                       | Coherent authoring contract and hash-matched file review                                                    | Loss would weaken discipline and scoring meaning                         |
| Grader/comparator/analyzer, JSON schemas, aggregation, viewers, initializer and archive builder | B agents/references/scripts/viewers   | Preserve under B; correct demonstrated contracts before reuse                                      | Fresh tests and independent fixtures                                                                        | A full merger could discard useful implementation or retain defects      |
| Actual historical Skill invocations, failed runs and 429 evidence                               | B `evals/runs/`                       | Preserve immutable development history; add applicability annotations rather than rewrite outcomes | Historical readiness-pressure GREEN transcript includes Skill invocation; stored result summaries reconcile | Historical result mistaken for current acceptance                        |
| Claude-specific hooks/rules/session-skips branch                                                | B runtime references                  | Keep conditional; correct current protocol and broken links                                        | Entrypoint explicitly limits branch; C3/C12 demonstrate drift                                               | Cross-host misuse or false enforcement confidence                        |
| Broad authoring triggers / duplicated methodology                                               | Both entrypoints and authoring guides | Clarify composition first; consider shared guidance only after preservation review                 | Partial-overlap classification                                                                              | Duplicate work and conflicting completion rules                          |
| A seeded/logical evidence records versus B JSON artifacts                                       | A model/evals; B schemas              | Document an explicit mapping if integrated; preserve result, missingness and revision semantics    | Both models have unique roles; no shipped automatic bridge identified                                       | Silently conflating authoring scores, empirical pass rates and readiness |
| Canonical schemas versus prose/examples                                                         | B comparator/workflow/tooling         | Resolve before merge/integrated automation                                                         | C1/C2/C4/C10                                                                                                | Shape-valid but semantically false comparisons                           |

## Fresh validation and evidence limits

| Check                                                                                                               | Actual result                                                                                                                      | What it establishes / does not establish                                                             |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| A: `uv run --offline pytest --basetemp <task-scratch>/writing-tests`, cwd `skills/writing-skills/scripts`           | **141 passed**, exit 0                                                                                                             | Current deterministic package tests; no natural activation or measured agent benefit                 |
| B: `python -B -m unittest scripts.test_regressions`, cwd creator root                                               | **15 passed**, exit 0                                                                                                              | Smoke/regression behavior, not a comparative quality ranking                                         |
| B: `python -B -m pytest "scripts/Regression tests" -q -p no:cacheprovider --basetemp <task-scratch>/creator-pytest` | **143 passed, 1 skipped, 231 subtests passed**, exit 0                                                                             | Local regression suite; POSIX permission-bits test is justified unavailable on Windows               |
| B local quick validator                                                                                             | **PASS**, exit 0                                                                                                                   | Creator entrypoint format; not the unrelated global creator validator variant                        |
| B schema checks / representative artifacts                                                                          | Eleven schemas valid; representative paired benchmark conforms                                                                     | Structural validity; independent C1/C4 probes expose semantic/contract limits                        |
| Independent fixtures                                                                                                | Reproducible package, root eval exclusion, invalid-input guards, escaped report output; C1/C4/C6/C9/C10 counterexamples reproduced | Task-owned evidence, no live API calls and no actual package installation                            |
| Historical evidence review                                                                                          | All 22 result summary counts consistent; selected actual Skill invocations verified                                                | Historical provenance only; ambiguous PASS row labels need explanatory errata, not fabricated reruns |
| Current target-client activation / paired behavioral campaign                                                       | **NHR** for both packages                                                                                                          | Not executed here. Historical older-description PASS is not current acceptance                       |
| Source preservation and report integrity                                                                            | Manifest and final verification recorded in evidence JSON                                                                          | Existing package bytes preserved; new comparison deliverables only                                   |

Exact command/results, fixture observations, independent reviewer scopes and
limitations are retained in the
[evidence record](2026-10-05-writing-skills-vs-skill-creator-evidence.json).
Test totals reflect different suite designs and are not comparable measures of
effectiveness. No measured context savings, activation improvement, cross-client
safety, merger success or current production readiness is claimed.

## Decision gates

| Gate                             | Required?                | Outcome                                                          | Actual evidence / limitation                                                                   | Next action                                                             |
| -------------------------------- | ------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Purpose/scope alignment          | Yes                      | **PASS for separate companion disposition**                      | Shared authoring domain; substantive unique specialties; partial overlap                       | Document cross-package responsibilities                                 |
| Unique material preserved        | Yes for merge/retirement | **N/A: neither performed**                                       | All inventoried source bytes retained; preservation plan above                                 | Check each unique contract if a future merge is requested               |
| Material contradictions resolved | Yes for merge            | **FAIL**                                                         | C1–C4/C10 remain unmodified                                                                    | Correct and independently retest before merger or integrated automation |
| Final candidate validated        | Yes for readiness        | **NHR for current behavioral readiness; targeted B checks FAIL** | Both local suites pass; current provider activation absent; reproduced creator defects persist | Repair defects, then run claim-matched current-runtime campaigns        |

Separate disposition is supported now. A merge or production-readiness claim is
not. A 97 quality score does not clear A's NHR, and B's passing regression
suites do not clear its reproduced defects.

## Specific actions

These are recommendations, not changes performed by this audit.

1. **Correct benchmark truth and comparison contracts first** (C1/C4/C10).
   Verifier: negative contradictory-grading fixture must reject; no-expectations
   comparison must satisfy synchronized prose/schema; valid YAML descriptions
   must decode identically.
2. **Resolve workflow ordering and reference drift** (C2/C3/C7/C11/C12).
   Verifier: freeze expectations before execution, navigate each long branch,
   check current official protocol and all actual relative links. Preserve
   unique local material.
3. **Bound packaging and review-input behavior** (C6/C8/C9). Verifier: archive
   membership fixtures exclude execution state; invalid input yields concise
   nonzero error; inserted rows retain focus and accessible names.
4. **Publish a revision-bound evidence applicability index** (C5/W3). Verifier:
   each current assertion identifies hashes, command/runtime, actual observation
   and date; historical records remain unchanged. Fresh checks must not silently
   upgrade old campaigns.
5. **Record intentional composition without duplicating workflows** (W1/C0).
   Verifier: representative create/review/benchmark/package and near-miss
   requests have one change owner, distinct contributions and one consistent
   final verdict. This requires an explicit future scope for policy/description
   changes.
6. **Run a current-runtime acceptance campaign after corrections.** Verifier:
   frozen train/holdout/near-miss cases and independent without-skill/with-skill
   runs retain actual invocation, output and failure evidence for the exact
   revision; unresolved required outcomes remain HOLD/NHR.

The ten-stage authoring workflow informed boundary, justification,
classification, knowledge delta, observed failure, structure, instruction form,
test and validation analysis. Stage 10's audit-only branch applies: proposed
fixes are reported, and auto-optimization is not silently invoked for this
comparison.
