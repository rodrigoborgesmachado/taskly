// src/services/handleStore.ts
const DB_NAME = 'jira-folder-board';
const STORE = 'handles';
const KEY = 'rootDir';
const LIST_KEY = 'boards';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveRootHandle(handle: FileSystemDirectoryHandle) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    store.put(handle, KEY);
    const req = store.get(LIST_KEY);
    req.onsuccess = () => {
      const arr = (req.result as FileSystemDirectoryHandle[]) || [];
      if (!arr.some(h => (h as any).name === (handle as any).name)) {
        arr.push(handle);
        store.put(arr, LIST_KEY);
      }
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadBoardHandles(): Promise<FileSystemDirectoryHandle[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(LIST_KEY);
    req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle[]) || []);
    req.onerror = () => reject(req.error);
  });
}

export async function loadRootHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearRootHandle() {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeBoardHandle(name: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.get(LIST_KEY);
    req.onsuccess = () => {
      const arr = (req.result as FileSystemDirectoryHandle[]) || [];
      const next = arr.filter(h => (h as any).name !== name);
      store.put(next, LIST_KEY);
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
