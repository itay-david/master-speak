// authUtils.ts

import { auth } from '../app/auth';  // Adjust the import path as needed
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const handleEmailPasswordSignIn = async (email: string, password: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    throw error;
  }
};

export const handleEmailPasswordSignUp = async (email: string, password: string) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    throw error;
  }
};

export const handleSignOut = async () => {
  try {
    await signOut(auth);
    await AsyncStorage.removeItem('user');
    console.log("Logged Out")
  } catch (error: any) {
    throw error;
  }
};

export const handlePasswordReset = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw error;
  }
};

export const handleFirebaseError = (error: any) => {
  const errorCode = error.code;
  let message = 'An error occurred.';

  switch (errorCode) {
    case 'auth/invalid-email':
      message = 'The email address is badly formatted.';
      break;
    case 'auth/user-not-found':
      message = 'There is no user corresponding to the email address.';
      break;
    // ... other cases ...
    default:
      message = error.message;
  }

  return message;
};