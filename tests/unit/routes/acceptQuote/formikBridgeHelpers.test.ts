import { describe, expect, it } from 'vitest';

import {
  addressTouchPaths,
  createBridgedNamePredicate,
  NO_HIDDEN_RULES,
} from '@/routes/acceptQuote/formikBridgeHelpers';

describe('formikBridgeHelpers', () => {
  it('exposes an empty hidden-rules object', () => {
    expect.assertions(1);
    expect(NO_HIDDEN_RULES).toEqual({});
  });
});

describe('formikBridgeHelpers', () => {
  it('prefixes every address leaf path', () => {
    expect.assertions(1);
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
});
