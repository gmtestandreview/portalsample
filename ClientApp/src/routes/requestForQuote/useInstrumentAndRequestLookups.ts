import { useFormContext, useWatch } from 'react-hook-form';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { CRMLookupTypes, LookupClient } from '../../api/web-api-client';
import type {
  LookupResponse,
  InstrumentAndRequestStep,
} from '../../api/web-api-client';
import type { SelectInputOption } from '../../components/Inputs/SelectInput/types';
import { silentRequestFor } from '../../authentication/silentRequest';
import AppLogger from '../../instrumentation/AppLogger';
import { sortList } from '../common/helperFunctions';

const getArtefactTypeOptions = (values: LookupResponse[], parentId: string) => {
  const options: SelectInputOption<string>[] = [];
  if (parentId !== '') {
    for (const l of values) {
      if (l.parentId === parentId) {
        options.push({ displayText: l.label ?? '', value: l.id ?? '' });
      }
    }
  }
  const [sorted, noInstrumentId] = sortList(
    options,
    'No instrument',
    'displayText',
  );

  return { options: sorted, noInstrumentId };
};

// Exported for unit testing: the measurement-category options builder falls
// back to an empty list before the lookups resolve, a path unreachable through
// the rendered component because `isLoading` gates the only call site.
export const useInstrumentAndRequestLookups = () => {
  const { accounts, instance } = useMsal();
  const { resetField, setValue } = useFormContext<InstrumentAndRequestStep>();
  const measurementCategory = useWatch<InstrumentAndRequestStep>({
    name: 'measurementCategory',
  }) as string | undefined;
  const isLoadingMeasurementCategoriesRef = useRef(false);
  const [measurementCategories, setMeasurementCategories] =
    useState<LookupResponse[]>();
  const [artefactTypes, setArtefactTypes] = useState<LookupResponse[]>();
  const [noMeasurementId, setNoMeasurementId] = useState('');

  useEffect(() => {
    if (
      measurementCategories !== undefined ||
      accounts.length === 0 ||
      isLoadingMeasurementCategoriesRef.current
    ) {
      return;
    }

    isLoadingMeasurementCategoriesRef.current = true;
    const loadMeasurementCategories = async () => {
      try {
        const client = new LookupClient();
        const tokenResult = await instance.acquireTokenSilent(
          silentRequestFor(accounts[0]),
        );
        client.setAuthToken(tokenResult.accessToken);
        const [result, artefactTypeResult] = await Promise.all([
          client.getLookup(CRMLookupTypes.TCPortalMeasurementCategory),
          client.getLookup(CRMLookupTypes.TCArtefactTypePortalCategory),
        ]);
        const [sorted, lastId] = sortList(result, 'No measurement', 'label');
        setNoMeasurementId(lastId);
        setMeasurementCategories(sorted);
        setArtefactTypes(artefactTypeResult);
      } catch (e) {
        AppLogger.error('Failed to retrieve look ups', e as Error);
        isLoadingMeasurementCategoriesRef.current = false;
      }
    };
    void loadMeasurementCategories();
  }, [accounts, instance, measurementCategories]);

  // The artefact options and the disabled flag follow from the lookups and the
  // selected category, so derive them instead of syncing state from an effect.
  const lookupsLoaded =
    measurementCategories !== undefined && artefactTypes !== undefined;
  const artefactTypesSelected = useMemo(() => {
    if (artefactTypes === undefined || !lookupsLoaded) {
      return undefined;
    }
    if (measurementCategory === undefined) {
      return [] as SelectInputOption<string>[];
    }
    return getArtefactTypeOptions(artefactTypes, measurementCategory).options;
  }, [artefactTypes, lookupsLoaded, measurementCategory]);
  const isInstrumentOrArtefactTypeDisabled =
    lookupsLoaded &&
    measurementCategory !== undefined &&
    measurementCategory === noMeasurementId;

  const getMeasurementCategories = () => {
    const options: SelectInputOption<string>[] = [];
    for (const l of measurementCategories ?? []) {
      if (l.label !== undefined && l.id !== undefined) {
        options.push({ displayText: l.label, value: l.id });
      }
    }
    return options;
  };

  const onMeasurementCategoryChange = (value: string) => {
    // Clears the value and untouches the field (setValue('') then resetField touched): untouch
    // the field but keep its saved baseline, dirty state and error, then clear
    // the value so it still reads as changed (the unsaved-changes prompt relies
    // on that). "No measurement" then applies the "no instrument" default.
    resetField('instrumentOrArtefactType', {
      keepDirty: true,
      keepError: true,
    });
    setValue('instrumentOrArtefactType', '', { shouldDirty: true });
    if (artefactTypes !== undefined && value === noMeasurementId) {
      const { noInstrumentId } = getArtefactTypeOptions(artefactTypes, value);
      setValue('instrumentOrArtefactType', noInstrumentId, {
        shouldDirty: true,
      });
    }
  };

  const isLoading =
    measurementCategories === undefined || artefactTypesSelected === undefined;

  return {
    artefactTypesSelected,
    getMeasurementCategories,
    isInstrumentOrArtefactTypeDisabled,
    isLoading,
    onMeasurementCategoryChange,
  };
};
