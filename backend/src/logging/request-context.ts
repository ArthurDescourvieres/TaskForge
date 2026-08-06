import { AsyncLocalStorage } from 'node:async_hooks';

export interface ContexteRequete {
  requestId: string;
  userId?: number;
}

/**
 * Contexte propagé sur toute la durée d'une requête.
 *
 * AsyncLocalStorage évite de faire transiter request_id et user_id en paramètre
 * à travers chaque service jusqu'au point de log : le logger les retrouve seul,
 * y compris depuis une couche qui n'a aucune notion de HTTP.
 */
export const stockageContexte = new AsyncLocalStorage<ContexteRequete>();

export function contexteActuel(): ContexteRequete | undefined {
  return stockageContexte.getStore();
}

/**
 * Renseigne l'utilisateur une fois l'authentification passée. Sans contexte
 * actif (tâche hors requête HTTP), l'appel est simplement ignoré.
 */
export function associerUtilisateur(userId: number): void {
  const contexte = stockageContexte.getStore();
  if (contexte) {
    contexte.userId = userId;
  }
}
