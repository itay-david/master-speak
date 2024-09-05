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

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await AsyncStorage.setItem('user', JSON.stringify(user));
      } else {
        setUser(null);
        await AsyncStorage.removeItem('user');
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
      await AsyncStorage.removeItem('user');
    } catch (error: any) {
      console.error(error);
      setErrorMessage('An error occurred during sign-out');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setErrorMessage('הכנס את כתובת האימייל');
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('שינוי סיסמה', 'האמייל לשינוי הסיסמה נשלח!');
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
          <Text style={styles.title}>{isLogin ? 'התחבר למשתמש' : 'צור משתמש'}</Text>
          
          {!isLogin && (
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="שם משתמש"
              autoCapitalize="none"
            />
          )}
          
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="אימייל"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="סיסמה"
            secureTextEntry
          />
          
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          
          <TouchableOpacity style={styles.button} onPress={handleEmailPasswordAuth} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>{isLogin ? 'התחבר' : 'הירשם'}</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} disabled={isLoading || !request}>
            {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>התחבר באמצעות גוגל</Text>}
          </TouchableOpacity>
          
          {isLogin && (
            <TouchableOpacity onPress={handlePasswordReset}>
              <Text style={styles.forgotPasswordText}>שכחת סיסמה?</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.toggleText}>
              {isLogin ? 'עוד אין לך משתמש? צור!' : 'יש לך משתמש? התחבר!'}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginVertical: 10,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#0066cc',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#db4437',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordText: {
    color: '#0066cc',
    marginTop: 15,
    textAlign: 'center',
  },
  toggleText: {
    color: '#0066cc',
    marginTop: 20,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff0000',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default Auth;
