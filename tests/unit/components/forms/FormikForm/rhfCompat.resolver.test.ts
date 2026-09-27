import { ReturnMethodValues } from '@/api/web-api-client';
import { createSaveAwareYupResolver } from '@/components/forms/FormikForm/rhfCompat';
import {
    deliveryAndReturnSaveValidation,
    deliveryAndReturnSubmitValidation,
} from '@/routes/acceptQuote/validation';

describe('createSaveAwareYupResolver', () => {
    const resolver = createSaveAwareYupResolver(deliveryAndReturnSaveValidation, deliveryAndReturnSubmitValidation);

    it('runs the soft schema when saveAndExit is true and the hard schema otherwise, for the same values', async () => {
        const values = {
            returnMethod: ReturnMethodValues.ClientWillProvide,
            saveAndExit: true,
        };

        const softResult = await resolver(values, undefined, {} as never);
        const hardResult = await resolver({ ...values, saveAndExit: false }, undefined, {} as never);

        expect(softResult.errors).toEqual({});
        expect(hardResult.errors).toHaveProperty('carrierName');
        expect(hardResult.errors).toHaveProperty('carrierAccountNumber');
    });

    it('resolves both branches of a .when() conditional keyed on a sibling field', async () => {
        const conditionTrue = await resolver(
            { returnMethod: ReturnMethodValues.ClientWillProvide },
            undefined,
            {} as never,
        );
        const conditionFalse = await resolver(
            { returnMethod: ReturnMethodValues.ClientToArrange },
            undefined,
            {} as never,
        );

        expect(conditionTrue.errors).toHaveProperty('carrierName');
        expect(conditionFalse.errors).not.toHaveProperty('carrierName');
    });

    it('surfaces multiple simultaneous errors under abortEarly: false', async () => {
        const result = await resolver(
            { returnMethod: ReturnMethodValues.ClientWillProvide },
            undefined,
            {} as never,
        );

        expect(result.errors).toHaveProperty('carrierName');
        expect(result.errors).toHaveProperty('carrierAccountNumber');
        expect((result.errors as Record<string, { type: string }>).carrierName).toMatchObject({ type: 'validation' });
    });

    it('returns empty errors and passes the values through for a fully valid object', async () => {
        const values = { returnMethod: ReturnMethodValues.ClientToArrange };

        const result = await resolver(values, undefined, {} as never);

        expect(result.errors).toEqual({});
        expect(result.values).toEqual(values);
    });
});
