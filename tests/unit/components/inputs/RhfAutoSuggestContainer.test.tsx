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
      React.createElement('div', { 'data-testid': 'combo-box' }, children)
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
    }) satisfies __ExactMockModule<__TestMockModule39>
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
  resolver?: Resolver<Values>
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
    </FieldHarness>
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
      'Start typing'
    );
    expect(screen.getByText('Use your suburb')).toBeInTheDocument();
    expect(screen.getByText('Searching')).toBeInTheDocument();
    expect(screen.getByTestId('options')).toBeInTheDocument();
    expect(comboState.open).toHaveBeenCalledWith(null, 'input');

    const input = screen.getByRole('textbox', { name: 'Suburb' });
    await act(async () => {
      comboState.onInputChange?.('syd');
    });

    expect(onSearchTermChange).toHaveBeenCalledWith('syd');

    await act(async () => {
      comboState.onOpenChange?.(true);
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Escape' });
    });

    expect(onCancel).toHaveBeenCalledWith();
    expect(screen.getByText(/2 suggestions displayed/)).toBeInTheDocument();

    await act(async () => {
      comboState.onChange?.(null);
      comboState.onChange?.('sydney');
    });

    expect(onSelectedOption).toHaveBeenCalledWith(options[0]);

    rerender(
      <FieldHarness<Values> field='suburb' defaultValue=''>
        <RhfAutoSuggestContainer
          name='suburb'
          label='Suburb'
          options={[]}
          onSearchTermChange={onSearchTermChange}
          onCancel={onCancel}
          onSelectedOption={onSelectedOption}
        />
      </FieldHarness>
    );

    expect(comboState.close).toHaveBeenCalledWith();
    expect(screen.getByTestId('combo-box')).toBeInTheDocument();
  });

  it('renders no-result and lookup-error messages with defaults and overrides', () => {
    renderContainer({
      noResult: true,
      noResultMessage: 'No suburb matches',
      error: true,
      errorMessage: 'Lookup failed',
    });

    expect(screen.getByText('No suburb matches')).toBeInTheDocument();
    expect(screen.getByText('Lookup failed')).toBeInTheDocument();

    const { unmount } = renderContainer({ noResult: true, error: true });

    expect(screen.getByText('No matches found')).toBeInTheDocument();
    expect(
      screen.getByText('Results could not be fetched')
    ).toBeInTheDocument();

    unmount();

    renderContainer({ loading: true });

    expect(screen.getByText('Loading options')).toBeInTheDocument();
  });

  it('shows field validation only after the form is submitted', async () => {
    const form = createFormHandle<Values>();
    renderContainer({ inlineHelp: 'Choose a suburb' }, form, failingResolver);

    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText('Enter a suburb')).not.toBeInTheDocument();

    await act(async () => {
      await form.submit();
    });

    const input = screen.getByRole('textbox', { name: 'Suburb' });

    expect(screen.getByText('Enter a suburb')).toHaveAttribute(
      'id',
      'suburb-validation-msg'
    );
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute(
      'aria-describedby',
      'help-suburb suburb-validation-msg'
    );
  });
});
