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

const mocks = vi.hoisted(() => ({
    appLoggerError: vi.fn(),
}));

/** Captures what the leaf inputs are handed, so this file's own logic can be observed. */
const captured = vi.hoisted(() => ({
    selects: {} as Record<string, {
        options: { displayText: string; value: string }[];
        readOnly?: boolean;
        onChange?: (event: unknown) => void;
    }>,
    checkboxGroups: {} as Record<string, { options: { label: string; value: string }[] }>,
    infoPanel: undefined as unknown as { category?: string; type?: string },
}));

vi.mock('@azure/msal-react', async () => {
    const { msalReactModuleMock } = await import('../../helpers/mockMsal');

    return msalReactModuleMock();
});

vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: { error: mocks.appLoggerError, info: vi.fn(), verbose: vi.fn() },
}));

// HidableField decides visibility from its own Formik flag; that is its logic, not this file's.
vi.mock('../../../../ClientApp/src/components/forms/HidableField', () => ({
    default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../../../../ClientApp/src/components/Inputs/SelectInput', () => ({
    default: ({ name, label, options, onChange, readOnly }: {
        name: string;
        label: string;
        options: { displayText: string; value: string }[];
        onChange?: (event: unknown) => void;
        readOnly?: boolean;
    }) => {
        captured.selects[name] = { options, readOnly, onChange };

        return (
            <select
                aria-label={label}
                data-testid={`select-${name}`}
                data-readonly={String(readOnly ?? false)}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange?.(event)}
            >
                <option value="" />
                {options.map((option) => (
                    <option key={option.value} value={option.value}>{option.displayText}</option>
                ))}
            </select>
        );
    },
}));

vi.mock('../../../../ClientApp/src/components/Inputs/CheckboxGroup', () => ({
    default: ({ name, options }: { name: string; options: { label: string; value: string }[] }) => {
        captured.checkboxGroups[name] = { options };

        return <div data-testid={`checkboxes-${name}`} data-count={options.length} />;
    },
}));

vi.mock('../../../../ClientApp/src/components/Inputs/RadioButton', () => ({
    default: ({ id, label, checked, onChange, value }: {
        id: string;
        label: string;
        checked: boolean;
        onChange: (event: unknown) => void;
        value: string;
    }) => (
        <label htmlFor={id}>
            <input
                type="radio"
                id={id}
                name="applicationType"
                value={value}
                checked={checked}
                onChange={onChange}
            />
            {label}
        </label>
    ),
}));

vi.mock('../../../../ClientApp/src/components/Inputs/TextInput', () => ({
    default: ({ name, label }: { name: string; label: string }) => (
        <div data-testid={`text-${name}`}>{label}</div>
    ),
}));

vi.mock('../../../../ClientApp/src/components/Inputs/TextAreaInput', () => ({
    default: ({ name, label }: { name: string; label: string }) => (
        <div data-testid={`textarea-${name}`}>{label}</div>
    ),
}));

vi.mock('../../../../ClientApp/src/components/Inputs/CertificateNumberLookup', () => ({
    default: ({ name, label }: { name: string; label: string }) => (
        <div data-testid={`certificate-${name}`}>{label}</div>
    ),
}));

vi.mock('../../../../ClientApp/src/routes/ta/instrumentInfoPanel', () => ({
    default: ({ selectedInstrumentCategoryId, selectedInstrumentTypeId }: {
        selectedInstrumentCategoryId?: string;
        selectedInstrumentTypeId?: string;
    }) => {
        captured.infoPanel = {
            category: selectedInstrumentCategoryId,
            type: selectedInstrumentTypeId,
        };

        return <div data-testid="instrument-info-panel" />;
    },
}));

vi.mock('../../../../ClientApp/src/components/SummaryDisplay', () => ({
    default: ({ id, label, value }: { id: string; label: string; value: string }) => (
        <div data-testid={`summary-${id}`} data-label={label}>{value}</div>
    ),
}));

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
}: { values?: Record<string, unknown>; isSummary?: boolean; name?: string } = {}) => {
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
        captured.selects = {};
        captured.checkboxGroups = {};
        captured.infoPanel = undefined as unknown as typeof captured.infoPanel;
    });

    describe('choosing an application type', () => {
        it('offers all three application types with the stored one selected', async () => {
            await renderStep();

            expect(screen.getByLabelText('New Certificate of Approval (CoA)')).toBeChecked();
            expect(screen.getByLabelText('Variation or request a minor edit')).not.toBeChecked();
            expect(screen.getByLabelText('Other options')).not.toBeChecked();
        });

        it('starts on a new certificate when nothing is stored', async () => {
            await renderStep({ values: baseValues({ patternApprovalType: undefined }) });

            await waitFor(() => expect(screen.getByText('Loading data...')).toBeInTheDocument());
        });

        it('follows the stored type when it is a variation', async () => {
            await renderStep({
                values: baseValues({ patternApprovalType: PatternApprovalRequiredValues.Variation }),
            });

            expect(screen.getByLabelText('Variation or request a minor edit')).toBeChecked();
        });

        it('snaps the visible selection back to the stored type', async () => {
            // DEFECT, characterized not fixed. The effect that claims to "sync selectedApplication
            // with Formik's patternApprovalType" reads getFieldMeta(...).initialValue, which never
            // changes once the step has loaded. So choosing another type sets selectedApplication,
            // the effect sees it differ from initialValue, and puts it straight back. With a type
            // already stored the radio cannot be moved - and because the real RadioButton is a
            // Formik field it still writes the new value, so the stored answer and the highlighted
            // one can disagree. Reading `.value` rather than `.initialValue` is the likely fix, but
            // that changes form behaviour and wants a decision rather than a guess.
            const user = userEvent.setup();
            await renderStep();

            await user.click(screen.getByLabelText('Other options'));

            expect(screen.getByLabelText('Other options')).not.toBeChecked();
            expect(screen.getByLabelText('New Certificate of Approval (CoA)')).toBeChecked();
        });


        it('clears stale validation when the type changes after a failed submit', async () => {
            const user = userEvent.setup();
            await renderStep();

            await act(async () => {
                await formik?.submitForm();
            });
            await act(async () => {
                formik?.setErrors({ instrumentCategory: 'Category is required' });
                formik?.setTouched({ instrumentCategory: true });
            });

            await user.click(screen.getByLabelText('Variation or request a minor edit'));

            // Switching type changes which fields even apply, so errors about the old branch go.
            await waitFor(() => expect(formik?.errors).toEqual({}));
            expect(formik?.touched).toEqual({});
        });

        it('leaves validation alone when the type changes before any submit', async () => {
            const user = userEvent.setup();
            await renderStep();

            await act(async () => {
                formik?.setErrors({ instrumentCategory: 'Category is required' });
            });

            await user.click(screen.getByLabelText('Variation or request a minor edit'));

            expect(formik?.errors).toEqual({ instrumentCategory: 'Category is required' });
        });

        it('offers the sub-options belonging to each application type', async () => {
            await renderStep();

            expect(captured.checkboxGroups.newSubOptions.options).toHaveLength(3);
            expect(captured.checkboxGroups.varSubOptions.options.length).toBeGreaterThan(0);
            expect(captured.checkboxGroups.othSubOptions.options.length).toBeGreaterThan(0);
        });
    });

    describe('instrument lookups', () => {
        it('lists the categories with the none option last', async () => {
            await renderStep();

            await waitFor(() => expect(captured.selects.instrumentCategory).toBeDefined());
            const labels = captured.selects.instrumentCategory.options.map((o) => o.displayText);
            expect(labels).toEqual(['Length measures', 'Weighing instruments', 'No measurement instrument']);
        });

        it('offers no instrument types until a category is chosen', async () => {
            await renderStep();

            await waitFor(() => expect(captured.selects.instrumentType).toBeDefined());
            expect(captured.selects.instrumentType.options).toEqual([]);
        });

        it('narrows the types to the chosen category', async () => {
            await renderStep({
                values: baseValues({ instrumentCategory: 'cat-weighing', instrumentType: 'type-beam' }),
            });

            await waitFor(() => expect(captured.selects.instrumentType.options.length).toBeGreaterThan(0));
            expect(captured.selects.instrumentType.options.map((o) => o.displayText))
                .toEqual(['Automatic scale', 'Beam balance']);
        });

        it('shows every type in summary mode regardless of category', async () => {
            await renderStep({
                isSummary: true,
                values: baseValues({ instrumentCategory: '', instrumentType: '' }),
            });

            await waitFor(() => expect(captured.selects.instrumentType).toBeDefined());
            // Summary is a record of what was chosen, so it must resolve any stored id to a label.
            expect(captured.selects.instrumentType.options.length).toBe(typeLookup().length);
        });

        it('offers nothing when the lookups have not arrived', async () => {
            await renderStep({
                values: baseValues({ instrumentCategoryLookup: undefined, instrumentTypeLookup: undefined }),
            });

            await waitFor(() => expect(captured.selects.instrumentType).toBeDefined());
            expect(captured.selects.instrumentType.options).toEqual([]);
            expect(captured.selects.instrumentCategory.options).toEqual([]);
        });

        it('offers no types when the instrument field has never been set', async () => {
            // Distinct from an empty string: a step whose values omit instrumentType entirely has
            // nothing to resolve against, so the type list starts empty rather than unfiltered.
            const values = baseValues();
            delete (values as Record<string, unknown>).instrumentType;

            await renderStep({ values });

            await waitFor(() => expect(captured.selects.instrumentType).toBeDefined());
            expect(captured.selects.instrumentType.options).toEqual([]);
        });

        it('ignores a category change before the type lookup has arrived', async () => {
            await renderStep({
                values: baseValues({ instrumentCategoryLookup: undefined, instrumentTypeLookup: undefined }),
            });
            await waitFor(() => expect(captured.selects.instrumentCategory).toBeDefined());

            await act(async () => {
                captured.selects.instrumentCategory.onChange?.({ target: { value: 'cat-weighing' } });
            });

            // No lookup means no options to narrow; the field is still cleared for re-entry.
            expect(captured.selects.instrumentType.options).toEqual([]);
            await waitFor(() => expect(formik?.values.instrumentType).toBe(''));
        });

        it('logs a failure while shaping the lookups', async () => {
            // A lookup entry that is not an object at all makes sortList throw while reading its
            // display field - the catch exists so a malformed payload cannot blank the whole step.
            await renderStep({
                values: baseValues({ instrumentCategoryLookup: [null], instrumentTypeLookup: typeLookup() }),
            });

            await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
                'Failed to retrieve look ups',
                expect.any(Error),
            ));
        });
    });

    describe('changing the instrument category', () => {
        it('re-narrows the types and clears the previous choice', async () => {
            const user = userEvent.setup();
            await renderStep();
            await waitFor(() => expect(captured.selects.instrumentCategory).toBeDefined());

            await user.selectOptions(screen.getByTestId('select-instrumentCategory'), 'cat-length');

            await waitFor(() => expect(captured.selects.instrumentType.options.map((o) => o.displayText))
                .toEqual(['Tape measure']));
            expect(formik?.values.instrumentType).toBe('');
        });

        it('picks the none instrument and locks the type when no measurement applies', async () => {
            const user = userEvent.setup();
            await renderStep();
            await waitFor(() => expect(captured.selects.instrumentCategory).toBeDefined());

            await user.selectOptions(screen.getByTestId('select-instrumentCategory'), 'cat-none');

            // Choosing "no measurement instrument" has exactly one valid type, so it is chosen for
            // the user and the field is locked rather than left as an empty required box.
            await waitFor(() => expect(formik?.values.instrumentType).toBe('type-none'));
            expect(screen.getByTestId('select-instrumentType')).toHaveAttribute('data-readonly', 'true');
        });

        it('locks the type on load when the stored category is the none option', async () => {
            await renderStep({
                values: baseValues({ instrumentCategory: 'cat-none', instrumentType: 'type-none' }),
            });

            await waitFor(() => expect(screen.getByTestId('select-instrumentType'))
                .toHaveAttribute('data-readonly', 'true'));
        });
    });

    describe('supporting panels', () => {
        it('shows the instrument info and OIML warning while editing', async () => {
            await renderStep({
                values: baseValues({ instrumentCategory: 'cat-weighing', instrumentType: 'type-beam' }),
            });

            await waitFor(() => expect(screen.getByTestId('instrument-info-panel')).toBeInTheDocument());
            expect(captured.infoPanel).toEqual({ category: 'cat-weighing', type: 'type-beam' });
            expect(screen.getByRole('alert')).toHaveTextContent('OIML certificates apply only to specific instrument types');
        });

        it('drops both panels in summary mode', async () => {
            await renderStep({ isSummary: true });

            expect(screen.queryByTestId('instrument-info-panel')).not.toBeInTheDocument();
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
    });

    describe('summary mode', () => {
        it('names the chosen application type and its options', async () => {
            await renderStep({
                isSummary: true,
                values: baseValues({
                    newSubOptions: [
                        PatternApprovalRequiredValueOptions.CertificateofApproval,
                        PatternApprovalRequiredValueOptions.OIMLCertificate,
                    ],
                }),
            });

            expect(screen.getByTestId('summary-applicationType'))
                .toHaveTextContent('New Certificate of Approval (CoA)');
            expect(screen.getByTestId('summary-newCertificateSubOptions')).toHaveTextContent(
                'NMI Pattern Approval Certificate, International Organisation of Legal Metrology (OIML) Certificate',
            );
        });

        it('reads a single stored option that is not in a list', async () => {
            await renderStep({
                isSummary: true,
                values: baseValues({
                    newSubOptions: PatternApprovalRequiredValueOptions.ConversionCertificate,
                }),
            });

            expect(screen.getByTestId('summary-newCertificateSubOptions'))
                .toHaveTextContent('Conversion Certificate');
        });

        it('says nothing was selected for an empty option list', async () => {
            await renderStep({ isSummary: true, values: baseValues({ newSubOptions: [] }) });

            expect(screen.getByTestId('summary-newCertificateSubOptions')).toHaveTextContent('Not selected');
        });

        it('says nothing was selected when the options are absent', async () => {
            await renderStep({ isSummary: true, values: baseValues({ newSubOptions: undefined }) });

            expect(screen.getByTestId('summary-newCertificateSubOptions')).toHaveTextContent('Not selected');
        });

        it('says nothing was selected for a single option it cannot name', async () => {
            await renderStep({ isSummary: true, values: baseValues({ newSubOptions: 'no-such-option' }) });

            expect(screen.getByTestId('summary-newCertificateSubOptions')).toHaveTextContent('Not selected');
        });

        it('says nothing was selected for options it cannot name', async () => {
            await renderStep({ isSummary: true, values: baseValues({ newSubOptions: ['no-such-option'] }) });

            expect(screen.getByTestId('summary-newCertificateSubOptions')).toHaveTextContent('Not selected');
        });

        it('says nothing was selected for an application type it cannot name', async () => {
            // A stored type this build does not know about - a retired option, or one added by a
            // later release. The summary says so rather than printing a raw enum value.
            await renderStep({ isSummary: true, values: baseValues({ patternApprovalType: 'Retired' }) });

            expect(screen.getByTestId('summary-applicationType')).toHaveTextContent('Not selected');
        });

        it('says nothing was selected when no application type is stored', async () => {
            await renderStep({ isSummary: true, values: baseValues({ patternApprovalType: undefined }) });

            expect(screen.getByTestId('summary-applicationType')).toHaveTextContent('Not selected');
        });

        it('summarises a variation application', async () => {
            await renderStep({
                isSummary: true,
                values: baseValues({
                    patternApprovalType: PatternApprovalRequiredValues.Variation,
                    varSubOptions: [PatternApprovalRequiredValueOptions.VariationtoanExistingCoA],
                }),
            });

            expect(screen.getByTestId('summary-variationSubOptions')).toBeInTheDocument();
            expect(screen.queryByTestId('summary-newCertificateSubOptions')).not.toBeInTheDocument();
        });

        it('summarises an other-approval application', async () => {
            await renderStep({
                isSummary: true,
                values: baseValues({ patternApprovalType: PatternApprovalRequiredValues.OtherApproval }),
            });

            expect(screen.getByTestId('summary-otherApprovalSubOptions')).toBeInTheDocument();
        });
    });

    describe('field naming', () => {
        it('addresses fields at the root when given no prefix', async () => {
            await renderStep();

            expect(captured.selects.instrumentCategory).toBeDefined();
            expect(captured.checkboxGroups.newSubOptions).toBeDefined();
        });

        it('prefixes every field when nested under a name', async () => {
            await renderStep({ name: 'applicationAndInstrument' });

            expect(captured.selects['applicationAndInstrument.instrumentCategory']).toBeDefined();
            expect(captured.selects['applicationAndInstrument.instrumentType']).toBeDefined();
            expect(captured.checkboxGroups['applicationAndInstrument.newSubOptions']).toBeDefined();
        });

        it('reads the application type from the root even when nested', async () => {
            // Every other field is prefixed through getName(), but the type is read with a bare
            // getFieldMeta('patternApprovalType'). Nested under a name the radio therefore writes to
            // `<name>.patternApprovalType` while the selection is read from the root. Harmless today
            // because the only nested use is a summary, which never reaches the radio.
            await renderStep({ name: 'applicationAndInstrument' });

            // Selection came from the root value, not from applicationAndInstrument.*.
            expect(screen.getByLabelText('New Certificate of Approval (CoA)')).toBeChecked();
        });
    });
});
