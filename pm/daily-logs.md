# Daily stand-up logs — TaskForge

Format identique chaque jour : **Fait hier / Prévu aujourd'hui / Blocages**, 5 bullet points maximum.

Les jours de week-end sont consignés au même format, sans exception. Les bornes de sprint
retenues les incluent (sprint 1 : 30/07 → 02/08, sprint 2 : 03/08 → 09/08) et le
[burn-down](burndown.png) les trace : les omettre ici ferait diverger les deux artefacts.

Les entrées du 30/07 au 05/08 ont été reconstituées a posteriori le 06/08, à partir de
l'historique Git et des dates de merge des pull requests. C'est une reconstitution, pas un
relevé pris sur le vif — elle est datée et sourcée pour cette raison.

---

## Jeudi 30/07 — J1 sprint 1

- **Fait hier** : — (démarrage du projet)
- **Prévu aujourd'hui** : arrêter la stack, initialiser le dépôt à l'arborescence attendue, rédiger le README et le sprint backlog avec estimations et priorisation MoSCoW (S1-01)
- **Blocages** : aucun

*Livré : S1-01 (2 pts) · reste 50/52*

---

## Vendredi 31/07 — J2 sprint 1

- **Fait hier** : S1-01 livré — dépôt initialisé, stack arrêtée (NestJS / React / PostgreSQL), backlog rédigé (PR #1)
- **Prévu aujourd'hui** : scaffold fullstack et docker-compose dev (S1-08), schéma Prisma tickets/users/rôles (S1-02), API CRUD tickets (S1-03), première ADR et mise en place du burn-down
- **Blocages** : aucun

*Livré : S1-08, S1-02, S1-03 (14 pts) · reste 36/52 · S1-03 commité à 15h30, PR #16 non mergée avant le week-end*

---

## Samedi 01/08 — J3 sprint 1

- **Fait hier** : 14 points livrés — scaffold Docker, schéma de base de données, API CRUD tickets
- **Prévu aujourd'hui** : rien, week-end
- **Blocages** : aucune contribution d'Abd-Ellah ni d'Ibrahima depuis l'ouverture du sprint. 36 points restent à absorber sur les 2 derniers jours du sprint, tous deux non travaillés

*Livré : 0 pt · reste 36/52*

---

## Dimanche 02/08 — J4 sprint 1 (clôture)

- **Fait hier** : rien, week-end
- **Prévu aujourd'hui** : rien, week-end. Clôture du sprint 1
- **Blocages** : sprint 1 clos à 16 points livrés sur 52, soit une vélocité de 16. Les 36 points restants sont reportés sur le sprint 2, dont la ligne de base passe donc à 80 points

*Livré : 0 pt · sprint 1 terminé à 36/52 · vélocité 16*

---

## Lundi 03/08 — J1 sprint 2

- **Fait hier** : rien, week-end. Sprint 1 clos à 16 points sur 52
- **Prévu aujourd'hui** : merger S1-03, rédiger le backlog du sprint 2 et corriger les assignations, enchaîner sur S1-10, S1-06, S2-03 et S2-04 avec la refonte de l'interface
- **Blocages** : aucun. Abd-Ellah reprend le travail et livre dans la journée le Docker de production, la CI et l'authentification JWT

*Livré : 36 pts — PR #30 (S1-11, S2-05, S2-06, S2-07, S2-09 · Abd-Ellah) et PR #32 (S1-10, S1-06, S2-03, S2-04) · reste 44/80*

---

## Mardi 04/08 — J2 sprint 2

- **Fait hier** : 36 points livrés en une journée — Docker multi-stage et CI côté Abd-Ellah, linter, formulaire tickets, dashboard et filtres côté Arthur
- **Prévu aujourd'hui** : finaliser l'UI d'authentification (S1-07), ajouter l'inscription publique et la gestion des comptes par l'admin (S2-13), merger la branche auth JWT d'Abd-Ellah (S1-04)
- **Blocages** : conflits sur `feature/auth-jwt-roles`, résolus par un merge de develop (`e5b046f`). Build des images backend cassé au passage, corrigé par `2b18e1a`

*Livré : 18 pts — PR #33 (S1-07, S2-13) et PR #31 (S1-04 · Abd-Ellah) · reste 26/80*

---

## Mercredi 05/08 — J3 sprint 2

- **Fait hier** : 18 points livrés — UI de connexion, gestion des comptes par l'admin, authentification JWT mergée. Le sprint 2 repasse devant la courbe idéale
- **Prévu aujourd'hui** : audit de l'état du dépôt et des artefacts PM, resynchronisation du board GitHub avec le sprint backlog, remise à jour du burn-down
- **Blocages** : Ibrahima n'est pas collaborateur du dépôt et n'a produit aucun commit — ses 7 tickets (24 pts) sont intouchés. Trois livrables exigés par le CDC (daily logs, rétrospective, support de soutenance) n'ont aucun ticket au backlog

*Livré : 0 story point — journée consacrée aux artefacts de suivi · reste 26/80*

---

## Jeudi 06/08 — J4 sprint 2

- **Fait hier** : board resynchronisé — 5 issues livrées mais restées ouvertes ont été fermées avec référence à leur PR, et la carte S2-13 qui manquait a été créée. Burn-down remis à jour et rendu multi-sprint (PR #36 et #37)
- **Prévu aujourd'hui** : merger les deux PR d'artefacts, créer les daily logs. <!-- À COMPLÉTER : suite de la journée -->
- **Blocages** : <!-- À COMPLÉTER --> Ibrahima toujours sans accès au dépôt ; ADR-003 (« développement solo assumé ») contredite par la reprise d'Abd-Ellah et par la nouvelle courbe, à amender ou superseder

*Livré : <!-- À COMPLÉTER --> · reste 26/80 au démarrage de la journée*

---

## Synthèse à date (06/08)

| | Sprint 1 | Sprint 2 (en cours) |
|---|---|---|
| Périmètre | 52 pts | 80 pts (44 engagés + 36 reportés) |
| Livré | 16 pts | 54 pts |
| Reste | 36 pts (reportés) | 26 pts |

Vélocité par contributeur sur l'ensemble du projet : Arthur 40 pts, Abd-Ellah 30 pts,
Ibrahima 0 pt. Les 26 points restants sont S1-05, S1-09, S1-12, S2-01, S2-02, S2-08 et
S2-10 (24 pts assignés à Ibrahima) plus S2-11, le screencast.
