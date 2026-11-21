import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { useRhfFieldA11y } from '@/components/Inputs/useRhfFieldA11y';

interface Values {
  name: string;
}

const AdapterConsumer = () => {
  const {
    fieldName,
    fieldValue,
    fieldRef,
    onFieldChange,
    onFieldBlur,
    controlId,
    describedBy,
  } = useRhfFieldA11y({ name: 'name', inlineHelp: 'Legal name' });

  return (
    <>
      <input
        ref={fieldRef}
        id={controlId}
        name={fieldName}
        value={typeof fieldValue === 'string' ? fieldValue : ''}
        aria-describedby={describedBy}
        onChange={(event) => {
          onFieldChange(event.target.value);
        }}
        onBlur={onFieldBlur}
      />
      <output data-testid='value'>{String(fieldValue)}</output>
    </>
  );
};

const Harness = () => {
  const methods = useForm<Values>({
    defaultValues: { name: 'Acme' },
  });

  return (
    <FormProvider {...methods}>
      <AdapterConsumer />
    </FormProvider>
  );
};

describe(useRhfFieldA11y, function useRhfFieldA11yTests() {
  it('exposes named values and handlers for a controlled input', async () => {
    expect.hasAssertions();

    render(<Harness />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('id', 'name');
    expect(input).toHaveAttribute('name', 'name');
    expect(input).toHaveAttribute('aria-describedby', 'help-name');
    expect(input).toHaveValue('Acme');

    await userEvent.clear(input);
    await userEvent.type(input, 'New name');

    expect(screen.getByTestId('value')).toHaveTextContent('New name');
  });
});
