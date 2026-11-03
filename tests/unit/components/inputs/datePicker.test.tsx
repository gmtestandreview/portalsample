import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import DatePicker from '@/components/Inputs/DatePicker';

const renderSummary = (value: string | Date | undefined) =>
  render(
    <Formik initialValues={{ date: value }} onSubmit={vi.fn<() => void>()}>
      <DatePicker isSummary label='Date' name='date' />
    </Formik>,
  );

describe('date picker summary values', () => {
  it('renders Date values using the configured display format', () => {
    expect.hasAssertions();

    const value = new Date('2026-06-12T00:00:00.000Z');
    renderSummary(value);

    expect(screen.getByText('12 Jun 2026')).toBeInTheDocument();
  });

  it('renders the empty summary value when no date exists', () => {
    expect.hasAssertions();

    renderSummary(undefined);

    expect(screen.getByText('No details added')).toBeInTheDocument();
  });
});
