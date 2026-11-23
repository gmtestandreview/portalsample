import { createContext } from 'react';
import type {
  AccountDispatchContext as AccountDispatchContextValue,
  AccountStateContext as AccountStateContextValue,
} from './accountContext';

export const AccountStateContext =
  createContext<AccountStateContextValue | null>(null);
export const AccountDispatchContext =
  createContext<AccountDispatchContextValue | null>(null);

export const AccountStateCtx = AccountStateContext;
export const AccountDispatchCtx = AccountDispatchContext;
