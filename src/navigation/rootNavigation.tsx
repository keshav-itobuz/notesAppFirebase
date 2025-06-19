import React, { useContext } from 'react';
import { RootStackParamList } from '../types/navigator.type';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthScreen from '../screens/Auth.screen';
import UserContext from '../contexts/user.context';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import NotesScreen from '../screens/notes/Notes.screen';
const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigation() {
  const { userData, isInitialCheckingDone } = useContext(UserContext);

  if (!isInitialCheckingDone) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootStack.Navigator>
          {userData ? (
            <RootStack.Screen
              name="Notes"
              component={NotesScreen}
              options={{
                headerShown: false,
              }}
            />
          ) : (
            <RootStack.Screen
              name="Auth"
              component={AuthScreen}
              options={{
                headerShown: false,
              }}
            />
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
