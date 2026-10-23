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

vi.mock(import('../../../../ClientApp/src/instrumentation/AppLogger'), () => ({
  default: { verbose: vi.fn(), error: vi.fn(), trace: vi.fn() },
}));

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
  { banner, showButtons }: Setup = {}
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
        const { user } = await renderShell(kind);
        const input = screen.getByLabelText('name');

        await user.type(input, 'a');
        await user.clear(input);

        expect(
          screen.queryByTestId('form-error-summary')
        ).not.toBeInTheDocument();
      });

      it('lists the message with a link to the field after an invalid submit', async () => {
        const { user, onSubmit } = await renderShell(kind);

        await user.click(screen.getByTestId('submit-button'));

        await expect(screen.findByRole('alert')).resolves.toHaveTextContent(
          'Name: Name is required'
        );
        expect(
          screen.getByRole('link', { name: 'Name: Name is required' })
        ).toHaveAttribute('href', '#name');
        expect(onSubmit).not.toHaveBeenCalled();
      });

      it('takes focus after an invalid submit and leaves the field unfocused', async () => {
        const { user } = await renderShell(kind);

        await user.click(screen.getByTestId('submit-button'));

        await waitFor(() =>
          expect(screen.getByTestId('form-error-summary')).toHaveFocus()
        );

        expect(screen.getByLabelText('name')).not.toHaveFocus();
      });

      it('clears once the field is corrected and the form is submitted', async () => {
        const { user, onSubmit } = await renderShell(kind);

        await user.click(screen.getByTestId('submit-button'));
        await screen.findByTestId('form-error-summary');
        await user.type(screen.getByLabelText('name'), 'Alex');
        await user.click(screen.getByTestId('submit-button'));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

        expect(payloadOf(onSubmit)).toEqual({ name: 'Alex' });
        expect(
          screen.queryByTestId('form-error-summary')
        ).not.toBeInTheDocument();
      });
    });

    describe('save and submit buttons', () => {
      it('submits with the hard schema and the default labels', async () => {
        const { user, onSubmit, onSaveAndExit } = await renderShell(kind);

        expect(screen.getByTestId('submit-button')).toHaveTextContent('Submit');
        expect(screen.getByTestId('save-and-exit-button')).toHaveTextContent(
          'Save and exit'
        );

        await user.type(screen.getByLabelText('name'), 'Alex');
        await user.click(screen.getByTestId('submit-button'));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

        expect(onSaveAndExit).not.toHaveBeenCalled();
      });

      it('save and exit uses the soft schema, calls its handler and sends no mode flags', async () => {
        const { user, onSubmit, onSaveAndExit } = await renderShell(kind);

        await user.click(screen.getByTestId('save-and-exit-button'));

        await waitFor(() => expect(onSaveAndExit).toHaveBeenCalledTimes(1));

        expect(onSubmit).not.toHaveBeenCalled();

        const payload = payloadOf(onSaveAndExit) as Record<string, unknown>;

        expect(payload).not.toHaveProperty('saveAndExit');
        expect(payload).not.toHaveProperty('saveAndExitClick');
        expect(
          screen.queryByTestId('form-error-summary')
        ).not.toBeInTheDocument();
      });

      it('a submit after a save and exit is validated with the hard schema again', async () => {
        const { user, onSubmit } = await renderShell(kind);

        await user.click(screen.getByTestId('save-and-exit-button'));
        await user.click(screen.getByTestId('submit-button'));

        await expect(screen.findByRole('alert')).resolves.toHaveTextContent(
          'Name is required'
        );
        expect(onSubmit).not.toHaveBeenCalled();
      });
    });

    describe('unsaved route-leaving prompt', () => {
      it('lets a clean form leave', async () => {
        const { leave, currentPath } = await renderShell(kind);

        await leave();

        expect(currentPath()).toBe('/other');
      });

      it('blocks a dirty form, stays on cancel and leaves on discard', async () => {
        const { user, leave, currentPath } = await renderShell(kind);
        await user.type(screen.getByLabelText('name'), 'x');
        // Blur now, inside user-event's act: the modal would otherwise take
        // focus later and the blur validation would land outside act.
        await user.tab();
        await act(async () => {});

        await leave();

        await expect(
          screen.findByTestId('prompt-save-modal')
        ).resolves.toBeInTheDocument();
        expect(currentPath()).toBe('/form');

        // The modal takes focus from the input: the blur validates asynchronously.
        await act(async () => {});

        await user.click(screen.getByTestId('prompt-cancel-button'));
        await waitFor(() =>
          expect(
            screen.queryByTestId('prompt-save-modal')
          ).not.toBeInTheDocument()
        );

        expect(currentPath()).toBe('/form');

        await leave();
        const leaveButton = await screen.findByTestId('prompt-leave-button');
        await act(async () => {});
        await user.click(leaveButton);
        await waitFor(() => expect(currentPath()).toBe('/other'));
      });

      it('lets a dirty form leave once a valid submit has succeeded', async () => {
        const { user, onSubmit, leave, currentPath } = await renderShell(kind);
        await user.type(screen.getByLabelText('name'), 'Alex');
        await user.click(screen.getByTestId('submit-button'));
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

        await leave();

        expect(currentPath()).toBe('/other');
      });

      it('blocks a clean form whose last submit was rejected', async () => {
        const { user, leave, currentPath } = await renderShell(kind);
        await user.click(screen.getByTestId('submit-button'));
        await screen.findByTestId('form-error-summary');

        await leave();

        await expect(
          screen.findByTestId('prompt-save-modal')
        ).resolves.toBeInTheDocument();
        expect(currentPath()).toBe('/form');
      });
    });

    describe('banner slot', () => {
      it('renders nothing unless asked', async () => {
        await renderShell(kind, { showButtons: false });

        expect(
          screen.queryByTestId('save-and-exit-button')
        ).not.toBeInTheDocument();
      });

      it('renders the title and a Save and exit that runs the shell save', async () => {
        const { user, onSaveAndExit } = await renderShell(kind, {
          showButtons: false,
          banner: { showBanner: true, bannerTitle: 'Accept quote' },
        });

        expect(screen.getByText('Accept quote')).toBeInTheDocument();

        await user.click(screen.getByTestId('save-and-exit-button'));

        await waitFor(() => expect(onSaveAndExit).toHaveBeenCalledTimes(1));
      });

      it('renders a caller-supplied banner instead of the standard one', async () => {
        await renderShell(kind, {
          showButtons: false,
          banner: { showBanner: true, banner: <div>Custom banner</div> },
        });

        expect(screen.getByText('Custom banner')).toBeInTheDocument();
        expect(
          screen.queryByTestId('save-and-exit-button')
        ).not.toBeInTheDocument();
      });

      it('discard navigates to its location', async () => {
        const { user, currentPath } = await renderShell(kind, {
          showButtons: false,
          banner: {
            showBanner: true,
            discard: { locationOnDiscard: '/other' },
          },
        });

        await user.click(screen.getByTestId('discard-changes-button'));

        await waitFor(() => expect(currentPath()).toBe('/other'));
      });
    });
  }
);

describe('rHF summary sanitisation', () => {
  it('renders messages only: no DOM ref text reaches the summary', async () => {
    const { user, container } = await renderShell('rhf');

    await user.click(screen.getByTestId('submit-button'));
    await screen.findByTestId('form-error-summary');

    const summary = screen.getByTestId('form-error-summary');

    expect(summary.textContent).not.toMatch(/HTML|\[object/);
    expect(container.querySelector('#form-error-summary')).toBe(summary);
  });
});
