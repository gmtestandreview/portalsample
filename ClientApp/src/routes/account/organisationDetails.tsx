 
import Row from 'react-bootstrap/Row';
import TextInput from '../../components/Inputs/TextInput';
import Checkbox from '../../components/Inputs/Checkbox';
import AddressLookup from '../../components/Inputs/AddressLookup';
import HidableField from '../../components/forms/HidableField';
import NumberInput from '../../components/Inputs/NumberInput';
import OrganisationNameLookup from '../../components/Inputs/OrganisationNameLookup';

const OrganisationDetails = () => (
    <>
        <Row className='mb-4'>
            <h2>Organisation details</h2>
            <TextInput
                label='Entity name'
                name='name'
                readonly
                inlineHelp={(
                    <>
                        Entity name is the name registered for your organisation and may be used for official documents or legal papers.
                        This name may be different to your business name.
                    </>
                )}
            />
            <NumberInput label='ABN' name='abn' format='## ### ### ###' readonly allowLeadingZeros />
            <OrganisationNameLookup
                name='businessOrTradingName'
                label='Business or Trading name (optional)'
                placeholder='Enter the business or trading name'
                inlineHelpTitle='What&apos;s this?'
                inlineHelp={(
                    <>
                        This name can be used to help us identify your organisation when your entity name is not
                        typically used when referring to your organisation.
                        <br />
                        <br />
                        Start typing to enter your Business or Trading name, or select from the drop-down list
                    </>
                )}
                optionsFieldName='tradingName'
                // loading={isLoading}
            />
            <div className='mb-4'>
                <OrganisationNameLookup
                    name='branchOrLocationName'
                    label='Branch or Location name (optional)'
                    placeholder='Enter the branch or location name'
                    inlineHelpTitle='What&apos;s this?'
                    inlineHelp={(
                        <>
                            Branches/locations can be created and may be used to identify and manage physical office branches
                            or business locations within your organisation.
                            <br />
                            E.g. &quot;Engineering Department, ACME Ltd&quot; or &quot;Cyberdyne Robotics, Port Melbourne Office&quot;
                            <br />
                            <br />
                            Start typing to enter your Branch or Location name, or select from the drop-down list
                        </>
                    )}
                    optionsFieldName='branchName'
                />
                <HidableField name='isDefaultOrganisation'>
                    <Checkbox
                        label='Set this Entity, Business, Branch and/or location name as my default'
                        name='isDefaultOrganisation'
                        containerClassName='mb-0'
                    />
                </HidableField>
            </div>
        </Row>
        <Row className='mb-4'>
            <h3 className='mb-2'>Business web address</h3>
            <TextInput
                label='Business website address (optional)'
                name='businessWebsiteAddress'
            />
        </Row>
        <Row className='mb-4'>
            <h3 className='mb-2'>Business street address</h3>
            <AddressLookup
                name='streetAddress'
                label='Address'
                maxResults={10}
                key='streetAddress'
                placeholder='Start typing the main business address'
            />

            <h3 className='mb-2'>Business postal address</h3>
            <Checkbox
                label='Same as street address'
                name='postalAddressSameAsStreetAddress'
            />
            <HidableField name='postalAddress'>
                <AddressLookup
                    name='postalAddress'
                    label='Postal address'
                    maxResults={10}
                    key='postalAddress'
                    placeholder='Start typing the main business postal address'
                />
            </HidableField>
        </Row>
    </>
);

export default OrganisationDetails;
