import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import BackToDashboardButton from '.';

const meta = {
    title: 'Components/Buttons/BackToDashboardButton',
    component: BackToDashboardButton,
    decorators: [withPortalProviders],
    tags: ['autodocs'],
} satisfies Meta<typeof BackToDashboardButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default — renders the button with no additional props.
 * Requires router context (Link) provided by withPortalProviders.
 */
export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const link = canvas.getByRole('link', { name: /back to dashboard/i });
        await expect(link).toBeInTheDocument();
        await expect(link).toHaveAttribute('href', '/dashboard');
    },
};

/**
 * CustomContainer — applies extra margin to the wrapping div via containerClassName.
 */
export const CustomContainer: Story = {
    args: {
        containerClassName: 'mt-4',
    },
};

/**
 * CustomClass — applies additional CSS classes directly to the link element.
 */
export const CustomClass: Story = {
    args: {
        className: 'fw-bold',
    },
};
