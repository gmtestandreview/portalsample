# Devil's Advocate SKILL rubric — 100 points

Use only when requested or explicitly selected. This is an **adversarial design
rubric**, not a release certificate. The attached/user-supplied rubric takes
precedence over conflicting local default rubrics; freeze its weights before
scoring and preserve the baseline. This reference preserves its six questions
and test expectations.

| Area                         | Points | Core question                                           | Full-credit evidence                                                                                                          |
| ---------------------------- | -----: | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Purpose                      |     15 | Why must this capability exist?                         | Distinct reusable problem; absence has a concrete consequence; not generic model knowledge                                    |
| Objective                    |     15 | What precisely does activation accomplish?              | Executable action, target, scope, exclusion and preservation constraints                                                      |
| Goal / success state         |     15 | How is done different from looks done?                  | Before state, intended change, observable invariant and falsifiable completion                                                |
| Test plan                    |     25 | What could disprove correctness or reveal a regression? | Predeclared expected outcomes, positive/indirect positive, near-miss, edge, failure, pressure, regression and artifact checks |
| Self-review before execution |     15 | What assumption or error must be challenged first?      | Operational intent, scope, evidence, constraints, risk, validation and output gate                                            |
| Expected output              |     15 | What verifiable deliverable is required?                | Named artifact, content, form, evidence, explicit states, completion condition and blocker disclosure                         |

## Scoring anchors

Within **each** weighted category, award 100% for clear, bounded, adversarially
robust evidence; 75% for a meaningful ambiguity; 50% when successful execution
requires agent inference; 25% for generic/aspirational content; and 0% when
absent, contradicted, or misleading. Preserve precise per-category awarded
points and state the rounding rule. Do not boost points to meet a target.

Use these outcome states independently of numeric points: **PASS** = direct
sufficient evidence; **AMBER** = partial, ambiguous, fragile or inconsistently
enforced; **FAIL** = materially absent, contradictory, or incorrect; **NHR** =
required evidence unavailable; **N/A** = genuinely not applicable with
rationale. Missing evidence is not `N/A`. A high score never overrides critical
FAIL/NHR.

## Falsifiable evaluation matrix

For each critical instruction, trigger, branch and load condition, predeclare:

1. **Positive:** direct in-scope request and correct behavior.
2. **Indirect positive:** natural wording without exact activation keywords.
3. **Near-miss:** adjacent request that must **not** trigger the skill/branch.
4. **Edge:** unusual but supported input and preserved invariants.
5. **Failure:** incomplete, invalid, unavailable or unsafe input; stop/fallback.
6. **Pressure:** time, authority, confidence, sunk-cost, or shortcut request.
7. **Regression:** old positive and exclusion cases rerun after changes.
8. **Output:** independently inspectable artifact and acceptance criteria.

For QAQ/RMI, map a positive to its exact governing instruction and expected
outcome; confirm the near-miss does not trigger it; reverse-map the expected
behavior to the intended request class. Record unresolved mapping as AMBER, FAIL
or NHR. A written case or static mapping is **not** an observed runtime
activation test. RED/GREEN requires captured, comparable runs or remains NHR.

## Operational self-review

Before consequential work, challenge: actual intent; over-broad scope; missing
files/permissions; higher-precedence constraints; potential destructive impact;
whether planned tests are executable; likely false success claims; and the exact
required deliverable. If uncertainty materially changes the action, stop that
action and report what would resolve it.

## File-by-file application

For a supporting reference, template, script, test, evaluation case, or
configuration file, score its **own delegated role**, not whether it repeats the
entire main skill. Purpose = why the file exists; objective = task/interface or
consumer; goal = correct output/invariant; test plan = role-appropriate
validation or relevant tested caller; self-review = risk/assumption controls in
file or verified consuming workflow; expected output = resulting artifact,
interface or observation. Include specific path/line evidence and a realistic
counterexample. Tiny supporting files can receive supported credit through an
explicit, inspected consumer contract. Unknown runtime behavior remains NHR.

Inventory every first-party file, including scripts/tests/config/lock/assets;
exclude generated caches, virtual environments, compiled code, and runtime logs
with an explicit exclusion count. Score changed and newly introduced files. The
package passes a per-file target only if its **minimum** file score meets it;
aggregate or average scores cannot conceal a low-scoring file.

## Critical blockers

Treat as blocking regardless of points: contradictory purpose, indistinguishable
scope, no observable success, untestable critical behavior, absent near-miss
activation evidence, high-impact side effects without pre-execution review and
authorization, evidence-free output success, or a material unresolved ambiguity.

Score bands: 97–100 adversarially robust; 90–96 strong with targeted hardening;
80–89 material ambiguity; 70–79 fragile; 50–69 major redesign; below 50 not
reliable. Target `>96` means **at least 97**, but missing behavioral evidence
may independently block `deploy`.

## Reviewer output contract

For each examined file provide its role, six category scores and statuses,
source-specific evidence, realistic negative test, observed execution (or NHR),
unique findings, before/after deltas, and any blocker. For the entire package
provide revision hashes, exact changed paths, exclusion inventory,
executed/unexecuted checks, worst individual score, remaining risks, and exactly
one recommendation: `deploy | revise | split | merge | deprecate | hold`.
