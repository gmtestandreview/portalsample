import { act, screen, waitFor } from '@testing-library/react';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FormikErrors, FormikProps } from 'formik';

import { PatternApprovalRequiredValues } from '../../../../ClientApp/src/api/web-api-client';

import type * as WebApiClient from '../../../../ClientApp/src/api/web-api-client';

import {
  FileStatus,
  ValidationMessages,
} from '../../../../ClientApp/src/routes/ta/types';

import {
  msalMocks,
  resetMsalMock,
  DEFAULT_ACCESS_TOKEN,
} from '../../helpers/mockMsal';

import type {
  ClientMock,
  ClientMethodMocks,
} from '../../helpers/mockApiClient';

import { renderWithRouter } from '../../helpers/renderWithRouter';

import { FormikWrapper } from '../../helpers/formik';

import { defined } from '../../helpers/defined';

const mocks = vi.hoisted(() => ({
  accountContext: vi.fn(),
  setTargetOrganisation: vi.fn(),
  setDashboardNotification: vi.fn(),
}));

const clients = vi.hoisted(() => ({
  patternApproval: undefined as unknown as ClientMock<ClientMethodMocks>,
}));

/** Captures the attachment control's props so its callbacks can be driven directly. */
const attachmentControl = vi.hoisted(() => ({
  props: undefined as unknown as {
    onUploadFiles: (files: File[]) => Promise<unknown>;
    onDeleteFile: (docId: string) => Promise<void>;
    onCategoryUpdate: (docId: string, category: string) => Promise<void>;
    setErrors: (errors: string[]) => void;
    disableUpload?: boolean;
    isSummary?: boolean;
  },
}));

vi.mock(import('@azure/msal-react'), async () => {
  const { msalReactModuleMock } = await import('../../helpers/mockMsal');

  return msalReactModuleMock() satisfies __ExactMockModule<__TestMockModule2>;
});

vi.mock(
  import('../../../../ClientApp/src/api/web-api-client'),
  async (importOriginal) => {
    const { createClientMockFor, webApiClientModuleMock } =
      await import('../../helpers/mockApiClient');
    const original = await importOriginal<typeof WebApiClient>();

    clients.patternApproval = createClientMockFor(
      'deleteDocument',
      'updateCategory',
    );

    return webApiClientModuleMock(original, {
      RequestForPatternApprovalClient: clients.patternApproval,
    }) satisfies __ExactMockModule<__TestMockModule4>;
  },
);

vi.mock(
  import('../../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      tokenRequest: { scopes: ['api://ta/.default'] },
    }) satisfies __ExactMockModule<__TestMockModule8>,
);

vi.mock(
  import('../../../../ClientApp/src/authentication/hooks'),
  () =>
    ({
      default: () => mocks.accountContext(),
      useAccountDispatch: () => ({
        setTargetOrganisation: mocks.setTargetOrganisation,
      }),
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock(
  import('../../../../ClientApp/src/storage/notification'),
  () =>
    ({
      setDashboardNotification: mocks.setDashboardNotification,
    }) satisfies __ExactMockModule<__TestMockModule46>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/instrumentInfoPanel'),
  () =>
    ({
      default: ({
        selectedInstrumentCategoryId,
        selectedInstrumentTypeId,
      }: {
        selectedInstrumentCategoryId: string;
        selectedInstrumentTypeId: string;
      }) => (
        <div
          data-testid='instrument-info-panel'
          data-category={selectedInstrumentCategoryId}
          data-type={selectedInstrumentTypeId}
        />
      ),
    }) satisfies __ExactMockModule<__TestMockModule136>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/Attachment/index-new'),
  () =>
    ({
      default: (props: typeof attachmentControl.props) => {
        attachmentControl.props = props;

        return (
          <div
            data-testid='attachment'
            data-disable-upload={String(props.disableUpload ?? false)}
            data-is-summary={String(props.isSummary ?? false)}
          />
        );
      },
    }) satisfies __ExactMockModule<__TestMockModule146>,
);

const defaultValues = {
  form: {
    documents: [] as unknown[],
    instrumentCategory: 'cat-1',
    instrumentType: 'type-1',
    patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
  },
};

type RenderOptions = {
  props?: Record<string, unknown>;
  values?: Record<string, unknown>;
};

let formik: FormikProps<Record<string, unknown>> | undefined;

const renderDocs = async ({
  props = {},
  values = defaultValues,
}: RenderOptions = {}) => {
  const SupportingDocuments = (
    await import('../../../../ClientApp/src/routes/ta/supportingDocuments')
  ).default;

  const componentProps = {
    name: 'form.documents',
    isSummary: false,
    attachment: { onUploadFiles: vi.fn().mockResolvedValue([]) },
    setProgress: vi.fn(),
    uploading: false,
    handleCancelFile: vi.fn(),
    setExternalErrors: vi.fn(),
    ...props,
  };

  const result = renderWithRouter(
    <FormikWrapper
      initialValues={values}
      innerRef={(bag) => {
        formik = bag as FormikProps<Record<string, unknown>>;
      }}
    >
      <SupportingDocuments {...(componentProps as any)} />
    </FormikWrapper>,
    { path: '/ta/:id', initialPath: '/ta/APP-1' },
  );

  await act(async () => {
    await Promise.resolve();
  });

  return { ...result, componentProps };
};

const setFormikErrors = async (errors: Record<string, unknown>) => {
  await act(async () => {
    // FormikErrors describes only the well-formed shapes. The component branches defensively on
    // string, array and object errors precisely because what arrives is not always well formed,
    // so exercising those arms means handing it shapes the type does not admit. The cast is
    // confined to the test harness; it is not asserting anything about production values.
    formik?.setErrors(errors as FormikErrors<Record<string, unknown>>);
  });
};

const alertItems = () =>
  Array.from(document.querySelectorAll('#form-error-summary-custom li')).map(
    (li) => li.textContent,
  );

describe('supporting documents', () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    formik = undefined;
    mocks.accountContext.mockReset().mockReturnValue({
      details: {
        abn: '11111111111',
        organisation: 'Test Org',
        targetOrganisation: { targetOrganisationName: 'Client Org' },
      },
    });
    mocks.setTargetOrganisation.mockReset();
    mocks.setDashboardNotification.mockReset();
    attachmentControl.props =
      undefined as unknown as typeof attachmentControl.props;

    clients.patternApproval.setAuthToken.mockReset();
    for (const method of Object.values(clients.patternApproval.methods)) {
      method.mockReset().mockResolvedValue(undefined);
    }
  });
  describe('surfacing errors', () => {
    it('shows errors handed down from the parent', async () => {
      expect.assertions(1);
      await renderDocs({
        props: { externalErrors: ['Failed to commit documents.'] },
      });

      expect(alertItems()).toEqual(['Failed to commit documents.']);
    });
  });
});

describe('supporting documents', () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    formik = undefined;
    mocks.accountContext.mockReset().mockReturnValue({
      details: {
        abn: '11111111111',
        organisation: 'Test Org',
        targetOrganisation: { targetOrganisationName: 'Client Org' },
      },
    });
    mocks.setTargetOrganisation.mockReset();
    mocks.setDashboardNotification.mockReset();
    attachmentControl.props =
      undefined as unknown as typeof attachmentControl.props;

    clients.patternApproval.setAuthToken.mockReset();
    for (const method of Object.values(clients.patternApproval.methods)) {
      method.mockReset().mockResolvedValue(undefined);
    }
  });
  describe('surfacing errors', () => {
    it('shows a Formik field error given as a string', async () => {
      expect.assertions(1);
      await renderDocs();

      await setFormikErrors({ form: 'The form is invalid' });

      expect(alertItems()).toEqual(['The form is invalid']);
    });
  });
});

describe('supporting documents', () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    formik = undefined;
    mocks.accountContext.mockReset().mockReturnValue({
      details: {
        abn: '11111111111',
        organisation: 'Test Org',
        targetOrganisation: { targetOrganisationName: 'Client Org' },
      },
    });
    mocks.setTargetOrganisation.mockReset();
    mocks.setDashboardNotification.mockReset();
    attachmentControl.props =
      undefined as unknown as typeof attachmentControl.props;

    clients.patternApproval.setAuthToken.mockReset();
    for (const method of Object.values(clients.patternApproval.methods)) {
      method.mockReset().mockResolvedValue(undefined);
    }
  });
  describe('surfacing errors', () => {
    it('shows Formik field errors given as an array of strings', async () => {
      expect.assertions(1);
      await renderDocs();

      await setFormikErrors({ form: ['First problem', 'Second problem'] });

      expect(alertItems()).toEqual(['First problem', 'Second problem']);
    });
  });
});

describe('supporting documents', () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    formik = undefined;
    mocks.accountContext.mockReset().mockReturnValue({
      details: {
        abn: '11111111111',
        organisation: 'Test Org',
        targetOrganisation: { targetOrganisationName: 'Client Org' },
      },
    });
    mocks.setTargetOrganisation.mockReset();
    mocks.setDashboardNotification.mockReset();
    attachmentControl.props =
      undefined as unknown as typeof attachmentControl.props;

    clients.patternApproval.setAuthToken.mockReset();
    for (const method of Object.values(clients.patternApproval.methods)) {
      method.mockReset().mockResolvedValue(undefined);
    }
  });
  describe('surfacing errors', () => {
    it('shows the named field error when Formik reports an object', async () => {
      expect.assertions(1);
      await renderDocs();

      await setFormikErrors({ form: { documents: 'Documents are invalid' } });

      expect(alertItems()).toEqual(['Documents are invalid']);
    });
  });
});

describe('supporting documents', () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    formik = undefined;
    mocks.accountContext.mockReset().mockReturnValue({
      details: {
        abn: '11111111111',
        organisation: 'Test Org',
        targetOrganisation: { targetOrganisationName: 'Client Org' },
      },
    });
    mocks.setTargetOrganisation.mockReset();
    mocks.setDashboardNotification.mockReset();
    attachmentControl.props =
      undefined as unknown as typeof attachmentControl.props;

    clients.patternApproval.setAuthToken.mockReset();
    for (const method of Object.values(clients.patternApproval.methods)) {
      method.mockReset().mockResolvedValue(undefined);
    }
  });
  describe('surfacing errors', () => {
    it('reports each failed and cancelled upload once the transfer finishes', async () => {
      expect.assertions(1);
      await renderDocs({
        props: {
          progress: {
            percent: 100,
            files: [
              { fileName: 'good.pdf', status: FileStatus.Completed },
              { fileName: 'bad.pdf', status: FileStatus.Failed },
              { fileName: 'stopped.pdf', status: FileStatus.Cancelled },
            ],
          },
        },
      });

      expect(alertItems()).toEqual([
        'Error uploading bad.pdf',
        'Upload cancelled for stopped.pdf',
      ]);
    });
  });
});
