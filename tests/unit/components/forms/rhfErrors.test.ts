import { describe, expect, it } from 'vitest';
import { flattenRhfErrors } from '../../../../ClientApp/src/components/forms/ErrorSummary/rhfErrors';

const guardedLeaf = (message: unknown, type = 'required') => {
  const leaf: Record<string, unknown> = { type, message };
  Object.defineProperty(leaf, 'ref', {
    enumerable: true,
    get: () => {
      throw new Error('ref must never be read');
    },
  });
  return leaf;
};

describe('rhf errors', () => {
  it('returns messages by dotted path without reading any ref', () => {
    expect.hasAssertions();

    const errors = {
      name: guardedLeaf('Name is required'),
      contacts: [{ firstName: guardedLeaf('First name is required') }],
      address: { street: guardedLeaf('Street is required', 'min') },
    };

    expect(flattenRhfErrors(errors)).toStrictEqual({
      name: 'Name is required',
      'contacts.0.firstName': 'First name is required',
      'address.street': 'Street is required',
    });
  });

  it('keeps a DOM node out of the result', () => {
    expect.hasAssertions();

    const input = document.createElement('input');
    const result = flattenRhfErrors({
      name: { type: 'required', message: 'Required', ref: input },
    });

    expect(JSON.stringify(result)).not.toContain('Input');
    expect(Object.values(result)).toStrictEqual(['Required']);
  });

  it('skips leaves without a message and non-object input', () => {
    expect.hasAssertions();
    expect(flattenRhfErrors(undefined)).toStrictEqual({});
    expect(flattenRhfErrors('x')).toStrictEqual({});
    expect(
      flattenRhfErrors({
        a: { type: 'required' },
        b: { type: 'required', message: '' },
        c: null,
        d: 'text',
      }),
    ).toStrictEqual({});
  });

  it('treats a nested field named type as a group, not a leaf', () => {
    expect.hasAssertions();
    expect(
      flattenRhfErrors({ type: { type: 'required', message: 'Pick a type' } }),
    ).toStrictEqual({ type: 'Pick a type' });
  });
});
