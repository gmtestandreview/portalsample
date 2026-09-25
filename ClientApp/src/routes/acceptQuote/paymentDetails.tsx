import { useMsal } from '@azure/msal-react';
import { useEffect, useState } from 'react';
import Row from 'react-bootstrap/Row';
import { Alert } from 'react-bootstrap';
import { prefixedPropertyOf } from '../../utils';
import { AcceptQuoteClient } from '../../api/web-api-client';
import type { AcceptQuotePreInfoDto, PaymentDetailsStep } from '../../api/web-api-client';
import type { PaymentDetailsProps } from './types';
import TextInput from '../../components/Inputs/TextInput';
import RadioButtonGroup from '../../components/Inputs/RadioButtonGroup';
import HidableField from '../../components/forms/HidableField';
import ContactDetailsInput from '../../components/forms/CommonForms/ContactDetails';
import { tokenRequest } from '../../authentication/authConfig';
import BlockUISpinner from '../../components/BlockUISpinner';
import AppLogger from '../../instrumentation/AppLogger';

const getName = prefixedPropertyOf<PaymentDetailsStep>('paymentDetails');

function getNameForUse2(name: keyof PaymentDetailsStep, isSummary: boolean | undefined) {
    return isSummary ? getName(name) : name;
}

const PaymentDetails = (props: PaymentDetailsProps) => {
    const { isSummary, id } = props;
    const { accounts, instance } = useMsal();
    const [isLoading, setIsLoading] = useState(false);
    const [acceptQuotePreInfo, setAcceptQuotePreInfo] = useState<AcceptQuotePreInfoDto | undefined>();

    function getNameForUse(name: keyof PaymentDetailsStep): string { return getNameForUse2(name, isSummary); }

    const getAcceptQuotePreInfo = async () => {
        try {
            AppLogger.verbose('PaymentDetails.getAcceptQuotePreInfo', { Id: id });
            const acceptQuoteClient = new AcceptQuoteClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            acceptQuoteClient.setAuthToken(tokenResult.accessToken);

            const paymentDetails = await acceptQuoteClient.getPaymentDetails(id!);
            setAcceptQuotePreInfo(paymentDetails.acceptQuotePreInfo);
        } catch (e) {
            AppLogger.error('Failed to load Payment details', e as Error, { Id: id });
        }
    };

    useEffect(() => {
        const loadDataForDisplay = async () => {
            setIsLoading(true);
            await getAcceptQuotePreInfo();
            setIsLoading(false);
        };
        loadDataForDisplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            {isLoading && !isSummary && (
                <BlockUISpinner>
                    <p>Loading...</p>
                </BlockUISpinner>
            )}
            {isSummary ? null : (
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
                        <p>
                            A payment reference number will be provided on the invoice with payment details.
                        </p>
                        {(acceptQuotePreInfo?.paymentTerms !== 'Prepaid') && (
                            <p>
                                <strong>Invoices must be paid within 30 days of NMI invoice date.</strong>
                                {' '}Clients not meeting this condition may have this option withdrawn on future occasions.
                            </p>
                        )}
                        {(acceptQuotePreInfo?.paymentTerms === 'Prepaid') && (
                            <p>
                                <strong>Prepayment required</strong>
                                {' '}- An invoice will be forwarded following the receipt of this accepted quotation. Payment of the invoice is required and calibration may only commence once payment has been received.
                            </p>
                        )}
                    </div>
                </Alert>
            )}
            <Row className='mb-4'>
                <TextInput
                    label='Purchase Order (PO) number (optional)'
                    name={getNameForUse('purchaseOrderNo')}
                    placeholder='Enter purchase order number'
                    inlineHelp={(
                        <>
                            {'Purchase order can be provided at a later date.'}
                            <span className='d-block pt-1'>
                                Your NMI Quotation ID
                                {(acceptQuotePreInfo?.quotationIdNum) && (` ${acceptQuotePreInfo?.quotationIdNum}`)}
                            </span>
                        </>
                    )}
                    isSummary={isSummary}
                />
                <RadioButtonGroup
                    legend='The invoice will be sent to the following contact'
                    name={getNameForUse('invoiceSentTo')}
                    id='q-invoiceSentTo'
                    isSummary={isSummary}
                    options={[
                        {
                            label: 'The main contact person for this request',
                            value: 'SamePerson',
                            id: 'invoiceSentTo-SamePerson',
                        },
                        {
                            label: 'A different invoice contact person',
                            value: 'DifferentPerson',
                            id: 'invoiceSentTo-DifferentPerson',
                        }]}
                />
            </Row>
            {isSummary && (
                <HidableField name={getNameForUse('rfqHide')}>
                    <Row className='mb-4'>
                        <h2 className='h4 my-3'>
                            Invoice contact person
                        </h2>
                        <ContactDetailsInput
                            key='contact'
                            name='requestForQuote.contact'
                            isSummary={isSummary}
                        />
                    </Row>
                </HidableField>
            )}
            <HidableField name={getNameForUse('contactHide')}>
                <Row className='mb-4'>
                    <h2 className={isSummary ? 'h4 my-3' : ''}>
                        Invoice contact person
                    </h2>
                    <ContactDetailsInput
                        key='contact'
                        name={getNameForUse('contact')}
                        isSummary={isSummary}
                        firstNameLabel='First name (optional)'
                        lastNameLabel='Last name (optional)'
                        businessPhoneLabel='Business phone (optional)'
                        mobilePhoneLabel='Mobile phone (optional)'
                    />
                </Row>
            </HidableField>
        </>
    );
};

export default PaymentDetails;
