# Cognitive-complexity reduction — threshold mode only

Load this reference only when the user explicitly asks to reduce a particular
method to a numerical cognitive-complexity ceiling. The main `SKILL.md` remains
the authority for scope, semantic preservation, safe edits and strict
zero-failure verification.

## Inputs and measurement

- Identify the target method, file/owner, specified threshold and any project
  analyzer/rule configuration. If the name matches multiple methods,
  disambiguate before editing. Require an actual numeric threshold; do not guess
  a default.
- The Code Simplifier analyzes/refactors the code but **does not calculate an
  authoritative cognitive-complexity score by itself**. Locate the project's
  configured analyzer, if available, and capture the method-specific score and
  command/report before editing. Keep the analyzer version, settings and method
  identity fixed across the comparison.
- If no trustworthy analyzer is available, do not invent a measured baseline or
  promise a compliant final score. Limit activity to analysis or authorized
  improvements labelled **NUMERIC TARGET NOT VERIFIED**; do not mark the
  threshold acceptance as passed.

## Find the real sources of complexity

Inspect for nested conditionals, long if/else or switch chains, loops with
branches, complex Boolean expressions, duplicated validations and intertwined
case-specific processing. Identify which part of each path has independent
responsibility and which state or side effects bind them together.

## Transformations to consider, not mandatory edits

1. Separate cohesive validation into aptly named helpers (for example,
   `Validate*` **only if idiomatic in this project**). Preserve exception types,
   messages, evaluation order and validation timing.
2. Extract type- or case-specific handling into focused helpers, maintaining
   access modifiers, dependencies, instance state and async behaviour.
3. Extract substantial transformations/calculations only when their inputs and
   outputs can be made explicit without hiding side effects or altering order.
4. Organize the original method into a readable high-level orchestration. Prefer
   a clear `switch`, guard, or ordered calls when semantics match.
5. Keep related helpers near their usage when consistent with the project.
   Choose static helpers only if instance state is genuinely unnecessary; avoid
   accidental reliance on reassigned state.
6. Consider tuples for multiple outputs and generic helpers for repeated
   patterns **only when** the project's types, maintainability and style justify
   them. Do not introduce opaque utility layers for a numerical gain.

When safe, create and verify a focused helper before rewriting its caller, then
rerun relevant checks after each stage. If splitting logic merely displaces
complexity without improving readability, stop and reconsider. Do not change
public contracts to hit the threshold.

## Acceptance specific to this mode

- The same method and metric configuration produced real before/after scores.
- Final score is **at or below** the explicit target; the measured result is
  reported, with its source.
- All existing related tests actually ran and recorded **zero total failures**.
  Pre-existing failures block PASS. Required compilation and applicable checks
  are supported by actual command output.
- Code behaviour, security and boundaries are preserved; new helper count and
  integration complexity are reasonable; no unrelated work is overwritten.

If any required condition fails or cannot be verified, report FAIL, BLOCKED or
NOT VERIFIED as appropriate rather than declaring the goal achieved.
