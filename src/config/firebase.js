// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC3AtJ4L3oVQDVkc767vSfanyfdZKD06Xw",
  authDomain: "retirewise-portfolio.firebaseapp.com",
  projectId: "retirewise-portfolio",
  storageBucket: "retirewise-portfolio.firebasestorage.app",
  messagingSenderId: "796975788476",
  appId: "1:796975788476:web:cff447d98ec65b83c7fbb9",
  measurementId: "G-S6BY0H4XD9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

console.log('🔥 Firebase initialized');