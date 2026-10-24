import { useField } from 'formik';
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
  isSummary?: boolean | undefined;
  titleLabel?: string;
  firstNameLabel?: string;
  lastNameLabel?: string;
  roleLabel?: string;
  businessPhoneLabel?: string;
  mobilePhoneLabel?: string;
  emailAddressLabel?: string;
}

interface ContactDetailsLabels {
  title: string;
  firstName: string;
  lastName: string;
  role: string;
  businessPhone: string;
  mobilePhone: string;
  email: string;
}

const getTitles = (): SelectInputOption<string>[] => {
  const options: SelectInputOption<string>[] = [];
  for (const key of Object.keys(Title)) {
    options.push({
      displayText: Title[key as Title].replace(/([A-Z])/g, ' $1').trim(),
      value: key,
    });
  }
  return options;
};

interface ContactDetailsSummaryViewProps {
  getName: (name: keyof ContactDto) => string;
  titleFieldValue: string;
  labels: ContactDetailsLabels;
}

const ContactDetailsSummaryView = ({
  getName,
  titleFieldValue,
  labels,
}: Readonly<ContactDetailsSummaryViewProps>) => (
  <>
    <SelectInput<string>
      key={`${getName('title')}`}
      name={`${getName('title')}`}
      label={labels.title}
      options={getTitles()}
      isSummary
      addBlank
    />
    {titleFieldValue === '' ? (
      <TextInput name='titleEmpty' label={labels.title} isSummary />
    ) : null}
    <HidableField name={`${getName('titleOther')}`}>
      <TextInput
        name={`${getName('titleOther')}`}
        label='Title, if "Other"'
        isSummary
      />
    </HidableField>
    <TextInput
      name={`${getName('firstName')}`}
      label={labels.firstName}
      isSummary
    />
    <TextInput
      name={`${getName('lastName')}`}
      label={labels.lastName}
      isSummary
    />
    <TextInput name={`${getName('role')}`} label={labels.role} isSummary />
    <NumberInput
      name={`${getName('phone')}`}
      label={labels.businessPhone}
      type='Phone'
      isSummary
      format='checkPhoneFormat'
    />
    <NumberInput
      name={`${getName('mobile')}`}
      label={labels.mobilePhone}
      type='Mobile'
      isSummary
      format='#### ### ###'
    />
    <TextInput name={`${getName('email')}`} label={labels.email} isSummary />
  </>
);

interface ContactDetailsEditViewProps {
  getName: (name: keyof ContactDto) => string;
  labels: ContactDetailsLabels;
}

const ContactDetailsEditView = ({
  getName,
  labels,
}: Readonly<ContactDetailsEditViewProps>) => (
  <Form.Group>
    <Row>
      <Col md={6}>
        <SelectInput<string>
          key={`${getName('title')}`}
          name={`${getName('title')}`}
          label={labels.title}
          options={getTitles()}
          addBlank
        />
      </Col>
      <Col md={6}>
        <HidableField name={`${getName('titleOther')}`}>
          <TextInput
            key={`${getName('titleOther')}`}
            name={`${getName('titleOther')}`}
            label='If "Other"'
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
          label={labels.firstName}
        />
      </Col>
    </Row>
    <Row>
      <Col>
        <TextInput
          key={`${getName('lastName')}`}
          name={`${getName('lastName')}`}
          label={labels.lastName}
        />
      </Col>
    </Row>
    <Row>
      <Col>
        <TextInput
          key={`${getName('role')}`}
          name={`${getName('role')}`}
          label={labels.role}
        />
      </Col>
    </Row>
    <Row>
      <Col>
        <NumberInput
          key={`${getName('phone')}`}
          name={`${getName('phone')}`}
          label={labels.businessPhone}
          type='Phone'
          format='checkPhoneFormat'
        />
      </Col>
    </Row>
    <Row>
      <Col>
        <NumberInput
          name={`${getName('mobile')}`}
          label={labels.mobilePhone}
          type='Mobile'
          format='#### ### ###'
        />
      </Col>
    </Row>
    <Row>
      <Col>
        <TextInput
          key={`${getName('email')}`}
          name={`${getName('email')}`}
          label={labels.email}
        />
      </Col>
    </Row>
  </Form.Group>
);

const ContactDetailsInput = ({
  name,
  isSummary,
  titleLabel,
  firstNameLabel,
  lastNameLabel,
  roleLabel,
  businessPhoneLabel,
  mobilePhoneLabel,
  emailAddressLabel,
}: Readonly<ContactDetailsProps>) => {
  const getName = prefixedPropertyOf<ContactDto>(`${name}`);
  const [_contact] = useField(name);
  const [_title] = useField('organisationAndContact.contact.title');

  const labels: ContactDetailsLabels = {
    title: titleLabel ?? 'Title (optional)',
    firstName: firstNameLabel ?? 'First name',
    lastName: lastNameLabel ?? 'Last name',
    role: roleLabel ?? 'Role (optional)',
    businessPhone: businessPhoneLabel ?? 'Business phone',
    mobilePhone: mobilePhoneLabel ?? 'Mobile phone',
    email: emailAddressLabel ?? 'Email address',
  };

  if (isSummary) {
    if (_contact.value === '') {
      return <span>No details added</span>;
    }
    return (
      <ContactDetailsSummaryView
        getName={getName}
        titleFieldValue={_title.value as string}
        labels={labels}
      />
    );
  }

  return <ContactDetailsEditView getName={getName} labels={labels} />;
};

export default ContactDetailsInput;
