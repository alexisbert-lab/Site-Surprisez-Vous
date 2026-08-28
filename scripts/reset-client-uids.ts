import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

async function resetClientUids() {
  const snap = await db.collection('clients').where('uid', '!=', null).get();
  const docs = snap.docs;

  if (docs.length === 0) {
    console.log('Aucun client avec uid à nettoyer.');
    return;
  }

  const batchSize = 450;
  let cleared = 0;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    docs.slice(i, i + batchSize).forEach((d) => {
      batch.update(d.ref, { uid: FieldValue.delete() });
    });
    await batch.commit();
    cleared += Math.min(batchSize, docs.length - i);
  }

  console.log(`Terminé : ${cleared} uid(s) effacés dans clients`);
}

resetClientUids();
