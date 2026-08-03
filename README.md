# TaskForge

Application de gestion de tickets d'incidents (helpdesk interne).

## Stack technique

### Application

- **Frontend** : React
- **Backend** : NestJS
- **Base de données** : PostgreSQL + Prisma (ORM)
- **Authentification** : JWT + middleware de rôles (utilisateur / technicien / admin)

### Tests & qualité

- **Backend** : Jest
- **Frontend** : Vitest
- **Linter / formatter** : ESLint + Prettier
- **Pre-commit hook** : Husky

### Monitoring & observabilité

- **Logging structuré** : Pino (`nestjs-pino`)
- **Métriques** : `prom-client` (endpoint `/metrics`, format Prometheus)
- **Health check** : `/health` (backend), `/healthz` (frontend)

### Docker

- Conteneurisation complète : frontend, backend, base de données
- Multi-stage builds (frontend et backend) via `Dockerfile.prod`
- `docker-compose.yml` (développement) et `docker-compose.prod.yml` (production)
- Bonnes pratiques de sécurité : utilisateur non-root, `.dockerignore`, images versionnées (`IMAGE_TAG`, pas `:latest`)

### CI/CD

- GitHub Actions : build, lint, tests à chaque push / PR sur `main` et `develop`

## Lancement (développement)

Hot-reload, volumes source montés, images mono-stage (ADR-002).

1. Copier le fichier d'environnement : `cp .env.example .env`
2. Lancer la stack : `docker compose up -d --build`
3. Frontend : [http://localhost:5173](http://localhost:5173) (port via `FRONTEND_PORT`)
4. Backend : [http://localhost:3000](http://localhost:3000) (port via `BACKEND_PORT`)

## Lancement (production)

Images multi-stage, pas de volumes source, utilisateur non-root, tags versionnés.

1. Copier et **renforcer** les secrets : `cp .env.example .env`
   - `POSTGRES_PASSWORD` fort
   - `JWT_SECRET` long et aléatoire
   - optionnel : `IMAGE_TAG=0.1.0` (défaut `0.1.0`, jamais `latest`)
2. Lancer : `docker compose -f docker-compose.prod.yml up -d --build`
3. Frontend (nginx) : [http://localhost:8080](http://localhost:8080)
4. Backend : [http://localhost:3000](http://localhost:3000)

### Tailles d'image (multi-stage)

Mesurées localement après build (`docker images`) :

| Image | Dev (mono-stage) | Prod (multi-stage) | Gain |
|---|---|---|---|
| `taskforge-backend` | **1.28 Go** | **792 Mo** (`0.1.0`) | ≈ 38 % |
| `taskforge-frontend` | **521 Mo** | **76.4 Mo** (`0.1.0`) | ≈ 85 % |

Re-mesurer après un build : `docker images 'taskforge-*'`.


### Sécurité Docker (prod)

- Conteneurs applicatifs en **non-root** (`USER app` / `USER nginx`)
- `.dockerignore` exclut `.env`, `node_modules`, tests, docs
- Aucun secret baked dans l'image (variables injectées au runtime)
- Tags versionnés via `IMAGE_TAG` (pas `:latest`)
