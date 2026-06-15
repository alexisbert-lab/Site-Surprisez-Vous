import { vi } from 'vitest';

// Mock Firestore document snapshot
export const mockDocSnap = (data: Record<string, unknown> | null) => ({
  exists: () => data !== null,
  data: () => data,
  id: data ? (data['id'] as string) ?? 'mock-id' : '',
});

// Mock Firestore query snapshot
export const mockQuerySnap = (items: Record<string, unknown>[]) => ({
  docs: items.map((item) => ({
    data: () => item,
    id: (item['id'] as string) ?? 'mock-id',
  })),
  empty: items.length === 0,
  size: items.length,
});

// Firestore mock functions
export const getDoc = vi.fn();
export const getDocs = vi.fn();
export const setDoc = vi.fn().mockResolvedValue(undefined);
export const updateDoc = vi.fn().mockResolvedValue(undefined);
export const deleteDoc = vi.fn().mockResolvedValue(undefined);
export const addDoc = vi.fn().mockResolvedValue({ id: 'new-doc-id' });
export const collection = vi.fn().mockReturnValue({ id: 'mock-collection' });
export const doc = vi.fn().mockReturnValue({ id: 'mock-doc' });
export const query = vi.fn().mockReturnValue({});
export const where = vi.fn().mockReturnValue({});
export const orderBy = vi.fn().mockReturnValue({});
export const limit = vi.fn().mockReturnValue({});

// Auth mock
export const signInWithEmailAndPassword = vi.fn();
export const signOut = vi.fn().mockResolvedValue(undefined);
export const onAuthStateChanged = vi.fn();
export const getAuth = vi.fn().mockReturnValue({});

// Firebase app
export const getFirebaseDb = vi.fn().mockReturnValue({});
export const getFirebaseAuth = vi.fn().mockReturnValue({});
