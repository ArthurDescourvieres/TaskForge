# Architecture Decision Record — TaskForge

Ce document consigne les décisions structurantes du projet : leur contexte, le
choix retenu, ses conséquences et les alternatives écartées. Une nouvelle entrée
est ajoutée à chaque décision engageante, au fil du sprint.

---

## ADR-001 — Stack technique

**Date** : 30/07/2026 · **Statut** : Acceptée

### Contexte

Le cahier des charges laisse le choix du langage, du framework et de la base de
données. Contraintes : livrer un MVP complet en 2 semaines, avec authentification
à rôles, dashboard, monitoring et conteneurisation. L'équipe est réduite (voir
ADR-003) et doit privilégier la vitesse de mise en œuvre.

### Décision

| Couche | Choix |
|---|---|
| Frontend | React 19 + TypeScript, build Vite |
| Backend | NestJS 11 (Node/TypeScript) |
| Base de données | PostgreSQL 16, ORM Prisma |
| Authentification | JWT + garde de rôles (user / technicien / admin) |

### Justification

- **TypeScript de bout en bout** : un seul langage sur les trois couches réduit le
  coût de changement de contexte et permet de partager les types de la couche
  API vers le frontend.
- **NestJS** : structure imposée (modules, contrôleurs, services, injection de
  dépendances) qui évite d'avoir à inventer une architecture — un gain net quand
  le temps est la contrainte principale. Fournit nativement les gardes utilisées
  pour le système de rôles.
- **Prisma** : schéma déclaratif unique, migrations versionnées et client typé
  généré. Le schéma sert directement de documentation de la BDD attendue au
  rendu.
- **Vite** : démarrage et hot-reload quasi instantanés, configuration minimale.
- **PostgreSQL** : relationnel adapté au modèle (tickets ↔ utilisateurs), image
  Docker officielle stable, requêtes d'agrégation simples pour le dashboard.

### Alternatives écartées

- **Create React App** : plus lent, quasiment non maintenu.
- **Express seul** : plus léger mais aurait imposé de construire à la main la
  structure, l'injection de dépendances et les gardes de rôles.
- **TypeScript natif Node** (type stripping, disponible depuis Node 22.6) :
  écarté pour le backend — NestJS repose sur les décorateurs *legacy* et
  `emitDecoratorMetadata`, que le type stripping n'émet pas ; l'injection de
  dépendances casserait. Sans intérêt côté frontend, où Vite/esbuild fait déjà
  le travail.

### Conséquences

- Le backend dépend des décorateurs TypeScript : la chaîne de build doit rester
  `ts-node`/SWC, pas le runtime natif.
- Prisma impose une étape `prisma generate` dans le build de l'image backend.

---

## ADR-002 — Conteneurisation : séparation dev / prod

**Date** : 31/07/2026 · **Statut** : Acceptée

### Contexte

Le cahier des charges demande `docker compose up` pour lancer la stack complète,
des multi-stage builds, un utilisateur non-root et une séparation dev / prod.
Ces exigences entrent partiellement en conflit avec le confort de développement
(hot-reload via volumes montés).

### Décision

Deux configurations distinctes :

- **`docker-compose.yml` (dev)** : code source monté en volume, hot-reload actif
  (Vite côté frontend, `nest start --watch` côté backend), images mono-stage,
  conteneurs exécutés en root.
- **`docker-compose.prod.yml` (prod)** — à venir, tâches S2-05 à S2-07 : images
  multi-stage, pas de volume source, utilisateur non-root, tags versionnés.

Le service `postgres` porte un `healthcheck` (`pg_isready`) et le backend
attend `service_healthy` avant de démarrer.

### Justification

- **Root en dev, non-root en prod** : les images de dev montent `node_modules`
  dans un volume anonyme appartenant à root ; forcer `USER node` provoque un
  `EACCES` au démarrage de Vite (constaté et reproduit). Le durcissement
  n'apporte rien sur un conteneur local jetable, alors qu'il est indispensable
  sur l'image livrée. On applique donc l'exigence là où elle a du sens.
- **`usePolling` côté Vite** : le montage de volume depuis Windows ne propage
  pas les événements de système de fichiers ; sans polling, le hot-reload est
  muet. Vérifié : modification propagée en ~1 s.
- **Healthcheck plutôt que `depends_on` simple** : Postgres accepte les
  connexions plus tard qu'il ne démarre ; sans condition de santé, le backend
  échoue au premier démarrage.

### Alternatives écartées

- **Un seul compose paramétré par variables d'environnement** : plus compact,
  mais rend illisible ce qui relève du dev et ce qui relève de la prod — or la
  lisibilité de cette séparation fait partie de l'évaluation.
- **Non-root dès le dev, via alignement d'UID** : faisable (`user: "${UID}"`),
  mais fragile sous Windows et sans bénéfice réel en local.

### Conséquences

- Les ports sont paramétrables via `.env` (`FRONTEND_PORT`, `BACKEND_PORT`,
  `POSTGRES_PORT`) — nécessaire car d'autres projets occupent couramment les
  ports 5173 et 3000 sur le poste de développement.
- Les Dockerfiles de production restent à écrire ; les gains de taille avant /
  après devront être mesurés et documentés (S2-05).

---

## ADR-003 — Organisation de l'équipe : développement solo assumé

**Date** : 31/07/2026 · **Statut** : Acceptée

### Contexte

Le sprint backlog a été construit pour une équipe de trois (Arthur, Abd-Ellah,
Ibrahima), avec 52 points estimés sur le sprint 1 et une répartition nominative
des tâches. Dans les faits, la contribution des deux autres membres ne s'est pas
matérialisée au démarrage du sprint.

### Décision

Poursuivre le projet en développement solo, sans redécouper le backlog, mais en
assumant explicitement l'écart de capacité dans les artefacts de suivi
(burn-down, rétrospective) plutôt qu'en le masquant.

### Justification

Redécouper le backlog à mi-sprint reviendrait à réécrire l'historique de la
planification et rendrait la vélocité mesurée ininterprétable. Le burn-down est
précisément l'outil conçu pour rendre visible ce type d'écart : la ligne réelle
décroche de la ligne idéale dès J1, ce qui constitue une donnée d'analyse pour
la rétrospective.

### Conséquences

- **Capacité attendue irréaliste** : 52 points sur 4 jours supposent 13 points /
  jour pour une seule personne. Un report de tâches vers le sprint 2, voire un
  déclassement de certains *Should* en *Could*, est à prévoir.
- La rétrospective devra traiter honnêtement la rotation des rôles (exigée au
  rendu) en constatant qu'elle n'a pas eu lieu, et analyser pourquoi.
- L'attribution nominative du backlog est conservée telle quelle comme trace de
  la planification initiale.

---

## ADR-004 — Schéma de données (tickets, utilisateurs, rôles)

**Date** : 31/07/2026 · **Statut** : Acceptée

### Contexte

S1-02 demande un schéma couvrant tickets, utilisateurs et rôles, base des
tâches suivantes (CRUD, auth, assignation).

### Décision

Deux modèles Prisma :

- **`User`** : `email` (unique), `password` (hashé en amont de l'écriture),
  `name`, `role` (enum `USER` / `TECHNICIEN` / `ADMIN`, défaut `USER`).
- **`Ticket`** : `title`, `description`, `priority` (enum `BASSE` / `MOYENNE` /
  `HAUTE` / `CRITIQUE`, défaut `MOYENNE`), `status` (enum `OUVERT` / `EN_COURS`
  / `RESOLU` / `FERME`, défaut `OUVERT`), `createdAt`, `resolvedAt` (nullable),
  relation `createdBy` vers `User` (obligatoire) et `assignedTo` vers `User`
  (nullable, réassignable).

IDs en `Int` auto-incrémentés plutôt que `cuid`/`uuid`.

### Justification

- Deux relations distinctes vers `User` (créateur / assigné) plutôt qu'un seul
  champ : un ticket doit garder son auteur même après réassignation à un autre
  technicien — les fusionner aurait perdu cette information.
- `resolvedAt` nullable et distinct de `createdAt` : nécessaire pour le calcul
  du temps moyen de résolution (dashboard, S2-03) et pour valider les
  transitions de statut (tests unitaires, S1-12).
- IDs entiers auto-incrémentés : plus lisibles en base/Prisma Studio pour un
  projet de cette taille ; un `cuid` n'apporte de valeur qu'à plusieurs
  instances qui génèrent des IDs en parallèle, non pertinent ici.

### Conséquences

- Migration initiale `20260731125748_init` appliquée sur le Postgres du
  conteneur `postgres` (validée par introspection).
- Le hachage du mot de passe n'est pas dans le schéma : à implémenter dans le
  service d'auth (S1-04), pas dans la couche données.
