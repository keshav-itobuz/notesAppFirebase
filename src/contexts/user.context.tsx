import React, {
  createContext,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authInstance } from '../config/firebase.config';
import { signOut } from '@react-native-firebase/auth';

type UserDataType = {
  id: string;
  name: string | null;
  email: string;
};

type IUserContext = {
  userData: UserDataType | null;
  setUserData: (data: UserDataType | null) => void;
  isInitialCheckingDone: boolean;
  logout: () => void;
};

const UserContext = createContext<IUserContext>({
  userData: null,
  setUserData: () => {},
  isInitialCheckingDone: false,
  logout: () => {},
});

export function UserProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [userData, setUserData] = useState<UserDataType | null>(null);
  const [isInitialCheckingDone, setIsInitialCheckingDone] =
    useState<boolean>(false);

  async function logout() {
    await signOut(authInstance);
    setUserData(null);
  }

  useEffect(() => {
    async function getUserData() {
      try {
        const user = authInstance.currentUser;
        if (user) {
          setUserData({
            id: user.uid,
            name: user.displayName,
            email: user.email ?? '',
          });
        }
      } catch (error) {
        console.log('Error getting user data:', error);
      } finally {
        setIsInitialCheckingDone(true);
      }
    }

    getUserData();
  }, []);

  const value = useMemo(
    () => ({
      userData,
      setUserData,
      isInitialCheckingDone,
      logout,
    }),
    [userData, isInitialCheckingDone],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UserContext;
