import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  // Remplacer par les vraies valeurs depuis la console Firebase
  // https://console.firebase.google.com/project/site-surprisez-vous/settings/general
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'site-surprisez-vous.web.app',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'site-surprisez-vous',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || `https://site-surprisez-vous-default-rtdb.firebaseio.com`,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'site-surprisez-vous.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  // Récupérer depuis Firebase console > Paramètres > Vos applications > measurementId (G-XXXXXXXXXX)
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Hôte de l'émulateur Firebase (défini par la config E2E / dev local).
// Sa présence force toutes les connexions vers l'émulateur — jamais la prod facturée.
const EMULATOR_HOST = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST;
const FIRESTORE_EMULATOR_PORT = Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT) || 8080;
const AUTH_EMULATOR_PORT = Number(process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT) || 9099;

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let rtdb: Database | undefined;

function getApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getApp());
    if (EMULATOR_HOST) {
      connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`, { disableWarnings: true });
    }
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    db = getFirestore(getApp());
    if (EMULATOR_HOST) {
      connectFirestoreEmulator(db, EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);
    }
  }
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getApp());
  }
  return storage;
}

export function getFirebaseRTDB(): Database {
  if (!rtdb) {
    rtdb = getDatabase(getApp());
  }
  return rtdb;
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
