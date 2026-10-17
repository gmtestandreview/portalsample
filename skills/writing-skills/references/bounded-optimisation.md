# Bounded optimisation and evidence preflight

Load for iterative skill optimisation, comparative evaluations, interrupted
campaigns, or final acceptance. Ordinary one-file edits need their affected
checks, not a model campaign. This is a local execution contract, not an Agent
Skills format requirement.

## One owner, bounded work

Record one methodology controller (`writing-skills`), target skill, human
acceptance owner, baseline revision, exclusions, exact requested score kind and
literal comparator/threshold, and mandatory gates. The target owns domain
decisions. `skill-creator` supplies only available specialist evaluation or
packaging capabilities; it is not a second controller. Do not assume an external
grader or runner exists. Report unrelated hook/security work to its separate
owner without adding it to this task.

Default: at most two optional evaluation waves, one focused evaluator and one
independent adversary. For each proposed wave, name the unresolved question and
how its answer could change acceptance. A new counterexample permits a focused
test; an easy baseline and GREEN both passing do not justify another full run.
Set the cap before dispatch; increases require a recorded material justification.
Use deterministic syntax/frontmatter/link/count checks first, and rerun only
affected checks for nonsemantic formatting.

Reserve closeout capacity before optional work (default 20% of a known time or
resource budget; choose and record a suitable unit). Stop optional dispatch when
remaining capacity is unknown or reaches the reserve. Do not infer provider token
limits from elapsed time. Continuously save a standalone checkpoint containing
candidate identity, changed paths, current evidence, failed/unverified gates,
pending evaluations, blockers and next action. Save it before the first optional
wave and refresh it after every stage; final delivery precedes optional polish.

## Freeze and retain evidence

Before dispatch, build a canonical dependency manifest: every candidate file
needed for the question, prompts, oracle, rubric, evaluator/tool/config/host,
revision and SHA-256 hashes. Load only those dependencies. An unchanged
entrypoint does not make a changed reference compatible.

Freeze expected cases before comparative execution. Corrected oracles get a new
version; retain the original bytes and results. Candidate/oracle/rubric/tool/host
changes invalidate affected comparisons, not unrelated checks. Recheck hashes
when results return and before publication. Never edit a dispatched snapshot.

Persist raw output first, then per-case grades with evidence references, then
summary and score. Missing raw output is NHR; a self-reported PASS is insufficient.
Reuse earlier evidence only when candidate, oracle, rubric, effective tools/host,
scope and measured behavior are compatible. Label other evidence historical or
stale; do not draw trends across incompatible score kinds or rubrics.

Record score kind, exact value, evaluator, candidate/oracle/rubric identity,
assessed evidence and comparator. Static/file, lifecycle, comparative, behavioral,
runtime and process scores are distinct. `96 > 96` fails; `96 > 95` passes only
the numeric gate. Keep discovery, loading, instruction application, resulting
artifact, runtime and final delivery separately evidenced. No number overrides
a mandatory HOLD gate.

## Read-only preflight

From `scripts/`, use the existing local environment:

```powershell
uv run skills-ref validate-evidence path/to/run.json --root path/to/evidence-root
uv run skills-ref validate-evidence path/to/run.json --root path/to/evidence-root --dispatch
```

Run the second form immediately before optional dispatch. The command checks
record consistency and current file identity. It does not start agents, lock
files, judge semantic correctness, meter provider usage, verify an asserted host,
or install/deploy anything. Exit 0 with `hold` means a consistent HOLD record.
The controller must honor a failed preflight; no automatic runner is installed.

All paths resolve inside the explicitly selected root (default: run JSON's
directory). Follow workspace secret-scanning policy before reading inputs.
Keep one record per evaluated candidate/oracle/rubric/environment combination:

| Field | Contract |
| --- | --- |
| `run_id`, `target`, `acceptance_owner`, `revision` | Nonempty identity; one accountable human owner |
| `controller` | `writing-skills` |
| `artifacts` | List of `id`, `role`, relative `path`, exact `sha256`; unique IDs; nonempty files. Include every relevant dependency and at least candidate, oracle, rubric, raw and checkpoint roles |
| `environment` | Nonempty `host`, `interpreter`, `tool`, `tool_version`, `config`, `rules`; positive integer `file_count`. Record unknown fields explicitly, never as a verified host |
| `evaluation` | `evaluator`, `kind`, frozen `expected_case_ids`, `cases`; kinds: static, lifecycle, comparative, behavioral, runtime, process |
| Each case | Unique `id`, `status`, `passed`, `evidence` referring to a raw artifact ID. PASS = literal true, FAIL = literal false, AMBER/NHR/N/A = null |
| `summary` | Exact counts for PASS, AMBER, FAIL, NHR and N/A; every expected case appears once |
| `score` | Null when unscored; otherwise `kind`, normalized `value` (0–100), literal `operator` (> or >=), `threshold` (0–100). Keep detailed rubric deductions in a hashed raw artifact |
| `gates` | All eight: static, behavioral, discovery, loading, application, artifact, runtime, delivery; each a result status |
| `budget` | Nonnegative integer `optional_waves`, positive integer `max_optional_waves`; positive `closeout_reserve`, nullable `remaining_capacity` in the same recorded unit; `uncertainty`, `acceptance_impact` required for dispatch |
| `telemetry` | `tokens`, `cached_tokens`: actual nonnegative integer counters or null; `agent_invocations`: integer; `elapsed_seconds`: nonnegative number |
| `recommendation` | deploy, revise, split, merge, deprecate or hold. Deploy requires every gate PASS, no AMBER/FAIL/NHR case, and a met score target when supplied |

Do not translate null into a Boolean failure, round scores across a threshold,
or rewrite counts to match a desired verdict. Unsupported winner claims are
rejected; a specialist benchmark needs its own verified comparison arithmetic.
This preflight is not a replacement for an unavailable specialist aggregator.

Report exact token/cache usage only from available counters. Otherwise use null
and label agent invocations/case IDs/elapsed time as observations, not measured
token cost or savings.

## Closeout

Deliver exact revision and manifests, all requested fix dispositions, fresh
checks and raw evidence, current scores with provenance (or unscored), independent
gate table, blockers, one recommendation and one restart checkpoint. Human release
acceptance remains with the skill owner. Do not rerun merely to improve a number.
