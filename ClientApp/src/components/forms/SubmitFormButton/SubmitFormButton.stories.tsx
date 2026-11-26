import preview from '../../../../../.storybook/preview';
import { useFormState } from 'react-hook-form';
import * as Yup from 'yup';
import { expect, fn, waitFor, within } from 'storybook/test';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import RhfForm from '../RhfForm';
import SubmitFormButton from '.';

const meta = preview.meta({
  title: 'Components/Forms/SubmitFormButton',
  component: SubmitFormButton,
  decorators: [withPortalProviders],
});

interface Values {
  name: string;
}

const onSubmit = fn();

const SubmissionProbe = () => {
  const { submitCount } = useFormState();
  return (
    <output aria-label='Submission state'>submitCount={submitCount}</output>
  );
};

const validateHard = Yup.object({
  name: Yup.string().required('Enter a name'),
});

const renderForm = (initialName: string) => (
  <RhfForm<Values>
    initialValues={{ name: initialName }}
    validateHard={validateHard}
    onSubmit={onSubmit}
  >
    <SubmitFormButton />
    <SubmissionProbe />
  </RhfForm>
);

/**
 * ValidSubmit — the default Submit control submits the valid values and
 * counts the submission.
 */
export const ValidSubmit = meta.story({
  beforeEach: () => {
    onSubmit.mockClear();
  },
  render: () => renderForm('Ada'),
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    await expect(onSubmit.mock.calls[0]?.[0]).toEqual({ name: 'Ada' });

    await waitFor(() =>
      expect(canvas.getByLabelText('Submission state')).toHaveTextContent(
        'submitCount=1',
      ),
    );
  },
});

/**
 * InvalidSubmit — invalid values are attempted and blocked by validation, so
 * the submit callback is never called.
 */
export const InvalidSubmit = meta.story({
  beforeEach: () => {
    onSubmit.mockClear();
  },
  render: () => renderForm(''),
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(canvas.getByLabelText('Submission state')).toHaveTextContent(
        'submitCount=1',
      ),
    );

    await expect(onSubmit).not.toHaveBeenCalled();
  },
});
