import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import type { ReactNode } from 'react';
import RhfHidableField, {
  RhfHiddenRulesProvider,
  useHiddenRules,
} from '@/components/forms/RhfHidableField';
import type { Hideable } from '@/components/forms/types';

interface AccountValues {
  account: { type: string; abn: string };
}

const BUSINESS_VALUES: AccountValues = {
  account: { type: 'business', abn: '123' },
};
const INDIVIDUAL_VALUES: AccountValues = {
  account: { type: 'individual', abn: '123' },
};

const hideAbnUnlessBusiness: Hideable = {
  account: { abn: ({ account }: AccountValues) => account.type !== 'business' },
};

interface HarnessProps {
  readonly values: AccountValues;
  readonly rules?: Hideable;
  readonly children: ReactNode;
}

/** `values` (not `defaultValues`) so a rerender can change form state. */
const Harness = ({ values, rules, children }: HarnessProps) => {
  const methods = useForm<AccountValues>({ values });
  const body = <FormProvider {...methods}>{children}</FormProvider>;
  return rules === undefined ? (
    body
  ) : (
    <RhfHiddenRulesProvider rules={rules}>{body}</RhfHiddenRulesProvider>
  );
};

const SetTypeButton = ({ type }: Readonly<{ type: string }>) => {
  const methods = useFormContext<AccountValues>();
  return (
    <button
      type='button'
      onClick={() => methods.setValue('account.type', type)}
    >
      set {type}
    </button>
  );
};

describe(RhfHidableField, () => {
  it('renders children when the rule evaluates to false', () => {
    render(
      <Harness values={BUSINESS_VALUES} rules={hideAbnUnlessBusiness}>
        <RhfHidableField name='account.abn'>
          <p>ABN field</p>
        </RhfHidableField>
      </Harness>
    );

    expect(screen.getByText('ABN field')).toBeInTheDocument();
  });

  it('hides children when the callback rule on a nested path is true', () => {
    render(
      <Harness values={INDIVIDUAL_VALUES} rules={hideAbnUnlessBusiness}>
        <RhfHidableField name='account.abn'>
          <p>ABN field</p>
        </RhfHidableField>
      </Harness>
    );

    expect(screen.queryByText('ABN field')).not.toBeInTheDocument();
  });

  it('re-evaluates when a watched value changes through setValue', async () => {
    const user = userEvent.setup();
    render(
      <Harness values={BUSINESS_VALUES} rules={hideAbnUnlessBusiness}>
        <SetTypeButton type='individual' />
        <SetTypeButton type='business' />
        <RhfHidableField name='account.abn'>
          <p>ABN field</p>
        </RhfHidableField>
      </Harness>
    );

    expect(screen.getByText('ABN field')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'set individual' }));

    expect(screen.queryByText('ABN field')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'set business' }));

    expect(screen.getByText('ABN field')).toBeInTheDocument();
  });

  it('reacts to a rerender that supplies new rules', () => {
    const { rerender } = render(
      <Harness values={BUSINESS_VALUES} rules={{ account: { abn: false } }}>
        <RhfHidableField name='account.abn'>
          <p>ABN field</p>
        </RhfHidableField>
      </Harness>
    );

    expect(screen.getByText('ABN field')).toBeInTheDocument();

    rerender(
      <Harness values={BUSINESS_VALUES} rules={{ account: { abn: true } }}>
        <RhfHidableField name='account.abn'>
          <p>ABN field</p>
        </RhfHidableField>
      </Harness>
    );

    expect(screen.queryByText('ABN field')).not.toBeInTheDocument();
  });

  it('hides every child field when a group "this" rule is true', () => {
    render(
      <Harness values={BUSINESS_VALUES} rules={{ account: { this: true } }}>
        <RhfHidableField name='account.abn'>
          <p>ABN field</p>
        </RhfHidableField>
      </Harness>
    );

    expect(screen.queryByText('ABN field')).not.toBeInTheDocument();
  });

  it('hides a field when a boolean rule is true', () => {
    render(
      <Harness values={BUSINESS_VALUES} rules={{ account: { abn: true } }}>
        <RhfHidableField name='account.abn'>
          <p>ABN field</p>
        </RhfHidableField>
      </Harness>
    );

    expect(screen.queryByText('ABN field')).not.toBeInTheDocument();
  });

  it('renders children when no provider supplies rules', () => {
    render(
      <Harness values={BUSINESS_VALUES}>
        <RhfHidableField name='account.abn'>
          <p>ABN field</p>
        </RhfHidableField>
      </Harness>
    );

    expect(screen.getByText('ABN field')).toBeInTheDocument();
  });

  it('renders an empty wrapper when a visible field has no children', () => {
    render(
      <Harness values={BUSINESS_VALUES} rules={hideAbnUnlessBusiness}>
        <div data-testid='wrapper'>
          <RhfHidableField name='account.abn' />
        </div>
      </Harness>
    );

    expect(screen.getByTestId('wrapper')).toBeEmptyDOMElement();
  });
});

describe(useHiddenRules, () => {
  it('returns an empty rule set without a provider', () => {
    const Probe = () => (
      <output data-testid='rules'>{JSON.stringify(useHiddenRules())}</output>
    );
    render(<Probe />);

    expect(screen.getByTestId('rules')).toHaveTextContent('{}');
  });
});
