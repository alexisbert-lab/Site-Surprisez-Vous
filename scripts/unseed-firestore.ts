import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
});

const db = admin.firestore();

// Collections to clear
const COLLECTIONS = [
  'articles',
  'categories',
  'clients',
  'contenu-pages',
  'evenements',
  'groupes-contact',
  'marketing',
  'marques',
  'orders',
  'products',
  'ruptures',
  'settings',
  'stat-categories',
  'tarifs',
];

async function deleteCollection(collectionPath: string, batchSize = 100) {
  let deleted = 0;
  let query = db.collection(collectionPath);

  async function deleteQueryBatch(
    query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>,
    batchSize: number
  ): Promise<number> {
    const snapshot = await query.limit(batchSize).get();

    // When there are no documents left, we are done
    if (snapshot.size === 0) {
      return deleted;
    }

    deleted += snapshot.size;

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    // Recurse on the next process tick, to avoid exploding the stack.
    return new Promise((resolve) => {
      process.nextTick(() => {
        deleteQueryBatch(query, batchSize).then(resolve);
      });
    });
  }

  const count = await deleteQueryBatch(query, batchSize);
  console.log(`✓ Collection '${collectionPath}' cleared (${count} docs)`);
  return count;
}

async function main() {
  console.log('🗑️  Starting database clear...\n');

  try {
    for (const collection of COLLECTIONS) {
      await deleteCollection(collection);
    }

    console.log(
      '\n✅ All collections cleared successfully! Database is now empty.'
    );
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

main();
