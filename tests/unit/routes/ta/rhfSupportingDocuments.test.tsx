import { act, screen, waitFor } from '@testing-library/react';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEffect } from 'react';

import type { ReactNode } from 'react';

import { FormProvider, useForm } from 'react-hook-form';

import type { UseFormReturn } from 'react-hook-form';

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
  import('../../../../ClientApp/src/components/Inputs/RhfAttachment'),
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
    }) satisfies __ExactMockModule<__TestMockModule145>,
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

type FormMethods = UseFormReturn<Record<string, unknown>>;

let formMethods: FormMethods | undefined;

const FormHarness = ({
  values,
  children,
}: Readonly<{ values: Record<string, unknown>; children: ReactNode }>) => {
  const methods = useForm<Record<string, unknown>>({ defaultValues: values });
  useEffect(() => {
    formMethods = methods;
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

const submitForm = async () => {
  await act(async () => {
    await formMethods?.handleSubmit(() => undefined)();
  });
};

const renderDocs = async ({
  props = {},
  values = defaultValues,
}: RenderOptions = {}) => {
  const SupportingDocuments = (
    await import('../../../../ClientApp/src/routes/ta/rhfSupportingDocuments')
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
    <FormHarness values={values}>
      <SupportingDocuments {...(componentProps as any)} />
    </FormHarness>,
    { path: '/ta/:id', initialPath: '/ta/APP-1' },
  );

  await act(async () => {
    await Promise.resolve();
  });

  return { ...result, componentProps };
};

const setFieldError = async (message: unknown) => {
  await act(async () => {
    formMethods?.setError('form.documents', {
      type: 'validation',
      message: message as string,
    });
  });
};

const alertItems = () =>
  Array.from(document.querySelectorAll('#form-error-summary-custom li')).map(
    (li) => li.textContent,
  );

describe('rHF supporting documents', () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    formMethods = undefined;
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

describe('rHF supporting documents', () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    formMethods = undefined;
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
    it('shows the validation message for the documents field', async () => {
      expect.assertions(1);
      await renderDocs();

      await setFieldError('Documents are invalid');

      expect(alertItems()).toEqual(['Documents are invalid']);
    });
  });
});

describe('rHF supporting documents', () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    formMethods = undefined;
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
    it('ignores a validation error that carries no text', async () => {
      expect.assertions(1);
      await renderDocs();

      await setFieldError(undefined);

      expect(document.querySelector('#form-error-summary-custom')).toBeNull();
    });
  });
});

describe('rHF supporting documents', () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    formMethods = undefined;
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
    it('ignores a validation error on an unrelated field', async () => {
      expect.assertions(1);
      await renderDocs();

      await act(async () => {
        formMethods?.setError('form.instrumentType', {
          type: 'validation',
          message: 'Unrelated problem',
        });
      });

      expect(document.querySelector('#form-error-summary-custom')).toBeNull();
    });
  });
});

describe('rHF supporting documents', () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    formMethods = undefined;
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
    it('clears validation errors when an upload starts', async () => {
      expect.assertions(1);
      const onUploadAttachment = vi.fn().mockResolvedValue([]);
      await renderDocs({ props: { onUploadAttachment } });
      await setFieldError('Documents are invalid');

      await act(async () => {
        await attachmentControl.props.onUploadFiles([new File(['a'], 'a.pdf')]);
      });

      expect(document.querySelector('#form-error-summary-custom')).toBeNull();
    });
  });
});
