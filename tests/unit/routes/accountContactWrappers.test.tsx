import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';

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

vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({
        accounts: [{ homeAccountId: 'account-1' }],
        instance: { acquireTokenSilent: vi.fn() },
    }),
}));

vi.mock('../../../ClientApp/src/authentication/hooks', () => ({
    useAccountState: mocks.useAccountState,
    useAccountDispatch: mocks.useAccountDispatch,
}));

vi.mock('../../../ClientApp/src/components/modals/ModalContext', () => ({
    useModalDispatch: mocks.useModalDispatch,
}));

vi.mock('../../../ClientApp/src/components/forms/WizardForm', () => ({
    default: ({ children, locationOnCompletion, lastStepNextButtonTitle }: {
        children: React.ReactNode;
        locationOnCompletion: string;
        lastStepNextButtonTitle: string;
    }) => (
        <section
            data-testid="wizard-form"
            data-complete-location={locationOnCompletion}
            data-last-button={lastStepNextButtonTitle}
        >
            {children}
        </section>
    ),
}));

vi.mock('../../../ClientApp/src/components/forms/WizardForm/WizardStep', () => ({
    default: ({ children, title }: { children: React.ReactNode; title?: string }) => (
        <article data-testid="wizard-step" data-title={title}>{children}</article>
    ),
}));

vi.mock('../../../ClientApp/src/routes/account/accountDetails', () => ({
    default: () => <div>Account details fields</div>,
}));

vi.mock('../../../ClientApp/src/routes/account/organisationDetails', () => ({
    default: () => <div>Organisation details fields</div>,
}));

vi.mock('../../../ClientApp/src/routes/contact/contactDetails', () => ({
    default: () => <div>Contact details fields</div>,
}));

vi.mock('../../../ClientApp/src/routes/account/create/createAccountProps', () => ({
    default: mocks.createAccountProps,
}));

vi.mock('../../../ClientApp/src/routes/account/update/updateAccountProps', () => ({
    default: mocks.updateAccountProps,
}));

vi.mock('../../../ClientApp/src/routes/account/addBranch/addBranchProps', () => ({
    default: mocks.addBranchProps,
}));

vi.mock('../../../ClientApp/src/routes/contact/create/createContactProps', () => ({
    default: mocks.createContactProps,
}));

vi.mock('../../../ClientApp/src/routes/contact/update/updateContactProps', () => ({
    default: mocks.updateContactProps,
}));

vi.mock('../../../ClientApp/src/components/Utilities/useBodyClass', () => ({ default: () => {} }));
vi.mock('../../../ClientApp/src/components/Utilities/useHtmlTitle', () => ({ default: () => {} }));

const renderAt = (path: string, element: React.ReactNode, routePath: string) => render(
    <MemoryRouter initialEntries={[path]}>
        <Routes>
            <Route path={routePath} element={element} />
            <Route path="/not-found" element={<div data-testid="not-found" />} />
        </Routes>
    </MemoryRouter>,
);

describe('account and contact route wrappers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.useAccountState.mockReturnValue({ details: { defaultOrganisationId: 1 } });
        mocks.useAccountDispatch.mockReturnValue({ setCompleted: vi.fn() });
        mocks.useModalDispatch.mockReturnValue({ setShowBranchSelector: mocks.setShowBranchSelector });
        mocks.createAccountProps.mockReturnValue({ title: 'Create account step' });
        mocks.updateAccountProps.mockReturnValue({ title: 'Update account step' });
        mocks.addBranchProps.mockReturnValue({ title: 'Add branch step' });
        mocks.createContactProps.mockReturnValue({ title: 'Create contact step' });
        mocks.updateContactProps.mockReturnValue({ title: 'Update contact step' });
    });

    it('renders create-account and add-branch workflows with merged account context', async () => {
        const CreateAccount = (await import('../../../ClientApp/src/routes/account/create')).default;
        const AddBranch = (await import('../../../ClientApp/src/routes/account/addBranch')).default;
        const { unmount } = renderAt('/account-create', <CreateAccount />, '/account-create');

        expect(screen.getByTestId('wizard-form')).toHaveAttribute('data-complete-location', '/success-creating-account');
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
        const onShowBranchSelector = mocks.addBranchProps.mock.calls[0][4] as () => void;
        onShowBranchSelector();
        expect(mocks.setShowBranchSelector).toHaveBeenCalledWith(true);
    });

    it('renders valid update workflows and passes numeric route ids', async () => {
        const UpdateAccount = (await import('../../../ClientApp/src/routes/account/update')).default;
        const CreateContact = (await import('../../../ClientApp/src/routes/contact/create')).default;
        const UpdateContact = (await import('../../../ClientApp/src/routes/contact/update')).default;
        const { unmount } = renderAt('/account-update/42', <UpdateAccount />, '/account-update/:id');

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
        const UpdateAccount = (await import('../../../ClientApp/src/routes/account/update')).default;
        const CreateAccount = (await import('../../../ClientApp/src/routes/account/create')).default;
        const { unmount } = renderAt('/account-update/not-a-number', <UpdateAccount />, '/account-update/:id');

        expect(screen.getByTestId('not-found')).toBeInTheDocument();
        expect(mocks.updateAccountProps).not.toHaveBeenCalled();
        unmount();

        mocks.useAccountDispatch.mockReturnValue(undefined);
        renderAt('/account-create', <CreateAccount />, '/account-create');
        expect(mocks.createAccountProps).toHaveBeenCalledWith(
            expect.any(Array),
            expect.any(Object),
            expect.any(Array),
            null,
        );
    });

    it('passes null when account state is unavailable and tolerates unavailable modal dispatch', async () => {
        mocks.useAccountState.mockReturnValue(undefined);
        mocks.useModalDispatch.mockReturnValue(undefined);
        const CreateAccount = (await import('../../../ClientApp/src/routes/account/create')).default;
        const AddBranch = (await import('../../../ClientApp/src/routes/account/addBranch')).default;
        const { unmount } = renderAt('/account-create', <CreateAccount />, '/account-create');

        expect(mocks.createAccountProps).toHaveBeenCalledWith(
            expect.any(Array),
            expect.any(Object),
            expect.any(Array),
            null,
        );
        unmount();

        renderAt('/account-add-branch', <AddBranch />, '/account-add-branch');
        const onShowBranchSelector = mocks.addBranchProps.mock.calls.at(-1)?.[4] as () => void;
        expect(() => onShowBranchSelector()).not.toThrow();
        expect(mocks.setShowBranchSelector).not.toHaveBeenCalled();
    });

    it('passes null account context through update and contact wrappers', async () => {
        mocks.useAccountDispatch.mockReturnValue(undefined);
        const UpdateAccount = (await import('../../../ClientApp/src/routes/account/update')).default;
        const CreateContact = (await import('../../../ClientApp/src/routes/contact/create')).default;
        const UpdateContact = (await import('../../../ClientApp/src/routes/contact/update')).default;
        const { unmount } = renderAt('/account-update/1', <UpdateAccount />, '/account-update/:id');

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
        const CreateContact = (await import('../../../ClientApp/src/routes/contact/create')).default;
        const UpdateContact = (await import('../../../ClientApp/src/routes/contact/update')).default;
        const { unmount } = renderAt('/contact-create', <CreateContact />, '/contact-create');

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
