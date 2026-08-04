// Miroir de backend/src/common/account-rules.ts : les deux fichiers doivent
// rester alignés. Valider ici évite un aller-retour pour une règle que l'API
// refusera de toute façon — c'est elle qui fait autorité.

/**
 * Le champ est un identifiant, pas un état civil : ni espace, ni accent.
 * Un libellé libre laisserait passer des doublons visuels (« Jean Dupont » et
 * « Jean  Dupont ») indistinguables dans la file d'incidents, et publierait le
 * nom réel des agents sur chaque ticket qu'ils traitent.
 */
export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/;

/** Même expression pour l'attribut `pattern` : HTML l'ancre implicitement, donc
 *  pas de ^ ni $, et les délimiteurs de littéral régulier n'y ont pas leur place. */
export const USERNAME_PATTERN_ATTR = '[a-zA-Z0-9._-]{3,30}';

export const USERNAME_RULE =
  '3 à 30 caractères sans espace : lettres, chiffres, point, tiret ou underscore';

export const MIN_PASSWORD_LENGTH = 12;

export const PASSWORD_RULE = `${MIN_PASSWORD_LENGTH} caractères minimum`;

/** Premier problème rencontré, ou null si tout passe. Un seul message à la fois :
 *  empiler les reproches sur un formulaire de 3 champs dessert plus qu'il n'aide. */
export function validateAccount(
  username: string,
  password: string,
): string | null {
  if (!USERNAME_PATTERN.test(username)) {
    return `Nom d'utilisateur invalide — ${USERNAME_RULE}.`;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }
  return null;
}
