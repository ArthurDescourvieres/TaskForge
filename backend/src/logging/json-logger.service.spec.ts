import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JsonLogger, type LigneLog } from './json-logger.service';
import { stockageContexte } from './request-context';

describe('JsonLogger', () => {
  let logger: JsonLogger;
  let lignes: string[];
  const logDirInitial = process.env.LOG_DIR;

  beforeEach(() => {
    // Sans LOG_DIR, aucun fichier n'est ouvert : le test reste sans effet de bord.
    delete process.env.LOG_DIR;
    logger = new JsonLogger();
    lignes = [];
    // Capture dans un tableau typé plutôt que via spy.mock.calls, qui est `any`.
    jest.spyOn(process.stdout, 'write').mockImplementation((morceau) => {
      lignes.push(String(morceau));
      return true;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (logDirInitial === undefined) {
      delete process.env.LOG_DIR;
    } else {
      process.env.LOG_DIR = logDirInitial;
    }
  });

  function derniereBrute(): string {
    return lignes.at(-1) ?? '';
  }

  function derniereLigne(): LigneLog {
    return JSON.parse(derniereBrute()) as LigneLog;
  }

  describe('champs obligatoires', () => {
    it('émet les cinq champs exigés au CDC', () => {
      logger.log('démarrage');
      const ligne = derniereLigne();

      // timestamp, level, message, request_id, user_id
      expect(ligne).toHaveProperty('timestamp');
      expect(ligne).toHaveProperty('level');
      expect(ligne).toHaveProperty('message');
      expect(ligne).toHaveProperty('request_id');
      expect(ligne).toHaveProperty('user_id');
    });

    it('écrit une ligne JSON valide terminée par un saut de ligne', () => {
      logger.log('démarrage');
      const brut = derniereBrute();

      expect(brut.endsWith('\n')).toBe(true);
      expect(() => JSON.parse(brut) as unknown).not.toThrow();
    });

    it('produit un timestamp ISO 8601', () => {
      logger.log('démarrage');
      const { timestamp } = derniereLigne();

      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  describe('niveaux', () => {
    it.each([
      ['log', 'info'],
      ['warn', 'warn'],
      ['debug', 'debug'],
      ['verbose', 'verbose'],
    ])('%s produit le niveau %s', (methode, niveau) => {
      logger[methode as 'log' | 'warn' | 'debug' | 'verbose']('message');
      expect(derniereLigne().level).toBe(niveau);
    });

    it('error conserve la stack quand elle est fournie', () => {
      logger.error('boum', 'Error: boum\n    at test');
      const ligne = derniereLigne();

      expect(ligne.level).toBe('error');
      expect(ligne.stack).toContain('at test');
    });
  });

  describe('contexte de requête', () => {
    it('reprend request_id et user_id du contexte actif', () => {
      stockageContexte.run({ requestId: 'req-42', userId: 7 }, () => {
        logger.log('dans la requête');
      });

      const ligne = derniereLigne();
      expect(ligne.request_id).toBe('req-42');
      expect(ligne.user_id).toBe(7);
    });

    it('met les deux champs à null hors de toute requête', () => {
      logger.log('tâche de fond');
      const ligne = derniereLigne();

      expect(ligne.request_id).toBeNull();
      expect(ligne.user_id).toBeNull();
    });

    it('met user_id à null tant que l’authentification n’a pas eu lieu', () => {
      stockageContexte.run({ requestId: 'req-43' }, () => {
        logger.log('avant authentification');
      });

      const ligne = derniereLigne();
      expect(ligne.request_id).toBe('req-43');
      expect(ligne.user_id).toBeNull();
    });
  });

  describe('champs propres à pino', () => {
    it('n’émet aucun champ résiduel de la bibliothèque', () => {
      logger.log('démarrage');
      const ligne = derniereLigne();

      // pino nomme ses champs time, msg, pid et hostname. Le CDC impose
      // timestamp et message, et les deux derniers ne distinguent rien en
      // conteneur : aucun ne doit ressortir.
      for (const champ of ['time', 'msg', 'pid', 'hostname']) {
        expect(ligne).not.toHaveProperty(champ);
      }
    });

    it('émet un niveau textuel, pas la valeur numérique de pino', () => {
      logger.warn('attention');
      expect(derniereLigne().level).toBe('warn');
    });
  });

  describe('duplication vers LOG_DIR', () => {
    it('écrit la même ligne dans backend.log', async () => {
      const dossier = mkdtempSync(join(tmpdir(), 'taskforge-logs-'));

      try {
        process.env.LOG_DIR = dossier;
        const journal = new JsonLogger();
        journal.log('vers le volume partagé');

        const fichier = join(dossier, 'backend.log');
        let contenu = '';

        // L'écriture fichier passe par un WriteStream : elle n'est pas
        // garantie synchrone au retour de log().
        for (let essai = 0; essai < 50 && !contenu; essai += 1) {
          await new Promise((resoudre) => setTimeout(resoudre, 10));
          try {
            contenu = readFileSync(fichier, 'utf8');
          } catch {
            contenu = '';
          }
        }

        expect(contenu).not.toBe('');
        const ligne = JSON.parse(contenu.trim()) as LigneLog;
        expect(ligne.message).toBe('vers le volume partagé');
        expect(ligne.level).toBe('info');
      } finally {
        delete process.env.LOG_DIR;
        rmSync(dossier, { recursive: true, force: true });
      }
    });
  });

  describe('messages non textuels', () => {
    it('sérialise un objet passé en message', () => {
      logger.log({ evenement: 'ticket_cree', id: 12 });
      expect(derniereLigne().message).toBe(
        '{"evenement":"ticket_cree","id":12}',
      );
    });
  });

  describe('champs additionnels', () => {
    it('fusionne les champs métier dans la ligne', () => {
      logger.ecrireEvenement('info', 'GET /tickets 200', {
        http_status: 200,
        duration_ms: 12,
      });

      const ligne = derniereLigne();
      expect(ligne.http_status).toBe(200);
      expect(ligne.duration_ms).toBe(12);
      expect(ligne.message).toBe('GET /tickets 200');
    });
  });
});
