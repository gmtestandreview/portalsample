import { act, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AttachmentDto, FileParameter } from '../../../../ClientApp/src/api/web-api-client';
import type * as WebApiClient from '../../../../ClientApp/src/api/web-api-client';

import { msalMocks, rejectToken, resetMsalMock, DEFAULT_ACCESS_TOKEN } from '../../helpers/mockMsal';
import type { ClientMock, ClientMethodMocks } from '../../helpers/mockApiClient';
import { NOT_FOUND_TEST_ID, renderWithRouter } from '../../helpers/renderWithRouter';

const mocks = vi.hoisted(() => ({
    accountContext: vi.fn(),
    appLoggerError: vi.fn(),
}));

const clients = vi.hoisted(() => ({
    patternApproval: undefined as unknown as ClientMock<ClientMethodMocks>,
    progress: undefined as unknown as ClientMock<ClientMethodMocks>,
}));

/** Captures the props the wizard hands to the documents step, so its callbacks can be driven. */
const documentsStep = vi.hoisted(() => ({
    props: undefined as unknown as {
        onUploadAttachment: (token: string, files: FileParameter[]) => Promise<AttachmentDto[]>;
        handleCancelFile: (fileName: string) => Promise<void>;
        attachment: { onUploadFiles: () => Promise<unknown[]> };
        progress?: { percent?: number; status?: string };
        uploading: boolean;
        externalErrors: string[];
    },
}));

vi.mock('@azure/msal-react', async () => {
    const { msalReactModuleMock } = await import('../../helpers/mockMsal');

    return msalReactModuleMock();
});

vi.mock('../../../../ClientApp/src/api/web-api-client', async (importOriginal) => {
    const { createClientMockFor, webApiClientModuleMock } = await import('../../helpers/mockApiClient');
    const original = await importOriginal<typeof WebApiClient>();

    clients.patternApproval = createClientMockFor('getStepStatuses', 'addDocuments');
    clients.progress = createClientMockFor(
        'getProgressUploadId',
        'getProgress',
        'deleteProgressStatistics',
        'cancelFile',
    );

    return webApiClientModuleMock(original, {
        RequestForPatternApprovalClient: clients.patternApproval,
        ProgressClient: clients.progress,
    });
});

vi.mock('../../../../ClientApp/src/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['api://ta/.default'] },
}));

vi.mock('../../../../ClientApp/src/authentication/hooks', () => ({
    default: () => mocks.accountContext(),
}));

vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: { error: mocks.appLoggerError, info: vi.fn(), verbose: vi.fn() },
}));

vi.mock('../../../../ClientApp/src/components/forms/WizardForm', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <section data-testid="wizard-form">{children}</section>
    ),
}));

vi.mock('../../../../ClientApp/src/components/forms/WizardForm/WizardStep', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <article data-testid="wizard-step">{children}</article>
    ),
}));

vi.mock('../../../../ClientApp/src/routes/ta/organisationAndContact', () => ({
    default: () => <div>Organisation and contact step</div>,
}));

vi.mock('../../../../ClientApp/src/routes/ta/applicationAndInstrument', () => ({
    default: () => <div>Application and instrument step</div>,
}));

vi.mock('../../../../ClientApp/src/routes/ta/summaryAndSubmit', () => ({
    default: () => <div>Summary and submit step</div>,
}));

vi.mock('../../../../ClientApp/src/routes/ta/supportingDocuments', () => ({
    default: (props: typeof documentsStep.props) => {
        documentsStep.props = props;

        return (
            <div
                data-testid="supporting-documents"
                data-uploading={String(props.uploading)}
                data-percent={props.progress?.percent ?? ''}
                data-errors={props.externalErrors.join('|')}
            />
        );
    },
}));

const statuses = [{ name: 'Organisation and contact', status: 'current' }];

const renderRoute = async (path = '/ta/APP-1') => {
    const ApplicationForTypeApproval = (await import('../../../../ClientApp/src/routes/ta')).default;

    const result = renderWithRouter(<ApplicationForTypeApproval />, {
        path: '/ta/:id',
        initialPath: path,
    });

    await act(async () => {
        await Promise.resolve();
    });

    return result;
};

/** Renders and waits for the wizard, which is the precondition for every handler test. */
const renderLoadedWizard = async () => {
    const result = await renderRoute();
    await waitFor(() => expect(screen.getByTestId('wizard-form')).toBeInTheDocument());

    return result;
};

describe('application for type approval', () => {
    beforeEach(async () => {
        // vi.mock factories are lazy: they run when the mocked module is first imported. This file
        // imports web-api-client for types only, and those are erased at compile time, so without
        // this the factory has not run yet and `clients` is still undefined here.
        await import('../../../../ClientApp/src/api/web-api-client');

        resetMsalMock();
        mocks.accountContext.mockReset().mockReturnValue({
            details: { userProfile: { email: 'tester@example.gov.au' } },
        });
        mocks.appLoggerError.mockReset();
        documentsStep.props = undefined as unknown as typeof documentsStep.props;

        for (const client of [clients.patternApproval, clients.progress]) {
            client.setAuthToken.mockReset();
            for (const method of Object.values(client.methods)) {
                method.mockReset();
            }
        }

        clients.patternApproval.methods.getStepStatuses.mockResolvedValue(statuses);
        clients.patternApproval.methods.addDocuments.mockResolvedValue({
            uploadId: 'upload-1',
            form: { documents: [] },
        });
        clients.progress.methods.getProgressUploadId.mockResolvedValue('upload-1');
        clients.progress.methods.getProgress.mockResolvedValue({ percent: 100, status: 'Completed' });
        clients.progress.methods.deleteProgressStatistics.mockResolvedValue(undefined);
        clients.progress.methods.cancelFile.mockResolvedValue(undefined);
    });

    describe('loading the wizard', () => {
        it('renders every step once the statuses arrive', async () => {
            await renderLoadedWizard();

            expect(clients.patternApproval.setAuthToken).toHaveBeenCalledWith(DEFAULT_ACCESS_TOKEN);
            expect(clients.patternApproval.methods.getStepStatuses).toHaveBeenCalledWith('APP-1');
            expect(screen.getAllByTestId('wizard-step')).toHaveLength(4);
            expect(screen.getByText('Organisation and contact step')).toBeInTheDocument();
            expect(screen.getByText('Summary and submit step')).toBeInTheDocument();
        });

        it('shows a spinner until the statuses arrive', async () => {
            let releaseStatuses: (value: unknown) => void = () => undefined;
            clients.patternApproval.methods.getStepStatuses.mockReturnValue(
                new Promise((resolve) => {
                    releaseStatuses = resolve;
                }),
            );

            await renderRoute();

            expect(screen.getByText('Loading...')).toBeInTheDocument();

            await act(async () => {
                releaseStatuses(statuses);
            });

            await waitFor(() => expect(screen.getByTestId('wizard-form')).toBeInTheDocument());
        });

        it('redirects to not found when the statuses fail to load', async () => {
            clients.patternApproval.methods.getStepStatuses.mockRejectedValue(new Error('load failed'));

            const { currentPath } = await renderRoute();

            await waitFor(() => expect(currentPath()).toBe('/not-found'));
            expect(screen.getByTestId(NOT_FOUND_TEST_ID)).toBeInTheDocument();
            expect(mocks.appLoggerError).toHaveBeenCalledWith(
                'Failed to load application steps',
                expect.any(Error),
                { Id: 'APP-1' },
            );
        });

        it('does not load anything without a signed-in account', async () => {
            const { signOut } = await import('../../helpers/mockMsal');
            signOut();

            await renderRoute();

            expect(screen.getByText('Loading...')).toBeInTheDocument();
            expect(clients.patternApproval.methods.getStepStatuses).not.toHaveBeenCalled();
        });
    });

    describe('uploading attachments', () => {
        it('maps the returned documents onto attachments', async () => {
            await renderLoadedWizard();
            clients.patternApproval.methods.addDocuments.mockResolvedValue({
                uploadId: 'upload-2',
                form: {
                    documents: [{
                        id: 'doc-1',
                        attachmentType: 'Specification',
                        attachmentMimeType: 'application/pdf',
                        attachmentSize: 1024,
                        attachmentName: 'spec.pdf',
                        attachmentUrl: 'https://example/spec.pdf',
                        attachmentCategory: 'Supporting',
                    }],
                },
            });

            let attachments: AttachmentDto[] = [];
            await act(async () => {
                attachments = await documentsStep.props.onUploadAttachment('token', []);
            });

            expect(clients.patternApproval.methods.addDocuments).toHaveBeenCalledWith(
                'APP-1', null, 'upload-1', [], null, null,
            );
            expect(attachments).toHaveLength(1);
            expect(attachments[0]).toMatchObject({
                id: 'doc-1',
                documentReference: 'doc-1',
                attachmentName: 'spec.pdf',
            });
        });

        it('returns undefined rather than an empty list when the response carries no form', async () => {
            // Characterizing a latent defect, not endorsing it. `documents?.map(...)` is cast to
            // AttachmentDto[], so a response without a form resolves to undefined while the
            // signature promises an array. Any caller doing `.length` on the result throws.
            await renderLoadedWizard();
            clients.patternApproval.methods.addDocuments.mockResolvedValue({ uploadId: 'upload-3' });

            let attachments: AttachmentDto[] | undefined;
            await act(async () => {
                attachments = await documentsStep.props.onUploadAttachment('token', []);
            });

            expect(attachments).toBeUndefined();
        });

        it('reports a blocked upload distinctly from a generic failure', async () => {
            await renderLoadedWizard();
            clients.patternApproval.methods.addDocuments.mockRejectedValue({ status: 403 });

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });

            await waitFor(() => expect(screen.getByTestId('supporting-documents')).toHaveAttribute(
                'data-errors',
                'Upload blocked for security reasons. Please rename the file and try again. If the issue continues, contact support.',
            ));
            expect(mocks.appLoggerError).toHaveBeenCalledWith(
                'Failed to load application documents',
                expect.anything(),
                { Id: 'APP-1', Status: 403 },
            );
        });

        it('reports a server error for a 5xx', async () => {
            await renderLoadedWizard();
            clients.patternApproval.methods.addDocuments.mockRejectedValue({ status: 503 });

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });

            await waitFor(() => expect(screen.getByTestId('supporting-documents')).toHaveAttribute(
                'data-errors',
                'A server error occurred. Please try again.',
            ));
        });

        it('falls back to a generic message when the failure carries no status', async () => {
            await renderLoadedWizard();
            clients.patternApproval.methods.addDocuments.mockRejectedValue(new Error('network'));

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });

            await waitFor(() => expect(screen.getByTestId('supporting-documents')).toHaveAttribute(
                'data-errors',
                'Failed to commit documents.',
            ));
        });

        it('hands the documents step an inert onUploadFiles stub', async () => {
            // The wizard routes uploads through onUploadAttachment; the step's own onUploadFiles
            // prop is required by its contract but deliberately does nothing, and the source marks
            // it "Not used". Pinning it means a future change that starts relying on it fails here
            // rather than silently uploading nothing.
            await renderLoadedWizard();

            await expect(documentsStep.props.attachment.onUploadFiles()).resolves.toEqual([]);
        });

        it('skips progress polling when no upload id is issued', async () => {
            await renderLoadedWizard();
            clients.progress.methods.getProgressUploadId.mockResolvedValue(undefined);

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });

            expect(clients.progress.methods.getProgress).not.toHaveBeenCalled();
        });
    });

    describe('progress polling', () => {
        it('publishes progress and stops once the upload completes', async () => {
            await renderLoadedWizard();
            clients.progress.methods.getProgress
                .mockResolvedValueOnce({ percent: 40, status: 'InProgress' })
                .mockResolvedValue({ percent: 100, status: 'Completed' });

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });

            await waitFor(() => expect(
                clients.progress.methods.deleteProgressStatistics,
            ).toHaveBeenCalledWith('upload-1'));
            await waitFor(() => expect(screen.getByTestId('supporting-documents'))
                .toHaveAttribute('data-uploading', 'false'));
        });

        it('also stops when the upload completes with errors', async () => {
            await renderLoadedWizard();
            clients.progress.methods.getProgress.mockResolvedValue({
                percent: 100,
                status: 'CompletedWithErrors',
            });

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });

            await waitFor(() => expect(
                clients.progress.methods.deleteProgressStatistics,
            ).toHaveBeenCalled());
        });

        it('logs a failed cleanup without disturbing the upload', async () => {
            await renderLoadedWizard();
            clients.progress.methods.deleteProgressStatistics.mockRejectedValue(new Error('gone'));

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });

            await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
                'Failed to delete progress statistics',
                expect.any(Error),
                { uploadId: 'upload-1' },
            ));
        });

        it('retries after a failed poll and still finishes', async () => {
            await renderLoadedWizard();
            clients.progress.methods.getProgress
                .mockRejectedValueOnce(new Error('poll blipped'))
                .mockResolvedValue({ percent: 100, status: 'Completed' });

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });

            await waitFor(() => expect(
                clients.progress.methods.deleteProgressStatistics,
            ).toHaveBeenCalled());
            expect(clients.progress.methods.getProgress).toHaveBeenCalledTimes(2);
        });

        it('abandons polling when the component unmounts mid-flight', async () => {
            const { unmount } = await renderLoadedWizard();

            let failPoll: (reason: Error) => void = () => undefined;
            clients.progress.methods.getProgress.mockReturnValue(
                new Promise((_resolve, reject) => {
                    failPoll = reject;
                }),
            );

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });

            await waitFor(() => expect(clients.progress.methods.getProgress).toHaveBeenCalled());

            // Unmount aborts the controller, so the in-flight poll's rejection must break the loop
            // rather than spin on it.
            unmount();
            await act(async () => {
                failPoll(new Error('aborted'));
            });

            const callsAfterUnmount = clients.progress.methods.getProgress.mock.calls.length;
            await act(async () => {
                await Promise.resolve();
            });
            expect(clients.progress.methods.getProgress).toHaveBeenCalledTimes(callsAfterUnmount);
        });
    });

    describe('cancelling a file', () => {
        it('does nothing before an upload has started', async () => {
            await renderLoadedWizard();

            await act(async () => {
                await documentsStep.props.handleCancelFile('spec.pdf');
            });

            expect(clients.progress.methods.cancelFile).not.toHaveBeenCalled();
        });

        it('cancels the named file against the current upload', async () => {
            await renderLoadedWizard();

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });
            await act(async () => {
                await documentsStep.props.handleCancelFile('spec.pdf');
            });

            expect(clients.progress.methods.cancelFile).toHaveBeenCalledWith('upload-1', 'spec.pdf');
        });

        it('swallows a failed cancellation because polling reports the real state', async () => {
            await renderLoadedWizard();
            clients.progress.methods.cancelFile.mockRejectedValue(new Error('too late'));

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });

            await expect(act(async () => {
                await documentsStep.props.handleCancelFile('spec.pdf');
            })).resolves.toBeUndefined();
        });

        it('gives up cancelling when the token cannot be refreshed', async () => {
            await renderLoadedWizard();

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });

            rejectToken(new Error('interaction_required'));

            await act(async () => {
                await documentsStep.props.handleCancelFile('spec.pdf');
            });

            expect(clients.progress.methods.cancelFile).not.toHaveBeenCalled();
            expect(msalMocks.acquireTokenSilent).toHaveBeenCalled();
        });
    });
});
