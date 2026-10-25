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

describe(flattenRhfErrors, () => {
  it('returns messages by dotted path without reading any ref', () => {
    expect.assertions(1);
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
});

describe(flattenRhfErrors, () => {
  it('keeps a DOM node out of the result', () => {
    expect.assertions(2);
    const input = document.createElement('input');
    const result = flattenRhfErrors({
      name: { type: 'required', message: 'Required', ref: input },
    });

    expect(JSON.stringify(result)).not.toContain('Input');
    expect(Object.values(result)).toEqual(['Required']);
  });
});
