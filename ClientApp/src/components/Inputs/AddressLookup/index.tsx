import { useField } from 'formik';
import type { FieldHookConfig } from 'formik';
import { useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useAccount, useMsal } from '@azure/msal-react';
import { AddressClient } from '../../../api/web-api-client';
import type { MatchedAddress, AddressDetailsDto, ProblemDetails } from '../../../api/web-api-client';
import AutoSuggest from '../AutoSuggest';
import type { AutoSuggestOption } from '../AutoSuggest/types';
import ManualAddressInput from './ManualAddressInput';
import type { AddressLookupProps } from './types';
import { tokenRequest } from '../../../authentication/authConfig';
import { HttpStatusCode } from '../../../types';
import SummaryDisplay from '../../SummaryDisplay';
import AppLogger from '../../../instrumentation/AppLogger';
import { getFormattedAddress } from '../../../routes/common/helperFunctions';

const noAddressFoundOption = {
    displayText: 'No matches found',
    id: 'not-found',
    value: {},
};

const manualAddressOption = {
    displayText: 'Enter address manually',
    id: 'not-found',
    value: {},
};

const addressServiceUnavailableOption = {
    displayText: 'The address lookup service is currently unavailable, enter address manually',
    id: 'not-found',
    value: {},
};

const AddressLookup = (
    props: AddressLookupProps & FieldHookConfig<AddressDetailsDto>,
) => {
    const {
        name,
        label,
        maxResults,
        placeholder,
        isSummary,
        disabled,
        inlineHelp,
    } = props;

    const [_field, _meta, _helpers] = useField<AddressDetailsDto>(name);
    const [_fieldSearch, _metaSearch, { setTouched }] = useField<string>(`${name}.searchText`);
    const controllerRef = useRef<AbortController | null>();

    const { setValue } = _helpers;
    const { value: address } = _meta;

    // Always-current snapshot of field value and setter; avoids stale closures in the
    // manual-sync effect below without adding them as deps (which would cause a loop).
    const fieldSyncRef = useRef({ value: _field.value, setValue });
    fieldSyncRef.current.value = _field.value;
    fieldSyncRef.current.setValue = setValue;

    const [text, setText] = useState<string | null | undefined>(
        address?.searchText,
    );
    const [manual, setManual] = useState(address?.isManuallyEntered);

    const { instance, accounts, inProgress } = useMsal();
    const account = useAccount(accounts[0] || {});

    useEffect(() => {
        const { value, setValue: setVal } = fieldSyncRef.current;
        if (manual !== value?.isManuallyEntered) {
            setVal({ ...value, isManuallyEntered: manual });
        }
    }, [manual]);

    useEffect(() => {
        setText(_field.value?.searchText);
    }, [_field.value?.searchText]);

    useEffect(() => {
        setManual(_field.value?.isManuallyEntered);
    }, [_field.value?.isManuallyEntered]);

    const fetchAddressOptions = async (
        term: string,
        controller: AbortController,
    ): Promise<AutoSuggestOption<MatchedAddress>[]> => {
        if (inProgress !== 'none' || accounts.length === 0 || !account) return [];

        const result = await instance.acquireTokenSilent({ ...tokenRequest, account });
        const addressClient = new AddressClient('');
        addressClient.setAuthToken(result.accessToken);

        const addresses = await addressClient.search(term, controller.signal);
        if (!addresses.matches) return [];

        const options: AutoSuggestOption<MatchedAddress>[] = addresses.matches.map((a, i) => ({
            displayText: a.displayText || '',
            id: a.unqiueId || i.toString(),
            value: a,
        }));

        if (maxResults) {
            options.length = Math.min(options.length, maxResults);
        }

        return options;
    };

    const getAddresses = async (term: string) => {
        if (controllerRef.current) {
            controllerRef.current.abort();
        }

        const controller = new AbortController();
        controllerRef.current = controller;

        let options: AutoSuggestOption<MatchedAddress>[] = [];
        let lookupFailed = false;

        try {
            options = await fetchAddressOptions(term, controller);
        } catch (error) {
            const lookupServerError = error as ProblemDetails;
            if (lookupServerError.status === HttpStatusCode.ServiceUnavailable) {
                lookupFailed = true;
            }
            AppLogger.error(`Failed to execute address search: ${term}`, error as Error);
        }

        if (lookupFailed) {
            options.push(addressServiceUnavailableOption);
        } else if (options.length === 0) {
            options.push(noAddressFoundOption);
        } else {
            options.push(manualAddressOption);
        }

        controllerRef.current = null;
        return options;
    };

    const onSelectedOption = async (
        option?: AutoSuggestOption<MatchedAddress>,
    ) => {
        if (option) {
            if (option.id === noAddressFoundOption.id) {
                setText('');
                setValue({
                    id: _field.value.id,
                    type: _field.value.type,
                    timeStamp: _field.value.timeStamp,
                    line1: '',
                    line2: '',
                    line3: '',
                    suburb: '',
                    postcode: '',
                    state: undefined,
                    isManuallyEntered: true,
                    searchText: '',
                });
                setManual(true);
            } else {
                setText(option.displayText);
                setValue({
                    id: _field.value.id,
                    type: _field.value.type,
                    timeStamp: _field.value.timeStamp,
                    line1: option.value.addressLine1 || '',
                    line2: option.value.addressLine2 || '',
                    line3: option.value.addressLine3 || '',
                    suburb: option.value.suburb || '',
                    postcode: option.value.postCode || '',
                    state: option.value.state,
                    isManuallyEntered: false,
                    searchText: option.displayText,
                });
            }
        } else {
            setText('');
            setValue({
                id: _field.value.id,
                type: _field.value.type,
                timeStamp: _field.value.timeStamp,
                line1: '',
                line2: '',
                line3: '',
                suburb: '',
                postcode: '',
                state: undefined,
                isManuallyEntered: false,
                searchText: '',
            });
        }
    };

    const onSearchAgain = () => setManual(false);

    const onEnterManually = () => {
        setTouched(false);
        setManual(true);
    };

    if (isSummary) {
        return (
            <SummaryDisplay
                label={label}
                id={name}
                as='span'
                value={_field.value ? getFormattedAddress(address) : '-'}
            />
        );
    }

    return (
        <>
            {manual === true ? (
                <fieldset className='d-block' aria-live='polite' role='group'>
                    <legend>
                        {label}
                        <span className='visually-hidden'>{' - Enter the address manually.'}</span>
                    </legend>
                    <Form.Group className='form-field-container'>
                        <Form.Text className='contextual-help'>
                            <Button variant='tertiary' size='sm' onClick={onSearchAgain}>
                                <i className='icon-search me-1' aria-hidden='true' />Find an address
                            </Button>
                            {' or enter an address below'}
                            <span className='visually-hidden'>.</span>
                        </Form.Text>
                        <ManualAddressInput
                            name={name}
                            disabled={disabled}
                            inlineHelp={inlineHelp}
                        />
                    </Form.Group>
                </fieldset>
            ) : (
                <fieldset className='d-block' aria-live='polite' role='group'>
                    <legend className='visually-hidden'>Find an address.</legend>
                    <Form.Group className='form-field-container'>
                        <AutoSuggest<MatchedAddress>
                            getOptions={getAddresses}
                            label={label ?? 'Address'}
                            name={`${name}.searchText`}
                            onSelectedOption={onSelectedOption}
                            selectedOption={text}
                            inlineHelp='Start typing and then select your address from the drop-down list'
                            placeholder={placeholder}
                        />
                        <Form.Text as='p' className='contextual-help'>
                            {'Or you can: '}
                            <Button variant='tertiary' size='sm' onClick={onEnterManually}>
                                <i className='icon-enter me-1' aria-hidden='true' />Enter it manually
                            </Button>
                            <span className='visually-hidden'>.</span>
                        </Form.Text>
                    </Form.Group>
                </fieldset>
            )}
        </>
    );
};

export default AddressLookup;
