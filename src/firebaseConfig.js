// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDLk_EFvaH3sY69dH6BwUo4ypdHk_OeCJI',
  authDomain: 'qpunch-88a40.firebaseapp.com',
  databaseURL: 'https://qpunch-88a40-default-rtdb.firebaseio.com',
  projectId: 'qpunch-88a40',
  storageBucket: 'qpunch-88a40.firebasestorage.app',
  messagingSenderId: '955337406238',
  appId: '1:955337406238:web:b4c3ad754268326ae2fb0f',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, firebaseConfig, app };
