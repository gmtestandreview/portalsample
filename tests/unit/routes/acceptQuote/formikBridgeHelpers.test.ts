import { describe, expect, it } from 'vitest';
import {
  addressTouchPaths,
  createBridgedNamePredicate,
  NO_HIDDEN_RULES,
} from '@/routes/acceptQuote/formikBridgeHelpers';

describe('formikBridgeHelpers', () => {
  it('exposes an empty hidden-rules object', () => {
    expect(NO_HIDDEN_RULES).toEqual({});
  });

  it('prefixes every address leaf path', () => {
    expect(addressTouchPaths('returnAddress')).toEqual([
      'returnAddress.line1',
      'returnAddress.line2',
      'returnAddress.line3',
      'returnAddress.suburb',
      'returnAddress.postcode',
      'returnAddress.state',
      'returnAddress.searchText',
    ]);
  });

  it('matches exact names only when no prefixes are given', () => {
    const isBridged = createBridgedNamePredicate({ names: ['a', 'b'] });

    expect(isBridged('a')).toBe(true);
    expect(isBridged('b')).toBe(true);
    expect(isBridged('a.child')).toBe(false);
    expect(isBridged('c')).toBe(false);
  });

  it('matches every sub-path of a prefix but not the bare parent', () => {
    const isBridged = createBridgedNamePredicate({
      names: ['a'],
      prefixes: ['contact.', 'address.'],
    });

    expect(isBridged('contact.email')).toBe(true);
    expect(isBridged('address.line1')).toBe(true);
    expect(isBridged('contact')).toBe(false);
    expect(isBridged('other.field')).toBe(false);
  });
});
