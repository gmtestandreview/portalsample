import Row from 'react-bootstrap/Row';
import { Alert } from 'react-bootstrap';
import RhfTextAreaInput from '../../components/Inputs/RhfTextAreaInput';
import RhfHidableField from '../../components/forms/RhfHidableField';
import RhfSelectInput from '../../components/Inputs/RhfSelectInput';
import type { SelectInputOption } from '../../components/Inputs/SelectInput/types';
import RhfRadioButtonGroup from '../../components/Inputs/RhfRadioButtonGroup';
import BlockUISpinner from '../../components/BlockUISpinner';
import RhfNumberInput from '../../components/Inputs/RhfNumberInput';
import RhfTextInput from '../../components/Inputs/RhfTextInput';
import RhfDatePicker from '../../components/Inputs/RhfDatePicker';
import { useInstrumentAndRequestLookups } from './useInstrumentAndRequestLookups';
import { useStableToday } from './useStableToday';

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

const hasSerialNumberOptions = [
  { label: 'Yes', value: 'Yes', id: 'hasSerialNumber-Yes' },
  { label: 'No', value: 'No', id: 'hasSerialNumber-No' },
];

const descriptionInlineHelp = (
  <>
    <span>
      Describe the instrument or artefact, including its capacity, parameters,
      or measurement range.
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
      &bull; Where possible avoid using symbols (e.g., &deg;, &#59;, &#92;,
      &#124;) and write the word instead
      <br />
      &bull; Enter a maximum of 400 characters
    </span>
  </>
);

const measurementCategoryInlineHelp = (
  <>
    <span>e.g. Temperature, pressure, mass and density etc</span>
    <span className='d-block pt-1'>
      If you cannot find a suitable Measurement category please select &quot;No
      measurement category available&quot;
    </span>
  </>
);

const instrumentTypeInlineHelp = (
  <>
    <span>eg. Digital Thermometer, load cell, microphone, etc</span>
    <span className='d-block pt-1'>
      If you cannot find a suitable Instrument/Artefact type please select
      &quot;No instrument/artefact type available&quot;
    </span>
  </>
);

const IdentificationFields = () => (
  <>
    <RhfRadioButtonGroup
      legend='Does this instrument/artefact have a serial number available?'
      name='hasSerialNumber'
      id='q-hasSerialNumber'
      options={hasSerialNumberOptions}
    />
    <RhfHidableField name='serialNumber'>
      <RhfTextInput label='Serial number' name='serialNumber' />
    </RhfHidableField>
    <RhfTextInput
      label='Manufacturer'
      name='manufacturer'
      inlineHelp='If the Manufacturer is known please enter it below, if unknown please enter "n/a" for not applicable.'
    />
    <RhfTextInput
      label='Model'
      name='model'
      inlineHelp='If the Model is known please enter it below, if unknown please enter "n/a" for not applicable.'
    />
  </>
);

const DescriptionFields = () => (
  <>
    <RhfTextAreaInput
      label='Description (optional)'
      name='description'
      inlineHelp={descriptionInlineHelp}
      rows={2}
      maxCharacters={400}
    />
    <RhfNumberInput
      label='Number of items'
      name='numberOfItems'
      containerClassName='col-md-6'
      allowNegative={false}
      decimalScale={0}
      inlineHelp='If a set of items. e.g. set of weights'
    />
  </>
);

interface InstrumentDetailsSectionProps {
  measurementCategoryOptions: SelectInputOption<string>[];
  onMeasurementCategoryChange: (value: string) => void;
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
    <IdentificationFields />
    <DescriptionFields />
    <RhfSelectInput
      name='measurementCategory'
      label='Measurement category'
      inlineHelp={measurementCategoryInlineHelp}
      options={measurementCategoryOptions}
      onChange={onMeasurementCategoryChange}
      addBlank
    />
    <RhfSelectInput
      name='instrumentOrArtefactType'
      label='Instrument/artefact type'
      inlineHelp={instrumentTypeInlineHelp}
      options={artefactTypesSelected}
      readOnly={isInstrumentOrArtefactTypeDisabled}
      addBlank
    />
  </Row>
);

const RequestDetailsSection = () => {
  const today = useStableToday();

  return (
    <Row className='mb-4'>
      <h2 className=''>Request details</h2>
      <RhfTextInput
        label='Previous NMI Quote or Report number (optional)'
        name='previousQuoteOrReportNumber'
        inlineHelp='If available please provide any previous NMI Quote or Report Number e.g. Q230123, RN230123'
      />
      <RhfTextAreaInput
        label='Testing/calibration requirements'
        name='testingAndCalibrationRequirements'
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
              &bull; Calibration up to 400 Litre per min using butane (instead
              of L/min)
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
      <RhfDatePicker
        name='preferredInstrumentOrArtefactAvailabilityDate'
        calendarButtonTitle='Prefered date for testing/calibration'
        label='Preferred Instrument/artefact availability date (optional)'
        containerClassName='col-md-12'
        id='q-preferredInstrumentOrArtefactAvailabilityDate'
        // "today" semantics; owned by Child Plan B
        minDate={today}
        inlineHelp={
          <>
            <span>
              Please indicate a date that your instrument/artefact will be
              available for this request. An NMI Test Officer will schedule the
              calibration on or after this date, with the actual calibration
              date dependent on a variety of factors. If no date is provided
              your calibration may be scheduled at the next available
              opportunity.
            </span>
            <span className='d-block pt-2'>
              The quotation offer will indicate the date the Instrument/artefact
              is required at NMI and a target date for the Measurement Report.
            </span>
          </>
        }
      />
      <RhfRadioButtonGroup
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
};

const InstrumentAndRequest = () => {
  const {
    artefactTypesSelected,
    getMeasurementCategories,
    isInstrumentOrArtefactTypeDisabled,
    isLoading,
    onMeasurementCategoryChange,
  } = useInstrumentAndRequestLookups();

  return isLoading || artefactTypesSelected === undefined ? (
    <BlockUISpinner>
      <p>Loading...</p>
    </BlockUISpinner>
  ) : (
    <>
      <ImportantInformation />
      <InstrumentDetailsSection
        measurementCategoryOptions={getMeasurementCategories()}
        onMeasurementCategoryChange={onMeasurementCategoryChange}
        artefactTypesSelected={artefactTypesSelected}
        isInstrumentOrArtefactTypeDisabled={isInstrumentOrArtefactTypeDisabled}
      />
      <RequestDetailsSection />
    </>
  );
};

export default InstrumentAndRequest;
