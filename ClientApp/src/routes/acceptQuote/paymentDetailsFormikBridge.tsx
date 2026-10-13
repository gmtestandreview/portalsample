import { FormProvider } from 'react-hook-form';
import { useFormikRhfBridge } from '../../components/forms/useFormikRhfBridge';
import {
  paymentDetailsSaveValidation,
  paymentDetailsSubmitValidation,
} from './validation';
import PaymentDetailsFormFields, {
  type PaymentDetailsFormValues,
} from './paymentDetailsFormFields';

const bridgedFieldNames = [
  'purchaseOrderNo',
  'invoiceSentTo',
  'contact.title',
  'contact.titleOther',
  'contact.firstName',
  'contact.lastName',
  'contact.role',
  'contact.phone',
  'contact.mobile',
  'contact.email',
] as const;

const isBridgedFieldName = (name: string) =>
  name === 'purchaseOrderNo' ||
  name === 'invoiceSentTo' ||
  name.startsWith('contact.');

interface PaymentDetailsFormikBridgeProps {
  quotationId?: string | undefined;
}

/**
 * Transitional boundary for the migrated payment-details wizard step; see
 * `useFormikRhfBridge` for how the RHF fields stay in sync with Formik.
 */
const PaymentDetailsFormikBridge = ({
  quotationId,
}: Readonly<PaymentDetailsFormikBridgeProps>) => {
  const methods = useFormikRhfBridge<PaymentDetailsFormValues>({
    softSchema: paymentDetailsSaveValidation,
    hardSchema: paymentDetailsSubmitValidation,
    touchPaths: bridgedFieldNames,
    isBridgedName: isBridgedFieldName,
  });

  return (
    <FormProvider {...methods}>
      <PaymentDetailsFormFields quotationId={quotationId} />
    </FormProvider>
  );
};

export default PaymentDetailsFormikBridge;
