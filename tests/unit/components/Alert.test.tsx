import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlertSuccess } from '../../../ClientApp/src/components/Alert';

describe('Alert variants', () => {
    it('falls back to polite aria-live when the prop is explicitly overridden to undefined', () => {
        const { getByRole } = render(
            // Spread after the hardcoded ariaLive='polite' inside AlertSuccess, so
            // an explicit undefined here overrides it and triggers the || 'polite' fallback.
            <AlertSuccess ariaLive={undefined as any}>Fallback</AlertSuccess>,
        );

        expect(getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    });
});
