import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { expect, userEvent, within, screen, waitFor } from 'storybook/test';
import ConfirmationModal from './ConfirmationModal';
import BranchSelectorModal from './BranchSelectorModal';
import RFQDeleteModal from './RFQDeleteModal';
import { BranchSelectionModalMode } from './BranchSelectorModal/enums';
import { withPortalProviders } from '../../storybook/storybookHarness';

const mockBranches = [
    {
        organisationId: 1,
        name: 'ACME Corporation',
        businessListName: 'ACME Sydney Office',
        businessOrTradingName: 'ACME Corporation',
        branchOrLocationName: 'Sydney Office',
        abn: '00000000001',
        crmGuid: 'guid-001',
        streetAddress: { suburb: 'Sydney', state: 'NSW', postcode: '2000', streetLine1: '1 George St' },
    },
    {
        organisationId: 2,
        name: 'ACME Corporation',
        businessListName: 'ACME Melbourne Branch',
        businessOrTradingName: 'ACME Corporation',
        branchOrLocationName: 'Melbourne Branch',
        abn: '00000000001',
        crmGuid: 'guid-002',
        streetAddress: { suburb: 'Melbourne', state: 'VIC', postcode: '3000', streetLine1: '100 Collins St' },
    },
];

const meta = {
    title: 'Modals',
    decorators: [withPortalProviders],
    parameters: {
        layout: 'centered',
    },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const jsonResponse = (body: unknown, init?: ResponseInit) => new Response(
    JSON.stringify(body),
    {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        ...init,
    },
);

const createBranchSelectorFetch = (branches = mockBranches): typeof globalThis.fetch => async (input) => {
    const url = typeof input === 'string'
        ? input
        : input instanceof URL
            ? input.toString()
            : input.url;

    if (url.includes('/api/organisations/')) {
        return jsonResponse(branches);
    }

    if (url.includes('/api/users/default-organisation')) {
        return jsonResponse({});
    }

    return new Response('Not found', { status: 404 });
};

const DeleteConfirmationDemo = () => {
    const [open, setOpen] = useState(true);
    return (
        <div>
            <Button onClick={() => setOpen(true)}>Open confirmation</Button>
            <ConfirmationModal
                isOpen={open}
                closeModal={() => setOpen(false)}
                onModalYes={() => setOpen(false)}
                onModalNo={() => setOpen(false)}
                titleText='Delete this request?'
                bodyText='Are you sure you want to delete this draft request? This action cannot be undone.'
                noButtonTitle='Cancel'
                yesButtonTitle='Yes, delete'
            />
        </div>
    );
};

const SaveAndExitDemo = () => {
    const [open, setOpen] = useState(false);
    return (
        <div>
            <Button onClick={() => setOpen(true)}>Open confirmation modal</Button>
            <ConfirmationModal
                isOpen={open}
                closeModal={() => setOpen(false)}
                onModalYes={() => setOpen(false)}
                onModalNo={() => setOpen(false)}
                titleText='Save and exit?'
                bodyText='Your changes will be saved as a draft. You can continue editing from the dashboard.'
                noButtonTitle='Continue editing'
                yesButtonTitle='Save and exit'
            />
        </div>
    );
};

export const ConfirmationOpen: Story = {
    render: () => <DeleteConfirmationDemo />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Modal renders via React Bootstrap portal into document.body — use screen
        const dialog = await screen.findByRole('dialog', { name: /delete this request\?/i });
        await expect(dialog).toBeVisible();
        await expect(within(dialog).getByRole('button', { name: /yes, delete/i })).toBeInTheDocument();
        await expect(within(dialog).getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
        // Button is still in the canvas
        await expect(canvas.getByRole('button', { name: 'Open confirmation' })).toBeInTheDocument();
        // SB-018: clicking No closes the modal
        await userEvent.click(within(dialog).getByRole('button', { name: /^cancel$/i }));
        await waitFor(() => expect(screen.queryByRole('dialog', { name: /delete this request\?/i })).not.toBeInTheDocument());
    },
};

export const ConfirmationClosed: Story = {
    render: () => <SaveAndExitDemo />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const openButton = await canvas.findByRole('button', { name: 'Open confirmation modal' });
        await userEvent.click(openButton);
        // Modal renders via React Bootstrap portal into document.body — use screen
        const dialog = await screen.findByRole('dialog', { name: /save and exit\?/i });
        await expect(dialog).toBeVisible();
        await expect(within(dialog).getByText(/saved as a draft/i)).toBeVisible();
        await expect(within(dialog).getByRole('button', { name: /save and exit/i })).toBeInTheDocument();
        await expect(within(dialog).getByRole('button', { name: /continue editing/i })).toBeInTheDocument();
    },
};

const mockAccountDetails = {
    organisation: 'ACME Corporation',
    trading: 'ACME Corporation',
    branch: 'Sydney Office',
    homeAccountId: 'mock-id',
    abn: '00000000001',
    userAcceptedTermsOfUse: true,
    accountCreationCompleted: true,
    accountContactCompleted: true,
    currentTermsVersion: '1',
    defaultOrganisationId: 1,
    organisationCRMGuid: 'guid-001',
    organisationIsCompleted: true,
    isDefaultOrganisation: true,
};

export const BranchSelectorSelectAndEdit: Story = {
    parameters: {
        portal: {
            accountDetails: mockAccountDetails,
            fetch: createBranchSelectorFetch(),
            modalState: {
                showBranchSelector: true,
                showRFQDeleteModal: false,
                branchSelectionModalMode: BranchSelectionModalMode.SelectAndEditOrg,
            },
        },
    },
    render: () => <BranchSelectorModal />,
    play: async () => {
        const dialog = await screen.findByRole('dialog', { name: /manage your branch or location/i });
        await expect(dialog).toBeVisible();
        await expect(within(dialog).getByText(/branches or locations are available/i)).toBeVisible();

        const selectedBranch = await within(dialog).findByRole('radio', { name: /acme sydney office/i });
        const alternateBranch = await within(dialog).findByRole('radio', { name: /acme melbourne branch/i });

        await expect(selectedBranch).toBeChecked();
        await expect(alternateBranch).not.toBeChecked();
        await expect(within(dialog).getByRole('link', { name: /add branch or location/i })).toBeVisible();

        const editLinks = within(dialog).getAllByRole('link', { name: /edit details for this branch\/location/i });
        await expect(editLinks).toHaveLength(2);

        await userEvent.click(alternateBranch);
        await waitFor(() => {
            expect(alternateBranch).toBeChecked();
            expect(selectedBranch).not.toBeChecked();
        });
    },
};

export const BranchSelectorRFQMode: Story = {
    parameters: {
        portal: {
            accountDetails: mockAccountDetails,
            fetch: createBranchSelectorFetch(),
            modalState: {
                showBranchSelector: true,
                showRFQDeleteModal: false,
                branchSelectionModalMode: BranchSelectionModalMode.RFQSelectOrg,
                rfqId: 'RFQ-2024-001234',
            },
        },
    },
    render: () => <BranchSelectorModal />,
    play: async () => {
        const dialog = await screen.findByRole('dialog', { name: /change branch\/location/i });
        await expect(dialog).toBeVisible();
        await expect(within(dialog).getByText(/select default branch or location name to manage/i)).toBeVisible();

        const selectedBranch = await within(dialog).findByRole('radio', { name: /acme sydney office/i });
        const alternateBranch = await within(dialog).findByRole('radio', { name: /acme melbourne branch/i });

        await expect(selectedBranch).toBeChecked();
        await expect(within(dialog).queryByRole('link', { name: /add branch or location/i })).not.toBeInTheDocument();
        await expect(within(dialog).queryByRole('link', { name: /edit details for this branch\/location/i })).not.toBeInTheDocument();

        await userEvent.click(alternateBranch);
        await waitFor(() => {
            expect(alternateBranch).toBeChecked();
            expect(selectedBranch).not.toBeChecked();
        });
    },
};

export const RFQDeleteConfirmation: Story = {
    parameters: {
        portal: {
            accountDetails: mockAccountDetails,
            modalState: {
                showBranchSelector: false,
                showRFQDeleteModal: true,
                rfqId: 'RFQ-2024-001234',
            },
        },
    },
    render: () => <RFQDeleteModal />,
    play: async () => {
        // RFQDeleteModal renders via React Bootstrap portal into document.body — use screen
        const dialog = await screen.findByRole('dialog', { name: /confirm deletion/i });
        await expect(dialog).toBeVisible();
        await expect(within(dialog).getByText(/RFQ-2024-001234/)).toBeInTheDocument();
        await expect(within(dialog).getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
        await expect(within(dialog).getByRole('button', { name: /yes, delete/i })).toBeInTheDocument();
    },
};
