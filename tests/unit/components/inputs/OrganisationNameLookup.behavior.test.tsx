import { act, fireEvent, render, screen } from '@testing-library/react';
import { Profiler } from 'react';
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

    /**
     * The debounce fires 300ms after mount whether or not anything can change.
     * With an empty input it called `setFilteredSuggestions([])`, and a fresh
     * array literal is never referentially equal to the previous one, so React
     * committed a render that produced identical output - once per lookup
     * instance, on every mount, in production as well as in tests.
     *
     * In Storybook that render landed after the owning story had finished,
     * which is how this surfaced: `An update to OrganisationNameLookup inside
     * a test was not wrapped in act(...)`, attributed to whichever story
     * happened to be running when the timer fired.
     *
     * Profiler counts real commits of the subtree, so this asserts the absence
     * of the render itself rather than the absence of the warning.
     */
    it('does not re-render when the debounce fires with an empty input', async () => {
        vi.useFakeTimers();
        const onRender = vi.fn();
        render(
            <Profiler id='lookup' onRender={onRender}>
                <Formik initialValues={{ orgName: '', orgNameOptions: [], parentField: '' }} onSubmit={vi.fn()}>
                    <OrganisationNameLookup name='orgName' label='Organisation' optionsFieldName='tradingName' />
                </Formik>
            </Profiler>,
        );
        onRender.mockClear();

        await act(async () => { vi.advanceTimersByTime(350); });

        expect(onRender).not.toHaveBeenCalled();
        vi.useRealTimers();
    });
});
