import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { Col, Row, Container } from 'react-bootstrap';
import { Link, useParams } from 'react-router';
import { CustomAccordion, CustomAccordionBody } from '../../components/Accordion';
import EditButton from '../../components/Buttons/EditButton';
import HeaderIntroText from '../../components/HeaderIntroText';
import useBodyClass from '../../components/Utilities/useBodyClass';
import type { SummaryAndAcceptProps } from './types';
import ReportRecipient from './reportRecipient';
import DeliveryAndReturn from './deliveryAndReturn';
import PaymentDetails from './paymentDetails';
import RadioButtonGroup from '../../components/Inputs/RadioButtonGroup';
import { AcceptQuoteClient, DashboardClient } from '../../api/web-api-client';
import type { AcceptQuotePreInfoDto, OrganisationDto, RequestForQuote } from '../../api/web-api-client';
import TextAreaInput from '../../components/Inputs/TextAreaInput';
import HidableField from '../../components/forms/HidableField';
import Checkbox from '../../components/Inputs/Checkbox';
import InTextLink from '../../components/InTextLink';
import { useAccountState } from '../../authentication/hooks';
import QuotationSummary from './quotationSummary';
import { tokenRequest } from '../../authentication/authConfig';
import BlockUISpinner from '../../components/BlockUISpinner';
import {
    getDashboardNotification,
    clearDashboardNotification,
    setDashboardNotification,
    clearDashboardInfoNotification,
} from '../../storage/notification';
import NotificationMessage from '../../components/Alert/NotificationMessage';
import { NotificationSeverity } from '../../storage/types';
import ExternalLinkIcon from '../../components/Icons/ExternalLinkIcon';
import { getFileUrlFromBase64, openPdfPageInNewTab } from '../common/helperFunctions';
import AppLogger from '../../instrumentation/AppLogger';

const SummaryAndAccept = (props : SummaryAndAcceptProps) => {
    const { id } = useParams<{ id?: string }>();
    const { isSubmitted, cRMQuoteRequestId } = props;
    const { accounts, instance } = useMsal();
    const account = useAccountState();
    const [acceptQuotePreInfo, setAcceptQuotePreInfo] = useState<AcceptQuotePreInfoDto | undefined>();
    const [requestForQuote, setRequestForQuote] = useState<RequestForQuote | undefined>();
    const [organisationDto, setOrganisationDto] = useState<OrganisationDto | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const [fileError, setFileError] = useState(false);

    const setNotification = () => {
        const dashboardNotification = getDashboardNotification();
        return (
            dashboardNotification
                ? (
                    <NotificationMessage
                        id='notif-message-1'
                        canClose
                        onClose={clearDashboardNotification}
                        {...dashboardNotification}
                    />
                )
                : null);
    };
    const dashboardMessage = setNotification();
    const showDashboardMessage = (message: JSX.Element | null) => (
        <>
            {message && (
                <Container>
                    <Row>
                        <Col>
                            {message}
                        </Col>
                    </Row>
                </Container>
            )}
        </>
    );

    const downloadQuoteTermsPagePdf = async () => {
        try {
            AppLogger.verbose('SummaryAndAccept.downloadQuoteTermsPagePdf', { crmQuoteId: acceptQuotePreInfo?.crmQuoteId });
            setIsLoading(true);
            const client = new DashboardClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            client.setAuthToken(tokenResult.accessToken);
            const fileResponse = await client.getQuoteOfferPDFByQuoteID(acceptQuotePreInfo?.crmQuoteId, true);
            if (fileResponse?.fileData && fileResponse.mimeType && fileResponse.filename) {
                const fileUrl = getFileUrlFromBase64(fileResponse.fileData);
                openPdfPageInNewTab(fileUrl, '2');
            }
            setIsLoading(false);
        } catch (e) {
            setFileError(true);
            setIsLoading(false);
            AppLogger.error('Failed to download Quote terms', e as Error);
        }
    };

    useEffect(() => {
        const getAcceptQuotePreInfo = async () => {
            if (!id || accounts.length === 0) {
                return;
            }

            try {
                AppLogger.verbose('SummaryAndAccept.getAcceptQuotePreInfo', { Id: id });
                const acceptQuoteClient = new AcceptQuoteClient();
                const tokenResult = await instance.acquireTokenSilent({
                    ...tokenRequest,
                    account: accounts[0],
                });
                acceptQuoteClient.setAuthToken(tokenResult.accessToken);

                const summaryAndAccept = await acceptQuoteClient.getSummaryAndAccept(id);
                setAcceptQuotePreInfo(summaryAndAccept.acceptQuotePreInfo);
                setRequestForQuote(summaryAndAccept.requestForQuote);
                setOrganisationDto(summaryAndAccept.rfqOrganisation);
            } catch (e) {
                AppLogger.error('Failed to retrieve getAcceptQuotePreInfo', e as Error, { Id: id });
            }
        };
        const loadDataForDisplay = async () => {
            await getAcceptQuotePreInfo();
        };
        void loadDataForDisplay();
    }, [accounts, id, instance]);

    let organisationPrimaryName = organisationDto?.branchOrLocationName;
    if (organisationDto?.businessOrTradingName) {
        organisationPrimaryName = organisationDto.businessOrTradingName;
        if (organisationDto.branchOrLocationName) {
            organisationPrimaryName = `${organisationDto.businessOrTradingName} - ${organisationDto.branchOrLocationName}`;
        }
    }

    if (fileError) {
        setDashboardNotification({
            message: 'Oops - An unexpected error has occurred with downloading the PDF quote. Please wait a minute before reloading this page to try again.',
            severity: NotificationSeverity.Error,
        });
    } else {
        clearDashboardInfoNotification();
    }
    useBodyClass('summary');
    return (
        <>
            {isLoading && (
                <BlockUISpinner>
                    <p>Loading...</p>
                </BlockUISpinner>
            )}
            {showDashboardMessage(dashboardMessage)}
            <Row className='mb-4'>
                {!isSubmitted && (
                    <HeaderIntroText>
                        {'Before you accept and submit our offer, please review the information you have provided. '}
                        <span className='text-nowrap'>To make any changes,</span>
                        {' click on the Edit button.'}
                    </HeaderIntroText>
                )}
                <CustomAccordion id='quotationSummary'>
                    <CustomAccordionBody name='Quotation summary' eventKey='0' className='mb-4 py-2'>
                        <QuotationSummary isSummary name='quotationSummary' cRMQuoteRequestId={cRMQuoteRequestId} />
                    </CustomAccordionBody>
                </CustomAccordion>
                <CustomAccordion id='reportRecipient'>
                    <CustomAccordionBody name='Report recipient' eventKey='1' className='mb-4 py-2'>
                        <ReportRecipient isSummary name='reportRecipient' id={id} />
                        {isSubmitted ? null : <EditButton link={`/accept-quote/${id}/report-recipient`} />}
                    </CustomAccordionBody>
                </CustomAccordion>
                <CustomAccordion id='deliveryAndReturn'>
                    <CustomAccordionBody name='Instrument/artefact delivery and return' eventKey='2' className='mb-4 py-2'>
                        <DeliveryAndReturn isSummary name='deliveryAndReturn' id={id} />
                        {isSubmitted ? null : <EditButton link={`/accept-quote/${id}/delivery-and-return`} />}
                    </CustomAccordionBody>
                </CustomAccordion>
                <CustomAccordion id='paymentDetails'>
                    <CustomAccordionBody name='Payment details' eventKey='3' className='mb-4 py-2'>
                        <PaymentDetails isSummary name='paymentDetails' id={id} />
                        {isSubmitted ? null : <EditButton link={`/accept-quote/${id}/payment-details`} />}
                    </CustomAccordionBody>
                </CustomAccordion>
                <CustomAccordion id='quotationTermsAndConditions'>
                    <CustomAccordionBody name='Quotation terms and conditions' eventKey='0' className='mb-4 py-2'>
                        <Row className='mb-4'>
                            <RadioButtonGroup
                                legend='Any associated disputes?'
                                name='associatedDisputes'
                                id='q-associatedDisputes'
                                isSummary={false}
                                inlineHelp={(
                                    <>
                                        Are the services requested in connection with a dispute
                                    </>
                                )}
                                options={[
                                    {
                                        label: 'Yes',
                                        value: 'Yes',
                                        id: 'associatedDisputes-Yes',
                                    },
                                    {
                                        label: 'No',
                                        value: 'No',
                                        id: 'associatedDisputes-No',
                                    }]}
                            />
                            <HidableField name='associatedDispute'>
                                <TextAreaInput
                                    label='Please provide details of the associated dispute'
                                    name='associatedDispute'
                                    inlineHelp={(
                                        <>
                                            NMI reserves the right to require a discussion between all parties to the dispute before providing the services.
                                            {' '}
                                            <span className='d-block pt-1'>
                                                Enter a maximum of 300 characters.
                                            </span>
                                        </>
                                    )}
                                    rows={4}
                                    maxCharacters={300}
                                    isSummary={false}
                                />
                            </HidableField>
                            <p>
                                <strong>By accepting this Quotation and the</strong>
                                {' '}
                                <InTextLink
                                    onClick={(_e) => downloadQuoteTermsPagePdf()}
                                >
                                    Terms
                                    <ExternalLinkIcon className='ms-2' />
                                    <span className='visually-hidden'> Opens in a new tab</span>
                                </InTextLink>
                                {' '}
                                <strong>form a contract between the Client and NMI (&apos;Contract&apos;).</strong>
                            </p>
                            <Col md={6}>
                                <p>
                                    <strong>
                                        Accepting for Client
                                    </strong>
                                    <br />
                                    {(account?.details) && (
                                        <span className='text-break'>
                                            {`${account?.details?.givenName} ${account?.details?.familyName}`}
                                            <br />
                                        </span>
                                    )}
                                </p>
                                {(requestForQuote?.contact) && (
                                    <p>
                                        <i>Request for quote by</i>
                                        <br />
                                        <span className='text-break'>
                                            {(requestForQuote?.contact?.firstName) && (`${requestForQuote?.contact?.firstName}`)}
                                            {(requestForQuote?.contact?.lastName) && (` ${requestForQuote?.contact?.lastName}`)}
                                            <br />
                                        </span>
                                        {(requestForQuote?.contact?.role) && (
                                            <span className='text-break'>
                                                {requestForQuote?.contact?.role}
                                                <br />
                                            </span>
                                        )}
                                        {(requestForQuote?.contact?.phone) && (
                                            <span className='text-break'>
                                                {requestForQuote?.contact?.phone}
                                                <br />
                                            </span>
                                        )}
                                        {(requestForQuote?.contact?.email) && (
                                            <span className='text-break'>
                                                {requestForQuote?.contact?.email}
                                                <br />
                                            </span>
                                        )}
                                    </p>
                                )}
                                {(organisationDto) && (
                                    <p className='mb-0'>
                                        {organisationPrimaryName && (
                                            <span className='text-break'>
                                                {organisationPrimaryName}
                                                <br />
                                            </span>
                                        )}
                                        {(organisationDto?.name) && (
                                            <span className='text-break'>
                                                {organisationDto?.name}
                                                <br />
                                            </span>
                                        )}
                                        {(organisationDto?.abn) && (
                                            <span className='text-break'>
                                                <span className='visually-hidden'>ABN: </span>
                                                <span>{organisationDto?.abn}</span>
                                                <br />
                                            </span>
                                        )}
                                    </p>
                                )}
                                {(organisationDto?.streetAddress) && (
                                    <p>
                                        {(organisationDto?.streetAddress?.line1) && (
                                            <span className='text-break'>
                                                {organisationDto?.streetAddress?.line1}
                                                <br />
                                            </span>
                                        )}
                                        {(organisationDto?.streetAddress?.line2) && (
                                            <span className='text-break'>
                                                {organisationDto?.streetAddress?.line2}
                                                <br />
                                            </span>
                                        )}
                                        {(organisationDto?.streetAddress?.line3) && (
                                            <span className='text-break'>
                                                {organisationDto?.streetAddress?.line3}
                                                <br />
                                            </span>
                                        )}
                                        <span className='text-break'>
                                            {(organisationDto?.streetAddress?.suburb) && (`${organisationDto?.streetAddress?.suburb}`)}
                                            {(organisationDto?.streetAddress?.state) && (` ${organisationDto?.streetAddress?.state}`)}
                                            {(organisationDto?.streetAddress?.postcode) && (` ${organisationDto?.streetAddress?.postcode}`)}
                                        </span>
                                    </p>
                                )}
                            </Col>
                            <Col md={6}>
                                <p>
                                    <strong>
                                        Accepting for the National Measurement Institute (NMI)
                                        <br />
                                    </strong>
                                    {(acceptQuotePreInfo?.nmiCheckedByName) && (
                                        <span className='text-break'>
                                            {acceptQuotePreInfo?.nmiCheckedByName}
                                            <br />
                                        </span>
                                    )}
                                    {(acceptQuotePreInfo?.nmiCheckedByJobTitle) && (
                                        <span className='text-break'>
                                            {acceptQuotePreInfo?.nmiCheckedByJobTitle}
                                            <br />
                                        </span>
                                    )}
                                    {(acceptQuotePreInfo?.nmiCheckedByPhone) && (
                                        <span className='text-break'>
                                            {acceptQuotePreInfo?.nmiCheckedByPhone}
                                            <br />
                                        </span>
                                    )}
                                    {(acceptQuotePreInfo?.nmiCheckedByEmail) && (
                                        <span className='text-break'>
                                            {acceptQuotePreInfo?.nmiCheckedByEmail}
                                            <br />
                                        </span>
                                    )}
                                </p>
                                <p className='mb-0'>
                                    <span className='text-break'>National Measurement Institute</span>
                                    <br />
                                    <span className='text-break'>ABN 74 599 608 295</span>
                                    <br />
                                    <span className='text-break'>36 Bradfield Road</span>
                                    <br />
                                    <span className='text-break'>West Lindfield NSW 2070</span>
                                    <br />
                                    <span className='text-break'>Australia</span>
                                </p>
                            </Col>
                            <p>
                                <strong>Note:</strong>{' '}
                                This quotation for services, together with any written quotation price adjustment,
                                upon payment, is a complying TAX INVOICE as per ATO GSTR2000/17
                            </p>
                            <Checkbox
                                label='Yes, on behalf of my organisation, I accept the quotation'
                                name='acceptanceOfQuote'
                                isSummary={false}
                                containerClassName='mb-0 pe-1 w-auto'
                            />
                            <InTextLink
                                onClick={(_e) => downloadQuoteTermsPagePdf()}
                                className='ms-5 ms-lg-0 mt-0 mt-lg-1 p-0 w-auto'
                            >
                                terms and conditions
                                <ExternalLinkIcon className='ms-2' />
                                <span className='visually-hidden'> Opens in a new tab</span>
                            </InTextLink>
                        </Row>
                    </CustomAccordionBody>
                </CustomAccordion>
            </Row>
            {isSubmitted && (
                <Row className='mb-4'>
                    <div className='d-grid d-md-block'>
                        <Link
                            data-testid='back-button'
                            to={`/submitted-success/${id}`}
                            replace
                            className='btn btn-tertiary'
                        >
                            <i className='icon-back me-1' aria-hidden='true' />
                            {' '}
                            Submit and accept
                        </Link>
                    </div>
                </Row>
            )}
        </>
    );
};

export default SummaryAndAccept;
