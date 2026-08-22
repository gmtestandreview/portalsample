import type React from 'react';
import {
    describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    createMemoryRouter, RouterProvider,
} from 'react-router';
import { FormStepStatus, type FormStepStatusDto } from '../../../../../ClientApp/src/api/web-api-client';
import {
    AccountStateCtx, AccountDispatchCtx,
} from '../../../../../ClientApp/src/authentication/accountContext';
import WizardRoutedStep from '../../../../../ClientApp/src/components/forms/WizardForm/WizardRoutedStep';
import WizardStep from '../../../../../ClientApp/src/components/forms/WizardForm/WizardStep';
import type { WizardRoutedStepProps } from '../../../../../ClientApp/src/components/forms/WizardForm/types';
import { type FormikValues } from 'formik';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: { verbose: vi.fn(), error: vi.fn(), trace: vi.fn() },
}));

// WizardStep wraps ErrorBoundary (needs AppInsights) + GoogleAnalytics.
// Both are irrelevant to these tests; stub them out.
vi.mock('../../../../../ClientApp/src/components/forms/WizardForm/WizardStep', () => ({
    default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../../../../ClientApp/src/analytics/GoogleAnalytics', () => ({
    default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// ── Test helpers ─────────────────────────────────────────────────────────────

const mockStateValue = {
    isLoading: false,
    details: {
        homeAccountId: 'test-account-id',
        organisation: 'Test Org',
        trading: '',
        branch: '',
        abn: '12345678901',
        email: 'test@test.com',
        givenName: 'Test',
        familyName: 'User',
        userAcceptedTermsOfUse: true,
        accountCreationCompleted: true,
        accountContactCompleted: true,
        currentTermsVersion: '1',
        isDefaultOrganisation: true,
        showBranchSelector: false,
        organisationIsCompleted: true,
        defaultOrganisationId: 1,
        targetOrganisation: { targetOrganisationAbn: '', targetOrganisationName: '' },
    },
};

const mockDispatch = {
    setAgree: vi.fn(),
    setCompleted: vi.fn(),
    setContactCompleted: vi.fn(),
    setDefaultOrganisationId: vi.fn(),
    setTargetOrganisation: vi.fn(),
    setOrganisationAndBranch: vi.fn(),
    setUserProfile: vi.fn(),
    setShowBranchSelector: vi.fn(),
    setShowRFQSelectModal: vi.fn(),
};

function makeStepElement() {
    // A minimal React element whose .props satisfy WizardStepProps reads inside
    // WizardRoutedStep (title, location, stepStatuses used by render guards).
    return (
        <WizardStep
            title='Test Step'
            location='/step-1'
            stepStatuses={[{ status: FormStepStatus.NotStarted }]}
            loadStepValues={async () => ({ stepValues: {} })}
            bannerTitle='Test'
            initialValues={{}}
        />
    );
}

function makeStepElementAt(location: string, title: string) {
    return (
        <WizardStep
            title={title}
            location={location}
            stepStatuses={[{ status: FormStepStatus.NotStarted }]}
            loadStepValues={async () => ({ stepValues: {} })}
            bannerTitle='Test'
            initialValues={{}}
        />
    );
}

function makeRouter(
    propsOverride: Partial<WizardRoutedStepProps<FormikValues>>,
    extraRoutes: Array<{ path: string; element: React.ReactNode }> = [],
    accountState = mockStateValue,
    accountDispatch: typeof mockDispatch | null = mockDispatch,
) {
    const defaultStatuses: FormStepStatusDto[] = [{ status: FormStepStatus.NotStarted }];
    const defaultProps: WizardRoutedStepProps<FormikValues> = {
        title: 'Test Step',
        location: '/step-1',
        url: '',
        initialValues: {},
        stepStatuses: defaultStatuses,
        loadStepValues: async () => ({ stepValues: {} }),
        allSteps: [makeStepElement()],
        currentStepIndex: 0,
        locationOnCompletion: '/done',
        bannerTitle: 'Test Wizard',
        ...propsOverride,
    };

    return createMemoryRouter(
        [
            {
                path: '/step-1',
                element: (
                    <AccountStateCtx.Provider value={accountState}>
                        <AccountDispatchCtx.Provider value={accountDispatch}>
                            <WizardRoutedStep {...defaultProps} />
                        </AccountDispatchCtx.Provider>
                    </AccountStateCtx.Provider>
                ),
            },
            { path: '/not-found', element: <div>Not Found Page</div> },
            { path: '/server-error', element: <div>Server Error Page</div> },
            { path: '/dashboard', element: <div>Dashboard Page</div> },
            { path: '/sign-out', element: <div>Sign Out Page</div> },
            { path: '/done', element: <div>Done Page</div> },
            ...extraRoutes,
        ],
        { initialEntries: ['/step-1'] },
    );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WizardRoutedStep — error navigation', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('navigates to /not-found when loadStepValues throws a 404', async () => {
        const router = makeRouter({
            loadStepValues: vi.fn().mockRejectedValue({ status: 404, title: 'Not Found' }),
        });
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByText('Not Found Page')).toBeInTheDocument());
    });

    it('navigates to /server-error when loadStepValues throws an unrecognised error — restores suppressed silent failure', async () => {
        const router = makeRouter({
            loadStepValues: vi.fn().mockRejectedValue({ status: 500, title: 'Internal Server Error' }),
        });
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByText('Server Error Page')).toBeInTheDocument());
    });

    it('navigates to a custom redirect URL when getRedirectionLocationOnError returns one', async () => {
        const router = makeRouter(
            {
                loadStepValues: vi.fn().mockRejectedValue({ status: 404, title: 'Not Found' }),
                getRedirectionLocationOnError: () => '/custom-gone',
            },
            [{ path: '/custom-gone', element: <div>Custom Gone Page</div> }],
        );
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByText('Custom Gone Page')).toBeInTheDocument());
    });

    it('automatically retries loadStepValues after a 409 concurrency error', async () => {
        const loadStepValues = vi.fn()
            .mockRejectedValueOnce({ status: 409, title: 'Conflict' })
            .mockResolvedValue({ stepValues: {} });

        const router = makeRouter({ loadStepValues });
        render(<RouterProvider router={router} />);

        // After the 409, the concurrency effect triggers a reload.
        // Wait until loadStepValues has been called twice AND the form is visible —
        // both assertions must be inside waitFor to avoid a race condition.
        await waitFor(() => {
            expect(loadStepValues).toHaveBeenCalledTimes(2);
            expect(screen.getByTestId('form')).toBeInTheDocument();
        });
    });

    it('replaces the document location with sign-out after a gone load error', async () => {
        const replace = vi.fn();
        vi.spyOn(globalThis, 'location', 'get').mockReturnValue({
            ...globalThis.location,
            replace,
        });
        const router = makeRouter({
            loadStepValues: vi.fn().mockRejectedValue({ status: 410, title: 'Gone' }),
        });

        render(<RouterProvider router={router} />);

        await waitFor(() => expect(replace).toHaveBeenCalledWith('/sign-out'));
    });

    it('resets target organisation and navigates to dashboard after third-party access is lost', async () => {
        const router = makeRouter({
            loadStepValues: vi.fn().mockRejectedValue({
                status: 403,
                title: 'No third-party access to this resource',
            }),
        });
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByText('Dashboard Page')).toBeInTheDocument());
        expect(mockDispatch.setTargetOrganisation).toHaveBeenCalledWith('12345678901', 'Test Org');
    });

    it('handles lost third-party access without account dispatch', async () => {
        const router = makeRouter({
            loadStepValues: vi.fn().mockRejectedValue({
                status: 403,
                title: 'No third-party access to this resource',
            }),
        }, [], mockStateValue, null);
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByText('Dashboard Page')).toBeInTheDocument());
        expect(mockDispatch.setTargetOrganisation).not.toHaveBeenCalled();
    });

    it('uses empty account values when resetting third-party access', async () => {
        const accountWithoutOrganisation = {
            ...mockStateValue,
            details: {
                ...mockStateValue.details,
                abn: undefined,
                organisation: undefined,
            },
        };
        const router = makeRouter({
            loadStepValues: vi.fn().mockRejectedValue({
                status: 403,
                title: 'No third-party access to this resource',
            }),
        }, [], accountWithoutOrganisation as unknown as typeof mockStateValue);
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByText('Dashboard Page')).toBeInTheDocument());
        expect(mockDispatch.setTargetOrganisation).toHaveBeenCalledWith('', '');
    });

    it('keeps rendering after an aborted load request', async () => {
        const router = makeRouter({
            loadStepValues: vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')),
        });
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByTestId('form')).toBeInTheDocument());
    });

    it('redirects to the first incomplete prior step', async () => {
        const steps = [
            makeStepElementAt('/step-1', 'First'),
            makeStepElementAt('/step-2', 'Second'),
        ];
        const router = createMemoryRouter([
            {
                path: '/step-2',
                element: (
                    <AccountStateCtx.Provider value={mockStateValue}>
                        <AccountDispatchCtx.Provider value={mockDispatch}>
                            <WizardRoutedStep
                                title='Second'
                                location='/step-2'
                                url=''
                                initialValues={{}}
                                stepStatuses={[
                                    { status: FormStepStatus.NotStarted },
                                    { status: FormStepStatus.NotStarted },
                                ]}
                                loadStepValues={async () => ({ stepValues: {} })}
                                allSteps={steps}
                                currentStepIndex={1}
                                locationOnCompletion='/done'
                            />
                        </AccountDispatchCtx.Provider>
                    </AccountStateCtx.Provider>
                ),
            },
            { path: '/step-1', element: <div>First Step Page</div> },
        ], { initialEntries: ['/step-2'] });

        render(<RouterProvider router={router} />);
        await waitFor(() => expect(screen.getByText('First Step Page')).toBeInTheDocument());
    });
});

describe('WizardRoutedStep — prop mutation fix', () => {
    it('does not mutate the original FormStepStatusDto on successful step save', async () => {
        const originalDto: FormStepStatusDto = { status: FormStepStatus.NotStarted };
        const stepStatuses: FormStepStatusDto[] = [originalDto];
        const onSaveAndNext = vi.fn().mockResolvedValue({});

        const router = makeRouter({
            stepStatuses,
            onSaveAndNext,
            loadStepValues: async () => ({ stepValues: {} }),
            locationOnCompletion: '/done',
        });

        render(<RouterProvider router={router} />);

        // Wait for the loading spinner to go away and the form to be ready
        await waitFor(() => expect(screen.getByTestId('form')).toBeInTheDocument());

        const submitButton = screen.getByTestId('save-and-next-button');
        await userEvent.click(submitButton);

        await waitFor(() => expect(onSaveAndNext).toHaveBeenCalledTimes(1));

        // The fix: the original DTO object must NOT be mutated
        expect(originalDto.status).toBe(FormStepStatus.NotStarted);
        // The array element at index 0 is now a different object
        expect(stepStatuses[0]).not.toBe(originalDto);
        // And it has the updated status
        expect(stepStatuses[0].status).toBe(FormStepStatus.Completed);
    });

    it('navigates to the next step using a returned base URL and reports dirty values', async () => {
        const user = userEvent.setup();
        const onSaveAndNext = vi.fn().mockResolvedValue({ baseUrl: '/alternate' });
        const steps = [
            makeStepElementAt('/step-1', 'First'),
            makeStepElementAt('/step-2', 'Second'),
        ];
        const router = makeRouter({
            initialValues: { name: 'initial' },
            loadStepValues: async () => ({ stepValues: { name: 'loaded' } }),
            allSteps: steps,
            stepStatuses: [
                { status: FormStepStatus.NotStarted },
                { status: FormStepStatus.NotStarted },
            ],
            onSaveAndNext,
        }, [
            { path: '/alternate/step-2', element: <div>Alternate Second Step</div> },
        ]);
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByTestId('form')).toBeInTheDocument());
        await user.click(screen.getByTestId('save-and-next-button'));

        await waitFor(() => expect(screen.getByText('Alternate Second Step')).toBeInTheDocument());
        expect(onSaveAndNext).toHaveBeenCalledWith(
            { name: 'loaded' },
            false,
            expect.any(Object),
            expect.any(AbortSignal),
        );
    });

    it('saves and exits to the configured location with dirty values', async () => {
        const user = userEvent.setup();
        const onSaveAndExit = vi.fn().mockResolvedValue(undefined);
        const router = makeRouter({
            initialValues: { name: 'initial' },
            loadStepValues: async () => ({ stepValues: { name: 'loaded' } }),
            onSaveAndExit,
            canSaveDraft: true,
            locationAfterExit: '/after-exit',
        }, [{ path: '/after-exit', element: <div>After Exit Page</div> }]);
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByTestId('save-and-exit-button')).toBeInTheDocument());
        await user.click(screen.getByTestId('save-and-exit-button'));

        await waitFor(() => expect(screen.getByText('After Exit Page')).toBeInTheDocument());
        expect(onSaveAndExit).toHaveBeenCalledWith(
            { name: 'loaded' },
            false,
            expect.any(Object),
            expect.any(AbortSignal),
        );
    });

    it('exits without a save callback and defaults the destination to root', async () => {
        const user = userEvent.setup();
        const router = makeRouter({
            canSaveDraft: true,
            locationAfterExit: undefined,
        }, [{ path: '/', element: <div>Root Page</div> }]);
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByTestId('save-and-exit-button')).toBeInTheDocument());
        await user.click(screen.getByTestId('save-and-exit-button'));
        await waitFor(() => expect(screen.getByText('Root Page')).toBeInTheDocument());
    });

    it('renders update server and WAF errors from failed submissions', async () => {
        const user = userEvent.setup();
        const onSaveAndNext = vi.fn()
            .mockRejectedValueOnce({ status: 500, title: 'Failure' })
            .mockRejectedValueOnce({
                status: 403,
                title: 'Forbidden',
                headers: { server: 'Microsoft-Azure-Application-Gateway/v2' },
            });
        const router = makeRouter({ onSaveAndNext });
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByTestId('save-and-next-button')).toBeInTheDocument());
        await user.click(screen.getByTestId('save-and-next-button'));
        expect(await screen.findByText('Server error')).toBeInTheDocument();

        await user.click(screen.getByTestId('save-and-next-button'));
        expect(await screen.findByText(/form contains invalid characters/i)).toBeInTheDocument();
    });

    it('keeps the form visible when save-and-exit fails', async () => {
        const user = userEvent.setup();
        const onSaveAndExit = vi.fn().mockRejectedValue({ status: 500, title: 'Failure' });
        const router = makeRouter({
            onSaveAndExit,
            canSaveDraft: true,
        });
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByTestId('save-and-exit-button')).toBeInTheDocument());
        await user.click(screen.getByTestId('save-and-exit-button'));
        expect(await screen.findByText('Server error')).toBeInTheDocument();
        expect(screen.getByTestId('form')).toBeInTheDocument();
    });

    it('does nothing on submit when no save-and-next callback is configured', async () => {
        const user = userEvent.setup();
        const router = makeRouter({ onSaveAndNext: undefined });
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByTestId('save-and-next-button')).toBeInTheDocument());
        await user.click(screen.getByTestId('save-and-next-button'));

        expect(screen.getByTestId('form')).toBeInTheDocument();
    });

    it('falls back to root after save and exit without a configured destination', async () => {
        const user = userEvent.setup();
        const onSaveAndExit = vi.fn().mockResolvedValue(undefined);
        const router = makeRouter(
            { onSaveAndExit, canSaveDraft: true, locationAfterExit: undefined },
            [{ path: '/', element: <div>Root Page</div> }],
        );
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByTestId('save-and-exit-button')).toBeInTheDocument());
        await user.click(screen.getByTestId('save-and-exit-button'));

        await waitFor(() => expect(screen.getByText('Root Page')).toBeInTheDocument());
    });

    it('runs discard and cancel callbacks before navigating', async () => {
        const user = userEvent.setup();
        const onDiscard = vi.fn();
        const onCancel = vi.fn();
        const router = makeRouter({
            discard: {
                showCancelButton: true,
                cancelButtonTitle: 'Cancel wizard',
                onDiscard,
                onCancel,
                locationOnCancel: '/cancelled',
            },
        }, [{ path: '/cancelled', element: <div>Cancelled Page</div> }]);
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByTestId('cancel-button')).toBeInTheDocument());
        await user.click(screen.getByTestId('cancel-button'));

        await waitFor(() => expect(screen.getByText('Cancelled Page')).toBeInTheDocument());
        expect(onDiscard).toHaveBeenCalled();
        expect(onCancel).toHaveBeenCalled();
    });

    it('uses the discard location and hides the save-and-next button', async () => {
        const user = userEvent.setup();
        const router = makeRouter({
            showSaveAndNextButton: false,
            discard: {
                showCancelButton: true,
                cancelButtonTitle: 'Leave wizard',
                locationOnDiscard: '/discarded',
            },
        }, [{ path: '/discarded', element: <div>Discarded Page</div> }]);
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByTestId('cancel-button')).toBeInTheDocument());
        expect(screen.queryByTestId('save-and-next-button')).not.toBeInTheDocument();
        await user.click(screen.getByTestId('cancel-button'));

        await waitFor(() => expect(screen.getByText('Discarded Page')).toBeInTheDocument());
    });

    it('falls back to root when cancelling without a configured location', async () => {
        const user = userEvent.setup();
        const router = makeRouter({
            discard: {
                showCancelButton: true,
                cancelButtonTitle: 'Leave wizard',
            },
        }, [{ path: '/', element: <div>Root Cancel Page</div> }]);
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByTestId('cancel-button')).toBeInTheDocument());
        await user.click(screen.getByTestId('cancel-button'));

        await waitFor(() => expect(screen.getByText('Root Cancel Page')).toBeInTheDocument());
    });

    it('uses the external redirect for an HTTPS discard location', async () => {
        const user = userEvent.setup();
        const router = makeRouter({
            discard: {
                showCancelButton: true,
                cancelButtonTitle: 'Leave portal',
                locationOnDiscard: 'https://external.example.test/path',
            },
        });
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByTestId('cancel-button')).toBeInTheDocument());
        await user.click(screen.getByTestId('cancel-button'));

        expect(screen.getByTestId('form')).toBeInTheDocument();
    });
});
