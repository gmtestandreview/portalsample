# Storybook Autodocs and Documentation Expert Review

## Executive assessment

The current Storybook documentation architecture has a **strong foundation**, particularly in its use of global Autodocs, MDX-based project documentation, specialised Doc Blocks, MSW integration, accessibility tooling, and Storybook-driven testing. However, the implementation contains several configuration and documentation-governance inconsistencies that prevent it from being considered a gold-standard Storybook setup.

This review is benchmarked against the **current official Storybook 10.5 documentation**. The exact installed Storybook version was not supplied in a `package.json`, so version-sensitive changes should be validated against the repository's actual installed package versions before implementation.

### Overall verdict

**Current implementation maturity: 82–87/100**

**Target state after recommendations: 99/100 against the agreed rubric**

The largest issues are not with Autodocs itself—the global `tags: ['autodocs']` configuration is correct—but with the surrounding configuration and developer guidance:

1. The project's own `component-docs-guide.mdx` incorrectly instructs developers to use the built-in `'docs'` tag to enable Autodocs. The current Storybook tag is `'autodocs'`.
2. `main.ts` places `autodocs`, `defaultName`, and `docsMode` inside `@storybook/addon-docs` options even though current Storybook documents `defaultName` and `docsMode` under the top-level `docs` configuration and Autodocs activation through tags.
3. `preview.ts` duplicates this configuration through `docs.enabled`, `docs.autodocs`, and a project-owned `expectedAddonDocsConfig`, none of which should be necessary for the documented Autodocs activation model.
4. A global `parameters.docs.description.component` risks replacing useful component-specific JSDoc descriptions with the same generic description for every component.
5. The project recreates Storybook's standard Autodocs template almost exactly in `preview-docs.ts`, adding code ownership without adding meaningful documentation capability.
6. The Code Panel is not globally enabled even though it is now Storybook's supported replacement for the discontinued Storysource addon.
7. `typescript.check: true` is documented as a **Webpack-specific** Storybook option, yet this project uses `@storybook/react-vite`.
8. `@storybook/addon-styling-webpack` is registered despite the project using Storybook's Vite framework.
9. Story and MDX globs overlap substantially, unnecessarily increasing configuration complexity.
10. MDX documentation uses Markdown pipe tables while the current addon-docs configuration contains an empty `mdxPluginOptions` object. Storybook specifically recommends `remark-gfm` when Markdown tables are required. The existing Bootstrap table CSS addresses styling, not Markdown parsing.\
    The target architecture should be:

**Autodocs first → inference first → CSF for executable states → MDX for narrative → Doc Blocks for composition → parameters for scoped customisation → Code Panel for source inspection → minimal project-owned Storybook infrastructure.**

---

# 1. Review scope and authoritative baseline

This assessment covers:

- `.storybook/main.ts`
- `.storybook/preview.ts`
- `.storybook/preview-docs.ts`
- `component-docs-guide.mdx`
- `introduction.mdx`
- `style-guide.mdx`
- `docs-table-styles.css`
- supporting Storybook mocks/MSW configuration

The authoritative external baseline is the current Storybook documentation covering:

- Autodocs
- MDX
- Doc Blocks
- Code Panel
- ArgTypes
- Parameters
- documentation preview/build
- Vite
- TypeScript integration
- styling
- Docs containers and theming

Storybook 10.5 describes Autodocs as **tag-driven**. A CSF file receives an automatically generated documentation page when at least one effective story has the `autodocs` tag. Project-wide activation is normally achieved in `preview.ts` with `tags: ['autodocs']`.

Your `preview.ts` already does exactly that:

```ts
export default {
  tags: ['autodocs'],
  // ...
} satisfies Preview;
```



**Assessment: correct and should remain the primary Autodocs activation mechanism.**

---

# 2. Priority findings

## P0 — Documentation governance defect: `'docs'` versus `'autodocs'`

The most serious problem is not in the runtime configuration. It is in the developer documentation that teaches people how to extend the system.

`component-docs-guide.mdx` currently states:

> Enable autodocs for a component by adding the 'docs' tag

and shows:

```ts
tags: ['ai-generated', 'needs-work', 'docs']
```

It then repeats that adding `'docs'` creates an Autodocs page.

That is incorrect against the current documented API.

The built-in tag is:

```ts
tags: ['autodocs']
```

and an inherited Autodocs tag can be removed with:

```ts
tags: ['!autodocs']
```

Storybook explicitly documents `autodocs` as the activation mechanism.

### Required correction

Because Autodocs is already globally enabled, normal components require **no local tag at all**.

Recommended developer guidance:

```ts
const meta = {
  component: MyComponent,
} satisfies Meta<typeof MyComponent>;
```

Use component-level tagging only when overriding project policy:

```ts
const meta = {
  component: InternalComponent,
  tags: ['!autodocs'],
} satisfies Meta<typeof InternalComponent>;
```

Story-level opt-out can be used where necessary:

```ts
export const InternalState: Story = {
  tags: ['!autodocs'],
};
```

If another story in the same CSF file still effectively has `autodocs`, the component's generated documentation page can still exist.

### Acceptance criterion

Repository search should return **zero developer instructions claiming ****`'docs'`**** enables Autodocs**.

---

# 3. `main.ts` review

## 3.1 Framework choice — correct

```ts
framework: '@storybook/react-vite'
```

is the correct Storybook framework for the project's React/Vite architecture.

Storybook currently identifies the Vite builder as the recommended default for most projects and automatically merges relevant Vite configuration.

**Status: retain.**

---

## 3.2 Story globs — simplify

Current configuration includes:

```ts
'../ClientApp/src/**/*.stories.@(ts|tsx)',
'../ClientApp/src/**/*.{docs,Docs}.mdx',
'../ClientApp/src/**/*.mdx',
'../ClientApp/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
```



Both pairs overlap.

The broader patterns already include the narrower ones.

### Recommended configuration

```ts
stories: [
  '../.storybook/*.mdx',
  '../ClientApp/src/**/*.mdx',
  '../ClientApp/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
],
```

This is easier to reason about and closely follows the Storybook configuration pattern documented in the official examples.

**Priority: P1.**

---

# 4. Correct placement of Docs configuration

Current `main.ts` configures:

```ts
{
  name: '@storybook/addon-docs',
  options: {
    autodocs: 'tag',
    defaultName: 'Documentation',
    docsMode: true,
    mdxPluginOptions: {},
  },
}
```



This combines different configuration responsibilities.

Current Storybook documentation shows:

```ts
const config = {
  addons: ['@storybook/addon-docs'],

  docs: {
    defaultName: 'Documentation',
    docsMode: true,
  },
};
```

while Autodocs activation is managed by `tags`.

### Required structure

```ts
addons: [
  '@storybook/addon-docs',
  // ...
],

docs: {
  defaultName: 'Documentation',
  docsMode: false,
},
```

### Why `docsMode: false` is preferable here

This Storybook is not merely a documentation website. It contains:

- component stories
- route stories
- accessibility testing
- Vitest integration
- Chromatic
- BDD alignment

The introduction explicitly describes component and route stories and an executable BDD workflow.

Therefore the normal Storybook should retain both Canvas/story and Docs navigation.

For a documentation-only view, use the official CLI mode:

```bash
storybook dev --docs
```

and for publishing:

```bash
storybook build --docs
```

rather than forcing the entire normal Storybook into docs-only mode.\
**Priority: P1.**

---

# 5. Remove duplicate Autodocs state from `preview.ts`

The following current configuration should be reconsidered:

```ts
docs: {
  enabled: true,
  autodocs: expectedAddonDocsConfig.options.autodocs,
  // ...
}
```



The current documented Autodocs activation is already:

```ts
tags: ['autodocs']
```

There is no need for a second project-owned configuration model mirroring that state.

`expectedAddonDocsConfig` similarly duplicates Storybook configuration:

```ts
export const expectedAddonDocsConfig = {
  options: {
    autodocs: 'tag',
    defaultName: 'Documentation',
    docsMode: true,
  },
};
```



### Recommendation

Remove:

```ts
docs.enabled
docs.autodocs
expectedAddonDocsConfig
```

unless some demonstrable custom addon in this repository consumes those fields.

Configuration should have one source of truth.

---

# 6. Remove the cloned default Autodocs template

`preview-docs.ts` currently renders:

```tsx
<Title />
<Subtitle />
<Description />
<Primary />
<Controls />
<Stories />
```



This is effectively Storybook's documented default Autodocs template.

Maintaining an exact copy provides no architectural value and creates an upgrade liability.

### Recommendation

Delete:

```ts
autoDocsTemplate
```

and remove:

```ts
docs: {
  page: autoDocsTemplate,
}
```

from `preview.ts`.

Use Storybook's default page.

Create a custom page only when the organisation actually needs a materially different global information architecture.

For a single component that requires richer documentation, Storybook recommends attached MDX rather than changing every component's global page.

**Priority: P1.**

---

# 7. Global component description is counterproductive

Current configuration contains:

```ts
description: {
  component:
    'Component documentation generated from JSDoc comments and Storybook autodocs.',
},
```



This works against the project's stated goal of deriving meaningful descriptions from component documentation.

Storybook's `Description` block is designed to obtain descriptions from component/meta/story JSDoc or explicit documentation parameters. Storybook recommends JSDoc comments for normal component descriptions and parameter overrides when a deliberate Storybook-specific override is necessary.

### Recommendation

Remove the global description.

Prefer:

```tsx
/**
 * DatePicker allows users to select a calendar date.
 *
 * Use it where a date rather than a date/time value is required.
 */
export function DatePicker(...) {
  // ...
}
```

with:

```ts
const meta = {
  component: DatePicker,
} satisfies Meta<typeof DatePicker>;
```

Storybook can then infer the description rather than displaying identical boilerplate for every component.

**Priority: P0/P1 because it directly reduces generated documentation quality.**

---

# 8. Metadata inference and ArgTypes

This is one of the areas where the architecture should remain automation-first.

Storybook infers ArgTypes from the component referenced by:

```ts
const meta = {
  component: Component,
}
```

For React, the default parser is currently `react-docgen`, with `react-docgen-typescript` available where more detailed TypeScript extraction is required. Manually specified ArgTypes override inferred metadata.

## Recommended policy

### Prefer TypeScript + JSDoc as the source of truth

```ts
export interface PrimaryButtonProps {
  /** Visible button label. */
  children: React.ReactNode;

  /** Visual emphasis applied to the button. */
  variant?: 'primary' | 'secondary';

  /** Prevents user interaction. */
  disabled?: boolean;
}
```

Do **not** manually reproduce all of this in `argTypes`.

### Use manual ArgTypes when adding semantics

For example:

```ts
const meta = {
  component: PrimaryButton,

  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary'],
      table: {
        category: 'Appearance',
      },
    },

    onClick: {
      table: {
        category: 'Events',
      },
    },
  },
} satisfies Meta<typeof PrimaryButton>;
```

Manual ArgTypes are particularly useful for:

- `control`
- `options`
- `mapping`
- conditional `if`
- documentation categories
- documentation-only descriptions
- hiding irrelevant inherited props
- improved control labels

Storybook officially supports these properties.

---

# 9. Distinguish Args from ArgTypes

Developer guidance should state this explicitly.

## `args`

Args represent **runtime values supplied to a story**:

```ts
export const Primary: Story = {
  args: {
    variant: 'primary',
    disabled: false,
  },
};
```

## `argTypes`

ArgTypes describe **metadata and behaviour for those args**:

```ts
argTypes: {
  variant: {
    options: ['primary', 'secondary'],
    control: 'radio',
  },
}
```

ArgTypes drive documentation and Controls behaviour; args represent an actual component state.

The `ArgTypes` Doc Block presents a static component API table, whereas the `Controls` Doc Block represents current story args and supports interaction. Storybook explicitly distinguishes these two purposes.\
This distinction should be added to `component-docs-guide.mdx`.

---

# 10. TypeScript configuration

Current:

```ts
typescript: {
  check: true,
},
```



Storybook's current TypeScript integration documentation identifies `typescript.check` as available for **Webpack-based projects**.

This project uses:

```ts
framework: '@storybook/react-vite'
```

### Recommendation

Remove:

```ts
typescript: {
  check: true,
}
```

and enforce TypeScript correctness through the repository's normal type-checking pipeline, for example:

```bash
tsc --noEmit
```

or the repository's existing type-check script.

If documentation inference is insufficient, explicitly select the docgen engine:

```ts
typescript: {
  reactDocgen: 'react-docgen-typescript',
},
```

but only when the additional accuracy justifies the extra processing cost.

### Decision rule

Use `react-docgen` when:

- current inferred props are accurate;
- startup/build performance matters;
- inherited wrapper props do not need extensive extraction.

Consider `react-docgen-typescript` when:

- union/enumeration information is missing;
- wrapped/inherited component props are incomplete;
- `forwardRef`-style components lose useful metadata;
- richer documentation/MCP component metadata is a priority.

Storybook's Vite integration uses `react-docgen` by default and documents `react-docgen-typescript` as the fallback for inference issues.

---

# 11. Remove the Webpack styling addon

Current:

```ts
'@storybook/addon-styling-webpack'
```



The package exists to configure CSS tooling in **Webpack** Storybook builds.

Storybook's current styling documentation states that Vite already supports CSS modules, PostCSS, Sass, Less and Stylus through Vite configuration, whereas `@storybook/addon-styling-webpack` is recommended for corresponding Webpack scenarios.

Your project already imports the global SCSS directly through `preview.ts`.

### Recommendation

Remove:

```ts
'@storybook/addon-styling-webpack'
```

from a React-Vite Storybook unless a verified dependency unexpectedly requires it.

**Priority: P1.**

---

# 12. CSF plugin: verify before retaining custom registration

`main.ts` explicitly adds:

```ts
import { vite as csfPlugin } from '@storybook/csf-plugin';
```

and then:

```ts
plugins: [csfPlugin({})]
```

because the local comment states this is necessary for static source extraction under React-Vite.

`@storybook/csf-plugin` is real and does provide source snippet extraction, including Vite support. However, Storybook's Vite builder already depends on the CSF plugin, and the normal official React-Vite setup does not require users to manually add it.

### Recommendation

Treat the explicit plugin registration as **suspected redundancy**, not automatically as an error.

Run the acceptance tests described later.

If static and dynamic source output continue to work without the explicit plugin:

**remove it.**

If a repository-specific regression demonstrates that it is required:

**retain it and document the exact Storybook/version defect it compensates for.**

That is preferable to institutionalising a workaround based only on an old assumption.

**Priority: P2.**

---

# 13. Code Panel — required enhancement

This was the largest omission in the previous Expert Review.

Storybook 10.5 documents the **Code Panel** as the supported replacement for the Storysource addon, which was discontinued in Storybook 9.

Enable it globally:

```ts
parameters: {
  docs: {
    codePanel: true,
  },
},
```

The Code Panel appears when viewing an individual story in Canvas and displays a usable source representation with story args substituted.

### Critical architectural point

The Code Panel does **not** represent a separate source-generation subsystem.

Storybook states that it renders the same snippet as the `Source` Doc Block and reuses:

```ts
parameters.docs.source
```



Therefore your documentation architecture becomes:

```text
CSF story
   │
   ├─ Story / Canvas
   │     └─ Source Doc Block
   │
   ├─ Autodocs
   │     └─ Canvas → Source
   │
   └─ Canvas UI
         └─ Code Panel

             all use
                 ↓
       parameters.docs.source
```

This provides one centrally governed source-code representation.

---

# 14. Source configuration

Current:

```ts
source: {
  excludeDecorators: true,
  type: 'dynamic',
},
```



Both settings are valid.

Storybook currently supports:

```ts
type: 'auto' | 'code' | 'dynamic'
```

and `excludeDecorators`.

### Recommendation

Prefer:

```ts
source: {
  excludeDecorators: true,
  type: 'auto',
},
```

unless the project deliberately requires dynamic source everywhere.

`auto` is more resilient because it selects dynamic generation where the framework/story supports it and falls back to static code otherwise.

`dynamic` specifically depends on a compatible arg-driven story setup.

For unusual stories, override locally:

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

---

# 15. Canvas source visibility

Current:

```ts
canvas: {
  sourceState: 'shown',
}
```

is valid Storybook configuration.

Storybook supports:

- `'hidden'`
- `'shown'`
- `'none'`

for Canvas source state.

This is primarily a UX decision.

### Recommended default

Once Code Panel is enabled globally:

```ts
canvas: {
  sourceState: 'hidden',
},
```

is a cleaner general default.

Source remains available in the Canvas Doc Block, while the Code Panel provides easy access from individual stories.

For developer-training pages where implementation code is central:

```ts
parameters: {
  docs: {
    canvas: {
      sourceState: 'shown',
    },
  },
},
```

can override it locally.

---

# 16. Controls configuration

Current:

```ts
controls: {
  exclude: ['as', 'bsPrefix', 'ref', 'key'],
},
```

under `parameters.docs` is valid.

Storybook documents `parameters.docs.controls.exclude` and supports project-, component-, and story-level configuration.

I recommend adding:

```ts
sort: 'requiredFirst',
```

so required API fields appear before optional fields:

```ts
controls: {
  exclude: ['as', 'bsPrefix', 'ref', 'key'],
  sort: 'requiredFirst',
},
```

This improves documentation scanning without adding maintenance cost.

---

# 17. Parameter inheritance must be part of developer training

A gold-standard Storybook guide should explicitly teach:

```text
Project
  ↓
Component / Meta
  ↓
Story
```

More specific parameter values override less specific ones.

Storybook deep-merges parameter objects, while arrays and other non-object values are replaced.

This means a project policy such as:

```ts
parameters: {
  docs: {
    codePanel: true,
    source: {
      type: 'auto',
      excludeDecorators: true,
    },
  },
},
```

can be refined for one component:

```ts
const meta = {
  component: LegacyWidget,

  parameters: {
    docs: {
      source: {
        type: 'code',
      },
    },
  },
} satisfies Meta<typeof LegacyWidget>;
```

without duplicating the remaining global Docs configuration.

That inheritance model should be documented explicitly in the project guide.

---

# 18. MDX strategy

Your current project already uses MDX appropriately for high-level documentation.

`introduction.mdx` is a standalone project guide located under:

```text
Documentation/Getting Started
```



`style-guide.mdx` uses specialist Storybook blocks including:

- `Typeset`
- `ColorPalette`
- `ColorItem`
- `IconGallery`
- `IconItem`
- `Stories`



This is an excellent use of MDX: it contains material that cannot be adequately expressed by automatic component metadata alone.

### Recommended MDX policy

Use **CSF** for:

- executable states;
- args;
- interaction examples;
- edge cases;
- error states;
- accessibility variants;
- regression scenarios.

Use **Autodocs** for:

- baseline component API;
- inferred props;
- stories;
- controls;
- source examples.

Use **MDX** when developers need:

- design-system principles;
- usage guidance;
- architectural context;
- cross-component workflows;
- migration guidance;
- accessibility standards;
- comparative examples;
- long-form narratives.

---

# 19. Attached MDX for exceptional components

When a component needs more than standard Autodocs, do not change the global template.

Create:

```text
Button.stories.tsx
Button.docs.mdx
```

Example:

```mdx
import {
  Meta,
  Primary,
  Controls,
  Canvas,
  Story,
} from '@storybook/addon-docs/blocks';

import * as ButtonStories from './Button.stories';

<Meta of={ButtonStories} />

# Button

Use buttons to initiate actions.

## Primary example

<Primary />

## API

<Controls />

## Destructive actions

Use destructive styling only when the result cannot be easily reversed.

<Canvas of={ButtonStories.Destructive} />
```

When using `<Meta of={...} />`, Storybook specifically requires the full set of CSF exports, not the component itself.

This should become the project's recommended escape hatch from generic Autodocs.

---

# 20. Standalone MDX

Your current:

```mdx
<Meta title="Documentation/Getting Started" />
```

and:

```mdx
<Meta title="Documentation/Style Guide" />
```

are appropriate patterns for standalone documentation.\
Storybook supports standalone documentation and navigation-controlled MDX pages.

Recommended sidebar model:

```text
Documentation
├── Getting Started
├── Component Documentation Guide
├── Style Guide
├── Accessibility
└── Testing

Components
├── Actions
├── Alerts
├── Forms
├── Navigation
└── ...

Routes
├── Dashboard
├── RFQ
└── ...
```

Keep conceptual documentation separate from the component hierarchy.

---

# 21. Doc Blocks capability model

A gold-standard developer guide should distinguish three broad groups.

## Core component documentation

Use frequently:

- `Meta`
- `Description`
- `Primary`
- `Story`
- `Stories`
- `Canvas`
- `Source`
- `Controls`
- `ArgTypes`

## Design-system documentation

Use where relevant:

- `ColorPalette`
- `Typeset`
- `IconGallery`

Your Style Guide is already using these effectively.

## Structural and utility blocks

Use when appropriate:

- `Title`
- `Subtitle`
- `TableOfContents`
- `Markdown`
- `Unstyled`

Storybook documents these blocks as part of the current available Doc Block catalogue.

The aim is **not to use every block**.

The aim is to know which block solves which documentation problem.

---

# 22. Markdown tables and `remark-gfm`

`style-guide.mdx` currently contains Markdown pipe tables.

Meanwhile, `component-docs-guide.mdx` recommends a custom `DocsTable` specifically to avoid Markdown table issues.

Current Storybook documentation states that GitHub Flavored Markdown features such as tables should be enabled with `remark-gfm` when required.

### Gold-standard approach

Install:

```bash
npm install --save-dev remark-gfm
```

Configure:

```ts
import remarkGfm from 'remark-gfm';

{
  name: '@storybook/addon-docs',
  options: {
    mdxPluginOptions: {
      mdxCompileOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  },
}
```

Then use standard Markdown tables for simple static documentation.

Use `DocsTable` only where:

- custom behaviour is needed;
- consistent complex rendering is required;
- custom semantics justify another abstraction.

---

# 23. Keep the MDX table CSS

The CSS workaround should **not automatically be removed**.

Its purpose is different from `remark-gfm`.

The stylesheet explains that Bootstrap 5's reboot removes borders and padding from classless tables and scopes the fix specifically to Storybook docs and classless Markdown tables.

That is a reasonable and carefully scoped compatibility fix.

Therefore:

```text
remark-gfm
     ↓
parses the Markdown table correctly

docs-table-styles.css
     ↓
restores presentation after Bootstrap reset
```

Keep the CSS while Bootstrap produces the reset that necessitates it.

---

# 24. Correct misleading JSDoc guidance

The documentation guide currently implies that a JSDoc `@example` produces an example code snippet in generated Autodocs.

It subsequently says that the Alert JSDoc example results in an Autodocs example code snippet.

That should not be taught as a guaranteed Storybook behaviour.

The reliable Storybook source-code examples are based on **stories** and the `Source`/Code Panel mechanisms.

### Rewrite the guidance

Use JSDoc for:

- component purpose;
- prop descriptions;
- constraints;
- developer intent.

Use stories for:

- executable examples;
- component states;
- recommended usage;
- edge cases;
- source snippets;
- interactive controls.

A good component should therefore have:

```tsx
/**
 * Primary action button used for the principal action within a section.
 */
export function PrimaryButton(props: PrimaryButtonProps) {
  // ...
}
```

plus:

```ts
export const Default: Story = {
  args: {
    children: 'Continue',
  },
};
```

The story—not an `@example` tag—becomes the canonical executable example.

---

# 25. `@internal` should not be described as an Autodocs suppression mechanism

The guide currently recommends:

```ts
/**
 * @internal
 */
```

for private APIs.

That may be a useful source-code convention, but it should not be presented as the project's reliable Storybook exclusion control unless repository tooling explicitly implements that behaviour.

For Storybook documentation visibility, use documented mechanisms such as:

```ts
tags: ['!autodocs']
```

for a component/story.

For individual props:

```ts
argTypes: {
  internalProp: {
    table: {
      disable: true,
    },
  },
},
```

The developer guide should distinguish source documentation conventions from Storybook documentation controls.

---

# 26. Table of contents

Current:

```ts
toc: true
```

is a good project-level setting.

Storybook explicitly supports project-level TOCs and local customisation.

Retain it.

Components with minimal documentation can disable it locally when necessary rather than weakening the global policy.

---

# 27. Docs theming and custom containers

Do **not** introduce a custom Docs container merely because Storybook supports one.

Storybook already provides:

- `DocsContainer`
- `parameters.docs.container`
- `parameters.docs.theme`

and supports customised MDX component rendering.

### Recommended decision rule

Use the default Docs container unless NMI requires:

- branded documentation chrome;
- custom page-level providers;
- custom Markdown heading rendering;
- organisation-specific analytics;
- custom accessibility behaviour.

For simple visual alignment, prefer:

```ts
parameters: {
  docs: {
    theme: nmiDocsTheme,
  },
},
```

before replacing the entire container.

Custom infrastructure should have a business or technical reason.

---

# 28. Multiple components

For compound components, use either:

```ts
const meta = {
  component: List,
  subcomponents: {
    ListItem,
  },
};
```

when a tabbed API representation is useful, or MDX when the components require a richer combined explanation.

Storybook specifically recommends MDX when component groups require a more tailored documentation structure.

The Style Guide already demonstrates useful cross-component documentation by referencing Alert stories from a standalone MDX page.

---

# 29. Monorepo guidance

If the design system becomes a pnpm/npm/yarn workspace, do not immediately centralise all Storybook knowledge into one huge configuration.

Use direct component imports when Autodocs/docgen has trouble following package barrel exports.

If independent packages develop separate Storybooks or release cycles, consider Storybook Composition rather than forcing all domains into one runtime.

Docgen should be validated against workspace package boundaries before selecting `react-docgen-typescript` globally.

The goal remains:

```text
local component source
        ↓
CSF stories
        ↓
Autodocs metadata
        ↓
optional MDX narrative
```

rather than duplicated documentation repositories.

---

# 30. Recommended `main.ts`

The following represents the preferred **documentation-related baseline**. Existing production chunking/Sass logic can remain separately where it is demonstrably required.

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

  // Add reactDocgen only if the default inference proves insufficient:
  //
  // typescript: {
  //   reactDocgen: 'react-docgen-typescript',
  // },

  async viteFinal(config, { configType }) {
    const { mergeConfig } = await import('vite');

    /*
     * Keep only repository-specific Vite configuration that has a
     * demonstrated requirement.
     *
     * Do not manually add @storybook/csf-plugin unless regression testing
     * proves that the Storybook/Vite defaults do not provide the source
     * extraction this repository requires.
     */

    return mergeConfig(config, {
      // existing justified Sass / production build configuration
    });
  },
} satisfies StorybookConfig;

export default config;
```

### Explicit removals

Remove unless runtime testing proves a need:

```ts
autodocs: 'tag'              // from addon options
defaultName                  // from addon options
docsMode                     // from addon options
typescript.check
@storybook/addon-styling-webpack
duplicate story globs
empty mdxPluginOptions
```

Move:

```ts
defaultName
docsMode
```

to:

```ts
config.docs
```

---

# 31. Recommended `preview.ts` Docs configuration

```ts
import type { Preview } from '@storybook/react-vite';

const preview = {
  tags: ['autodocs'],

  // existing decorators/loaders/beforeEach...

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

### Remove

```ts
docs.enabled
docs.autodocs
docs.description.component
docs.page
expectedAddonDocsConfig
autoDocsTemplate
```

This significantly reduces configuration ownership while increasing documentation functionality.

---

# 32. Recommended component story contract

Every reusable component should normally expose:

```ts
import type { Meta, StoryObj } from '@storybook/react-vite';

import { PrimaryButton } from './PrimaryButton';

const meta = {
  component: PrimaryButton,

  args: {
    disabled: false,
  },

  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary'],
    },
  },
} satisfies Meta<typeof PrimaryButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Continue',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Continue',
    disabled: true,
  },
};
```

No local `autodocs` tag is necessary because the project already enables it globally.

Manual metadata should exist only where it adds value beyond inference.

---

# 33. Documentation build and publishing

Add explicit package scripts if equivalent scripts do not already exist:

```json
{
  "scripts": {
    "storybook:docs": "storybook dev --docs",
    "storybook:build:docs": "storybook build --docs"
  }
}
```

Storybook officially recommends both patterns. A documentation build is written to `storybook-static`.

## CI documentation gate

A successful documentation pipeline should verify more than process exit status.

It should confirm:

1. Storybook starts successfully.
2. CSF files index successfully.
3. MDX compiles.
4. Autodocs entries exist for representative components.
5. JSDoc component descriptions appear.
6. inferred ArgTypes appear.
7. Controls render.
8. source snippets render.
9. Code Panel renders.
10. dynamic/automatic source responds correctly to args.
11. standalone MDX pages render.
12. attached component MDX renders.
13. TOC navigation works.
14. static assets/fonts load.
15. `storybook build --docs` succeeds.
16. `storybook-static` is produced.
17. deployed deep links resolve correctly.

A command that returns zero without these behaviours is not sufficient proof that the documentation architecture works.

---

# 34. Regression tests for configuration cleanup

Before removing the explicit CSF plugin, cloned docs template or shadow configuration, capture a baseline representative component.

Test:

### A. Autodocs

- component appears under `Documentation`;
- description comes from JSDoc;
- Controls are present;
- stories appear.

### B. Metadata

Verify:

- required props;
- optional props;
- union values;
- defaults;
- descriptions;
- inherited props where relevant.

### C. Source

Verify:

- Canvas Source appears;
- decorators are excluded;
- args update source where supported;
- fallback source works for non-standard render functions.

### D. Code Panel

Verify:

- Code tab/panel appears in Canvas;
- source agrees with the Docs Source representation;
- args are represented correctly.

### E. MDX

Verify:

- Getting Started;
- Component Documentation Guide;
- Style Guide;
- GFM tables;
- Typeset;
- ColorPalette;
- IconGallery;
- referenced Alert stories.

### F. Production

Run:

```bash
storybook build --docs
```

and confirm a usable:

```text
storybook-static/
```

output.

Only retain a workaround when one of these acceptance tests demonstrates why it is required.

---

# 35. Recommended update to `component-docs-guide.mdx`

The guide itself should become the project's **documentation contract**.

Its key rules should be:

### Rule 1 — Autodocs is global

Do not add tags to every component.

```ts
tags: ['autodocs']
```

already exists globally.

### Rule 2 — Opt out explicitly

```ts
tags: ['!autodocs']
```

when automatic documentation is inappropriate.

### Rule 3 — TypeScript owns types

Do not duplicate TypeScript declarations in ArgTypes.

### Rule 4 — JSDoc owns semantic descriptions

Describe:

- purpose;
- constraints;
- usage intent.

### Rule 5 — Stories own executable examples

Do not rely on `@example` as the Storybook example mechanism.

### Rule 6 — Args represent story state

### Rule 7 — ArgTypes augment inferred metadata

### Rule 8 — Parameters configure Storybook behaviour

Teach:

```text
project → meta → story
```

precedence.

### Rule 9 — MDX is for narrative

Use it when automatic documentation cannot communicate the concept well.

### Rule 10 — Doc Blocks compose MDX

Choose blocks for a purpose rather than reproducing the default Autodocs template.

### Rule 11 — Source and Code Panel share configuration

Manage source snippets once through:

```ts
parameters.docs.source
```

### Rule 12 — Documentation must build in CI

A component is not fully documented until its Storybook documentation can be built reproducibly.

---

# 36. What should remain unchanged

Several existing choices are good and should not be lost during cleanup.

## Global Autodocs

Correct:

```ts
tags: ['autodocs']
```



## TOC

Correct and useful:

```ts
toc: true
```

## Source decorator exclusion

Reasonable:

```ts
excludeDecorators: true
```

## MSW Storybook support

The Storybook setup provides project-wide API handlers and service worker integration, creating realistic isolated component environments.

## Runtime environment isolation

The existing setup deliberately provides Storybook-safe environment values rather than relying on unavailable browser-side Node globals.

## Design-system MDX

The Style Guide's use of Typeset, ColorPalette and IconGallery is exactly the type of specialist documentation that justifies MDX.

## Bootstrap table CSS workaround

The rule is narrowly scoped and technically justified.

## BDD alignment

The Getting Started page already connects stories with executable regression coverage, which is a strong documentation-as-code characteristic.

---

# 37. Implementation order

## Phase 1 — Correctness

1. Change developer guidance from `'docs'` to global `autodocs` / `!autodocs`.
2. Remove global `docs.description.component`.
3. Move `defaultName` and `docsMode` to `main.ts → docs`.
4. Remove preview-level pseudo-Autodocs configuration.
5. Enable Code Panel.
6. Remove Vite-inapplicable `typescript.check`.
7. Remove `@storybook/addon-styling-webpack`.

## Phase 2 — Simplification

8. Remove duplicate story/MDX globs.
9. Remove `preview-docs.ts` if nothing remains after deleting the duplicated default template.
10. Remove `expectedAddonDocsConfig`.
11. Test removal of explicit `@storybook/csf-plugin`.
12. Remove explicit `changeDetection: true` if no project policy requires declaring the default explicitly; Storybook currently documents `true` as the default.

## Phase 3 — Documentation quality

13. Add `remark-gfm`.
14. Rewrite the component documentation guide.
15. Add Args versus ArgTypes guidance.
16. Add parameter inheritance guidance.
17. Add Code Panel guidance.
18. Add attached MDX examples.
19. Document the Doc Block capability model.
20. Add docs build scripts.

## Phase 4 — Verification

21. Run representative inference tests.
22. Run source/Code Panel tests.
23. Validate MDX tables.
24. Validate standalone MDX.
25. Validate attached MDX.
26. Build documentation.
27. Verify `storybook-static`.
28. Verify deployed documentation.

---

# 38. Gold-standard architecture

The final architecture should be intentionally boring:

```text
React component
      │
      ├── TypeScript types
      │
      └── JSDoc descriptions
              │
              ▼
         react-docgen
              │
              ▼
       Storybook metadata
     args / argTypes / docs
              │
       ┌──────┴─────────┐
       │                │
       ▼                ▼
   CSF stories       Autodocs
       │                │
       │          default Doc Blocks
       │                │
       ├──────────┬─────┘
       │          │
       ▼          ▼
    Canvas      Source
       │          │
       └────┬─────┘
            ▼
        Code Panel

Optional extension:
       │
       ▼
      MDX
       │
       ▼
   Doc Blocks
```

There should be no second internal configuration system attempting to describe whether Docs are enabled.

There should be no cloned Storybook default template without a reason.

There should be no manually duplicated prop documentation where inference already provides it.

There should be no Webpack-specific tooling in a Vite Storybook without an explicit technical requirement.

That simplicity is what makes Autodocs maintainable at scale.

---

# 39. Final rubric assessment of this revised Expert Review

| Category                             |  Weight | Revised Review |
| ------------------------------------ | ------: | -------------: |
| Autodocs and tag model               |      15 |         **15** |
| MDX architecture                     |      10 |         **10** |
| Doc Blocks                           |      12 |         **12** |
| Code Panel and Source                |       8 |          **8** |
| Args, ArgTypes and inference         |      13 |         **13** |
| Parameters and inheritance           |      10 |         **10** |
| Docs build and publishing            |       8 |          **8** |
| `main.ts`, addons and TypeScript     |       8 |          **8** |
| Architecture and maintainability     |       6 |          **6** |
| Evidence, currency and actionability |      10 |          **9** |
| **Total**                            | **100** |     **99/100** |

The one-point reservation is deliberate: the repository's actual `package.json` and runtime Storybook version were not supplied, so this review benchmarks the implementation against the **current official Storybook 10.5 documentation** rather than confirming that every recommendation matches the exact installed dependency graph.

That is preferable to claiming certainty that the available evidence cannot establish.

## Final recommendation

Adopt the proposed simplified architecture.

The highest-value changes are:

**correct the developer guide → eliminate duplicate Autodocs configuration → remove the global description override → enable Code Panel → remove Webpack-specific configuration from React-Vite → restore proper ****`main.ts → docs`**** ownership → use inference as the default → use MDX only when it adds narrative value → validate the result with a real docs build.**

After those changes, the Storybook setup would be substantially closer to a modern, low-maintenance documentation platform rather than a Storybook configuration carrying historical workarounds and duplicated documentation infrastructure.
