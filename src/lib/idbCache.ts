import { ArchiveCardButton } from '../types';

const DB_NAME = 'class_caddy_db';
const STORE_NAME = 'archive_cache';
const KEY_TREE = 'root_cards_tree';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Retrieve the cached archive tree from IndexedDB.
 * Works seamlessly on iOS Safari, Chrome, Firefox, and Edge with no 5MB quota limit.
 */
export async function getArchiveTreeFromIDB(): Promise<ArchiveCardButton[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(KEY_TREE);

      request.onsuccess = () => {
        const result = request.result;
        if (result && Array.isArray(result) && result.length > 0) {
          resolve(result);
        } else if (typeof result === 'string') {
          try {
            const parsed = JSON.parse(result);
            if (Array.isArray(parsed)) {
              resolve(parsed);
              return;
            }
          } catch {
            // Ignore parse error
          }
          resolve(null);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('IndexedDB read warning:', err);
    return null;
  }
}

/**
 * Persist the full archive tree to IndexedDB.
 */
export async function saveArchiveTreeToIDB(cards: ArchiveCardButton[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(cards, KEY_TREE);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB write warning:', err);
  }
}
