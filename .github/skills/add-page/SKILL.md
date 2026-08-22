---
name: add-page
description: 'Add a new Next.js page to the AGDS starter kit. Creates the page component, Storybook story, Next.js route file, and registers the nav link in SiteHeader. Use when adding a page, creating a route, scaffolding a new section.'
argument-hint: 'Page name in PascalCase (e.g. About, ContactUs)'
---

# Add Page

Scaffolds a complete page for the AGDS starter kit from a page name argument.

## When to Use

- Adding a new top-level route to the app
- Scaffolding a new section (e.g. `/about`, `/contact`)

## Inputs

The argument is the page name in **PascalCase** (e.g. `About`, `ContactUs`).

Derive the following from it:

- **`{{PageName}}`** — PascalCase component name (e.g. `About`)
- **`{{pageSlug}}`** — kebab-case URL path (e.g. `about`, `contact-us`)
- **`{{pageLabel}}`** — Title Case nav label (e.g. `About`, `Contact Us`)

## Procedure

Follow these steps **in order**. Do not skip steps.

### 1. Create the page component

Create `components/{{PageName}}/{{PageName}}.tsx` using [Page.tsx.template](./assets/Page.tsx.template), replacing all `{{PageName}}` tokens.

### 2. Create the barrel export

Create `components/{{PageName}}/index.ts` using [index.ts.template](./assets/index.ts.template), replacing `{{PageName}}`.

### 3. Create the Storybook story

Create `components/{{PageName}}/{{PageName}}.stories.tsx` using [Page.stories.tsx.template](./assets/Page.stories.tsx.template), replacing `{{PageName}}`.

### 4. Create the Next.js route

Create `pages/{{pageSlug}}.tsx` using [page-route.tsx.template](./assets/page-route.tsx.template), replacing `{{PageName}}` and `{{pageLabel}}`.

### 5. Register the nav link

In `components/SiteHeader/SiteHeader.tsx`, add to the `NAV_LINKS` array:

```ts
{ label: '{{pageLabel}}', href: '/{{pageSlug}}' }
```

### 6. Verify

Run `pnpm lint` and confirm no errors.
