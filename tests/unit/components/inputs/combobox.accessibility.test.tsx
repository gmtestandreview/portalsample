import { describe, afterEach, it, expect } from 'vitest';

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
) =>
  render(
    <Formik
      initialValues={initialValues}
      {...(fieldState.initialErrors === undefined
        ? {}
        : { initialErrors: fieldState.initialErrors })}
      {...(fieldState.initialTouched === undefined
        ? {}
        : { initialTouched: fieldState.initialTouched })}
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

describe('combobox accessibility', () => {
  installUnexpectedConsoleGuard();
  afterEach(cleanup);
  it('exposes AutoSuggest as a labelled input with keyboard navigation and listbox options', async () => {
    expect.assertions(1);
    renderWithFormik(
      <AutoSuggestContainer
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
        onSearchTermChange={vi.fn()}
        onCancel={vi.fn()}
        onSelectedOption={vi.fn()}
      />,
      { suburb: 'Syd' },
    );
    const user = userEvent.setup();
    const combobox = screen.getByRole('combobox', { name: 'Suburb' });
    expect(combobox.tagName).toBe('INPUT');
  });
});

describe('combobox accessibility', () => {
  installUnexpectedConsoleGuard();
  afterEach(cleanup);
  it('exposes AutoSuggest as a labelled input with keyboard navigation and listbox options', async () => {
    expect.assertions(1);
    renderWithFormik(
      <AutoSuggestContainer
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
        onSearchTermChange={vi.fn()}
        onCancel={vi.fn()}
        onSelectedOption={vi.fn()}
      />,
      { suburb: 'Syd' },
    );
    const user = userEvent.setup();
    const combobox = screen.getByRole('combobox', { name: 'Suburb' });
    expect(reactAriaLabelText(combobox)).toBe('Suburb');
  });
});

describe('combobox accessibility', () => {
  installUnexpectedConsoleGuard();
  afterEach(cleanup);
  it('exposes AutoSuggest as a labelled input with keyboard navigation and listbox options', async () => {
    expect.assertions(1);
    renderWithFormik(
      <AutoSuggestContainer
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
        onSearchTermChange={vi.fn()}
        onCancel={vi.fn()}
        onSelectedOption={vi.fn()}
      />,
      { suburb: 'Syd' },
    );
    const user = userEvent.setup();
    const combobox = screen.getByRole('combobox', { name: 'Suburb' });
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('combobox accessibility', () => {
  installUnexpectedConsoleGuard();
  afterEach(cleanup);
  it('exposes AutoSuggest as a labelled input with keyboard navigation and listbox options', async () => {
    expect.assertions(1);
    renderWithFormik(
      <AutoSuggestContainer
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
        onSearchTermChange={vi.fn()}
        onCancel={vi.fn()}
        onSelectedOption={vi.fn()}
      />,
      { suburb: 'Syd' },
    );
    const user = userEvent.setup();
    const combobox = screen.getByRole('combobox', { name: 'Suburb' });
    await user.click(combobox);
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });
  });
});

describe('combobox accessibility', () => {
  installUnexpectedConsoleGuard();
  afterEach(cleanup);
  it('exposes AutoSuggest as a labelled input with keyboard navigation and listbox options', async () => {
    expect.assertions(1);
    renderWithFormik(
      <AutoSuggestContainer
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
        onSearchTermChange={vi.fn()}
        onCancel={vi.fn()}
        onSelectedOption={vi.fn()}
      />,
      { suburb: 'Syd' },
    );
    const user = userEvent.setup();
    const combobox = screen.getByRole('combobox', { name: 'Suburb' });
    await user.click(combobox);
    await user.keyboard('{ArrowDown}');
    expect(combobox).toHaveAttribute('aria-controls', 'suburb-options');
  });
});
