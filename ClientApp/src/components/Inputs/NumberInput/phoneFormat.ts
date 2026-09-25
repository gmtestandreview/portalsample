const DEFAULT_PHONE_NUMBER_FORMAT = '## #### ####';
const SHORT_PHONE_NUMBER_FORMAT = '## ## ##';
const SERVICE_PHONE_NUMBER_FORMAT = '#### ### ###';

export function getPhoneNumberFormat(value: string | null | undefined): string {
    if (typeof value !== 'string') {
        return DEFAULT_PHONE_NUMBER_FORMAT;
    }

    const digitsOnlyValue = value.replace(/\D/g, '');

    if (
        digitsOnlyValue.startsWith('04')
        || digitsOnlyValue.startsWith('1800')
        || digitsOnlyValue.startsWith('1300')
    ) {
        return SERVICE_PHONE_NUMBER_FORMAT;
    }

    if (digitsOnlyValue.startsWith('13') && digitsOnlyValue.length <= 6) {
        return SHORT_PHONE_NUMBER_FORMAT;
    }

    return DEFAULT_PHONE_NUMBER_FORMAT;
}
