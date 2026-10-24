import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TAApplicationManage from '@/routes/ta/manage';

vi.mock(
  import('@/routes/ta/manage/appDetails'),
  () =>
    ({
      default: () => <div>Application details route</div>,
    }) satisfies __ExactMockModule<__TestMockModule144>
);

describe(TAApplicationManage, () => {
  it('renders the application details route content', () => {
    render(<TAApplicationManage />);

    expect(screen.getByText('Application details route')).toBeInTheDocument();
  });
});
