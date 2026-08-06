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

Adossé à **`pino`** (logs) et **`prom-client`** (métriques) — voir
[ADR-008](docs/adr.md). Ces deux modules ont d'abord été écrits à la main,
choix défendable tant que le monitoring s'arrêtait à l'exposition ; il ne l'est
plus dès qu'on vise un vrai collecteur. Le passage aux bibliothèques apporte
73 séries process et Node sans code supplémentaire, et remplace la moyenne
cumulée par un histogramme sur lequel Prometheus sait calculer des quantiles.

Le contrat observable n'a pas bougé : mêmes cinq champs de log, mêmes noms de
métriques, même format texte 0.0.4.

| Endpoint | Rôle |
|---|---|
| `GET /health` | État détaillé de chaque composant (API, base). **503** si dégradé |
| `GET /health/live` | Liveness — le processus répond, sans toucher la base |
| `GET /health/ready` | Readiness — **503** tant que la base ne répond pas |
| `GET /metrics` | Format texte Prometheus 0.0.4 |
| `GET /healthz` (frontend) | Servi par nginx en prod, par un plugin Vite en dev |

**Logs structurés** — une ligne JSON par événement sur stdout, dupliquée dans
`$LOG_DIR/backend.log` quand `LOG_DIR` est défini (volume Docker `taskforge_logs`).
Chaque ligne porte `timestamp`, `level`, `message`, `request_id` et `user_id`.
Le `request_id` est propagé par `AsyncLocalStorage` et renvoyé au client dans
l'en-tête `x-request-id`.

**Métriques applicatives** — `taskforge_tickets_created_total`,
`taskforge_http_requests_total{method,status}`,
`taskforge_http_request_duration_seconds` (histogramme : `_bucket`, `_sum`,
`_count`), `taskforge_http_request_duration_seconds_avg`,
`taskforge_users_connected`, `taskforge_process_uptime_seconds`.

`_avg` est conservée en plus de l'histogramme parce que le cahier des charges
demande explicitement un « temps moyen de réponse API » ; les quantiles, eux,
se calculent côté Prometheus depuis les buckets.

**Métriques process et Node** — `collectDefaultMetrics()` ajoute les séries
`process_*` et `nodejs_*` (CPU, mémoire, event loop, handles), directement
exploitables par un Grafana branché sur `/metrics`.

**Health checks Docker** — les trois services portent une sonde et
`restart: unless-stopped`. À noter : Docker Compose ne redémarre pas un
conteneur passé *unhealthy* (seul Swarm le fait) ; `restart` couvre le crash et
`depends_on: condition: service_healthy` l'ordre de démarrage.

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

Mesurées localement après build (`docker images`), le 06/08/2026 :

| Image | Dev (mono-stage) | Prod (multi-stage) | Gain |
|---|---|---|---|
| `taskforge-backend` | **1.3 Go** | **746 Mo** (`0.1.0`) | ≈ 43 % |
| `taskforge-frontend` | **822 Mo** | **74.8 Mo** (`0.1.0`) | ≈ 91 % |

**Coût de `pino` et `prom-client`** (ADR-008) : l'image backend de production
passe de **736 Mo à 746 Mo**, soit **+10 Mo**, ou +1,4 %. Mesuré en construisant
le même `Dockerfile.prod` avant et après l'ajout des deux dépendances.

Re-mesurer après un build : `docker images 'taskforge-*'`.


### Sécurité Docker (prod)

- Conteneurs applicatifs en **non-root** (`USER app` / `USER nginx`)
- `.dockerignore` exclut `.env`, `node_modules`, tests, docs
- Aucun secret baked dans l'image (variables injectées au runtime)
- Tags versionnés via `IMAGE_TAG` (pas `:latest`)
