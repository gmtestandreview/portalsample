import { trim } from 'lodash';
import type { ReactNode } from 'react';
import { Col, Form, Row } from 'react-bootstrap';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import {
  InvoiceSentToValues,
  Title,
  type PaymentDetailsStep,
} from '../../api/web-api-client';
import { PatternFormatFixed } from '../../components/Inputs/NumberInput/types';
import { getPhoneNumberFormat } from '../../components/Inputs/NumberInput/phoneFormat';

export type PaymentDetailsFormValues = PaymentDetailsStep & {
  saveAndExit?: boolean;
};

interface TextFieldProps {
  name:
    | 'purchaseOrderNo'
    | 'contact.titleOther'
    | 'contact.firstName'
    | 'contact.lastName'
    | 'contact.role'
    | 'contact.email';
  label: string;
  placeholder?: string;
  inlineHelp?: ReactNode;
}

const RhfTextField = ({
  name,
  label,
  placeholder,
  inlineHelp,
}: Readonly<TextFieldProps>) => {
  const { control } = useFormContext<PaymentDetailsFormValues>();
  const { field, fieldState } = useController({ control, name });
  const helpId = inlineHelp ? `help-${name}` : undefined;
  const validationMessageId = `${name}-validation-msg`;
  const showError = fieldState.isTouched && fieldState.error?.message;

  return (
    <Form.Group className='form-field-container' controlId={name}>
      <Form.Label>{label}</Form.Label>
      {inlineHelp && (
        <Form.Text as='p' id={helpId} className='contextual-help'>
          {inlineHelp}
        </Form.Text>
      )}
      <Form.Control
        {...field}
        className='form-field form-text-input'
        value={field.value ?? ''}
        placeholder={placeholder}
        isInvalid={!!showError}
        aria-describedby={showError ? validationMessageId : helpId}
        onBlur={() => {
          field.onChange(trim(field.value ?? ''));
          field.onBlur();
        }}
      />
      {showError && (
        <Form.Control.Feedback
          type='invalid'
          id={validationMessageId}
          className='form-validation-message'
        >
          {fieldState.error?.message}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  );
};

const invoiceOptions = [
  {
    label: 'The main contact person for this request',
    value: InvoiceSentToValues.SamePerson,
    id: 'invoiceSentTo-SamePerson',
  },
  {
    label: 'A different invoice contact person',
    value: InvoiceSentToValues.DifferentPerson,
    id: 'invoiceSentTo-DifferentPerson',
  },
];

const RhfInvoiceContactChoice = () => {
  const { control } = useFormContext<PaymentDetailsFormValues>();
  const { field } = useController({
    control,
    name: 'invoiceSentTo',
  });

  return (
    <fieldset>
      <legend id='q-invoiceSentTo'>
        The invoice will be sent to the following contact
      </legend>
      <Form.Group
        id='invoiceSentTo'
        className='form-field-container'
        tabIndex={-1}
      >
        {invoiceOptions.map((option) => (
          <div className='radio-button' key={option.value}>
            <input
              ref={field.ref}
              name={field.name}
              type='radio'
              id={option.id}
              value={option.value}
              checked={field.value === option.value}
              onChange={() => field.onChange(option.value)}
              onBlur={field.onBlur}
            />
            <label
              htmlFor={option.id}
              data-testid={option.id}
              className='form-field'
            >
              {option.label}
            </label>
          </div>
        ))}
      </Form.Group>
    </fieldset>
  );
};

const titleOptions = Object.values(Title).map((value) => ({
  value,
  displayText: value.replace(/([A-Z])/g, ' $1').trim(),
}));

const RhfTitleField = () => {
  const { control } = useFormContext<PaymentDetailsFormValues>();
  const { field, fieldState } = useController({
    control,
    name: 'contact.title',
  });
  const validationMessageId = 'contact.title-validation-msg';
  const showError = fieldState.isTouched && fieldState.error?.message;

  return (
    <Form.Group controlId='contact.title' className='form-field-container'>
      <Form.Label>Title (optional)</Form.Label>
      <div className='d-grid gap-2'>
        <Form.Control
          {...field}
          as='select'
          value={field.value ?? ''}
          className='form-field form-select'
          isInvalid={!!showError}
          aria-describedby={showError ? validationMessageId : undefined}
        >
          <option value=''>Please select</option>
          {titleOptions.map((option) => (
            <option value={option.value} key={option.value}>
              {option.displayText}
            </option>
          ))}
        </Form.Control>
        {showError && (
          <Form.Control.Feedback type='invalid' id={validationMessageId}>
            {fieldState.error?.message}
          </Form.Control.Feedback>
        )}
      </div>
    </Form.Group>
  );
};

interface PhoneFieldProps {
  name: 'contact.phone' | 'contact.mobile';
  label: string;
  format: string | ((value: string | null | undefined) => string);
}

const RhfPhoneField = ({ name, label, format }: Readonly<PhoneFieldProps>) => {
  const { control } = useFormContext<PaymentDetailsFormValues>();
  const { field, fieldState } = useController({ control, name });
  const validationMessageId = `${name}-validation-msg`;
  const showError = fieldState.isTouched && fieldState.error?.message;
  const resolvedFormat =
    typeof format === 'function' ? format(field.value) : format;
  const { ref, ...fieldProps } = field;

  return (
    <Form.Group className='form-field-container' controlId={name}>
      <Form.Label>{label}</Form.Label>
      <PatternFormatFixed
        {...fieldProps}
        getInputRef={ref}
        customInput={Form.Control}
        type='text'
        className='form-field form-text-input mb-0'
        value={field.value ?? ''}
        format={resolvedFormat}
        isInvalid={!!showError}
        aria-describedby={showError ? validationMessageId : undefined}
      />
      {showError && (
        <Form.Control.Feedback
          type='invalid'
          id={validationMessageId}
          className='form-validation-message'
        >
          {fieldState.error?.message}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  );
};

const RhfInvoiceContact = () => {
  const { control } = useFormContext<PaymentDetailsFormValues>();
  const selectedTitle = useWatch({ control, name: 'contact.title' });

  return (
    <Form.Group>
      <Row>
        <Col md={6}>
          <RhfTitleField />
        </Col>
        <Col md={6}>
          {selectedTitle === Title.Other && (
            <RhfTextField
              name='contact.titleOther'
              label='If "Other"'
              placeholder='Please enter title'
            />
          )}
        </Col>
      </Row>
      <Row>
        <Col>
          <RhfTextField
            name='contact.firstName'
            label='First name (optional)'
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <RhfTextField name='contact.lastName' label='Last name (optional)' />
        </Col>
      </Row>
      <Row>
        <Col>
          <RhfTextField name='contact.role' label='Role (optional)' />
        </Col>
      </Row>
      <Row>
        <Col>
          <RhfPhoneField
            name='contact.phone'
            label='Business phone (optional)'
            format={getPhoneNumberFormat}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <RhfPhoneField
            name='contact.mobile'
            label='Mobile phone (optional)'
            format='#### ### ###'
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <RhfTextField name='contact.email' label='Email address' />
        </Col>
      </Row>
    </Form.Group>
  );
};

interface PaymentDetailsFormFieldsProps {
  quotationId?: string | undefined;
}

const PaymentDetailsFormFields = ({
  quotationId,
}: Readonly<PaymentDetailsFormFieldsProps>) => {
  const { control } = useFormContext<PaymentDetailsFormValues>();
  const invoiceSentTo = useWatch({ control, name: 'invoiceSentTo' });

  return (
    <>
      <Row className='mb-4'>
        <RhfTextField
          label='Purchase Order (PO) number (optional)'
          name='purchaseOrderNo'
          placeholder='Enter purchase order number'
          inlineHelp={
            <>
              Purchase order can be provided at a later date.
              <span className='d-block pt-1'>
                Your NMI Quotation ID{quotationId && ` ${quotationId}`}
              </span>
            </>
          }
        />
        <RhfInvoiceContactChoice />
      </Row>
      {invoiceSentTo !== InvoiceSentToValues.SamePerson && (
        <Row className='mb-4'>
          <h2>Invoice contact person</h2>
          <RhfInvoiceContact />
        </Row>
      )}
    </>
  );
};

export default PaymentDetailsFormFields;
