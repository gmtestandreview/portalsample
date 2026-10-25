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
    expect.assertions(1);
    const user = userEvent.setup();
    renderActions(<Actions id='request-actions' dropDownActions={actions} />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('actions accessibility', () => {
  it('opens the text action menu from a named button and exposes actions as menuitems', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    renderActions(<Actions id='request-actions' dropDownActions={actions} />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('actions accessibility', () => {
  it('opens the text action menu from a named button and exposes actions as menuitems', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    renderActions(<Actions id='request-actions' dropDownActions={actions} />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.click(trigger);
    const viewDetails = screen.getByRole('menuitem', { name: 'View details' });
    expect(viewDetails).toHaveAttribute('href', '/quotation/Q-2024-000456');
  });
});

describe('actions accessibility', () => {
  it('opens the text action menu from a named button and exposes actions as menuitems', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    renderActions(<Actions id='request-actions' dropDownActions={actions} />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.click(trigger);
    const viewDetails = screen.getByRole('menuitem', { name: 'View details' });
    const recalibrationAction = screen.getByRole('menuitem', {
      name: 'Request recalibration',
    });
    expect(recalibrationAction).toBeVisible();
  });
});

describe('actions accessibility', () => {
  it('opens the text action menu from a named button and exposes actions as menuitems', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    renderActions(<Actions id='request-actions' dropDownActions={actions} />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.click(trigger);
    const viewDetails = screen.getByRole('menuitem', { name: 'View details' });
    const recalibrationAction = screen.getByRole('menuitem', {
      name: 'Request recalibration',
    });
    expect(recalibrationAction).not.toHaveAttribute('href');
  });
});
