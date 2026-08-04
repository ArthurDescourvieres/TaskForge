// Règles de compte partagées par l'inscription publique (RegisterDto) et la
// création par un admin (CreateUserDto). Le frontend applique les mêmes dans
// frontend/src/lib/account-rules.ts — les deux fichiers doivent rester alignés.

/**
 * Le champ est un identifiant, pas un état civil : ni espace, ni accent.
 * Un libellé libre laisserait passer des doublons visuels (« Jean Dupont » et
 * « Jean  Dupont ») indistinguables dans la file d'incidents, et publierait le
 * nom réel des agents sur chaque ticket qu'ils traitent.
 */
export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/;

export const USERNAME_RULE =
  '3 à 30 caractères sans espace : lettres, chiffres, point, tiret ou underscore';

export const MIN_PASSWORD_LENGTH = 12;
