/**
 * Migration des déclinaisons saisies en back-office vers la colonne `groupe` du classeur.
 *
 * À lancer **avant** de déployer les nouvelles règles Firestore : le bloc
 * `match /declinations/{decId}` en est retiré, la collection deviendra illisible.
 *
 *   node scripts/export-declinations.mjs
 *
 * Produit un bloc `référence <TAB> groupe` à reporter dans la colonne D de PRODUITS,
 * et signale les références qu'aucune ligne du classeur ne décrit — ce sont elles qui
 * demandent une saisie à la main.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import Papa from 'papaparse';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const RACINE = process.cwd();
const SORTIE = join(RACINE, '.local-data');
const CSV_PRODUITS = join(RACINE, 'Sheet attribut - PRODUITS.csv');

function lireEnvLocal() {
  try {
    const txt = readFileSync(join(RACINE, '.env.local'), 'utf8');
    const env = {};
    for (const ligne of txt.split(/\r?\n/)) {
      const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
    return env;
  } catch {
    return {};
  }
}

/** Mêmes valeurs par défaut que lib/firebase.ts, pour tourner sans .env.local. */
function config() {
  const env = { ...lireEnvLocal(), ...process.env };
  return {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'site-surprisez-vous.web.app',
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'site-surprisez-vous',
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'site-surprisez-vous.appspot.com',
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };
}

/** Références déjà décrites dans le classeur : celles qui pourront recevoir un groupe. */
function refsDuClasseur() {
  if (!existsSync(CSV_PRODUITS)) return null;
  const texte = readFileSync(CSV_PRODUITS, 'utf8').replace(/^﻿/, '');
  const lignes = texte.split(/\r?\n/);
  const debut = lignes.findIndex((l) => l.split(/[,;]/)[0].trim() === 'ref');
  if (debut < 0) return null;
  const parsed = Papa.parse(lignes.slice(debut).join('\n'), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
    transform: (v) => (typeof v === 'string' ? v.trim() : v),
  });
  return new Set(parsed.data.map((r) => r.ref).filter(Boolean));
}

/**
 * Code de groupe : le préfixe commun aux références, qui est la convention de l'ERP
 * (M25CHTD + M25CHTA → M25CHT). Trop court pour être parlant, on retombe sur l'id
 * de la déclinaison, que l'on pourra renommer à la main dans le classeur.
 */
function prefixeCommun(refs) {
  if (!refs.length) return '';
  let prefixe = refs[0];
  for (const ref of refs.slice(1)) {
    let i = 0;
    while (i < prefixe.length && i < ref.length && prefixe[i] === ref[i]) i++;
    prefixe = prefixe.slice(0, i);
  }
  return prefixe;
}

async function main() {
  const db = getFirestore(initializeApp(config()));
  const snap = await getDocs(collection(db, 'declinations'));
  if (snap.empty) {
    console.log('Collection `declinations` vide : rien à migrer.');
    return;
  }

  const connues = refsDuClasseur();
  const lignes = [];
  const absentes = [];
  let groupesCourts = 0;

  for (const d of snap.docs) {
    const dec = d.data();
    const refs = (dec.variants || []).map((v) => (v.ref || '').trim().toUpperCase()).filter(Boolean);
    if (refs.length < 2) continue; // un variant unique n'est pas une déclinaison

    const prefixe = prefixeCommun(refs);
    const groupe = prefixe.length >= 3 ? prefixe : d.id;
    if (prefixe.length < 3) groupesCourts++;

    for (const ref of refs.sort()) {
      lignes.push({ ref, groupe, designation: dec.designation || '' });
      if (connues && !connues.has(ref)) absentes.push(ref);
    }
  }

  lignes.sort((a, b) => a.ref.localeCompare(b.ref));

  const tsv = ['ref\tgroupe\tdesignation d’origine']
    .concat(lignes.map((l) => `${l.ref}\t${l.groupe}\t${l.designation}`))
    .join('\n');

  if (!existsSync(SORTIE)) mkdirSync(SORTIE, { recursive: true });
  const cible = join(SORTIE, 'declinaisons-migration.tsv');
  writeFileSync(cible, tsv, 'utf8');

  const groupes = new Set(lignes.map((l) => l.groupe));
  console.log(tsv);
  console.log('');
  console.log(`→ ${lignes.length} référence(s) dans ${groupes.size} groupe(s). Écrit dans ${cible}`);
  if (groupesCourts) {
    console.log(`⚠ ${groupesCourts} groupe(s) sans préfixe commun exploitable : code repris de l'id, à renommer.`);
  }
  if (connues === null) {
    console.log('⚠ « Sheet attribut - PRODUITS.csv » illisible : impossible de vérifier la couverture du classeur.');
  } else if (absentes.length) {
    console.log(`⚠ ${absentes.length} référence(s) absente(s) du classeur, à créer avant de poser leur groupe :`);
    console.log('  ' + [...new Set(absentes)].join(', '));
  } else {
    console.log('✓ Toutes les références sont déjà décrites dans le classeur.');
  }
}

main().catch((e) => {
  console.error('Échec :', e.message);
  console.error('Si la lecture est refusée, lancer ce script AVANT de déployer les nouvelles règles Firestore.');
  process.exit(1);
});
