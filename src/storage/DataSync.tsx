import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncNotes } from './offlineStorage';
import { authInstance } from '../config/firebase.config';

const useNoteSyncOnReconnect = () => {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async state => {
      const connected = state.isConnected ?? false;

      if (connected && authInstance.currentUser) {
        console.log('Syncing notes...');
        await syncNotes();
      }
    });

    return () => unsubscribe();
  }, []);
};

export default useNoteSyncOnReconnect;
