import { useContext, useState } from 'react';
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
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import UserContext from '../contexts/user.context';
import { authInstance } from '../config/firebase.config';
interface IInput {
  email: string;
  password: string;
}

interface IInput {
  email: string;
  password: string;
}

const AuthScreen = () => {
  const [input, setInput] = useState<IInput>({ email: '', password: '' });
  const toast = useToast();
  const { setUserData } = useContext(UserContext);

  const handleSignup = async () => {
    try {
      if (!input.email || !input.password) {
        toast.show('Please enter email and password', { type: 'danger' });
        return;
      }

      const userCredential = await authInstance.createUserWithEmailAndPassword(
        input.email,
        input.password,
      );
      const user = userCredential.user;

      // Send email verification
      await user.sendEmailVerification();

      toast.show(
        'A verification email has been sent. Please verify your email before logging in.',
        { type: 'success' },
      );
    } catch (error: any) {
      toast.show(error.message, { type: 'danger' });
    }
  };

  const handleSignIn = async () => {
    try {
      if (!input.email || !input.password) {
        toast.show('Please enter email and password', { type: 'danger' });
        return;
      }

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
        toast.show('Email not verified', { type: 'warning' });
        return;
      }

      setUserData({
        name: currentUser.displayName,
        email: currentUser.email ?? '',
        id: currentUser.uid,
      });

      toast.show('Login successful', { type: 'success' });

      setInput({ email: '', password: '' });
    } catch (error: any) {
      toast.show(error.message, { type: 'danger' });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Text style={styles.title}>Login Form</Text>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={input.email}
            onChangeText={text => setInput({ ...input, email: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={input.password}
            onChangeText={text => setInput({ ...input, password: text })}
          />
          <TouchableOpacity style={styles.button} onPress={handleSignIn}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#3b82f6' }]}
            onPress={handleSignup}
          >
            <Text style={styles.buttonText}>Signup</Text>
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
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  form: {
    width: '95%',
    backgroundColor: '#f3f3f3',
    padding: 16,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 12,
    borderRadius: 4,
  },
  button: {
    backgroundColor: '#16a34a',
    padding: 12,
    marginTop: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
