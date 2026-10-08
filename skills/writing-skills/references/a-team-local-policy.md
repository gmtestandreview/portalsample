# A Team Local Policy

Load this reference only when the target repository is explicitly an A Team
repository.

The supplied baseline states that new skills in A Team repositories are
registered in:

- `CLAUDE.md`
- `AGENTS.md`
- `skills/using-a-team/SKILL.md`

Treat this as **local policy**, not the universal Agent Skills specification.
Verify that the target repository still uses these files before editing them.
If any path is absent or the repository documents a newer registration rule,
follow the current repository source of truth and report the mismatch.

The baseline also contained provenance pointing to
`.claude/docs/specs/2026-09-09-a-team-wiring-review-design.md`; that file was not
supplied with this package, so its contents are `NHR` and must not be inferred.
