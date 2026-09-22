import type { StorageCache } from "./types.ts";

const getItemFromSessionStore = <T>(key: string) => {
	const localStore = globalThis.sessionStorage;
	const item = localStore.getItem(key);

	if (item && item !== null && item !== "") {
		try {
			return JSON.parse(item) as T;
		} catch {
			// Malformed JSON — clear the invalid entry and return undefined
			localStore.removeItem(key);
		}
	}
};

const setItemInSessionStore = <T>(item: T, key: string) => {
	const localStore = globalThis.sessionStorage;
	localStore.setItem(key, JSON.stringify(item));
};

const removeItemFromSessionStore = (key: string) => {
	const localStore = globalThis.sessionStorage;
	localStore.removeItem(key);
};

const clearSessionStore = () => {
	const localStore = globalThis.sessionStorage;
	localStore.clear();
};

const SessionStorageCache = (): StorageCache => ({
	getItem: getItemFromSessionStore,
	setItem: setItemInSessionStore,
	removeItem: removeItemFromSessionStore,
	clear: clearSessionStore,
});

export default SessionStorageCache;
