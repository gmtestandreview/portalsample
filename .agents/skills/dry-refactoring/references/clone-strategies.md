# Clone strategies

Load this reference only after a candidate has survived triage in `SKILL.md`.

## Exact clones

Prefer the smallest shared unit that already exists conceptually:

- extract a function for repeated logic;
- extract a constant/config object for repeated data;
- extract a module/utility when multiple files share domain-neutral logic;
- use a base/template abstraction only when the common lifecycle is stable and
  meaningful.

## Renamed clones

Parameterize the values or roles that differ only when both sides implement the
same algorithm. A clone that differs only by a literal often needs a
constant/config entry rather than a new function.

Do not parameterize semantic differences merely to make two blocks look unified.

## Gap-similar clones

Read the unmatched lines first. If the gap is an optional step, move it to the
caller or inject it behind a clearly named option/callback. If the gap changes
the meaning of the operation, keep separate functions and extract only the
genuinely shared portions.

## AST-similar clones

Diff the functions before abstracting. Similar structure is only a lead. Prefer
a shared skeleton with explicit arguments/strategy callbacks when the shared
behavior has a precise name. Lower-similarity pairs often represent a shared
idiom rather than one implementation; keep them separate unless code reading
establishes a real common concept.

## Test-only clones

Repeated test setup may justify a fixture/helper, but repeated assertions or
case structure can be intentionally explicit. Optimize for test readability, not
minimum line count.

## Cross-format clones

When the same implementation exists in JavaScript and TypeScript, first check
whether one is a stale port. Prefer consolidating to the intended source of
truth and updating imports rather than creating a third shared copy.

## Hotspot heuristics

- Prioritize large exact clones first.
- Use summary `dup%` together with duplicated-token volume; percentage alone can
  over-prioritize tiny files.
- Many renamed clones in production code may indicate one missing abstraction.
- Many renamed clones in test files may be intentional repetition.

## Validation reminders

Use the same detector configuration before and after the refactor. A default
exact scan cannot prove that a clone found only with `--ignore-identifiers`,
`--max-gap-lines`, `--similarity`, or cross-format settings was removed.
