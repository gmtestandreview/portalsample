import React, { useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import { useMsal } from '@azure/msal-react';
import InTextLink from '../../components/InTextLink';
import { LookupClient } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import { isEmptyGuid, isValidGUID } from '../common/helperFunctions';
import BlockUISpinner from '../../components/BlockUISpinner';

// Define enums for instrument categories and types
export enum InstrumentCategory {
    Category1 = 'Area Measurement',
    Category2 = 'Flow Measurement',
    Category3 = 'category3',
    Category4 = 'category4',
}

export enum InstrumentType {
    Type1 = 'Water calibration',
    Type2 = 'type2',
    Type3 = 'type3',
}

interface InstrumentInfoPanelProps {
    name: string;
    selectedInstrumentCategoryId?: string | undefined;
    selectedInstrumentTypeId ?: string | undefined;
    isNewCustomer?: boolean | undefined;
}

const InstrumentInfoPanel: React.FC<InstrumentInfoPanelProps> = ({
    name,
    selectedInstrumentCategoryId = undefined,
    selectedInstrumentTypeId = undefined,
    isNewCustomer = true,
}) => {
    const { accounts, instance } = useMsal();
    const [resourceLinks, setResourceLinks] = React.useState<string | undefined>(undefined);
    const [resourceText, setResourceText] = React.useState<string | undefined>(undefined);
    const [isDataLoading, setIsDataLoading] = React.useState<boolean>(false);

    useEffect(() => {
        const setAuthTokenAsync = async () => {
            setIsDataLoading(true);
            const client = new LookupClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            client.setAuthToken(tokenResult.accessToken);
            const infoPanelContent = await client.getInfoPanelContent(selectedInstrumentTypeId, selectedInstrumentCategoryId);
            setResourceLinks(infoPanelContent[0].requirementsLink);
            setResourceText(infoPanelContent[0].requirements);
            setIsDataLoading(false);
        };

        if (isValidGUID(selectedInstrumentCategoryId)
            && isValidGUID(selectedInstrumentTypeId)
            && !isEmptyGuid(selectedInstrumentCategoryId)
            && !isEmptyGuid(selectedInstrumentTypeId)) {
            setAuthTokenAsync();
        }
    }, [
        accounts,
        instance,
        selectedInstrumentCategoryId,
        selectedInstrumentTypeId,
    ]);

    const infoContent = () => (
        <ul>
            <li>
                <InTextLink href={resourceLinks} target='_blank'>
                    { resourceText }
                    <span className='visually-hidden'> Opens in a new tab</span>
                </InTextLink>
            </li>
        </ul>
    );

    const newCustomerContent = (
        <div className='py-3 px-4 bg-white'>
            <p className='mb-0'>
                <InTextLink
                    href='https://www.industry.gov.au/sites/default/files/2025-07/NMI-credit-application-form.pdf'
                    target='_blank'
                    download
                >
                    Download credit check application form
                    <span className='visually-hidden'> Opens in a new tab</span>
                </InTextLink>
                <br />
                162KB PDF
            </p>
        </div>
    );

    const defaultInfoContent = (
        <p>
            <strong>Note:</strong>
            {' Select an instrument category and type to see more details.'}
        </p>
    );

    const infoContentText = (resourceText && resourceLinks) ? infoContent() : defaultInfoContent;

    if (isDataLoading) {
        return (
            <BlockUISpinner partial>
                <p>Loading data...</p>
            </BlockUISpinner>
        );
    }

    // `a || (a && b)` is just `a`: when the category is absent the second operand is false too,
    // so it could never change the outcome and its branch was unreachable.
    if (selectedInstrumentCategoryId) {
        return (
            <Alert id={`${name}-panel`} variant='info' className='d-flex' role='alert' aria-live='polite'>
                <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
                    <div className='bgCircle me-3'>
                        <i className='icon-info' aria-hidden='true' />
                    </div>
                </div>
                <div className='w-100'>
                    <p className='mb-0'><strong>References for this instrument type</strong></p>
                    <p className='mb-3'>
                        Use these resources to help prepare your application.
                    </p>
                    <p className='mb-0'>
                        <strong>Reference (do not upload):</strong>
                    </p>

                    {infoContentText}

                    <p className='mb-0'>
                        <strong>Upload examples:</strong>
                    </p>
                    <ul>
                        <li>Technical specification documents</li>
                        <li>Product brochures</li>
                        <li>User manuals</li>
                    </ul>
                    {isNewCustomer && (
                        newCustomerContent
                    )}
                </div>
            </Alert>
        );
    }
    return (
        <p className='visually-hidden'>There are no References for this instrument type.</p>
    );
};

export default InstrumentInfoPanel;
