# Storybook Autodocs — configuration reference

Autodocs generates an API documentation page for every component story in this
repository. This file records **how Autodocs is wired**. For how to *write*
documentation, the canonical guide is `.storybook/component-docs-guide.mdx`
(rendered in Storybook under **Writing component documentation**).

Tested against Storybook **10.5.10**.

---

## Activation

Autodocs is enabled **once, at project level**, by the built-in `autodocs` tag in
`.storybook/preview.ts`:

```ts
export default {
    tags: ['autodocs'],
    // ...
} satisfies Preview;
```

Every story inherits that tag. Individual story files must **not** re-declare
`tags: ['autodocs']` — repeating an inherited tag is duplicate state, and the
governance test `tests/unit/storybook/storybookDocsConfig.test.ts` fails if a
story file does.

There is no `'docs'` tag in Storybook. A story file that adds one gets nothing;
`autodocs` is the only tag that generates a documentation page.

### Opting out

To suppress the generated page for a component, negate the inherited tag in that
component's `meta`:

```ts
const meta = {
    component: InternalOnlyWidget,
    tags: ['!autodocs'],
} satisfies Meta<typeof InternalOnlyWidget>;
```

---

## Configuration ownership

Each setting has exactly one home. Nothing below is repeated anywhere else.

| Concern | Owner | Value |
| --- | --- | --- |
| Autodocs activation | `.storybook/preview.ts` | `tags: ['autodocs']` |
| Generated page name | `.storybook/main.ts` → `docs` | `defaultName: 'Documentation'` |
| Docs-only mode | `.storybook/main.ts` → `docs` | `docsMode: false` |
| GFM tables in MDX | `.storybook/main.ts` → `addon-docs` options | `remarkPlugins: [remarkGfm]` |
| Table of contents | `.storybook/preview.ts` → `parameters.docs` | `toc: true` |
| Code Panel | `.storybook/preview.ts` → `parameters.docs` | `codePanel: true` |
| Source generation | `.storybook/preview.ts` → `parameters.docs.source` | `type: 'auto'`, `excludeDecorators: true` |
| Canvas source | `.storybook/preview.ts` → `parameters.docs.canvas` | `sourceState: 'hidden'` (the Code Panel presents source) |
| Controls | `.storybook/preview.ts` → `parameters.docs.controls` | `sort: 'requiredFirst'`, `exclude: ['as', 'bsPrefix', 'ref', 'key']` |

`main.ts`:

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
// ...
docs: {
    defaultName: 'Documentation',
    docsMode: false,
},
```

`preview.ts`:

```ts
docs: {
    toc: true,
    codePanel: true,
    controls: {
        exclude: ['as', 'bsPrefix', 'ref', 'key'],
        sort: 'requiredFirst',
    },
    canvas: { sourceState: 'hidden' },
    source: {
        excludeDecorators: true,
        type: 'auto',
    },
},
```

`defaultName` and `docsMode` are **top-level `main.ts → docs` settings**, not
`addon-docs` options. Placing them in the addon's `options` object has no effect —
the generated pages fall back to the name `Docs`.

No custom Autodocs page template is configured. Storybook's default composition
(Title → Subtitle → Description → Primary → Controls → Stories) is used as-is, and
no global `docs.description.component` is set, so each component's own JSDoc
supplies its description.

---

## Where documentation content comes from

```text
TypeScript types + JSDoc  ->  docgen  ->  args / argTypes / parameters
                                              |
                                    +---------+---------+
                                    |                   |
                              CSF stories           Autodocs
                                    |                   |
                                 Canvas             Doc Blocks
                                    +---------+---------+
                                              |
                                          Code Panel
```

Prop tables are inferred from the component's TypeScript types; descriptions and
defaults come from JSDoc on those types. Do not restate an inferred type in
`argTypes` — add `argTypes` only where they genuinely improve on inference (for
example grouping a control, or documenting a callback's contract). See
**Args and ArgTypes** in `.storybook/component-docs-guide.mdx`.

MDX extends Autodocs where narrative is needed; it does not replace it. Component
MDX lives beside the component as `<Component>.docs.mdx`; standalone guides live
in `.storybook/*.mdx`.

---

## Verification

| Check | Command |
| --- | --- |
| Configuration governance | `npx vitest run --config vitest.unit.config.ts tests/unit/storybook/storybookDocsConfig.test.ts` |
| Story interactions | `npm run test:storybook` |
| Docs build and structure | `npm run storybook:verify:docs` |
| Documentation runtime behaviour | `npm run test:e2e:storybook` |

`npm run storybook:verify:docs` runs `storybook build --docs` and then
`scripts/verify-storybook-docs.mjs`, which asserts the generated `index.json`
contains both docs and story entries and that generated pages use the
`Documentation` name.

---

## Related documents

- `.storybook/component-docs-guide.mdx` — canonical authoring guide
- `docs/STORYBOOK-AUTODOCS-IMPLEMENTATION.md` — how to document a new component
- `docs/DOC-BLOCKS-IMPLEMENTATION.md` / `docs/DOC-BLOCKS-QUICK-START.md` — Doc Blocks
- `docs/storybook/STORYBOOK-DOCS-QUALITY-GATE.md` — current verification result
- `docs/storybook/storybook-refactor-baseline.md` — pre-refactor state (historical)
