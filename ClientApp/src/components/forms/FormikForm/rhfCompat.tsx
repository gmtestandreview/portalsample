import { set } from 'lodash';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { createContext, useContext } from 'react';
import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import { useController, useFormContext } from 'react-hook-form';
import type { ValidationError } from 'yup';
import type { ValidationSchema } from './types';

type FieldChangeEvent = ChangeEvent<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
>;

interface FieldShim {
  name: string;
  value: unknown;
  onChange: (event: FieldChangeEvent) => void;
  onBlur: () => void;
}

interface FieldMetaShim {
  touched: boolean;
  error: string | undefined;
}

interface FieldHelpersShim {
  setValue: (value: unknown) => void;
  setTouched: (touched?: boolean) => void;
}

function extractEventValue(event: FieldChangeEvent): unknown {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.type === 'checkbox') {
    return target.checked;
  }
  return target.value;
}

/**
 * Formik-compatible `useField` shim backed by react-hook-form.
 *
 * Mirrors the 3-tuple shape returned by Formik's `useField(name)` so that
 * `Inputs/*` components can later switch their import from `formik` to this
 * module without changing call sites. Requires a react-hook-form
 * `<FormProvider>` ancestor (see `useFormContext`).
 *
 * Limitation: react-hook-form has no public primitive to mark a field
 * untouched. `setTouched(false)` is a no-op — `setValue`'s `shouldTouch`
 * option only ever sets touched to `true`, never clears it.
 */
export function useField(
  name: string
): [FieldShim, FieldMetaShim, FieldHelpersShim] {
  const { control, setValue, getValues } = useFormContext();
  const { field, fieldState } = useController({ name, control });

  const onChange = (event: FieldChangeEvent): void => {
    field.onChange(extractEventValue(event));
  };

  const setTouched = (touched = true): void => {
    setValue(name, getValues(name), { shouldTouch: touched });
  };

  return [
    { name: field.name, value: field.value, onChange, onBlur: field.onBlur },
    { touched: fieldState.isTouched, error: fieldState.error?.message },
    { setValue: (value: unknown) => field.onChange(value), setTouched },
  ];
}

interface RhfCompatStatus {
  hidden: unknown;
}

/**
 * Carries the Formik-status-shaped `{ hidden }` value that `FormikForm` used
 * to set via `initialStatus={{ hidden: hidingFields }}` — a static prop, not
 * live form state, and so not something react-hook-form's `formState` can
 * supply on its own. A later task provides this from `FormikForm`; until
 * then, `useFormikContext().status.hidden` reads as `undefined`.
 */
export const RhfCompatStatusContext = createContext<RhfCompatStatus>({
  hidden: undefined,
});

interface FormikContextShim<T extends FieldValues> {
  values: T;
  errors: FieldErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
  status: RhfCompatStatus;
  handleSubmit: ReturnType<typeof useFormContext>['handleSubmit'];
  setFieldValue: (field: string, value: unknown) => void;
  setFieldTouched: (field: string, touched?: boolean) => void;
}

/**
 * Formik-compatible `useFormikContext` shim backed by react-hook-form.
 * Requires a react-hook-form `<FormProvider>` ancestor.
 *
 * Limitation: same as `useField`'s `setTouched` — `setFieldTouched(field,
 * false)` cannot un-touch a field, react-hook-form has no primitive for it.
 */
export function useFormikContext<
  T extends FieldValues = FieldValues,
>(): FormikContextShim<T> {
  const { watch, formState, setValue, getValues, handleSubmit } =
    useFormContext();
  const status = useContext(RhfCompatStatusContext);

  const setFieldValue = (field: string, value: unknown): void => {
    setValue(field, value, { shouldDirty: true, shouldValidate: true });
  };

  const setFieldTouched = (field: string, touched = true): void => {
    setValue(field, getValues(field), { shouldTouch: touched });
  };

  return {
    values: watch() as T,
    errors: formState.errors as FieldErrors<T>,
    touched: formState.touchedFields as Partial<Record<keyof T, boolean>>,
    dirty: formState.isDirty,
    isValid: formState.isValid,
    isSubmitting: formState.isSubmitting,
    submitCount: formState.submitCount,
    status,
    handleSubmit,
    setFieldValue,
    setFieldTouched,
  };
}

interface FieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'checked' | 'onChange' | 'onBlur'
> {
  name: string;
  type: 'checkbox' | 'radio';
  value?: unknown;
  checked?: boolean;
  onChange?: (event: FieldChangeEvent) => void;
  onBlur?: () => void;
}

/**
 * Formik-compatible `<Field>` replacement for the two call sites that use
 * the component form rather than the `useField` hook — `Inputs/Checkbox` and
 * `Inputs/RadioButton`, both spreading `type='checkbox'`/`type='radio'` plus
 * a handful of native input props onto `<Field>`.
 *
 * Mirrors Formik's checked-vs-value coercion: a checkbox with no `value`
 * prop tracks a boolean field value directly (`checked = !!field.value`);
 * a radio (or a grouped checkbox) compares the field value to the option's
 * `value` prop. Callers that already compute `checked` themselves (as
 * `RadioButton` does) can pass it straight through — it takes precedence.
 */
export function Field({
  name,
  type,
  value,
  checked,
  onChange,
  onBlur,
  ...rest
}: Readonly<FieldProps>): JSX.Element {
  const [field] = useField(name);

  const resolvedChecked =
    checked ?? (type === 'checkbox' ? !!field.value : field.value === value);

  return (
    <input
      {...rest}
      name={name}
      type={type}
      value={value as string | number | readonly string[] | undefined}
      checked={resolvedChecked}
      onChange={onChange ?? field.onChange}
      onBlur={onBlur ?? field.onBlur}
    />
  );
}

type SaveAwareFieldValues = FieldValues & { saveAndExit?: boolean };

/**
 * Converts a Yup `ValidationError` into react-hook-form's nested `FieldErrors`
 * shape. Mirrors `toFormErrors` in `../utils.ts`, but targets RHF's
 * `{ type, message }` per-field shape instead of Formik's plain message
 * string, and builds real nested objects (via lodash `set`) rather than
 * dot-path string keys, matching RHF's `FieldErrors` type.
 */
function yupErrorToFieldErrors<TFieldValues extends FieldValues>(
  error: ValidationError
): FieldErrors<TFieldValues> {
  const fieldErrors = {};
  const innerErrors = error.inner ?? [];

  if (innerErrors.length > 0) {
    innerErrors.forEach((innerError) => {
      if (innerError.path) {
        set(fieldErrors, innerError.path, {
          type: 'validation',
          message: innerError.message,
        });
      }
    });
  } else if (error.path) {
    set(fieldErrors, error.path, {
      type: 'validation',
      message: error.message,
    });
  }

  return fieldErrors as FieldErrors<TFieldValues>;
}

/**
 * Builds an RHF `useForm({ resolver })` function that mirrors FormikForm's
 * save-aware `validate()` closure (see `index.tsx`'s `validate` and
 * `validateForm` in `../utils.ts`): soft-schema validation when
 * `values.saveAndExit === true`, hard-schema validation otherwise.
 *
 * Calls `schema.validate(values, { abortEarly: false, context: values })` on
 * whichever schema the caller passes in — the same call shape the Formik path
 * uses — so `.when()` conditionals keyed on sibling fields, and any
 * side-effect-registered custom Yup string extensions, resolve identically.
 * No fresh Yup schema is constructed here.
 */
export function createSaveAwareYupResolver<
  TFieldValues extends SaveAwareFieldValues,
>(
  softSchema: ValidationSchema | undefined,
  hardSchema: ValidationSchema | undefined
): Resolver<TFieldValues> {
  return async (values) => {
    const schema = values.saveAndExit === true ? softSchema : hardSchema;

    if (!schema) {
      return { values, errors: {} };
    }

    try {
      await schema.validate(values, { abortEarly: false, context: values });
      return { values, errors: {} };
    } catch (error) {
      if ((error as Error).name !== 'ValidationError') {
        throw error;
      }
      return {
        values: {},
        errors: yupErrorToFieldErrors<TFieldValues>(error as ValidationError),
      };
    }
  };
}
