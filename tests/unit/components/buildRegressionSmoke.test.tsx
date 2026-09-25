import * as yup from 'yup';

describe('build regression smoke coverage', () => {
    it('imports App with the root stylesheet path resolved', async () => {
        const module = await import('@/App');

        expect(module.default).toBeDefined();
    }, 60000);

    it.each([
        '@/components/Utilities/ContactLink',
        '@/components/Utilities/ViewPdfButton',
        '@/components/Utilities/ViewPdfQuoteTerms',
        '@/components/Utilities/mailingLabel',
    ])('imports utility module %s with the print stylesheet path resolved', async (modulePath) => {
        const module = await import(modulePath);

        expect(module.default).toBeDefined();
    });

    it.each([
        '@/routes/account/validation',
        '@/routes/contact/validation',
        '@/routes/requestForQuote/validation',
        '@/routes/acceptQuote/validation',
    ])('imports validation module %s through the yup extension barrel', async (modulePath) => {
        vi.resetModules();

        const module = await import(modulePath);

        expect(module).toBeDefined();
        expect(typeof yup.string().allowedFormat).toBe('function');
        expect(typeof yup.string().fixedDigits).toBe('function');
        expect(typeof yup.string().maxLength).toBe('function');
        expect(typeof yup.string().minEntered).toBe('function');
    });
});
