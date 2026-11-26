import type React from 'react';
import { Row } from 'react-bootstrap';
import RhfAddressLookup from '../RhfAddressLookup';
import RhfTextInput from '../RhfTextInput';
import RhfNumberInput from '../RhfNumberInput';

interface RhfAuthorisedAgentProps {
  name?: string;
  isSummary?: boolean | undefined;
}

/**
 * React Hook Form counterpart of `AuthorisedAgent`: manufacturer name, company
 * identifier (ABN) and business street address, nested under `name`. The
 * legacy `allowLeadingZeros` prop is not needed here: the ABN uses a pattern
 * format, where that option has no effect.
 */
const RhfAuthorisedAgent: React.FC<RhfAuthorisedAgentProps> = ({
  name = '',
  isSummary,
}) => {
  function getName(localName: string) {
    return name ? `${name}.${localName}` : localName;
  }

  return (
    <Row className='mb-4'>
      <RhfTextInput
        key='manufacturerName'
        name={getName('manufacturerName')}
        label='Manufacturer name'
        isSummary={isSummary}
      />
      {/* TO DO - switch between ABN and international identifier */}
      <RhfNumberInput
        label='Company Identifier'
        name={getName('abn')}
        key={getName('abn')}
        format='## ### ### ###'
        inlineHelp='For Australian manufacturers, enter ABN (Australian Business Number)'
        isSummary={isSummary}
      />
      <h3 className='mb-2'>Business street address</h3>
      {/* TO DO - switch between AUS and international manual entry address */}
      <RhfAddressLookup
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

export default RhfAuthorisedAgent;
