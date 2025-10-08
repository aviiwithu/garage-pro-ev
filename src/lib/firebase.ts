
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// This configuration is now dynamically set to your specific Firebase project.
export const firebaseConfig = {
  apiKey: "AIzaSyD-jwbgrwFY90mEerPv_iygHe463WDr7xE",
  authDomain: "garage-pro-ev.firebaseapp.com",
  databaseURL: "https://garage-pro-ev-default-rtdb.firebaseio.com",
  projectId: "garage-pro-ev",
  storageBucket: "garage-pro-ev.firebasestorage.app",
  messagingSenderId: "739086227133",
  appId: "1:739086227133:web:aebba5fd3a9ae3e16349d4",
  measurementId: "G-FBB71DWK60"
};

// Singleton pattern to initialize and export Firebase services.
// This ensures that Firebase is initialized only once.
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);


export { app, auth, db, storage };


