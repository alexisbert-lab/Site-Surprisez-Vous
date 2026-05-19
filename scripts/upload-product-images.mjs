/**
 * Script de migration : Google Drive → Firebase Storage
 *
 * Prérequis :
 *   npm install googleapis @google-cloud/storage dotenv --save-dev
 *   (ou : npm install googleapis firebase-admin dotenv --save-dev)
 *
 * Configuration :
 *   1. Aller sur https://console.cloud.google.com/apis/credentials
 *   2. Créer un compte de service avec accès "Drive Reader"
 *   3. Télécharger le JSON de clé → mettre dans scripts/service-account.json
 *   4. Partager le dossier Drive avec l'email du compte de service
 *   5. Renseigner DRIVE_FOLDER_ID et STORAGE_BUCKET ci-dessous
 *
 * Lancement :
 *   node scripts/upload-product-images.mjs
 */

import { google } from 'googleapis';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { pipeline } from 'stream/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ────────────────────────────────────────────────────────────
// ↓ À configurer
const DRIVE_FOLDER_ID = '1xINInh8nuGJCqhfSzS26kmiY4KyPN-aR';
const STORAGE_BUCKET  = 'site-surprisez-vous.firebasestorage.app';
const SERVICE_ACCOUNT = join(__dirname, 'serviceAccountKey.json');
// ────────────────────────────────────────────────────────────

const TEMP_DIR = join(__dirname, '_img_tmp');
if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR);

// Init Firebase Admin
initializeApp({ credential: cert(SERVICE_ACCOUNT), storageBucket: STORAGE_BUCKET });
const bucket = getStorage().bucket();

// Init Google Drive
const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT,
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});
const drive = google.drive({ version: 'v3', auth });

async function listAllFiles() {
  const files = [];
  let pageToken = undefined;
  do {
    const res = await drive.files.list({
      q: `'${DRIVE_FOLDER_ID}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType)',
      pageSize: 1000,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return files;
}

async function downloadFile(fileId, destPath) {
  const res = await drive.files.get({ fileId, alt: 'media', supportsAllDrives: true }, { responseType: 'stream' });
  const dest = createWriteStream(destPath);
  await pipeline(res.data, dest);
}

async function uploadToStorage(localPath, storagePath) {
  await bucket.upload(localPath, {
    destination: storagePath,
    metadata: { cacheControl: 'public, max-age=31536000' },
  });
}

async function main() {
  console.log('Listing fichiers Drive...');
  const files = await listAllFiles();
  const images = files.filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f.name));
  console.log(`${files.length} fichier(s) total, ${images.length} images\n`);
  if (files.length > 0) {
    console.log('Fichiers trouvés :');
    files.slice(0, 10).forEach((f) => console.log(` - ${f.name} (${f.mimeType})`));
    if (files.length > 10) console.log(` ... et ${files.length - 10} autres`);
    console.log('');
  } else {
    console.log('Aucun fichier visible. Vérifiez que le dossier Drive est partagé avec :');
    console.log(`   firebase-adminsdk-fbsvc@site-surprisez-vous.iam.gserviceaccount.com\n`);
  }

  let ok = 0, skip = 0, err = 0;

  for (const file of images) {
    // Extraire la référence du nom de fichier (ex: "001A20.jpg" → "001A20")
    const ref = file.name.replace(/\.[^.]+$/, '');
    const ext = file.name.split('.').pop().toLowerCase();
    const storagePath = `products/${ref}.${ext}`;
    const tmpPath = join(TEMP_DIR, file.name);

    try {
      // Vérifier si déjà uploadé
      const [exists] = await bucket.file(storagePath).exists();
      if (exists) {
        console.log(`  [SKIP] ${file.name} — déjà présent`);
        skip++;
        continue;
      }

      process.stdout.write(`  [DL] ${file.name} ... `);
      await downloadFile(file.id, tmpPath);
      await uploadToStorage(tmpPath, storagePath);
      await unlink(tmpPath);
      console.log('OK');
      ok++;
    } catch (e) {
      console.log(`ERREUR ${e.message}`);
      err++;
    }
  }

  console.log(`\nTerminé : ${ok} uploadés, ${skip} ignorés, ${err} erreurs`);
  console.log(`Chemin Storage : gs://${STORAGE_BUCKET}/products/{ref}.jpg`);
}

main().catch(console.error);
