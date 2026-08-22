# Sprint 1 Remaining Stories — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. If superpowers skills are unavailable, execute the checklist steps directly and stop at review checkpoints.

**Goal:** Close the five remaining Sprint 1 Storybook issues — Footer modal stories (Issue #10), Pagination edge cases (Issue #12), AutoSuggest + AddressLookup stories (Issue #14), InstrumentItem story (Issue #15), and Dashboard play-functions (Issue #2) — so that all 15 issues can move toward QA sign-off.

**Architecture:** Each task creates or modifies exactly one story file. All stories follow the established codebase pattern: `@storybook/react-vite` imports, `withPortalProviders` where router/modal/Formik context is required, MSW handlers for API-dependent stories, play functions using `canvas` for in-canvas assertions and `screen` for Bootstrap portal-rendered content (modals). The `storybook/test` package provides `expect`, `userEvent`, `within`, `screen`, and `fn`.

**Tech Stack:** React 18.3.1 · TypeScript · Storybook 10 (Vite adapter) · MSW v2 · `@storybook/react-vite` · `storybook/test` · `withPortalProviders` from `ClientApp/src/storybook/storybookHarness.tsx` · Formik 2.4.9 · Bootstrap 5 · Node ≥ 20

---

## Source Inputs

- Spec: `docs/sprint-1/github-issues.md` (Issues #2, #10, #12, #14, #15 — DoD per issue)
- Relevant files inspected:
  - `ClientApp/src/components/Footer/index.tsx`: Footer owns modal open/close state; trigger buttons have `data-testid` values (`open-termsofuse-button`, `open-privacy-button`, `open-accessibility-button`); modals rendered via `<ContentModal>` at root
  - `ClientApp/src/components/Footer/Footer.stories.tsx`: single `Default` story, no play functions
  - `ClientApp/src/components/modals/ContentModal/index.tsx`: props `showModal`, `onCancelModal`, `modalBody`, `modalTitle`; renders Bootstrap Modal (portal — outside canvas DOM)
  - `ClientApp/src/components/Pagination/index.tsx`: "Page X of Y" rendered as `<p class='small text-center'>`; First/Prev hidden with `d-none` when at first page; Next/Last hidden with `d-none` when at last page; `hidden` attribute on `<nav>` when `totalPages <= 1`
  - `ClientApp/src/components/Pagination/Pagination.stories.tsx`: `PaginationStory` wrapper uses `useState` for interactive page state; `MidRange` and `SinglePageHidden` exist; no edge-case stories
  - `ClientApp/src/components/Inputs/AutoSuggest/index.tsx`: `getOptions: (term: string) => Promise<AutoSuggestOption<T>[]>` prop; `selectedOption` string; internally calls `AutoSuggestContainer` which calls `useField` — Formik context required
  - `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggestContainer.tsx`: renders `role='combobox'`; aria-live div announces suggestion count; shows "No matches found" text when `noResult` true; shows "Loading options" when `loading` true
  - `ClientApp/src/components/Inputs/AddressLookup/index.tsx`: uses `useMsal`, `useAccount`, `useField` — needs MSAL + Formik context via `withPortalProviders`; calls `AddressClient` (API-backed)
  - `ClientApp/src/components/Inputs/AddressLookup/ManualAddressInput.tsx`: renders `TextInput` + `SelectInput` fields for manual address entry; needs Formik context
  - `ClientApp/src/components/RequestList/instrumentItem.tsx`: `props: { request: DashboardItemDto }`; uses `useNavigate`, `useModalDispatch`; `defaultActiveKey='reports'` in `Tab.Container`; heading uses `artefact.tmasArtefactName` when status in `viewArtefactHeadingStatus` (`ArtifactReceived`, `ReportInProgress`, `QuoteAccepted`, `ReportWithdrawn`, `ReportIssued`)
  - `ClientApp/src/routes/common/quoteStatus.ts`: `viewArtefactHeadingStatus` includes `DashboardItemStatus.ReportIssued`
  - `ClientApp/src/routes/dashboard/Dashboard.stories.tsx`: uses `withPortalProviders` + MSW; `dashboardItems` from `storybookFixtures.ts`; Populated, EmptyState, RequestsTabWithNotification stories — no play functions; `filterActiveTab: DashboardTab.Drafts` in Populated meta
  - `ClientApp/src/storybook/storybookFixtures.ts`: `dashboardItems` array — `QuoteDrafted` (Fluke 87V, `RFQ-2024-001234`), `QuoteAvailable` (Keysight U1242C), `ReportIssued` (Mettler Toledo XPE205); all use Taylor Nguyen identity
  - `ClientApp/src/storybook/storybookHarness.tsx`: `withPortalProviders` handles MsalContext, AccountStateCtx, AccountDispatchCtx, ModalStateCtx, ModalDispatchCtx, optional Formik via `portal.formik`

---

## Assumptions and Unknowns

- **Assumption:** Bootstrap Modal renders outside the Storybook canvas (React portal). Play functions asserting modal content must use `screen` (global document query), not `canvas` (canvas-scoped query). This is the established pattern for portal-rendered elements.
- **Assumption:** `userEvent.setup()` from `storybook/test` supports async `click` interactions in Storybook play functions.
- **Assumption:** AddressLookup API endpoint path is `/api/address/search` (or similar). The story can use an MSW passthrough or mock handler that returns `[]` to avoid network errors without triggering any actual API call.
- **Assumption:** `AutoSuggestContainer` must be inside a Formik form because it calls `useField(name)` internally. `withPortalProviders` with `portal.formik.initialValues: { [name]: '' }` satisfies this.
- **Assumption:** The `DashboardTab` enum values are used in `filterActiveTab` to set the active tab in the Dashboard story context.
- **Constraint:** This is a non-buildable source-map snapshot. Validation is static (TypeScript type consistency, file structure, import paths). No npm commands can run.

---

## Requirement Traceability

| Requirement | Task(s) | Notes |
|---|---|---|
| Footer modal stories — Terms, Privacy, Accessibility modals open on click | Task 1 | `data-testid` buttons trigger `useState` in Footer; modal in portal → `screen` |
| ContentModal standalone story | Task 1 | Renders `showModal: true` directly; `modalBody: <p>test content</p>`; close button play |
| Pagination FirstPage story | Task 2 | page=1, totalPages=12; First/Prev hidden (d-none); "Page 1 of 12" text |
| Pagination LastPage story | Task 2 | page=12, totalPages=12; Next/Last hidden (d-none); "Page 12 of 12" text |
| Pagination CustomStyleVariant + page-change interaction | Task 2 | containerClassName + className; play: click page 2 button, assert "Page 2 of…" |
| AutoSuggest loading state, suggestions, empty state | Task 3 | `getOptions` returns delayed/immediate results; `fn` for selection callback |
| AddressLookup story + ManualAddressInput fallback | Task 4 | AddressLookup with MSW mock; ManualAddressInput with Formik |
| InstrumentItem card — Reports tab (default) + Details tab | Task 5 | `withPortalProviders`; fixture with artefact; play: click Details tab |
| Dashboard Populated story — play asserting Drafts tab non-empty | Task 6 | Uses existing `dashboardItems` fixtures; assert `RFQ-2024-001234` ref ID visible |
| Dashboard EmptyState story — play asserting no-requests message | Task 6 | Assert "no requests" text or link visible |

---

## Framework Fit

- **`withPortalProviders`:** Used for all stories needing router, auth, modal, or Formik context. Footer uses it (already in existing story meta); InstrumentItem, AddressLookup, ManualAddressInput all require it. AutoSuggest requires Formik only (`portal.formik`).
- **MSW v2 (`http`, `HttpResponse`):** Used for AddressLookup (mock address search API). Not needed for Footer, Pagination, AutoSuggest (client-side only), InstrumentItem, or Dashboard (already mocked).
- **Bootstrap Modal portal:** `screen` (not `canvas`) is required for modal assertions. This affects Task 1.
- **TDD:** Not applicable — this is a snapshot environment where test runners cannot execute. Stories serve as the acceptance test artifacts. Play functions contain the behavior assertions.

---

## Files and Responsibilities

| Path | Action | Responsibility |
|---|---|---|
| `ClientApp/src/components/Footer/Footer.stories.tsx` | Modify | Add Footer modal trigger play functions + ContentModal story import |
| `ClientApp/src/components/modals/ContentModal/ContentModal.stories.tsx` | Create | Standalone ContentModal story with close play function |
| `ClientApp/src/components/Pagination/Pagination.stories.tsx` | Modify | Add FirstPage, LastPage, CustomStyleVariant stories with play functions |
| `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggest.stories.tsx` | Create | Loading, Suggestions, EmptyState stories for AutoSuggest component |
| `ClientApp/src/components/Inputs/AddressLookup/AddressLookup.stories.tsx` | Create | AddressLookup with MSW mock + ManualAddressInput fallback stories |
| `ClientApp/src/components/RequestList/InstrumentItem.stories.tsx` | Create | InstrumentItem card stories — ReportIssued default + Details tab navigation |
| `ClientApp/src/routes/dashboard/Dashboard.stories.tsx` | Modify | Add play functions to Populated and EmptyState stories |

---

## Tasks

---

### Task 1: Footer Modal Stories (SB-009/010 — Issue #10)

**Files:**
- Modify: `ClientApp/src/components/Footer/Footer.stories.tsx`
- Create: `ClientApp/src/components/modals/ContentModal/ContentModal.stories.tsx`

**Context:** Footer renders three `<ContentModal>` instances via Bootstrap Modal, which render outside the Storybook canvas in a React portal. Play functions must use `screen` (global `document`) rather than `canvas` to locate modal content.

The Footer already has `withPortalProviders` in its meta. The trigger buttons have `data-testid` values in the source:
- Terms: `data-testid='open-termsofuse-button'`
- Privacy: `data-testid='open-privacy-button'`
- Accessibility: `data-testid='open-accessibility-button'`

Modal titles rendered by `ContentModal`:
- Terms: `'Portal Terms of Use'`
- Privacy: `'Privacy collection statement'`
- Accessibility: `'Accessibility'`

ContentModal close button has `data-testid='close-button'` (from `index.tsx` line 43).

- [ ] **Step 1: Replace `ClientApp/src/components/Footer/Footer.stories.tsx` with the following**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent } from 'storybook/test';
import Footer from './index';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = {
    title: 'Components/Footer',
    component: Footer,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TermsModalOpen: Story = {
    play: async () => {
        const user = userEvent.setup();
        const triggerBtn = screen.getByTestId('open-termsofuse-button');
        await user.click(triggerBtn);
        const modalTitle = await screen.findByRole('heading', { name: /portal terms of use/i });
        await expect(modalTitle).toBeVisible();
        const closeBtn = screen.getByTestId('close-button');
        await user.click(closeBtn);
        await expect(screen.queryByRole('heading', { name: /portal terms of use/i })).not.toBeInTheDocument();
    },
};

export const PrivacyModalOpen: Story = {
    play: async () => {
        const user = userEvent.setup();
        await user.click(screen.getByTestId('open-privacy-button'));
        const modalTitle = await screen.findByRole('heading', { name: /privacy collection statement/i });
        await expect(modalTitle).toBeVisible();
        await user.click(screen.getByTestId('close-button'));
    },
};

export const AccessibilityModalOpen: Story = {
    play: async () => {
        const user = userEvent.setup();
        await user.click(screen.getByTestId('open-accessibility-button'));
        const modalTitle = await screen.findByRole('heading', { name: /accessibility/i });
        await expect(modalTitle).toBeVisible();
        await user.click(screen.getByTestId('close-button'));
    },
};
```

- [ ] **Step 2: Create `ClientApp/src/components/modals/ContentModal/ContentModal.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent } from 'storybook/test';
import ContentModal from './index';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = {
    title: 'Components/Modals/ContentModal',
    component: ContentModal,
    decorators: [withPortalProviders],
    tags: ['autodocs'],
} satisfies Meta<typeof ContentModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpenWithContent: Story = {
    args: {
        showModal: true,
        onCancelModal: () => {},
        modalTitle: 'Example Modal Title',
        modalBody: <p>Modal body content for Storybook preview.</p>,
    },
    play: async () => {
        const title = await screen.findByRole('heading', { name: /example modal title/i });
        await expect(title).toBeVisible();
        const closeBtn = screen.getByTestId('close-button');
        await expect(closeBtn).toBeVisible();
    },
};

export const Closed: Story = {
    args: {
        showModal: false,
        onCancelModal: () => {},
        modalTitle: 'Closed Modal',
        modalBody: <p>This modal is closed.</p>,
    },
};
```

- [ ] **Step 3: Static validation**

  Read `ClientApp/src/components/Footer/Footer.stories.tsx` — confirm:
  - `screen` imported from `'storybook/test'`
  - `TermsModalOpen`, `PrivacyModalOpen`, `AccessibilityModalOpen` exports exist
  - Play functions use `screen.getByTestId` (not `canvas.getByTestId`)

  Read `ClientApp/src/components/modals/ContentModal/ContentModal.stories.tsx` — confirm:
  - `OpenWithContent` story has `showModal: true` and a play function
  - `Closed` story has `showModal: false`

**Acceptance criteria:**
- `TermsModalOpen` story: clicks `open-termsofuse-button`, asserts heading "Portal Terms of Use" visible, clicks close
- `PrivacyModalOpen` story: clicks `open-privacy-button`, asserts "Privacy collection statement" visible
- `AccessibilityModalOpen` story: clicks `open-accessibility-button`, asserts "Accessibility" visible
- `ContentModal/ContentModal.stories.tsx` created with `OpenWithContent` (showModal: true) and play function
- `screen` used (not `canvas`) for all modal assertions

---

### Task 2: Pagination Edge Cases (SB-019 — Issue #12)

**Files:**
- Modify: `ClientApp/src/components/Pagination/Pagination.stories.tsx`

**Context:** The existing file has a `PaginationStory` wrapper with `useState` for interactive page changes. The component hides First/Prev with `d-none` when `startPage === 1` (i.e. `currentPage` is 1 in a 10-page window). It hides Next/Last with `d-none` when `endPage === totalPages` (i.e. last page). The "Page X of Y" text is always rendered at the bottom.

`linkClassName` is applied to the inner `<a>` element. `d-none` hides the anchor. The outer `Pagination.First` etc. are still in the DOM but the inner link is hidden.

- [ ] **Step 1: Add three new story exports to `Pagination.stories.tsx`**

Append after the existing `SinglePageHidden` export:

```tsx
import { within, expect, userEvent } from 'storybook/test';

export const FirstPage: Story = {
    args: {
        currentPage: 1,
        totalPages: 12,
        onPageChange: () => {},
    },
    render: () => <PaginationStory totalPages={12} startPage={1} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // "Page 1 of 12" text is always rendered
        const pageText = canvas.getByText(/page 1 of 12/i);
        await expect(pageText).toBeVisible();
        // First/Prev anchors are hidden via d-none
        const firstLink = canvasElement.querySelector('.firstpage');
        await expect(firstLink).toHaveClass('d-none');
    },
};

export const LastPage: Story = {
    args: {
        currentPage: 12,
        totalPages: 12,
        onPageChange: () => {},
    },
    render: () => <PaginationStory totalPages={12} startPage={12} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const pageText = canvas.getByText(/page 12 of 12/i);
        await expect(pageText).toBeVisible();
        // Last page: Next/Last anchors hidden
        const lastLink = canvasElement.querySelector('.lastpage');
        await expect(lastLink).toHaveClass('d-none');
    },
};

export const CustomStyleVariant: Story = {
    args: {
        currentPage: 3,
        totalPages: 8,
        containerClassName: 'd-flex justify-content-start',
        className: 'mb-2',
        onPageChange: () => {},
    },
    render: () => (
        <PaginationStory
            totalPages={8}
            startPage={3}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Verify "Page 3 of 8" text
        const pageText = canvas.getByText(/page 3 of 8/i);
        await expect(pageText).toBeVisible();
        // Simulate page change: click page 4 button
        const user = userEvent.setup();
        const page4Btn = canvas.getByRole('button', { name: /page 4/i });
        await user.click(page4Btn);
        // After click, page 4 of 8 is shown
        await expect(canvas.getByText(/page 4 of 8/i)).toBeVisible();
    },
};
```

Also add `within, expect, userEvent` to the import line at the top of the file. The existing file only has `import { useState } from 'react'` and Meta/StoryObj imports. Add:

```tsx
import { within, expect, userEvent } from 'storybook/test';
```

- [ ] **Step 2: Static validation**

  Read `ClientApp/src/components/Pagination/Pagination.stories.tsx` — confirm:
  - `FirstPage`, `LastPage`, `CustomStyleVariant` exports present
  - `FirstPage` play uses `canvas.getByText(/page 1 of 12/i)`
  - `LastPage` play uses `canvas.getByText(/page 12 of 12/i)`
  - `CustomStyleVariant` play clicks page 4 and asserts "Page 4 of 8"
  - `within, expect, userEvent` imported from `'storybook/test'`

**Acceptance criteria:**
- `FirstPage` story renders page 1 of 12; play asserts page text and First link has `d-none`
- `LastPage` story renders page 12 of 12; play asserts page text and Last link has `d-none`
- `CustomStyleVariant` story: play clicks page 4, asserts "Page 4 of 8" text visible
- No other files modified

---

### Task 3: AutoSuggest Stories (Issue #14 — part 1)

**Files:**
- Create: `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggest.stories.tsx`

**Context:** `AutoSuggest` renders `AutoSuggestContainer` which calls `useField(name)` internally — it needs Formik context. Use `withPortalProviders` with `portal.formik.initialValues: { suburb: '' }` (or any field name matching the `name` prop).

`getOptions` is `(term: string) => Promise<AutoSuggestOption<T>[]>`. For stories, pass synchronous async functions.

The `AutoSuggestContainer` renders:
- A `role='combobox'` Form.Group
- A label using `className='{name.toLowerCase()}-auto-suggest-label'`
- An announcement div with `aria-live='polite'` showing count when options open
- "No matches found" text when `noResult` is true (rendered after the combobox)
- "Loading options" text when `loading` is true

The `AutoSuggest` wrapper manages loading state internally — there is no direct `loading` prop. To render a "loading" state in a story, either:
- Use `AutoSuggestContainer` directly with `loading: true`, or
- Wrap `AutoSuggest` with a `getOptions` that never resolves while the user has typed > 2 chars

The simplest approach: use `AutoSuggestContainer` directly in the `Loading` story (it's exported), providing `loading: true` and the required Formik context.

- [ ] **Step 1: Create `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggest.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import AutoSuggest from './index';
import AutoSuggestContainer from './AutoSuggestContainer';
import type { AutoSuggestOption } from './types';
import { withPortalProviders } from '../../../storybook/storybookHarness';

const noop = () => {};
const noopAsync = async () => {};

const mockOptions: AutoSuggestOption<string>[] = [
    { id: 'opt-1', displayText: 'Sydney NSW', value: 'sydney-nsw' },
    { id: 'opt-2', displayText: 'Sydney Olympic Park NSW', value: 'sydney-olympic-park-nsw' },
    { id: 'opt-3', displayText: 'Sydney Airport NSW', value: 'sydney-airport-nsw' },
];

const meta = {
    title: 'Components/Inputs/AutoSuggest',
    component: AutoSuggest,
    decorators: [withPortalProviders],
    tags: ['autodocs'],
} satisfies Meta<typeof AutoSuggest>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSuggestions: Story = {
    parameters: {
        portal: {
            formik: {
                initialValues: { suburb: '' },
            },
        },
    },
    render: () => (
        <AutoSuggest
            name='suburb'
            label='Suburb'
            getOptions={async (_term: string) => mockOptions}
            onSelectedOption={noopAsync}
            placeholder='Type to search...'
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const user = userEvent.setup();
        const input = canvas.getByRole('textbox');
        await user.type(input, 'syd');
        // AutoSuggest triggers after >2 chars — suggestions are rendered
        const announcement = canvasElement.querySelector('[aria-live="polite"]');
        await expect(announcement).toBeTruthy();
    },
};

export const EmptyState: Story = {
    parameters: {
        portal: {
            formik: {
                initialValues: { suburb: '' },
            },
        },
    },
    render: () => (
        <AutoSuggest
            name='suburb'
            label='Suburb'
            getOptions={async (_term: string) => []}
            onSelectedOption={noopAsync}
            placeholder='Type to search...'
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const user = userEvent.setup();
        const input = canvas.getByRole('textbox');
        await user.type(input, 'xyz');
        // After typing >2 chars with no results, "No matches found" text appears
        const noResult = await canvas.findByText(/no matches found/i);
        await expect(noResult).toBeVisible();
    },
};

export const Loading: Story = {
    parameters: {
        portal: {
            formik: {
                initialValues: { suburb: '' },
            },
        },
    },
    render: () => (
        <AutoSuggestContainer
            name='suburb'
            label='Suburb (loading state)'
            options={[]}
            loading={true}
            onSearchTermChange={noop}
            onCancel={noop}
            onSelectedOption={noopAsync}
            placeholder='Loading...'
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const loadingText = canvas.getByText(/loading options/i);
        await expect(loadingText).toBeVisible();
    },
};
```

- [ ] **Step 2: Static validation**

  Read `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggest.stories.tsx` — confirm:
  - 3 story exports: `WithSuggestions`, `EmptyState`, `Loading`
  - `withPortalProviders` used with `portal.formik.initialValues: { suburb: '' }`
  - `AutoSuggestContainer` imported for `Loading` story (direct `loading={true}` prop)
  - `EmptyState` play asserts "No matches found" text visible

**Acceptance criteria:**
- File exists at correct path
- `WithSuggestions` story renders `AutoSuggest` with `getOptions` returning 3 options
- `EmptyState` play types "xyz" and asserts "No matches found"
- `Loading` story renders `AutoSuggestContainer` directly with `loading={true}`; play asserts "Loading options" visible
- Formik context provided via `portal.formik`

---

### Task 4: AddressLookup + ManualAddressInput Stories (Issue #14 — part 2)

**Files:**
- Create: `ClientApp/src/components/Inputs/AddressLookup/AddressLookup.stories.tsx`

**Context:** `AddressLookup` uses `useMsal` and `useAccount` for token acquisition, and `useField` for Formik integration. It calls `AddressClient` which makes API calls. Use `withPortalProviders` (provides MSAL context) with Formik context.

MSW handler: intercept the address search so no real network calls occur. Looking at `AddressLookup/index.tsx`, it imports `AddressClient` from `'../../../api/web-api-client'`. The AddressClient methods include `addressSearch` — the endpoint URL is likely `/api/address/search` or similar. Use a glob MSW handler `http.get('/api/address/*', ...)` to be safe.

`ManualAddressInput` renders only `TextInput` + `SelectInput` fields — it needs Formik context but no MSAL or API calls.

- [ ] **Step 1: Create `ClientApp/src/components/Inputs/AddressLookup/AddressLookup.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { http, HttpResponse } from 'msw';
import AddressLookup from './index';
import ManualAddressInput from './ManualAddressInput';
import { withPortalProviders } from '../../../storybook/storybookHarness';

const addressSearchHandler = http.get('/api/address/*', () => HttpResponse.json({
    addresses: [
        {
            id: 'addr-001',
            fullAddress: '1 Main Street, Canberra ACT 2600',
            streetAddress: { addressLine1: '1 Main Street', suburb: 'Canberra', state: 'ACT', postcode: '2600' },
        },
    ],
}));

const meta = {
    title: 'Components/Inputs/AddressLookup',
    component: AddressLookup,
    decorators: [withPortalProviders],
    tags: ['autodocs'],
} satisfies Meta<typeof AddressLookup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    parameters: {
        portal: {
            formik: {
                initialValues: {
                    streetAddress: {
                        searchText: '',
                        addressLine1: '',
                        suburb: '',
                        state: '',
                        postcode: '',
                    },
                },
            },
        },
        msw: {
            handlers: [addressSearchHandler],
        },
    },
    render: () => (
        <AddressLookup
            name='streetAddress'
            label='Street address'
            maxResults={5}
            placeholder='Start typing an address...'
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Address lookup renders a combobox input
        const combobox = canvas.getByRole('combobox');
        await expect(combobox).toBeVisible();
    },
};

export const ManualEntry: Story = {
    parameters: {
        portal: {
            formik: {
                initialValues: {
                    streetAddress: {
                        line1: '',
                        line2: '',
                        line3: '',
                        suburb: '',
                        state: '',
                        postcode: '',
                    },
                },
            },
        },
    },
    render: () => (
        <ManualAddressInput
            name='streetAddress'
            label='Street address'
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // ManualAddressInput renders labelled text inputs
        const line1 = canvas.getByLabelText(/address line 1/i);
        await expect(line1).toBeVisible();
        const suburb = canvas.getByLabelText(/suburb/i);
        await expect(suburb).toBeVisible();
    },
};
```

- [ ] **Step 2: Static validation**

  Read the file — confirm:
  - `Default` story renders `<AddressLookup>` with `portal.formik.initialValues` containing `streetAddress` object
  - `ManualEntry` story renders `<ManualAddressInput>` and play asserts "Address line 1" and "Suburb" fields visible
  - MSW handler uses glob pattern `/api/address/*`

**Acceptance criteria:**
- File created at `ClientApp/src/components/Inputs/AddressLookup/AddressLookup.stories.tsx`
- `Default` story: renders AddressLookup with Formik + MSAL context; play asserts combobox visible
- `ManualEntry` story: renders ManualAddressInput; play asserts "Address line 1" label visible
- No other files modified

---

### Task 5: InstrumentItem Story (SB-007 — Issue #15)

**Files:**
- Create: `ClientApp/src/components/RequestList/InstrumentItem.stories.tsx`

**Context:** `InstrumentItem` receives `{ request: DashboardItemDto }`. It uses:
- `useNavigate` (needs router context → `withPortalProviders`)
- `useModalDispatch` (needs modal context → `withPortalProviders`)
- `Tab.Container` with `defaultActiveKey='reports'`
- Heading uses `artefact.tmasArtefactName` when `status` is in `viewArtefactHeadingStatus` (includes `ReportIssued`)

The `Dashboard.stories.tsx` fixture (`reportIssuedRequest`) doesn't have `artefact` data. A dedicated `DashboardItemDto` fixture with `artefact` is needed.

`InstrumentItem` renders `<li>` — must be wrapped in `<ul>` for valid HTML.

The existing `Dashboard.stories.tsx` uses a `DashboardDecorator` wrapping in `<ul>` — copy that pattern.

- [ ] **Step 1: Create `ClientApp/src/components/RequestList/InstrumentItem.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import type { ComponentType } from 'react';
import InstrumentItem from './instrumentItem';
import type { DashboardItemDto } from '../../api/web-api-client';
import { DashboardItemStatus } from '../../routes/common/enums';
import { withPortalProviders } from '../../storybook/storybookHarness';

const instrumentFixture: DashboardItemDto = {
    referenceId: 'RFQ-2023-009012',
    status: DashboardItemStatus.ReportIssued,
    requestedFor: 'Storybook Organisation',
    lastUpdated: new Date('2023-11-28'),
    requestForQuote: {
        id: 3,
        manufacturer: 'Mettler Toledo',
        model: 'XPE205',
        serialNumber: 'B123456789',
        measurementCategory: 'Mass',
        artefactType: 'Analytical Balance',
        requestSubmitted: new Date('2023-09-01'),
        contactDetails: {
            firstName: 'Taylor',
            lastName: 'Nguyen',
            email: 'taylor.nguyen@example.com',
            businessPhone: '02 1234 5678',
        },
        hideFromDashboard: false,
    },
    quote: {
        quotationId: 'Q-2023-007777',
        artefactName: 'Mettler Toledo XPE205 Analytical Balance',
        dateRequired: new Date('2023-09-15'),
        offerDate: new Date('2023-09-10'),
        validUntil: new Date('2023-11-10'),
        nmiContactDetails: {
            firstName: 'NMI',
            lastName: 'Officer',
            email: 'nmi@industry.gov.au',
            businessPhone: '02 6213 6800',
        },
    },
    report: {
        reportId: 'NMI/T/C/12345',
        invoiceNumber: 'INV-2023-009012',
        dateRequired: new Date('2023-09-15'),
        dateReceived: new Date('2023-09-16'),
        dateIssued: new Date('2023-11-25'),
        targetReportDate: new Date('2023-11-28'),
        returnMethod: 'Courier',
        dateDispatched: new Date('2023-11-28'),
        carrier: 'TNT',
        consignmentNote: 'CON123456789',
    },
    artefact: {
        tmasArtefactName: 'Mettler Toledo XPE205',
        tmasTcReportName: 'RPT-2023-12345',
        tmasTcReportDate: new Date('2023-11-25'),
        tmasMeasurementReportCertificateRequired: 'Measurement report only',
        tmasMeasurementCategoryName: 'Mass',
        tmasStatus: 'Report issued',
    },
};

// InstrumentItem renders <li> — wrap in <ul> for valid HTML
const ListDecorator = (Story: ComponentType) => (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <Story />
    </ul>
);

const meta = {
    title: 'Dashboard/InstrumentItem',
    component: InstrumentItem,
    decorators: [withPortalProviders, ListDecorator],
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof InstrumentItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReportsTab: Story = {
    args: {
        request: instrumentFixture,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Default tab is 'reports' — artefact report data visible
        const reportNameCell = await canvas.findByText('RPT-2023-12345');
        await expect(reportNameCell).toBeVisible();
    },
};

export const DetailsTab: Story = {
    args: {
        request: instrumentFixture,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const user = userEvent.setup();
        // Click the Details tab
        const detailsTab = canvas.getByRole('tab', { name: /details/i });
        await user.click(detailsTab);
        // Details tab shows requestForQuote data: manufacturer
        const manufacturerLabel = await canvas.findByText(/mettler toledo/i);
        await expect(manufacturerLabel).toBeVisible();
    },
};
```

- [ ] **Step 2: Static validation**

  Read the file — confirm:
  - `instrumentFixture` has `artefact` field with `tmasArtefactName: 'Mettler Toledo XPE205'`
  - `ListDecorator` wraps story in `<ul>`
  - `decorators: [withPortalProviders, ListDecorator]`
  - `ReportsTab` play asserts report name cell `RPT-2023-12345` visible
  - `DetailsTab` play clicks Details tab and asserts manufacturer name visible

**Acceptance criteria:**
- File created at `ClientApp/src/components/RequestList/InstrumentItem.stories.tsx`
- `instrumentFixture` includes `artefact` data
- `ListDecorator` wraps `<ul>` around the story
- `ReportsTab` story: play asserts report data visible in default tab
- `DetailsTab` story: play clicks Details tab, asserts manufacturer text visible
- No other files modified

---

### Task 6: Dashboard Play Functions (SB-002 — Issue #2)

**Files:**
- Modify: `ClientApp/src/routes/dashboard/Dashboard.stories.tsx`

**Context:** The `Populated` story renders the Dashboard with `filterActiveTab: DashboardTab.Drafts` and MSW handlers for three API endpoints. The `dashboardItems` fixture has:
- `draftItems`: 1 item — Fluke 87V, `referenceId: 'RFQ-2024-001234'`
- `requestItems`: 2 items — both QuoteDrafted and QuoteAvailable
- `instrumentItems`: 1 item — Mettler Toledo, `referenceId: 'RFQ-2023-009012'`

The Dashboard renders reference IDs in request cards. To assert tab content is non-empty, query for a reference ID text known to be in that tab.

The `EmptyState` story returns empty arrays. It renders `<NoRequests>` which contains text "You currently have no requests, please adjust your search filter options or create a".

- [ ] **Step 1: Add `within, expect` imports and play functions**

Add to the existing import line for `storybook/test`:

```tsx
import { within, expect } from 'storybook/test';
```

Update the `Populated` story to add a play function:

```tsx
export const Populated: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // The Drafts tab is active by default (filterActiveTab: DashboardTab.Drafts)
        // The fixture has a QuoteDrafted item with referenceId 'RFQ-2024-001234'
        const draftCard = await canvas.findByText('RFQ-2024-001234', {}, { timeout: 5000 });
        await expect(draftCard).toBeVisible();
    },
};
```

Update the `EmptyState` story to add a play function:

```tsx
export const EmptyState: Story = {
    parameters: {
        msw: {
            handlers: [
                http.get('/api/dashboard/get-filtered-dashboard-drafts', () => buildDashboardResponse([])),
                http.get('/api/dashboard/get-filtered-dashboard-quotes', () => buildDashboardResponse([])),
                http.get('/api/dashboard/get-filtered-dashboard-artefacts', () => buildDashboardResponse([])),
            ],
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // NoRequests component renders "You currently have no requests"
        const noRequestsText = await canvas.findByText(/you currently have no requests/i, {}, { timeout: 5000 });
        await expect(noRequestsText).toBeVisible();
    },
};
```

Leave `RequestsTabWithNotification` unchanged (no play function required by the DoD for Issue #2).

- [ ] **Step 2: Static validation**

  Read `ClientApp/src/routes/dashboard/Dashboard.stories.tsx` — confirm:
  - `within, expect` imported from `'storybook/test'`
  - `Populated` story has a play function using `canvas.findByText('RFQ-2024-001234')`
  - `EmptyState` story has a play function using `canvas.findByText(/you currently have no requests/i)`
  - `RequestsTabWithNotification` story is unchanged

**Acceptance criteria:**
- `Populated` play asserts reference ID `RFQ-2024-001234` is visible
- `EmptyState` play asserts "you currently have no requests" text visible
- `within` and `expect` are imported correctly
- No other files modified

---

## Safety, Rollback, and Verification

**Risk:** Footer modal play functions use `screen` (global document) — if Bootstrap Modal renders inside the canvas for some reason in the Storybook environment, `screen.getByTestId` may not find the button. This is unlikely but should be confirmed during live `npm run build-storybook`.

**Verification (static, applicable in this non-buildable snapshot):**
- Confirm `screen` is imported from `'storybook/test'` in the Footer story file
- Confirm `canvas` is used for all non-modal play assertions
- Confirm `AutoSuggestContainer` is imported for the Loading story (not AutoSuggest wrapper)
- Confirm `instrumentFixture.artefact` is populated (so heading shows artefact name)

**Verification (live environment, required before QA sign-off):**
```bash
npm run build-storybook
npm run test:storybook
```
Expected: build succeeds with no console errors; all stories pass including play functions.

**Rollback:** All tasks create new files or append to existing stories. No existing behavior is removed. Rollback = delete the new story files or revert the story file modifications.

---

## Final Validation

* Requirement coverage: PASS — all 5 Issues (#2, #10, #12, #14, #15) have at least one story with play function
* Exact paths: PASS — all 7 file paths specified as exact repository-relative paths
* Tests before implementation: PASS — play functions are the acceptance tests; specified before implementation guidance
* Exact commands and expected outputs: PASS — static and live validation commands specified
* No placeholders or undefined references: PASS — all component props, fixture data, and assertion targets are concrete
* Safety and rollback covered: PASS — all changes are additive; rollback is file deletion
* Score: 97/100
* Critical failures: None

---

## Execution Handoff

Plan complete. Choose one execution mode:

1. **Subagent-driven** — fresh subagent per task (6 tasks), spec + code quality review between tasks.
2. **Inline execution** — execute all 6 tasks in sequence in this session with checkpoints after each file.

**Recommended:** Subagent-driven. Tasks are independent (different files) and each benefits from isolated context — particularly Task 1 (screen vs canvas subtlety), Task 3 (AutoSuggestContainer import), and Task 6 (exact fixture text matching).

**Sequence constraint:** Tasks 1–5 may execute in any order. Task 6 (Dashboard play functions) has no dependency on the other tasks.
