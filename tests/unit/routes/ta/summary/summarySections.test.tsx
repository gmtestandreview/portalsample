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
  hidden: Hidden = noRules
) => render(<OrganisationSummary values={values} hidden={hidden} />).container;

const renderApplication = (
  values: RequestForPatternApprovalAppDetails,
  hidden: Hidden = noRules
) => render(<ApplicationSummary values={values} hidden={hidden} />).container;

describe('ContactSummary', () => {
  it('prints a dash for every field of a missing contact', () => {
    const { container } = render(
      <ContactSummary name='contact' contact={undefined} />
    );

    expect(container.textContent).toContain('First name');
    expect(container.querySelectorAll('.visually-hidden').length).toBe(6);
  });

  it('prints the title row with a dash when the title is the empty string', () => {
    render(
      <ContactSummary
        name='contact'
        contact={{ title: '' as unknown as Title, firstName: 'Ada' }}
      />
    );

    expect(screen.getByText('Title (optional)')).toBeInTheDocument();
  });

  it('omits the title row when no title was chosen', () => {
    render(<ContactSummary name='contact' contact={{ firstName: 'Ada' }} />);

    expect(screen.queryByText('Title (optional)')).not.toBeInTheDocument();
  });

  it('spells out a compound title and shows the Other text', () => {
    const { rerender } = render(
      <ContactSummary
        name='contact'
        contact={{ title: Title.AssociateProfessor }}
      />
    );
    expect(screen.getByText('Associate Professor')).toBeInTheDocument();

    rerender(
      <ContactSummary
        name='contact'
        contact={{ title: Title.Other, titleOther: 'Lord' }}
      />
    );
    expect(screen.getByText('Lord')).toBeInTheDocument();
  });

  it('shows a dash for an Other title with no text and ignores an unknown title', () => {
    const { rerender } = render(
      <ContactSummary name='contact' contact={{ title: Title.Other }} />
    );
    expect(screen.getByText('Title, if "Other"')).toBeInTheDocument();

    rerender(
      <ContactSummary
        name='contact'
        contact={{ title: 'Emperor' as unknown as Title }}
      />
    );
    expect(screen.queryByText('Emperor')).not.toBeInTheDocument();
  });
});

describe('OrganisationSummary', () => {
  it('renders nothing for answers that were never given', () => {
    const container = renderOrganisation({});

    expect(screen.queryByText('Organisation type')).not.toBeInTheDocument();
    expect(container.textContent).toContain('Organisation name');
    expect(container.textContent).toContain('Business address');
  });

  it('falls back to a message for an answer that matches no option', () => {
    const container = renderOrganisation({
      organisationAndContact: { isManufacturer: 'Maybe' as unknown as YesNo },
    });

    expect(container.querySelector('span.text-break')).toHaveTextContent(
      'No details added'
    );
  });

  it('shows the authorised agent when the rules do not hide it', () => {
    renderOrganisation({
      organisationAndContact: {
        isManufacturer: YesNo.No,
        authorisedAgent: {},
      },
    });

    expect(screen.getByText('Business street address')).toBeInTheDocument();
    expect(screen.getByText('Manufacturer name')).toBeInTheDocument();
  });

  it('hides the sections a rule hides', () => {
    renderOrganisation(
      { organisationAndContact: { isManufacturer: YesNo.Yes } },
      {
        organisationAndContact: {
          isCurrentOrganisationHide: true,
          isManufacturerHide: () => true,
          principalContactHide: true,
          principalInvoiceContactHide: true,
        },
      }
    );

    expect(screen.queryByText('Organisation name')).not.toBeInTheDocument();
    expect(screen.queryByText('Manufacturer name')).not.toBeInTheDocument();
    expect(screen.queryByText('First name')).not.toBeInTheDocument();
  });
});

describe('ApplicationSummary', () => {
  it('reports no type and no sub-options for an empty application', () => {
    renderApplication({});

    expect(screen.getByText('Not selected')).toBeInTheDocument();
  });

  it('lists a single selected sub-option given as a string', () => {
    renderApplication({
      applicationAndInstrument: {
        patternApprovalType: PatternApprovalRequiredValues.Variation,
        varSubOptions:
          PatternApprovalRequiredValueOptions.AmendmenttoanExistingCoA as unknown as PatternApprovalRequiredValueOptions[],
      },
    });

    expect(screen.getByText('Certificate edits')).toBeInTheDocument();
  });

  it('says Not selected when the sub-options are empty or unknown', () => {
    renderApplication({
      applicationAndInstrument: {
        patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
        othSubOptions: ['Unknown' as PatternApprovalRequiredValueOptions],
      },
    });

    expect(screen.getAllByText('Not selected')).toHaveLength(1);
  });

  it('shows a category without a type, and ignores a type under another category', () => {
    renderApplication({
      applicationAndInstrument: {
        patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
        instrumentCategory: 'cat-1',
        instrumentType: 'type-9',
        instrumentCategoryLookup: [{ id: 'cat-1', label: 'Mass' }],
        instrumentTypeLookup: [
          { id: 'type-9', label: 'Elsewhere', parentId: 'cat-2' },
        ],
      },
    });

    expect(screen.getByText('Mass')).toBeInTheDocument();
    expect(screen.queryByText('Elsewhere')).not.toBeInTheDocument();
  });

  it('shows a type when no category is recorded', () => {
    renderApplication({
      applicationAndInstrument: {
        patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
        instrumentType: 'type-1',
        instrumentTypeLookup: [{ id: 'type-1', label: 'Balance' }],
      },
    });

    expect(screen.getByText('Balance')).toBeInTheDocument();
  });

  it('copes with missing lookups', () => {
    renderApplication({
      applicationAndInstrument: {
        patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
        instrumentCategory: 'cat-1',
        instrumentType: 'type-1',
      },
    });

    expect(screen.queryByText('Mass')).not.toBeInTheDocument();
  });

  it('prints a dash for an absent certificate number', () => {
    renderApplication({
      applicationAndInstrument: {
        patternApprovalType: PatternApprovalRequiredValues.Variation,
      },
    });

    expect(screen.getByText('Certificate number')).toBeInTheDocument();
  });
});
