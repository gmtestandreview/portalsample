import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { defined } from '../helpers/defined';
import type * as AccountHooksModule from '../../../ClientApp/src/authentication/hooks';
import type * as ModalContextModule from '../../../ClientApp/src/components/modals/ModalContext';
import type * as AddBranchPropsModule from '../../../ClientApp/src/routes/account/addBranch/addBranchProps';
import type * as CreateAccountPropsModule from '../../../ClientApp/src/routes/account/create/createAccountProps';
import type * as UpdateAccountPropsModule from '../../../ClientApp/src/routes/account/update/updateAccountProps';
import type * as CreateContactPropsModule from '../../../ClientApp/src/routes/contact/create/createContactProps';
import type * as UpdateContactPropsModule from '../../../ClientApp/src/routes/contact/update/updateContactProps';

const mocks = vi.hoisted(() => ({
  useAccountState: vi.fn<typeof AccountHooksModule.useAccountState>(),
  useAccountDispatch: vi.fn<typeof AccountHooksModule.useAccountDispatch>(),
  useModalDispatch: vi.fn<typeof ModalContextModule.useModalDispatch>(),
  setShowBranchSelector: vi.fn<(...args: unknown[]) => unknown>(),
  createAccountProps: vi.fn<typeof CreateAccountPropsModule.default>(),
  updateAccountProps: vi.fn<typeof UpdateAccountPropsModule.default>(),
  addBranchProps: vi.fn<typeof AddBranchPropsModule.default>(),
  createContactProps: vi.fn<typeof CreateContactPropsModule.default>(),
  updateContactProps: vi.fn<typeof UpdateContactPropsModule.default>(),
}));

// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock(
  '@azure/msal-react',
  () =>
    ({
      useMsal: () => ({
        accounts: [{ homeAccountId: 'account-1' }],
        instance: {
          acquireTokenSilent: vi.fn<(...args: unknown[]) => unknown>(),
        },
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

// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock(
  '../../../ClientApp/src/components/forms/WizardForm',
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

// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock(
  '../../../ClientApp/src/components/forms/WizardForm/WizardStep',
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

const resetAccountContactWrapperMocks = () => {
  vi.clearAllMocks();
  mocks.useAccountState.mockReturnValue({
    details: { defaultOrganisationId: 1 },
  } as unknown as ReturnType<typeof AccountHooksModule.useAccountState>);
  mocks.useAccountDispatch.mockReturnValue({
    setCompleted: vi.fn<(...args: unknown[]) => unknown>(),
  } as unknown as ReturnType<typeof AccountHooksModule.useAccountDispatch>);
  mocks.useModalDispatch.mockReturnValue({
    setShowBranchSelector: mocks.setShowBranchSelector,
  } as unknown as ReturnType<typeof ModalContextModule.useModalDispatch>);
  mocks.createAccountProps.mockReturnValue({
    title: 'Create account step',
  } as unknown as ReturnType<typeof CreateAccountPropsModule.default>);
  mocks.updateAccountProps.mockReturnValue({
    title: 'Update account step',
  } as unknown as ReturnType<typeof UpdateAccountPropsModule.default>);
  mocks.addBranchProps.mockReturnValue({
    title: 'Add branch step',
  } as unknown as ReturnType<typeof AddBranchPropsModule.default>);
  mocks.createContactProps.mockReturnValue({
    title: 'Create contact step',
  } as unknown as ReturnType<typeof CreateContactPropsModule.default>);
  mocks.updateContactProps.mockReturnValue({
    title: 'Update contact step',
  } as unknown as ReturnType<typeof UpdateContactPropsModule.default>);
};

describe('account and contact route wrappers', () => {
  it('renders create-account and add-branch workflows with merged account context', async () => {
    expect.hasAssertions();

    resetAccountContactWrapperMocks();

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
    )[4];
    onShowBranchSelector();

    expect(mocks.setShowBranchSelector).toHaveBeenCalledWith(true);
  });

  it('renders valid update workflows and passes numeric route ids', async () => {
    expect.hasAssertions();

    resetAccountContactWrapperMocks();

    const UpdateAccount = (
      await import('../../../ClientApp/src/routes/account/update')
    ).default;
    const CreateContact = (
      await import('../../../ClientApp/src/routes/contact/create')
    ).default;
    const UpdateContact = (
      await import('../../../ClientApp/src/routes/contact/update')
    ).default;
    const { unmount } = renderAt(
      '/account-update/42',
      <UpdateAccount />,
      '/account-update/:id',
    );

    expect(mocks.updateAccountProps).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.any(Array),
      expect.any(Object),
      42,
    );

    unmount();

    renderAt('/contact-create/7', <CreateContact />, '/contact-create/:id');

    expect(mocks.createContactProps).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.any(Array),
      expect.any(Object),
      7,
    );

    unmount();

    renderAt('/contact-update/8', <UpdateContact />, '/contact-update/:id');

    expect(mocks.updateContactProps).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.any(Array),
      expect.any(Object),
      8,
    );
  });

  it('redirects invalid account ids and supports unavailable account contexts', async () => {
    expect.hasAssertions();

    resetAccountContactWrapperMocks();

    const UpdateAccount = (
      await import('../../../ClientApp/src/routes/account/update')
    ).default;
    const CreateAccount = (
      await import('../../../ClientApp/src/routes/account/create')
    ).default;
    const { unmount } = renderAt(
      '/account-update/not-a-number',
      <UpdateAccount />,
      '/account-update/:id',
    );

    expect(screen.getByTestId('not-found')).toBeInTheDocument();
    expect(mocks.updateAccountProps).not.toHaveBeenCalled();

    unmount();

    mocks.useAccountDispatch.mockReturnValue(
      undefined as unknown as ReturnType<
        typeof AccountHooksModule.useAccountDispatch
      >,
    );
    renderAt('/account-create', <CreateAccount />, '/account-create');

    expect(mocks.createAccountProps).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.any(Array),
      null,
    );
  });

  it('passes null when account state is unavailable and tolerates unavailable modal dispatch', async () => {
    expect.hasAssertions();

    resetAccountContactWrapperMocks();

    mocks.useAccountState.mockReturnValue(
      undefined as unknown as ReturnType<
        typeof AccountHooksModule.useAccountState
      >,
    );
    mocks.useModalDispatch.mockReturnValue(
      undefined as unknown as ReturnType<
        typeof ModalContextModule.useModalDispatch
      >,
    );
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

    expect(mocks.createAccountProps).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.any(Array),
      null,
    );

    unmount();

    renderAt('/account-add-branch', <AddBranch />, '/account-add-branch');
    const onShowBranchSelector = mocks.addBranchProps.mock.calls.at(
      -1,
    )?.[4] as () => void;

    expect(() => onShowBranchSelector()).not.toThrow();
    expect(mocks.setShowBranchSelector).not.toHaveBeenCalled();
  });

  it('passes null account context through update and contact wrappers', async () => {
    expect.hasAssertions();

    resetAccountContactWrapperMocks();

    mocks.useAccountDispatch.mockReturnValue(
      undefined as unknown as ReturnType<
        typeof AccountHooksModule.useAccountDispatch
      >,
    );
    const UpdateAccount = (
      await import('../../../ClientApp/src/routes/account/update')
    ).default;
    const CreateContact = (
      await import('../../../ClientApp/src/routes/contact/create')
    ).default;
    const UpdateContact = (
      await import('../../../ClientApp/src/routes/contact/update')
    ).default;
    const { unmount } = renderAt(
      '/account-update/1',
      <UpdateAccount />,
      '/account-update/:id',
    );

    expect(mocks.updateAccountProps).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.any(Array),
      null,
      1,
    );

    unmount();

    renderAt('/contact-create/2', <CreateContact />, '/contact-create/:id');

    expect(mocks.createContactProps).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.any(Array),
      null,
      2,
    );

    unmount();

    renderAt('/contact-update/3', <UpdateContact />, '/contact-update/:id');

    expect(mocks.updateContactProps).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.any(Array),
      null,
      3,
    );
  });

  it('uses zero when contact route ids are omitted', async () => {
    expect.hasAssertions();

    resetAccountContactWrapperMocks();

    const CreateContact = (
      await import('../../../ClientApp/src/routes/contact/create')
    ).default;
    const UpdateContact = (
      await import('../../../ClientApp/src/routes/contact/update')
    ).default;
    const { unmount } = renderAt(
      '/contact-create',
      <CreateContact />,
      '/contact-create',
    );

    expect(mocks.createContactProps).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.any(Array),
      expect.any(Object),
      0,
    );

    unmount();

    renderAt('/contact-update', <UpdateContact />, '/contact-update');

    expect(mocks.updateContactProps).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.any(Array),
      expect.any(Object),
      0,
    );
  });
});
