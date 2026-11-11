import type { StorageCache } from './types';

const getItemFromSessionStore = <T>(
  key: string,
  deserialize?: (value: unknown) => T,
): T | undefined => {
  const localStore = globalThis.sessionStorage;
  const item = localStore.getItem(key);

  if (item && item !== '') {
    try {
      const parsed: unknown = JSON.parse(item);
      return deserialize ? deserialize(parsed) : (parsed as T);
    } catch {
      // Malformed JSON — clear the invalid entry and return undefined
      localStore.removeItem(key);
      return undefined;
    }
  }

  return undefined;
};

const setItemInSessionStore = <T>(
  item: T,
  key: string,
  serialize: (value: T) => string = JSON.stringify,
) => {
  const localStore = globalThis.sessionStorage;
  localStore.setItem(key, serialize(item));
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
