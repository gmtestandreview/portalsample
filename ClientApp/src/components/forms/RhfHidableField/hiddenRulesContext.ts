import { createContext, useContext } from 'react';
import type { Hideable } from '../types';

const NO_HIDDEN_RULES: Hideable = {};

export const HiddenRulesContext = createContext<Hideable>(NO_HIDDEN_RULES);

/** Current hide rules; an empty set (nothing hidden) outside a provider. */
export const useHiddenRules = (): Hideable => useContext(HiddenRulesContext);
