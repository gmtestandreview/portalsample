import Row from 'react-bootstrap/Row';
import { useField } from 'formik';
import type { TAOrganisationAndContactProps } from './types';
import ContactDetailsInput from '../../components/forms/CommonForms/ContactDetails';
import HidableField from '../../components/forms/HidableField';
import RadioButtonGroup from '../../components/Inputs/RadioButtonGroup';
import AuthorisedAgent from '../../components/Inputs/AuthorisedAgent';
import TextInput from '../../components/Inputs/TextInput';
import AddressLookup from '../../components/Inputs/AddressLookup';

const GetFieldValue = ({ fieldName }: { fieldName: string }) => {
    const [_field] = useField(fieldName);
    return (
        <>
            {_field.value}
        </>
    );
};

/* const GetFieldValueString = ({ fieldName }: { fieldName: string }) => {
    const [_field] = useField(fieldName);
    return _field.value;
}; */

const OrganisationAndContact = (props: TAOrganisationAndContactProps) => {
    const { isSummary, name } = props;

    // function getNameForUse(nameForUse: string | keyof DeliveryAndReturnStep): string { return getNameForUse2(nameForUse, isSummary); }

    function getName(localName: string) {
        return name ? `${name}.${localName}` : localName;
    }

    const renderMyContactDetails = () => (
        <>
            <GetFieldValue fieldName={getName('currentContact.title')} />
            {' '}
            <GetFieldValue fieldName={getName('currentContact.firstName')} />
            {' '}
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
            Enter the contact details of another person. Please ensure this person has access to the NMI Services portal
            for the organisation to progress the request.
        </>
    );

    const renderHelpUseOtherInvoiceContact = () => (
        <>
            Enter the contact details of another person.
        </>
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
                <RadioButtonGroup
                    legend='Organisation type'
                    name={getName('isManufacturer')}
                    id='q-isManufacturer'
                    containerClassName='mb-1'
                    isSummary={isSummary}
                    options={[
                        {
                            label: 'Manufacturer',
                            descriptor: 'I am submitting this application on behalf of my own organisation',
                            value: 'Yes',
                            id: 'isManufacturer-Yes',
                        },
                        {
                            label: 'Authorised Agent',
                            descriptor: 'I am acting on behalf of another manufacturer as their authorised agent',
                            value: 'No',
                            id: 'isManufacturer-No',
                        },
                    ]}
                />
            </Row>
            <Row>
                <HidableField name={getName('isCurrentOrganisationHide')}>
                    <TextInput label='Organisation name' isSummary={isSummary} name={getName('name')} />
                    <AddressLookup
                        isSummary={isSummary}
                        name={getName('streetAddress')}
                        label='Business address'
                        maxResults={10}
                        key='returnAddress'
                        placeholder='Start typing and then select your address from the drop-down list'
                    />
                </HidableField>
                <HidableField name={getName('isManufacturerHide')}>
                    <AuthorisedAgent key='authorisedAgent' name={getName('authorisedAgent')} isSummary={isSummary} />
                </HidableField>
            </Row>
            <Row className='mb-4'>
                <h2 className={isSummary ? 'h3 my-3' : ''}>
                    Contact
                    { !isSummary ? ' information' : '' }
                </h2>
                <RadioButtonGroup
                    legend='Who is the main contact person for this application?'
                    name={getName('isPrincipalContact')}
                    id='q-isPrincipalContact'
                    inlineHelpTitle='What&apos;s this?'
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
                        }]}
                />
                <HidableField name={getName('principalContactHide')}>
                    <ContactDetailsInput
                        key='contact'
                        name={getName('contact')}
                        isSummary={isSummary}
                    />
                </HidableField>
            </Row>
            <Row>
                <RadioButtonGroup
                    legend='Invoice/Account contact person'
                    name={getName('isPrincipalInvoiceContact')}
                    id='q-isPrincipalInvoiceContact'
                    inlineHelpTitle='What&apos;s this?'
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
                        }]}
                />
                <HidableField name={getName('principalInvoiceContactHide')}>
                    <ContactDetailsInput
                        key='invoiceContact'
                        name={getName('invoiceContact')}
                        isSummary={isSummary}
                    />
                </HidableField>
            </Row>
        </>
    );
};

export default OrganisationAndContact;
