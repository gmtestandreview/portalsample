import Row from 'react-bootstrap/Row';
import SummaryDisplay from '../../../components/SummaryDisplay';
import ContactBlockSummary from './ContactBlockSummary';
import OptionSummary from './OptionSummary';
import { isSummaryFieldHidden } from './types';
import type { AcceptQuoteSummarySectionProps } from './types';

const INVOICE_SENT_TO_OPTIONS = [
  { label: 'The main contact person for this request', value: 'SamePerson' },
  { label: 'A different invoice contact person', value: 'DifferentPerson' },
];

const OPTIONAL_CONTACT_LABELS = {
  firstName: 'First name (optional)',
  lastName: 'Last name (optional)',
  phone: 'Business phone (optional)',
  mobile: 'Mobile phone (optional)',
};

/**
 * Read-only payment section. Form-free twin of `PaymentDetails` in summary
 * mode.
 */
const PaymentDetailsSummary = (
  props: Readonly<AcceptQuoteSummarySectionProps>,
) => {
  const { values } = props;
  const payment = values.paymentDetails;

  return (
    <>
      <Row className='mb-4'>
        <SummaryDisplay
          label='Purchase Order (PO) number (optional)'
          id='paymentDetails.purchaseOrderNo'
          as='p'
          value={payment?.purchaseOrderNo}
        />
        <OptionSummary
          legend='The invoice will be sent to the following contact'
          id='q-invoiceSentTo'
          value={payment?.invoiceSentTo}
          options={INVOICE_SENT_TO_OPTIONS}
        />
      </Row>
      {!isSummaryFieldHidden(props, 'paymentDetails.rfqHide') && (
        <Row className='mb-4'>
          <h2 className='h4 my-3'>Invoice contact person</h2>
          <ContactBlockSummary
            name='requestForQuote.contact'
            contact={values.requestForQuote?.contact}
            hideTitleOther={isSummaryFieldHidden(
              props,
              'requestForQuote.contact.titleOther',
            )}
          />
        </Row>
      )}
      {!isSummaryFieldHidden(props, 'paymentDetails.contactHide') && (
        <Row className='mb-4'>
          <h2 className='h4 my-3'>Invoice contact person</h2>
          <ContactBlockSummary
            name='paymentDetails.contact'
            contact={payment?.contact}
            hideTitleOther={isSummaryFieldHidden(
              props,
              'paymentDetails.contact.titleOther',
            )}
            labels={OPTIONAL_CONTACT_LABELS}
          />
        </Row>
      )}
    </>
  );
};

export default PaymentDetailsSummary;
