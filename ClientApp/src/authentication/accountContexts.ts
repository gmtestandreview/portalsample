import { createContext } from 'react';
import type {
  AccountDispatchContextValue,
  AccountStateContextValue,
} from './accountContext';

export const AccountStateContext =
  createContext<AccountStateContextValue | null>(null);
export const AccountDispatchContext =
  createContext<AccountDispatchContextValue | null>(null);

export const AccountStateCtx = AccountStateContext;
export const AccountDispatchCtx = AccountDispatchContext;
