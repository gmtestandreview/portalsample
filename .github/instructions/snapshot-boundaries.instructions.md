---
applyTo: "**/*.{ts,tsx,js,jsx,scss,css,json}"
---

# Source-map snapshot boundaries

This workspace is a source-map capture of a live deployment, **not** a buildable repo.

## Hard rules

- **Never edit** paths matching: `static/js/main.*.js`, `static/css/main.*.css`, `static/source-map-http-downloads/**`, `static/js/external/**`, `static/webpack/**`
- **Never run** `npm`, `pnpm`, or `yarn` from the workspace root — there is no root `package.json`.
- **Never invent build or test scripts.** Validate changes by static type consistency and file review only.

## Safe edit targets

```
static/js/**/*.ts
static/js/**/*.tsx
static/css/styles/**/*.scss
```

If a file you are asked to edit falls outside these paths, pause and confirm with the user before proceeding.
