import type React from 'react';
import { Row } from 'react-bootstrap';
import AddressLookup from '../AddressLookup';
import TextInput from '../TextInput';
import NumberInput from '../NumberInput';

interface AuthorisedAgentProps {
    name?: string;
    isSummary?: boolean;
}

const AuthorisedAgent: React.FC<AuthorisedAgentProps> = ({ name = '', isSummary }) => {
    function getName(localName: string) {
        return name ? `${name}.${localName}` : localName;
    }

    return (
        <Row className='mb-4'>
            <TextInput
                key='manufacturerName'
                name={getName('manufacturerName')}
                label='Manufacturer name'
                isSummary={isSummary}
            />
            {/* TO DO - switch between ABN and international identifier */}
            {/* ABN */}
            <NumberInput
                label='Company Identifier'
                name={getName('abn')}
                key={getName('abn')}
                format='## ### ### ###'
                allowLeadingZeros
                inlineHelp='For Australian manufacturers, enter ABN (Australian Business Number)'
                isSummary={isSummary}
            />
            {/* Or international */}
            {/* <TextInput
                key='companyIdentifier'
                name={getName('companyIdentifier')}
                label='Company Identifier'
                inlineHelp='For international manufacturers use a local company registration number'
                isSummary={isSummary}
            /> */}
            <h3 className='mb-2'>Business street address</h3>
            {/* TO DO - switch between AUS and international manual entry address */}
            <AddressLookup
                name={getName('streetAddress')}
                label='Address'
                maxResults={10}
                key='streetAddress'
                placeholder='Enter the main business address'
                isSummary={isSummary}
            />
        </Row>
    );
};

export default AuthorisedAgent;
