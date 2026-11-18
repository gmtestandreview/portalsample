# Adversarial Quality Review for Agent Skills

**Load only for a scored, adversarial, auto-optimization, or release-claim
audit.** This review supplements the `skill-creator` authoring and evaluation
workflow; it does not change the installed skill identity, trigger contract,
evaluator schemas, client rules, or the authority of an explicitly supplied user
rubric. It is not a live evaluator and cannot certify activation or deployment.

## Freeze the authority and evidence before scoring

1. Identify whether the evidence is for a complete skill directory, one
   `SKILL.md`, a supporting file, or a partial excerpt. Only score criteria
   observable in that material; mark unknown coverage **NHR**, not FAIL.
2. Apply a user-supplied rubric _only within its stated scope_, without blending
   fallback weights. Record weights, anchors, comparator, threshold,
   effective-file hashes, target host, acceptance owner, and required gates.
3. If no user rubric applies, use the 100-point six-area **static quality**
   rubric below for the whole skill. A whole-skill score does not become a
   measured activation pass rate or a file-level score.
4. For per-file reviews, assess the actual role, caller, dependencies, failure
   behavior and test oracles. **If the user selects this six-area rubric for all
   first-party files, keep these exact six weights for every file**, including
   scripts, JSON schemas, cases, assets and templates; apply each category to
   its delegated contract rather than forcing the entire skill workflow into
   each file. Use an alternative file-level rubric only when no controlling user
   rubric applies. Genuine N/A needs an explicit reason and normalized
   denominator; lack of test evidence is NHR, never N/A.
5. Freeze positive/negative oracles _before_ candidate evaluation. If an oracle,
   effective reference, script, model, or runtime changes, invalidate dependent
   prior passes and rerun those cases; do not silently reuse old evidence.

## Default six-area static rubric (when no user rubric applies)

| Criterion                    |  Weight | Falsifiable evidence needed for full credit                                                                  |
| ---------------------------- | ------: | ------------------------------------------------------------------------------------------------------------ |
| Purpose                      |      15 | Distinct recurring problem, intended agent/user, non-goals and value beyond generic prompting                |
| Objective                    |      15 | Trigger and executable task; input/preconditions, authority and relevant exclusions                          |
| Goal and success state       |      15 | Observable completion criteria, preservation requirements and bounded stopping conditions                    |
| Test plan                    |      25 | Predeclared positive, near-miss, adverse, error, regression and output oracles; runnable checks or clear NHR |
| Self-review before execution |      15 | Challenges intended scope, highest-risk assumption, source authority, safety and weakest likely failure      |
| Expected output              |      15 | Exact useful artifacts, evidence provenance, results, blockers and handoff structure                         |
| **Total**                    | **100** | **Static instruction-quality estimate, not execution evidence**                                              |

Award whole-number points based on supplied text and tested facts. A clear minor
omission generally costs one point; material ambiguity limits the criterion to
about 74% of its weight; a major defect to about 49%; absent or contradictory
load-bearing behavior to about 24%. Explain each material deduction. If a
criterion is genuinely inapplicable, document why and normalize across remaining
applicable weights; missing evidence is **NHR**.

A static result of 97/100 or more is a _quality target_, not a safety or
production gate. A requirement to score `>96` means strictly 97 or higher. Any
behavior-critical **FAIL**, **AMBER**, or **NHR** blocks a `deploy` decision
irrespective of the static score. Do not invent a favorable score to satisfy an
optimization target.

## Adversarial preflight before changing a candidate

Challenge the most likely incorrect assumption and highest-cost failure first:

- **Intent/identity:** Is the target actually an Agent Skill, and is its
  registered `name`, directory, description boundary and provider stable?
- **Preservation:** What unique instructions, supporting files, tests,
  compatibility rules, and permission boundaries must survive?
- **Authority:** Is an explicit user rubric or platform specification in force?
  Are references illustrative, stale, generated, or actually deployable?
- **Execution:** Are required runtimes, scripts, fixtures, licensed assets,
  model APIs and test harnesses present? What must remain NHR?
- **Risk:** Could a script delete/overwrite data, call a paid service, disclose
  content, block a workflow, or misrepresent passing evidence?
- **Falsification:** Which positive and near-miss case would reveal a false
  trigger or broken dependency? What artifact proves the promised outcome?

Proceed with supported and reversible work. Pause only unsafe or materially
ambiguous actions, retaining the safe findings and candidate; preserve the
source bytes and record a rollback path. Do not treat evaluator-generated prose
or a rubric score as independent proof of behavior.

## Activation and load-boundary coverage (QAQ/RMI)

For each critical trigger and optional resource, establish a **direct
positive**, **indirect positive**, **similar near-miss negative**, and (where
applicable) **pressure/failure** case. Map each positive back to a governing
instruction (QAQ) and reverse-map the expected outcome to the request class
(RMI). Check no unrelated prompts load the skill or expensive references. Static
mapping is a design check, not observed host selection or loading. Record actual
activation only with a target-host trace.

For a pure Reference skill, retrieval/application and unsupported-query tests
may replace behavioral RED if appropriate; _non-fabrication_ and resource
selection still need demonstrable evidence. For rule-heavy skills, test whether
an agent skips tests when pressed for speed, authority, or confidence.

## Bounded optimize, verify and close

For an auto-optimization request, make the smallest justified corrections,
running available deterministic checks after each iteration. Default to at most
**three iterations**; stop sooner for no measurable improvement, safety or
authority conflict, lack of usable tools, unresolved requirements, or unchanged
failures. Rerun affected near-miss, negative and regression oracles rather than
only the edited positive case. Do not widen scope to fix a single false
negative; do not weaken tests or score rules.

Report a baseline/candidate score with criterion deductions _when the relevant
source and evidence exist_; changed-file inventory and hashes; verification
commands and actual output; effective runtime/client; PASS/AMBER/FAIL/NHR/N/A by
requirement; unresolved release gates; and one of
`deploy | revise | split | merge | deprecate | hold`. Deploy requires current
required deterministic **and** representative host behavioural checks, without
material NHRs. Distinguish producing an improved archive from updating an
installed plugin or certifying production readiness.

## Adversarial verification contract

**File-level worked example:** For `references/schemas/grading.schema.json`,
purpose means why the grading artifact exists; objective means its required
properties and type contract; goal means valid shape and honest limits of
structural checks; test plan means representative valid/invalid JSON plus
separate arithmetic semantics; self-review means challenge whether a schema can
prove grading truth (it cannot); output means a parseable, attributable
artifact. Score all six categories individually. A historically green schema
hash that differs from the current file is stale evidence, not a valid PASS.

**Negative oracle:** A user's request to score every file with this rubric must
not be silently redirected to a ten-category fallback. A file with unknown host
behavior may receive a static authoring score, but the live behavior remains NHR
and may block release. **Check:** Record the exact six criterion points
(15/15/15/25/15/15), each file hash, the version of the source and the required
runtime evidence state.
