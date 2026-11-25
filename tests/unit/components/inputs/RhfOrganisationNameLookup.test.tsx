import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RhfOrganisationNameLookup from '@/components/Inputs/RhfOrganisationNameLookup';

interface LookupValues {
  businessOrTradingName?: string;
  orgNameOptions?: { name: string; parent?: string }[];
  parentField?: string;
}

const defaultValues: LookupValues = {
  businessOrTradingName: '',
  orgNameOptions: [{ name: 'Acme Instruments' }],
};

const LookupHarness = ({
  children,
  values = defaultValues,
}: Readonly<{ children: ReactNode; values?: LookupValues }>) => {
  const methods = useForm<LookupValues>({ defaultValues: values });

  return (
    <FormProvider {...methods}>
      <form>{children}</form>
      <button
        type='button'
        onClick={() => {
          methods.setValue('businessOrTradingName', undefined);
        }}
      >
        Unset name
      </button>
      <output data-testid='business-name'>
        {methods.watch('businessOrTradingName')}
      </output>
      <output data-testid='touched'>
        {methods.formState.touchedFields.businessOrTradingName
          ? 'touched'
          : 'untouched'}
      </output>
    </FormProvider>
  );
};

const renderLookup = () =>
  render(
    <LookupHarness>
      <RhfOrganisationNameLookup
        name='businessOrTradingName'
        label='Business or trading name'
        optionsFieldName='name'
      />
    </LookupHarness>,
  );

const getInput = () =>
  screen.getByRole('combobox', { name: 'Business or trading name' });

const settleDebounce = () => {
  act(() => {
    vi.advanceTimersByTime(400);
  });
};

describe(RhfOrganisationNameLookup, () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes typed free text to the RHF field before a suggestion is selected', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    renderLookup();
    await user.type(getInput(), 'Acme');

    expect(screen.getByTestId('business-name')).toHaveTextContent('Acme');
    expect(screen.getByTestId('touched')).toHaveTextContent('untouched');
  });

  it('marks the field touched when the input loses focus', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    renderLookup();
    await user.type(getInput(), 'Acme');

    expect(screen.getByTestId('touched')).toHaveTextContent('untouched');

    await user.tab();

    expect(screen.getByTestId('touched')).toHaveTextContent('touched');
  });

  it('filters and selects an option with the full display value', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    renderLookup();
    await user.type(getInput(), 'Acme');

    const option = await screen.findByRole('option', {
      name: /Acme Instruments/,
    });
    await user.click(option);

    expect(screen.getByTestId('business-name')).toHaveTextContent(
      'Acme Instruments',
    );
  });

  it('clears the RHF value and suggestions when the input is emptied', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    renderLookup();
    await user.type(getInput(), 'Acme');
    await screen.findByRole('option', { name: /Acme Instruments/ });

    await user.clear(getInput());

    expect(screen.getByTestId('business-name')).toBeEmptyDOMElement();

    await waitFor(() => {
      expect(screen.queryByRole('option')).not.toBeInTheDocument();
    });
  });

  it('keeps the same suggestions when the search text changes without changing the matches', async () => {
    expect.hasAssertions();

    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ delay: null });
    renderLookup();
    await user.type(getInput(), 'Acme');
    settleDebounce();

    expect(screen.getAllByRole('option')).toHaveLength(1);

    await user.type(getInput(), ' ');
    settleDebounce();

    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('closes the suggestions on Escape and keeps the typed text', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    renderLookup();
    await user.type(getInput(), 'Acme');
    await screen.findByRole('option', { name: /Acme Instruments/ });
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('option')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('business-name')).toHaveTextContent('Acme');
  });

  it('keeps the typed text when Enter is pressed without a highlighted option', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    renderLookup();
    await user.type(getInput(), 'Acme');
    await screen.findByRole('option', { name: /Acme Instruments/ });
    await user.keyboard('{Enter}');

    expect(screen.getByTestId('business-name')).not.toBeEmptyDOMElement();
  });

  it('offers no suggestions without an options field name', async () => {
    expect.hasAssertions();

    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ delay: null });
    render(
      <LookupHarness>
        <RhfOrganisationNameLookup
          name='businessOrTradingName'
          label='Business or trading name'
        />
      </LookupHarness>,
    );
    await user.type(getInput(), 'Acme');
    settleDebounce();

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(screen.getByTestId('business-name')).toHaveTextContent('Acme');
  });

  it('copes with missing options and a missing value, using the default label', async () => {
    expect.hasAssertions();

    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ delay: null });
    render(
      <LookupHarness values={{}}>
        <RhfOrganisationNameLookup
          name='businessOrTradingName'
          optionsFieldName='name'
        />
      </LookupHarness>,
    );
    const input = screen.getByRole('combobox', { name: 'Organisation name' });
    await user.type(input, 'Acme');
    settleDebounce();

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('filters by the parent value when a parent field is configured', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    render(
      <LookupHarness
        values={{
          businessOrTradingName: '',
          parentField: 'Parent One',
          orgNameOptions: [
            { name: 'Branch A', parent: 'Parent One' },
            { name: 'Branch B', parent: 'Parent Two' },
          ],
        }}
      >
        <RhfOrganisationNameLookup
          name='businessOrTradingName'
          label='Business or trading name'
          optionsFieldName='name'
          parentName='parentField'
          parentOptionsName='parent'
        />
      </LookupHarness>,
    );
    await user.type(getInput(), 'Branch');

    await expect(
      screen.findByRole('option', { name: /Branch A/ }),
    ).resolves.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Branch B/ })).toBeNull();
  });

  it('renders inline help with and without a title', () => {
    expect.hasAssertions();

    const { unmount } = render(
      <LookupHarness>
        <RhfOrganisationNameLookup
          name='businessOrTradingName'
          label='Business or trading name'
          inlineHelpTitle='Title only'
        />
      </LookupHarness>,
    );

    expect(screen.getByText('Title only')).toBeInTheDocument();

    unmount();
    const withBoth = render(
      <LookupHarness>
        <RhfOrganisationNameLookup
          name='businessOrTradingName'
          label='Business or trading name'
          inlineHelpTitle='Help title'
          inlineHelp='Help body'
        />
      </LookupHarness>,
    );

    expect(screen.getByText(/Help body/)).toBeInTheDocument();

    withBoth.unmount();
    render(
      <LookupHarness>
        <RhfOrganisationNameLookup
          name='businessOrTradingName'
          label='Business or trading name'
          inlineHelp='Untitled help'
        />
      </LookupHarness>,
    );

    expect(screen.getByText('Untitled help')).toBeInTheDocument();
  });

  it('empties the search box when the value is unset from outside', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    renderLookup();
    await user.type(getInput(), 'Acme');
    await user.click(screen.getByText('Unset name'));

    await waitFor(() => {
      expect(getInput()).toHaveValue('');
    });
  });
});
