import type { ReactNode } from 'react';
import type {
  ProblemDetails,
  ValidationProblemDetails,
} from '../../../api/web-api-client';

export interface ErrorSummaryProps {
  disableLinkedError?: boolean;
  serverErrors?: ProblemDetails | ValidationProblemDetails;
  prefixToRemove?: string;
  isWafViolation?: boolean;
  children?: ReactNode;
}
