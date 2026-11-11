import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  PatternApprovalRequiredValues,
  Title,
  YesNo,
} from '../../../../../ClientApp/src/api/web-api-client';
import type { PatternApprovalRequiredValueOptions } from '../../../../../ClientApp/src/api/web-api-client';
import type { RequestForPatternApprovalAppDetails } from '../../../../../ClientApp/src/api/web-api-client';
import type { TaSummarySectionProps } from '../../../../../ClientApp/src/routes/ta/summary/types';
import { toPatternApprovalRequiredValueOptions } from '../../../../../ClientApp/src/utils/apiEnumMappings';
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

// function suite titles are required by vitest/prefer-describe-function-title.
describe(ContactSummary, () => {
  it('prints a dash for every field of a missing contact', () => {
    expect.hasAssertions();

    const { container } = render(
      <ContactSummary name='contact' contact={undefined} />,
    );

    expect(container.textContent).toContain('First name');
    expect(container.querySelectorAll('.visually-hidden')).toHaveLength(6);
  });

  it('prints the title row with a dash when the title is the empty string', () => {
    expect.hasAssertions();

    render(
      <ContactSummary
        name='contact'
        contact={{ title: '' as unknown as Title, firstName: 'Ada' }}
      />,
    );

    expect(screen.getByText('Title (optional)')).toBeInTheDocument();
  });

  it('omits the title row when no title was chosen', () => {
    expect.hasAssertions();

    render(<ContactSummary name='contact' contact={{ firstName: 'Ada' }} />);

    expect(screen.queryByText('Title (optional)')).not.toBeInTheDocument();
  });

  it('spells out a compound title and shows the Other text', () => {
    expect.hasAssertions();

    const { rerender } = render(
      <ContactSummary
        name='contact'
        contact={{ title: Title.AssociateProfessor }}
      />,
    );

    expect(screen.getByText('Associate Professor')).toBeInTheDocument();

    rerender(
      <ContactSummary
        name='contact'
        contact={{ title: Title.Other, titleOther: 'Lord' }}
      />,
    );

    expect(screen.getByText('Lord')).toBeInTheDocument();
  });

  it('shows a dash for an Other title with no text', () => {
    expect.hasAssertions();

    render(<ContactSummary name='contact' contact={{ title: Title.Other }} />);

    expect(screen.getByText('Title, if "Other"')).toBeInTheDocument();
  });

  it.each(['Emperor', 'constructor', '__proto__', 'toString'])(
    'ignores an unknown title value: %s',
    (unknownTitle) => {
      expect.hasAssertions();

      render(
        <ContactSummary name='contact' contact={{ title: unknownTitle }} />,
      );

      expect(screen.queryByText('Title (optional)')).not.toBeInTheDocument();
    },
  );
});

// function suite titles are required by vitest/prefer-describe-function-title.
describe(OrganisationSummary, () => {
  it('renders nothing for answers that were never given', () => {
    expect.hasAssertions();

    const container = renderOrganisation({});

    expect(screen.queryByText('Organisation type')).not.toBeInTheDocument();
    expect(container.textContent).toContain('Organisation name');
    expect(container.textContent).toContain('Business address');
  });

  it('falls back to a message for an answer that matches no option', () => {
    expect.hasAssertions();

    const container = renderOrganisation({
      organisationAndContact: { isManufacturer: 'Maybe' as unknown as YesNo },
    });

    expect(container.querySelector('span.text-break')).toHaveTextContent(
      'No details added',
    );
  });

  it('shows the authorised agent when the rules do not hide it', () => {
    expect.hasAssertions();

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
    expect.hasAssertions();

    renderOrganisation(
      { organisationAndContact: { isManufacturer: YesNo.Yes } },
      {
        organisationAndContact: {
          isCurrentOrganisationHide: true,
          isManufacturerHide: () => true,
          principalContactHide: true,
          principalInvoiceContactHide: true,
        },
      },
    );

    expect(screen.queryByText('Organisation name')).not.toBeInTheDocument();
    expect(screen.queryByText('Manufacturer name')).not.toBeInTheDocument();
    expect(screen.queryByText('First name')).not.toBeInTheDocument();
  });
});

// function suite titles are required by vitest/prefer-describe-function-title.
describe(ApplicationSummary, () => {
  it('reports no type and no sub-options for an empty application', () => {
    expect.hasAssertions();

    renderApplication({});

    expect(screen.getByText('Not selected')).toBeInTheDocument();
  });

  it('lists a single selected sub-option given as a string', () => {
    expect.hasAssertions();

    renderApplication({
      applicationAndInstrument: {
        patternApprovalType: PatternApprovalRequiredValues.Variation,
        varSubOptions: [
          toPatternApprovalRequiredValueOptions('AmendmenttoanExistingCoA'),
        ].filter(
          (option): option is PatternApprovalRequiredValueOptions =>
            option !== undefined,
        ),
      },
    });

    expect(screen.getByText('Certificate edits')).toBeInTheDocument();
  });

  it('says Not selected when the sub-options are empty or unknown', () => {
    expect.hasAssertions();

    renderApplication({
      applicationAndInstrument: {
        patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
        othSubOptions: [
          toPatternApprovalRequiredValueOptions('Unknown'),
        ].filter(
          (option): option is PatternApprovalRequiredValueOptions =>
            option !== undefined,
        ),
      },
    });

    expect(screen.getAllByText('Not selected')).toHaveLength(1);
  });

  it('shows a category without a type, and ignores a type under another category', () => {
    expect.hasAssertions();

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
    expect.hasAssertions();

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
    expect.hasAssertions();

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
    expect.hasAssertions();

    renderApplication({
      applicationAndInstrument: {
        patternApprovalType: PatternApprovalRequiredValues.Variation,
      },
    });

    expect(screen.getByText('Certificate number')).toBeInTheDocument();
  });
});
