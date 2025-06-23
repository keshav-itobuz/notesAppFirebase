import { MMKV } from 'react-native-mmkv';
import { dbInstance } from '../config/firebase.config';

interface NoteInterface {
  id: string;
  title: string;
  content: string;
  isCompleted: boolean;
  createdAt: any;
  userId: string;
  isSynced?: boolean;
}

const storage = new MMKV({ id: 'notes-storage' });

export const saveNoteLocally = (note: Partial<NoteInterface>) => {
  const id = `temp_${Date.now()}`;
  const createdAt = Date.now();

  storage.set(
    id,
    JSON.stringify({
      ...note,
      createdAt,
      isSynced: false,
    }),
  );
};

export const updateNote = (id: string, note: Partial<NoteInterface>) => {
  const existing = storage.getString(id);
  if (!existing) return;

  const parsed = JSON.parse(existing);
  const updated = {
    ...parsed,
    ...note,
    isSynced: false,
  };

  storage.set(id, JSON.stringify(updated));
};

export const getLocalNotes = (): NoteInterface[] => {
  const keys = storage.getAllKeys();
  const notes: NoteInterface[] = [];

  for (const key of keys) {
    const raw = storage.getString(key);
    if (raw) {
      const note = JSON.parse(raw);
      if (!note.isSynced) {
        notes.push({ id: key, ...note });
      }
    }
  }

  return notes;
};

let isSyncing = false;

export const syncNotes = async () => {
  if (isSyncing) {
    return;
  }

  isSyncing = true;

  try {
    const allKeys = storage.getAllKeys();

    for (const key of allKeys) {
      const stored = storage.getString(key);
      if (!stored) continue;

      const note = JSON.parse(stored);

      if (!note.isSynced) {
        if (!note.userId) {
          continue;
        }

        try {
          await dbInstance.collection('notes').add({
            title: note.title,
            content: note.content,
            isCompleted: note.isCompleted,
            userId: note.userId,
            createdAt: note.createdAt,
          });

          storage.delete(key);
        } catch (error) {
          console.error(`Failed to sync note ${key}`, error);
        }
      }
    }
  } catch (error) {
    console.error('Sync process failed:', error);
  } finally {
    isSyncing = false;
  }
};
