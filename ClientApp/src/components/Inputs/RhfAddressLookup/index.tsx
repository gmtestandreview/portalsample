import { useRef } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useFormContext, useWatch } from 'react-hook-form';
import { useAccount, useMsal } from '@azure/msal-react';
import { AddressClient } from '../../../api/web-api-client';
import type {
  MatchedAddress,
  AddressDetailsDto,
  ProblemDetails,
} from '../../../api/web-api-client';
import RhfAutoSuggest from '../RhfAutoSuggest';
import type { AutoSuggestOption } from '../AutoSuggest/types';
import RhfManualAddressInput from './RhfManualAddressInput';
import type { AddressLookupProps } from '../AddressLookup/types';
import { silentRequestFor } from '../../../authentication/silentRequest';
import { HttpStatusCode } from '../../../types';
import SummaryDisplay from '../../SummaryDisplay';
import AppLogger from '../../../instrumentation/AppLogger';
import { getFormattedAddress } from '../../../routes/common/helperFunctions';
import { omitUndefined } from '../../../utils/omitUndefined';

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
  displayText:
    'The address lookup service is currently unavailable, enter address manually',
  id: 'not-found',
  value: {},
};

const blankAddressLines = {
  line1: '',
  line2: '',
  line3: '',
  suburb: '',
  postcode: '',
};

/**
 * React Hook Form counterpart of `AddressLookup`: the same search, selection and
 * manual-entry behaviour, storing the whole `AddressDetailsDto` under `name`, so
 * it must render inside a `FormProvider`. Whether the manual fields show is read
 * from the stored `isManuallyEntered`, not mirrored into local state.
 */
const RhfAddressLookup = (props: Readonly<AddressLookupProps>) => {
  const {
    name,
    label,
    maxResults,
    placeholder,
    isSummary,
    disabled,
    inlineHelp,
  } = props;

  const { getValues, setValue, resetField } = useFormContext();
  const address = useWatch({ name }) as AddressDetailsDto | undefined;
  const searchTextName = `${name}.searchText`;
  const controllerRef = useRef<AbortController | null>(null);

  const { instance, accounts, inProgress } = useMsal();
  const account = useAccount(accounts[0] || {});

  const manual = address?.isManuallyEntered === true;

  const fetchAddressOptions = async (
    term: string,
    controller: AbortController
  ): Promise<AutoSuggestOption<MatchedAddress>[]> => {
    if (inProgress !== 'none' || accounts.length === 0 || !account) return [];

    const result = await instance.acquireTokenSilent(silentRequestFor(account));
    const addressClient = new AddressClient('');
    addressClient.setAuthToken(result.accessToken);

    const addresses = await addressClient.search(term, controller.signal);
    if (!addresses.matches) return [];

    const options: AutoSuggestOption<MatchedAddress>[] = addresses.matches.map(
      (a, i) => ({
        displayText: a.displayText || '',
        id: a.unqiueId || i.toString(),
        value: a,
      })
    );

    if (maxResults) {
      options.length = Math.min(options.length, maxResults);
    }

    return options;
  };

  const getAddresses = async (term: string) => {
    controllerRef.current?.abort();

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
      AppLogger.error(
        `Failed to execute address search: ${term}`,
        error as Error
      );
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

  // Only the identifying fields survive a change of address.
  const identity = () => {
    const current = getValues(name) as AddressDetailsDto;
    return omitUndefined({
      id: current.id,
      type: current.type,
      timeStamp: current.timeStamp,
    });
  };

  const writeAddress = (value: object) =>
    setValue(name, value, { shouldDirty: true });

  const onSelectedOption = (option?: AutoSuggestOption<MatchedAddress>) => {
    if (!option) {
      writeAddress({
        ...identity(),
        ...blankAddressLines,
        isManuallyEntered: false,
        searchText: '',
      });
    } else if (option.id === noAddressFoundOption.id) {
      writeAddress({
        ...identity(),
        ...blankAddressLines,
        isManuallyEntered: true,
        searchText: '',
      });
    } else {
      writeAddress({
        ...omitUndefined({ ...identity(), state: option.value.state }),
        line1: option.value.addressLine1 || '',
        line2: option.value.addressLine2 || '',
        line3: option.value.addressLine3 || '',
        suburb: option.value.suburb || '',
        postcode: option.value.postCode || '',
        isManuallyEntered: false,
        searchText: option.displayText,
      });
    }
  };

  const setManual = (isManuallyEntered: boolean) =>
    setValue(`${name}.isManuallyEntered`, isManuallyEntered, {
      shouldDirty: true,
    });

  const onEnterManually = () => {
    // Leaving the search box must not carry its touched flag into the next
    // search; resetting with the current value as default keeps the text.
    resetField(searchTextName, {
      defaultValue: getValues(searchTextName),
      keepDirty: true,
      keepError: true,
    });
    setManual(true);
  };

  if (isSummary) {
    return (
      <SummaryDisplay
        label={label}
        id={name}
        as='span'
        value={address ? getFormattedAddress(address) : '-'}
      />
    );
  }

  return manual ? (
    <fieldset className='d-block' aria-live='polite' role='group'>
      <legend>
        {label}
        <span className='visually-hidden'>
          {' - Enter the address manually.'}
        </span>
      </legend>
      <Form.Group className='form-field-container'>
        <Form.Text className='contextual-help'>
          <Button variant='tertiary' size='sm' onClick={() => setManual(false)}>
            <i className='icon-search me-1' aria-hidden='true' />
            {' Find an address'}
          </Button>
          {' or enter an address below'}
          <span className='visually-hidden'>.</span>
        </Form.Text>
        <RhfManualAddressInput
          name={name}
          {...omitUndefined({ disabled, inlineHelp })}
        />
      </Form.Group>
    </fieldset>
  ) : (
    <fieldset className='d-block' aria-live='polite' role='group'>
      <legend className='visually-hidden'>Find an address.</legend>
      <Form.Group className='form-field-container'>
        <RhfAutoSuggest<MatchedAddress>
          getOptions={getAddresses}
          label={label ?? 'Address'}
          name={searchTextName}
          onSelectedOption={onSelectedOption}
          inlineHelp='Start typing and then select your address from the drop-down list'
          {...omitUndefined({
            selectedOption: address?.searchText,
            placeholder,
          })}
        />
        <Form.Text as='p' className='contextual-help'>
          {'Or you can: '}
          <Button variant='tertiary' size='sm' onClick={onEnterManually}>
            <i className='icon-enter me-1' aria-hidden='true' />
            {' Enter it manually'}
          </Button>
          <span className='visually-hidden'>.</span>
        </Form.Text>
      </Form.Group>
    </fieldset>
  );
};

export default RhfAddressLookup;
