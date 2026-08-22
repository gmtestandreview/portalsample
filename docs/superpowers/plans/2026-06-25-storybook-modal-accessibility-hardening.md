# Storybook Modal Accessibility Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the current Storybook accessibility failures from modal-style components, tighten modal interaction stories so they assert accessible dialog behavior, and reduce duplicated Storybook setup code around modal stories.

**Architecture:** Keep the fix narrowly scoped to the existing modal components and their stories. Treat React Bootstrap `Modal` as the source of dialog semantics, remove handwritten ARIA props that land on the wrong DOM node, restore explicit accessible naming via `aria-labelledby`, and move stories toward role-based assertions so the a11y contract is exercised directly.

**Tech Stack:** React 18, TypeScript, React Bootstrap 5, Storybook 9 (`@storybook/react-vite`), `storybook/test`, MSW, Formik, React Router v7

---

## File Structure

- Modify: `ClientApp/src/components/RouteLeavingGuard/index.tsx`
  - Remove invalid manual modal ARIA wiring and restore explicit dialog labelling.
- Modify: `ClientApp/src/components/modals/ConfirmationModal/index.tsx`
  - Align React Bootstrap modal props with the intended accessible-dialog contract.
- Modify: `ClientApp/src/components/modals/ContentModal/index.tsx`
  - Align modal semantics and preserve the existing labelled title contract.
- Modify: `ClientApp/src/components/modals/BranchSelectorModal/index.tsx`
  - Remove invalid modal ARIA props, restore `aria-labelledby`, and keep existing visible heading text as the accessible name.
- Modify: `ClientApp/src/components/modals/RFQDeleteModal/index.tsx`
  - Remove invalid modal ARIA props and wire the dialog to its visible title.
- Modify: `ClientApp/src/components/RouteLeavingGuard/RouteLeavingGuard.stories.tsx`
  - Assert dialog role/name semantics instead of only `data-testid` visibility.
- Modify: `ClientApp/src/components/modals/ContentModal/ContentModal.stories.tsx`
  - Add an interactive close-path story assertion that proves the modal can be dismissed.
- Modify: `ClientApp/src/components/modals/Modals.stories.tsx`
  - Replace duplicated provider setup where possible, and upgrade modal stories to assert named dialogs and meaningful user flows.
- Modify: `ClientApp/src/storybook/storybookHarness.tsx`
  - Extend existing shared Storybook provider helpers if needed so modal stories can reuse them instead of hand-rolled context trees.

## Task 1: Baseline and investigate the current modal accessibility contract

**Files:**
- Modify: none
- Review: `ClientApp/src/components/RouteLeavingGuard/index.tsx`
- Review: `ClientApp/src/components/modals/ConfirmationModal/index.tsx`
- Review: `ClientApp/src/components/modals/ContentModal/index.tsx`
- Review: `ClientApp/src/components/modals/BranchSelectorModal/index.tsx`
- Review: `ClientApp/src/components/modals/RFQDeleteModal/index.tsx`
- Review: `ClientApp/src/components/RouteLeavingGuard/RouteLeavingGuard.stories.tsx`
- Review: `ClientApp/src/components/modals/ContentModal/ContentModal.stories.tsx`
- Review: `ClientApp/src/components/modals/Modals.stories.tsx`

- [ ] **Step 1: Start Storybook and confirm the MCP endpoint is live**

```powershell
npm run storybook
```

Expected: Storybook serves on `http://localhost:6006` and MCP is reachable at `http://localhost:6006/mcp`.

- [ ] **Step 2: Reproduce the failing accessibility stories with focused Storybook MCP runs**

```json
{
  "a11y": true,
  "stories": [
    { "storyId": "components-routeleavingguard--intercepted-navigation" },
    { "storyId": "components-routeleavingguard--custom-copy" },
    { "storyId": "modals--confirmation-closed" },
    { "storyId": "modals--branch-selector-select-and-edit" },
    { "storyId": "modals--branch-selector-rfq-mode" },
    { "storyId": "modals--rfq-delete-confirmation" },
    { "storyId": "components-modals-contentmodal--open-with-content" }
  ]
}
```

Expected: `aria-allowed-attr` fails on components that pass `aria-modal`, and `aria-dialog-name` fails where the modal root is not linked to the visible title.

- [ ] **Step 3: Inspect the generated DOM contract before touching code**

```tsx
// Current smell to confirm in each component review:
<Modal
    show={isOpen}
    aria-modal={isOpen}
    aria-labelledby="modal-id"
    data-testid="prompt-modal"
>
```

Expected: the manual `aria-modal` prop lands on a descendant `.modal-dialog` element rather than the dialog root, which explains the `aria-allowed-attr` failure.

## Task 2: Refactor the modal components to use a consistent accessible-dialog contract

**Files:**
- Modify: `ClientApp/src/components/RouteLeavingGuard/index.tsx`
- Modify: `ClientApp/src/components/modals/ConfirmationModal/index.tsx`
- Modify: `ClientApp/src/components/modals/ContentModal/index.tsx`
- Modify: `ClientApp/src/components/modals/BranchSelectorModal/index.tsx`
- Modify: `ClientApp/src/components/modals/RFQDeleteModal/index.tsx`

- [ ] **Step 1: Refactor `RouteLeavingGuard` to remove handwritten `aria-modal` and keep explicit title labelling**

```tsx
<Modal
    show={blocker.state === 'blocked'}
    aria-labelledby='modal-unsaved'
    onHide={closeModal}
    backdrop='static'
    keyboard={false}
    data-testid='prompt-save-modal'
>
    <Modal.Header closeButton>
        <Modal.Title id='modal-unsaved' as='h3'>{title}</Modal.Title>
    </Modal.Header>
```

Run: focused Storybook MCP `run-story-tests` for `components-routeleavingguard--intercepted-navigation` and `components-routeleavingguard--custom-copy`

Expected: `aria-allowed-attr` is gone, and the dialog becomes nameable from its visible title.

- [ ] **Step 2: Apply the same contract to the reusable modal components**

```tsx
<Modal
    size='lg'
    show={isOpen}
    aria-labelledby='modal-confirmation'
    onHide={onModalNo}
    backdrop='static'
    keyboard={false}
    data-testid='prompt-confirmation-modal'
>
```

```tsx
<Modal
    size='lg'
    show={showModal}
    aria-labelledby='modal-content'
    onHide={onCancelModal}
>
```

```tsx
<Modal
    size='lg'
    show={modalState?.showBranchSelector}
    aria-labelledby='modal-select-branch'
    enforceFocus={modalState?.showBranchSelector}
    aria-live='assertive'
    backdrop='static'
    keyboard={false}
    data-testid='prompt-branchselector-modal'
    onHide={handleClose}
>
```

```tsx
<Modal
    size='lg'
    show={modalState?.showRFQDeleteModal}
    aria-labelledby='modal-delete-rfq'
    enforceFocus={modalState?.showRFQDeleteModal}
    backdrop='static'
    keyboard={false}
    aria-live='assertive'
    aria-atomic='false'
    data-testid='prompt-rfqdelete-modal'
    onHide={handleClose}
>
```

Run: focused Storybook MCP `run-story-tests` for `modals--confirmation-closed`, `modals--branch-selector-select-and-edit`, `modals--branch-selector-rfq-mode`, `modals--rfq-delete-confirmation`, and `components-modals-contentmodal--open-with-content`

Expected: current modal a11y failures clear without changing user-visible copy or layout.

- [ ] **Step 3: Review whether any extra modal semantics should move to body/title instead of the root**

```tsx
<Modal.Title id='modal-delete-rfq' as='h3'>
    Confirm deletion
</Modal.Title>
<Modal.Body>
    <p>
        Are you sure you want to delete this Request Ref ID <strong>{modalState?.rfqId}</strong>?
        Deleting this request cannot be undone.
    </p>
</Modal.Body>
```

Expected: the dialog name comes from the visible title, while descriptive copy remains in the body instead of hidden suffix text like `"(modal dialog)"`.

## Task 3: Strengthen Storybook interaction coverage around the fixed modal semantics

**Files:**
- Modify: `ClientApp/src/components/RouteLeavingGuard/RouteLeavingGuard.stories.tsx`
- Modify: `ClientApp/src/components/modals/ContentModal/ContentModal.stories.tsx`
- Modify: `ClientApp/src/components/modals/Modals.stories.tsx`

- [ ] **Step 1: Update `RouteLeavingGuard` stories to assert the named dialog contract**

```tsx
const dialog = await screen.findByRole('dialog', { name: /unsaved changes/i });
await expect(dialog).toBeVisible();
await expect(screen.getByTestId('prompt-cancel-button')).toBeVisible();
await expect(screen.getByTestId('prompt-leave-button')).toBeVisible();
```

```tsx
const dialog = await screen.findByRole('dialog', { name: /are you sure you want to log out\?/i });
await expect(dialog).toBeVisible();
await expect(screen.getByText(/Any changes made will not be saved/)).toBeVisible();
```

Run: focused Storybook MCP `run-story-tests` for the four `components-routeleavingguard--*` stories

Expected: stories verify the behavior the a11y suite depends on, not just a test ID.

- [ ] **Step 2: Make `ContentModal` prove dismissal behavior instead of only render behavior**

```tsx
const onCancelModal = fn();

export const OpenWithContent: Story = {
    args: {
        showModal: true,
        onCancelModal,
        modalTitle: 'Example Modal Title',
        modalBody: <p>Modal body content for Storybook preview.</p>,
    },
    play: async () => {
        const dialog = await screen.findByRole('dialog', { name: /example modal title/i });
        await expect(dialog).toBeVisible();
        await userEvent.click(screen.getByTestId('close-button'));
        await expect(onCancelModal).toHaveBeenCalled();
    },
};
```

Run: focused Storybook MCP `run-story-tests` for `components-modals-contentmodal--open-with-content`

Expected: the story now covers both accessible naming and the primary close action.

- [ ] **Step 3: Refactor `Modals.stories.tsx` toward role-based assertions and real user flows**

```tsx
const dialog = await screen.findByRole('dialog', { name: /save and exit\?/i });
await expect(dialog).toBeVisible();
await userEvent.click(screen.getByTestId('prompt-yes-button'));
await waitFor(() => expect(screen.queryByRole('dialog', { name: /save and exit\?/i })).not.toBeInTheDocument());
```

```tsx
const dialog = await screen.findByRole('dialog', { name: /manage your branch or location/i });
await expect(dialog).toBeVisible();
await expect(screen.getByTestId('select-org-table')).toBeVisible();
```

```tsx
const dialog = await screen.findByRole('dialog', { name: /confirm deletion/i });
await expect(dialog).toBeVisible();
await expect(screen.getByText(/RFQ-2024-001234/)).toBeInTheDocument();
```

Run: focused Storybook MCP `run-story-tests` for the `modals--*` stories

Expected: modal stories become behavior-oriented and less dependent on portal-specific test IDs alone.

## Task 4: Remove duplicated story setup and standardize provider reuse

**Files:**
- Modify: `ClientApp/src/storybook/storybookHarness.tsx`
- Modify: `ClientApp/src/components/modals/ContentModal/ContentModal.stories.tsx`
- Modify: `ClientApp/src/components/modals/Modals.stories.tsx`

- [ ] **Step 1: Extend the shared harness only if it can replace duplicated modal-story providers without widening scope**

```tsx
export interface PortalStoryParameters {
    authenticated?: boolean;
    initialEntries?: string[];
    accountDetails?: Partial<AccountDetails>;
    accountState?: Partial<AccountStateContext>;
    accountDispatch?: Partial<AccountDispatchContext>;
    modalState?: Partial<ModalState>;
    modalDispatch?: Partial<ModalDispatch>;
    formik?: PortalFormikConfig;
    msalContext?: Partial<IMsalContext>;
}
```

Expected: use the existing extension points first; avoid inventing a second modal-specific harness unless the current one cannot express the needed state.

- [ ] **Step 2: Replace hand-rolled providers in `Modals.stories.tsx` where the shared harness can express the same setup**

```tsx
parameters: {
    portal: {
        modalState: {
            showBranchSelector: true,
            showRFQDeleteModal: false,
            branchSelectionModalMode: BranchSelectionModalMode.SelectAndEditOrg,
        },
        accountDetails: {
            organisation: 'ACME Corporation',
            branch: 'Sydney Office',
            defaultOrganisationId: 1,
            organisationCRMGuid: 'guid-001',
        },
    },
}
```

Expected: story setup becomes easier to read and consistent with the global Storybook provider pattern already used elsewhere in the repo.

- [ ] **Step 3: Keep custom story-local setup only where the shared harness would become more complex than the story**

```tsx
// Keep this local only if the story still needs custom MSAL behavior or route-level
// control that the shared portal parameters cannot express cleanly.
```

Expected: the refactor stays DRY without forcing unnatural abstraction.

## Task 5: Validate, preview, and capture follow-up review notes

**Files:**
- Modify: none, unless validation exposes regressions

- [ ] **Step 1: Run repository validation for the touched files**

```powershell
npm run type-check
npm run lint
npm run test:storybook
```

Expected: all commands pass with no new TypeScript or lint regressions, and Storybook interaction/a11y tests are green.

- [ ] **Step 2: Run a full Storybook MCP verification pass for the affected stories**

```json
{
  "a11y": true,
  "stories": [
    { "storyId": "components-routeleavingguard--idle" },
    { "storyId": "components-routeleavingguard--intercepted-navigation" },
    { "storyId": "components-routeleavingguard--custom-copy" },
    { "storyId": "components-routeleavingguard--proceed-after-confirm" },
    { "storyId": "components-modals-contentmodal--open-with-content" },
    { "storyId": "components-modals-contentmodal--closed" },
    { "storyId": "modals--confirmation-open" },
    { "storyId": "modals--confirmation-closed" },
    { "storyId": "modals--branch-selector-select-and-edit" },
    { "storyId": "modals--branch-selector-rfq-mode" },
    { "storyId": "modals--rfq-delete-confirmation" }
  ]
}
```

Expected: no `aria-allowed-attr` or `aria-dialog-name` findings remain in the targeted stories.

- [ ] **Step 3: Generate preview links for visual verification before handoff**

```json
{
  "stories": [
    { "storyId": "components-routeleavingguard--intercepted-navigation" },
    { "storyId": "components-modals-contentmodal--open-with-content" },
    { "storyId": "modals--confirmation-closed" },
    { "storyId": "modals--branch-selector-select-and-edit" },
    { "storyId": "modals--rfq-delete-confirmation" }
  ]
}
```

Expected: preview URLs are attached to the implementation handoff so the user can inspect the fixed dialog titles, focus behavior, and close actions visually.

## Self-Review

- Spec coverage: this plan covers the full set of current MCP findings, the modal-story best-practice gaps, and the duplicated story setup that makes those stories harder to maintain.
- Placeholder scan: no `TODO`, `TBD`, or “handle appropriately” placeholders remain; each task names exact files, expected changes, and verification.
- Type consistency: all named files, story IDs, modal IDs, and provider types match the current repository and MCP catalog.

Plan complete and saved to `docs/superpowers/plans/2026-06-25-storybook-modal-accessibility-hardening.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
