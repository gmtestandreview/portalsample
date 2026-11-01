import { act, fireEvent, render, screen } from '@testing-library/react';
import { Form, Formik } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import CertificateNumberLookup from '@/components/Inputs/CertificateNumberLookup';

const DEBOUNCE_MS = 300;

const renderLookup = (
  options: unknown[] = [],
  props: Partial<ComponentProps<typeof CertificateNumberLookup>> = {},
  initialValues: Record<string, unknown> = {},
  omitOptionsFieldName = false,
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
    </Formik>,
  );

describe('certificateNumberLookup debounce', () => {
  it('holds the existing empty suggestion list when the debounce fires on an empty input', () => {
    expect.hasAssertions();

    vi.useFakeTimers();
    try {
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
        'false',
      );
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it.each([
    ['startsWith', 'Al', 'Alpha Certificate'],
    ['endsWith', 'cate', 'Alpha Certificate'],
  ] as const)(
    'supports the %s lookup match',
    async (matchType, input, expected) => {
      expect.hasAssertions();

      vi.useFakeTimers();
      try {
        renderLookup(
          [{ lookupName: expected }, { lookupName: 'Other value' }],
          {
            matchType,
          },
        );

        const inputElement = screen.getByRole('textbox');
        await act(async () => {
          fireEvent.change(inputElement, { target: { value: input } });
          vi.advanceTimersByTime(DEBOUNCE_MS);
        });

        expect(
          screen.getByRole('option', { name: /Alpha Certificate/ }),
        ).toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it('filters malformed lookup records without throwing', async () => {
    expect.hasAssertions();

    vi.useFakeTimers();
    try {
      renderLookup([
        null,
        'not an object',
        { lookupName: 123 },
        { lookupName: 'Alpha Certificate' },
      ]);

      act(() => {
        fireEvent.change(screen.getByRole('textbox'), {
          target: { value: 'Alpha' },
        });
        vi.advanceTimersByTime(DEBOUNCE_MS);
      });

      expect(
        screen.getByRole('option', { name: /Alpha Certificate/ }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole('option')).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('hides suggestions when the configured lookup field is absent', async () => {
    expect.hasAssertions();

    vi.useFakeTimers();
    try {
      renderLookup([{ lookupName: 'Alpha Certificate' }], {}, {}, true);

      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), {
          target: { value: 'Alpha' },
        });
        vi.advanceTimersByTime(DEBOUNCE_MS);
      });

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignores lookup records that do not contain the configured field', () => {
    expect.hasAssertions();

    vi.useFakeTimers();
    try {
      renderLookup([{ lookupName: 'Alpha Certificate' }], {
        optionsFieldName: 'missingField',
      });

      act(() => {
        fireEvent.change(screen.getByRole('textbox'), {
          target: { value: 'Alpha' },
        });
        vi.advanceTimersByTime(DEBOUNCE_MS);
      });

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('filters and sorts suggestions when a parent field is configured', async () => {
    expect.hasAssertions();

    vi.useFakeTimers();
    try {
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
        { parent: 'NMI' },
      );

      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), {
          target: { value: 'Al' },
        });
        vi.advanceTimersByTime(DEBOUNCE_MS);
      });

      expect(
        screen.getByRole('option', { name: /Alpha Certificate/ }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('option', { name: /Alpha Industry/ }),
      ).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
