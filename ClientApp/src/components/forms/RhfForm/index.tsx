import { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { DefaultValues, FieldValues } from 'react-hook-form';
import { useEffect } from 'react';
import { RhfHiddenRulesProvider } from '../RhfHidableField/hiddenRulesContext';
import { normalizeSubmitValues } from '../utils';
import type { FormValues, Hideable, ValidationSchema } from '../types';
import { createWizardYupResolver } from './wizardYupResolver';
import type { SubmitMode } from './wizardYupResolver';
import AppLogger from '../../../instrumentation/AppLogger';

const NO_HIDDEN_RULES: Hideable = {};

export interface RhfFormApi {
  /**
   * Validates with the mode's schema, then calls the matching handler. Never
   * rejects: a handler that throws is logged, as Formik's handleSubmit did.
   */
  submit: (mode: SubmitMode) => Promise<void>;
  /** Native form submit (Enter key, submit button): behaves as `next`. */
  onFormSubmit: (event?: FormEvent) => void;
}

const RhfFormApiContext = createContext<RhfFormApi | null>(null);

/** Submit controls call this instead of writing flags into the form values. */
export const useRhfFormApi = (): RhfFormApi => {
  const api = useContext(RhfFormApiContext);
  if (!api) {
    throw new Error('useRhfFormApi must be used inside RhfForm');
  }
  return api;
};

export interface RhfFormProps<T extends FormValues> {
  initialValues: T;
  validateSoft?: ValidationSchema | undefined;
  validateHard?: ValidationSchema | undefined;
  hidingFields?: Hideable | undefined;
  onSubmit: (values: T) => void | Promise<unknown>;
  onSaveAndExit?: ((values: T) => void | Promise<unknown>) | undefined;
  children?: ReactNode | ((api: RhfFormApi) => ReactNode);
}

/**
 * Core of the React Hook Form wizard shell: owns `useForm`, the provider, hide
 * rules and the submit mode. The mode lives in a ref outside the form values and
 * returns to `next` after every submit, so a failed save and exit no longer
 * leaves the soft schema active (decision D-3). The banner, spinner and unsaved
 * prompt are added around it by the wizard step.
 *
 * `initialValues` is compared by identity: a new object (a fresh load) resets
 * the form, clearing errors, touched state and the submit count, and a re-render
 * with the same object does not.
 */
const RhfForm = <T extends FormValues>(props: Readonly<RhfFormProps<T>>) => {
  const {
    initialValues,
    validateSoft,
    validateHard,
    hidingFields,
    onSubmit,
    onSaveAndExit,
    children,
  } = props;
  const hidden = hidingFields ?? NO_HIDDEN_RULES;

  const modeRef = useRef<SubmitMode>('next');
  const hiddenRef = useRef<Hideable>(hidden);
  hiddenRef.current = hidden;

  const resolver = useMemo(
    () =>
      createWizardYupResolver<T>({
        softSchema: validateSoft,
        hardSchema: validateHard,
        getMode: () => modeRef.current,
        getHidden: () => hiddenRef.current,
      }),
    [validateSoft, validateHard]
  );

  const methods = useForm<T>({
    defaultValues: initialValues as DefaultValues<T>,
    resolver,
    // Formik validates on every change and blur, before and after a submit; 'all'
    // does the same ('onTouched' skips blur once the form has been submitted).
    // Errors only show once a field is touched or the form is submitted.
    mode: 'all',
    // The error summary takes focus after an invalid submit (decision D-2);
    // RHF must not also move focus to the first invalid field.
    shouldFocusError: false,
  });
  const { reset, handleSubmit } = methods;

  useEffect(() => {
    reset(initialValues as DefaultValues<T>);
  }, [initialValues, reset]);

  const submit = useCallback(
    async (mode: SubmitMode) => {
      modeRef.current = mode;
      try {
        await handleSubmit(async (values) => {
          const payload = normalizeSubmitValues(values, hiddenRef.current);
          if (mode === 'saveAndExit' && onSaveAndExit) {
            await onSaveAndExit(payload as T);
          } else {
            await onSubmit(payload as T);
          }
        })();
      } catch (error) {
        AppLogger.error('Form submission failed.', error as Error);
      } finally {
        modeRef.current = 'next';
      }
    },
    [handleSubmit, onSaveAndExit, onSubmit]
  );

  const api = useMemo<RhfFormApi>(
    () => ({
      submit,
      onFormSubmit: (event) => {
        event?.preventDefault();
        void submit('next');
      },
    }),
    [submit]
  );

  return (
    <FormProvider
      {...(methods as unknown as ReturnType<typeof useForm<FieldValues>>)}
    >
      <RhfHiddenRulesProvider rules={hidden}>
        <RhfFormApiContext.Provider value={api}>
          {typeof children === 'function' ? children(api) : children}
        </RhfFormApiContext.Provider>
      </RhfHiddenRulesProvider>
    </FormProvider>
  );
};

export default RhfForm;
export type { SubmitMode };
