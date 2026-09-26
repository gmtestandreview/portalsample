# Sprint {{N}} — {{SPRINT_NAME}}

> Sprint Goal: {{one sentence describing the deliverable}}
> Branch: feature/sprint-{{N}}
> Estimated effort: {{time estimate}}
> Created: {{DATE}}

## Prioritized Task List

| # | Task | Owner | Est | Description |
|---|------|-------|-----|-------------|
| 1 | {{task}} | Nova | 1h | {{what to build}} |
| 2 | {{task}} | Milo | 1h | {{what to style}} |
| 3 | {{task}} | Ivy | 1h | {{what to cover with tests}} |

## Work Schedule

### Phase 1: {{name}} (tasks 1-3)

- {{work}}
- Checkpoint commit after phase
- Gate: `a-team/scripts/validate.sh --role dev`

### Phase 2: {{name}} (tasks 4-6)

- {{work}}
- Checkpoint commit after phase
- Gate: `a-team/scripts/validate.sh --role dev`

### Phase 3: Polish and Integration

- Integration testing, bug fixes, final commit
- Gate: `a-team/scripts/validate.sh --role closure`

## Success Criteria

- [ ] {{testable criterion}}
- [ ] {{testable criterion}}
- [ ] `a-team/scripts/validate.sh --role closure` passes
- [ ] No new console errors
- [ ] No regressions in existing tests

## What's NOT in This Sprint

| Item | Reason |
|------|--------|
| {{cut item}} | {{why — scope, complexity, not needed yet}} |

## Edit Boundaries

Editable: `ClientApp/src/**/*.{ts,tsx}`, `ClientApp/src/styles/**/*.scss`, `tests/**`, `docs/**`

Never edit: `ClientApp/src/api/web-api-client.ts`, `ClientApp/src/main.*.js`,
`ClientApp/css/main.*.css`, `ClientApp/source-map-http-downloads/**`,
`ClientApp/src/external/**`, `ClientApp/webpack/**`

## Agent Prompt

> Read `a-team/INIT.md`, then `PROJECT_BRIEF.md`, then `docs/sprint-{{N}}/plan.md`.
> You are the Dev Team (Nova, Sage, Milo). Execute Sprint {{N}}.
>
> Run `a-team/scripts/preflight.sh --role dev` first and honour what it reports.
>
> Reference issues in commits: `fix: description (Fixes #NN)`
> Update `docs/sprint-{{N}}/progress.md` after each phase.
> When done: `a-team/scripts/handoff.sh {{N}}`, then push and open a draft PR.
