import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik, useFormikContext } from 'formik';
import type { FormikConfig, FormikValues } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import type { AttachmentDto } from '@/api/web-api-client';
import AttachmentItemNew from '@/components/Inputs/Attachment/AttachmentItem-new';

interface FormikHarnessProps<TValues extends FormikValues> {
    readonly children: React.ReactNode;
    readonly initialValues: TValues;
    readonly initialTouched?: FormikConfig<TValues>['initialTouched'];
    readonly onSubmit?: FormikConfig<TValues>['onSubmit'];
}

const attachment = {
    id: 'doc-1',
    attachmentName: 'manual.pdf',
    attachmentSize: '2048',
    attachmentCategory: '',
    documentBytes: 'JVBERi0xLjQ=',
} satisfies AttachmentDto;

function FormikHarness<TValues extends FormikValues>({
    children,
    initialValues,
    initialTouched,
    onSubmit = async () => {},
}: FormikHarnessProps<TValues>) {
    return (
        <Formik
            initialValues={initialValues}
            initialTouched={initialTouched}
            onSubmit={onSubmit}
        >
            <Form>{children}</Form>
        </Formik>
    );
}

function ValuesProbe() {
    const { values, touched } = useFormikContext<Record<string, unknown>>();
    return (
        <>
            <pre data-testid='values'>{JSON.stringify(values)}</pre>
            <pre data-testid='touched'>{JSON.stringify(touched)}</pre>
        </>
    );
}

const renderItem = (
    props: Partial<React.ComponentProps<typeof AttachmentItemNew>> = {},
    initialTouched?: FormikConfig<{ attachments: AttachmentDto[] }>['initialTouched'],
    initialAttachment: AttachmentDto = attachment,
) => render(
    <FormikHarness
        initialValues={{ attachments: [initialAttachment] }}
        initialTouched={initialTouched}
    >
        <AttachmentItemNew
            name='attachments'
            index={0}
            canRemove
            cancelButtonId='cancel-button-doc-1'
            isSummary={false}
            id='doc-1'
            fileBytes={initialAttachment.documentBytes}
            {...props}
        />
        <ValuesProbe />
    </FormikHarness>,
);

describe('AttachmentItemNew', () => {
    it('renders the file link, file size, category options, and validation message', () => {
        renderItem({}, { attachments: [{ attachmentCategory: true }] });

        const fileLink = screen.getByRole('link', { name: 'manual.pdf' });
        expect(fileLink).toHaveAttribute('download', 'manual.pdf');
        expect(fileLink.getAttribute('href')).toMatch(/^blob:/);
        expect(screen.getByText('2 kb')).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: 'Category' })).toHaveClass('is-invalid');
        expect(screen.getByText('Select a category that best describes this document.')).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Photos or diagrams' })).toHaveValue('Photos or diagrams');
    });

    it('updates the category field and calls the persisted-category callback when a document id is present', async () => {
        const user = userEvent.setup();
        const onCategoryUpdate = vi.fn().mockResolvedValue(undefined);
        renderItem({ onCategoryUpdate });

        await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'Certificate');

        expect(onCategoryUpdate).toHaveBeenCalledWith('doc-1', 'Certificate');
        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"attachmentCategory":"Certificate"'));
        await waitFor(() => expect(screen.getByTestId('touched')).toHaveTextContent('"attachmentCategory":true'));
    });

    it('updates the category locally when no persisted document id is available', async () => {
        const user = userEvent.setup();
        const onCategoryUpdate = vi.fn().mockResolvedValue(undefined);
        renderItem({ id: undefined, onCategoryUpdate }, undefined, {
            ...attachment,
            attachmentSize: undefined,
        });

        await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'Manuals');

        expect(onCategoryUpdate).not.toHaveBeenCalled();
        expect(screen.queryByText('2 kb')).not.toBeInTheDocument();
        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"attachmentCategory":"Manuals"'));
    });

    it('does not render removal controls in summary mode and tolerates missing file bytes', () => {
        renderItem({
            canRemove: false,
            fileBytes: undefined,
            isSummary: true,
        });

        expect(screen.getByText('manual.pdf').closest('a')).not.toHaveAttribute('href');
        expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
        expect(screen.getByText('manual.pdf').closest('.attachment')).toHaveClass('p-1');
    });

    it('opens and closes the delete confirmation without removing the file', async () => {
        const user = userEvent.setup();
        const onRemoveItem = vi.fn();
        renderItem({ onRemoveItem });

        await user.click(screen.getByRole('button', { name: 'Delete' }));
        expect(screen.getByRole('heading', { name: 'Confirm deletion' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onRemoveItem).not.toHaveBeenCalled();
        await waitFor(() => expect(screen.queryByRole('heading', { name: 'Confirm deletion' })).not.toBeInTheDocument());
    });

    it('confirms deletion with the current attachment value', async () => {
        const user = userEvent.setup();
        const onRemoveItem = vi.fn().mockResolvedValue(undefined);
        renderItem({ onRemoveItem });

        await user.click(screen.getByRole('button', { name: 'Delete' }));
        await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

        expect(onRemoveItem).toHaveBeenCalledWith(attachment);
        await waitFor(() => expect(screen.queryByRole('heading', { name: 'Confirm deletion' })).not.toBeInTheDocument());
    });
});
