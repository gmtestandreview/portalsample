import { describe, expect, it } from 'vitest';
import {
  ApplicationType,
  CRMLookupTypes,
  PatternApprovalRequiredValueOptions,
  ServiceType,
  State,
  Title,
} from '../../../ClientApp/src/api/web-api-client';
import { HttpStatusCode } from '../../../ClientApp/src/types';
import {
  toApplicationType,
  toCRMLookupTypes,
  toHttpStatusCode,
  toPatternApprovalRequiredValueOptions,
  toServiceType,
  toState,
  toTitle,
} from '../../../ClientApp/src/utils/apiEnumMappings';

describe('generated API enum mappings', () => {
  it.each([
    [
      'application type',
      toApplicationType,
      'QuoteAccept',
      ApplicationType.QuoteAccept,
    ],
    [
      'CRM lookup type',
      toCRMLookupTypes,
      'PAPortalCategory',
      CRMLookupTypes.PAPortalCategory,
    ],
    ['state', toState, 'NSW', State.NSW],
    ['title', toTitle, 'Dr', Title.Dr],
    [
      'service type',
      toServiceType,
      'PatternApproval',
      ServiceType.PatternApproval,
    ],
    [
      'pattern approval option',
      toPatternApprovalRequiredValueOptions,
      'AmendmenttoanExistingCoA',
      PatternApprovalRequiredValueOptions.AmendmenttoanExistingCoA,
    ],
  ])(
    'maps a known %s to its generated enum member',
    (_name, mapValue, value, expected) => {
      expect.hasAssertions();
      expect(mapValue(value)).toBe(expected);
    },
  );

  it.each([
    ['Forbidden', HttpStatusCode.Forbidden],
    ['NotFound', HttpStatusCode.NotFound],
    ['Conflict', HttpStatusCode.Conflict],
    ['Gone', HttpStatusCode.Gone],
    ['PreconditionFailed', HttpStatusCode.PreconditionFailed],
    ['UnprocessableEntity', HttpStatusCode.UnprocessableEntity],
    ['InternalServerError', HttpStatusCode.InternalServerError],
    ['ServiceUnavailable', HttpStatusCode.ServiceUnavailable],
  ])('maps the %s HTTP status code to its enum member', (_name, code) => {
    expect.hasAssertions();
    expect(toHttpStatusCode(code)).toBe(code);
  });

  it.each([
    ['application type', toApplicationType],
    ['CRM lookup type', toCRMLookupTypes],
    ['state', toState],
    ['title', toTitle],
    ['service type', toServiceType],
    ['pattern approval option', toPatternApprovalRequiredValueOptions],
  ])('returns undefined for an unknown %s', (_name, mapValue) => {
    expect.hasAssertions();
    expect(mapValue('server-added-value')).toBeUndefined();
    expect(mapValue(null)).toBeUndefined();
  });

  it('returns undefined for an unknown HTTP status code', () => {
    expect.hasAssertions();
    expect(toHttpStatusCode(418)).toBeUndefined();
    expect(toHttpStatusCode('404')).toBeUndefined();
  });
});
