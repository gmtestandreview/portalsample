import { render, screen } from '@testing-library/react';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MemoryRouter, Route, Routes } from 'react-router';

import { defined } from '../helpers/defined';

const mocks = vi.hoisted(() => ({
  useAccountState: vi.fn(),
  useAccountDispatch: vi.fn(),
  useModalDispatch: vi.fn(),
  setShowBranchSelector: vi.fn(),
  createAccountProps: vi.fn(),
  updateAccountProps: vi.fn(),
  addBranchProps: vi.fn(),
  createContactProps: vi.fn(),
  updateContactProps: vi.fn(),
}));

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useMsal: () => ({
        accounts: [{ homeAccountId: 'account-1' }],
        instance: { acquireTokenSilent: vi.fn() },
      }),
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  import('../../../ClientApp/src/authentication/hooks'),
  () =>
    ({
      useAccountState: mocks.useAccountState,
      useAccountDispatch: mocks.useAccountDispatch,
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock(
  import('../../../ClientApp/src/components/modals/ModalContext'),
  () =>
    ({
      useModalDispatch: mocks.useModalDispatch,
    }) satisfies __ExactMockModule<__TestMockModule27>,
);

vi.mock(
  import('../../../ClientApp/src/components/forms/WizardForm'),
  () =>
    ({
      default: ({
        children,
        locationOnCompletion,
        lastStepNextButtonTitle,
      }: {
        children: React.ReactNode;
        locationOnCompletion: string;
        lastStepNextButtonTitle: string;
      }) => (
        <section
          data-testid='wizard-form'
          data-complete-location={locationOnCompletion}
          data-last-button={lastStepNextButtonTitle}
        >
          {children}
        </section>
      ),
    }) satisfies __ExactMockModule<__TestMockModule60>,
);

vi.mock(
  import('../../../ClientApp/src/components/forms/WizardForm/WizardStep'),
  () =>
    ({
      default: ({
        children,
        title,
      }: {
        children: React.ReactNode;
        title?: string;
      }) => (
        <article data-testid='wizard-step' data-title={title}>
          {children}
        </article>
      ),
    }) satisfies __ExactMockModule<__TestMockModule24>,
);

vi.mock(
  import('../../../ClientApp/src/routes/account/accountDetails'),
  () =>
    ({
      default: () => <div>Account details fields</div>,
    }) satisfies __ExactMockModule<__TestMockModule81>,
);

vi.mock(
  import('../../../ClientApp/src/routes/account/organisationDetails'),
  () =>
    ({
      default: () => <div>Organisation details fields</div>,
    }) satisfies __ExactMockModule<__TestMockModule82>,
);

vi.mock(
  import('../../../ClientApp/src/routes/contact/contactDetails'),
  () =>
    ({
      default: () => <div>Contact details fields</div>,
    }) satisfies __ExactMockModule<__TestMockModule83>,
);

vi.mock(
  import('../../../ClientApp/src/routes/account/create/createAccountProps'),
  () =>
    ({
      default: mocks.createAccountProps,
    }) satisfies __ExactMockModule<__TestMockModule84>,
);

vi.mock(
  import('../../../ClientApp/src/routes/account/update/updateAccountProps'),
  () =>
    ({
      default: mocks.updateAccountProps,
    }) satisfies __ExactMockModule<__TestMockModule85>,
);

vi.mock(
  import('../../../ClientApp/src/routes/account/addBranch/addBranchProps'),
  () =>
    ({
      default: mocks.addBranchProps,
    }) satisfies __ExactMockModule<__TestMockModule86>,
);

vi.mock(
  import('../../../ClientApp/src/routes/contact/create/createContactProps'),
  () =>
    ({
      default: mocks.createContactProps,
    }) satisfies __ExactMockModule<__TestMockModule87>,
);

vi.mock(
  import('../../../ClientApp/src/routes/contact/update/updateContactProps'),
  () =>
    ({
      default: mocks.updateContactProps,
    }) satisfies __ExactMockModule<__TestMockModule88>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/useBodyClass'),
  () =>
    ({
      default: () => {},
    }) satisfies __ExactMockModule<__TestMockModule59>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/useHtmlTitle'),
  () =>
    ({
      default: () => {},
    }) satisfies __ExactMockModule<__TestMockModule89>,
);

const renderAt = (path: string, element: React.ReactNode, routePath: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={routePath} element={element} />
        <Route path='/not-found' element={<div data-testid='not-found' />} />
      </Routes>
    </MemoryRouter>,
  );

describe('account and contact route wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAccountState.mockReturnValue({
      details: { defaultOrganisationId: 1 },
    });
    mocks.useAccountDispatch.mockReturnValue({ setCompleted: vi.fn() });
    mocks.useModalDispatch.mockReturnValue({
      setShowBranchSelector: mocks.setShowBranchSelector,
    });
    mocks.createAccountProps.mockReturnValue({ title: 'Create account step' });
    mocks.updateAccountProps.mockReturnValue({ title: 'Update account step' });
    mocks.addBranchProps.mockReturnValue({ title: 'Add branch step' });
    mocks.createContactProps.mockReturnValue({ title: 'Create contact step' });
    mocks.updateContactProps.mockReturnValue({ title: 'Update contact step' });
  });
  it('renders create-account and add-branch workflows with merged account context', async () => {
    expect.assertions(5);
    const CreateAccount = (
      await import('../../../ClientApp/src/routes/account/create')
    ).default;
    const AddBranch = (
      await import('../../../ClientApp/src/routes/account/addBranch')
    ).default;
    const { unmount } = renderAt(
      '/account-create',
      <CreateAccount />,
      '/account-create',
    );

    expect(screen.getByTestId('wizard-form')).toHaveAttribute(
      'data-complete-location',
      '/success-creating-account',
    );
    expect(screen.getByText('Account details fields')).toBeInTheDocument();
    expect(mocks.createAccountProps).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.any(Array),
      expect.objectContaining({ details: { defaultOrganisationId: 1 } }),
    );

    unmount();

    renderAt('/account-add-branch', <AddBranch />, '/account-add-branch');

    expect(screen.getByText('Organisation details fields')).toBeInTheDocument();

    const onShowBranchSelector = defined(
      mocks.addBranchProps.mock.calls[0],
      'addBranchProps call',
    )[4] as () => void;
    onShowBranchSelector();

    expect(mocks.setShowBranchSelector).toHaveBeenCalledWith(true);
  });
});
