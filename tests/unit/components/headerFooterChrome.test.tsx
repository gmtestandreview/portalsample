import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import Actions from '@/components/Actions';
import BodyText from '@/components/BodyText';
import Footer from '@/components/Footer';
import Accessibility from '@/components/Footer/accessibility';
import Privacy from '@/components/Footer/privacy';
import TermsOfUse from '@/components/Footer/termsOfUse';
import Header from '@/components/Header';
import AuthenticatedNavbarItems from '@/components/Header/AuthenticatedNavbarItems';
import NavbarEnvironment from '@/components/Header/NavbarEnvironment';
import NavbarMessage from '@/components/Header/NavbarMessage';
import HeaderIntroText from '@/components/HeaderIntroText';
import ExternalLinkIcon from '@/components/Icons/ExternalLinkIcon';
import { trackGAEvent } from '@/analytics/GoogleAnalytics';
import { useAccountState } from '@/authentication/hooks';
import { useModalDispatch } from '@/components/modals/ModalContext';
import { getEnvironment } from '@/routes/common/helperFunctions';

const msalState = vi.hoisted(() => ({
    authenticated: false,
}));

vi.mock('@azure/msal-react', () => ({
    AuthenticatedTemplate: ({ children }: { children: React.ReactNode }) => (msalState.authenticated ? children : null),
    UnauthenticatedTemplate: ({ children }: { children: React.ReactNode }) => (msalState.authenticated ? null : children),
}));

vi.mock('@/analytics/GoogleAnalytics', () => ({
    trackGAEvent: vi.fn(),
}));

vi.mock('@/authentication/hooks', () => ({
    useAccountState: vi.fn(),
}));

vi.mock('@/components/modals/ModalContext', () => ({
    useModalDispatch: vi.fn(),
}));

vi.mock('@/routes/common/helperFunctions', () => ({
    getEnvironment: vi.fn(),
}));

vi.mock('@/assets/GovCrest.svg', () => ({
    default: 'gov-crest.svg',
}));

vi.mock('@/components/modals/ContentModal', () => ({
    default: ({
        showModal,
        onCancelModal,
        modalBody,
        modalTitle,
    }: {
        showModal: boolean;
        onCancelModal: () => void;
        modalBody: React.ReactNode;
        modalTitle: string;
    }) => (showModal ? (
        <dialog open aria-label={modalTitle}>
            <h2>{modalTitle}</h2>
            <div>{modalBody}</div>
            <button type='button' onClick={onCancelModal}>Close modal</button>
        </dialog>
    ) : null),
}));

const renderWithRouter = (ui: React.ReactNode) => render(
    <MemoryRouter>
        {ui}
    </MemoryRouter>,
);

const accountState = {
    details: {
        email: 'alex.citizen@example.gov.au',
        givenName: 'Alex',
        familyName: 'Citizen',
        trading: 'Precision Labs',
        branch: 'Canberra',
        organisation: 'Measurement Pty Ltd',
        defaultOrganisationId: 'org-123',
    },
};

describe('Header chrome', () => {
    beforeEach(() => {
        msalState.authenticated = false;
        vi.mocked(getEnvironment).mockReturnValue('');
        vi.mocked(trackGAEvent).mockClear();
        vi.mocked(useAccountState).mockReturnValue(null);
        vi.mocked(useModalDispatch).mockReturnValue({
            setShowBranchSelector: vi.fn(),
            setShowRFQDeleteModal: vi.fn(),
            setShowRFQSelectModal: vi.fn(),
        });
    });

    it('renders the public header brand, feedback message, and unauthenticated exit link', () => {
        renderWithRouter(<Header />);

        expect(screen.getByRole('navigation', { name: 'Site header' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'National Measurement Institute logo' }))
            .toHaveAttribute('href', '/');
        expect(screen.getByRole('img', { name: 'National Measurement Institute logo' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /quick survey\s*Opens in a new tab/i }))
            .toHaveAttribute('href', 'https://industry.au1.qualtrics.com/jfe/form/SV_9X41DIbsi8FvCQu');
        expect(screen.getByRole('link', { name: /Exit/i }))
            .toHaveAttribute('href', 'https://measurement.gov.au');
        expect(screen.queryByTestId('user-menu-dropdown')).not.toBeInTheDocument();
    });

    it('renders authenticated user menu items and tracks account-management clicks', async () => {
        const user = userEvent.setup();
        const modalDispatch = {
            setShowBranchSelector: vi.fn(),
            setShowRFQDeleteModal: vi.fn(),
            setShowRFQSelectModal: vi.fn(),
        };
        msalState.authenticated = true;
        vi.mocked(getEnvironment).mockReturnValue('TEST');
        vi.mocked(useAccountState).mockReturnValue(accountState as unknown as ReturnType<typeof useAccountState>);
        vi.mocked(useModalDispatch).mockReturnValue(modalDispatch);

        renderWithRouter(<Header />);

        expect(screen.getByTestId('header-environment')).toHaveTextContent('Environment:TEST');
        expect(screen.getByRole('button', { name: /Current user settings menu/i })).toHaveTextContent('Alex Citizen');
        expect(screen.getByText('Precision Labs - Canberra')).toBeInTheDocument();
        expect(screen.getByText('Measurement Pty Ltd')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Current user settings menu/i }));

        expect(screen.getByRole('link', { name: 'Manage organisation' }))
            .toHaveAttribute('href', '/update-organisation/org-123');
        expect(screen.getByRole('link', { name: 'My contact details' })).toHaveAttribute('href', '/update-contact');
        expect(screen.getByRole('link', { name: 'Log out' })).toHaveAttribute('href', '/sign-out');

        await user.click(screen.getByRole('link', { name: 'Manage organisation' }));
        expect(trackGAEvent).toHaveBeenCalledWith('Manage organisation');

        await user.click(screen.getByRole('button', { name: /Current user settings menu/i }));
        await user.click(screen.getByRole('link', { name: 'Add or manage branch/location' }));

        expect(modalDispatch.setShowBranchSelector).toHaveBeenCalledWith(true);
        expect(trackGAEvent).toHaveBeenCalledWith('Manage branch/location');

        await user.click(screen.getByRole('button', { name: /Current user settings menu/i }));
        await user.click(screen.getByRole('link', { name: 'My contact details' }));
        expect(trackGAEvent).toHaveBeenCalledWith('Manage contact');

        await user.click(screen.getByRole('button', { name: /Current user settings menu/i }));
        await user.click(screen.getByRole('link', { name: 'Log out' }));
        expect(trackGAEvent).toHaveBeenCalledWith('sign out');
    });

    it('does not render authenticated menu content until account email is available', () => {
        vi.mocked(useAccountState).mockReturnValue({ details: { givenName: 'Alex' } } as ReturnType<typeof useAccountState>);

        const { container } = renderWithRouter(<AuthenticatedNavbarItems />);

        expect(container).toBeEmptyDOMElement();
    });

    it('hides the environment label when no environment marker is detected', () => {
        const { container } = render(<NavbarEnvironment />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders the feedback message as a new-tab survey link', () => {
        render(<NavbarMessage />);

        const survey = screen.getByRole('link', { name: /quick survey\s*Opens in a new tab/i });
        expect(survey).toHaveAttribute('target', '_blank');
        expect(survey).toHaveAttribute('rel', 'external noopener noreferrer');
    });
});

describe('Footer chrome', () => {
    it('renders static footer landmarks, links, and government crest', () => {
        renderWithRouter(<Footer />);

        expect(screen.getByTestId('nmi-footer')).toHaveTextContent('Commonwealth of Australia');
        expect(screen.getByRole('img', { name: 'Australian Government Coat of Arms' }))
            .toHaveAttribute('src', 'gov-crest.svg');
        expect(screen.getByRole('link', { name: 'Help guide' })).toHaveAttribute('href', '/help-guide');
    });

    it('opens each footer content modal and closes it through the modal callback', async () => {
        const user = userEvent.setup();
        renderWithRouter(<Footer />);

        await user.click(screen.getByRole('button', { name: 'Terms of use' }));
        expect(screen.getByRole('dialog', { name: 'Portal Terms of Use' })).toHaveTextContent('1. General');
        await user.click(screen.getByRole('button', { name: 'Close modal' }));
        expect(screen.queryByRole('dialog', { name: 'Portal Terms of Use' })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Privacy' }));
        expect(screen.getByRole('dialog', { name: 'Privacy collection statement' }))
            .toHaveTextContent('The Privacy Act and your personal information');
        await user.click(screen.getByRole('button', { name: 'Close modal' }));

        await user.click(screen.getByRole('button', { name: 'Accessibility' }));
        expect(screen.getByRole('dialog', { name: 'Accessibility' })).toHaveTextContent('Portable Document Format');
        await user.click(screen.getByRole('button', { name: 'Close modal' }));
        expect(screen.queryByRole('dialog', { name: 'Accessibility' })).not.toBeInTheDocument();
    });

    it('renders footer static content with key headings and external links', () => {
        const { rerender } = render(<TermsOfUse />);

        expect(screen.getByRole('heading', { name: '1. General' })).toBeInTheDocument();
        expect(screen.getByText('9 July, 2024')).toBeInTheDocument();

        rerender(<Privacy />);
        expect(screen.getByRole('heading', { name: 'Types of personal information collected' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'privacy@industry.gov.au' }))
            .toHaveAttribute('href', 'mailto:privacy@industry.gov.au');

        rerender(<Accessibility />);
        expect(screen.getByRole('heading', { name: 'JavaScript' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Web Content Accessibility Guidelines.*Opens in a new tab/i }))
            .toHaveAttribute('target', '_blank');
    });
});

describe('small static display components', () => {
    it('applies the stable display classes for intro and body text wrappers', () => {
        const { rerender } = render(<HeaderIntroText className='mb-4'>Intro copy</HeaderIntroText>);

        expect(screen.getByText('Intro copy')).toHaveClass('header-intro-text', 'mb-4');

        rerender(<BodyText className='text-muted'>Body copy</BodyText>);
        expect(screen.getByText('Body copy')).toHaveClass('body-text', 'text-muted');
    });

    it('renders the external link icon as decorative SVG with optional classes', () => {
        const { container } = render(<ExternalLinkIcon className='ms-1' />);

        const icon = container.querySelector('svg');
        expect(icon).toHaveClass('ms-1');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
        expect(icon).toHaveAttribute('focusable', 'false');
    });
});

describe('Actions callback behavior', () => {
    it('uses item-specific click handlers before falling back to the shared item handler', async () => {
        const user = userEvent.setup();
        const itemClick = vi.fn();
        const sharedClick = vi.fn();
        renderWithRouter(
            <Actions
                id='callback-actions'
                onItemClick={sharedClick}
                dropDownActions={[
                    { action: 'copy', text: 'Copy request', onClick: itemClick },
                    { action: 'archive', text: 'Archive request' },
                ]}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Actions' }));
        await user.click(screen.getByRole('button', { name: 'Copy request' }));
        await user.click(screen.getByRole('button', { name: 'Actions' }));
        await user.click(screen.getByRole('button', { name: 'Archive request' }));

        expect(itemClick).toHaveBeenCalledTimes(1);
        expect(sharedClick).toHaveBeenCalledTimes(1);
    });
});
