import {
    isFunction, useField, useFormikContext,
} from 'formik';
import { isString } from 'lodash';
import type React from 'react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

import PrimaryButton from '../../Buttons/PrimaryButton';

interface SaveAndExitButtonProps {
    children?: string | ((onClick: React.MouseEventHandler<HTMLButtonElement>) => ReactNode);
}

const SaveAndExitButton = ({ children }: SaveAndExitButtonProps) => {
    const { submitForm } = useFormikContext();
    const [_field, _meta, saveAndExitHelper] = useField<boolean | undefined>('saveAndExit');
    const [saveAndExitClickField, _m, saveAndExitClickHelper] = useField<boolean | undefined>('saveAndExitClick');

    useEffect(() => {
        if (saveAndExitClickField.value === true) {
            submitForm();
            saveAndExitClickHelper.setValue(false);
        }
    }, [saveAndExitClickField, submitForm, saveAndExitClickHelper]);

    const onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        saveAndExitClickHelper.setValue(true);
        saveAndExitHelper.setValue(true);
    };

    if (children === undefined || isString(children) || !isFunction(children)) {
        return (
            <PrimaryButton
                data-testid='save-and-exit-button'
                onClick={onClick}
                mode='dark'
                className='me-md-3'
            >
                {children || 'Save and exit'}
            </PrimaryButton>
        );
    }

    return <>{children(onClick)}</>;
};

export default SaveAndExitButton;
