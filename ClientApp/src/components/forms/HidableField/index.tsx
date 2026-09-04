import { useFormikContext } from 'formik';
import type { FormikValues } from 'formik';
import type { PropsWithChildren } from 'react';
import { isHidden } from '../utils';
import type { HidableFieldProps } from './types';

const HidableField = <T extends FormikValues>(props: PropsWithChildren<HidableFieldProps>) => {
    const {
        status: { hidden },
        values,
    } = useFormikContext<T>();
    const {
        name,
        children,
    } = props;

    const isVisible = !isHidden(name, hidden, values);

    return isVisible
        ? <>{children}</>
        : null;
};

export default HidableField;
