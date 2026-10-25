import { describe, it, expect } from 'vitest';

import { render, screen } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { readFileSync } from 'node:fs';

import path from 'node:path';

import Footer from '@/components/Footer';

import Privacy from '@/components/Footer/privacy';

import TermsOfUse from '@/components/Footer/termsOfUse';

vi.mock(
  import('@/assets/GovCrest.svg'),
  () =>
    ({
      default: 'gov-crest.svg',
    }) satisfies __ExactMockModule<__TestMockModule19>,
);

describe('footer accessibility', () => {
  it('uses real buttons for footer modal triggers', async () => {
    expect.assertions(4);
    render(<Footer />);

    const termsTrigger = screen.getByRole('button', { name: 'Terms of use' });
    const privacyTrigger = screen.getByRole('button', { name: 'Privacy' });
    const accessibilityTrigger = screen.getByRole('button', {
      name: 'Accessibility',
    });

    expect(termsTrigger).not.toHaveAttribute('href');
    expect(privacyTrigger).not.toHaveAttribute('href');
    expect(accessibilityTrigger).not.toHaveAttribute('href');

    await userEvent.click(termsTrigger);

    expect(
      screen.getByRole('dialog', { name: 'Portal Terms of Use' }),
    ).toBeInTheDocument();
  });
});
