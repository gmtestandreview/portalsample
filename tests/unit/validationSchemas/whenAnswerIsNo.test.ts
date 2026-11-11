import * as yup from 'yup';
import { describe, expect, it } from 'vitest';
import '../../../ClientApp/src/validationSchemas/yupExtensions';
import { YesNo } from '../../../ClientApp/src/api/web-api-client';
import { whenAnswerIsNo } from '../../../ClientApp/src/validationSchemas/contactValidation';

const schema = yup.object({
  isPrincipalContact: yup.string(),
  contact: whenAnswerIsNo('isPrincipalContact', () =>
    yup.object({ name: yup.string().required('Name is required') }),
  ),
});

describe(whenAnswerIsNo, () => {
  it('applies the built schema when the answer is No', async () => {
    expect.assertions(2);
    await expect(
      schema.validate({ isPrincipalContact: YesNo.No, contact: {} }),
    ).rejects.toThrow('Name is required');
    await expect(
      schema.isValid({ isPrincipalContact: YesNo.No, contact: { name: 'A' } }),
    ).resolves.toBe(true);
  });

  it.each([YesNo.Yes, undefined])(
    'leaves the field unconstrained when the answer is %s',
    async (answer) => {
      expect.assertions(1);
      await expect(
        schema.isValid({ isPrincipalContact: answer, contact: {} }),
      ).resolves.toBe(true);
    },
  );
});
