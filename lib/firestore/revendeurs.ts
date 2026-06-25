import { updateDoc, doc } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

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

/** Geocode a full address (num+rue+cp+ville) → { lat, lng } via api-adresse.data.gouv.fr */
export async function geocodeAddress(
  adresse: string,
  cp: string,
  ville: string
): Promise<{ lat: number; lng: number } | null> {
  const query = [adresse, cp, ville].map((s) => (s || '').trim()).filter(Boolean).join(' ');
  if (!query) return null;
  try {
    const params = new URLSearchParams({ q: query, limit: '1' });
    if (cp.trim()) params.set('postcode', cp.trim());
    const res = await fetch(`https://api-adresse.data.gouv.fr/search/?${params.toString()}`);
    const data = await res.json();
    const coords = data?.features?.[0]?.geometry?.coordinates;
    if (!coords) return null;
    return { lat: coords[1], lng: coords[0] };
  } catch {
    return null;
  }
}

/** Geocode a French postal code → { lat, lng } via api-adresse.data.gouv.fr (fallback commune) */
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
