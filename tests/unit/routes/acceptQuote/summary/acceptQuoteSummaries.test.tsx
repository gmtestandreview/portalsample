import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  InvoiceSentToValues,
  ReportAddressTypeValues,
  ReturnAddressTypeValues,
  ReturnContactTypeValues,
  ReturnMethodValues,
  Title,
} from '@/api/web-api-client';
import type {
  AddressDetailsDto,
  DeliveryAndReturnStep,
  SummaryAndAcceptStep,
} from '@/api/web-api-client';
import ContactBlockSummary from '@/routes/acceptQuote/summary/ContactBlockSummary';
import DeliveryAndReturnSummary from '@/routes/acceptQuote/summary/DeliveryAndReturnSummary';
import OptionSummary from '@/routes/acceptQuote/summary/OptionSummary';
import PaymentDetailsSummary from '@/routes/acceptQuote/summary/PaymentDetailsSummary';
import ReportRecipientSummary from '@/routes/acceptQuote/summary/ReportRecipientSummary';
import summaryAndAcceptProps from '@/routes/acceptQuote/summaryAndAcceptProps';
import type { AcceptQuoteSummarySectionProps } from '@/routes/acceptQuote/summary/types';
import { defined } from '../../../helpers/defined';

const hidden: AcceptQuoteSummarySectionProps['hidden'] = defined(
  summaryAndAcceptProps('quote-1', [], {} as never, {} as never, [], 'Banner')
    .hidingFields,
);

const street: AddressDetailsDto = {
  line1: '10 Park St',
  suburb: 'Sydney',
  state: 'NSW' as never,
  postcode: '2000',
};
const postal: AddressDetailsDto = {
  line1: '20 Postal Ave',
  suburb: 'Melbourne',
  state: 'VIC' as never,
  postcode: '3000',
};

const contact = {
  title: Title.Dr,
  firstName: 'Riley',
  lastName: 'Chen',
  email: 'riley@example.com',
};

const text = (container: HTMLElement) =>
  container.textContent.replaceAll(/\s+/g, ' ').trim();

describe(OptionSummary, () => {
  const options = [{ label: 'Yes please', value: 'Yes' }];

  it('prints the label of the chosen option', () => {
    expect.hasAssertions();

    const { container } = render(
      <OptionSummary legend='Choice' id='q' value='Yes' options={options} />,
    );

    expect(text(container)).toBe('ChoiceYes please');
  });

  it('prints no details for a value that is not an option', () => {
    expect.hasAssertions();

    const { container } = render(
      <OptionSummary legend='Choice' id='q' value='Maybe' options={options} />,
    );

    expect(text(container)).toBe('ChoiceNo details added');
  });

  it.each([undefined, ''])('renders nothing for the value %j', (value) => {
    expect.hasAssertions();

    const { container } = render(
      <OptionSummary legend='Choice' id='q' value={value} options={options} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe(ContactBlockSummary, () => {
  it('prints no details for a contact that was never added', () => {
    expect.hasAssertions();

    const { container } = render(
      <ContactBlockSummary
        name='c'
        contact={'' as never}
        hideTitleOther={false}
      />,
    );

    expect(text(container)).toBe('No details added');
  });

  it('omits the title row for the empty title the loaded step carries', () => {
    expect.hasAssertions();

    render(
      <ContactBlockSummary
        name='c'
        contact={{ ...contact, title: '' as never }}
        hideTitleOther={false}
      />,
    );

    expect(screen.queryByText('Title (optional)')).not.toBeInTheDocument();
  });

  it('keeps a chosen title and applies label overrides', () => {
    expect.hasAssertions();

    render(
      <ContactBlockSummary
        name='c'
        contact={contact}
        hideTitleOther={false}
        labels={{ firstName: 'First name (optional)' }}
      />,
    );

    expect(screen.getByText('Title (optional)')).toBeInTheDocument();
    expect(screen.getByText('First name (optional)')).toBeInTheDocument();
  });

  it('renders a missing contact as dashes', () => {
    expect.hasAssertions();

    render(
      <ContactBlockSummary
        name='c'
        contact={undefined}
        hideTitleOther={false}
      />,
    );

    expect(screen.getByText('First name')).toBeInTheDocument();
  });
});

describe(ReportRecipientSummary, () => {
  const renderSummary = (
    reportAddressType: ReportAddressTypeValues | undefined,
    values: SummaryAndAcceptStep,
  ) =>
    render(
      <ReportRecipientSummary
        values={values}
        hidden={hidden}
        reportAddressType={reportAddressType}
        streetAddress={street}
        postalAddress={postal}
      />,
    ).container;

  it('prints the custom address for Other', () => {
    expect.hasAssertions();

    const container = renderSummary(ReportAddressTypeValues.Other, {
      reportRecipient: {
        organisationName: 'Acme Labs',
        businessStreetAddress: { ...street, line1: '30 Other Rd' },
      },
    });

    expect(text(container)).toBe(
      'Report recipient organisationOrganisation name for reportAcme LabsOrganisation address for report30 Other Rd, Sydney NSW 2000',
    );
  });

  it('prints a dash when Other has no address yet', () => {
    expect.hasAssertions();

    const container = renderSummary(ReportAddressTypeValues.Other, {
      reportRecipient: { organisationName: 'Acme Labs' },
    });

    expect(text(container)).toContain('Organisation address for report-');
  });

  it('prints the street address for BusinessAddress', () => {
    expect.hasAssertions();

    const container = renderSummary(ReportAddressTypeValues.BusinessAddress, {
      reportRecipient: { organisationName: 'Acme Labs' },
    });

    expect(text(container)).toContain('10 Park St, Sydney NSW 2000');
  });

  it('prints the postal address for PostalAddress', () => {
    expect.hasAssertions();

    const container = renderSummary(ReportAddressTypeValues.PostalAddress, {});

    expect(text(container)).toContain('20 Postal Ave, Melbourne VIC 3000');
  });

  it('prints no address before the address type is known', () => {
    expect.hasAssertions();

    const container = renderSummary(undefined, {});

    expect(text(container)).not.toContain('Organisation address for report');
  });
});

describe(DeliveryAndReturnSummary, () => {
  const step = (
    returnAddressType: ReturnAddressTypeValues | undefined,
    extra: Partial<DeliveryAndReturnStep> = {},
  ): DeliveryAndReturnStep => ({
    returnAddressType,
    returnOrganisationName: 'Return Org',
    returnAddress: { ...street, line1: '30 Other Rd' },
    rfqOrganisation: {
      postalAddressSameAsStreetAddress: false,
      streetAddress: street,
      postalAddress: postal,
    },
    ...extra,
  });

  const renderSummary = (
    values: SummaryAndAcceptStep,
    deliveryAndReturnStep: DeliveryAndReturnStep | undefined,
  ) =>
    render(
      <DeliveryAndReturnSummary
        values={values}
        hidden={hidden}
        deliveryAndReturnStep={deliveryAndReturnStep}
        streetAddress={street}
        postalAddress={postal}
      />,
    ).container;

  const samePerson: SummaryAndAcceptStep = {
    requestForQuote: { contact },
    deliveryAndReturn: {
      returnContactType: ReturnContactTypeValues.SamePerson,
      returnMethod: ReturnMethodValues.ClientToArrange,
    },
  };

  it('shows the requesting contact for the main contact person', () => {
    expect.hasAssertions();

    const container = renderSummary(
      samePerson,
      step(ReturnAddressTypeValues.BusinessAddress),
    );

    expect(text(container)).toContain('First nameRiley');
    expect(text(container)).toContain(
      'Return address10 Park St, Sydney NSW 2000',
    );
    expect(text(container)).toContain('Client to arrange when completed');
  });

  it('shows the different contact instead of the requesting one', () => {
    expect.hasAssertions();

    const container = renderSummary(
      {
        requestForQuote: { contact },
        deliveryAndReturn: {
          returnContactType: ReturnContactTypeValues.DifferentPerson,
          contact: {
            ...contact,
            firstName: 'Sam',
            title: Title.Other,
            titleOther: 'Captain',
          },
        },
      },
      step(ReturnAddressTypeValues.Other),
    );

    expect(text(container)).toContain('Sam');
    expect(text(container)).not.toContain('Riley');
    expect(text(container)).toContain('Captain');
    expect(text(container)).toContain('30 Other Rd, Sydney NSW 2000');
  });

  it('falls back to the street address when the postal address is the same', () => {
    expect.hasAssertions();

    const container = renderSummary(
      samePerson,
      step(ReturnAddressTypeValues.PostalAddress, {
        rfqOrganisation: { postalAddressSameAsStreetAddress: true },
      }),
    );

    expect(text(container)).toContain('10 Park St, Sydney NSW 2000');
  });

  it('uses the postal address for a distinct postal address', () => {
    expect.hasAssertions();

    const container = renderSummary(
      samePerson,
      step(ReturnAddressTypeValues.PostalAddress),
    );

    expect(text(container)).toContain('20 Postal Ave, Melbourne VIC 3000');
  });

  it('prints a dash when no return organisation name was given', () => {
    expect.hasAssertions();

    const container = renderSummary(
      samePerson,
      step(ReturnAddressTypeValues.BusinessAddress, {
        returnOrganisationName: '',
      }),
    );

    expect(text(container)).toContain('Return organisation name (optional)-');
  });

  it('omits the address block when the return address type is unset', () => {
    expect.hasAssertions();

    const container = renderSummary(samePerson, step(undefined));

    expect(text(container)).not.toContain('Instrument/artefact return address');
  });

  it('omits the address block before the step has loaded', () => {
    expect.hasAssertions();

    const container = renderSummary(samePerson, undefined);

    expect(text(container)).not.toContain('Instrument/artefact return address');
  });

  it('omits the address line when the resolved address is missing', () => {
    expect.hasAssertions();

    const container = renderSummary(
      samePerson,
      step(ReturnAddressTypeValues.Other, {
        returnAddress: undefined as never,
      }),
    );

    expect(text(container)).toContain('Instrument/artefact return address');
    expect(text(container)).not.toContain('Return address');
  });
});

describe(PaymentDetailsSummary, () => {
  const renderSummary = (values: SummaryAndAcceptStep) =>
    render(<PaymentDetailsSummary values={values} hidden={hidden} />).container;

  it('shows the requesting contact when the invoice goes to the main person', () => {
    expect.hasAssertions();

    const container = renderSummary({
      requestForQuote: { contact },
      paymentDetails: {
        purchaseOrderNo: 'PO-1',
        invoiceSentTo: InvoiceSentToValues.SamePerson,
      },
    });

    expect(text(container)).toContain('PO-1');
    expect(text(container)).toContain(
      'The main contact person for this request',
    );
    expect(text(container)).toContain('First nameRiley');
  });

  it('shows a different contact with optional labels', () => {
    expect.hasAssertions();

    const container = renderSummary({
      requestForQuote: { contact },
      paymentDetails: {
        invoiceSentTo: InvoiceSentToValues.DifferentPerson,
        contact: { firstName: 'Sam', mobile: '0400111222' },
      },
    });

    expect(text(container)).toContain('A different invoice contact person');
    expect(text(container)).toContain('First name (optional)Sam');
    expect(text(container)).toContain('Business phone (optional)');
    expect(text(container)).toContain('Mobile phone (optional)0400 111 222');
    expect(text(container)).not.toContain('Riley');
  });

  it('prints no details for an invoice contact that was never added', () => {
    expect.hasAssertions();

    const container = renderSummary({
      paymentDetails: {
        invoiceSentTo: InvoiceSentToValues.DifferentPerson,
        contact: '' as never,
      },
    });

    expect(text(container)).toContain('Invoice contact personNo details added');
  });

  it('shows the different-contact block, with dashes, before the invoice recipient is chosen', () => {
    expect.hasAssertions();

    const container = renderSummary({ paymentDetails: {} });

    expect(text(container)).toContain('Invoice contact person');
    expect(text(container)).toContain('First name (optional)-');
  });
});
