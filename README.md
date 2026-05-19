# Surprisez-Vous — Site e-commerce

Site vitrine et espace professionnel pour la marque **Surprisez-Vous**, spécialisée dans la décoration et les articles de fête.

## Stack technique

- **Framework** : Next.js 15 (App Router) · React 19 · TypeScript
- **Style** : Tailwind CSS 4
- **Backend** : Firebase (Firestore · Storage · Cloud Functions)
- **Animations** : anime.js

## Structure

```
app/
  (public)/        # Pages vitrine publiques
  admin/           # Back-office administration
  pro/             # Espace client professionnel (authentifié)
  api/             # Routes API (revalidation ISR)

components/        # Composants React
lib/               # Helpers, contextes, accès Firestore
functions/         # Cloud Functions Firebase
```

## Prérequis

- Node.js 18+
- Compte Firebase avec Firestore, Storage et Authentication activés
- Fichier `.env.local` avec les variables Firebase (voir `.env.example` si disponible)

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Données de démonstration

```bash
npm run seed    # Injecter les données de démo
npm run unseed  # Supprimer les données de démo
```

## Variables d'environnement

Créer un fichier `.env.local` à la racine avec les clés Firebase de votre projet :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```
