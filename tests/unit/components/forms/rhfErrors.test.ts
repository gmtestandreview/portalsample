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

describe('flattenRhfErrors', () => {
  it('returns messages by dotted path without reading any ref', () => {
    const errors = {
      name: guardedLeaf('Name is required'),
      contacts: [{ firstName: guardedLeaf('First name is required') }],
      address: { street: guardedLeaf('Street is required', 'min') },
    };

    expect(flattenRhfErrors(errors)).toEqual({
      name: 'Name is required',
      'contacts.0.firstName': 'First name is required',
      'address.street': 'Street is required',
    });
  });

  it('keeps a DOM node out of the result', () => {
    const input = document.createElement('input');
    const result = flattenRhfErrors({
      name: { type: 'required', message: 'Required', ref: input },
    });

    expect(JSON.stringify(result)).not.toContain('Input');
    expect(Object.values(result)).toEqual(['Required']);
  });

  it('skips leaves without a message and non-object input', () => {
    expect(flattenRhfErrors(undefined)).toEqual({});
    expect(flattenRhfErrors('x')).toEqual({});
    expect(
      flattenRhfErrors({
        a: { type: 'required' },
        b: { type: 'required', message: '' },
        c: null,
        d: 'text',
      })
    ).toEqual({});
  });

  it('treats a nested field named type as a group, not a leaf', () => {
    expect(
      flattenRhfErrors({ type: { type: 'required', message: 'Pick a type' } })
    ).toEqual({ type: 'Pick a type' });
  });
});
