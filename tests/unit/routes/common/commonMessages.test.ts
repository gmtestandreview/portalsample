import { describe, expect, it } from 'vitest';
import { errorMessages } from '@/routes/common/commonMessages';

describe('common error messages', () => {
    it('exposes save failure messages for handled dashboard HTTP error outcomes', () => {
        expect(errorMessages).toEqual({
            conflict: 'Another person has already saved this page. Your Changes have not been saved',
            forbidden: 'We are unable to process your request. Your changes have not been saved. Please contact support.',
            unprocessable: 'Another person has already submitted this form.',
        });
    });
});
