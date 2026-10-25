import { describe, it, expect } from 'vitest';

import { ReturnMethodValues } from '@/api/web-api-client';

import { createSaveAwareYupResolver } from '@/components/forms/saveAwareYupResolver';

import type { ValidationSchema } from '@/components/forms/types';

import {
  deliveryAndReturnSaveValidation,
  deliveryAndReturnSubmitValidation,
} from '@/routes/acceptQuote/validation';

import * as Yup from 'yup';

describe(createSaveAwareYupResolver, () => {
  const resolver = createSaveAwareYupResolver(
    deliveryAndReturnSaveValidation,
    deliveryAndReturnSubmitValidation,
  );
  it('runs the soft schema when saveAndExit is true and the hard schema otherwise, for the same values', async () => {
    expect.assertions(3);
    const values = {
      returnMethod: ReturnMethodValues.ClientWillProvide,
      saveAndExit: true,
    };

    const softResult = await resolver(values, undefined, {} as never);
    const hardResult = await resolver(
      { ...values, saveAndExit: false },
      undefined,
      {} as never,
    );

    expect(softResult.errors).toEqual({});
    expect(hardResult.errors).toHaveProperty('carrierName');
    expect(hardResult.errors).toHaveProperty('carrierAccountNumber');
  });
});

describe(createSaveAwareYupResolver, () => {
  const resolver = createSaveAwareYupResolver(
    deliveryAndReturnSaveValidation,
    deliveryAndReturnSubmitValidation,
  );
  it('resolves both branches of a .when() conditional keyed on a sibling field', async () => {
    expect.assertions(2);
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
});
