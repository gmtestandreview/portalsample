import { act, fireEvent, render, screen } from '@testing-library/react';

import vm from 'node:vm';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MemoryRouter } from 'react-router';

import BackToTopButton from '@/components/Utilities/backToTopButton';

import ContactLink from '@/components/Utilities/ContactLink';

import DeliveryInstructions from '@/components/Utilities/deliveryInstructions';

import useBodyClass from '@/components/Utilities/useBodyClass';

import useDebounce from '@/components/Utilities/useDebounce';

const BodyClassHarness = ({ className }: { className: string | string[] }) => {
  useBodyClass(className);
  return <div>Body class harness</div>;
};

const DebounceHarness = ({
  value,
  delay,
}: {
  value: string;
  delay: number;
}) => {
  const debouncedValue = useDebounce(value, delay);
  return <p>{debouncedValue}</p>;
};

describe('utility runtime components and hooks', () => {
  beforeEach(() => {
    document.body.className = '';
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.className = '';
  });
  it('renders contact recovery actions', () => {
    expect.assertions(2);
    render(
      <MemoryRouter>
        <ContactLink />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('link', { name: 'Go to dashboard' }),
    ).toHaveAttribute('href', '/');
    expect(
      screen.getByRole('link', { name: 'infotm@measurement.gov.au' }),
    ).toHaveAttribute(
      'href',
      'mailto:infotm@measurement.gov.au?Subject=Error on NMI Services portal',
    );
  });
});
