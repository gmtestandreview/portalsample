import {
    act, cleanup, fireEvent, render, screen, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    Form, Formik, type FormikErrors, type FormikTouched, useFormikContext,
} from 'formik';
import { MemoryRouter } from 'react-router';
import AddressLookup from '@/components/Inputs/AddressLookup';
import AutoSuggest from '@/components/Inputs/AutoSuggest';
import AutoSuggestContainer from '@/components/Inputs/AutoSuggest/AutoSuggestContainer';
import AutoSuggestOptions from '@/components/Inputs/AutoSuggest/AutoSuggestOptions';
import ManualAddressInput from '@/components/Inputs/AddressLookup/ManualAddressInput';
import NumberInput from '@/components/Inputs/NumberInput';
import OrganisationNameLookup from '@/components/Inputs/OrganisationNameLookup';
import CertificateNumberLookup from '@/components/Inputs/CertificateNumberLookup';
import type * as WebApiClientModule from '@/api/web-api-client';
import { installUnexpectedConsoleGuard } from '../../../helpers/unexpectedConsoleGuard';

type MockAccount = { homeAccountId: string } | null;

function AddressClient() {
    return {
        setAuthToken: mocks.setAuthToken,
        search: mocks.addressSearch,
    };
}

const mocks: {
    acquireTokenSilent: ReturnType<typeof vi.fn>;
    account: MockAccount;
    accounts: Array<{ homeAccountId: string }>;
    addressSearch: ReturnType<typeof vi.fn>;
    inProgress: string;
    setAuthToken: ReturnType<typeof vi.fn>;
} = vi.hoisted(() => ({
    acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'unit-token' }),
    account: { homeAccountId: 'account-1' },
    accounts: [{ homeAccountId: 'account-1' }],
    addressSearch: vi.fn(),
    inProgress: 'none',
    setAuthToken: vi.fn(),
}));

vi.mock('@azure/msal-react', () => ({
    useAccount: () => mocks.account,
    useMsal: () => ({
        accounts: mocks.accounts,
        inProgress: mocks.inProgress,
        instance: { acquireTokenSilent: mocks.acquireTokenSilent },
    }),
}));

vi.mock('@/api/web-api-client', async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();
    return {
        ...actual,
        AddressClient,
    };
});

interface FormikHarnessProps {
    readonly initialValues: Record<string, unknown>;
    readonly initialTouched?: FormikTouched<Record<string, any>>;
    readonly initialErrors?: FormikErrors<Record<string, unknown>>;
    readonly children: React.ReactNode;
}

function FormikHarness({
    initialValues,
    initialTouched,
    initialErrors,
    children,
}: FormikHarnessProps) {
    return (
        <MemoryRouter>
            <Formik
                enableReinitialize
                initialValues={initialValues}
                initialTouched={initialTouched}
                initialErrors={initialErrors}
                onSubmit={vi.fn()}
            >
                <Form>
                    {children}
                </Form>
            </Formik>
        </MemoryRouter>
    );
}

function ValuesProbe() {
    const { values, touched } = useFormikContext<Record<string, unknown>>();
    return (
        <>
            <pre data-testid='values'>{JSON.stringify(values)}</pre>
            <pre data-testid='touched'>{JSON.stringify(touched)}</pre>
        </>
    );
}

describe('complex input behavior slice', () => {
    installUnexpectedConsoleGuard();

    // Registered after the guard so it runs first: Vitest runs `afterEach` in
    // reverse order, and a guard failure would otherwise skip the global
    // cleanup and leak the previous test's DOM into the next one.
    afterEach(cleanup);

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.account = { homeAccountId: 'account-1' };
        mocks.accounts = [{ homeAccountId: 'account-1' }];
        mocks.inProgress = 'none';
        mocks.addressSearch.mockResolvedValue({
            matches: [
                {
                    displayText: '1 National Circuit, Barton ACT 2600',
                    unqiueId: 'address-1',
                    addressLine1: '1 National Circuit',
                    addressLine2: '',
                    addressLine3: '',
                    suburb: 'Barton',
                    postCode: '2600',
                    state: 'ACT',
                },
            ],
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders ManualAddressInput fields with labels and updates nested values', async () => {
        const user = userEvent.setup();

        render(
            <FormikHarness initialValues={{ address: { line1: '', state: '' } }}>
                <ManualAddressInput name='address' />
                <ValuesProbe />
            </FormikHarness>,
        );

        await user.type(screen.getByRole('textbox', { name: 'Address line 1' }), '15 Lab Street');
        await user.type(screen.getByRole('textbox', { name: 'Suburb' }), 'Lindfield');
        await user.selectOptions(screen.getByRole('combobox', { name: 'State' }), 'NSW');

        await waitFor(() => {
            expect(screen.getByTestId('values')).toHaveTextContent('"line1":"15 Lab Street"');
            expect(screen.getByTestId('values')).toHaveTextContent('"suburb":"Lindfield"');
            expect(screen.getByTestId('values')).toHaveTextContent('"state":"NSW"');
        });
    });

    it('forwards supported props to manual address fields without widening the component contract', () => {
        render(
            <FormikHarness initialValues={{ address: { line1: '', state: '' } }}>
                <ManualAddressInput
                    name='address'
                    disabled
                    inlineHelp='Enter the full street address'
                />
            </FormikHarness>,
        );

        expect(screen.getByRole('textbox', { name: 'Address line 1' })).toBeDisabled();
        expect(screen.getByRole('textbox', { name: 'Suburb' })).toBeDisabled();
        expect(screen.getByRole('combobox', { name: 'State' })).toBeDisabled();
        expect(screen.getAllByText('Enter the full street address')).toHaveLength(6);
    });

    it('switches AddressLookup between search and manual entry and clears touched state', async () => {
        const user = userEvent.setup();

        render(
            <FormikHarness
                initialValues={{ address: { isManuallyEntered: false, searchText: '' } }}
                initialTouched={{ address: { searchText: true } }}
            >
                <AddressLookup name='address' label='Service address' />
                <ValuesProbe />
            </FormikHarness>,
        );

        expect(screen.getByRole('combobox', { name: 'Service address' })).toBeInTheDocument();
        expect(screen.getByTestId('touched')).toHaveTextContent('"searchText":true');

        await user.click(screen.getByRole('button', { name: /Enter it manually/i }));

        expect(screen.getByRole('group', { name: /Service address/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Address line 1' })).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByTestId('values')).toHaveTextContent('"isManuallyEntered":true');
            expect(screen.getByTestId('touched')).not.toHaveTextContent('"searchText":true');
        });

        await user.click(screen.getByRole('button', { name: /Find an address/i }));

        expect(screen.getByRole('combobox', { name: 'Service address' })).toBeInTheDocument();
    });

    it('searches AddressLookup and writes selected address details into Formik', async () => {
        const user = userEvent.setup();

        render(
            <FormikHarness
                initialValues={{
                    address: {
                        id: 7,
                        type: 'postal',
                        timeStamp: 'stamp',
                        isManuallyEntered: false,
                        searchText: '',
                    },
                }}
            >
                <AddressLookup name='address' label='Postal address' maxResults={1} />
                <ValuesProbe />
            </FormikHarness>,
        );

        await user.type(screen.getByRole('combobox', { name: 'Postal address' }), 'barton');
        const option = await screen.findByRole('option', { name: /1 National Circuit/i });
        await user.click(option);

        await waitFor(() => {
            expect(mocks.acquireTokenSilent).toHaveBeenCalled();
            expect(mocks.setAuthToken).toHaveBeenCalledWith('unit-token');
            expect(mocks.addressSearch).toHaveBeenCalledWith('barton', expect.any(AbortSignal));
            expect(screen.getByTestId('values')).toHaveTextContent('"line1":"1 National Circuit"');
            expect(screen.getByTestId('values')).toHaveTextContent('"postcode":"2600"');
            expect(screen.getByTestId('values')).toHaveTextContent('"searchText":"1 National Circuit, Barton ACT 2600"');
        });
    });

    it('uses AddressLookup fallbacks for missing labels and address fields', async () => {
        const user = userEvent.setup();
        mocks.addressSearch.mockResolvedValue({
            matches: [{
                displayText: undefined,
                unqiueId: undefined,
                addressLine1: undefined,
                addressLine2: 'Suite 2',
                addressLine3: 'Building A',
                suburb: undefined,
                postCode: undefined,
                state: 'NSW',
            }],
        });

        render(
            <FormikHarness initialValues={{
                address: {
                    searchText: '',
                    isManuallyEntered: false,
                },
            }}>
                <AddressLookup name='address' />
                <ValuesProbe />
            </FormikHarness>,
        );

        const search = screen.getByRole('combobox', { name: 'Address' });
        await user.type(search, 'missing fields');
        const options = await screen.findAllByRole('option');
        await user.click(options[0]);

        await waitFor(() => {
            expect(screen.getByTestId('values')).toHaveTextContent('"line1":""');
            expect(screen.getByTestId('values')).toHaveTextContent('"suburb":""');
            expect(screen.getByTestId('values')).toHaveTextContent('"postcode":""');
        });
    });

    it('returns no service results when the signed-in account cannot be resolved', async () => {
        const user = userEvent.setup();
        mocks.account = null;

        render(
            <FormikHarness initialValues={{
                address: {
                    searchText: '',
                    isManuallyEntered: false,
                },
            }}>
                <AddressLookup name='address' label='Address' />
            </FormikHarness>,
        );

        await user.type(screen.getByRole('combobox', { name: 'Address' }), 'query');

        expect(await screen.findByRole('option', { name: /No matches found/i })).toBeInTheDocument();
        expect(mocks.addressSearch).not.toHaveBeenCalled();
    });

    it('uses the empty account fallback and skips searches while authentication is busy', async () => {
        const user = userEvent.setup();
        mocks.accounts = [];
        mocks.inProgress = 'login';

        render(
            <FormikHarness initialValues={{
                address: {
                    searchText: '',
                    isManuallyEntered: false,
                },
            }}>
                <AddressLookup name='address' label='Address' />
            </FormikHarness>,
        );

        await user.type(screen.getByRole('combobox', { name: 'Address' }), 'query');

        expect(await screen.findByRole('option', { name: /No matches found/i })).toBeInTheDocument();
        expect(mocks.addressSearch).not.toHaveBeenCalled();
    });

    it('handles missing match collections and non-service lookup errors', async () => {
        const user = userEvent.setup();

        mocks.addressSearch
            .mockResolvedValueOnce({ matches: undefined })
            .mockRejectedValueOnce({ status: 500, message: 'Failure' });

        render(
            <FormikHarness initialValues={{
                address: {
                    searchText: '',
                    isManuallyEntered: false,
                },
            }}>
                <AddressLookup name='address' label='Address' />
            </FormikHarness>,
        );

        const input = screen.getByRole('combobox', { name: 'Address' });
        await user.click(input);
        fireEvent.change(input, { target: { value: 'first' } });
        expect(await screen.findByRole('option', { name: /No matches found/i })).toBeInTheDocument();

        fireEvent.change(input, { target: { value: 'second' } });
        expect(await screen.findByRole('option', { name: /No matches found/i })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: /service is currently unavailable/i })).not.toBeInTheDocument();
    });

    it('switches AddressLookup to manual entry from a no-match result and clears a selected address', async () => {
        const user = userEvent.setup();
        mocks.addressSearch.mockResolvedValue({ matches: [] });

        const { rerender } = render(
            <FormikHarness initialValues={{
                address: {
                    id: 1,
                    type: 'Postal',
                    timeStamp: 'stamp',
                    searchText: '',
                    isManuallyEntered: false,
                },
            }}>
                <AddressLookup name='address' label='Postal address' />
                <ValuesProbe />
            </FormikHarness>,
        );

        const search = screen.getByRole('combobox', { name: 'Postal address' });
        await user.type(search, 'missing');
        await user.click(await screen.findByRole('option', { name: /No matches found/ }));

        expect(screen.getByRole('group', { name: /Postal address.*Enter the address manually/ })).toBeInTheDocument();
        expect(screen.getByTestId('values')).toHaveTextContent('"isManuallyEntered":true');
        expect(screen.getByTestId('values')).toHaveTextContent('"line1":""');

        rerender(
            <FormikHarness initialValues={{
                address: {
                    id: 2,
                    type: 'Street',
                    timeStamp: 'stamp-2',
                    line1: 'Existing',
                    searchText: 'Existing address',
                    isManuallyEntered: false,
                },
            }}>
                <AddressLookup name='address' label='Street address' />
                <ValuesProbe />
            </FormikHarness>,
        );

        const selectedSearch = screen.getByRole('combobox', { name: 'Street address' });
        await user.clear(selectedSearch);
        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"line1":""'));
        expect(screen.getByTestId('values')).toHaveTextContent('"isManuallyEntered":false');
    });

    it('offers manual entry after the address service reports unavailable', async () => {
        const user = userEvent.setup();
        mocks.addressSearch.mockRejectedValue({
            status: 503,
            message: 'Unavailable',
        });

        render(
            <FormikHarness initialValues={{
                address: {
                    searchText: '',
                    isManuallyEntered: false,
                },
            }}>
                <AddressLookup name='address' label='Service address' />
            </FormikHarness>,
        );

        const search = screen.getByRole('combobox', { name: 'Service address' });
        await user.type(search, 'first');
        expect(await screen.findByRole('option', {
            name: /address lookup service is currently unavailable/i,
        })).toBeInTheDocument();
    });

    it('aborts an in-flight AddressLookup request when a new search starts', async () => {
        const user = userEvent.setup();
        let firstSignal: AbortSignal | undefined;
        mocks.addressSearch
            .mockImplementationOnce((_term: string, signal: AbortSignal) => {
                firstSignal = signal;
                return new Promise(() => {});
            })
            .mockResolvedValueOnce({ matches: [] });

        render(
            <FormikHarness initialValues={{
                address: {
                    searchText: '',
                    isManuallyEntered: false,
                },
            }}>
                <AddressLookup name='address' label='Service address' />
            </FormikHarness>,
        );

        const search = screen.getByRole('combobox', { name: 'Service address' });
        await user.type(search, 'first');
        await waitFor(() => {
            expect(mocks.addressSearch.mock.calls.length).toBeGreaterThan(1);
            expect(firstSignal?.aborted).toBe(true);
        });
    });

    it('renders AddressLookup summaries with formatted address or fallback', () => {
        const { rerender } = render(
            <FormikHarness
                initialValues={{
                    address: {
                        line1: '1 National Circuit',
                        suburb: 'Barton',
                        state: 'ACT',
                        postcode: '2600',
                    },
                }}
            >
                <AddressLookup name='address' label='Address summary' isSummary />
            </FormikHarness>,
        );

        expect(screen.getByText('Address summary')).toBeInTheDocument();
        expect(screen.getByText(/1 National Circuit/i)).toBeInTheDocument();
        expect(screen.getByText(/Barton ACT 2600/i)).toBeInTheDocument();

        rerender(
            <FormikHarness initialValues={{ address: undefined }}>
                <AddressLookup name='address' label='Address summary' isSummary />
            </FormikHarness>,
        );

        expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('drives AutoSuggest search and selection through the public input', async () => {
        const user = userEvent.setup();
        const getOptions = vi.fn().mockResolvedValue([
            { id: 'cal-1', displayText: 'Calibration services', value: { id: 1 } },
        ]);
        const onSelectedOption = vi.fn().mockResolvedValue(undefined);

        render(
            <FormikHarness initialValues={{ service: '' }}>
                <AutoSuggest
                    name='service'
                    label='Service'
                    inlineHelp='Start typing a service'
                    getOptions={getOptions}
                    onSelectedOption={onSelectedOption}
                    selectedOption=''
                />
            </FormikHarness>,
        );

        const combobox = screen.getByRole('combobox', { name: 'Service' });
        expect(combobox).toHaveAccessibleDescription('Start typing a service');

        await user.type(combobox, 'cal');
        await user.click(await screen.findByRole('option', { name: /Calibration services/ }));

        expect(getOptions).toHaveBeenCalledWith('cal');
        expect(onSelectedOption).toHaveBeenCalledWith({
            id: 'cal-1',
            displayText: 'Calibration services',
            value: { id: 1 },
        });

        expect(screen.queryByRole('option', { name: /Calibration services/ })).not.toBeInTheDocument();
    });

    it('handles AutoSuggestContainer keyboard selection, escape cancel, status, and validation feedback', async () => {
        const user = userEvent.setup();
        const onSelectedOption = vi.fn().mockResolvedValue(undefined);
        const onCancel = vi.fn();
        const onSearchTermChange = vi.fn();

        render(
            <FormikHarness
                initialValues={{ suburb: 'Syd' }}
                initialTouched={{ suburb: true }}
                initialErrors={{ suburb: 'Choose a suburb' }}
            >
                <AutoSuggestContainer
                    name='suburb'
                    id='suburb-id'
                    label='Suburb'
                    options={[
                        { id: 'syd', displayText: 'Sydney NSW', value: 'sydney' },
                        { id: 'park', displayText: 'Sydney Olympic Park NSW', value: 'park' },
                    ]}
                    searchTerm='Syd'
                    loading
                    noResult
                    error
                    onSearchTermChange={onSearchTermChange}
                    onCancel={onCancel}
                    onSelectedOption={onSelectedOption}
                />
            </FormikHarness>,
        );

        const combobox = screen.getByRole('combobox', { name: 'Suburb' });
        expect(combobox).toHaveAccessibleDescription('Choose a suburb');
        expect(screen.getByText('Loading options')).toBeInTheDocument();
        expect(screen.getByText('Results could not be fetched')).toBeInTheDocument();

        await user.click(combobox);
        await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

        await waitFor(() => expect(onSelectedOption).toHaveBeenCalledWith({
            id: 'park',
            displayText: 'Sydney Olympic Park NSW',
            value: 'park',
        }));

        await user.keyboard('{Escape}');
        expect(onCancel).toHaveBeenCalled();
    });

    it('wraps AutoSuggestContainer keyboard navigation and selects with Tab', async () => {
        const user = userEvent.setup();
        const onSelectedOption = vi.fn().mockResolvedValue(undefined);
        const onCancel = vi.fn();

        render(
            <FormikHarness initialValues={{ suburb: 'Syd' }}>
                <AutoSuggestContainer
                    name='suburb'
                    label='Suburb'
                    options={[
                        { id: 'first', displayText: 'First suburb', value: 'first' },
                        { id: 'last', displayText: 'Last suburb', value: 'last' },
                    ]}
                    searchTerm='Syd'
                    onSearchTermChange={vi.fn()}
                    onCancel={onCancel}
                    onSelectedOption={onSelectedOption}
                />
            </FormikHarness>,
        );

        const combobox = screen.getByRole('combobox', { name: 'Suburb' });
        await user.click(combobox);

        await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
        expect(combobox).toHaveAttribute('aria-activedescendant', 'suburb-options-option-last');

        await user.keyboard('{ArrowUp}');
        expect(combobox).toHaveAttribute('aria-activedescendant', 'suburb-options-option-first');

        await user.keyboard('{ArrowUp}');
        expect(combobox).toHaveAttribute('aria-activedescendant', 'suburb-options-option-first');

        await user.keyboard('{Tab}');
        await waitFor(() => expect(onSelectedOption).toHaveBeenCalledWith({
            id: 'first',
            displayText: 'First suburb',
            value: 'first',
        }));
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('dismisses AutoSuggestContainer without invoking Escape cancellation', async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();
        render(
            <FormikHarness initialValues={{ suburb: 'Syd' }}>
                <AutoSuggestContainer
                    name='suburb'
                    label='Suburb'
                    options={[{ id: 'syd', displayText: 'Sydney', value: 'sydney' }]}
                    searchTerm='Syd'
                    onSearchTermChange={vi.fn()}
                    onCancel={onCancel}
                    onSelectedOption={vi.fn()}
                />
                <button type='button'>Outside target</button>
            </FormikHarness>,
        );

        const combobox = screen.getByRole('combobox', { name: 'Suburb' });
        await user.click(combobox);
        await user.keyboard('{Enter}');
        expect(onCancel).not.toHaveBeenCalled();

        await user.click(screen.getByRole('button', { name: 'Outside target' }));
        expect(onCancel).not.toHaveBeenCalled();
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    it('renders custom AutoSuggestContainer status messages and marks the field touched on change', async () => {
        const user = userEvent.setup();
        const onSearchTermChange = vi.fn();
        render(
            <FormikHarness initialValues={{ suburb: '' }}>
                <AutoSuggestContainer
                    name='suburb'
                    label='Suburb'
                    options={[]}
                    searchTerm=''
                    loading
                    loadingMessage='Searching suburbs'
                    noResult
                    noResultMessage='No suburb options'
                    error
                    errorMessage='Suburb search failed'
                    onSearchTermChange={onSearchTermChange}
                    onCancel={vi.fn()}
                    onSelectedOption={vi.fn()}
                />
                <ValuesProbe />
            </FormikHarness>,
        );

        expect(screen.getByText('Searching suburbs')).toBeInTheDocument();
        expect(screen.queryByText('No suburb options')).not.toBeInTheDocument();
        expect(screen.getByText('Suburb search failed')).toBeInTheDocument();

        await user.type(screen.getByRole('combobox', { name: 'Suburb' }), 'x');
        expect(onSearchTermChange).toHaveBeenCalledWith('x');
        expect(screen.getByTestId('touched')).toHaveTextContent('"suburb":true');
    });

    it('handles short, empty, and no-result AutoSuggest searches and selected-option updates', async () => {
        const user = userEvent.setup();
        const getOptions = vi.fn().mockResolvedValueOnce([]);
        const onSelectedOption = vi.fn().mockResolvedValue(undefined);
        const { rerender } = render(
            <FormikHarness initialValues={{ service: '' }}>
                <AutoSuggest
                    name='service'
                    label='Service'
                    getOptions={getOptions}
                    onSelectedOption={onSelectedOption}
                    selectedOption='Existing service'
                />
            </FormikHarness>,
        );

        const combobox = screen.getByRole('combobox', { name: 'Service' });
        expect(combobox).toHaveValue('Existing service');

        await user.clear(combobox);
        expect(onSelectedOption).toHaveBeenCalledWith();
        expect(getOptions).not.toHaveBeenCalled();

        await user.type(combobox, 'ab');
        expect(getOptions).not.toHaveBeenCalled();

        await user.type(combobox, 'c');
        expect(getOptions).toHaveBeenCalledWith('abc');
        expect(await screen.findByText('No matches found')).toBeInTheDocument();

        rerender(
            <FormikHarness initialValues={{ service: '' }}>
                <AutoSuggest
                    name='service'
                    label='Service'
                    getOptions={getOptions}
                    onSelectedOption={onSelectedOption}
                    selectedOption='Updated service'
                />
            </FormikHarness>,
        );
        expect(screen.getByRole('combobox', { name: 'Service' })).toHaveValue('Updated service');
    });

    it('renders AutoSuggestOption within its collection and exposes selected state', () => {
        // Rendered outside a `ComboBox`, so it carries its own `aria-label`.
        // Nested, the popup inherits the ComboBox's visible label instead.
        render(
            <AutoSuggestOptions
                aria-label='Options'
                options={[{
                    id: 'option-1',
                    displayText: 'Approved option',
                    value: { code: 'approved' },
                }]}
                selectedOptionId='option-1'
            />,
        );

        const option = screen.getByRole('option', { name: /Approved option/ });
        expect(option).toHaveClass('highlighted');
        expect(screen.getByText('Approved option')).toBeInTheDocument();
    });

    it('filters OrganisationNameLookup options by parent and supports keyboard and click selection', async () => {
        const user = userEvent.setup();

        render(
            <FormikHarness
                initialValues={{
                    organisationName: '',
                    parentType: 'Calibration',
                    orgNameOptions: [
                        { name: 'Alpha Labs', type: 'Calibration' },
                        { name: 'Beta Testing', type: 'Testing' },
                        { name: 'Alpine Metrology', type: 'Calibration' },
                    ],
                }}
            >
                <OrganisationNameLookup
                    name='organisationName'
                    label='Organisation name'
                    optionsFieldName='name'
                    parentName='parentType'
                    parentOptionsName='type'
                    matchType='startsWith'
                    maxResults={2}
                />
                <ValuesProbe />
            </FormikHarness>,
        );

        const combobox = screen.getByRole('combobox', { name: 'Organisation name' });
        await user.type(combobox, 'Al');

        const listbox = await screen.findByRole('listbox', { name: 'Suggested options' });
        expect(within(listbox).getByRole('option', { name: /Alpha Labs/ })).toBeInTheDocument();
        expect(within(listbox).queryByRole('option', { name: /Beta Testing/ })).not.toBeInTheDocument();

        await user.keyboard('{ArrowDown}{Enter}');
        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"organisationName":"Alpha Labs"'));

        await user.clear(combobox);
        await user.type(combobox, 'Alp');
        await user.click(await screen.findByRole('option', { name: /Alpine Metrology/ }));

        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"organisationName":"Alpine Metrology"'));
    });

    it('handles OrganisationNameLookup short, free-text, escape, outside-click, and ArrowUp branches', async () => {
        const user = userEvent.setup();
        const scrollIntoView = vi.fn();
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: scrollIntoView,
        });

        render(
            <FormikHarness
                initialValues={{
                    organisationName: '',
                    orgNameOptions: [
                        { name: 'Alpha Labs' },
                        { name: 'Beta Labs' },
                    ],
                }}
            >
                <OrganisationNameLookup
                    name='organisationName'
                    label='Organisation name'
                    optionsFieldName='name'
                    matchType='endsWith'
                />
                <ValuesProbe />
                <button type='button'>Outside organisation lookup</button>
            </FormikHarness>,
        );

        const combobox = screen.getByRole('combobox', { name: 'Organisation name' });
        await user.type(combobox, 'x');
        expect(screen.queryByRole('listbox', { name: 'Suggested options' })).not.toBeInTheDocument();

        await user.clear(combobox);
        await user.type(combobox, 'Labs');
        await screen.findByRole('listbox', { name: 'Suggested options' });

        await user.keyboard('{ArrowUp}');
        await waitFor(() => expect(combobox).toHaveAttribute('aria-activedescendant', 'organisationName-option-1'));
        expect(scrollIntoView).toHaveBeenCalled();

        await user.keyboard('{Escape}');
        expect(screen.queryByRole('listbox', { name: 'Suggested options' })).not.toBeInTheDocument();

        await user.clear(combobox);
        await user.type(combobox, 'Labs');
        await screen.findByRole('listbox', { name: 'Suggested options' });
        await user.keyboard('{Enter}');
        expect(screen.getByTestId('values')).toHaveTextContent('"organisationName":"Beta Labs"');

        await user.clear(combobox);
        await user.type(combobox, 'Labs');
        await screen.findByRole('listbox', { name: 'Suggested options' });
        await user.click(screen.getByRole('button', { name: 'Outside organisation lookup' }));
        expect(screen.queryByRole('listbox', { name: 'Suggested options' })).not.toBeInTheDocument();
    });

    it('clears OrganisationNameLookup suggestions when the field is emptied', async () => {
        // Emptying the box has to discard the list that was already showing. The component keeps
        // the previous array when it is already empty so React can bail out of the render, so this
        // exercises the other side of that: a populated list being replaced with an empty one.
        const user = userEvent.setup();

        render(
            <FormikHarness
                initialValues={{
                    organisationName: '',
                    orgNameOptions: [
                        { name: 'Alpha Labs' },
                        { name: 'Beta Labs' },
                    ],
                }}
            >
                <OrganisationNameLookup
                    name='organisationName'
                    label='Organisation name'
                    optionsFieldName='name'
                    matchType='endsWith'
                />
                <ValuesProbe />
            </FormikHarness>,
        );

        const combobox = screen.getByRole('combobox', { name: 'Organisation name' });
        await user.type(combobox, 'Labs');
        await screen.findByRole('listbox', { name: 'Suggested options' });

        await user.clear(combobox);

        await waitFor(() => expect(
            screen.queryByRole('listbox', { name: 'Suggested options' }),
        ).not.toBeInTheDocument());
    });

    it('accepts OrganisationNameLookup free text when Enter is pressed without an active option', async () => {
        const user = userEvent.setup();
        render(
            <FormikHarness
                initialValues={{
                    organisationName: '',
                    orgNameOptions: [{ name: 'Alpha Labs' }],
                }}
            >
                <OrganisationNameLookup
                    name='organisationName'
                    label='Organisation name'
                    optionsFieldName='name'
                />
                <ValuesProbe />
            </FormikHarness>,
        );

        const combobox = screen.getByRole('combobox', { name: 'Organisation name' });
        await user.type(combobox, 'Labs');
        await screen.findByRole('listbox', { name: 'Suggested options' });
        await user.keyboard('{Enter}');

        expect(screen.getByTestId('values')).toHaveTextContent('"organisationName":"Labs"');
    });

    it('recomputes CertificateNumberLookup suggestions when Formik options change', async () => {
        vi.useFakeTimers();

        const renderLookup = (certNameOptions: Array<{ id: string; lookupName: string }>) => (
            <FormikHarness
                initialValues={{
                    certificateNumber: '',
                    certificateNumberId: '',
                    certNameOptions,
                }}
            >
                <CertificateNumberLookup
                    name='certificateNumber'
                    idName='certificateNumberId'
                    label='Certificate number'
                    optionsFieldName='lookupName'
                />
            </FormikHarness>
        );

        const { rerender } = render(renderLookup([
            { id: 'cert-1', lookupName: '5/6A/91B' },
        ]));

        fireEvent.change(screen.getByRole('textbox', { name: 'Certificate number' }), {
            target: { value: '5/6A' },
        });
        await act(async () => {
            vi.advanceTimersByTime(300);
        });
        expect(screen.getByRole('option', { name: /5\/6A\/91B/ })).toBeInTheDocument();

        rerender(renderLookup([
            { id: 'cert-2', lookupName: '5/6A/92C' },
        ]));
        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        expect(screen.queryByRole('option', { name: /5\/6A\/91B/ })).not.toBeInTheDocument();
        expect(screen.getByRole('option', { name: /5\/6A\/92C/ })).toBeInTheDocument();
    });

    it('filters CertificateNumberLookup suggestions by parent field and closes on outside clicks', async () => {
        vi.useFakeTimers();
        render(
            <FormikHarness
                initialValues={{
                    certificateNumber: '',
                    certificateNumberId: '',
                    family: 'NMI',
                    certNameOptions: [
                        { id: 'cert-1', lookupName: 'NMI-123', family: 'NMI' },
                        { id: 'cert-3', lookupName: 'NMI-122', family: 'NMI' },
                        { id: 'cert-2', lookupName: 'Industry-123', family: 'Industry' },
                    ],
                }}
            >
                <CertificateNumberLookup
                    name='certificateNumber'
                    idName='certificateNumberId'
                    label='Certificate number'
                    optionsFieldName='lookupName'
                    parentName='family'
                    parentOptionsName='family'
                    matchType='startsWith'
                />
            </FormikHarness>,
        );

        fireEvent.change(screen.getByRole('textbox', { name: 'Certificate number' }), {
            target: { value: 'NMI' },
        });
        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        expect(screen.getByRole('option', { name: /NMI-123/ })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /NMI-122/ })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: /Industry-123/ })).not.toBeInTheDocument();

        fireEvent.mouseDown(document.body);

        expect(screen.queryByRole('listbox', { name: 'Suggested options' })).not.toBeInTheDocument();
    });

    it('selects CertificateNumberLookup suggestions with keyboard navigation and falls back to typed input', async () => {
        vi.useFakeTimers();
        render(
            <FormikHarness
                initialValues={{
                    certificateNumber: '',
                    certificateNumberId: '',
                    certNameOptions: [
                        { id: 'cert-a', lookupName: '5/6A/91B' },
                        { id: 'cert-b', lookupName: '5/6A/92C' },
                    ],
                }}
            >
                <CertificateNumberLookup
                    name='certificateNumber'
                    idName='certificateNumberId'
                    label='Certificate number'
                    optionsFieldName='lookupName'
                    matchType='includes'
                />
                <ValuesProbe />
            </FormikHarness>,
        );

        const input = screen.getByRole('textbox', { name: 'Certificate number' });
        fireEvent.change(input, { target: { value: '5/6A' } });
        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        await act(async () => {
            fireEvent.keyDown(input, { key: 'Enter' });
        });

        expect(screen.getByTestId('values')).toHaveTextContent('"certificateNumber":"5/6A"');
        expect(screen.getByTestId('values')).toHaveTextContent('"certificateNumberId":"5/6A"');

        fireEvent.change(input, { target: { value: '92C' } });
        await act(async () => {
            vi.advanceTimersByTime(300);
        });
        await act(async () => {
            fireEvent.keyDown(input, { key: 'ArrowUp' });
        });
        await act(async () => {
            fireEvent.keyDown(input, { key: 'Enter' });
        });

        expect(screen.getByTestId('values')).toHaveTextContent('"certificateNumber":"5/6A/92C"');
        expect(screen.getByTestId('values')).toHaveTextContent('"certificateNumberId":"cert-b"');
    });

    it('renders CertificateNumberLookup summary values and defaults', () => {
        const { rerender } = render(
            <FormikHarness
                initialValues={{
                    certificateNumber: '5/6A/91B',
                    certificateNumberId: 'cert-a',
                    certNameOptions: [],
                }}
            >
                <CertificateNumberLookup
                    name='certificateNumber'
                    idName='certificateNumberId'
                    label='Certificate number'
                    isSummary
                />
            </FormikHarness>,
        );

        expect(screen.getByText('Certificate number')).toBeInTheDocument();
        expect(screen.getByText('5/6A/91B')).toBeInTheDocument();

        rerender(
            <FormikHarness
                initialValues={{
                    certificateNumber: '',
                    certificateNumberId: '',
                    certNameOptions: [],
                }}
            >
                <CertificateNumberLookup
                    name='certificateNumber'
                    idName='certificateNumberId'
                    isSummary
                />
            </FormikHarness>,
        );

        expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('handles CertificateNumberLookup defaults, validation, keyboard dismissal, and click selection', async () => {
        vi.useFakeTimers();
        render(
            <FormikHarness
                initialValues={{
                    certificateNumber: '',
                    certificateNumberId: '',
                    family: undefined,
                    certNameOptions: [
                        { id: 'cert-a', lookupName: '5/6A/91B', family: 'NMI' },
                        { id: 'cert-b', lookupName: '5/6A/92C', family: 'NMI' },
                    ],
                }}
                initialTouched={{ certificateNumber: true }}
                initialErrors={{ certificateNumber: 'Choose a certificate number' }}
            >
                <CertificateNumberLookup
                    id='certificate-number-field'
                    name='certificateNumber'
                    idName='certificateNumberId'
                    optionsFieldName='lookupName'
                    parentName='family'
                    parentOptionsName='family'
                    inlineHelp='Start typing a certificate number'
                />
                <ValuesProbe />
            </FormikHarness>,
        );

        const input = screen.getByRole('textbox', { name: 'Certificate number' });
        expect(screen.getAllByText('Choose a certificate number')[0]).toBeInTheDocument();

        fireEvent.keyDown(input, { key: 'ArrowDown' });
        expect(screen.queryByRole('listbox', { name: 'Suggested options' })).not.toBeInTheDocument();

        fireEvent.change(input, { target: { value: '5' } });
        await act(async () => {
            vi.advanceTimersByTime(300);
        });
        expect(screen.queryByRole('listbox', { name: 'Suggested options' })).not.toBeInTheDocument();

        fireEvent.change(input, { target: { value: '91B' } });
        await act(async () => {
            vi.advanceTimersByTime(300);
        });
        expect(screen.getByRole('option', { name: /5\/6A\/91B/ })).toBeInTheDocument();
        expect(screen.getByText(/1 suggestions displayed/)).toBeInTheDocument();

        await act(async () => {
            fireEvent.keyDown(input, { key: 'ArrowDown' });
        });
        expect(screen.getByRole('option', { name: /5\/6A\/91B/ })).toHaveAttribute('aria-selected', 'true');

        await act(async () => {
            fireEvent.keyDown(input, { key: 'Escape' });
        });
        expect(screen.queryByRole('listbox', { name: 'Suggested options' })).not.toBeInTheDocument();

        fireEvent.change(input, { target: { value: '92C' } });
        await act(async () => {
            vi.advanceTimersByTime(300);
        });
        fireEvent.click(screen.getByRole('option', { name: /5\/6A\/92C/ }));

        expect(screen.getByTestId('values')).toHaveTextContent('"certificateNumber":"5/6A/92C"');
        expect(screen.getByTestId('values')).toHaveTextContent('"certificateNumberId":"cert-b"');

        fireEvent.change(input, { target: { value: '' } });
        await act(async () => {
            vi.advanceTimersByTime(300);
        });
        expect(screen.queryByRole('listbox', { name: 'Suggested options' })).not.toBeInTheDocument();
    });

    it('clears OrganisationNameLookup suggestions for blank and short input', async () => {
        vi.useFakeTimers();
        render(
            <FormikHarness
                initialValues={{
                    organisationName: '',
                    orgNameOptions: [{ name: 'Alpha Labs' }],
                }}
            >
                <OrganisationNameLookup
                    name='organisationName'
                    label='Organisation name'
                    optionsFieldName='name'
                />
            </FormikHarness>,
        );

        await act(async () => {
            vi.advanceTimersByTime(300);
        });
        expect(screen.queryByRole('listbox', { name: 'Suggested options' })).not.toBeInTheDocument();

        fireEvent.change(screen.getByRole('combobox', { name: 'Organisation name' }), {
            target: { value: 'A' },
        });
        await act(async () => {
            vi.advanceTimersByTime(300);
        });
        expect(screen.getByRole('combobox', { name: 'Organisation name' })).toHaveAttribute('aria-expanded', 'false');
    });

    it('uses OrganisationNameLookup defaults and moves ArrowUp from a later option', async () => {
        const user = userEvent.setup();
        render(
            <FormikHarness
                initialValues={{
                    organisationName: '',
                    orgNameOptions: [
                        { name: 'Alpha Labs' },
                        { name: 'Beta Labs' },
                        { name: 'Gamma Labs' },
                    ],
                }}
            >
                <OrganisationNameLookup
                    id='organisation'
                    name='organisationName'
                    inlineHelp='Choose an organisation'
                    optionsFieldName='name'
                />
            </FormikHarness>,
        );

        const combobox = screen.getByRole('combobox', { name: 'Organisation name' });
        expect(combobox).toHaveAttribute('aria-describedby', 'help-organisation');

        await user.type(combobox, 'Labs');
        await screen.findByRole('listbox', { name: 'Suggested options' });
        await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}');

        await waitFor(() => expect(combobox).toHaveAttribute(
            'aria-activedescendant',
            'organisationName-option-0',
        ));
    });

    it('handles OrganisationNameLookup validation and missing option data', async () => {
        const user = userEvent.setup();
        render(
            <FormikHarness
                initialValues={{
                    organisationName: '',
                    orgNameOptions: undefined,
                }}
            >
                <OrganisationNameLookup
                    name='organisationName'
                    optionsFieldName='name'
                />
            </FormikHarness>,
        );

        const combobox = screen.getByRole('combobox', { name: 'Organisation name' });
        await user.type(combobox, 'Unknown');

        expect(screen.queryByRole('listbox', { name: 'Suggested options' })).not.toBeInTheDocument();
    });

    it('recomputes OrganisationNameLookup suggestions when the parent filter changes', async () => {
        vi.useFakeTimers();

        const { rerender } = render(
            <FormikHarness
                initialValues={{
                    organisationName: '',
                    parentType: 'Calibration',
                    orgNameOptions: [
                        { name: 'Alpha Labs', type: 'Calibration' },
                        { name: 'Beta Labs', type: 'Testing' },
                    ],
                }}
            >
                <OrganisationNameLookup
                    name='organisationName'
                    label='Organisation name'
                    optionsFieldName='name'
                    parentName='parentType'
                    parentOptionsName='type'
                    matchType='includes'
                />
            </FormikHarness>,
        );

        fireEvent.change(screen.getByRole('combobox', { name: 'Organisation name' }), {
            target: { value: 'Labs' },
        });
        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        expect(screen.getByRole('option', { name: /Alpha Labs/ })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: /Beta Labs/ })).not.toBeInTheDocument();

        rerender(
            <FormikHarness
                initialValues={{
                    organisationName: '',
                    parentType: 'Testing',
                    orgNameOptions: [
                        { name: 'Alpha Labs', type: 'Calibration' },
                        { name: 'Beta Labs', type: 'Testing' },
                    ],
                }}
            >
                <OrganisationNameLookup
                    name='organisationName'
                    label='Organisation name'
                    optionsFieldName='name'
                    parentName='parentType'
                    parentOptionsName='type'
                    matchType='includes'
                />
            </FormikHarness>,
        );

        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        expect(screen.getByRole('option', { name: /Beta Labs/ })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: /Alpha Labs/ })).not.toBeInTheDocument();
    });

    it('renders NumberInput numeric and pattern branches with validation, defaults, addons, and summary formatting', async () => {
        const user = userEvent.setup();

        const { rerender } = render(
            <FormikHarness
                initialValues={{ amount: '' }}
                initialTouched={{ amount: true }}
                initialErrors={{ amount: 'Enter an amount' }}
            >
                <NumberInput
                    name='amount'
                    label='Amount'
                    inlineHelp='Australian dollars'
                    prepend='$'
                    append='AUD'
                    thousandSeparator
                    defaultValue={1200}
                />
                <ValuesProbe />
            </FormikHarness>,
        );

        const amount = screen.getByRole('textbox', { name: 'Amount' });
        expect(amount).toHaveAccessibleDescription('Enter an amount');
        expect(screen.getByText('$')).toBeInTheDocument();
        expect(screen.getByText('AUD')).toBeInTheDocument();
        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"amount":1200'));

        await user.clear(amount);
        await user.type(amount, '2500');
        await waitFor(() => expect(amount).toHaveValue('2,500'));

        rerender(
            <FormikHarness initialValues={{ phone: '0412345678' }}>
                <NumberInput name='phone' label='Mobile phone' format='checkPhoneFormat' />
            </FormikHarness>,
        );

        expect(screen.getByRole('textbox', { name: 'Mobile phone' })).toHaveValue('0412 345 678');

        rerender(
            <FormikHarness initialValues={{ phone: '1300123456' }}>
                <NumberInput name='phone' label='Phone summary' format='checkPhoneFormat' isSummary />
            </FormikHarness>,
        );

        expect(screen.getByText('Phone summary')).toBeInTheDocument();
        expect(screen.getByText('1300 123 456')).toBeInTheDocument();
    });

    it('applies a new NumberInput default value while untouched and does not reapply it after manual edits', async () => {
        const user = userEvent.setup();
        const { rerender } = render(
            <FormikHarness initialValues={{ amount: '' }}>
                <NumberInput
                    name='amount'
                    label='Amount'
                />
                <ValuesProbe />
            </FormikHarness>,
        );

        expect(screen.getByTestId('values')).toHaveTextContent('"amount":""');

        rerender(
            <FormikHarness initialValues={{ amount: '' }}>
                <NumberInput
                    name='amount'
                    label='Amount'
                    defaultValue={2400}
                />
                <ValuesProbe />
            </FormikHarness>,
        );

        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"amount":2400'));

        const amount = screen.getByRole('textbox', { name: 'Amount' });
        await user.clear(amount);
        await user.type(amount, '25');

        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"amount":"25"'));
    });

    it.each([
        ['1800123456', '1800 123 456'],
        ['131234', '13 12 34'],
        ['1312345', '13 1234 5   '],
        ['0212345678', '02 1234 5678'],
        ['', ''],
    ])('formats phone value %s using the matching pattern', (value, expected) => {
        render(
            <FormikHarness initialValues={{ phone: value }}>
                <NumberInput name='phone' label='Phone' format='checkPhoneFormat' />
            </FormikHarness>,
        );

        expect(screen.getByRole('textbox', { name: 'Phone' })).toHaveValue(expected);
    });

    it('renders a formatted NumberInput inside an addon group with an explicit error id', () => {
        render(
            <FormikHarness
                initialValues={{ phone: '0412345678' }}
                initialTouched={{ phone: true }}
                initialErrors={{ phone: 'Enter a phone number' }}
            >
                <NumberInput
                    name='phone'
                    id='contact-phone'
                    label='Phone'
                    prepend='+61'
                    format='checkPhoneFormat'
                />
            </FormikHarness>,
        );

        const input = screen.getByRole('textbox', { name: 'Phone' });
        expect(input).toHaveAttribute('aria-describedby', 'contact-phone-validation-msg');
        expect(screen.getByText('Enter a phone number')).toHaveAttribute('id', 'contact-phone-validation-msg');
    });

    it('formats ISO and Date values for date inputs', () => {
        const { rerender } = render(
            <FormikHarness initialValues={{ date: '2026-05-18T00:00:00.000Z' }}>
                <NumberInput name='date' label='ISO date' type='date' />
            </FormikHarness>,
        );
        expect(screen.getByRole('textbox', { name: 'ISO date' })).toHaveValue('20260518');

        rerender(
            <FormikHarness initialValues={{ date: new Date('2026-05-19T00:00:00.000Z') }}>
                <NumberInput name='date' label='Date object' type='date' />
            </FormikHarness>,
        );
        expect(screen.getByRole('textbox', { name: 'Date object' })).toHaveValue('20260519');
    });
});
