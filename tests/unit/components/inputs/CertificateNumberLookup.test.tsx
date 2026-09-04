import { act, render, screen } from '@testing-library/react';
import { Form, Formik } from 'formik';
import {
    afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import CertificateNumberLookup from '@/components/Inputs/CertificateNumberLookup';

const DEBOUNCE_MS = 300;

const renderLookup = () => render(
    <Formik
        initialValues={{ certNumber: '', certNumberId: '', certNameOptions: [] }}
        onSubmit={async () => {}}
    >
        <Form>
            <CertificateNumberLookup
                name='certNumber'
                idName='certNumberId'
                optionsFieldName='lookupName'
                label='Certificate number'
            />
        </Form>
    </Formik>,
);

describe('CertificateNumberLookup debounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('holds the existing empty suggestion list when the debounce fires on an empty input', () => {
        renderLookup();

        // The applicationAndInstrument step renders two of these, and each one arms this timer on
        // mount with an empty input. Returning `prev` rather than a fresh `[]` is what stops that
        // committing an identical render per instance - a new array literal is never referentially
        // equal, so React would treat the no-op as a change.
        act(() => {
            vi.advanceTimersByTime(DEBOUNCE_MS);
        });

        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
});
