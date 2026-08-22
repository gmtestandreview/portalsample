import * as yup from 'yup';
import addressSchema from '../../validationSchemas/addressValidation';
import {
    nullableString,
    websiteUrlSchema,
} from '../../validationSchemas/common';
import '../../validationSchemas/yupExtensions';

const accountSubmitValidation = yup.object({
    businessOrTradingName: nullableString('Business or trading name')
        .allowedFormat(true)
        .minEntered(2)
        .maxLength(160),
    branchOrLocationName: nullableString('Branch or location name')
        .allowedFormat(true)
        .minEntered(2)
        .maxLength(160),
    isDefaultOrganisation: yup.boolean().optional(),
    businessWebsiteAddress: websiteUrlSchema('Business website address is not a valid website address')
        .label('Business website address')
        .maxLength(100)
        .optional(),
    streetAddress: addressSchema('Street address'),
    postalAddressSameAsStreetAddress: yup.boolean().optional(),
    postalAddress: yup.mixed().when('postalAddressSameAsStreetAddress', {
        is: false,
        then: (_accountSubmitValidation) => addressSchema('Postal address'),
        otherwise: (_accountSubmitValidation) => yup.mixed(),
    }),
});

export default accountSubmitValidation;
