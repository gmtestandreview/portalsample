import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RFQDeleteModal from '@/components/modals/RFQDeleteModal';

const mocks = vi.hoisted(() => ({
  acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'token' }),
  deleteApplication: vi.fn(),
  navigate: vi.fn(),
  setShowRFQDeleteModal: vi.fn(),
}));

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useMsal: () => ({
        accounts: [],
        instance: { acquireTokenSilent: mocks.acquireTokenSilent },
      }),
    }) satisfies __ExactMockModule<__TestMockModule2>
);

vi.mock(
  import('react-router'),
  () =>
    ({
      useNavigate: () => mocks.navigate,
    }) satisfies __ExactMockModule<__TestMockModule11>
);

vi.mock(
  import('@/components/modals/ModalContext'),
  () =>
    ({
      useModalState: () => null,
      useModalDispatch: () => ({
        setShowRFQDeleteModal: mocks.setShowRFQDeleteModal,
      }),
    }) satisfies __ExactMockModule<__TestMockModule27>
);

vi.mock(
  import('@/api/web-api-client'),
  () =>
    ({
      ApplicationType: { QuoteRequest: 'QuoteRequest' },
      ApplicationClient: vi.fn(function ApplicationClientMock() {
        return {
          setAuthToken: vi.fn(),
          deleteApplication: mocks.deleteApplication,
        };
      }),
    }) satisfies __ExactMockModule<__TestMockModule4>
);

vi.mock(
  import('@/authentication/authConfig'),
  () =>
    ({
      tokenRequest: { scopes: ['scope'] },
    }) satisfies __ExactMockModule<__TestMockModule8>
);

vi.mock(
  import('@/instrumentation/AppLogger'),
  () =>
    ({
      default: { error: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>
);

vi.mock(
  import('@/analytics/GoogleAnalytics'),
  () =>
    ({
      trackGAEvent: vi.fn(),
    }) satisfies __ExactMockModule<__TestMockModule22>
);

vi.mock(import('react-bootstrap'), () => {
  const Modal = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  Modal.Header = function ModalHeader({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div>{children}</div>;
  };
  Modal.Title = function ModalTitle({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <h3>{children}</h3>;
  };
  Modal.Body = function ModalBody({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
  Modal.Footer = function ModalFooter({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div>{children}</div>;
  };
  return {
    Button: ({
      children,
      onClick,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button type='button' onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Modal,
  } satisfies __ExactMockModule<__TestMockModule49>;
});

describe('rFQDeleteModal null context', () => {
  it('skips deletion and still closes and navigates', async () => {
    render(<RFQDeleteModal />);

    fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/'));

    expect(mocks.deleteApplication).not.toHaveBeenCalled();
    expect(mocks.setShowRFQDeleteModal).toHaveBeenCalledWith(false, '');
  });
});
