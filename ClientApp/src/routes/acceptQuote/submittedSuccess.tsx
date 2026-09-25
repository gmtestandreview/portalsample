import { useParams, Link } from 'react-router';
import { Col, Container, Row } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import useBodyClass from '../../components/Utilities/useBodyClass';
import FormBanner from '../../components/forms/FormBanner';
import { useAccountState } from '../../authentication/hooks';
import { AcceptQuoteClient } from '../../api/web-api-client';
import type { AcceptQuotePreInfoDto } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import BlockUISpinner from '../../components/BlockUISpinner';
import AppLogger from '../../instrumentation/AppLogger';
import { formatBannerTitle } from '../common/helperFunctions';
import type { AccountDetails } from '../../authentication/accountContext';

const SubmittedSuccess = () => {
    const { id } = useParams<{ id?: string }>();
    const account = useAccountState();
    const { accounts, instance } = useMsal();

    const [isLoading, setIsLoading] = useState(false);
    const [acceptQuotePreInfo, setAcceptQuotePreInfo] = useState<AcceptQuotePreInfoDto | undefined>();

    useEffect(() => {
        const getAcceptQuotePreInfo = async () => {
            try {
                AppLogger.verbose('SubmittedSuccess.getAcceptQuotePreInfo', { Id: id });
                const acceptQuoteClient = new AcceptQuoteClient();
                const tokenResult = await instance.acquireTokenSilent({
                    ...tokenRequest,
                    account: accounts[0],
                });
                acceptQuoteClient.setAuthToken(tokenResult.accessToken);

                const paymentDetails = await acceptQuoteClient.getPaymentDetails(id!);
                setAcceptQuotePreInfo(paymentDetails.acceptQuotePreInfo);
            } catch (e) {
                AppLogger.error('Failed to retrieve AcceptQuotePreInfo', e as Error, { Id: id });
            }
        };

        const loadDataForDisplay = async () => {
            setIsLoading(true);
            await getAcceptQuotePreInfo();
            setIsLoading(false);
        };
        loadDataForDisplay();
    }, [accounts, id, instance]);

    const isPrepaid = acceptQuotePreInfo?.paymentTerms === 'Prepaid';
    const prepaidText = ' - An invoice will be forwarded following the receipt of this accepted quotation. Payment of the invoice is required and calibration may only commence once payment has been received.';
    const postpaidText = ' Clients not meeting this condition may have this option withdrawn on future occasions.';
    const accountDetails : AccountDetails = account!.details!;

    useBodyClass('summary');
    return (
        <>
            {isLoading && (
                <BlockUISpinner>
                    <p>Loading...</p>
                </BlockUISpinner>
            )}
            <FormBanner
                title='Testing and calibration service - Quotation'
                showSaveAndExitButton={false}
                refTitle={`Quotation ID: ${id}`}
                subTitle={formatBannerTitle(accountDetails)}
                showGoToDashboardButton
            />
            <Container fluid id='main' role='main' className='px-0' tabIndex={-1}>
                <Container className='py-5'>
                    <Row className='mb-5'>
                        <Col sm={12} md={10} lg={8} className='mx-auto'>
                            <h1 id='page-title' tabIndex={-1}>
                                Your accepted quote has been successfully submitted
                            </h1>
                            {(!isPrepaid)
                            && (
                                <p>
                                    <strong>Invoices must be paid within 30 days of NMI invoice date.</strong>
                                    {postpaidText}
                                </p>
                            )}
                            {(isPrepaid)
                            && (
                                <p>
                                    <strong>Prepayment required</strong>
                                    {prepaidText}
                                </p>
                            )}
                            <p>
                                <strong>An invoice will be forwarded to your organisation following the quotation acceptance</strong>
                            </p>
                            <div className='d-grid d-md-block'>
                                <Link
                                    data-testid='go-to-dashboard-button'
                                    to='/dashboard'
                                    replace
                                    className='btn btn-primary'
                                >
                                    Go to dashboard
                                </Link>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </Container>
        </>
    );
};

export default SubmittedSuccess;
