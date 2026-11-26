import { getApp } from 'firebase/app';
import { collection, doc, getDoc, getDocs, getFirestore, onSnapshot, serverTimestamp, setDoc, type Unsubscribe, writeBatch, deleteDoc, Timestamp } from 'firebase/firestore';
import type { AppSettings } from './appSettings';

const PROJECT_ID = 'study-plan17';

function settingsRef(uid: string) {
  const db = getFirestore(getApp());
  return doc(db, 'artifacts', PROJECT_ID, 'users', uid, 'settings', 'preferences');
}

export async function loadCloudAppSettings(uid: string): Promise<Partial<AppSettings> | null> {
  const snapshot = await getDoc(settingsRef(uid));
  const data = snapshot.data();
  if (data?.appSettings && typeof data.appSettings === 'object') return data.appSettings as Partial<AppSettings>;
  if (typeof data?.darkMode === 'boolean') {
    return {
      theme: data.darkMode ? 'dark' : 'light',
      readingSize: data.fontSize >= 18 ? 'large' : 'small',
      language: data.language === 'bn' || data.language === 'en' ? data.language : 'en',
    };
  }
  return null;
}

export async function saveCloudAppSettings(uid: string, settings: AppSettings): Promise<void> {
  const fontSize = settings.readingSize === 'small' ? 14 : settings.readingSize === 'large' ? 18 : 16;
  await setDoc(settingsRef(uid), {
    appSettings: settings,
    darkMode: ['dark', 'forest', 'midnight'].includes(settings.theme),
    fontSize,
    language: settings.language,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function saveCloudExamPreferences(uid: string, legacy: Record<string, unknown>, exam: Record<string, unknown>): Promise<void> {
  await setDoc(settingsRef(uid), { quizPreferences: legacy, examPreferences: exam, updatedAt: serverTimestamp() }, { merge: true });
}

export async function loadCloudExamPreferences(uid: string): Promise<{ legacy?: Record<string, unknown>; exam?: Record<string, unknown> } | null> {
  const snapshot = await getDoc(settingsRef(uid));
  const data = snapshot.data();
  if (!data) return null;
  return { legacy: data.quizPreferences, exam: data.examPreferences };
}

const USER_COLLECTIONS = ['studyPlans', 'quizResults', 'examResults', 'reviewQuestions'] as const;

export async function exportCloudUserData(uid: string): Promise<Record<string, unknown> | null> {
  const db = getFirestore(getApp());
  const base = `artifacts/${PROJECT_ID}/users/${uid}`;
  const collections: Record<string, unknown[]> = {};
  for (const name of USER_COLLECTIONS) {
    const snapshot = await getDocs(collection(db, base, name));
    const rows: unknown[] = [];
    for (const item of snapshot.docs) {
      const row: Record<string, unknown> = { id: item.id, data: item.data() };
      if (name === 'studyPlans') {
        const weeks = await getDocs(collection(db, base, name, item.id, 'weeks'));
        row.weeks = weeks.docs.map((week) => ({ id: week.id, data: week.data() }));
      }
      rows.push(row);
    }
    collections[name] = rows;
  }
  const settingsNames = ['preferences', 'examBookmarks'];
  const settings: Record<string, unknown> = {};
  for (const id of settingsNames) {
    const snapshot = await getDoc(doc(db, base, 'settings', id));
    if (snapshot.exists()) settings[id] = snapshot.data();
  }
  return { collections, settings };
}

export async function restoreCloudUserData(uid: string, cloud: Record<string, any>): Promise<number> {
  const db = getFirestore(getApp());
  const base = `artifacts/${PROJECT_ID}/users/${uid}`;
  let count = 0;
  for (const name of USER_COLLECTIONS) {
    const rows = Array.isArray(cloud.collections?.[name]) ? cloud.collections[name] : [];
    const current = await getDocs(collection(db, base, name));
    for (const item of current.docs) {
      if (name === 'studyPlans') {
        const weeks = await getDocs(collection(db, base, name, item.id, 'weeks'));
        for (const week of weeks.docs) await deleteDoc(week.ref);
      }
      await deleteDoc(item.ref);
    }
    let batch = writeBatch(db);
    let pending = 0;
    const flush = async () => { if (pending) { await batch.commit(); batch = writeBatch(db); pending = 0; } };
    for (const row of rows) {
      if (!row || typeof row.id !== 'string' || !row.data || typeof row.data !== 'object') continue;
      batch.set(doc(db, base, name, row.id), decodeBackupValue(row.data));
      pending += 1; count += 1;
      for (const week of (name === 'studyPlans' && Array.isArray(row.weeks) ? row.weeks : [])) {
        if (!week || typeof week.id !== 'string' || !week.data || typeof week.data !== 'object') continue;
        batch.set(doc(db, base, name, row.id, 'weeks', week.id), decodeBackupValue(week.data));
        pending += 1; count += 1;
        if (pending >= 450) await flush();
      }
      if (pending >= 450) await flush();
    }
    await flush();
  }
  for (const [id, data] of Object.entries(cloud.settings || {})) {
    if (['preferences', 'examBookmarks'].includes(id) && data && typeof data === 'object') {
      await setDoc(doc(db, base, 'settings', id), decodeBackupValue(data) as Record<string, unknown>);
      count += 1;
    }
  }
  return count;
}

function decodeBackupValue(value: any): any {
  if (value && value.__classCaddyTimestamp === true && Number.isFinite(value.seconds)) {
    return Timestamp.fromMillis(value.seconds * 1000 + (Number(value.nanoseconds) || 0) / 1e6);
  }
  if (Array.isArray(value)) return value.map(decodeBackupValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decodeBackupValue(item)]));
  return value;
}

export function subscribeCloudAppSettings(uid: string, callback: (settings: Partial<AppSettings> | null, examPreferences: { legacy?: Record<string, unknown>; exam?: Record<string, unknown> } | null) => void): Unsubscribe {
  return onSnapshot(settingsRef(uid), (snapshot) => {
    const data = snapshot.data();
    callback(
      data?.appSettings && typeof data.appSettings === 'object' ? data.appSettings as Partial<AppSettings> : null,
      data ? { legacy: data.quizPreferences, exam: data.examPreferences } : null,
    );
  });
}
