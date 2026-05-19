import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

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
      batch.update(d.ref, { uid: admin.firestore.FieldValue.delete() });
    });
    await batch.commit();
    cleared += Math.min(batchSize, docs.length - i);
  }

  console.log(`Terminé : ${cleared} uid(s) effacés dans clients`);
}

resetClientUids();
