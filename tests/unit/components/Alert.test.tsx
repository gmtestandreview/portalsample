import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlertSuccess } from '../../../ClientApp/src/components/Alert';

describe('alert variants', () => {
  it('falls back to polite aria-live when the prop is explicitly overridden to undefined', () => {
    expect.hasAssertions();

    const { getByRole } = render(
      // Spread after the hardcoded ariaLive='polite' inside AlertSuccess, so
      // an explicit undefined here overrides it and triggers the || 'polite' fallback.
      <AlertSuccess ariaLive={undefined}>Fallback</AlertSuccess>,
    );

    expect(getByRole('alert')).toHaveAttribute('aria-live', 'polite');
  });

  it('stays dismissed until its content changes, then shows again', async () => {
    expect.hasAssertions();

    const { queryByRole, findByRole, getByLabelText, rerender } = render(
      <AlertSuccess canClose>First message</AlertSuccess>,
    );

    fireEvent.click(getByLabelText(/close/i));

    await waitFor(() => {
      expect(queryByRole('alert')).not.toBeInTheDocument();
    });

    rerender(<AlertSuccess canClose>Second message</AlertSuccess>);

    await expect(findByRole('alert')).resolves.toHaveTextContent(
      'Second message',
    );
  });
});
