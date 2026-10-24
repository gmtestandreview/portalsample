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
  options: { mode?: SubmitMode; hidden?: Hideable; values?: object } = {}
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
    const result = await resolve({ hard: undefined });

    expect(result).toEqual({ values: { name: '' }, errors: {} });
  });

  it('uses the soft schema for saveAndExit and the hard schema for next', async () => {
    const soft = Yup.object({});

    expect(
      (await resolve({ soft, hard: required }, { mode: 'saveAndExit' })).errors
    ).toEqual({});
    expect(
      (await resolve({ soft, hard: required }, { mode: 'next' })).errors
    ).toMatchObject({
      name: { message: 'Name is required' },
    });
  });

  it('keeps only the first message per path', async () => {
    const twoRules = Yup.object({
      name: Yup.string().min(3, 'Too short').matches(/^x/, 'Must start with x'),
    });
    const { errors } = await resolve(
      { hard: twoRules },
      { values: { name: 'a' } }
    );

    expect(errors).toMatchObject({ name: { message: 'Too short' } });
  });

  it('maps a ValidationError that has no inner errors by its own path', async () => {
    const throwing = {
      validate: async () => {
        throw new Yup.ValidationError('Bad value', 'v', 'name');
      },
    };
    const { errors } = await resolve({ hard: throwing });

    expect(errors).toMatchObject({ name: { message: 'Bad value' } });
  });

  it('treats a validation error without an inner list as a single error', async () => {
    const throwing = {
      validate: async () => {
        throw Object.assign(new Error('Odd error'), {
          name: 'ValidationError',
          path: 'name',
        });
      },
    };
    const { errors } = await resolve({ hard: throwing });

    expect(errors).toMatchObject({ name: { message: 'Odd error' } });
  });

  it('ignores a pathless error with no inner errors', async () => {
    const throwing = {
      validate: async () => {
        throw new Yup.ValidationError('No path');
      },
    };

    await expect(resolve({ hard: throwing })).resolves.toEqual({
      values: { name: '' },
      errors: {},
    });
  });

  it('drops errors on hidden fields, and passes when only hidden fields fail', async () => {
    const result = await resolve(
      { hard: required },
      { hidden: { name: true } }
    );

    expect(result).toEqual({ values: { name: '' }, errors: {} });
  });

  it('rethrows failures that are not validation errors', async () => {
    const broken = {
      validate: async () => {
        throw new TypeError('schema bug');
      },
    };

    await expect(resolve({ hard: broken })).rejects.toThrow('schema bug');
  });
});

describe('rhfForm api', () => {
  it('throws when the api hook is used outside the form', () => {
    const expectedError = 'useRhfFormApi must be used inside RhfForm';
    const expectedReactError =
      'The above error occurred in the <Probe> component:';
    const isExpectedConsoleError = (args: unknown[]) =>
      args.length === 1 &&
      ((args[0] instanceof Error && args[0].message === expectedError) ||
        (typeof args[0] === 'string' &&
          args[0].startsWith(expectedReactError)));
    const Probe = () => {
      useRhfFormApi();
      return null;
    };
    const originalConsoleError = console.error;
    const spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
      if (!isExpectedConsoleError(args)) {
        originalConsoleError(...args);
      }
    });
    const suppressExpectedError = vi.fn((event: ErrorEvent) => {
      if (
        event.error instanceof Error &&
        event.error.message === expectedError
      ) {
        event.preventDefault();
      }
    });
    globalThis.addEventListener('error', suppressExpectedError);
    try {
      expect(() => render(<Probe />)).toThrow(expectedError);
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining(expectedReactError)
      );
      expect(spy.mock.calls.every(isExpectedConsoleError)).toBe(true);
      expect(suppressExpectedError).toHaveBeenCalledWith();
      expect(
        suppressExpectedError.mock.calls.every(
          ([event]) =>
            event.error instanceof Error &&
            event.error.message === expectedError
        )
      ).toBe(true);
    } finally {
      globalThis.removeEventListener('error', suppressExpectedError);
      spy.mockRestore();
    }
  });

  it('hands the api to a render-prop child', () => {
    render(
      <RhfForm initialValues={{}} onSubmit={() => undefined}>
        {(api) => (
          <span data-testid='probe'>
            {typeof api.submit} {typeof api.onFormSubmit}
          </span>
        )}
      </RhfForm>
    );

    expect(screen.getByTestId('probe').textContent).toBe('function function');
  });
});
