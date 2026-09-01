import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AuthorisedAgent from '@/components/Inputs/AuthorisedAgent';

vi.mock('@/components/Inputs/TextInput', () => ({
    default: ({ name, label, isSummary }: { name: string; label: string; isSummary?: boolean }) => (
        <div data-testid='text-input' data-name={name} data-summary={String(Boolean(isSummary))}>
            {label}
        </div>
    ),
}));

vi.mock('@/components/Inputs/NumberInput', () => ({
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
}));

vi.mock('@/components/Inputs/AddressLookup', () => ({
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
}));

describe('AuthorisedAgent', () => {
    it('renders unprefixed manufacturer, ABN, and street address fields by default', () => {
        render(<AuthorisedAgent />);

        expect(screen.getByTestId('text-input')).toHaveAttribute('data-name', 'manufacturerName');
        expect(screen.getByTestId('number-input')).toHaveAttribute('data-name', 'abn');
        expect(screen.getByTestId('number-input')).toHaveAttribute('data-format', '## ### ### ###');
        expect(screen.getByTestId('number-input')).toHaveAttribute('data-leading-zeros', 'true');
        expect(screen.getByText('For Australian manufacturers, enter ABN (Australian Business Number)')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Business street address' })).toBeInTheDocument();
        expect(screen.getByTestId('address-lookup')).toHaveAttribute('data-name', 'streetAddress');
        expect(screen.getByTestId('address-lookup')).toHaveAttribute('data-max-results', '10');
        expect(screen.getByTestId('address-lookup')).toHaveAttribute('data-placeholder', 'Enter the main business address');
    });

    it('prefixes child field names and forwards summary mode', () => {
        render(<AuthorisedAgent name='agent' isSummary />);

        expect(screen.getByTestId('text-input')).toHaveAttribute('data-name', 'agent.manufacturerName');
        expect(screen.getByTestId('text-input')).toHaveAttribute('data-summary', 'true');
        expect(screen.getByTestId('number-input')).toHaveAttribute('data-name', 'agent.abn');
        expect(screen.getByTestId('number-input')).toHaveAttribute('data-summary', 'true');
        expect(screen.getByTestId('address-lookup')).toHaveAttribute('data-name', 'agent.streetAddress');
        expect(screen.getByTestId('address-lookup')).toHaveAttribute('data-summary', 'true');
    });
});
