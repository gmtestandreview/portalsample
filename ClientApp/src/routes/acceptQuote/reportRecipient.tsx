import { useMsal } from '@azure/msal-react';
import Row from 'react-bootstrap/Row';
import { Alert } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import TextInput from '../../components/Inputs/TextInput';
import type { ReportRecipientProps } from './types';
import { AcceptQuoteClient } from '../../api/web-api-client';
import type { AddressDetailsDto, ReportRecipientStep } from '../../api/web-api-client';
import { prefixedPropertyOf } from '../../utils';
import HidableField from '../../components/forms/HidableField';
import AddressLookup from '../../components/Inputs/AddressLookup';
import { useAccountState } from '../../authentication/hooks';
import { getFormattedAddress } from '../common/helperFunctions';
import RadioButtonGroup from '../../components/Inputs/RadioButtonGroup';
import AppLogger from '../../instrumentation/AppLogger';
import { tokenRequest } from '../../authentication/authConfig';
import BlockUISpinner from '../../components/BlockUISpinner';

const getName = prefixedPropertyOf<ReportRecipientStep>('reportRecipient');

function getNameForUse(name: keyof ReportRecipientStep, isSummary: boolean | undefined): string {
    return isSummary ? getName(name) : name;
}

const ReportRecipient = (props: ReportRecipientProps) => {
    const { isSummary, id } = props;
    const { accounts, instance } = useMsal();
    const [isLoading, setIsLoading] = useState(false);
    const [reportRecipientStep, setReportRecipientStep] = useState<ReportRecipientStep | undefined>();
    const [postalAddress, setPostalAddress] = useState<AddressDetailsDto | undefined>();
    const [streetAddress, setStreetAddress] = useState<AddressDetailsDto | undefined>();
    const account = useAccountState();

    useEffect(() => {
        const getAcceptQuotePreInfo = async () => {
            try {
                AppLogger.verbose('ReportRecipient.getAcceptQuotePreInfo', { homeAccountId: account?.details?.homeAccountId });
                const acceptQuoteClient = new AcceptQuoteClient();
                const tokenResult = await instance.acquireTokenSilent({
                    ...tokenRequest,
                    account: accounts[0],
                });
                acceptQuoteClient.setAuthToken(tokenResult.accessToken);

                const reportRecipient = await acceptQuoteClient.getReportRecipient(id!);
                setReportRecipientStep(reportRecipient);

                setStreetAddress(reportRecipient.rfqOrganisation?.streetAddress);

                if (reportRecipient.rfqOrganisation?.postalAddressSameAsStreetAddress) {
                    setPostalAddress(reportRecipient.rfqOrganisation?.streetAddress);
                    return;
                }

                setPostalAddress(reportRecipient.rfqOrganisation?.postalAddress);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                        <p>
                            You may nominate an organisation for the report by filling out the details below.
                        </p>
                        <p>
                            <strong>Note:</strong>
                            {' '}
                            The Measurement report will be addressed to the organisation provided below. The report will be made available only through the Portal and to the organisation submitting the request.
                        </p>
                    </div>
                </Alert>
            )}
            {!isSummary && (
                <Row className='mb-4'>
                    <h2>
                        Report recipient organisation
                    </h2>
                    <TextInput label='Organisation name for report' name={getNameForUse('organisationName', isSummary)} isSummary={isSummary} />
                    <RadioButtonGroup
                        legend='Organisation address for report'
                        name={getNameForUse('reportAddressType', isSummary)}
                        id='q-reportAddressType'
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
                    <HidableField name='businessStreetAddress'>
                        <div className='px-5'>
                            <AddressLookup
                                name={getNameForUse('businessStreetAddress', isSummary)}
                                label='Business street address'
                                maxResults={10}
                                key='businessStreetAddress'
                                placeholder='Start typing the business street address'
                                isSummary={isSummary}
                            />
                        </div>
                    </HidableField>
                </Row>
            )}
            {isSummary && (
                <Row className='mb-4'>
                    <h2 className='h3 my-3'>
                        Report recipient organisation
                    </h2>
                    <TextInput label='Organisation name for report' name={getNameForUse('organisationName', isSummary)} isSummary={isSummary} />
                    {reportRecipientStep?.reportAddressType === 'Other' && (
                        <AddressLookup
                            name={getNameForUse('businessStreetAddress', isSummary)}
                            label='Organisation address for report'
                            maxResults={10}
                            key='businessStreetAddress'
                            placeholder='Start typing the business street address'
                            isSummary={isSummary}
                        />
                    )}
                    {reportRecipientStep?.reportAddressType === 'BusinessAddress' && (
                        <>
                            <div className='form-label mb-0'>Organisation address for report</div>
                            <p>{getFormattedAddress(streetAddress)}</p>
                        </>
                    )}
                    {reportRecipientStep?.reportAddressType === 'PostalAddress' && (
                        <>
                            <div className='form-label mb-0'>Organisation address for report</div>
                            <p>{getFormattedAddress(postalAddress)}</p>
                        </>
                    )}
                </Row>
            )}
        </>
    );
};

export default ReportRecipient;
