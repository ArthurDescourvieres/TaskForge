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
- Multi-stage builds (frontend et backend)
- `docker-compose.yml` (développement) et `docker-compose.prod.yml` (production)
- Bonnes pratiques de sécurité : utilisateur non-root, `.dockerignore`, images versionnées

### CI/CD

- GitHub Actions : build, lint, tests à chaque push

## Lancement (développement)

Pour l'instant, seul le frontend est conteneurisé (backend et base de données à venir avec S1-08).

1. Copier le fichier d'environnement : `cp .env.example .env`
2. Lancer le conteneur : `docker compose up -d --build`
3. Ouvrir [http://localhost:5174](http://localhost:5174) (port configurable via `FRONTEND_PORT` dans `.env`)

Le code source est monté en volume : les modifications dans `frontend/src` sont prises en compte immédiatement (hot-reload).