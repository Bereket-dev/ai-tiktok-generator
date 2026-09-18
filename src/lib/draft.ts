import { get, set, del, createStore } from "idb-keyval";

// Custom IDB store scoped to this app
const draftStore = createStore("tiktok-creator", "drafts");

/**
 * Save a recorded video blob to IndexedDB under a key.
 */
export async function saveDraft(key: string, blob: Blob): Promise<void> {
  await set(key, blob, draftStore);
}

/**
 * Retrieve a draft blob from IndexedDB.
 */
export async function getDraft(key: string): Promise<Blob | undefined> {
  return get<Blob>(key, draftStore);
}

/**
 * Delete a draft after successful upload.
 */
export async function deleteDraft(key: string): Promise<void> {
  await del(key, draftStore);
}
