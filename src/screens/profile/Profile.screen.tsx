import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import UserContext from '../../contexts/user.context';
import { launchImageLibrary } from 'react-native-image-picker';
import { authInstance, fbStorage } from '../../config/firebase.config';
import { ProfileStyles } from './ProfileStyle';
import { useToast } from 'react-native-toast-notifications';

export default function ProfileScreen() {
  const { userData, setUserData, logout } = useContext(UserContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(userData?.name ?? '');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset changes when canceling edit
      setEditedName(userData?.name ?? '');
      setLocalImageUri(null);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const user = authInstance.currentUser;

      if (!user) throw new Error('User not logged in');

      let imageUrl = userData?.photoURL ?? null;

      // Only upload image if a new one was selected
      if (localImageUri) {
        imageUrl = await uploadImage(localImageUri);
      }

      // Update profile
      await user.updateProfile({
        displayName: editedName,
        photoURL: imageUrl ?? user.photoURL,
      });

      setUserData({
        ...userData,
        id: user.uid,
        email: user.email!,
        name: editedName,
        photoURL: imageUrl ?? user.photoURL,
      });

      setLocalImageUri(null);

      toast.show('Profile updated successfully', { type: 'success' });
      setIsEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.show(message, { type: 'danger' });
    } finally {
      setIsLoading(false);
    }
  };

  const selectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage ?? 'Failed to select image');
        return;
      }

      const uri = result.assets?.[0]?.uri;
      if (!uri) return;

      // Store the local URI but don't upload yet
      setLocalImageUri(uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
      console.error(error);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const user = authInstance.currentUser;
      if (!user) throw new Error('User not logged in');

      const storageRef = fbStorage.ref(`profilePictures/${user.uid}`);

      // Convert file to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload the file
      await storageRef.put(blob);

      // Get download URL
      return await storageRef.getDownloadURL();
    } catch (error) {
      throw error; // Rethrow to handle in calling function
    }
  };

  // Determine which image to display
  const displayImage = localImageUri ?? userData?.photoURL;

  return (
    <View style={ProfileStyles.container}>
      <View style={ProfileStyles.profileHeader}>
        <TouchableOpacity onPress={selectImage} disabled={!isEditing}>
          <View style={ProfileStyles.profileImageContainer}>
            {displayImage ? (
              <Image
                source={{ uri: displayImage }}
                style={ProfileStyles.profileImage}
              />
            ) : (
              <Icon name="account-circle" size={100} color="#ccc" />
            )}
            {isEditing && (
              <View style={ProfileStyles.editIcon}>
                <Icon name="edit" size={20} color="#fff" />
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={ProfileStyles.editButton}>
          <TouchableOpacity onPress={handleEditToggle} disabled={isLoading}>
            <Icon
              name={isEditing ? 'close' : 'edit'}
              size={24}
              color="#007bff"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={ProfileStyles.profileInfo}>
        <View style={ProfileStyles.infoRow}>
          <Text style={ProfileStyles.label}>Name:</Text>
          {isEditing ? (
            <TextInput
              style={ProfileStyles.input}
              placeholderTextColor={'gray'}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Enter your name"
            />
          ) : (
            <Text style={ProfileStyles.value}>
              {userData?.name ?? 'Not set'}
            </Text>
          )}
        </View>

        <View style={ProfileStyles.infoRow}>
          <Text style={ProfileStyles.label}>Email:</Text>
          <Text style={ProfileStyles.value}>
            {userData?.email ?? 'Not set'}
          </Text>
        </View>
      </View>

      {isEditing && (
        <TouchableOpacity
          style={ProfileStyles.saveButton}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={ProfileStyles.ButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={ProfileStyles.logoutButton}
        onPress={logout}
        disabled={isLoading}
      >
        <Text style={ProfileStyles.ButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
