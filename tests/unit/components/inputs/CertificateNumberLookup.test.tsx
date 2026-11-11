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
      onSubmit={vi.fn<() => void>()}
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
          await Promise.resolve();
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

      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), {
          target: { value: 'Alpha' },
        });
        vi.advanceTimersByTime(DEBOUNCE_MS);
        await Promise.resolve();
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
        await Promise.resolve();
      });

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignores lookup records that do not contain the configured field', async () => {
    expect.hasAssertions();

    vi.useFakeTimers();
    try {
      renderLookup([{ lookupName: 'Alpha Certificate' }], {
        optionsFieldName: 'missingField',
      });

      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), {
          target: { value: 'Alpha' },
        });
        vi.advanceTimersByTime(DEBOUNCE_MS);
        await Promise.resolve();
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
        await Promise.resolve();
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

  it('renders and selects a suggestion matched on another field with a blank name and id', async () => {
    expect.hasAssertions();

    vi.useFakeTimers();
    try {
      // Matching on `parent` rather than `lookupName` lets a row be a
      // suggestion while its lookupName and id are absent, which is the only
      // way to reach the `lookupName ?? ''` / `id ?? ''` fallbacks in the
      // rendered aria-label and the click handler.
      renderLookup(
        [{ parent: 'Alpha', lookupName: undefined, id: undefined }],
        {
          optionsFieldName: 'parent',
        },
      );

      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), {
          target: { value: 'Al' },
        });
        vi.advanceTimersByTime(DEBOUNCE_MS);
        await Promise.resolve();
      });

      // aria-label is `${lookupName ?? ''} (1 of 1)` -> ` (1 of 1)` here.
      const option = screen.getByRole('option', { name: /\(1 of 1\)/ });

      await act(async () => {
        fireEvent.click(option);
        await Promise.resolve();
      });

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      // handleSelect received '' for both value and id (the fallbacks).
      expect(screen.getByRole('textbox')).toHaveValue('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('commits the active suggestion on Enter when its name and id are blank', async () => {
    expect.hasAssertions();

    vi.useFakeTimers();
    try {
      renderLookup(
        [{ parent: 'Alpha', lookupName: undefined, id: undefined }],
        {
          optionsFieldName: 'parent',
        },
      );

      const input = screen.getByRole('textbox');

      await act(async () => {
        fireEvent.change(input, { target: { value: 'Al' } });
        vi.advanceTimersByTime(DEBOUNCE_MS);
        await Promise.resolve();
      });

      expect(
        screen.getByRole('option', { name: /\(1 of 1\)/ }),
      ).toBeInTheDocument();

      // ArrowDown makes the sole suggestion active, so Enter takes the
      // active-suggestion arm (`lookupName ?? ''` / `id ?? ''`) rather than the
      // free-text else arm. aria-selected confirms the active index moved.
      await act(async () => {
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        await Promise.resolve();
      });

      expect(screen.getByRole('option')).toHaveAttribute(
        'aria-selected',
        'true',
      );

      await act(async () => {
        fireEvent.keyDown(input, { key: 'Enter' });
        await Promise.resolve();
      });

      // Enter commits and closes the list.
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
