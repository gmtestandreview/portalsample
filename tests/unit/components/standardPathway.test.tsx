import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router';
import StandardPathway from '../../../ClientApp/src/components/tiles/StandardPathway';

describe('StandardPathway external links', () => {
    it('uses explicit noopener noreferrer on new-tab external links', () => {
        render(
            <StandardPathway
                type='external'
                title='Give us your feedback'
                linkDescription=' '
                bodyText='Feedback survey'
                linkHref='https://industry.au1.qualtrics.com/jfe/form/SV_9X41DIbsi8FvCQu'
                target='_blank'
            />,
        );

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
        expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
        expect(link).toHaveAccessibleName(/opens in a new tab/i);
    });

    it('renders same-tab external links without new-tab copy or rel', () => {
        render(
            <StandardPathway
                type='external'
                title='Read the guide'
                linkDescription='Open guide'
                linkHref='https://example.test/guide'
                target='_self'
            />,
        );

        const link = screen.getByRole('link', { name: /read the guide open guide/i });
        expect(link).toHaveAttribute('href', 'https://example.test/guide');
        expect(link).not.toHaveAttribute('rel');
        expect(screen.queryByText(/opens in a new tab/i)).not.toBeInTheDocument();
    });

    it('uses the digital identity footer when requested', () => {
        render(
            <StandardPathway
                type='external'
                title='Digital ID'
                bodyText='Continue with your Digital ID.'
                linkDescription='Continue'
                linkHref='https://example.test/digital-id'
                target='_self'
                digitalIdentity
            />,
        );

        expect(screen.getByText('Continue with your Digital ID.')).toBeInTheDocument();
        expect(screen.getByAltText('Australian Government Coat of Arms')).toBeInTheDocument();
    });

    it('renders the standard footer icon as decorative markup without a presentation role', () => {
        const { container } = render(
            <StandardPathway
                type='external'
                title='Read the guide'
                linkDescription='Open guide'
                linkHref='https://example.test/guide'
                target='_self'
            />,
        );

        const footerIcon = container.querySelector('.standard-pathway-footer i');
        expect(footerIcon).not.toBeNull();
        expect(footerIcon).toHaveAttribute('aria-hidden', 'true');
        expect(footerIcon).not.toHaveAttribute('role');
    });

    it('renders internal pathway links through React Router', () => {
        render(
            <MemoryRouter>
                <StandardPathway
                    type='internal'
                    title='Start a request'
                    linkDescription='Start now'
                    to='/request'
                />
            </MemoryRouter>,
        );

        const link = screen.getByRole('link', { name: /start a request start now/i });
        expect(link).toHaveAttribute('href', '/request');
        expect(link).toHaveAttribute('data-pii', 'login');
    });
});
