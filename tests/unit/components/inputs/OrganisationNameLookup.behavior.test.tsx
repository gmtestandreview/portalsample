import { act, fireEvent, render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import OrganisationNameLookup from '@/components/Inputs/OrganisationNameLookup';

vi.mock('@/components/Inputs/TextInput', () => ({
    default: ({ name, label, onChange, onKeyDown, inlineHelpTitle: _inlineHelpTitle, inlineHelp: _inlineHelp, containerClassName: _containerClassName, ...rest }: any) => (
        <div>
            <label htmlFor={name}>{label}</label>
            <input id={name} name={name} onChange={onChange} onKeyDown={onKeyDown} {...rest} />
        </div>
    ),
}));

const renderLookup = (props: Partial<React.ComponentProps<typeof OrganisationNameLookup>> = {}) =>
    render(
        <Formik initialValues={{ orgName: '', orgNameOptions: [], parentField: '' }} onSubmit={vi.fn()}>
            <OrganisationNameLookup name='orgName' label='Organisation' {...props} />
        </Formik>,
    );

describe('OrganisationNameLookup', () => {
    it('clears suggestions and hides the dropdown when optionsFieldName is undefined and input has 2+ characters', async () => {
        vi.useFakeTimers();
        renderLookup({ optionsFieldName: undefined });

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ac' } });

        await act(async () => { vi.advanceTimersByTime(350); });

        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        vi.useRealTimers();
    });
});
