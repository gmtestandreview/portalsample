import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import Actions from '@/components/Actions';

const actions = [
    { action: 'view', text: 'View details', route: '/quotation/Q-2024-000456' },
    { action: 'copy', text: 'Request recalibration' },
    { action: 'delete', text: 'Delete draft' },
];

const renderActions = (ui: React.ReactNode) => render(
    <MemoryRouter>
        {ui}
    </MemoryRouter>,
);

describe('Actions accessibility', () => {
    it('opens the text action menu from a named button and exposes route actions as native links', async () => {
        const user = userEvent.setup();
        renderActions(<Actions id='request-actions' dropDownActions={actions} />);

        const trigger = screen.getByRole('button', { name: 'Actions' });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');

        await user.click(trigger);

        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        const viewDetails = screen.getByRole('link', { name: 'View details' });
        expect(viewDetails).toHaveAttribute('href', '/quotation/Q-2024-000456');
        const recalibrationAction = screen.getByRole('button', { name: 'Request recalibration' });
        expect(recalibrationAction).toBeVisible();
        expect(recalibrationAction).not.toHaveAttribute('href');

        await user.keyboard('{Escape}');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('gives icon-only action buttons a combined accessible name', () => {
        renderActions(
            <Actions
                id='icon-actions'
                as='icon'
                buttonAriaTitle='for request RFQ-2024-001234'
                dropDownActions={actions}
            />,
        );

        expect(screen.getByRole('button', { name: 'Actions for request RFQ-2024-001234' })).toBeVisible();
    });
});
