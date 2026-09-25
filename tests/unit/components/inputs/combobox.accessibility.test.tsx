import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import AutoSuggest from '@/components/Inputs/AutoSuggest';
import AutoSuggestContainer from '@/components/Inputs/AutoSuggest/AutoSuggestContainer';
import type { AutoSuggestContainerProps } from '@/components/Inputs/AutoSuggest/types';
import OrganisationNameLookup from '@/components/Inputs/OrganisationNameLookup';
import { installUnexpectedConsoleGuard } from '../../../helpers/unexpectedConsoleGuard';

/**
 * Resolves the text React Aria's own label relationship points at.
 *
 * Applies only to React Aria owners (AutoSuggest). `getByRole('combobox',
 * { name })` also succeeds through the native `<label htmlFor>`/`id` echo, so
 * it cannot distinguish a named React Aria ComboBox from an unnamed one that
 * merely sits beside a native label. React Aria emits `aria-labelledby` only
 * once a `<Label>` has registered through `LabelContext`, so reading it proves
 * the widget itself carries the name.
 */
const reactAriaLabelText = (control: HTMLElement): string | null => {
    const labelledBy = control.getAttribute('aria-labelledby');

    if (labelledBy === null) return null;

    return labelledBy
        .split(' ')
        .map((id) => document.getElementById(id)?.textContent ?? '')
        .join(' ')
        .trim();
};

const renderWithFormik = (
    children: React.ReactNode,
    initialValues: Record<string, unknown> = {},
    fieldState: {
        initialErrors?: Record<string, string>;
        initialTouched?: Record<string, boolean>;
    } = {},
) => render(
    <Formik
        initialValues={initialValues}
        initialErrors={fieldState.initialErrors}
        initialTouched={fieldState.initialTouched}
        onSubmit={vi.fn()}
    >
        {children}
    </Formik>,
);

const suburbOptions = [
    { id: 'suburb-option-sydney', displayText: 'Sydney NSW', value: 'sydney' },
];

/** Every required prop, so each state case overrides only what it is naming. */
const baseSuburbProps: AutoSuggestContainerProps<string> = {
    name: 'suburb',
    label: 'Suburb',
    options: [],
    searchTerm: 'Syd',
    onSearchTermChange: vi.fn(),
    onCancel: vi.fn(),
    onSelectedOption: vi.fn(),
};

describe('Combobox accessibility', () => {
    installUnexpectedConsoleGuard();

    // Vitest runs `afterEach` hooks in reverse registration order, so the guard
    // above runs before the global cleanup in `vitest.setup.ts`. When the guard
    // throws, that cleanup never runs and the previous test's DOM leaks - two
    // elements then share `id="suburb"` and accessible-name computation breaks
    // for every later test. Registering cleanup after the guard runs it first.
    afterEach(cleanup);

    it('exposes AutoSuggest as a labelled input with keyboard navigation and listbox options', async () => {
        renderWithFormik(
            <AutoSuggestContainer
                name='suburb'
                label='Suburb'
                options={[
                    { id: 'suburb-option-sydney', displayText: 'Sydney NSW', value: 'sydney' },
                    { id: 'suburb-option-park', displayText: 'Sydney Olympic Park NSW', value: 'park' },
                ]}
                searchTerm='Syd'
                onSearchTermChange={vi.fn()}
                onCancel={vi.fn()}
                onSelectedOption={vi.fn()}
            />,
            { suburb: 'Syd' },
        );

        const user = userEvent.setup();
        const combobox = screen.getByRole('combobox', { name: 'Suburb' });
        expect(combobox.tagName).toBe('INPUT');
        expect(reactAriaLabelText(combobox)).toBe('Suburb');
        expect(combobox).toHaveAttribute('aria-expanded', 'false');

        await user.click(combobox);
        await user.keyboard('{ArrowDown}');

        await waitFor(() => {
            expect(combobox).toHaveAttribute('aria-expanded', 'true');
        });
        expect(combobox).toHaveAttribute('aria-controls', 'suburb-options');
        // React Aria names the popup with its own `listboxLabel` string followed
        // by the ComboBox's `Label`. Reintroducing an `aria-label` on the
        // ListBox would prepend the Formik field name ("suburb Suburb"), and
        // dropping the `Label` would leave only "Suggestions".
        expect(screen.getByRole('listbox', { name: 'Suggestions Suburb' }))
            .toHaveClass('suggestion-options');
        expect(screen.getAllByRole('option')).toHaveLength(2);
        expect(combobox).toHaveAttribute(
            'aria-activedescendant',
            'suburb-options-option-suburb-option-sydney',
        );
        expect(screen.getByRole('option', { name: /Sydney NSW \(1 of 2\)/ }))
            .toHaveClass('highlighted');
    });

    it('exposes OrganisationNameLookup as a labelled input combobox with active-descendant navigation', async () => {
        renderWithFormik(
            <OrganisationNameLookup
                name='organisationName'
                label='Organisation name'
                optionsFieldName='name'
            />,
            {
                organisationName: '',
                orgNameOptions: [
                    { name: 'ACME Calibration' },
                    { name: 'ACME Testing' },
                ],
            },
        );

        const user = userEvent.setup();
        // Not a React Aria owner: this combobox is a hand-rolled Bootstrap
        // ListGroup on a native input, so the native label association is the
        // correct naming mechanism and `reactAriaLabelText` does not apply.
        const combobox = screen.getByRole('combobox', { name: 'Organisation name' });
        expect(combobox.tagName).toBe('INPUT');

        await user.type(combobox, 'ac');
        await screen.findByRole('listbox', { name: 'Suggested options' });
        await user.keyboard('{ArrowDown}');

        await waitFor(() => {
            expect(combobox).toHaveAttribute('aria-expanded', 'true');
            expect(combobox).toHaveAttribute('aria-activedescendant', 'organisationName-option-0');
        });
        expect(screen.getByRole('option', { name: /ACME Calibration/ })).toHaveAttribute('aria-selected', 'true');
    });

    it.each([
        {
            state: 'loading',
            overrides: { loading: true },
            visibleMarker: 'Loading options',
        },
        {
            state: 'no results',
            overrides: { noResult: true },
            visibleMarker: 'No matches found',
        },
        {
            state: 'errored',
            overrides: { error: true },
            visibleMarker: 'Results could not be fetched',
        },
    ])(
        'names the AutoSuggest combobox through React Aria while $state',
        ({ overrides, visibleMarker }) => {
            renderWithFormik(
                <AutoSuggestContainer<string> {...baseSuburbProps} {...overrides} />,
                { suburb: 'Syd' },
            );

            expect(screen.getByText(visibleMarker)).toBeInTheDocument();

            const combobox = screen.getByRole('combobox', { name: 'Suburb' });
            expect(reactAriaLabelText(combobox)).toBe('Suburb');
        },
    );

    it('keeps the React Aria label through manual entry, results and cancellation', async () => {
        const getOptions = vi.fn().mockResolvedValue(suburbOptions);

        renderWithFormik(
            <AutoSuggest<string>
                name='suburb'
                label='Suburb'
                getOptions={getOptions}
                onSelectedOption={vi.fn()}
            />,
            { suburb: '' },
        );

        const user = userEvent.setup();
        const combobox = screen.getByRole('combobox', { name: 'Suburb' });
        expect(reactAriaLabelText(combobox)).toBe('Suburb');

        await user.type(combobox, 'Syd');

        await screen.findByRole('listbox', { name: 'Suggestions Suburb' });
        expect(combobox).toHaveValue('Syd');
        expect(reactAriaLabelText(combobox)).toBe('Suburb');

        await user.keyboard('{Escape}');

        await waitFor(() => {
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });
        expect(combobox).toHaveValue('');
        expect(reactAriaLabelText(combobox)).toBe('Suburb');
    });

    it('keeps the React Aria label while the field carries a validation error', () => {
        renderWithFormik(
            <AutoSuggestContainer<string>
                {...baseSuburbProps}
                searchTerm=''
                inlineHelp='Start typing a suburb'
            />,
            { suburb: '' },
            {
                initialErrors: { suburb: 'Suburb is required' },
                initialTouched: { suburb: true },
            },
        );

        const combobox = screen.getByRole('combobox', { name: 'Suburb' });
        expect(reactAriaLabelText(combobox)).toBe('Suburb');
        expect(combobox).toHaveAttribute('aria-invalid', 'true');
        expect(combobox).toHaveAccessibleDescription(/Start typing a suburb/);
        expect(combobox).toHaveAccessibleDescription(/Suburb is required/);
    });
});
