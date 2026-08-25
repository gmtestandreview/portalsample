import type { Meta, StoryObj } from '@storybook/react-vite';
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
};
