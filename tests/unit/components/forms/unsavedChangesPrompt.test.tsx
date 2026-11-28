import { act, render, screen, waitFor } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import UnsavedChangesPrompt from '../../../../ClientApp/src/components/forms/UnsavedFormPrompt/UnsavedChangesPrompt';
import RhfUnsavedFormPrompt from '../../../../ClientApp/src/components/forms/UnsavedFormPrompt/RhfUnsavedFormPrompt';
import { FieldHarness, createFormHandle } from '../inputs/rhfTestHarness';

type Proceed = NonNullable<
  React.ComponentProps<typeof UnsavedChangesPrompt>['onProceed']
>;

const guardProps = vi.hoisted(() => ({
  last: undefined as undefined | { when?: boolean; onProceed?: () => void },
}));

vi.mock(
  import('../../../../ClientApp/src/components/RouteLeavingGuard'),
  () =>
    ({
      default: (props: { when?: boolean; onProceed?: () => void }) => {
        guardProps.last = props;
        return (
          <div data-testid='guard' data-when={String(Boolean(props.when))} />
        );
      },
    }) satisfies __ExactMockModule<__TestMockModule20>,
);

const base = { isDirty: false, isValid: true, submitCount: 0 };
const whenOf = () => screen.getByTestId('guard').getAttribute('data-when');

describe('unsaved changes prompt', () => {
  it.each([
    ['clean and unsubmitted', base, 'false'],
    ['dirty and unsubmitted', { ...base, isDirty: true }, 'true'],
    [
      'dirty, submitted and valid',
      { isDirty: true, isValid: true, submitCount: 1 },
      'false',
    ],
    [
      'dirty, submitted and invalid',
      { isDirty: true, isValid: false, submitCount: 1 },
      'true',
    ],
    [
      'clean, submitted and rejected',
      { isDirty: false, isValid: false, submitCount: 1 },
      'true',
    ],
    [
      'clean and invalid before any submit',
      { isDirty: false, isValid: false, submitCount: 0 },
      'false',
    ],
  ])('when %s the guard is %s', (_name, state, expected) => {
    expect.hasAssertions();

    render(<UnsavedChangesPrompt {...state} />);

    expect(whenOf()).toBe(expected);
  });

  it('passes onProceed to the guard on both wordings', () => {
    expect.hasAssertions();

    const onProceed = vi.fn<Proceed>();
    const { rerender } = render(
      <UnsavedChangesPrompt {...base} onProceed={onProceed} />,
    );

    expect(guardProps.last?.onProceed).toBe(onProceed);

    rerender(
      <UnsavedChangesPrompt
        {...base}
        path='/create-account/'
        onProceed={onProceed}
      />,
    );

    expect(guardProps.last?.onProceed).toBe(onProceed);
  });
});

describe('rhfUnsavedFormPrompt', () => {
  const Probe = () => {
    const {
      formState: { errors },
    } = useFormContext();
    return (
      <pre data-testid='errors'>{JSON.stringify(Object.keys(errors))}</pre>
    );
  };

  it('clears form errors when the guard confirms leaving', async () => {
    expect.hasAssertions();

    const resolver: Resolver<{ name: string }> = () => ({
      values: {},
      errors: { name: { type: 'required', message: 'Required' } },
    });
    const form = createFormHandle<{ name: string }>();

    render(
      <FieldHarness
        field='name'
        defaultValue=''
        resolver={resolver}
        form={form}
      >
        <RhfUnsavedFormPrompt />
        <Probe />
      </FieldHarness>,
    );
    await form.submit();

    expect(screen.getByTestId('errors')).toHaveTextContent('name');

    act(() => {
      guardProps.last?.onProceed?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId('errors')).toHaveTextContent('[]');
    });
  });
});
