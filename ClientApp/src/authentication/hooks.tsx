import { useContext } from 'react';
import { AccountStateCtx, AccountDispatchCtx } from './accountContext';

export const useAccountState = () => useContext(AccountStateCtx);
export const useAccountDispatch = () => useContext(AccountDispatchCtx);

const useAccountContext = () => {
    const state = useContext(AccountStateCtx);
    const dispatch = useContext(AccountDispatchCtx);
    if (!state && !dispatch) return null;
    return { ...state, ...dispatch };
};

export default useAccountContext;
