import type { ChangeEvent } from 'react';
import { useController, useFormContext } from 'react-hook-form';

type FieldChangeEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

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
export function useField(name: string): [FieldShim, FieldMetaShim, FieldHelpersShim] {
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
