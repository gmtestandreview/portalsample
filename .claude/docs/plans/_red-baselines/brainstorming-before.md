# RED baseline — brainstorming (pre-merge)

Date: 2026-09-09
Resolves to: `C:\Users\gregm\.claude\plugins\cache\claude-plugins-official\superpowers\6.3.0\skills\brainstorming` (superpowers, unshadowed — not yet symlinked)

## Observable contract of the current (superpowers) body

- **Three-path classification** — spike / bounded / architectural — stated out loud before the first question ("Start by classifying how much process the request needs").
- `<HARD-GATE>`: no implementation action until the human approves stated intent.
- **One-way ratchet**: hidden complexity upgrades the path mid-task; nothing downgrades.
- "Too Simple To Need Approval" anti-pattern section + a 7-row Red Flags table.
- Per-path checklists (Spike 5 steps / Bounded 5 steps / Architectural 9 steps).
- Process-flow `dot` digraph.
- Architectural path: 2–3 approaches → sectioned design → spec at `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` → spec self-review → user review gate → `writing-plans`.
- Visual Companion section (just-in-time offer, own message).
- References `elements-of-style:writing-clearly-and-concisely` (skill not installed here).

## Representative task

Prompt: `"Let's build a small CSV export button for the applications list."`
Expected behaviour: announce a path classification (likely "bounded" — a scoped change to an existing list view), ask clarifying questions one at a time, present a short in-chat design, STOP at the approval gate before any code.

## Post-merge expectation (Task 2.1)

Behaviour is **preserved** — Task 2.1 adopts this exact body. The only deltas:
1. frontmatter `description` = the A Team one (kept verbatim);
2. `docs/superpowers/specs/` → `.claude/docs/specs/`;
3. `elements-of-style:...` reference → plain "Write the spec clearly and concisely.";
4. provenance comment added;
5. no `superpowers:` prefixes (body already uses bare `writing-plans`).

`brainstorming-after.md` records the re-run confirming 1–5 applied and the
three-path / approval-gate behaviour unchanged.
