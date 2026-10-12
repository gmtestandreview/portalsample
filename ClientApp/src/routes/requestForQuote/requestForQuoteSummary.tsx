import { Row } from 'react-bootstrap';
import { Link, useParams } from 'react-router';
import { useFormikContext } from 'formik';
import {
  CustomAccordion,
  CustomAccordionBody,
} from '../../components/Accordion';
import EditButton from '../../components/Buttons/EditButton';
import HeaderIntroText from '../../components/HeaderIntroText';
import useBodyClass from '../../components/Utilities/useBodyClass';
import type { SummaryProps } from './types';
import RfqOrganisationSummary from './summary/RfqOrganisationSummary';
import RfqInstrumentSummary from './summary/RfqInstrumentSummary';
import type { RfqSummarySectionProps } from './summary/types';

const RequestForQuoteSummary = ({ isSubmitted }: Readonly<SummaryProps>) => {
  const { id } = useParams<{ id?: string }>();
  const isEditable = !isSubmitted;
  const { values, status } =
    useFormikContext<RfqSummarySectionProps['values']>();
  // The wizard keeps its hiding rules in Formik's status (see `FormikForm`).
  const hidden: RfqSummarySectionProps['hidden'] =
    (status as { hidden?: RfqSummarySectionProps['hidden'] } | undefined)
      ?.hidden ?? {};
  useBodyClass('summary');
  return (
    <>
      <Row className='mb-4'>
        {isEditable && (
          <HeaderIntroText>
            {
              'Before you submit your request, please review the information you have provided. '
            }
            <span className='text-nowrap'>To make any changes,</span> click on
            the Edit button.
          </HeaderIntroText>
        )}
        <CustomAccordion id='organisationAndContact'>
          <CustomAccordionBody
            name='Organisation and Contact'
            eventKey='0'
            className='mb-4 py-2'
          >
            <RfqOrganisationSummary values={values} hidden={hidden} />
            {isEditable ? (
              <EditButton
                link={`/request-for-quote/${id}/organisation-and-contact`}
              />
            ) : null}
          </CustomAccordionBody>
        </CustomAccordion>
        <CustomAccordion id='instrumentAndRequest'>
          <CustomAccordionBody
            name='Instrument and Request'
            eventKey='1'
            className='mb-4 py-2'
          >
            <RfqInstrumentSummary values={values} />
            {isEditable ? (
              <EditButton
                link={`/request-for-quote/${id}/instrument-and-request`}
              />
            ) : null}
          </CustomAccordionBody>
        </CustomAccordion>
      </Row>
      {isSubmitted && (
        <Row className='mb-4'>
          <div className='d-grid d-md-block'>
            <Link
              data-testid='back-button'
              to='/dashboard'
              replace
              className='btn btn-tertiary'
            >
              <span>
                <i className='icon-back me-1' aria-hidden='true' /> Back to
                dashboard
              </span>
            </Link>
          </div>
        </Row>
      )}
    </>
  );
};

export default RequestForQuoteSummary;
