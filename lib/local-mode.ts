/**
 * Mode local vu du navigateur.
 *
 * `SV_LOCAL_DATA` ne quitte pas le serveur : l'éditeur, qui tourne côté client,
 * a besoin de son pendant public pour savoir qu'il doit écrire dans
 * `.local-data/` plutôt que dans Firestore. Les deux se règlent ensemble.
 */
export const MODE_LOCAL = process.env.NEXT_PUBLIC_SV_LOCAL_DATA === '1';
