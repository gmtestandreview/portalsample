import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import Footer from './index';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = {
    title: 'Components/Footer',
    component: Footer,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

// SB-023: Footer Default — landmark and link a11y assertions
export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Footer renders a contentinfo (footer) landmark
        const footer = canvasElement.querySelector('footer') ?? canvasElement.querySelector('[role="contentinfo"]');
        await expect(footer).toBeTruthy();
        // All footer trigger buttons are accessible — they have visible text or aria-label
        const footerBtns = canvas.getAllByRole('button');
        for (const btn of footerBtns) {
            const label = btn.getAttribute('aria-label') ?? btn.textContent?.trim();
            await expect(label).toBeTruthy();
        }
    },
};

export const TermsModalOpen: Story = {
    play: async () => {
        const user = userEvent.setup();
        const triggerBtn = screen.getByTestId('open-termsofuse-button');
        await user.click(triggerBtn);
        const modalTitle = await screen.findByRole('heading', { name: /portal terms of use/i });
        await waitFor(() => expect(modalTitle).toBeVisible());
        await user.click(screen.getByTestId('close-button'));
        await waitFor(() =>
            expect(screen.queryByRole('heading', { name: /portal terms of use/i })).not.toBeInTheDocument()
        );
    },
};

export const PrivacyModalOpen: Story = {
    play: async () => {
        const user = userEvent.setup();
        await user.click(screen.getByTestId('open-privacy-button'));
        const modalTitle = await screen.findByRole('heading', { name: /privacy collection statement/i });
        await waitFor(() => expect(modalTitle).toBeVisible());
        await user.click(screen.getByTestId('close-button'));
        await waitFor(() =>
            expect(screen.queryByRole('heading', { name: /privacy collection statement/i })).not.toBeInTheDocument()
        );
    },
};

export const AccessibilityModalOpen: Story = {
    play: async () => {
        const user = userEvent.setup();
        await user.click(screen.getByTestId('open-accessibility-button'));
        const modalTitle = await screen.findByRole('heading', { name: /accessibility/i });
        await waitFor(() => expect(modalTitle).toBeVisible());
        await user.click(screen.getByTestId('close-button'));
        await waitFor(() =>
            expect(screen.queryByRole('heading', { name: /accessibility/i })).not.toBeInTheDocument()
        );
    },
};
