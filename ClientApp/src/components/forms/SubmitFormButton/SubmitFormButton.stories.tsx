import preview from '../../../../../.storybook/preview';
import { Formik, Form, useFormikContext } from 'formik';
import { expect, fn, waitFor, within } from 'storybook/test';
import { withPortalProviders } from '../../../storybook/storybookHarness';
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
  const { submitCount, values } = useFormikContext<Record<string, unknown>>();
  return (
    <output aria-label='Submission state'>
      submitCount={submitCount} saveAndExit=
      {values['saveAndExit'] === true ? 'true' : 'false'} submitClick=
      {values['submitClick'] === true ? 'true' : 'false'}
    </output>
  );
};

const validateName = (values: Values) =>
  values.name === '' ? { name: 'Enter a name' } : {};

const renderForm = (initialName: string) => (
  <Formik<Values>
    initialValues={{ name: initialName }}
    validate={validateName}
    onSubmit={onSubmit}
  >
    <Form noValidate>
      <SubmitFormButton />
      <SubmissionProbe />
    </Form>
  </Formik>
);

/**
 * ValidSubmit — the default Submit control submits valid values, then clears
 * its own click flag and leaves saveAndExit false.
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

    await expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      name: 'Ada',
      saveAndExit: false,
      submitClick: false,
    });

    await waitFor(() =>
      expect(canvas.getByLabelText('Submission state')).toHaveTextContent(
        'submitCount=1 saveAndExit=false submitClick=false',
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
