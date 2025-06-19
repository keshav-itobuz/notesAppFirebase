import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

export const authInstance = auth();
export const dbInstance = firestore();
export const fbStorage = storage();
