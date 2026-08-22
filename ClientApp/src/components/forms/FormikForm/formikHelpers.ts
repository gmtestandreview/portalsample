import { isObject } from 'formik';
import type { FormikErrors } from 'formik';

const countOfErrors = <T,>(value: FormikErrors<T>) : number => {
    let count = 0;
    if (isObject(value)) {
        const keys = Object.keys(value);
        count = keys.length;
    }

    return count;
};

export default countOfErrors;
