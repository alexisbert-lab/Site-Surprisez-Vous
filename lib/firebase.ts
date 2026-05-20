import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  // Remplacer par les vraies valeurs depuis la console Firebase
  // https://console.firebase.google.com/project/site-surprisez-vous/settings/general
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'site-surprisez-vous.web.app',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'site-surprisez-vous',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'site-surprisez-vous.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  // Récupérer depuis Firebase console > Paramètres > Vos applications > measurementId (G-XXXXXXXXXX)
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

function getApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getApp());
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    db = getFirestore(getApp());
  }
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getApp());
  }
  return storage;
}

let analyticsInstance: Analytics | null = null;

export async function initAnalytics(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (analyticsInstance) return;
  try {
    const supported = await isSupported();
    if (!supported) return;
    analyticsInstance = getAnalytics(getApp());
  } catch {}
}

export function getProductImageUrl(ref: string): string {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'site-surprisez-vous.firebasestorage.app';
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/products%2F${encodeURIComponent(ref)}.jpg?alt=media`;
}
