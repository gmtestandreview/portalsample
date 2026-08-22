import {
    isFunction, isString, useField, useFormikContext,
} from 'formik';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import PrimaryButton from '../../Buttons/PrimaryButton';

interface SubmitFormButtonProps {
    children?: string | ((onClick: React.MouseEventHandler<HTMLButtonElement>) => ReactNode);
}

const SubmitFormButton = ({ children }: SubmitFormButtonProps) => {
    const { submitForm } = useFormikContext();
    const [_field, _meta, saveAndExitHelper] = useField<boolean | undefined>('saveAndExit');
    const [submitClickField, _m, submitClickHelper] = useField<boolean | undefined>('submitClick');

    useEffect(() => {
        if (submitClickField.value === true) {
            submitForm();
            submitClickHelper.setValue(false);
        }
    }, [submitClickField, submitForm, submitClickHelper]);

    const onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        submitClickHelper.setValue(true);
        saveAndExitHelper.setValue(false);
    };

    if (children === undefined || isString(children) || !isFunction(children)) {
        return (
            <PrimaryButton
                data-testid='submit-button'
                onClick={onClick}
                className='me-3'
            >
                {children || 'Submit'}
            </PrimaryButton>
        );
    }

    return <>{children(onClick)}</>;
};

export default SubmitFormButton;
