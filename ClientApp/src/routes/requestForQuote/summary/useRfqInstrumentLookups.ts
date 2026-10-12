import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { CRMLookupTypes, LookupClient } from '../../../api/web-api-client';
import type { LookupResponse } from '../../../api/web-api-client';
import type { SelectInputOption } from '../../../components/Inputs/SelectInput/types';
import { silentRequestFor } from '../../../authentication/silentRequest';
import AppLogger from '../../../instrumentation/AppLogger';
import { sortList } from '../../common/helperFunctions';

const NO_MEASUREMENT_LABEL = 'No measurement';
const NO_INSTRUMENT_LABEL = 'No instrument';

export interface RfqInstrumentLookups {
  measurementCategories: SelectInputOption<string>[];
  artefactTypes: SelectInputOption<string>[];
}

const toOption = (lookup: LookupResponse): SelectInputOption<string> => ({
  displayText: lookup.label ?? '',
  value: lookup.id ?? '',
});

/**
 * `sortList` splices the array it is given, so it is handed copies and the
 * lookup responses are never changed.
 */
const toSortedLookups = (
  measurementCategories: LookupResponse[],
  artefactTypes: LookupResponse[]
): RfqInstrumentLookups => {
  const [sortedCategories] = sortList(
    [...measurementCategories],
    NO_MEASUREMENT_LABEL,
    'label'
  );
  const [sortedTypes] = sortList(
    artefactTypes.map(toOption),
    NO_INSTRUMENT_LABEL,
    'displayText'
  );

  return {
    measurementCategories: sortedCategories.map(toOption),
    artefactTypes: sortedTypes,
  };
};

const fetchLookups = async (
  accessToken: string
): Promise<RfqInstrumentLookups> => {
  const client = new LookupClient();
  client.setAuthToken(accessToken);
  const [categories, types] = await Promise.all([
    client.getLookup(CRMLookupTypes.TCPortalMeasurementCategory),
    client.getLookup(CRMLookupTypes.TCArtefactTypePortalCategory),
  ]);

  return toSortedLookups(categories, types);
};

/**
 * Loads the CRM lookups the instrument summary resolves ids against. Returns
 * `undefined` while loading. A failed load is logged and leaves it
 * `undefined`, so the summary keeps its spinner, as the Formik summary does.
 */
export const useRfqInstrumentLookups = (): RfqInstrumentLookups | undefined => {
  const { accounts, instance } = useMsal();
  const [lookups, setLookups] = useState<RfqInstrumentLookups>();

  useEffect(() => {
    if (accounts.length === 0) return undefined;

    let isActive = true;
    const load = async () => {
      try {
        const token = await instance.acquireTokenSilent(
          silentRequestFor(accounts[0])
        );
        const loaded = await fetchLookups(token.accessToken);
        if (isActive) setLookups(loaded);
      } catch (e) {
        AppLogger.error('Failed to retrieve look ups', e as Error);
      }
    };
    void load();

    return () => {
      isActive = false;
    };
  }, [accounts, instance]);

  return lookups;
};
