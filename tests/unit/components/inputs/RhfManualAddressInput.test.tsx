import userEvent from '@testing-library/user-event';

import { render, screen } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import RhfManualAddressInput from '@/components/Inputs/RhfAddressLookup/RhfManualAddressInput';

import { FieldHarness } from './rhfTestHarness';

const emptyAddress = {
  line1: '',
  line2: '',
  line3: '',
  suburb: '',
  postcode: '',
  state: '',
};

const renderManualAddress = (
  props: Partial<Parameters<typeof RhfManualAddressInput>[0]> = {},
  defaultValue: Record<string, string> = emptyAddress,
) =>
  render(
    <FieldHarness field='address' defaultValue={defaultValue}>
      <RhfManualAddressInput name='address' {...props} />
    </FieldHarness>,
  );

const formValue = () =>
  JSON.parse(screen.getByTestId('value').textContent) as Record<string, string>;

describe(RhfManualAddressInput, () => {
  it('renders every address field with its label', () => {
    expect.assertions(3);
    renderManualAddress();

    ['Address line 1', 'Address line 2', 'Address line 3', 'Suburb'].forEach(
      (label) => {
        expect(screen.getByRole('textbox', { name: label })).toBeEnabled();
      },
    );

    expect(screen.getByRole('textbox', { name: 'Postcode' })).toBeEnabled();
    expect(screen.getByRole('combobox', { name: 'State' })).toBeEnabled();
  });
});

describe(RhfManualAddressInput, () => {
  it('offers a blank option followed by every state', () => {
    expect.assertions(1);
    renderManualAddress();

    const options = screen
      .getAllByRole('option')
      .map((option) => option.textContent);

    expect(options).toEqual([
      'Please select',
      'ACT',
      'NSW',
      'VIC',
      'QLD',
      'WA',
      'NT',
      'SA',
      'TAS',
    ]);
  });
});

describe(RhfManualAddressInput, () => {
  it('writes typed text and the chosen state under the address name', async () => {
    expect.assertions(1);
    renderManualAddress();

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Address line 1' }),
      '1 Bourke St',
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Suburb' }),
      'Hay',
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Postcode' }),
      '2711',
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'State' }),
      'NSW',
    );

    expect(formValue()).toEqual({
      ...emptyAddress,
      line1: '1 Bourke St',
      suburb: 'Hay',
      postcode: '2711',
      state: 'NSW',
    });
  });
});
