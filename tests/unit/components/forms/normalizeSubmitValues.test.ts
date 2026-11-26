import { describe, expect, it } from 'vitest';
import { normalizeSubmitValues } from '../../../../ClientApp/src/components/forms/utils';

describe(normalizeSubmitValues, () => {
  it('drops an empty object that only a registered field created', () => {
    expect.hasAssertions();

    const values = { name: 'Acme', streetAddress: {} };

    expect(normalizeSubmitValues(values, {}, { name: 'Acme' })).toStrictEqual({
      name: 'Acme',
    });
  });

  it('drops nested containers that become empty and are not loaded', () => {
    expect.hasAssertions();

    const values = { agent: { name: 'A', streetAddress: {} }, form: {} };

    expect(
      normalizeSubmitValues(values, {}, { agent: { name: 'A' } }),
    ).toStrictEqual({ agent: { name: 'A' } });
  });

  it('keeps an empty object that was part of the loaded values', () => {
    expect.hasAssertions();

    const values = { contact: {}, name: 'Acme' };

    expect(
      normalizeSubmitValues(values, {}, { contact: {}, name: 'Acme' }),
    ).toStrictEqual({ contact: {}, name: 'Acme' });
  });

  it('keeps objects with values and arrays untouched', () => {
    expect.hasAssertions();

    const values = {
      address: { line1: '1 Test St' },
      docs: [{ id: 1 }],
    };

    expect(normalizeSubmitValues(values, {}, {})).toStrictEqual(values);
  });

  it('keeps empty objects when the loaded values are not supplied', () => {
    expect.hasAssertions();

    expect(normalizeSubmitValues({ form: {} }, {})).toStrictEqual({});
  });

  it('removes empty strings and hidden fields as before', () => {
    expect.hasAssertions();

    const values = { keep: 'x', blank: '', hiddenOne: 'y' };
    const hidden = { hiddenOne: true };

    expect(
      normalizeSubmitValues(values, hidden as never, { keep: 'x' }),
    ).toStrictEqual({ keep: 'x' });
  });
});
