const admin = require('firebase-admin');
const zlib = require('zlib');
const { onRequest } = require('firebase-functions/v2/https');

// Lazy reference — admin.initializeApp() is called by index.js before any request
const db = () => admin.firestore();

// ─── In-memory cache ──────────────────────────────────────────────────────────

const CACHE = new Map(); // Map<string, { data, fetchedAt, version }>
const TTL_MS = 10 * 60 * 1000;

function buildKey(collection, params = {}) {
  return collection + JSON.stringify(params);
}

function getEntry(key) {
  const entry = CACHE.get(key);
  if (entry && Date.now() - entry.fetchedAt < TTL_MS) return entry;
  return null;
}

function setEntry(key, data) {
  const version = Date.now();
  CACHE.set(key, { data, fetchedAt: Date.now(), version });
  return version;
}

// ─── Firestore readers ────────────────────────────────────────────────────────

async function readProducts() {
  const snap = await db().collection('products').get();
  return snap.docs.map((d) => {
    const { derniere_sync, ...rest } = d.data();
    return rest;
  });
}

async function readCategories() {
  const snap = await db().collection('categories').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function readStatCategories() {
  const snap = await db().collection('stat-categories').get();
  return snap.docs.map((d) => ({ code: d.id, ...d.data() }));
}

async function readPageContent(page) {
  const snap = await db().collection('page-content').doc(page).get();
  return snap.exists ? snap.data() : {};
}

async function readSiteSettings() {
  const [theme, header, footer] = await Promise.all([
    db().collection('settings').doc('theme').get(),
    db().collection('settings').doc('header').get(),
    db().collection('settings').doc('footer').get(),
  ]);
  const DEFAULT_THEME = {
    sv_primary: '#225574', sv_primary_dark: '#1a4159', sv_primary_light: '#e0edf4',
    sv_orange: '#E97132', sv_orange_dark: '#c95e28', sv_orange_light: '#fde8dd',
  };
  const DEFAULT_HEADER = { logo_text: 'Surprisez-Vous', logo_image_url: '', cta_label: 'Espace Pro' };
  const DEFAULT_FOOTER = {
    email: 'contact@surprisez-vous.fr', phone: '01 23 45 67 89',
    instagram_url: '', facebook_url: '', linkedin_url: '',
  };
  return {
    theme:  theme.exists  ? { ...DEFAULT_THEME,  ...theme.data()  } : DEFAULT_THEME,
    header: header.exists ? { ...DEFAULT_HEADER, ...header.data() } : DEFAULT_HEADER,
    footer: footer.exists ? { ...DEFAULT_FOOTER, ...footer.data() } : DEFAULT_FOOTER,
  };
}

async function readCatalogues() {
  const snap = await db().collection('catalogues').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function readMarques() {
  const snap = await db().collection('marques').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function readTarifLines(gridId) {
  const snap = await db().collection(`tarifs/${gridId}/lignes`).get();
  return snap.docs.map((d) => ({ ref: d.id, ...d.data() }));
}

async function readClients() {
  const snap = await db().collection('clients').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

const REVENDEURS_DOC = () => db().collection('settings').doc('revendeurs-cache');

// Reconstruit la liste revendeurs (lecture lourde de tous les clients Valide) et la stocke
// dans 1 doc. Appele uniquement quand les clients changent (sync / geocodage admin),
// pas a chaque expiration du cache memoire. Champs vitrine uniquement (pas de PII).
async function rebuildRevendeurs() {
  const snap = await db().collection('clients').where('statut', '==', 'Valide').get();
  const items = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => c.revendeur && c.revendeur.lat && c.revendeur.lng)
    .map((c) => ({
      id: c.id,
      nom: c.enseigne || c.raison_soc,
      adresse: c.adr || '',
      ville: c.ville || '',
      codePostal: c.cp || '',
      telephone: c.tel || '',
      lat: c.revendeur.lat,
      lng: c.revendeur.lng,
    }));
  await REVENDEURS_DOC().set({ items, count: items.length, updatedAt: Date.now() });
  return items;
}

// Source publique de la carte : lit le doc precalcule (1 lecture). Auto-reparation si absent.
async function readRevendeurs() {
  const doc = await REVENDEURS_DOC().get();
  if (doc.exists && Array.isArray(doc.data().items)) return doc.data().items;
  return rebuildRevendeurs();
}

async function readCommandes(cltId) {
  let q = db().collection('commandes').orderBy('date', 'desc');
  if (cltId) q = q.where('clt_id', '==', cltId);
  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function readOrders() {
  const snap = await db().collection('orders').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function readMarketing() {
  const snap = await db().collection('marketing').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function readGroupesContact() {
  const snap = await db().collection('groupes-contact').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function readContenuPages() {
  const snap = await db().collection('contenu-pages').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function readEvenements() {
  const snap = await db().collection('evenements').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function readDeclinations() {
  const snap = await db().collection('declinations').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function readTarifGrids() {
  const snap = await db().collection('tarifs').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function readProRequests() {
  const snap = await db().collection('pro-requests').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function readStockSettings() {
  const snap = await db().collection('settings').doc('stock').get();
  return { seuil_stock_faible: 20, ...(snap.exists ? snap.data() : {}) };
}

// ─── Core cache getter ────────────────────────────────────────────────────────

const READERS = {
  'products':        (p) => readProducts(),
  'categories':      (p) => readCategories(),
  'stat-categories': (p) => readStatCategories(),
  'page-content':    (p) => readPageContent(p.page || 'home'),
  'site-settings':   (p) => readSiteSettings(),
  'catalogues':      (p) => readCatalogues(),
  'marques':         (p) => readMarques(),
  'tarif-lines':     (p) => readTarifLines(p.gridId),
  'clients':         (p) => readClients(),
  'revendeurs':      (p) => readRevendeurs(),
  'commandes':       (p) => readCommandes(p.cltId),
  'orders':          (p) => readOrders(),
  'marketing':       (p) => readMarketing(),
  'groupes-contact': (p) => readGroupesContact(),
  'contenu-pages':   (p) => readContenuPages(),
  'evenements':      (p) => readEvenements(),
  'declinations':    (p) => readDeclinations(),
  'tarif-grids':     (p) => readTarifGrids(),
  'pro-requests':    (p) => readProRequests(),
  'stock-settings':  (p) => readStockSettings(),
};

async function getFromCache(collection, params = {}) {
  const key = buildKey(collection, params);
  const hit = getEntry(key);
  if (hit) return { data: hit.data, version: hit.version, fromCache: true };

  const reader = READERS[collection];
  if (!reader) throw new Error(`Unknown collection: ${collection}`);

  const data = await reader(params);
  const version = setEntry(key, data);
  return { data, version, fromCache: false };
}

function invalidate(collection, params = {}) {
  if (params && Object.keys(params).length > 0) {
    CACHE.delete(buildKey(collection, params));
  } else {
    // invalidate all keys for this collection prefix
    for (const k of CACHE.keys()) {
      if (k.startsWith(collection)) CACHE.delete(k);
    }
    // La carte revendeurs dérive de clients → invalider les deux ensemble.
    if (collection === 'clients') invalidate('revendeurs');
  }
}

// ─── CORS helper ─────────────────────────────────────────────────────────────

function setCorsHeaders(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Expose-Headers', 'X-Cache-Version, X-Cache-Hit');
}

/** Envoie du JSON en gzip si le client l'accepte (Cloud Run ne compresse pas automatiquement). */
function sendJson(req, res, data) {
  const body = Buffer.from(JSON.stringify(data));
  const accepts = (req.headers['accept-encoding'] || '').includes('gzip');
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.set('Vary', 'Accept-Encoding');
  if (accepts && body.length > 1024) {
    res.set('Content-Encoding', 'gzip');
    return res.status(200).send(zlib.gzipSync(body));
  }
  return res.status(200).send(body);
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

const PROTECTED = new Set(['tarif-lines', 'clients', 'orders', 'commandes', 'groupes-contact', 'tarif-grids', 'pro-requests']);
const ADMIN_ONLY = new Set(['clients', 'orders', 'groupes-contact', 'tarif-grids', 'pro-requests']);

async function verifyIdToken(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) throw new Error('Missing token');
  return admin.auth().verifyIdToken(auth.slice(7));
}

// ─── Cloud Function export ────────────────────────────────────────────────────

const handler = onRequest(
  { region: 'us-central1', memory: '256MiB', timeoutSeconds: 60, cors: true },
  async (req, res) => {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');

  const path = req.path; // e.g. /data/products or /data/invalidate

  // POST /data/invalidate
  if (req.method === 'POST' && path === '/data/invalidate') {
    const secret = (req.headers['authorization'] || '').replace('Bearer ', '');
    if (process.env.CACHE_SECRET && secret !== process.env.CACHE_SECRET) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { collection: col, params } = req.body || {};
    if (!col) return res.status(400).json({ error: 'Missing collection' });
    // Les revendeurs derivent des clients : on reconstruit le doc precalcule sur tout
    // changement clients, AVANT d'invalider le cache memoire (evite une course).
    if (col === 'clients' || col === 'revendeurs') {
      try { await rebuildRevendeurs(); } catch (e) { console.error('[cache-service] rebuild revendeurs:', e); }
    }
    invalidate(col, params);
    return res.json({ ok: true, collection: col });
  }

  // GET /data/{collection}
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const match = path.match(/^\/data\/([^/]+)$/);
  if (!match) return res.status(404).json({ error: 'Not found' });

  const col = match[1];
  const params = req.query;

  // Auth check for protected collections
  if (PROTECTED.has(col)) {
    try {
      const decoded = await verifyIdToken(req);
      if (ADMIN_ONLY.has(col)) {
        const userDoc = await db().collection('users').doc(decoded.uid).get();
        const isAdmin = userDoc.exists && userDoc.data().role === 'admin';
        if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
      }
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const { data, version, fromCache } = await getFromCache(col, params);
    res.set('X-Cache-Version', String(version));
    res.set('X-Cache-Hit', fromCache ? '1' : '0');
    return sendJson(req, res, data);
  } catch (err) {
    console.error(`[cache-service] ${col}:`, err);
    return res.status(500).json({ error: String(err.message) });
  }
});

module.exports = { handler, invalidate, getFromCache };
