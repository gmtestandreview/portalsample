import { Row } from 'react-bootstrap';
import { Link, useParams } from 'react-router';
import { CustomAccordion, CustomAccordionBody } from '../../components/Accordion';
import EditButton from '../../components/Buttons/EditButton';
import HeaderIntroText from '../../components/HeaderIntroText';
import type { TASummaryProps } from './types';
import OrganisationAndContact from './organisationAndContact';
import ApplicationAndInstrument from './applicationAndInstrument';
import SupportingDocuments from './supportingDocuments';
import useBodyClass from '../../components/Utilities/useBodyClass';
import Checkbox from '../../components/Inputs/Checkbox';
import InTextLink from '../../components/InTextLink';
import { prefixedPropertyOf } from '../../utils';
import type { RequestForPatternApprovalSummary } from '../../api/web-api-client';

const getName = prefixedPropertyOf<RequestForPatternApprovalSummary>('summaryAndSubmit');

function getNameForUse2(name: string | keyof RequestForPatternApprovalSummary, isSummary: boolean | undefined) {
    const fullname = isSummary ? getName(name as keyof RequestForPatternApprovalSummary) : name;
    return fullname;
}

const SummaryAndSubmit = (props: TASummaryProps) => {
    const { id } = useParams<{ id?: string }>();
    const { isSubmitted } = props;

    function getNameForUse(name: string | keyof RequestForPatternApprovalSummary): string { return getNameForUse2(name, false); }

    useBodyClass('summary');
    return (
        <>
            <Row className='mb-4'>
                {!isSubmitted && (
                    <HeaderIntroText>
                        {'Before you submit your request, please review the information you have provided. '}
                        <span className='text-nowrap'>To make any changes,</span>
                        {' click on the Edit button.'}
                    </HeaderIntroText>
                )}
                <CustomAccordion id='organisationAndContact'>
                    <CustomAccordionBody name='Organisation details' eventKey='0' className='mb-4 py-2'>
                        <OrganisationAndContact isSummary name='organisationAndContact' />
                        {!isSubmitted ? <EditButton link={`/ta/${id}/organisation-details`} /> : null}
                    </CustomAccordionBody>
                </CustomAccordion>
                <CustomAccordion id='applicationAndInstrument'>
                    <CustomAccordionBody name='Application details' eventKey='2' className='mb-4 py-2'>
                        <ApplicationAndInstrument isSummary name='applicationAndInstrument' />
                        {!isSubmitted ? <EditButton link={`/ta/${id}/application-details`} /> : null}
                    </CustomAccordionBody>
                </CustomAccordion>
                <CustomAccordion id='supportingDocuments'>
                    <CustomAccordionBody name='Supporting documents' eventKey='1' className='mb-4 py-2'>
                        <SupportingDocuments
                            isSummary
                            name='supportingDocuments.form.documents'
                            onUploadAttachment={() => Promise.resolve([])} // Not used
                            attachment={{
                                onUploadFiles: () => Promise.resolve([]), // Not used
                            }}
                        />
                        {!isSubmitted ? <EditButton link={`/ta/${id}/supporting-documents`} /> : null}
                    </CustomAccordionBody>
                </CustomAccordion>
                <CustomAccordion id='applicationTermsAndConditions'>
                    <CustomAccordionBody name='Terms and conditions' eventKey='0' className='mb-4 py-2'>
                        <Row className='mb-4'>
                            <p>
                                <strong>
                                    You must read and accept the NMI P 106 and the terms and conditions before submitting your application.
                                </strong>
                            </p>
                            <Checkbox
                                label='I have read NMI P 106 (approval and certification procedures)'
                                name={getNameForUse('acceptNMIP106')}
                                isSummary={false}
                                containerClassName='mb-0 pe-1 -w-auto'
                                validationClassName='ms-4 px-3'
                            />
                            <InTextLink
                                href='https://www.industry.gov.au/sites/default/files/2026-03/nmi-p-106.pdf'
                                target='_blank'
                                className='d-inline-block ms-5 mb-3 px-1 w-auto'
                            >
                                NMI P 106 Procedures for approval and certification of patterns of measuring instruments (PDF)
                            </InTextLink>

                            <Checkbox
                                label='I have read and accept the terms and conditions associated with this application '
                                name={getNameForUse('acceptTermsAndConditions')}
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
                                name={getNameForUse('acceptDeclaration')}
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
                            replace
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
