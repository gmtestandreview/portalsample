import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import type { Resolver, UseFormReturn } from 'react-hook-form';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RhfCertificateNumberLookup from '@/components/Inputs/RhfCertificateNumberLookup';
import type { RhfCertificateNumberLookupProps } from '@/components/Inputs/RhfCertificateNumberLookup';

interface LookupValues {
  certNumber?: string | undefined;
  certNumberId?: string | undefined;
  certNameOptions?: unknown[] | undefined;
  id?: string | undefined;
}

const alpha = { id: 'id-alpha', lookupName: 'Alpha Certificate' };
const zulu = { id: 'id-zulu', lookupName: 'Zulu Certificate' };

const requiredResolver: Resolver<LookupValues> = () => ({
  values: {},
  errors: {
    certNumber: { type: 'required', message: 'Enter a certificate number' },
  },
});

const ctx: { methods?: UseFormReturn<LookupValues> } = {};

const Harness = ({
  children,
  values,
  resolver,
}: Readonly<{
  children: ReactNode;
  values: LookupValues;
  resolver?: Resolver<LookupValues>;
}>) => {
  const methods = useForm<LookupValues>({
    defaultValues: values,
    ...(resolver === undefined ? {} : { resolver }),
  });
  ctx.methods = methods;
  const { touchedFields, dirtyFields, errors } = methods.formState;
  return (
    <FormProvider {...methods}>
      <form>{children}</form>
      <button
        type='button'
        onClick={() => {
          void methods.handleSubmit(() => undefined)();
        }}
      >
        Submit
      </button>
      <output data-testid='number'>{methods.watch('certNumber')}</output>
      <output data-testid='number-id'>{methods.watch('certNumberId')}</output>
      <output data-testid='state'>
        {JSON.stringify({
          touched: touchedFields,
          dirty: dirtyFields,
          error: errors.certNumber?.message,
        })}
      </output>
    </FormProvider>
  );
};

const renderLookup = (
  options: unknown[] = [alpha, zulu],
  props: Partial<RhfCertificateNumberLookupProps> = {},
  extra: Partial<LookupValues> = {},
) =>
  render(
    <Harness
      values={{
        certNumber: '',
        certNumberId: '',
        certNameOptions: options,
        ...extra,
      }}
    >
      <RhfCertificateNumberLookup
        name='certNumber'
        idName='certNumberId'
        label='Certificate number'
        optionsFieldName='lookupName'
        {...props}
      />
    </Harness>,
  );

const getInput = () =>
  screen.getByRole('combobox', { name: 'Certificate number' });

const typeAndSettle = async (
  user: ReturnType<typeof userEvent.setup>,
  text: string,
) => {
  await user.type(getInput(), text);
  act(() => {
    vi.advanceTimersByTime(400);
  });
};

const setup = () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  return userEvent.setup({ delay: null });
};

describe(RhfCertificateNumberLookup, () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes typed text to the field without touching it or the id field', async () => {
    expect.hasAssertions();

    const user = setup();
    renderLookup();
    await user.type(getInput(), 'Alp');

    expect(screen.getByTestId('number')).toHaveTextContent('Alp');
    expect(screen.getByTestId('number-id')).toBeEmptyDOMElement();
    expect(JSON.parse(screen.getByTestId('state').textContent)).toMatchObject({
      touched: {},
      dirty: { certNumber: true },
    });
  });

  it('suggests sorted matches and selecting one writes the number and its id, touched and dirty', async () => {
    expect.hasAssertions();

    const user = setup();
    renderLookup([zulu, alpha, { id: 'x', lookupName: 'Other' }]);
    await typeAndSettle(user, 'cert');

    const options = await screen.findAllByRole('option');

    expect(options.map((option) => option.textContent)).toStrictEqual([
      'Alpha Certificate',
      'Zulu Certificate',
    ]);

    await user.click(screen.getByRole('option', { name: /Zulu/ }));

    expect(screen.getByTestId('number')).toHaveTextContent('Zulu Certificate');
    expect(screen.getByTestId('number-id')).toHaveTextContent('id-zulu');
    expect(JSON.parse(screen.getByTestId('state').textContent)).toMatchObject({
      touched: { certNumber: true, certNumberId: true },
      dirty: { certNumber: true, certNumberId: true },
    });
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('needs at least two characters before suggesting', async () => {
    expect.hasAssertions();

    const user = setup();
    renderLookup();
    await typeAndSettle(user, 'a');

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it.each([
    ['startsWith', 'Al', ['Alpha Certificate']],
    ['endsWith', 'cate', ['Alpha Certificate', 'Zulu Certificate']],
  ] as const)('supports the %s match', async (matchType, text, expected) => {
    expect.hasAssertions();

    const user = setup();
    renderLookup([alpha, zulu], { matchType });
    await typeAndSettle(user, text);
    const options = await screen.findAllByRole('option');

    expect(options.map((option) => option.textContent)).toStrictEqual(expected);
  });

  it('limits the number of suggestions to maxResults before sorting', async () => {
    expect.hasAssertions();

    const user = setup();
    renderLookup([zulu, alpha, { id: 'm', lookupName: 'Mid Certificate' }], {
      maxResults: 2,
    });
    await typeAndSettle(user, 'cert');
    const options = await screen.findAllByRole('option');

    expect(options.map((option) => option.textContent)).toStrictEqual([
      'Alpha Certificate',
      'Zulu Certificate',
    ]);
  });

  it('ignores malformed records and shows nothing without a lookup field', async () => {
    expect.hasAssertions();

    const user = setup();
    const view = renderLookup([null, 'text', { lookupName: 123 }, alpha]);
    await typeAndSettle(user, 'Alpha');

    await expect(screen.findAllByRole('option')).resolves.toHaveLength(1);

    view.unmount();
    const second = renderLookup([alpha], { optionsFieldName: 'missing' });
    await typeAndSettle(user, 'Alpha');

    expect(screen.queryByRole('option')).not.toBeInTheDocument();

    second.unmount();
    renderLookup([alpha], { optionsFieldName: '' });
    await typeAndSettle(user, 'Alpha');

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('shows nothing when no optionsFieldName is configured', async () => {
    expect.hasAssertions();

    const user = setup();
    renderLookup([alpha], { optionsFieldName: undefined as never });
    await typeAndSettle(user, 'Alpha');

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('treats missing options as no suggestions', async () => {
    expect.hasAssertions();

    const user = setup();
    renderLookup(undefined, {}, { certNameOptions: undefined });
    await typeAndSettle(user, 'Alpha');

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('filters by the parent field when both parent names are configured', async () => {
    expect.hasAssertions();

    const user = setup();
    renderLookup(
      [
        { id: '1', lookupName: 'Zulu Certificate', parent: 'NMI' },
        { id: '2', lookupName: 'Alpha Certificate', parent: 'NMI' },
        { id: '3', lookupName: 'Alpha Industry', parent: 'Industry' },
      ],
      {
        parentName: 'parentValue',
        parentOptionsName: 'parent',
        matchType: 'startsWith',
      },
      { parentValue: 'NMI' } as Partial<LookupValues>,
    );
    await typeAndSettle(user, 'Al');
    const options = await screen.findAllByRole('option');

    expect(options.map((option) => option.textContent)).toStrictEqual([
      'Alpha Certificate',
    ]);
  });

  it('shows no suggestions when the parent field points at a field the records lack', async () => {
    expect.hasAssertions();

    // Mirrors the Variation step: parentName is set but no parentOptionsName, so no
    // record can match the parent and the list stays empty. Preserved from Formik.
    const user = setup();
    renderLookup([alpha], { parentName: 'id' }, { id: 'app-1' });
    await typeAndSettle(user, 'Alpha');

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('uses the unfiltered list when the parent field has no value', async () => {
    expect.hasAssertions();

    const user = setup();
    renderLookup([alpha], { parentName: 'id' });
    await typeAndSettle(user, 'Alpha');

    await expect(screen.findAllByRole('option')).resolves.toHaveLength(1);
  });

  it('closes the suggestions on Escape and reopens them when the text changes', async () => {
    expect.hasAssertions();

    const user = setup();
    renderLookup();
    await typeAndSettle(user, 'Alp');
    await screen.findAllByRole('option');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('option')).not.toBeInTheDocument();

    await typeAndSettle(user, 'h');

    await expect(screen.findAllByRole('option')).resolves.toHaveLength(1);
  });

  it('selects a suggestion whose name and id are blank', async () => {
    expect.hasAssertions();

    const user = setup();
    renderLookup([{ parent: 'Alpha' }], { optionsFieldName: 'parent' });
    await typeAndSettle(user, 'Al');
    await user.click(await screen.findByRole('option'));

    expect(screen.getByTestId('number')).toBeEmptyDOMElement();
    expect(screen.getByTestId('number-id')).toBeEmptyDOMElement();
  });

  it('marks the field touched on blur and shows the validation message after submit', async () => {
    expect.hasAssertions();

    const user = setup();
    render(
      <Harness
        values={{ certNumber: '', certNumberId: '', certNameOptions: [] }}
        resolver={requiredResolver}
      >
        <RhfCertificateNumberLookup
          name='certNumber'
          idName='certNumberId'
          label='Certificate number'
          optionsFieldName='lookupName'
          inlineHelp='For example: 5/6A/91B'
        />
      </Harness>,
    );
    await user.click(getInput());
    await user.tab();
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await expect(
      screen.findByText('Enter a certificate number'),
    ).resolves.toBeVisible();
    expect(getInput()).toHaveAttribute('aria-invalid', 'true');
    expect(getInput()).toHaveAccessibleDescription(
      /For example: 5\/6A\/91B.*Enter a certificate number/,
    );
  });

  it('starts empty for an undefined value and follows external changes', async () => {
    expect.hasAssertions();

    const user = setup();
    renderLookup([alpha], {}, { certNumber: undefined });

    expect(getInput()).toHaveValue('');

    await user.type(getInput(), 'Alpha');

    expect(getInput()).toHaveValue('Alpha');

    act(() => {
      ctx.methods?.setValue('certNumber', undefined);
    });

    expect(getInput()).toHaveValue('');
  });

  it('renders the default label, placeholder, id and titled help', () => {
    expect.hasAssertions();

    renderLookup([], {
      label: undefined,
      id: 'cert-id',
      placeholder: 'Find one',
      inlineHelpTitle: 'Tip',
      inlineHelp: 'For example',
    });

    const input = screen.getByRole('combobox', {
      name: 'Certificate number',
    });

    expect(input).toHaveAttribute('id', 'cert-id');
    expect(input).toHaveAttribute('placeholder', 'Find one');
    expect(screen.getByText('Tip')).toBeInTheDocument();
    expect(screen.getByText(/For example/)).toBeInTheDocument();
  });

  it('renders titled help without a help body', () => {
    expect.hasAssertions();

    renderLookup([], { inlineHelpTitle: 'Only title' });

    expect(screen.getByText('Only title')).toBeInTheDocument();
  });

  it('renders the value, or a dash, in summary mode', () => {
    expect.hasAssertions();

    const view = renderLookup([], { isSummary: true }, { certNumber: '5/6A' });

    expect(screen.getByText('5/6A', { selector: 'p' })).toBeInTheDocument();

    view.unmount();
    renderLookup([], { isSummary: true });

    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
