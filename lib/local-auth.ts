import type { User } from 'firebase/auth';
import { MODE_LOCAL } from './local-mode';

/**
 * Session admin fictive du mode local.
 *
 * L'éditeur visuel vit sous `/admin`, dont la garde exige un compte Firebase
 * Auth portant le rôle admin — donc un aller-retour réseau et un vrai mot de
 * passe. Le reste du site tourne déjà sur `.local-data/` : sans cette session,
 * la seule chose qui resterait indémontrable hors ligne serait justement
 * l'éditeur qu'on veut montrer.
 *
 * `NODE_ENV` est le garde-fou : Next fige la valeur à la compilation, donc un
 * build de production ignore la session même si la variable traînait dans
 * l'environnement au moment du déploiement.
 */
export const AUTH_LOCALE = MODE_LOCAL && process.env.NODE_ENV !== 'production';

/**
 * Assez de `User` pour la garde admin et les rares appels à `getIdToken()` :
 * en mode local, personne ne présente ce jeton à un service qui le vérifie.
 */
export const UTILISATEUR_LOCAL = {
  uid: 'local-admin',
  email: 'admin@sv.local',
  displayName: 'Admin (mode local)',
  emailVerified: true,
  isAnonymous: false,
  providerId: 'local',
  providerData: [],
  metadata: {},
  getIdToken: async () => 'local',
  getIdTokenResult: async () => ({ token: 'local', claims: {} }),
  reload: async () => {},
  delete: async () => {},
  toJSON: () => ({ uid: 'local-admin', email: 'admin@sv.local' }),
} as unknown as User;
