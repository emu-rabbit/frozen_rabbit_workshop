import type { CachedData } from '../types/gameData';

// IndexedDB is an optimization. A denied/blocked/full database must never block the website.
const DATABASE = `frozen-rabbit-workshop:data:${import.meta.env.BASE_URL}`;
let disabled = false;
let connection: Promise<IDBDatabase | null> | undefined;

async function open(): Promise<IDBDatabase | null> {
  if (disabled || typeof indexedDB === 'undefined') return null;
  if (!connection) connection = new Promise(resolve => {
    let finished = false;
    const finish = (db: IDBDatabase | null) => {
      if (finished) { db?.close(); return; }
      finished = true; clearTimeout(timer);
      if (!db) disabled = true;
      resolve(db);
    };
    const timer = setTimeout(() => finish(null), 2000);
    try {
      const request = indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('versions');
      request.onerror = () => finish(null);
      request.onblocked = () => finish(null);
      request.onsuccess = () => {
        request.result.onversionchange = () => { request.result.close(); connection = undefined; };
        finish(request.result);
      };
    } catch { finish(null); }
  });
  return connection;
}

async function transact<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore, set: (value: T) => void) => void): Promise<T | null> {
  const db = await open();
  if (!db) return null;
  return new Promise(resolve => {
    let result: T | null = null;
    try {
      const tx = db.transaction('versions', mode);
      const timer = setTimeout(() => { try { tx.abort(); } catch {} resolve(null); }, 2000);
      tx.oncomplete = () => { clearTimeout(timer); resolve(result); };
      tx.onerror = tx.onabort = () => { clearTimeout(timer); resolve(null); };
      run(tx.objectStore('versions'), value => { result = value; });
    } catch { resolve(null); }
  });
}

export async function readCachedData(): Promise<{ active?: CachedData; pending?: CachedData } | null> {
  return transact('readonly', (store, set) => {
    const active = store.get('active');
    const pending = store.get('pending');
    pending.onsuccess = () => set({ active: active.result, pending: pending.result });
  });
}

export async function saveCachedData(key: 'active' | 'pending', data: CachedData, expectedActive?: string): Promise<boolean> {
  return (await transact<boolean>('readwrite', (store, set) => {
    const request = store.get('active');
    request.onsuccess = () => {
      // An older open tab must not overwrite the version adopted by a newer tab.
      const current = request.result as CachedData | undefined;
      const pending = store.get('pending');
      pending.onsuccess = () => {
        const promoting = key === 'active' && pending.result?.manifest.version === data.manifest.version;
        if (!promoting && expectedActive && current && current.manifest.version !== expectedActive && current.manifest.version !== data.manifest.version) { set(false); return; }
        store.put(data, key);
        if (promoting) store.delete('pending');
        set(true);
      };
    };
  })) === true;
}

export async function clearCachedData(): Promise<boolean> {
  return (await transact<boolean>('readwrite', (store, set) => { store.clear(); set(true); })) === true;
}
