import { useFormikContext } from 'formik';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
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
  const context = useFormikContext<InstrumentAndRequestStep>();
  const measurementCategory = context.getFieldMeta('measurementCategory')
    .value as string | undefined;
  const isLoadingMeasurementCategories = useRef(false);
  const [measurementCategories, setMeasurementCategories] =
    useState<LookupResponse[]>();
  const [artefactTypes, setArtefactTypes] = useState<LookupResponse[]>();
  const [artefactTypesSelected, setArtefactTypesSelected] =
    useState<SelectInputOption<string>[]>();
  const noMeasurementId = useRef('');
  const noInstrumentId = useRef('');
  const [
    isInstrumentOrArtefactTypeDisabled,
    setIsInstrumentOrArtefactTypeDisabled,
  ] = useState(false);

  useEffect(() => {
    if (
      measurementCategories !== undefined ||
      accounts.length === 0 ||
      isLoadingMeasurementCategories.current
    ) {
      return;
    }

    isLoadingMeasurementCategories.current = true;
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
        noMeasurementId.current = lastId;
        setMeasurementCategories(sorted);
        setArtefactTypes(artefactTypeResult);
      } catch (e) {
        AppLogger.error('Failed to retrieve look ups', e as Error);
        isLoadingMeasurementCategories.current = false;
      }
    };
    void loadMeasurementCategories();
  }, [accounts, instance, measurementCategories]);

  useEffect(() => {
    if (measurementCategories === undefined || artefactTypes === undefined) {
      return;
    }

    if (measurementCategory === undefined) {
      setArtefactTypesSelected([]);
      setIsInstrumentOrArtefactTypeDisabled(false);
      return;
    }

    const { options, noInstrumentId: lastId } = getArtefactTypeOptions(
      artefactTypes,
      measurementCategory,
    );
    noInstrumentId.current = lastId;
    setArtefactTypesSelected(options);
    setIsInstrumentOrArtefactTypeDisabled(
      measurementCategory === noMeasurementId.current,
    );
  }, [artefactTypes, measurementCategories, measurementCategory]);

  const getMeasurementCategories = () => {
    const options: SelectInputOption<string>[] = [];
    for (const l of measurementCategories ?? []) {
      if (l.label !== undefined && l.id !== undefined) {
        options.push({ displayText: l.label, value: l.id });
      }
    }
    return options;
  };

  const onMeasurementCategoryChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setIsInstrumentOrArtefactTypeDisabled(false);
    void context.setFieldValue('instrumentOrArtefactType', '');
    void context.setFieldTouched('instrumentOrArtefactType', false);
    if (artefactTypes !== undefined) {
      const { options, noInstrumentId: lastId } = getArtefactTypeOptions(
        artefactTypes,
        event.target.value,
      );
      noInstrumentId.current = lastId;
      setArtefactTypesSelected(options);
      if (event.target.value === noMeasurementId.current) {
        void context.setFieldValue(
          'instrumentOrArtefactType',
          noInstrumentId.current,
        );
        setIsInstrumentOrArtefactTypeDisabled(true);
      }
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
