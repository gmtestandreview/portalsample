import { describe, it, expect } from 'vitest';

import * as yup from 'yup';

describe('build regression smoke coverage', () => {
  it('imports App with the root stylesheet path resolved', async () => {
    expect.assertions(1);
    const module = await import('@/App');

    expect(module.default).toBeDefined();
  }, 60000);
});

describe('build regression smoke coverage', () => {
  it.each([
    '@/components/Utilities/ContactLink',
    '@/components/Utilities/ViewPdfButton',
    '@/components/Utilities/ViewPdfQuoteTerms',
    '@/components/Utilities/mailingLabel',
  ])(
    'imports utility module %s with the print stylesheet path resolved',
    async (modulePath) => {
      expect.assertions(1);
      const module = await import(modulePath);

      expect(module.default).toBeDefined();
    },
  );
});
