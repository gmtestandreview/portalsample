# Storybook Autodocs Gold-Standard Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Use `superpowers:test-driven-development` for behavioural and governance changes, and `superpowers:verification-before-completion` before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Target repository plan path:** `docs/superpowers/plans/2026-08-25-storybook-autodocs-gold-standard-refactor.md`

**Goal:** Refactor the Storybook React/Vite documentation architecture so that Autodocs, MDX, Doc Blocks, Code Panel, source generation, metadata inference, documentation builds, and developer guidance form a clean, current, testable system that scores **at least 95/100**, with a design target of **99/100**, against the agreed Storybook Expert Review rubric.

**Architecture:** Use Storybook's native capabilities as the primary source of behaviour: global `autodocs` tagging, TypeScript/JSDoc metadata inference, CSF for executable examples, standard Autodocs for baseline API documentation, MDX for narrative content, Doc Blocks for composition, and `parameters.docs.*` for scoped customisation. Remove duplicated configuration and builder-incompatible infrastructure only after regression evidence proves the removal safe.

**Tech Stack:** Storybook React/Vite, TypeScript, React, Vite, MDX 3, `@storybook/addon-docs`, `remark-gfm`, Vitest, Playwright/BDD, MSW, Chromatic, existing repository CI.

**Spec:** `Storybook Autodocs and Documentation Expert Review` — the approved Expert Review immediately preceding this plan. If the repository maintains architecture/review documents, save that review as `docs/storybook/STORYBOOK-AUTODOCS-EXPERT-REVIEW.md` so the implementation plan and its governing specification travel together.

---

# Global Constraints

1. **Target Storybook API baseline:** official Storybook **10.5** documentation unless repository preflight proves a different installed version requires a controlled compatibility decision.
2. **Do not silently upgrade Storybook.** Version upgrades are outside this refactor unless Task 1 proves the installed version cannot implement the target architecture.
3. **Do not replace React/Vite with Webpack.**
4. Preserve project-wide `tags: ['autodocs']`.
5. Preserve existing MSW, router, environment, accessibility, Vitest, Chromatic, and BDD behaviour unless explicitly changed by this plan.
6. Do not manually duplicate TypeScript prop types in `argTypes`.
7. Do not globally adopt `react-docgen-typescript` unless Task 9 proves the default parser materially insufficient.
8. Do not add a custom Docs container or custom global Autodocs page unless a concrete requirement cannot be satisfied by standard Storybook configuration.
9. Do not remove the explicit `@storybook/csf-plugin` workaround until Task 8 completes its A/B verification.
10. Preserve `docs-table-styles.css` while Bootstrap's reset continues to require it.
11. All configuration removals require either a failing governance test that becomes green or an explicit before/after regression check.
12. No task is complete merely because TypeScript compiles.
13. Final completion requires `storybook build --docs`, automated tests, documentation behaviour verification, and a rubric score of **95 or higher with no critical-error cap triggered**.
14. Prefer DRY and YAGNI. Storybook defaults should remain defaults unless the project has a concrete reason to override them.
15. Commit each independently reviewable task separately.

Current official Storybook documentation confirms that Autodocs is tag-driven, that project-level `tags: ['autodocs']` is the supported global mechanism, and that `autodocs` is a built-in Storybook tag.

---

# Current-State Evidence

The existing `main.ts` uses `@storybook/react-vite` but currently contains overlapping story globs, addon-level Autodocs-like options, `typescript.check: true`, a manually injected CSF Vite plugin, and `@storybook/addon-styling-webpack`.

The current `preview.ts` correctly enables global Autodocs with:

```ts
tags: ['autodocs'],
```

but also carries duplicate Docs state through `docs.enabled`, `docs.autodocs`, a generic global description and a custom page template.

`preview-docs.ts` duplicates Storybook's default `Title → Subtitle → Description → Primary → Controls → Stories` Autodocs composition and maintains a second representation of Docs configuration.

The developer guide incorrectly teaches developers to add a `'docs'` tag to activate Autodocs.

The Style Guide already makes good use of specialist MDX/Doc Blocks such as `Typeset`, `ColorPalette`, `IconGallery`, and `Stories`, and contains GFM-style Markdown tables that justify configuring `remark-gfm`.

Storybook 10.5 explicitly documents the Code Panel as the Storysource replacement, enables it with `parameters.docs.codePanel: true`, and states that it shares the same Source configuration used by the Source Doc Block and Autodocs.

---

# Target State

The final documentation architecture must resolve to:

```text
React Component
      │
      ├── TypeScript types
      └── JSDoc descriptions
              │
              ▼
          Docgen
              │
              ▼
      Storybook metadata
     args / argTypes / parameters
              │
      ┌───────┴────────┐
      │                │
      ▼                ▼
  CSF Stories       Autodocs
      │                │
      │            Doc Blocks
      │                │
      ├────────┬───────┘
      │        │
      ▼        ▼
   Canvas    Source
      │        │
      └────┬───┘
           ▼
       Code Panel

Narrative extension only where needed:

      MDX
       │
       ▼
   Doc Blocks
```

There must be:

- one Autodocs activation model;
- one Source configuration model;
- no clone of Storybook's default Autodocs template;
- no Webpack-only addon in the Vite configuration without proven need;
- no global generic description suppressing inferred component documentation;
- no developer guidance teaching `'docs'` as the Autodocs tag;
- repeatable documentation verification in CI.

---

# Task 1: Establish Repository, Version and Regression Baseline

**Files:**
- Read: `package.json`
- Read: repository lockfile
- Read: `.storybook/main.ts`
- Read: `.storybook/preview.ts`
- Read: `.storybook/preview-docs.ts`
- Read: `.storybook/component-docs-guide.mdx`
- Read: `.storybook/introduction.mdx`
- Read: `.storybook/style-guide.mdx`
- Read: existing Storybook BDD/test files
- Create: `docs/storybook/storybook-refactor-baseline.md`

**Interfaces:**
- Produces the exact installed Storybook version.
- Produces the repository-native package manager.
- Produces the existing Storybook scripts.
- Produces the exact Storybook BDD step-definition path.
- Produces three representative component story files for metadata testing.
- Produces the CI workflow/pipeline path that currently runs frontend tests.

## Steps

- [ ] **Step 1: Confirm repository root and clean-state risks**

Run:

```bash
git rev-parse --show-toplevel
git status --short
git branch --show-current
git rev-parse HEAD
```

If unrelated working-tree changes exist, **do not overwrite or revert them**. Record them in the baseline document and restrict edits to plan-owned files.

- [ ] **Step 2: Detect the repository package manager**

PowerShell:

```powershell
$pm = if (Test-Path 'pnpm-lock.yaml') {
  'pnpm'
} elseif (Test-Path 'package-lock.json') {
  'npm'
} elseif (Test-Path 'yarn.lock') {
  'yarn'
} else {
  throw 'No supported JavaScript package-manager lockfile found.'
}

Write-Host "PACKAGE_MANAGER=$pm"
```

Use that package manager for the rest of this plan. Do not introduce or regenerate a different lockfile.

- [ ] **Step 3: Record installed Storybook packages**

Run:

```powershell
node -e "const p=require('./package.json'); const all={...(p.dependencies||{}),...(p.devDependencies||{})}; console.log(Object.entries(all).filter(([k])=>k==='storybook'||k.startsWith('@storybook/')||k.startsWith('@chromatic-com/')).sort().map(([k,v])=>k+'='+v).join('\n'))"
```

Then:

```powershell
& $pm exec storybook --version
```

Record both declared and resolved versions.

- [ ] **Step 4: Apply the version gate**

Decision:

```text
Installed Storybook 10.x
    → continue this plan.

Installed Storybook 9.x
    → verify every 10.5-targeted option against installed API;
      continue only where compatible.
      Record compatibility deviations.

Installed Storybook 8.x or earlier
    → STOP configuration refactor after baseline.
      Create a separate Storybook upgrade plan rather than mixing
      a major-version migration into this cleanup.
```

Do not hide this decision.

- [ ] **Step 5: Locate existing Storybook scripts and tests**

Run:

```powershell
node -e "const p=require('./package.json'); console.log(JSON.stringify(p.scripts||{}, null, 2))"

rg -n --hidden --glob '!node_modules/**' `
  "storybook|@storybook|bddgen|playwright.*storybook|@storybook" `
  package.json .storybook tests .github azure-pipelines.yml docs 2>$null
```

Record the exact existing:

- unit-test command;
- type-check command;
- Storybook development command;
- Storybook build command;
- BDD generation command;
- Storybook BDD feature directory;
- Storybook step-definition file;
- CI workflow/pipeline file.

- [ ] **Step 6: Identify representative metadata cases**

Select three existing components satisfying:

```text
Component A — simple typed props
Component B — union/enum-style props
Component C — wrapper, forwardRef, inherited props, or other difficult inference
```

Prefer already well-covered components rather than creating artificial components.

Record their exact component and `.stories.tsx` paths.

- [ ] **Step 7: Capture baseline search evidence**

Run:

```powershell
rg -n --hidden --glob '!node_modules/**' `
  "autodocs|'docs' tag|\"docs\" tag|expectedAddonDocsConfig|autoDocsTemplate|addon-styling-webpack|csfPlugin|typescript:\s*\{|check:\s*true|docsMode|codePanel|sourceState|type:\s*'dynamic'|DocsTable" `
  .storybook ClientApp tests package.json
```

Save the output.

- [ ] **Step 8: Run the existing baseline quality suite**

Use the repository's existing commands discovered in Step 5.

At minimum run:

```powershell
& $pm exec tsc --noEmit
```

and the existing Storybook unit/BDD checks.

Do not fix unrelated baseline failures during this task. Record them.

- [ ] **Step 9: Build baseline documentation**

Run:

```powershell
& $pm exec storybook build --docs --output-dir storybook-static-baseline
```

Expected:

```text
Exit code: 0
Output directory: storybook-static-baseline/
```

If the baseline cannot build, record the failure before changing configuration.

- [ ] **Step 10: Write baseline evidence**

Create:

```markdown
# Storybook Autodocs Refactor Baseline

## Repository
- Branch:
- Commit:
- Package manager:
- Storybook resolved version:

## Existing quality commands
- Type check:
- Unit:
- Storybook tests:
- BDD generation:
- E2E:
- Storybook build:

## Existing Storybook test paths
- Feature directory:
- Step definition:
- CI pipeline/workflow:

## Representative components
1. Simple props:
2. Union/enum props:
3. Difficult inference:

## Baseline results
- Type check:
- Unit:
- Storybook BDD:
- `storybook build --docs`:

## Known pre-existing failures
Record exact command, exit code, and failure summary.

## Configuration findings
Paste the relevant `rg` output captured before refactoring.
```

Populate every field with the actual evidence obtained above.

- [ ] **Step 11: Do not commit generated baseline Storybook output**

Remove:

```powershell
Remove-Item -Recurse -Force storybook-static-baseline
```

unless the repository already tracks static documentation output.

- [ ] **Step 12: Commit baseline document**

```bash
git add docs/storybook/storybook-refactor-baseline.md
git commit -m "docs: capture Storybook autodocs refactor baseline"
```

---

# Task 2: Add Storybook Documentation Governance Tests — RED

**Files:**
- Create: `tests/unit/storybook/storybookDocsConfig.test.ts`

**Interfaces:**
- Consumes the existing `.storybook` configuration.
- Produces executable policy assertions that later tasks must make green.
- This test intentionally fails against the current configuration.

## Steps

- [ ] **Step 1: Create the failing configuration-governance test**

Create:

```ts
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(fileURLToPath(new URL('../../../', import.meta.url)));

const read = (path: string) =>
  readFileSync(resolve(repoRoot, path), 'utf8');

const main = read('.storybook/main.ts');
const preview = read('.storybook/preview.ts');
const componentDocsGuide = read('.storybook/component-docs-guide.mdx');
const packageJson = JSON.parse(read('package.json')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const allDependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

describe('Storybook documentation architecture', () => {
  it('uses React Vite without Webpack-only Storybook styling infrastructure', () => {
    expect(main).toContain("framework: '@storybook/react-vite'");
    expect(main).not.toContain('@storybook/addon-styling-webpack');
    expect(allDependencies).not.toHaveProperty('@storybook/addon-styling-webpack');
  });

  it('uses non-overlapping canonical story and MDX globs', () => {
    expect(main).toContain("'../.storybook/*.mdx'");
    expect(main).toContain("'../ClientApp/src/**/*.mdx'");
    expect(main).toContain(
      "'../ClientApp/src/**/*.stories.@(js|jsx|mjs|ts|tsx)'",
    );

    expect(main).not.toContain(
      "'../ClientApp/src/**/*.stories.@(ts|tsx)'",
    );
    expect(main).not.toContain(
      "'../ClientApp/src/**/*.{docs,Docs}.mdx'",
    );
  });

  it('owns generated docs naming and docs mode in main.ts', () => {
    expect(main).toMatch(
      /docs:\s*\{[\s\S]*defaultName:\s*['"]Documentation['"]/,
    );
    expect(main).toMatch(
      /docs:\s*\{[\s\S]*docsMode:\s*false/,
    );
  });

  it('does not use Webpack-only TypeScript checking in React Vite', () => {
    expect(main).not.toMatch(
      /typescript:\s*\{[\s\S]{0,200}check:\s*true/,
    );
  });

  it('configures GFM support for MDX tables', () => {
    expect(allDependencies).toHaveProperty('remark-gfm');
    expect(main).toMatch(/import\s+remarkGfm\s+from\s+['"]remark-gfm['"]/);
    expect(main).toMatch(/remarkPlugins:\s*\[\s*remarkGfm\s*\]/);
  });

  it('enables Autodocs once at project level', () => {
    expect(preview).toMatch(
      /tags:\s*\[\s*['"]autodocs['"]\s*\]/,
    );

    expect(preview).not.toContain('expectedAddonDocsConfig');
    expect(preview).not.toMatch(/docs:\s*\{[\s\S]{0,120}autodocs:/);
  });

  it('enables Code Panel and shares automatic source configuration', () => {
    expect(preview).toMatch(/codePanel:\s*true/);
    expect(preview).toMatch(/excludeDecorators:\s*true/);
    expect(preview).toMatch(/type:\s*['"]auto['"]/);
  });

  it('does not replace inferred component descriptions globally', () => {
    expect(preview).not.toContain(
      'Component documentation generated from JSDoc comments and Storybook autodocs.',
    );
  });

  it('does not clone Storybook default Autodocs template', () => {
    expect(preview).not.toContain('autoDocsTemplate');
    expect(
      existsSync(resolve(repoRoot, '.storybook/preview-docs.ts')),
    ).toBe(false);
  });

  it('teaches the correct Autodocs tag and opt-out mechanism', () => {
    expect(componentDocsGuide).not.toMatch(
      /Adding the ['"]docs['"] Tag/i,
    );
    expect(componentDocsGuide).not.toMatch(
      /add(?:ing)? the ['"]docs['"] tag.*autodocs/i,
    );

    expect(componentDocsGuide).toContain('autodocs');
    expect(componentDocsGuide).toContain('!autodocs');
  });

  it('documents the Storybook metadata responsibilities', () => {
    expect(componentDocsGuide).toMatch(/\bArgs\b/);
    expect(componentDocsGuide).toMatch(/\bArgTypes\b/);
    expect(componentDocsGuide).toMatch(/\bParameters\b/);
    expect(componentDocsGuide).toMatch(/\bCode Panel\b/);
    expect(componentDocsGuide).toMatch(/\bDoc Blocks\b/);
    expect(componentDocsGuide).toMatch(/\bMDX\b/);
  });
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run:

```powershell
& $pm exec vitest run tests/unit/storybook/storybookDocsConfig.test.ts
```

Expected: **FAIL**.

Expected failures include several of:

```text
@storybook/addon-styling-webpack still present
duplicate story glob still present
remark-gfm absent
preview contains expectedAddonDocsConfig
Code Panel absent
source.type is dynamic
generic description still present
preview-docs.ts still exists
component guide teaches 'docs' tag
```

If the test unexpectedly passes, inspect whether the source files have already been changed before continuing.

- [ ] **Step 3: Record RED evidence**

Append the failing command and assertion summary to:

`docs/storybook/storybook-refactor-baseline.md`

under:

```markdown
## RED governance test
```

- [ ] **Step 4: Commit the failing test**

A deliberate RED test commit is acceptable because it records the target contract:

```bash
git add tests/unit/storybook/storybookDocsConfig.test.ts docs/storybook/storybook-refactor-baseline.md
git commit -m "test: define Storybook docs architecture contract"
```

---

# Task 3: Refactor `main.ts` Documentation Ownership and Vite Configuration

**Files:**
- Modify: `.storybook/main.ts`
- Modify: `package.json`
- Modify: repository lockfile

**Interfaces:**
- Retains current Sass and production chunking behaviour.
- Retains the explicit CSF plugin temporarily.
- Produces canonical story discovery.
- Produces official top-level Docs configuration.
- Produces GFM-enabled MDX.
- Removes Webpack-only configuration.

Storybook's current TypeScript documentation explicitly says `typescript.check` uses a Webpack plugin and is available only with the Webpack builder.

Storybook's MDX documentation explicitly recommends `remark-gfm` for GFM features such as tables.

## Steps

- [ ] **Step 1: Add `remark-gfm` using the existing package manager**

PowerShell:

```powershell
if ($pm -eq 'pnpm') {
  pnpm add -D remark-gfm
} elseif ($pm -eq 'npm') {
  npm install -D remark-gfm
} elseif ($pm -eq 'yarn') {
  yarn add -D remark-gfm
} else {
  throw "Unsupported package manager: $pm"
}
```

- [ ] **Step 2: Remove `@storybook/addon-styling-webpack` dependency**

PowerShell:

```powershell
if ($pm -eq 'pnpm') {
  pnpm remove @storybook/addon-styling-webpack
} elseif ($pm -eq 'npm') {
  npm uninstall @storybook/addon-styling-webpack
} elseif ($pm -eq 'yarn') {
  yarn remove @storybook/addon-styling-webpack
}
```

- [ ] **Step 3: Add the GFM import to `main.ts`**

Add:

```ts
import remarkGfm from 'remark-gfm';
```

Do not remove the current CSF plugin import yet.

- [ ] **Step 4: Replace story discovery with one canonical pattern per source type**

Replace the current overlapping globs with:

```ts
stories: [
  '../.storybook/*.mdx',
  '../ClientApp/src/**/*.mdx',
  '../ClientApp/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
],
```

The existing globs overlap today.

- [ ] **Step 5: Replace addon-docs options**

Replace:

```ts
{
  name: '@storybook/addon-docs',
  options: {
    autodocs: 'tag',
    defaultName: 'Documentation',
    docsMode: true,
    mdxPluginOptions: {},
  },
},
```

with:

```ts
{
  name: '@storybook/addon-docs',
  options: {
    mdxPluginOptions: {
      mdxCompileOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  },
},
```

Autodocs activation remains in `preview.ts`, not here.

- [ ] **Step 6: Remove the Webpack styling addon registration**

Delete:

```ts
'@storybook/addon-styling-webpack'
```

from `addons`.

- [ ] **Step 7: Add top-level Docs ownership**

Immediately after `addons`, add:

```ts
docs: {
  defaultName: 'Documentation',
  docsMode: false,
},
```

Storybook currently documents `docs.defaultName` and `docs.docsMode`, with `docsMode` defaulting to false.

- [ ] **Step 8: Remove Vite-inapplicable TypeScript checking**

Delete:

```ts
typescript: {
  check: true,
},
```

Do not replace it with `react-docgen-typescript` yet.

- [ ] **Step 9: Preserve existing Sass and production chunking logic**

Do **not** rewrite:

- `quietDeps`;
- `silenceDeprecations`;
- production chunk splitting;
- `chunkSizeWarningLimit`;

unless a compile failure proves the current logic incompatible with the Storybook changes.

- [ ] **Step 10: Run targeted governance tests**

```powershell
& $pm exec vitest run tests/unit/storybook/storybookDocsConfig.test.ts
```

Expected: some tests remain RED because `preview.ts`, `preview-docs.ts`, and developer guidance have not yet been changed.

The `main.ts`-specific assertions must now pass.

- [ ] **Step 11: Type-check**

Use the repository's normal type-check command discovered in Task 1.

Also run:

```powershell
& $pm exec tsc --noEmit
```

if that is compatible with the repository's TypeScript structure.

- [ ] **Step 12: Build docs**

```powershell
& $pm exec storybook build --docs --output-dir storybook-static-task3
```

Expected: PASS.

- [ ] **Step 13: Remove generated output**

```powershell
Remove-Item -Recurse -Force storybook-static-task3
```

- [ ] **Step 14: Commit**

```bash
git add .storybook/main.ts package.json
git add pnpm-lock.yaml package-lock.json yarn.lock 2>/dev/null || true
git commit -m "refactor: align Storybook docs config with React Vite"
```

Only stage the actual repository lockfile.

---

# Task 4: Refactor `preview.ts`, Enable Code Panel and Remove Shadow Autodocs Configuration

**Files:**
- Modify: `.storybook/preview.ts`
- Delete: `.storybook/preview-docs.ts`

**Interfaces:**
- Retains global Autodocs.
- Retains router decorator.
- Retains MSW.
- Retains a11y configuration.
- Retains global layout.
- Produces one `parameters.docs` policy.
- Produces Code Panel.

## Steps

- [ ] **Step 1: Remove the custom Docs import**

Delete:

```ts
import { autoDocsTemplate, expectedAddonDocsConfig } from './preview-docs';
```

- [ ] **Step 2: Preserve global Autodocs**

Retain exactly:

```ts
tags: ['autodocs'],
```

This is already correct.

- [ ] **Step 3: Replace `parameters.docs`**

Replace the current Docs block with:

```ts
docs: {
  toc: true,

  codePanel: true,

  controls: {
    exclude: ['as', 'bsPrefix', 'ref', 'key'],
    sort: 'requiredFirst',
  },

  canvas: {
    sourceState: 'hidden',
  },

  source: {
    excludeDecorators: true,
    type: 'auto',
  },
},
```

Storybook 10.5 documents global Code Panel configuration at `parameters.docs.codePanel`, and confirms that the panel reuses the Source Doc Block configuration.

- [ ] **Step 4: Remove shadow or generic Docs configuration**

Ensure all of these are absent:

```ts
docs.enabled
docs.autodocs
expectedAddonDocsConfig
docs.description.component
docs.page
autoDocsTemplate
```

- [ ] **Step 5: Delete `preview-docs.ts`**

Delete:

`.storybook/preview-docs.ts`

The file currently duplicates Storybook's default Autodocs page.

- [ ] **Step 6: Run governance tests**

```powershell
& $pm exec vitest run tests/unit/storybook/storybookDocsConfig.test.ts
```

Expected: only developer-guide assertions should remain RED.

- [ ] **Step 7: Run current Storybook tests**

Run the Storybook-related unit/test command recorded in Task 1.

- [ ] **Step 8: Build documentation**

```powershell
& $pm exec storybook build --docs --output-dir storybook-static-task4
```

Expected: PASS.

- [ ] **Step 9: Clean output**

```powershell
Remove-Item -Recurse -Force storybook-static-task4
```

- [ ] **Step 10: Commit**

```bash
git add .storybook/preview.ts .storybook/preview-docs.ts
git commit -m "refactor: simplify Storybook autodocs preview policy"
```

---

# Task 5: Rewrite the Component Documentation Guide as the Governance Contract

**Files:**
- Modify: `.storybook/component-docs-guide.mdx`
- Modify: `.storybook/introduction.mdx`
- Conditionally modify/delete: `ClientApp/src/storybook/DocsTable.*`

**Interfaces:**
- Produces authoritative developer guidance.
- Makes governance tests GREEN.
- Does not change component runtime behaviour.

## Required content changes

The guide must teach these twelve rules:

```text
1. Autodocs is enabled globally.
2. !autodocs is the explicit opt-out.
3. TypeScript owns prop types.
4. JSDoc owns semantic component/prop descriptions.
5. CSF stories own executable examples.
6. args represent runtime story state.
7. argTypes augment inferred metadata.
8. Parameters configure Storybook and follow project → meta → story scope.
9. MDX is for narrative or exceptional documentation.
10. Doc Blocks compose MDX and custom docs.
11. Source and Code Panel share parameters.docs.source.
12. Documentation must build successfully in CI.
```

## Steps

- [ ] **Step 1: Replace the incorrect Autodocs tag section**

Remove the current `'docs'` tag guidance. It is currently incorrect.

Replace it with:

```mdx
## Autodocs policy

Autodocs is enabled globally by `.storybook/preview.ts`:

```ts
tags: ['autodocs']
```

Normal component story files do **not** need to repeat this tag.

```ts
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MyComponent } from './MyComponent';

const meta = {
  component: MyComponent,
} satisfies Meta<typeof MyComponent>;

export default meta;

type Story = StoryObj<typeof meta>;
```

### Opting out

Use Storybook's negative tag syntax when a component or story should not
participate in Autodocs:

```ts
const meta = {
  component: InternalComponent,
  tags: ['!autodocs'],
} satisfies Meta<typeof InternalComponent>;
```

A single story can also remove an inherited tag:

```ts
export const InternalState: Story = {
  tags: ['!autodocs'],
};
```

Do not use `'docs'` as an Autodocs activation tag.
```

- [ ] **Step 2: Add Args versus ArgTypes guidance**

Add:

```mdx
## Args and ArgTypes

### Args

`args` are runtime values passed to a story:

```ts
export const Primary: Story = {
  args: {
    variant: 'primary',
    disabled: false,
  },
};
```

### ArgTypes

`argTypes` describe how Storybook documents or controls those values:

```ts
const meta = {
  component: PrimaryButton,

  argTypes: {
    variant: {
      options: ['primary', 'secondary'],
      control: 'inline-radio',
      table: {
        category: 'Appearance',
      },
    },
  },
} satisfies Meta<typeof PrimaryButton>;
```

Prefer Storybook's inferred ArgTypes. Add manual ArgTypes only when they
provide semantics that TypeScript/JSDoc cannot express clearly, such as
control behaviour, options, mappings, conditional display, categories, or
intentional hiding.
```

- [ ] **Step 3: Add parameter inheritance guidance**

Add:

```mdx
## Parameters and configuration scope

Storybook parameters are static metadata used by stories and addons.

Configuration is inherited from least specific to most specific:

```text
project (`preview.ts`)
        ↓
component (`meta`)
        ↓
story
```

More specific configuration overrides inherited configuration.

Put project-wide policy in `preview.ts`. Use component or story parameters
only for deliberate exceptions.

Example:

```ts
export const ComplexExample: Story = {
  parameters: {
    docs: {
      source: {
        type: 'code',
      },
    },
  },
};
```
```

Current Storybook documentation defines parameter scope exactly at project, meta, and story level, with more specific scopes overriding less specific ones.

- [ ] **Step 4: Correct the JSDoc example guidance**

Replace claims that JSDoc `@example` automatically becomes the canonical Storybook source example.

Use:

```mdx
## JSDoc and executable examples

Use JSDoc for semantic documentation:

- component purpose;
- prop meaning;
- constraints;
- usage intent;
- deprecation information.

Use CSF stories for executable examples, interactive states, source snippets,
Controls, Code Panel output, and regression coverage.

A JSDoc `@example` may still be useful to IDE consumers, but it is not the
project's canonical Storybook example mechanism.
```

- [ ] **Step 5: Correct `@internal` guidance**

Replace any implication that `@internal` is Storybook's reliable Autodocs exclusion mechanism with:

```mdx
## Internal APIs

`@internal` is a source-code documentation convention. Do not rely on it as
the Storybook visibility control unless repository tooling explicitly
implements that behaviour.

For Storybook documentation visibility, use `!autodocs`.

For a prop that should remain available to the component but not appear in
the API table:

```ts
argTypes: {
  internalProp: {
    table: {
      disable: true,
    },
  },
},
```
```

- [ ] **Step 6: Add Code Panel and Source guidance**

Add:

```mdx
## Source and Code Panel

The project enables the Code Panel globally:

```ts
parameters: {
  docs: {
    codePanel: true,
  },
},
```

Storybook's Code Panel and Source Doc Block use the same source configuration:

```ts
parameters: {
  docs: {
    source: {
      type: 'auto',
      excludeDecorators: true,
    },
  },
},
```

Override this only when a specific story needs different source behaviour.
```

- [ ] **Step 7: Add MDX versus Autodocs guidance**

Add:

```mdx
## When to use Autodocs and when to use MDX

Use Autodocs for the normal component baseline:

- description;
- API metadata;
- Controls;
- stories;
- source examples.

Use MDX when documentation requires narrative material that cannot be
derived cleanly from component metadata:

- design guidance;
- accessibility guidance;
- cross-component workflows;
- comparisons;
- architectural explanations;
- migration guidance.

For a component-specific custom page, attach MDX to its story exports:

```mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as ButtonStories from './Button.stories';

<Meta of={ButtonStories} />

# Button

Use buttons to trigger actions.

<Canvas of={ButtonStories.Primary} />

## API

<Controls />
```

Always pass the full story-module exports to `<Meta of={...} />`, not the
component itself.
```

Storybook's current MDX documentation explicitly distinguishes CSF as the story format and MDX as the structured narrative format, and requires full story exports for `Meta of`.

- [ ] **Step 8: Add a Doc Blocks capability section**

Document:

```md
### Core component documentation
`Meta`, `Description`, `Primary`, `Story`, `Stories`, `Canvas`, `Source`,
`Controls`, `ArgTypes`

### Design-system documentation
`ColorPalette`, `Typeset`, `IconGallery`

### Structural and utility documentation
`Title`, `Subtitle`, `TableOfContents`, `Markdown`, `Unstyled`
```

State explicitly:

```text
Do not use every block merely because it exists.
Choose the block that solves the documentation problem.
```

- [ ] **Step 9: Replace the blanket “prefer DocsTable” guidance**

Because `remark-gfm` is now configured, change the policy to:

```mdx
## Tables in MDX

Use standard Markdown tables for simple static documentation.

`remark-gfm` is enabled by the Storybook Docs configuration to support GFM
table syntax.

Use the shared `DocsTable` component only when a table requires custom
behaviour, semantics, or presentation beyond Markdown.

The Storybook-specific table stylesheet remains necessary because Bootstrap
Reboot affects plain Markdown table presentation.
```

- [ ] **Step 10: Evaluate whether `DocsTable` remains used**

Run:

```powershell
rg -n --hidden --glob '!node_modules/**' "DocsTable" .storybook ClientApp tests
```

If zero imports remain after conversion, delete the component.

If other pages use it for genuine custom behaviour, retain it.

- [ ] **Step 11: Update Getting Started documentation**

Add to `.storybook/introduction.mdx`:

```mdx
## Documentation mode

Preview the documentation-focused Storybook:

```bash
storybook dev --docs
```

Build publishable documentation:

```bash
storybook build --docs
```

The static documentation build is emitted to `storybook-static/`.
```

The official build documentation recommends both commands and documents the `storybook-static` output.

- [ ] **Step 12: Verify governance tests become GREEN**

```powershell
& $pm exec vitest run tests/unit/storybook/storybookDocsConfig.test.ts
```

Expected:

```text
PASS
```

- [ ] **Step 13: Build docs**

```powershell
& $pm exec storybook build --docs --output-dir storybook-static-task5
```

Expected:

```text
PASS
```

Specifically inspect the Style Guide table and confirm GFM parsing works.

- [ ] **Step 14: Clean output**

```powershell
Remove-Item -Recurse -Force storybook-static-task5
```

- [ ] **Step 15: Commit**

```bash
git add .storybook/component-docs-guide.mdx .storybook/introduction.mdx
git add ClientApp/src/storybook/DocsTable.* 2>/dev/null || true
git commit -m "docs: establish Storybook documentation contract"
```

---

# Task 6: Verify Metadata Inference and Refine Representative Stories

**Files:**
- Inspect/conditionally modify the three representative component and story files chosen in Task 1.
- Do not bulk-edit all stories.

**Interfaces:**
- Proves TypeScript/JSDoc-first metadata inference.
- Produces evidence for Args/ArgTypes rubric scoring.
- Produces the docgen decision input for Task 9.

## Steps

- [ ] **Step 1: Inspect the three representative CSF files**

For each, verify:

```ts
const meta = {
  component: ActualComponent,
} satisfies Meta<typeof ActualComponent>;
```

or an equivalent typed Storybook pattern exists.

If the story has no `component` reference, fix that before assessing inference.

- [ ] **Step 2: Inspect component prop documentation**

For each representative component, verify meaningful TypeScript/JSDoc exists for important public props.

A good pattern:

```ts
export interface ExampleProps {
  /** Visible text or child content rendered by the component. */
  children: React.ReactNode;

  /** Visual treatment used to express the component's semantic intent. */
  variant?: 'primary' | 'secondary';

  /** Prevents user interaction when true. */
  disabled?: boolean;
}
```

Do not add redundant JSDoc such as:

```ts
/** Disabled. */
disabled?: boolean;
```

unless it actually improves understanding.

- [ ] **Step 3: Remove manual ArgTypes that merely duplicate TypeScript**

For each representative story, classify manual ArgTypes:

```text
Keep:
- control
- options
- mapping
- if
- category
- intentional description override
- table.disable

Remove:
- duplicated primitive type
- duplicated union type already inferred
- duplicated default already expressed by component/story metadata
```

- [ ] **Step 4: Add intentional ArgTypes only where they improve documentation**

Example:

```ts
argTypes: {
  variant: {
    options: ['primary', 'secondary'],
    control: 'inline-radio',
    table: {
      category: 'Appearance',
    },
  },
},
```

- [ ] **Step 5: Ensure representative stories use `args`**

At least one representative story must demonstrate:

```ts
export const Default: Story = {
  args: {
    // representative public values
  },
};
```

Avoid custom render functions when ordinary args can express the state.

- [ ] **Step 6: Build docs and inspect inferred API**

```powershell
& $pm exec storybook build --docs --output-dir storybook-static-inference
```

Verify for all three samples:

```text
[ ] public props appear
[ ] required/optional status is sensible
[ ] descriptions appear
[ ] union/enum options are understandable
[ ] Controls render
[ ] manual ArgTypes enhance rather than duplicate inference
```

- [ ] **Step 7: Record inference evidence**

Append a table to:

`docs/storybook/storybook-refactor-baseline.md`

with:

```markdown
## Metadata inference verification

| Component | Public props | Required state | Descriptions | Union/enum | Result |
|---|---|---|---|---|---|
```

Fill actual results.

- [ ] **Step 8: Clean output**

```powershell
Remove-Item -Recurse -Force storybook-static-inference
```

- [ ] **Step 9: Run related tests**

Run unit/story tests for any component source files modified in this task.

- [ ] **Step 10: Commit**

```bash
git add <only-the-actual-component-and-story-files-modified>
git add docs/storybook/storybook-refactor-baseline.md
git commit -m "docs: improve Storybook metadata inference examples"
```

The implementation agent must replace the staging expression with the exact changed paths shown by `git status`; do not stage unrelated files.

---

# Task 7: Add Repeatable Docs Build Verification

**Files:**
- Modify: `package.json`
- Create: `scripts/verify-storybook-docs.mjs`

**Interfaces:**
- Produces a stable documentation verification command for local and CI use.
- Does not require browser automation.

## Steps

- [ ] **Step 1: Add documentation scripts without deleting existing scripts**

Add if equivalent scripts do not already exist:

```json
{
  "storybook:docs": "storybook dev --docs",
  "storybook:build:docs": "storybook build --docs",
  "storybook:verify:docs": "storybook build --docs && node scripts/verify-storybook-docs.mjs"
}
```

If repository naming conventions use `build-storybook:*`, follow the existing naming convention but preserve the commands.

- [ ] **Step 2: Create static-output verification**

Create `scripts/verify-storybook-docs.mjs`:

```js
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const staticDir = resolve(root, 'storybook-static');

const requiredFiles = [
  'index.html',
  'iframe.html',
  'index.json',
];

for (const file of requiredFiles) {
  await access(resolve(staticDir, file));
}

const index = JSON.parse(
  await readFile(resolve(staticDir, 'index.json'), 'utf8'),
);

const entries = Object.values(index.entries ?? {});

if (entries.length === 0) {
  throw new Error('Storybook index contains no entries.');
}

const docsEntries = entries.filter((entry) => entry.type === 'docs');
const storyEntries = entries.filter((entry) => entry.type === 'story');

if (docsEntries.length === 0) {
  throw new Error('Storybook index contains no documentation entries.');
}

if (storyEntries.length === 0) {
  throw new Error('Storybook index contains no story entries.');
}

const hasDocumentationSection = docsEntries.some((entry) =>
  String(entry.title ?? '').startsWith('Documentation/'),
);

if (!hasDocumentationSection) {
  throw new Error(
    'Expected at least one standalone Documentation/* MDX entry.',
  );
}

console.log(
  JSON.stringify(
    {
      totalEntries: entries.length,
      docsEntries: docsEntries.length,
      storyEntries: storyEntries.length,
      documentationSection: hasDocumentationSection,
    },
    null,
    2,
  ),
);
```

- [ ] **Step 3: Run the new verification**

```powershell
& $pm run storybook:verify:docs
```

Expected:

```text
Storybook build succeeds.
storybook-static exists.
index.html exists.
iframe.html exists.
index.json exists.
At least one docs entry exists.
At least one story entry exists.
Documentation/* standalone MDX exists.
Exit code 0.
```

- [ ] **Step 4: Clean generated static output unless CI intentionally retains it**

```powershell
Remove-Item -Recurse -Force storybook-static
```

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/verify-storybook-docs.mjs
git add pnpm-lock.yaml package-lock.json yarn.lock 2>/dev/null || true
git commit -m "test: add Storybook documentation build gate"
```

---

# Task 8: Add Runtime Acceptance Coverage for Autodocs, MDX, Source and Code Panel

**Files:**
- Create: `tests/e2e/features/storybook/autodocs-documentation.feature`
- Modify: the existing Storybook BDD step-definition file discovered and recorded in Task 1

**Interfaces:**
- Uses the repository's existing BDD infrastructure.
- Produces runtime evidence required before removing CSF plugin injection.

## Steps

- [ ] **Step 1: Create the feature**

Create:

```gherkin
@storybook @documentation
Feature: Storybook documentation architecture

  Scenario: Generated component documentation is available
    Given Storybook is running
    When I open a representative component documentation page
    Then the component documentation page is visible
    And the component API documentation is visible
    And the component stories are visible

  Scenario: Story source is available from generated documentation
    Given Storybook is running
    When I open a representative component documentation page
    Then a Storybook source example is available
    And Storybook decorators are not included in the displayed source

  Scenario: Code Panel is available for an individual story
    Given Storybook is running
    When I open a representative component story
    Then the Storybook Code Panel is available
    And the Code Panel contains source for the current story

  Scenario: Standalone MDX documentation renders
    Given Storybook is running
    When I open the Documentation Style Guide
    Then the Style Guide is visible
    And its typography documentation is visible
    And its colour documentation is visible
    And its Markdown table is rendered

  Scenario: Documentation navigation includes the project guides
    Given Storybook is running
    Then Documentation Getting Started is available
    And Documentation Component Documentation Guide is available
    And Documentation Style Guide is available
```

- [ ] **Step 2: Reuse existing Storybook navigation helpers**

Do not create a second Storybook server or second navigation abstraction if the existing BDD steps already provide them.

Extend the exact Storybook step-definition module recorded in Task 1.

Use accessible roles and stable Storybook IDs/manifest data rather than brittle CSS selectors.

- [ ] **Step 3: Use the representative component selected in Task 1**

Do not hard-code a new synthetic component solely for this feature.

Use its existing stable story ID.

- [ ] **Step 4: Generate BDD tests**

Run the existing command documented by the project:

```powershell
npx bddgen
```

or the package-manager equivalent already used by the repository.

- [ ] **Step 5: Execute Storybook BDD coverage**

Run the project's existing command, which the current documentation records as:

```bash
npx playwright test --grep "@storybook" --reporter=list
```

The project's existing documentation already establishes this workflow.

Expected:

```text
All existing Storybook scenarios pass.
All five documentation scenarios pass.
```

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/features/storybook/autodocs-documentation.feature
git add <exact-existing-storybook-step-definition-file>
git commit -m "test: cover Storybook autodocs documentation runtime"
```

---

# Task 9: A/B Test and Remove Explicit CSF Plugin Only if Proven Redundant

**Files:**
- Conditionally modify: `.storybook/main.ts`

**Interfaces:**
- Consumes runtime tests from Task 8.
- Produces either a simpler configuration or documented proof that the workaround remains necessary.

Current `main.ts` manually injects the CSF plugin because of an internal assumption about React/Vite source extraction.

This must be tested, not guessed.

## Steps

- [ ] **Step 1: Run GREEN baseline with explicit CSF plugin**

Run:

```powershell
& $pm exec vitest run tests/unit/storybook/storybookDocsConfig.test.ts
```

Then:

```powershell
npx bddgen
npx playwright test --grep "@storybook" --reporter=list
```

Then:

```powershell
& $pm run storybook:verify:docs
```

All must pass.

Record results under:

```markdown
## Explicit CSF plugin A/B test

### A — explicit plugin present
```

- [ ] **Step 2: Remove only the explicit plugin injection**

Delete:

```ts
import { vite as csfPlugin } from '@storybook/csf-plugin';
```

Delete:

```ts
const additionalPlugins = [csfPlugin({})];
```

Remove:

```ts
plugins: additionalPlugins,
```

from the repository-specific Vite configuration.

Do not alter unrelated Sass options.

- [ ] **Step 3: Run the exact same checks**

```powershell
& $pm exec vitest run tests/unit/storybook/storybookDocsConfig.test.ts
npx bddgen
npx playwright test --grep "@storybook" --reporter=list
& $pm run storybook:verify:docs
```

- [ ] **Step 4: Apply objective decision**

If all checks remain green:

```text
REMOVE the explicit CSF plugin permanently.
```

If source snippets, Code Panel, or story transformation regress:

```text
RESTORE the plugin.
Add a comment documenting:
- installed Storybook version;
- exact failing regression;
- exact test proving why it is required.
```

Do not keep the workaround “just in case.”

- [ ] **Step 5: Record B result**

Append:

```markdown
### B — explicit plugin removed
- Governance tests:
- Storybook BDD:
- Code Panel:
- Source:
- Docs build:

### Decision
- Removed / Retained:
- Evidence:
```

- [ ] **Step 6: Clean generated output**

```powershell
if (Test-Path 'storybook-static') {
  Remove-Item -Recurse -Force storybook-static
}
```

- [ ] **Step 7: Commit**

If removed:

```bash
git add .storybook/main.ts docs/storybook/storybook-refactor-baseline.md
git commit -m "refactor: remove redundant Storybook CSF plugin override"
```

If retained:

```bash
git add .storybook/main.ts docs/storybook/storybook-refactor-baseline.md
git commit -m "docs: record required Storybook CSF plugin workaround"
```

---

# Task 10: Make the React Docgen Decision Using Evidence

**Files:**
- Conditionally modify: `.storybook/main.ts`

**Interfaces:**
- Consumes Task 6 inference results.
- Produces a documented decision to retain `react-docgen` defaults or opt into `react-docgen-typescript`.

Storybook currently uses `react-docgen` by default for React and documents `react-docgen-typescript` as slower but potentially more accurate, including specific guidance for difficult inference and workspace components.

## Steps

- [ ] **Step 1: Review Task 6 inference evidence**

If all three representative components have acceptable metadata:

```text
Do not add any typescript.reactDocgen override.
Use the Storybook default.
```

- [ ] **Step 2: Escalate only if material inference failures exist**

A material failure means one of:

```text
public prop missing
required/optional state materially wrong
union/enum values unavailable where documentation needs them
forwardRef/wrapper props unusably incomplete
workspace component public API missing
```

Cosmetic formatting differences do not qualify.

- [ ] **Step 3: If required, configure `react-docgen-typescript`**

Add only:

```ts
typescript: {
  reactDocgen: 'react-docgen-typescript',
},
```

Start with no custom options.

- [ ] **Step 4: If workspace source falls outside the parser program, add exact includes**

Only if the repository is a workspace and evidence proves required:

```ts
typescript: {
  reactDocgen: 'react-docgen-typescript',
  reactDocgenTypescriptOptions: {
    include: [
      '**/*.tsx',
      '../packages/*/src/**/*.tsx',
    ],
  },
},
```

Use actual repository package paths rather than copying this example blindly.

- [ ] **Step 5: Repeat metadata and build checks**

Run:

```powershell
& $pm run storybook:verify:docs
```

plus Storybook BDD.

Compare metadata quality and build time with the default parser.

- [ ] **Step 6: Use the least-complex parser that meets the requirement**

Decision priority:

```text
react-docgen default
    ↓ only if inadequate
react-docgen-typescript
```

- [ ] **Step 7: Commit only if configuration changes**

```bash
git add .storybook/main.ts docs/storybook/storybook-refactor-baseline.md
git commit -m "refactor: improve Storybook TypeScript metadata inference"
```

If no change was required, record the decision in the evidence document and do not create an empty commit.

---

# Task 11: Integrate Documentation Verification into CI

**Files:**
- Modify: existing frontend CI workflow/pipeline identified in Task 1
- Modify if necessary: `package.json`

**Interfaces:**
- Consumes `storybook:verify:docs`.
- Makes documentation breakage a normal CI failure.

## Steps

- [ ] **Step 1: Add the documentation gate after dependency installation and before deployment**

The CI job must invoke the repository script rather than reimplementing the command inline:

```bash
<package-manager> run storybook:verify:docs
```

Use the actual package manager discovered in Task 1.

- [ ] **Step 2: Ensure BDD Storybook coverage remains in CI**

If the existing pipeline already runs all Storybook BDD tests, leave it alone.

If it does not, add the existing commands:

```bash
npx bddgen
npx playwright test --grep "@storybook" --reporter=list
```

using repository-native command wrappers where already available.

- [ ] **Step 3: Do not publish `storybook-static` from ordinary CI unless publishing is already intended**

Verification and publication are separate concerns.

If the repository already publishes Storybook/Chromatic, preserve its existing mechanism.

- [ ] **Step 4: Run the CI-equivalent command locally**

Execute the same package script and Storybook test command the pipeline now uses.

- [ ] **Step 5: Commit**

```bash
git add <exact-ci-workflow-or-pipeline-file> package.json
git commit -m "ci: verify Storybook documentation build"
```

---

# Task 12: Final Documentation Architecture Verification

**Files:**
- Modify: `docs/storybook/storybook-refactor-baseline.md`
- Create: `docs/storybook/STORYBOOK-DOCS-QUALITY-GATE.md`

**Interfaces:**
- Produces completion evidence.
- Produces an objective rubric score.
- Blocks completion below 95.

## Steps

- [ ] **Step 1: Run static configuration search**

Run:

```powershell
rg -n --hidden --glob '!node_modules/**' `
  "Adding the ['""]docs['""] Tag|add the ['""]docs['""] tag|expectedAddonDocsConfig|autoDocsTemplate|addon-styling-webpack|check:\s*true|docs:\s*\{[^}]*autodocs|Component documentation generated from JSDoc comments and Storybook autodocs" `
  .storybook ClientApp tests package.json
```

Expected:

```text
No prohibited matches.
```

Do not consider legitimate prose uses of the word “docs” a failure; evaluate exact matched context.

- [ ] **Step 2: Run configuration tests**

```powershell
& $pm exec vitest run tests/unit/storybook/storybookDocsConfig.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run the repository's full unit suite**

Use the exact command captured in Task 1.

Expected: PASS, excluding documented unrelated pre-existing failures.

- [ ] **Step 4: Run TypeScript**

Use the repository's normal type-check script.

Expected: PASS.

- [ ] **Step 5: Run BDD generation**

```powershell
npx bddgen
```

Expected: PASS.

- [ ] **Step 6: Run Storybook BDD**

```powershell
npx playwright test --grep "@storybook" --reporter=list
```

Expected:

```text
All Storybook tests pass.
Documentation scenarios pass.
```

- [ ] **Step 7: Build and verify documentation**

```powershell
& $pm run storybook:verify:docs
```

Expected: PASS.

- [ ] **Step 8: Verify final feature behaviour**

Confirm:

```text
[ ] Global Autodocs is enabled.
[ ] !autodocs is documented.
[ ] No local tag repetition is required for ordinary stories.
[ ] Component JSDoc can populate descriptions.
[ ] Args drive story state.
[ ] ArgTypes enhance rather than duplicate inference.
[ ] Controls render.
[ ] TOC renders.
[ ] Code Panel renders.
[ ] Source snippets render.
[ ] Source excludes decorators.
[ ] MDX standalone pages render.
[ ] GFM tables render.
[ ] Typeset renders.
[ ] ColorPalette renders.
[ ] IconGallery renders.
[ ] Story references in Style Guide render.
[ ] `storybook build --docs` succeeds.
[ ] `storybook-static` contains stories and docs.
```

- [ ] **Step 9: Create the final quality gate**

Create `docs/storybook/STORYBOOK-DOCS-QUALITY-GATE.md`:

```markdown
# Storybook Documentation Quality Gate

## Baseline

Record:
- Storybook version
- branch
- final commit

## Automated verification

| Check | Command | Result |
|---|---|---|
| Governance | Storybook config Vitest | PASS |
| TypeScript | repository type check | PASS |
| Unit | repository unit suite | PASS |
| BDD generation | bddgen | PASS |
| Storybook runtime | Storybook Playwright/BDD | PASS |
| Docs build | storybook:verify:docs | PASS |

## Rubric

| Category | Weight | Score | Evidence |
|---|---:|---:|---|
| Autodocs and tag model | 15 | 15 | |
| MDX architecture | 10 | 10 | |
| Doc Blocks | 12 | 12 | |
| Code Panel and Source | 8 | 8 | |
| Args, ArgTypes and inference | 13 | 13 | |
| Parameters and inheritance | 10 | 10 | |
| Docs build and publishing | 8 | 8 | |
| main.ts, addons and TypeScript | 8 | 8 | |
| Architecture and maintainability | 6 | 6 | |
| Evidence, currency and actionability | 10 | 9 | |
| **Total** | **100** | **99** | |

## Critical-error caps

- [x] Does not claim `docs` is the Autodocs trigger.
- [x] Does not claim addon config alone activates Autodocs.
- [x] Does not recommend Storysource instead of Code Panel.
- [x] Does not reverse parameter precedence.
- [x] Does not replace metadata inference with manual ArgTypes by default.
- [x] Records the tested Storybook version.
- [x] Uses official Storybook references as the architectural baseline.

## Final result

Target: >=95/100
Actual:
Critical cap triggered: No
Status: PASS / FAIL
```

Populate evidence and actual score. Do not pre-fill PASS where evidence is missing.

- [ ] **Step 10: Apply the 95-point completion gate**

Completion rule:

```text
score >= 95
AND
critical cap triggered == false
AND
storybook:verify:docs == PASS
AND
Storybook runtime documentation tests == PASS
```

Otherwise the implementation is **not complete**.

- [ ] **Step 11: Remove generated static output**

Unless intentionally published/tracked:

```powershell
if (Test-Path 'storybook-static') {
  Remove-Item -Recurse -Force storybook-static
}
```

- [ ] **Step 12: Commit final evidence**

```bash
git add docs/storybook/storybook-refactor-baseline.md
git add docs/storybook/STORYBOOK-DOCS-QUALITY-GATE.md
git commit -m "docs: certify Storybook documentation architecture"
```

---

# Final Expected `main.ts` Documentation Shape

The final documentation-related shape should resemble:

```ts
import type { StorybookConfig } from '@storybook/react-vite';
import remarkGfm from 'remark-gfm';

const config = {
  framework: '@storybook/react-vite',

  stories: [
    '../.storybook/*.mdx',
    '../ClientApp/src/**/*.mdx',
    '../ClientApp/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],

  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-links',
    'msw-storybook-addon',
    '@storybook/addon-vitest',
    '@chromatic-com/storybook',

    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },

    {
      name: '@storybook/addon-mcp',
      options: {
        toolsets: {
          dev: true,
          docs: true,
          test: true,
        },
      },
    },
  ],

  docs: {
    defaultName: 'Documentation',
    docsMode: false,
  },

  staticDirs: ['../ClientApp/public'],

  async viteFinal(config, { configType }) {
    const { mergeConfig } = await import('vite');

    // Preserve only repository-specific Vite/Sass/build behaviour that has
    // independently demonstrated value.

    return mergeConfig(config, {
      // Existing justified Sass/build configuration.
    });
  },
} satisfies StorybookConfig;

export default config;
```

The explicit CSF plugin may remain only if Task 9 proves it required.

A `typescript` block should remain absent unless Task 10 proves `react-docgen-typescript` necessary.

---

# Final Expected `preview.ts` Documentation Shape

The final relevant structure should resemble:

```ts
import type { Preview } from '@storybook/react-vite';

const preview = {
  tags: ['autodocs'],

  // Existing decorators, loaders, beforeEach and non-doc parameters remain.

  parameters: {
    controls: {
      hideNoControlsWarning: true,
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },

    docs: {
      toc: true,

      codePanel: true,

      controls: {
        exclude: ['as', 'bsPrefix', 'ref', 'key'],
        sort: 'requiredFirst',
      },

      canvas: {
        sourceState: 'hidden',
      },

      source: {
        excludeDecorators: true,
        type: 'auto',
      },
    },
  },
} satisfies Preview;

export default preview;
```

---

# Rollback Strategy

Every implementation task is intentionally committed separately.

If a regression appears:

```text
Task 3 regression
→ revert main.ts configuration commit.

Task 4 regression
→ restore preview configuration / preview-docs.ts commit.

Task 5 documentation regression
→ revert only documentation-governance commit.

Task 8 runtime-test issue
→ fix the test if it is objectively wrong;
  do not weaken production configuration merely to satisfy a brittle selector.

Task 9 CSF plugin regression
→ restore only the explicit CSF plugin and retain evidence.

Task 10 docgen performance or accuracy regression
→ return to default react-docgen.
```

Do not revert the entire branch to solve a single-task regression.

---

# Definition of Done

The AI agent may state **“Storybook Autodocs refactor complete”** only when all of the following are true:

- [ ] The actual installed Storybook version was identified and recorded.
- [ ] Global `tags: ['autodocs']` remains the activation model.
- [ ] Developer guidance no longer teaches `'docs'` as the Autodocs trigger.
- [ ] `!autodocs` is documented correctly.
- [ ] `defaultName` and `docsMode` are owned by `main.ts → docs`.
- [ ] Duplicate Autodocs state has been removed from `preview.ts`.
- [ ] Global generic component description has been removed.
- [ ] Default Autodocs template duplication has been removed.
- [ ] Code Panel is globally enabled.
- [ ] Source configuration is shared and uses `type: 'auto'` unless a documented exception exists.
- [ ] TOC remains enabled.
- [ ] Duplicate story globs are removed.
- [ ] Webpack-only styling addon is removed from the Vite project.
- [ ] `typescript.check: true` is removed from React/Vite.
- [ ] `remark-gfm` supports Markdown tables.
- [ ] Bootstrap table styling remains where still required.
- [ ] Args, ArgTypes, Parameters and inference responsibilities are documented.
- [ ] JSDoc is treated as semantic documentation, not the executable Storybook example mechanism.
- [ ] MDX and Doc Block usage guidance is current.
- [ ] Three representative components have verified metadata inference.
- [ ] Explicit CSF plugin has been A/B tested.
- [ ] React docgen choice is evidence-based.
- [ ] Static documentation verification exists.
- [ ] Runtime Autodocs/Source/Code Panel/MDX tests exist.
- [ ] CI executes the documentation quality gate.
- [ ] Unit tests pass.
- [ ] Type-check passes.
- [ ] Storybook BDD passes.
- [ ] `storybook build --docs` passes.
- [ ] `storybook-static` is structurally valid.
- [ ] Final rubric score is **≥95**.
- [ ] No critical scoring cap is triggered.
- [ ] Final `git diff` contains no unrelated changes.

---

# Expected Rubric Result

If this plan is implemented exactly and all evidence gates pass, the expected result is:

| Category | Target |
|---|---:|
| Autodocs and tag model | 15/15 |
| MDX architecture | 10/10 |
| Doc Blocks | 12/12 |
| Code Panel and Source | 8/8 |
| Args, ArgTypes and inference | 13/13 |
| Parameters and inheritance | 10/10 |
| Documentation build and publishing | 8/8 |
| `main.ts`, addons and TypeScript | 8/8 |
| Architecture and maintainability | 6/6 |
| Evidence, currency and actionability | 9/10 |
| **Expected total** | **99/100** |

The one-point reserve remains appropriate until the implementation proves its actual installed-version behaviour rather than merely matching the Storybook 10.5 reference architecture.

---

# Execution Handoff

Recommended execution mode:

**Subagent-Driven Development** — one fresh implementation agent per task, with review after each task and explicit RED/GREEN evidence retained in the branch.

For single-agent execution, use `superpowers:executing-plans` and execute in small batches with review checkpoints after Tasks 2, 5, 8, and 12.

Do not batch Tasks 8–10 together. The explicit CSF plugin and docgen decisions require independent evidence and must remain independently reversible.