import { View, Text, TextInput, Button, Alert, FlatList } from "react-native";
import { locationStyle } from "./locationStyle";
import { useContext, useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, updateDoc } from "@react-native-firebase/firestore";
import { authInstance, dbInstance } from "../../config/firebase.config";
import { Toast } from "react-native-toast-notifications";
import UserContext from "../../contexts/user.context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { TouchableOpacity } from "react-native";

interface ILocation {
    id?: string;
    name: string;
    latitude: string;
    longitude: string;
}
const LocationScreen = () => {
    const { userData } = useContext(UserContext);
    const [location, setLocation] = useState<ILocation>({
        name: '',
        latitude: '',
        longitude: '',
    });
    const [allLocations, setLocations] = useState<ILocation[]>([]);
    const [editing, setEditing] = useState<string | undefined>(undefined);
    const handleLocationSubmit = async () => {
        try {
            if (!location.name || !location.latitude || !location.longitude) {
                Alert.alert('Please fill all the fields');
                return;
            }
            if (editing) {
                await updateDoc(doc(dbInstance, 'locations', editing), { ...location, userId: userData?.id });
                Toast.show('Note updated successfully', { type: 'success' });
            } else {
                await addDoc(collection(dbInstance, 'locations'), { ...location, userId: userData?.id });
                Toast.show('Note added successfully', { type: 'success' });
            }
            setEditing(undefined);
            setLocation({ name: '', latitude: '', longitude: '' });
        } catch (error) {
            console.log(error);
        }
    }
    const handleUpdateLocation = (location: ILocation) => {
        setEditing(location.id);
        setLocation(location);
    }
    // const fetchLocations = async () => {
    //     try {
    //         const querySnapshot = await getDocs(collection(dbInstance, 'locations'));
    //         const locations = querySnapshot.docs.map(doc => ({
    //             id: doc.id,
    //             name: doc.data().name,
    //             latitude: doc.data().latitude,
    //             longitude: doc.data().longitude,
    //         }));
    //         console.log(locations);
    //         setLocations(locations);
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }

    useEffect(() => {
        // fetchLocations();
        const locationsRef = collection(dbInstance, 'locations');
        const q = query(locationsRef);
        const unsubscribe = onSnapshot(q, snapshot => {
            try {
                console.log("Hell0", snapshot.docs);
                const locations = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name,
                    latitude: doc.data().latitude,
                    longitude: doc.data().longitude,
                }));
                console.log(locations);
                setLocations(locations);
            } catch (error) {
                console.log(error);
            }
        });
        return () => unsubscribe();
    }, [userData]);

    return (
        <View style={locationStyle.mainContainer}>
            <View style={locationStyle.locationFormContainer}>
                <TextInput style={locationStyle.input} placeholder="Enter Location" value={location.name} onChangeText={text => setLocation({ ...location, name: text })} />
                <View style={locationStyle.latLongContainer}>
                    <TextInput style={locationStyle.input} placeholder="Enter Latitude" value={location.latitude} onChangeText={text => setLocation({ ...location, latitude: text })} />
                    <TextInput style={locationStyle.input} placeholder="Enter Longitude" value={location.longitude} onChangeText={text => setLocation({ ...location, longitude: text })} />
                </View>
                <Button title="Submit" onPress={handleLocationSubmit} />
            </View>
            <Text>List of Locations: </Text>
            <FlatList data={allLocations} renderItem={({ item }) => (
                <LocationRow
                    location={item}
                    setLocation={setLocation}
                    handleUpdateLocation={() => handleUpdateLocation(item)}
                    editing={editing}
                    setEditing={setEditing}
                />)} />
        </View>
    )
}

export default LocationScreen;

// ----------------------------------------------------------------------------------------
interface ILocationRowProps {
    location: ILocation;
    setLocation: (location: ILocation) => void;
    handleUpdateLocation: () => void;
    editing: string | undefined;
    setEditing: (editing: string | undefined) => void;
}
const LocationRow = ({ location, handleUpdateLocation, editing, setEditing, setLocation }: ILocationRowProps) => {
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
        }
    }
    const handleUpdateCancel = () => {
        setEditing(undefined);
        setLocation({ name: '', latitude: '', longitude: '', id: '' });
    }
    return (
        <View style={locationStyle.locationRowContainer}>
            <View style={locationStyle.locationData}>
                <Text>Location: {location.name}</Text>
                <Text>Latitude: {location.latitude}</Text>
                <Text>Longitude: {location.longitude}</Text>
            </View>
            <View style={locationStyle.locationActions}>
                {(editing && editing === location.id) ?
                    <TouchableOpacity onPress={handleUpdateCancel}> <Text> <Icon name="cancel" size={20} color="blue" /> </Text></TouchableOpacity>
                    : <TouchableOpacity onPress={handleUpdateLocation}> <Text> <Icon name="edit" size={20} color="green" /> </Text></TouchableOpacity>
                }
                <TouchableOpacity onPress={() => handleDeleteLocation(location.id)}> <Text><Icon name="delete" size={20} color="red" /></Text></TouchableOpacity>
            </View>
        </View>
    )
}
