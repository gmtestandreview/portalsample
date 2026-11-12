import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { FormikProps } from 'formik';
import type { ChangeEvent, ReactNode } from 'react';
import {
  PatternApprovalRequiredValueOptions,
  PatternApprovalRequiredValues,
} from '../../../../ClientApp/src/api/web-api-client';

import { resetMsalMock } from '../../helpers/mockMsal';
import { FormikWrapper } from '../../helpers/formik';
import { defined } from '../../helpers/defined';

const mocks = vi.hoisted(() => ({
  appLoggerError: vi.fn<(...args: unknown[]) => unknown>(),
}));

/** Captures what the leaf inputs are handed, so this file's own logic can be observed. */
const captured = vi.hoisted(() => ({
  selects: new Map<
    string,
    {
      options: { displayText: string; value: string }[];
      readOnly?: boolean | undefined;
      onChange?: ((event: unknown) => void) | undefined;
    }
  >(),
  checkboxGroups: new Map<
    string,
    { options: { label: string; value: string }[] }
  >(),
  infoPanel: undefined as unknown as {
    category?: string | undefined;
    type?: string | undefined;
  },
}));

/** The select the step rendered under `name`; fails the test if the step never rendered it. */
const selectNamed = (name: string) =>
  defined(captured.selects.get(name), `select "${name}"`);

/** The checkbox group the step rendered under `name`; fails the test if it was never rendered. */
const checkboxGroupNamed = (name: string) =>
  defined(captured.checkboxGroups.get(name), `checkbox group "${name}"`);

vi.mock(import('@azure/msal-react'), (async () => {
  const { msalReactModuleMock } = await import('../../helpers/mockMsal');

  return msalReactModuleMock() satisfies __ExactMockModule<__TestMockModule2>;
}) as unknown as __DynamicPartialMockFactory<__TestMockModule2>);

vi.mock(
  import('../../../../ClientApp/src/instrumentation/AppLogger'),
  (() =>
    ({
      default: {
        error: mocks.appLoggerError,
        info: vi.fn<(...args: unknown[]) => unknown>(),
        verbose: vi.fn<(...args: unknown[]) => unknown>(),
      },
    }) satisfies __ExactMockModule<__TestMockModule5>) as unknown as __DynamicPartialMockFactory<__TestMockModule5>,
);

// HidableField decides visibility from its own Formik flag; that is its logic, not this file's.
vi.mock(
  import('../../../../ClientApp/src/components/forms/HidableField'),
  (() =>
    ({
      default: ({ children }: { children: ReactNode }) => <>{children}</>,
    }) satisfies __ExactMockModule<__TestMockModule70>) as unknown as __DynamicPartialMockFactory<__TestMockModule70>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/SelectInput'),
  (() =>
    ({
      default: ({
        name,
        label,
        options,
        onChange,
        readOnly,
      }: {
        name: string;
        label: string;
        options: { displayText: string; value: string }[];
        onChange?: (event: unknown) => void;
        readOnly?: boolean;
      }) => {
        captured.selects.set(name, { options, readOnly, onChange });

        return (
          <select
            aria-label={label}
            data-testid={`select-${name}`}
            data-readonly={String(readOnly ?? false)}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              onChange?.(event)
            }
          >
            <option value='' />
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.displayText}
              </option>
            ))}
          </select>
        );
      },
    }) satisfies __ExactMockModule<__TestMockModule131>) as unknown as __DynamicPartialMockFactory<__TestMockModule131>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/CheckboxGroup'),
  (() =>
    ({
      default: ({
        name,
        options,
      }: {
        name: string;
        options: { label: string; value: string }[];
      }) => {
        captured.checkboxGroups.set(name, { options });

        return (
          <div data-testid={`checkboxes-${name}`} data-count={options.length} />
        );
      },
    }) satisfies __ExactMockModule<__TestMockModule132>) as unknown as __DynamicPartialMockFactory<__TestMockModule132>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/RadioButton'),
  (() =>
    ({
      default: ({
        id,
        label,
        checked,
        onChange,
        value,
      }: {
        id: string;
        label: string;
        checked: boolean;
        onChange: (event: unknown) => void;
        value: string;
      }) => (
        <label htmlFor={id}>
          <input
            type='radio'
            id={id}
            name='applicationType'
            value={value}
            checked={checked}
            onChange={onChange}
          />
          {label}
        </label>
      ),
    }) satisfies __ExactMockModule<__TestMockModule133>) as unknown as __DynamicPartialMockFactory<__TestMockModule133>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/TextInput'),
  (() =>
    ({
      default: ({ name, label }: { name: string; label: string }) => (
        <div data-testid={`text-${name}`}>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule29>) as unknown as __DynamicPartialMockFactory<__TestMockModule29>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/TextAreaInput'),
  (() =>
    ({
      default: ({ name, label }: { name: string; label: string }) => (
        <div data-testid={`textarea-${name}`}>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule134>) as unknown as __DynamicPartialMockFactory<__TestMockModule134>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/CertificateNumberLookup'),
  (() =>
    ({
      default: ({ name, label }: { name: string; label: string }) => (
        <div data-testid={`certificate-${name}`}>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule135>) as unknown as __DynamicPartialMockFactory<__TestMockModule135>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/instrumentInfoPanel'),
  (() =>
    ({
      default: ({
        selectedInstrumentCategoryId,
        selectedInstrumentTypeId,
      }: {
        selectedInstrumentCategoryId?: string;
        selectedInstrumentTypeId?: string;
      }) => {
        captured.infoPanel = {
          category: selectedInstrumentCategoryId,
          type: selectedInstrumentTypeId,
        };

        return <div data-testid='instrument-info-panel' />;
      },
    }) satisfies __ExactMockModule<__TestMockModule136>) as unknown as __DynamicPartialMockFactory<__TestMockModule136>,
);

vi.mock(
  import('../../../../ClientApp/src/components/SummaryDisplay'),
  (() =>
    ({
      default: ({
        id,
        label,
        value,
      }: {
        id: string;
        label: string;
        value: string;
      }) => (
        <div data-testid={`summary-${id}`} data-label={label}>
          {value}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule137>) as unknown as __DynamicPartialMockFactory<__TestMockModule137>,
);

const categoryLookup = () => [
  { id: 'cat-weighing', label: 'Weighing instruments', parentId: undefined },
  { id: 'cat-none', label: 'No measurement instrument', parentId: undefined },
  { id: 'cat-length', label: 'Length measures', parentId: undefined },
];

const typeLookup = () => [
  { id: 'type-beam', label: 'Beam balance', parentId: 'cat-weighing' },
  { id: 'type-tape', label: 'Tape measure', parentId: 'cat-length' },
  { id: 'type-none', label: 'No instrument', parentId: 'cat-none' },
  { id: 'type-scale', label: 'Automatic scale', parentId: 'cat-weighing' },
];

const baseValues = (overrides: Record<string, unknown> = {}) => ({
  patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
  newSubOptions: [] as string[],
  varSubOptions: [] as string[],
  othSubOptions: [] as string[],
  instrumentCategory: '',
  instrumentType: '',
  instrumentCategoryLookup: categoryLookup(),
  instrumentTypeLookup: typeLookup(),
  ...overrides,
});

let formik: FormikProps<Record<string, unknown>> | undefined;

const renderStep = async ({
  values = baseValues(),
  isSummary = false,
  name = '',
}: {
  values?: Record<string, unknown>;
  isSummary?: boolean;
  name?: string;
} = {}) => {
  const ApplicationAndInstrument = (
    await import('../../../../ClientApp/src/routes/ta/applicationAndInstrument')
  ).default;

  const result = render(
    <FormikWrapper
      initialValues={values}
      innerRef={(bag) => {
        formik = bag;
      }}
    >
      <ApplicationAndInstrument name={name} isSummary={isSummary} />
    </FormikWrapper>,
  );

  await act(async () => {
    await Promise.resolve();
  });

  return result;
};

const resetApplicationAndInstrumentMocks = () => {
  resetMsalMock();
  mocks.appLoggerError.mockReset();
  formik = undefined;
  captured.selects.clear();
  captured.checkboxGroups.clear();
  captured.infoPanel = undefined as unknown as typeof captured.infoPanel;
};

describe('application and instrument step', () => {
  describe('choosing an application type', () => {
    it('offers all three application types with the stored one selected', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep();

      expect(
        screen.getByLabelText('New Certificate of Approval (CoA)'),
      ).toBeChecked();
      expect(
        screen.getByLabelText('Variation or request a minor edit'),
      ).not.toBeChecked();
      expect(screen.getByLabelText('Other options')).not.toBeChecked();
    });

    it('starts on a new certificate when nothing is stored', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        values: baseValues({ patternApprovalType: undefined }),
      });

      expect(
        screen.getByLabelText('New Certificate of Approval (CoA)'),
      ).toBeChecked();
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    it('follows the stored type when it is a variation', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        values: baseValues({
          patternApprovalType: PatternApprovalRequiredValues.Variation,
        }),
      });

      expect(
        screen.getByLabelText('Variation or request a minor edit'),
      ).toBeChecked();
    });

    it('keeps the visible selection in sync with the stored type', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      const user = userEvent.setup();
      await renderStep();

      await user.click(screen.getByLabelText('Other options'));

      expect(screen.getByLabelText('Other options')).toBeChecked();
      expect(
        screen.getByLabelText('New Certificate of Approval (CoA)'),
      ).not.toBeChecked();
    });

    it('clears stale validation when the type changes after a failed submit', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      const user = userEvent.setup();
      await renderStep();

      await act(async () => {
        await formik?.submitForm();
      });
      await act(async () => {
        formik?.setErrors({ instrumentCategory: 'Category is required' });
        await formik?.setTouched({ instrumentCategory: true });
        await Promise.resolve();
      });

      await user.click(
        screen.getByLabelText('Variation or request a minor edit'),
      );

      // Switching type changes which fields even apply, so errors about the old branch go.
      await waitFor(() => {
        expect(formik?.errors).toStrictEqual({});
      });

      expect(formik?.touched).toStrictEqual({});
    });

    it('leaves validation alone when the type changes before any submit', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      const user = userEvent.setup();
      await renderStep();

      await act(async () => {
        formik?.setErrors({ instrumentCategory: 'Category is required' });
        await Promise.resolve();
      });

      await user.click(
        screen.getByLabelText('Variation or request a minor edit'),
      );

      expect(formik?.errors).toStrictEqual({
        instrumentCategory: 'Category is required',
      });
    });

    it('offers the sub-options belonging to each application type', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep();

      expect(checkboxGroupNamed('newSubOptions').options).toHaveLength(3);
      expect(
        checkboxGroupNamed('varSubOptions').options.length,
      ).toBeGreaterThan(0);
      expect(
        checkboxGroupNamed('othSubOptions').options.length,
      ).toBeGreaterThan(0);
    });
  });

  describe('instrument lookups', () => {
    it('lists the categories with the none option last', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep();

      await waitFor(() => {
        expect(captured.selects.get('instrumentCategory')).toBeDefined();
      });
      const labels = selectNamed('instrumentCategory').options.map(
        (o) => o.displayText,
      );

      expect(labels).toStrictEqual([
        'Length measures',
        'Weighing instruments',
        'No measurement instrument',
      ]);
    });

    it('offers no instrument types until a category is chosen', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep();

      await waitFor(() => {
        expect(captured.selects.get('instrumentType')).toBeDefined();
      });

      expect(selectNamed('instrumentType').options).toStrictEqual([]);
    });

    it('narrows the types to the chosen category', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        values: baseValues({
          instrumentCategory: 'cat-weighing',
          instrumentType: 'type-beam',
        }),
      });

      await waitFor(() => {
        expect(selectNamed('instrumentType').options.length).toBeGreaterThan(0);
      });

      expect(
        selectNamed('instrumentType').options.map((o) => o.displayText),
      ).toStrictEqual(['Automatic scale', 'Beam balance']);
    });

    it('shows every type in summary mode regardless of category', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        isSummary: true,
        values: baseValues({ instrumentCategory: '', instrumentType: '' }),
      });

      await waitFor(() => {
        expect(captured.selects.get('instrumentType')).toBeDefined();
      });

      // Summary is a record of what was chosen, so it must resolve any stored id to a label.
      expect(selectNamed('instrumentType').options).toHaveLength(
        typeLookup().length,
      );
    });

    it('keeps empty option fields when a category has no id and a matching type row has no id or label', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        values: baseValues({
          instrumentCategory: 'cat-weighing',
          instrumentType: 'type-beam',
          // The category keeps a defined label (the raw category list is sorted
          // by label, which throws on undefined) but drops its id.
          instrumentCategoryLookup: [
            ...categoryLookup(),
            { id: undefined, label: 'Edge category', parentId: undefined },
          ],
          // The type list is mapped before it is sorted by displayText, so an
          // id/label-less row flows through safely.
          instrumentTypeLookup: [
            ...typeLookup(),
            { id: undefined, label: undefined, parentId: 'cat-weighing' },
          ],
        }),
      });

      await waitFor(() => {
        expect(selectNamed('instrumentType').options.length).toBeGreaterThan(0);
      });

      // getInstrumentCategories maps the id-less row to an empty value.
      expect(selectNamed('instrumentCategory').options).toContainEqual({
        displayText: 'Edge category',
        value: '',
      });
      // getInstrumentTypes' parent-id branch maps the id/label-less type row.
      expect(selectNamed('instrumentType').options).toContainEqual({
        displayText: '',
        value: '',
      });
    });

    it('keeps empty option fields in summary mode when a type row has no id or label', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        isSummary: true,
        values: baseValues({
          instrumentCategory: '',
          instrumentType: '',
          instrumentTypeLookup: [
            ...typeLookup(),
            { id: undefined, label: undefined, parentId: 'cat-weighing' },
          ],
        }),
      });

      await waitFor(() => {
        expect(captured.selects.get('instrumentType')).toBeDefined();
      });

      // Summary mode maps every type row, including the id/label-less one.
      expect(selectNamed('instrumentType').options).toContainEqual({
        displayText: '',
        value: '',
      });
    });

    it('offers nothing when the lookups have not arrived', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        values: baseValues({
          instrumentCategoryLookup: undefined,
          instrumentTypeLookup: undefined,
        }),
      });

      await waitFor(() => {
        expect(captured.selects.get('instrumentType')).toBeDefined();
      });

      expect(selectNamed('instrumentType').options).toStrictEqual([]);
      expect(selectNamed('instrumentCategory').options).toStrictEqual([]);
    });

    it('rehydrates lookup options when the async step values arrive', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        values: baseValues({
          instrumentCategoryLookup: undefined,
          instrumentTypeLookup: undefined,
        }),
      });

      await act(async () => {
        await formik?.setValues(
          baseValues({ instrumentCategory: 'cat-weighing' }),
        );
      });

      await waitFor(() => {
        expect(
          selectNamed('instrumentCategory').options.map(
            (option) => option.displayText,
          ),
        ).toStrictEqual([
          'Length measures',
          'Weighing instruments',
          'No measurement instrument',
        ]);
        expect(
          selectNamed('instrumentType').options.map(
            (option) => option.displayText,
          ),
        ).toStrictEqual(['Automatic scale', 'Beam balance']);
      });
    });

    it('offers no types when the instrument field has never been set', async () => {
      // Distinct from an empty string: a step whose values omit instrumentType entirely has
      // nothing to resolve against, so the type list starts empty rather than unfiltered.
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      const values = baseValues();
      delete (values as Record<string, unknown>)['instrumentType'];

      await renderStep({ values });

      await waitFor(() => {
        expect(captured.selects.get('instrumentType')).toBeDefined();
      });

      expect(selectNamed('instrumentType').options).toStrictEqual([]);
    });

    it('ignores a category change before the type lookup has arrived', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        values: baseValues({
          instrumentCategoryLookup: undefined,
          instrumentTypeLookup: undefined,
        }),
      });
      await waitFor(() => {
        expect(captured.selects.get('instrumentCategory')).toBeDefined();
      });

      await act(async () => {
        selectNamed('instrumentCategory').onChange?.({
          target: { value: 'cat-weighing' },
        });
        await Promise.resolve();
      });

      // No lookup means no options to narrow; the field is still cleared for re-entry.
      expect(selectNamed('instrumentType').options).toStrictEqual([]);

      await waitFor(() => {
        expect(formik?.values['instrumentType']).toBe('');
      });
    });

    it('logs a failure while shaping the lookups', async () => {
      // A lookup entry that is not an object at all makes sortList throw while reading its
      // display field - the catch exists so a malformed payload cannot blank the whole step.
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        values: baseValues({
          instrumentCategoryLookup: [null],
          instrumentTypeLookup: typeLookup(),
        }),
      });

      await waitFor(() => {
        expect(mocks.appLoggerError).toHaveBeenCalledWith(
          'Failed to retrieve look ups',
          expect.any(Error),
        );
      });
    });

    it('keeps sparse category lookup entries selectable', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        values: baseValues({
          instrumentCategoryLookup: [
            { id: undefined, label: 'Sparse category', parentId: undefined },
          ],
          instrumentTypeLookup: [],
        }),
      });

      await waitFor(() => {
        expect(captured.selects.get('instrumentCategory')).toBeDefined();
      });

      await waitFor(() => {
        expect(selectNamed('instrumentCategory').options).toContainEqual({
          displayText: 'Sparse category',
          value: '',
        });
      });
    });
  });

  describe('changing the instrument category', () => {
    it('re-narrows the types and clears the previous choice', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      const user = userEvent.setup();
      await renderStep();
      await waitFor(() => {
        expect(captured.selects.get('instrumentCategory')).toBeDefined();
      });

      await user.selectOptions(
        screen.getByTestId('select-instrumentCategory'),
        'cat-length',
      );

      await waitFor(() => {
        expect(
          selectNamed('instrumentType').options.map((o) => o.displayText),
        ).toStrictEqual(['Tape measure']);
      });

      expect(formik?.values['instrumentType']).toBe('');
    });

    it('picks the none instrument and locks the type when no measurement applies', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      const user = userEvent.setup();
      await renderStep();
      await waitFor(() => {
        expect(captured.selects.get('instrumentCategory')).toBeDefined();
      });

      await user.selectOptions(
        screen.getByTestId('select-instrumentCategory'),
        'cat-none',
      );

      // Choosing "no measurement instrument" has exactly one valid type, so it is chosen for
      // the user and the field is locked rather than left as an empty required box.
      await waitFor(() => {
        expect(formik?.values['instrumentType']).toBe('type-none');
      });

      expect(screen.getByTestId('select-instrumentType')).toHaveAttribute(
        'data-readonly',
        'true',
      );
    });

    it('locks the type on load when the stored category is the none option', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        values: baseValues({
          instrumentCategory: 'cat-none',
          instrumentType: 'type-none',
        }),
      });

      await waitFor(() => {
        expect(screen.getByTestId('select-instrumentType')).toHaveAttribute(
          'data-readonly',
          'true',
        );
      });
    });
  });

  describe('supporting panels', () => {
    it('shows the instrument info and OIML warning while editing', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        values: baseValues({
          instrumentCategory: 'cat-weighing',
          instrumentType: 'type-beam',
        }),
      });

      await waitFor(() => {
        expect(screen.getByTestId('instrument-info-panel')).toBeInTheDocument();
      });

      expect(captured.infoPanel).toStrictEqual({
        category: 'cat-weighing',
        type: 'type-beam',
      });
      expect(screen.getByRole('alert')).toHaveTextContent(
        'OIML certificates apply only to specific instrument types',
      );
    });

    it('drops both panels in summary mode', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({ isSummary: true });

      expect(
        screen.queryByTestId('instrument-info-panel'),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('summary mode', () => {
    it('names the chosen application type and its options', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        isSummary: true,
        values: baseValues({
          newSubOptions: [
            PatternApprovalRequiredValueOptions.CertificateofApproval,
            PatternApprovalRequiredValueOptions.OIMLCertificate,
          ],
        }),
      });

      expect(screen.getByTestId('summary-applicationType')).toHaveTextContent(
        'New Certificate of Approval (CoA)',
      );
      expect(
        screen.getByTestId('summary-newCertificateSubOptions'),
      ).toHaveTextContent(
        'NMI Pattern Approval Certificate, International Organisation of Legal Metrology (OIML) Certificate',
      );
    });

    it('reads a single stored option that is not in a list', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        isSummary: true,
        values: baseValues({
          newSubOptions:
            PatternApprovalRequiredValueOptions.ConversionCertificate,
        }),
      });

      expect(
        screen.getByTestId('summary-newCertificateSubOptions'),
      ).toHaveTextContent('Conversion Certificate');
    });

    it('says nothing was selected for an empty option list', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        isSummary: true,
        values: baseValues({ newSubOptions: [] }),
      });

      expect(
        screen.getByTestId('summary-newCertificateSubOptions'),
      ).toHaveTextContent('Not selected');
    });

    it('says nothing was selected when the options are absent', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        isSummary: true,
        values: baseValues({ newSubOptions: undefined }),
      });

      expect(
        screen.getByTestId('summary-newCertificateSubOptions'),
      ).toHaveTextContent('Not selected');
    });

    it('says nothing was selected for a single option it cannot name', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        isSummary: true,
        values: baseValues({ newSubOptions: 'no-such-option' }),
      });

      expect(
        screen.getByTestId('summary-newCertificateSubOptions'),
      ).toHaveTextContent('Not selected');
    });

    it('says nothing was selected for options it cannot name', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        isSummary: true,
        values: baseValues({ newSubOptions: ['no-such-option'] }),
      });

      expect(
        screen.getByTestId('summary-newCertificateSubOptions'),
      ).toHaveTextContent('Not selected');
    });

    it('says nothing was selected for an application type it cannot name', async () => {
      // A stored type this build does not know about - a retired option, or one added by a
      // later release. The summary says so rather than printing a raw enum value.
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        isSummary: true,
        values: baseValues({ patternApprovalType: 'Retired' }),
      });

      expect(screen.getByTestId('summary-applicationType')).toHaveTextContent(
        'Not selected',
      );
    });

    it('says nothing was selected when no application type is stored', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        isSummary: true,
        values: baseValues({ patternApprovalType: undefined }),
      });

      expect(screen.getByTestId('summary-applicationType')).toHaveTextContent(
        'Not selected',
      );
    });

    it('summarises a variation application', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        isSummary: true,
        values: baseValues({
          patternApprovalType: PatternApprovalRequiredValues.Variation,
          varSubOptions: [
            PatternApprovalRequiredValueOptions.VariationtoanExistingCoA,
          ],
        }),
      });

      expect(
        screen.getByTestId('summary-variationSubOptions'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('summary-newCertificateSubOptions'),
      ).not.toBeInTheDocument();
    });

    it('summarises an other-approval application', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({
        isSummary: true,
        values: baseValues({
          patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
        }),
      });

      expect(
        screen.getByTestId('summary-otherApprovalSubOptions'),
      ).toBeInTheDocument();
    });
  });

  describe('field naming', () => {
    it('addresses fields at the root when given no prefix', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep();

      expect(captured.selects.get('instrumentCategory')).toBeDefined();
      expect(captured.checkboxGroups.get('newSubOptions')).toBeDefined();
    });

    it('prefixes every field when nested under a name', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({ name: 'applicationAndInstrument' });

      expect(
        captured.selects.get('applicationAndInstrument.instrumentCategory'),
      ).toBeDefined();
      expect(
        captured.selects.get('applicationAndInstrument.instrumentType'),
      ).toBeDefined();
      expect(
        captured.checkboxGroups.get('applicationAndInstrument.newSubOptions'),
      ).toBeDefined();
    });

    it('reads the application type from the nested field when named', async () => {
      expect.hasAssertions();

      resetApplicationAndInstrumentMocks();

      await renderStep({ name: 'applicationAndInstrument' });

      expect(
        screen.getByLabelText('New Certificate of Approval (CoA)'),
      ).toBeChecked();
    });
  });
});
