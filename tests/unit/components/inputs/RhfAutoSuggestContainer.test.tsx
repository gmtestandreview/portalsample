import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

type ComboBoxOpen = (
  focusStrategy?: 'first' | 'last' | null,
  trigger?: string,
) => void;
type ComboBoxClose = () => void;
import type { Resolver } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import RhfAutoSuggestContainer from '@/components/Inputs/RhfAutoSuggest/RhfAutoSuggestContainer';
import type {
  AutoSuggestContainerProps,
  AutoSuggestOption,
} from '@/components/Inputs/AutoSuggest/types';
import { FieldHarness, createFormHandle } from './rhfTestHarness';
import type { FormHandle } from './rhfTestHarness';

type SearchTermChange = AutoSuggestContainerProps<string>['onSearchTermChange'];
type Cancel = AutoSuggestContainerProps<string>['onCancel'];
type SelectedOption = AutoSuggestContainerProps<string>['onSelectedOption'];

const comboState = vi.hoisted(() => ({
  isFocused: true,
  open: vi.fn<ComboBoxOpen>(),
  close: vi.fn<ComboBoxClose>(),
  onChange: undefined as ((key: string | null) => void) | undefined,
  onInputChange: undefined as ((value: string) => void) | undefined,
  onOpenChange: undefined as ((isOpen: boolean) => void) | undefined,
}));

vi.mock('react-aria-components/ComboBox', async () => {
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

vi.mock('react-aria-components/Group', async () => {
  const React = await import('react');
  const Group = ({ children }: { children: ReactNode }) =>
    React.createElement('div', { 'data-testid': 'group' }, children);
  return { Group } satisfies __ExactMockModule<__TestMockModule38>;
});

vi.mock(
  '@/components/Inputs/AutoSuggest/AutoSuggestOptions',
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
    onSearchTermChange: vi.fn<SearchTermChange>().mockResolvedValue(undefined),
    onCancel: vi.fn<Cancel>(),
    onSelectedOption: vi.fn<SelectedOption>().mockResolvedValue(undefined),
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
    expect.hasAssertions();

    comboState.open.mockClear();
    comboState.close.mockClear();
    const onSearchTermChange = vi
      .fn<SearchTermChange>()
      .mockResolvedValue(undefined);
    const onCancel = vi.fn<Cancel>();
    const onSelectedOption = vi
      .fn<SelectedOption>()
      .mockResolvedValue(undefined);

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

    expect({
      placeholder: screen
        .getByRole('textbox', { name: 'Suburb' })
        .getAttribute('placeholder'),
      inlineHelp: screen.getByText('Use your suburb').textContent,
      loadingMessage: screen.getByText('Searching').textContent,
      optionsRendered: Boolean(screen.getByTestId('options')),
      openCalls: comboState.open.mock.calls,
    }).toEqual({
      placeholder: 'Start typing',
      inlineHelp: 'Use your suburb',
      loadingMessage: 'Searching',
      optionsRendered: true,
      openCalls: [[null, 'input']],
    });

    const input = screen.getByRole('textbox', { name: 'Suburb' });
    await act(async () => {
      comboState.onInputChange?.('syd');
    });

    expect({ searchTermChangeCalls: onSearchTermChange.mock.calls }).toEqual({
      searchTermChangeCalls: [['syd']],
    });

    await act(async () => {
      comboState.onOpenChange?.(true);
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Escape' });
    });

    expect({
      cancelCalls: onCancel.mock.calls,
      suggestionSummary: screen.getByText(/2 suggestions displayed/)
        .textContent,
    }).toEqual({
      cancelCalls: [[]],
      suggestionSummary: expect.stringContaining('2 suggestions displayed'),
    });

    await act(async () => {
      comboState.onChange?.(null);
      comboState.onChange?.('sydney');
    });

    expect({ selectedOptionCalls: onSelectedOption.mock.calls }).toEqual({
      selectedOptionCalls: [[options[0]]],
    });

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
      </FieldHarness>,
    );

    expect({
      closeCalls: comboState.close.mock.calls,
      comboBoxRendered: Boolean(screen.getByTestId('combo-box')),
    }).toEqual({ closeCalls: [[]], comboBoxRendered: true });
  });

  it('renders no-result and lookup-error messages with defaults and overrides', () => {
    expect.hasAssertions();

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
      screen.getByText('Results could not be fetched'),
    ).toBeInTheDocument();

    unmount();

    renderContainer({ loading: true });

    expect(screen.getByText('Loading options')).toBeInTheDocument();
  });

  it('shows field validation only after the form is submitted', async () => {
    expect.hasAssertions();

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
      'suburb-validation-msg',
    );
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute(
      'aria-describedby',
      'help-suburb suburb-validation-msg',
    );
  });
});
