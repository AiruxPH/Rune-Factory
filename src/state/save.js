import { newPlayer, migrate } from './player.js';
export const SAVE_KEY = 'rune-factory.save.v1';
export function load(storage) {
  try {
    const text = storage.getItem(SAVE_KEY);
    return { state: text ? migrate(JSON.parse(text)) : newPlayer(), error: null };
  } catch (error) {
    return { state: newPlayer(), error: 'Save could not be loaded. Autosave is paused to protect existing data.' };
  }
}
export function save(storage, state) {
  const savedAt = Date.now();
  try { storage.setItem(SAVE_KEY, JSON.stringify({ ...state, savedAt })); state.savedAt = savedAt; return true; }
  catch { return false; }
}

// Commit storage first so a failed reset cannot silently discard in-memory progress.
export function resetStoredData(storage, erase = false) {
  const state = newPlayer();
  try {
    if (erase) storage.removeItem(SAVE_KEY);
    else if (!save(storage, state)) return { ok: false };
    return { ok: true, state };
  } catch { return { ok: false }; }
}
