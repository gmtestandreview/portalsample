import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Hideable } from '../types';

const NO_HIDDEN_RULES: Hideable = {};

const HiddenRulesContext = createContext<Hideable>(NO_HIDDEN_RULES);

interface RhfHiddenRulesProviderProps {
  rules: Hideable;
  children?: ReactNode;
}

/**
 * React Hook Form has no form `status`, so this carries the hide rules that
 * Formik keeps in `status.hidden`. Wrap a form in it and `RhfHidableField`
 * reads the rules from here.
 */
export const RhfHiddenRulesProvider = ({
  rules,
  children,
}: Readonly<RhfHiddenRulesProviderProps>) => (
  <HiddenRulesContext.Provider value={rules}>
    {children}
  </HiddenRulesContext.Provider>
);

/** Current hide rules; an empty set (nothing hidden) outside a provider. */
export const useHiddenRules = (): Hideable => useContext(HiddenRulesContext);
