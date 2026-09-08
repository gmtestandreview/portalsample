# Phase 0 Task 0.2 — symlink-shadow spike: PASS

Date: 2026-09-09 (post session reload)

## Setup

- `.claude/skills/verification-before-completion` created as a git-tracked symlink
  (mode `120000`, target `../../skills/verification-before-completion`) via git
  plumbing (`hash-object -w` + `update-index --cacheinfo 120000` + `checkout`).
  `ln -s` in this Git Bash produced a directory copy, not a symlink — do not use it.
- Session reloaded by the user so the harness re-scanned `.claude/skills/`.

## Result — PASS

`Skill(verification-before-completion)` resolved to:

```
Base directory: c:\Users\gregm\...\portal.measurement.gov.au\.claude\skills\verification-before-completion
```

Body loaded = the **A Team** version: `## Core Rule` / `## Activation Boundary` /
`## Verification Gate` (steps 1–5: Name the claim … Bound the conclusion) /
claim-matched evidence table / `## Rationalization Checks` / `## Reporting Format`
(`Verification:/Observed:/Supported claim:`) / `## Completion Check`. 108 lines.

**Not** the superpowers body (which uses "The Iron Law" / "NO FIXES WITHOUT…"
framing). No permission prompt fired.

Contrast — `Skill(brainstorming)` (not yet symlinked) resolved to:

```
Base directory: C:\Users\gregm\.claude\plugins\cache\claude-plugins-official\superpowers\6.3.0\skills\brainstorming
```

i.e. the plugin cache — confirming that an unsymlinked name still routes to
`superpowers:` and a symlinked name shadows it.

## Conclusion

A project `.claude/skills/<name>` symlink **shadows** the `superpowers` plugin
skill of the same name. The load-bearing assumption holds. Plan B (spec §5) is
**not** needed. Proceed with Phase 1.
