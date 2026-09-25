import { Formik } from 'formik';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TextAreaInput from '@/components/Inputs/TextAreaInput';

const renderTextAreaInput = () => render(
    <Formik initialValues={{ notes: '' }} onSubmit={() => undefined}>
        <TextAreaInput label='Notes' name='notes' />
    </Formik>
);

describe('TextAreaInput', () => {
    it('preserves pasted multiline content', async () => {
        renderTextAreaInput();

        const input = screen.getByLabelText('Notes');
        const pastedValue = 'Line one\r\nLine two °|;';
        const normalizedValue = 'Line one\nLine two °|;';

        await act(async () => {
            fireEvent.paste(input);
            fireEvent.change(input, { target: { value: pastedValue } });
        });

        expect(input).toHaveValue(normalizedValue);
    });
});
