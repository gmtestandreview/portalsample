import { get } from 'lodash';
import { useEffect, useMemo, useRef } from 'react';
import { useFormikContext } from 'formik';
import { FormProvider, useForm } from 'react-hook-form';
import { createSaveAwareYupResolver } from '../../components/forms/FormikForm/saveAwareYupResolver';
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
 * Transitional boundary for the one migrated wizard step.
 *
 * WizardRoutedStep still owns a Formik form and submit pipeline. The fields in
 * this step are RHF-native, so edits are mirrored into the outer Formik values
 * while Formik remains authoritative for routing, hidden-field stripping,
 * save-and-exit, and the unsaved-change prompt.
 */
const PaymentDetailsFormikBridge = ({
  quotationId,
}: Readonly<PaymentDetailsFormikBridgeProps>) => {
  const {
    initialValues,
    values: outerValues,
    setFieldValue,
    submitCount,
  } = useFormikContext<PaymentDetailsFormValues>();
  const resolver = useMemo(
    () =>
      createSaveAwareYupResolver<PaymentDetailsFormValues>(
        paymentDetailsSaveValidation,
        paymentDetailsSubmitValidation
      ),
    []
  );
  const methods = useForm<PaymentDetailsFormValues>({
    defaultValues: initialValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver,
  });
  const previousSubmitCount = useRef(submitCount);
  const { getValues, reset, setValue, trigger, watch } = methods;

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    const subscription = watch((formValues, { name }) => {
      if (name && isBridgedFieldName(name)) {
        void setFieldValue(name, get(formValues, name), false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setFieldValue, watch]);

  useEffect(() => {
    if (submitCount <= previousSubmitCount.current) {
      previousSubmitCount.current = submitCount;
      return;
    }

    previousSubmitCount.current = submitCount;
    setValue('saveAndExit', outerValues.saveAndExit, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
    bridgedFieldNames.forEach((name) => {
      setValue(name, getValues(name), {
        shouldDirty: false,
        shouldTouch: true,
        shouldValidate: false,
      });
    });
    void trigger();
  }, [getValues, outerValues.saveAndExit, setValue, submitCount, trigger]);

  return (
    <FormProvider {...methods}>
      <PaymentDetailsFormFields quotationId={quotationId} />
    </FormProvider>
  );
};

export default PaymentDetailsFormikBridge;
