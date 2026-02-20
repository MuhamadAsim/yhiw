import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCUZB9iUg8tSGiV-bZOV_Mhzwv9yiALQR0",
  authDomain: "yhiw-39264.firebaseapp.com",
  projectId: "yhiw-39264",
  storageBucket: "yhiw-39264.firebasestorage.app",
  messagingSenderId: "836223387874",
  appId: "1:836223387874:web:e4ef1ed7b7ce784d7276bb",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
