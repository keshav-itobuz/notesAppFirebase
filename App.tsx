import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppProvider from './src/appProvider';
import { StatusBar } from 'react-native';
import RootNavigation from './src/navigation/rootNavigation';
import useNoteSyncOnReconnect from './src/storage/DataSync';

function App(): React.JSX.Element {
  useNoteSyncOnReconnect();
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={'dark-content'} />
      <AppProvider>
        <RootNavigation />
      </AppProvider>
    </SafeAreaProvider>
  );
}

export default App;
