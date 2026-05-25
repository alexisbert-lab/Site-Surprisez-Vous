'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from './firebase';
import { getClientByEmail, linkClientToUser, type Client } from './firestore/clients';

// Cache module-level : évite de requêter Firestore à chaque onAuthStateChanged
const clientCache = new Map<string, Client | null>();

const ADMIN_EMAILS = [
  'alexis.bert@surprisez-vous.fr',
  'laurent.moulle@surprisez-vous.fr',
];

export type UserRole = 'admin' | 'pro' | 'public';

interface UserProfile {
  role: UserRole;
  nom?: string;
  entreprise?: string;
  tarif_grid_id?: string;
  client_id?: string;
  client_erp_id?: string;
  cat_ids?: number[];
  conseiller?: {
    nom: string;
    email: string;
    tel: string;
  };
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchUserProfile(uid: string, email?: string | null): Promise<UserProfile> {
  const ref = doc(getFirebaseDb(), 'users', uid);
  const snap = await getDoc(ref);

  let profile: UserProfile;
  if (snap.exists()) {
    profile = snap.data() as UserProfile;
  } else {
    const isAdmin = !!email && ADMIN_EMAILS.includes(email.toLowerCase());
    profile = { role: isAdmin ? 'admin' : 'public' };
    await setDoc(ref, profile);
  }

  // Charge le tarif_grid_id et client_erp_id :
  // 1. Depuis users/{uid} si déjà stockés
  // 2. Sinon, recherche par email dans clients + auto-lien pour les prochaines connexions
  const needsClientLookup = email &&
    !email.endsWith('@sv.local') &&
    (profile.role === 'pro' || profile.role === 'admin') &&
    (!profile.tarif_grid_id || !profile.client_erp_id || profile.cat_ids === undefined);

  if (needsClientLookup) {
    let client: Client | null;
    if (clientCache.has(email!)) {
      client = clientCache.get(email!)!;
    } else {
      client = await getClientByEmail(email!).catch(() => null);
      clientCache.set(email!, client);
    }
    const tarifGridId = client?.tarif_grid_id ?? profile.tarif_grid_id ?? 'erp_gene11';
    const erpId = (client as (Client & { erp_id?: string }) | null)?.erp_id;
    const catIds = (client as (Client & { cat_ids?: number[] }) | null)?.cat_ids;
    profile = {
      ...profile,
      tarif_grid_id: tarifGridId,
      ...(erpId ? { client_erp_id: erpId } : {}),
      ...(catIds !== undefined ? { cat_ids: catIds } : {}),
    };

    // Persister les champs manquants dans users/{uid} pour éviter le re-fetch
    const toPersist: Record<string, unknown> = {};
    if (!snap.data()?.tarif_grid_id) toPersist.tarif_grid_id = tarifGridId;
    if (erpId && !snap.data()?.client_erp_id) toPersist.client_erp_id = erpId;
    if (catIds !== undefined && snap.data()?.cat_ids === undefined) toPersist.cat_ids = catIds;
    if (Object.keys(toPersist).length > 0) {
      updateDoc(ref, toPersist).catch(() => {});
    }

    // Auto-lier le compte si le client n'est pas encore lié à cet uid
    if (client && !client.uid) {
      linkClientToUser(client.id, uid, tarifGridId).catch(() => {});
    }
  }

  return profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      setUser(firebaseUser);
      try {
        if (firebaseUser) {
          const p = await fetchUserProfile(firebaseUser.uid, firebaseUser.email);
          setProfile(p);
        } else {
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  };

  const logout = async () => {
    await signOut(getFirebaseAuth());
    setProfile(null);
    clientCache.clear();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
