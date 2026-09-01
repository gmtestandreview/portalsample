import {
    act,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import InstrumentInfoPanel from '@/routes/ta/instrumentInfoPanel';

const mocks = vi.hoisted(() => {
    const acquireTokenSilent = vi.fn();

    return {
        acquireTokenSilent,
        getInfoPanelContent: vi.fn(),
        msalContext: {
            accounts: [{ localAccountId: 'account-id' }],
            instance: {
                acquireTokenSilent,
            },
        },
        setAuthToken: vi.fn(),
    };
});

vi.mock('@azure/msal-react', () => ({
    useMsal: () => mocks.msalContext,
}));

vi.mock('@/api/web-api-client', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/api/web-api-client')>();

    return {
        ...actual,
        LookupClient: vi.fn(function LookupClientMock() {
            return {
                getInfoPanelContent: mocks.getInfoPanelContent,
                setAuthToken: mocks.setAuthToken,
            };
        }),
    };
});

const categoryId = '11111111-1111-4111-8111-111111111111';
const typeId = '22222222-2222-4222-8222-222222222222';
const emptyGuid = '00000000-0000-0000-0000-000000000000';

describe('InstrumentInfoPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'lookup-token' });
        mocks.getInfoPanelContent.mockResolvedValue([{
            requirements: 'Pattern approval evidence checklist',
            requirementsLink: 'https://example.test/pattern-approval-requirements',
        }]);
    });

    it('renders the hidden empty state and does not fetch lookup data when no instrument is selected', () => {
        render(<InstrumentInfoPanel name='instrument' />);

        expect(screen.getByText('There are no References for this instrument type.')).toHaveClass('visually-hidden');
        expect(mocks.acquireTokenSilent).not.toHaveBeenCalled();
        expect(mocks.getInfoPanelContent).not.toHaveBeenCalled();
    });

    it('shows default guidance and new-customer credit form when only a category is selected', () => {
        render(<InstrumentInfoPanel name='instrument' selectedInstrumentCategoryId={categoryId} />);

        expect(screen.getByRole('alert')).toHaveAttribute('id', 'instrument-panel');
        expect(screen.getByText('References for this instrument type')).toBeInTheDocument();
        expect(screen.getByText(/select an instrument category and type/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /download credit check application form/i }))
            .toHaveAttribute(
                'href',
                'https://www.industry.gov.au/sites/default/files/2025-07/NMI-credit-application-form.pdf',
            );
        expect(mocks.getInfoPanelContent).not.toHaveBeenCalled();
    });

    it('loads and renders lookup resource links for a valid category and type', async () => {
        let resolveInfoPanelContent: (value: Array<{ requirements: string, requirementsLink: string }>) => void;
        const infoPanelContent = new Promise<Array<{ requirements: string, requirementsLink: string }>>((resolve) => {
            resolveInfoPanelContent = resolve;
        });
        mocks.getInfoPanelContent.mockReturnValue(infoPanelContent);

        render(
            <InstrumentInfoPanel
                name='instrument'
                selectedInstrumentCategoryId={categoryId}
                selectedInstrumentTypeId={typeId}
                isNewCustomer={false}
            />,
        );

        expect(await screen.findByText('Loading data...')).toBeInTheDocument();
        await act(async () => {
            resolveInfoPanelContent!([{
                requirements: 'Pattern approval evidence checklist',
                requirementsLink: 'https://example.test/pattern-approval-requirements',
            }]);
            await infoPanelContent;
        });

        const requirementsLink = await screen.findByRole('link', {
            name: /pattern approval evidence checklist/i,
        });
        expect(requirementsLink).toHaveAttribute('href', 'https://example.test/pattern-approval-requirements');
        expect(screen.queryByText(/select an instrument category and type/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /download credit check application form/i })).not.toBeInTheDocument();

        await waitFor(() => expect(mocks.setAuthToken).toHaveBeenCalledWith('lookup-token'));
        expect(mocks.getInfoPanelContent).toHaveBeenCalledWith(typeId, categoryId);
    });

    it('keeps default guidance and skips the lookup for empty or invalid GUID selections', () => {
        const { rerender } = render(
            <InstrumentInfoPanel
                name='instrument'
                selectedInstrumentCategoryId={emptyGuid}
                selectedInstrumentTypeId={typeId}
            />,
        );

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/select an instrument category and type/i)).toBeInTheDocument();
        expect(mocks.getInfoPanelContent).not.toHaveBeenCalled();

        rerender(
            <InstrumentInfoPanel
                name='instrument'
                selectedInstrumentCategoryId='not-a-guid'
                selectedInstrumentTypeId='also-not-a-guid'
            />,
        );

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/select an instrument category and type/i)).toBeInTheDocument();
        expect(mocks.getInfoPanelContent).not.toHaveBeenCalled();
    });
});
