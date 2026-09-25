import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import Footer from '@/components/Footer';
import Privacy from '@/components/Footer/privacy';
import TermsOfUse from '@/components/Footer/termsOfUse';

vi.mock('@/assets/GovCrest.svg', () => ({
    default: 'gov-crest.svg',
}));

describe('Footer accessibility', () => {
    it('uses real buttons for footer modal triggers', async () => {
        render(<Footer />);

        const termsTrigger = screen.getByRole('button', { name: 'Terms of use' });
        const privacyTrigger = screen.getByRole('button', { name: 'Privacy' });
        const accessibilityTrigger = screen.getByRole('button', { name: 'Accessibility' });

        expect(termsTrigger).not.toHaveAttribute('href');
        expect(privacyTrigger).not.toHaveAttribute('href');
        expect(accessibilityTrigger).not.toHaveAttribute('href');

        await userEvent.click(termsTrigger);

        expect(screen.getByRole('dialog', { name: 'Portal Terms of Use' })).toBeInTheDocument();
    });

    it.each([
        ['privacy statement', Privacy],
        ['terms of use', TermsOfUse],
    ])('uses labelled sections without adding contentinfo landmarks in the %s', (_name, Content) => {
        const { container } = render(<Content />);

        expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();

        const labelledSections = Array.from(container.querySelectorAll('section[aria-labelledby]'));
        expect(labelledSections.length).toBeGreaterThan(0);

        for (const section of labelledSections) {
            const labelId = section.getAttribute('aria-labelledby');
            expect(labelId).toBeTruthy();
            expect(container.querySelectorAll(`#${labelId}`)).toHaveLength(1);
        }
    });

    it('preserves spacing around inline formatting in the privacy statement', () => {
        const { container } = render(<Privacy />);
        const paragraphs = Array.from(container.querySelectorAll('p')).map(({ textContent }) => textContent);

        expect(paragraphs).toContain(
            'Your personal information is protected by law, including the Privacy Act 1988 '
            + '(Privacy Act) and the Australian Privacy Principles (APPs).'
        );
        expect(paragraphs).toContain(
            'To find out more about how we manage personal information and for any assistance '
            + 'with completing the template, please email our Privacy Team at privacy@industry.gov.au.'
        );
    });

    it('uses explicit JSX text boundaries around inline strong elements', () => {
        const source = readFileSync(
            path.join(process.cwd(), 'ClientApp/src/components/Footer/privacy.tsx'),
            'utf8'
        );

        expect(source).toContain("The National Measurement Institute{' ('}");
        expect(source).toContain('<strong>Date last updated:</strong>');
        expect(source).toContain("{' 9 July, 2024'}");
    });
});
