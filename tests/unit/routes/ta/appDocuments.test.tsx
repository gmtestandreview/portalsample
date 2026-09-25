import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AttachmentDto, FileParameter } from '../../../../ClientApp/src/api/web-api-client';
import type * as WebApiClient from '../../../../ClientApp/src/api/web-api-client';

import { resetMsalMock, signOut, DEFAULT_ACCESS_TOKEN } from '../../helpers/mockMsal';
import type { ClientMock, ClientMethodMocks } from '../../helpers/mockApiClient';
import { renderWithRouter } from '../../helpers/renderWithRouter';

const mocks = vi.hoisted(() => ({
    appLoggerError: vi.fn(),
}));

const clients = vi.hoisted(() => ({
    patternApproval: undefined as unknown as ClientMock<ClientMethodMocks>,
    progress: undefined as unknown as ClientMock<ClientMethodMocks>,
}));

/** Captures the documents step's props so its callbacks can be driven directly. */
const documentsStep = vi.hoisted(() => ({
    props: undefined as unknown as {
        onUploadAttachment: (token: string, files: FileParameter[]) => Promise<AttachmentDto[]>;
        handleCancelFile: (fileName: string) => Promise<void>;
        attachment: { onUploadFiles: () => Promise<unknown[]> };
        progress?: { percent?: number; status?: string };
        uploading: boolean;
        disableUpload: boolean;
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

    clients.patternApproval = createClientMockFor(
        'getAppDocuments',
        'addDocuments',
        'commitAppDocuments',
    );
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

vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: { error: mocks.appLoggerError, info: vi.fn(), verbose: vi.fn() },
}));

vi.mock('../../../../ClientApp/src/routes/ta/supportingDocuments', () => ({
    default: (props: typeof documentsStep.props) => {
        documentsStep.props = props;

        return (
            <div
                data-testid="supporting-documents"
                data-uploading={String(props.uploading)}
                data-disable-upload={String(props.disableUpload)}
                data-errors={props.externalErrors.join('|')}
            />
        );
    },
}));

const document1 = (overrides: Record<string, unknown> = {}) => ({
    id: 'doc-1',
    attachmentName: 'spec.pdf',
    attachmentCategory: 'Specification',
    attachmentType: 'application/pdf',
    attachmentMimeType: 'application/pdf',
    attachmentSize: 1024,
    attachmentUrl: 'https://example/spec.pdf',
    documentLocked: false,
    documentBytes: 'AAAA',
    ...overrides,
});

const appDocuments = (documents: unknown[], form: Record<string, unknown> = {}) => ({
    form: { documents, instrumentCategory: 'Mass', instrumentType: 'Balance', ...form },
});

const renderRoute = async (path = '/ta/manage/APP-1/documents', routePath = '/ta/manage/:id/documents') => {
    const ApplicationDocuments = (await import('../../../../ClientApp/src/routes/ta/manage/appDocuments')).default;

    const result = renderWithRouter(<ApplicationDocuments />, { path: routePath, initialPath: path });

    await act(async () => {
        await Promise.resolve();
    });

    return result;
};

const renderLoaded = async () => {
    const result = await renderRoute();
    await waitFor(() => expect(screen.getByTestId('supporting-documents')).toBeInTheDocument());

    return result;
};

describe('application documents', () => {
    beforeEach(async () => {
        await import('../../../../ClientApp/src/api/web-api-client');

        resetMsalMock();
        mocks.appLoggerError.mockReset();
        documentsStep.props = undefined as unknown as typeof documentsStep.props;

        for (const client of [clients.patternApproval, clients.progress]) {
            client.setAuthToken.mockReset();
            for (const method of Object.values(client.methods)) {
                method.mockReset();
            }
        }

        clients.patternApproval.methods.getAppDocuments.mockResolvedValue(appDocuments([document1()]));
        clients.patternApproval.methods.addDocuments.mockResolvedValue({
            uploadId: 'upload-1',
            form: { documents: [document1()] },
        });
        clients.patternApproval.methods.commitAppDocuments.mockResolvedValue(undefined);
        clients.progress.methods.getProgressUploadId.mockResolvedValue('upload-1');
        clients.progress.methods.getProgress.mockResolvedValue({ percent: 100, status: 'Completed' });
        clients.progress.methods.deleteProgressStatistics.mockResolvedValue(undefined);
        clients.progress.methods.cancelFile.mockResolvedValue(undefined);
    });

    describe('loading existing documents', () => {
        it('fetches the application documents with an auth token', async () => {
            await renderLoaded();

            expect(clients.patternApproval.setAuthToken).toHaveBeenCalledWith(DEFAULT_ACCESS_TOKEN);
            expect(clients.patternApproval.methods.getAppDocuments).toHaveBeenCalledWith('APP-1');
        });

        it('offers a commit when at least one document is still unlocked', async () => {
            await renderLoaded();

            expect(screen.getByRole('button', { name: 'Commit' })).toBeInTheDocument();
        });

        it('offers no commit when every document is locked', async () => {
            clients.patternApproval.methods.getAppDocuments.mockResolvedValue(
                appDocuments([document1({ documentLocked: true })]),
            );

            await renderLoaded();

            expect(screen.queryByRole('button', { name: 'Commit' })).not.toBeInTheDocument();
        });

        it('offers no commit when the application carries no documents', async () => {
            // `?? false` covers a response with no documents array at all.
            clients.patternApproval.methods.getAppDocuments.mockResolvedValue({ form: {} });

            await renderLoaded();

            expect(screen.queryByRole('button', { name: 'Commit' })).not.toBeInTheDocument();
        });

        it('blocks further upload once the application is complete', async () => {
            clients.patternApproval.methods.getAppDocuments.mockResolvedValue(
                appDocuments([document1()], { applicationStatus: 'Completed' }),
            );

            await renderLoaded();

            expect(screen.getByTestId('supporting-documents')).toHaveAttribute('data-disable-upload', 'true');
        });

        it('allows upload while the application is still open', async () => {
            await renderLoaded();

            expect(screen.getByTestId('supporting-documents')).toHaveAttribute('data-disable-upload', 'false');
        });

        it('shows a spinner while the documents are loading', async () => {
            let release: (value: unknown) => void = () => undefined;
            clients.patternApproval.methods.getAppDocuments.mockReturnValue(
                new Promise((resolve) => {
                    release = resolve;
                }),
            );

            await renderRoute();

            expect(screen.getByText('Loading...')).toBeInTheDocument();

            await act(async () => {
                release(appDocuments([document1()]));
            });

            await waitFor(() => expect(screen.getByTestId('supporting-documents')).toBeInTheDocument());
        });

        it('logs a failed load and clears the spinner', async () => {
            clients.patternApproval.methods.getAppDocuments.mockRejectedValue(new Error('docs down'));

            await renderRoute();

            await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
                'Failed to load application documents',
                expect.any(Error),
                { Id: 'APP-1' },
            ));
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        it('does not fetch without a signed-in account', async () => {
            signOut();

            await renderRoute();

            expect(clients.patternApproval.methods.getAppDocuments).not.toHaveBeenCalled();
        });

        it('does not fetch without an application id', async () => {
            await renderRoute('/ta/manage/documents', '/ta/manage/documents');

            expect(clients.patternApproval.methods.getAppDocuments).not.toHaveBeenCalled();
        });
    });

    describe('uploading attachments', () => {
        it('maps the returned documents and re-enables the commit', async () => {
            clients.patternApproval.methods.getAppDocuments.mockResolvedValue(
                appDocuments([document1({ documentLocked: true })]),
            );

            await renderLoaded();
            expect(screen.queryByRole('button', { name: 'Commit' })).not.toBeInTheDocument();

            clients.patternApproval.methods.addDocuments.mockResolvedValue({
                uploadId: 'upload-2',
                form: { documents: [document1({ id: 'doc-2', documentLocked: false })] },
            });

            let attachments: AttachmentDto[] = [];
            await act(async () => {
                attachments = await documentsStep.props.onUploadAttachment('token', []);
            });

            expect(attachments).toHaveLength(1);
            expect(attachments[0]).toMatchObject({ id: 'doc-2', documentReference: 'doc-2' });
            await waitFor(() => expect(screen.getByRole('button', { name: 'Commit' })).toBeInTheDocument());
        });

        it('returns an empty list when the response carries no form', async () => {
            // The same cast defect that was fixed in routes/ta/index.tsx lived here too, and here it
            // was worse: `attachments.some(...)` on the next line threw a TypeError that the catch
            // then logged as a document load failure, hiding the real cause.
            await renderLoaded();
            clients.patternApproval.methods.addDocuments.mockResolvedValue({ uploadId: 'upload-3' });

            let attachments: AttachmentDto[] | undefined;
            await act(async () => {
                attachments = await documentsStep.props.onUploadAttachment('token', []);
            });

            expect(attachments).toEqual([]);
            expect(mocks.appLoggerError).not.toHaveBeenCalled();
        });

        it('logs an upload failure', async () => {
            await renderLoaded();
            clients.patternApproval.methods.addDocuments.mockRejectedValue(new Error('upload failed'));

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });

            expect(mocks.appLoggerError).toHaveBeenCalledWith(
                'Failed to load application documents',
                expect.any(Error),
                { Id: 'APP-1' },
            );
        });

        it('skips progress polling when no upload id is issued', async () => {
            await renderLoaded();
            clients.progress.methods.getProgressUploadId.mockResolvedValue(undefined);

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });

            expect(clients.progress.methods.getProgress).not.toHaveBeenCalled();
        });

        it('hands the documents step an inert onUploadFiles stub', async () => {
            await renderLoaded();

            await expect(documentsStep.props.attachment.onUploadFiles()).resolves.toEqual([]);
        });
    });

    describe('progress polling', () => {
        it('stops once the upload completes and cleans up', async () => {
            await renderLoaded();
            clients.progress.methods.getProgress
                .mockResolvedValueOnce({ percent: 30, status: 'InProgress' })
                .mockResolvedValue({ percent: 100, status: 'Completed' });

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });

            await waitFor(() => expect(clients.progress.methods.deleteProgressStatistics)
                .toHaveBeenCalledWith('upload-1'));
        });

        it('also stops when the upload completes with errors', async () => {
            await renderLoaded();
            clients.progress.methods.getProgress.mockResolvedValue({
                percent: 100,
                status: 'CompletedWithErrors',
            });

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });

            await waitFor(() => expect(clients.progress.methods.deleteProgressStatistics).toHaveBeenCalled());
        });

        it('logs a failed cleanup', async () => {
            await renderLoaded();
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
            await renderLoaded();
            clients.progress.methods.getProgress
                .mockRejectedValueOnce(new Error('poll blipped'))
                .mockResolvedValue({ percent: 100, status: 'Completed' });

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });

            // The retry now waits PROGRESS_RETRY_DELAY_MS before polling again, which is longer
            // than waitFor's 1s default - so this asserts against the real backoff rather than
            // faking timers, which RTL's waitFor does not reliably detect under Vitest.
            await waitFor(
                () => expect(clients.progress.methods.deleteProgressStatistics).toHaveBeenCalled(),
                { timeout: 10000 },
            );
            expect(clients.progress.methods.getProgress).toHaveBeenCalledTimes(2);
        }, 20000);

        it('abandons polling when the component unmounts mid-flight', async () => {
            const { unmount } = await renderLoaded();

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
            await renderLoaded();

            await act(async () => {
                await documentsStep.props.handleCancelFile('spec.pdf');
            });

            expect(clients.progress.methods.cancelFile).not.toHaveBeenCalled();
        });

        it('cancels the named file against the current upload', async () => {
            await renderLoaded();

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });
            await act(async () => {
                await documentsStep.props.handleCancelFile('spec.pdf');
            });

            expect(clients.progress.methods.cancelFile).toHaveBeenCalledWith('upload-1', 'spec.pdf');
        });

        it('swallows a failed cancellation', async () => {
            await renderLoaded();
            clients.progress.methods.cancelFile.mockRejectedValue(new Error('too late'));

            await act(async () => {
                await documentsStep.props.onUploadAttachment('token', []);
            });

            await expect(act(async () => {
                await documentsStep.props.handleCancelFile('spec.pdf');
            })).resolves.toBeUndefined();
        });
    });

    describe('committing', () => {
        it('strips document bytes before sending the commit', async () => {
            const user = userEvent.setup();
            await renderLoaded();

            await user.click(screen.getByRole('button', { name: 'Commit' }));

            await waitFor(() => expect(clients.patternApproval.methods.commitAppDocuments).toHaveBeenCalled());
            const [applicationId, values] = clients.patternApproval.methods.commitAppDocuments.mock.calls[0];
            expect(applicationId).toBe('APP-1');
            // Bytes are cleared so the commit payload stays small.
            expect(values.form.documents[0].documentBytes).toBeUndefined();
            expect(values.form.documents[0].attachmentName).toBe('spec.pdf');
        });

        it('refetches the documents after a successful commit', async () => {
            const user = userEvent.setup();
            await renderLoaded();

            const fetchesBefore = clients.patternApproval.methods.getAppDocuments.mock.calls.length;

            await user.click(screen.getByRole('button', { name: 'Commit' }));

            await waitFor(() => expect(
                clients.patternApproval.methods.getAppDocuments.mock.calls.length,
            ).toBeGreaterThan(fetchesBefore));
        });

        it('reports a blocked commit distinctly', async () => {
            const user = userEvent.setup();
            clients.patternApproval.methods.commitAppDocuments.mockRejectedValue({ status: 403 });

            await renderLoaded();
            await user.click(screen.getByRole('button', { name: 'Commit' }));

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
            const user = userEvent.setup();
            clients.patternApproval.methods.commitAppDocuments.mockRejectedValue({ status: 502 });

            await renderLoaded();
            await user.click(screen.getByRole('button', { name: 'Commit' }));

            await waitFor(() => expect(screen.getByTestId('supporting-documents')).toHaveAttribute(
                'data-errors',
                'A server error occurred. Please try again.',
            ));
        });

        it('falls back to a generic message when the failure carries no status', async () => {
            const user = userEvent.setup();
            clients.patternApproval.methods.commitAppDocuments.mockRejectedValue(new Error('network'));

            await renderLoaded();
            await user.click(screen.getByRole('button', { name: 'Commit' }));

            await waitFor(() => expect(screen.getByTestId('supporting-documents')).toHaveAttribute(
                'data-errors',
                'Failed to commit documents.',
            ));
        });
    });
});
