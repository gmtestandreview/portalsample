import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, fn } from 'storybook/test';
import type { PatternApprovalDashboardDetailsDto } from '../../api/web-api-client';
import { PaDashboardItemStatus } from '../../routes/common/enums';
import { DashboardTab } from '../SearchFilter/types';
import { withPortalProviders } from '../../storybook/storybookHarness';
import PaRequestItem from './paRequestItem';

/**
 * `PaRequestItem` is the dashboard card for a single pattern/type-approval (PA)
 * application. It renders the application heading, a status pill, and a contextual
 * actions menu whose entries depend on the application's status (e.g. drafts expose
 * Resume/Delete, submitted applications expose View details/Messages).
 */
const draftRequest: PatternApprovalDashboardDetailsDto = {
    referenceId: 'PA-2024-0001',
    portalReferenceId: 'P-0001',
    title: 'Non-automatic weighing instrument',
    status: PaDashboardItemStatus.PaDraft,
    statusDetail: 'Draft',
    summary: 'Pattern approval for a benchtop precision balance.',
    appliedFor: 'Class II',
    assessedAs: '',
    lastUpdated: '2024-03-28T09:00:00Z',
    unreadMessageCount: 0,
};

const submittedRequest: PatternApprovalDashboardDetailsDto = {
    ...draftRequest,
    referenceId: 'PA-2024-0002',
    portalReferenceId: 'P-0002',
    title: 'Fuel dispenser flow meter',
    status: PaDashboardItemStatus.PaSubmitted,
    statusDetail: 'Submitted',
    unreadMessageCount: 3,
};

const meta = {
    title: 'Components/RequestList/PaRequestItem',
    component: PaRequestItem,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'padded',
        portal: {
            authenticated: true,
            initialEntries: ['/dashboard-ta'],
        },
    },
    args: {
        request: draftRequest,
        tab: DashboardTab.Drafts,
        setDeleteSuccess: fn(),
    },
    tags: ['autodocs'],
} satisfies Meta<typeof PaRequestItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DraftApplication: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole('heading', { name: /non-automatic weighing instrument/i }),
        ).toBeVisible();
        // Draft status appears in the pill (and status detail) after mount.
        await expect((await canvas.findAllByText('Draft'))[0]).toBeVisible();
    },
};

export const SubmittedApplication: Story = {
    args: {
        request: submittedRequest,
        tab: DashboardTab.Requests,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole('heading', { name: /fuel dispenser flow meter/i }),
        ).toBeVisible();
        await expect((await canvas.findAllByText('Submitted'))[0]).toBeVisible();
    },
};
