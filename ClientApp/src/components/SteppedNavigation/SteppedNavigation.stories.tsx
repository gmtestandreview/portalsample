import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import SteppedNavigation from './index';

const steps = [
    { title: 'Organisation and contact', path: '/request-for-quote/123/organisation-and-contact', completed: true },
    { title: 'Instrument and request', path: '/request-for-quote/123/instrument-and-request', completed: true },
    { title: 'Review and submit', path: '/request-for-quote/123/summary', completed: false },
];

const meta = {
    title: 'Components/SteppedNavigation',
    component: SteppedNavigation,
    parameters: {
        layout: 'padded',
    },
} satisfies Meta<typeof SteppedNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CurrentStep: Story = {
    args: {
        id: 'rfq-stepper',
        activeStep: 2,
        interactive: true,
        steps,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // The stepper carries focusable step links, so it must not be hidden from assistive
        // technology: axe reports aria-hidden-focus for an aria-hidden subtree that can be
        // tabbed into. Role queries ignore aria-hidden subtrees, so this assertion is exactly
        // the contract - it can only pass once the list is actually exposed.
        const progress = canvas.getByRole('list', { name: 'Form progress' });
        await expect(progress).toBeVisible();
        // The completion state each step announces is part of that contract.
        await expect(canvas.getByRole('link', { name: /Organisation and contact/ })).toBeVisible();
    },
};
