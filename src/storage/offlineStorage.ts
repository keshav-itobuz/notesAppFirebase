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

export const storage = new MMKV({ id: 'notes-storage' });
let isSyncing = false;

export const saveNoteLocally = (note: Partial<NoteInterface>) => {
  const id = `temp_${Date.now()}`;
  const createdAt = Date.now();

  storage.set(
    id,
    JSON.stringify({
      id,
      ...note,
      createdAt,
      isSynced: false,
      isDeleted: false,
    }),
  );
};

export const updateNoteLocally = (id: string, note: Partial<NoteInterface>) => {
  const existing = storage.getString(id);

  const parsed = JSON.parse(existing!);
  const updated = {
    ...parsed,
    ...note,
    isSynced: false,
    isDeleted: false,
  };

  storage.set(id, JSON.stringify(updated));
};

export const removeNoteLocally = async (id: string) => {
  const existing = storage.getString(id);

  const parsed = JSON.parse(existing!);
  const updated = {
    ...parsed,
    isDeleted: true,
    isSynced: false,
  };
  await storage.set(id, JSON.stringify(updated));
};

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
          if (note.isDeleted)
            await dbInstance.collection('notes').doc(note.id).delete();
          else {
            await dbInstance.collection('notes').add({
              title: note.title,
              content: note.content,
              isCompleted: note.isCompleted,
              userId: note.userId,
              createdAt: note.createdAt,
            });
          }
          storage.set(key, JSON.stringify({ ...note, isSynced: true }));
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
