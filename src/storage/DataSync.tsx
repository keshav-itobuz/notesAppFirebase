import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncNotes } from './offlineStorage';
import { authInstance } from '../config/firebase.config';

const useNoteSyncOnReconnect = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;

      if (connected && authInstance.currentUser) {
        // Debounce to prevent multiple quick triggers
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          console.log('🔁 Syncing after stable reconnect');
          syncNotes();
        }, 1500);
      }
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
};

export default useNoteSyncOnReconnect;
