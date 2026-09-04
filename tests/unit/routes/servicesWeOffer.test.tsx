import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceType } from '../../../ClientApp/src/api/web-api-client';
import type { ServiceDto, ServicesOffered } from '../../../ClientApp/src/api/web-api-client';
import type * as WebApiClient from '../../../ClientApp/src/api/web-api-client';

import {
    DEFAULT_ACCESS_TOKEN,
    msalMocks,
    pendingToken,
    rejectToken,
    resetMsalMock,
    signOut,
    testAccount,
} from '../helpers/mockMsal';
import type { ClientMock, ClientMethodMocks } from '../helpers/mockApiClient';
import { renderWithRouter } from '../helpers/renderWithRouter';

const mocks = vi.hoisted(() => ({
    accountContext: vi.fn(),
    setUserProfile: vi.fn(),
    appLoggerError: vi.fn(),
    appLoggerInfo: vi.fn(),
}));

/** Filled in by the module-mock factory below, so the test can drive the same client instance. */
const clients = vi.hoisted(() => ({
    lookup: undefined as unknown as ClientMock<ClientMethodMocks>,
}));

vi.mock('@azure/msal-react', async () => {
    const { msalReactModuleMock } = await import('../helpers/mockMsal');

    return msalReactModuleMock();
});

vi.mock('../../../ClientApp/src/api/web-api-client', async (importOriginal) => {
    const { createClientMockFor, webApiClientModuleMock } = await import('../helpers/mockApiClient');
    const original = await importOriginal<typeof WebApiClient>();

    clients.lookup = createClientMockFor('getServices');

    // Spreading the original keeps ServiceType a real enum. The component compares
    // `originalDefaultService === ServiceType.TestingCalibration`, so an undefined enum would send
    // every branch down the default arm and the redirect tests would pass for the wrong reason.
    return webApiClientModuleMock(original, { LookupClient: clients.lookup });
});

vi.mock('../../../ClientApp/src/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['api://services/.default'] },
}));

vi.mock('../../../ClientApp/src/authentication/hooks', () => ({
    default: () => mocks.accountContext(),
    useAccountDispatch: () => ({ setUserProfile: mocks.setUserProfile }),
}));

vi.mock('../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: { error: mocks.appLoggerError, info: mocks.appLoggerInfo },
}));

const serviceDtos: ServiceDto[] = [
    {
        serviceType: ServiceType.TestingCalibration,
        title: 'Testing and calibration',
        description: 'Calibration of measuring instruments',
        icon: 'icon-calibration',
        meta: 'Most common',
    },
    {
        serviceType: ServiceType.PatternApproval,
        title: 'Pattern approval',
        description: 'Type approval of instrument patterns',
        icon: 'icon-approval',
        meta: 'Regulated',
    },
];

const accountWith = (services?: ServicesOffered[]) => ({
    details: { userProfile: { email: 'tester@example.gov.au', services } },
});

const renderRoute = async (path = '/services-we-offer') => {
    const ServicesWeOffer = (await import('../../../ClientApp/src/routes/services-we-offer')).default;

    const result = renderWithRouter(<ServicesWeOffer />, {
        path: '/services-we-offer',
        initialPath: path,
        extraRoutes: [
            { path: '/dashboard', element: <div data-testid="dashboard" /> },
            { path: '/dashboard-ta', element: <div data-testid="dashboard-ta" /> },
        ],
    });

    // The load effect writes state in three waves - two flags before the request, one per matched
    // service after it, then two more in `finally`. A `waitFor` on rendered text resolves during the
    // middle wave, so the `finally` writes land after the assertion and outside any act scope, which
    // is what the act(...) warning reports. Flushing here lets the whole chain settle inside act.
    // This is owning the updates rather than silencing the warning: nothing is suppressed, and a
    // test still fails if the state it asserts never arrives.
    await act(async () => {
        await Promise.resolve();
    });

    return result;
};

/** Both services present and active, neither default - the state that renders the selector. */
const noDefaultYet: ServicesOffered[] = [
    { service: ServiceType.TestingCalibration, isActive: true, isDefault: false },
    { service: ServiceType.PatternApproval, isActive: false, isDefault: false },
];

describe('services we offer', () => {
    beforeEach(() => {
        resetMsalMock();
        mocks.accountContext.mockReset();
        mocks.setUserProfile.mockReset().mockResolvedValue(true);
        mocks.appLoggerError.mockReset();
        mocks.appLoggerInfo.mockReset();
        clients.lookup.setAuthToken.mockReset();
        clients.lookup.methods.getServices.mockReset().mockResolvedValue(serviceDtos);
        mocks.accountContext.mockReturnValue(accountWith(noDefaultYet));
    });

    describe('loading services', () => {
        it('acquires a token and renders every service returned', async () => {
            await renderRoute();

            await waitFor(() => expect(screen.getByText('Testing and calibration')).toBeInTheDocument());

            expect(msalMocks.acquireTokenSilent).toHaveBeenCalledWith({
                scopes: ['api://services/.default'],
                account: testAccount,
            });
            expect(clients.lookup.setAuthToken).toHaveBeenCalledWith(DEFAULT_ACCESS_TOKEN);
            expect(screen.getByText('Pattern approval')).toBeInTheDocument();
        });

        it('hydrates the checkboxes from the stored profile', async () => {
            await renderRoute();

            await waitFor(() => expect(screen.getByText('Testing and calibration')).toBeInTheDocument());

            const [testing, pattern] = screen.getAllByRole('checkbox', { hidden: true });
            expect(testing).toBeChecked();
            expect(pattern).not.toBeChecked();
        });

        it('marks the stored default service as the selected radio', async () => {
            mocks.accountContext.mockReturnValue(
                accountWith([
                    { service: ServiceType.PatternApproval, isActive: true, isDefault: true },
                ]),
            );

            await renderRoute('/services-we-offer?mode=manage');

            await waitFor(() => expect(screen.getByText('Pattern approval')).toBeInTheDocument());
            const [testingRadio, patternRadio] = screen.getAllByRole('radio', { hidden: true });
            expect(patternRadio).toBeChecked();
            expect(testingRadio).not.toBeChecked();
        });

        it('shows a loading state while the services request is in flight', async () => {
            let releaseServices: (value: ServiceDto[]) => void = () => undefined;
            clients.lookup.methods.getServices.mockReturnValue(
                new Promise<ServiceDto[]>((resolve) => {
                    releaseServices = resolve;
                }),
            );

            await renderRoute();

            await waitFor(() => expect(screen.getByText('Loading data...')).toBeInTheDocument());

            releaseServices(serviceDtos);

            await waitFor(() => expect(screen.getByText('Testing and calibration')).toBeInTheDocument());
            expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
        });

        it('shows a loading state while the token is still pending', async () => {
            // Regression guard. `setIsDataLoading(true)` used to run AFTER
            // `await acquireTokenSilent`, so for the whole token round trip the user was shown the
            // selector with an empty service list and no indication anything was happening - which
            // reads as "this account has no services" rather than "still loading".
            pendingToken();

            await renderRoute();

            await waitFor(() => expect(msalMocks.acquireTokenSilent).toHaveBeenCalled());
            expect(screen.getByText('Loading data...')).toBeInTheDocument();
            expect(screen.queryByText('Testing and calibration')).not.toBeInTheDocument();
        });

        it('logs and stops loading when the lookup fails', async () => {
            clients.lookup.methods.getServices.mockRejectedValue(new Error('lookup down'));

            await renderRoute();

            await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
                'Failed to retrieve service look ups',
                expect.any(Error),
            ));
            expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
        });

        it('logs when the token itself is rejected', async () => {
            rejectToken(new Error('interaction_required'));

            await renderRoute();

            await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
                'Failed to retrieve service look ups',
                expect.any(Error),
            ));
            expect(clients.lookup.methods.getServices).not.toHaveBeenCalled();
        });

        it('does not call the lookup when no account is signed in', async () => {
            signOut();

            await renderRoute('/services-we-offer?mode=manage');

            // "Services we offer" is both the page heading and a breadcrumb, so match the heading.
            await waitFor(() => expect(
                screen.getByRole('heading', { name: 'Services we offer', level: 1 }),
            ).toBeInTheDocument());
            expect(msalMocks.acquireTokenSilent).not.toHaveBeenCalled();
            expect(clients.lookup.methods.getServices).not.toHaveBeenCalled();
        });

        it('leaves a service unticked when the profile has no entry for it', async () => {
            // The lookup is the source of which services exist; the profile only says which ones
            // this account holds. A service present in one and absent from the other must not throw
            // or tick itself on.
            mocks.accountContext.mockReturnValue(
                accountWith([
                    { service: ServiceType.TestingCalibration, isActive: true, isDefault: false },
                ]),
            );

            await renderRoute();

            await waitFor(() => expect(screen.getByText('Pattern approval')).toBeInTheDocument());
            const [testing, pattern] = screen.getAllByRole('checkbox', { hidden: true });
            expect(testing).toBeChecked();
            expect(pattern).not.toBeChecked();
        });

        it('renders the lookup services when the profile carries no services list at all', async () => {
            // A profile that exists but has never been given a services array. Manage mode is what
            // gets past the pre-render gate, so the effect still runs and has to cope with the
            // list being absent rather than merely empty.
            mocks.accountContext.mockReturnValue(accountWith(undefined));

            await renderRoute('/services-we-offer?mode=manage');

            await waitFor(() => expect(screen.getByText('Testing and calibration')).toBeInTheDocument());
            const checkboxes = screen.getAllByRole('checkbox', { hidden: true });
            expect(checkboxes).toHaveLength(2);
            for (const checkbox of checkboxes) {
                expect(checkbox).not.toBeChecked();
            }
        });

        it('waits on a spinner until assigned services are known', async () => {
            mocks.accountContext.mockReturnValue({ details: undefined });

            await renderRoute();

            expect(screen.getByText('Checking assigned services...')).toBeInTheDocument();
            expect(clients.lookup.methods.getServices).not.toHaveBeenCalled();
        });
    });

    describe('redirecting an account that already chose a default', () => {
        it('sends a testing and calibration user to the main dashboard', async () => {
            mocks.accountContext.mockReturnValue(
                accountWith([
                    { service: ServiceType.TestingCalibration, isActive: true, isDefault: true },
                ]),
            );

            const { currentPath } = await renderRoute();

            await waitFor(() => expect(currentPath()).toBe('/dashboard'));
        });

        it('sends a pattern approval user to the type approval dashboard', async () => {
            mocks.accountContext.mockReturnValue(
                accountWith([
                    { service: ServiceType.PatternApproval, isActive: true, isDefault: true },
                ]),
            );

            const { currentPath } = await renderRoute();

            await waitFor(() => expect(currentPath()).toBe('/dashboard-ta'));
        });

        it('falls back to the services page for a default service it does not recognise', async () => {
            // The API can return a service the client build predates. The switch has a default arm
            // for exactly that, and without it the user would be stranded on a blank page.
            mocks.accountContext.mockReturnValue(
                accountWith([
                    { service: 'Unknown' as ServiceType, isActive: true, isDefault: true },
                ]),
            );

            const { currentPath } = await renderRoute();

            await waitFor(() => expect(currentPath()).toBe('/services-we-offer'));
            // shouldRedirect makes the component render null, so the heading proves which arm ran.
            expect(screen.queryByRole('heading', { name: 'Services we offer', level: 1 })).toBeNull();
        });

        it('stays on the page in manage mode even with a default already set', async () => {
            mocks.accountContext.mockReturnValue(
                accountWith([
                    { service: ServiceType.TestingCalibration, isActive: true, isDefault: true },
                ]),
            );

            const { currentPath } = await renderRoute('/services-we-offer?mode=manage');

            await waitFor(() => expect(screen.getByText('Testing and calibration')).toBeInTheDocument());
            expect(currentPath()).toBe('/services-we-offer');
        });
    });

    describe('choosing services', () => {
        it('ticks the matching checkbox when a service is set as default', async () => {
            const user = userEvent.setup();
            await renderRoute();

            await waitFor(() => expect(screen.getByText('Pattern approval')).toBeInTheDocument());
            const [, patternRadio] = screen.getAllByRole('radio', { hidden: true });
            const [, patternCheckbox] = screen.getAllByRole('checkbox', { hidden: true });

            expect(patternCheckbox).not.toBeChecked();

            await user.click(patternRadio);

            expect(patternRadio).toBeChecked();
            // Choosing a default implies adding the service - the radio must not leave the account
            // with a default it has not actually selected.
            expect(patternCheckbox).toBeChecked();
        });

        it('clears the default when its own checkbox is unticked', async () => {
            const user = userEvent.setup();
            await renderRoute();

            await waitFor(() => expect(screen.getByText('Pattern approval')).toBeInTheDocument());
            const [, patternRadio] = screen.getAllByRole('radio', { hidden: true });
            const [, patternCheckbox] = screen.getAllByRole('checkbox', { hidden: true });

            await user.click(patternRadio);
            expect(patternRadio).toBeChecked();

            await user.click(patternCheckbox);

            expect(patternCheckbox).not.toBeChecked();
            expect(patternRadio).not.toBeChecked();
        });

        it('leaves the default alone when a different service is unticked', async () => {
            const user = userEvent.setup();
            await renderRoute();

            await waitFor(() => expect(screen.getByText('Testing and calibration')).toBeInTheDocument());
            const [testingCheckbox] = screen.getAllByRole('checkbox', { hidden: true });
            const [testingRadio] = screen.getAllByRole('radio', { hidden: true });

            // No default is set, so unticking must take the "not the default" arm and leave the
            // radio state untouched rather than clearing a default that was never chosen.
            expect(testingCheckbox).toBeChecked();
            expect(testingRadio).not.toBeChecked();

            await user.click(testingCheckbox);

            expect(testingCheckbox).not.toBeChecked();
            expect(testingRadio).not.toBeChecked();
        });
    });

    describe('saving', () => {
        it('refuses to save with no service selected at all', async () => {
            const user = userEvent.setup();
            mocks.accountContext.mockReturnValue(
                accountWith([
                    { service: ServiceType.TestingCalibration, isActive: false, isDefault: false },
                    { service: ServiceType.PatternApproval, isActive: false, isDefault: false },
                ]),
            );

            await renderRoute();
            await waitFor(() => expect(screen.getByText('Testing and calibration')).toBeInTheDocument());

            await user.click(screen.getByTestId('save-button'));

            expect(screen.getByTestId('form-error-summary')).toBeInTheDocument();
            expect(mocks.setUserProfile).not.toHaveBeenCalled();
        });

        it('refuses to save a ticked service with no default chosen', async () => {
            const user = userEvent.setup();
            await renderRoute();

            await waitFor(() => expect(screen.getByText('Testing and calibration')).toBeInTheDocument());

            // The first service is active from the stored profile, so checkedCount is 1 while
            // defaultService is still undefined - the second of the two guards.
            await user.click(screen.getByTestId('save-button'));

            expect(screen.getByTestId('form-error-summary')).toBeInTheDocument();
            expect(mocks.setUserProfile).not.toHaveBeenCalled();
        });

        it('saves the selection and routes to the chosen dashboard', async () => {
            const user = userEvent.setup();
            const { currentPath } = await renderRoute();

            await waitFor(() => expect(screen.getByText('Testing and calibration')).toBeInTheDocument());
            const [testingRadio] = screen.getAllByRole('radio', { hidden: true });

            await user.click(testingRadio);
            await user.click(screen.getByTestId('save-button'));

            await waitFor(() => expect(mocks.setUserProfile).toHaveBeenCalledWith({
                email: 'tester@example.gov.au',
                services: [
                    { service: ServiceType.TestingCalibration, isActive: true, isDefault: true },
                    { service: ServiceType.PatternApproval, isActive: false, isDefault: false },
                ],
            }));
            await waitFor(() => expect(currentPath()).toBe('/dashboard'));
            expect(mocks.appLoggerInfo).toHaveBeenCalledWith(
                'Services offered updated successfully in user profile.',
            );
        });

        it('logs and stays put when the profile save fails', async () => {
            const user = userEvent.setup();
            mocks.setUserProfile.mockRejectedValue(new Error('save failed'));
            const { currentPath } = await renderRoute();

            await waitFor(() => expect(screen.getByText('Pattern approval')).toBeInTheDocument());
            const [, patternRadio] = screen.getAllByRole('radio', { hidden: true });

            await user.click(patternRadio);
            await user.click(screen.getByTestId('save-button'));

            await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
                'Failed to update services offered in user profile.',
                expect.any(Error),
            ));
            expect(currentPath()).toBe('/services-we-offer');
        });
    });

    describe('cancelling', () => {
        it('returns to the dashboard of the previously saved default', async () => {
            const user = userEvent.setup();
            mocks.accountContext.mockReturnValue(
                accountWith([
                    { service: ServiceType.PatternApproval, isActive: true, isDefault: true },
                ]),
            );

            const { currentPath } = await renderRoute('/services-we-offer?mode=manage');
            await waitFor(() => expect(screen.getByText('Pattern approval')).toBeInTheDocument());

            await user.click(screen.getByTestId('go-to-dashboard-button'));

            await waitFor(() => expect(currentPath()).toBe('/dashboard-ta'));
        });

        it('stays put when the saved default maps to no dashboard, and falls back to a default icon', async () => {
            const user = userEvent.setup();
            // A service the client build does not recognise, delivered without an icon. Both of the
            // component's last two fallbacks - the routeToDashboard default arm and the
            // `service.icon || 'icon-file'` default - are on this one path.
            clients.lookup.methods.getServices.mockResolvedValue([
                {
                    serviceType: 'Unknown' as ServiceType,
                    title: 'Future service',
                    description: 'Something this build predates',
                    meta: 'New',
                },
            ]);
            mocks.accountContext.mockReturnValue(
                accountWith([{ service: 'Unknown' as ServiceType, isActive: true, isDefault: true }]),
            );

            const { container, currentPath } = await renderRoute('/services-we-offer?mode=manage');
            await waitFor(() => expect(screen.getByText('Future service')).toBeInTheDocument());

            expect(container.querySelector('.icon-file')).toBeInTheDocument();

            await user.click(screen.getByTestId('go-to-dashboard-button'));

            // No dashboard exists for it, so the user is left where they are rather than navigated
            // somewhere wrong - and without the spurious error summary.
            expect(currentPath()).toBe('/services-we-offer');
            expect(screen.queryByTestId('form-error-summary')).not.toBeInTheDocument();
        });

        it('shows the error summary when there is no saved default to return to', async () => {
            const user = userEvent.setup();
            await renderRoute();

            await waitFor(() => expect(screen.getByText('Testing and calibration')).toBeInTheDocument());

            await user.click(screen.getByTestId('go-to-dashboard-button'));

            expect(screen.getByTestId('form-error-summary')).toBeInTheDocument();
        });
    });
});
