# Surprisez-Vous — Site e-commerce

Site vitrine, back-office et espace client professionnel de la marque **Surprisez-Vous** (décoration et articles de fête).

L'architecture détaillée est décrite dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Ce que fait le site

- **Vitrine publique** — accueil animé, catalogue par catégorie piloté par un référentiel d'attributs, fiches produit avec déclinaisons, univers, showroom 3D, carte des revendeurs, flux Instagram.
- **Espace pro** (authentifié) — catalogue avec tarifs négociés par client, panier, commande express, suivi de commandes, notifications temps réel.
- **Back-office** — catalogue et attributs, CRM (~3 800 clients), commandes, grilles tarifaires, campagnes marketing, statistiques, et un **éditeur de contenu en place** : l'admin modifie la vitrine directement dans la page.
- **Synchronisation ERP** — l'ERP et le classeur d'attributs exportent des CSV sur Google Drive ; 24 Cloud Functions les ingèrent dans Firestore (sync quotidienne planifiée + déclenchement manuel depuis `/admin/sync`).

## Stack technique

| Domaine | Choix |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript |
| Style | Tailwind CSS 4 |
| Backend | Firebase : Firestore · Storage · Realtime Database · Cloud Functions · Auth |
| Hébergement | Firebase App Hosting (`apphosting.yaml`) |
| Animations | anime.js · three.js (showroom) |
| Tests | Vitest (unitaires/composants) · Playwright (e2e) |

## Structure du dépôt

```
app/
  (public)/        # Vitrine publique (catalogue, produit, univers, showroom…)
  (editor-preview)/# Aperçus header/footer pour l'éditeur admin
  admin/           # Back-office (catalogue, CRM, commandes, tarifs, sync…)
  pro/             # Espace client professionnel (authentifié)
  api/             # Routes API : cache, revalidation ISR, warmup, e2e

components/        # Composants React (ui/, layout/, home/, catalogue/, showroom/, editable/, admin/)
lib/               # Accès données, caches, contextes React, hooks
  firestore/       # Un module par collection Firestore
  rtdb/            # Notifications Realtime Database
functions/         # Cloud Functions (sync ERP, cache, e-mails, triggers)
scripts/           # Seed, fixtures locales, migrations, outillage GCP
docs/              # Documentation (architecture, cahier de test)
__tests__/ · e2e/  # Tests unitaires · tests Playwright
```

## Prérequis

- Node.js 20+
- Projet Firebase avec Firestore, Storage, Realtime Database, Authentication et Cloud Functions activés
- Fichier `.env.local` à la racine, à créer depuis [.env.local.example](.env.local.example)

## Installation & démarrage

```bash
npm install
npm run dev
```

### Mode local (zéro lecture Firestore)

Avec `SV_LOCAL_DATA=1` dans `.env.local`, le site lit des fixtures JSON dans `.local-data/` au lieu de Firestore — idéal pour développer sans consommer de quota :

```bash
npm run local:data            # génère les fixtures depuis Firestore
npm run local:data -- --demo  # ou des fixtures de démonstration, hors ligne
npm run local:data -- --erp   # ou l'export ERP complet + attributs déduits
```

Le référentiel ne vient jamais de Firestore : il est lu dans les exports du classeur déposés en `.local-data/csv/`, ou à défaut dans les blocs du prototype. Les onglets sont reconnus par un mot du nom de fichier — `attribut`, `valeur`, `produit` — donc un export brut de Sheets (`Classeur SV - ATTRIBUTS.csv`) fonctionne sans renommage ; en cas de doublon, le fichier le plus récent gagne. Le script commence par lister chaque source avec sa date de modification, ou le repli employé si elle manque. **Le site ne lit aucun CSV** : pour répercuter une modification du classeur, remplacer le fichier puis relancer la commande — les fixtures sont relues à chaud, un rechargement de page suffit.

Ajouter `NEXT_PUBLIC_SV_LOCAL_DATA=1` étend le mode local à l'édition : `/admin/editeur` et `/admin/personnalisation` écrivent alors dans `.local-data/page-content.json` et `.local-data/site-settings.json` (route `/api/local-store`), les images téléversées atterrissent dans `public/local-uploads/` au lieu de Firebase Storage, et `/admin` s'ouvre sans connexion Firebase. Rien ne part en production, et tout est fermé hors développement.

Une démo se fige et se rejoue : `npm run local:save -- avant-demo`, `npm run local:restore -- avant-demo`, `npm run local:reset`. Mode d'emploi complet dans [docs/MODE-LOCAL.md](docs/MODE-LOCAL.md).

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run lint` | Lint Next.js |
| `npm run seed` / `npm run unseed` | Injection / suppression des données de démo |
| `npm run local:data` | Génération des fixtures du mode local |
| `npm run local:save` / `local:restore` / `local:list` / `local:reset` | Instantanés de l'état d'édition local |
| `npm run create-users` / `delete-users` | Comptes Firebase Auth de démo |
| `npm run test` / `test:watch` / `test:coverage` | Tests unitaires Vitest |
| `npm run test:e2e` / `test:e2e:ui` | Tests Playwright |
| `npm run test:e2e:emulator` | Playwright contre l'émulateur Firebase |

## Déploiement

- **Site** : Firebase App Hosting, configuré par `apphosting.yaml` (build + variables d'environnement).
- **Backend** : `firebase deploy --only functions` · `--only firestore:rules` · `--only storage` · `--only database`.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — présentation de l'architecture
- [docs/MODE-LOCAL.md](docs/MODE-LOCAL.md) — éditer et démontrer le site hors ligne, sauvegarder / restaurer une démo
- [docs/CAHIER-DE-TEST.md](docs/CAHIER-DE-TEST.md) — cahier de test manuel
