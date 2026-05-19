import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

const FAKE_EMAIL_DOMAIN = 'sv.local';
const PASSWORD_PREFIX = 'sv-';

async function createAuthUsers() {
  const snap = await db.collection('clients').get();
  const clients = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const client of clients) {
    const login: string = (client.login || '').trim();
    const password: string = (client.motdepasse || '').trim();

    if (!login || !password) {
      skipped++;
      continue;
    }

    // Ne pas recréer si déjà lié
    if (client.uid) {
      skipped++;
      continue;
    }

    const fakeEmail = `${login}@${FAKE_EMAIL_DOMAIN}`;

    try {
      let uid: string;
      try {
        const existing = await auth.getUserByEmail(fakeEmail);
        uid = existing.uid;
        await auth.updateUser(uid, { password: PASSWORD_PREFIX + password });
      } catch {
        const newUser = await auth.createUser({ email: fakeEmail, password: PASSWORD_PREFIX + password });
        uid = newUser.uid;
      }

      // Créer le document users/{uid}
      await db.collection('users').doc(uid).set({
        role: 'pro',
        client_id: client.id,
        ...(client.tarif_grid_id ? { tarif_grid_id: client.tarif_grid_id } : {}),
      }, { merge: true });

      // Lier le uid au client
      await db.collection('clients').doc(client.id).update({ uid });

      console.log(`✓ ${login} → client ${client.id}`);
      created++;
    } catch (err: any) {
      console.error(`✗ ${login} : ${err.message}`);
      errors++;
    }
  }

  console.log(`\nTerminé : ${created} créés, ${skipped} ignorés, ${errors} erreurs`);
}

createAuthUsers();
