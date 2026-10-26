import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import Actions from '@/components/Actions';

const actions = [
  { action: 'view', text: 'View details', route: '/quotation/Q-2024-000456' },
  { action: 'copy', text: 'Request recalibration' },
  { action: 'delete', text: 'Delete draft' },
];

const renderActions = (ui: React.ReactNode) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('actions accessibility', () => {
  it('opens the text action menu from a named button and exposes actions as menuitems', async () => {
    expect.hasAssertions();
    const user = userEvent.setup();
    renderActions(<Actions id='request-actions' dropDownActions={actions} />);

    const trigger = screen.getByRole('button', { name: 'Actions' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const viewDetails = screen.getByRole('menuitem', { name: 'View details' });

    expect(viewDetails).toHaveAttribute('href', '/quotation/Q-2024-000456');

    await user.keyboard('{Escape}');

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps non-navigation actions visible without links', async () => {
    expect.hasAssertions();
    const user = userEvent.setup();
    renderActions(<Actions id='request-actions' dropDownActions={actions} />);

    await user.click(screen.getByRole('button', { name: 'Actions' }));

    const recalibrationAction = screen.getByRole('menuitem', {
      name: 'Request recalibration',
    });

    expect(recalibrationAction).toBeVisible();
    expect(recalibrationAction).not.toHaveAttribute('href');
  });

  it('gives icon-only action buttons a combined accessible name', () => {
    expect.hasAssertions();
    renderActions(
      <Actions
        id='icon-actions'
        as='icon'
        buttonAriaTitle='for request RFQ-2024-001234'
        dropDownActions={actions}
      />,
    );

    expect(
      screen.getByRole('button', {
        name: 'Actions for request RFQ-2024-001234',
      }),
    ).toBeVisible();
  });
});
