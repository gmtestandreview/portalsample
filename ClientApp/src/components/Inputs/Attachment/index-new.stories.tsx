import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, fn } from 'storybook/test';
import type { AttachmentDto } from '../../../api/web-api-client';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import AttachmentNew from './index-new';

/**
 * `AttachmentNew` is the migration ("-new") variant of the multi-file upload control.
 * It renders a drop/browse target, enforces allowed types / size / max-file rules, and
 * lists uploaded documents as `AttachmentItemNew` rows. It is bound to a Formik array
 * field (`name`), so the stories provide a Formik context. The default story shows the
 * empty upload affordance.
 */
const uploadResult: AttachmentDto[] = [
    {
        id: 'doc-1',
        attachmentName: 'uploaded.pdf',
        attachmentSize: '12345',
        attachmentCategory: 'Certificate',
    },
];

const meta = {
    title: 'Components/Inputs/Attachment/AttachmentNew',
    component: AttachmentNew,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'padded',
        portal: {
            formik: {
                initialValues: { documents: [] },
            },
        },
    },
    args: {
        id: 'documents',
        name: 'documents',
        label: 'Drag and drop files here',
        ariaLabel: 'Upload supporting documents',
        buttonTitle: 'Browse files',
        allowMultiple: true,
        maxFiles: 5,
        allowedTypes: '.pdf,.jpg,.png',
        maxSizeInMB: 10,
        inlineHelp: 'Accepted formats: PDF, JPG, PNG.',
        setErrors: fn(),
        onUploadFiles: fn(async () => uploadResult),
        onDeleteFile: fn(async () => {}),
    },
} satisfies Meta<typeof AttachmentNew>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyUploader: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Drag and drop files here')).toBeVisible();
        // The browse control and the file input are both present.
        await expect(canvas.getByTestId('documents')).toBeVisible();
        await expect(canvas.getByTestId('drag-upload-documents')).toBeInTheDocument();
        await expect(canvas.getByText(/maximum size for each file/i)).toBeVisible();
    },
};

export const DocumentsWithoutIds: Story = {
    args: { isSummary: true },
    parameters: {
        portal: {
            formik: {
                initialValues: {
                    documents: [
                        { attachmentName: 'manual.pdf', attachmentSize: '1024', attachmentCategory: 'Manuals' },
                        { attachmentName: 'certificate.pdf', attachmentSize: '2048', attachmentCategory: 'Certificate' },
                    ],
                },
            },
        },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('manual.pdf')).toBeVisible();
        await expect(canvas.getByText('certificate.pdf')).toBeVisible();
    },
};
