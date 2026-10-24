import { act, fireEvent, render, screen } from '@testing-library/react';
import { Form, Formik } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import CertificateNumberLookup from '@/components/Inputs/CertificateNumberLookup';

const DEBOUNCE_MS = 300;

const renderLookup = (
  options: unknown[] = [],
  props: Partial<ComponentProps<typeof CertificateNumberLookup>> = {},
  initialValues: Record<string, unknown> = {},
  omitOptionsFieldName = false
) =>
  render(
    <Formik
      initialValues={{
        certNumber: '',
        certNumberId: '',
        certNameOptions: options,
        ...initialValues,
      }}
      onSubmit={async () => {}}
    >
      <Form>
        <CertificateNumberLookup
          name='certNumber'
          idName='certNumberId'
          label='Certificate number'
          {...(omitOptionsFieldName ? {} : { optionsFieldName: 'lookupName' })}
          {...props}
        />
      </Form>
    </Formik>
  );

describe('certificateNumberLookup debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('holds the existing empty suggestion list when the debounce fires on an empty input', () => {
    renderLookup();

    // The applicationAndInstrument step renders two of these, and each one arms this timer on
    // mount with an empty input. Returning `prev` rather than a fresh `[]` is what stops that
    // committing an identical render per instance - a new array literal is never referentially
    // equal, so React would treat the no-op as a change.
    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it.each([
    ['startsWith', 'Al', 'Alpha Certificate'],
    ['endsWith', 'cate', 'Alpha Certificate'],
  ] as const)(
    'supports the %s lookup match',
    async (matchType, input, expected) => {
      renderLookup([{ lookupName: expected }, { lookupName: 'Other value' }], {
        matchType,
      });

      const inputElement = screen.getByRole('textbox');
      await act(async () => {
        fireEvent.change(inputElement, { target: { value: input } });
        vi.advanceTimersByTime(DEBOUNCE_MS);
      });

      expect(
        screen.getByRole('option', { name: /Alpha Certificate/ })
      ).toBeInTheDocument();
    }
  );

  it('filters malformed lookup records without throwing', async () => {
    renderLookup([
      null,
      'not an object',
      { lookupName: 123 },
      { lookupName: 'Alpha Certificate' },
    ]);

    await act(async () => {
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Alpha' },
      });
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(
      screen.getByRole('option', { name: /Alpha Certificate/ })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('hides suggestions when the configured lookup field is absent', async () => {
    renderLookup([{ lookupName: 'Alpha Certificate' }], {}, {}, true);

    await act(async () => {
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Alpha' },
      });
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('filters and sorts suggestions when a parent field is configured', async () => {
    renderLookup(
      [
        { lookupName: 'Zulu Certificate', parent: 'NMI' },
        { lookupName: 'Alpha Certificate', parent: 'NMI' },
        { lookupName: 'Alpha Industry', parent: 'Industry' },
      ],
      {
        parentName: 'parent',
        parentOptionsName: 'parent',
        matchType: 'startsWith',
      },
      { parent: 'NMI' }
    );

    await act(async () => {
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Al' },
      });
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(
      screen.getByRole('option', { name: /Alpha Certificate/ })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /Alpha Industry/ })
    ).not.toBeInTheDocument();
  });
});
