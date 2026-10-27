import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AuthorisedAgent from '@/components/Inputs/AuthorisedAgent';

vi.mock(
  import('@/components/Inputs/TextInput'),
  (() =>
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
    }) satisfies __ExactMockModule<__TestMockModule29>) as unknown as __DynamicPartialMockFactory<__TestMockModule29>,
);

vi.mock(
  import('@/components/Inputs/NumberInput'),
  (() =>
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
    }) satisfies __ExactMockModule<__TestMockModule30>) as unknown as __DynamicPartialMockFactory<__TestMockModule30>,
);

vi.mock(
  import('@/components/Inputs/AddressLookup'),
  (() =>
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
    }) satisfies __ExactMockModule<__TestMockModule31>) as unknown as __DynamicPartialMockFactory<__TestMockModule31>,
);

describe('authorised agent behavior', () => {
  it('renders unprefixed manufacturer, ABN, and street address fields by default', () => {
    expect.hasAssertions();

    render(<AuthorisedAgent />);

    expect({
      manufacturerName: screen
        .getByTestId('text-input')
        .getAttribute('data-name'),
      abnName: screen.getByTestId('number-input').getAttribute('data-name'),
      abnFormat: screen.getByTestId('number-input').getAttribute('data-format'),
      leadingZeros: screen
        .getByTestId('number-input')
        .getAttribute('data-leading-zeros'),
      helperText: screen.getByText(
        'For Australian manufacturers, enter ABN (Australian Business Number)',
      ).textContent,
      addressHeading: screen.getByRole('heading', {
        name: 'Business street address',
      }).textContent,
      addressName: screen
        .getByTestId('address-lookup')
        .getAttribute('data-name'),
      addressMaxResults: screen
        .getByTestId('address-lookup')
        .getAttribute('data-max-results'),
      addressPlaceholder: screen
        .getByTestId('address-lookup')
        .getAttribute('data-placeholder'),
    }).toStrictEqual({
      manufacturerName: 'manufacturerName',
      abnName: 'abn',
      abnFormat: '## ### ### ###',
      leadingZeros: 'true',
      helperText:
        'For Australian manufacturers, enter ABN (Australian Business Number)',
      addressHeading: 'Business street address',
      addressName: 'streetAddress',
      addressMaxResults: '10',
      addressPlaceholder: 'Enter the main business address',
    });
  });

  it('prefixes child field names', () => {
    expect.hasAssertions();

    render(<AuthorisedAgent name='agent' isSummary />);

    expect({
      manufacturerName: screen
        .getByTestId('text-input')
        .getAttribute('data-name'),
      abnName: screen.getByTestId('number-input').getAttribute('data-name'),
      addressName: screen
        .getByTestId('address-lookup')
        .getAttribute('data-name'),
    }).toStrictEqual({
      manufacturerName: 'agent.manufacturerName',
      abnName: 'agent.abn',
      addressName: 'agent.streetAddress',
    });
  });

  it('forwards summary mode to child fields', () => {
    expect.hasAssertions();

    render(<AuthorisedAgent name='agent' isSummary />);

    expect({
      manufacturerSummary: screen
        .getByTestId('text-input')
        .getAttribute('data-summary'),
      abnSummary: screen
        .getByTestId('number-input')
        .getAttribute('data-summary'),
      addressSummary: screen
        .getByTestId('address-lookup')
        .getAttribute('data-summary'),
    }).toStrictEqual({
      manufacturerSummary: 'true',
      abnSummary: 'true',
      addressSummary: 'true',
    });
  });
});
