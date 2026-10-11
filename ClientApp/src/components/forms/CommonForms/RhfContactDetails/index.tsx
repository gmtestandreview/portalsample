import { forEach, keys } from 'lodash';
import { Col, Form, Row } from 'react-bootstrap';
import { useWatch } from 'react-hook-form';
import { Title } from '../../../../api/web-api-client';
import type { ContactDto } from '../../../../api/web-api-client';
import { prefixedPropertyOf } from '../../../../utils';
import RhfSelectInput from '../../../Inputs/RhfSelectInput';
import RhfTextInput from '../../../Inputs/RhfTextInput';
import RhfNumberInput from '../../../Inputs/RhfNumberInput';
import type { SelectInputOption } from '../../../Inputs/SelectInput/types';
import RhfHidableField from '../../RhfHidableField';
import type { ContactDetailsProps } from '../ContactDetails';

const PHONE_FORMAT = 'checkPhoneFormat';
const MOBILE_FORMAT = '#### ### ###';
// Mirrors the Formik twin, which reads the title from this fixed path.
const TITLE_PATH = 'organisationAndContact.contact.title';

const getTitles = () => {
  const options: SelectInputOption<string>[] = [];
  forEach(keys(Title), (key) => {
    options.push({
      displayText: Title[key as Title].replace(/([A-Z])/g, ' $1').trim(),
      value: key,
    });
  });
  return options;
};

type FieldProps = Readonly<Required<Omit<ContactDetailsProps, 'isSummary'>>>;

const ContactDetailsSummary = ({
  name,
  titleLabel,
  firstNameLabel,
  lastNameLabel,
  roleLabel,
  businessPhoneLabel,
  mobilePhoneLabel,
  emailAddressLabel,
}: FieldProps) => {
  const getName = prefixedPropertyOf<ContactDto>(name);
  const title = useWatch({ name: TITLE_PATH });

  return (
    <>
      <RhfSelectInput<string>
        name={getName('title')}
        label={titleLabel}
        options={getTitles()}
        isSummary
        addBlank
      />
      {title === '' ? (
        <RhfTextInput name='titleEmpty' label={titleLabel} isSummary />
      ) : null}
      <RhfHidableField name={getName('titleOther')}>
        <RhfTextInput
          name={getName('titleOther')}
          label='Title, if "Other"'
          isSummary
        />
      </RhfHidableField>
      <RhfTextInput
        name={getName('firstName')}
        label={firstNameLabel}
        isSummary
      />
      <RhfTextInput
        name={getName('lastName')}
        label={lastNameLabel}
        isSummary
      />
      <RhfTextInput name={getName('role')} label={roleLabel} isSummary />
      <RhfNumberInput
        name={getName('phone')}
        label={businessPhoneLabel}
        isSummary
        format={PHONE_FORMAT}
      />
      <RhfNumberInput
        name={getName('mobile')}
        label={mobilePhoneLabel}
        isSummary
        format={MOBILE_FORMAT}
      />
      <RhfTextInput
        name={getName('email')}
        label={emailAddressLabel}
        isSummary
      />
    </>
  );
};

const ContactDetailsEdit = ({
  name,
  titleLabel,
  firstNameLabel,
  lastNameLabel,
  roleLabel,
  businessPhoneLabel,
  mobilePhoneLabel,
  emailAddressLabel,
}: FieldProps) => {
  const getName = prefixedPropertyOf<ContactDto>(name);

  return (
    <Form.Group>
      <Row>
        <Col md={6}>
          <RhfSelectInput<string>
            name={getName('title')}
            label={titleLabel}
            options={getTitles()}
            addBlank
          />
        </Col>
        <Col md={6}>
          <RhfHidableField name={getName('titleOther')}>
            <RhfTextInput
              name={getName('titleOther')}
              label='If "Other"'
              placeholder='Please enter title'
            />
          </RhfHidableField>
        </Col>
      </Row>
      <Row>
        <Col>
          <RhfTextInput name={getName('firstName')} label={firstNameLabel} />
        </Col>
      </Row>
      <Row>
        <Col>
          <RhfTextInput name={getName('lastName')} label={lastNameLabel} />
        </Col>
      </Row>
      <Row>
        <Col>
          <RhfTextInput name={getName('role')} label={roleLabel} />
        </Col>
      </Row>
      <Row>
        <Col>
          <RhfNumberInput
            name={getName('phone')}
            label={businessPhoneLabel}
            format={PHONE_FORMAT}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <RhfNumberInput
            name={getName('mobile')}
            label={mobilePhoneLabel}
            format={MOBILE_FORMAT}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <RhfTextInput name={getName('email')} label={emailAddressLabel} />
        </Col>
      </Row>
    </Form.Group>
  );
};

/**
 * React Hook Form counterpart of `ContactDetails`. It reads the form through
 * `useWatch` and the RHF inputs, so it must render inside a `FormProvider`
 * (and an `RhfHiddenRulesProvider` for the "Other" title rule).
 */
const RhfContactDetails = ({
  name,
  isSummary,
  titleLabel = 'Title (optional)',
  firstNameLabel = 'First name',
  lastNameLabel = 'Last name',
  roleLabel = 'Role (optional)',
  businessPhoneLabel = 'Business phone',
  mobilePhoneLabel = 'Mobile phone',
  emailAddressLabel = 'Email address',
}: Readonly<ContactDetailsProps>) => {
  const contact = useWatch({ name });
  const fieldProps: FieldProps = {
    name,
    titleLabel,
    firstNameLabel,
    lastNameLabel,
    roleLabel,
    businessPhoneLabel,
    mobilePhoneLabel,
    emailAddressLabel,
  };

  if (!isSummary) return <ContactDetailsEdit {...fieldProps} />;
  if (contact === '') return <span>No details added</span>;
  return <ContactDetailsSummary {...fieldProps} />;
};

export default RhfContactDetails;
