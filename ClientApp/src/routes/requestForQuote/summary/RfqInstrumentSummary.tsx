import Row from 'react-bootstrap/Row';
import BlockUISpinner from '../../../components/BlockUISpinner';
import SummaryDisplay from '../../../components/SummaryDisplay';
import type { SelectInputOption } from '../../../components/Inputs/SelectInput/types';
import type { InstrumentAndRequestStep } from '../../../api/web-api-client';
import {
  formatDateOnlyForDisplay,
  parseApiDateOnlyInput,
} from '../../../utils/dateOnly';
import { isSerialNumberHidden } from '../instrumentAndRequestProps';
import { useRfqInstrumentLookups } from './useRfqInstrumentLookups';
import type { RfqInstrumentLookups } from './useRfqInstrumentLookups';
import type { RfqSummarySectionProps } from './types';

const ROOT = 'instrumentAndRequest';

interface ChoiceOption {
  value: string;
  label: string;
}

const SERIAL_NUMBER_OPTIONS: readonly ChoiceOption[] = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

const REPORT_OPTIONS: readonly ChoiceOption[] = [
  { value: 'MeasurementReportOnly', label: 'Measurement report only' },
  { value: 'Regulation13Only', label: 'Regulation 13 only' },
  {
    value: 'Regulation13WithMeasurementReport',
    label: 'Regulation 13 with measurement report',
  },
  { value: 'Regulation34cOnly', label: 'Regulation 34c only' },
  {
    value: 'Regulation34cWithMeasurementReport',
    label: 'Regulation 34c with measurement report',
  },
  { value: 'UnsurePleaseAdvise', label: 'Not sure, please advise' },
];

type Field = keyof InstrumentAndRequestStep;

interface TextFieldProps {
  label: string;
  field: Field;
  value: string | undefined;
  className?: string;
}

const TextField = ({ label, field, value, className }: TextFieldProps) => (
  <SummaryDisplay
    label={label}
    value={value}
    as='p'
    id={`${ROOT}.${field}`}
    className={className}
  />
);

interface ChoiceFieldProps {
  legend: string;
  field: Field;
  value: string | undefined;
  options: readonly ChoiceOption[];
}

/** Shows the option's label; nothing at all when no answer was given. */
const ChoiceField = ({ legend, field, value, options }: ChoiceFieldProps) =>
  value ? (
    <SummaryDisplay
      label={legend}
      value={
        options.find((o) => o.value === value)?.label ?? 'No details added'
      }
      id={`${ROOT}.${field}`}
      as='span'
    />
  ) : null;

interface LookupFieldProps {
  label: string;
  field: Field;
  value: string | undefined;
  options: SelectInputOption<string>[];
}

/** Resolves a lookup id to its label; nothing at all when no id was chosen. */
const LookupField = ({ label, field, value, options }: LookupFieldProps) =>
  value ? (
    <SummaryDisplay
      label={label}
      id={`${ROOT}.${field}`}
      as='p'
      value={options.find((o) => o.value === value)?.displayText ?? ''}
    />
  ) : null;

const formatAvailabilityDate = (
  raw: InstrumentAndRequestStep['preferredInstrumentOrArtefactAvailabilityDate']
) => {
  const dateOnly = parseApiDateOnlyInput(raw);
  if (dateOnly) return formatDateOnlyForDisplay(dateOnly);
  return typeof raw === 'string' ? raw : undefined;
};

interface SectionProps {
  step: InstrumentAndRequestStep | undefined;
}

interface InstrumentDetailsProps extends SectionProps {
  lookups: RfqInstrumentLookups;
}

const InstrumentDetails = ({ step, lookups }: InstrumentDetailsProps) => (
  <Row className=''>
    <h2 className='h3 my-3'>Instrument/artefact details</h2>
    <ChoiceField
      legend='Does this instrument/artefact have a serial number available?'
      field='hasSerialNumber'
      value={step?.hasSerialNumber}
      options={SERIAL_NUMBER_OPTIONS}
    />
    {isSerialNumberHidden(step ?? {}) ? null : (
      <TextField
        label='Serial number'
        field='serialNumber'
        value={step?.serialNumber}
      />
    )}
    <TextField
      label='Manufacturer'
      field='manufacturer'
      value={step?.manufacturer}
    />
    <TextField label='Model' field='model' value={step?.model} />
    <TextField
      label='Description (optional)'
      field='description'
      value={step?.description}
      className='pre-wrap'
    />
    <SummaryDisplay
      label='Number of items'
      // A count of 0 shows as empty, as the Formik summary does.
      value={step?.numberOfItems ? String(step.numberOfItems) : undefined}
      as='span'
      id={`${ROOT}.numberOfItems`}
    />
    <LookupField
      label='Measurement category'
      field='measurementCategory'
      value={step?.measurementCategory}
      options={lookups.measurementCategories}
    />
    <LookupField
      label='Instrument/artefact type'
      field='instrumentOrArtefactType'
      value={step?.instrumentOrArtefactType}
      options={lookups.artefactTypes}
    />
  </Row>
);

const RequestDetails = ({ step }: SectionProps) => (
  <Row className='mb-4'>
    <h2 className='h3 my-3'>Request details</h2>
    <TextField
      label='Previous NMI Quote or Report number (optional)'
      field='previousQuoteOrReportNumber'
      value={step?.previousQuoteOrReportNumber}
    />
    <TextField
      label='Testing/calibration requirements'
      field='testingAndCalibrationRequirements'
      value={step?.testingAndCalibrationRequirements}
      className='pre-wrap'
    />
    <SummaryDisplay
      as='p'
      id='q-preferredInstrumentOrArtefactAvailabilityDate'
      label='Preferred Instrument/artefact availability date (optional)'
      value={formatAvailabilityDate(
        step?.preferredInstrumentOrArtefactAvailabilityDate
      )}
    />
    <ChoiceField
      legend='Measurement report/certificate required'
      field='measurementReportAndCertificateRequired'
      value={step?.measurementReportAndCertificateRequired}
      options={REPORT_OPTIONS}
    />
  </Row>
);

/**
 * Read-only instrument and request section. Form-free twin of
 * `InstrumentAndRequest` in summary mode.
 */
const RfqInstrumentSummary = ({
  values,
}: Readonly<Pick<RfqSummarySectionProps, 'values'>>) => {
  const lookups = useRfqInstrumentLookups();
  const step = values.instrumentAndRequest;

  if (lookups === undefined) {
    return (
      <BlockUISpinner>
        <p>Loading...</p>
      </BlockUISpinner>
    );
  }

  return (
    <>
      <InstrumentDetails step={step} lookups={lookups} />
      <RequestDetails step={step} />
    </>
  );
};

export default RfqInstrumentSummary;
