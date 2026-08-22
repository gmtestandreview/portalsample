import * as yup from 'yup';
import './yupExtensions';
import { State } from '../api/web-api-client';
import {
    nullableString,
    requiredNullableString,
} from './common';

const addressSchema = (label: string) => yup.object().shape({
    isManuallyEntered: yup.boolean(),
    line1: yup.string().when('isManuallyEntered', {
        is: true,
        then: (_addressSchema) => requiredNullableString('Address line 1')
            .allowedFormat(true)
            .maxLength(250),
        otherwise: (_addressSchema) => yup.string(),
    }),
    line2: yup.string().when('isManuallyEntered', {
        is: true,
        then: (_addressSchema) => nullableString('Address line 2')
            .allowedFormat(true)
            .maxLength(250),
        otherwise: (_addressSchema) => yup.string(),
    }),
    line3: yup.string().when('isManuallyEntered', {
        is: true,
        then: (_addressSchema) => nullableString('Address line 3')
            .allowedFormat(true)
            .maxLength(250),
        otherwise: (_addressSchema) => yup.string(),
    }),
    postcode: yup.string().when('isManuallyEntered', {
        is: true,
        then: (_addressSchema) => requiredNullableString('Postcode')
            .fixedDigits(4, 'Postcode', 'Please enter a valid postcode'),
        otherwise: (_addressSchema) => yup.string(),
    }),
    state: yup.mixed().when(['isManuallyEntered'], {
        is: true,
        then: (_addressSchema) => yup.mixed()
            .oneOf(Object.values(State), 'State is required'),
        otherwise: (_addressSchema) => yup.mixed(),
    }),
    suburb: yup.string().when(['isManuallyEntered'], {
        is: true,
        then: (_addressSchema) => requiredNullableString('Suburb')
            .allowedFormat(true)
            .maxLength(80),
        otherwise: (_addressSchema) => yup.string(),
    }),
    searchText: yup.string().when(['isManuallyEntered'], {
        is: true,
        then: (_addressSchema) => yup.string(),
        otherwise: (_addressSchema) => yup.string()
            .required(`${label} is required`),
    }),
});

export default addressSchema;
