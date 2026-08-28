/**
 * Sauvegarde et restauration de l'etat d'edition du mode local.
 *
 *   node scripts/local-snapshot.mjs list             instantanes disponibles
 *   node scripts/local-snapshot.mjs save [nom]       fige l'etat courant
 *   node scripts/local-snapshot.mjs restore <nom>    revient a un instantane
 *   node scripts/local-snapshot.mjs reset            repart d'une page vierge
 *
 * Ne touche qu'aux fichiers ecrits par l'editeur visuel — page-content.json,
 * site-settings.json et les images deposees. Le catalogue (products,
 * attribute-*) reste fabrique par « npm run local:data » : une demo ratee se
 * repare ici sans avoir a regenerer les fixtures.
 *
 * `reset` et `restore` prennent d'eux-memes un instantane de securite : le seul
 * moyen de perdre une demo serait de l'ecraser sans filet.
 */
import {
  cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const RACINE = process.cwd();
const LOCAL = join(RACINE, '.local-data');
const INSTANTANES = join(LOCAL, 'snapshots');
const UPLOADS = join(RACINE, 'public', 'local-uploads');

/** Les trois seules ressources que l'editeur ecrit. */
const FICHIERS = ['page-content.json', 'site-settings.json'];

const horodatage = () =>
  new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', 'h');

function listeInstantanes() {
  if (!existsSync(INSTANTANES)) return [];
  return readdirSync(INSTANTANES, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

function copier(source, cible) {
  mkdirSync(cible, { recursive: true });
  for (const f of FICHIERS) {
    const src = join(source, f);
    if (existsSync(src)) cpSync(src, join(cible, f));
  }
  if (existsSync(UPLOADS)) {
    cpSync(UPLOADS, join(cible, 'local-uploads'), { recursive: true });
  }
}

function sauver(nom) {
  const cible = join(INSTANTANES, nom);
  if (existsSync(cible)) {
    console.error(`L'instantane « ${nom} » existe deja — choisir un autre nom.`);
    process.exit(1);
  }
  copier(LOCAL, cible);
  console.log(`Instantane « ${nom} » ecrit dans .local-data/snapshots/${nom}/`);
  return nom;
}

/** Filet avant toute operation destructrice, nomme pour se retrouver plus tard. */
function filet(motif) {
  const nom = `${motif}_${horodatage()}`;
  copier(LOCAL, join(INSTANTANES, nom));
  console.log(`Etat precedent conserve sous « ${nom} ».`);
}

function restaurer(nom) {
  const source = join(INSTANTANES, nom);
  if (!existsSync(source)) {
    console.error(`Instantane « ${nom} » introuvable.`);
    console.error(`Disponibles : ${listeInstantanes().join(', ') || 'aucun'}`);
    process.exit(1);
  }
  filet('avant-restore');

  for (const f of FICHIERS) {
    const src = join(source, f);
    if (existsSync(src)) cpSync(src, join(LOCAL, f));
  }
  // Les images sont remplacees en bloc : une URL enregistree dans le contenu
  // doit pointer sur le fichier de l'instantane, pas sur celui d'une autre demo.
  rmSync(UPLOADS, { recursive: true, force: true });
  const imgs = join(source, 'local-uploads');
  if (existsSync(imgs)) cpSync(imgs, UPLOADS, { recursive: true });

  console.log(`Instantane « ${nom} » restaure — recharger la page pour le voir.`);
}

function reinitialiser() {
  filet('avant-reset');
  writeFileSync(join(LOCAL, 'page-content.json'), '{}\n', 'utf8');
  writeFileSync(join(LOCAL, 'site-settings.json'), '{}\n', 'utf8');
  rmSync(UPLOADS, { recursive: true, force: true });
  console.log('Contenu et reglages remis a vide : le site retombe sur les textes');
  console.log('ecrits dans le code et sur la palette par defaut.');
}

function afficherListe() {
  const noms = listeInstantanes();
  if (noms.length === 0) {
    console.log('Aucun instantane. En creer un : npm run local:save -- ma-demo');
    return;
  }
  console.log('Instantanes disponibles :');
  for (const nom of noms) {
    const date = statSync(join(INSTANTANES, nom)).mtime.toLocaleString('fr-FR');
    console.log(`  ${nom.padEnd(32)} ${date}`);
  }
  console.log('\nRestaurer : npm run local:restore -- <nom>');
}

const [commande, argument] = process.argv.slice(2);

if (!existsSync(LOCAL)) {
  console.error('.local-data/ absent — lancer « npm run local:data » d\'abord.');
  process.exit(1);
}

switch (commande) {
  case 'list':
    afficherListe();
    break;
  case 'save':
    sauver(argument || `demo_${horodatage()}`);
    break;
  case 'restore':
    if (!argument) {
      console.error('Nom manquant : npm run local:restore -- <nom>');
      afficherListe();
      process.exit(1);
    }
    restaurer(argument);
    break;
  case 'reset':
    reinitialiser();
    break;
  default:
    console.log('Usage : list | save [nom] | restore <nom> | reset');
    process.exit(1);
}
