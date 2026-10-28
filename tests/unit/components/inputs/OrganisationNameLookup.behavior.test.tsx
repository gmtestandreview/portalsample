import { act, fireEvent, render, screen } from '@testing-library/react';
import { Profiler } from 'react';
import type { ProfilerOnRenderCallback } from 'react';
import { Formik } from 'formik';
import type { FormikConfig } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import OrganisationNameLookup from '@/components/Inputs/OrganisationNameLookup';

type LookupValues = {
  orgName: string;
  orgNameOptions: unknown[];
  parentField: string;
};
type SubmitHandler = FormikConfig<LookupValues>['onSubmit'];

vi.mock(
  import('@/components/Inputs/TextInput'),
  () =>
    ({
      default: ({
        name,
        label,
        onChange,
        onKeyDown,
        inlineHelpTitle: _inlineHelpTitle,
        inlineHelp: _inlineHelp,
        containerClassName: _containerClassName,
        ...rest
      }: any) => (
        <div>
          <label htmlFor={name}>{label}</label>
          <input
            id={name}
            name={name}
            onChange={onChange}
            onKeyDown={onKeyDown}
            {...rest}
          />
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule29>,
);

const renderLookup = (
  props: Partial<React.ComponentProps<typeof OrganisationNameLookup>> = {},
) =>
  render(
    <Formik<LookupValues>
      initialValues={{ orgName: '', orgNameOptions: [], parentField: '' }}
      onSubmit={vi.fn<SubmitHandler>()}
    >
      <OrganisationNameLookup name='orgName' label='Organisation' {...props} />
    </Formik>,
  );

describe('organisation name lookup behavior', () => {
  it('clears suggestions and hides the dropdown when optionsFieldName is undefined and input has 2+ characters', async () => {
    expect.hasAssertions();

    vi.useFakeTimers();
    try {
      renderLookup();

      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'ac' },
      });

      await act(async () => {
        vi.advanceTimersByTime(350);
      });

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    } finally {
      vi.restoreAllMocks();
      vi.useRealTimers();
    }
  });

  /**
   * The debounce fires 300ms after mount whether or not anything can change.
   * With an empty input it called `setFilteredSuggestions([])`, and a fresh
   * array literal is never referentially equal to the previous one, so React
   * committed a render that produced identical output - once per lookup
   * instance, on every mount, in production as well as in tests.
   *
   * In Storybook that render landed after the owning story had finished,
   * which is how this surfaced: `An update to OrganisationNameLookup inside
   * a test was not wrapped in act(...)`, attributed to whichever story
   * happened to be running when the timer fired.
   *
   * Profiler counts real commits of the subtree, so this asserts the absence
   * of the render itself rather than the absence of the warning.
   */
  it('does not re-render when the debounce fires with an empty input', async () => {
    expect.hasAssertions();

    vi.useFakeTimers();
    try {
      const onRender = vi.fn<ProfilerOnRenderCallback>();
      render(
        <Profiler id='lookup' onRender={onRender}>
          <Formik<LookupValues>
            initialValues={{ orgName: '', orgNameOptions: [], parentField: '' }}
            onSubmit={vi.fn<SubmitHandler>()}
          >
            <OrganisationNameLookup
              name='orgName'
              label='Organisation'
              optionsFieldName='tradingName'
            />
          </Formik>
        </Profiler>,
      );
      onRender.mockClear();

      await act(async () => {
        vi.advanceTimersByTime(350);
      });

      expect(onRender).not.toHaveBeenCalled();
    } finally {
      vi.restoreAllMocks();
      vi.useRealTimers();
    }
  });

  it('falls back to typed input if the active suggestion is unexpectedly absent', async () => {
    expect.hasAssertions();

    vi.useFakeTimers();
    const originalAt = Array.prototype.at;
    try {
      vi.spyOn(Array.prototype, 'at').mockImplementation(function (
        this: unknown[],
        index: number,
      ) {
        if (this.length > 0 && this[0] === 'Alpha Labs' && index === 0) {
          return undefined;
        }
        return originalAt.call(this, index);
      });

      render(
        <Formik<LookupValues>
          initialValues={{
            orgName: '',
            orgNameOptions: [{ name: 'Alpha Labs' }, { name: 'Beta Labs' }],
            parentField: '',
          }}
          onSubmit={vi.fn<SubmitHandler>()}
        >
          <OrganisationNameLookup
            name='orgName'
            label='Organisation'
            optionsFieldName='name'
          />
        </Formik>,
      );

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'Labs' } });
      await act(async () => {
        vi.advanceTimersByTime(350);
      });

      expect(screen.getByText('Alpha Labs')).toBeInTheDocument();

      await act(async () => {
        fireEvent.keyDown(input, { key: 'ArrowDown' });
      });
      await act(async () => {
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      expect(input).toHaveValue('Labs');
    } finally {
      vi.restoreAllMocks();
      vi.useRealTimers();
    }
  });
});
