import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import auth from '@react-native-firebase/auth';
interface IInput {
  email: string;
  password: string;
}

interface IInput {
  email: string;
  password: string;
}

const App = () => {
  const [input, setInput] = useState<IInput>({ email: "", password: "" });

  const handleSignup = async () => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        input.email,
        input.password
      );
      const user = userCredential.user;

      // Send email verification
      await user.sendEmailVerification();

      Alert.alert(
        "Signup successful",
        "A verification email has been sent. Please verify your email before logging in."
      );
      console.log('User UID:', userCredential.user.uid);
    } catch (error: any) {
      Alert.alert("Signup error", error.message);
    }
  };


  const handleSignIn = async () => {
    try {
      const userCred = await auth().signInWithEmailAndPassword(input.email, input.password);
      if (!userCred.user.emailVerified) {
        Alert.alert("Email not verified", "Please verify your email before signing in.");
        return;
      }
      const accessToken = await userCred.user.getIdToken();

      // You can save token to local storage or send it to backend
      console.log("Access Token:", accessToken);

      setInput({ email: "", password: "" });
    } catch (error: any) {
      Alert.alert("Login error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Form</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={input.email}
          onChangeText={(text) => setInput({ ...input, email: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={input.password}
          onChangeText={(text) => setInput({ ...input, password: text })}
        />
        <TouchableOpacity style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: "#3b82f6" }]} onPress={handleSignup}>
          <Text style={styles.buttonText}>Signup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20
  },
  form: {
    width: '80%',
    backgroundColor: '#f3f3f3',
    padding: 16,
    borderRadius: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 12,
    borderRadius: 4
  },
  button: {
    backgroundColor: '#16a34a',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});
