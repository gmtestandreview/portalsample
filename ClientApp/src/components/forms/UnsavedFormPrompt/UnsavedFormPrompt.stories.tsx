import preview from '../../../../../.storybook/preview';
import type { userEvent } from 'storybook/test';
import { expect, screen, waitFor, within } from 'storybook/test';
import { Link } from 'react-router';
import TextInput from '../../Inputs/TextInput';
import RhfTextInput from '../../Inputs/RhfTextInput';
import {
  withPortalProviders,
  type PortalLocationObservation,
} from '../../../storybook/storybookHarness';
import UnsavedFormPrompt from '.';
import RhfUnsavedFormPrompt from './RhfUnsavedFormPrompt';

/**
 * Dirty-navigation contract shared by the Formik and React Hook Form adapters:
 * a dirty form blocks in-app navigation behind the guard modal, Cancel keeps the
 * user on the form with their entered value, and Discard proceeds to the
 * destination. A clean form navigates without a modal.
 *
 * Limit: browser refresh, reload and tab close cannot be intercepted from a
 * story. `RouteLeavingGuard` blocks in-app (`useBlocker`) navigation only, so
 * that path is recorded as not supported rather than simulated here.
 */

const FORM_PATH = '/form';
const DESTINATION_PATH = '/other';
const INITIAL_NAME = 'Acme Pty Ltd';
const CHANGED_NAME = 'Beta Labs';
const NAME_LABEL = 'Organisation name';
const GUARD_NAME = /unsaved changes/i;

const FormikSurface = () => (
  <>
    <UnsavedFormPrompt />
    <h2>Formik organisation form</h2>
    <TextInput name='organisationName' label={NAME_LABEL} />
    <Link to={DESTINATION_PATH}>Leave this form</Link>
  </>
);

const RhfSurface = () => (
  <>
    <RhfUnsavedFormPrompt />
    <h2>RHF organisation form</h2>
    <RhfTextInput name='organisationName' label={NAME_LABEL} />
    <Link to={DESTINATION_PATH}>Leave this form</Link>
  </>
);

/** Records every pathname the story router renders so a play can read the last one. */
const createLocationLog = () => {
  const pathnames: string[] = [];
  const observeLocation = (location: PortalLocationObservation) => {
    pathnames.push(location.pathname);
  };
  return { pathnames, observeLocation };
};

const locationLogs = (): Record<
  'clean' | 'blocked' | 'cancel' | 'confirm',
  ReturnType<typeof createLocationLog>
> => ({
  clean: createLocationLog(),
  blocked: createLocationLog(),
  cancel: createLocationLog(),
  confirm: createLocationLog(),
});

const formikLog = locationLogs();
const rhfLog = locationLogs();

/** Clears every recorded pathname so each play only sees its own navigation. */
const resetLocationLogs = () => {
  for (const log of [...Object.values(formikLog), ...Object.values(rhfLog)]) {
    log.pathnames.length = 0;
  }
};
const portalFor = (
  flavour: 'formik' | 'rhf',
  observeLocation: (location: PortalLocationObservation) => void,
) => ({
  initialEntries: [FORM_PATH],
  destinationRoutes: [
    { path: DESTINATION_PATH, element: <p>Destination reached</p> },
  ],
  observeLocation,
  ...(flavour === 'formik'
    ? { formik: { initialValues: { organisationName: INITIAL_NAME } } }
    : { rhf: { defaultValues: { organisationName: INITIAL_NAME } } }),
});

const meta = preview.meta({
  title: 'Forms/UnsavedFormPrompt',
  component: UnsavedFormPrompt,
  decorators: [withPortalProviders],
  beforeEach: resetLocationLogs,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Formik and React Hook Form adapters over the shared unsaved-changes rule. ' +
          'They block in-app navigation while the form is dirty. Browser refresh, reload and tab close are not intercepted and are not covered by these stories.',
      },
    },
  },
});

type PlayCanvas = ReturnType<typeof within>;
type PlayUser = ReturnType<typeof userEvent.setup>;

const makeDirtyAndLeave = async (canvas: PlayCanvas, user: PlayUser) => {
  const field = canvas.getByLabelText(NAME_LABEL);
  await user.clear(field);
  await user.type(field, CHANGED_NAME);
  await user.click(canvas.getByRole('link', { name: 'Leave this form' }));
  return { dialog: await screen.findByRole('dialog', { name: GUARD_NAME }) };
};

const expectGuardGone = () =>
  waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

export const FormikCleanNavigates = meta.story({
  name: 'Formik — clean form navigates without a modal',
  parameters: { portal: portalFor('formik', formikLog.clean.observeLocation) },
  render: () => <FormikSurface />,
  play: async ({ canvas, userEvent: user }) => {
    await user.click(canvas.getByRole('link', { name: 'Leave this form' }));

    await expect(await canvas.findByText('Destination reached')).toBeVisible();
    await expect(screen.queryByRole('dialog')).toBeNull();
    await expect(formikLog.clean.pathnames.at(-1)).toBe('/other');
  },
});

export const FormikDirtyBlocked = meta.story({
  name: 'Formik — dirty navigation is blocked',
  parameters: {
    portal: portalFor('formik', formikLog.blocked.observeLocation),
  },
  render: () => <FormikSurface />,
  play: async ({ canvas, userEvent: user }) => {
    const { dialog } = await makeDirtyAndLeave(canvas, user);
    await waitFor(() => expect(dialog).toBeVisible());

    await expect(
      within(dialog).getByRole('button', { name: 'Discard changes' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', {
        level: 2,
        name: 'Formik organisation form',
      }),
    ).toBeVisible();
    await expect(canvas.queryByText('Destination reached')).toBeNull();
    await expect(formikLog.blocked.pathnames.at(-1)).toBe('/form');
    await expect(formikLog.blocked.pathnames).not.toContain('/other');
  },
});

export const FormikCancelRetainsValue = meta.story({
  name: 'Formik — cancel retains the entered value',
  parameters: { portal: portalFor('formik', formikLog.cancel.observeLocation) },
  render: () => <FormikSurface />,
  play: async ({ canvas, userEvent: user }) => {
    const { dialog } = await makeDirtyAndLeave(canvas, user);
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await expectGuardGone();

    await expect(canvas.getByLabelText(NAME_LABEL)).toHaveValue('Beta Labs');
    await expect(
      canvas.getByRole('heading', {
        level: 2,
        name: 'Formik organisation form',
      }),
    ).toBeVisible();
    await expect(canvas.queryByText('Destination reached')).toBeNull();
    await expect(formikLog.cancel.pathnames.at(-1)).toBe('/form');
    await expect(formikLog.cancel.pathnames).not.toContain('/other');
  },
});

export const FormikConfirmProceeds = meta.story({
  name: 'Formik — confirm proceeds to the destination',
  parameters: {
    portal: portalFor('formik', formikLog.confirm.observeLocation),
  },
  render: () => <FormikSurface />,
  play: async ({ canvas, userEvent: user }) => {
    const { dialog } = await makeDirtyAndLeave(canvas, user);
    await user.click(
      within(dialog).getByRole('button', { name: 'Discard changes' }),
    );

    await expect(await canvas.findByText('Destination reached')).toBeVisible();

    await expectGuardGone();

    await expect(formikLog.confirm.pathnames.at(-1)).toBe('/other');
  },
});

export const RhfCleanNavigates = meta.story({
  name: 'RHF — clean form navigates without a modal',
  parameters: { portal: portalFor('rhf', rhfLog.clean.observeLocation) },
  render: () => <RhfSurface />,
  play: async ({ canvas, userEvent: user }) => {
    await user.click(canvas.getByRole('link', { name: 'Leave this form' }));

    await expect(await canvas.findByText('Destination reached')).toBeVisible();
    await expect(screen.queryByRole('dialog')).toBeNull();
    await expect(rhfLog.clean.pathnames.at(-1)).toBe('/other');
  },
});

export const RhfDirtyBlocked = meta.story({
  name: 'RHF — dirty navigation is blocked',
  parameters: { portal: portalFor('rhf', rhfLog.blocked.observeLocation) },
  render: () => <RhfSurface />,
  play: async ({ canvas, userEvent: user }) => {
    const { dialog } = await makeDirtyAndLeave(canvas, user);
    await waitFor(() => expect(dialog).toBeVisible());

    await expect(
      within(dialog).getByRole('button', { name: 'Discard changes' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'RHF organisation form' }),
    ).toBeVisible();
    await expect(canvas.queryByText('Destination reached')).toBeNull();
    await expect(rhfLog.blocked.pathnames.at(-1)).toBe('/form');
    await expect(rhfLog.blocked.pathnames).not.toContain('/other');
  },
});

export const RhfCancelRetainsValue = meta.story({
  name: 'RHF — cancel retains the entered value',
  parameters: { portal: portalFor('rhf', rhfLog.cancel.observeLocation) },
  render: () => <RhfSurface />,
  play: async ({ canvas, userEvent: user }) => {
    const { dialog } = await makeDirtyAndLeave(canvas, user);
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await expectGuardGone();

    await expect(canvas.getByLabelText(NAME_LABEL)).toHaveValue('Beta Labs');
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'RHF organisation form' }),
    ).toBeVisible();
    await expect(canvas.queryByText('Destination reached')).toBeNull();
    await expect(rhfLog.cancel.pathnames.at(-1)).toBe('/form');
    await expect(rhfLog.cancel.pathnames).not.toContain('/other');
  },
});

export const RhfConfirmProceeds = meta.story({
  name: 'RHF — confirm proceeds to the destination',
  parameters: { portal: portalFor('rhf', rhfLog.confirm.observeLocation) },
  render: () => <RhfSurface />,
  play: async ({ canvas, userEvent: user }) => {
    const { dialog } = await makeDirtyAndLeave(canvas, user);
    await user.click(
      within(dialog).getByRole('button', { name: 'Discard changes' }),
    );

    await expect(await canvas.findByText('Destination reached')).toBeVisible();

    await expectGuardGone();

    await expect(rhfLog.confirm.pathnames.at(-1)).toBe('/other');
  },
});
