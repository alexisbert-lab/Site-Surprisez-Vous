/**
 * Migration des IDs clients : fusionne les anciens docs vers les nouveaux (ERP).
 *
 * Pour chaque ligne du tableau de correspondance avec score >= 95% :
 *   - Transfère le uid Firebase Auth de l'ancien doc vers le nouveau
 *   - Supprime l'ancien doc client
 *
 * Les lignes < 95% et les nouveaux comptes (sans ID ancien) ne sont pas touchés.
 *
 * Usage : npx ts-node scripts/migrate-client-ids.ts <chemin-vers-tableau.csv>
 * Séparateur attendu : tabulation
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function parseScore(val: string): number {
  return parseInt(val.replace('%', '').trim(), 10) || 0;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCsv(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) throw new Error('Fichier vide ou sans données');
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] ?? '').trim(); });
    return row;
  });
}

async function migrate(filePath: string) {
  const rows = parseCsv(filePath);
  console.log(`${rows.length} ligne(s) lue(s)`);

  let merged = 0;
  let skipped = 0;
  let warnings = 0;

  for (const row of rows) {
    const oldId  = row['ID Ancien']?.trim();
    const newId  = row['ID Nouveau']?.trim();
    const score  = parseScore(row['Score'] ?? '');

    // Ignorer si score insuffisant ou IDs manquants
    if (!oldId || !newId) { skipped++; continue; }
    if (score < 95)        { skipped++; continue; }
    if (oldId === newId)   { skipped++; continue; }

    const oldRef = db.collection('clients').doc(oldId);
    const newRef = db.collection('clients').doc(newId);

    const [oldSnap, newSnap] = await Promise.all([oldRef.get(), newRef.get()]);

    if (!oldSnap.exists) {
      console.log(`  [SKIP] Ancien doc ${oldId} introuvable (déjà supprimé ?)`);
      skipped++;
      continue;
    }

    // Si le nouveau doc existe déjà, on skip (idempotence)
    if (newSnap.exists) {
      console.log(`  [SKIP] Nouveau doc ${newId} existe déjà`);
      skipped++;
      continue;
    }

    const oldData = oldSnap.data()!;

    // Données mises à jour depuis le CSV
    const siretFromCsv = row['SIRET (nouveau)']?.trim();
    const newDocData: Record<string, unknown> = {
      ...oldData,
      erp_id: newId,
      ...(siretFromCsv && siretFromCsv !== '11111111111111' ? { siret: siretFromCsv } : {}),
    };

    const batch = db.batch();

    // Créer le nouveau doc avec les données de l'ancien
    batch.set(newRef, newDocData);

    // Mettre à jour users/{uid} pour pointer vers le nouvel ID client
    if (oldData.uid) {
      console.log(`  [UID] uid ${oldData.uid} : ${oldId} → ${newId}`);
      batch.update(db.collection('users').doc(oldData.uid), { client_id: newId });
    }

    // Supprimer l'ancien doc
    batch.delete(oldRef);

    await batch.commit();
    console.log(`  [OK] ${oldId} → ${newId} (${row['Raison Sociale (ancien)']} — score ${score}%)`);
    merged++;
  }

  console.log(`\nTerminé — ${merged} fusionné(s), ${skipped} ignoré(s), ${warnings} avertissement(s)`);
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage : npx ts-node scripts/migrate-client-ids.ts <tableau.csv>');
  process.exit(1);
}

migrate(path.resolve(csvPath)).catch((err) => {
  console.error('Erreur :', err);
  process.exit(1);
});
