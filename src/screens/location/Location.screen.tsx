import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { locationStyle } from './locationStyle';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  endAt,
  onSnapshot,
  orderBy,
  query,
  startAt,
  updateDoc,
} from '@react-native-firebase/firestore';
import { dbInstance } from '../../config/firebase.config';
import { Toast } from 'react-native-toast-notifications';
import UserContext from '../../contexts/user.context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  distanceBetween,
  geohashForLocation,
  geohashQueryBounds,
} from 'geofire-common';

interface ILocation {
  id?: string;
  name: string;
  latitude: string;
  longitude: string;
  geohash?: string;
  userId?: string;
}

interface ILocationRowProps {
  location: ILocation;
  handleUpdateLocation: () => void;
  editing: string | undefined;
  setEditing: (editing: string | undefined) => void;
  setLocation: (location: ILocation) => void;
}

const LocationRow = ({
  location,
  handleUpdateLocation,
  editing,
  setEditing,
  setLocation,
}: ILocationRowProps) => {
  const handleDeleteLocation = async (id?: string) => {
    try {
      if (id) {
        await deleteDoc(doc(dbInstance, 'locations', id));
        Toast.show('Location deleted successfully', { type: 'success' });
      } else {
        Toast.show('Location not found', { type: 'danger' });
      }
    } catch (error) {
      console.log(error);
      Toast.show('Error deleting location', { type: 'danger' });
    }
  };

  const handleUpdateCancel = () => {
    setEditing(undefined);
    setLocation({ name: '', latitude: '', longitude: '', id: '' });
  };

  return (
    <View style={locationStyle.locationRowContainer}>
      <View style={locationStyle.locationData}>
        <Text>Location: {location.name}</Text>
        <Text>Latitude: {location.latitude}</Text>
        <Text>Longitude: {location.longitude}</Text>
      </View>
      <View style={locationStyle.locationActions}>
        {editing && editing === location.id ? (
          <TouchableOpacity onPress={handleUpdateCancel}>
            <Icon name="cancel" size={20} color="blue" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleUpdateLocation}>
            <Icon name="edit" size={20} color="green" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => handleDeleteLocation(location.id)}>
          <Icon name="delete" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const LocationScreen = () => {
  const { userData } = useContext(UserContext);
  const [location, setLocation] = useState<ILocation>({
    name: '',
    latitude: '',
    longitude: '',
  });
  const [allLocations, setLocations] = useState<ILocation[]>([]);
  const [editing, setEditing] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [center, setCenter] = useState<[number, number]>([22.57756, 88.43159]);

  const handleLocationSubmit = async () => {
    try {
      if (!location.name || !location.latitude || !location.longitude) {
        Alert.alert('Please fill all the fields');
        return;
      }

      const lat = parseFloat(location.latitude);
      const lng = parseFloat(location.longitude);

      if (isNaN(lat) || isNaN(lng)) {
        Alert.alert('Invalid coordinates');
        return;
      }

      const geohash = geohashForLocation([lat, lng]).substring(0, 9);

      const locationWithGeohash = {
        ...location,
        userId: userData?.id,
        geohash,
      };

      if (editing) {
        await updateDoc(
          doc(dbInstance, 'locations', editing),
          locationWithGeohash,
        );
        Toast.show('Location updated successfully', { type: 'success' });
      } else {
        await addDoc(collection(dbInstance, 'locations'), locationWithGeohash);
        Toast.show('Location added successfully', { type: 'success' });
      }

      setEditing(undefined);
      setLocation({ name: '', latitude: '', longitude: '' });
    } catch (error) {
      console.error('Error saving location:', error);
      Toast.show('Error saving location', { type: 'danger' });
    }
  };

  const handleUpdateLocation = (location: ILocation) => {
    setEditing(location.id);
    setLocation({
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  useEffect(() => {
    const unsubscribeListeners: (() => void)[] = [];

    const fetchNearbyLocationsRealtime = async () => {
      setLoading(true);
      try {
        const radiusInM = 7000;
        const bounds = geohashQueryBounds(center, radiusInM);

        const allResultsMap = new Map<string, ILocation>();

        bounds.forEach(b => {
          const q = query(
            collection(dbInstance, 'locations'),
            orderBy('geohash'),
            startAt(b[0]),
            endAt(b[1]),
          );

          const unsubscribe = onSnapshot(q, snapshot => {
            snapshot.docChanges().forEach(change => {
              const docData = change.doc.data();
              const docId = change.doc.id;

              if (
                !docData.name ||
                !docData.latitude ||
                !docData.longitude ||
                !docData.geohash
              )
                return;

              const lat = parseFloat(docData.latitude);
              const lng = parseFloat(docData.longitude);
              if (isNaN(lat) || isNaN(lng)) return;

              const distance = distanceBetween([lat, lng], center);
              if (distance > radiusInM / 1000) return;

              const locationItem: ILocation = {
                id: docId,
                name: docData.name,
                latitude: docData.latitude,
                longitude: docData.longitude,
                geohash: docData.geohash,
              };

              if (change.type === 'added' || change.type === 'modified') {
                allResultsMap.set(docId, locationItem);
              } else if (change.type === 'removed') {
                allResultsMap.delete(docId);
              }
            });

            // Convert Map to Array and update state
            setLocations(Array.from(allResultsMap.values()));
          });

          unsubscribeListeners.push(unsubscribe);
        });
      } catch (error) {
        console.error('Realtime fetch error:', error);
        Toast.show('Error fetching locations', { type: 'danger' });
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyLocationsRealtime();

    return () => {
      unsubscribeListeners.forEach(unsub => unsub());
    };
  }, [userData, editing, center]);

  return (
    <View style={locationStyle.mainContainer}>
      <View style={locationStyle.locationFormContainer}>
        <TextInput
          style={locationStyle.input}
          placeholder="Enter Location"
          value={location.name}
          onChangeText={text => setLocation({ ...location, name: text })}
        />
        <View style={locationStyle.latLongContainer}>
          <TextInput
            style={locationStyle.input}
            placeholder="Enter Latitude"
            value={location.latitude}
            onChangeText={text => setLocation({ ...location, latitude: text })}
            keyboardType="numeric"
          />
          <TextInput
            style={locationStyle.input}
            placeholder="Enter Longitude"
            value={location.longitude}
            onChangeText={text => setLocation({ ...location, longitude: text })}
            keyboardType="numeric"
          />
        </View>
        <Button title="Submit" onPress={handleLocationSubmit} />
      </View>
      <Text>List of Locations: </Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={allLocations}
          renderItem={({ item }) => (
            <LocationRow
              location={item}
              handleUpdateLocation={() => handleUpdateLocation(item)}
              editing={editing}
              setEditing={setEditing}
              setLocation={setLocation}
            />
          )}
          ListEmptyComponent={<Text>No locations found</Text>}
        />
      )}
    </View>
  );
};

export default LocationScreen;
