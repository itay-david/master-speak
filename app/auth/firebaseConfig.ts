import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, update, DatabaseReference, get } from 'firebase/database';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const firebaseConfig = {
  apiKey: "AIzaSyA3tfDiusb-Z2aZgUfBzjMhcbj0U2Mi6fw",
  authDomain: "speak-master.firebaseapp.com",
  projectId: "speak-master",
  storageBucket: "speak-master.appspot.com",
  messagingSenderId: "1005726874717",
  appId: "1:1005726874717:web:076740f00eebc837c061b4",
  measurementId: "G-1PNHRTEN6H",
  databaseURL: "https://speak-master-default-rtdb.firebaseio.com/"
};

export const googleSignInConfig = {
  webClientId: '1005726874717-onelgi74eue4fv0bd9c0kkv4ttcle3sc.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID',
  androidClientId: '1005726874717-tim81mjbjf3hql6q559nte6a76kbg41p.apps.googleusercontent.com',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firebase Database
const database = getDatabase(app);

export { auth, database, ref, onValue, update, get };

export function getLessonRef(language: string, level: string, lessonKey: string): DatabaseReference {
  return ref(database, `languages/${language}/levels/${level}`);
}

export function getLessonDataRef(language: string, level: string, lessonKey: string): DatabaseReference {
  return ref(database, `languages/${language}/levels/${level}/classes/${lessonKey}/lessons`);
}

export function getUserProgressRef(userId: string): DatabaseReference {
  return ref(database, `userProgress/${userId}`);
}

export function updateUserProgress(userId: string, language: string, level: string, lessonKey: string, completed: boolean) {
  const progressRef = ref(database, `userProgress/${userId}/${language}/${level}/${lessonKey}`);
  return update(progressRef, { completed });
}
