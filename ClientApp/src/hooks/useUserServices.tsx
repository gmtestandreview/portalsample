import { useMemo } from 'react';
import useAccountContext from '../authentication/hooks';

export default function useUserServices() {
    const accountContext = useAccountContext();
    const services = useMemo(
        () => accountContext?.details?.userProfile?.services ?? [],
        [accountContext?.details?.userProfile?.services],
    );
    return services;
}
