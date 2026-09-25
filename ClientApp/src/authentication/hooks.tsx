import { useContext, useMemo } from 'react';
import { AccountStateCtx, AccountDispatchCtx } from './accountContext';

export const useAccountState = () => useContext(AccountStateCtx);
export const useAccountDispatch = () => useContext(AccountDispatchCtx);

const useAccountContext = () => {
    const state = useContext(AccountStateCtx);
    const dispatch = useContext(AccountDispatchCtx);
    // Keep the merged object referentially stable across renders so effects
    // and memo dependencies keyed on it don't re-fire when state/dispatch
    // themselves haven't changed.
    return useMemo(() => {
        if (!state && !dispatch) return null;
        return { ...state, ...dispatch };
    }, [state, dispatch]);
};

export default useAccountContext;
