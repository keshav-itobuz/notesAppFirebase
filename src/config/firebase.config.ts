import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const authInstance = auth();
export const dbInstance = firestore();
