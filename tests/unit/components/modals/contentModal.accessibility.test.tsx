import { render, screen } from '@testing-library/react';
import ContentModal from '@/components/modals/ContentModal';

describe('ContentModal accessibility', () => {
    it('names the dialog from the visible modal title', () => {
        render(
            <ContentModal
                showModal
                onCancelModal={vi.fn()}
                modalTitle='Accessible modal title'
                modalBody={<p>Modal body content.</p>}
            />,
        );

        const dialog = screen.getByRole('dialog', { name: 'Accessible modal title' });
        const title = screen.getByRole('heading', { name: 'Accessible modal title' });

        expect(dialog).toHaveAttribute('aria-labelledby', title.id);
    });
});
