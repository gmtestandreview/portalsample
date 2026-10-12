import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RfqOrganisationSummary from '../../../../ClientApp/src/routes/requestForQuote/summary/RfqOrganisationSummary';
import { resetMsalMock } from '../../helpers/mockMsal';
import {
  renderFormikOrganisation,
  summaryFixtures,
  summaryHidden,
} from './summaryFixtures';

vi.mock('@azure/msal-react', async () => {
  const { msalReactModuleMock } = await import('../../helpers/mockMsal');

  return msalReactModuleMock();
});

vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
  default: { error: vi.fn(), info: vi.fn(), verbose: vi.fn() },
}));

/** One tag per line, so a mismatch shows as a readable diff. */
const lines = (html: string) => html.split('><');

/**
 * Differences between the Formik branch and the twin that are accepted. Expected to stay empty:
 * the organisation section has no known quirk to fix, so any difference is a parity failure.
 */
const ALLOWED_DIFFERENCES: readonly { from: RegExp; to: string }[] = [];

const normalise = (html: string) =>
  ALLOWED_DIFFERENCES.reduce(
    (current, { from, to }) => current.replace(from, to),
    html
  );

describe('form-free RFQ organisation summary parity with the Formik summary', () => {
  beforeEach(() => {
    resetMsalMock();
  });

  it.each(summaryFixtures.map((f) => [f.name, f] as const))(
    'renders the same markup for %s',
    (_name, fixture) => {
      const legacy = renderFormikOrganisation(fixture).container.innerHTML;
      document.body.innerHTML = '';
      const twin = render(
        <RfqOrganisationSummary
          values={fixture.values}
          hidden={summaryHidden}
        />
      ).container.innerHTML;

      expect(lines(normalise(twin))).toEqual(lines(normalise(legacy)));
    }
  );
});
