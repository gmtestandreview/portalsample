import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import RhfAuthorisedAgent from '@/components/Inputs/RhfAuthorisedAgent';

vi.mock(import('@/components/Inputs/RhfAddressLookup'), (() => ({
  default: ({
    name,
    label,
    maxResults,
    placeholder,
    isSummary,
  }: {
    name: string;
    label: string;
    maxResults: number;
    placeholder: string;
    isSummary?: boolean;
  }) => (
    <div
      data-testid='address-lookup'
      data-name={name}
      data-max-results={maxResults}
      data-placeholder={placeholder}
      data-summary={String(Boolean(isSummary))}
    >
      {label}
    </div>
  ),
})) as never);

interface Values {
  agent?: { manufacturerName?: string; abn?: string };
  manufacturerName?: string;
  abn?: string;
}

const Harness = ({
  children,
  defaultValues = {},
}: Readonly<{ children: ReactNode; defaultValues?: Values }>) => {
  const methods = useForm<Values>({ defaultValues });
  return (
    <FormProvider {...methods}>
      <form>{children}</form>
      <output data-testid='values'>{JSON.stringify(methods.watch())}</output>
    </FormProvider>
  );
};

describe(RhfAuthorisedAgent, () => {
  it('writes unprefixed manufacturer name and formatted ABN by default', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    render(
      <Harness>
        <RhfAuthorisedAgent />
      </Harness>,
    );
    await user.type(screen.getByLabelText('Manufacturer name'), 'Acme');
    await user.type(screen.getByLabelText('Company Identifier'), '12345678901');

    expect(JSON.parse(screen.getByTestId('values').textContent)).toStrictEqual({
      manufacturerName: 'Acme',
      abn: '12 345 678 901',
    });
    expect(
      screen.getByText(
        'For Australian manufacturers, enter ABN (Australian Business Number)',
      ),
    ).toBeInTheDocument();
  });

  it('prefixes child field names and passes the address options', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    render(
      <Harness defaultValues={{ agent: { manufacturerName: 'Seed' } }}>
        <RhfAuthorisedAgent name='agent' />
      </Harness>,
    );

    expect(screen.getByLabelText('Manufacturer name')).toHaveValue('Seed');

    await user.type(screen.getByLabelText('Manufacturer name'), '!');

    expect(JSON.parse(screen.getByTestId('values').textContent)).toMatchObject({
      agent: { manufacturerName: 'Seed!' },
    });
    expect(
      screen.getByRole('heading', { name: 'Business street address' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('address-lookup')).toHaveAttribute(
      'data-name',
      'agent.streetAddress',
    );
    expect(screen.getByTestId('address-lookup')).toHaveAttribute(
      'data-max-results',
      '10',
    );
    expect(screen.getByTestId('address-lookup')).toHaveAttribute(
      'data-placeholder',
      'Enter the main business address',
    );
  });

  it('forwards summary mode to every child field', () => {
    expect.hasAssertions();

    render(
      <Harness
        defaultValues={{
          agent: { manufacturerName: 'Seed', abn: '12345678901' },
        }}
      >
        <RhfAuthorisedAgent name='agent' isSummary />
      </Harness>,
    );

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Seed')).toBeInTheDocument();
    expect(screen.getByTestId('address-lookup')).toHaveAttribute(
      'data-summary',
      'true',
    );
  });
});
