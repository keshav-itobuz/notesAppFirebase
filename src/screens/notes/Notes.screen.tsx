import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import UserContext from '../../contexts/user.context';
import { authInstance, dbInstance } from '../../config/firebase.config';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  limit,
  startAfter,
  updateDoc,
  onSnapshot,
} from '@react-native-firebase/firestore';
import { Toast } from 'react-native-toast-notifications';
import { notesStyle } from './notesStyle';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigator.type';

interface Note {
  id: string;
  title: string;
  content: string;
  isCompleted: boolean;
  createdAt: any;
  userId: string;
}

export default function NotesScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { userData } = useContext(UserContext);
  const [notes, setNotes] = useState<Note[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newNote, setNewNote] = useState({
    id: '',
    title: '',
    content: '',
    isCompleted: false,
  });
  const [endReached, setEndReached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const pageSize = 8;

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    const fetchNotes = async () => {
      try {
        if (loading) return; // Prevent multiple fetches
        setLoading(true);

        const user = authInstance.currentUser;
        if (!user) throw new Error('User not logged in');

        let notesQuery = query(
          collection(dbInstance, 'notes'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(pageSize),
        );

        if (filter !== 'all') {
          const status = filter === 'completed';
          notesQuery = query(notesQuery, where('isCompleted', '==', status));
        }

        if (lastVisible) {
          notesQuery = query(notesQuery, startAfter(lastVisible));
        }

        unsubscribe = onSnapshot(notesQuery, snapshot => {
          const newNotes = snapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title ?? '',
            content: doc.data().content ?? '',
            createdAt: doc.data().createdAt,
            userId: doc.data().userId ?? '',
            isCompleted: doc.data().isCompleted ?? false,
          }));

          // Update endReached state
          const hasMore = newNotes.length >= pageSize;
          setEndReached(!hasMore);

          // Update notes
          if (lastVisible) {
            setNotes(prevNotes => [...prevNotes, ...newNotes]);
          } else {
            setNotes(newNotes);
          }

          // Update lastVisible only if we got results
          if (newNotes.length > 0) {
            setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          }
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        Toast.show(message, { type: 'danger' });
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();

    return () => {
      unsubscribe?.();
    };
  }, [filter, page]);

  async function handleAddNote() {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      Toast.show('Title and content are required', { type: 'warning' });
      return;
    }

    try {
      const user = authInstance.currentUser;
      if (!user) throw new Error('User not logged in');

      if (isEditing && newNote.id) {
        await updateDoc(doc(dbInstance, 'notes', newNote.id), {
          title: newNote.title.trim(),
          content: newNote.content.trim(),
          createdAt: Date.now(),
        });

        Toast.show('Note updated successfully', { type: 'success' });
      } else {
        const newNoteData = {
          userId: user.uid,
          title: newNote.title.trim(),
          content: newNote.content.trim(),
          isCompleted: false,
          createdAt: Date.now(),
        };
        resetForm();
        await addDoc(collection(dbInstance, 'notes'), newNoteData);

        Toast.show('Note added successfully', { type: 'success' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Toast.show(message, { type: 'danger' });
    }
  }

  async function handleDeleteNote(noteId: string) {
    try {
      Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDoc(doc(dbInstance, 'notes', noteId));

            Toast.show('Note deleted successfully', { type: 'success' });
          },
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Toast.show(message, { type: 'danger' });
    }
  }

  function editNote(note: Note) {
    setNewNote({
      id: note.id,
      title: note.title,
      content: note.content,
      isCompleted: note.isCompleted ?? false,
    });
    setIsEditing(true);
    setShowModal(true);
  }

  async function toggleNoteStatus(note: Note) {
    try {
      await updateDoc(doc(dbInstance, 'notes', note.id), {
        isCompleted: !note.isCompleted,
      });

      Toast.show(`Marked as ${note.isCompleted ? 'Pending' : 'Completed'}`, {
        type: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Toast.show(message, { type: 'danger' });
    }
  }

  function resetForm() {
    setNewNote({ id: '', title: '', content: '', isCompleted: false });
    setIsEditing(false);
    setShowModal(false);
  }

  return (
    <View style={notesStyle.container}>
      <View style={notesStyle.headerContainer}>
        <Text style={notesStyle.header}>My Notes </Text>
        <View style={notesStyle.userContainer}>
          <Text onPress={() => navigation.navigate('Profile')}>
            Hii,{'  '}
            <Text style={{ fontWeight: 'bold', color: '#007bff' }}>
              {userData?.name ?? 'User'}
            </Text>
          </Text>
        </View>
      </View>

      {/* Filter Options */}
      <View style={notesStyle.filterContainer}>
        <TouchableOpacity
          style={[
            notesStyle.filterButton,
            filter === 'all' && notesStyle.activeFilter,
          ]}
          onPress={() => {
            setFilter('all');
            setLastVisible(null);
            setEndReached(false);
          }}
        >
          <Text
            style={[
              notesStyle.filterText,
              filter === 'all' && notesStyle.activeFilterText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            notesStyle.filterButton,
            filter === 'completed' && notesStyle.activeFilter,
          ]}
          onPress={() => {
            setFilter('completed');
            setLastVisible(null);
            setEndReached(false);
          }}
        >
          <Text
            style={[
              notesStyle.filterText,
              filter === 'completed' && notesStyle.activeFilterText,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            notesStyle.filterButton,
            filter === 'pending' && notesStyle.activeFilter,
          ]}
          onPress={() => {
            setFilter('pending');
            setLastVisible(null);
            setEndReached(false);
          }}
        >
          <Text
            style={[
              notesStyle.filterText,
              filter === 'pending' && notesStyle.activeFilterText,
            ]}
          >
            Pending
          </Text>
        </TouchableOpacity>
      </View>
      {loading && !lastVisible ? (
        <View style={notesStyle.loaderContainer}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={item => item.id}
          contentContainerStyle={notesStyle.listContent}
          renderItem={({ item }) => (
            <View style={notesStyle.noteCard}>
              <View style={notesStyle.noteHeader}>
                <Text style={notesStyle.noteTitle}>{item.title}</Text>
                <View style={notesStyle.noteActions}>
                  <TouchableOpacity
                    style={notesStyle.statusTag}
                    onPress={() => toggleNoteStatus(item)}
                  >
                    <Text
                      style={[
                        notesStyle.statusText,
                        item.isCompleted
                          ? notesStyle.completedTag
                          : notesStyle.pendingTag,
                      ]}
                    >
                      {item.isCompleted ? 'Completed' : 'Pending'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => editNote(item)}>
                    <Icon
                      name="edit"
                      size={18}
                      color="#007bff"
                      style={notesStyle.actionIcon}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteNote(item.id)}>
                    <Icon
                      name="delete"
                      size={18}
                      color="#ff3b30"
                      style={notesStyle.actionIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={notesStyle.noteContent}>{item.content}</Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (!endReached) setPage(prevPage => prevPage + 1);
          }}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={() => (
            <Text style={notesStyle.emptyText}>No notes found</Text>
          )}
          ListFooterComponent={() =>
            loading && lastVisible && <ActivityIndicator />
          }
        />
      )}

      <TouchableOpacity
        style={notesStyle.locationButton}
        onPress={() => navigation.navigate('Location')}
      >
        <Icon name="location-on" size={30} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={notesStyle.fab}
        onPress={() => {
          resetForm();
          setShowModal(true);
        }}
      >
        <Icon name="add" size={30} color="white" />
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={notesStyle.modalContainer}>
          <View style={notesStyle.modalContent}>
            <Text style={notesStyle.modalTitle}>
              {isEditing ? 'Edit Note' : 'Add Note'}
            </Text>

            <TextInput
              style={notesStyle.input}
              placeholderTextColor={'gray'}
              placeholder="Title"
              value={newNote.title}
              onChangeText={text => setNewNote({ ...newNote, title: text })}
            />
            <TextInput
              style={[notesStyle.input, { height: 100 }]}
              placeholderTextColor={'gray'}
              placeholder="Content"
              multiline
              value={newNote.content}
              onChangeText={text => setNewNote({ ...newNote, content: text })}
            />

            <View style={notesStyle.modalActions}>
              <TouchableOpacity onPress={resetForm}>
                <Text style={notesStyle.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddNote}>
                <Text style={notesStyle.saveText}>
                  {isEditing ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
