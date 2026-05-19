import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

const KEEP_EMAILS = ['alexis.bert@surprisez-vous.fr'];

async function deleteAuthUsers() {
  let deleted = 0;
  let kept = 0;
  let pageToken: string | undefined;

  do {
    const result = await auth.listUsers(1000, pageToken);

    const toDelete = result.users.filter(
      (u) => !KEEP_EMAILS.includes((u.email || '').toLowerCase())
    );

    if (toDelete.length > 0) {
      const uids = toDelete.map((u) => u.uid);
      await auth.deleteUsers(uids);

      // Nettoyer aussi les documents users/{uid} en Firestore
      const batchSize = 450;
      for (let i = 0; i < uids.length; i += batchSize) {
        const batch = db.batch();
        uids.slice(i, i + batchSize).forEach((uid) => {
          batch.delete(db.collection('users').doc(uid));
        });
        await batch.commit();
      }

      for (const u of toDelete) {
        console.log(`✓ Supprimé : ${u.email || u.uid}`);
      }
      deleted += toDelete.length;
    }

    kept += result.users.length - toDelete.length;
    pageToken = result.pageToken;
  } while (pageToken);

  console.log(`\nTerminé : ${deleted} supprimés, ${kept} conservé(s)`);
}

deleteAuthUsers();
