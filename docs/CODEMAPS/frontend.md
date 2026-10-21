<!-- Generated: 2026-10-21 | Files scanned: 1537 | Token estimate: ~750 -->

# Frontend Architecture

## Entry Points

```text
index.html              → Vite entry
ClientApp/src/index.tsx → ReactDOM.createRoot, MsalProvider, AccountProvider
ClientApp/src/App.tsx   → createBrowserRouter (React Router v7)
ClientApp/src/env.ts    → Runtime config from window.* injected by Vite
```

## Route Tree (App.tsx)

All protected routes wrap with `<AuthenticatedElement>`. Routes with multi-step wizards pass `displayHeaderAndFooter={false}`.

```text
/                          → Home (public, Layout)
/sign-in                   → SignIn
/sign-out                  → SignOut
/sign-out-helper           → SignOutHelper (Layout)
/help-guide                → HelpGuide (Layout)
/help-guide/how-to-setup-access
/help-guide/faqs
/services-we-offer         → ServicesWeOffer

/dashboard                 → Dashboard [auth]
/dashboard-ta              → DashboardTA [auth]

/create-account/*          → account/create wizard [auth, no chrome]
/update-organisation/:id/* → account/update wizard [auth, no chrome]
/success-creating-account  → account/created [auth, no chrome]
/add-branch/*              → account/addBranch wizard [auth, no chrome]
/create-contact            → contact/create [auth, no chrome]
/update-contact/*          → contact/update wizard [auth, no chrome]

/request-for-quote-create           → RFQ create [auth]
/request-for-quote/:id/*            → RFQ edit wizard [auth, no chrome]
/request-for-quote-copy/:id/*       → RFQ copy [auth]
/request-for-quote/:id/view-summary → RFQ summary [auth, no chrome]
/request-for-quote-success/:id/*    → RFQ created [auth, no chrome]

/ta/type-approval-create-pre        → TA pre-application [auth]
/ta/type-approval-create            → TA create [auth]
/ta/:id/*                           → TA wizard [auth, no chrome]
/ta/:id/manage                      → TA manage [auth]
/ta/type-approval-success/:id/*     → TA created [auth, no chrome]

/accept-quote-create/:id/*          → Quote accept wizard [auth]
/accept-quote/:id/*                 → Quote accept edit [auth, no chrome]
/submitted-success/:id/*            → Quote accepted [auth, no chrome]
/quotation/:id/*                    → Quotation view [auth]

/instrument-reports/:id/*           → Report list [auth]
/report/:id/*                       → Measurement report [auth]

/server-error /conflict /forbidden /no-longer-available
/unprocessable /precondition-failed /service-unavailable /not-found
```

## Component Hierarchy

```text
ClientApp/src/components/
├── Home.tsx               Public landing page
├── Layout/                App chrome: Header + Footer + main
├── Header/                Navbar, auth/unauth nav items, env badge
├── Footer/                Footer with links (privacy, terms, accessibility)
├── AriaComponents/        React Aria-based design system
│   ├── Button, Breadcrumb, DatePicker, GridList, ProgressCircle
│   ├── RangeCalendar, SegmentedControl, Separator, Slider
│   ├── Table, TagGroup, Toast, Tree, SearchField
│   └── NmiIcon — custom icon font component
├── Inputs/                Form input wrappers
│   ├── TextInput, TextAreaInput (Formik)
│   ├── RhfTextInput, RhfTextAreaInput (RHF)
│   ├── NumberInput, RadioButton, SelectInput, CheckBox
│   ├── DatePicker, AddressLookup, AutoSuggest
│   ├── Attachment/index-new.tsx (new attachment input)
│   └── RhfAttachment, RhfAutoSuggest, RhfCheckbox, RhfRadioButtonGroup
├── forms/
│   ├── CommonForms/ContactDetails     (Formik, NLOC-refactored on branch)
│   ├── CommonForms/RhfContactDetails  (RHF equivalent)
│   ├── ErrorSummary/                  Validation error list
│   ├── IntentButton/                  Wizard next/submit button
│   ├── WizardForm/                    Stepper + useWizardStepController hook
│   ├── RhfForm/wizardYupResolver      Yup resolver for RHF wizard
│   ├── useFormikRhfBridge             Adapter: Formik context → RHF API
│   ├── formPath.ts                    Wizard step path utilities
│   ├── saveAwareYupResolver.ts        Resolver that tolerates Save-and-continue
│   └── utils.ts                       Form helpers
├── Alert/, Actions/, Buttons/
├── ErrorBoundary/         ErrorBoundary + ErrorDisplay (HTTP status pages)
└── reactaria_components/  Misc RAC helpers (PageHeader)
```

## State Management

| Layer | Mechanism |
|-------|-----------|
| Auth | React Context (`AccountContext`) via `AccountProvider` — provides MSAL accounts |
| Wizard forms | `sessionStorage` (`SessionStorageCache`) — step data survives navigation |
| Notifications | `ClientApp/src/storage/notification.ts` — dashboard/modal flags in sessionStorage |
| No global state library | No Redux/Zustand/Jotai — everything is co-located or in session |

## Form Strategy

Two form libraries coexist:

- **Formik** — original; used in older routes
- **React Hook Form (RHF)** — active migration target; Waves 1–5 completed on main
- **`useFormikRhfBridge`** — adapter allows RHF-API code to run inside a Formik context (incremental migration)
- **Yup** — validation for both libraries; 19 custom string methods in `stringExtensions.ts`
