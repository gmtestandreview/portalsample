import preview from '../../../../../.storybook/preview';
import { expect, within } from 'storybook/test';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import ErrorSummary from '.';

const meta = preview.meta({
  title: 'Components/Forms/ErrorSummary',
  component: ErrorSummary,
  decorators: [withPortalProviders],
  parameters: {
    portal: {
      formik: {
        initialValues: {},
      },
    },
  },
});


/**
 * Server 500 — generic internal server error with no ValidationProblemDetails.errors.
 * The component falls through to the default switch branch and renders "Server error".
 */
export const ServerError = meta.story({
  args: {
    serverErrors: {
      title: 'Internal Server Error',
      status: 500,
    },
  },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByTestId('form-error-summary');

    await expect(alert).toBeInTheDocument();
    await expect(canvas.getByText(/server error/i)).toBeVisible();
  },
});

/**
 * Validation errors — simulates 400-style ValidationProblemDetails with per-field errors
 * returned from the API after a failed submit.  The component renders a linked list of
 * field errors using the keyToLabel display names.
 */
export const ValidationErrors = meta.story({
  args: {
    serverErrors: {
      title: 'One or more validation errors occurred.',
      status: 400,
      errors: {
        'ContactDetails.FirstName': ['First name is required.'],
        'ContactDetails.Phone': ['Phone number is not in a valid format.'],
      },
    },
    prefixToRemove: 'ContactDetails.',
  },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByTestId('form-error-summary');

    await expect(alert).toBeInTheDocument();
    await expect(canvas.getByText(/first name is required/i)).toBeVisible();
    await expect(
      canvas.getByText(/phone number is not in a valid format/i),
    ).toBeVisible();
  },
});

/**
 * WAF violation — isWafViolation=true triggers the special "invalid characters" message
 * rather than a standard status-based error.
 */
export const WAFViolation = meta.story({
  args: {
    serverErrors: {
      title: 'Bad Request',
      status: 400,
    },
    isWafViolation: true,
  },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByTestId('form-error-summary');

    await expect(alert).toBeInTheDocument();
    await expect(canvas.getByText(/an error has occurred/i)).toBeVisible();
    await expect(canvas.getByText(/invalid characters/i)).toBeVisible();
  },
});

/**
 * Conflict (409) — another user saved the page first; the component renders a specific
 * "Another person has already saved this page" message.
 */
export const ConflictError = meta.story({
  args: {
    serverErrors: {
      title: 'Conflict',
      status: 409,
    },
  },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByTestId('form-error-summary');

    await expect(alert).toBeInTheDocument();
    await expect(
      canvas.getByText(/another person has already saved this page/i),
    ).toBeVisible();
  },
});
