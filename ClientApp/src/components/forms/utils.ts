 
 
import { getIn, isObject, setIn } from 'formik';
import type { FormikErrors, FormikValues } from 'formik';
import {
    entriesIn, fromPairs, isArray, isBoolean, isFunction, toPath,
} from 'lodash';
import type { ValidationError } from 'yup';
import type { Hideable } from './types';
import type { ValidationSchema } from './FormikForm/types';
export const isFieldPathHidden = <TValues>(hidden: any, values: TValues) => hidden !== undefined
&& ((isBoolean(hidden) && hidden === true)
|| (isFunction(hidden) && hidden(values)));

export const isHidden = <T, TValues>(
    fieldPath: string,
    hidden: Hideable<Partial<T>, Partial<TValues>>,
    values: TValues) : boolean => {
    const isFieldHidden = getIn(hidden, fieldPath);
    if (isFieldPathHidden(isFieldHidden, values)) {
        return true;
    }
    const isGroupHidden = getIn(hidden, `${fieldPath}.this`);
    if (isFieldPathHidden(isGroupHidden, values)) {
        return true;
    }

    const pathArray = toPath(fieldPath);

    if (pathArray.length === 0) {
        return false;
    }

    const path = pathArray.slice(0, -1).join('.');
    return isHidden(path, hidden, values);
};

export const removeHidden = <T extends FormikValues>(
    fieldValue: any,
    values: T,
    hide: Hideable<Partial<T>, Partial<T>>,
    path?: string)
: any => fromPairs(
    entriesIn(fieldValue)
        .filter(([key, _]) => (path
            ? !isHidden(`${path}.${key}`, hide, values)
            : !isHidden(key, hide, values)))
        .map(([key, value]) => {
            if (isArray(value)) {
                const newValues: any[] = [];
                value.forEach((x) => {
                    if (isObject(x)) {
                        newValues.push(removeHidden(x, values, hide, key));
                    } else {
                        newValues.push(x);
                    }
                });
                return [key, newValues];
            }
            return [
                key,
                isObject(value)
                    ? removeHidden(value, values, hide, key)
                    : value];
        }),
);

const toFormErrors = <T, TValues>(
    yupError: ValidationError,
    hidden: Hideable<Partial<T>, Partial<TValues>>,
    values: TValues): FormikErrors<TValues> => {
    let errors: FormikErrors<TValues> = {};
    if (yupError.inner) {
        if (yupError.inner.length === 0
        && yupError.path
        && !isHidden(yupError.path, hidden, values)) {
            errors = setIn(errors, yupError.path, yupError.message);
        } else if (yupError.inner.length > 0) {
            yupError.inner.forEach((err) => {
                if (err.path
          && !getIn(errors, err.path)
          && !isHidden(err.path, hidden, values)) {
                    errors = setIn(errors, err.path, err.message);
                }
            });
        }
    }
    return errors;
};

export const validateForm = <T, TValues>(
    schema: ValidationSchema | undefined,
    hidden: Hideable<Partial<T>, Partial<TValues>>) => async (values: TValues) => {
    let errors: FormikErrors<TValues> = {};
    if (schema !== undefined) {
        try {
            await schema.validate(values, {
                abortEarly: false,
                context: values,
            });
        } catch (error) {
            if ((error as Error).name !== 'ValidationError') {
                throw error;
            }
            const yupError = error as ValidationError;
            errors = toFormErrors(yupError, hidden, values);
        }
    }
    return errors;
};
