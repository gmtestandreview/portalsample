import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik } from 'formik';
import type { FormikConfig, FormikValues } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import type { AttachmentDto } from '@/api/web-api-client';
import AttachmentNew from '@/components/Inputs/Attachment/index-new';

/**
 * Direct tests for the attachment control.
 *
 * supportingDocuments is its only consumer and its route tests replace this component with a stub,
 * so the edge cases below - a field that is not a list, and an upload that outlives the component -
 * have no other way in.
 */

interface HarnessProps<TValues extends FormikValues> {
    readonly children: React.ReactNode;
    readonly initialValues: TValues;
    /**
     * Loosely typed on purpose. Formik types touched/errors for an array field as a per-element
     * array, but `meta.touched` for the field itself is read with getIn, so the control sees the
     * plain flag a real form sets. Threading the exact generic here would only make the harness
     * describe Formik's types rather than the control's behaviour.
     */
    readonly initialTouched?: Record<string, unknown>;
    readonly initialErrors?: Record<string, unknown>;
}

function Harness<TValues extends FormikValues>({
    children, initialValues, initialTouched, initialErrors,
}: HarnessProps<TValues>) {
    return (
        <Formik
            initialValues={initialValues}
            initialTouched={initialTouched as FormikConfig<TValues>['initialTouched']}
            initialErrors={initialErrors as FormikConfig<TValues>['initialErrors']}
            onSubmit={async () => {}}
        >
            <Form>{children}</Form>
        </Formik>
    );
}

const uploaded: AttachmentDto = {
    id: 'doc-1',
    attachmentName: 'manual.pdf',
    attachmentSize: '2048',
    attachmentCategory: '',
    documentBytes: 'JVBERi0xLjQ=',
} as AttachmentDto;

const baseProps = {
    name: 'files',
    maxFiles: 3,
    allowedTypes: '.pdf',
    maxSizeInMB: 5,
    setErrors: vi.fn(),
    onDeleteFile: vi.fn(async () => {}),
};

describe('AttachmentNew', () => {
    it('treats a field holding a single object as empty rather than throwing', () => {
        // The field is typed `AttachmentDto[] | AttachmentDto | null`, so a form is free to hand
        // over a bare object. AttachmentItemNew addresses its field as `name[index]`, which reads
        // undefined against an object - so the control normalises to a list before rendering.
        render(
            <Harness initialValues={{ files: uploaded }}>
                <AttachmentNew
                    {...baseProps}
                    onUploadFiles={vi.fn(async () => [uploaded])}
                />
            </Harness>,
        );

        expect(screen.queryByText('manual.pdf')).not.toBeInTheDocument();
        expect(screen.getByTestId('files')).toBeInTheDocument();
    });

    it('points the browse button at the validation message once the field is touched and invalid', () => {
        render(
            <Harness
                initialValues={{ files: [] as AttachmentDto[] }}
                initialTouched={{ files: true }}
                initialErrors={{ files: 'Attach at least one document' }}
            >
                <AttachmentNew
                    {...baseProps}
                    onUploadFiles={vi.fn(async () => [uploaded])}
                />
            </Harness>,
        );

        // Untouched the button describes itself with the inline help; once touched and invalid it
        // has to point at the error instead, or a screen reader announces guidance where there is
        // a blocking message.
        expect(screen.getByTestId('files')).toHaveAttribute('aria-describedby', 'files-validation-msg');
    });

    it('describes the browse button with the inline help while the field is untouched', () => {
        render(
            <Harness initialValues={{ files: [] as AttachmentDto[] }}>
                <AttachmentNew
                    {...baseProps}
                    inlineHelp='PDF only, 5MB each'
                    onUploadFiles={vi.fn(async () => [uploaded])}
                />
            </Harness>,
        );

        expect(screen.getByTestId('files')).toHaveAttribute('aria-describedby', 'help-files');
    });

    it('survives an upload that finishes after the control has gone', async () => {
        let finishUpload: (value: AttachmentDto[]) => void = () => {};
        const onUploadFiles = vi.fn(() => new Promise<AttachmentDto[]>((resolve) => {
            finishUpload = resolve;
        }));

        const { unmount } = render(
            <Harness initialValues={{ files: [] as AttachmentDto[] }}>
                <AttachmentNew {...baseProps} onUploadFiles={onUploadFiles} />
            </Harness>,
        );

        await userEvent.upload(
            screen.getByTestId('drag-upload-files'),
            new File(['pdf'], 'manual.pdf', { type: 'application/pdf' }),
        );
        await waitFor(() => expect(onUploadFiles).toHaveBeenCalledTimes(1));

        // Navigating away mid-upload detaches the ref, so the post-upload reset of the file input
        // has nothing to write to. It must not throw on the way out.
        unmount();
        await act(async () => {
            finishUpload([uploaded]);
        });

        expect(onUploadFiles).toHaveBeenCalledTimes(1);
    });

    it('survives a delete that finishes after the control has gone', async () => {
        let finishDelete: () => void = () => {};
        const onDeleteFile = vi.fn(() => new Promise<void>((resolve) => {
            finishDelete = resolve;
        }));

        const { unmount } = render(
            <Harness initialValues={{ files: [uploaded] }}>
                <AttachmentNew
                    {...baseProps}
                    onDeleteFile={onDeleteFile}
                    onUploadFiles={vi.fn(async () => [uploaded])}
                />
            </Harness>,
        );

        await userEvent.click(screen.getByTestId('cancel-button-doc-1'));
        await userEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
        await waitFor(() => expect(onDeleteFile).toHaveBeenCalledWith('doc-1'));

        // Same detached-ref path as the upload case: the delete handler clears the file input once
        // the server confirms, and by then the control may be gone.
        unmount();
        await act(async () => {
            finishDelete();
        });

        expect(onDeleteFile).toHaveBeenCalledTimes(1);
    });
});
