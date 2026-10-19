# Compact Python completion contract

Load for a **final completion** of a substantive Python task. Do not load for an
interim code comment or a brief conceptual explanation without changed code.

Give the shortest truthful completion covering:

1. **Artifact and outcome:** exact reviewed/changed file(s) and the result.
2. **Executed evidence:** checks actually run, with meaningful artifact, tool,
   config/rule, environment, and checked-file coverage qualifications. For
   analyzer claims, follow `ruff-pyright-verification.md` when applicable.
3. **Gaps:** required checks not run, editor/CLI non-equivalence, and blockers.
4. **Compatibility and status:** contract impact and residual RED (known material
   defect), AMBER (required evidence missing), or GREEN (all applicable gates
   evidenced) **only for formal review/remediation**. Simple implementation,
   explanation, and test-writing need no review pressure color.

Keep caveats adjacent to the claim: “strict Pyright reproduction passed;
Pylance not run,” or “complexity reduced; Sonar threshold not verified.”
Do not infer analyzer/host readiness from static inspection. If generated
artifacts were involved, state their disposition (removed, retained with
owner/purpose, or blocked).

An illustrative final (not execution evidence):
> Updated `module.py`; focused tests passed on the reported fixture. Strict
> Pyright CLI checked one intended file; Pylance was not run. No public API
> change; editor equivalence remains unverified (AMBER for remediation).
