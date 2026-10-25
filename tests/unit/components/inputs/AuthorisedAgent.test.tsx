import { render, screen } from '@testing-library/react';

import { describe, expect, it, vi } from 'vitest';

import AuthorisedAgent from '@/components/Inputs/AuthorisedAgent';

vi.mock(
  import('@/components/Inputs/TextInput'),
  () =>
    ({
      default: ({
        name,
        label,
        isSummary,
      }: {
        name: string;
        label: string;
        isSummary?: boolean;
      }) => (
        <div
          data-testid='text-input'
          data-name={name}
          data-summary={String(Boolean(isSummary))}
        >
          {label}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule29>,
);

vi.mock(
  import('@/components/Inputs/NumberInput'),
  () =>
    ({
      default: ({
        name,
        label,
        format,
        allowLeadingZeros,
        inlineHelp,
        isSummary,
      }: {
        name: string;
        label: string;
        format: string;
        allowLeadingZeros?: boolean;
        inlineHelp?: string;
        isSummary?: boolean;
      }) => (
        <div
          data-testid='number-input'
          data-name={name}
          data-format={format}
          data-leading-zeros={String(Boolean(allowLeadingZeros))}
          data-summary={String(Boolean(isSummary))}
        >
          {label}
          <span>{inlineHelp}</span>
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule30>,
);

vi.mock(
  import('@/components/Inputs/AddressLookup'),
  () =>
    ({
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
    }) satisfies __ExactMockModule<__TestMockModule31>,
);

describe(AuthorisedAgent, () => {
  it('renders unprefixed manufacturer, ABN, and street address fields by default', () => {
    expect.assertions(1);
    render(<AuthorisedAgent />);
    expect(screen.getByTestId('text-input')).toHaveAttribute(
      'data-name',
      'manufacturerName',
    );
  });
});

describe(AuthorisedAgent, () => {
  it('renders unprefixed manufacturer, ABN, and street address fields by default', () => {
    expect.assertions(1);
    render(<AuthorisedAgent />);
    expect(screen.getByTestId('number-input')).toHaveAttribute(
      'data-name',
      'abn',
    );
  });
});

describe(AuthorisedAgent, () => {
  it('renders unprefixed manufacturer, ABN, and street address fields by default', () => {
    expect.assertions(1);
    render(<AuthorisedAgent />);
    expect(screen.getByTestId('number-input')).toHaveAttribute(
      'data-format',
      '## ### ### ###',
    );
  });
});

describe(AuthorisedAgent, () => {
  it('renders unprefixed manufacturer, ABN, and street address fields by default', () => {
    expect.assertions(1);
    render(<AuthorisedAgent />);
    expect(screen.getByTestId('number-input')).toHaveAttribute(
      'data-leading-zeros',
      'true',
    );
  });
});

describe(AuthorisedAgent, () => {
  it('renders unprefixed manufacturer, ABN, and street address fields by default', () => {
    expect.assertions(1);
    render(<AuthorisedAgent />);
    expect(
      screen.getByText(
        'For Australian manufacturers, enter ABN (Australian Business Number)',
      ),
    ).toBeInTheDocument();
  });
});
