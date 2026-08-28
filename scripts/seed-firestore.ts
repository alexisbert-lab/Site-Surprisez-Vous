/**
 * Seed de données de TEST pour l'émulateur Firestore.
 *
 * Sécurité : ce script REFUSE de s'exécuter contre une vraie base.
 * Il exige FIRESTORE_EMULATOR_HOST (auto-défini sur 127.0.0.1:8080 si absent).
 * Avec cette variable, le SDK admin parle uniquement à l'émulateur — aucune
 * lecture/écriture facturée, aucun risque pour la prod.
 *
 * Usage :
 *   firebase emulators:start --only firestore,auth   # terminal 1
 *   npm run seed                                      # terminal 2
 */
import * as admin from 'firebase-admin';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });

// ── Garde-fou : forcer l'émulateur, jamais la prod ────────────────────────────
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  console.log(`ℹ️  FIRESTORE_EMULATOR_HOST non défini → ${process.env.FIRESTORE_EMULATOR_HOST}`);
}
if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
}
const host = process.env.FIRESTORE_EMULATOR_HOST;
if (!/(localhost|127\.0\.0\.1|0\.0\.0\.0)/.test(host)) {
  console.error(`❌ FIRESTORE_EMULATOR_HOST="${host}" ne pointe pas vers un émulateur local. Abandon.`);
  process.exit(1);
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'site-surprisez-vous';
admin.initializeApp({ projectId });
const db = admin.firestore();

// ── Données de référence ──────────────────────────────────────────────────────
const marques = [
  { id: 'disney', nom: 'Disney', licence: true, actif: true },
  { id: 'marvel', nom: 'Marvel', licence: true, actif: true },
  { id: 'generique', nom: 'Générique', licence: false, actif: true },
];

// code_stat : préfixe 2 chars = gamme principale
const categories = [
  { id: 'cat-ballons', nom: 'Ballons', code_stat: 'BA' },
  { id: 'cat-peluches', nom: 'Peluches', code_stat: 'PE' },
  { id: 'cat-deco', nom: 'Décoration', code_stat: 'DE' },
  { id: 'cat-jeux', nom: 'Jeux & Jouets', code_stat: 'JO' },
];

// Familles : préfixe 2c → sous-codes 6c. Génère des produits réalistes.
const familles: { prefix: string; sousfam: string; designation: string; marque?: string; count: number }[] = [
  { prefix: 'BA', sousfam: 'BAHE', designation: 'Ballon hélium', count: 8 },
  { prefix: 'BA', sousfam: 'BAAL', designation: 'Ballon aluminium', marque: 'disney', count: 6 },
  { prefix: 'PE', sousfam: 'PEAN', designation: 'Peluche animal', count: 7 },
  { prefix: 'PE', sousfam: 'PEHE', designation: 'Peluche héros', marque: 'marvel', count: 5 },
  { prefix: 'DE', sousfam: 'DETA', designation: 'Décoration de table', count: 6 },
  { prefix: 'JO', sousfam: 'JOSO', designation: 'Jeu de société', count: 5 },
];

type SeedProduct = {
  pdt_reference: string;
  pdt_designation: string;
  pdt_code_stat: string;
  pdt_etat: string;
  pdt_ean: string;
  stock_physique: number;
  prix_base: number;
  prix_vente: number;
  en_rupture: boolean;
  stock_faible: boolean;
};

const products: SeedProduct[] = [];
const productMarques: { ref: string; marqueId: string }[] = [];
let eanSeq = 3700100000000;

for (const f of familles) {
  for (let i = 1; i <= f.count; i++) {
    const ref = `${f.sousfam}${String(i).padStart(3, '0')}`;
    const code6 = `${f.sousfam}${String(i % 9).padStart(2, '0')}`; // 6 chars → niveau 3
    const stock = (i * 7) % 35; // varie : certains en rupture (0) / stock faible (<20)
    const prix = 2 + ((i * 3) % 25);
    products.push({
      pdt_reference: ref,
      pdt_designation: `${f.designation} ${i}`,
      pdt_code_stat: code6,
      pdt_etat: i % 13 === 0 ? 'B' : 'G', // un produit bloqué de temps en temps
      pdt_ean: String(eanSeq++),
      stock_physique: stock,
      prix_base: prix,
      prix_vente: Math.round(prix * 1.4 * 100) / 100,
      en_rupture: stock <= 0,
      stock_faible: stock > 0 && stock <= 20,
    });
    if (f.marque) productMarques.push({ ref, marqueId: f.marque });
  }
}

// stat-categories dérivées des produits (préfixes 2/4/6 chars)
function buildStatCategories(prods: SeedProduct[]) {
  const codes = new Set<string>();
  for (const p of prods) {
    const c = p.pdt_code_stat;
    if (c.length >= 2) codes.add(c.slice(0, 2));
    if (c.length >= 4) codes.add(c.slice(0, 4));
    if (c.length >= 6) codes.add(c.slice(0, 6));
  }
  const niveau = (c: string) => (c.length <= 2 ? 1 : c.length <= 4 ? 2 : 3) as 1 | 2 | 3;
  const parent = (c: string) => (c.length <= 2 ? null : c.length <= 4 ? c.slice(0, 2) : c.slice(0, 4));
  return [...codes].sort().map((code) => ({
    code,
    designation: code, // libellé brut : suffit pour les tests
    niveau: niveau(code),
    parent: parent(code),
    actif: true,
  }));
}

const catalogues = [
  { id: 'cat-public', cat_id: 1, cat_reference: 'PUBLIC', cat_designation: 'Catalogue public', cat_mode: 'public', cat_permanent: true },
];

// ── Écriture par batch ────────────────────────────────────────────────────────
async function seedCollection<T extends Record<string, unknown>>(
  name: string,
  items: T[],
  idOf: (item: T) => string,
) {
  let n = 0;
  for (let i = 0; i < items.length; i += 450) {
    const batch = db.batch();
    for (const item of items.slice(i, i + 450)) {
      batch.set(db.collection(name).doc(idOf(item)), item);
      n++;
    }
    await batch.commit();
  }
  console.log(`✓ ${name} : ${n} docs`);
}

// Compte admin pour les E2E authentifiés (rôle déduit de l'email côté app).
async function seedAdminUser() {
  const email = process.env.E2E_ADMIN_EMAIL || 'alexis.bert@surprisez-vous.fr';
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!password) {
    console.log('⚠️  E2E_ADMIN_PASSWORD absent → compte admin non créé (tests auth seront en échec).');
    return;
  }
  const auth = admin.auth();
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, { password });
  } catch {
    await auth.createUser({ email, password, emailVerified: true });
  }
  console.log(`✓ compte admin : ${email}`);
}

async function main() {
  console.log(`🌱 Seed émulateur (${host}) projet "${projectId}"\n`);
  const statCats = buildStatCategories(products);

  await seedCollection('marques', marques, (m) => m.id);
  await seedCollection('categories', categories, (c) => c.id);
  await seedCollection('catalogues', catalogues, (c) => c.id);
  await seedCollection('products', products, (p) => p.pdt_reference);
  await seedCollection(
    'product-marques',
    productMarques.map((pm) => ({ id: pm.ref, marqueId: pm.marqueId })),
    (pm) => pm.id,
  );
  await seedCollection('stat-categories', statCats, (s) => s.code);
  await seedAdminUser();

  console.log(`\n✅ Seed terminé : ${products.length} produits, ${statCats.length} stat-cats, ${marques.length} marques.`);
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Seed échoué :', e);
  process.exit(1);
});
