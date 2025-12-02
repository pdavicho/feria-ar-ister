// src/firebase-config.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyARKuUO1RqUPym4mSpaM6J3HZAM8tc_f9g",
  authDomain: "ar-web-942c1.firebaseapp.com",
  projectId: "ar-web-942c1",
  storageBucket: "ar-web-942c1.firebasestorage.app",
  messagingSenderId: "305063386038",
  appId: "1:305063386038:web:edef9c5e2ff1f9aca13f17"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);