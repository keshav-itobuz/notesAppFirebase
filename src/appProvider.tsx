import React from 'react';
import { ToastProvider } from 'react-native-toast-notifications';
import { UserProvider } from './contexts/user.context';

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider
      placement="bottom"
      offsetTop={70}
      duration={4000}
      swipeEnabled={true}
      animationType="slide-in"
      animationDuration={150}
    >
      <UserProvider>{children}</UserProvider>
    </ToastProvider>
  );
}
