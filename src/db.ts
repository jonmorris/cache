import { DEFAULT_SETTINGS, type List, type Settings } from './types';

const DB_NAME = 'cache';
const DB_VERSION = 1;
const LISTS = 'lists';
const SETTINGS = 'settings';

let handle: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  handle ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(LISTS)) db.createObjectStore(LISTS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(SETTINGS)) db.createObjectStore(SETTINGS, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return handle;
}

function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }),
  );
}

export const getList = () =>
  run<List | undefined>(LISTS, 'readonly', (s) => s.get('current')).then((l) => l ?? null);

export const putList = (list: List) => run(LISTS, 'readwrite', (s) => s.put(list)).then(() => {});

export const deleteList = () => run(LISTS, 'readwrite', (s) => s.delete('current')).then(() => {});

export const getSettings = () =>
  run<Settings | undefined>(SETTINGS, 'readonly', (s) => s.get('settings')).then((v) => ({
    ...DEFAULT_SETTINGS,
    ...v,
  }));

export const putSettings = (settings: Settings) =>
  run(SETTINGS, 'readwrite', (s) => s.put(settings)).then(() => {});
