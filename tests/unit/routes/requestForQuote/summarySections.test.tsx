import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { Title, YesNo } from '../../../../ClientApp/src/api/web-api-client';

import RfqOrganisationSummary from '../../../../ClientApp/src/routes/requestForQuote/summary/RfqOrganisationSummary';

import type {
  RfqCurrentContact,
  RfqSummarySectionProps,
} from '../../../../ClientApp/src/routes/requestForQuote/summary/types';

import { summaryFixtures, summaryHidden } from './summaryFixtures';

type Values = RfqSummarySectionProps['values'];

type Hidden = RfqSummarySectionProps['hidden'];

const populated = (() => {
  const found = summaryFixtures.find(
    (f) => f.name === 'fully populated with the principal contact',
  );
  if (!found) throw new Error('Missing populated fixture');
  return found.values;
})();

const renderOrganisation = (
  values: Values,
  hidden: Hidden = summaryHidden,
  currentContact?: RfqCurrentContact,
) =>
  render(
    <RfqOrganisationSummary
      values={values}
      hidden={hidden}
      {...(currentContact && { currentContact })}
    />,
  ).container;

const accountHolder: RfqCurrentContact = {
  name: 'Grace Hopper',
  email: 'grace@example.com',
};

describe(RfqOrganisationSummary, () => {
  it('shows the trading name, branch, organisation name and spaced ABN', () => {
    expect.assertions(4);
    const container = renderOrganisation(populated);

    expect(container).toHaveTextContent('Acme Trading - Sydney Branch');
    expect(container).toHaveTextContent('Acme Pty Ltd');
    expect(container).toHaveTextContent('ABN: 12 345 678 901');
    expect(container.querySelector('.visually-hidden')).toHaveTextContent(
      '1 2 3 4 5 6 7 8 9 0 1',
    );
  });
});
