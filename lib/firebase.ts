import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAX_a8h30rKyHzJgKOqdvxBgfPM604nzFM",
  authDomain: "gpfinancas-d3bb2.firebaseapp.com",
  projectId: "gpfinancas-d3bb2",
  storageBucket: "gpfinancas-d3bb2.firebasestorage.app",
  messagingSenderId: "995878068096",
  appId: "1:995878068096:web:1dd1fb87545ec8d750eb65",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db   = getFirestore(app);
