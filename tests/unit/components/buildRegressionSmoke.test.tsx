import { describe, it, expect } from 'vitest';
import * as yup from 'yup';

describe('build regression smoke coverage', () => {
  it('imports App with the root stylesheet path resolved', async () => {
    expect.hasAssertions();

    const module = await import('@/App');

    expect(module.default).toBeDefined();
  }, 60000);

  it.each([
    '@/components/Utilities/ContactLink',
    '@/components/Utilities/ViewPdfButton',
    '@/components/Utilities/ViewPdfQuoteTerms',
    '@/components/Utilities/mailingLabel',
  ])(
    'imports utility module %s with the print stylesheet path resolved',
    async (modulePath) => {
      expect.hasAssertions();

      const module = (await import(modulePath)) as Record<string, unknown>;

      expect(module['default']).toBeDefined();
    },
  );

  it.each([
    '@/routes/account/validation',
    '@/routes/contact/validation',
    '@/routes/requestForQuote/validation',
    '@/routes/acceptQuote/validation',
  ])(
    'imports validation module %s through the yup extension barrel',
    async (modulePath) => {
      expect.hasAssertions();

      vi.resetModules();

      const module = (await import(modulePath)) as Record<string, unknown>;

      expect(module).toBeDefined();

      const schema = yup.string();

      expect(schema.allowedFormat.bind(schema)).toBeTypeOf('function');

      expect(schema.fixedDigits.bind(schema)).toBeTypeOf('function');

      expect(schema.maxLength.bind(schema)).toBeTypeOf('function');

      expect(schema.minEntered.bind(schema)).toBeTypeOf('function');
    },
  );
});
