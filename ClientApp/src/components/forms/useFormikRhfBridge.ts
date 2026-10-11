import { get } from 'lodash';
import { useEffect, useMemo, useRef } from 'react';
import { useFormikContext } from 'formik';
import { useForm } from 'react-hook-form';
import type {
  DefaultValues,
  FieldValues,
  Path,
  PathValue,
  UseFormReturn,
} from 'react-hook-form';
import { createSaveAwareYupResolver } from './saveAwareYupResolver';
import type { ValidationSchema } from './types';

/** Values of a bridged step: the form fields plus the wizard's save flag. */
export type BridgedValues = FieldValues & { saveAndExit?: boolean };

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

type Methods<TValues extends BridgedValues> = UseFormReturn<TValues>;

const useResetOnReinit = <TValues extends BridgedValues>(
  reset: Methods<TValues>['reset'],
  initialValues: TValues
) => {
  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);
};

const useMirrorToFormik = <TValues extends BridgedValues>(
  watch: Methods<TValues>['watch'],
  isBridgedName: (name: string) => boolean
) => {
  const { setFieldValue } = useFormikContext<TValues>();

  useEffect(() => {
    const subscription = watch((formValues, { name }) => {
      if (name && isBridgedName(name)) {
        const value: unknown = get(formValues, name);
        void setFieldValue(name, value, false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isBridgedName, setFieldValue, watch]);
};

const useTouchOnSubmit = <TValues extends BridgedValues>(
  { getValues, setValue, trigger }: Methods<TValues>,
  touchPaths: readonly Path<TValues>[]
) => {
  const { values: outerValues, submitCount } = useFormikContext<TValues>();
  const previousSubmitCount = useRef(submitCount);

  useEffect(() => {
    if (submitCount <= previousSubmitCount.current) {
      previousSubmitCount.current = submitCount;
      return;
    }

    previousSubmitCount.current = submitCount;
    setValue(
      'saveAndExit' as Path<TValues>,
      outerValues.saveAndExit as PathValue<TValues, Path<TValues>>,
      { shouldDirty: false, shouldTouch: false, shouldValidate: false }
    );
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
};

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
 * `softSchema`, `hardSchema`, `touchPaths` and `isBridgedName` must be
 * module-level (stable) references; inline literals would re-run the effects
 * on every render.
 *
 * NOTE: array fields are not supported. Mirroring and touch marking address
 * plain object paths only.
 */
export const useFormikRhfBridge = <TValues extends BridgedValues>({
  softSchema,
  hardSchema,
  touchPaths,
  isBridgedName,
}: UseFormikRhfBridgeOptions<TValues>): UseFormReturn<TValues> => {
  const { initialValues } = useFormikContext<TValues>();
  const resolver = useMemo(
    () => createSaveAwareYupResolver<TValues>(softSchema, hardSchema),
    [softSchema, hardSchema]
  );
  const methods = useForm<TValues>({
    defaultValues: initialValues as DefaultValues<TValues>,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver,
  });

  useResetOnReinit(methods.reset, initialValues);
  useMirrorToFormik(methods.watch, isBridgedName);
  useTouchOnSubmit(methods, touchPaths);

  return methods;
};
