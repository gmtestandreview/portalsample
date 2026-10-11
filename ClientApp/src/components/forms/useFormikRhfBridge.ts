import { get } from 'lodash';
import { useEffect, useMemo, useRef } from 'react';
import { useFormikContext } from 'formik';
import { useForm } from 'react-hook-form';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { createSaveAwareYupResolver } from './saveAwareYupResolver';
import type { ValidationSchema } from './types';

type BridgedValues = FieldValues & { saveAndExit?: boolean };

interface UseFormikRhfBridgeOptions<TValues extends BridgedValues> {
  /** Schema applied when the outer form is saving and exiting. */
  softSchema: ValidationSchema | undefined;
  /** Schema applied to a normal submit. */
  hardSchema: ValidationSchema | undefined;
  /** Leaf paths marked touched when the outer form submits. */
  touchPaths: readonly Path<TValues>[];
  /** Whether an edited RHF path is mirrored into the outer Formik values. */
  isBridgedName: (name: string) => boolean;
}

/**
 * Transitional boundary for a wizard step whose fields are RHF-native.
 *
 * WizardRoutedStep still owns a Formik form and submit pipeline. This hook
 * creates the step's RHF form from the outer Formik values and mirrors edits
 * back, while Formik remains authoritative for routing, hidden-field
 * stripping, save-and-exit, and the unsaved-change prompt. On a Formik submit
 * the RHF form copies `saveAndExit`, marks the bridged paths touched and
 * validates with the save-aware schemas so messages appear.
 *
 * `softSchema`, `hardSchema`, `touchPaths` and `isBridgedName` must be stable
 * (module-level) references.
 */
export const useFormikRhfBridge = <TValues extends BridgedValues>({
  softSchema,
  hardSchema,
  touchPaths,
  isBridgedName,
}: UseFormikRhfBridgeOptions<TValues>): UseFormReturn<TValues> => {
  const {
    initialValues,
    values: outerValues,
    setFieldValue,
    submitCount,
  } = useFormikContext<TValues>();
  const resolver = useMemo(
    () => createSaveAwareYupResolver<TValues>(softSchema, hardSchema),
    [softSchema, hardSchema]
  );
  const methods = useForm<TValues>({
    defaultValues: initialValues as never,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver,
  });
  const previousSubmitCount = useRef(submitCount);
  const { getValues, reset, setValue, trigger, watch } = methods;

  useEffect(() => {
    reset(initialValues as never);
  }, [initialValues, reset]);

  useEffect(() => {
    const subscription = watch((formValues, { name }) => {
      if (name && isBridgedName(name)) {
        void setFieldValue(name, get(formValues, name), false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isBridgedName, setFieldValue, watch]);

  useEffect(() => {
    if (submitCount <= previousSubmitCount.current) {
      previousSubmitCount.current = submitCount;
      return;
    }

    previousSubmitCount.current = submitCount;
    setValue('saveAndExit' as Path<TValues>, outerValues.saveAndExit as never, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
    touchPaths.forEach((name) => {
      setValue(name, getValues(name), {
        shouldDirty: false,
        shouldTouch: true,
        shouldValidate: false,
      });
    });
    void trigger();
  }, [
    getValues,
    outerValues.saveAndExit,
    setValue,
    submitCount,
    touchPaths,
    trigger,
  ]);

  return methods;
};
