import { Formik, Form } from 'formik';
import type { FormikHelpers, FormikProps, FormikTouched } from 'formik';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import type { Mock } from 'vitest';
import type { AnySchema } from 'yup';

import '../../../ClientApp/src/validationSchemas/yupExtensions';

interface FormikWrapperProps<TValues> {
    readonly initialValues: TValues;
    readonly onSubmit?: (values: TValues) => void | Promise<void>;
    readonly children: ReactNode;
    /**
     * Schema to validate against. Passing one is what makes an error-path test meaningful; without
     * it Formik reports no errors and an "invalid input is rejected" assertion passes vacuously.
     */
    readonly validationSchema?: AnySchema;
    /**
     * Start with every field touched AND validated, so validation messages render without
     * simulating blur.
     *
     * Marking fields touched is not sufficient on its own: Formik only computes `errors` on change,
     * blur or submit, so on mount `errors` is empty and `<ErrorMessage>` renders nothing however
     * touched the field is. `validateOnMount` is the half that actually produces the message.
     */
    readonly initialTouched?: boolean;
    /** Escape hatch for tests that need to drive submit or field state imperatively. */
    readonly innerRef?: (formik: FormikProps<TValues>) => void;
}

const touchEveryField = <TValues extends Record<string, unknown>>(values: TValues) =>
    Object.fromEntries(Object.keys(values).map((key) => [key, true])) as FormikTouched<TValues>;

export function FormikWrapper<TValues extends Record<string, unknown>>({
    initialValues,
    onSubmit = async () => {},
    children,
    validationSchema,
    initialTouched = false,
    innerRef,
}: FormikWrapperProps<TValues>) {
    return (
        <Formik
            initialValues={initialValues}
            onSubmit={onSubmit}
            validationSchema={validationSchema}
            initialTouched={initialTouched ? touchEveryField(initialValues) : undefined}
            validateOnMount={initialTouched}
            innerRef={innerRef as never}
        >
            <Form>{children}</Form>
        </Formik>
    );
}

export interface SubmitSpy<TValues> {
    /** Pass as `onSubmit`. */
    readonly onSubmit: Mock;
    /** Values from the most recent submit, or undefined if it never submitted. */
    readonly lastValues: () => TValues | undefined;
    readonly submitCount: () => number;
}

/**
 * Submit spy that also settles Formik's submission state.
 *
 * A bare `vi.fn()` as `onSubmit` returns undefined, so Formik never learns the submission finished
 * and leaves `isSubmitting` true - which disables the submit button. A second submit in the same
 * test then appears to do nothing, and the test reads as a component bug rather than a harness one.
 * This calls `setSubmitting(false)` the way a real handler does.
 */
export const createSubmitSpy = <TValues extends Record<string, unknown>>(): SubmitSpy<TValues> => {
    const calls: TValues[] = [];

    const onSubmit = vi.fn(async (values: TValues, helpers?: FormikHelpers<TValues>) => {
        calls.push(values);
        helpers?.setSubmitting(false);
    });

    return {
        onSubmit,
        lastValues: () => calls.at(-1),
        submitCount: () => calls.length,
    };
};
