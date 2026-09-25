import { useMsal } from '@azure/msal-react';
import Row from 'react-bootstrap/Row';
import {
    Alert,
    Col,
} from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { AcceptQuoteClient, AccountsClient } from '../../api/web-api-client';
import type { AcceptQuotePreInfoDto, AddressDetailsDto, DeliveryAndReturnStep } from '../../api/web-api-client';
import { prefixedPropertyOf } from '../../utils';
import type { DeliveryAndReturnProps } from './types';
import TextAreaInput from '../../components/Inputs/TextAreaInput';
import TextInput from '../../components/Inputs/TextInput';
import RadioButtonGroup from '../../components/Inputs/RadioButtonGroup';
import HidableField from '../../components/forms/HidableField';
import ContactDetailsInput from '../../components/forms/CommonForms/ContactDetails';
import AddressLookup from '../../components/Inputs/AddressLookup';
import NumberInput from '../../components/Inputs/NumberInput';
import BlockUISpinner from '../../components/BlockUISpinner';
import { tokenRequest } from '../../authentication/authConfig';
import { useAccountState } from '../../authentication/hooks';
import MailingLabel from '../../components/Utilities/mailingLabel';
import AppLogger from '../../instrumentation/AppLogger';
import DeliveryInstructions from '../../components/Utilities/deliveryInstructions';
import { getFormattedAddress } from '../common/helperFunctions';

const getName = prefixedPropertyOf<DeliveryAndReturnStep>('deliveryAndReturn');

function getNameForUse2(name: keyof DeliveryAndReturnStep, isSummary: boolean | undefined) {
    const fullname = isSummary ? getName(name) : name;
    return fullname;
}

const DeliveryAndReturn = (props: DeliveryAndReturnProps) => {
    const { isSummary, id } = props;
    const { accounts, instance } = useMsal();
    const [isLoading, setIsLoading] = useState(false);
    const [deliveryAndReturnStep, setDeliveryAndReturnStep] = useState<DeliveryAndReturnStep | undefined>();
    const [acceptQuotePreInfo, setAcceptQuotePreInfo] = useState<AcceptQuotePreInfoDto | undefined>();
    const [postalAddress, setPostalAddress] = useState<AddressDetailsDto | undefined>();
    const [streetAddress, setStreetAddress] = useState<AddressDetailsDto | undefined>();
    const account = useAccountState();
    const homeAccountId = account?.details?.homeAccountId;

    function getNameForUse(name: keyof DeliveryAndReturnStep): string { return getNameForUse2(name, isSummary); }

    const renderNoDeliveryInfoMsg = () => (
        <p className='mb-0'>
            This quotation does not require the delivery or return of the
            instrument/artefact to the NMI.
            <br />
            Contact your NMI test officer for further details.
        </p>
    );

    const renderNoDeliveryInfoPanel = () => (
        <Alert
            variant='basic'
            role='status'
            aria-live='off'
            className='d-flex mb-4'
        >
            <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
                <div className='-bgCircle mb-3 me-3'>
                    <i className='icon-warning text-primary' aria-hidden='true' />
                </div>
            </div>
            <div>
                <p className='mb-0 visually-hidden'>
                    <strong>Important information</strong>
                </p>
                {renderNoDeliveryInfoMsg()}
            </div>
        </Alert>
    );

    useEffect(() => {
        const getAcceptQuotePreInfo = async () => {
            try {
                AppLogger.verbose('DeliveryAndReturn.getAcceptQuotePreInfo.', { homeAccountId });
                const acceptQuoteClient = new AcceptQuoteClient();
                const accountsClient = new AccountsClient();
                const tokenResult = await instance.acquireTokenSilent({
                    ...tokenRequest,
                    account: accounts[0],
                });
                acceptQuoteClient.setAuthToken(tokenResult.accessToken);
                accountsClient.setAuthToken(tokenResult.accessToken);

                const deliveryAndReturn = await acceptQuoteClient.getDeliveryAndReturn(id!);
                setDeliveryAndReturnStep(deliveryAndReturn);
                setAcceptQuotePreInfo(deliveryAndReturn.acceptQuotePreInfo);

                setStreetAddress(deliveryAndReturn.rfqOrganisation?.streetAddress);

                if (deliveryAndReturn.rfqOrganisation?.postalAddressSameAsStreetAddress) setPostalAddress(deliveryAndReturn.rfqOrganisation?.streetAddress);
                else setPostalAddress(deliveryAndReturn.rfqOrganisation?.postalAddress);
            } catch (error) {
                AppLogger.error('Failed to load AcceptQuotePreInfo', error as Error, { Id: id });
            }
        };

        const loadDataForDisplay = async () => {
            setIsLoading(true);
            await getAcceptQuotePreInfo();
            setIsLoading(false);
        };
        loadDataForDisplay();
    }, [homeAccountId, accounts, id, instance]);

    return (
        <>
            {isLoading && (
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
                        <strong>Important information</strong>
                        {acceptQuotePreInfo?.receiptAndDispatchNA ? (
                            renderNoDeliveryInfoMsg()
                        ) : (
                            <>
                                <p>
                                    Delays in shipping instruments/artefacts to NMI may impact our service time frames.
                                    Please allow extra time for shipping to us.
                                </p>
                                <p>
                                    Instruments/artefacts not clearly labelled with the Quotation ID may experience additional delays for calibration.
                                </p>
                                <p>
                                    <strong>Note:</strong>{' '}
                                    The client is responsible for all costs associated with delivery to NMI and
                                    all arrangements and costs associated with return.
                                </p>
                            </>
                        )}
                    </div>
                </Alert>
            )}
            {!acceptQuotePreInfo?.receiptAndDispatchNA && (
                <>
                    <Row className='mb-4'>
                        <h2 className={isSummary ? 'h3 my-3' : ''}>
                            Instrument/artefact delivery
                        </h2>
                        <h3 className={isSummary ? 'h4 my-3' : ''}>
                            Please deliver the instrument/artefact to NMI with the following label attached
                        </h3>
                        <MailingLabel {...acceptQuotePreInfo} />
                        <DeliveryInstructions deliveryInstructions={acceptQuotePreInfo?.nmiFacilityDeliveryInstructions} />
                    </Row>
                    <Row className='mb-4'>
                        <h2 className={isSummary ? 'h3 my-3' : ''}>
                            Instrument/artefact return
                        </h2>
                        <h3 className={isSummary ? 'h4 my-3' : ''}>
                            Return contact person
                        </h3>
                        <RadioButtonGroup
                            legend='Please select your contact person for the returned instrument/artefact when the job has completed'
                            name={getNameForUse('returnContactType')}
                            id='q-returnContactType'
                            isSummary={isSummary}
                            options={[
                                {
                                    label: 'The main contact person for this request',
                                    value: 'SamePerson',
                                    id: 'returnContactType-SamePerson',
                                },
                                {
                                    label: 'A different return contact person',
                                    value: 'DifferentPerson',
                                    id: 'returnContactType-DifferentPerson',
                                }]}
                        />
                    </Row>
                    {isSummary && (
                        <HidableField name={getNameForUse('rfqHide')}>
                            <Row className='mb-4'>
                                <h4 className='h5 my-3'>
                                    Return contact person details
                                </h4>
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
                            <h4 className={isSummary ? 'h5 my-3' : ''}>
                                Return contact person details
                            </h4>
                            <ContactDetailsInput
                                key='contact'
                                name={getNameForUse('contact')}
                                isSummary={isSummary}
                            />
                        </Row>
                    </HidableField>
                    {!isSummary && (
                        <Row className='mb-2'>
                            <h3>
                                Return organisation and address label
                            </h3>
                            <TextInput
                                label='Return organisation name (optional)'
                                name={getNameForUse('returnOrganisationName')}
                                inlineHelp={(
                                    <span>
                                        Please confirm return organisation name and address for the return label for the instrument/artefact
                                    </span>
                                )}
                                isSummary={isSummary}
                            />
                            <RadioButtonGroup
                                legend='Instrument/artefact return address'
                                name={getNameForUse('returnAddressType')}
                                id='q-returnAddressType'
                                inlineHelp={(
                                    <span>
                                        Please select your return address for the instrument/artefact.
                                        <br />
                                        To update your stored organisation details go to
                                        <br />
                                        Dashboard &gt;
                                        {'  Settings menu '}
                                        <i className='icon-settings me-1' />
                                        &gt;
                                        {' Manage organisation'}
                                    </span>
                                )}
                                isSummary={isSummary}
                                containerClassName='mb-3'
                                options={[
                                    {
                                        label: 'Business street address',
                                        value: 'BusinessAddress',
                                        descriptor: getFormattedAddress(streetAddress),
                                        id: 'returnAddressType-BusinessAddress',
                                    },
                                    {
                                        label: 'Business postal address',
                                        value: 'PostalAddress',
                                        descriptor: getFormattedAddress(postalAddress),
                                        id: 'returnAddressType-PostalAddress',
                                    },
                                    {
                                        label: 'Other',
                                        value: 'Other',
                                        id: 'returnAddressType-Other',
                                    },
                                ]}
                            />
                            <HidableField name='returnAddress'>
                                <div className='px-5'>
                                    <AddressLookup
                                        name={getNameForUse('returnAddress')}
                                        label='Return address'
                                        maxResults={10}
                                        key='returnAddress'
                                        placeholder='Start typing and then select your address from the drop-down list'
                                    />
                                </div>
                            </HidableField>
                        </Row>
                    )}
                    {isSummary && deliveryAndReturnStep && (() => {
                        const {
                            returnAddressType, rfqOrganisation, returnOrganisationName, returnAddress,
                        } = deliveryAndReturnStep;
                        let address: AddressDetailsDto | undefined;

                        const organisationName = returnOrganisationName;

                        switch (returnAddressType) {
                            case 'BusinessAddress':
                                address = streetAddress;
                                break;
                            case 'PostalAddress':
                                address = rfqOrganisation?.postalAddressSameAsStreetAddress ? streetAddress : postalAddress;
                                break;
                            case 'Other':
                                address = returnAddress;
                                break;
                            default:
                                return null;
                        }

                        return (
                            <>
                                <h3>Instrument/artefact return address</h3>
                                <div className='mb-4'>
                                    <div className='form-label mb-0'>Return organisation name (optional)</div>
                                    {organisationName ? <p>{organisationName}</p> : <p>-</p>}
                                </div>
                                {address && (
                                    <>
                                        <div className='form-label mb-0'>Return address</div>
                                        <p>{getFormattedAddress(address)}</p>
                                    </>
                                )}
                            </>
                        );
                    })()}
                    <Row className='mb-4'>
                        <h3 className={isSummary ? 'h4 my-3' : ''}>
                            Return method
                        </h3>
                        <RadioButtonGroup
                            legend='Choose your return method for the instrument/artefact'
                            name={getNameForUse('returnMethod')}
                            id='q-returnMethod'
                            isSummary={isSummary}
                            options={[
                                {
                                    label: 'Client to arrange when completed',
                                    value: 'ClientToArrange',
                                    id: 'returnMethod-ClientToArrange',
                                },
                                {
                                    label: 'Client will collect/pickup when completed',
                                    value: 'ClientWillCollect',
                                    id: 'returnMethod-ClientWillCollect',
                                },
                                {
                                    label: 'Client will provide carrier details below',
                                    value: 'ClientWillProvide',
                                    id: 'returnMethod-ClientWillProvide',
                                },
                            ]}
                        />
                        {!isSummary && (
                            <HidableField name={getNameForUse('carrierHide')}>
                                <TextAreaInput
                                    label='Packaging notes (optional)'
                                    name={getNameForUse('packagingNotes')}
                                    inlineHelp={(
                                        <>
                                            {'Please specify packaging requirements if different to that as received at this Laboratory, extra charges may apply.'}
                                            <span className='d-block pt-1'>
                                                Enter a maximum of 300 characters.
                                            </span>
                                        </>
                                    )}
                                    rows={3}
                                    maxCharacters={300}
                                    isSummary={isSummary}
                                />
                                <h3 className='h4 my-3'>
                                    Carrier
                                </h3>
                                <TextInput
                                    label='Carrier name'
                                    name={getNameForUse('carrierName')}
                                    isSummary={isSummary}
                                />
                                <TextInput
                                    label='Carrier account number or Pre-paid shipment reference'
                                    name={getNameForUse('carrierAccountNumber')}
                                    isSummary={isSummary}
                                />
                                <TextInput
                                    label='Carrier contact person (optional)'
                                    name={getNameForUse('carrierContactPerson')}
                                    isSummary={isSummary}
                                />
                                <NumberInput
                                    label='Carrier contact phone (optional)'
                                    name={getNameForUse('carrierContactPhone')}
                                    type='Phone'
                                    isSummary={isSummary}
                                    format='checkPhoneFormat'
                                />
                                <RadioButtonGroup
                                    legend='Shipment mode'
                                    name={getNameForUse('shipmentMode')}
                                    id='q-shipmentMode'
                                    isSummary={isSummary}
                                    options={[
                                        {
                                            label: 'Road',
                                            value: 'Road',
                                            id: 'shipmentMode-Road',
                                        },
                                        {
                                            label: 'Air',
                                            value: 'Air',
                                            id: 'shipmentMode-Air',
                                        },

                                    ]}
                                />
                                <RadioButtonGroup
                                    legend='Shipment priority'
                                    name={getNameForUse('shipmentPriority')}
                                    id='q-shipmentPriority'
                                    isSummary={isSummary}
                                    options={[
                                        {
                                            label: 'Standard',
                                            value: 'Standard',
                                            id: 'shipmentPriority-Standard',
                                        },
                                        {
                                            label: 'Same day',
                                            value: 'SameDay',
                                            id: 'shipmentPriority-SameDay',
                                        },
                                        {
                                            label: 'Next day',
                                            value: 'NextDay',
                                            id: 'shipmentPriority-NextDay',
                                        },
                                        {
                                            label: 'Off peak',
                                            value: 'OffPeak',
                                            id: 'shipmentPriority-OffPeak',
                                        },
                                        {
                                            label: 'Economy',
                                            value: 'Economy',
                                            id: 'shipmentPriority-Economy',
                                        },
                                        {
                                            label: 'Express',
                                            value: 'Express',
                                            id: 'shipmentPriority-Express',
                                        },
                                        {
                                            label: 'Overnight',
                                            value: 'Overnight',
                                            id: 'shipmentPriority-Overnight',
                                        },
                                        {
                                            label: 'Overnight first class priority',
                                            value: 'OvernightFirstClassPriority',
                                            id: 'shipmentPriority-OvernightFirstClassPriority',
                                        },
                                        {
                                            label: 'Priority',
                                            value: 'Priority',
                                            id: 'shipmentPriority-Priority',
                                        },
                                    ]}
                                />
                                <TextAreaInput
                                    label='Insurance notes (optional)'
                                    name={getNameForUse('insuranceNotes')}
                                    inlineHelp={(
                                        <>
                                            {'If the instrument/artefact is insured, are there any instructions that NMI must convey to your carrier?'}
                                            <span className='d-block pt-1'>
                                                Enter a maximum of 300 characters.
                                            </span>
                                        </>
                                    )}
                                    rows={3}
                                    maxCharacters={300}
                                    isSummary={isSummary}
                                />
                                <NumberInput
                                    label='For overseas client, Value for Australian Customs purposes (optional)'
                                    name={getNameForUse('customsValue')}
                                    isSummary={isSummary}
                                    containerClassName='col-md-12 col-lg-10'
                                    prepend='AUD$'
                                    placeholder='0.00'
                                    allowNegative={false}
                                    thousandSeparator
                                    fixedDecimalScale
                                    decimalScale={2}
                                    valueIsNumericString
                                    maxLength={13} // Set to 13 rather than 10 to account for the thousands sep and decimal point
                                />
                                <TextAreaInput
                                    label='Special instructions (optional)'
                                    name={getNameForUse('specialInstructions')}
                                    inlineHelp={(
                                        <span className='d-block pt-1'>
                                            Enter a maximum of 300 characters.
                                        </span>
                                    )}
                                    rows={3}
                                    maxCharacters={300}
                                    isSummary={isSummary}
                                />
                            </HidableField>
                        )}
                    </Row>
                </>
            )}
            {acceptQuotePreInfo?.receiptAndDispatchNA && isSummary && (
                <Row className='mb-4'>
                    <Col md={12}>{renderNoDeliveryInfoPanel()}</Col>
                </Row>
            )}
        </>
    );
};

export default DeliveryAndReturn;
