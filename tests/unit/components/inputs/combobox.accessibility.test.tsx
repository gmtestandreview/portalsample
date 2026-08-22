import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import AutoSuggestContainer from '@/components/Inputs/AutoSuggest/AutoSuggestContainer';
import OrganisationNameLookup from '@/components/Inputs/OrganisationNameLookup';

const renderWithFormik = (
    children: React.ReactNode,
    initialValues: Record<string, unknown> = {},
) => render(
    <Formik initialValues={initialValues} onSubmit={vi.fn()}>
        {children}
    </Formik>,
);

describe('Combobox accessibility', () => {
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
        expect(combobox).toHaveAttribute('aria-expanded', 'false');

        await user.click(combobox);
        await user.keyboard('{ArrowDown}');

        await waitFor(() => {
            expect(combobox).toHaveAttribute('aria-expanded', 'true');
        });
        expect(combobox).toHaveAttribute('aria-controls', 'suburb-options');
        expect(screen.getByRole('listbox', { name: 'suburb' })).toHaveClass('suggestion-options');
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
});
