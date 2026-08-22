---
description: "Scaffold a new multi-step route module for the NMI portal following the requestForQuote pattern. Creates the folder, index component, step component(s), props file(s), validation schema, and registers the route in App.tsx with an AuthenticatedElement wrapper."
name: "RFQ Feature Scaffold"
argument-hint: "Feature name (PascalCase), URL path, API client class name, and whether it uses a wizard form or a single page"
agent: "agent"
tools: [read, search, edit]
---

# Scaffold a New Route Module

You are scaffolding a new route module for the NMI Customer Portal source-map snapshot.
Follow the exact file and code patterns from [static/js/routes/requestForQuote/](../static/js/routes/requestForQuote/) — do not invent new patterns.

## Inputs

The user will provide (ask if any are missing):

| Input | Example |
|---|---|
| **Feature name** (PascalCase) | `AccreditationRequest` |
| **URL path** (kebab-case) | `/accreditation-request/:id/*` |
| **API client class** from `web-api-client.ts` | `AccreditationRequestClient` |
| **Form style** | `wizard` (multi-step, like RFQ) or `single` (one Formik page) |
| **Steps** (wizard only) | comma-separated **DTO names** from `web-api-client.ts`, e.g. `OrganisationAndContact,InstrumentAndRequest` — step file names are derived directly from these |
| **Success path** (optional) | URL for post-submit redirect, e.g. `/accreditation-request-success/:id` — defaults to `/<url-path-base>-success/:id` |
| **Suppress header/footer?** | `yes` (pass `displayHeaderAndFooter={false}`) or `no` |

---

## Step 1 — Discover existing types

Before generating any code:

1. Search `static/js/api/web-api-client.ts` for the named API client class and the DTO types it uses.
2. Read `static/js/routes/requestForQuote/validation.ts` to confirm the Yup extension import pattern.
3. Read `static/js/routes/requestForQuote/index.tsx` to confirm the wizard wiring pattern.
4. Read `static/js/App.tsx` lines 1–30 to confirm the import block style, then lines 90–140 to confirm the route registration pattern.

---

## Step 2 — Generate files

Create all files inside `static/js/routes/<featureNameCamelCase>/`.

### `validation.ts`

```ts
import * as yup from 'yup';
import '../../validationSchemas/yupExtensions';          // ← required side-effect
import { Validation } from '../../components/forms/FormikForm/types';
import { <StepDto> } from '../../api/web-api-client';

export const <stepName>SubmitValidation = yup.object<Validation<<StepDto>>>({
    // TODO: add field rules using .label(), .required(), .maxLength(), .allowedFormat() etc.
});

export const <stepName>SaveValidation = yup.object<Validation<<StepDto>>>({
    // TODO: softer save-draft rules
});
```

### Naming rule — always derive from the DTO name

The DTO name provided in the **Steps** input directly controls every file name for that step:

| DTO name | Component file | Props file |
|---|---|---|
| `OrganisationAndContact` | `organisationAndContact.tsx` | `organisationAndContactProps.ts` |
| `InstrumentAndRequest` | `instrumentAndRequest.tsx` | `instrumentAndRequestProps.ts` |

Do **not** invent step names. If a DTO name cannot be found in `web-api-client.ts`, stop and ask the user to correct it.

### `<DtoName>Props.ts` (one per step)

Mirror the shape of `static/js/routes/requestForQuote/organisationAndContactProps.ts`:
- Import `AccountInfo`, `IPublicClientApplication` from `@azure/msal-browser`
- Import `tokenRequest` from `../../authentication/authConfig`
- Import `WizardStepProps`, `WizardFormStepValues` from wizard types
- Export `load<StepName>`, `saveStep`, and `submitStep` functions that call the API client with a silent MSAL token

### `<DtoName>.tsx` (one per step, camelCase filename)

Mirror `static/js/routes/requestForQuote/organisationAndContact.tsx`:
- Props typed with `<DtoName>Props` interface (imported from the matching Props file)
- Use `useFormikContext`, `useField`, `getIn` from formik
- Use `useAccountContext` from `../../authentication/hooks` (never import `AccountContext` directly)

### `index.tsx`

**Wizard form style** — mirror `static/js/routes/requestForQuote/index.tsx`:
- `useMsal`, `useNavigate`, `useParams` at the top
- `useBodyClass('wizard')`
- `WizardFormProps` with `locationOnCompletion` set to the **success path** (e.g. `` `/accreditation-request-success/${id}` ``), `lastStepNextButtonTitle`, `canSaveDraft`
- One `<WizardStep>` per step, passing the props file as `stepComponentProps`
- Loading guard: render `<BlockUISpinner>` until step statuses are loaded
- API error → `navigate('/not-found')` with `AppLogger.error`

**Single page style** — use `<FormikForm>` instead of `<WizardForm>`:
- Single submit/save validation pair
- No step-status loading effect needed

---

## Step 3 — Register the route in App.tsx

Add an import for the new index component at the top of `static/js/App.tsx` (alphabetical within existing imports), then add a `<Route>` entry inside the `createBrowserRouter` children array:

```tsx
<Route
    path='<url-path>'
    element={(
        <AuthenticatedElement displayHeaderAndFooter={<true|false>}>
            <<FeatureName> />
        </AuthenticatedElement>
    )}
/>
```

Use `displayHeaderAndFooter={false}` for wizard/multi-step routes (matching the RFQ pattern).

---

## Step 4 — Validation checks

After generating all files, verify:

1. **Yup side-effect import** — `import '../../validationSchemas/yupExtensions'` is present in `validation.ts`.
2. **No `process.env`** — all config uses `env` from `../../env`.
3. **No direct `AccountContext` import** — account state is accessed via `useAccountContext` hook only.
4. **Route registered** — the new `<Route>` is present in `App.tsx` and the component is imported.
5. **Types exist** — every DTO and client class referenced actually exists in `web-api-client.ts`.
6. **Step file names match DTOs** — each `<DtoName>Props.ts` and `<dtoName>.tsx` filename is the exact camelCase of the DTO name provided; no invented names.
7. **Success route registered** — `<success-path>/*` `<Route>` is present in `App.tsx` and `<FeatureName>Success` is imported.
8. **`locationOnCompletion` matches success path** — the value in `WizardFormProps` matches the success route path registered in App.tsx.

---

## Output

Report a table of created/modified files and which validation checks passed. Flag any check that could not be confirmed statically (e.g. "DTO type not found in web-api-client.ts — review before using").
