import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

const mocks = vi.hoisted(() => ({
    useAccountState: vi.fn(),
}));

vi.mock('../../../ClientApp/src/authentication/hooks', () => ({
    useAccountState: mocks.useAccountState,
}));

vi.mock('../../../ClientApp/src/components/forms/FormBanner', () => ({
    default: ({ title }: { title: string }) => <div data-testid="form-banner">{title}</div>,
}));

vi.mock('../../../ClientApp/src/components/HeaderIntroText', () => ({
    default: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

vi.mock('../../../ClientApp/src/components/Utilities/useBodyClass', () => ({ default: () => {} }));
vi.mock('../../../ClientApp/src/components/Utilities/useHtmlTitle', () => ({ default: () => {} }));

describe('account created route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the account holder name and dashboard action', async () => {
        mocks.useAccountState.mockReturnValue({ details: { givenName: 'Alex' } });
        const AccountCreated = (await import('../../../ClientApp/src/routes/account/created')).default;

        render(<MemoryRouter><AccountCreated /></MemoryRouter>);

        expect(screen.getByTestId('form-banner')).toHaveTextContent('Create portal account');
        expect(screen.getByRole('heading', { name: 'Your portal account is ready, Alex' })).toBeInTheDocument();
        expect(screen.getByTestId('go-to-dashboard-button')).toHaveAttribute('href', '/dashboard');
    });

    it('renders without a name when account details are unavailable', async () => {
        mocks.useAccountState.mockReturnValue(undefined);
        const AccountCreated = (await import('../../../ClientApp/src/routes/account/created')).default;

        render(<MemoryRouter><AccountCreated /></MemoryRouter>);

        expect(screen.getByRole('heading', { name: 'Your portal account is ready,' })).toBeInTheDocument();
    });
});
