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
    (f) => f.name === 'fully populated with the principal contact'
  );
  if (!found) throw new Error('Missing populated fixture');
  return found.values;
})();

const renderOrganisation = (
  values: Values,
  hidden: Hidden = summaryHidden,
  currentContact?: RfqCurrentContact
) =>
  render(
    <RfqOrganisationSummary
      values={values}
      hidden={hidden}
      {...(currentContact && { currentContact })}
    />
  ).container;

const accountHolder: RfqCurrentContact = {
  name: 'Grace Hopper',
  email: 'grace@example.com',
};

describe('RfqOrganisationSummary', () => {
  it('shows the trading name, branch, organisation name and spaced ABN', () => {
    const container = renderOrganisation(populated);

    expect(container).toHaveTextContent('Acme Trading - Sydney Branch');
    expect(container).toHaveTextContent('Acme Pty Ltd');
    expect(container).toHaveTextContent('ABN: 12 345 678 901');
    expect(container.querySelector('.visually-hidden')).toHaveTextContent(
      '1 2 3 4 5 6 7 8 9 0 1'
    );
  });

  it('leaves the branch out of the heading when the branch name is hidden', () => {
    const container = renderOrganisation({
      ...populated,
      organisationAndContact: {
        ...populated.organisationAndContact,
        branchOrLocationName: undefined,
        businessOrTradingName: 'Acme Trading',
      },
    });

    expect(container).toHaveTextContent('Acme Trading');
    expect(container).not.toHaveTextContent('Sydney Branch');
  });

  it('shows the principal contact answer label but no account holder when none is passed', () => {
    const container = renderOrganisation(populated);

    expect(container).toHaveTextContent('Use my contact details');
    expect(container).not.toHaveTextContent('Grace Hopper');
  });

  it('describes the account holder under "Use my contact details"', () => {
    const container = renderOrganisation(
      populated,
      summaryHidden,
      accountHolder
    );

    const descriptor = container.querySelector('#q-currentContact');
    expect(descriptor).toHaveTextContent('Grace Hopper');
    expect(descriptor).toHaveTextContent('grace@example.com');
    expect(container).toHaveTextContent('Use my contact details');
  });

  it('leaves the account holder out when a different contact person is chosen', () => {
    const container = renderOrganisation(
      {
        ...populated,
        organisationAndContact: {
          ...populated.organisationAndContact,
          isPrincipalContact: YesNo.No,
        },
      },
      summaryHidden,
      accountHolder
    );

    expect(container).toHaveTextContent('A different contact person');
    expect(container).not.toHaveTextContent('Grace Hopper');
    expect(container.querySelector('#q-currentContact')).toBeNull();
  });

  it('shows the different-contact label and the free-text title for Other', () => {
    const container = renderOrganisation({
      ...populated,
      organisationAndContact: {
        ...populated.organisationAndContact,
        isPrincipalContact: YesNo.No,
        contact: {
          ...populated.organisationAndContact?.contact,
          title: Title.Other,
          titleOther: 'Lord',
        },
      },
    });

    expect(container).toHaveTextContent('A different contact person');
    expect(container).toHaveTextContent('Title, if "Other"');
    expect(container).toHaveTextContent('Lord');
  });

  it('falls back to a placeholder for an unrecognised principal contact answer', () => {
    const container = renderOrganisation({
      organisationAndContact: {
        isPrincipalContact: 'Maybe' as unknown as YesNo,
      },
    });

    expect(container).toHaveTextContent('No details added');
  });

  it('omits the contact details when principalContactHide is true', () => {
    const container = renderOrganisation(populated, {
      organisationAndContact: { principalContactHide: () => true },
    });

    expect(container).toHaveTextContent('Contact');
    expect(container).not.toHaveTextContent('Lovelace');
    expect(container).not.toHaveTextContent('First name');
  });

  it('shows an empty trading and branch heading when both names are missing', () => {
    const container = renderOrganisation({ organisationAndContact: {} }, {});

    expect(container.querySelector('h2.h3.mb-0')).not.toHaveTextContent(
      'undefined'
    );
  });

  it('renders the headings without crashing when there are no values', () => {
    const container = renderOrganisation({}, {});

    expect(container).toHaveTextContent('Organisation');
    expect(container).toHaveTextContent('Contact');
    expect(container).not.toHaveTextContent('Who is the main contact person');
  });
});
