import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomAccordion, CustomAccordionBody } from '@/components/Accordion';
import {
    AlertError,
    AlertInfo,
    AlertSuccess,
    AlertWarning,
} from '@/components/Alert';
import NotificationMessage from '@/components/Alert/NotificationMessage';
import BlockUISpinner from '@/components/BlockUISpinner';
import Breadcrumb from '@/components/Breadcrumb';
import BackToDashboardButton from '@/components/Buttons/BackToDashboardButton';
import EditButton from '@/components/Buttons/EditButton';
import LinkButton from '@/components/Buttons/LinkButton';
import Home from '@/components/Home';
import InTextLink from '@/components/InTextLink';
import PaginationHeader from '@/components/PaginationHeader';
import Welcome from '@/components/Welcome';
import { useAccountState } from '@/authentication/hooks';
import { NotificationSeverity } from '@/storage/types';

vi.mock('@/components/get-started/get-started', () => ({
    default: () => <main>Get started content</main>,
}));

vi.mock('@/authentication/hooks', () => ({
    useAccountState: vi.fn(),
}));

const renderWithRouter = (ui: React.ReactNode) => render(
    <MemoryRouter>
        {ui}
    </MemoryRouter>,
);

describe('simple reusable runtime components', () => {
    beforeEach(() => {
        vi.mocked(useAccountState).mockReturnValue(null);
    });

    it('Home delegates to the get started entry content', () => {
        renderWithRouter(<Home />);

        expect(screen.getByRole('main')).toHaveTextContent('Get started content');
    });

    it('renders accordion header parts and custom container/body classes', () => {
        const { container } = render(
            <CustomAccordion id='quote-accordion' containerClassName='quote-wrapper'>
                <CustomAccordionBody
                    id='quote-section'
                    eventKey='0'
                    name='Quote details'
                    namePartTwo={<span>Required</span>}
                    namePartTwoClassName='text-muted'
                    namePartThree='Reference ABC-123'
                    namePartThreeClassName='reference-line'
                    className='quote-body'
                >
                    Calibration request details
                </CustomAccordionBody>
            </CustomAccordion>,
        );

        expect(container.querySelector('#quote-accordion')).toHaveClass('quote-wrapper');
        expect(screen.getByRole('button', { name: /Quote details\s*Required\s*Reference ABC-123/i })).toBeInTheDocument();
        expect(screen.getByText('Required').parentElement).toHaveClass('text-muted');
        expect(screen.getByText('Reference ABC-123')).toHaveClass('reference-line');
        expect(screen.getByText('Calibration request details').closest('.accordion-body')).toHaveClass('quote-body');
    });

    it('renders accordion content without optional header parts or wrapper classes', () => {
        const { container } = render(
            <CustomAccordion id='simple-accordion'>
                <CustomAccordionBody eventKey='0' name='Simple section'>
                    Simple content
                </CustomAccordionBody>
            </CustomAccordion>,
        );

        expect(container.querySelector('#simple-accordion')).toHaveAttribute('class', '');
        expect(screen.getByRole('button', { name: 'Simple section' })).toBeInTheDocument();
        expect(screen.getByText('Simple content')).toBeInTheDocument();
    });

    it('dismisses closeable alerts and invokes the close callback', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        render(<AlertWarning canClose onClose={onClose}>Review this warning</AlertWarning>);
        await user.click(screen.getByRole('button', { name: 'Close alert' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('resets a dismissed alert when the message changes', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<AlertInfo canClose>First message</AlertInfo>);

        await user.click(screen.getByRole('button', { name: 'Close alert' }));

        rerender(<AlertInfo canClose>Second message</AlertInfo>);
        expect(screen.getByText('Second message')).toBeInTheDocument();
    });

    it.each([
        [AlertSuccess, 'Saved', 'polite', 'alert-success'],
        [AlertInfo, 'Information', 'polite', 'alert-info'],
        [AlertWarning, 'Warning', 'polite', 'alert-warning'],
        [AlertError, 'Failed', 'assertive', 'alert-danger'],
    ])('renders the %s alert variant with live-region behavior', (Component, message, ariaLive, className) => {
        render(<Component testId='alert-message'>{message}</Component>);

        const alert = screen.getByTestId('alert-message');
        expect(alert).toHaveTextContent(message);
        expect(alert).toHaveAttribute('aria-live', ariaLive);
        expect(alert).toHaveClass(className);
    });

    it.each([
        [NotificationSeverity.Success, 'notif-success-message', 'Saved successfully', 'icon-tick'],
        [NotificationSeverity.Information, 'notif-info-message', 'For your information', 'icon-info'],
        [NotificationSeverity.Warning, 'notif-warning-message', 'Check this warning', 'icon-warning'],
        [NotificationSeverity.Error, 'notif-error-message', 'Save failed', 'icon-warning'],
        [undefined, 'notif-error-message', 'Unknown severity', 'icon-warning'],
    ])('renders notification messages for %s severity', (severity, id, message, iconClassName) => {
        const onClose = vi.fn();
        const { container } = render(
            <NotificationMessage
                severity={severity}
                message={<strong>{message}</strong>}
                canClose
                onClose={onClose}
                role='status'
                ariaLive='assertive'
            />,
        );

        const notification = screen.getByRole('status');
        expect(notification).toHaveAttribute('id', id);
        expect(notification).toHaveTextContent(message);
        expect(container.querySelector(`.${iconClassName}`)).toBeInTheDocument();
        expect(notification).toHaveAttribute('aria-live', 'assertive');
    });

    it('uses a supplied notification id instead of the default id', () => {
        const { container } = render(
            <NotificationMessage
                id='custom-notification'
                severity={NotificationSeverity.Success}
                message='Saved with a custom id'
            />,
        );

        const notification = container.querySelector('#custom-notification');
        expect(notification).toHaveTextContent('Saved with a custom id');
        expect(notification).toHaveAttribute('role', 'alert');
    });

    it('uses assertive error semantics when notification severity is missing', () => {
        render(<NotificationMessage message='Unknown failure' />);

        const notification = screen.getByRole('alert');
        expect(notification).toHaveAttribute('aria-live', 'assertive');
        expect(notification).toHaveTextContent('Unknown failure');
    });

    it('renders full-page and partial block UI spinners with different announcement priority', () => {
        const { rerender } = render(<BlockUISpinner>Loading the page</BlockUISpinner>);

        expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
        expect(screen.getByText('Loading the page')).toBeInTheDocument();

        rerender(<BlockUISpinner partial>Loading this panel</BlockUISpinner>);
        expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
        expect(screen.getByText('Loading this panel')).toBeInTheDocument();
    });

    it('renders breadcrumb links and marks the current page', () => {
        renderWithRouter(
            <Breadcrumb
                ariaLabel='Request trail'
                containerClassName='mt-3'
                breadcrumbs={[
                    { text: 'Dashboard', to: '/dashboard' },
                    { text: 'Request details' },
                ]}
            />,
        );

        const navigation = screen.getByRole('navigation', { name: 'Request trail' });
        expect(navigation).toHaveClass('mt-3');
        expect(navigation.querySelector('.custom-breadcrumb')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
        expect(screen.getByText('Request details')).toHaveAttribute('aria-current', 'page');
    });

    it('renders no breadcrumb when there are no breadcrumb items', () => {
        const { container } = renderWithRouter(<Breadcrumb breadcrumbs={[]} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('requires non-current breadcrumb items to provide a destination', () => {
        expect(() => Breadcrumb({
            breadcrumbs: [
                { text: 'Missing link' },
                { text: 'Current page' },
            ],
        })).toThrow('Breadcrumb item "Missing link" must include "to"');
    });

    it('renders a dashboard link with supplied wrapper and link classes', () => {
        const { container } = renderWithRouter(
            <BackToDashboardButton containerClassName='mt-4' className='wide-link' />,
        );

        expect(container.firstElementChild).toHaveClass('mt-4');
        expect(screen.getByRole('link', { name: /Back to dashboard/i })).toHaveAttribute('href', '/dashboard');
        expect(screen.getByTestId('back-button')).toHaveClass('wide-link');
    });

    it('navigates from EditButton when a link is supplied', async () => {
        const user = userEvent.setup();
        const LocationDisplay = () => {
            const location = useLocation();
            return <p>{location.pathname}</p>;
        };

        renderWithRouter(
            <>
                <EditButton link='/profile/edit' />
                <LocationDisplay />
            </>,
        );
        await user.click(screen.getByRole('button', { name: 'Edit this section' }));

        expect(screen.getByText('/profile/edit')).toBeInTheDocument();
    });

    it('leaves the current route unchanged when EditButton has no link', async () => {
        const user = userEvent.setup();
        const LocationDisplay = () => {
            const location = useLocation();
            return <p>{location.pathname}</p>;
        };

        renderWithRouter(
            <>
                <EditButton />
                <LocationDisplay />
            </>,
        );
        await user.click(screen.getByRole('button', { name: 'Edit this section' }));

        expect(screen.getByText('/')).toBeInTheDocument();
    });

    it('renders LinkButton as either an external anchor or an internal router link', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        const { rerender } = renderWithRouter(
            <LinkButton as='a' href='https://measurement.gov.au' target='_blank' onClick={onClick}>
                NMI website
            </LinkButton>,
        );

        const externalButtonLink = screen.getByRole('link', { name: 'NMI website' });
        expect(externalButtonLink).toHaveAttribute('href', 'https://measurement.gov.au');
        expect(externalButtonLink).toHaveAttribute('target', '_blank');
        expect(externalButtonLink).toHaveClass('btn-nmi-primary');
        await user.click(externalButtonLink);
        expect(onClick).toHaveBeenCalledTimes(1);

        rerender(
            <MemoryRouter>
                <LinkButton as='Link' to='/dashboard' variant='secondary' className='dashboard-button'>
                    Dashboard
                </LinkButton>
            </MemoryRouter>,
        );

        const internalLink = screen.getByRole('link', { name: 'Dashboard' });
        expect(internalLink).toHaveAttribute('href', '/dashboard');
        expect(internalLink).toHaveClass('btn-secondary', 'dashboard-button');
    });

    it('uses the default button variant for internal LinkButton links', () => {
        renderWithRouter(
            <LinkButton as='Link' to='/help'>
                Help
            </LinkButton>,
        );

        expect(screen.getByRole('link', { name: 'Help' })).toHaveClass('btn-nmi-primary');
    });

    it('adds external-link affordances only for links that open in a new tab', () => {
        const { rerender } = render(
            <InTextLink href='https://example.gov.au' target='_blank'>
                External resource
            </InTextLink>,
        );

        expect(screen.getByRole('link', { name: /External resource\s*Opens in a new tab/i }))
            .toHaveAttribute('rel', 'nofollow noreferrer noopener');

        rerender(<InTextLink href='/help'>Internal resource</InTextLink>);
        expect(screen.getByRole('link', { name: 'Internal resource' })).not.toHaveAttribute('rel');
        expect(screen.queryByText('Opens in a new tab')).not.toBeInTheDocument();
    });

    it('shows pagination ranges and hides the summary when there are no results', () => {
        const { rerender } = render(<PaginationHeader totalCount={25} pageSize={10} currentPage={3} />);

        expect(screen.getByText('21 - 25')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('Results')).toHaveClass('visually-hidden');

        rerender(<PaginationHeader totalCount={0} pageSize={10} currentPage={1} />);
        expect(screen.getByText(/Displaying/i)).toHaveAttribute('hidden');
    });

    it('shows a full pagination range before the final page', () => {
        render(<PaginationHeader totalCount={25} pageSize={10} currentPage={1} />);

        expect(screen.getByText('1 - 10')).toBeInTheDocument();
    });

    it('renders the welcome banner with a given name when account details are available', () => {
        vi.mocked(useAccountState).mockReturnValue({
            details: {
                givenName: 'Alex',
            },
        } as ReturnType<typeof useAccountState>);

        render(<Welcome />);

        expect(screen.getByTestId('welcome-banner')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Welcome Alex/i })).toBeInTheDocument();
    });

    it('renders the welcome banner without a name when account details are absent', () => {
        vi.mocked(useAccountState).mockReturnValue({} as ReturnType<typeof useAccountState>);

        render(<Welcome />);

        expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
    });
});
