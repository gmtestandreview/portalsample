import preview from '../../../../.storybook/preview';
import { within, expect } from 'storybook/test';
import SteppedNavigation from './index';

const steps = [
  {
    title: 'Organisation and contact',
    path: '/request-for-quote/123/organisation-and-contact',
    completed: true,
  },
  {
    title: 'Instrument and request',
    path: '/request-for-quote/123/instrument-and-request',
    completed: true,
  },
  {
    title: 'Review and submit',
    path: '/request-for-quote/123/summary',
    completed: false,
  },
];

const meta = preview.meta({
  title: 'Components/SteppedNavigation',
  component: SteppedNavigation,
  parameters: {
    layout: 'padded',
  },
});

export const CurrentStep = meta.story({
  args: {
    id: 'rfq-stepper',
    activeStep: 2,
    interactive: true,
    steps,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('list', { name: 'Form progress' }),
    ).toBeVisible();
    // The completion state each step announces is part of that contract.
    await expect(
      canvas.getByRole('link', { name: /Organisation and contact/ }),
    ).toBeVisible();
  },
});
