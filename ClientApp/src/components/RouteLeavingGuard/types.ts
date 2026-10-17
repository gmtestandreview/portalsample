import type { ReactNode } from 'react';

export interface RouteLeavingGuardProps {
  when?: boolean;
  title?: ReactNode;
  body?: ReactNode;
  cancelBtn?: ReactNode;
  confirmBtn?: ReactNode;
  /** Runs just before a confirmed navigation proceeds, e.g. to clear form errors. */
  onProceed?: () => void;
}
