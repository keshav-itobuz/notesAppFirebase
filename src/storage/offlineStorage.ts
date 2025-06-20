import { MMKV } from 'react-native-mmkv';
import { dbInstance } from '../config/firebase.config';
import { serverTimestamp } from '@react-native-firebase/firestore';

interface NoteInterface {
  id: string;
  title: string;
  content: string;
  isCompleted: boolean;
  createdAt: any;
  userId: string;
}
const storage = new MMKV({ id: 'notes-storage' });
export const saveNoteLocally = (note: any) => {
  const id = `temp_${Date.now()}`;
  storage.set(id, JSON.stringify({ ...note, isSynced: false }));
};

export const updateNote = (id: string, note: Partial<NoteInterface>) => {
  const existing = storage.getString(id);
  if (!existing) return;

  const parsed = JSON.parse(existing);
  const updated = {
    ...parsed,
    ...note,
    isSynced: false, // Mark it as unsynced again
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
      notes.push({ id: key, ...note });
    }
  }

  return notes;
};

export const syncNotes = async () => {
  const allKeys = storage.getAllKeys();

  for (const key of allKeys) {
    const stored = storage.getString(key);
    if (!stored) continue;

    const note = JSON.parse(stored);

    if (note.isSynced || !key.startsWith('temp_')) {
      if (!note.userId) {
        console.warn(`Skipping note ${key} - missing userId`);
        continue;
      }

      try {
        const docRef = await dbInstance.collection('notes').add({
          title: note.title,
          content: note.content,
          isCompleted: note.isCompleted,
          userId: note.userId,
          createdAt: serverTimestamp(),
        });

        storage.delete(key); // Remove temp note

        storage.set(
          docRef.id,
          JSON.stringify({
            title: note.title,
            content: note.content,
            isCompleted: note.isCompleted,
            userId: note.userId,
            isSynced: true,
          }),
        );
      } catch (error) {
        console.log('Sync failed for:', key, error);
      }
    }
  }
};
