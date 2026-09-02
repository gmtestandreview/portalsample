import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps, ReactNode } from 'react';
import type * as ReactBootstrap from 'react-bootstrap';
import type * as WebApiClient from '../../../../ClientApp/src/api/web-api-client';

import { resetMsalMock, signOut, DEFAULT_ACCESS_TOKEN } from '../../helpers/mockMsal';
import type { ClientMock, ClientMethodMocks } from '../../helpers/mockApiClient';
import { renderWithRouter } from '../../helpers/renderWithRouter';

const mocks = vi.hoisted(() => ({
    loadStepValues: vi.fn(),
    hidingFields: vi.fn(),
    appLoggerError: vi.fn(),
}));

const clients = vi.hoisted(() => ({
    patternApproval: undefined as unknown as ClientMock<ClientMethodMocks>,
}));

/** Captures the inert callbacks the page hands its children, so they can be proven inert. */
const captured = vi.hoisted(() => ({
    formSubmit: undefined as unknown as () => Promise<unknown>,
    docsProps: undefined as unknown as {
        onUploadAttachment: () => Promise<unknown>;
        attachment: { onUploadFiles: () => Promise<unknown> };
    },
    selectTab: undefined as unknown as (key: string | null) => void,
}));

vi.mock('@azure/msal-react', async () => {
    const { msalReactModuleMock } = await import('../../helpers/mockMsal');

    return msalReactModuleMock();
});

vi.mock('../../../../ClientApp/src/api/web-api-client', async (importOriginal) => {
    const { createClientMockFor, webApiClientModuleMock } = await import('../../helpers/mockApiClient');
    const original = await importOriginal<typeof WebApiClient>();

    clients.patternApproval = createClientMockFor('getAppMessageCount');

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

vi.mock('../../../../ClientApp/src/routes/ta/manage/appDetailsProps', () => ({
    default: () => ({ loadStepValues: mocks.loadStepValues, hidingFields: mocks.hidingFields }),
}));

/** FormikForm hands its children a formik bag; only `values` is read here. */
vi.mock('../../../../ClientApp/src/components/forms/FormikForm', () => ({
    default: ({ initialValues, onSubmit, children }: {
        initialValues: unknown;
        onSubmit: () => Promise<unknown>;
        children: (formik: { values: unknown }) => ReactNode;
    }) => {
        captured.formSubmit = onSubmit;

        // Passed through unchanged rather than defaulted to {}: appDetails is null until the load
        // resolves, and the page's own null guards exist for exactly that first render.
        return <div data-testid="formik-form">{children({ values: initialValues })}</div>;
    },
}));

vi.mock('../../../../ClientApp/src/components/Accordion', () => ({
    CustomAccordion: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    CustomAccordionBody: ({ name, nameRHS, children }: {
        name: string;
        nameRHS?: ReactNode;
        children: ReactNode;
    }) => (
        <section aria-label={name}>
            <h3>{name}</h3>
            {nameRHS}
            {children}
        </section>
    ),
}));

vi.mock('../../../../ClientApp/src/components/Breadcrumb', () => ({
    default: ({ breadcrumbs }: { breadcrumbs: { text: string }[] }) => (
        <nav data-testid="breadcrumb">{breadcrumbs.map((b) => b.text).join(' / ')}</nav>
    ),
}));

vi.mock('../../../../ClientApp/src/components/Pill/StatusPill', () => ({
    default: ({ status }: { status: string }) => <span data-testid="status-pill">{status}</span>,
}));

vi.mock('../../../../ClientApp/src/components/Buttons/BackToDashboardButton', () => ({
    default: () => <a href="/dashboard">Back to dashboard</a>,
}));

vi.mock('../../../../ClientApp/src/routes/ta/organisationAndContact', () => ({
    default: () => <div data-testid="organisation-and-contact" />,
}));

vi.mock('../../../../ClientApp/src/routes/ta/applicationAndInstrument', () => ({
    default: () => <div data-testid="application-and-instrument" />,
}));

vi.mock('../../../../ClientApp/src/routes/ta/supportingDocuments', () => ({
    default: (props: typeof captured.docsProps) => {
        captured.docsProps = props;

        return <div data-testid="supporting-documents" />;
    },
}));

// Everything real except a hook onto Tab.Container's onSelect, so the guard that rejects an unknown
// tab key can be exercised. React-Bootstrap only ever hands it the keys its own Nav.Links carry.
vi.mock('react-bootstrap', async (importOriginal) => {
    const actual = await importOriginal<typeof ReactBootstrap>();
    const RealContainer = actual.Tab.Container;

    const Container = (props: ComponentProps<typeof RealContainer>) => {
        captured.selectTab = props.onSelect as (key: string | null) => void;

        return <RealContainer {...props} />;
    };

    // Tab is a component with statics, so its members are copied rather than spread.
    return { ...actual, Tab: Object.assign({}, actual.Tab, { Container }) };
});

vi.mock('../../../../ClientApp/src/routes/ta/manage/appDocuments', () => ({
    default: () => <div data-testid="application-documents" />,
}));

vi.mock('../../../../ClientApp/src/routes/ta/manage/appMessages', () => ({
    default: () => <div data-testid="application-messages" />,
}));

const auDate = (iso: string) => new Date(iso).toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
});

const applicationDetails = (overrides: Record<string, unknown> = {}) => ({
    referenceId: 'PA-001',
    title: 'Balance pattern approval',
    patternApprovalType: 'New certificate',
    status: 'InProgress',
    statusDetail: 'With the assessor',
    assessedAs: 'Non-automatic weighing instrument',
    lastUpdated: '2026-06-11T00:00:00.000Z',
    submittedDate: '2026-06-01T00:00:00.000Z',
    messageCount: 0,
    ...overrides,
});

const stepValues = (details: Record<string, unknown> = {}) => ({
    formValues: { applicationDetails: applicationDetails(details) },
});

/**
 * The tab is read from `globalThis.location.search`, not from the router, so the query has to be on
 * the real jsdom URL. A memory router's location is invisible to this component.
 */
const renderDetails = async (search = '') => {
    const ApplicationDetails = (await import('../../../../ClientApp/src/routes/ta/manage/appDetails')).default;

    globalThis.history.pushState({}, '', `/ta/manage/APP-1${search}`);

    const result = renderWithRouter(<ApplicationDetails />, {
        path: '/ta/manage/:id',
        initialPath: `/ta/manage/APP-1${search}`,
    });

    await act(async () => {
        await Promise.resolve();
    });

    return result;
};

describe('application details', () => {
    beforeEach(async () => {
        await import('../../../../ClientApp/src/api/web-api-client');

        resetMsalMock();
        mocks.loadStepValues.mockReset().mockResolvedValue(stepValues());
        mocks.hidingFields.mockReset();
        mocks.appLoggerError.mockReset();
        clients.patternApproval.setAuthToken.mockReset();
        clients.patternApproval.methods.getAppMessageCount.mockReset().mockResolvedValue(0);

        // jsdom implements neither, and both are called on the documents shortcut.
        vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => undefined);
        globalThis.history.pushState({}, '', '/ta/manage/APP-1');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('loading the application', () => {
        it('renders the application title and breadcrumb once loaded', async () => {
            await renderDetails();

            await waitFor(() => expect(
                screen.getByRole('heading', { level: 1 }),
            ).toHaveTextContent('Balance pattern approval'));
            expect(screen.getByTestId('breadcrumb')).toHaveTextContent('New certificate (APP-1)');
        });

        it('falls back to a generic heading when the application has no title', async () => {
            mocks.loadStepValues.mockResolvedValue(stepValues({ title: undefined }));

            await renderDetails();

            await waitFor(() => expect(
                screen.getByRole('heading', { level: 1 }),
            ).toHaveTextContent('Application details'));
        });

        it('shows the status, dates and assessment on the details tab', async () => {
            await renderDetails();

            await waitFor(() => expect(screen.getByText('With the assessor')).toBeInTheDocument());
            expect(screen.getByText('Non-automatic weighing instrument')).toBeInTheDocument();
            // Formatted for en-AU rather than shown as raw ISO. The expected string is derived the
            // same way the component derives it, because the result is timezone-dependent and
            // hard-coding it would make this a tripwire in any zone but the author's.
            expect(screen.getByText(auDate('2026-06-11T00:00:00.000Z'))).toBeInTheDocument();
            expect(screen.getByText(auDate('2026-06-01T00:00:00.000Z'))).toBeInTheDocument();
            expect(screen.queryByText('2026-06-11T00:00:00.000Z')).not.toBeInTheDocument();
        });

        it('leaves the date blank when the application has none', async () => {
            mocks.loadStepValues.mockResolvedValue(
                stepValues({ lastUpdated: undefined, submittedDate: undefined }),
            );

            await renderDetails();

            await waitFor(() => expect(screen.getByText('With the assessor')).toBeInTheDocument());
            expect(screen.queryByText(auDate('2026-06-11T00:00:00.000Z'))).not.toBeInTheDocument();
        });

        it('records no application type when the response omits one', async () => {
            mocks.loadStepValues.mockResolvedValue(stepValues({ patternApprovalType: undefined }));

            await renderDetails();

            await waitFor(() => expect(screen.getByTestId('breadcrumb')).toHaveTextContent('null (APP-1)'));
        });
    });

    describe('the unread message count', () => {
        it('polls the count and shows it as a badge', async () => {
            clients.patternApproval.methods.getAppMessageCount.mockResolvedValue(4);

            await renderDetails();

            await waitFor(() => expect(clients.patternApproval.methods.getAppMessageCount)
                .toHaveBeenCalledWith('APP-1', 'APP-1', undefined));
            expect(clients.patternApproval.setAuthToken).toHaveBeenCalledWith(DEFAULT_ACCESS_TOKEN);
            await waitFor(() => expect(screen.getByText('4')).toBeInTheDocument());
        });

        it('shows no badge when nothing is unread', async () => {
            await renderDetails();

            await waitFor(() => expect(clients.patternApproval.methods.getAppMessageCount).toHaveBeenCalled());
            expect(screen.getByRole('button', { name: /Messages/ })).toBeInTheDocument();
            expect(screen.queryByText('unread')).not.toBeInTheDocument();
        });

        it('treats a missing count as zero', async () => {
            clients.patternApproval.methods.getAppMessageCount.mockResolvedValue(undefined);

            await renderDetails();

            await waitFor(() => expect(clients.patternApproval.methods.getAppMessageCount).toHaveBeenCalled());
            expect(screen.queryByText('unread')).not.toBeInTheDocument();
        });

        it('swallows a failed count rather than breaking the page', async () => {
            clients.patternApproval.methods.getAppMessageCount.mockRejectedValue(new Error('count down'));

            await renderDetails();

            await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
            expect(screen.getByTestId('formik-form')).toBeInTheDocument();
        });

        it('does not poll without a signed-in account', async () => {
            signOut();

            await renderDetails();

            await waitFor(() => expect(screen.getByTestId('formik-form')).toBeInTheDocument());
            expect(clients.patternApproval.methods.getAppMessageCount).not.toHaveBeenCalled();
        });

        it('does not poll without an application id', async () => {
            const ApplicationDetails = (await import('../../../../ClientApp/src/routes/ta/manage/appDetails')).default;

            renderWithRouter(<ApplicationDetails />, {
                path: '/ta/manage',
                initialPath: '/ta/manage',
            });
            await act(async () => {
                await Promise.resolve();
            });

            expect(clients.patternApproval.methods.getAppMessageCount).not.toHaveBeenCalled();
        });

        it('stops polling once the page is unmounted', async () => {
            const { unmount } = await renderDetails();

            await waitFor(() => expect(clients.patternApproval.methods.getAppMessageCount).toHaveBeenCalled());
            const callsAtUnmount = clients.patternApproval.methods.getAppMessageCount.mock.calls.length;

            unmount();
            await act(async () => {
                await Promise.resolve();
            });

            expect(clients.patternApproval.methods.getAppMessageCount)
                .toHaveBeenCalledTimes(callsAtUnmount);
        });
    });

    describe('choosing a tab', () => {
        it('opens on the details tab by default', async () => {
            await renderDetails();

            await waitFor(() => expect(screen.getByText('With the assessor')).toBeInTheDocument());
            // Messages mount lazily, so nothing is there until the tab is opened.
            expect(screen.queryByTestId('application-messages')).not.toBeInTheDocument();
        });

        it('opens straight onto messages when the url asks for it', async () => {
            await renderDetails('?tab=messages');

            await waitFor(() => expect(screen.getByTestId('application-messages')).toBeInTheDocument());
        });

        it('ignores a tab the page does not have', async () => {
            await renderDetails('?tab=nonsense');

            await waitFor(() => expect(screen.getByText('With the assessor')).toBeInTheDocument());
            expect(screen.queryByTestId('application-messages')).not.toBeInTheDocument();
        });

        it('mounts messages and records the tab in the url when selected', async () => {
            const user = userEvent.setup();
            await renderDetails();
            await waitFor(() => expect(screen.getByText('With the assessor')).toBeInTheDocument());

            await user.click(screen.getByRole('tab', { name: 'Messages' }));

            await waitFor(() => expect(screen.getByTestId('application-messages')).toBeInTheDocument());
            expect(globalThis.location.search).toContain('tab=messages');
        });

        it('follows the messages shortcut on the status panel', async () => {
            const user = userEvent.setup();
            await renderDetails();
            await waitFor(() => expect(screen.getByText('With the assessor')).toBeInTheDocument());

            await user.click(screen.getByRole('button', { name: /Messages/ }));

            await waitFor(() => expect(screen.getByTestId('application-messages')).toBeInTheDocument());
        });

        it('jumps to the documents tab from the supporting documents shortcut', async () => {
            const user = userEvent.setup();
            await renderDetails();
            await waitFor(() => expect(screen.getByText('With the assessor')).toBeInTheDocument());

            await user.click(screen.getByRole('button', { name: 'View documents' }));

            await waitFor(() => expect(globalThis.location.search).toContain('tab=documents'));
            expect(globalThis.scrollTo).toHaveBeenCalledWith(0, 0);
        });

        it('jumps to the documents tab from the keyboard', async () => {
            const user = userEvent.setup();
            await renderDetails();
            await waitFor(() => expect(screen.getByText('With the assessor')).toBeInTheDocument());

            const shortcut = screen.getByRole('button', { name: 'View documents' });
            shortcut.focus();
            await user.keyboard('{Enter}');

            await waitFor(() => expect(globalThis.location.search).toContain('tab=documents'));
        });

        it('also takes the space bar on the documents shortcut', async () => {
            const user = userEvent.setup();
            await renderDetails();
            await waitFor(() => expect(screen.getByText('With the assessor')).toBeInTheDocument());

            const shortcut = screen.getByRole('button', { name: 'View documents' });
            shortcut.focus();
            await user.keyboard(' ');

            await waitFor(() => expect(globalThis.location.search).toContain('tab=documents'));
        });

        it('ignores other keys on the documents shortcut', async () => {
            const user = userEvent.setup();
            await renderDetails();
            await waitFor(() => expect(screen.getByText('With the assessor')).toBeInTheDocument());

            const shortcut = screen.getByRole('button', { name: 'View documents' });
            shortcut.focus();
            await user.keyboard('{Escape}');

            expect(globalThis.location.search).not.toContain('tab=documents');
        });

        it('follows the browser back button between tabs', async () => {
            const user = userEvent.setup();
            await renderDetails();
            await waitFor(() => expect(screen.getByText('With the assessor')).toBeInTheDocument());

            await user.click(screen.getByRole('tab', { name: 'Messages' }));
            await waitFor(() => expect(screen.getByTestId('application-messages')).toBeInTheDocument());

            // Rewind the url the way a back navigation does, then announce it.
            await act(async () => {
                globalThis.history.pushState({}, '', '/ta/manage/APP-1?tab=details');
                globalThis.dispatchEvent(new PopStateEvent('popstate'));
            });

            await waitFor(() => expect(screen.getByText('With the assessor')).toBeInTheDocument());
        });
    });

    describe('when the application will not load', () => {
        it('logs the failure and stops the spinner instead of hanging on it', async () => {
            mocks.loadStepValues.mockRejectedValue(new Error('details unavailable'));

            await renderDetails();

            await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
                'Failed to load application details',
                expect.any(Error),
                { Id: 'APP-1' },
            ));
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        it('copes with a response that carries no application details', async () => {
            mocks.loadStepValues.mockResolvedValue({ formValues: {} });

            await renderDetails();

            // No type recorded, and the details panel renders from an empty set rather than
            // throwing on the way in.
            await waitFor(() => expect(screen.getByTestId('breadcrumb')).toHaveTextContent('null (APP-1)'));
            expect(screen.getByTestId('formik-form')).toBeInTheDocument();
        });

        it('shows the details spinner while switching to another application', async () => {
            const { router } = await renderDetails();
            await waitFor(() => expect(screen.getByText('With the assessor')).toBeInTheDocument());

            let release: (value: unknown) => void = () => undefined;
            mocks.loadStepValues.mockReturnValue(new Promise((resolve) => {
                release = resolve;
            }));

            // A second load with details already on screen is the only way the panel's own spinner
            // is reached - the first load happens while there is nothing to show yet.
            await act(async () => {
                await router.navigate('/ta/manage/APP-2');
            });

            // Both the details and timeline panes carry this spinner, and react-bootstrap keeps
            // inactive panes mounted, so more than one is on the page.
            expect(screen.getAllByText('Loading data...').length).toBeGreaterThan(0);

            await act(async () => {
                release(stepValues());
            });
        });
    });

    describe('guards and inert wiring', () => {
        it('ignores a tab key the page does not know', async () => {
            await renderDetails();
            await waitFor(() => expect(screen.getByText('With the assessor')).toBeInTheDocument());

            await act(async () => {
                captured.selectTab('not-a-tab');
            });
            await act(async () => {
                captured.selectTab(null);
            });

            // Still on details, and nothing written to the url.
            expect(screen.getByText('With the assessor')).toBeInTheDocument();
            expect(globalThis.location.search).not.toContain('not-a-tab');
        });

        it('forces a refresh when the messages tab is chosen again', async () => {
            const user = userEvent.setup();
            await renderDetails();
            await waitFor(() => expect(screen.getByText('With the assessor')).toBeInTheDocument());

            const messagesTab = screen.getByRole('tab', { name: 'Messages' });
            await user.click(messagesTab);
            await waitFor(() => expect(screen.getByTestId('application-messages')).toBeInTheDocument());

            // Clicking the tab you are already on remounts the list rather than doing nothing.
            await user.click(messagesTab);

            await waitFor(() => expect(screen.getByTestId('application-messages')).toBeInTheDocument());
        });

        it('leaves messages unmounted when another tab is chosen', async () => {
            const user = userEvent.setup();
            await renderDetails();
            await waitFor(() => expect(screen.getByText('With the assessor')).toBeInTheDocument());

            await user.click(screen.getByRole('tab', { name: 'Documents' }));

            await waitFor(() => expect(globalThis.location.search).toContain('tab=documents'));
            expect(screen.queryByTestId('application-messages')).not.toBeInTheDocument();
        });

        it('drops a message count that arrives after the page is gone', async () => {
            let releaseCount: (value: number) => void = () => undefined;
            clients.patternApproval.methods.getAppMessageCount.mockReturnValue(
                new Promise<number>((resolve) => {
                    releaseCount = resolve;
                }),
            );

            const { unmount } = await renderDetails();
            await waitFor(() => expect(clients.patternApproval.methods.getAppMessageCount).toHaveBeenCalled());

            unmount();
            await act(async () => {
                releaseCount(7);
            });

            // Resolving into a disposed page must neither set state nor schedule the next poll.
            const callsAfterUnmount = clients.patternApproval.methods.getAppMessageCount.mock.calls.length;
            await act(async () => {
                await Promise.resolve();
            });
            expect(clients.patternApproval.methods.getAppMessageCount)
                .toHaveBeenCalledTimes(callsAfterUnmount);
        });

        it('hands the summary an upload pair that does nothing', async () => {
            // The details page shows documents read-only, so both upload hooks are deliberate
            // no-ops. Pinning them means a change that starts relying on either one fails here.
            await renderDetails();
            await waitFor(() => expect(screen.getByTestId('supporting-documents')).toBeInTheDocument());

            await expect(captured.docsProps.onUploadAttachment()).resolves.toEqual([]);
            await expect(captured.docsProps.attachment.onUploadFiles()).resolves.toEqual([]);
        });

        it('has nothing to submit', async () => {
            // A summary page: the form exists to display values, not to save them.
            await renderDetails();

            await expect(captured.formSubmit()).resolves.toBeUndefined();
        });
    });

    describe('the summary accordions', () => {
        it('embeds the organisation, application and document summaries', async () => {
            await renderDetails();

            await waitFor(() => expect(screen.getByTestId('organisation-and-contact')).toBeInTheDocument());
            expect(screen.getByTestId('application-and-instrument')).toBeInTheDocument();
            expect(screen.getByTestId('supporting-documents')).toBeInTheDocument();
        });

        it('shows the application status pill', async () => {
            await renderDetails();

            await waitFor(() => expect(screen.getAllByTestId('status-pill').length).toBeGreaterThan(0));
            expect(within(screen.getAllByTestId('status-pill')[0]).getByText('InProgress')).toBeInTheDocument();
        });
    });
});
