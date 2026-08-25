import { useFormikContext } from 'formik';
import type { FormikValues } from 'formik';
import { useState, useEffect } from 'react';
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

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(false);
        setIsVisible(!isHidden(name, hidden, values));
    }, [name, hidden, values]);

    return isVisible
        ? <>{children}</>
        : null;
};

export default HidableField;
