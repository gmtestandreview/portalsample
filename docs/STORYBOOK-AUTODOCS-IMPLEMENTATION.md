# Storybook Autodocs — documenting a component

How to document a component in this repository so that Storybook generates a
complete, accurate API page for it. Tested against Storybook **10.5.10**.

- Configuration reference: `docs/AUTODOCS.md`
- Canonical authoring guide: `.storybook/component-docs-guide.mdx`

---

## What you get for free

Autodocs is enabled project-wide by `tags: ['autodocs']` in
`.storybook/preview.ts`. Every component that has a story therefore already has a
generated **Documentation** page containing:

- the component title and description, taken from the component's own JSDoc;
- a props table inferred from the component's TypeScript types;
- the primary story rendered in a canvas, with interactive controls;
- every other story in the file;
- a Code Panel showing the source of the story currently in view.

You do not add a tag, register an addon, or write a template to get this. The work
is making the *inputs* good: types, JSDoc, and story args.

---

## Step 1 — type the props precisely

Docgen reads the component's TypeScript types. Precise types produce a precise
props table.

```ts
export interface BodyTextProps {
    children: ReactNode;
    className?: string;
}
```

Union types document themselves — `mode?: 'dark' | 'light'` renders as a select
control with both options listed, with no `argTypes` entry needed.

Components whose props are an unexported intersection over a DOM element type
(for example `Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & { ... }`)
infer less completely. Prefer a named, exported props type where practical.

## Step 2 — write JSDoc on the component

The description block above the component becomes the page description. Prop-level
JSDoc becomes the description column of the props table.

```ts
/**
 * A prominent call-to-action button following the NMI design system.
 *
 * Use PrimaryButton for main actions such as "Submit", "Continue", or "Save".
 *
 * @example
 * <PrimaryButton onClick={handleSubmit}>Submit form</PrimaryButton>
 */
```

`@example` blocks render on the generated page. They are documentation, not tests —
a runnable example belongs in a story. Mark genuinely internal components with
`@internal` and point readers at the supported export.

## Step 3 — write stories with `args`

State belongs in `args`, not in hand-written JSX inside `render`. Args drive the
controls, the generated source snippet, and the Code Panel.

```ts
const meta = {
    component: BodyText,
} satisfies Meta<typeof BodyText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'This service helps organisations manage calibration requests.',
    },
};
```

Do **not** add `tags: ['autodocs']` to `meta` — the tag is inherited from the
project and repeating it is duplicate state that the governance test rejects.
There is no `'docs'` tag in Storybook; adding one does nothing.

To suppress the generated page for a component, negate the inherited tag:

```ts
tags: ['!autodocs'],
```

## Step 4 — add `argTypes` only where inference falls short

`argTypes` exist to *improve on* inference, not to restate it. Legitimate uses:
grouping or relabelling a control, constraining a control type, documenting a
callback's contract, or excluding a passthrough prop. Copying a TypeScript type
into `argTypes` creates a second source of truth that silently goes stale.

## Step 5 — add MDX only when narrative is needed

Autodocs covers the API. Reach for MDX when a component needs usage guidance,
decision rules, or composed examples that a props table cannot express.

- Component-attached narrative: `ClientApp/src/**/<Component>.docs.mdx`
  (Accordion, Alert and PrimaryButton follow this pattern)
- Standalone guides: `.storybook/*.mdx` (`introduction`, `component-docs-guide`,
  `style-guide`)
- Inventory and reference pages: `ComponentInventory.docs.mdx`,
  `RouteInventory.docs.mdx`, `CoverageMatrix.docs.mdx`,
  `MigrationReadiness.docs.mdx`, `ValidationSchemas.docs.mdx`,
  `AssetsAndMedia.docs.mdx`, `Authentication.docs.mdx`

MDX pages compose Doc Blocks (`Meta`, `Stories`, `Typeset`, `ColorPalette`,
`IconGallery`) rather than re-describing what Autodocs already renders. GFM pipe
tables work in MDX — `remark-gfm` is configured in `.storybook/main.ts`.

---

## Checklist for a new component

- [ ] Props typed with a named, exported type where practical
- [ ] JSDoc description on the component, and on non-obvious props
- [ ] `@example` for the common usage; `@internal` on non-public components
- [ ] Story file with `component` in `meta` and no `autodocs` tag
- [ ] Every story's state expressed through `args`
- [ ] `argTypes` only where they improve on inference
- [ ] MDX only if the component needs narrative beyond its API
- [ ] `npm run test:storybook` passes
- [ ] `npm run storybook:verify:docs` passes

---

## Verification

| Check | Command |
| --- | --- |
| Configuration governance | `npx vitest run --config vitest.unit.config.ts tests/unit/storybook/storybookDocsConfig.test.ts` |
| Type check | `npm run type-check` |
| Lint (including MDX) | `npm run lint` and `npm run lint:mdx` |
| Story interactions | `npm run test:storybook` |
| Docs build and structure | `npm run storybook:verify:docs` |
| Documentation runtime behaviour | `npm run test:e2e:storybook` |

Review the rendered result locally with `npm run storybook` (or
`npm run storybook:docs` for the docs-only view) and confirm the description,
props table, controls, stories and Code Panel all populate.

---

## Resources

- Storybook Autodocs — <https://storybook.js.org/docs/writing-docs/autodocs>
- Doc Blocks — <https://storybook.js.org/docs/writing-docs/doc-blocks>
- MDX — <https://storybook.js.org/docs/writing-docs/mdx>
- Code Panel — <https://storybook.js.org/docs/writing-stories/stories-code-panel>
