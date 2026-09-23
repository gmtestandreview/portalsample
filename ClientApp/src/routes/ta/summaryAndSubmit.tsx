import { Row } from 'react-bootstrap';
import { Link, useParams } from 'react-router';
import {
  CustomAccordion,
  CustomAccordionBody,
} from '../../components/Accordion/index.tsx';
import EditButton from '../../components/Buttons/EditButton/index.tsx';
import HeaderIntroText from '../../components/HeaderIntroText/index.tsx';
import Checkbox from '../../components/Inputs/Checkbox/index.tsx';
import InTextLink from '../../components/InTextLink/index.tsx';
import useBodyClass from '../../components/Utilities/useBodyClass.tsx';
import ApplicationAndInstrument from './applicationAndInstrument.tsx';
import OrganisationAndContact from './organisationAndContact.tsx';
import SupportingDocuments from './supportingDocuments.tsx';
import type { TASummaryProps } from './types.ts';

const SummaryAndSubmit = (props: TASummaryProps) => {
  const { id } = useParams<{ id?: string }>();
  const { isSubmitted } = props;

  useBodyClass('summary');
  return (
    <>
      <Row className='mb-4'>
        {!isSubmitted && (
          <HeaderIntroText>
            {
              'Before you submit your request, please review the information you have provided. '
            }
            <span className='text-nowrap'>To make any changes,</span>
            {' click on the Edit button.'}
          </HeaderIntroText>
        )}
        <CustomAccordion id='organisationAndContact'>
          <CustomAccordionBody
            name='Organisation details'
            eventKey='0'
            className='mb-4 py-2'
          >
            <OrganisationAndContact
              isSummary={true}
              name='organisationAndContact'
            />
            {isSubmitted ? null : (
              <EditButton link={`/ta/${id}/organisation-details`} />
            )}
          </CustomAccordionBody>
        </CustomAccordion>
        <CustomAccordion id='applicationAndInstrument'>
          <CustomAccordionBody
            name='Application details'
            eventKey='2'
            className='mb-4 py-2'
          >
            <ApplicationAndInstrument
              isSummary={true}
              name='applicationAndInstrument'
            />
            {isSubmitted ? null : (
              <EditButton link={`/ta/${id}/application-details`} />
            )}
          </CustomAccordionBody>
        </CustomAccordion>
        <CustomAccordion id='supportingDocuments'>
          <CustomAccordionBody
            name='Supporting documents'
            eventKey='1'
            className='mb-4 py-2'
          >
            <SupportingDocuments
              isSummary={true}
              name='supportingDocuments.form.documents'
              onUploadAttachment={() => Promise.resolve([])} // Not used
              attachment={{
                onUploadFiles: () => Promise.resolve([]), // Not used
              }}
            />
            {isSubmitted ? null : (
              <EditButton link={`/ta/${id}/supporting-documents`} />
            )}
          </CustomAccordionBody>
        </CustomAccordion>
        <CustomAccordion id='applicationTermsAndConditions'>
          <CustomAccordionBody
            name='Terms and conditions'
            eventKey='0'
            className='mb-4 py-2'
          >
            <Row className='mb-4'>
              <p>
                <strong>
                  You must read and accept the NMI P 106 and the terms and
                  conditions before submitting your application.
                </strong>
              </p>
              <Checkbox
                label='I have read NMI P 106 (approval and certification procedures)'
                name='acceptNMIP106'
                isSummary={false}
                containerClassName='mb-0 pe-1 -w-auto'
                validationClassName='ms-4 px-3'
              />
              <InTextLink
                href='https://www.industry.gov.au/sites/default/files/2026-03/nmi-p-106.pdf'
                target='_blank'
                className='d-inline-block ms-5 mb-3 px-1 w-auto'
              >
                NMI P 106 Procedures for approval and certification of patterns
                of measuring instruments (PDF)
              </InTextLink>

              <Checkbox
                label='I have read and accept the terms and conditions associated with this application '
                name='acceptTermsAndConditions'
                isSummary={false}
                containerClassName='mb-0 pe-1 -w-auto'
                validationClassName='ms-4 px-3'
              />
              <InTextLink
                href='https://www.industry.gov.au/national-measurement-institute/pattern-approval/application-pattern-approval/pattern-approval-terms-and-conditions'
                target='_blank'
                className='d-inline-block ms-5 mb-3 px-1 w-auto'
              >
                Pattern approval terms and conditions
              </InTextLink>

              <Checkbox
                label='I declare that the measuring Instrument has been designed and contracted to the relevant Australian safety standards and, where appropriate, that the measuring Instrument complies with the relevant safety test scheme'
                name='acceptDeclaration'
                isSummary={false}
                containerClassName='mb-0 pe-1 -w-auto'
                validationClassName='ms-4 px-3'
              />
            </Row>
          </CustomAccordionBody>
        </CustomAccordion>
      </Row>
      {isSubmitted && (
        <Row className='mb-4'>
          <div className='d-grid d-md-block'>
            <Link
              data-testid='back-button'
              to='/dashboard'
              replace={true}
              className='btn btn-tertiary'
            >
              <i className='icon-back me-1' aria-hidden='true' />
              Back to dashboard
            </Link>
          </div>
        </Row>
      )}
    </>
  );
};

export default SummaryAndSubmit;
