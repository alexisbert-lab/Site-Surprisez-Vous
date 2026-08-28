# Cahier de test — Surprisez-vous (Bêta)

> **Version :** 1.0 — Juin 2026  
> **Environnement :** Production (Firebase live) ou Staging  
> **Navigateurs cibles :** Chrome 120+, Firefox 120+, Safari 17+, Edge 120+  
> **Appareils :** Desktop (1920×1080, 1440×900), Tablette (iPad), Mobile (iPhone 14 / Android)

---

## Légende

| Statut | Signification |
|--------|--------------|
| ✅ OK | Fonctionne comme attendu |
| ❌ KO | Bug bloquant |
| ⚠️ PARTIEL | Fonctionne avec anomalie mineure |
| ⏭️ SKIP | Non testé (hors périmètre) |

---

## MODULE 1 — Authentification & Accès

### 1.1 Connexion espace pro

| # | Cas de test | Étapes | Résultat attendu | Statut | Observations |
|---|-------------|--------|-----------------|--------|--------------|
| 1.1.1 | Connexion avec identifiant pro | Aller sur `/connexion` → saisir identifiant + mdp → cliquer Se connecter | Redirection vers `/` ou `/pro/dashboard` | ✅ OK | |
| 1.1.2 | Connexion avec email admin | Saisir `email@surprisez-vous.fr` + mdp | Redirection vers back-office admin | ✅ OK | |
| 1.1.3 | Identifiants incorrects | Saisir identifiant inconnu + mdp | Message d'erreur "Identifiant ou mot de passe incorrect" | ✅ OK | |
| 1.1.4 | Champ identifiant vide | Cliquer Se connecter sans remplir | Validation HTML5 — champ requis signalé | ✅ OK | |
| 1.1.5 | Bouton pendant chargement | Après soumission valide | Bouton devient "Connexion..." et est désactivé | ✅ OK | |
| 1.1.6 | Trop de tentatives | 5 tentatives avec mauvais mdp | Message "Trop de tentatives. Réessayez dans quelques minutes." | ✅ OK | |
| 1.1.7 | Déconnexion | Cliquer Se déconnecter | Retour à la page publique + accès pro/admin bloqué | ✅ OK | |
| 1.1.8 | Session persistante | Se connecter → fermer le navigateur → rouvrir | Toujours connecté | ✅ OK | |

### 1.2 Protection des routes

| # | Cas de test | Route | Résultat attendu | Statut | Observations |
|---|-------------|-------|-----------------|--------|--------------|
| 1.2.1 | Accès /pro/dashboard sans connexion | `/pro/dashboard` | Redirection vers `/connexion` | ✅ OK | |
| 1.2.2 | Accès /pro/catalogue sans connexion | `/pro/catalogue` | Redirection vers `/connexion` | ✅ OK | |
| 1.2.3 | Accès /admin sans connexion | `/admin` | Redirection vers `/admin/connexion` | ✅ OK | |
| 1.2.4 | Accès /admin avec compte pro | Se connecter pro → aller sur `/admin` | Accès refusé | ✅ OK | |
| 1.2.5 | Accès /pro avec compte public | Se connecter public → aller sur `/pro` | Redirection | ✅ OK | |

---

## MODULE 2 — Espace Pro

### 2.1 Dashboard pro

| # | Cas de test | Étapes | Résultat attendu | Statut | Observations |
|---|-------------|--------|-----------------|--------|--------------|
| 2.1.1 | Chargement du dashboard | Se connecter pro → aller sur `/pro/dashboard` | Affiche les informations du compte (nom, entreprise, conseiller) | ✅ OK | |
| 2.1.2 | Affichage du conseiller | Page dashboard | Nom + email + téléphone du conseiller visible | ✅ OK | |
| 2.1.3 | Liens de navigation | Cliquer sur les liens sidebar | Chaque lien mène à la bonne page | ✅ OK | |

### 2.2 Catalogue pro

| # | Cas de test | Étapes | Résultat attendu | Statut | Observations |
|---|-------------|--------|-----------------|--------|--------------|
| 2.2.1 | Chargement catalogue | Se connecter pro → `/pro/catalogue` | Liste de produits visible | ✅ OK | |
| 2.2.2 | Recherche produit | Taper "ballon" dans la barre de recherche | Produits filtrés en temps réel | ✅ OK | |
| 2.2.3 | Affichage du prix | Consulter un produit | Prix TTC/HT affiché selon grille tarifaire | ✅ OK | |
| 2.2.4 | Produit en rupture | Voir un produit avec stock = 0 | Badge "Rupture" ou bouton désactivé | ✅ OK | |
| 2.2.5 | Produit stock faible | Voir un produit avec stock ≤ 20 | Indicateur de stock faible | ✅ OK | |
| 2.2.6 | Filtre par gamme | Cliquer sur une gamme | Produits filtrés | ✅ OK | |
| 2.2.7 | Catalogue restreint | Compte avec cat_ids limités | Ne voit pas les produits des autres catalogues | ✅ OK | |

### 2.3 Panier & Commande Express

| # | Cas de test | Étapes | Résultat attendu | Statut | Observations |
|---|-------------|--------|-----------------|--------|--------------|
| 2.3.1 | Créer un panier | Cliquer sur "Nouveau panier" | Panier créé avec nom | ✅ OK | |
| 2.3.2 | Ajouter un article | Saisir une quantité → Ajouter | Article apparaît dans le panier | ✅ OK | |
| 2.3.3 | Modifier la quantité | Changer la quantité d'un article | Total mis à jour immédiatement | ✅ OK | |
| 2.3.4 | Supprimer un article | Cliquer sur Supprimer | Article retiré du panier | ✅ OK | |
| 2.3.5 | Plusieurs paniers | Créer 2 paniers + switcher | Le panier actif change | ✅ OK | |
| 2.3.6 | Persistance panier | Recharger la page | Le panier est toujours là | ✅ OK | |
| 2.3.7 | Commande express | Remplir le formulaire commande express | Commande enregistrée + confirmation | ✅ OK | |
| 2.3.8 | Calcul total | Articles avec prix × quantités différents | Total = somme correcte | ✅ OK | |

---

## MODULE 3 — Back-office Admin

### 3.1 Navigation & Layout

| # | Cas de test | Étapes | Résultat attendu | Statut | Observations |
|---|-------------|--------|-----------------|--------|--------------|
| 3.1.1 | Accès back-office | Se connecter admin → `/admin` | Dashboard admin visible | ✅ OK | |
| 3.1.2 | Sidebar navigation | Cliquer chaque lien sidebar | Toutes les pages s'ouvrent | ✅ OK | |
| 3.1.3 | Notifications | Icône de cloche admin | Affiche les nouvelles commandes/notifications | ✅ OK | |

### 3.2 Gestion catalogue (produits)

| # | Cas de test | Étapes | Résultat attendu | Statut | Observations |
|---|-------------|--------|-----------------|--------|--------------|
| 3.2.1 | Liste produits | `/admin/catalogue` | Tableau de produits chargé | ✅ OK | |
| 3.2.2 | Recherche produit admin | Taper une référence | Produits filtrés | ✅ OK | |
| 3.2.3 | Modifier visibilité | Toggle visible/invisible sur un produit | Changement persisté dans Firestore | ✅ OK | |
| 3.2.4 | Sync catalogue | Bouton de synchronisation | Données mises à jour depuis ERP | ✅ OK | |
| 3.2.5 | Filtre par état | Filtrer Géré / Fin de vie / Bloqué / Supprimé | Résultats corrects | ✅ OK | |

### 3.3 Gestion des commandes

| # | Cas de test | Étapes | Résultat attendu | Statut | Observations |
|---|-------------|--------|-----------------|--------|--------------|
| 3.3.1 | Liste commandes | `/admin/commandes` | Commandes listées par date | ✅ OK | |
| 3.3.2 | Détail commande | Cliquer sur une commande | Détail avec articles, quantités, client | ✅ OK | |
| 3.3.3 | Statut commande | Changer le statut | Mis à jour + notification client | ✅ OK | |
| 3.3.4 | Filtrer par statut | Filtrer "en attente" | Seulement les commandes en attente | ✅ OK | |

### 3.4 CRM (clients)

| # | Cas de test | Étapes | Résultat attendu | Statut | Observations |
|---|-------------|--------|-----------------|--------|--------------|
| 3.4.1 | Liste clients | `/admin/crm` | Liste des clients avec infos | ✅ OK | |
| 3.4.2 | Recherche client | Taper un nom ou email | Client trouvé | ✅ OK | |
| 3.4.3 | Fiche client | Cliquer sur un client | Détail complet du compte | ✅ OK | |
| 3.4.4 | Modifier grille tarifaire | Changer le tarif d'un client | Tarif persisté | ✅ OK | |

### 3.5 Tarifs

| # | Cas de test | Étapes | Résultat attendu | Statut | Observations |
|---|-------------|--------|-----------------|--------|--------------|
| 3.5.1 | Affichage grilles tarifaires | `/admin/tarifs` | Liste des grilles | ✅ OK | |
| 3.5.2 | Modification coefficient | Changer un coef | Prix recalculés | ✅ OK | |

### 3.6 Revendeurs

| # | Cas de test | Étapes | Résultat attendu | Statut | Observations |
|---|-------------|--------|-----------------|--------|--------------|
| 3.6.1 | Liste revendeurs | `/admin/revendeurs` | Liste des revendeurs | ✅ OK | |
| 3.6.2 | Page revendeur public | `/revendeur` | Carte + infos revendeur | ✅ OK | |

### 3.7 Statistiques

| # | Cas de test | Étapes | Résultat attendu | Statut | Observations |
|---|-------------|--------|-----------------|--------|--------------|
| 3.7.1 | Chargement stats | `/admin/statistiques` | Graphiques/chiffres visibles | ✅ OK | |
| 3.7.2 | Filtres période | Changer la période | Stats recalculées | ✅ OK | |

---

## MODULE 4 — Site Public

### 4.1 Page d'accueil

| # | Cas de test | Étapes | Résultat attendu | Statut | Observations |
|---|-------------|--------|-----------------|--------|--------------|
| 4.1.1 | Chargement accueil | Aller sur `/` | Page charge en < 3s, hero visible | ✅ OK | |
| 4.1.2 | Navigation header | Liens header cliquables | Bonne destination | ✅ OK | |
| 4.1.3 | Pied de page | Scroll bas de page | Footer complet visible | ✅ OK | |
| 4.1.4 | Barre promotionnelle | Haut de page | Texte promo visible | ✅ OK | |

### 4.2 Catalogue public

| # | Cas de test | Étapes | Résultat attendu | Statut | Observations |
|---|-------------|--------|-----------------|--------|--------------|
| 4.2.1 | Navigation catalogue | `/catalogue` | Onglets Par gamme / Par marque visibles | ✅ OK | |
| 4.2.2 | Recherche publique | Saisir un terme | Résultats filtrés | ✅ OK | |
| 4.2.3 | Fiche technique | Cliquer sur un produit | Page `/fiche-technique` s'ouvre | ✅ OK | |
| 4.2.4 | Filtre par marque | Cliquer sur une marque | Produits filtrés par marque | ✅ OK | |

### 4.3 Showroom

| # | Cas de test | Étapes | Résultat attendu | Statut | Observations |
|---|-------------|--------|-----------------|--------|--------------|
| 4.3.1 | Page showroom | `/showroom` | Contenu showroom visible | ✅ OK | |
| 4.3.2 | Animations scroll | Scroller la page | Effets d'apparition au scroll | ✅ OK | |
| 4.3.3 | CTA showroom | Cliquer le bouton d'action | Bonne destination | ✅ OK | |

---

## MODULE 5 — Performance & Accessibilité

### 5.1 Performance

| # | Cas de test | Cible | Résultat attendu | Statut | Observations |
|---|-------------|-------|-----------------|--------|--------------|
| 5.1.1 | LCP page d'accueil | Desktop | < 2.5s | ✅ OK | |
| 5.1.2 | LCP page d'accueil | Mobile | < 4s | ✅ OK | |
| 5.1.3 | Chargement catalogue | 100 produits | < 3s | ✅ OK | |
| 5.1.4 | Navigation entre pages | SPA transitions | < 1s | ✅ OK | |

### 5.2 Responsive

| # | Cas de test | Résolution | Résultat attendu | Statut | Observations |
|---|-------------|-----------|-----------------|--------|--------------|
| 5.2.1 | Accueil mobile | 375px | Layout intact, pas de débordement | ✅ OK | |
| 5.2.2 | Catalogue mobile | 375px | Produits lisibles, filtre accessible | ✅ OK | |
| 5.2.3 | Connexion mobile | 375px | Formulaire utilisable | ✅ OK | |
| 5.2.4 | Admin mobile | 768px | Sidebar repliable, tableau scrollable | ✅ OK | |
| 5.2.5 | Pro catalogue tablette | 768px | Grille produits adaptée | ✅ OK | |

### 5.3 Cross-browser

| # | Navigateur | Page | Résultat attendu | Statut | Observations |
|---|------------|------|-----------------|--------|--------------|
| 5.3.1 | Chrome 120+ | Accueil | Rendu identique | ✅ OK | |
| 5.3.2 | Firefox 120+ | Accueil | Rendu identique | ✅ OK | |
| 5.3.3 | Safari 17+ | Accueil | Rendu identique | ✅ OK | |
| 5.3.4 | Edge 120+ | Accueil | Rendu identique | ✅ OK | |

---

## MODULE 6 — Sécurité & Données

| # | Cas de test | Étapes | Résultat attendu | Statut | Observations |
|---|-------------|--------|-----------------|--------|--------------|
| 6.1 | Injection XSS | Saisir `<script>alert(1)</script>` dans un champ | Affiché en texte brut, non exécuté | ✅ OK | |
| 6.2 | Accès données autres clients | Client A accède aux données client B | Impossible — règles Firestore | ✅ OK | |
| 6.3 | Token expiré | Laisser la session inactive 1h+ | Déconnexion auto ou refresh | ✅ OK | |
| 6.4 | HTTPS | Accéder en HTTP | Redirection automatique HTTPS | ✅ OK | |
| 6.5 | Cookie RGPD | Première visite | Bannière cookies visible | ✅ OK | |
| 6.6 | Mentions légales | `/mentions-legales` | Page accessible et complète | ✅ OK | |

---

## Bugs identifiés lors des tests

| # | Page | Description | Sévérité | Assigné à | Statut |
|---|------|-------------|----------|-----------|--------|
| — | — | — | — | — | — |

> Sévérité : **Critique** (bloquant), **Majeur** (fonctionnalité cassée), **Mineur** (cosmétique/UX)

---

## Récapitulatif de couverture

| Module | Total | OK | KO | Partiel | Skip |
|--------|-------|----|----|---------|------|
| 1 — Authentification | 13 | 13 | 0 | 0 | 0 |
| 2 — Espace Pro | 18 | 18 | 0 | 0 | 0 |
| 3 — Admin | 22 | 22 | 0 | 0 | 0 |
| 4 — Site Public | 11 | 11 | 0 | 0 | 0 |
| 5 — Perf & Responsive | 13 | 13 | 0 | 0 | 0 |
| 6 — Sécurité | 6 | 6 | 0 | 0 | 0 |
| **TOTAL** | **83** | **83** | **0** | **0** | **0** |

---
