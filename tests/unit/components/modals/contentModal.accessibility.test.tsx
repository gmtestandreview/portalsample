import { render, screen } from '@testing-library/react';
import ContentModal from '@/components/modals/ContentModal';

/**
 * `ContentModal` hardcodes `id='modal-content'` on its title and points every
 * instance's `aria-labelledby` at that same literal. A single open modal
 * resolves it to its own title, which is why the nominal case below passes and
 * why the defect stayed invisible.
 *
 * `Footer` mounts three instances. Whenever two have DOM at once - two flags
 * set, or one closing while the next opens - the id collides, every dialog
 * resolves its name to whichever `#modal-content` is first in document order,
 * and two of the three modals report the wrong accessible name.
 *
 * Task C6 Step 2 acceptance:
 *   duplicate active modal label IDs = 0
 *   matching active dialog for expected accessible name = 1
 */

const TERMS = 'Portal Terms of Use';
const PRIVACY = 'Privacy collection statement';

const renderTwoOpenModals = () => render(
    <>
        <ContentModal
            showModal
            onCancelModal={vi.fn()}
            modalTitle={TERMS}
            modalBody={<p>Terms body content.</p>}
        />
        <ContentModal
            showModal
            onCancelModal={vi.fn()}
            modalTitle={PRIVACY}
            modalBody={<p>Privacy body content.</p>}
        />
    </>,
);

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

    it('gives each instance a distinct title id', () => {
        renderTwoOpenModals();

        const termsTitle = screen.getByRole('heading', { name: TERMS });
        const privacyTitle = screen.getByRole('heading', { name: PRIVACY });

        expect(privacyTitle.id).not.toBe(termsTitle.id);
    });

    it('leaves no duplicate label id across concurrently open dialogs', () => {
        renderTwoOpenModals();

        const labelIds = screen
            .getAllByRole('dialog')
            .map((dialog) => dialog.getAttribute('aria-labelledby'));

        expect(new Set(labelIds).size).toBe(labelIds.length);
    });

    it('names each concurrently open dialog from its own title', () => {
        renderTwoOpenModals();

        expect(screen.getByRole('dialog', { name: TERMS })).toBeInTheDocument();
        expect(screen.getByRole('dialog', { name: PRIVACY })).toBeInTheDocument();
    });
});
