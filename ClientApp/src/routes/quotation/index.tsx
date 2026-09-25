import { useEffect, useMemo, useState } from 'react';
import {
    Col, Row, Container,
    Button,
} from 'react-bootstrap';
import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { Link, useNavigate, useParams } from 'react-router';
import BlockUISpinner from '../../components/BlockUISpinner';
import {
    getDashboardNotification,
    clearDashboardNotification,
    setDashboardNotification,
    getDashboardInfoNotification,
    clearDashboardInfoNotification,
} from '../../storage/notification';
import NotificationMessage from '../../components/Alert/NotificationMessage';
import useHtmlTitle from '../../components/Utilities/useHtmlTitle';
import useBodyClass from '../../components/Utilities/useBodyClass';
import { useAccountState } from '../../authentication/hooks';
import { NotificationSeverity } from '../../storage/types';
import CustomBreadcrumb from '../../components/Breadcrumb';
import type { CustomBreadcrumbItem } from '../../components/Breadcrumb';
import HeaderIntroText from '../../components/HeaderIntroText';
import type { QuotationtProps } from './types';
import { ApplicationType, QuoteClient } from '../../api/web-api-client';
import type { RequestForQuoteDetails } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import QuoteDetails from './quoteDetails';
import NMIContactDetails from './nMIContactDetails';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

import { QuoteStatus } from '../common/enums';
import ViewPdfQuoteTerms from '../../components/Utilities/ViewPdfQuoteTerms';
import ViewPdfQuote from '../../components/Utilities/ViewPdfQuote';
import { proceedDeclineValidStatuses } from '../common/quoteStatus';
import AppLogger from '../../instrumentation/AppLogger';
import SessionStorageCache from '../../storage/sessionStorageCache';

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

const setInfoNotification = () => {
    const dashboardInfoNotification = getDashboardInfoNotification();
    return (
        dashboardInfoNotification
            ? (
                <NotificationMessage
                    id='notif-info-message-2'
                    canClose
                    onClose={clearDashboardInfoNotification}
                    {...dashboardInfoNotification}
                />
            )
            : null);
};

const handleAlertScroll = () => {
    window.scrollTo(0, 0);
    setTimeout(() => {
        const el: HTMLElement = document.querySelector(('[id^="#notif-"]')) as HTMLElement;
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el?.focus();
    }, 100);
};

const Quotation = (props: QuotationtProps) => {
    const { id } = useParams<{ id?: string }>();
    const { isSummary } = props;
    const { inProgress, accounts, instance } = useMsal();
    const [isLoading, setIsLoading] = useState(false);
    const [reload, setReload] = useState(false);
    const [scrollToTop, setScrollToTop] = useState(false);
    const [quotationData, setQuotationData] = useState<RequestForQuoteDetails | undefined>();
    const [declineQuoteDialogOpen, setDeclineQuoteDialogOpen] = useState(false);
    const [fileError, setFileError] = useState(false);
    const closeDeclineQuoteModal = () => setDeclineQuoteDialogOpen(false);
    const showDeclineQuoteModal = () => setDeclineQuoteDialogOpen(true);
    const accountState = useAccountState();
    const dashboardMessage = setNotification();
    const dashboardInfoMessage = setInfoNotification();

    const navigate = useNavigate();

    const breadcrumbs: CustomBreadcrumbItem[] = [
        { to: '/', text: 'Dashboard' },
        { to: '', text: 'Testing and calibration service - Quotation' },
    ];

    const backButtonVisible = useMemo(
        () => quotationData?.quoteRequestStatus !== undefined
            && proceedDeclineValidStatuses.includes(quotationData.quoteRequestStatus as QuoteStatus),
        [quotationData?.quoteRequestStatus],
    );

    const declineQuote = async () => {
        setIsLoading(true);
        try {
            const client = new QuoteClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });

            client.setAuthToken(tokenResult.accessToken);
            if (quotationData?.crmQuoteRequestId) {
                await client.declineQuote(
                    quotationData?.crmQuoteRequestId,
                    accountState?.details?.givenName,
                    accountState?.details?.familyName,
                );
                navigate('/');
            }
        } catch (e) {
            setFileError(true);
            AppLogger.error('Failed to decline quote', e as Error, { Id: id });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (accountState?.details?.targetOrganisation?.targetOrganisationAbn
            && inProgress === InteractionStatus.None
            && accounts.length > 0) {
            setReload(false);
        }

        if (scrollToTop) {
            handleAlertScroll();
        }
    }, [accountState, accountState?.details?.targetOrganisation?.targetOrganisationAbn,
        accounts.length, inProgress, reload, scrollToTop]);

    useEffect(() => {
        let isActive = true;

        const getQuotationDetails = async () => {
            try {
                AppLogger.verbose('Quotation.getQuotationDetails', { Id: id });
                setIsLoading(true);
                setFileError(false);
                const quoteclient = new QuoteClient();
                const tokenResult = await instance.acquireTokenSilent({
                    ...tokenRequest,
                    account: accounts[0],
                });
                quoteclient.setAuthToken(tokenResult.accessToken);

                const quoteData = await quoteclient.getQuoteRequestDetailsByRefId(ApplicationType.QuoteRequest, id);
                if (!isActive) return;

                // TS - This is to fix azure board issue 489452
                const newlyAcceptedQuoteId = SessionStorageCache().getItem('view-quote-id');
                if (newlyAcceptedQuoteId) {
                    if (quoteData?.quoteRequestIdNum === newlyAcceptedQuoteId && quoteData?.quoteRequestStatus === QuoteStatus.QuoteAvailable) {
                        quoteData.quoteRequestStatus = QuoteStatus.QuoteAccepted;
                        quoteData.outcomeDate = new Date();
                    }
                    SessionStorageCache().removeItem('view-quote-id');
                }

                setQuotationData(quoteData);
            } catch (e) {
                if (!isActive) return;

                setFileError(true);
                AppLogger.error('Failed to load quotation details', e as Error, { Id: id });
                navigate('/not-found');
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        void getQuotationDetails();

        return () => {
            isActive = false;
        };
    }, [accounts, id, instance, navigate]);

    useEffect(() => {
        if (fileError) {
            setScrollToTop(true);
            setDashboardNotification({
                message: 'Oops - An unexpected error has occurred with downloading the PDF quote.'
                    + ' Please wait a minute before reloading this page to try again.',
                severity: NotificationSeverity.Error,
            });
        } else {
            setScrollToTop(false);
            clearDashboardNotification();
        }
    }, [fileError]);

    useHtmlTitle('Quotation - Testing and calibration service | NMI Services portal');
    useBodyClass('quotation');

    clearDashboardInfoNotification();
    const renderQuotationSummary = () => (
        <>
            <QuoteDetails
                quotationData={quotationData}
                isSummary={isSummary}
                firstName={accountState?.details?.givenName}
                lastName={accountState?.details?.familyName}
                fileError={fileError}
            />
            {!!quotationData?.quoteRequestStatus && quotationData?.quoteRequestStatus !== QuoteStatus.QuoteExpired
                && (
                    <Row className='mb-3'>
                        <Col md={12}>
                            <div>
                                <ViewPdfQuoteTerms
                                    quotationData={quotationData}
                                    setFileError={setFileError}
                                    setIsLoading={setIsLoading}
                                    prefixText='A minimum handling fee of AUD $250 will be charged for
                                                any instrument that, on receipt, is found to be faulty [see '
                                    suffixText='clause 11 (a)] and for any quotation accepted by the client
                                                and subsequently cancelled before delivery of the instrument to NMI.'
                                />
                            </div>
                            <div className='d-grid w-100 gap-1 d-md-flex flex-column justify-content-md-between text-end'>
                                <ViewPdfQuote
                                    quotationData={quotationData}
                                    setFileError={setFileError}
                                    setIsLoading={setIsLoading}
                                    text='View detailed PDF quote'
                                />
                            </div>
                        </Col>
                    </Row>
                )}
            <NMIContactDetails quotationData={quotationData} />
        </>
    );

    return (
        <>
            {isLoading && (
                <BlockUISpinner>
                    <p>Loading...</p>
                </BlockUISpinner>
            )}
            {!fileError && showDashboardMessage(dashboardMessage)}
            {!fileError && showDashboardMessage(dashboardInfoMessage)}
            <div aria-busy={isLoading} aria-live='polite'>
                <Container fluid className='default-banner-background mb-5'>
                    <Container>
                        <Row>
                            <Col>
                                <CustomBreadcrumb breadcrumbs={breadcrumbs} />
                            </Col>
                        </Row>
                        <Row className='gs-wrapper-sm'>
                            <Col md={12} lg={9}>
                                <h1 id='page-title' tabIndex={-1} className='banner-title mb-2'>Quotation</h1>
                                <HeaderIntroText>
                                    <strong>
                                        Testing and calibration service
                                    </strong>
                                </HeaderIntroText>
                            </Col>
                        </Row>
                    </Container>
                </Container>
                <Container>
                    {renderQuotationSummary()}
                </Container>
                <Container>
                    <Row className='mb-4'>
                        <Col>
                            <div className='mt-5 d-grid w-100 gap-3 d-md-flex justify-content-md-between'>
                                {(backButtonVisible)
                                    ? (
                                        <Row className='mb-4'>
                                            <div className='d-grid d-md-block'>
                                                <Link
                                                    data-testid='back-button'
                                                    to='/dashboard'
                                                    replace
                                                    className='btn btn-tertiary'
                                                >
                                                    <i className='icon-back me-1' aria-hidden='true' />
                                                    {' Back to dashboard'}
                                                </Link>
                                            </div>
                                        </Row>
                                    )
                                    : (
                                        <>
                                            <Link
                                                data-testid='go-to-dashboard-button'
                                                to='/dashboard'
                                                className='btn btn-tertiary order-3 order-md-0'
                                            >
                                                <i className='icon-close me-1' aria-hidden='true' />
                                                {' Cancel'}
                                            </Link>
                                            <Button variant='secondary' data-testid='decline-button' className='ms-md-auto' onClick={showDeclineQuoteModal}>
                                                Decline quote
                                            </Button>
                                            <Link data-testid='new-request-button' to={`/accept-quote-create/${id}`} className='btn btn-primary'>
                                                Proceed with quote
                                            </Link>
                                        </>
                                    )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
            <ConfirmationModal
                closeModal={closeDeclineQuoteModal}
                isOpen={declineQuoteDialogOpen}
                titleText='Decline quote'
                bodyText={
                    (
                        <>
                            <p>
                                {'Are you sure you want to decline this Quotation ID '}
                                <strong>
                                    {quotationData?.quotationIdNum}
                                </strong>
                                {'?'}
                            </p>
                            <p>
                                <strong>
                                    {'Note: '}
                                </strong>
                                {' Declining this quote cannot be undone'}
                            </p>
                        </>
                    )
                }
                onModalNo={closeDeclineQuoteModal}
                onModalYes={declineQuote}
                noButtonTitle='Cancel'
                yesButtonTitle='Decline quote'
            />
        </>
    );
};

export default Quotation;
