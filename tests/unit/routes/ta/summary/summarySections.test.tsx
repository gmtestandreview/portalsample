import { render, screen } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import {
  PatternApprovalRequiredValueOptions,
  PatternApprovalRequiredValues,
  Title,
  YesNo,
} from '../../../../../ClientApp/src/api/web-api-client';

import type { RequestForPatternApprovalAppDetails } from '../../../../../ClientApp/src/api/web-api-client';

import type { TaSummarySectionProps } from '../../../../../ClientApp/src/routes/ta/summary/types';

import ApplicationSummary from '../../../../../ClientApp/src/routes/ta/summary/ApplicationSummary';

import ContactSummary from '../../../../../ClientApp/src/routes/ta/summary/ContactSummary';

import OrganisationSummary from '../../../../../ClientApp/src/routes/ta/summary/OrganisationSummary';

type Hidden = TaSummarySectionProps['hidden'];

const noRules: Hidden = {};

const renderOrganisation = (
  values: RequestForPatternApprovalAppDetails,
  hidden: Hidden = noRules,
) => render(<OrganisationSummary values={values} hidden={hidden} />).container;

const renderApplication = (
  values: RequestForPatternApprovalAppDetails,
  hidden: Hidden = noRules,
) => render(<ApplicationSummary values={values} hidden={hidden} />).container;

describe(ContactSummary, () => {
  it('prints a dash for every field of a missing contact', () => {
    expect.assertions(2);
    const { container } = render(
      <ContactSummary name='contact' contact={undefined} />,
    );

    expect(container.textContent).toContain('First name');
    expect(container.querySelectorAll('.visually-hidden')).toHaveLength(6);
  });
});

describe(ContactSummary, () => {
  it('prints the title row with a dash when the title is the empty string', () => {
    expect.assertions(1);
    render(
      <ContactSummary
        name='contact'
        contact={{ title: '' as unknown as Title, firstName: 'Ada' }}
      />,
    );

    expect(screen.getByText('Title (optional)')).toBeInTheDocument();
  });
});

describe(ContactSummary, () => {
  it('omits the title row when no title was chosen', () => {
    expect.assertions(1);
    render(<ContactSummary name='contact' contact={{ firstName: 'Ada' }} />);

    expect(screen.queryByText('Title (optional)')).not.toBeInTheDocument();
  });
});
