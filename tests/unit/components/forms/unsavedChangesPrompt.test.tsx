import { act, render, screen, waitFor } from '@testing-library/react';
import { Formik, useFormikContext } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import UnsavedChangesPrompt from '../../../../ClientApp/src/components/forms/UnsavedFormPrompt/UnsavedChangesPrompt';
import UnsavedFormPrompt from '../../../../ClientApp/src/components/forms/UnsavedFormPrompt';

const guardProps = vi.hoisted(() => ({
  last: undefined as undefined | { when?: boolean; onProceed?: () => void },
}));

vi.mock(
  import('../../../../ClientApp/src/components/RouteLeavingGuard'),
  () => ({
    default: (props: { when?: boolean; onProceed?: () => void }) => {
      guardProps.last = props;
      return (
        <div data-testid='guard' data-when={String(Boolean(props.when))} />
      );
    },
  })
);

const base = { isDirty: false, isValid: true, submitCount: 0 };
const whenOf = () => screen.getByTestId('guard').getAttribute('data-when');

describe(UnsavedChangesPrompt, () => {
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
    render(<UnsavedChangesPrompt {...state} />);

    expect(whenOf()).toBe(expected);
  });

  it('passes onProceed to the guard on both wordings', () => {
    const onProceed = vi.fn();
    const { rerender } = render(
      <UnsavedChangesPrompt {...base} onProceed={onProceed} />
    );

    expect(guardProps.last?.onProceed).toBe(onProceed);

    rerender(
      <UnsavedChangesPrompt
        {...base}
        path='/create-account/'
        onProceed={onProceed}
      />
    );

    expect(guardProps.last?.onProceed).toBe(onProceed);
  });
});

describe('unsavedFormPrompt (Formik)', () => {
  const Probe = () => {
    const { errors } = useFormikContext();
    return <pre data-testid='errors'>{JSON.stringify(errors)}</pre>;
  };

  it('clears Formik errors when the guard confirms leaving', async () => {
    render(
      <Formik
        initialValues={{ name: '' }}
        initialErrors={{ name: 'Required' }}
        onSubmit={vi.fn()}
      >
        <>
          <UnsavedFormPrompt />
          <Probe />
        </>
      </Formik>
    );

    expect(screen.getByTestId('errors')).toHaveTextContent('Required');

    await act(async () => {
      guardProps.last?.onProceed?.();
    });

    await waitFor(() =>
      expect(screen.getByTestId('errors')).toHaveTextContent('{}')
    );
  });
});
