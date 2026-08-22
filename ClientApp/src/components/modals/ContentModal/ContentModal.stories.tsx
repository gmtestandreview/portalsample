import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import ContentModal from './index';
import { withPortalProviders } from '../../../storybook/storybookHarness';

const meta = {
    title: 'Components/Modals/ContentModal',
    component: ContentModal,
    decorators: [withPortalProviders],
    tags: ['autodocs'],
} satisfies Meta<typeof ContentModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const DismissibleContentModalDemo = ({
    onCancelModal,
    showModal,
    ...args
}: ComponentProps<typeof ContentModal>) => {
    const [open, setOpen] = useState(showModal);

    useEffect(() => {
        setOpen(showModal);
    }, [showModal]);

    const handleCancel = () => {
        onCancelModal();
        setOpen(false);
    };

    return (
        <ContentModal
            {...args}
            showModal={open}
            onCancelModal={handleCancel}
        />
    );
};

export const OpenWithContent: Story = {
    args: {
        showModal: true,
        onCancelModal: fn(),
        modalTitle: 'Example Modal Title',
        modalBody: <p>Modal body content for Storybook preview.</p>,
    },
    render: (args) => <DismissibleContentModalDemo {...args} />,
    play: async ({ args }) => {
        const dialog = await screen.findByRole('dialog', { name: /example modal title/i });
        await expect(dialog).toBeVisible();
        await expect(within(dialog).getByText('Modal body content for Storybook preview.')).toBeVisible();
        await userEvent.click(screen.getByTestId('close-button'));
        await expect(args.onCancelModal).toHaveBeenCalled();
        await waitFor(() => expect(screen.queryByRole('dialog', { name: /example modal title/i })).not.toBeInTheDocument());
    },
};

export const Closed: Story = {
    args: {
        showModal: false,
        onCancelModal: () => {},
        modalTitle: 'Closed Modal',
        modalBody: <p>This modal is closed.</p>,
    },
};
