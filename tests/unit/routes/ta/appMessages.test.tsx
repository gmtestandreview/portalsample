import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FilterMessages } from '../../../../ClientApp/src/api/web-api-client';
import type * as WebApiClient from '../../../../ClientApp/src/api/web-api-client';

import { resetMsalMock, signOut, DEFAULT_ACCESS_TOKEN } from '../../helpers/mockMsal';
import type { ClientMock, ClientMethodMocks } from '../../helpers/mockApiClient';
import { renderWithRouter } from '../../helpers/renderWithRouter';

const mocks = vi.hoisted(() => ({
    appLoggerError: vi.fn(),
    sanitiseHtml: vi.fn((html: string) => html),
}));

const clients = vi.hoisted(() => ({
    patternApproval: undefined as unknown as ClientMock<ClientMethodMocks>,
}));

/** Captures the editor's callbacks so a submission can be driven without Slate's DOM. */
const editor = vi.hoisted(() => ({
    props: undefined as unknown as {
        onSubmit: () => void;
        value: unknown[];
        placeholder: string;
    },
    renderCount: 0,
    lastKey: null as string | null,
}));

vi.mock('@azure/msal-react', async () => {
    const { msalReactModuleMock } = await import('../../helpers/mockMsal');

    return msalReactModuleMock();
});

vi.mock('../../../../ClientApp/src/api/web-api-client', async (importOriginal) => {
    const { createClientMockFor, webApiClientModuleMock } = await import('../../helpers/mockApiClient');
    const original = await importOriginal<typeof WebApiClient>();

    clients.patternApproval = createClientMockFor('getAppMessages', 'addAppMessage');

    // FilterMessages must stay the real enum - the view select compares against its members.
    return webApiClientModuleMock(original, {
        RequestForPatternApprovalClient: clients.patternApproval,
    });
});

vi.mock('../../../../ClientApp/src/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['api://ta/.default'] },
}));

vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: { error: mocks.appLoggerError, info: vi.fn(), verbose: vi.fn() },
}));

vi.mock('../../../../ClientApp/src/routes/common/helperFunctions', async (importOriginal) => {
    const original = await importOriginal<Record<string, unknown>>();

    return { ...original, sanitiseHtml: mocks.sanitiseHtml };
});

vi.mock('../../../../ClientApp/src/components/SlateEditor/SlateEditor', () => ({
    default: (props: typeof editor.props) => {
        editor.props = props;
        editor.renderCount += 1;

        return <div data-testid="slate-editor" data-placeholder={props.placeholder} />;
    },
    serializeToHtml: (value: unknown[]) => `<p>${JSON.stringify(value)}</p>`,
}));

vi.mock('../../../../ClientApp/src/components/Pagination', () => ({
    default: ({ currentPage, totalPages, onPageChange }: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    }) => (
        <button
            type="button"
            data-testid="pagination"
            data-current={currentPage}
            data-total={totalPages}
            onClick={() => onPageChange(2)}
        >
            next page
        </button>
    ),
}));

vi.mock('../../../../ClientApp/src/components/PaginationHeader', () => ({
    default: ({ currentPage, totalCount }: { currentPage: number; totalCount: number }) => (
        <span data-testid="pagination-header" data-current={currentPage} data-total-count={totalCount} />
    ),
}));

const messageItem = (overrides: Record<string, unknown> = {}) => ({
    id: 'msg-1',
    subject: 'Assessment update',
    body: '<p>Your application is progressing.</p>',
    footer: 'The NMI team',
    avatar: 'NMI',
    senderName: 'NMI Officer',
    messageSent: new Date('2026-06-11T02:00:00.000Z'),
    messageRead: true,
    ...overrides,
});

const messagesResponse = (items: unknown[], details: Record<string, unknown> = {}) => ({
    requestForPatternApprovalMessageDetails: {
        currentPage: 1,
        totalPages: 3,
        totalCount: 25,
        items,
        ...details,
    },
});

const renderRoute = async (path = '/ta/manage/APP-1/messages', routePath = '/ta/manage/:id/messages') => {
    const ApplicationMessages = (await import('../../../../ClientApp/src/routes/ta/manage/appMessages')).default;

    const result = renderWithRouter(<ApplicationMessages />, { path: routePath, initialPath: path });

    await act(async () => {
        await Promise.resolve();
    });

    return result;
};

describe('application messages', () => {
    beforeEach(async () => {
        await import('../../../../ClientApp/src/api/web-api-client');

        resetMsalMock();
        mocks.appLoggerError.mockReset();
        mocks.sanitiseHtml.mockReset().mockImplementation((html: string) => html);
        editor.props = undefined as unknown as typeof editor.props;
        editor.renderCount = 0;

        clients.patternApproval.setAuthToken.mockReset();
        // Echo the requested page back, as the real endpoint does. A fixed `currentPage: 1` would
        // make the component snap straight back to page one after every page change, so paging
        // would look broken here for a reason that only exists in the mock.
        clients.patternApproval.methods.getAppMessages.mockReset()
            .mockImplementation((_id: string, _pageSize: number, page: number) => Promise.resolve(
                messagesResponse([messageItem()], { currentPage: page }),
            ));
        clients.patternApproval.methods.addAppMessage.mockReset().mockResolvedValue(undefined);
    });

    afterEach(() => {
        document.getElementById('dash-type-title')?.remove();
    });

    describe('loading messages', () => {
        it('requests the first page and renders the returned message', async () => {
            await renderRoute();

            await waitFor(() => expect(screen.getByText('Assessment update')).toBeInTheDocument());

            expect(clients.patternApproval.setAuthToken).toHaveBeenCalledWith(DEFAULT_ACCESS_TOKEN);
            expect(clients.patternApproval.methods.getAppMessages).toHaveBeenCalledWith(
                'APP-1', 10, 1, FilterMessages.ShowAllMessages, 'APP-1',
            );
            expect(screen.getByTestId('pagination')).toHaveAttribute('data-total', '3');
            expect(screen.getByTestId('pagination-header')).toHaveAttribute('data-total-count', '25');
        });

        it('says so when the application has no messages', async () => {
            clients.patternApproval.methods.getAppMessages.mockResolvedValue(messagesResponse([]));

            await renderRoute();

            await waitFor(() => expect(screen.getByText('No messages to display')).toBeInTheDocument());
            // The count header is for a populated list only.
            expect(screen.queryByTestId('pagination-header')).not.toBeInTheDocument();
        });

        it('keeps its defaults when the response omits the paging fields', async () => {
            // Each paging field is written only when truthy, so a response with zeroes or omissions
            // must leave the component on its own defaults rather than paging to zero.
            clients.patternApproval.methods.getAppMessages.mockResolvedValue({
                requestForPatternApprovalMessageDetails: {
                    currentPage: 0,
                    totalPages: 0,
                    totalCount: 0,
                    items: [messageItem()],
                },
            });

            await renderRoute();

            await waitFor(() => expect(screen.getByText('Assessment update')).toBeInTheDocument());
            expect(screen.getByTestId('pagination')).toHaveAttribute('data-current', '1');
            expect(screen.getByTestId('pagination')).toHaveAttribute('data-total', '1');
        });

        it('logs a failed load and stops the spinner', async () => {
            clients.patternApproval.methods.getAppMessages.mockRejectedValue(new Error('messages down'));

            await renderRoute();

            await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
                'Failed to load application messages',
                expect.any(Error),
                { Id: 'APP-1' },
            ));
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        it('does not fetch without a signed-in account', async () => {
            signOut();

            await renderRoute();

            expect(clients.patternApproval.methods.getAppMessages).not.toHaveBeenCalled();
        });

        it('does not fetch without an application id', async () => {
            await renderRoute('/ta/manage/messages', '/ta/manage/messages');

            expect(clients.patternApproval.methods.getAppMessages).not.toHaveBeenCalled();
        });

        it('shows a spinner while the request is in flight', async () => {
            let release: (value: unknown) => void = () => undefined;
            clients.patternApproval.methods.getAppMessages.mockReturnValue(
                new Promise((resolve) => {
                    release = resolve;
                }),
            );

            await renderRoute();

            expect(screen.getByText('Loading...')).toBeInTheDocument();
            // Pagination is hidden until the load settles.
            expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();

            await act(async () => {
                release(messagesResponse([messageItem()]));
            });

            await waitFor(() => expect(screen.getByTestId('pagination')).toBeInTheDocument());
        });
    });

    describe('rendering a message', () => {
        it('sanitises the html body before parsing it', async () => {
            clients.patternApproval.methods.getAppMessages.mockResolvedValue(
                messagesResponse([messageItem({ body: '<p>Safe body</p><script>evil()</script>' })]),
            );

            await renderRoute();

            await waitFor(() => expect(screen.getByText('Safe body')).toBeInTheDocument());
            expect(mocks.sanitiseHtml).toHaveBeenCalledWith('<p>Safe body</p><script>evil()</script>');
        });

        it('renders a non-string body directly without parsing', async () => {
            clients.patternApproval.methods.getAppMessages.mockResolvedValue(
                messagesResponse([messageItem({ body: undefined, subject: 'Empty body' })]),
            );

            await renderRoute();

            await waitFor(() => expect(screen.getByText('Empty body')).toBeInTheDocument());
            expect(mocks.sanitiseHtml).not.toHaveBeenCalled();
        });

        it('shows the sign-off only when the message carries one', async () => {
            clients.patternApproval.methods.getAppMessages.mockResolvedValue(
                messagesResponse([
                    messageItem({ id: 'with-footer', footer: 'The NMI team' }),
                    messageItem({ id: 'no-footer', subject: 'Terse', footer: '' }),
                ]),
            );

            await renderRoute();

            await waitFor(() => expect(screen.getByText('The NMI team')).toBeInTheDocument());
            expect(screen.getAllByText('Regards,')).toHaveLength(1);
        });

        it('uses the NMI avatar for NMI senders and the user avatar otherwise', async () => {
            clients.patternApproval.methods.getAppMessages.mockResolvedValue(
                messagesResponse([
                    messageItem({ id: 'from-nmi', avatar: 'NMI' }),
                    messageItem({ id: 'from-user', avatar: 'GM', subject: 'From the applicant' }),
                ]),
            );

            await renderRoute();

            await waitFor(() => expect(screen.getByText('NMI')).toBeInTheDocument());
            expect(screen.getByText('GM')).toBeInTheDocument();
        });

        it('marks read and unread messages differently', async () => {
            clients.patternApproval.methods.getAppMessages.mockImplementation(() => Promise.resolve(
                messagesResponse([
                    messageItem({ id: 'seen', messageRead: true }),
                    messageItem({ id: 'unseen', subject: 'Action required', messageRead: false }),
                ], { currentPage: 1 }),
            ));

            const { container } = await renderRoute();

            await waitFor(() => expect(screen.getByText('Action required')).toBeInTheDocument());
            expect(container.querySelectorAll('.read')).toHaveLength(1);
            expect(container.querySelectorAll('.unread')).toHaveLength(1);
        });

        it('falls back to placeholder initials when a sender has no avatar', async () => {
            clients.patternApproval.methods.getAppMessages.mockResolvedValue(
                messagesResponse([messageItem({ id: 'anon', avatar: undefined })]),
            );

            await renderRoute();

            // avatar is undefined, so the user branch renders and falls back to '?'.
            await waitFor(() => expect(screen.getByText('?')).toBeInTheDocument());
        });

        it('omits the timestamp when a message has never been sent', async () => {
            clients.patternApproval.methods.getAppMessages.mockResolvedValue(
                messagesResponse([messageItem({ messageSent: undefined, subject: 'Draft note' })]),
            );

            await renderRoute();

            await waitFor(() => expect(screen.getByText('Draft note')).toBeInTheDocument());
        });
    });

    describe('sending a message', () => {
        it('sanitises, submits and resets the editor', async () => {
            await renderRoute();
            await waitFor(() => expect(screen.getByTestId('slate-editor')).toBeInTheDocument());

            const rendersBefore = editor.renderCount;

            await act(async () => {
                editor.props.onSubmit();
            });

            await waitFor(() => expect(clients.patternApproval.methods.addAppMessage).toHaveBeenCalled());
            const [applicationId, html] = clients.patternApproval.methods.addAppMessage.mock.calls[0];
            expect(applicationId).toBe('APP-1');
            expect(mocks.sanitiseHtml).toHaveBeenCalledWith(html);
            // A changed key remounts Slate, which is how the composer is cleared.
            await waitFor(() => expect(editor.renderCount).toBeGreaterThan(rendersBefore));
        });

        it('refetches the first page after a successful send', async () => {
            await renderRoute();
            await waitFor(() => expect(screen.getByTestId('slate-editor')).toBeInTheDocument());

            const fetchesBefore = clients.patternApproval.methods.getAppMessages.mock.calls.length;

            await act(async () => {
                editor.props.onSubmit();
            });

            await waitFor(() => expect(
                clients.patternApproval.methods.getAppMessages.mock.calls.length,
            ).toBeGreaterThan(fetchesBefore));
        });

        it('logs a failed send without clearing what was typed', async () => {
            clients.patternApproval.methods.addAppMessage.mockRejectedValue(new Error('send failed'));

            await renderRoute();
            await waitFor(() => expect(screen.getByTestId('slate-editor')).toBeInTheDocument());

            await act(async () => {
                editor.props.onSubmit();
            });

            await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
                'Failed to submit application message',
                expect.any(Error),
                { Id: 'APP-1' },
            ));
        });

        it('does not send without a signed-in account', async () => {
            // Sign out before rendering. Signing out afterwards would not work: the handler closes
            // over `accounts` from its last render, and clearing the shared mock state does not
            // itself re-render the component.
            signOut();

            await renderRoute();
            await waitFor(() => expect(screen.getByTestId('slate-editor')).toBeInTheDocument());

            await act(async () => {
                editor.props.onSubmit();
            });

            expect(clients.patternApproval.methods.addAppMessage).not.toHaveBeenCalled();
        });
    });

    describe('filtering and paging', () => {
        it('refetches from page one when the view filter changes', async () => {
            const user = userEvent.setup();
            await renderRoute();
            await waitFor(() => expect(screen.getByText('Assessment update')).toBeInTheDocument());

            await user.selectOptions(
                screen.getByLabelText('Select your view'),
                FilterMessages.ShowNmiMessages,
            );

            await waitFor(() => expect(clients.patternApproval.methods.getAppMessages)
                .toHaveBeenLastCalledWith('APP-1', 10, 1, FilterMessages.ShowNmiMessages, 'APP-1'));
        });

        it('only ever sends a real FilterMessages member', async () => {
            // Regression guard. The options were valued '1'/'2'/'3' while FilterMessages members
            // are ShowAllMessages/ShowNmiMessages/ShowPortalMessages, and
            // `e.target.value as FilterMessages` cast the mismatch away - so every request after a
            // filter change sent a digit the API has no case for. The `as` was doing the lying;
            // the compiler could not see it. Selecting each option in turn proves the wire value
            // is always a member.
            const user = userEvent.setup();
            await renderRoute();
            await waitFor(() => expect(screen.getByText('Assessment update')).toBeInTheDocument());

            const select = screen.getByLabelText('Select your view');
            const members = Object.values(FilterMessages);

            for (const member of members) {
                // eslint-disable-next-line no-await-in-loop
                await user.selectOptions(select, member);
                // eslint-disable-next-line no-await-in-loop
                await waitFor(() => expect(clients.patternApproval.methods.getAppMessages)
                    .toHaveBeenLastCalledWith('APP-1', 10, 1, member, 'APP-1'));
            }

            for (const call of clients.patternApproval.methods.getAppMessages.mock.calls) {
                expect(members).toContain(call[3]);
            }
        });

        it('starts on a view the select can actually show', async () => {
            // The initial state is ShowAllMessages. While the options were valued '1'/'2'/'3' no
            // option matched it, so the control displayed a selection the component did not hold.
            await renderRoute();
            await waitFor(() => expect(screen.getByText('Assessment update')).toBeInTheDocument());

            expect(screen.getByLabelText('Select your view')).toHaveValue(
                FilterMessages.ShowAllMessages,
            );
        });

        it('fetches the requested page and scrolls back to the heading', async () => {
            const user = userEvent.setup();
            const scrollIntoView = vi.fn();
            const heading = document.createElement('div');
            heading.id = 'dash-type-title';
            heading.scrollIntoView = scrollIntoView;
            document.body.append(heading);

            await renderRoute();
            await waitFor(() => expect(screen.getByTestId('pagination')).toBeInTheDocument());

            await user.click(screen.getByTestId('pagination'));

            await waitFor(() => expect(clients.patternApproval.methods.getAppMessages)
                .toHaveBeenLastCalledWith('APP-1', 10, 2, FilterMessages.ShowAllMessages, 'APP-1'));
            expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
        });

        it('still pages when the scroll target is absent', async () => {
            const user = userEvent.setup();
            // No #dash-type-title in the document - the optional chain must absorb it.
            await renderRoute();
            await waitFor(() => expect(screen.getByTestId('pagination')).toBeInTheDocument());

            await user.click(screen.getByTestId('pagination'));

            await waitFor(() => expect(clients.patternApproval.methods.getAppMessages)
                .toHaveBeenLastCalledWith('APP-1', 10, 2, FilterMessages.ShowAllMessages, 'APP-1'));
        });
    });
});
