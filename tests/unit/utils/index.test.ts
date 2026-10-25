import { afterEach, describe, expect, it, vi } from 'vitest';

import * as utils from '../../../ClientApp/src/utils';

describe('utils exports', () => {
  it('exports each runtime utility function', () => {
    expect.assertions(1);
    expect(utils.sleep).toBeTypeOf('function');
  });
});

describe('utils exports', () => {
  it('exports each runtime utility function', () => {
    expect.assertions(1);
    expect(utils.removeAllWhitespaces).toBeTypeOf('function');
  });
});

describe('utils exports', () => {
  it('exports each runtime utility function', () => {
    expect.assertions(1);
    expect(utils.containsWhitespace).toBeTypeOf('function');
  });
});

describe('utils exports', () => {
  it('exports each runtime utility function', () => {
    expect.assertions(1);
    expect(utils.removeEmptyKeys).toBeTypeOf('function');
  });
});

describe('utils exports', () => {
  it('exports each runtime utility function', () => {
    expect.assertions(1);
    expect(utils.tail).toBeTypeOf('function');
  });
});
