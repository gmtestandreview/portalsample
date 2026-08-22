import { useField } from 'formik';
import { forEach, keys } from 'lodash';
import { Col, Form, Row } from 'react-bootstrap';
import { Title } from '../../../../api/web-api-client';
import type { ContactDto } from '../../../../api/web-api-client';
import { prefixedPropertyOf } from '../../../../utils';
import SelectInput from '../../../Inputs/SelectInput';
import TextInput from '../../../Inputs/TextInput';
import type { SelectInputOption } from '../../../Inputs/SelectInput/types';
import HidableField from '../../HidableField';
import NumberInput from '../../../Inputs/NumberInput';

export interface ContactDetailsProps {
    name: string;
    // containerClassName?: string;
    isSummary?: boolean;
    titleLabel?: string;
    firstNameLabel?: string;
    lastNameLabel?: string;
    roleLabel?: string;
    businessPhoneLabel?: string;
    mobilePhoneLabel?: string;
    emailAddressLabel?: string;
}

const ContactDetailsInput = ({
    name, isSummary, titleLabel, firstNameLabel, lastNameLabel, roleLabel, businessPhoneLabel, mobilePhoneLabel, emailAddressLabel,
}: ContactDetailsProps) => {
    const getName = prefixedPropertyOf<ContactDto>(`${name}`);
    const [_contact] = useField(name);
    const [_title] = useField('organisationAndContact.contact.title');

    const pTitleLabel = titleLabel ?? 'Title (optional)';
    const pFirstNameLabel = firstNameLabel ?? 'First name';
    const pLastNameLabel = lastNameLabel ?? 'Last name';
    const pRoleLabel = roleLabel ?? 'Role (optional)';
    const pBusinessPhoneLabel = businessPhoneLabel ?? 'Business phone';
    const pMobilePhoneLabel = mobilePhoneLabel ?? 'Mobile phone';
    const pEmailAddressLabel = emailAddressLabel ?? 'Email address';

    const getTitles = () => {
        const options: SelectInputOption<string>[] = [];
        forEach(keys(Title), (key) => {
            options.push({ displayText: Title[key as Title].replace(/([A-Z])/g, ' $1').trim(), value: key });
        });
        return options;
    };

    if (isSummary) {
        if (_contact.value === '') {
            return (
                <span>No details added</span>
            );
        }

        return (
            <>
                <SelectInput<string>
                    key={`${getName('title')}`}
                    name={`${getName('title')}`}
                    label={pTitleLabel}
                    options={getTitles()}
                    isSummary={isSummary}
                    addBlank
                />
                { _title.value === ''
                    ? (
                        <TextInput
                            name='titleEmpty'
                            label={pTitleLabel}
                            isSummary={isSummary}
                        />
                    ) : null }
                <HidableField name={`${getName('titleOther')}`}>
                    <TextInput
                        name={`${getName('titleOther')}`}
                        label='Title, if &quot;Other&quot;'
                        isSummary={isSummary}
                    />
                </HidableField>
                <TextInput
                    name={`${getName('firstName')}`}
                    label={pFirstNameLabel}
                    isSummary={isSummary}
                />
                <TextInput
                    name={`${getName('lastName')}`}
                    label={pLastNameLabel}
                    isSummary={isSummary}
                />
                <TextInput
                    name={`${getName('role')}`}
                    label={pRoleLabel}
                    isSummary={isSummary}
                />
                <NumberInput
                    name={`${getName('phone')}`}
                    label={pBusinessPhoneLabel}
                    type='Phone'
                    isSummary={isSummary}
                    format='checkPhoneFormat'
                />
                <NumberInput
                    name={`${getName('mobile')}`}
                    label={pMobilePhoneLabel}
                    type='Mobile'
                    isSummary={isSummary}
                    format='#### ### ###'
                />
                <TextInput
                    name={`${getName('email')}`}
                    label={pEmailAddressLabel}
                    isSummary={isSummary}
                />
            </>
        );
    }

    return (
        <Form.Group>
            <Row>
                <Col md={6}>
                    <SelectInput<string>
                        key={`${getName('title')}`}
                        name={`${getName('title')}`}
                        label={pTitleLabel}
                        options={getTitles()}
                        addBlank
                    />
                </Col>
                <Col md={6}>
                    <HidableField name={`${getName('titleOther')}`}>
                        <TextInput
                            key={`${getName('titleOther')}`}
                            name={`${getName('titleOther')}`}
                            label='If &quot;Other&quot;'
                            placeholder='Please enter title'
                        />
                    </HidableField>
                </Col>
            </Row>

            <Row>
                <Col>
                    <TextInput
                        key={`${getName('firstName')}`}
                        name={`${getName('firstName')}`}
                        label={pFirstNameLabel}
                    />
                </Col>
            </Row>
            <Row>
                <Col>
                    <TextInput
                        key={`${getName('lastName')}`}
                        name={`${getName('lastName')}`}
                        label={pLastNameLabel}
                    />
                </Col>
            </Row>
            <Row>
                <Col>
                    <TextInput
                        key={`${getName('role')}`}
                        name={`${getName('role')}`}
                        label={pRoleLabel}
                    />
                </Col>
            </Row>
            <Row>
                <Col>
                    <NumberInput
                        key={`${getName('phone')}`}
                        name={`${getName('phone')}`}
                        label={pBusinessPhoneLabel}
                        type='Phone'
                        isSummary={isSummary}
                        format='checkPhoneFormat'
                    />
                </Col>
            </Row>
            <Row>
                <Col>
                    <NumberInput
                        name={`${getName('mobile')}`}
                        label={pMobilePhoneLabel}
                        type='Mobile'
                        isSummary={isSummary}
                        format='#### ### ###'
                    />
                </Col>
            </Row>
            <Row>
                <Col>
                    <TextInput
                        key={`${getName('email')}`}
                        name={`${getName('email')}`}
                        label={pEmailAddressLabel}
                    />
                </Col>
            </Row>
        </Form.Group>
    );
};

export default ContactDetailsInput;
