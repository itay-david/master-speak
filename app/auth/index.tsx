import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { initializeApp } from '@firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, User, sendPasswordResetEmail, GoogleAuthProvider, signInWithCredential, updateProfile } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { firebaseConfig, googleSignInConfig } from '../auth/firebaseConfig';
import { useAuth } from '../../constants/AuthContext';
import { Link, Redirect, useNavigation } from "expo-router";


WebBrowser.maybeCompleteAuthSession();

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const user = AsyncStorage.getItem('user');

const Auth: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(googleSignInConfig);


  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 1000,
    useNativeDriver: true,
  }).start();

  useEffect(() => {
    const loadUser = async () => {
      const savedUser = await AsyncStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    };

    loadUser();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        AsyncStorage.setItem('user', JSON.stringify(user));
      } else {
        AsyncStorage.removeItem('user');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).catch(error => {
        console.error("Error signing in with Google credential:", error);
        setErrorMessage(error.message);
      });
    }
  }, [response]);

  const handleEmailPasswordAuth = async () => {
    setIsLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username });
      }
      setErrorMessage('');
    } catch (error: any) {
      handleFirebaseError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await promptAsync();
      setErrorMessage('');
    } catch (error: any) {
      console.error(error);
      setErrorMessage('An error occurred during Google sign-in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error(error);
      setErrorMessage('An error occurred during sign-out');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address');
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Password Reset', 'Password reset email sent!');
    } catch (error: any) {
      handleFirebaseError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirebaseError = (error: any) => {
    const errorCode = error.code;
    let message = 'An error occurred.';

    switch (errorCode) {
      case 'auth/invalid-email':
        message = 'The email address is badly formatted.';
        break;
      case 'auth/user-not-found':
        message = 'There is no user corresponding to the email address.';
        break;
      case 'auth/wrong-password':
        message = 'The password is invalid or the user does not have a password.';
        break;
      case 'auth/email-already-in-use':
        message = 'The email address is already in use by another account.';
        break;
      case 'auth/weak-password':
        message = 'The password is too weak. Please use a stronger password.';
        break;
      default:
        message = error.message;
    }

    setErrorMessage(message);
    console.error('Firebase error:', message);
  };

  const { isLoggedIn } = useAuth();
  
  const navigation = useNavigation();

  if (user) {
    return (
      <View>
        {isLoggedIn ?
          <Redirect href={'/learn'} />
          : <Auth />}
      </View>

    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Animated.View style={[styles.authContainer, { opacity: fadeAnim }]}>
          <Text style={styles.title}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
          
          {!isLogin && (
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              autoCapitalize="none"
            />
          )}
          
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
          />
          
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          
          <TouchableOpacity style={styles.button} onPress={handleEmailPasswordAuth} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} disabled={isLoading || !request}>
            {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Sign In with Google</Text>}
          </TouchableOpacity>
          
          {isLogin && (
            <TouchableOpacity onPress={handlePasswordReset}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.toggleText}>
              {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  authContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignSelf: 'center',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 55,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  googleButton: {
    backgroundColor: '#db3236',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleText: {
    color: '#3498db',
    textAlign: 'center',
    marginTop: 25,
    fontSize: 16,
  },
  forgotPasswordText: {
    color: '#3498db',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'left',
    marginBottom: 15,
    fontSize: 14,
  },
});

export default Auth;