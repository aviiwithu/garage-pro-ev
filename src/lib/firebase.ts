
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// This configuration is now dynamically set to your specific Firebase project.
export const firebaseConfig = {
  "projectId": "garagepro-ev1-13913808-ab2e6",
  "appId": "1:182809514840:web:9c500a175a9ed1d4210b2d",
  "storageBucket": "garagepro-ev1-13913808-ab2e6.appspot.com",
  "apiKey": "AIzaSyAJhpoxyRHA5yvXUcEXwYUBL3Mdl8bgxbA",
  "authDomain": "garagepro-ev1-13913808-ab2e6.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "182809514840"
};

// Singleton pattern to initialize and export Firebase services.
// This ensures that Firebase is initialized only once.
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);


export { app, auth, db, storage };


