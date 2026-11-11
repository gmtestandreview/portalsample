import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import type { FormEvent, ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { DefaultValues, FieldValues } from 'react-hook-form';
import { RhfHiddenRulesProvider } from '../RhfHidableField/hiddenRulesContext';
import { normalizeSubmitValues } from '../utils';
import type { FormValues, Hideable, ValidationSchema } from '../types';
import { createWizardYupResolver } from './wizardYupResolver';
import type { SubmitMode, WizardYupResolverContext } from './wizardYupResolver';
import AppLogger from '../../../instrumentation/AppLogger';

const NO_HIDDEN_RULES: Hideable = {};

class SubmitModeContext implements WizardYupResolverContext {
  submitMode: SubmitMode = 'next';

  setSubmitMode(mode: SubmitMode): void {
    this.submitMode = mode;
  }
}

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

/** True under `RhfForm`. Shell-neutral controls use it to pick their adapter. */
export const useIsRhfShell = (): boolean =>
  useContext(RhfFormApiContext) !== null;

export interface RhfFormProps<T extends FormValues> {
  initialValues: T;
  validateSoft?: ValidationSchema | undefined;
  validateHard?: ValidationSchema | undefined;
  hidingFields?: Hideable | undefined;
  onSubmit: (values: T) => undefined | Promise<unknown>;
  onSaveAndExit?: ((values: T) => undefined | Promise<unknown>) | undefined;
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

  const validationContext = useMemo<SubmitModeContext>(
    () => new SubmitModeContext(),
    [],
  );

  const resolver = useMemo(
    () =>
      createWizardYupResolver<T>({
        softSchema: validateSoft,
        hardSchema: validateHard,
        getHidden: () => hidden,
      }),
    [hidden, validateSoft, validateHard],
  );

  const methods = useForm<T, WizardYupResolverContext>({
    defaultValues: initialValues as DefaultValues<T>,
    resolver,
    context: validationContext,
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
    reset(initialValues);
  }, [initialValues, reset]);

  const submit = useCallback(
    async (mode: SubmitMode) => {
      validationContext.setSubmitMode(mode);
      try {
        await handleSubmit(async (values) => {
          const payload = normalizeSubmitValues(values, hidden);
          if (mode === 'saveAndExit' && onSaveAndExit) {
            await onSaveAndExit(payload);
          } else {
            await onSubmit(payload);
          }
        })();
      } catch (error) {
        AppLogger.error('Form submission failed.', error as Error);
      } finally {
        validationContext.setSubmitMode('next');
      }
    },
    [handleSubmit, hidden, onSaveAndExit, onSubmit, validationContext],
  );

  const api = useMemo<RhfFormApi>(
    () => ({
      submit,
      onFormSubmit: (event) => {
        event?.preventDefault();
        void submit('next');
      },
    }),
    [submit],
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
