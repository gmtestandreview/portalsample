import { useFormikContext } from 'formik';
import Row from 'react-bootstrap/Row';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useMsal } from '@azure/msal-react';
import { Alert } from 'react-bootstrap';
import TextAreaInput from '../../components/Inputs/TextAreaInput';
import { CRMLookupTypes, LookupClient } from '../../api/web-api-client';
import type {
  LookupResponse,
  InstrumentAndRequestStep,
} from '../../api/web-api-client';
import HidableField from '../../components/forms/HidableField';
import SelectInput from '../../components/Inputs/SelectInput';
import type { SelectInputOption } from '../../components/Inputs/SelectInput/types';
import RadioButtonGroup from '../../components/Inputs/RadioButtonGroup';
import { silentRequestFor } from '../../authentication/silentRequest';
import BlockUISpinner from '../../components/BlockUISpinner';
import NumberInput from '../../components/Inputs/NumberInput';
import TextInput from '../../components/Inputs/TextInput';
import AppLogger from '../../instrumentation/AppLogger';
import DatePicker from '../../components/Inputs/DatePicker';
import { sortList } from '../common/helperFunctions';

const measurementReportInlineHelp = (
  <div>
    <ul>
      <li>
        regulation 13 and 34C certificates to provide evidence of legal
        traceability to national standards, including using it as evidence in
        court
      </li>
      <li>
        a regulation 13 certificate if you use measurement standard for
        calibrating instruments used for trade or legal purposes
      </li>
      <li>
        a regulation 34C certificate if you use the artefact or instrument to
        determine a measurement for a legal purpose.
      </li>
    </ul>
  </div>
);

const getArtefactTypeOptions = (values: LookupResponse[], parentId: string) => {
  const options: SelectInputOption<string>[] = [];
  if (parentId !== undefined && parentId !== '') {
    for (const l of values) {
      if (l.parentId === parentId) {
        options.push({ displayText: l.label ?? '', value: l.id ?? '' });
      }
    }
  }
  const [sorted, noInstrumentId] = sortList(
    options,
    'No instrument',
    'displayText'
  );

  return { options: sorted, noInstrumentId };
};

const useInstrumentAndRequestLookups = () => {
  const { accounts, instance } = useMsal();
  const context = useFormikContext<InstrumentAndRequestStep>();
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
    const loadMeasurementCategories = async () => {
      try {
        if (measurementCategories === undefined && accounts.length > 0) {
          const client = new LookupClient();
          const tokenResult = await instance.acquireTokenSilent(
            silentRequestFor(accounts[0])
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
          if (
            context.getFieldMeta('measurementCategory').initialValue !==
            undefined
          ) {
            const { options, noInstrumentId: lastId } = getArtefactTypeOptions(
              artefactTypeResult,
              context.getFieldMeta('measurementCategory').initialValue as string
            );
            noInstrumentId.current = lastId;
            setArtefactTypesSelected(options);
            if (
              (context.getFieldMeta('measurementCategory')
                .initialValue as string) === noMeasurementId.current
            ) {
              setIsInstrumentOrArtefactTypeDisabled(true);
            }
          } else {
            setArtefactTypesSelected([]);
          }
        }
      } catch (e) {
        AppLogger.error('Failed to retrieve look ups', e as Error);
      }
    };
    if (!isLoadingMeasurementCategories.current) {
      void loadMeasurementCategories();
    }
    return () => {
      isLoadingMeasurementCategories.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accounts,
    instance,
    isLoadingMeasurementCategories,
    measurementCategories,
  ]);

  const getMeasurementCategories = () => {
    const options: SelectInputOption<string>[] = [];
    for (const l of measurementCategories ?? []) {
      options.push({ displayText: l.label!, value: l.id! });
    }
    return options;
  };

  const onMeasurementCategoryChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setIsInstrumentOrArtefactTypeDisabled(false);
    void context.setFieldValue('instrumentOrArtefactType', '');
    void context.setFieldTouched('instrumentOrArtefactType', false);
    if (event.target.value !== null && artefactTypes !== undefined) {
      const { options, noInstrumentId: lastId } = getArtefactTypeOptions(
        artefactTypes,
        event.target.value
      );
      noInstrumentId.current = lastId;
      setArtefactTypesSelected(options);
      if (event.target.value === noMeasurementId.current) {
        void context.setFieldValue(
          'instrumentOrArtefactType',
          noInstrumentId.current
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

const ImportantInformation = () => (
  <Alert
    variant='info'
    data-testid='info-summary'
    role='status'
    aria-live='polite'
    className='d-flex mb-4'
  >
    <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
      <div className='bgCircle mb-3 me-3'>
        <i className='icon-info' aria-hidden='true' />
      </div>
    </div>
    <div>
      <p className='mb-0'>
        <strong>Important information</strong>
      </p>
      <p className='mb-0'>
        Please provide as much information as possible including the
        instrument/artefact&apos;s
      </p>
      <p className='mb-0'>
        Serial, Manufacturer and Model to increase accuracy and reduce delays in
      </p>
      <p className='mb-0'>processing your request.</p>
    </div>
  </Alert>
);

interface InstrumentDetailsSectionProps {
  measurementCategoryOptions: SelectInputOption<string>[];
  onMeasurementCategoryChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  artefactTypesSelected: SelectInputOption<string>[];
  isInstrumentOrArtefactTypeDisabled: boolean;
}

const InstrumentDetailsSection = ({
  measurementCategoryOptions,
  onMeasurementCategoryChange,
  artefactTypesSelected,
  isInstrumentOrArtefactTypeDisabled,
}: Readonly<InstrumentDetailsSectionProps>) => (
  <Row className='mb-4'>
    <h2 className=''>Instrument/artefact details</h2>
    <RadioButtonGroup
      legend='Does this instrument/artefact have a serial number available?'
      name='hasSerialNumber'
      id='q-hasSerialNumber'
      options={[
        {
          label: 'Yes',
          value: 'Yes',
          id: 'hasSerialNumber-Yes',
        },
        {
          label: 'No',
          value: 'No',
          id: 'hasSerialNumber-No',
        },
      ]}
    />
    <HidableField name='serialNumber'>
      <TextInput label='Serial number' name='serialNumber' />
    </HidableField>
    <TextInput
      label='Manufacturer'
      name='manufacturer'
      inlineHelp='If the Manufacturer is known please enter it below, if unknown please enter "n/a" for not applicable.'
    />
    <TextInput
      label='Model'
      name='model'
      inlineHelp='If the Model is known please enter it below, if unknown please enter "n/a" for not applicable.'
    />
    <TextAreaInput
      label='Description (optional)'
      name='description'
      inlineHelp={
        <>
          <span>
            Describe the instrument or artefact, including its capacity,
            parameters, or measurement range.
          </span>
          <span className='d-block pt-2'>
            Examples:
            <br />
            &bull; 100 mL volumetric flask, Class A
            <br />
            &bull; Digital thermometer, -50 degree C to 150 degree C (instead of
            &deg;C symbol)
            <br />
            &bull; 5 kg balance, readability 0.01 g
            <br />
          </span>
          <span className='d-block pt-2'>
            Important:
            <br />
            &bull; Where possible avoid using symbols (e.g., &deg;, &#59;,
            &#92;, &#124;) and write the word instead
            <br />
            &bull; Enter a maximum of 400 characters
          </span>
        </>
      }
      rows={2}
      maxCharacters={400}
    />
    <NumberInput
      label='Number of items'
      name='numberOfItems'
      containerClassName='col-md-6'
      allowNegative={false}
      decimalScale={0}
      inlineHelp='If a set of items. e.g. set of weights'
    />
    <SelectInput<string>
      name='measurementCategory'
      label='Measurement category'
      inlineHelp={
        <>
          <span>e.g. Temperature, pressure, mass and density etc</span>
          <span className='d-block pt-1'>
            If you cannot find a suitable Measurement category please select
            &quot;No measurement category available&quot;
          </span>
        </>
      }
      options={measurementCategoryOptions}
      onChange={onMeasurementCategoryChange}
      addBlank
    />
    <SelectInput<string>
      name='instrumentOrArtefactType'
      label='Instrument/artefact type'
      inlineHelp={
        <>
          <span>eg. Digital Thermometer, load cell, microphone, etc</span>
          <span className='d-block pt-1'>
            If you cannot find a suitable Instrument/Artefact type please select
            &quot;No instrument/artefact type available&quot;
          </span>
        </>
      }
      options={artefactTypesSelected}
      readOnly={isInstrumentOrArtefactTypeDisabled}
      addBlank
    />
  </Row>
);

const RequestDetailsSection = () => (
  <Row className='mb-4'>
    <h2 className=''>Request details</h2>
    <TextInput
      label='Previous NMI Quote or Report number (optional)'
      name='previousQuoteOrReportNumber'
      inlineHelp='If available please provide any previous NMI Quote or Report Number e.g. Q230123, RN230123'
    />
    <TextAreaInput
      label='Testing/calibration requirements'
      name='testingAndCalibrationRequirements'
      data-pii='testingAndCalibrationRequirements'
      inlineHelp={
        <>
          <span>
            Describe the testing, measurements, or calibration you need,
            including any specific methods, points, frequencies, temperatures,
            or ranges.
          </span>
          <span className='d-block pt-2'>
            Examples:
            <br />
            &bull; Calibration from -80 degree C to 300 degree C (instead of
            &deg;C symbol)
            <br />
            &bull; Calibration to OIML F1 class for 10mg, 2g, 50g, and 200g
            <br />
            &bull; Calibration up to 400 Litre per min using butane (instead of
            L/min)
            <br />
            &bull; Frequency output calibration against the National Frequency
            Standard
            <br />
          </span>
          <span className='d-block pt-2'>
            Important:
            <br />
            &bull; Where possible avoid using symbols (e.g., &deg;, &#59;,
            &#92;, &#124;) and write the word instead
            <br />
            &bull; Enter a maximum of 2000 characters
          </span>
        </>
      }
      rows={4}
      maxCharacters={2000}
    />
    <DatePicker
      name='preferredInstrumentOrArtefactAvailabilityDate'
      calendarButtonTitle='Prefered date for testing/calibration'
      label='Preferred Instrument/artefact availability date (optional)'
      containerClassName='col-md-12'
      id='q-preferredInstrumentOrArtefactAvailabilityDate'
      // eslint-disable-next-line @eslint-react/purity -- "today" semantics; owned by Child Plan B
      minDate={new Date()}
      inlineHelp={
        <>
          <span>
            Please indicate a date that your instrument/artefact will be
            available for this request. An NMI Test Officer will schedule the
            calibration on or after this date, with the actual calibration date
            dependent on a variety of factors. If no date is provided your
            calibration may be scheduled at the next available opportunity.
          </span>
          <span className='d-block pt-2'>
            The quotation offer will indicate the date the Instrument/artefact
            is required at NMI and a target date for the Measurement Report.
          </span>
        </>
      }
    />
    <RadioButtonGroup
      legend='Measurement report/certificate required (additional fees may apply)'
      name='measurementReportAndCertificateRequired'
      id='q-measurementReportAndCertificateRequired'
      inlineHelp={measurementReportInlineHelp}
      inlineHelpTitle="What's this?"
      options={[
        {
          label: 'Measurement report only',
          value: 'MeasurementReportOnly',
          id: 'measurementReportAndCertificateRequired-MeasurementReportOnly',
        },
        {
          label: 'Regulation 13 only',
          value: 'Regulation13Only',
          id: 'measurementReportAndCertificateRequired-Regulation13Only',
        },
        {
          label: 'Regulation 13 with measurement report',
          value: 'Regulation13WithMeasurementReport',
          id: 'measurementReportAndCertificateRequired-Regulation13WithMeasurementReport',
        },
        {
          label: 'Regulation 34c only',
          value: 'Regulation34cOnly',
          id: 'measurementReportAndCertificateRequired-Regulation34cOnly',
        },
        {
          label: 'Regulation 34c with measurement report',
          value: 'Regulation34cWithMeasurementReport',
          id: 'measurementReportAndCertificateRequired-Regulation34cWithMeasurementReport',
        },
        {
          label: 'Not sure, please advise',
          value: 'UnsurePleaseAdvise',
          id: 'measurementReportAndCertificateRequired-UnsurePleaseAdvise',
        },
      ]}
    />
  </Row>
);

const InstrumentAndRequest = () => {
  const {
    artefactTypesSelected,
    getMeasurementCategories,
    isInstrumentOrArtefactTypeDisabled,
    isLoading,
    onMeasurementCategoryChange,
  } = useInstrumentAndRequestLookups();

  return isLoading ? (
    <BlockUISpinner>
      <p>Loading...</p>
    </BlockUISpinner>
  ) : (
    <>
      <ImportantInformation />
      <InstrumentDetailsSection
        measurementCategoryOptions={getMeasurementCategories()}
        onMeasurementCategoryChange={onMeasurementCategoryChange}
        artefactTypesSelected={artefactTypesSelected!}
        isInstrumentOrArtefactTypeDisabled={isInstrumentOrArtefactTypeDisabled}
      />
      <RequestDetailsSection />
    </>
  );
};

export default InstrumentAndRequest;
