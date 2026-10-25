import { act, fireEvent, render, screen } from '@testing-library/react';

import type { ReactNode } from 'react';

import type { Resolver } from 'react-hook-form';

import { describe, expect, it, vi } from 'vitest';

import RhfAutoSuggestContainer from '@/components/Inputs/RhfAutoSuggest/RhfAutoSuggestContainer';

import type {
  AutoSuggestContainerProps,
  AutoSuggestOption,
} from '@/components/Inputs/AutoSuggest/types';

import { FieldHarness, createFormHandle } from './rhfTestHarness';

import type { FormHandle } from './rhfTestHarness';

const comboState = vi.hoisted(() => ({
  isFocused: true,
  open: vi.fn(),
  close: vi.fn(),
  onChange: undefined as ((key: string | null) => void) | undefined,
  onInputChange: undefined as ((value: string) => void) | undefined,
  onOpenChange: undefined as ((isOpen: boolean) => void) | undefined,
}));

vi.mock(import('react-aria-components/ComboBox'), async () => {
  const React = await import('react');
  const ComboBoxStateContext = React.createContext(comboState);

  const ComboBox = ({
    children,
    onChange,
    onInputChange,
    onOpenChange,
  }: {
    children: ReactNode;
    onChange: (key: string | null) => void;
    onInputChange: (value: string) => void;
    onOpenChange: (isOpen: boolean) => void;
  }) => {
    comboState.onChange = onChange;
    comboState.onInputChange = onInputChange;
    comboState.onOpenChange = onOpenChange;
    return React.createElement(
      ComboBoxStateContext.Provider,
      { value: comboState },
      React.createElement('div', { 'data-testid': 'combo-box' }, children),
    );
  };

  const Input = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
  >((props, ref) => React.createElement('input', { ...props, ref }));
  const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) =>
    React.createElement('label', props);
  const Popover = ({ children }: { children: ReactNode }) =>
    React.createElement('div', { 'data-testid': 'popover' }, children);

  return {
    ComboBox,
    ComboBoxStateContext,
    Input,
    Label,
    Popover,
  } satisfies __ExactMockModule<__TestMockModule37>;
});

vi.mock(import('react-aria-components/Group'), async () => {
  const React = await import('react');
  const Group = ({ children }: { children: ReactNode }) =>
    React.createElement('div', { 'data-testid': 'group' }, children);
  return { Group } satisfies __ExactMockModule<__TestMockModule38>;
});

vi.mock(
  import('@/components/Inputs/AutoSuggest/AutoSuggestOptions'),
  () =>
    ({
      default: ({ options }: { options: AutoSuggestOption<string>[] }) => (
        <ul data-testid='options'>
          {options.map((option) => (
            <li key={option.id}>{option.displayText}</li>
          ))}
        </ul>
      ),
    }) satisfies __ExactMockModule<__TestMockModule39>,
);

interface Values {
  suburb: string;
}

const options: AutoSuggestOption<string>[] = [
  { id: 'sydney', displayText: 'Sydney', value: 'sydney' },
  { id: 'melbourne', displayText: 'Melbourne', value: 'melbourne' },
];

const renderContainer = (
  props: Partial<AutoSuggestContainerProps<string>> = {},
  form?: FormHandle<Values>,
  resolver?: Resolver<Values>,
) => {
  const defaultProps: AutoSuggestContainerProps<string> = {
    name: 'suburb',
    label: 'Suburb',
    options: [],
    onSearchTermChange: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
    onSelectedOption: vi.fn().mockResolvedValue(undefined),
  };

  return render(
    <FieldHarness<Values>
      field='suburb'
      defaultValue=''
      form={form}
      resolver={resolver}
    >
      <RhfAutoSuggestContainer {...defaultProps} {...props} />
    </FieldHarness>,
  );
};

const failingResolver = async () => ({
  values: {},
  errors: {
    suburb: { type: 'validation', message: 'Enter a suburb' },
  },
});

describe(RhfAutoSuggestContainer, () => {
  it('renders options, help, loading state and handles input actions', async () => {
    expect.assertions(1);
    comboState.open.mockClear();
    comboState.close.mockClear();
    const onSearchTermChange = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    const onSelectedOption = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderContainer({
      id: 'suburb-input',
      inlineHelp: 'Use your suburb',
      options,
      loading: true,
      loadingMessage: 'Searching',
      onSearchTermChange,
      onCancel,
      onSelectedOption,
      placeholder: 'Start typing',
    });
    expect(screen.getByRole('textbox', { name: 'Suburb' })).toHaveAttribute(
      'placeholder',
      'Start typing',
    );
  });
});

describe(RhfAutoSuggestContainer, () => {
  it('renders options, help, loading state and handles input actions', async () => {
    expect.assertions(1);
    comboState.open.mockClear();
    comboState.close.mockClear();
    const onSearchTermChange = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    const onSelectedOption = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderContainer({
      id: 'suburb-input',
      inlineHelp: 'Use your suburb',
      options,
      loading: true,
      loadingMessage: 'Searching',
      onSearchTermChange,
      onCancel,
      onSelectedOption,
      placeholder: 'Start typing',
    });
    expect(screen.getByText('Use your suburb')).toBeInTheDocument();
  });
});

describe(RhfAutoSuggestContainer, () => {
  it('renders options, help, loading state and handles input actions', async () => {
    expect.assertions(1);
    comboState.open.mockClear();
    comboState.close.mockClear();
    const onSearchTermChange = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    const onSelectedOption = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderContainer({
      id: 'suburb-input',
      inlineHelp: 'Use your suburb',
      options,
      loading: true,
      loadingMessage: 'Searching',
      onSearchTermChange,
      onCancel,
      onSelectedOption,
      placeholder: 'Start typing',
    });
    expect(screen.getByText('Searching')).toBeInTheDocument();
  });
});

describe(RhfAutoSuggestContainer, () => {
  it('renders options, help, loading state and handles input actions', async () => {
    expect.assertions(1);
    comboState.open.mockClear();
    comboState.close.mockClear();
    const onSearchTermChange = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    const onSelectedOption = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderContainer({
      id: 'suburb-input',
      inlineHelp: 'Use your suburb',
      options,
      loading: true,
      loadingMessage: 'Searching',
      onSearchTermChange,
      onCancel,
      onSelectedOption,
      placeholder: 'Start typing',
    });
    expect(screen.getByTestId('options')).toBeInTheDocument();
  });
});

describe(RhfAutoSuggestContainer, () => {
  it('renders options, help, loading state and handles input actions', async () => {
    expect.assertions(1);
    comboState.open.mockClear();
    comboState.close.mockClear();
    const onSearchTermChange = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    const onSelectedOption = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderContainer({
      id: 'suburb-input',
      inlineHelp: 'Use your suburb',
      options,
      loading: true,
      loadingMessage: 'Searching',
      onSearchTermChange,
      onCancel,
      onSelectedOption,
      placeholder: 'Start typing',
    });
    expect(comboState.open).toHaveBeenCalledWith(null, 'input');
  });
});
