---
agent: agent
description: 'Use this prompt to explore a website, route, page, or Storybook surface with the Playwright MCP for the purpose of planning or generating Playwright tests. Follow repository Playwright rules and best practices while keeping changes minimal and focused on the exploration task.'
argument-hint: 'URL or local route to explore, plus optional target flows, app/storybook project, and whether to generate test files.'
model: Claude Sonnet 4
tools: [execute, read, edit, search, web, agent, todo]
---

Canonical command reference: see [.github/docs/COMMAND_CANON.md](../docs/COMMAND_CANON.md) for repo-standard validation, build, lint, and test commands.

# Website Exploration for Playwright Testing

Use this prompt when the user explicitly asks to explore a website, route, page, or Storybook surface for Playwright test planning or generation.

The exploration request is: **$input**

## Goal

Explore the target UI like a user, identify key flows, capture reliable Playwright locators, and produce candidate e2e test cases.

Do not generate or edit test files unless the user explicitly asks for test-file generation.

## Required inputs

Before exploring, identify:

- target URL, route, or Storybook surface
- whether the target is the app project or Storybook project, if known
- specific flows or features the user wants covered
- whether the user wants only findings or also generated test files

If no URL, route, or target surface is provided, ask for the missing target before using Playwright.

## Repository Playwright rules

- Follow `AGENTS.md` and repository policy first.
- Use Playwright MCP for exploration before writing test code.
- Use observed UI roles, names, labels, and visible behavior as evidence.
- Do not invent locators, routes, test data, or expected outcomes.
- Do not modify `playwright.config.ts`, `scripts/e2e.mjs`, `scripts/e2e-lib.mjs`, package scripts, CI, dependencies, or test project structure unless explicitly requested.
- Prefer repo commands:
  - `pnpm test:e2e`
  - `pnpm test:e2e --project=app`
  - `pnpm test:e2e --project=storybook`
- Do not use `npx playwright`, `npm`, or `yarn` unless explicitly required.
- If the app or Storybook server cannot start, report the exact failure and stop before inventing tests.

## Exploration workflow

1. Open the target URL or route with Playwright MCP.
2. Capture an initial page snapshot.
3. Identify the main landmarks, headings, navigation, forms, buttons, links, and interactive controls.
4. Explore 3–5 core user flows unless the user requested a different scope.
5. For each flow:
   - interact with the UI as a user would
   - note the accessible roles and names used
   - capture stable locator candidates
   - record expected outcomes
   - note any ambiguity, flakiness risk, or accessibility issue
6. Prefer user-facing locators:
   - `getByRole`
   - `getByLabel`
   - `getByText`
   - `getByPlaceholder`
   - `getByAltText`
   - `getByTitle`
7. Avoid brittle selectors based on implementation details unless no accessible locator is available.
8. Close the browser context when exploration is complete.

## Test planning rules

When proposing test cases:

- cover user-observable behavior, not implementation details
- prefer minimal tests with clear intent
- keep app-route tests and Storybook tests aligned with the existing project split
- avoid hard-coded waits
- rely on Playwright auto-waiting and web-first assertions
- use `test.step()` only when it improves readability or reporting
- use `toMatchAriaSnapshot()` selectively for accessibility-tree structure, not as the default assertion

When generating test files, only do so if explicitly requested.

## Output format

Return:

1. Summary
   - target explored
   - project/surface: app, Storybook, external site, or unknown
   - flows explored
   - any blockers

2. Observed UI map
   - key headings, landmarks, forms, links, buttons, and controls
   - reliable locator candidates

3. Explored flows
   For each flow include:
   - user goal
   - steps performed
   - observed result
   - recommended locators
   - candidate assertions
   - risks or ambiguities

4. Candidate Playwright tests
   For each proposed test include:
   - test name
   - purpose
   - setup/navigation
   - key actions
   - expected assertions
   - project target: app or Storybook

5. Validation notes
   - whether exploration succeeded
   - whether tests were generated
   - whether tests were run
   - commands run or recommended
   - unresolved gaps

## Completion rules

- Do not claim tests were generated unless files were actually created or updated.
- Do not claim tests passed unless they were run and passed.
- If validation could not run, say so clearly.
- If only exploration was requested, stop after findings and candidate tests.
