import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import type { Client } from './clients';

const db = () => getFirebaseDb();

export interface RevendeurResult {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  codePostal: string;
  telephone: string;
  lat: number;
  lng: number;
  distance?: number;
}

export async function getActiveRevendeurs(): Promise<RevendeurResult[]> {
  const snap = await getDocs(collection(db(), 'clients'));
  const results: RevendeurResult[] = [];
  snap.forEach((d) => {
    const c = { id: d.id, ...d.data() } as Client;
    if (c.revendeur?.lat && c.revendeur?.lng) {
      results.push({
        id: c.id,
        nom: c.enseigne || c.raison_soc,
        adresse: c.adr || '',
        ville: c.ville || '',
        codePostal: c.cp || '',
        telephone: c.tel || '',
        lat: c.revendeur.lat,
        lng: c.revendeur.lng,
      });
    }
  });
  return results;
}

export async function setRevendeurCoords(
  clientId: string,
  lat: number,
  lng: number
): Promise<void> {
  await updateDoc(doc(db(), 'clients', clientId), {
    'revendeur.lat': lat,
    'revendeur.lng': lng,
  });
}

/** Geocode a French postal code → { lat, lng } via api-adresse.data.gouv.fr */
export async function geocodePostalCode(cp: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${cp}&type=municipality&limit=1`
    );
    const data = await res.json();
    const coords = data?.features?.[0]?.geometry?.coordinates;
    if (!coords) return null;
    return { lat: coords[1], lng: coords[0] };
  } catch {
    return null;
  }
}

/** Haversine distance in km between two lat/lng points */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
