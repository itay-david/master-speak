import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyA3tfDiusb-Z2aZgUfBzjMhcbj0U2Mi6fw",
  authDomain: "speak-master.firebaseapp.com",
  projectId: "speak-master",
  storageBucket: "speak-master.appspot.com",
  messagingSenderId: "1005726874717",
  appId: "1:1005726874717:web:076740f00eebc837c061b4",
  measurementId: "G-1PNHRTEN6H"
};

export const googleSignInConfig = {
  webClientId: '1005726874717-onelgi74eue4fv0bd9c0kkv4ttcle3sc.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID',
};


const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database };