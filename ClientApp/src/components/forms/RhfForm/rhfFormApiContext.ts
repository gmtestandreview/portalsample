import { createContext, useContext } from 'react';
import type { FormEvent } from 'react';
import type { SubmitMode } from './wizardYupResolver';

export interface RhfFormApi {
  /**
   * Validates with the mode's schema, then calls the matching handler. Never
   * rejects: a handler that throws is logged.
   */
  submit: (mode: SubmitMode) => Promise<void>;
  /** Native form submit (Enter key, submit button): behaves as `next`. */
  onFormSubmit: (event?: FormEvent) => void;
  /**
   * A step whose own data failed to load calls this so the shell cannot save or
   * complete it while the fields are not shown. While blocked, `submit` is a no-op.
   */
  setSubmitBlocked: (blocked: boolean) => void;
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
