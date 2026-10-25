import { act, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { Form, useField } from 'formik';

import { useFormContext } from 'react-hook-form';

import { describe, expect, it, vi } from 'vitest';

import * as Yup from 'yup';

import ErrorSummary from '../../../../ClientApp/src/components/forms/ErrorSummary';

import FormBannerSlot from '../../../../ClientApp/src/components/forms/FormBannerSlot';

import FormikForm from '../../../../ClientApp/src/components/forms/FormikForm';

import RhfForm from '../../../../ClientApp/src/components/forms/RhfForm';

import SaveAndExitButton from '../../../../ClientApp/src/components/forms/SaveAndExitButton';

import SubmitFormButton from '../../../../ClientApp/src/components/forms/SubmitFormButton';

import RhfUnsavedFormPrompt from '../../../../ClientApp/src/components/forms/UnsavedFormPrompt/RhfUnsavedFormPrompt';

import { renderWithRouter } from '../../helpers/renderWithRouter';

vi.mock(
  import('../../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: { verbose: vi.fn(), error: vi.fn(), trace: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

/**
 * The shell contract: one suite, run against the Formik shell and the RHF
 * shell. Both must show the same summary, run the same save and submit intents,
 * guard navigation the same way and render the same banner.
 */

interface Values {
  name: string;
}

const hard = Yup.object({
  name: Yup.string().required('Name is required'),
});

const soft = Yup.object({});

interface BannerProps {
  showBanner?: boolean;
  bannerTitle?: string;
  banner?: React.ReactNode;
  discard?: { locationOnDiscard?: string };
}

interface Setup {
  banner?: BannerProps;
  showButtons?: boolean;
}

const FormikField = ({ name }: { name: string }) => {
  const [field] = useField<string>(name);
  return <input aria-label={name} {...field} value={field.value ?? ''} />;
};

const RhfField = ({ name }: { name: string }) => {
  const { register } = useFormContext();
  return <input aria-label={name} {...register(name)} />;
};

const Body = ({
  Field,
  banner,
  showButtons = true,
}: {
  Field: typeof FormikField;
  banner?: BannerProps | undefined;
  showButtons?: boolean;
}) => (
  <>
    <FormBannerSlot
      banner={banner?.banner}
      showBanner={banner?.showBanner}
      title={banner?.bannerTitle}
      discard={banner?.discard}
    />
    <ErrorSummary />
    <Field name='name' />
    {showButtons && (
      <>
        <SaveAndExitButton />
        <SubmitFormButton />
      </>
    )}
  </>
);

const renderShell = async (
  kind: 'formik' | 'rhf',
  { banner, showButtons }: Setup = {},
) => {
  const onSubmit = vi.fn(async (..._args: unknown[]) => undefined);
  const onSaveAndExit = vi.fn(async (..._args: unknown[]) => undefined);
  const initialValues: Values = { name: '' };

  const element =
    kind === 'formik' ? (
      <FormikForm<Values>
        initialValues={initialValues}
        validateHard={hard}
        validateSoft={soft}
        onSubmit={onSubmit}
        onSaveAndExit={onSaveAndExit}
        promptPath='/form'
      >
        {({ handleSubmit }) => (
          <Form onSubmit={handleSubmit}>
            <Body
              Field={FormikField}
              banner={banner}
              showButtons={showButtons ?? true}
            />
          </Form>
        )}
      </FormikForm>
    ) : (
      <RhfForm<Values>
        initialValues={initialValues}
        validateHard={hard}
        validateSoft={soft}
        onSubmit={onSubmit}
        onSaveAndExit={onSaveAndExit}
      >
        {({ onFormSubmit }) => (
          <form onSubmit={onFormSubmit} noValidate>
            <RhfUnsavedFormPrompt path='/form' />
            <Body
              Field={RhfField}
              banner={banner}
              showButtons={showButtons ?? true}
            />
          </form>
        )}
      </RhfForm>
    );

  const view = renderWithRouter(element, {
    initialPath: '/form',
    extraRoutes: [{ path: '/other', element: <div>Other page</div> }],
  });
  const leave = (to = '/other') =>
    act(async () => {
      await view.router.navigate(to);
    });

  // Let RHF's mount-time validation settle inside act before the test starts.
  await act(async () => {});

  return { ...view, onSubmit, onSaveAndExit, leave, user: userEvent.setup() };
};

const payloadOf = (spy: { mock: { calls: unknown[][] } }) =>
  spy.mock.calls[0]?.[0];

describe.each(['formik', 'rhf'] as const)(
  'form shell contract (%s)',
  (kind) => {
    describe('error summary', () => {
      it('stays hidden until the first submit, even with a field error', async () => {
        expect.assertions(1);
        const { user } = await renderShell(kind);
        const input = screen.getByLabelText('name');

        await user.type(input, 'a');
        await user.clear(input);

        expect(
          screen.queryByTestId('form-error-summary'),
        ).not.toBeInTheDocument();
      });
    });
  },
);

describe.each(['formik', 'rhf'] as const)(
  'form shell contract (%s)',
  (kind) => {
    describe('error summary', () => {
      it('lists the message with a link to the field after an invalid submit', async () => {
        expect.assertions(3);
        const { user, onSubmit } = await renderShell(kind);

        await user.click(screen.getByTestId('submit-button'));

        await expect(screen.findByRole('alert')).resolves.toHaveTextContent(
          'Name: Name is required',
        );
        expect(
          screen.getByRole('link', { name: 'Name: Name is required' }),
        ).toHaveAttribute('href', '#name');
        expect(onSubmit).not.toHaveBeenCalled();
      });
    });
  },
);
