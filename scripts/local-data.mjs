/**
 * Fabrique les fixtures de `.local-data/` : le site tourne alors en local sans
 * lire Firestore (voir lib/local-data.ts et SV_LOCAL_DATA dans .env.local).
 *
 *   node scripts/local-data.mjs            produits depuis le cache Cloud Function
 *   node scripts/local-data.mjs --demo     produits fabriques depuis le classeur (100 % hors ligne)
 *   node scripts/local-data.mjs --erp      produits de l'export ERP + attributs deduits (contenu de test)
 *
 * Le referentiel (attributs, valeurs, attributs produits) ne touche jamais Firebase :
 * il vient des CSV du classeur, ou a defaut du prototype.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import Papa from 'papaparse';
import { deriverAttributs } from './attributs-demo.mjs';

const RACINE = process.cwd();
const SORTIE = join(RACINE, '.local-data');
const CSV_DIR = join(SORTIE, 'csv');
const PROTOTYPE = join(RACINE, 'prototype-menu-produits', 'index.html');
const CSV_PRODUITS_RACINE = join(RACINE, 'Sheet attribut - PRODUITS.csv');

const demo = process.argv.includes('--demo');
const erp = process.argv.includes('--erp');

/** Export ERP à deux colonnes (PDT_REFERENCE, PDT_DESIGNATION), posé à la main. */
const CSV_ERP = join(RACINE, 'prototype-menu-produits', 'Feuille de calcul sans titre - Feuille 1.csv');

// ── Lecture CSV ───────────────────────────────────────────────────────────────

/**
 * Le classeur exporte deux lignes de presentation avant la ligne des cles
 * techniques. L'en-tete est donc cherche par sa premiere cellule.
 */
function lireCsv(chemin, premiereCle) {
  const texte = readFileSync(chemin, 'utf8').replace(/^﻿/, '');
  const lignes = texte.split(/\r?\n/);
  const debut = lignes.findIndex((l) => l.split(/[,;]/)[0].trim() === premiereCle);
  if (debut < 0) throw new Error(`${chemin} : ligne d'en-tete « ${premiereCle} » introuvable`);
  const parsed = Papa.parse(lignes.slice(debut).join('\n'), {
    header: true,
    skipEmptyLines: false,
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
    transform: (v) => (typeof v === 'string' ? v.trim() : v),
  });
  return parsed.data;
}

/** Les blocs du prototype sont des litteraux JS : la source de secours du referentiel. */
function lireBlocPrototype(nom) {
  const html = readFileSync(PROTOTYPE, 'utf8');
  const m = html.match(new RegExp(`const ${nom} = (\\[[\\s\\S]*?\\n\\]);`));
  if (!m) throw new Error(`${PROTOTYPE} : bloc ${nom} introuvable`);
  return new Function(`return ${m[1]}`)();
}

const vrai = (v) => String(v ?? '').trim().toLowerCase() === 'oui' || v === true;
const nombre = (v) => Number(String(v ?? '').replace(',', '.')) || 0;
const court = (chemin) => chemin.replace(RACINE, '.');

/**
 * Un onglet du classeur, reconnu par un mot dans le nom du fichier : Sheets
 * exporte « Classeur SV - ATTRIBUTS.csv », renommer trois fichiers a chaque
 * export serait la premiere chose qu'on oublie. Le plus recent l'emporte.
 *
 * « Sheet attribut - PRODUITS.csv » porte les deux mots : les onglets attributs
 * et valeurs ecartent donc explicitement les fichiers de produits.
 */
function csvDuClasseur(motCle) {
  if (!existsSync(CSV_DIR)) return null;
  const exclus = motCle === 'produit' ? [] : ['produit', ...(motCle === 'attribut' ? ['valeur'] : [])];
  return readdirSync(CSV_DIR)
    .filter((f) => {
      const n = f.toLowerCase();
      return n.endsWith('.csv') && n.includes(motCle) && !exclus.some((x) => n.includes(x));
    })
    .map((f) => join(CSV_DIR, f))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0] ?? null;
}

/**
 * Etat des entrees avant tout traitement : sans ce recapitulatif, rien ne
 * distingue a l'ecran un classeur relu d'un classeur oublie, et on croit avoir
 * mis a jour le site alors que le script est reparti sur le prototype.
 */
function inventaireSources() {
  const ligne = (role, chemin, repli) => {
    const etat = existsSync(chemin)
      ? `${court(chemin)}  (modifie le ${statSync(chemin).mtime.toLocaleString('fr-FR')})`
      : `absent → ${repli}`;
    console.log(`  ${role.padEnd(20)} ${etat}`);
  };

  console.log(`Sources (deposer les exports du classeur dans ${court(CSV_DIR)}) :`);
  ligne('Attributs', csvDuClasseur('attribut') ?? join(CSV_DIR, 'SV_ATTRIBUTS.csv'), 'blocs du prototype');
  ligne('Valeurs', csvDuClasseur('valeur') ?? join(CSV_DIR, 'SV_VALEURS.csv'), 'blocs du prototype');
  ligne('Attributs produits', csvProduits(), 'aucun repli, le script s\'arrete');
  if (erp) ligne('Export ERP', CSV_ERP, 'aucun repli, le script s\'arrete');
  console.log('');
}

// ── Referentiel ───────────────────────────────────────────────────────────────

function chargerRegistre() {
  const csv = csvDuClasseur('attribut');
  const brut = csv ? lireCsv(csv, 'cle') : lireBlocPrototype('REGISTRE');
  return brut
    .filter((r) => r.cle)
    .map((r) => ({
      cle: r.cle,
      libelle: r.libelle,
      zone: r.zone,
      niveau: r.niveau === '' || r.niveau == null ? null : nombre(r.niveau),
      type: r.type ?? 'liste',
      slots: nombre(r.slots) || 1,
      rendu: r.rendu ?? 'case',
      ordre: nombre(r.ordre),
      actif: vrai(r.actif),
      axe: vrai(r.axe),
    }));
}

function chargerValeurs() {
  const csv = csvDuClasseur('valeur');
  const brut = csv ? lireCsv(csv, 'attribut') : lireBlocPrototype('VALEURS');
  return brut
    .filter((r) => r.attribut && r.slug)
    .map((r) => ({
      attribut: r.attribut,
      slug: r.slug,
      libelle: r.libelle,
      hex: (r.hex ?? '').replace(/^#/, ''),
      parent: r.parent ?? '',
      ordre: nombre(r.ordre),
      actif: vrai(r.actif),
    }));
}

/**
 * Papa Parse renomme les colonnes homonymes du classeur (« Univers 1 », « Univers 2 »
 * portent la meme cle technique `univers`) en univers, univers_1, univers_2 : un
 * attribut a `slots` colonnes a rassembler avant l'eclatement sur « | ».
 */
function valeursDuSlot(row, attr) {
  const brut = [];
  for (let i = 0; i < (attr.slots || 1); i++) {
    brut.push(row[i === 0 ? attr.cle : `${attr.cle}_${i}`] ?? '');
  }
  return brut
    .join('|')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Le CSV depose dans `.local-data/csv/` prime sur celui laisse a la racine. */
function csvProduits() {
  return csvDuClasseur('produit') ?? CSV_PRODUITS_RACINE;
}

function chargerProduits(registre) {
  const csv = csvProduits();
  if (!existsSync(csv)) {
    console.error(`Aucun CSV de produits : deposer SV_PRODUITS.csv dans ${court(CSV_DIR)}`);
    console.error(`(ou « Sheet attribut - PRODUITS.csv » a la racine du projet), puis relancer.`);
    process.exit(1);
  }
  const rows = lireCsv(csv, 'ref');

  const out = {};
  // Le libelle est la designation ERP : il ne fait pas partie des attributs, mais la
  // feuille complete le porte encore, et le mode demo s'en sert pour fabriquer l'ERP.
  const designations = {};
  let ignore = 0;
  for (const row of rows) {
    const ref = (row.ref ?? '').trim();
    // La legende du classeur suit les produits, separee par une ligne vide.
    if (!ref) break;
    if ((row.statut ?? '').trim() !== 'actif') { ignore++; continue; }
    designations[ref] = (row.libelle ?? '').trim();

    const attrs = {
      ref,
      statut: 'actif',
      description_courte: (row.description_courte ?? '').trim(),
      seo_slug: (row.seo_slug ?? '').trim(),
    };
    for (const attr of registre) {
      const vals = valeursDuSlot(row, attr);
      attrs[attr.cle] = attr.slots > 1 ? vals : (vals[0] ?? '');
    }
    out[ref] = attrs;
  }
  return { produits: out, designations, ignore, source: csv };
}

// ── Produits du site ──────────────────────────────────────────────────────────

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

/** Le cache Cloud Function sert sa propre copie : aucune lecture Firestore. */
async function depuisCF(base, chemin) {
  const res = await fetch(`${base}/data/${chemin}`);
  if (!res.ok) throw new Error(`${chemin} : HTTP ${res.status}`);
  return res.json();
}

// cp1252 → octet, pour les 27 caracteres hors latin1 (« ‰ » = 0x89, « ’ » = 0x92…).
const CP1252 = new Map(Object.entries({
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86,
  0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c,
  0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95,
  0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b,
  0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
}).map(([k, v]) => [Number(k), v]));

/**
 * L'export ERP est doublement encode : « É » y est stocke comme « Ã‰ », soit
 * l'UTF-8 de É relu en cp1252 puis reencode. On refait le chemin inverse.
 * `Buffer.from(s, 'latin1')` ne suffit pas : « ‰ » (U+2030) n'a pas d'equivalent
 * latin1 et serait tronque.
 */
function reparerMojibake(texte) {
  for (let passe = 0; passe < 2; passe++) {
    if (!/[ÃÂ][-¿–-™ŒŠŸŽƒˆ˜]/.test(texte)) return texte;
    const octets = [];
    for (const ch of texte) {
      const code = ch.codePointAt(0);
      const octet = code <= 0xff ? code : CP1252.get(code);
      if (octet === undefined) return texte;
      octets.push(octet);
    }
    const repare = Buffer.from(octets).toString('utf8');
    if (repare.includes('�')) return texte;
    texte = repare;
  }
  return texte;
}

/**
 * Export ERP : une reference peut revenir plusieurs fois (declinaisons),
 * la premiere designation rencontree fait foi.
 */
function produitsErp() {
  const lignes = readFileSync(CSV_ERP, 'utf8').split(/\r?\n/).slice(1);
  const vus = new Map();
  for (const ligne of lignes) {
    const i = ligne.indexOf(',');
    if (i < 0) continue;
    const ref = ligne.slice(0, i).trim();
    const designation = reparerMojibake(ligne.slice(i + 1).trim().replace(/^"|"$/g, ''));
    if (ref && !vus.has(ref)) vus.set(ref, designation);
  }
  return [...vus].map(([ref, designation]) => ({
    pdt_reference: ref,
    pdt_designation: designation,
    pdt_code_stat: '',
    pdt_etat: 'A',
    pdt_ean: '',
    visible_override: true,
  }));
}

/**
 * Complete les attributs du classeur par une deduction sur la designation.
 * Les references decrites a la main gagnent toujours : le classeur reste la
 * source de verite, la deduction ne sert qu'a remplir le catalogue de test.
 */
function completerAttributs(produits, attributsClasseur, registre, valeurs) {
  const slugsParAttribut = {};
  const parent = {};
  for (const v of valeurs) {
    (slugsParAttribut[v.attribut] ??= new Set()).add(v.slug);
    if (v.attribut === 'sous_categorie') parent[v.slug] = v.parent;
  }
  const out = { ...attributsClasseur };
  let deduits = 0;
  for (const p of produits) {
    if (out[p.pdt_reference]) continue;
    const attrs = deriverAttributs(p, registre, (s) => parent[s] ?? '', slugsParAttribut);
    if (attrs) { out[p.pdt_reference] = attrs; deduits++; }
  }
  return { attributs: out, deduits };
}

/** PublicProduct ne porte que 6 champs : le classeur suffit a fabriquer une vitrine. */
function produitsDemo(attributs, designations) {
  return Object.values(attributs).map((a) => ({
    pdt_reference: a.ref,
    pdt_designation: designations[a.ref] || a.ref,
    pdt_code_stat: '',
    pdt_etat: 'A',
    pdt_ean: '',
    visible_override: true,
  }));
}

/**
 * Feuille GROUPES : une ligne par article decline. Absente, le site retombe sur le
 * comportement d'avant — chef trie par reference, aucune description de groupe.
 */
function chargerGroupes() {
  const csv = join(CSV_DIR, 'SV_GROUPES.csv');
  if (!existsSync(csv)) return {};
  const out = {};
  for (const row of lireCsv(csv, 'groupe')) {
    const groupe = (row.groupe ?? '').trim();
    if (!groupe) continue;
    if ((row.actif ?? '').trim().toLowerCase() === 'non') continue;
    out[groupe] = {
      groupe,
      ref_principale: (row.ref_principale ?? '').trim(),
      description: (row.description ?? '').trim(),
    };
  }
  return out;
}

// ── Ecriture ──────────────────────────────────────────────────────────────────

function ecrire(nom, data) {
  writeFileSync(join(SORTIE, `${nom}.json`), JSON.stringify(data, null, 2), 'utf8');
  const taille = Array.isArray(data) ? data.length : Object.keys(data).length;
  console.log(`  ${nom}.json — ${taille} entrées`);
}

async function main() {
  mkdirSync(SORTIE, { recursive: true });
  // Le dossier existe toujours : c'est la que se deposent les CSV du classeur.
  mkdirSync(CSV_DIR, { recursive: true });
  inventaireSources();

  const registre = chargerRegistre();
  const valeurs = chargerValeurs();
  const { produits: attributsClasseur, designations, ignore, source } = chargerProduits(registre);

  console.log('Fichiers ecrits :');
  ecrire('attribute-registry', registre);
  ecrire('attribute-values', valeurs);
  ecrire('product-groups', chargerGroupes());
  if (ignore) console.log(`  ${ignore} ligne(s) du classeur non « actif » ignorée(s)`);

  let produits;
  let attributsProduits = attributsClasseur;
  if (erp) {
    if (!existsSync(CSV_ERP)) {
      console.error(`Export ERP introuvable : ${CSV_ERP}`);
      process.exit(1);
    }
    produits = produitsErp();
    ecrire('products', produits);
    ecrire('stat-categories', []);

    const complete = completerAttributs(produits, attributsClasseur, registre.filter((d) => d.actif), valeurs);
    attributsProduits = complete.attributs;
    ecrire('product-attributes', attributsProduits);
    console.log(`  ${Object.keys(attributsClasseur).length} du classeur, ${complete.deduits} déduits`);
  } else if (demo) {
    produits = produitsDemo(attributsClasseur, designations);
    ecrire('product-attributes', attributsProduits);
    ecrire('products', produits);
    ecrire('stat-categories', []);
  } else {
    ecrire('product-attributes', attributsProduits);
    const base = process.env.NEXT_PUBLIC_CACHE_CF_URL ?? lireEnvLocal().NEXT_PUBLIC_CACHE_CF_URL;
    if (!base) {
      console.error('NEXT_PUBLIC_CACHE_CF_URL absent — relancer avec --demo pour un local hors ligne.');
      process.exit(1);
    }
    console.log(`  produits lus depuis le cache Cloud Function (${base})`);
    produits = await depuisCF(base, 'products');
    ecrire('products', produits);
    ecrire('stat-categories', await depuisCF(base, 'stat-categories'));
  }

  // Sans marques, la facette se masque d'elle-même côté catalogue.
  if (!existsSync(join(SORTIE, 'marques.json'))) ecrire('marques', []);
  if (!existsSync(join(SORTIE, 'product-marques.json'))) ecrire('product-marques', {});

  // Personnalisation : l'éditeur écrit dans ces deux fichiers. Les réglages du
  // site s'amorcent depuis le cache CF quand il répond, le contenu de page part
  // vide — chaque bloc retombe alors sur le texte écrit dans le code.
  if (!existsSync(join(SORTIE, 'page-content.json'))) ecrire('page-content', {});
  if (!existsSync(join(SORTIE, 'site-settings.json'))) {
    const cf = process.env.NEXT_PUBLIC_CACHE_CF_URL ?? lireEnvLocal().NEXT_PUBLIC_CACHE_CF_URL;
    let reglages = {};
    if (cf) {
      try {
        reglages = await depuisCF(cf, 'site-settings');
      } catch (e) {
        console.log(`  site-settings non récupérés (${e.message}) — fichier vide`);
      }
    }
    ecrire('site-settings', reglages);
  }

  const refsSite = new Set(produits.map((p) => p.pdt_reference));
  const apparies = Object.keys(attributsProduits).filter((r) => refsSite.has(r)).length;
  console.log(`\n${apparies}/${produits.length} produit(s) du site portent des attributs.`);
  if (apparies === 0) {
    console.log('Aucune correspondance : le menu afficherait des compteurs à zéro.');
    console.log('→ relancer avec : npm run local:data -- --demo');
  }
  console.log('\nMettre à jour plus tard : remplacer les CSV dans .local-data/csv/, relancer');
  console.log('« npm run local:data », puis recharger la page — le site relit les fichiers à chaud.');
  console.log('\nDans .env.local : SV_LOCAL_DATA=1 (le site lit les fixtures) et');
  console.log('NEXT_PUBLIC_SV_LOCAL_DATA=1 (l\'éditeur et la personnalisation écrivent dedans).');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
