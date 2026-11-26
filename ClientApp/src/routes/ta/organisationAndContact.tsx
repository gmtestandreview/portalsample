import Row from 'react-bootstrap/Row';
import { useWatch } from 'react-hook-form';
import type { TAOrganisationAndContactProps } from './types';
import RhfContactDetails from '../../components/forms/CommonForms/RhfContactDetails';
import RhfHidableField from '../../components/forms/RhfHidableField';
import RhfRadioButtonGroup from '../../components/Inputs/RhfRadioButtonGroup';
import RhfAuthorisedAgent from '../../components/Inputs/RhfAuthorisedAgent';
import RhfTextInput from '../../components/Inputs/RhfTextInput';
import RhfAddressLookup from '../../components/Inputs/RhfAddressLookup';

/** Shows one form value as text; re-renders as the value changes. */
const GetFieldValue = ({ fieldName }: Readonly<{ fieldName: string }>) => {
  const value: unknown = useWatch({ name: fieldName });
  return <>{typeof value === 'string' ? value : ''}</>;
};

const OrganisationAndContact = (
  props: Readonly<TAOrganisationAndContactProps>,
) => {
  const { isSummary, name } = props;

  // function getNameForUse(nameForUse: string | keyof DeliveryAndReturnStep): string { return getNameForUse2(nameForUse, isSummary); }

  function getName(localName: string) {
    return name ? `${name}.${localName}` : localName;
  }

  const renderMyContactDetails = () => (
    <>
      <GetFieldValue fieldName={getName('currentContact.title')} />{' '}
      <GetFieldValue fieldName={getName('currentContact.firstName')} />{' '}
      <GetFieldValue fieldName={getName('currentContact.lastName')} />
      <br />
      <GetFieldValue fieldName={getName('currentContact.email')} />
      <br />
    </>
  );

  const renderHelpUseMyContact = () => (
    <>
      To update your contact details go to
      <br />
      Dashboard &gt;
      {'  Settings menu '}
      <i className='icon-settings me-1' />
      &gt;
      {' My contact details '}
    </>
  );

  const renderHelpUseOtherContact = () => (
    <>
      Enter the contact details of another person. Please ensure this person has
      access to the NMI Services portal for the organisation to progress the
      request.
    </>
  );

  const renderHelpUseOtherInvoiceContact = () => (
    <>Enter the contact details of another person.</>
  );

  const renderHelpContact = () => (
    <div className='text-small'>
      For the following options:
      <ul>
        <li className=''>
          Use my contact details
          <br />
          {renderHelpUseMyContact()}
        </li>
        <li>
          A different contact person
          <br />
          {renderHelpUseOtherContact()}
        </li>
      </ul>
    </div>
  );

  return (
    <>
      <Row className={isSummary ? '' : 'mb-4'}>
        <RhfRadioButtonGroup
          legend='Organisation type'
          name={getName('isManufacturer')}
          id='q-isManufacturer'
          containerClassName='mb-1'
          isSummary={isSummary}
          options={[
            {
              label: 'Manufacturer',
              descriptor:
                'I am submitting this application on behalf of my own organisation',
              value: 'Yes',
              id: 'isManufacturer-Yes',
            },
            {
              label: 'Authorised Agent',
              descriptor:
                'I am acting on behalf of another manufacturer as their authorised agent',
              value: 'No',
              id: 'isManufacturer-No',
            },
          ]}
        />
      </Row>
      <Row>
        <RhfHidableField name={getName('isCurrentOrganisationHide')}>
          <RhfTextInput
            label='Organisation name'
            isSummary={isSummary}
            name={getName('name')}
          />
          <RhfAddressLookup
            isSummary={isSummary}
            name={getName('streetAddress')}
            label='Business address'
            maxResults={10}
            key='returnAddress'
            placeholder='Start typing and then select your address from the drop-down list'
          />
        </RhfHidableField>
        <RhfHidableField name={getName('isManufacturerHide')}>
          <RhfAuthorisedAgent
            key='authorisedAgent'
            name={getName('authorisedAgent')}
            isSummary={isSummary}
          />
        </RhfHidableField>
      </Row>
      <Row className='mb-4'>
        <h2 className={isSummary ? 'h3 my-3' : ''}>
          Contact
          {!isSummary ? ' information' : ''}
        </h2>
        <RhfRadioButtonGroup
          legend='Who is the main contact person for this application?'
          name={getName('isPrincipalContact')}
          id='q-isPrincipalContact'
          inlineHelpTitle="What's this?"
          inlineHelp={renderHelpContact()}
          isSummary={isSummary}
          options={[
            {
              label: 'Use my contact details',
              descriptor: (
                <>
                  <span className='body-mini-text'>
                    {renderMyContactDetails()}
                  </span>
                  <span className='body-mini-text' aria-hidden='true'>
                    {renderHelpUseMyContact()}
                  </span>
                </>
              ),
              value: 'Yes',
              id: 'isPrincipalContact-Yes',
            },
            {
              label: 'A different contact person',
              descriptor: (
                <span className='body-mini-text' aria-hidden='true'>
                  {renderHelpUseOtherContact()}
                </span>
              ),
              value: 'No',
              id: 'isPrincipalContact-No',
            },
          ]}
        />
        <RhfHidableField name={getName('principalContactHide')}>
          <RhfContactDetails
            key='contact'
            name={getName('contact')}
            isSummary={isSummary}
          />
        </RhfHidableField>
      </Row>
      <Row>
        <RhfRadioButtonGroup
          legend='Invoice/Account contact person'
          name={getName('isPrincipalInvoiceContact')}
          id='q-isPrincipalInvoiceContact'
          inlineHelpTitle="What's this?"
          inlineHelp={renderHelpContact()}
          isSummary={isSummary}
          options={[
            {
              label: 'Same as main/primary contact',
              descriptor: '',
              value: 'Yes',
              id: 'isPrincipalInvoiceContact-Yes',
            },
            {
              label: 'A different contact person',
              descriptor: (
                <span className='body-mini-text' aria-hidden='true'>
                  {renderHelpUseOtherInvoiceContact()}
                </span>
              ),
              value: 'No',
              id: 'isPrincipalInvoiceContact-No',
            },
          ]}
        />
        <RhfHidableField name={getName('principalInvoiceContactHide')}>
          <RhfContactDetails
            key='invoiceContact'
            name={getName('invoiceContact')}
            isSummary={isSummary}
          />
        </RhfHidableField>
      </Row>
    </>
  );
};

export default OrganisationAndContact;
