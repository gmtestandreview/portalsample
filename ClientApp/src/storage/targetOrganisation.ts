import SessionStorageCache from './sessionStorageCache';
import type { TargetOrganisation } from './types';

const targetOrganisationKey = 'targetOrganisation';

export const getTargetOrganisation = () => SessionStorageCache().getItem<TargetOrganisation>(targetOrganisationKey);

const setTargetOrganisation = (item: TargetOrganisation) => {
    SessionStorageCache().setItem(item, targetOrganisationKey);
};

export const clearTargetOrganisation = () => {
    SessionStorageCache().removeItem(targetOrganisationKey);
};

export default setTargetOrganisation;
