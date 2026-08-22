import { vi } from 'vitest';
import type { FormikHelpers } from 'formik';
import {
    FormStepStatus,
    type FormStepStatusDto,
} from '../../../ClientApp/src/api/web-api-client';

export const stepStatuses: FormStepStatusDto[] = [{
    status: FormStepStatus.Saved,
}];

export const formikHelpers = <Values>(): FormikHelpers<Values> => ({
    setStatus: vi.fn(),
    setErrors: vi.fn(),
    setSubmitting: vi.fn(),
    setTouched: vi.fn().mockResolvedValue(undefined),
    setValues: vi.fn().mockResolvedValue(undefined),
    setFieldValue: vi.fn().mockResolvedValue(undefined),
    setFieldError: vi.fn(),
    setFieldTouched: vi.fn().mockResolvedValue(undefined),
    validateForm: vi.fn().mockResolvedValue({}),
    validateField: vi.fn().mockResolvedValue(undefined),
    resetForm: vi.fn(),
    submitForm: vi.fn().mockResolvedValue(undefined),
    setFormikState: vi.fn(),
});
