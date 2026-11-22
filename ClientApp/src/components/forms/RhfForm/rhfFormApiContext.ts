import { createContext, useContext } from 'react';
import type { FormEvent } from 'react';
import type { SubmitMode } from './wizardYupResolver';

export interface RhfFormApi {
  /**
   * Validates with the mode's schema, then calls the matching handler. Never
   * rejects: a handler that throws is logged, as Formik's handleSubmit did.
   */
  submit: (mode: SubmitMode) => Promise<void>;
  /** Native form submit (Enter key, submit button): behaves as `next`. */
  onFormSubmit: (event?: FormEvent) => void;
}

export const RhfFormApiContext = createContext<RhfFormApi | null>(null);

/** Submit controls call this instead of writing flags into the form values. */
export const useRhfFormApi = (): RhfFormApi => {
  const api = useContext(RhfFormApiContext);
  if (!api) {
    throw new Error('useRhfFormApi must be used inside RhfForm');
  }
  return api;
};

/** True under `RhfForm`. Shell-neutral controls use it to pick their adapter. */
export const useIsRhfShell = (): boolean =>
  useContext(RhfFormApiContext) !== null;
