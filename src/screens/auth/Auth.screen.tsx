import { useContext, useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import UserContext from '../../contexts/user.context';
import { authInstance } from '../../config/firebase.config';
import { AuthStyles } from './AuthStyle';

interface IInput {
  name: string;
  email: string;
  password: string;
}

const AuthScreen = () => {
  const [input, setInput] = useState<IInput>({
    name: '',
    email: '',
    password: '',
  });
  const [isSignup, setIsSignup] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const toast = useToast();
  const { setUserData } = useContext(UserContext);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '203808358861-9vfasgf1q1ccrja6ni816l224i9vglgn.apps.googleusercontent.com',
    });
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const idToken = (await GoogleSignin.signIn()).data?.idToken;

      if (!idToken) {
        throw new Error('Google sign-in failed');
      }

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      const userCredential = await authInstance.signInWithCredential(
        googleCredential,
      );
      const user = userCredential.user;

      setUserData({
        name: user.displayName ?? '',
        email: user.email ?? '',
        id: user.uid,
        photoURL: user.photoURL ?? null,
      });

      toast.show('Signed in with Google successfully', { type: 'success' });
    } catch (error: any) {
      toast.show(error.message, { type: 'danger' });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSignup = async () => {
    try {
      if (!input.email || !input.password || !input.name) {
        toast.show('Please fill all fields', { type: 'danger' });
        return;
      }

      setIsEmailLoading(true);
      const userCredential = await authInstance.createUserWithEmailAndPassword(
        input.email,
        input.password,
      );
      const user = userCredential.user;

      await user.updateProfile({
        displayName: input.name,
      });

      await user.sendEmailVerification();

      toast.show(
        'Verification email sent. Please verify your email before logging in.',
        { type: 'success' },
      );

      setInput({ email: '', password: '', name: '' });
      setIsSignup(false);
    } catch (error: any) {
      toast.show(error.message, { type: 'danger' });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      if (!input.email || !input.password) {
        toast.show('Please enter email and password', { type: 'danger' });
        return;
      }

      setIsEmailLoading(true);
      await authInstance.signInWithEmailAndPassword(
        input.email,
        input.password,
      );
      const currentUser = authInstance.currentUser;

      if (!currentUser) {
        toast.show('User not found', { type: 'danger' });
        return;
      }

      if (!currentUser.emailVerified) {
        toast.show('Please verify your email first', { type: 'warning' });
        return;
      }

      setUserData({
        name: currentUser.displayName ?? '',
        email: currentUser.email ?? '',
        id: currentUser.uid,
        photoURL: currentUser.photoURL ?? null,
      });

      toast.show('Login successful', { type: 'success' });
      setInput({ email: '', password: '', name: '' });
    } catch (error: any) {
      toast.show(error.message, { type: 'danger' });
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={AuthStyles.container}
      >
        <Text style={AuthStyles.title}>{isSignup ? 'Sign Up' : 'Login'}</Text>
        <View style={AuthStyles.form}>
          {isSignup && (
            <TextInput
              style={AuthStyles.input}
              placeholderTextColor={'gray'}
              placeholder="Name"
              value={input.name}
              onChangeText={text => setInput({ ...input, name: text })}
            />
          )}
          <TextInput
            style={AuthStyles.input}
            placeholderTextColor={'gray'}
            placeholder="Email"
            value={input.email}
            onChangeText={text => setInput({ ...input, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={AuthStyles.input}
            placeholderTextColor={'gray'}
            placeholder="Password"
            secureTextEntry
            value={input.password}
            onChangeText={text => setInput({ ...input, password: text })}
          />

          <TouchableOpacity
            style={AuthStyles.button}
            onPress={isSignup ? handleSignup : handleSignIn}
            disabled={isEmailLoading}
          >
            {isEmailLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={AuthStyles.buttonText}>
                {isSignup ? 'Sign Up' : 'Login'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={AuthStyles.dividerContainer}>
            <View style={AuthStyles.dividerLine} />
            <Text style={AuthStyles.dividerText}>OR</Text>
            <View style={AuthStyles.dividerLine} />
          </View>

          <TouchableOpacity
            style={AuthStyles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#757575" />
            ) : (
              <Text style={AuthStyles.googleButtonText}>
                Continue with Google
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsSignup(!isSignup)}
            style={AuthStyles.switchButton}
          >
            <Text style={AuthStyles.switchButtonText}>
              {isSignup
                ? 'Already have an account? Login'
                : 'Need an account? Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default AuthScreen;
