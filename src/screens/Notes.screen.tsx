import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import UserContext from '../contexts/user.context';
import { authInstance, dbInstance } from '../config/firebase.config';
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
  orderBy,
} from '@react-native-firebase/firestore';
import { Toast } from 'react-native-toast-notifications';

interface Note {
  title: string;
  content: string;
  createdAt: any;
  userId: string;
}

export default function NotesScreen() {
  const { logout } = useContext(UserContext);
  const [notes, setNotes] = useState<Note[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    try {
      setLoading(true);
      const user = authInstance.currentUser;
      if (!user) throw new Error('User not logged in');

      const notesQuery = query(
        collection(dbInstance, 'notes'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
      );

      const snapshot = await getDocs(notesQuery);
      const notes = snapshot.docs.map(doc => ({
        title: doc.data().title ?? '',
        content: doc.data().content ?? '',
        createdAt: doc.data().createdAt,
        userId: doc.data().userId ?? '',
      }));

      setNotes(notes);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Toast.show(message, { type: 'danger' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote() {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      Toast.show('Title and content are required', { type: 'warning' });
      return;
    }

    try {
      const user = authInstance.currentUser;
      if (!user) throw new Error('User not logged in');

      const notesRef = collection(dbInstance, 'notes');

      await addDoc(notesRef, {
        userId: user.uid,
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        createdAt: serverTimestamp(),
      });

      Toast.show('Note added successfully', { type: 'success' });
      fetchNotes();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Toast.show(message, { type: 'danger' });
    } finally {
      setNewNote({ title: '', content: '' });
      setShowModal(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>My Notes</Text>
        <TouchableOpacity onPress={logout}>
          <Icon name="logout" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notes}
        keyExtractor={item => item.title}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>{item.title}</Text>
            <Text style={styles.noteContent}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={() => <Text>No notes found</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Icon name="add" size={30} color="white" />
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Note</Text>

            <TextInput
              style={styles.input}
              placeholder="Title"
              value={newNote.title}
              onChangeText={text => setNewNote({ ...newNote, title: text })}
            />
            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Content"
              multiline
              value={newNote.content}
              onChangeText={text => setNewNote({ ...newNote, content: text })}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddNote}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    color: '#222',
  },
  noteContent: {
    fontSize: 14,
    color: '#555',
  },
  listContent: {
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
  },
  saveText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
