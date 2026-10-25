# Agent MD Refactor

A skill for refactoring oversized, mixed-purpose, duplicated, contradictory, or
hard-to-navigate `AGENTS.md`, `CLAUDE.md`, `COPILOT.md`, and similar agent
instruction files using progressive disclosure while preserving behavior, scope,
precedence, and safety controls.

## What it does

The skill separates broadly needed root instructions from conditional guidance,
groups the latter into focused files, removes demonstrably redundant or obsolete
material, and validates the result against the original instructions.

It is designed to reduce context waste and maintenance burden without assuming
that linked documentation automatically preserves agent behavior.

## Core workflow

1. Inventory the target instruction files, scope, precedence, links, and client
   behavior supported by available evidence.
2. Preserve a reversible baseline before implementation.
3. Resolve contradictions where evidence is sufficient; otherwise keep them
   explicit for human review.
4. Keep only broadly needed or discovery-critical guidance in the root.
5. Group conditional guidance into coherent supporting files using existing
   repository conventions where possible.
6. Prune only content whose execution value is demonstrably absent, duplicated,
   obsolete, or too vague to guide behavior.
7. Build the candidate structure without changing scope or precedence
   unintentionally.
8. Compare the candidate with the baseline and verify links, preservation,
   safety rules, and—when possible—actual client loading behavior.

## Important boundaries

- Root size is a heuristic, not a hard requirement. Around 50 lines is often
  useful when practical.
- `3-8` supporting files is a starting heuristic, not a rule.
- Do not delete safety, security, privacy, permission, compliance, or
  project-specific rules merely because they appear obvious.
- Do not assume a Markdown link means the target agent will load or enforce the
  linked file.
- Do not flatten nested instruction files unless the target environment
  preserves their scope and precedence.
- If client loading/scoping behavior materially affects correctness and cannot
  be verified, stage the refactor and mark it `Needs Human Review` rather than
  replacing the active instructions.
- If a known relevant nested/local instruction source is unavailable, stage the
  refactor, identify the missing source, and do not claim preservation or
  replace active instructions.

## Example structure

Use the repository's established convention where possible. A possible result
is:

```text
project-root/
├── AGENTS.md
└── docs/agent-instructions/
    ├── testing.md
    ├── code-style.md
    └── architecture.md
```

The root should link or route to supporting files only when that mechanism is
meaningful for the target client.

## Validation

After refactoring, check that:

- every original instruction is preserved, intentionally adapted, or explicitly
  approved for removal;
- no material contradiction was silently resolved;
- moved guidance remains discoverable in its intended scope;
- all referenced files and links exist;
- safety and permission controls are preserved;
- the root is concise without losing required universal guidance;
- representative target-client tasks confirm the new structure is actually
  followed, or the missing execution evidence is marked `Needs Human Review`.

## License

MIT
