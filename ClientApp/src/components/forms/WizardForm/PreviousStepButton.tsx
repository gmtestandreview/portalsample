import React from 'react';
import type { FormikValues } from 'formik';
import { Link } from 'react-router';
import type { PreviousStepButtonProps, WizardStepProps } from './types';

const PreviousStepButton = ({
    steps,
    currentStepIndex,
    title,
    url,
    className = '', // default props
}: PreviousStepButtonProps) => {
    if (currentStepIndex < 1) {
        return null;
    }

    const previousChild = steps[currentStepIndex - 1];
    if (!React.isValidElement<WizardStepProps<FormikValues>>(previousChild)) {
        throw new Error('WizardForm only accepts children of type WizardStep');
    }
    return (
        <Link
            data-testid='back-button'
            to={`${url}${previousChild.props.location}`}
            replace
            className={`btn btn-tertiary ${className}`}
        >
            <i className='icon-back me-1' aria-hidden='true' />
            { title || 'Back' }
        </Link>
    );
};

export default PreviousStepButton;
