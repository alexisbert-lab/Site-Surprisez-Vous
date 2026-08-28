import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import { MODE_LOCAL } from '../local-mode';
import { lireStoreLocal, ecrireStoreLocal } from '../local-store';

const db = () => getFirebaseDb();
const COLLECTION = 'settings';

export interface ThemeColors {
  sv_primary: string;
  sv_primary_dark: string;
  sv_primary_light: string;
  sv_orange: string;
  sv_orange_dark: string;
  sv_orange_light: string;
  bg_page: string;
  bg_section_alt: string;
  bg_card: string;
}

export const DEFAULT_COLORS: ThemeColors = {
  sv_primary: '#225574',
  sv_primary_dark: '#1a4159',
  sv_primary_light: '#e0edf4',
  sv_orange: '#E97132',
  sv_orange_dark: '#c95e28',
  sv_orange_light: '#fde8dd',
  bg_page: '#ffffff',
  bg_section_alt: '#f8f9fa',
  bg_card: '#ffffff',
};

export interface HeaderSettings {
  logo_text: string;
  logo_image_url: string;
  cta_label: string;
}

export const DEFAULT_HEADER: HeaderSettings = {
  logo_text: 'Surprisez-Vous',
  logo_image_url: '',
  cta_label: 'Espace Pro',
};

export interface FooterSettings {
  email: string;
  phone: string;
  instagram_url: string;
  facebook_url: string;
  linkedin_url: string;
}

export const DEFAULT_FOOTER: FooterSettings = {
  email: 'contact@surprisez-vous.fr',
  phone: '01 23 45 67 89',
  instagram_url: 'https://www.instagram.com/surprisez_vous/',
  facebook_url: 'https://www.facebook.com/SurprisezVous/',
  linkedin_url: 'https://www.linkedin.com/company/surprisez-vous/posts/?feedView=all',
};

/** En mode local, les trois documents vivent dans `.local-data/site-settings.json`. */
async function lireDoc<T extends object>(cle: string, defauts: T): Promise<T> {
  if (MODE_LOCAL) {
    const local = await lireStoreLocal<Partial<T>>('site-settings', cle);
    return { ...defauts, ...(local ?? {}) };
  }
  const snap = await getDoc(doc(db(), COLLECTION, cle));
  if (!snap.exists()) return defauts;
  return { ...defauts, ...snap.data() } as T;
}

async function ecrireDoc(cle: string, data: object): Promise<void> {
  if (MODE_LOCAL) return ecrireStoreLocal('site-settings', cle, { ...data });
  await setDoc(doc(db(), COLLECTION, cle), data);
}

export async function getThemeColors(): Promise<ThemeColors> {
  return lireDoc('theme', DEFAULT_COLORS);
}

export async function saveThemeColors(colors: ThemeColors): Promise<void> {
  await ecrireDoc('theme', colors);
}

export async function getHeaderSettings(): Promise<HeaderSettings> {
  return lireDoc('header', DEFAULT_HEADER);
}

export async function saveHeaderSettings(settings: HeaderSettings): Promise<void> {
  await ecrireDoc('header', settings);
}

export async function getFooterSettings(): Promise<FooterSettings> {
  return lireDoc('footer', DEFAULT_FOOTER);
}

export async function saveFooterSettings(settings: FooterSettings): Promise<void> {
  await ecrireDoc('footer', settings);
}
