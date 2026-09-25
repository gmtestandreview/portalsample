import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { expect, within } from 'storybook/test';
import Welcome from './index';
import { AccountStateCtx } from '../../authentication/accountContext';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = {
    title: 'Components/Welcome',
    component: Welcome,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof Welcome>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default: Taylor Nguyen — given name renders after "Welcome"
export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const banner = canvas.getByTestId('welcome-banner');
        await expect(banner).toBeVisible();
        // Given name is inside the h1 "Welcome Taylor" — use heading role + regex
        const heading = canvas.getByRole('heading', { name: /welcome/i });
        await expect(heading).toBeVisible();
        await expect(heading.textContent).toMatch(/Taylor/);
    },
};

// SB-022: no given name — only "Welcome" heading renders without a name line
export const NoGivenName: Story = {
    parameters: {
        portal: {
            accountDetails: {
                givenName: undefined,
            },
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const banner = canvas.getByTestId('welcome-banner');
        await expect(banner).toBeVisible();
        // "Taylor" must NOT appear — the heading is just "Welcome"
        await expect(canvas.queryByText('Taylor')).not.toBeInTheDocument();
        // The username testid element still renders
        await expect(canvas.getByTestId('welcome-banner-username')).toBeVisible();
    },
};

// SB-022: loading state — details is null, only "Welcome" heading (no name)
const loadingContextValue = { isLoading: true, details: null };
const LoadingDecorator = (Story: ComponentType) => (
    <AccountStateCtx.Provider value={loadingContextValue}>
        <Story />
    </AccountStateCtx.Provider>
);

export const Loading: Story = {
    decorators: [LoadingDecorator],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const banner = canvas.getByTestId('welcome-banner');
        await expect(banner).toBeVisible();
        // No name renders when details is null
        await expect(canvas.queryByText('Taylor')).not.toBeInTheDocument();
    },
};
