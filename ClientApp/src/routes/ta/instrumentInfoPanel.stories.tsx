import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { withPortalProviders } from '../../storybook/storybookHarness';
import InstrumentInfoPanel from './instrumentInfoPanel';

/**
 * `InstrumentInfoPanel` is the contextual references sidebar shown while completing a
 * type-approval application. When an instrument category is selected it surfaces
 * reference/upload guidance (and, for new customers, the credit-check form); with no
 * selection it collapses to a screen-reader-only empty notice. Real reference links are
 * fetched only for valid instrument GUIDs, so these stories exercise the static panel.
 */
const meta = {
    title: 'Routes/TypeApproval/InstrumentInfoPanel',
    component: InstrumentInfoPanel,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'padded',
        portal: {
            authenticated: true,
        },
    },
    args: {
        name: 'instrument',
        isNewCustomer: true,
    },
} satisfies Meta<typeof InstrumentInfoPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithReferences: Story = {
    args: {
        selectedInstrumentCategoryId: 'category-area-measurement',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('References for this instrument type')).toBeVisible();
        await expect(canvas.getByText('Technical specification documents')).toBeVisible();
        // New customers also see the credit-check form link.
        await expect(canvas.getByRole('link', { name: /download credit check application form/i })).toBeVisible();
    },
};

export const NoSelection: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/no references for this instrument type/i)).toBeInTheDocument();
    },
};
