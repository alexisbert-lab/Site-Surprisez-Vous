/**
 * Pousse le référentiel d'attributs des fixtures locales vers Firestore.
 *
 * Le chemin normal est le classeur : SV_*.csv déposés dans Drive, puis la Cloud
 * Function `syncAttributs`. Ce script court-circuite la chaîne quand ce qu'on veut,
 * c'est voir en préproduction exactement ce que `SV_LOCAL_DATA=1` montre en local —
 * mêmes documents, mêmes identifiants que ceux qu'écrirait `syncAttributs`, donc
 * une synchro ultérieure met à jour au lieu de dupliquer.
 *
 *   node scripts/seed-attributs.mjs              # simulation, n'écrit rien
 *   node scripts/seed-attributs.mjs --go         # écrit
 *   node scripts/seed-attributs.mjs --go --revalidate   # + purge le cache Next
 *
 * Demande `scripts/serviceAccountKey.json` : les règles refusent l'écriture de ces
 * quatre collections à tout le monde, seul le SDK admin passe.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RACINE = join(__dirname, '..');
const FIXTURES = join(RACINE, '.local-data');
const CLE = join(__dirname, 'serviceAccountKey.json');

const ECRIRE = process.argv.includes('--go');
const REVALIDER = process.argv.includes('--revalidate');
const URL_SITE =
  process.argv.find((a) => a.startsWith('--url='))?.slice(6) ||
  process.env.NEXTJS_BASE_URL ||
  'https://backend-surprisez-vous--site-surprisez-vous.us-central1.hosted.app';

/** `.env.local` sans dépendance : seul `CACHE_SECRET` nous intéresse. */
function lireEnvLocal() {
  const f = join(RACINE, '.env.local');
  if (!existsSync(f)) return {};
  const out = {};
  for (const ligne of readFileSync(f, 'utf8').split('\n')) {
    const m = ligne.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

function lireFixture(nom) {
  const f = join(FIXTURES, `${nom}.json`);
  if (!existsSync(f)) {
    console.error(`❌ ${nom}.json absent de .local-data/ — lancer d'abord : npm run local:data -- --demo`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(f, 'utf8'));
}

// Identifiants de documents : repris à l'identique de functions/index.js.
const idValeur = (attribut, slug) => `${attribut}__${slug}`.replace(/\//g, '_');
const idRef = (ref) => ref.replace(/\//g, '__');

/**
 * Les fixtures sortent tantôt en tableau (registre, valeurs), tantôt en objet
 * indexé (attributs produit, groupes) : on ramène tout à des paires id/document.
 */
const COLLECTIONS = [
  {
    nom: 'attribute-registry',
    docs: () => lireFixture('attribute-registry').map((d) => [d.cle, d]),
  },
  {
    nom: 'attribute-values',
    docs: () => lireFixture('attribute-values').map((d) => [idValeur(d.attribut, d.slug), d]),
  },
  {
    nom: 'product-attributes',
    docs: () => Object.values(lireFixture('product-attributes')).map((d) => [idRef(d.ref), d]),
  },
  {
    nom: 'attribute-groups',
    docs: () => Object.values(lireFixture('attribute-groups')).map((d) => [idRef(d.groupe), d]),
  },
];

async function main() {
  // Sans `--go`, on compte les documents : ni clé de service, ni connexion.
  let db = null;
  if (ECRIRE) {
    if (!existsSync(CLE)) {
      console.error(
        '❌ scripts/serviceAccountKey.json absent.\n' +
          '   Console Firebase → Paramètres du projet → Comptes de service → Générer une nouvelle clé privée,\n' +
          '   puis déposer le fichier sous ce nom. Il est déjà ignoré par git.',
      );
      process.exit(1);
    }
    const compte = JSON.parse(readFileSync(CLE, 'utf8'));
    initializeApp({ credential: cert(compte) });
    db = getFirestore();
    console.log(`Projet : ${compte.project_id}`);
    console.log('⚠️  Écriture réelle\n');
  } else {
    console.log('Simulation — rien ne sera écrit (ajouter --go)\n');
  }

  let total = 0;
  for (const { nom, docs } of COLLECTIONS) {
    const entrees = docs().filter(([id]) => id);
    total += entrees.length;
    console.log(`${nom} : ${entrees.length} documents`);
    if (!ECRIRE) continue;

    for (let i = 0; i < entrees.length; i += 450) {
      const batch = db.batch();
      for (const [id, doc] of entrees.slice(i, i + 450)) {
        batch.set(db.collection(nom).doc(id), doc, { merge: true });
      }
      await batch.commit();
    }
  }

  if (!ECRIRE) {
    console.log(`\n${total} documents seraient écrits. Relancer avec --go.`);
    return;
  }
  console.log(`\n✅ ${total} documents écrits.`);

  if (REVALIDER) {
    const secret = process.env.CACHE_SECRET || lireEnvLocal().CACHE_SECRET;
    const res = await fetch(`${URL_SITE}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: COLLECTIONS.map((c) => c.nom), secret }),
    });
    console.log(
      res.ok
        ? `✅ Cache Next purgé sur ${URL_SITE}`
        : `⚠️  Revalidation refusée (${res.status}) — le cache retombera de lui-même sous 24 h`,
    );
  }
  // Sans cette fermeture, le SDK laisse ses connexions gRPC ouvertes et Node
  // s'arrête sur une assertion libuv après avoir pourtant tout écrit.
  await db.terminate();
}

main().catch((e) => {
  console.error('❌ Échec :', e);
  process.exit(1);
});
