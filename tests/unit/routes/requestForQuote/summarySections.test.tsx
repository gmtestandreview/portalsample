import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Title, YesNo } from '../../../../ClientApp/src/api/web-api-client';
import RfqOrganisationSummary from '../../../../ClientApp/src/routes/requestForQuote/summary/RfqOrganisationSummary';
import type { RfqSummarySectionProps } from '../../../../ClientApp/src/routes/requestForQuote/summary/types';
import { summaryFixtures, summaryHidden } from './summaryFixtures';

type Values = RfqSummarySectionProps['values'];
type Hidden = RfqSummarySectionProps['hidden'];

const populated = summaryFixtures[0]!.values;

const renderOrganisation = (values: Values, hidden: Hidden = summaryHidden) =>
  render(<RfqOrganisationSummary values={values} hidden={hidden} />).container;

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

  it('shows the principal contact answer label but not the current contact', () => {
    const container = renderOrganisation(populated);

    expect(container).toHaveTextContent('Use my contact details');
    expect(container).not.toHaveTextContent('Grace Hopper');
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
