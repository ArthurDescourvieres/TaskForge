# Rétrospective — TaskForge

**Date** : 06/08/2026 · **Périmètre** : sprint 1 clos (30/07 → 02/08) et sprint 2 en cours (03/08 → 09/08)

Sources : historique Git, dates de merge des PR, board GitHub, [burn-down](burndown.png) et
[daily logs](daily-logs.md). Tous les chiffres sont reproductibles depuis le dépôt.

---

## 1. Vélocité mesurée

| | Périmètre | Livré | Reste | Taux |
|---|---|---|---|---|
| Sprint 1 (clos) | 52 pts | **16 pts** | 36 pts reportés | 31 % |
| Sprint 2 (au 06/08) | 80 pts *(44 engagés + 36 reportés)* | **54 pts** | 26 pts | 68 % |
| Projet | 96 pts *(hors bonus S2-12)* | **70 pts** | 26 pts | 73 % |

**Vélocité du sprint 1 : 16 points.** C'est la seule valeur réellement close, et donc la seule
base honnête pour estimer un sprint suivant.

### La moyenne ment

| 30/07 | 31/07 | 01/08 | 02/08 | 03/08 | 04/08 | 05/08 | 06/08 |
|---|---|---|---|---|---|---|---|
| 2 | 14 | 0 | 0 | **36** | **18** | 0 | 0 |

Deux journées concentrent **54 des 70 points livrés, soit 77 %**. La moyenne de 8,75 pts/jour ne
décrit aucune journée réelle du projet.

Plus gênant : ces pics mesurent des **événements de merge, pas du travail quotidien**. Les
36 points du 03/08 incluent S1-03, commité le 31/07 et mergé le lundi seulement, et le lot
Docker/CI d'Abd-Ellah dont les quatre commits portent le même horodatage. Le burn-down suit le
rythme d'intégration de l'équipe, pas sa production.

### Nominal contre réel

| | Assigné au backlog | Réellement commité |
|---|---|---|
| Arthur | 40 pts | **46 pts** |
| Abd-Ellah | 30 pts | **24 pts** |
| Ibrahima | 24 pts | **0 pt** |

L'écart de 6 points vient de S1-02 et S1-08, attribués à Abd-Ellah au backlog mais commités par
Arthur le 31/07 (`6b9b766`, `136a569`) — trois jours avant le premier commit d'Abd-Ellah. La
colonne « Assigné à » a donc décrit une intention de planification, pas une réalité d'exécution,
et personne ne l'a corrigée pendant une semaine. S1-02 cumule même trois versions
contradictoires : Abd-Ellah au backlog, Arthur sur GitHub, Arthur dans le code.

---

## 2. Rotation des rôles

**Elle n'a pas eu lieu.** Arthur a tenu simultanément le rôle de PM (backlog, board, ADR,
burn-down, daily logs) et celui de développeur principal du 30/07 au 06/08, sans interruption ni
passation.

Trois causes, dans l'ordre chronologique :

1. **Le sprint 1 n'avait qu'une personne active.** Une rotation suppose au minimum deux
   contributeurs disponibles en même temps ; la condition n'était pas réunie avant le 03/08.
2. **Aucun mécanisme de passation n'avait été prévu au démarrage.** Le 03/08, à l'arrivée
   d'Abd-Ellah, le rôle PM était déjà installé et outillé par une seule personne : le transférer
   coûtait plus cher que le garder. Rationnel à court terme, verrouillant à moyen terme.
3. **Ibrahima n'a jamais été collaborateur du dépôt.** Aucune rotation n'est possible avec
   quelqu'un qui n'a pas les droits de push. Ce n'est pas un problème de motivation mais
   d'onboarding : 24 points ont été assignés à une personne structurellement empêchée de les
   livrer, et l'équipe ne s'en est aperçue que le 05/08.

**Le coût est mesurable.** Tous les artefacts de suivi ayant été produits par la même personne,
aucun regard extérieur ne s'est exercé sur la planification. C'est très exactement ce qui a
laissé trois livrables exigés par le cahier des charges — daily logs, rétrospective, support de
soutenance — sans aucun ticket au backlog jusqu'au 05/08. Un PM tournant les aurait probablement
vus en relisant le backlog d'un autre.

ADR-003 (« développement solo assumé », 31/07) avait anticipé ce constat et l'avait renvoyé à la
présente rétrospective. Elle est aujourd'hui **partiellement invalidée** : elle a été décidée sur
deux jours de données, dont un vendredi, et Abd-Ellah a livré 24 points trois jours plus tard.
Elle a été remplacée par ADR-007 le 06/08.

---

## 3. Keep

- **Estimer et découper dès J1.** Le backlog chiffré existait avant la première ligne de code.
  C'est ce qui permet aujourd'hui de mesurer un écart de 69 % sur le sprint 1 au lieu de le
  ressentir vaguement.
- **Écrire les ADR au moment de la décision.** Six ADR en cinq jours, datées et justifiées.
- **La discipline branche + PR + CI.** Aucun commit direct sur `develop`, CI verte exigée avant
  merge dès le 03/08. Aucune régression n'a atteint la branche d'intégration.
- **Le lot Docker prod / CI d'Abd-Ellah.** Livré d'un bloc, cohérent, documenté avec les gains de
  taille d'image mesurés. Le seul périmètre du projet réellement délégué et autonome — c'est le
  modèle à reproduire.

## 4. Drop

- **Estimer sur l'effectif déclaré.** 52 points sur 4 jours pour « trois personnes » supposaient
  13 points/jour/personne active. Le chiffre n'a jamais été confronté à une capacité observée.
- **Le board comme vitrine.** Cinq tickets livrés sont restés ouverts jusqu'au 05/08 et S2-13
  n'avait aucune carte. Vu du board, le sprint semblait à moitié fait alors qu'il était livré.
  Un Kanban qu'on reconstitue après coup ne sert plus à piloter.
- **L'assignation nominative non vérifiée.** Attribuer des tickets sans confirmer ni la
  disponibilité ni les droits d'accès produit une planification décorative.
- **Le rattrapage des artefacts en fin de course.** Burn-down gelé cinq jours, daily logs rédigés
  d'un seul coup le 06/08. Ces artefacts ont documenté le projet au lieu de le piloter — un
  burn-down à jour au 02/08 aurait rendu le décrochage visible quatre jours plus tôt.
- **Décider trop vite sur peu de données.** ADR-003 tranchait l'organisation de l'équipe sur deux
  jours d'observation. Une décision de cette portée méritait d'attendre la fin du sprint 1.

## 5. Try

- **Vérifier les accès avant d'assigner.** Aucun ticket à quelqu'un qui n'est pas collaborateur
  du dépôt. Contrôle d'ouverture de sprint, une minute.
- **Estimer sur la vélocité mesurée.** Base 16 points pour un sprint d'une semaine, ajustée à la
  hausse seulement si la capacité réelle se confirme. Mieux vaut un sprint tenu qu'un sprint
  ambitieux raté à 69 %.
- **Fermer l'issue depuis la PR** (`Closes #N` dans la description). Le board se met à jour seul
  au merge, la dérive constatée devient structurellement impossible.
- **Un ticket par livrable du cahier des charges, artefacts PM inclus.** La rétrospective,
  les daily logs et le support de soutenance sont des livrables notés au même titre que le code.
- **Confier le rôle PM à Abd-Ellah pour la fin du sprint 2.** Même sur trois jours, cela crée le
  regard extérieur qui a manqué et teste concrètement la passation.

---

## 6. Ce que cette rétrospective ne peut pas encore trancher

Le sprint 2 n'est pas terminé : 26 points restent ouverts pour trois jours (07 → 09/08), dont 24
sur des tickets d'Ibrahima toujours sans accès au dépôt. Le burn-down montre **trois jours
consécutifs sans mouvement** (04, 05 et 06/08) et la ligne idéale repasse sous la ligne réelle à
J5 : l'avance prise le 03/08 se consomme.

Ces points couvrent le monitoring (S1-09 `/health`, S2-01 logs JSON, S2-02 `/metrics`) et une
partie des tests (S1-12, S2-08) — deux sections entières du cahier des charges. Vélocité finale
du sprint 2 et taux de complétion sont à mettre à jour ici après le 09/08.
