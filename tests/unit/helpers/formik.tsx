import { Formik, Form } from 'formik';
import type { ReactNode } from 'react';

interface FormikWrapperProps<TValues> {
    readonly initialValues: TValues;
    readonly onSubmit?: (values: TValues) => void | Promise<void>;
    readonly children: ReactNode;
}

export function FormikWrapper<TValues extends Record<string, unknown>>({
    initialValues,
    onSubmit = async () => {},
    children,
}: FormikWrapperProps<TValues>) {
    return (
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
            <Form>{children}</Form>
        </Formik>
    );
}
