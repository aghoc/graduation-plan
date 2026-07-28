import type { Profile } from "./catalog.ts";

const DB_NAME = "graduation-planner";
const STORE_NAME = "profiles";
const ACTIVE_KEY = "graduation-planner-active-profile";

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listProfiles(): Promise<Profile[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as Profile[]);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProfile(profile: Profile): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(profile);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteProfile(id: string): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export const getActiveProfileId = () => localStorage.getItem(ACTIVE_KEY);
export const setActiveProfileId = (id: string) => localStorage.setItem(ACTIVE_KEY, id);
