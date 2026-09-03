import { act, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FormikErrors, FormikProps } from 'formik';
import { PatternApprovalRequiredValues } from '../../../../ClientApp/src/api/web-api-client';
import type * as WebApiClient from '../../../../ClientApp/src/api/web-api-client';
import { FileStatus, ValidationMessages } from '../../../../ClientApp/src/routes/ta/types';

import { msalMocks, resetMsalMock, DEFAULT_ACCESS_TOKEN } from '../../helpers/mockMsal';
import type { ClientMock, ClientMethodMocks } from '../../helpers/mockApiClient';
import { renderWithRouter } from '../../helpers/renderWithRouter';
import { FormikWrapper } from '../../helpers/formik';

const mocks = vi.hoisted(() => ({
    accountContext: vi.fn(),
    setTargetOrganisation: vi.fn(),
    setDashboardNotification: vi.fn(),
}));

const clients = vi.hoisted(() => ({
    patternApproval: undefined as unknown as ClientMock<ClientMethodMocks>,
}));

/** Captures the attachment control's props so its callbacks can be driven directly. */
const attachmentControl = vi.hoisted(() => ({
    props: undefined as unknown as {
        onUploadFiles: (files: File[]) => Promise<unknown>;
        onDeleteFile: (docId: string) => Promise<void>;
        onCategoryUpdate: (docId: string, category: string) => Promise<void>;
        setErrors: (errors: string[]) => void;
        disableUpload?: boolean;
        isSummary?: boolean;
    },
}));

vi.mock('@azure/msal-react', async () => {
    const { msalReactModuleMock } = await import('../../helpers/mockMsal');

    return msalReactModuleMock();
});

vi.mock('../../../../ClientApp/src/api/web-api-client', async (importOriginal) => {
    const { createClientMockFor, webApiClientModuleMock } = await import('../../helpers/mockApiClient');
    const original = await importOriginal<typeof WebApiClient>();

    clients.patternApproval = createClientMockFor('deleteDocument', 'updateCategory');

    return webApiClientModuleMock(original, {
        RequestForPatternApprovalClient: clients.patternApproval,
    });
});

vi.mock('../../../../ClientApp/src/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['api://ta/.default'] },
}));

vi.mock('../../../../ClientApp/src/authentication/hooks', () => ({
    default: () => mocks.accountContext(),
    useAccountDispatch: () => ({ setTargetOrganisation: mocks.setTargetOrganisation }),
}));

vi.mock('../../../../ClientApp/src/storage/notification', () => ({
    setDashboardNotification: mocks.setDashboardNotification,
}));

vi.mock('../../../../ClientApp/src/routes/ta/instrumentInfoPanel', () => ({
    default: ({ selectedInstrumentCategoryId, selectedInstrumentTypeId }: {
        selectedInstrumentCategoryId: string;
        selectedInstrumentTypeId: string;
    }) => (
        <div
            data-testid="instrument-info-panel"
            data-category={selectedInstrumentCategoryId}
            data-type={selectedInstrumentTypeId}
        />
    ),
}));

vi.mock('../../../../ClientApp/src/components/Inputs/Attachment/index-new', () => ({
    default: (props: typeof attachmentControl.props) => {
        attachmentControl.props = props;

        return (
            <div
                data-testid="attachment"
                data-disable-upload={String(props.disableUpload ?? false)}
                data-is-summary={String(props.isSummary ?? false)}
            />
        );
    },
}));

const defaultValues = {
    form: {
        documents: [] as unknown[],
        instrumentCategory: 'cat-1',
        instrumentType: 'type-1',
        patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
    },
};

type RenderOptions = {
    props?: Record<string, unknown>;
    values?: Record<string, unknown>;
};

let formik: FormikProps<Record<string, unknown>> | undefined;

const renderDocs = async ({ props = {}, values = defaultValues }: RenderOptions = {}) => {
    const SupportingDocuments = (await import('../../../../ClientApp/src/routes/ta/supportingDocuments')).default;

    const componentProps = {
        name: 'form.documents',
        isSummary: false,
        attachment: { onUploadFiles: vi.fn().mockResolvedValue([]) },
        setProgress: vi.fn(),
        uploading: false,
        handleCancelFile: vi.fn(),
        setExternalErrors: vi.fn(),
        ...props,
    };

    const result = renderWithRouter(
        <FormikWrapper
            initialValues={values}
            innerRef={(bag) => {
                formik = bag as FormikProps<Record<string, unknown>>;
            }}
        >
            <SupportingDocuments {...(componentProps as any)} />
        </FormikWrapper>,
        { path: '/ta/:id', initialPath: '/ta/APP-1' },
    );

    await act(async () => {
        await Promise.resolve();
    });

    return { ...result, componentProps };
};

const setFormikErrors = async (errors: Record<string, unknown>) => {
    await act(async () => {
        // FormikErrors describes only the well-formed shapes. The component branches defensively on
        // string, array and object errors precisely because what arrives is not always well formed,
        // so exercising those arms means handing it shapes the type does not admit. The cast is
        // confined to the test harness; it is not asserting anything about production values.
        formik?.setErrors(errors as FormikErrors<Record<string, unknown>>);
    });
};

const alertItems = () => Array.from(
    document.querySelectorAll('#form-error-summary-custom li'),
).map((li) => li.textContent);

describe('supporting documents', () => {
    beforeEach(async () => {
        await import('../../../../ClientApp/src/api/web-api-client');

        resetMsalMock();
        formik = undefined;
        mocks.accountContext.mockReset().mockReturnValue({
            details: {
                abn: '11111111111',
                organisation: 'Test Org',
                targetOrganisation: { targetOrganisationName: 'Client Org' },
            },
        });
        mocks.setTargetOrganisation.mockReset();
        mocks.setDashboardNotification.mockReset();
        attachmentControl.props = undefined as unknown as typeof attachmentControl.props;

        clients.patternApproval.setAuthToken.mockReset();
        for (const method of Object.values(clients.patternApproval.methods)) {
            method.mockReset().mockResolvedValue(undefined);
        }
    });

    describe('surfacing errors', () => {
        it('shows errors handed down from the parent', async () => {
            await renderDocs({ props: { externalErrors: ['Failed to commit documents.'] } });

            expect(alertItems()).toEqual(['Failed to commit documents.']);
        });

        it('shows a Formik field error given as a string', async () => {
            await renderDocs();

            await setFormikErrors({ form: 'The form is invalid' });

            expect(alertItems()).toEqual(['The form is invalid']);
        });

        it('shows Formik field errors given as an array of strings', async () => {
            await renderDocs();

            await setFormikErrors({ form: ['First problem', 'Second problem'] });

            expect(alertItems()).toEqual(['First problem', 'Second problem']);
        });

        it('shows the named field error when Formik reports an object', async () => {
            await renderDocs();

            await setFormikErrors({ form: { documents: 'Documents are invalid' } });

            expect(alertItems()).toEqual(['Documents are invalid']);
        });

        it('reports each failed and cancelled upload once the transfer finishes', async () => {
            await renderDocs({
                props: {
                    progress: {
                        percent: 100,
                        files: [
                            { fileName: 'good.pdf', status: FileStatus.Completed },
                            { fileName: 'bad.pdf', status: FileStatus.Failed },
                            { fileName: 'stopped.pdf', status: FileStatus.Cancelled },
                        ],
                    },
                },
            });

            expect(alertItems()).toEqual([
                'Error uploading bad.pdf',
                'Upload cancelled for stopped.pdf',
            ]);
        });

        it('reports no file errors until the transfer reaches 100 percent', async () => {
            await renderDocs({
                props: {
                    progress: {
                        percent: 40,
                        files: [{ fileName: 'bad.pdf', status: FileStatus.Failed }],
                    },
                },
            });

            expect(document.querySelector('#form-error-summary-custom')).toBeNull();
        });

        it('shows a repeated error only once', async () => {
            await renderDocs({ props: { externalErrors: ['Same problem'] } });

            await setFormikErrors({ form: 'Same problem' });

            expect(alertItems()).toEqual(['Same problem']);
        });

        it('hides the summary when the only error is an untouched category prompt', async () => {
            // Before the form is submitted, nagging about an unset category is noise - the user has
            // not finished yet. It must arrive as an external error to be the sole entry: the same
            // message coming from uploadErrors is filtered out before it reaches the summary.
            await renderDocs({ props: { externalErrors: [ValidationMessages.RequiredTag] } });

            expect(document.querySelector('#form-error-summary-custom')).toBeNull();
        });

        it('shows a lone category prompt after the form has been submitted', async () => {
            await renderDocs({ props: { externalErrors: [ValidationMessages.RequiredTag] } });

            await act(async () => {
                await formik?.submitForm();
            });

            expect(alertItems()).toEqual([ValidationMessages.RequiredTag]);
        });

        it('drops the category prompt when it arrives as an upload error', async () => {
            await renderDocs();

            await act(async () => {
                attachmentControl.props.setErrors([ValidationMessages.RequiredTag]);
            });

            expect(document.querySelector('#form-error-summary-custom')).toBeNull();
        });

        it('keeps the summary but omits the category prompt when other errors stand', async () => {
            // The category prompt has to arrive as an external error: uploadErrors are filtered for
            // exactly this message before they ever reach the summary.
            await renderDocs({
                props: {
                    externalErrors: [ValidationMessages.RequiredTag, 'Failed to commit documents.'],
                },
            });

            expect(alertItems()).toEqual(['Failed to commit documents.']);
        });

        it('shows the category prompt once the form has been submitted', async () => {
            await renderDocs({
                props: {
                    externalErrors: [ValidationMessages.RequiredTag, 'Failed to commit documents.'],
                },
            });

            await act(async () => {
                await formik?.submitForm();
            });

            expect(alertItems()).toEqual([
                ValidationMessages.RequiredTag,
                'Failed to commit documents.',
            ]);
        });

        it('ignores a Formik error that is neither text, list nor object', async () => {
            await renderDocs();

            await setFormikErrors({ form: 42 });

            expect(document.querySelector('#form-error-summary-custom')).toBeNull();
        });

        it('renders an empty entry when the Formik error object omits this field', async () => {
            // Characterizing a display defect, not endorsing it. The object branch builds
            // `[fieldError[errorName] || '']` and then keeps anything of type string - and '' is a
            // string, so an unrelated field error yields a bullet with no text in it.
            await renderDocs();

            await setFormikErrors({ form: { somethingElse: 'Unrelated problem' } });

            expect(alertItems()).toEqual(['']);
        });

        it('scrolls the summary into view when a document is required', async () => {
            const scrollIntoView = vi.fn();
            const focus = vi.fn();
            vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(scrollIntoView);
            vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(focus);

            await renderDocs({ props: { externalErrors: [ValidationMessages.RequiredDoc] } });

            await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({
                behavior: 'smooth',
                block: 'start',
            }));
            expect(focus).toHaveBeenCalled();

            vi.restoreAllMocks();
        });
    });

    describe('uploading', () => {
        it('refuses an empty selection', async () => {
            await renderDocs({ props: { onUploadAttachment: vi.fn() } });

            await expect(attachmentControl.props.onUploadFiles([])).rejects.toThrow('No file to upload');
        });

        it('sends every selected file in a single call', async () => {
            const onUploadAttachment = vi.fn().mockResolvedValue([{ id: 'doc-1' }]);
            const setExternalErrors = vi.fn();
            await renderDocs({ props: { onUploadAttachment, setExternalErrors } });

            const files = [
                new File(['a'], 'first.pdf', { type: 'application/pdf' }),
                new File(['b'], 'second.pdf', { type: 'application/pdf' }),
            ];

            let uploaded: unknown;
            await act(async () => {
                uploaded = await attachmentControl.props.onUploadFiles(files);
            });

            expect(msalMocks.acquireTokenSilent).toHaveBeenCalled();
            expect(onUploadAttachment).toHaveBeenCalledTimes(1);
            expect(onUploadAttachment).toHaveBeenCalledWith(DEFAULT_ACCESS_TOKEN, [
                { data: files[0], fileName: 'first.pdf' },
                { data: files[1], fileName: 'second.pdf' },
            ]);
            expect(setExternalErrors).toHaveBeenCalledWith([]);
            expect(uploaded).toEqual([{ id: 'doc-1' }]);
        });

        it('falls back to the attachment handler when no upload handler is supplied', async () => {
            const onUploadFiles = vi.fn().mockResolvedValue([]);
            await renderDocs({ props: { attachment: { onUploadFiles } } });

            const files = [new File(['a'], 'first.pdf')];
            await act(async () => {
                await attachmentControl.props.onUploadFiles(files);
            });

            // The raw File list goes straight through - no FileParameter mapping, no token.
            expect(onUploadFiles).toHaveBeenCalledWith(files);
        });

        it('lists every server-side validation message', async () => {
            const onUploadAttachment = vi.fn().mockRejectedValue({
                errors: {
                    file: ['File type not allowed', 'File too large'],
                    name: ['Name is invalid'],
                },
            });
            await renderDocs({ props: { onUploadAttachment } });

            await act(async () => {
                await attachmentControl.props.onUploadFiles([new File(['a'], 'a.pdf')]);
            });

            expect(alertItems()).toEqual([
                'File type not allowed',
                'File too large',
                'Name is invalid',
            ]);
        });

        it('falls back to the problem title when no field errors are given', async () => {
            const onUploadAttachment = vi.fn().mockRejectedValue({ title: 'Upload rejected' });
            await renderDocs({ props: { onUploadAttachment } });

            await act(async () => {
                await attachmentControl.props.onUploadFiles([new File(['a'], 'a.pdf')]);
            });

            expect(alertItems()).toEqual(['Upload rejected']);
        });

        it('stays quiet when the failure carries neither errors nor a title', async () => {
            const onUploadAttachment = vi.fn().mockRejectedValue({});
            await renderDocs({ props: { onUploadAttachment } });

            await act(async () => {
                await attachmentControl.props.onUploadFiles([new File(['a'], 'a.pdf')]);
            });

            expect(document.querySelector('#form-error-summary-custom')).toBeNull();
        });

        it('drops the caller back to their own organisation when third-party access is revoked', async () => {
            const onUploadAttachment = vi.fn().mockRejectedValue({
                status: 403,
                title: 'No third-party access remains for this organisation',
            });
            await renderDocs({ props: { onUploadAttachment } });

            await act(async () => {
                await attachmentControl.props.onUploadFiles([new File(['a'], 'a.pdf')]);
            });

            await waitFor(() => expect(mocks.setDashboardNotification).toHaveBeenCalled());
            expect(mocks.setDashboardNotification.mock.calls[0][0].message).toContain('Client Org');
            expect(mocks.setTargetOrganisation).toHaveBeenCalledWith('11111111111', 'Test Org');
        });

        it('falls back to empty identifiers when the account has no organisation recorded', async () => {
            mocks.accountContext.mockReturnValue({
                details: { targetOrganisation: { targetOrganisationName: 'Client Org' } },
            });
            const onUploadAttachment = vi.fn().mockRejectedValue({
                status: 403,
                title: 'No third-party access remains for this organisation',
            });
            await renderDocs({ props: { onUploadAttachment } });

            await act(async () => {
                await attachmentControl.props.onUploadFiles([new File(['a'], 'a.pdf')]);
            });

            await waitFor(() => expect(mocks.setTargetOrganisation).toHaveBeenCalledWith('', ''));
        });

        it('treats a 403 without the third-party title as an ordinary failure', async () => {
            const onUploadAttachment = vi.fn().mockRejectedValue({
                status: 403,
                title: 'Forbidden',
            });
            await renderDocs({ props: { onUploadAttachment } });

            await act(async () => {
                await attachmentControl.props.onUploadFiles([new File(['a'], 'a.pdf')]);
            });

            expect(mocks.setTargetOrganisation).not.toHaveBeenCalled();
            expect(alertItems()).toEqual(['Forbidden']);
        });
    });

    describe('managing existing documents', () => {
        it('deletes a document and reports the success', async () => {
            const onDeleteSuccess = vi.fn();
            await renderDocs({ props: { onDeleteSuccess } });

            await act(async () => {
                await attachmentControl.props.onDeleteFile('doc-9');
            });

            expect(clients.patternApproval.setAuthToken).toHaveBeenCalledWith(DEFAULT_ACCESS_TOKEN);
            expect(clients.patternApproval.methods.deleteDocument).toHaveBeenCalledWith('APP-1', 'doc-9');
            expect(onDeleteSuccess).toHaveBeenCalledWith(true);
        });

        it('deletes a document when no success callback is supplied', async () => {
            await renderDocs();

            await act(async () => {
                await attachmentControl.props.onDeleteFile('doc-9');
            });

            expect(clients.patternApproval.methods.deleteDocument).toHaveBeenCalledWith('APP-1', 'doc-9');
        });

        it('updates a document category', async () => {
            await renderDocs();

            await act(async () => {
                await attachmentControl.props.onCategoryUpdate('doc-9', 'Specification');
            });

            expect(clients.patternApproval.methods.updateCategory)
                .toHaveBeenCalledWith('APP-1', 'doc-9', 'Specification');
        });

        it('ignores a category update with no category', async () => {
            await renderDocs();

            await act(async () => {
                await attachmentControl.props.onCategoryUpdate('doc-9', '');
            });

            expect(clients.patternApproval.methods.updateCategory).not.toHaveBeenCalled();
        });
    });

    describe('instrument info panel', () => {
        it('shows the panel for a new certificate application', async () => {
            await renderDocs();

            expect(screen.getByTestId('instrument-info-panel')).toHaveAttribute('data-category', 'cat-1');
            expect(screen.getByTestId('instrument-info-panel')).toHaveAttribute('data-type', 'type-1');
        });

        it('hides the panel for other application types', async () => {
            await renderDocs({
                values: {
                    form: {
                        ...defaultValues.form,
                        patternApprovalType: PatternApprovalRequiredValues.Variation,
                    },
                },
            });

            expect(screen.queryByTestId('instrument-info-panel')).not.toBeInTheDocument();
        });

        it('hides the panel when the instrument is not yet chosen', async () => {
            await renderDocs({
                values: {
                    form: { ...defaultValues.form, instrumentType: undefined },
                },
            });

            expect(screen.queryByTestId('instrument-info-panel')).not.toBeInTheDocument();
        });

        it('hides the panel in summary mode', async () => {
            await renderDocs({ props: { isSummary: true } });

            expect(screen.queryByTestId('instrument-info-panel')).not.toBeInTheDocument();
        });
    });

    describe('presentation', () => {
        it('invites an upload when documents can still be changed', async () => {
            await renderDocs();

            expect(screen.getByText(/you may be asked to provide additional documents/)).toBeInTheDocument();
            expect(screen.getByRole('heading', { level: 2 }))
                .toHaveTextContent('Upload one or more supporting documents');
        });

        it('explains the commit rule when document changes are suppressed', async () => {
            await renderDocs({ props: { suppressDocChanges: true } });

            expect(screen.getByText(/Documents cannot be changed once committed/)).toBeInTheDocument();
        });

        it('reads as a record rather than an invitation in summary mode', async () => {
            await renderDocs({ props: { isSummary: true } });

            expect(screen.getByRole('heading', { level: 2 }))
                .toHaveTextContent('Uploaded supporting documents');
            expect(screen.getByTestId('attachment')).toHaveAttribute('data-is-summary', 'true');
        });

        it('passes the upload lock through to the attachment control', async () => {
            await renderDocs({ props: { disableUpload: true } });

            expect(screen.getByTestId('attachment')).toHaveAttribute('data-disable-upload', 'true');
        });
    });

    describe('clearing progress on unmount', () => {
        it('clears the progress it no longer owns', async () => {
            const setProgress = vi.fn();
            const { unmount } = await renderDocs({ props: { setProgress } });

            unmount();

            expect(setProgress).toHaveBeenCalledWith(undefined);
        });

        it('leaves progress alone while an upload is still running', async () => {
            const setProgress = vi.fn();
            const { unmount } = await renderDocs({ props: { setProgress, uploading: true } });

            unmount();

            expect(setProgress).not.toHaveBeenCalled();
        });

        it('survives unmount when no progress setter was supplied', async () => {
            const { unmount } = await renderDocs({ props: { setProgress: undefined } });

            expect(() => unmount()).not.toThrow();
        });
    });
});
