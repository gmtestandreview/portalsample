import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik, useFormikContext } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import { YesNo, type SummaryAndAcceptStep } from '@/api/web-api-client';
import SummaryAndAcceptFormikBridge from '@/routes/acceptQuote/summaryAndAcceptFormikBridge';
import {
  AcceptanceField,
  AssociatedDisputeFields,
} from '@/routes/acceptQuote/summaryAndAcceptFormFields';
import {
  summaryAndAcceptSaveValidation,
  summaryAndAcceptSubmitValidation,
} from '@/routes/acceptQuote/validation';
import { removeHidden, validateForm } from '@/components/forms/utils';
import { defined } from '../../helpers/defined';

// Mirrors the associatedDispute rule in summaryAndAcceptProps.hidingFields.
const hidingFields = {
  associatedDispute: (x: SummaryAndAcceptStep) => x.associatedDisputes === 'No',
};

type Values = SummaryAndAcceptStep & { saveAndExit?: boolean };

interface HarnessProps {
  values?: Values;
  withHiddenRules?: boolean;
  onSubmit?: (values: SummaryAndAcceptStep) => void;
}

function Probe() {
  const { values, dirty } = useFormikContext<Values>();
  return (
    <output data-testid='probe'>
      {JSON.stringify({ acceptance: values.acceptanceOfQuote, dirty })}
    </output>
  );
}

function Harness({
  values = {},
  withHiddenRules = true,
  onSubmit = vi.fn(),
}: Readonly<HarnessProps>) {
  return (
    <Formik<Values>
      initialValues={values}
      {...(withHiddenRules ? { initialStatus: { hidden: hidingFields } } : {})}
      validate={(formValues) =>
        validateForm(
          formValues.saveAndExit
            ? summaryAndAcceptSaveValidation
            : summaryAndAcceptSubmitValidation,
          hidingFields
        )(formValues)
      }
      onSubmit={(submitted) =>
        onSubmit(removeHidden(submitted, submitted, hidingFields))
      }
    >
      <Form noValidate>
        <SummaryAndAcceptFormikBridge>
          <p>Between the fields</p>
          <AssociatedDisputeFields />
          <AcceptanceField />
        </SummaryAndAcceptFormikBridge>
        <Probe />
        <button type='submit'>Continue</button>
      </Form>
    </Formik>
  );
}

const ACCEPT_LABEL =
  'Yes, on behalf of my organisation, I accept the quotation';
const ACCEPT_MESSAGE =
  'You must accept our terms before accepting this quotation';
const DISPUTE_LABEL = /Please provide details of the associated dispute/;

const submitted = (onSubmit: ReturnType<typeof vi.fn>) =>
  defined(onSubmit.mock.calls[0], 'submit call')[0];

const probe = () =>
  JSON.parse(screen.getByTestId('probe').textContent ?? '') as {
    acceptance: boolean | undefined;
    dirty: boolean;
  };

describe('SummaryAndAcceptFormikBridge', () => {
  it('renders its children between the bridged fields', () => {
    render(<Harness />);

    expect(screen.getByText('Between the fields')).toBeInTheDocument();
  });

  it('mirrors the answers into the submit payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    await user.click(screen.getByRole('radio', { name: 'Yes' }));
    await user.type(screen.getByLabelText(DISPUTE_LABEL), 'Late delivery');
    await user.click(screen.getByLabelText(ACCEPT_LABEL));
    expect(probe()).toEqual({ acceptance: true, dirty: true });
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(submitted(onSubmit)).toEqual({
      associatedDisputes: 'Yes',
      associatedDispute: 'Late delivery',
      acceptanceOfQuote: true,
    });
  });

  it('shows messages only after a failed submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Harness
        values={{
          associatedDisputes: YesNo.Yes,
          acceptanceOfQuote: false,
        }}
        onSubmit={onSubmit}
      />
    );

    expect(screen.queryByText(ACCEPT_MESSAGE)).not.toBeInTheDocument();
    expect(screen.queryByText(/is a required field/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText(ACCEPT_MESSAGE)).toBeInTheDocument();
    expect(
      screen.getByText('Associated dispute is a required field')
    ).toBeInTheDocument();
    expect(screen.getByLabelText(ACCEPT_LABEL)).toBeInvalid();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not dirty the outer form when a failed submit touches unset fields', async () => {
    const user = userEvent.setup();
    render(<Harness values={{ associatedDisputes: YesNo.Yes }} />);

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText(/is a required field/);

    expect(probe()).toEqual({ dirty: false });
  });

  it('applies the soft schema once the outer form is saving and exiting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Harness
        values={{
          associatedDisputes: YesNo.Yes,
          acceptanceOfQuote: false,
          saveAndExit: true,
        }}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(screen.queryByText(ACCEPT_MESSAGE)).not.toBeInTheDocument();
    expect(screen.queryByText(/is a required field/)).not.toBeInTheDocument();
  });

  it('still enforces the dispute length when saving and exiting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Harness
        values={{
          associatedDisputes: YesNo.Yes,
          associatedDispute: 'x'.repeat(301),
          saveAndExit: true,
        }}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByText(/300/, { selector: '.invalid-feedback' })
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('follows the hide rules from the form status', () => {
    const { unmount } = render(
      <Harness values={{ associatedDisputes: YesNo.No }} />
    );
    expect(screen.queryByLabelText(DISPUTE_LABEL)).not.toBeInTheDocument();
    unmount();

    render(
      <Harness
        withHiddenRules={false}
        values={{ associatedDisputes: YesNo.No }}
      />
    );
    expect(screen.getByLabelText(DISPUTE_LABEL)).toBeInTheDocument();
  });
});
