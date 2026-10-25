import { describe, it, expect, vi } from 'vitest';

import { render, screen } from '@testing-library/react';

import * as Yup from 'yup';

import RhfForm, {
  useRhfFormApi,
} from '../../../../ClientApp/src/components/forms/RhfForm';

import { createWizardYupResolver } from '../../../../ClientApp/src/components/forms/RhfForm/wizardYupResolver';

import type { SubmitMode } from '../../../../ClientApp/src/components/forms/RhfForm/wizardYupResolver';

import type { Hideable } from '../../../../ClientApp/src/components/forms/types';

const resolve = async (
  schemas: {
    soft?: Pick<Yup.AnyObjectSchema, 'validate'> | undefined;
    hard?: Pick<Yup.AnyObjectSchema, 'validate'> | undefined;
  },
  options: { mode?: SubmitMode; hidden?: Hideable; values?: object } = {},
) => {
  const resolver = createWizardYupResolver({
    softSchema: schemas.soft,
    hardSchema: schemas.hard,
    getMode: () => options.mode ?? 'next',
    getHidden: () => options.hidden ?? {},
  });
  return resolver((options.values ?? { name: '' }) as never, undefined, {
    fields: {},
    shouldUseNativeValidation: false,
  } as never);
};

const required = Yup.object({
  name: Yup.string().required('Name is required'),
});

describe(createWizardYupResolver, () => {
  it('passes values through when the mode has no schema', async () => {
    expect.assertions(1);
    const result = await resolve({ hard: undefined });

    expect(result).toEqual({ values: { name: '' }, errors: {} });
  });
});

describe(createWizardYupResolver, () => {
  it('uses the soft schema for saveAndExit and the hard schema for next', async () => {
    expect.assertions(2);
    const soft = Yup.object({});

    expect(
      (await resolve({ soft, hard: required }, { mode: 'saveAndExit' })).errors,
    ).toEqual({});
    expect(
      (await resolve({ soft, hard: required }, { mode: 'next' })).errors,
    ).toMatchObject({
      name: { message: 'Name is required' },
    });
  });
});

describe(createWizardYupResolver, () => {
  it('keeps only the first message per path', async () => {
    expect.assertions(1);
    const twoRules = Yup.object({
      name: Yup.string().min(3, 'Too short').matches(/^x/, 'Must start with x'),
    });
    const { errors } = await resolve(
      { hard: twoRules },
      { values: { name: 'a' } },
    );

    expect(errors).toMatchObject({ name: { message: 'Too short' } });
  });
});

describe(createWizardYupResolver, () => {
  it('maps a ValidationError that has no inner errors by its own path', async () => {
    expect.assertions(1);
    const throwing = {
      validate: async () => {
        throw new Yup.ValidationError('Bad value', 'v', 'name');
      },
    };
    const { errors } = await resolve({ hard: throwing });

    expect(errors).toMatchObject({ name: { message: 'Bad value' } });
  });
});
