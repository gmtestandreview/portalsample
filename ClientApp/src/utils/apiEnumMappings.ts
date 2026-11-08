import {
  ApplicationType,
  CRMLookupTypes,
  PatternApprovalRequiredValueOptions,
  ServiceType,
  State,
  Title,
} from '../api/web-api-client';
import { HttpStatusCode } from '../types';

const isStringEnumValue = <T extends Record<string, string>>(
  enumObject: T,
  value: unknown,
): value is T[keyof T] =>
  typeof value === 'string' &&
  Object.values(enumObject).some((enumValue) => enumValue === value);

const toStringEnumValue = <T extends Record<string, string>>(
  enumObject: T,
  value: unknown,
): T[keyof T] | undefined =>
  isStringEnumValue(enumObject, value) ? value : undefined;

export const toApplicationType = (
  value: unknown,
): ApplicationType | undefined => toStringEnumValue(ApplicationType, value);

export const toCRMLookupTypes = (
  value: unknown,
): CRMLookupTypes | undefined => toStringEnumValue(CRMLookupTypes, value);

export const toState = (value: unknown): State | undefined =>
  toStringEnumValue(State, value);

export const toTitle = (value: unknown): Title | undefined =>
  toStringEnumValue(Title, value);

export const toServiceType = (
  value: unknown,
): ServiceType | undefined => toStringEnumValue(ServiceType, value);

export const toPatternApprovalRequiredValueOptions = (
  value: unknown,
): PatternApprovalRequiredValueOptions | undefined =>
  toStringEnumValue(PatternApprovalRequiredValueOptions, value);

export const toHttpStatusCode = (
  value: unknown,
): HttpStatusCode | undefined => {
  switch (value) {
    case HttpStatusCode.Forbidden:
      return HttpStatusCode.Forbidden;
    case HttpStatusCode.NotFound:
      return HttpStatusCode.NotFound;
    case HttpStatusCode.Conflict:
      return HttpStatusCode.Conflict;
    case HttpStatusCode.Gone:
      return HttpStatusCode.Gone;
    case HttpStatusCode.PreconditionFailed:
      return HttpStatusCode.PreconditionFailed;
    case HttpStatusCode.UnprocessableEntity:
      return HttpStatusCode.UnprocessableEntity;
    case HttpStatusCode.InternalServerError:
      return HttpStatusCode.InternalServerError;
    case HttpStatusCode.ServiceUnavailable:
      return HttpStatusCode.ServiceUnavailable;
    default:
      return undefined;
  }
};
