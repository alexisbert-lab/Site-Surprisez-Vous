const admin = require('firebase-admin');
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
  }
}

// ─── CORS helper ─────────────────────────────────────────────────────────────

function setCorsHeaders(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Expose-Headers', 'X-Cache-Version, X-Cache-Hit');
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

const PROTECTED = new Set(['tarif-lines', 'clients', 'orders']);
const ADMIN_ONLY = new Set(['clients']);

async function verifyIdToken(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) throw new Error('Missing token');
  return admin.auth().verifyIdToken(auth.slice(7));
}

// ─── Cloud Function export ────────────────────────────────────────────────────

const handler = onRequest(
  { region: 'us-central1', minInstances: 1, memory: '256MiB', timeoutSeconds: 60, cors: true },
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
        const userDoc = await db().collection('clients').where('uid', '==', decoded.uid).limit(1).get();
        const isAdmin = !userDoc.empty && userDoc.docs[0].data().role === 'admin';
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
    return res.json(data);
  } catch (err) {
    console.error(`[cache-service] ${col}:`, err);
    return res.status(500).json({ error: String(err.message) });
  }
});

module.exports = { handler, invalidate, getFromCache };
