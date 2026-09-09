# GREEN/after record — brainstorming (post-merge, Task 2.1)

Date: 2026-09-09
Target: `skills/brainstorming/SKILL.md` (A Team fork)
Merge source: `.claude/docs/plans/_sp-6.3.0-snapshot/brainstorming/` (frozen superpowers 6.3.0 snapshot)

## What changed

Body below the frontmatter `---` was replaced wholesale with the superpowers 6.3.0
snapshot body. Support files copied in: `visual-companion.md`,
`spec-document-reviewer-prompt.md`, `scripts/` (`frame-template.html`, `helper.js`,
`server.cjs`, `start-server.sh`, `stop-server.sh`). No files deleted.

## Representative task re-run

Prompt: `"Let's build a small CSV export button for the applications list."`

Walking the NEW SKILL.md:

- **(a) Path classification announced** — YES. "Three Paths" section still requires
  classifying out loud before the first question. A CSV export button on an existing
  list view = **Bounded** ("a well-scoped change to code that already exists in this
  repo"). Agent states the classification, asks the clarifying questions that matter
  one at a time, presents a short in-chat design (approach, files touched, testing).
- **(b) `<HARD-GATE>` / approval gate present** — YES. The `<HARD-GATE>` block sits at
  the top ("Do NOT invoke any implementation skill, write any code... until you have
  told your human partner what you intend and they have approved it"). Bounded
  checklist step 4: "Get approval — STOP and wait for an explicit yes". Reinforced by
  the "Too Simple To Need Approval" anti-pattern section and the 7-row Red Flags table.
- **(c) A Team `description` carried unchanged** — YES. Content is byte-identical to
  HEAD ("Use BEFORE any creative work — creating features, building components, adding
  functionality. Explores user intent, requirements, and design before implementation.
  Hard-gated: no code until user approves the spec."). Only change: wrapped in double
  quotes, matching the repo convention for colon-containing descriptions
  (`adr`, `api-contract-first`, `architecture-design`, `architecture-review`,
  `scalability-review` all quote; the snapshot brainstorming description was also
  quoted). HEAD's unquoted form is invalid YAML (`Hard-gated: no code` parses as a
  mapping key); quoting fixes that latent bug without altering the text.

## Before vs after — behavioural comparison

Behaviourally equivalent. The RED baseline's observable contract is fully preserved:
three-path spike/bounded/architectural classification announced out loud, `<HARD-GATE>`
no-implementation-until-approval on every path, one-way ratchet (hidden complexity
upgrades, nothing downgrades), the "Too Simple To Need Approval" anti-pattern, the
7-row Red Flags table, per-path checklists (Spike 5 / Bounded 5 / Architectural 9),
the process-flow `dot` digraph, path-bound terminal states, and the just-in-time
Visual Companion offer. Deltas are limited to the five preserved items below.

## Five preserved items — applied

| # | Item | Applied | Where |
|---|------|---------|-------|
| 1 | Keep EXISTING A Team frontmatter `description` verbatim (not the snapshot's) | yes | line 3 — content byte-identical to HEAD; wrapped in `"..."` per repo convention so the colon-containing string is valid YAML |
| 2 | `docs/superpowers/specs/` → `.claude/docs/specs/` | yes | line 101 (Checklist step 6) and line 207 (After the Design → Documentation) |
| 3 | No `superpowers:` prefixes; body uses bare `writing-plans` | yes (confirmed) | all `writing-plans` refs bare (lines 48, 103, 124, 145, 150, 230, 231); grep for `superpowers:` = clean |
| 4 | Provenance comment as first body line after `---` | yes | line 5: `<!-- A Team fork. Merged from superpowers 6.3.0 on 2026-09-09. See .claude/docs/specs/2026-09-09-a-team-wiring-review-design.md -->` |
| 5 | `elements-of-style:writing-clearly-and-concisely skill if available` → `Write the spec clearly and concisely.` | yes | line 209 (After the Design → Documentation bullet) |

## Trigger sanity check

- Positive ("let's build a small CSV export button...") → fires: "any creative work —
  creating features, building components, adding functionality".
- Near-miss ("what does this error mean?") → does not fire: diagnostic question, no
  feature/component/behaviour being created.

## REFACTOR checklist output

```
frontmatter OK, name=brainstorming
description unchanged: Use BEFORE any creative work — creating features, building c ...
--- file ref check ---
CHECK -a-team-wiring-review-design.md (fragment of provenance-comment path — illustrative, not a ref)
CHECK -design.md                       (fragment of `YYYY-MM-DD-<topic>-design.md` template — illustrative, not a ref)
OK   visual-companion.md
--- string leak check ---
clean: no superpowers:/docs-superpowers/elements-of-style
--- provenance check ---
provenance OK
--- git status ---
 M skills/brainstorming/SKILL.md
?? skills/brainstorming/scripts/
?? skills/brainstorming/spec-document-reviewer-prompt.md
?? skills/brainstorming/visual-companion.md
--- diff stat ---
 skills/brainstorming/SKILL.md | 259 ++++++++++++++++++++++++++-----
 1 file changed, 230 insertions(+), 29 deletions(-)
```

The two `CHECK` lines are false positives: the `[a-z-]+\.(md|...)` regex matches
tail fragments of the provenance-comment path and the spec-filename template. No real
missing references. All snapshot support files present under `skills/brainstorming/`.

## Verdict: PASS
