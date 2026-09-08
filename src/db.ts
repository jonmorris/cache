import { DEFAULT_SETTINGS, type List, type Settings } from './types';

const DB_NAME = 'cache';
/** v2 keys lists by date; v1 held a single list at the fixed key 'current'. */
const DB_VERSION = 2;
const DAYS = 'days';
const LEGACY_LISTS = 'lists';
const SETTINGS = 'settings';

let handle: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  handle ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = req.result;
      const tx = req.transaction!;

      if (!db.objectStoreNames.contains(SETTINGS)) {
        db.createObjectStore(SETTINGS, { keyPath: 'id' });
      }

      if (event.oldVersion < 1 || !db.objectStoreNames.contains(LEGACY_LISTS)) {
        db.createObjectStore(DAYS, { keyPath: 'date' });
        return;
      }

      // Carry the single v1 list over to its own day, then drop the old store.
      // The read is issued before the delete so nothing is pulled out from
      // under it.
      const carried = tx.objectStore(LEGACY_LISTS).getAll();
      const days = db.createObjectStore(DAYS, { keyPath: 'date' });
      carried.onsuccess = () => {
        for (const record of carried.result as Partial<List>[]) {
          if (typeof record?.date !== 'string') continue;
          days.put({
            date: record.date,
            start: record.start ?? null,
            deadline: record.deadline ?? null,
            createdAt: record.createdAt ?? Date.now(),
            items: Array.isArray(record.items) ? record.items : [],
          });
        }
        db.deleteObjectStore(LEGACY_LISTS);
      };
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

/** Every stored list, keyed by its date. */
export const getLists = () =>
  run<List[]>(DAYS, 'readonly', (s) => s.getAll()).then((rows) =>
    Object.fromEntries(rows.map((list) => [list.date, list])),
  );

export const putList = (list: List) => run(DAYS, 'readwrite', (s) => s.put(list)).then(() => {});

export const deleteList = (date: string) =>
  run(DAYS, 'readwrite', (s) => s.delete(date)).then(() => {});

export const getSettings = () =>
  run<Settings | undefined>(SETTINGS, 'readonly', (s) => s.get('settings')).then((v) => ({
    ...DEFAULT_SETTINGS,
    ...v,
  }));

export const putSettings = (settings: Settings) =>
  run(SETTINGS, 'readwrite', (s) => s.put(settings)).then(() => {});
