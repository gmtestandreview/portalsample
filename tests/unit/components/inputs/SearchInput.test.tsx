import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';
import SearchInput from '@/components/Inputs/SearchInput';

describe(SearchInput, () => {
  it('renders a Formik search field and accepts a query', async () => {
    expect.hasAssertions();

    render(
      <Formik
        initialValues={{ query: 'certificate' }}
        onSubmit={() => undefined}
      >
        {() => <SearchInput name='query' label='Search applications' />}
      </Formik>,
    );

    const input = screen.getByRole('searchbox', {
      name: 'Search applications',
    });

    expect(input).toHaveValue('certificate');

    await userEvent.type(input, ' number');

    expect(input).toHaveValue('certificate number');
  });
});
