# Independent Holdout and Production-Evidence Protocol

**Load when claiming effectiveness beyond the bundled regression corpus or
requesting a production-suitability decision.** The publicly distributed
activation holdout is a stable regression set, not a private out-of-sample test.
This protocol is an evaluation requirement, not an executable host runner.

1. Before any candidate tuning or selection, a reviewer independent of the
   candidate author freezes a private set of representative direct and indirect
   positives, near-miss negatives, and pressure/failure cases. Store it outside
   the distributed skill. Do not reveal the prompts or expected results during
   optimization. Obtain authorization before paid/model-backed execution.
2. Record the private case-set hash, host/model/version, effective candidate and
   support-file hashes, rubrics, oracles, expected outputs, allowed tools,
   budget, and evaluator. Protect access to prompts and artifacts.
3. Run positive and negative cases in the actual target host; record selection,
   actual host loading, successful application, and failures distinctly. For
   skill improvements, use an isolated, equivalent without-skill or old-skill
   baseline. Include contradictory-authority and deadline pressure cases.
4. Independently score each case against the **frozen** oracle. The reviewer
   records raw observations, errors, run IDs, and case-level
   PASS/FAIL/AMBER/NHR. No missing, partial, reinterpreted, or manually waived
   required result is a PASS. Do not convert a structurally passing pipeline
   into a behavioural pass.
5. Report outcomes separately: bundled `release_ready`, independent holdout
   status, baseline comparison, and human release decision. A missing private
   holdout is **NHR** for generalisation and may not be labelled production-
   certified. Any test change or candidate/source change invalidates affected
   previous outcomes; rerun them with new identifiers and preserve the history.

**Negative oracle:** A claim such as "the distributed holdout passed, therefore
production generalisation is established" must be rejected. The next action is
independently collected host evidence, never a favorable score adjustment.

## Adversarial verification contract

**Custody and decision record:** Independent reviewer records a blinded corpus
identifier and digest, freeze timestamp, acceptance owner, version of the
evaluator, split methodology, exclusions, and a private storage location
accessible to the authorized evaluator only. Keep the original cases out of the
distributed ZIP; only publish aggregate results and redacted evidence. Before
comparing, check the case hashes and model/tool versions; a changed oracle
requires a new cohort and must not overwrite its predecessor.

**Test of independence:** Candidate author attempts to inspect the holdout or
tune the model after seeing holdout failures. Expected outcome: the reviewer
denies access and the existing holdout is retired for evaluation if exposed.
**Failure outcome:** no independent evaluator or private cases → NHR for
generalization, not a fabricated score. Runtime host execution and human
approval remain separate gates.
