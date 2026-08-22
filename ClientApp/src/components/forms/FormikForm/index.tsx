import { Formik, isEmptyChildren, isFunction } from 'formik';
import type { FormikHelpers, FormikProps, FormikValues } from 'formik';
import React from 'react';
import BlockUISpinner from '../../BlockUISpinner';
import FormBanner from '../FormBanner';
import type { FormikFormProps } from './types';
import UnsavedFormPrompt from '../UnsavedFormPrompt';
import { removeHidden, validateForm } from '../utils';
import { removeEmptyKeys } from '../../../utils';

const FormikForm = <Values extends FormikValues>(props: FormikFormProps<Values>) => {
    const {
        initialValues,
        isLoading,
        validateSoft,
        validateHard,
        onSubmit,
        promptPath,
        children,
        banner,
        discard,
        hidingFields,
        onSaveAndExit,
        bannerTitle,
        bannerRefTitle,
        bannerSubTitle,
        canSaveDraft,
        showGoToDashboardButton,
        showBanner,
    } = props;
    const hiddenFields = hidingFields ?? {};

    const validate = async (values: Values) => {
        if (values.saveAndExit === true) {
            if (validateSoft) {
                if (isFunction(validateSoft)) {
                    return validateSoft(values);
                }
                return validateForm(validateSoft, hiddenFields)(values);
            }
            return {};
        }
        if (validateHard) {
            if (isFunction(validateHard)) {
                return validateHard(values);
            }
            return validateForm(validateHard, hiddenFields)(values);
        }
        return {};
    };

    const formStatus = {
        hidden: hidingFields,
    };

    const handleSubmit = async (values: Values, formikHelpers: FormikHelpers<Values>) => {
        const removedHidden = removeHidden(values, values, hiddenFields);
        const normalizedValues = removeEmptyKeys(removedHidden, ([k, _]) => {
            switch (k) {
                case 'saveAndExitClick':
                case 'saveAndExit':
                case 'submitClick':
                    return false;
                default:
                    return true;
            }
        });

        if (values.saveAndExit === true && onSaveAndExit) {
            await onSaveAndExit(normalizedValues, formikHelpers);
        } else {
            await onSubmit(normalizedValues, formikHelpers);
        }
    };

    const renderBanner = () => {
        if (banner === undefined || isEmptyChildren(banner)) {
            if (showBanner) {
                return (
                    <FormBanner
                        title={bannerTitle}
                        refTitle={bannerRefTitle}
                        subTitle={bannerSubTitle}
                        showSaveAndExitButton={canSaveDraft ?? true}
                        showGoToDashboardButton={showGoToDashboardButton}
                        discard={discard}
                    />
                );
            }

            return null;
        }

        return React.Children.only(banner);
    };

    const renderChildren = (formik: FormikProps<Values>) => {
        if (isFunction(children)) {
            return children(formik);
        }

        if (isEmptyChildren(children)) {
            return null;
        }

        return React.Children.only(children);
    };

    return (
        <Formik<Values>
            initialValues={initialValues}
            initialStatus={formStatus}
            onSubmit={handleSubmit}
            validate={validate}
            enableReinitialize
        >
            {(formik) => (
                <>
                    {renderBanner()}
                    {formik.isSubmitting && (
                        <BlockUISpinner>
                            <p>Saving...</p>
                        </BlockUISpinner>
                    )}
                    {isLoading && (
                        <BlockUISpinner>
                            <p>Loading...</p>
                        </BlockUISpinner>
                    )}
                    <UnsavedFormPrompt path={promptPath} />
                    {renderChildren(formik)}
                </>
            )}
        </Formik>
    );
};

export default FormikForm;
