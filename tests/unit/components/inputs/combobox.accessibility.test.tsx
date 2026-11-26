import { describe, it, expect } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import RhfAutoSuggest from '@/components/Inputs/RhfAutoSuggest';
import RhfAutoSuggestContainer from '@/components/Inputs/RhfAutoSuggest/RhfAutoSuggestContainer';
import type {
  AutoSuggestContainerProps,
  AutoSuggestProps,
} from '@/components/Inputs/AutoSuggest/types';
import RhfOrganisationNameLookup from '@/components/Inputs/RhfOrganisationNameLookup';
import { installUnexpectedConsoleGuard } from '../../../helpers/unexpectedConsoleGuard';
import { FieldHarness, createFormHandle } from './rhfTestHarness';

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

const Harness = ({
  children,
  defaultValues,
}: Readonly<{
  children: React.ReactNode;
  defaultValues: Record<string, unknown>;
}>) => {
  const methods = useForm({ defaultValues });

  return (
    <FormProvider {...methods}>
      <form>{children}</form>
    </FormProvider>
  );
};

const renderWithForm = (
  children: React.ReactNode,
  defaultValues: Record<string, unknown> = {},
) => render(<Harness defaultValues={defaultValues}>{children}</Harness>);

const suburbOptions = [
  { id: 'suburb-option-sydney', displayText: 'Sydney NSW', value: 'sydney' },
];

/** Every required prop, so each state case overrides only what it is naming. */
const baseSuburbProps: AutoSuggestContainerProps<string> = {
  name: 'suburb',
  label: 'Suburb',
  options: [],
  searchTerm: 'Syd',
  onSearchTermChange:
    vi.fn<AutoSuggestContainerProps<string>['onSearchTermChange']>(),
  onCancel: vi.fn<AutoSuggestContainerProps<string>['onCancel']>(),
  onSelectedOption:
    vi.fn<AutoSuggestContainerProps<string>['onSelectedOption']>(),
};

const expectComboboxResults = () => {
  expect(screen.getByRole('combobox', { name: 'Suburb' })).toHaveAttribute(
    'aria-controls',
    'suburb-options',
  );
  expect(
    screen.getByRole('listbox', { name: 'Suggestions Suburb' }),
  ).toHaveClass('suggestion-options');
  expect(screen.getAllByRole('option')).toHaveLength(2);
  expect(screen.getByRole('combobox', { name: 'Suburb' })).toHaveAttribute(
    'aria-activedescendant',
    'suburb-options-option-suburb-option-sydney',
  );
  expect(
    screen.getByRole('option', { name: /Sydney NSW \(1 of 2\)/ }),
  ).toHaveClass('highlighted');
};

const expectCancelledCombobox = (combobox: HTMLElement) => {
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  expect(combobox).toHaveValue('');
  expect(reactAriaLabelText(combobox)).toBe('Suburb');
};

describe('combobox accessibility', () => {
  // This helper intentionally registers Vitest lifecycle hooks for the console guard.
  installUnexpectedConsoleGuard();

  it('exposes AutoSuggest as a labelled input with keyboard navigation and listbox options', async () => {
    expect.hasAssertions();

    cleanup();

    renderWithForm(
      <RhfAutoSuggestContainer
        name='suburb'
        label='Suburb'
        options={[
          {
            id: 'suburb-option-sydney',
            displayText: 'Sydney NSW',
            value: 'sydney',
          },
          {
            id: 'suburb-option-park',
            displayText: 'Sydney Olympic Park NSW',
            value: 'park',
          },
        ]}
        searchTerm='Syd'
        onSearchTermChange={vi.fn<
          AutoSuggestContainerProps<string>['onSearchTermChange']
        >()}
        onCancel={vi.fn<AutoSuggestContainerProps<string>['onCancel']>()}
        onSelectedOption={vi.fn<
          AutoSuggestContainerProps<string>['onSelectedOption']
        >()}
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

    expectComboboxResults();
  });

  it('exposes OrganisationNameLookup as a labelled input combobox with active-descendant navigation', async () => {
    expect.hasAssertions();

    cleanup();

    renderWithForm(
      <RhfOrganisationNameLookup
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
    // The migrated lookup renders through the React Aria ComboBox, so the
    // widget itself carries the name rather than a native label echo.
    const combobox = screen.getByRole('combobox', {
      name: 'Organisation name',
    });

    expect(combobox.tagName).toBe('INPUT');
    expect(reactAriaLabelText(combobox)).toBe('Organisation name');

    await user.type(combobox, 'ac');
    await screen.findByRole('listbox', {
      name: 'Suggestions Organisation name',
    });
    await user.keyboard('{ArrowDown}');

    const firstOption = screen.getByRole('option', {
      name: /ACME Calibration/,
    });

    await waitFor(() => {
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
      expect(combobox).toHaveAttribute('aria-activedescendant', firstOption.id);
    });

    expect(firstOption).toHaveClass('highlighted');
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
      expect.hasAssertions();

      renderWithForm(
        <RhfAutoSuggestContainer<string> {...baseSuburbProps} {...overrides} />,
        {
          suburb: 'Syd',
        },
      );

      expect(screen.getByText(visibleMarker)).toBeInTheDocument();

      const combobox = screen.getByRole('combobox', { name: 'Suburb' });

      expect(reactAriaLabelText(combobox)).toBe('Suburb');
    },
  );

  it('keeps the React Aria label through manual entry, results and cancellation', async () => {
    expect.hasAssertions();

    cleanup();

    const getOptions = vi
      .fn<NonNullable<AutoSuggestProps<string>['getOptions']>>()
      .mockResolvedValue(suburbOptions);

    renderWithForm(
      <RhfAutoSuggest<string>
        name='suburb'
        label='Suburb'
        getOptions={getOptions}
        onSelectedOption={vi.fn<
          NonNullable<AutoSuggestProps<string>['onSelectedOption']>
        >()}
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

    expectCancelledCombobox(combobox);
  });

  it('keeps the React Aria label while the field carries a validation error', async () => {
    expect.hasAssertions();

    cleanup();

    const resolver: Resolver<{ suburb: string }> = () => ({
      values: {},
      errors: {
        suburb: { type: 'required', message: 'Suburb is required' },
      },
    });
    const form = createFormHandle<{ suburb: string }>();

    render(
      <FieldHarness
        field='suburb'
        defaultValue=''
        resolver={resolver}
        form={form}
      >
        <RhfAutoSuggestContainer<string>
          {...baseSuburbProps}
          searchTerm=''
          inlineHelp='Start typing a suburb'
        />
      </FieldHarness>,
    );
    await form.submit();

    const combobox = screen.getByRole('combobox', { name: 'Suburb' });

    expect(reactAriaLabelText(combobox)).toBe('Suburb');
    expect(combobox).toHaveAttribute('aria-invalid', 'true');
    expect(combobox).toHaveAccessibleDescription(/Start typing a suburb/);
    expect(combobox).toHaveAccessibleDescription(/Suburb is required/);
  });
});
