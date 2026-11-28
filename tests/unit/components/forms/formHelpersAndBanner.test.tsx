import { describe, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import { MemoryRouter, useLocation } from 'react-router';
import * as Yup from 'yup';
import Details from '@/components/forms/Details';
import FormBanner from '@/components/forms/FormBanner';
import RhfUnsavedFormPrompt from '@/components/forms/UnsavedFormPrompt/RhfUnsavedFormPrompt';
import type { RouteLeavingGuardProps } from '@/components/RouteLeavingGuard/types';
import { isHidden, removeHidden, validateForm } from '@/components/forms/utils';
import type { ValidationSchema } from '@/components/forms/types';
import { FieldHarness } from '../inputs/rhfTestHarness';

vi.mock(
  import('@/components/RouteLeavingGuard'),
  () =>
    ({
      default: ({
        when,
        title,
        body,
        cancelBtn: _cancelBtn,
        confirmBtn,
      }: Readonly<RouteLeavingGuardProps>) => (
        <div
          data-testid='route-leaving-guard'
          data-when={String(Boolean(when))}
          data-title={title ?? ''}
          data-body={body ?? ''}
          data-confirm={confirmBtn ?? ''}
        />
      ),
    }) satisfies Partial<__TestMockModule20>,
);

const NameInput = () => {
  const { register } = useFormContext();

  return (
    <>
      <label htmlFor='name'>Name</label>
      <input id='name' {...register('name')} />
    </>
  );
};

function LocationProbe() {
  const location = useLocation();
  return <p data-testid='location'>{location.pathname}</p>;
}

describe('form helper components', () => {
  it('renders Details as a native disclosure with supplied help content', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    render(
      <Details
        id='details-help'
        title='Why we ask'
        inlineHelp={<p>Used for service updates.</p>}
      />,
    );

    const disclosure = screen.getByText('Why we ask').closest('details');

    expect(disclosure).toHaveAttribute('id', 'details-help');
    expect(disclosure).not.toHaveAttribute('open');

    await user.click(screen.getByText('Why we ask'));

    expect(disclosure).toHaveAttribute('open');
    expect(screen.getByText('Used for service updates.')).toBeInTheDocument();
  });

  it('renders FormBanner title metadata and navigates after discard callback', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const onDiscard = vi.fn<() => void>();

    render(
      <MemoryRouter initialEntries={['/quote/edit']}>
        <FormBanner
          title='Request for quote'
          refTitle='RFQ-123'
          subTitle='Acme Pty Ltd'
          discard={{
            onDiscard,
            locationOnDiscard: '/dashboard',
            discardButtonTitle: 'Discard draft',
          }}
        />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(screen.getByText('Request for quote')).toBeInTheDocument();
    expect(screen.getByText('RFQ-123')).toBeInTheDocument();
    expect(screen.getByText('Acme Pty Ltd')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Discard draft/i }));

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard');
  });

  it('renders FormBanner dashboard action without optional title metadata', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const { rerender } = render(
      <MemoryRouter>
        <FormBanner
          title='Create account'
          refTitle=''
          subTitle={null}
          showGoToDashboardButton
        />
      </MemoryRouter>,
    );

    expect(screen.queryByText('RFQ-123')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Go to dashboard/i }),
    ).toHaveAttribute('href', '/dashboard');

    rerender(
      <MemoryRouter>
        <FormBanner
          title='Update contact'
          discard={{
            locationOnDiscard: '/dashboard',
          }}
        />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('button', { name: /Discard changes/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Discard changes/i }));

    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard');
  });

  it('passes create-account logout wording to RhfUnsavedFormPrompt when dirty and unsubmitted', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();

    render(
      <FieldHarness field='name' defaultValue=''>
        <NameInput />
        <RhfUnsavedFormPrompt path='/create-account/' />
      </FieldHarness>,
    );

    await user.type(screen.getByLabelText('Name'), 'Alex');

    const guard = screen.getByTestId('route-leaving-guard');

    expect(guard).toHaveAttribute('data-when', 'true');
    expect(guard).toHaveAttribute(
      'data-title',
      'Are you sure you want to log out?',
    );
    expect(guard).toHaveAttribute('data-confirm', 'Yes, logout');
  });

  it('uses logout wording for create-contact paths', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();

    render(
      <FieldHarness field='name' defaultValue=''>
        <NameInput />
        <RhfUnsavedFormPrompt path='/create-contact/' />
      </FieldHarness>,
    );

    await user.type(screen.getByLabelText('Name'), 'Alex');

    expect(screen.getByTestId('route-leaving-guard')).toHaveAttribute(
      'data-title',
      'Are you sure you want to log out?',
    );
  });

  it('allows a clean, unsubmitted form to leave', async () => {
    expect.hasAssertions();

    // Validity settles asynchronously after mount; wait for it before asserting.
    await act(async () => {
      render(
        <FieldHarness field='name' defaultValue=''>
          <RhfUnsavedFormPrompt />
        </FieldHarness>,
      );
      await Promise.resolve();
    });

    expect(screen.getByTestId('route-leaving-guard')).toHaveAttribute(
      'data-when',
      'false',
    );
  });
});

describe('form utility helpers', () => {
  it('detects hidden fields from direct, group, ancestor, and callback rules', () => {
    expect.hasAssertions();

    const values = { applicant: { sameAddress: true } };
    const hidden = {
      applicant: {
        residentialAddress: {
          this: ({ applicant }: typeof values) => applicant.sameAddress,
        },
        phone: true,
      },
    };

    expect(isHidden('applicant.phone', hidden as never, values)).toBe(true);
    expect(
      isHidden('applicant.residentialAddress.street', hidden as never, values),
    ).toBe(true);
    expect(isHidden('applicant.email', hidden as never, values)).toBe(false);
  });

  it.each([
    ['a.b', true],
    ['a.b.c', true],
    ['a[0]', true],
    ['a[0][1]', true],
    ['a.b[0]', true],
    ['a[0.b]', true],
    ['a[[0]', true],
    ['a', true],
    ['x.b', false],
    ['x[0]', false],
  ])(
    'hides %s when its ancestor is flagged hidden: %s',
    (fieldPath, expected) => {
      expect.hasAssertions();

      const hidden = { a: true };

      expect(isHidden(fieldPath, hidden as never, {})).toBe(expected);
    },
  );

  it.each(['a', 'a.', 'a[]', '[0]'])(
    'treats %s as having no parent segment to inherit from',
    (fieldPath) => {
      expect.hasAssertions();

      const hidden = { b: true };

      expect(isHidden(fieldPath, hidden as never, {})).toBe(false);
    },
  );

  it('does not let a hidden sibling index hide its neighbours', () => {
    expect.hasAssertions();

    const hidden = { a: { b: true } };

    expect(isHidden('a.b[0]', hidden as never, {})).toBe(true);
    expect(isHidden('a.c[0]', hidden as never, {})).toBe(false);
    expect(isHidden('a[0]', hidden as never, {})).toBe(false);
  });

  it('hides a child through a group-level this flag on its parent', () => {
    expect.hasAssertions();

    const hidden = { parent: { this: true } };

    expect(isHidden('parent.child', hidden as never, {})).toBe(true);
    expect(isHidden('parent.child[2]', hidden as never, {})).toBe(true);
    expect(isHidden('other.child', hidden as never, {})).toBe(false);
  });

  it('removes hidden object fields while preserving visible array entries', () => {
    expect.hasAssertions();

    const values = {
      applicant: {
        name: 'Alex',
        phone: '0400000000',
        addresses: [{ street: 'Visible street', secret: 'Hidden note' }],
      },
    };
    const hidden = {
      applicant: { phone: true },
      addresses: {
        secret: true,
      },
    };

    expect(removeHidden(values, values, hidden as never)).toStrictEqual({
      applicant: {
        name: 'Alex',
        addresses: [{ street: 'Visible street' }],
      },
    });

    expect(removeHidden({ tags: ['visible'] }, values, {})).toStrictEqual({
      tags: ['visible'],
    });

    // A nullish field value falls back to an empty object rather than throwing
    // when Object.entries is called.
    expect(removeHidden(undefined, values, {})).toStrictEqual({});
  });

  it('validates forms and filters Yup errors for hidden fields', async () => {
    expect.hasAssertions();

    const schema = Yup.object({
      name: Yup.string().required('Name is required'),
      phone: Yup.string().required('Phone is required'),
    });

    const errors = await validateForm(schema, { phone: true })({
      name: '',
      phone: '',
    });

    expect(errors).toStrictEqual({ name: 'Name is required' });
  });

  it('maps a single Yup validation error when the field is visible', async () => {
    expect.hasAssertions();

    const error = new Yup.ValidationError('Name is required', '', 'name');
    const schema = {
      validate: vi.fn<ValidationSchema['validate']>().mockRejectedValue(error),
    };

    await expect(validateForm(schema, {})({ name: '' })).resolves.toStrictEqual(
      {
        name: 'Name is required',
      },
    );
  });

  it('returns no errors without a schema and rethrows non-validation failures', async () => {
    expect.hasAssertions();
    await expect(
      validateForm(undefined, {})({ name: '' }),
    ).resolves.toStrictEqual({});

    const schema = {
      validate: vi
        .fn<ValidationSchema['validate']>()
        .mockRejectedValue(new Error('Network failed')),
    };

    await expect(validateForm(schema, {})({ name: '' })).rejects.toThrow(
      'Network failed',
    );
  });

  it('returns no errors for ValidationError-shaped failures without inner errors', async () => {
    expect.hasAssertions();

    const noInner = {
      validate: vi.fn<ValidationSchema['validate']>().mockRejectedValue({
        name: 'ValidationError',
        message: 'Invalid',
        path: 'name',
        inner: undefined,
      }),
    };
    const emptyInnerWithoutPath = {
      validate: vi.fn<ValidationSchema['validate']>().mockRejectedValue({
        name: 'ValidationError',
        message: 'Invalid',
        path: undefined,
        inner: [],
      }),
    };

    await expect(
      validateForm(noInner, {})({ name: '' }),
    ).resolves.toStrictEqual({});
    await expect(
      validateForm(emptyInnerWithoutPath, {})({ name: '' }),
    ).resolves.toStrictEqual({});
  });
});
