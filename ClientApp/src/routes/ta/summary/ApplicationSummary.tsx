import Row from 'react-bootstrap/Row';
import { Container } from 'react-bootstrap';
import {
  PatternApprovalRequiredValues,
  type LookupResponse,
} from '../../../api/web-api-client';
import SummaryDisplay from '../../../components/SummaryDisplay';
import {
  applicationTypes,
  newCertificateSubOptions,
  otherApprovalSubOptions,
  variationSubOptions,
} from '../applicationOptions';
import { isSummaryFieldHidden } from './types';
import type { TaSummarySectionProps } from './types';

const ROOT = 'applicationAndInstrument';
const NOT_SELECTED = 'Not selected';

const subOptionLabels = (
  value: string[] | string | undefined,
  options: { label: string; value: string }[]
) => {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  return (
    selected
      .map((v) => options.find((o) => o.value === v)?.label)
      .filter(Boolean)
      .join(', ') || NOT_SELECTED
  );
};

const lookupLabel = (
  lookups: LookupResponse[] | undefined,
  id: string | undefined,
  parentId?: string
) => {
  if (!id) return undefined;
  return (lookups ?? []).find(
    (l) => l.id === id && (!parentId || l.parentId === parentId)
  )?.label;
};

const TextSummary = ({
  label,
  id,
  value,
  multiline,
  emptyValue = '',
}: Readonly<{
  label: string;
  id: string;
  value: string | undefined;
  multiline?: boolean;
  /** Shown when there is no value; the certificate number prints a dash. */
  emptyValue?: string;
}>) => (
  <SummaryDisplay
    label={label}
    id={id}
    as='p'
    value={value || emptyValue}
    {...(multiline ? { className: 'pre-wrap' } : {})}
  />
);

/**
 * Read-only application and instrument section. Form-free twin of
 * `ApplicationAndInstrument` in summary mode.
 */
const ApplicationSummary = (props: Readonly<TaSummarySectionProps>) => {
  const app = props.values.applicationAndInstrument;
  const hidden = (field: string) =>
    isSummaryFieldHidden(props, `${ROOT}.${field}`);
  const type = app?.patternApprovalType;
  const categoryLabel = lookupLabel(
    app?.instrumentCategoryLookup,
    app?.instrumentCategory
  );
  const typeLabel = lookupLabel(
    app?.instrumentTypeLookup,
    app?.instrumentType,
    app?.instrumentCategory
  );
  const summaryOfApplication = (
    <TextSummary
      label='Summary of application'
      id={`${ROOT}.summary`}
      value={app?.summary}
      multiline
    />
  );

  return (
    <>
      <Row>
        <Container>
          <Row className='mb-0'>
            <SummaryDisplay
              label='Application type'
              id='applicationType'
              as='p'
              value={
                applicationTypes.find((a) => a.value === type)?.label ??
                NOT_SELECTED
              }
            />
            {type === PatternApprovalRequiredValues.NewCertificate && (
              <SummaryDisplay
                label='Applying for'
                id='newCertificateSubOptions'
                as='p'
                className='mb-0'
                value={subOptionLabels(
                  app?.newSubOptions,
                  newCertificateSubOptions
                )}
              />
            )}
            {type === PatternApprovalRequiredValues.Variation && (
              <SummaryDisplay
                label='Applying for'
                id='variationSubOptions'
                as='p'
                className='mb-0'
                value={subOptionLabels(app?.varSubOptions, variationSubOptions)}
              />
            )}
            {type === PatternApprovalRequiredValues.OtherApproval && (
              <SummaryDisplay
                label='Applying for'
                id='otherApprovalSubOptions'
                as='p'
                className='mb-0'
                value={subOptionLabels(
                  app?.othSubOptions,
                  otherApprovalSubOptions
                )}
              />
            )}
          </Row>
        </Container>
      </Row>
      {!hidden('isApplNewHide') && (
        <>
          <Row>
            <h2 className='h5 my-3'>Instrument details</h2>
            {categoryLabel && (
              <SummaryDisplay
                label='Select the category of your instrument'
                id={`${ROOT}.instrumentCategory`}
                as='p'
                value={categoryLabel}
              />
            )}
            {typeLabel && (
              <SummaryDisplay
                label='Select the type of your instrument'
                id={`${ROOT}.instrumentType`}
                as='p'
                value={typeLabel}
              />
            )}
          </Row>
          {!hidden('isApplNewInstrumentHide') && (
            <Row>
              <TextSummary
                label='Instrument make (optional)'
                id={`${ROOT}.make`}
                value={app?.make}
              />
              <TextSummary
                label='Model (optional)'
                id={`${ROOT}.model`}
                value={app?.model}
              />
              {summaryOfApplication}
            </Row>
          )}
        </>
      )}
      {!hidden('isApplVariationHide') && (
        <Row>
          <h2 className='h5 my-3'>Variation details</h2>
          <TextSummary
            label='Certificate number'
            id={`${ROOT}.certificateNumber`}
            value={app?.certificateNumber}
            emptyValue='-'
          />
          {summaryOfApplication}
        </Row>
      )}
      {!hidden('isApplOtherHide') && (
        <Row>
          <h2 className='h5 my-3'>Other options detail</h2>
          <TextSummary
            label='Certificate number (optional)'
            id={`${ROOT}.certificateNumber`}
            value={app?.certificateNumber}
            emptyValue='-'
          />
          {summaryOfApplication}
        </Row>
      )}
    </>
  );
};

export default ApplicationSummary;
