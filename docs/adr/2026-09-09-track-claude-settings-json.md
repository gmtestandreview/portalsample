# ADR: Track `.claude/settings.json` in version control

**Date:** 2026-09-09
**Status:** Accepted
**Deciders:** Portal rebuild team (gregm)

## Context

On 2026-08-27, audit finding **B5** (commit `77101363`, "chore: keep Claude Code
settings per-developer") added both `.claude/settings.json` and
`.claude/settings.local.json` to `.gitignore`. The stated rationale: both files
hold permission grants, and "a standing pre-approval that is right for one
developer's workflow is not automatically right for everyone who clones."

The A Team wiring review changes the forces:

- Spec `.claude/docs/specs/2026-09-09-a-team-wiring-review-design.md` §4.5.4
  requires all 25 canonical A Team skills to resolve **by bare name with no
  permission prompt**. That is delivered by 50 `Skill(<name>)` / `Skill(<name>:*)`
  entries in `.claude/settings.json` (plan Task 4.2).
- An **untracked** `settings.json` cannot carry that allow-list to other clones,
  to CI, or to fresh agent sessions. Each new checkout would re-prompt for all 25
  skills — the "un-prompted" requirement fails in exactly the automated contexts
  that most need it.
- `.claude/settings.json` also carries project-level **enforcement**, not just
  preference: a `PreToolUse` security-gate hook (`scripts/pre_tool_use.py`), a
  `SessionStart` roster/watcher hook, `PostToolUse` review reminders, and a
  `deny` list mirroring the CLAUDE.md "Never edit" boundaries.
- Commit `6f55eb8` already committed `.claude/settings.json` (forced past the
  ignore) while `.gitignore` still lists it — a silent, undocumented state that
  needs resolving either way.

Constraints and assumptions:

- `.claude/settings.local.json` genuinely holds machine-specific absolute paths
  and per-developer one-offs. It must stay untracked. (Assumption: contributors
  keep personal pre-approvals there; Claude Code merges `settings.local.json`
  over `settings.json`.)
- Assumption: the team accepts the committed allow-list and hook set as a shared
  project baseline, reviewed like any other code.

## Decision

Track `.claude/settings.json` in version control. Remove it from `.gitignore`;
keep `.claude/settings.local.json` ignored. Changes to the tracked file's
permissions or hooks are reviewed like any other code change.

This supersedes the `settings.json` half of audit finding B5; the
`settings.local.json` half stands.

## Consequences

### Positive

- The 50 `Skill()` allow entries ship with the repo — all 25 A Team skills
  resolve un-prompted on every clone and in agent/CI runs (spec §4.5.4 met).
- The `PreToolUse` security gate, `SessionStart` roster hook, `PostToolUse`
  reminders, and the `deny` list are enforced uniformly instead of depending on
  each developer re-creating them.
- Permission-surface changes are now visible in `git diff` and review instead of
  drifting silently per machine — which is the outcome B5 actually wanted, just
  achieved by tracking-plus-review rather than by not tracking.
- `settings.local.json` still absorbs per-machine and personal grants: the
  legitimate half of B5 is preserved.

### Negative (accepted)

- Every clone inherits the **full** committed allow-list, including narrow
  one-offs added in `6f55eb8` (e.g. `Bash(git commit -m '*)`, a vitest `.d.ts`
  `awk` one-liner, `PowerShell(node --version)`). These broaden the default tool
  surface for anyone who does not read the file. A follow-up prune is expected
  (see Review Trigger).
- `SessionStart` launches `scripts/watcher.py` in the background for every
  contributor; anyone who does not want that must override locally.
- A future contributor could commit a machine-specific or over-broad grant to
  the shared file; the only mitigation is review diligence.
- Re-opening a decision that was itself the resolution of a three-way
  inconsistency (2026-08-27 audit B5) cost analysis time and this record.

## Alternatives Considered

### Option A — Keep `settings.json` untracked; ship `settings.example.json`

- Description: honor B5 unchanged; add a committed example file with the 25×2
  `Skill()` entries that each developer copies into their untracked
  `settings.json`.
- Advantages: no change to the B5 trust model; no shared allow-list to police.
- Why not selected: relies on a manual copy step that CI and fresh agent
  sessions will not perform, so the "un-prompted" requirement regresses in the
  automated contexts that need it most; also splits the source of truth for
  permissions across two files.

### Option B — Track a minimal `settings.json` (allow-list only)

- Description: reduce the committed file to `permissions.allow`, dropping the
  broad `Bash`/`Write`/`Edit`/`Agent` grants, the `deny` list, and all four
  `hooks` blocks.
- Advantages: shares the skill pre-approvals without inheriting one developer's
  Bash workflow or the background watcher.
- Why not selected (now): the security-gate and `SessionStart` hooks and the
  `deny` list are project-level enforcement worth sharing. Stripping them to
  avoid a cleanup of a handful of one-off `Bash(...)` entries discards
  enforcement to dodge a prune. Pruning the one-offs (Review Trigger) is the
  cheaper path and keeps enforcement shared.

### Option C — Do nothing

- Description: leave `6f55eb8` tracking a `.gitignore`d file with a message that
  only mentions the allow-list.
- Why not selected: leaves the repo in a contradictory, undocumented state;
  every future reader has to rediscover what this ADR records.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Broad committed grant slips through review | Elevated tool surface for all clones | ADR names the allow-list as review-sensitive; `.github/instructions/config-policy.instructions.md` already flags policy-sensitive files |
| `watcher.py` background launch unwanted on a platform | Minor resource use / surprise | Documented here; overridable via `settings.local.json` or by removing the hook locally |
| Contributor commits a machine-specific path to the shared file | Broken pre-approval for others | Machine-specific entries belong in the still-ignored `settings.local.json`; review catches absolute paths |

## Validation

- Fresh clone + `claude` session: invoking `brainstorming`,
  `subagent-driven-development`, `systematic-debugging`, `adr`,
  `receiving-code-review` returns the A Team body with **no permission prompt**
  (matches plan Task 4.4 / 8.1 spot-checks).
- `git check-ignore .claude/settings.json` → no output (not ignored);
  `git check-ignore .claude/settings.local.json` → still matched.
- `grep -oE '"Skill\([^"]*\)"' .claude/settings.json | sort -u | wc -l` → 50.

## Rollback / Reversal

- Re-add `.claude/settings.json` to `.gitignore` and
  `git rm --cached .claude/settings.json`. Mechanically one commit.
- What makes it non-trivial: any contributor who has since edited the shared
  allow-list would lose those grants from version control, and the "un-prompted
  skills" requirement regresses — so a replacement distribution mechanism
  (example file + docs, or an installer step) must land in the same change.

## Review Trigger

Revisit this ADR when any of:

- The committed allow-list is pruned to project-general entries (planned
  follow-up) — confirm the file then reflects only shared policy.
- A security review flags an over-broad grant reaching contributors via this
  file.
- Claude Code introduces a first-class mechanism for distributing skill
  pre-approvals (would make the tracked allow-list redundant).
- A contributor reports the `SessionStart` `watcher.py` launch as a problem on
  their platform.
- The team adopts CI that runs Claude agents and needs a different trust model
  for the allow-list.

## References

- Supersedes the `settings.json` half of: 2026-08-27 audit finding B5, commit
  `77101363` ("chore: keep Claude Code settings per-developer").
- Spec: `.claude/docs/specs/2026-09-09-a-team-wiring-review-design.md` §4.5.2, §4.5.4.
- Plan: `.claude/docs/plans/2026-09-09-a-team-wiring-review.md` Task 4.2.
- Commit that first tracked the file: `6f55eb8`.
