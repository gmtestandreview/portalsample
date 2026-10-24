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
  defaultValue: Record<string, string> = emptyAddress
) =>
  render(
    <FieldHarness field='address' defaultValue={defaultValue}>
      <RhfManualAddressInput name='address' {...props} />
    </FieldHarness>
  );

const formValue = () =>
  JSON.parse(screen.getByTestId('value').textContent) as Record<string, string>;

describe(RhfManualAddressInput, () => {
  it('renders every address field with its label', () => {
    renderManualAddress();

    ['Address line 1', 'Address line 2', 'Address line 3', 'Suburb'].forEach(
      (label) => {
        expect(screen.getByRole('textbox', { name: label })).toBeEnabled();
      }
    );

    expect(screen.getByRole('textbox', { name: 'Postcode' })).toBeEnabled();
    expect(screen.getByRole('combobox', { name: 'State' })).toBeEnabled();
  });

  it('offers a blank option followed by every state', () => {
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

  it('writes typed text and the chosen state under the address name', async () => {
    renderManualAddress();

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Address line 1' }),
      '1 Bourke St'
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Suburb' }),
      'Hay'
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Postcode' }),
      '2711'
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'State' }),
      'NSW'
    );

    expect(formValue()).toEqual({
      ...emptyAddress,
      line1: '1 Bourke St',
      suburb: 'Hay',
      postcode: '2711',
      state: 'NSW',
    });
  });

  it('shows the stored address values', () => {
    renderManualAddress(
      {},
      { ...emptyAddress, line2: 'Level 2', state: 'VIC' }
    );

    expect(screen.getByRole('textbox', { name: 'Address line 2' })).toHaveValue(
      'Level 2'
    );
    expect(screen.getByRole('combobox', { name: 'State' })).toHaveValue('VIC');
  });

  it('disables every field when disabled', () => {
    renderManualAddress({ disabled: true });

    [
      ...screen.getAllByRole('textbox'),
      screen.getByRole('combobox', { name: 'State' }),
    ].forEach((field) => expect(field).toBeDisabled());
  });

  it('repeats the inline help on every field', () => {
    renderManualAddress({ inlineHelp: 'Use the postal address' });

    expect(screen.getAllByText('Use the postal address')).toHaveLength(6);
  });
});
