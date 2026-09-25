import { Form, Formik } from 'formik';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ReactRouterModule from 'react-router';
import SummaryAndAccept from '../../../../ClientApp/src/routes/acceptQuote/summaryAndAccept';

const mocks = vi.hoisted(() => {
    const acquireTokenSilent = vi.fn().mockResolvedValue({ accessToken: 'mock-token' });
    const getSummaryAndAccept = vi.fn();
    const route = { id: 'quote-1' };

    return {
        acquireTokenSilent,
        getSummaryAndAccept,
        route,
        accounts: [{ homeAccountId: 'mock-account' }],
        instance: { acquireTokenSilent },
    };
});

vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({
        accounts: mocks.accounts,
        instance: mocks.instance,
    }),
}));

vi.mock('react-router', async (importOriginal) => {
    const actual = await importOriginal<typeof ReactRouterModule>();

    return {
        ...actual,
        useParams: () => ({ id: mocks.route.id }),
        Link: ({ children, to, ...props }: React.ComponentProps<'a'> & { to: string }) => (
            <a href={to} {...props}>{children}</a>
        ),
    };
});

vi.mock('../../../../ClientApp/src/authentication/hooks', () => ({
    useAccountState: () => ({
        details: {
            givenName: 'Taylor',
            familyName: 'Nguyen',
        },
    }),
}));

vi.mock('../../../../ClientApp/src/api/web-api-client', () => ({
    AcceptQuoteClient: class {
        setAuthToken = vi.fn();

        getSummaryAndAccept = mocks.getSummaryAndAccept;
    },
    DashboardClient: class {
        setAuthToken = vi.fn();
    },
}));

vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: { verbose: vi.fn(), error: vi.fn() },
}));

vi.mock('../../../../ClientApp/src/storage/notification', () => ({
    getDashboardNotification: vi.fn(() => undefined),
    clearDashboardNotification: vi.fn(),
    setDashboardNotification: vi.fn(),
    clearDashboardInfoNotification: vi.fn(),
}));

vi.mock('../../../../ClientApp/src/components/Accordion', () => ({
    CustomAccordion: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CustomAccordionBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../../../ClientApp/src/components/Buttons/EditButton', () => ({
    default: () => <button type='button'>Edit</button>,
}));

vi.mock('../../../../ClientApp/src/components/HeaderIntroText', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../../../ClientApp/src/components/Utilities/useBodyClass', () => ({
    default: () => {},
}));

vi.mock('../../../../ClientApp/src/routes/acceptQuote/reportRecipient', () => ({
    default: () => <div>Report recipient</div>,
}));

vi.mock('../../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn', () => ({
    default: () => <div>Delivery and return</div>,
}));

vi.mock('../../../../ClientApp/src/routes/acceptQuote/paymentDetails', () => ({
    default: () => <div>Payment details</div>,
}));

vi.mock('../../../../ClientApp/src/components/Inputs/RadioButtonGroup', () => ({
    default: ({ name }: { name: string }) => <div data-testid='radio-group' data-name={name} />,
}));

vi.mock('../../../../ClientApp/src/components/Inputs/TextAreaInput', () => ({
    default: ({ name }: { name: string }) => <div data-testid='text-area' data-name={name} />,
}));

vi.mock('../../../../ClientApp/src/components/forms/HidableField', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../../../ClientApp/src/components/Inputs/Checkbox', () => ({
    default: ({ name }: { name: string }) => <div data-testid='checkbox' data-name={name} />,
}));

vi.mock('../../../../ClientApp/src/components/InTextLink', () => ({
    default: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
        <button type='button' onClick={onClick}>{children}</button>
    ),
}));

vi.mock('../../../../ClientApp/src/routes/acceptQuote/quotationSummary', () => ({
    default: () => <div>Quotation summary</div>,
}));

vi.mock('../../../../ClientApp/src/components/BlockUISpinner', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../../../ClientApp/src/components/Alert/NotificationMessage', () => ({
    default: () => null,
}));

vi.mock('../../../../ClientApp/src/components/Icons/ExternalLinkIcon', () => ({
    default: () => <span aria-hidden='true'>icon</span>,
}));

vi.mock('../../../../ClientApp/src/routes/common/helperFunctions', () => ({
    getFileUrlFromBase64: vi.fn(),
    openPdfPageInNewTab: vi.fn(),
}));

function renderComponent() {
    return render(
        <Formik initialValues={{}} onSubmit={() => {}}>
            <Form>
                <SummaryAndAccept />
            </Form>
        </Formik>,
    );
}

describe('SummaryAndAccept', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.route.id = 'quote-1';
        mocks.getSummaryAndAccept.mockResolvedValue({
            acceptQuotePreInfo: {},
            requestForQuote: {},
            rfqOrganisation: {},
        });
    });

    it('skips the API call when no MSAL accounts are available', async () => {
        mocks.accounts = [];
        renderComponent();

        await new Promise((r) => { setTimeout(r, 50); });

        expect(mocks.getSummaryAndAccept).not.toHaveBeenCalled();
        mocks.accounts = [{ homeAccountId: 'mock-account' }];
    });

    it('re-fetches summary data when the route id changes', async () => {
        const { rerender } = renderComponent();

        await waitFor(() => {
            expect(mocks.getSummaryAndAccept).toHaveBeenCalledWith('quote-1');
        });

        mocks.route.id = 'quote-2';
        rerender(
            <Formik initialValues={{}} onSubmit={() => {}}>
                <Form>
                    <SummaryAndAccept />
                </Form>
            </Formik>,
        );

        await waitFor(() => {
            expect(mocks.getSummaryAndAccept).toHaveBeenCalledWith('quote-2');
        });
    });
});
