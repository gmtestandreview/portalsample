---
name: playwright-bdd
description: Creates and maintains Gherkin feature files and step definitions for Behavior-Driven Development (BDD) with Playwright. Use when creating or editing .feature files and writing BDD steps for a playwright-bdd project.
---

# playwright-bdd

Workflow for creating and maintaining [playwright-bdd](https://github.com/vitalets/playwright-bdd) feature files and step definitions.

## Steps

### 1. Get familiar with the CLI

Run the following to see all available commands and options:

```bash
pnpm exec bddgen --help
```

### 2. Discover project configuration

1. If the user has already provided a features directory, use it directly.
2. Otherwise, search `playwright.config.ts` (or `playwright.config.js`) for `defineBddConfig(...)` or `defineBddProject(...)` calls. If `defineBddProject(...)` is used, treat `featuresRoot` as the shared root for features and steps and `outputDir` as the generated test folder.
3. If exactly one BDD config call exists, use its feature path and `steps` glob.
4. If multiple BDD config calls exist, choose the one whose feature directory shares the most path segments with the requested feature area.
5. If path matching is tied, prefer the config whose tags match the requested feature area.
6. If no config clearly matches, ask the user to clarify which config to use.

**Examples**

```ts
defineBddConfig({
  features: 'e2e/bdd/features/**/*.feature',
  steps: ['e2e/bdd/fixtures.ts', 'e2e/bdd/steps.ts'],
});
```

If the configuration is malformed or incomplete, report the error and suggest checking `playwright.config.ts` for syntax issues or comparing it with a valid BDD config example.

### 3. Discover available steps

Run `pnpm exec bddgen export` to list all registered step definitions:

```bash
pnpm exec bddgen export
# If the config file is not at the project root:
pnpm exec bddgen export --config <path-to-config>
```

The output lists steps in the format:

```text
* Given <pattern>
* When <pattern>
* Then <pattern>
```

Parse these lines and use the patterns as-is when writing feature steps. Do NOT invent new step text if a matching pattern already exists.

If `pnpm exec bddgen export` fails or returns unexpected output, report the failure and ask the user to verify the BDD configuration.

If the export fails because `playwright-bdd` is missing or not installed correctly, report the missing dependency and stop; do not change dependencies automatically.

### 4. Write the feature file

Place the file inside features directory discovered in step 2. Prefer existing step patterns; flag any behaviors that cannot be covered and proceed to step 5.

**Practical tips:**

- **Scenario Outline + Examples** — when the same flow should run with multiple data sets, use `Scenario Outline` with an `Examples:` table instead of duplicating scenarios.
- **Background** — if two or more scenarios share identical `Given` steps, extract those into a `Background:` block.
  - **Tags** — add tags (`@smoke`, `@regression`, `@jira:123`) to support filtering via `pnpm exec bddgen --tags "@smoke and not @slow"` and run the repo's canonical Playwright E2E command afterward. Match existing tag conventions visible in project `.feature` files.
- **Cucumber expression parameters** — `{string}` values must be written in `"double quotes"`, `{int}` is a bare integer, `{float}` is a bare decimal. Never modify the keyword pattern text itself.
- **Doc strings** — pass multi-line values (e.g. JSON, SQL) as triple-quoted doc strings directly below the step line:
  ```text
  Given the following payload:
    """
    { "key": "value" }
    """
  ```
- **Data tables** — pass tabular data using pipe-separated tables directly below the step line:
  ```text
  Given the following users:
    | name  | role  |
    | Alice | admin |
  ```

### 5. Propose missing step implementations

When a behavior cannot be covered by existing steps:

1. Resolve the `steps` glob from the BDD config and read the actual step files.
2. Identify the project's step style:
   - **Playwright-style**: `Given('pattern', async ({ page, ... }, arg) => { ... })`
   - **Cucumber-style**: `Given('pattern', async function(arg) { this.page... })`
   - **Decorators**: `@Given('pattern') async methodName(arg) { ... }` inside a POM class
3. Propose complete step implementations using the same syntax, formatting, and structure as the existing files.
4. Example:

```ts
Given('I open the app home page', async ({ page, appPath }) => {
  await page.goto(appPath);
});
```

5. Suggest the most appropriate file to add them to, inferred from the existing file naming (e.g. add auth-related steps to `steps/auth.steps.ts` if that file exists).

## Further Reading

For deeper detail on any topic — configuration, step styles, fixtures, hooks, reporters — fetch the official documentation: https://vitalets.github.io/playwright-bdd/#/
