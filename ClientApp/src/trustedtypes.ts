import DOMPurify from 'dompurify';

export class TrustedTypes {
    static readonly createTrustedTypePolicy = () => {
        const { trustedTypes } = globalThis as typeof globalThis & { trustedTypes?: TrustedTypePolicyFactory };
        if (trustedTypes) { // Feature testing
            trustedTypes.createPolicy('default', {
                createScriptURL: (toEscape) => DOMPurify.sanitize(toEscape),
                createHTML: (toEscape) => DOMPurify.sanitize(toEscape),
                createScript: (): string => { throw new Error('Inline script creation is not allowed by the NMI TrustedTypes policy.'); },
            });
        }
    };
}

export default TrustedTypes;
