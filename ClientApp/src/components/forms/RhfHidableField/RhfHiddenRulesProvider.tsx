import type { ReactNode } from 'react';
import type { Hideable } from '../types';
import { HiddenRulesContext } from './hiddenRulesContext';

interface RhfHiddenRulesProviderProps {
  rules: Hideable;
  children?: ReactNode;
}

/**
 * React Hook Form has no form `status`, so this carries the hide rules that
 * Formik keeps in `status.hidden`. Wrap a form in it and `RhfHidableField`
 * reads the rules from here. Hoist an inline `rules` literal or wrap it in
 * `useMemo`; the provider deliberately does not memoise it.
 */
export const RhfHiddenRulesProvider = ({
  rules,
  children,
}: Readonly<RhfHiddenRulesProviderProps>) => (
  <HiddenRulesContext.Provider value={rules}>
    {children}
  </HiddenRulesContext.Provider>
);
