import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBi-AFrEwqmzu8IndEHaSxrltYidXQhXOk",
  authDomain: "carbonshift-13198.firebaseapp.com",
  projectId: "carbonshift-13198",
  storageBucket: "carbonshift-13198.firebasestorage.app",
  messagingSenderId: "739376193278",
  appId: "1:739376193278:web:2e3159bab508223ec80faf"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;
if (getApps().length > 0) {
  try {
    auth = getAuth(app);
  } catch (e) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export { auth };
export const db = getFirestore(app);
export default app;
