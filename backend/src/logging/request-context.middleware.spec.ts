import type { NextFunction, Request, Response } from 'express';
import { contexteRequeteMiddleware } from './request-context.middleware';
import { contexteActuel } from './request-context';

function executer(enTetes: Record<string, unknown> = {}) {
  const requete = { headers: enTetes } as unknown as Request;
  const setHeader = jest.fn();
  const reponse = { setHeader } as unknown as Response;

  let vuDansLaSuite: ReturnType<typeof contexteActuel>;
  const suite: NextFunction = () => {
    // Copie : le store est vidé dès la sortie de `run`.
    vuDansLaSuite = { ...contexteActuel()! };
  };

  contexteRequeteMiddleware(requete, reponse, suite);

  return { setHeader, contexte: vuDansLaSuite! };
}

describe('contexteRequeteMiddleware', () => {
  it('génère un identifiant quand la requête n’en porte pas', () => {
    const { contexte } = executer();
    expect(contexte.requestId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('expose l’identifiant dans l’en-tête de réponse', () => {
    const { setHeader, contexte } = executer();
    expect(setHeader).toHaveBeenCalledWith('x-request-id', contexte.requestId);
  });

  it('laisse user_id vide avant authentification', () => {
    const { contexte } = executer();
    expect(contexte.userId).toBeUndefined();
  });

  describe('identifiant fourni en amont', () => {
    it('réutilise un identifiant sain pour corréler les logs', () => {
      const { contexte } = executer({ 'x-request-id': 'trace-abc_123' });
      expect(contexte.requestId).toBe('trace-abc_123');
    });

    it('rejette un identifiant contenant un saut de ligne', () => {
      // Sans ce filtre, un client pourrait injecter une fausse ligne JSON
      // dans le flux de logs.
      const { contexte } = executer({
        'x-request-id': 'abc\n{"level":"error","message":"faux"}',
      });
      expect(contexte.requestId).not.toContain('\n');
      expect(contexte.requestId).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('rejette un identifiant trop long', () => {
      const { contexte } = executer({ 'x-request-id': 'a'.repeat(65) });
      expect(contexte.requestId).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('ignore un en-tête répété (tableau)', () => {
      const { contexte } = executer({ 'x-request-id': ['un', 'deux'] });
      expect(contexte.requestId).toMatch(/^[0-9a-f-]{36}$/);
    });
  });

  it('referme le contexte après la requête', () => {
    executer();
    expect(contexteActuel()).toBeUndefined();
  });
});
