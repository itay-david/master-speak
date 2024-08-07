// firebaseConfig.ts

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, update, DatabaseReference } from 'firebase/database';

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
  androidClientId: 'YOUR_ANDROID_CLIENT_ID',
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, onValue, update };

export function getLessonRef(language: string, level: string): DatabaseReference {
  return ref(database, `languages/${language}/levels/${level}`);
}

export function updateLessonCompletion(language: string, level: string, lessonKey: string, completed: boolean) {
  const lessonRef = ref(database, `languages/${language}/levels/${level}/classes/${lessonKey}`);
  return update(lessonRef, { completed });
}