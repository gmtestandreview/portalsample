import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import RhfRadioButton from '@/components/Inputs/RhfRadioButton';
import { FieldHarness } from './rhfTestHarness';

interface Values {
  kind: unknown;
}

const Harness = ({
  defaultValue,
  children,
}: Readonly<{ defaultValue: unknown; children: ReactNode }>) => (
  <FieldHarness<Values> field='kind' defaultValue={defaultValue}>
    {children}
  </FieldHarness>
);

describe('rhf radio button behavior', () => {
  it('is checked only when the field value matches as a string', () => {
    expect.hasAssertions();

    render(
      <Harness defaultValue={true}>
        <RhfRadioButton id='r-yes' name='kind' label='Yes' value />
        <RhfRadioButton id='r-no' name='kind' label='No' value={false} />
      </Harness>,
    );

    expect(screen.getByLabelText('Yes')).toBeChecked();
    expect(screen.getByLabelText('No')).not.toBeChecked();
  });

  it('is unchecked for undefined, null and empty values', () => {
    expect.hasAssertions();

    render(
      <Harness defaultValue={undefined}>
        <RhfRadioButton id='r-a' name='kind' label='A' value='a' />
      </Harness>,
    );

    expect(screen.getByLabelText('A')).not.toBeChecked();
  });

  it.each([null, ''])('is unchecked for %j', (value) => {
    expect.hasAssertions();

    render(
      <Harness defaultValue={value}>
        <RhfRadioButton id='r-a' name='kind' label='A' value='a' />
      </Harness>,
    );

    expect(screen.getByLabelText('A')).not.toBeChecked();
  });

  it('writes the typed option value and then calls onChange', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const onChange = vi.fn<(value: boolean) => void>();
    render(
      <Harness defaultValue={undefined}>
        <RhfRadioButton
          id='r-yes'
          name='kind'
          label='Yes'
          value
          onChange={onChange}
        />
        <RhfRadioButton id='r-no' name='kind' label='No' value={false} />
      </Harness>,
    );

    await user.click(screen.getByLabelText('No'));

    expect(screen.getByTestId('value')).toHaveTextContent('false');

    await user.click(screen.getByLabelText('Yes'));

    expect(screen.getByTestId('value')).toHaveTextContent('true');
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('renders descriptor, disabled state and the sub field', () => {
    expect.hasAssertions();

    render(
      <Harness defaultValue='a'>
        <RhfRadioButton
          id='r-a'
          name='kind'
          label='A'
          value='a'
          descriptor='Details'
          disabled
          subFormField={<span>Nested</span>}
        />
      </Harness>,
    );

    expect(screen.getByTestId('r-a')).toHaveClass('flex-column');
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByLabelText(/A/)).toBeDisabled();
    expect(screen.getByLabelText(/A/)).toHaveAttribute(
      'aria-controls',
      'r-a-sub-field',
    );
    expect(screen.getByText('Nested')).toBeInTheDocument();
  });

  it('omits aria-controls and sub field container without a sub field', () => {
    expect.hasAssertions();

    render(
      <Harness defaultValue='a'>
        <RhfRadioButton id='r-a' name='kind' label='A' value='a' />
      </Harness>,
    );

    expect(screen.getByLabelText('A')).not.toHaveAttribute('aria-controls');
    expect(document.querySelector('.subform-field-container')).toBeNull();
  });
});
