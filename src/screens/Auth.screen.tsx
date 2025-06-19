import { useContext, useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import UserContext from '../contexts/user.context';
import { authInstance } from '../config/firebase.config';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

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
        name: user.displayName || '',
        email: user.email || '',
        id: user.uid,
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
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        id: currentUser.uid,
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
        style={styles.container}
      >
        <Text style={styles.title}>{isSignup ? 'Sign Up' : 'Login'}</Text>
        <View style={styles.form}>
          {isSignup && (
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={input.name}
              onChangeText={text => setInput({ ...input, name: text })}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={input.email}
            onChangeText={text => setInput({ ...input, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={input.password}
            onChangeText={text => setInput({ ...input, password: text })}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={isSignup ? handleSignup : handleSignIn}
            disabled={isEmailLoading}
          >
            {isEmailLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignup ? 'Sign Up' : 'Login'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#757575" />
            ) : (
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsSignup(!isSignup)}
            style={styles.switchButton}
          >
            <Text style={styles.switchButtonText}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#f8f9fa',
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    marginBottom: 16,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#4a6da7',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    height: 50,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 8,
    height: 50,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    color: '#757575',
    fontWeight: '600',
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    width: 50,
    textAlign: 'center',
    color: '#757575',
    fontSize: 14,
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#4a6da7',
    fontWeight: '500',
    fontSize: 14,
  },
});
