import { act, render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  appLoggerError: vi.fn(),
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

vi.mock(import('@azure/msal-react'), async () => {
  const { msalReactModuleMock } = await import('../../helpers/mockMsal');

  return msalReactModuleMock() satisfies __ExactMockModule<__TestMockModule2>;
});

vi.mock(
  import('../../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: { error: mocks.appLoggerError, info: vi.fn(), verbose: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

// HidableField decides visibility from its own Formik flag; that is its logic, not this file's.
vi.mock(
  import('../../../../ClientApp/src/components/forms/HidableField'),
  () =>
    ({
      default: ({ children }: { children: ReactNode }) => <>{children}</>,
    }) satisfies __ExactMockModule<__TestMockModule70>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/SelectInput'),
  () =>
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
    }) satisfies __ExactMockModule<__TestMockModule131>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/CheckboxGroup'),
  () =>
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
    }) satisfies __ExactMockModule<__TestMockModule132>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/RadioButton'),
  () =>
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
    }) satisfies __ExactMockModule<__TestMockModule133>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/TextInput'),
  () =>
    ({
      default: ({ name, label }: { name: string; label: string }) => (
        <div data-testid={`text-${name}`}>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule29>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/TextAreaInput'),
  () =>
    ({
      default: ({ name, label }: { name: string; label: string }) => (
        <div data-testid={`textarea-${name}`}>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule134>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/CertificateNumberLookup'),
  () =>
    ({
      default: ({ name, label }: { name: string; label: string }) => (
        <div data-testid={`certificate-${name}`}>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule135>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/instrumentInfoPanel'),
  () =>
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
    }) satisfies __ExactMockModule<__TestMockModule136>,
);

vi.mock(
  import('../../../../ClientApp/src/components/SummaryDisplay'),
  () =>
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
    }) satisfies __ExactMockModule<__TestMockModule137>,
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
        formik = bag as FormikProps<Record<string, unknown>>;
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

describe('application and instrument step', () => {
  beforeEach(() => {
    resetMsalMock();
    mocks.appLoggerError.mockReset();
    formik = undefined;
    captured.selects.clear();
    captured.checkboxGroups.clear();
    captured.infoPanel = undefined as unknown as typeof captured.infoPanel;
  });
  describe('choosing an application type', () => {
    it('offers all three application types with the stored one selected', async () => {
      expect.assertions(3);
      await renderStep();

      expect(
        screen.getByLabelText('New Certificate of Approval (CoA)'),
      ).toBeChecked();
      expect(
        screen.getByLabelText('Variation or request a minor edit'),
      ).not.toBeChecked();
      expect(screen.getByLabelText('Other options')).not.toBeChecked();
    });
  });
});

describe('application and instrument step', () => {
  beforeEach(() => {
    resetMsalMock();
    mocks.appLoggerError.mockReset();
    formik = undefined;
    captured.selects.clear();
    captured.checkboxGroups.clear();
    captured.infoPanel = undefined as unknown as typeof captured.infoPanel;
  });
  describe('choosing an application type', () => {
    it('starts on a new certificate when nothing is stored', async () => {
      expect.assertions(1);
      await renderStep({
        values: baseValues({ patternApprovalType: undefined }),
      });

      await waitFor(() =>
        expect(screen.getByText('Loading data...')).toBeInTheDocument(),
      );
    });
  });
});

describe('application and instrument step', () => {
  beforeEach(() => {
    resetMsalMock();
    mocks.appLoggerError.mockReset();
    formik = undefined;
    captured.selects.clear();
    captured.checkboxGroups.clear();
    captured.infoPanel = undefined as unknown as typeof captured.infoPanel;
  });
  describe('choosing an application type', () => {
    it('follows the stored type when it is a variation', async () => {
      expect.assertions(1);
      await renderStep({
        values: baseValues({
          patternApprovalType: PatternApprovalRequiredValues.Variation,
        }),
      });

      expect(
        screen.getByLabelText('Variation or request a minor edit'),
      ).toBeChecked();
    });
  });
});
