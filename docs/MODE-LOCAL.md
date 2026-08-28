# Mode local — éditer et démontrer le site hors ligne

Le mode local fait tourner le site sur des fichiers JSON (`.local-data/`) au lieu de
Firestore. **Zéro lecture facturée, zéro écriture en production** : tout ce qui est
modifié dans l'éditeur visuel atterrit sur le disque et se jette d'un `npm run local:reset`.

C'est le mode à utiliser pour montrer des tests de mise en page, essayer une palette,
ou faire visiter le back-office sans risque.

---

## 1. Démarrer

```bash
# 1. Les deux variables dans .env.local (déjà posées sur ce poste)
SV_LOCAL_DATA=1              # le serveur lit .local-data/
NEXT_PUBLIC_SV_LOCAL_DATA=1  # le navigateur y écrit (éditeur, personnalisation, auth)

# 2. Fabriquer les fixtures
npm run local:data           # produits depuis le cache Cloud Function
npm run local:data -- --demo # 100 % hors ligne, produits fabriqués depuis vos CSV du classeur
npm run local:data -- --erp  # gros catalogue de test (export ERP + attributs déduits)

# 3. Lancer
npm run dev
```

**D'où viennent les produits en `--demo`** : les références et les attributs sortent de
`.local-data/csv/SV_PRODUITS.csv` (à défaut, de `Sheet attribut - PRODUITS.csv` à la
racine). Le libellé, lui, a quitté l'export du classeur — c'est la désignation de
l'ERP : il est repris de `prototype-menu-produits/Feuille de calcul sans titre - Feuille 1.csv`
quand ce fichier est là. Sans lui, les cartes afficheraient leur référence, et le
script le dit en clair dans son récapitulatif de sources.

L'éditeur visuel est sur <http://localhost:3000/admin/editeur>.
**Aucun mot de passe n'est demandé** : en mode local, une session admin fictive est
ouverte d'office (voir §6). Un badge orange **MODE LOCAL** s'affiche en haut du
back-office — s'il n'est pas là, les écritures partent vers Firestore.

---

## 2. Ce qui est modifiable, et où ça s'écrit

| Ce qu'on modifie | Écran | Fichier écrit |
|---|---|---|
| Textes, couleurs, tailles, polices d'un élément | `/admin/editeur` | `.local-data/page-content.json` |
| Fond, marges, rayon, ombre, taille d'un bloc | `/admin/editeur` | `.local-data/page-content.json` |
| Liens internes | `/admin/editeur` | `.local-data/page-content.json` |
| Images (téléversées ou par URL) | `/admin/editeur` | fichier dans `public/local-uploads/`, URL dans `page-content.json` |
| Produits mis en avant sur l'accueil | `/admin/editeur` | `.local-data/page-content.json` |
| Logos de marques | `/admin/editeur` | `public/local-uploads/` + `page-content.json` |
| Header et footer (logo, CTA, contacts, réseaux) | `/admin/editeur`, pages `— Header` / `— Footer` | `.local-data/page-content.json` |
| Palette et fonds de section | `/admin/personnalisation` | `.local-data/site-settings.json` |
| Catalogue, attributs, menu | classeur → `npm run local:data` | `.local-data/attribute-*.json`, `products.json` |

Les fixtures sont relues **à chaud** : enregistrer dans l'éditeur puis recharger la
page suffit, sans redémarrer `npm run dev`.

### Ce qui n'est pas local

Ces écrans continuent de parler à Firestore et échoueront (ou resteront vides) hors
ligne — ils ne font pas partie du périmètre « éditeur visuel » :

`/admin/crm` · `/admin/commandes` · `/admin/tarifs` · `/admin/catalogue` ·
`/admin/revendeurs` · `/admin/marketing` · `/admin/statistiques` · `/admin/sync`

Idem pour l'espace pro authentifié (commandes, grilles tarifaires) : les prix
viennent de la Cloud Function de cache.

---

## 3. Sauvegarder et restaurer une démo

Quatre commandes, qui ne touchent **que** l'état d'édition (`page-content.json`,
`site-settings.json`, `public/local-uploads/`). Le catalogue n'est jamais concerné.

```bash
npm run local:save -- avant-demo   # fige l'état courant sous ce nom
npm run local:list                 # liste les instantanés et leur date
npm run local:restore -- avant-demo # revient à cet état
npm run local:reset                # repart d'une page vierge
```

`restore` et `reset` prennent d'eux-mêmes un instantané de secours
(`avant-restore_…`, `avant-reset_…`) avant d'écraser quoi que ce soit : une démo
ne se perd pas par mégarde. Les instantanés vivent dans `.local-data/snapshots/`,
hors dépôt.

**Après un `reset`**, le site retombe sur les textes écrits en dur dans les
composants et sur la palette `DEFAULT_COLORS` de
[lib/firestore/site-settings.ts](../lib/firestore/site-settings.ts#L21) — c'est l'état
« sortie d'usine », pas l'état de production.

**Repartir de la production** : supprimer `.local-data/page-content.json` et
`.local-data/site-settings.json`, puis relancer `npm run local:data`, qui réamorce
les réglages depuis le cache Cloud Function (le contenu de page, lui, repart vide).

---

## 4. Revenir aux données réelles

Commenter les deux lignes dans `.env.local` et redémarrer :

```bash
# SV_LOCAL_DATA=1
# NEXT_PUBLIC_SV_LOCAL_DATA=1
```

Le site relit Firestore et la Cloud Function de cache, l'éditeur réécrit en
production, et `/admin` réclame de nouveau une vraie connexion admin. Les fichiers
de `.local-data/` restent en place pour la prochaine session.

---

## 5. Pourquoi ça ne peut pas fuiter en production

- `.local-data/` et `public/local-uploads/` sont **hors dépôt** (`.gitignore`).
- Les routes d'écriture `/api/local-store` et `/api/local-store/upload` répondent
  **404** si `SV_LOCAL_DATA` est absent **ou** si `NODE_ENV === 'production'`.
- La session admin locale est conditionnée à `NODE_ENV !== 'production'`. Next fige
  cette valeur à la compilation : un `next build` ignore la session même si la
  variable traînait dans l'environnement du déploiement.

---

## 6. Modifications apportées au code (2026-08-28)

Ce que le mode local ne couvrait pas encore : `/admin` exigeait une vraie connexion
Firebase Auth, donc l'éditeur — la seule chose qu'on voulait montrer — restait
inaccessible hors ligne. Quatre fichiers touchés, deux ajoutés.

| Fichier | Changement | Annuler |
|---|---|---|
| [lib/local-auth.ts](../lib/local-auth.ts) | **Ajouté.** `AUTH_LOCALE` (mode local **et** hors build de prod) et `UTILISATEUR_LOCAL`, session admin fictive | `git rm lib/local-auth.ts` |
| [lib/auth-context.tsx](../lib/auth-context.tsx) | Si `AUTH_LOCALE` : session admin posée d'emblée, écouteur Firebase / lecture du profil / préchargement court-circuités, `loginWithEmail` et `logout` neutralisés | `git checkout -- lib/auth-context.tsx` |
| [app/admin/layout.tsx](../app/admin/layout.tsx) | Badge **MODE LOCAL** dans la barre du haut, bouton Déconnexion masqué, `/admin/connexion` redirigé vers `/admin` | `git checkout -- app/admin/layout.tsx` |
| [lib/site-theme-context.tsx](../lib/site-theme-context.tsx) | `refresh()` complète les réglages par les valeurs par défaut — un `site-settings.json` partiel vidait des variables CSS après enregistrement | `git checkout -- lib/site-theme-context.tsx` |
| [scripts/local-snapshot.mjs](../scripts/local-snapshot.mjs) | **Ajouté.** `list` / `save` / `restore` / `reset` de l'état d'édition | `git rm scripts/local-snapshot.mjs` |
| [package.json](../package.json) | Scripts `local:list`, `local:save`, `local:restore`, `local:reset` | `git checkout -- package.json` |
| [scripts/local-data.mjs](../scripts/local-data.mjs) | En `--demo`, les désignations manquantes sont reprises de l'export ERP local (le classeur ne porte plus `libelle`) | **pas de `git checkout`** : le fichier portait déjà une modification non commitée du chantier attributs (`product-groups` → `attribute-groups`). Retirer à la main `designationsErp()`, le troisième paramètre de `produitsDemo()` et les deux lignes de journal |

Tout annuler d'un coup :

```bash
git checkout -- lib/auth-context.tsx app/admin/layout.tsx lib/site-theme-context.tsx package.json
rm lib/local-auth.ts scripts/local-snapshot.mjs docs/MODE-LOCAL.md
```

Aucun de ces changements ne modifie le comportement hors mode local : les branches
ajoutées sont toutes gardées par `AUTH_LOCALE`, sauf le complément par les valeurs
par défaut de `site-theme-context`, qui corrige un défaut valable aussi en production.

Vérifié : `npx tsc --noEmit` passe, cycle `save` → `reset` → `restore` testé sur les
fixtures réelles du poste.

---

## 7. En cas de pépin

| Symptôme | Cause probable | Geste |
|---|---|---|
| `/admin` renvoie vers la page de connexion | `NEXT_PUBLIC_SV_LOCAL_DATA` absent ou serveur non redémarré | vérifier `.env.local`, relancer `npm run dev` |
| Pas de badge MODE LOCAL | idem — les écritures partiraient en production | ne rien enregistrer avant de l'avoir corrigé |
| Une modification n'apparaît pas | fixture non relue | recharger la page ; si rien, vérifier que `.local-data/page-content.json` a bien grossi |
| Le site perd ses couleurs | `site-settings.json` vidé ou partiel | `npm run local:restore -- <instantané>` ou `npm run local:data` |
| Catalogue vide, compteurs à zéro | fixtures produits absentes | `npm run local:data -- --demo` |
| Images cassées après un `restore` | dossier d'uploads désynchronisé | `restore` remplace `public/local-uploads/` en bloc : re-restaurer le bon instantané |
