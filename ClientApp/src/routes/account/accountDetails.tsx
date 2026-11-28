import Row from 'react-bootstrap/Row';
import RhfTextInput from '../../components/Inputs/RhfTextInput';
import RhfCheckbox from '../../components/Inputs/RhfCheckbox';
import RhfAddressLookup from '../../components/Inputs/RhfAddressLookup';
import RhfHidableField from '../../components/forms/RhfHidableField';
import RhfNumberInput from '../../components/Inputs/RhfNumberInput';
import RhfOrganisationNameLookup from '../../components/Inputs/RhfOrganisationNameLookup';

const AccountDetails = () => (
  <>
    <Row className='mb-4'>
      <h2>Organisation details</h2>
      <RhfTextInput
        label='Entity name'
        name='name'
        readonly
        inlineHelp={
          <>
            Entity name is the name registered for your organisation and may be
            used for official documents or legal papers. This name may be
            different to your business name.
          </>
        }
      />
      <RhfNumberInput label='ABN' name='abn' format='## ### ### ###' readonly />
      <RhfOrganisationNameLookup
        name='businessOrTradingName'
        label='Business or Trading name (optional)'
        placeholder='Enter the business or trading name'
        inlineHelpTitle="What's this?"
        inlineHelp={
          <>
            This name can be used to help us identify your organisation when
            your entity name is not typically used when referring to your
            organisation.
            <br />
            <br />
            Start typing to enter your Business or Trading name, or select from
            the drop-down list
          </>
        }
        optionsFieldName='tradingName'
        // loading={isLoading}
      />
      <div className='mb-4'>
        <RhfOrganisationNameLookup
          name='branchOrLocationName'
          label='Branch or Location name (optional)'
          placeholder='Enter the branch or location name'
          inlineHelpTitle="What's this?"
          inlineHelp={
            <>
              Branches/locations can be created and may be used to identify and
              manage physical office branches or business locations within your
              organisation.
              <br />
              E.g. &quot;Engineering Department, ACME Ltd&quot; or
              &quot;Cyberdyne Robotics, Port Melbourne Office&quot;
              <br />
              <br />
              Start typing to enter your Branch or Location name, or select from
              the drop-down list
            </>
          }
          optionsFieldName='branchName'
        />
        <RhfHidableField name='isDefaultOrganisation'>
          <RhfCheckbox
            label='Set this Entity, Business, Branch and/or location name as my default'
            name='isDefaultOrganisation'
            containerClassName='mb-0'
          />
        </RhfHidableField>
      </div>
    </Row>
    <Row className='mb-4'>
      <h3 className='mb-2'>Business web address</h3>
      <RhfTextInput
        label='Business website address (optional)'
        name='businessWebsiteAddress'
      />
    </Row>
    <Row className='mb-4'>
      <h3 className='mb-2'>Business street address</h3>
      <RhfAddressLookup
        name='streetAddress'
        label='Address'
        maxResults={10}
        key='streetAddress'
        placeholder='Enter the main business address'
      />

      <h3 className='mb-2'>Business postal address</h3>
      <RhfCheckbox
        label='Same as street address'
        name='postalAddressSameAsStreetAddress'
      />
      <RhfHidableField name='postalAddress'>
        <RhfAddressLookup
          name='postalAddress'
          label='Postal address'
          maxResults={10}
          key='postalAddress'
          placeholder='Enter the main business postal address'
        />
      </RhfHidableField>
    </Row>
    {/*         <Row className='mb-4'>
            <h2>Organisation contact details</h2>
            <h3 className='mb-2'>Contact</h3>
            <p className='mb-4'>The contact is the default contact information for all new requests</p>
            <ContactDetailsInput
                name='contact'
            />
        </Row> */}
  </>
);

export default AccountDetails;
