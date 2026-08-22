import {
    act, fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { AccountDetails } from '../../../ClientApp/src/authentication/accountContext';
import type * as WebApiClientModule from '../../../ClientApp/src/api/web-api-client';
import type * as HelperFunctionsModule from '../../../ClientApp/src/routes/common/helperFunctions';

const mocks: {
    acquireTokenSilent: ReturnType<typeof vi.fn>;
    instance: { acquireTokenSilent: ReturnType<typeof vi.fn> };
    msalAccounts: Array<{ homeAccountId: string }>;
    setAuthToken: ReturnType<typeof vi.fn>;
    getLookup: ReturnType<typeof vi.fn>;
    getReportRecipient: ReturnType<typeof vi.fn>;
    getDeliveryAndReturn: ReturnType<typeof vi.fn>;
    getPaymentDetails: ReturnType<typeof vi.fn>;
    getSummaryAndAccept: ReturnType<typeof vi.fn>;
    getQuoteOfferPDFByQuoteID: ReturnType<typeof vi.fn>;
    appLoggerError: ReturnType<typeof vi.fn>;
    appLoggerVerbose: ReturnType<typeof vi.fn>;
    useAccountState: ReturnType<typeof vi.fn>;
    setShowRFQSelectModal: ReturnType<typeof vi.fn>;
    formikValues: Record<string, unknown>;
    setFieldValue: ReturnType<typeof vi.fn>;
    setFieldTouched: ReturnType<typeof vi.fn>;
    selectChangeHandlers: Map<string, React.ChangeEventHandler<HTMLInputElement>>;
    dashboardNotification: { message: string; severity: string } | null;
    setDashboardNotification: ReturnType<typeof vi.fn>;
    clearDashboardNotification: ReturnType<typeof vi.fn>;
    clearDashboardInfoNotification: ReturnType<typeof vi.fn>;
    openPdfPageInNewTab: ReturnType<typeof vi.fn>;
} = vi.hoisted(() => {
    // acquireTokenSilent and instance must be stable object references.
    // deliveryAndReturn.tsx lists `instance` in its useEffect dep array; a new
    // object on every useMsal() call would re-fire the effect every render.
    const acquireTokenSilent = vi.fn();
    const instance = { acquireTokenSilent };
    return {
        acquireTokenSilent,
        instance,
        msalAccounts: [{ homeAccountId: 'account-1' }],
        setAuthToken: vi.fn(),
        getLookup: vi.fn(),
        getReportRecipient: vi.fn(),
        getDeliveryAndReturn: vi.fn(),
        getPaymentDetails: vi.fn(),
        getSummaryAndAccept: vi.fn(),
        getQuoteOfferPDFByQuoteID: vi.fn(),
        appLoggerError: vi.fn(),
        appLoggerVerbose: vi.fn(),
        useAccountState: vi.fn(),
        setShowRFQSelectModal: vi.fn(),
        formikValues: {},
        setFieldValue: vi.fn(),
        setFieldTouched: vi.fn(),
        selectChangeHandlers: new Map<string, React.ChangeEventHandler<HTMLInputElement>>(),
        dashboardNotification: null as { message: string; severity: string } | null,
        setDashboardNotification: vi.fn(),
        clearDashboardNotification: vi.fn(),
        clearDashboardInfoNotification: vi.fn(),
        openPdfPageInNewTab: vi.fn(),
    };
});

vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({
        accounts: mocks.msalAccounts,
        instance: mocks.instance,
    }),
}));

vi.mock('../../../ClientApp/src/authentication/hooks', () => ({
    useAccountState: mocks.useAccountState,
}));

vi.mock('../../../ClientApp/src/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['scope'] },
}));

vi.mock('../../../ClientApp/src/api/web-api-client', async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();

    return {
        ...actual,
        CRMLookupTypes: {
            TCPortalMeasurementCategory: 'TCPortalMeasurementCategory',
            TCArtefactTypePortalCategory: 'TCArtefactTypePortalCategory',
        },
        LookupClient: vi.fn(function LookupClientMock() {
            return {
                setAuthToken: mocks.setAuthToken,
                getLookup: mocks.getLookup,
            };
        }),
        AcceptQuoteClient: vi.fn(function AcceptQuoteClientMock() {
            return {
                setAuthToken: mocks.setAuthToken,
                getReportRecipient: mocks.getReportRecipient,
                getDeliveryAndReturn: mocks.getDeliveryAndReturn,
                getPaymentDetails: mocks.getPaymentDetails,
                getSummaryAndAccept: mocks.getSummaryAndAccept,
            };
        }),
        AccountsClient: vi.fn(function AccountsClientMock() {
            return {
                setAuthToken: mocks.setAuthToken,
            };
        }),
        DashboardClient: vi.fn(function DashboardClientMock() {
            return {
                setAuthToken: mocks.setAuthToken,
                getQuoteOfferPDFByQuoteID: mocks.getQuoteOfferPDFByQuoteID,
            };
        }),
    };
});

vi.mock('formik', () => {
    const getPath = (path: string) => path.split('.').reduce<unknown>((value, part) => (
        value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined
    ), mocks.formikValues);

    return {
        useFormikContext: () => ({
            values: mocks.formikValues,
            setFieldValue: mocks.setFieldValue,
            setFieldTouched: mocks.setFieldTouched,
            getFieldMeta: (name: string) => ({ initialValue: getPath(name) }),
        }),
        useField: (name: string) => [{ value: getPath(name) ?? '' }],
        getIn: (values: Record<string, unknown>, name: string) => name.split('.').reduce<unknown>((value, part) => (
            value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined
        ), values),
    };
});

vi.mock('../../../ClientApp/src/components/Inputs/TextInput', () => ({
    default: ({ label, name }: { label: string; name: string }) => <div data-testid="text-input" data-name={name}>{label}</div>,
}));

vi.mock('../../../ClientApp/src/components/Inputs/TextAreaInput', () => ({
    default: ({ label, name }: { label: string; name: string }) => <div data-testid="textarea-input" data-name={name}>{label}</div>,
}));

vi.mock('../../../ClientApp/src/components/Inputs/RadioButtonGroup', () => ({
    default: ({ legend, name, options }: { legend: string; name: string; options: { label: string }[] }) => (
        <fieldset data-testid="radio-group" data-name={name}>
            <legend>{legend}</legend>
            {options.map((option) => <span key={option.label}>{option.label}</span>)}
        </fieldset>
    ),
}));

vi.mock('../../../ClientApp/src/components/Inputs/SelectInput', () => ({
    default: ({ label, name, options, onChange, readOnly }: {
        label: string;
        name: string;
        options: { value: string; displayText: string }[];
        onChange?: React.ChangeEventHandler<HTMLInputElement>;
        readOnly?: boolean;
    }) => {
        if (onChange) mocks.selectChangeHandlers.set(name, onChange);
        return (
            <label>
                {label}
                <input
                    data-testid={`select-${name}`}
                    data-readonly={readOnly ? 'true' : 'false'}
                    onChange={onChange}
                    value={options[0]?.value ?? ''}
                    readOnly
                />
            </label>
        );
    },
}));

vi.mock('../../../ClientApp/src/components/Inputs/NumberInput', () => ({
    default: ({ label, name }: { label: string; name: string }) => <div data-testid="number-input" data-name={name}>{label}</div>,
}));

vi.mock('../../../ClientApp/src/components/Inputs/DatePicker', () => ({
    default: ({ label, name }: { label: string; name: string }) => <div data-testid="date-picker" data-name={name}>{label}</div>,
}));

vi.mock('../../../ClientApp/src/components/Inputs/AddressLookup', () => ({
    default: ({ label, name }: { label: string; name: string }) => <div data-testid="address-lookup" data-name={name}>{label}</div>,
}));

vi.mock('../../../ClientApp/src/components/Inputs/Checkbox', () => ({
    default: ({ label, name }: { label: string; name: string }) => <div data-testid="checkbox" data-name={name}>{label}</div>,
}));

vi.mock('../../../ClientApp/src/components/forms/HidableField', () => ({
    default: ({ children, name }: { children: React.ReactNode; name: string }) => <div data-testid="hidable-field" data-name={name}>{children}</div>,
}));

vi.mock('../../../ClientApp/src/components/forms/CommonForms/ContactDetails', () => ({
    default: ({ name }: { name: string }) => <div data-testid="contact-details">{name}</div>,
}));

vi.mock('../../../ClientApp/src/components/modals/ModalContext', () => ({
    useModalDispatch: () => ({ setShowRFQSelectModal: mocks.setShowRFQSelectModal }),
}));

vi.mock('../../../ClientApp/src/components/BlockUISpinner', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="block-spinner">{children}</div>,
}));

vi.mock('../../../ClientApp/src/components/Utilities/mailingLabel', () => ({
    default: ({ quotationIdNum }: { quotationIdNum?: string }) => <div data-testid="mailing-label">{quotationIdNum}</div>,
}));

vi.mock('../../../ClientApp/src/components/Utilities/deliveryInstructions', () => ({
    default: ({ deliveryInstructions }: { deliveryInstructions?: string }) => <div data-testid="delivery-instructions">{deliveryInstructions}</div>,
}));

vi.mock('../../../ClientApp/src/components/Utilities/useBodyClass', () => ({
    default: () => {},
}));

vi.mock('../../../ClientApp/src/components/Accordion', () => ({
    CustomAccordion: ({ children, id }: { children: React.ReactNode; id: string }) => <section data-testid="accordion" data-id={id}>{children}</section>,
    CustomAccordionBody: ({ children, name }: { children: React.ReactNode; name: string }) => <div data-testid="accordion-body">{name}{children}</div>,
}));

vi.mock('../../../ClientApp/src/components/Buttons/EditButton', () => ({
    default: ({ link }: { link: string }) => <a data-testid="edit-button" href={link}>Edit</a>,
}));

vi.mock('../../../ClientApp/src/components/HeaderIntroText', () => ({
    default: ({ children }: { children: React.ReactNode }) => <p data-testid="header-intro">{children}</p>,
}));

vi.mock('../../../ClientApp/src/components/InTextLink', () => ({
    default: ({ children, onClick, className }: { children: React.ReactNode; onClick: React.MouseEventHandler<HTMLButtonElement>; className?: string }) => (
        <button type="button" className={className} onClick={onClick}>{children}</button>
    ),
}));

vi.mock('../../../ClientApp/src/components/Icons/ExternalLinkIcon', () => ({
    default: () => <span data-testid="external-link-icon" />,
}));

vi.mock('../../../ClientApp/src/components/Alert/NotificationMessage', () => ({
    default: ({ message, onClose }: { message: string; onClose: () => void }) => (
        <button type="button" data-testid="notification-message" onClick={onClose}>{message}</button>
    ),
}));

vi.mock('../../../ClientApp/src/storage/notification', () => ({
    getDashboardNotification: () => mocks.dashboardNotification,
    clearDashboardNotification: mocks.clearDashboardNotification,
    setDashboardNotification: mocks.setDashboardNotification,
    clearDashboardInfoNotification: mocks.clearDashboardInfoNotification,
}));

vi.mock('../../../ClientApp/src/storage/types', () => ({
    NotificationSeverity: { Error: 'error', Info: 'info' },
}));

vi.mock('../../../ClientApp/src/routes/common/helperFunctions', async (importOriginal) => {
    const actual = await importOriginal<typeof HelperFunctionsModule>();

    return {
        ...actual,
        openPdfPageInNewTab: mocks.openPdfPageInNewTab,
    };
});

vi.mock('../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: {
        error: mocks.appLoggerError,
        verbose: mocks.appLoggerVerbose,
    },
}));

vi.mock('react-number-format', () => ({
    PatternFormat: ({ value }: { value?: string }) => <span>{value}</span>,
}));

vi.mock('../../../ClientApp/src/routes/acceptQuote/quotationSummary', () => ({
    default: () => <div data-testid="quotation-summary">Quotation summary content</div>,
}));

const accountDetails = {
    homeAccountId: 'account-1',
    givenName: 'Alex',
    familyName: 'Tester',
} as AccountDetails;

const streetAddress = {
    line1: '1 National Circuit',
    suburb: 'Canberra',
    state: 'ACT',
    postcode: '2600',
};

const basePreInfo = {
    quotationIdNum: 'Q-100',
    crmQuoteId: 'CRM-Q-100',
    nmiFacilityDeliveryInstructions: 'Use the loading dock.',
    nmiCheckedByName: 'NMI Officer',
    nmiCheckedByJobTitle: 'Approver',
    nmiCheckedByPhone: '02 0000 0000',
    nmiCheckedByEmail: 'officer@example.test',
};

const renderRoute = (initialPath: string, element: React.ReactNode, routePath = '/workflow/:id') => render(
    <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
            <Route path={routePath} element={element} />
        </Routes>
    </MemoryRouter>,
);

describe('workflow step components', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.msalAccounts.splice(0, mocks.msalAccounts.length, { homeAccountId: 'account-1' });
        mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
        mocks.useAccountState.mockReturnValue({ details: accountDetails });
        mocks.dashboardNotification = null;
        mocks.selectChangeHandlers.clear();
        mocks.formikValues = {
            sourceReferenceId: 'SOURCE-1',
            isCorrectBranchOrLocation: 'No',
            organisationCount: '2',
            businessOrTradingName: 'Trading',
            branchOrLocationName: 'Branch',
            name: 'National Measurement Institute',
            abn: '12345678901',
            currentContact: {
                title: 'Dr',
                firstName: 'Alex',
                lastName: 'Tester',
                email: 'alex@example.test',
            },
            measurementCategory: 'measurement-1',
        };
        mocks.getLookup
            .mockResolvedValueOnce([
                { id: 'measurement-1', label: 'Mass' },
                { id: 'no-measurement', label: 'No measurement' },
            ])
            .mockResolvedValueOnce([
                { id: 'artefact-1', parentId: 'measurement-1', label: 'Balance' },
                { id: 'no-instrument', parentId: 'no-measurement', label: 'No instrument' },
            ]);
        mocks.getReportRecipient.mockResolvedValue({
            reportAddressType: 'BusinessAddress',
            acceptQuotePreInfo: basePreInfo,
            rfqOrganisation: {
                streetAddress,
                postalAddressSameAsStreetAddress: true,
                postalAddress: { line1: 'PO Box 1', suburb: 'Canberra', state: 'ACT', postcode: '2601' },
            },
        });
        mocks.getDeliveryAndReturn.mockResolvedValue({
            acceptQuotePreInfo: basePreInfo,
            rfqOrganisation: {
                streetAddress,
                postalAddressSameAsStreetAddress: false,
                postalAddress: { line1: 'PO Box 1', suburb: 'Canberra', state: 'ACT', postcode: '2601' },
            },
        });
        mocks.getPaymentDetails.mockResolvedValue({ acceptQuotePreInfo: { ...basePreInfo, paymentTerms: 'Prepaid' } });
        mocks.getSummaryAndAccept.mockResolvedValue({
            acceptQuotePreInfo: basePreInfo,
            requestForQuote: {
                contact: {
                    firstName: 'Request',
                    lastName: 'Owner',
                    role: 'Manager',
                    phone: '02 1111 1111',
                    email: 'request@example.test',
                },
            },
            rfqOrganisation: {
                businessOrTradingName: 'Trading',
                branchOrLocationName: 'Branch',
                name: 'National Measurement Institute',
                abn: '12345678901',
                streetAddress,
            },
        });
        mocks.getQuoteOfferPDFByQuoteID.mockResolvedValue({
            fileData: btoa('pdf-data'),
            mimeType: 'application/pdf',
            filename: 'quote.pdf',
        });
    });

    it('renders request-for-quote organisation/contact inputs and opens the branch selector', async () => {
        const OrganisationAndContact = (await import('../../../ClientApp/src/routes/requestForQuote/organisationAndContact')).default;

        renderRoute('/request-for-quote/RFQ-1/organisation-and-contact', <OrganisationAndContact name="" />, '/request-for-quote/:id/*');

        expect(screen.getByText('Organisation details')).toBeInTheDocument();
        expect(screen.getByText(/This "Recalibration Request" is prefilled/)).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('open-manage-branch-division-button'));

        expect(mocks.setShowRFQSelectModal).toHaveBeenCalledWith(true, 'RFQ-1', '/request-for-quote/RFQ-1/organisation-and-contact');
    });

    it('opens the branch selector with an empty request id when the route id is omitted', async () => {
        const OrganisationAndContact = (await import('../../../ClientApp/src/routes/requestForQuote/organisationAndContact')).default;

        renderRoute('/organisation-and-contact', <OrganisationAndContact name="" />, '/organisation-and-contact');
        fireEvent.click(screen.getByTestId('open-manage-branch-division-button'));

        expect(mocks.setShowRFQSelectModal).toHaveBeenCalledWith(true, '', '/organisation-and-contact');
    });

    it('renders request-for-quote instrument/request inputs and dependent lookup options', async () => {
        const InstrumentAndRequest = (await import('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest')).default;

        renderRoute('/request-for-quote/RFQ-1/instrument-and-request', <InstrumentAndRequest name="" />, '/request-for-quote/:id/*');

        await waitFor(() => expect(screen.getByText('Instrument/artefact details')).toBeInTheDocument());
        expect(screen.getByText('Testing/calibration requirements')).toBeInTheDocument();

        await act(async () => {
            mocks.selectChangeHandlers.get('measurementCategory')?.({
                target: { value: 'no-measurement' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        await waitFor(() => expect(mocks.setFieldValue).toHaveBeenCalledWith('instrumentOrArtefactType', 'no-instrument'));
        expect(mocks.setFieldValue).toHaveBeenCalledWith('instrumentOrArtefactType', '');
        expect(mocks.setFieldTouched).toHaveBeenCalledWith('instrumentOrArtefactType', false);
        expect(screen.getByTestId('select-instrumentOrArtefactType')).toHaveAttribute('data-readonly', 'true');
    });

    it('initially disables instrument type for the no-measurement category', async () => {
        mocks.formikValues.measurementCategory = 'no-measurement';
        const InstrumentAndRequest = (await import('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest')).default;

        renderRoute('/request-for-quote/RFQ-1/instrument-and-request', <InstrumentAndRequest name="" />, '/request-for-quote/:id/*');

        await waitFor(() => expect(screen.getByTestId('select-instrumentOrArtefactType')).toHaveAttribute('data-readonly', 'true'));
    });

    it('uses an empty artefact option list when the initial measurement category is unavailable', async () => {
        mocks.formikValues.measurementCategory = undefined;
        const InstrumentAndRequest = (await import('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest')).default;

        renderRoute('/request-for-quote/RFQ-1/instrument-and-request', <InstrumentAndRequest name="" />, '/request-for-quote/:id/*');

        await waitFor(() => expect(screen.getByText('Instrument/artefact details')).toBeInTheDocument());
        expect(screen.getByTestId('select-instrumentOrArtefactType')).toBeInTheDocument();
    });

    it('renders all artefact lookup options in request summary mode', async () => {
        mocks.formikValues = {};
        const InstrumentAndRequest = (await import('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest')).default;

        renderRoute(
            '/request-for-quote/RFQ-1/instrument-and-request',
            <InstrumentAndRequest name="instrumentAndRequest" isSummary />,
            '/request-for-quote/:id/*',
        );

        await waitFor(() => expect(screen.getByText('Instrument/artefact details')).toBeInTheDocument());
        expect(screen.getByTestId('select-instrumentAndRequest.instrumentOrArtefactType')).toHaveAttribute('data-readonly', 'false');
    });

    it('normalises sparse lookup ids and summary artefact options', async () => {
        mocks.formikValues = {};
        mocks.getLookup.mockReset();
        mocks.getLookup
            .mockResolvedValueOnce([
                { id: undefined, label: 'Mass' },
                { id: 'no-measurement', label: 'No measurement' },
            ])
            .mockResolvedValueOnce([
                { id: undefined, parentId: undefined, label: undefined },
                { id: 'no-instrument', parentId: 'no-measurement', label: 'No instrument' },
            ]);
        const InstrumentAndRequest = (await import('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest')).default;

        renderRoute(
            '/request-for-quote/RFQ-1/instrument-and-request',
            <InstrumentAndRequest name="instrumentAndRequest" isSummary />,
            '/request-for-quote/:id/*',
        );

        await waitFor(() => expect(screen.getByText('Instrument/artefact details')).toBeInTheDocument());
        expect(screen.getByTestId('select-instrumentAndRequest.instrumentOrArtefactType')).toBeInTheDocument();
    });

    it('normalises missing lookup labels and ids and handles a regular category change', async () => {
        mocks.getLookup.mockReset();
        mocks.getLookup
            .mockResolvedValueOnce([
                { id: 'measurement-1', label: 'Mass' },
                { id: 'no-measurement', label: 'No measurement' },
            ])
            .mockResolvedValueOnce([
                { id: undefined, parentId: 'measurement-1', label: undefined },
                { id: 'no-instrument', parentId: 'no-measurement', label: 'No instrument' },
            ]);
        const InstrumentAndRequest = (await import('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest')).default;

        renderRoute('/request-for-quote/RFQ-1/instrument-and-request', <InstrumentAndRequest name="" />, '/request-for-quote/:id/*');

        await waitFor(() => expect(screen.getByText('Instrument/artefact details')).toBeInTheDocument());
        await act(async () => {
            mocks.selectChangeHandlers.get('measurementCategory')?.({
                target: { value: 'measurement-1' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(mocks.setFieldValue).toHaveBeenCalledWith('instrumentOrArtefactType', '');
        expect(mocks.setFieldValue).not.toHaveBeenCalledWith('instrumentOrArtefactType', 'no-instrument');
    });

    it('handles empty and null measurement category changes', async () => {
        const InstrumentAndRequest = (await import('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest')).default;
        renderRoute('/request-for-quote/RFQ-1/instrument-and-request', <InstrumentAndRequest name="" />, '/request-for-quote/:id/*');

        await waitFor(() => expect(screen.getByText('Instrument/artefact details')).toBeInTheDocument());
        const onChange = mocks.selectChangeHandlers.get('measurementCategory');
        await act(async () => {
            onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
            onChange?.({ target: { value: null } } as unknown as React.ChangeEvent<HTMLInputElement>);
        });

        expect(mocks.setFieldValue).toHaveBeenCalledWith('instrumentOrArtefactType', '');
    });

    it('keeps instrument lookups loading when no MSAL account is available', async () => {
        mocks.msalAccounts.length = 0;
        const InstrumentAndRequest = (await import('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest')).default;

        renderRoute('/request-for-quote/RFQ-1/instrument-and-request', <InstrumentAndRequest name="" />, '/request-for-quote/:id/*');

        expect(screen.getByTestId('block-spinner')).toHaveTextContent('Loading...');
        expect(mocks.getLookup).not.toHaveBeenCalled();
    });

    it('renders request-for-quote summary edit and submitted states', async () => {
        const RequestForQuoteSummary = (await import('../../../ClientApp/src/routes/requestForQuote/requestForQuoteSummary')).default;

        const { unmount } = renderRoute('/request-for-quote/RFQ-1/summary', <RequestForQuoteSummary />, '/request-for-quote/:id/*');

        expect(screen.getByTestId('header-intro')).toBeInTheDocument();
        expect(screen.getAllByTestId('edit-button')).toHaveLength(2);
        await screen.findByTestId('select-instrumentAndRequest.instrumentOrArtefactType');
        unmount();

        renderRoute('/request-for-quote/RFQ-1/summary', <RequestForQuoteSummary isSubmitted />, '/request-for-quote/:id/*');

        expect(screen.queryByTestId('header-intro')).not.toBeInTheDocument();
        expect(screen.getByTestId('back-button')).toHaveAttribute('href', '/dashboard');
        await screen.findByTestId('select-instrumentAndRequest.instrumentOrArtefactType');
    });

    it('renders report recipient edit and summary address branches', async () => {
        const ReportRecipient = (await import('../../../ClientApp/src/routes/acceptQuote/reportRecipient')).default;
        const { unmount } = renderRoute('/accept-quote/AQ-1/report-recipient', <ReportRecipient id="AQ-1" name="" />, '/accept-quote/:id/*');

        await waitFor(() => expect(screen.getByText('Report recipient organisation')).toBeInTheDocument());
        expect(screen.getByText('Organisation address for report')).toBeInTheDocument();
        expect(screen.getByTestId('address-lookup')).toHaveAttribute('data-name', 'businessStreetAddress');
        unmount();

        mocks.getReportRecipient.mockResolvedValueOnce({
            reportAddressType: 'Other',
            rfqOrganisation: { streetAddress, postalAddressSameAsStreetAddress: true },
        });
        renderRoute('/accept-quote/AQ-1/report-recipient', <ReportRecipient id="AQ-1" name="reportRecipient" isSummary />, '/accept-quote/:id/*');

        await waitFor(() => expect(screen.getByTestId('address-lookup')).toHaveAttribute('data-name', 'reportRecipient.businessStreetAddress'));
    });

    it('renders delivery/return editable, no-delivery, and summary branches', async () => {
        const DeliveryAndReturn = (await import('../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn')).default;
        const { unmount } = renderRoute('/accept-quote/AQ-1/delivery-and-return', <DeliveryAndReturn id="AQ-1" name="" />, '/accept-quote/:id/*');

        await waitFor(() => expect(screen.getByText('Instrument/artefact delivery')).toBeInTheDocument());
        expect(screen.getByTestId('mailing-label')).toHaveTextContent('Q-100');
        expect(screen.getByTestId('delivery-instructions')).toHaveTextContent('Use the loading dock.');
        unmount();

        mocks.getDeliveryAndReturn.mockResolvedValueOnce({ acceptQuotePreInfo: { receiptAndDispatchNA: true } });
        renderRoute('/accept-quote/AQ-1/delivery-and-return', <DeliveryAndReturn id="AQ-1" name="deliveryAndReturn" isSummary />, '/accept-quote/:id/*');

        await waitFor(() => expect(screen.getByText(/does not require the delivery or return/)).toBeInTheDocument());
    });

    it('renders the editable no-delivery information variant', async () => {
        mocks.getDeliveryAndReturn.mockResolvedValueOnce({
            acceptQuotePreInfo: { receiptAndDispatchNA: true },
        });
        const DeliveryAndReturn = (await import('../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn')).default;

        renderRoute('/accept-quote/AQ-1/delivery-and-return', <DeliveryAndReturn id="AQ-1" name="" />, '/accept-quote/:id/*');

        await waitFor(() => expect(screen.getByText(/does not require the delivery or return/)).toBeInTheDocument());
        expect(screen.getByRole('status')).toHaveClass('alert-info');
    });

    it.each([
        ['BusinessAddress', '1 National Circuit'],
        ['PostalAddress', 'PO Box 1'],
        ['Other', '9 Return Road'],
    ])('renders the %s return address summary', async (returnAddressType, expectedAddress) => {
        mocks.getDeliveryAndReturn.mockResolvedValueOnce({
            returnAddressType,
            returnAddress: { line1: '9 Return Road', suburb: 'Canberra', state: 'ACT', postcode: '2602' },
            rfqOrganisation: {
                streetAddress,
                postalAddressSameAsStreetAddress: false,
                postalAddress: { line1: 'PO Box 1', suburb: 'Canberra', state: 'ACT', postcode: '2601' },
            },
        });
        const DeliveryAndReturn = (await import('../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn')).default;

        renderRoute(
            '/accept-quote/AQ-1/delivery-and-return',
            <DeliveryAndReturn id="AQ-1" name="deliveryAndReturn" isSummary />,
            '/accept-quote/:id/*',
        );

        await waitFor(() => expect(screen.getByText(new RegExp(expectedAddress))).toBeInTheDocument());
    });

    it('renders a return organisation name in the delivery summary', async () => {
        mocks.getDeliveryAndReturn.mockResolvedValueOnce({
            returnAddressType: 'BusinessAddress',
            returnOrganisationName: 'Return Organisation',
            rfqOrganisation: { streetAddress },
        });
        const DeliveryAndReturn = (await import('../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn')).default;

        renderRoute(
            '/accept-quote/AQ-1/delivery-and-return',
            <DeliveryAndReturn id="AQ-1" name="deliveryAndReturn" isSummary />,
            '/accept-quote/:id/*',
        );

        await waitFor(() => expect(screen.getByText('Return Organisation')).toBeInTheDocument());
    });

    it('logs delivery and lookup load failures', async () => {
        mocks.getDeliveryAndReturn.mockRejectedValueOnce(new Error('delivery failed'));
        const DeliveryAndReturn = (await import('../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn')).default;
        const { unmount } = renderRoute(
            '/accept-quote/AQ-1/delivery-and-return',
            <DeliveryAndReturn id="AQ-1" name="" />,
            '/accept-quote/:id/*',
        );

        await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to load AcceptQuotePreInfo',
            expect.any(Error),
            { Id: 'AQ-1' },
        ));
        unmount();

        mocks.getLookup.mockReset();
        mocks.getLookup.mockRejectedValueOnce(new Error('lookup failed'));
        const InstrumentAndRequest = (await import('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest')).default;
        renderRoute(
            '/request-for-quote/RFQ-1/instrument-and-request',
            <InstrumentAndRequest name="" />,
            '/request-for-quote/:id/*',
        );

        await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to retrieve look ups',
            expect.any(Error),
        ));
    });

    it('renders payment details prepaid, postpaid, and summary contact sections', async () => {
        const PaymentDetails = (await import('../../../ClientApp/src/routes/acceptQuote/paymentDetails')).default;
        const { unmount } = renderRoute('/accept-quote/AQ-1/payment-details', <PaymentDetails id="AQ-1" name="" />, '/accept-quote/:id/*');

        await waitFor(() => expect(screen.getByText(/Prepayment required/)).toBeInTheDocument());
        expect(screen.getByText('Purchase Order (PO) number (optional)')).toBeInTheDocument();
        unmount();

        mocks.getPaymentDetails.mockResolvedValueOnce({ acceptQuotePreInfo: { ...basePreInfo, paymentTerms: 'Postpaid' } });
        renderRoute('/accept-quote/AQ-1/payment-details', <PaymentDetails id="AQ-1" name="paymentDetails" isSummary />, '/accept-quote/:id/*');

        await waitFor(() => expect(screen.getAllByText('Invoice contact person')).toHaveLength(2));
        expect(screen.queryByTestId('info-summary')).not.toBeInTheDocument();
    });

    it('logs payment and report recipient load failures', async () => {
        mocks.getPaymentDetails.mockRejectedValueOnce(new Error('payment failed'));
        const PaymentDetails = (await import('../../../ClientApp/src/routes/acceptQuote/paymentDetails')).default;
        const { unmount } = renderRoute('/accept-quote/AQ-1/payment-details', <PaymentDetails id="AQ-1" name="" />, '/accept-quote/:id/*');

        await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to load Payment details',
            expect.any(Error),
            { Id: 'AQ-1' },
        ));
        unmount();

        mocks.getReportRecipient.mockRejectedValueOnce(new Error('recipient failed'));
        const ReportRecipient = (await import('../../../ClientApp/src/routes/acceptQuote/reportRecipient')).default;
        renderRoute('/accept-quote/AQ-2/report-recipient', <ReportRecipient id="AQ-2" name="" />, '/accept-quote/:id/*');

        await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to load AcceptQuotePreInfo',
            expect.any(Error),
            { Id: 'AQ-2' },
        ));
    });

    it('uses separate postal address details for report recipients', async () => {
        mocks.getReportRecipient.mockResolvedValueOnce({
            reportAddressType: 'PostalAddress',
            rfqOrganisation: {
                streetAddress,
                postalAddressSameAsStreetAddress: false,
                postalAddress: { line1: 'PO Box 44', suburb: 'Canberra', state: 'ACT', postcode: '2601' },
            },
        });
        const ReportRecipient = (await import('../../../ClientApp/src/routes/acceptQuote/reportRecipient')).default;

        renderRoute('/accept-quote/AQ-1/report-recipient', <ReportRecipient id="AQ-1" name="reportRecipient" isSummary />, '/accept-quote/:id/*');

        await waitFor(() => expect(screen.getByText(/PO Box 44/)).toBeInTheDocument());
    });

    it('uses the street address as the delivery postal address when configured', async () => {
        mocks.getDeliveryAndReturn.mockResolvedValueOnce({
            returnAddressType: 'PostalAddress',
            rfqOrganisation: {
                streetAddress,
                postalAddressSameAsStreetAddress: true,
            },
        });
        const DeliveryAndReturn = (await import('../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn')).default;

        renderRoute('/accept-quote/AQ-1/delivery-and-return', <DeliveryAndReturn id="AQ-1" name="deliveryAndReturn" isSummary />, '/accept-quote/:id/*');

        await waitFor(() => expect(screen.getByText(/1 National Circuit/)).toBeInTheDocument());
    });

    it('renders summary-and-accept content and downloads quote terms', async () => {
        mocks.dashboardNotification = { message: 'Saved draft', severity: 'info' };
        const SummaryAndAccept = (await import('../../../ClientApp/src/routes/acceptQuote/summaryAndAccept')).default;

        renderRoute('/accept-quote/AQ-1/summary-and-accept', <SummaryAndAccept id="AQ-1" name="" cRMQuoteRequestId="CRM-1" />, '/accept-quote/:id/*');

        await waitFor(() => expect(screen.getByText('Quotation terms and conditions')).toBeInTheDocument());
        expect(screen.getByText('Saved draft')).toBeInTheDocument();
        expect(screen.getByText('Alex Tester')).toBeInTheDocument();
        expect(screen.getByText('Request Owner')).toBeInTheDocument();

        fireEvent.click(screen.getAllByRole('button', { name: /Terms/i })[0]);

        await waitFor(() => expect(mocks.getQuoteOfferPDFByQuoteID).toHaveBeenCalledWith('CRM-Q-100', true));
        expect(mocks.openPdfPageInNewTab).toHaveBeenCalledWith(expect.stringContaining('blob:'), '2');
    });

    it('sets the dashboard notification when quote terms download fails and renders submitted action', async () => {
        mocks.getQuoteOfferPDFByQuoteID.mockRejectedValueOnce(new Error('download failed'));
        const SummaryAndAccept = (await import('../../../ClientApp/src/routes/acceptQuote/summaryAndAccept')).default;

        renderRoute('/accept-quote/AQ-2/summary-and-accept', <SummaryAndAccept id="AQ-2" name="" isSubmitted cRMQuoteRequestId="CRM-2" />, '/accept-quote/:id/*');

        await waitFor(() => expect(screen.getByTestId('back-button')).toHaveAttribute('href', '/submitted-success/AQ-2'));
        fireEvent.click(screen.getAllByRole('button', { name: /Terms/i })[0]);

        await waitFor(() => expect(mocks.setDashboardNotification).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
        })));
    });

    it('downloads terms from the acceptance link', async () => {
        const SummaryAndAccept = (await import('../../../ClientApp/src/routes/acceptQuote/summaryAndAccept')).default;
        renderRoute('/accept-quote/AQ-1/summary-and-accept', <SummaryAndAccept id="AQ-1" name="" cRMQuoteRequestId="CRM-1" />, '/accept-quote/:id/*');

        await waitFor(() => expect(screen.getAllByRole('button', { name: /terms/i })).toHaveLength(2));
        fireEvent.click(screen.getAllByRole('button', { name: /terms/i })[1]);

        await waitFor(() => expect(mocks.getQuoteOfferPDFByQuoteID).toHaveBeenCalled());
    });

    it('does not open incomplete quote terms and renders sparse organisation alternatives', async () => {
        mocks.getQuoteOfferPDFByQuoteID.mockResolvedValueOnce({
            fileData: 'pdf-data',
            mimeType: undefined,
            filename: 'quote.pdf',
        });
        mocks.getSummaryAndAccept.mockResolvedValueOnce({
            acceptQuotePreInfo: basePreInfo,
            rfqOrganisation: {
                businessOrTradingName: 'Trading only',
                branchOrLocationName: undefined,
                streetAddress: {
                    line1: '1 National Circuit',
                    line2: 'Level 2',
                    line3: 'Building A',
                    suburb: 'Canberra',
                    state: 'ACT',
                    postcode: '2600',
                },
            },
        });
        const SummaryAndAccept = (await import('../../../ClientApp/src/routes/acceptQuote/summaryAndAccept')).default;

        const { unmount } = renderRoute(
            '/accept-quote/AQ-1/summary-and-accept',
            <SummaryAndAccept id="AQ-1" name="" cRMQuoteRequestId="CRM-1" />,
            '/accept-quote/:id/*',
        );

        await waitFor(() => expect(screen.getByText('Trading only')).toBeInTheDocument());
        expect(screen.getByText('Level 2')).toBeInTheDocument();
        expect(screen.getByText('Building A')).toBeInTheDocument();
        fireEvent.click(screen.getAllByRole('button', { name: /Terms/i })[0]);
        await waitFor(() => expect(mocks.getQuoteOfferPDFByQuoteID).toHaveBeenCalled());
        expect(mocks.openPdfPageInNewTab).not.toHaveBeenCalled();
        unmount();

        mocks.getSummaryAndAccept.mockResolvedValueOnce({
            acceptQuotePreInfo: basePreInfo,
            rfqOrganisation: {
                businessOrTradingName: undefined,
                branchOrLocationName: 'Branch only',
            },
        });
        renderRoute(
            '/accept-quote/AQ-2/summary-and-accept',
            <SummaryAndAccept id="AQ-2" name="" cRMQuoteRequestId="CRM-2" />,
            '/accept-quote/:id/*',
        );

        await waitFor(() => expect(screen.getByText('Branch only')).toBeInTheDocument());
    });

    it('logs summary-and-accept load failures', async () => {
        mocks.getSummaryAndAccept.mockRejectedValueOnce(new Error('summary failed'));
        const SummaryAndAccept = (await import('../../../ClientApp/src/routes/acceptQuote/summaryAndAccept')).default;

        renderRoute('/accept-quote/AQ-1/summary-and-accept', <SummaryAndAccept id="AQ-1" name="" cRMQuoteRequestId="CRM-1" />, '/accept-quote/:id/*');

        await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to retrieve getAcceptQuotePreInfo',
            expect.any(Error),
            { Id: 'AQ-1' },
        ));
    });
});
