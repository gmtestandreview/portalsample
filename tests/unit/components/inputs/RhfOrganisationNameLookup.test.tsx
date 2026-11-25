import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import RhfOrganisationNameLookup from '@/components/Inputs/RhfOrganisationNameLookup';

interface LookupValues {
  businessOrTradingName: string;
  orgNameOptions: { name: string }[];
}

const LookupHarness = ({ children }: Readonly<{ children: ReactNode }>) => {
  const methods = useForm<LookupValues>({
    defaultValues: {
      businessOrTradingName: '',
      orgNameOptions: [{ name: 'Acme Instruments' }],
    },
  });

  return (
    <FormProvider {...methods}>
      <form>{children}</form>
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

describe('RhfOrganisationNameLookup', () => {
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
});
