# QA Sprint {{N}} Sign-Off

Date: {{DATE}}
Tester: Ivy (QA)

## Test Results

| Gate | Command | Result |
|------|---------|--------|
| unit | `npm run test:unit` | |
| storybook | `npm run test:storybook` | |
| regression | `npm run test:quality:regression` | |
| storybook build | `npm run build-storybook` | |

- Tests run: {{N}}
- Tests passed: {{N}}
- Tests failed: {{N}}

## Manual Playthrough

| Area | Result | Notes |
|------|--------|-------|
| {{route or component}} | | |

## Blockers

{{NONE, or list}}

## Issues Filed

- #NN — {{description}} (severity: {{blocker/major/minor}})

## Result

{{✅ PASS — no blockers, Sprint N is ready to merge}} / {{❌ BLOCKED — see above}}
