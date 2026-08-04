
# Sprint Backlog - TaskForge

Équipe : Arthur, Abd-Ellah, Ibrahima
Durée : 2 semaines (2 sprints d'1 semaine)
Estimation : Story points (échelle Fibonacci : 1, 2, 3, 5, 8, 13)

---

## Priorisation MoSCoW

| Fonctionnalité | Priorité |
|---|---|
| Gestion des tickets (CRUD) | Must |
| Système de rôles (user/technicien/admin) | Must |
| Assignation et réassignation | Must |
| Health check (/health, /healthz) | Must |
| Logging structuré JSON | Must |
| Endpoint /metrics | Must |
| Tests unitaires (logique métier) | Must |
| Linter + formatter + pre-commit | Must |
| CI GitHub Actions | Must |
| Multi-stage builds Docker | Must |
| Séparation dev / prod (docker-compose) | Must |
| Sécurité Docker (non-root, .dockerignore, tags) | Must |
| Dashboard (statistiques, temps moyen) | Should |
| Filtrage et tri | Should |
| Recherche textuelle | Should |
| Notifications temps réel | Could |
| Commentaires sur tickets | Could |
| Export CSV / PDF | Could |
| Prometheus / Grafana complet | Won't (cette fois) |

**Justification du Won't** : la consigne précise explicitement que l'exposition basique des métriques suffit, un vrai Prometheus/Grafana serait hors scope pour un MVP en 2 semaines.

---

## Sprint 1 (Semaine 1)

**Sprint Goal** : avoir une application fonctionnelle de bout en bout (CRUD tickets + rôles + auth) tournant en local via Docker, avec la CI et les checks de base en place.

| ID | Tâche | Story Points | Assigné à | Statut |
|---|---|---|---|---|
| S1-01 | Choix stack + setup repo (arborescence attendue) | 2 | Arthur | In Progress |
| S1-02 | Schéma de BDD (tickets, users, rôles) | 3 | Abd-Ellah | Done |
| S1-03 | API : CRUD tickets (créer/consulter/modifier/fermer) | 8 | Arthur | Done |
| S1-04 | API : authentification + système de rôles | 8 | Abd-Ellah | To Do |
| S1-05 | API : assignation / réassignation | 5 | Ibrahima | To Do |
| S1-06 | Frontend : formulaire création + liste tickets | 8 | Arthur | Done |
| S1-07 | Frontend : connexion / gestion des rôles côté UI | 5 | Arthur | To Do |
| S1-08 | Docker Compose dev (front + back + BDD) | 3 | Abd-Ellah | Done |
| S1-09 | Endpoint /health + /healthz | 2 | Ibrahima | To Do |
| S1-10 | Setup linter + formatter + pre-commit hook | 2 | Arthur | Done |
| S1-11 | Pipeline CI basique (build + lint) | 3 | Abd-Ellah | To Do |
| S1-12 | Premiers tests unitaires (transitions de statut) | 3 | Ibrahima | To Do |

**Total Sprint 1** : 52 points

---

## Sprint 2 (Semaine 2)

**Sprint Goal** : compléter le monitoring, sécuriser et optimiser le Docker, finaliser les tests/CI, et ajouter le dashboard + filtres. Bonus si le temps le permet.

| ID | Tâche | Story Points | Assigné à | Statut |
|---|---|---|---|---|
| S2-01 | Logging structuré JSON (backend) | 3 | Ibrahima | To Do |
| S2-02 | Endpoint /metrics (format Prometheus) | 3 | Ibrahima | To Do |
| S2-03 | Dashboard : stats + temps moyen de résolution | 5 | Arthur | Done |
| S2-04 | Filtrage, tri et recherche textuelle | 5 | Arthur | Done |
| S2-05 | Multi-stage builds Dockerfiles (front + back) | 5 | Abd-Ellah | To Do |
| S2-06 | docker-compose.prod.yml (séparation dev/prod) | 3 | Abd-Ellah | To Do |
| S2-07 | Sécurité Docker (non-root, .dockerignore, tags versionnés) | 3 | Abd-Ellah | To Do |
| S2-08 | Compléter les tests unitaires (calcul temps moyen, conflits) | 5 | Ibrahima | To Do |
| S2-09 | CI : ajout de l'étape tests | 2 | Abd-Ellah | To Do |
| S2-10 | Schéma d'architecture + ADR | 3 | Ibrahima | To Do |
| S2-11 | Screencast de démo (3-5 min) | 2 | Arthur | To Do |
| S2-12 | Bonus (si temps restant) : notifications, commentaires ou export | 8 | Équipe (à confirmer) | To Do |
| S2-13 | Inscription publique + gestion des comptes et rôles par l'admin | 5 | Arthur | Done |

**Total Sprint 2** : 52 points (hors bonus optionnel)

**Note sur S2-13** : tâche ajoutée en cours de sprint. Le cahier des charges
demande « Admin : gère tout (utilisateurs, tickets, configuration) », or aucune
tâche ne couvrait la gestion des comptes : le seul moyen de créer un technicien
était le seed. L'inscription publique, elle, n'est pas exigée par la consigne —
elle a été ajoutée pour rendre le parcours complet lors de la démo.
