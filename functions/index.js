const functions = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated, onDocumentWritten, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const Papa = require("papaparse");
const credentials = require("./credentials.json");

admin.initializeApp();
const db = admin.firestore();

const { handler: cacheHandler } = require('./cache-service');
exports.cacheData = cacheHandler;

const authGoogle = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
  ],
});

const drive = google.drive({ version: "v3", auth: authGoogle });
const sheets = google.sheets({ version: "v4", auth: authGoogle });

const CSV_FILE_ID = "1OVGoPYdmDGhVlsHRiqhkHtzT_OPZp7jM";
const SPREADSHEET_ID = "1l91znV1PgX-eimQ6EKFexTB0z14rmTtD6ProfCHBodA";

// Dossier Drive contenant les exports ERP quotidiens
const DRIVE_FOLDER_ID = "1rZ2ekGG1OMnCg8OWnoEnPxt5rGotqt77";

let SEUIL_STOCK_FAIBLE = 20;

async function getSeuilStockFaible() {
  try {
    const snap = await db.collection("settings").doc("stock").get();
    if (snap.exists && snap.data().seuil_stock_faible) {
      return snap.data().seuil_stock_faible;
    }
  } catch (e) {
    console.warn("Impossible de lire le seuil stock faible, utilisation du défaut:", SEUIL_STOCK_FAIBLE);
  }
  return SEUIL_STOCK_FAIBLE;
}

// ===== Utilitaires de diff pour les syncs =====

/** Lit toute une collection Firestore et retourne un Map<docId, data> */
async function readCollectionMap(collectionName) {
  const snap = await db.collection(collectionName).get();
  const map = new Map();
  snap.docs.forEach((doc) => map.set(doc.id, doc.data()));
  return map;
}

/** Lit une sous-collection et retourne un Map<docId, data> */
async function readSubCollectionMap(collectionName, docId, subCollectionName) {
  const snap = await db.collection(collectionName).doc(docId).collection(subCollectionName).get();
  const map = new Map();
  snap.docs.forEach((doc) => map.set(doc.id, doc.data()));
  return map;
}

/**
 * Retourne true si au moins un champ diffère entre existing (Firestore) et incoming (CSV).
 * Si existing est null/undefined, le document est nouveau → toujours écrire.
 */
function fieldsChanged(existing, incoming, fields) {
  if (!existing) return true;
  for (const f of fields) {
    if (existing[f] !== incoming[f]) return true;
  }
  return false;
}

/**
 * Compare deux tableaux comme des ensembles (ordre indifférent).
 * Retourne true si les contenus diffèrent.
 */
function arrayChanged(a, b) {
  const sa = [...(a || [])].sort().join(",");
  const sb = [...(b || [])].sort().join(",");
  return sa !== sb;
}

// URL du serveur Next.js et secret partagé — à définir dans functions/.env
const NEXTJS_BASE_URL = process.env.NEXTJS_BASE_URL || "";
const CACHE_SECRET = process.env.CACHE_SECRET || "";

// URL de la Cloud Function cache (ex: https://us-central1-site-surprisez-vous.cloudfunctions.net/cacheData)
const CACHE_CF_URL = process.env.CACHE_CF_URL || "";

async function invalidateCF(collection) {
  if (!CACHE_CF_URL) return;
  try {
    await fetch(`${CACHE_CF_URL}/data/invalidate`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${CACHE_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({ collection }),
    });
    console.log(`[cache] invalidation ${collection} OK`);
  } catch (e) {
    console.warn(`[cache] invalidation ${collection} failed: ${e.message}`);
  }
}

/** Purge les entrées unstable_cache de Next.js identifiées par leurs tags. */
async function callRevalidate(tags) {
  if (!NEXTJS_BASE_URL || !tags.length) return;
  try {
    await fetch(`${NEXTJS_BASE_URL}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags, secret: CACHE_SECRET }),
    });
    console.log(`[cache] revalidation ${tags.join(", ")} OK`);
  } catch (e) {
    console.warn(`[cache] revalidation ${tags.join(", ")} failed: ${e.message}`);
  }
}

/**
 * Récupère une collection depuis le cache Next.js plutôt que depuis Firestore.
 * idField : champ de l'objet à utiliser comme clé du Map.
 * idTransform : transformation optionnelle de la clé (ex. remplacer / par __).
 * Si le cache est indisponible ou non configuré, bascule sur readCollectionMap.
 */
async function fetchCacheMap(collection, idField, idTransform) {
  if (!NEXTJS_BASE_URL || !CACHE_SECRET) {
    console.warn(`[cache] NEXTJS_BASE_URL ou CACHE_SECRET manquant, fallback Firestore pour ${collection}`);
    return readCollectionMap(collection);
  }
  try {
    const url = `${NEXTJS_BASE_URL}/api/cache/${collection}?secret=${CACHE_SECRET}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const map = new Map();
    for (const item of data) {
      const key = idTransform ? idTransform(item[idField]) : item[idField];
      if (key != null) map.set(key, item);
    }
    console.log(`[cache] ${collection}: ${map.size} entrées depuis le cache Next.js`);
    return map;
  } catch (e) {
    console.warn(`[cache] Erreur ${collection}: ${e.message}, fallback Firestore`);
    return readCollectionMap(collection);
  }
}

/**
 * Met à jour uniquement les items modifiés dans le cache Next.js (patch partiel).
 * Aucun rechargement depuis Firestore — le cache est mis à jour en place.
 */
async function callCachePatch(collection, items, extra = {}) {
  if (!NEXTJS_BASE_URL || !CACHE_SECRET || items.length === 0) return;
  try {
    await fetch(`${NEXTJS_BASE_URL}/api/cache/patch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collection, items, secret: CACHE_SECRET, ...extra }),
    });
    console.log(`[cache-patch] ${collection}: ${items.length} entrées mises à jour`);
  } catch (e) {
    console.warn(`[cache-patch] Erreur: ${e.message}`);
  }
}

/**
 * Récupère les lignes tarifaires d'une grille depuis le cache Next.js.
 * Fallback sur Firestore si le cache est indisponible.
 */
async function fetchTarifLinesMap(gridId) {
  if (!NEXTJS_BASE_URL || !CACHE_SECRET) {
    return readSubCollectionMap("tarifs", gridId, "lignes");
  }
  try {
    const url = `${NEXTJS_BASE_URL}/api/cache/tarif-lines?gridId=${encodeURIComponent(gridId)}&secret=${CACHE_SECRET}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const map = new Map();
    for (const line of data) {
      const key = line.ref.replace(/\//g, "__");
      map.set(key, line);
    }
    console.log(`[cache] tarif-lines/${gridId}: ${map.size} lignes depuis le cache Next.js`);
    return map;
  } catch (e) {
    console.warn(`[cache] Erreur tarif-lines/${gridId}: ${e.message}, fallback Firestore`);
    return readSubCollectionMap("tarifs", gridId, "lignes");
  }
}

/**
 * Parse un nombre au format français (virgule décimale) vers un Number.
 */
function parseFrenchNumber(value) {
  if (value == null) return 0;
  const str = value.toString().trim().replace(",", ".");
  return Number(str) || 0;
}

/**
 * Mappe une ligne brute du CSV vers notre format produit normalisé.
 */
function mapCsvRow(row, seuil) {
  const stockPhysique = parseFrenchNumber(row.STK_STK_QTE_PHYSIQUE_UB);
  const prixBase = parseFrenchNumber(row.TVV_TVV_PRIX_BASE);
  const prixCoef = parseFrenchNumber(row.TVV_TVV_PRIX_COEF_VENTE);
  const prixVente = prixBase && prixCoef ? Math.round(prixBase * prixCoef * 100) / 100 : 0;

  return {
    pdt_reference: (row.PDT_PDT_REFERENCE || "").toString().trim(),
    pdt_designation: (row.PDT_PDT_DESIGNATION || "").toString().trim(),
    pdt_ean: (row.PDT_PDT_CODE_EAN || "").toString().trim(),
    pdt_code_stat: (row.PDT_PDT_CODE_STAT || "").toString().trim(),
    pdt_etat: (row.PDT_PDT_ETAT_ID || "").toString().trim().toUpperCase(),
    stock_physique: stockPhysique,
    gpv_reference: (row.GPV_GPV_REFERENCE || "").toString().trim(),
    prix_type: (row.TVV_TVV_PRIX_TYPE || "").toString().trim(),
    prix_base: prixBase,
    prix_coef_vente: prixCoef,
    prix_vente: prixVente,
    en_rupture: stockPhysique <= 0,
    stock_faible: stockPhysique > 0 && stockPhysique <= seuil,
  };
}

/**
 * Filtre les articles : exclut ZFB, supprimés (S) et bloqués (B).
 */
function filtrerArticlesVisibles(products) {
  return products.filter((p) => {
    if (!p.pdt_reference) return false;
    if (p.pdt_reference.toUpperCase().startsWith("ZFB")) return false;
    if (p.pdt_etat === "S" || p.pdt_etat === "B") return false;
    return true;
  });
}

/**
 * Répare le mojibake classique (texte UTF-8 relu en Latin-1) : "SystÃ¨me" → "Système".
 * Ne touche qu'aux chaînes contenant une séquence typique pour ne pas abîmer le texte sain.
 */
function fixMojibake(str) {
  if (typeof str !== "string") return str;
  let suspect = false;
  for (let i = 0; i < str.length - 1; i++) {
    const c = str.charCodeAt(i);
    const n = str.charCodeAt(i + 1);
    if ((c === 0xc3 || c === 0xc2) && n >= 0x80 && n <= 0xbf) { suspect = true; break; }
  }
  if (!suspect) return str;
  try {
    const repaired = Buffer.from(str, "latin1").toString("utf8");
    return repaired.includes("�") ? str : repaired;
  } catch {
    return str;
  }
}

/**
 * Lit un fichier CSV depuis Google Drive et retourne un tableau d'objets.
 * Gère automatiquement le séparateur (; ou ,), le trim et la réparation d'encodage.
 */
async function lireCsvDrive(fileId) {
  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "text" }
  );

  const csvText = response.data;
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
    transform: (value) => (typeof value === "string" ? fixMojibake(value.trim()) : value),
  });

  if (parsed.errors.length > 0) {
    console.warn("Avertissements CSV :", parsed.errors.slice(0, 5));
  }

  return parsed.data;
}

function setCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// ===== Vérifier les ruptures depuis Google Sheets =====
exports.verifierRuptures = functions.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "A:A",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      res.status(200).json([]);
      return;
    }

    const listeRuptures = rows
      .map((row) => row[0])
      .filter((ref) => ref !== undefined && ref !== "");

    res.status(200).json(listeRuptures);
  } catch (error) {
    console.error("Erreur de lecture Sheets :", error);
    res.status(500).send("Impossible de lire la feuille des ruptures.");
  }
});

// ===== Sync catalogue Google Drive → Firestore (HTTP callable) =====
exports.syncCatalog = functions.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const result = await syncCatalogToFirestore();
    await invalidateCF("products");
    res.status(200).json(result);
  } catch (error) {
    console.error("Erreur syncCatalog :", error);
    res.status(500).send("Erreur lors de la synchronisation du catalogue.");
  }
});

// ===== Sync quotidienne planifiée (chaque nuit à 3h, heure de Paris) =====
exports.syncQuotidien = onSchedule(
  { schedule: "0 3 * * *", timeZone: "Europe/Paris" },
  async () => {
    console.log("Sync quotidienne démarrée.");
    try {
      const result = await syncDossierCsvToFirestore();
      console.log("Sync quotidienne terminée :", JSON.stringify(result));
    } catch (err) {
      console.error("Erreur sync quotidienne :", err);
    }
  }
);

// ===== Logique partagée de synchronisation =====
async function syncCatalogToFirestore() {
  // 1. Lire le seuil stock faible depuis Firestore
  const seuil = await getSeuilStockFaible();

  // 2. Lire le catalogue CSV depuis Google Drive
  const rawRows = await lireCsvDrive(CSV_FILE_ID);

  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    throw new Error("Le fichier CSV Drive est vide ou invalide.");
  }

  // 3. Mapper et filtrer (ZFB, supprimés, bloqués)
  const mapped = rawRows.map((row) => mapCsvRow(row, seuil));
  const filtered = filtrerArticlesVisibles(mapped);

  console.log("syncCatalog debug:", {
    rawRows: rawRows.length,
    colonnes: rawRows.length > 0 ? Object.keys(rawRows[0]) : [],
    mapped: mapped.length,
    exempleMappe: mapped.length > 0 ? mapped[0] : null,
    filtered: filtered.length,
  });

  // 3. Écrire dans Firestore par batch (limite 500 opérations)
  let batch = db.batch();
  let count = 0;

  for (const product of filtered) {
    const docId = product.pdt_reference.replace(/\//g, "__");
    const ref = db.collection("products").doc(docId);
    batch.set(
      ref,
      {
        ...product,
        derniere_sync: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    count++;

    if (count % 450 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }

  if (count % 450 !== 0) {
    await batch.commit();
  }

  const ruptureCount = filtered.filter((p) => p.en_rupture).length;

  return {
    success: true,
    synced: count,
    ruptures: ruptureCount,
    timestamp: new Date().toISOString(),
    debug: {
      rawRows: rawRows.length,
      colonnes: rawRows.length > 0 ? Object.keys(rawRows[0]) : [],
      mapped: mapped.length,
      exempleMappe: mapped.length > 0 ? mapped[0] : null,
      filtered: filtered.length,
    },
  };
}

// ===== Liste les fichiers CSV d'un dossier Drive (avec date de modification) =====
async function listerFichiersDossier(folderId) {
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, modifiedTime)",
    orderBy: "name",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });
  return response.data.files || [];
}

const PRODUCT_SYNC_FIELDS = [
  "pdt_designation", "pdt_ean", "pdt_code_stat", "pdt_etat",
  "quantite_colisage", "marque", "stock_physique", "en_rupture", "stock_faible",
  "gpv_reference", "prix_base", "prix_coef_vente", "prix_vente",
];

// ===== Sync Articles_Final.csv -> collection "products" =====
async function syncArticlesCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Articles_Final.csv est vide ou invalide.");
  }

  const filtered = rows.filter((row) => {
    if (!row.pdt_reference) return false;
    const etat = (row.pdt_etat || "").toString().toUpperCase();
    if (etat === "S" || etat === "B") return false;
    return true;
  });

  const existingMap = await fetchCacheMap("products", "pdt_reference", (id) => id.replace(/\//g, "__"));

  let batch = db.batch();
  let ops = 0, nouveau = 0, modifie = 0, inchange = 0;
  const marquesVues = new Map();
  const changedProducts = [];

  for (const row of filtered) {
    const docId = row.pdt_reference.toString().replace(/\//g, "__");
    const marque = (row.marque || "").toString().trim();
    const prixBase = parseFrenchNumber(row.prix_base);
    const prixCoef = parseFrenchNumber(row.prix_coef_vente);
    const prixVente = prixBase && prixCoef ? Math.round(prixBase * prixCoef * 100) / 100 : 0;
    const stockPhysique = parseFrenchNumber(row.stock_physique);

    const incoming = {
      pdt_reference: row.pdt_reference.toString().trim(),
      pdt_designation: (row.pdt_designation || "").toString().trim(),
      pdt_ean: (row.pdt_ean || "").toString().trim(),
      pdt_code_stat: (row.pdt_code_stat || "").toString().trim(),
      pdt_etat: (row.pdt_etat || "G").toString().trim().toUpperCase(),
      quantite_colisage: parseInt(row.quantite_colisage) || 0,
      marque,
      stock_physique: stockPhysique,
      en_rupture: stockPhysique <= 0,
      stock_faible: stockPhysique > 0 && stockPhysique <= SEUIL_STOCK_FAIBLE,
      gpv_reference: (row.gpv_reference || "").toString().trim(),
      prix_base: prixBase,
      prix_coef_vente: prixCoef,
      prix_vente: prixVente,
    };

    const existing = existingMap.get(docId);
    if (!fieldsChanged(existing, incoming, PRODUCT_SYNC_FIELDS)) {
      inchange++;
    } else {
      batch.set(
        db.collection("products").doc(docId),
        { ...incoming, derniere_sync: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      changedProducts.push(incoming);
      if (existing) modifie++; else nouveau++;
      ops++;
      if (ops % 450 === 0) { await batch.commit(); batch = db.batch(); }
    }

    if (marque) marquesVues.set(marque.toLowerCase(), marque);
  }

  if (ops % 450 !== 0) await batch.commit();
  await callCachePatch("products", changedProducts);

  // Upsert des marques extraites (sans écraser logo_url, description, licence, actif)
  let marquesCount = 0;
  let marquesBatch = db.batch();
  for (const [id, nom] of marquesVues) {
    const ref = db.collection("marques").doc(id);
    marquesBatch.set(ref, { nom }, { merge: true });
    marquesCount++;
  }
  if (marquesCount > 0) await marquesBatch.commit();

  // Sync automatique des ruptures depuis le stock
  const rupturesResult = await syncRupturesDepuisStock(filtered);

  return {
    nouveau,
    modifie,
    inchange,
    total: rows.length,
    filtres: rows.length - filtered.length,
    marques_synced: marquesCount,
    ruptures: rupturesResult,
  };
}

// ===== Gestion automatique des ruptures depuis le stock =====
async function syncRupturesDepuisStock(products) {
  const today = new Date().toISOString().slice(0, 10);

  // Séparer les produits en rupture et les produits revenus en stock
  const enRupture = new Map(); // docId → product
  const enStock = new Set();   // docIds des produits avec stock > 0

  for (const p of products) {
    const docId = p.pdt_reference.toString().replace(/\//g, "__");
    if (p.stock_physique <= 0) {
      enRupture.set(docId, p);
    } else {
      enStock.add(docId);
    }
  }

  // Lire uniquement les ruptures actuellement "en_rupture" (au lieu de toute la collection)
  const rupSnap = await db.collection("ruptures").where("statut", "==", "en_rupture").get();
  const existingEnRupture = new Set(rupSnap.docs.map((d) => d.id));

  let batch = db.batch();
  let nouvelles = 0;
  let retablies = 0;

  // Nouveaux produits en rupture (pas encore dans la collection)
  for (const [docId, p] of enRupture) {
    if (!existingEnRupture.has(docId)) {
      batch.set(db.collection("ruptures").doc(docId), {
        ref_produit: p.pdt_reference,
        designation: p.pdt_designation || "",
        date_rupture: today,
        date_retour_prevue: null,
        statut: "en_rupture",
        commentaire: "",
      }, { merge: true });
      nouvelles++;
    }
  }

  // Produits revenus en stock : marquer rétabli
  for (const doc of rupSnap.docs) {
    if (enStock.has(doc.id)) {
      batch.set(db.collection("ruptures").doc(doc.id), { statut: "retabli" }, { merge: true });
      retablies++;
    }
  }

  await batch.commit();
  return { nouvelles, retablies };
}

const STAT_SYNC_FIELDS = ["designation", "niveau", "parent"];

// ===== Sync StatCategories_Final.csv -> collection "stat-categories" =====
async function syncStatCategoriesCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("StatCategories_Final.csv est vide ou invalide.");
  }

  const existingMap = await fetchCacheMap("stat-categories", "code");
  let batch = db.batch();
  let ops = 0, nouveau = 0, modifie = 0, inchange = 0;
  const changedStats = [];

  for (const row of rows) {
    const code = (row.code || "").toString().trim().toUpperCase();
    const designation = (row.designation || "").toString().trim();
    const niveau = (row.niveau || "").toString().trim().toLowerCase();
    if (!code) continue;

    const parent = niveau === "1" ? null
      : niveau === "2" ? code.slice(0, 2)
      : code.slice(0, 4);

    const incoming = { designation, niveau, parent };
    const existing = existingMap.get(code);

    if (!fieldsChanged(existing, incoming, STAT_SYNC_FIELDS)) { inchange++; continue; }

    batch.set(db.collection("stat-categories").doc(code), incoming, { merge: true });
    changedStats.push({ code, ...incoming });
    if (existing) modifie++; else nouveau++;
    ops++;
    if (ops % 450 === 0) { await batch.commit(); batch = db.batch(); }
  }

  if (ops % 450 !== 0) await batch.commit();
  await callCachePatch("stat-categories", changedStats);
  return { nouveau, modifie, inchange };
}

const CLIENT_SYNC_FIELDS = [
  "raison_soc", "enseigne", "siret", "num_tva", "tpe_client",
  "email", "tel", "fax", "nom_gerant", "prenom_gerant",
  "nom_ach", "prenom_ach", "adr", "cp", "ville", "pays",
  "profil_id", "groupe_contact_id", "commentaire", "raison_desactive",
  "statut",
];

// Champs comparés pour le format ERP natif (CLT_*) : on retire profil_id et groupe_contact_id,
// absents du CSV et posés en back-office -> merge:true doit les préserver.
const CLIENT_ERP_SYNC_FIELDS = CLIENT_SYNC_FIELDS.filter(
  (f) => f !== "profil_id" && f !== "groupe_contact_id"
);

// Normalise un n° de téléphone français dont le 0 initial a sauté (export en numérique).
function normalizeTelFr(value) {
  const s = (value || "").toString().trim();
  return /^\d{9}$/.test(s) ? "0" + s : s;
}

// Charge les jointures adresses (CAL) + contacts (CCT) depuis le dossier Drive.
async function chargerJointuresClients() {
  const fichiers = await listerFichiersDossier(DRIVE_FOLDER_ID);
  const trouver = (nom) => fichiers.find((f) => f.name === nom);

  const adresseParCalId = new Map();
  const fAdr = trouver("EXP_ADRESSES_1165.CSV");
  if (fAdr) {
    for (const r of await lireCsvDrive(fAdr.id)) {
      const calId = (r.CAL_CAL_ID || "").toString().trim();
      if (!calId) continue;
      const adr = [r.CAL_CAL_ADR_ADR_VOIE_NUM, r.CAL_CAL_ADR_ADR_VOIE_TYPE, r.CAL_CAL_ADR_ADR_VOIE_LIBELLE]
        .map((v) => (v || "").toString().trim()).filter(Boolean).join(" ");
      adresseParCalId.set(calId, {
        adr,
        cp: (r.CAL_CAL_ADR_ADR_CODE_POSTAL || "").toString().trim(),
        ville: (r.CAL_CAL_ADR_ADR_COMMUNE || "").toString().trim(),
        pays: (r.CAL_CAL_ADR_ADR_PAYS || "").toString().trim(),
        lat: (r.CAL_CAL_ADR_ADR_LATITUDE || "").toString().trim(),
        lng: (r.CAL_CAL_ADR_ADR_LONGITUDE || "").toString().trim(),
      });
    }
  }

  const contactParCctId = new Map();
  const contactsParClient = new Map();
  const fCct = trouver("EXP_CONTACTS_1165.CSV");
  if (fCct) {
    for (const r of await lireCsvDrive(fCct.id)) {
      const c = {
        nom: (r.CCT_CCT_CONTACT_CTT_NOM || "").toString().trim(),
        prenom: (r.CCT_CCT_CONTACT_CTT_PRENOM || "").toString().trim(),
        tel: normalizeTelFr(r.CCT_CCT_CONTACT_CTT_TEL),
        portable: normalizeTelFr(r.CCT_CCT_CONTACT_CTT_PORTABLE),
        fax: normalizeTelFr(r.CCT_CCT_CONTACT_CTT_FAX),
        email: (r.CCT_CCT_CONTACT_CTT_EMAIL || "").toString().trim(),
        gestion: (r.CCT_CCT_GESTION || "").toString().trim() === "1",
        achat: (r.CCT_CCT_ACHAT || "").toString().trim() === "1",
      };
      const cctId = (r.CCT_CCT_ID || "").toString().trim();
      const cltId = (r.CCT_CCT_CLT_ID || "").toString().trim();
      if (cctId) contactParCctId.set(cctId, c);
      if (cltId) {
        if (!contactsParClient.has(cltId)) contactsParClient.set(cltId, []);
        contactsParClient.get(cltId).push(c);
      }
    }
  }

  return { adresseParCalId, contactParCctId, contactsParClient };
}

// Mappe une ligne du format ERP natif (CLT_*) vers une fiche client, jointures CAL + CCT incluses.
function mapClientErp(row, joints) {
  const id = (row.CLT_CLT_ID || "").toString().trim();
  if (!id) return null;

  // Exclut les comptes internes ERP (A = interne, TIC = ticket/devis) : pas des revendeurs.
  const type = (row.CLT_CLT_TYPE || "").toString().trim().toUpperCase();
  if (type === "A" || type === "TIC") return null;

  const calId = (row.CLT_CLT_ADR_SOC_CAL_ID || "").toString().trim();
  const cctId = (row.CLT_CLT_CONTACT_COM_CCT_ID || "").toString().trim();
  const adresse = joints.adresseParCalId.get(calId) || {};
  const contactsClient = joints.contactsParClient.get(id) || [];
  const principal = joints.contactParCctId.get(cctId) || {};

  const gerant = contactsClient.find((c) => c.gestion) || {};
  const acheteur = contactsClient.find((c) => c.achat) || principal;
  // Contact de référence (tél/fax) : le contact commercial lié, sinon l'acheteur.
  const ref = (principal.nom || principal.email || principal.tel) ? principal : acheteur;

  const etat = (row.CLT_CLT_ETAT_ID || "").toString().trim().toUpperCase();
  const actif = etat === "" || etat === "O";

  const incoming = {
    erp_id: id,
    raison_soc: (row.CLT_CLT_REFERENCE || "").toString().trim(),
    enseigne: (row.CLT_CLT_NOM || "").toString().trim(),
    siret: (row.CLT_CLT_SOC_SIRET || "").toString().trim(),
    num_tva: (row.CLT_CLT_SOC_TVA_INTRACOM || "").toString().trim(),
    tpe_client: (row.CLT_CLT_TYPE || "").toString().trim(),
    email: (principal.email || acheteur.email || gerant.email || row.CLT_CLT_COM_AR_EMAIL || "").toString().trim(),
    tel: ref.tel || ref.portable || "",
    fax: ref.fax || "",
    nom_gerant: gerant.nom || "",
    prenom_gerant: gerant.prenom || "",
    nom_ach: acheteur.nom || "",
    prenom_ach: acheteur.prenom || "",
    adr: adresse.adr || "",
    cp: adresse.cp || "",
    ville: adresse.ville || "",
    pays: adresse.pays || "",
    commentaire: (row.CLT_CLT_COM_NOTES_CONSULTABLE || "").toString().trim(),
    raison_desactive: actif ? "" : etat,
    statut: actif ? "Valide" : "Refuse",
  };

  // Bonus carte revendeurs : lat/lng (merge profond -> n'écrase pas le reste de `revendeur`).
  if (adresse.lat || adresse.lng) {
    incoming.revendeur = { lat: adresse.lat, lng: adresse.lng };
  }

  return incoming;
}

// Mappe une ligne de l'ancien format à noms conviviaux (Clients_Final.csv).
function mapClientAncien(row) {
  const id = (row.clientid || "").toString().trim();
  if (!id) return null;
  return {
    erp_id: id,
    raison_soc: (row.raison_soc || "").toString().trim(),
    enseigne: (row.enseigne || "").toString().trim(),
    siret: (row.siret || "").toString().trim(),
    num_tva: (row.numtva || "").toString().trim(),
    tpe_client: (row.tpe_client || "").toString().trim(),
    email: (row.email || "").toString().trim(),
    tel: (row.tel || "").toString().trim(),
    fax: (row.fax || "").toString().trim(),
    nom_gerant: (row.nom_gerant || "").toString().trim(),
    prenom_gerant: (row.prenom_gerant || "").toString().trim(),
    nom_ach: (row.nom_ach || "").toString().trim(),
    prenom_ach: (row.prenom_ach || "").toString().trim(),
    adr: (row.adr || "").toString().trim(),
    cp: (row.cp || "").toString().trim(),
    ville: (row.ville || "").toString().trim(),
    pays: (row.pays || "").toString().trim(),
    profil_id: (row.profilid || "").toString().trim(),
    groupe_contact_id: (row.grpconid || "").toString().trim(),
    commentaire: (row.commentaire || "").toString().trim(),
    raison_desactive: (row.raison_desactive || "").toString().trim(),
    statut: row.raison_desactive ? "Refuse" : "Valide",
  };
}

// ===== Sync clients : EXP_CLIENTS_1165.CSV (format CLT_* + jointures) ou ancien Clients_Final.csv =====
async function syncClientsCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Fichier clients vide ou invalide.");
  }

  const estFormatErp = Object.prototype.hasOwnProperty.call(rows[0], "CLT_CLT_ID");
  let incomingList;
  if (estFormatErp) {
    const joints = await chargerJointuresClients();
    incomingList = rows.map((r) => mapClientErp(r, joints)).filter(Boolean);
  } else {
    incomingList = rows.map(mapClientAncien).filter(Boolean);
  }
  const champs = estFormatErp ? CLIENT_ERP_SYNC_FIELDS : CLIENT_SYNC_FIELDS;

  const existingMap = await fetchCacheMap("clients", "id");
  let batch = db.batch();
  let ops = 0, nouveau = 0, modifie = 0, inchange = 0;
  const changedClients = [];

  for (const incoming of incomingList) {
    const id = incoming.erp_id;
    const existing = existingMap.get(id);
    if (!fieldsChanged(existing, incoming, champs)) { inchange++; continue; }

    batch.set(db.collection("clients").doc(id), { ...incoming, derniere_sync: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    changedClients.push({ id, ...incoming });
    if (existing) modifie++; else nouveau++;
    ops++;
    if (ops % 450 === 0) { await batch.commit(); batch = db.batch(); }
  }

  if (ops % 450 !== 0) await batch.commit();
  await callCachePatch("clients", changedClients);
  return { nouveau, modifie, inchange };
}

const COMMANDE_SYNC_FIELDS = [
  "clt_id", "reference", "date", "date_demande", "date_expedition", "date_validation",
  "etat", "type_saisie", "notes", "notes_imprimable", "client_nom",
  "adr_liv_destinataire", "adr_liv_voie", "adr_liv_cp", "adr_liv_commune", "adr_liv_pays",
  "prix_ht", "prix_tva", "prix_ttc", "poids_total", "mode_paiement", "delai_paiement",
];

// ===== Sync EXP_COMMANDES_1165.CSV -> collection "commandes" =====
async function syncCommandesCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("EXP_COMMANDES_1165.CSV est vide ou invalide.");
  }

  const existingMap = await readCollectionMap("commandes");
  let batch = db.batch();
  let ops = 0, nouveau = 0, modifie = 0, inchange = 0;

  for (const row of rows) {
    const id = (row.CMD_CMD_ID || "").toString().trim();
    const cltId = (row.CMD_CLT_ID || "").toString().trim();
    if (!id || !cltId) continue;

    const incoming = {
      clt_id: cltId,
      reference: (row.CMD_CMD_REFERENCE || "").toString().trim(),
      date: (row.CMD_CMD_DATE || "").toString().trim(),
      date_demande: (row.CMD_CMD_DATE_DEMANDE || "").toString().trim(),
      date_expedition: (row.CMD_CMD_DATE_EXPEDITION || "").toString().trim(),
      date_validation: (row.CMD_CMD_DATE_VALIDATION || "").toString().trim(),
      etat: (row.CMD_CMD_ETAT_ID || "").toString().trim(),
      type_saisie: (row.CMD_CMD_TYPE_SAISIE || "").toString().trim(),
      notes: (row.CMD_CMD_NOTES || "").toString().trim(),
      notes_imprimable: (row.CMD_CMD_NOTES_IMPRIMABLE || "").toString().trim(),
      client_nom: (row.CMD_CLT_NOM || "").toString().trim(),
      adr_liv_destinataire: (row.CMD_CLT_ADR_LIVRAISON_ADR_DEST || "").toString().trim(),
      adr_liv_voie: (row.CMD_CLT_ADR_LIVRAISON_ADR_VO_2 || "").toString().trim(),
      adr_liv_cp: (row.CMD_CLT_ADR_LIVRAISON_ADR_CODE || "").toString().trim(),
      adr_liv_commune: (row.CMD_CLT_ADR_LIVRAISON_ADR_COMM || "").toString().trim(),
      adr_liv_pays: (row.CMD_CLT_ADR_LIVRAISON_ADR_PAYS || "").toString().trim(),
      prix_ht: parseFloat((row.CMD_CMD_PRIX_HT || "0").toString().replace(",", ".")) || 0,
      prix_tva: parseFloat((row.CMD_CMD_PRIX_TVA || "0").toString().replace(",", ".")) || 0,
      prix_ttc: parseFloat((row.CMD_CMD_PRIX_TTC || "0").toString().replace(",", ".")) || 0,
      poids_total: parseFloat((row.CMD_CMD_POIDS_TOTAL || "0").toString().replace(",", ".")) || 0,
      mode_paiement: (row.CMD_CLT_FAC_MODE_PAIEMENT || "").toString().trim(),
      delai_paiement: parseInt(row.CMD_CLT_FAC_DELAI_PAIEMENT) || 0,
    };

    const existing = existingMap.get(id);
    if (!fieldsChanged(existing, incoming, COMMANDE_SYNC_FIELDS)) { inchange++; continue; }

    batch.set(db.collection("commandes").doc(id), { ...incoming, derniere_sync: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    if (existing) modifie++; else nouveau++;
    ops++;
    if (ops % 450 === 0) { await batch.commit(); batch = db.batch(); }
  }

  if (ops % 450 !== 0) await batch.commit();
  await invalidateCF("commandes");
  return { nouveau, modifie, inchange };
}

// ===== Handlers par nom de fichier CSV =====
// Clés = nom exact du fichier dans le dossier Drive (sensible à la casse)
// ===== Attributs produits : helpers de lecture du classeur =====
const ATTR_REGISTRE_FIELDS = ["libelle", "zone", "niveau", "type", "slots", "rendu", "ordre", "actif", "axe"];
const ATTR_VALEUR_FIELDS = ["attribut", "slug", "libelle", "hex", "parent", "ordre", "actif"];

const estOui = (v) => (v || "").toString().trim().toLowerCase() === "oui";
const entierOuNull = (v) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
};
/** Un slug n'est unique qu'à l'intérieur de son attribut (« or » couleur ≠ « oui » ignifugé). */
const attributValeurId = (attribut, slug) => `${attribut}__${slug}`.replace(/\//g, "_");

const FICHIERS_SYNC = {
  // --- Exports ERP (format PDT_PDT_*, CST_CST_*, etc.) ---
  "EXP_ARTICLES_1165.CSV": async (rows) => {
    const seuil = await getSeuilStockFaible();
    const mapped = rows.map((row) => mapCsvRow(row, seuil));
    const filtered = filtrerArticlesVisibles(mapped);
    const existingMap = await fetchCacheMap("products", "pdt_reference", (id) => id.replace(/\//g, "__"));
    let batch = db.batch();
    let ops = 0, nouveau = 0, modifie = 0, inchange = 0;
    const changedProducts = [];
    for (const product of filtered) {
      const docId = product.pdt_reference.replace(/\//g, "__");
      const existing = existingMap.get(docId);
      if (!fieldsChanged(existing, product, PRODUCT_SYNC_FIELDS)) { inchange++; continue; }
      batch.set(db.collection("products").doc(docId), { ...product, derniere_sync: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      changedProducts.push(product);
      if (existing) modifie++; else nouveau++;
      ops++;
      if (ops % 450 === 0) { await batch.commit(); batch = db.batch(); }
    }
    if (ops % 450 !== 0) await batch.commit();
    await callCachePatch("products", changedProducts);
    const rupturesResult = await syncRupturesDepuisStock(filtered);
    return { collection: "products", nouveau, modifie, inchange, ruptures: rupturesResult };
  },

  "EXP_STATS_1165.CSV": async (rows) => {
    const existingMap = await fetchCacheMap("stat-categories", "code");
    let batch = db.batch();
    let ops = 0, nouveau = 0, modifie = 0, inchange = 0;
    const changedStats = [];
    for (const row of rows) {
      const code = (row.CST_CST_ID || "").toString().trim().toUpperCase();
      const designation = (row.CST_CST_DESIGNATION || "").toString().trim();
      if (!code) continue;
      const niveauRaw = (row.CST_CST_NIVEAU || "").toString().trim().toUpperCase();
      const niveau = niveauRaw === "1" ? 1 : niveauRaw === "2" ? 2 : 3;
      const parent = niveau === 1 ? null : niveau === 2 ? code.slice(0, 2) : code.slice(0, 4);
      const incoming = { designation, niveau, parent };
      const existing = existingMap.get(code);
      if (!fieldsChanged(existing, incoming, STAT_SYNC_FIELDS)) { inchange++; continue; }
      batch.set(db.collection("stat-categories").doc(code), incoming, { merge: true });
      changedStats.push({ code, ...incoming });
      if (existing) modifie++; else nouveau++;
      ops++;
      if (ops % 450 === 0) { await batch.commit(); batch = db.batch(); }
    }
    if (ops % 450 !== 0) await batch.commit();
    await callCachePatch("stat-categories", changedStats);
    return { collection: "stat-categories", nouveau, modifie, inchange };
  },

  "EXP_TARIFS_1165.CSV": async (rows) => {
    return FICHIERS_SYNC["EXP_TARIF_1165.CSV"](rows);
  },

  "EXP_TARIF_1165.CSV": async (rows) => {
    const TARIF_FIELDS = ["prix_ht", "prix_coef_vente", "prix_vente"];
    const groups = new Map();
    for (const row of rows) {
      const profilId = (row.GPV_GPV_REFERENCE || "").toString().trim();
      const ref = (row.PDT_PDT_REFERENCE || "").toString().trim();
      if (!profilId || !ref) continue;
      if (!groups.has(profilId)) {
        groups.set(profilId, { designation: (row.GPV_GPV_DESIGNATION || profilId).toString().trim(), lines: [] });
      }
      const prixBase = parseFrenchNumber(row.TVV_TVV_PRIX_BASE);
      const prixCoef = parseFrenchNumber(row.TVV_TVV_PRIX_COEF_VENTE);
      const prixVente = prixBase && prixCoef ? Math.round(prixBase * prixCoef * 100) / 100 : 0;
      groups.get(profilId).lines.push({ ref, designation: "", prix_ht: prixBase, prix_coef_vente: prixCoef, prix_vente: prixVente, colisage: 1 });
    }
    let totalNouveau = 0, totalModifie = 0, totalInchange = 0;
    for (const [profilId, group] of groups) {
      const gridId = `erp_${profilId.toLowerCase()}`;
      await db.collection("tarifs").doc(gridId).set({
        nom: group.designation, profil_id: profilId,
        date_import: new Date().toISOString(),
        lignes_count: group.lines.length, statut: "active",
      }, { merge: true });
      // Pré-lecture des lignes existantes pour cette grille
      const existingLines = await fetchTarifLinesMap(gridId);
      let batch = db.batch(), ops = 0;
      const changedLines = [];
      for (const line of group.lines) {
        const docId = line.ref.replace(/\//g, "__");
        const existing = existingLines.get(docId);
        if (!fieldsChanged(existing, line, TARIF_FIELDS)) { totalInchange++; continue; }
        batch.set(db.collection("tarifs").doc(gridId).collection("lignes").doc(docId), line);
        changedLines.push(line);
        if (existing) totalModifie++; else totalNouveau++;
        ops++;
        if (ops % 450 === 0) { await batch.commit(); batch = db.batch(); }
      }
      if (ops % 450 !== 0) await batch.commit();
      await callCachePatch("tarif-lines", changedLines, { gridId });
    }
    return { collection: "tarifs", grids: groups.size, nouveau: totalNouveau, modifie: totalModifie, inchange: totalInchange };
  },

  // --- Anciens formats "Final" (compatibilité) ---
  "Articles_Final.csv": async (rows) => {
    const result = await syncArticlesCsv(rows);
    return { collection: "products", ...result };
  },
  "StatCategories_Final.csv": async (rows) => {
    const result = await syncStatCategoriesCsv(rows);
    return { collection: "stat-categories", ...result };
  },
  "EXP_COMMANDES_1165.CSV": async (rows) => {
    const result = await syncCommandesCsv(rows);
    return { collection: "commandes", ...result };
  },

  "EXP_CLIENTS_1165.CSV": async (rows) => {
    const result = await syncClientsCsv(rows);
    return { collection: "clients", ...result };
  },
  "Clients_Final.csv": async (rows) => {
    const result = await syncClientsCsv(rows);
    return { collection: "clients", ...result };
  },

  // Adresses (CAL) et Contacts (CCT) : pas de collection propre, ils sont lus en jointure
  // par syncClientsCsv directement depuis le Drive. Handlers no-op pour ne pas les voir "ignorés".
  "EXP_ADRESSES_1165.CSV": async () => ({ collection: "clients", note: "jointure adresses (fusionnée dans la sync clients)" }),
  "EXP_CONTACTS_1165.CSV": async () => ({ collection: "clients", note: "jointure contacts (fusionnée dans la sync clients)" }),

  "EXP_COLISAGE_1165.CSV": async (rows) => {
    const existingMap = await fetchCacheMap("products", "pdt_reference", (id) => id.replace(/\//g, "__"));
    const updates = [];
    const changedColisage = [];
    let count = 0, inchange = 0;
    for (const row of rows) {
      const ref = (row.PDT_PDT_REFERENCE || "").toString().trim();
      const docId = ref.replace(/\//g, "__");
      const qte = parseInt(row.PCO_PCO_QTE_UB) || 0;
      if (!ref || !qte) continue;
      const existing = existingMap.get(docId);
      if (existing && existing.quantite_colisage === qte) { inchange++; continue; }
      const docRef = db.collection("products").doc(docId);
      updates.push(docRef.update({ quantite_colisage: qte }).then(() => { count++; }).catch(() => {}));
      changedColisage.push({ pdt_reference: ref, quantite_colisage: qte });
    }
    await Promise.all(updates);
    await callCachePatch("products", changedColisage);
    return { collection: "products", modifie: count, inchange };
  },

  // --- Attributs produits (classeur Sheet_attribut) ---
  // Chaque feuille est exportée en CSV avec pour en-tête la ligne des clés techniques :
  // ligne 2 pour ATTRIBUTS et VALEURS, ligne 3 pour EXPORT (les lignes au-dessus sont
  // le titre et les libellés lisibles, à ne pas exporter).

  "SV_ATTRIBUTS.csv": async (rows) => {
    const existingMap = await readCollectionMap("attribute-registry");
    const vus = new Set();
    let batch = db.batch();
    let ops = 0, nouveau = 0, modifie = 0, inchange = 0;
    for (const row of rows) {
      const cle = (row.cle || "").toString().trim();
      const zone = (row.zone || "").toString().trim();
      // Les lignes de notes en bas de la feuille n'ont pas de zone : ce ne sont pas des attributs.
      if (!cle || !zone) continue;
      vus.add(cle);
      const incoming = {
        cle,
        libelle: (row.libelle || "").toString().trim(),
        zone,
        niveau: entierOuNull(row.niveau),
        type: (row.type || "").toString().trim(),
        slots: entierOuNull(row.slots) || 1,
        rendu: (row.rendu || "").toString().trim() || "case",
        ordre: entierOuNull(row.ordre) || 0,
        actif: estOui(row.actif),
        // Porte une variante : c'est cet attribut qui distingue les membres d'un groupe.
        axe: estOui(row.axe),
      };
      const existing = existingMap.get(cle);
      if (!fieldsChanged(existing, incoming, ATTR_REGISTRE_FIELDS)) { inchange++; continue; }
      batch.set(db.collection("attribute-registry").doc(cle), incoming, { merge: true });
      if (existing) modifie++; else nouveau++;
      ops++;
      if (ops % 450 === 0) { await batch.commit(); batch = db.batch(); }
    }

    // Le classeur est la source unique : un attribut retiré doit quitter la base, sinon il
    // survivrait indéfiniment. Un CSV vide est un export raté, pas une demande de purge.
    if (vus.size === 0) {
      throw new Error("SV_ATTRIBUTS.csv : aucune ligne exploitable — export interrompu ou mauvaise ligne d'en-tête");
    }
    let supprime = 0;
    for (const docId of existingMap.keys()) {
      if (vus.has(docId)) continue;
      batch.delete(db.collection("attribute-registry").doc(docId));
      supprime++;
      ops++;
      if (ops % 450 === 0) { await batch.commit(); batch = db.batch(); }
    }

    if (ops % 450 !== 0) await batch.commit();
    await callRevalidate(["attribute-registry"]);
    return { collection: "attribute-registry", nouveau, modifie, inchange, supprime };
  },

  "SV_VALEURS.csv": async (rows) => {
    const existingMap = await readCollectionMap("attribute-values");
    const vus = new Set();
    let batch = db.batch();
    let ops = 0, nouveau = 0, modifie = 0, inchange = 0;
    for (const row of rows) {
      const attribut = (row.attribut || "").toString().trim();
      const slug = (row.slug || "").toString().trim();
      if (!attribut || !slug) continue;
      const docId = attributValeurId(attribut, slug);
      vus.add(docId);
      const incoming = {
        attribut,
        slug,
        libelle: (row.libelle || "").toString().trim() || slug,
        // Stocké sans « # » : le site le rajoute (teinteDe). Le classeur accepte les deux.
        hex: (row.hex || "").toString().trim().toUpperCase().replace(/^#/, ""),
        parent: (row.parent || "").toString().trim(),
        ordre: entierOuNull(row.ordre) || 0,
        actif: estOui(row.actif),
      };
      const existing = existingMap.get(docId);
      if (!fieldsChanged(existing, incoming, ATTR_VALEUR_FIELDS)) { inchange++; continue; }
      batch.set(db.collection("attribute-values").doc(docId), incoming, { merge: true });
      if (existing) modifie++; else nouveau++;
      ops++;
      if (ops % 450 === 0) { await batch.commit(); batch = db.batch(); }
    }

    // Même règle que le registre : une valeur retirée du classeur disparaît du référentiel.
    if (vus.size === 0) {
      throw new Error("SV_VALEURS.csv : aucune ligne exploitable — export interrompu ou mauvaise ligne d'en-tête");
    }
    let supprime = 0;
    for (const docId of existingMap.keys()) {
      if (vus.has(docId)) continue;
      batch.delete(db.collection("attribute-values").doc(docId));
      supprime++;
      ops++;
      if (ops % 450 === 0) { await batch.commit(); batch = db.batch(); }
    }

    if (ops % 450 !== 0) await batch.commit();
    await callRevalidate(["attribute-values"]);
    return { collection: "attribute-values", nouveau, modifie, inchange, supprime };
  },

  "SV_PRODUITS.csv": async (rows) => {
    // Le registre dit quelles colonnes portent plusieurs valeurs (slots > 1),
    // donc lesquelles éclater sur « | ». Sans lui, impossible de savoir.
    const registre = await readCollectionMap("attribute-registry");
    if (registre.size === 0) {
      throw new Error("attribute-registry vide : synchroniser SV_ATTRIBUTS.csv avant SV_PRODUITS.csv");
    }
    const attributs = [...registre.values()];
    // Pas de libelle : la designation vient de l'ERP (pdt_designation), le classeur ne
    // la recopie pas. Les documents ecrits avant cette regle gardent le champ, sans effet.
    const champsCompares = ["statut", "description_courte", "seo_slug", ...attributs.map((a) => a.cle)];

    const existingMap = await readCollectionMap("product-attributes");
    const vus = new Set();
    let batch = db.batch();
    let ops = 0, nouveau = 0, modifie = 0, inchange = 0, ignore = 0;

    for (const row of rows) {
      const ref = (row.ref || "").toString().trim();
      if (!ref) continue;
      // Le classeur porte aussi des brouillons et des archives : seul « actif » est publié.
      if ((row.statut || "").toString().trim() !== "actif") { ignore++; continue; }
      const docId = ref.replace(/\//g, "__");
      vus.add(docId);

      const incoming = {
        ref,
        statut: "actif",
        description_courte: (row.description_courte || "").toString().trim(),
        seo_slug: (row.seo_slug || "").toString().trim(),
      };
      for (const attr of attributs) {
        // Le classeur repete la colonne par slot (« Univers 1 », « Univers 2 »)
        // et Papa Parse renomme les homonymes : univers, univers_1, univers_2.
        // Sans les relire tous, les slots au-dela du premier seraient perdus.
        const slots = attr.slots > 1 ? attr.slots : 1;
        const brut = [];
        for (let i = 0; i < slots; i++) {
          brut.push((row[i === 0 ? attr.cle : `${attr.cle}_${i}`] || "").toString().trim());
        }
        const valeurs = brut.join("|").split("|").map((s) => s.trim()).filter(Boolean);
        incoming[attr.cle] = attr.slots > 1 ? valeurs : (valeurs[0] || "");
      }

      const existing = existingMap.get(docId);
      const change = !existing || champsCompares.some((f) =>
        Array.isArray(incoming[f]) ? arrayChanged(existing[f], incoming[f]) : existing[f] !== incoming[f]
      );
      if (!change) { inchange++; continue; }
      batch.set(db.collection("product-attributes").doc(docId), incoming, { merge: true });
      if (existing) modifie++; else nouveau++;
      ops++;
      if (ops % 450 === 0) { await batch.commit(); batch = db.batch(); }
    }

    // Une référence repassée en brouillon ou retirée du classeur doit quitter la vitrine.
    let supprime = 0;
    for (const docId of existingMap.keys()) {
      if (vus.has(docId)) continue;
      batch.delete(db.collection("product-attributes").doc(docId));
      supprime++;
      ops++;
      if (ops % 450 === 0) { await batch.commit(); batch = db.batch(); }
    }

    if (ops % 450 !== 0) await batch.commit();
    await callRevalidate(["product-attributes"]);
    return { collection: "product-attributes", nouveau, modifie, inchange, supprime, ignore };
  },
};

// ===== Orchestrateur : lit tout le dossier Drive et sync =====
async function syncDossierCsvToFirestore() {
  const fichiers = await listerFichiersDossier(DRIVE_FOLDER_ID);
  const resultats = {};
  const ignores = [];
  const sautes = [];

  // Charger les dates de dernière sync réussie par fichier
  const metaRef = db.collection("settings").doc("sync-metadata");
  const metaSnap = await metaRef.get();
  const dernieresDates = metaSnap.exists ? (metaSnap.data().fichiers || {}) : {};
  const nouvellesDates = { ...dernieresDates };

  for (const fichier of fichiers) {
    const handler = FICHIERS_SYNC[fichier.name];
    if (!handler) {
      ignores.push(fichier.name);
      continue;
    }

    // Si le fichier Drive n'a pas été modifié depuis la dernière sync réussie, on saute
    if (fichier.modifiedTime && dernieresDates[fichier.name] === fichier.modifiedTime) {
      console.log(`Ignoré (inchangé) : ${fichier.name}`);
      sautes.push(fichier.name);
      continue;
    }

    console.log(`Sync ${fichier.name}...`);
    const rows = await lireCsvDrive(fichier.id);
    resultats[fichier.name] = await handler(rows);

    // Mémoriser la date de modification Drive après sync réussie
    if (fichier.modifiedTime) {
      nouvellesDates[fichier.name] = fichier.modifiedTime;
    }
  }

  // Persister les nouvelles dates (merge pour ne pas écraser d'autres champs)
  await metaRef.set({ fichiers: nouvellesDates, derniere_sync: new Date().toISOString() }, { merge: true });

  // Invalider le cache CF pour toutes les collections potentiellement modifiées
  await Promise.all([
    invalidateCF("products"),
    invalidateCF("stat-categories"),
    invalidateCF("tarif-lines"),
    invalidateCF("clients"),
    invalidateCF("orders"),
  ]);

  return {
    success: true,
    resultats,
    ignores,
    sautes,
    timestamp: new Date().toISOString(),
  };
}

// ===== Sync Catalogues (dossier Drive "catalogue/") → Firestore =====
// ===== Helpers catalogue =====

async function getCatalogueFolder() {
  const foldersResp = await drive.files.list({
    q: `'${DRIVE_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });
  const folder = (foldersResp.data.files || []).find((f) => f.name.toLowerCase() === "catalogue");
  if (!folder) throw new Error("Sous-dossier 'catalogue' introuvable dans le dossier Drive.");
  const fichiers = await listerFichiersDossier(folder.id);
  return fichiers;
}

const CATALOGUE_META_FIELDS = ["cat_reference", "cat_designation", "cat_mode", "cat_permanent"];

async function stepSyncCataloguesMeta(fichiers) {
  const f = fichiers.find((f) => f.name.toLowerCase() === "catalogues.csv");
  if (!f) throw new Error("catalogues.csv introuvable.");
  const rows = await lireCsvDrive(f.id);
  const existingMap = await fetchCacheMap("catalogues", "id");
  let batch = db.batch(), ops = 0, nouveau = 0, modifie = 0, inchange = 0;
  const changedCatalogues = [];
  for (const row of rows) {
    const catId = parseInt(row.cat_id);
    if (!catId) continue;
    const incoming = {
      cat_id: catId,
      cat_reference: (row.cat_reference || "").trim(),
      cat_designation: (row.cat_designation || row.cat_style || "").trim(),
      cat_mode: (row.cat_mode || "STD").trim(),
      cat_permanent: row.cat_permanent === "1" || row.cat_permanent === 1,
    };
    const existing = existingMap.get(String(catId));
    if (!fieldsChanged(existing, incoming, CATALOGUE_META_FIELDS)) { inchange++; continue; }
    batch.set(db.collection("catalogues").doc(String(catId)), incoming, { merge: true });
    changedCatalogues.push({ id: String(catId), ...incoming });
    if (existing) modifie++; else nouveau++;
    if (++ops >= 450) { await batch.commit(); batch = db.batch(); ops = 0; }
  }
  if (ops > 0) await batch.commit();
  await callCachePatch("catalogues", changedCatalogues);
  return { nouveau, modifie, inchange };
}

async function stepSyncClientCatalogues(fichiers) {
  const f = fichiers.find((f) => f.name.toLowerCase() === "client_catalogue.csv");
  if (!f) throw new Error("client_catalogue.csv introuvable.");
  const rows = await lireCsvDrive(f.id);
  const clientCatMap = new Map();
  for (const row of rows) {
    const catId = parseInt(row.ccc_cat_id);
    const cltId = String(row.ccc_clt_id || "").trim();
    if (!catId || !cltId) continue;
    if (!clientCatMap.has(cltId)) clientCatMap.set(cltId, new Set());
    clientCatMap.get(cltId).add(catId);
  }
  const clientsMap = await fetchCacheMap("clients", "id");
  let batch = db.batch(), ops = 0, modifie = 0, inchange = 0;
  const changedClientCats = [];
  for (const [clientId, data] of clientsMap) {
    const erpId = String(data.erp_id || clientId).trim();
    if (!clientCatMap.has(erpId)) continue;
    const newCatIds = Array.from(clientCatMap.get(erpId));
    if (!arrayChanged(data.cat_ids, newCatIds)) { inchange++; continue; }
    batch.update(db.collection("clients").doc(clientId), { cat_ids: newCatIds });
    changedClientCats.push({ id: clientId, cat_ids: newCatIds });
    modifie++;
    if (++ops >= 450) { await batch.commit(); batch = db.batch(); ops = 0; }
  }
  if (ops > 0) await batch.commit();
  await callCachePatch("clients", changedClientCats);
  return { clients_lies: clientCatMap.size, modifie, inchange };
}

/** Extrait le cat_id depuis le nom de fichier (catalogue_camphes_joyeuses_fee.csv → désignation normalisée → cat_id). */
async function catIdFromFilename(fileName) {
  const slug = fileName.toLowerCase().replace(/^catalogue_/, "").replace(/\.csv$/, "");
  const designation = slug.replace(/_/g, " ").trim();
  const snap = await db.collection("catalogues").get();
  for (const doc of snap.docs) {
    const d = (doc.data().cat_designation || "").toLowerCase().trim();
    if (d === designation) return doc.data().cat_id;
  }
  return null;
}

async function stepSyncOneCatalogueFile(fichiers, fileName) {
  const f = fichiers.find((f) => f.name.toLowerCase() === fileName.toLowerCase());
  if (!f) throw new Error(`Fichier ${fileName} introuvable dans le dossier catalogue.`);
  const rows = await lireCsvDrive(f.id);
  // Résoudre cat_id : depuis la colonne clp_cat_id (ancien format) ou depuis le nom du fichier (nouveau format)
  const fallbackCatId = await catIdFromFilename(f.name);
  const pdtCatIds = new Map();
  for (const row of rows) {
    const catId = parseInt(row.clp_cat_id) || fallbackCatId;
    const ref = (row.pdt_reference || "").trim();
    if (!catId || !ref) continue;
    if (!pdtCatIds.has(ref)) pdtCatIds.set(ref, new Set());
    pdtCatIds.get(ref).add(catId);
  }
  const existingMap = await fetchCacheMap("products", "pdt_reference", (id) => id.replace(/\//g, "__"));
  let batch = db.batch(), ops = 0, modifie = 0, inchange = 0;
  const changedCatIds = [];
  for (const [ref, catSet] of pdtCatIds.entries()) {
    const docId = ref.replace(/\//g, "__");
    const newCatIds = Array.from(catSet);
    const existing = existingMap.get(docId);
    if (existing && !arrayChanged(existing.cat_ids, newCatIds)) { inchange++; continue; }
    batch.set(db.collection("products").doc(docId), { cat_ids: newCatIds }, { merge: true });
    changedCatIds.push({ pdt_reference: ref, cat_ids: newCatIds });
    modifie++;
    if (++ops >= 450) { await batch.commit(); batch = db.batch(); ops = 0; }
  }
  if (ops > 0) await batch.commit();
  await callCachePatch("products", changedCatIds);
  return { fichier: f.name, modifie, inchange };
}

async function stepSyncAllCatalogueFiles(fichiers) {
  const catalogueItems = fichiers.filter((f) =>
    f.name.toLowerCase().startsWith("catalogue_") && f.name.toLowerCase().endsWith(".csv")
  );
  // Pré-charger le mapping désignation normalisée → cat_id pour tous les catalogues
  const catSnap = await db.collection("catalogues").get();
  const designationToCatId = new Map();
  for (const doc of catSnap.docs) {
    const d = (doc.data().cat_designation || "").toLowerCase().trim();
    designationToCatId.set(d, doc.data().cat_id);
  }
  const pdtCatIds = new Map();
  for (const fichier of catalogueItems) {
    const slug = fichier.name.toLowerCase().replace(/^catalogue_/, "").replace(/\.csv$/, "");
    const designation = slug.replace(/_/g, " ").trim();
    const fallbackCatId = designationToCatId.get(designation) ?? null;
    const rows = await lireCsvDrive(fichier.id);
    for (const row of rows) {
      const catId = parseInt(row.clp_cat_id) || fallbackCatId;
      const ref = (row.pdt_reference || "").trim();
      if (!catId || !ref) continue;
      if (!pdtCatIds.has(ref)) pdtCatIds.set(ref, new Set());
      pdtCatIds.get(ref).add(catId);
    }
  }
  const existingMap = await fetchCacheMap("products", "pdt_reference", (id) => id.replace(/\//g, "__"));
  let batch = db.batch(), ops = 0, modifie = 0, inchange = 0;
  const changedCatIds = [];
  for (const [ref, catSet] of pdtCatIds.entries()) {
    const docId = ref.replace(/\//g, "__");
    const newCatIds = Array.from(catSet);
    const existing = existingMap.get(docId);
    if (existing && !arrayChanged(existing.cat_ids, newCatIds)) { inchange++; continue; }
    batch.set(db.collection("products").doc(docId), { cat_ids: newCatIds }, { merge: true });
    changedCatIds.push({ pdt_reference: ref, cat_ids: newCatIds });
    modifie++;
    if (++ops >= 450) { await batch.commit(); batch = db.batch(); ops = 0; }
  }
  if (ops > 0) await batch.commit();
  await callCachePatch("products", changedCatIds);
  return { fichiers: catalogueItems.length, modifie, inchange };
}

async function syncCataloguesToFirestore() {
  const fichiers = await getCatalogueFolder();
  const [meta, clients, articles] = await Promise.all([
    stepSyncCataloguesMeta(fichiers),
    stepSyncClientCatalogues(fichiers),
    stepSyncAllCatalogueFiles(fichiers),
  ]);
  return { ...meta, ...clients, ...articles };
}

// ===== Exports HTTP catalogues =====

function makeCatalogueHandler(fn) {
  return functions.https.onRequest(async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    try {
      const result = await fn(req);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      console.error("Erreur catalogue:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

exports.syncCatalogues = makeCatalogueHandler(async () => {
  const result = await syncCataloguesToFirestore();
  await invalidateCF("catalogues");
  return result;
});

exports.syncCataloguesMeta = makeCatalogueHandler(async () => {
  const fichiers = await getCatalogueFolder();
  const result = await stepSyncCataloguesMeta(fichiers);
  await invalidateCF("catalogues");
  return result;
});

exports.syncClientCatalogues = makeCatalogueHandler(async () => {
  const fichiers = await getCatalogueFolder();
  const result = await stepSyncClientCatalogues(fichiers);
  await invalidateCF("catalogues");
  return result;
});

// Sync un catalogue précis : POST /syncOneCatalogue?file=catalogue_amazon.csv
exports.syncOneCatalogue = makeCatalogueHandler(async (req) => {
  const fileName = req.query.file || req.body?.file;
  if (!fileName) throw new Error("Paramètre 'file' manquant.");
  const fichiers = await getCatalogueFolder();
  const result = await stepSyncOneCatalogueFile(fichiers, fileName);
  await invalidateCF("catalogues");
  return result;
});

// Liste les fichiers catalogue_*.csv disponibles dans Drive
exports.listCatalogueFiles = makeCatalogueHandler(async () => {
  const fichiers = await getCatalogueFolder();
  const files = fichiers
    .filter((f) => f.name.toLowerCase().startsWith("catalogue_") && f.name.toLowerCase().endsWith(".csv"))
    .map((f) => ({ name: f.name, modifiedTime: f.modifiedTime }));
  return { files };
});

// ===== HTTP trigger : sync manuel depuis le dossier Drive =====
exports.syncDossierCsv = functions.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const result = await syncDossierCsvToFirestore();
    res.status(200).json(result);
  } catch (error) {
    console.error("Erreur syncDossierCsv :", error);
    res.status(500).send("Erreur lors de la sync du dossier Drive.");
  }
});

// ===== Helper : sync seulement certains fichiers Drive =====
async function syncFichiersParNoms(nomsFichiers) {
  const fichiers = await listerFichiersDossier(DRIVE_FOLDER_ID);
  const metaRef = db.collection("settings").doc("sync-metadata");
  const metaSnap = await metaRef.get();
  const dernieresDates = metaSnap.exists ? (metaSnap.data().fichiers || {}) : {};
  const nouvellesDates = { ...dernieresDates };

  const resultats = {};
  let trouve = false;
  // Parcours dans l'ordre de nomsFichiers, pas dans celui du Drive : certains fichiers
  // dépendent d'un autre déjà synchronisé (SV_PRODUITS.csv a besoin de SV_ATTRIBUTS.csv).
  for (const nom of nomsFichiers) {
    const fichier = fichiers.find((f) => f.name === nom);
    if (!fichier) continue;
    const handler = FICHIERS_SYNC[fichier.name];
    if (!handler) continue;
    trouve = true;
    console.log(`Sync ${fichier.name}...`);
    const rows = await lireCsvDrive(fichier.id);
    resultats[fichier.name] = await handler(rows);
    if (fichier.modifiedTime) nouvellesDates[fichier.name] = fichier.modifiedTime;
  }

  if (!trouve) throw new Error(`Aucun fichier trouvé parmi : ${nomsFichiers.join(", ")}`);

  await metaRef.set({ fichiers: nouvellesDates }, { merge: true });
  return { success: true, resultats, timestamp: new Date().toISOString() };
}

const FICHIERS_PAR_TYPE = {
  articles:       ["EXP_ARTICLES_1165.CSV", "Articles_Final.csv"],
  statCategories: ["EXP_STATS_1165.CSV", "StatCategories_Final.csv"],
  tarifs:         ["EXP_TARIFS_1165.CSV", "EXP_TARIF_1165.CSV"],
  clients:        ["EXP_CLIENTS_1165.CSV", "Clients_Final.csv"],
  commandes:      ["EXP_COMMANDES_1165.CSV"],
  colisage:       ["EXP_COLISAGE_1165.CSV"],
  // Ordre significatif : le registre décrit les colonnes que SV_PRODUITS.csv doit éclater.
  attributs:      ["SV_ATTRIBUTS.csv", "SV_VALEURS.csv", "SV_PRODUITS.csv"],
};

const SYNC_TYPE_TO_COLLECTION = {
  articles:       "products",
  statCategories: "stat-categories",
  tarifs:         "tarif-lines",
  clients:        "clients",
  commandes:      "orders",
  colisage:       "products",
  attributs:      "product-attributes",
};

function makeSyncHandler(type) {
  return functions.https.onRequest(async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    try {
      const result = await syncFichiersParNoms(FICHIERS_PAR_TYPE[type]);
      await invalidateCF(SYNC_TYPE_TO_COLLECTION[type]);
      res.status(200).json(result);
    } catch (error) {
      console.error(`Erreur sync ${type}:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

exports.syncArticles       = makeSyncHandler("articles");
exports.syncStatCategories = makeSyncHandler("statCategories");
exports.syncTarifs         = makeSyncHandler("tarifs");
exports.syncClients        = makeSyncHandler("clients");
exports.syncCommandes      = makeSyncHandler("commandes");
exports.syncColisage       = makeSyncHandler("colisage");
exports.syncAttributs      = makeSyncHandler("attributs");

// ===== Email de commande =====
// Variables d'environnement requises dans functions/.env :
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
// Déployer avec : firebase deploy --only functions

const MAIL_FROM = process.env.SMTP_USER || "contact@surprisez-vous.fr";
// TODO : remettre les adresses de prod une fois les tests validés
const MAIL_TO = ["alexis.bert@surprisez-vous.fr"];

function row(label, value) {
  return `<tr>
    <td style="padding:3px 10px;font-weight:bold;width:190px;vertical-align:top">${label}</td>
    <td style="padding:3px 10px">${value || ""}</td>
  </tr>`;
}

function buildOrderEmailHtml(order, orderId, client) {
  const lignes = (order.lignes || []).map((l) => {
    const total = (l.qte * l.prix_unitaire).toLocaleString("fr-FR", { minimumFractionDigits: 2 });
    return `<tr style="border-bottom:1px solid #eee">
      <td style="padding:7px 10px">${l.designation} [ ${l.ref} ]</td>
      <td style="padding:7px 10px;text-align:center">${l.qte}</td>
      <td style="padding:7px 10px;text-align:right">${Number(l.prix_unitaire).toFixed(2)}</td>
      <td style="padding:7px 10px;text-align:right">${total} €</td>
    </tr>`;
  }).join("");

  const totalHt = Number(order.montant_ht).toLocaleString("fr-FR", { minimumFractionDigits: 2 });

  const sectionStyle = "background:#f0f0f0;padding:6px 10px;border-left:3px solid #444;margin:20px 0 4px;font-size:15px;font-weight:bold";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Commande Surprisez-vous</title></head>
<body style="font-family:Arial,sans-serif;font-size:13px;color:#333;max-width:680px;margin:0 auto">

  <p style="margin-bottom:20px">Une commande vous est adressée. Veuillez trouver le récapitulatif ci-dessous.</p>

  <div style="${sectionStyle}">Détails Entreprise</div>
  <table style="border-collapse:collapse;width:100%">
    ${row("Login client :", client?.login || client?.erp_id)}
    ${row("Raison Social :", client?.raison_soc)}
    ${row("N° SIRET :", client?.siret)}
    ${row("Enseigne :", client?.enseigne)}
    ${row("Activité :", client?.tpe_client)}
    ${row("Nom du gérant :", client?.nom_gerant)}
    ${row("Prénom du gérant :", client?.prenom_gerant)}
    ${row("Numéro de TVA :", client?.num_tva)}
  </table>

  <div style="${sectionStyle}">Coordonnées Entreprise</div>
  <table style="border-collapse:collapse;width:100%">
    ${row("Adresse :", client?.adr)}
    ${row("Code Postal :", client?.cp)}
    ${row("Ville :", client?.ville)}
    ${row("Pays :", client?.pays)}
    ${row("Téléphone :", client?.tel)}
    ${row("Fax :", client?.fax)}
  </table>

  <div style="${sectionStyle}">Responsable achat</div>
  <table style="border-collapse:collapse;width:100%">
    ${row("Nom :", client?.nom_ach)}
    ${row("Prénom :", client?.prenom_ach)}
    ${row("Email :", client?.email || order.client)}
    ${row("Profil :", client?.profil_id)}
  </table>

  ${order.commentaire ? `
  <div style="${sectionStyle}">Commentaire</div>
  <p style="padding:4px 10px;margin:0">${order.commentaire}</p>
  ` : ""}

  <div style="${sectionStyle}">Récapitulatif de commande</div>
  <table style="border-collapse:collapse;width:100%;border:1px solid #ddd">
    <thead>
      <tr style="background:#444;color:#fff">
        <th style="padding:8px 10px;text-align:left">Produit</th>
        <th style="padding:8px 10px;text-align:center">Quantité</th>
        <th style="padding:8px 10px;text-align:right">PU HT</th>
        <th style="padding:8px 10px;text-align:right">Total HT</th>
      </tr>
    </thead>
    <tbody>${lignes}</tbody>
    <tfoot>
      <tr style="background:#f0f0f0;font-weight:bold">
        <td colspan="3" style="padding:8px 10px;text-align:right">TOTAL HT</td>
        <td style="padding:8px 10px;text-align:right">${totalHt} €</td>
      </tr>
    </tfoot>
  </table>

</body>
</html>`;
}

exports.sendOrderEmail = onDocumentCreated("orders/{orderId}", async (event) => {
  const order = event.data.data();
  const orderId = event.params.orderId;

  // Récupération du client via son email
  const clientSnap = await db.collection("clients")
    .where("email", "==", order.client)
    .limit(1)
    .get();
  const client = clientSnap.empty ? null : clientSnap.docs[0].data();

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const html = buildOrderEmailHtml(order, orderId, client);
  const orderNum = orderId.slice(0, 8).toUpperCase();

  await transporter.sendMail({
    from: `Surprisez-vous <${MAIL_FROM}>`,
    to: MAIL_TO,
    subject: `Commande N°${orderNum} - Surprisez-vous`,
    html,
  });
});

// ── Instagram Feed ──────────────────────────────────────────────────────────
// Token stocké dans Firestore : settings/instagram { access_token, user_id }
// Rafraîchi automatiquement tous les 30 j par autoRefreshInstagramToken.
let _igCache = null;
let _igCacheAt = 0;
const IG_CACHE_TTL = 60 * 60 * 1000; // 1 heure

async function getIgCredentials() {
  const snap = await db.collection("settings").doc("instagram").get();
  if (!snap.exists) return null;
  const { access_token, user_id } = snap.data();
  if (!access_token || !user_id) return null;
  return { token: access_token, userId: user_id };
}

exports.instagramFeed = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  if (_igCache && Date.now() - _igCacheAt < IG_CACHE_TTL) {
    res.json(_igCache);
    return;
  }

  const creds = await getIgCredentials();
  if (!creds) { res.json({ posts: [] }); return; }

  try {
    const fields = "id,media_type,thumbnail_url,media_url,permalink,caption,timestamp";
    const url = `https://graph.instagram.com/${creds.userId}/media?fields=${fields}&access_token=${creds.token}&limit=30`;
    const apiRes = await fetch(url);
    if (!apiRes.ok) throw new Error(await apiRes.text());
    const data = await apiRes.json();

    const posts = (data.data || [])
      .filter(p => p.media_type === "VIDEO" || p.media_type === "REEL")
      .slice(0, 3)
      .map(p => ({
        id:            p.id,
        thumbnail_url: p.thumbnail_url || null,
        media_url:     p.media_url || null,
        permalink:     p.permalink,
        caption:       (p.caption || "").split("\n")[0].slice(0, 120),
        timestamp:     p.timestamp,
      }));

    _igCache = { posts };
    _igCacheAt = Date.now();
    res.json({ posts });
  } catch (err) {
    console.error("[instagramFeed]", err.message);
    if (_igCache) { res.json(_igCache); return; }
    res.json({ posts: [] });
  }
});

// ── Warmup en heures ouvrées : maintient Next.js + cacheData chauds ─────────
// Volontairement limité : un ping toutes les 5 min 24h/24 empêche l'instance
// Cloud Run de redescendre à zéro, donc la facture court la nuit et le dimanche.
exports.warmupCache = onSchedule(
  { schedule: "*/15 8-19 * * 1-6", timeZone: "Europe/Paris" },
  async () => {
    if (!NEXTJS_BASE_URL || NEXTJS_BASE_URL.includes("TON_DOMAINE")) {
      console.warn("[warmup] NEXTJS_BASE_URL non configuré — warmup ignoré.");
      return;
    }
    try {
      await fetch(`${NEXTJS_BASE_URL}/api/warmup${CACHE_SECRET ? `?secret=${CACHE_SECRET}` : ""}`);
      console.log("[warmup] OK");
    } catch (e) {
      console.warn("[warmup] Erreur :", e.message);
    }
  }
);

// Rafraîchit automatiquement le token Instagram tous les 30 jours.
// Le token longue durée dure 60 j — on renouvelle à mi-chemin pour ne jamais expirer.
exports.autoRefreshInstagramToken = onSchedule("0 0 1 * *", async () => {
  const creds = await getIgCredentials();
  if (!creds) {
    console.log("[autoRefreshInstagramToken] Pas de credentials en Firestore, skip.");
    return;
  }

  try {
    const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${creds.token}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    await db.collection("settings").doc("instagram").update({
      access_token:  data.access_token,
      refreshed_at:  admin.firestore.FieldValue.serverTimestamp(),
      expires_in_s:  data.expires_in,
    });
    _igCache = null; // invalide le cache mémoire
    console.log("[autoRefreshInstagramToken] Token rafraîchi avec succès.");
  } catch (err) {
    console.error("[autoRefreshInstagramToken] Échec :", err.message);
  }
});

// ===== Notifications RTDB client — changement de statut commande =====
const STATUT_LABELS_NOTIF = {
  "En attente": "En attente de validation",
  "Validee":    "Validée ✓",
  "Expediee":   "Expédiée 📦",
  "Livree":     "Livrée 🎉",
  "Annulee":    "Annulée",
};

exports.onOrderStatusChange = onDocumentUpdated("orders/{orderId}", async (event) => {
  const before = event.data.before.data();
  const after  = event.data.after.data();
  if (before.statut === after.statut) return null;

  const clientEmail = (after.clientEmail || after.client || "").trim();
  if (!clientEmail) return null;

  const clientSnap = await db.collection("clients")
    .where("email", "==", clientEmail)
    .limit(1)
    .get();
  if (clientSnap.empty) return null;

  const uid = clientSnap.docs[0].data().uid;
  if (!uid) return null;

  await admin.database()
    .ref(`notifications/clients/${uid}`)
    .push({
      orderId: event.params.orderId,
      label:   STATUT_LABELS_NOTIF[after.statut] ?? after.statut,
      statut:  after.statut,
      at:      admin.database.ServerValue.TIMESTAMP,
      read:    false,
    });

  return null;
});

// ===== Custom claims admin =====
// Pose auth.token.admin = true dès que users/{uid}.role === 'admin'
// Utilisé par les règles RTDB pour restreindre /notifications/admin
exports.setAdminClaim = onDocumentWritten("users/{uid}", async (event) => {
  const uid = event.params.uid;
  const after = event.data?.after?.data();

  const isAdmin = after?.role === "admin";
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });
    console.log(`[setAdminClaim] uid=${uid} admin=${isAdmin}`);
  } catch (err) {
    console.error(`[setAdminClaim] Erreur uid=${uid}:`, err.message);
  }
});
