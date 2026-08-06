"""Génère le support de soutenance (docs/presentation.pdf).

Usage : python docs/generate_presentation.py

Produit un PDF de 12 diapositives 16:9. Généré par script, comme le burn-down
et le diagramme de composants : les chiffres cités viennent tous du dépôt, et
regénérer le support après un merge coûte une commande au lieu d'une reprise
manuelle diapositive par diapositive.

Les images intégrées (docs/architecture.png, pm/burndown.png) doivent avoir été
générées au préalable par leurs propres scripts.
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.image as mpimg
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import FancyBboxPatch, Rectangle

# --- Palette, alignée sur docs/generate_architecture.py ------------------
SURFACE = "#fcfcfb"
INK_PRIMARY = "#0b0b0b"
INK_SECONDARY = "#52514e"
INK_MUTED = "#898781"
AXIS = "#c3c2b7"

BLEU = "#2a78d6"
BLEU_CLAIR = "#e8f0fb"
VERT = "#2e7d5b"
VERT_CLAIR = "#e6f2ec"
AMBRE = "#a8781f"
AMBRE_CLAIR = "#f7efdd"
ROUGE = "#b03b3b"
ROUGE_CLAIR = "#f7e9e9"
GRIS_CLAIR = "#f0efe9"

RACINE = Path(__file__).parent.parent
DOCS = RACINE / "docs"

TOTAL_DIAPOS = 12


# --- Primitives de mise en page ------------------------------------------


def nouvelle_diapo():
    """Diapositive 16:9 avec un repère 0-100 sur les deux axes."""
    fig, ax = plt.subplots(figsize=(13.333, 7.5), dpi=200)
    fig.patch.set_facecolor(SURFACE)
    ax.set_facecolor(SURFACE)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")
    fig.subplots_adjust(left=0, right=1, top=1, bottom=0)
    return fig, ax


def titre(ax, texte, chapeau=None):
    """Titre de diapositive, filet de séparation et chapeau optionnel."""
    ax.text(6, 89, texte, fontsize=25, fontweight="bold", color=INK_PRIMARY, va="top")
    ax.plot([6, 94], [83.5, 83.5], color=AXIS, linewidth=1.1)
    if chapeau:
        ax.text(6, 80.5, chapeau, fontsize=11.5, color=INK_SECONDARY, va="top")


def pied(ax, numero):
    ax.plot([6, 94], [7.5, 7.5], color=AXIS, linewidth=0.8)
    ax.text(6, 4.6, "TaskForge · soutenance du 07/08/2026", fontsize=8.5, color=INK_MUTED)
    ax.text(94, 4.6, f"{numero} / {TOTAL_DIAPOS}", fontsize=8.5, color=INK_MUTED, ha="right")


def puces(ax, x, y, items, largeur_max=None, interligne=5.2, taille=11, couleur=INK_SECONDARY):
    """Liste à puces. `items` accepte des tuples (gras, reste) ou des chaînes."""
    for i, item in enumerate(items):
        ligne_y = y - i * interligne
        ax.text(x, ligne_y, "—", fontsize=taille, color=AXIS, va="top")
        if isinstance(item, tuple):
            gras, reste = item
            ax.text(x + 2.6, ligne_y, gras, fontsize=taille, fontweight="bold",
                    color=INK_PRIMARY, va="top")
            ax.text(x + 2.6, ligne_y - interligne * 0.52, reste, fontsize=taille - 1.5,
                    color=couleur, va="top")
        else:
            ax.text(x + 2.6, ligne_y, item, fontsize=taille, color=couleur, va="top")
    return y - len(items) * interligne


def carte(ax, x, haut, largeur, couleur, fond, titre_carte=None, lignes=None,
          taille_titre=12.5, taille_ligne=10, interligne=4.2):
    """Encadré arrondi ancré par son bord haut.

    La hauteur est calculée depuis le contenu plutôt que passée en paramètre :
    fixée à la main, elle finissait par ne plus correspondre au texte et les
    dernières lignes débordaient sous la bordure.
    """
    lignes = lignes or []
    hauteur = 4.2 + (6.2 if titre_carte else 0) + len(lignes) * interligne
    bas = haut - hauteur

    ax.add_patch(
        FancyBboxPatch(
            (x, bas), largeur, hauteur,
            boxstyle="round,pad=0.5,rounding_size=1.0",
            linewidth=1.5, edgecolor=couleur, facecolor=fond, zorder=2,
        )
    )
    curseur = haut - 3.0
    if titre_carte:
        ax.text(x + 2.4, curseur, titre_carte, fontsize=taille_titre, fontweight="bold",
                color=INK_PRIMARY, va="top", zorder=3)
        curseur -= 6.2
    for ligne in lignes:
        ax.text(x + 2.4, curseur, ligne, fontsize=taille_ligne, color=INK_SECONDARY,
                va="top", zorder=3)
        curseur -= interligne
    return bas


def tableau(ax, x, y, largeurs, entetes, lignes, hauteur_ligne=5.4, taille=10.5,
            couleurs_lignes=None):
    """Tableau simple : en-tête sur fond gris, lignes séparées par un filet."""
    total = sum(largeurs)
    ax.add_patch(
        Rectangle((x, y - hauteur_ligne), total, hauteur_ligne,
                  facecolor=GRIS_CLAIR, edgecolor="none", zorder=1)
    )
    curseur_x = x
    for largeur, entete in zip(largeurs, entetes):
        ax.text(curseur_x + 1.6, y - hauteur_ligne / 2, entete, fontsize=taille,
                fontweight="bold", color=INK_PRIMARY, va="center", zorder=3)
        curseur_x += largeur

    for index, ligne in enumerate(lignes):
        haut = y - hauteur_ligne * (index + 1)
        if couleurs_lignes and couleurs_lignes[index]:
            ax.add_patch(
                Rectangle((x, haut - hauteur_ligne), total, hauteur_ligne,
                          facecolor=couleurs_lignes[index], edgecolor="none", zorder=1)
            )
        ax.plot([x, x + total], [haut, haut], color=AXIS, linewidth=0.6, zorder=2)
        curseur_x = x
        for largeur, cellule in zip(largeurs, ligne):
            gras = cellule.startswith("*")
            ax.text(curseur_x + 1.6, haut - hauteur_ligne / 2, cellule.lstrip("*"),
                    fontsize=taille, color=INK_PRIMARY if gras else INK_SECONDARY,
                    fontweight="bold" if gras else "normal", va="center", zorder=3)
            curseur_x += largeur
    bas = y - hauteur_ligne * (len(lignes) + 1)
    ax.plot([x, x + total], [bas, bas], color=AXIS, linewidth=0.6, zorder=2)
    return bas


def image(fig, chemin, gauche, bas, largeur, hauteur):
    """Insère une image dans un axes dédié, ratio préservé."""
    if not chemin.exists():
        raise FileNotFoundError(
            f"{chemin} est absent — générez-le avec son script avant le support."
        )
    axes_image = fig.add_axes([gauche, bas, largeur, hauteur])
    axes_image.imshow(mpimg.imread(chemin))
    axes_image.axis("off")


def encart(ax, x, y, largeur, hauteur, texte, couleur=AMBRE, fond=AMBRE_CLAIR, taille=10.5):
    """Bandeau d'accroche : un constat, pas une liste."""
    ax.add_patch(
        FancyBboxPatch(
            (x, y), largeur, hauteur,
            boxstyle="round,pad=0.5,rounding_size=1.0",
            linewidth=0, facecolor=fond, zorder=2,
        )
    )
    ax.add_patch(Rectangle((x, y), 0.7, hauteur, facecolor=couleur, edgecolor="none", zorder=3))
    ax.text(x + 3.0, y + hauteur / 2, texte, fontsize=taille, color=INK_SECONDARY,
            va="center", zorder=4)


# --- Diapositives ---------------------------------------------------------


def diapo_titre(pdf):
    fig, ax = nouvelle_diapo()
    ax.add_patch(Rectangle((0, 0), 1.6, 100, facecolor=BLEU, edgecolor="none"))

    ax.text(9, 63, "TaskForge", fontsize=54, fontweight="bold", color=INK_PRIMARY)
    ax.text(9, 55, "Gestion de tickets d'incidents — helpdesk interne",
            fontsize=17, color=INK_SECONDARY)
    ax.plot([9, 45], [50, 50], color=BLEU, linewidth=2.4)

    ax.text(9, 42, "Hackathon interne ForgeWorks · MVP livré en 2 semaines",
            fontsize=12, color=INK_MUTED)
    ax.text(9, 36.5, "Équipe : Arthur, Abd-Ellah, Ibrahima", fontsize=12, color=INK_MUTED)
    ax.text(9, 31, "Soutenance du 07/08/2026", fontsize=12, color=INK_MUTED)

    carte(ax, 62, 60, 32, BLEU, BLEU_CLAIR, "En un coup d'œil", [
        "React 19 · NestJS 11 · PostgreSQL 16",
        "94 story points livrés sur 96",
        "106 tests unitaires, 11 suites",
        "7 ADR datées et justifiées",
        "CI verte sur main et develop",
        "Images prod : −38 % et −85 %",
    ])
    pied(ax, 1)
    pdf.savefig(fig, facecolor=SURFACE)
    plt.close(fig)


def diapo_produit(pdf):
    fig, ax = nouvelle_diapo()
    titre(ax, "Le produit",
          "Déclarer un incident, le router vers un technicien, le suivre jusqu'à sa résolution.")

    carte(ax, 6, 74, 27, AXIS, GRIS_CLAIR, "Utilisateur", [
        "Crée un ticket : titre,",
        "description, priorité",
        "",
        "Suit l'avancement de ses",
        "déclarations",
    ])
    carte(ax, 36.5, 74, 27, BLEU, BLEU_CLAIR, "Technicien", [
        "Voit les tickets qui lui",
        "sont assignés",
        "",
        "Fait avancer les statuts",
        "jusqu'à la résolution",
    ])
    carte(ax, 67, 74, 27, VERT, VERT_CLAIR, "Admin", [
        "Gère les comptes et les",
        "rôles",
        "",
        "Assigne et réassigne, voit",
        "l'ensemble du parc",
    ])

    ax.text(6, 39, "Couverture du cahier des charges", fontsize=13, fontweight="bold",
            color=INK_PRIMARY, va="top")
    puces(ax, 6, 34, [
        "CRUD complet — priorité (basse → critique), statut (ouvert → en cours → résolu → fermé)",
        "Assignation et réassignation d'un ticket à un autre technicien",
        "Filtrage par statut, priorité et technicien · tri · recherche textuelle titre + description",
        "Dashboard : tickets ouverts / en cours / résolus, temps moyen de résolution, répartition",
    ], interligne=4.8, taille=11)

    encart(ax, 6, 9.6, 88, 6.6,
           "Hors périmètre assumé : notifications temps réel, commentaires et export — classés "
           "Could au MoSCoW, non engagés au sprint.")
    pied(ax, 2)
    pdf.savefig(fig, facecolor=SURFACE)
    plt.close(fig)


def diapo_architecture(pdf):
    fig, ax = nouvelle_diapo()
    titre(ax, "Architecture",
          "Trois services conteneurisés, un seul langage de bout en bout.")
    image(fig, DOCS / "architecture.png", 0.055, 0.185, 0.60, 0.60)

    carte(ax, 66, 78, 28, BLEU, BLEU_CLAIR, "Pourquoi ce choix", [
        "TypeScript sur les trois",
        "couches : un seul contexte",
        "mental, types partagés.",
        "",
        "NestJS impose sa structure",
        "— modules, DI, gardes. On",
        "n'invente pas d'architecture",
        "quand le temps est la",
        "contrainte principale.",
        "",
        "Prisma : schéma déclaratif",
        "qui documente la BDD.",
    ], taille_ligne=9.5, interligne=4.0)

    encart(ax, 6, 9.6, 88, 8.4,
           "Monitoring d'abord écrit à la main, puis passé sur pino et prom-client (ADR-008) : le choix maison tenait\n"
           "tant que le besoin s'arrêtait à l'exposition, plus dès qu'on vise un vrai collecteur.",
           couleur=BLEU, fond=BLEU_CLAIR)
    pied(ax, 3)
    pdf.savefig(fig, facecolor=SURFACE)
    plt.close(fig)


def diapo_adr(pdf):
    fig, ax = nouvelle_diapo()
    titre(ax, "Décisions structurantes",
          "Sept ADR écrites au moment de la décision, pas reconstituées à la fin.")

    tableau(ax, 6, 76, [11, 55, 22], ["ADR", "Décision", "Statut"], [
        ["*001", "Stack React / NestJS / PostgreSQL / Prisma", "Acceptée"],
        ["*002", "Séparation dev / prod : root en dev, non-root en prod", "Acceptée"],
        ["*003", "Développement solo assumé", "*Remplacée par 007"],
        ["*004", "Schéma : deux relations distinctes vers User", "Acceptée"],
        ["*005", "Prisma 7 dans NestJS : CJS, driver adapter", "Acceptée"],
        ["*006", "JWT Bearer + RolesGuard sur /tickets", "Acceptée"],
        ["*007", "Contribution partielle constatée", "Acceptée"],
    ], hauteur_ligne=5.3, couleurs_lignes=[None, None, AMBRE_CLAIR, None, None, None, VERT_CLAIR])

    ax.text(6, 29.5, "ADR-003 → ADR-007 : une décision trop rapide, corrigée",
            fontsize=13, fontweight="bold", color=INK_PRIMARY, va="top")
    ax.text(6, 24.5, "Le 31/07, après deux jours d'observation dont un vendredi, ADR-003 actait un développement solo.\n"
                   "Le 03/08, Abd-Ellah livrait 24 points. ADR-003 n'est pas réécrite : elle reste au dossier, marquée\n"
                   "remplacée. Effacer une erreur d'appréciation, c'est perdre la matière de la rétrospective.",
            fontsize=10.5, color=INK_SECONDARY, va="top", linespacing=1.55)
    pied(ax, 4)
    pdf.savefig(fig, facecolor=SURFACE)
    plt.close(fig)


def diapo_observabilite(pdf):
    fig, ax = nouvelle_diapo()
    titre(ax, "Observabilité",
          "Santé, logs et métriques — pino et prom-client, contrat de sortie inchangé.")

    ax.text(6, 76, "Endpoints", fontsize=13, fontweight="bold", color=INK_PRIMARY, va="top")
    tableau(ax, 6, 72, [26, 27], ["Route", "Rôle"], [
        ["GET /health", "État détaillé, 503 si dégradé"],
        ["GET /health/live", "Le processus répond"],
        ["GET /health/ready", "503 tant que la base est muette"],
        ["GET /metrics", "Format Prometheus 0.0.4"],
        ["GET /healthz", "Frontend, nginx en prod"],
    ], hauteur_ligne=5.0, taille=10)

    carte(ax, 60, 78, 34, AMBRE, AMBRE_CLAIR, "Logs JSON structurés — pino", [
        "Une ligne par événement sur stdout,",
        "dupliquée dans le volume Docker",
        "partagé taskforge_logs.",
        "",
        "timestamp · level · message",
        "request_id · user_id",
        "",
        "request_id propagé par",
        "AsyncLocalStorage et renvoyé au",
        "client dans x-request-id.",
    ], taille_ligne=9.5, interligne=4.0)

    ax.text(6, 39, "Métriques exposées", fontsize=13, fontweight="bold", color=INK_PRIMARY, va="top")
    ax.text(6, 34, "taskforge_tickets_created_total · taskforge_http_requests_total{method,status}\n"
                   "taskforge_http_request_duration_seconds (histogramme) · taskforge_users_connected",
            fontsize=10, color=INK_SECONDARY, va="top", linespacing=1.6, family="monospace")
    ax.text(6, 26, "Plus 73 séries process et Node fournies par collectDefaultMetrics() : CPU, mémoire, event loop.",
            fontsize=10, color=INK_MUTED, va="top")

    encart(ax, 6, 9.6, 88, 8.4,
           "Une honnêteté technique : Docker Compose ne redémarre pas un conteneur unhealthy — seul Swarm le fait.\n"
           "restart: unless-stopped couvre le crash, depends_on: service_healthy couvre l'ordre de démarrage.")
    pied(ax, 5)
    pdf.savefig(fig, facecolor=SURFACE)
    plt.close(fig)


def diapo_qualite(pdf):
    fig, ax = nouvelle_diapo()
    titre(ax, "Qualité et tests",
          "106 tests unitaires sur 11 suites, verts à chaque push.")

    carte(ax, 6, 74, 27, VERT, VERT_CLAIR, "Logique métier testée", [
        "Transitions de statut :",
        "ouvert → en cours → résolu",
        "et les transitions interdites",
        "",
        "Calcul du temps moyen",
        "de résolution",
    ], taille_ligne=9.5, interligne=4.0)
    carte(ax, 36.5, 74, 27, BLEU, BLEU_CLAIR, "Avant chaque commit", [
        "ESLint + Prettier",
        "",
        "Hook pre-commit Husky +",
        "lint-staged : un commit non",
        "conforme est bloqué,",
        "pas seulement signalé.",
    ], taille_ligne=9.5, interligne=4.0)
    carte(ax, 67, 74, 27, AMBRE, AMBRE_CLAIR, "CI GitHub Actions", [
        "Deux jobs à chaque push",
        "et chaque PR sur main",
        "et develop :",
        "",
        "backend — lint, build, test",
        "frontend — lint, build",
    ], taille_ligne=9.5, interligne=4.0)

    ax.text(6, 34, "La discipline qui va avec", fontsize=13, fontweight="bold",
            color=INK_PRIMARY, va="top")
    puces(ax, 6, 29, [
        "Aucun commit direct sur develop : branche, PR, CI verte, puis merge",
        "isValidStatusTransition() isolée en fonction pure — testable sans Prisma, pensée pour ça dès ADR-005",
    ], interligne=5.4, taille=11)

    encart(ax, 6, 9.6, 88, 6.6,
           "Aucune régression n'a atteint la branche d'intégration sur les deux sprints.",
           couleur=VERT, fond=VERT_CLAIR)
    pied(ax, 6)
    pdf.savefig(fig, facecolor=SURFACE)
    plt.close(fig)


def diapo_docker(pdf):
    fig, ax = nouvelle_diapo()
    titre(ax, "Docker",
          "Multi-stage, séparation dev / prod, durcissement là où il a du sens.")

    ax.text(6, 76, "Gain des multi-stage builds", fontsize=13, fontweight="bold",
            color=INK_PRIMARY, va="top")
    tableau(ax, 6, 71, [24, 17, 17, 12], ["Image", "Dev", "Prod", "Gain"], [
        ["taskforge-backend", "1.28 Go", "792 Mo", "*≈ 38 %"],
        ["taskforge-frontend", "521 Mo", "76.4 Mo", "*≈ 85 %"],
    ], hauteur_ligne=5.4, taille=10.5)

    carte(ax, 6, 52, 42, VERT, VERT_CLAIR, "Sécurité appliquée", [
        "Conteneurs non-root : USER app / USER nginx",
        ".dockerignore exclut .env, node_modules, tests",
        "Aucun secret dans l'image — injection runtime",
        "Tags versionnés via IMAGE_TAG, jamais :latest",
    ], taille_ligne=9.5, interligne=4.0)
    carte(ax, 52, 52, 42, BLEU, BLEU_CLAIR, "Deux configurations", [
        "docker-compose.yml — volumes montés,",
        "hot-reload Vite et Nest, debug actif",
        "",
        "docker-compose.prod.yml — images buildées,",
        "pas de source montée, env de production",
    ], taille_ligne=9.5, interligne=4.0)

    encart(ax, 6, 9.6, 88, 8.4,
           "Root en dev, non-root en prod : forcer USER node sur les images de dev provoque un EACCES au démarrage\n"
           "de Vite (volume anonyme node_modules appartenant à root). L'exigence est appliquée là où elle protège.")
    pied(ax, 7)
    pdf.savefig(fig, facecolor=SURFACE)
    plt.close(fig)


def diapo_burndown(pdf):
    fig, ax = nouvelle_diapo()
    titre(ax, "Gestion de sprint",
          "Deux sprints d'une semaine, 96 points engagés hors bonus.")
    image(fig, RACINE / "pm" / "burndown.png", 0.05, 0.16, 0.58, 0.62)

    carte(ax, 64, 78, 30, BLEU, BLEU_CLAIR, "Sprint goals", [
        "S1 — une application",
        "fonctionnelle de bout en bout",
        "sous Docker, CI en place.",
        "",
        "S2 — monitoring, Docker durci,",
        "tests, dashboard et filtres.",
    ], taille_ligne=9.5, interligne=4.0)
    carte(ax, 64, 41, 30, AXIS, GRIS_CLAIR, "Artefacts tenus", [
        "Kanban GitHub Projects",
        "Backlog estimé en Fibonacci",
        "9 daily logs",
        "Burn-down idéal vs réel",
        "Rétrospective Keep/Drop/Try",
    ], taille_ligne=9.5, interligne=4.0)
    pied(ax, 8)
    pdf.savefig(fig, facecolor=SURFACE)
    plt.close(fig)


def diapo_velocite(pdf):
    fig, ax = nouvelle_diapo()
    titre(ax, "Vélocité : le nominal contre le réel",
          "L'écart entre ce qui était planifié et ce qui a été commité est le fait marquant du projet.")

    ax.text(6, 76, "Points commités, par personne", fontsize=13, fontweight="bold",
            color=INK_PRIMARY, va="top")
    tableau(ax, 6, 71, [17, 19, 19], ["", "Assigné au backlog", "Réellement commité"], [
        ["*Arthur", "40 pts", "*70 pts"],
        ["*Abd-Ellah", "30 pts", "24 pts"],
        ["*Ibrahima", "24 pts", "*0 pt"],
    ], hauteur_ligne=5.4, couleurs_lignes=[None, None, ROUGE_CLAIR])

    carte(ax, 64, 71, 30, AMBRE, AMBRE_CLAIR, "La moyenne ment", [
        "Trois journées concentrent",
        "78 des 94 points livrés,",
        "soit 83 %.",
        "",
        "La moyenne de 11,75 pts/jour",
        "ne décrit aucune journée",
        "réelle du projet : le burn-down",
        "suit le rythme de merge, pas",
        "la production.",
    ], taille_ligne=9.5, interligne=4.0)

    ax.text(6, 37, "Vélocité mesurée", fontsize=13, fontweight="bold", color=INK_PRIMARY, va="top")
    ax.text(6, 32, "Sprint 1 clos : 16 points livrés sur 52 engagés — 31 %. C'est la seule valeur\n"
                   "réellement close, et donc la seule base honnête pour estimer un sprint suivant.\n"
                   "Estimer 52 points sur 4 jours pour « trois personnes » supposait 13 points par\n"
                   "jour et par personne — un chiffre jamais confronté à une capacité observée.",
            fontsize=10.5, color=INK_SECONDARY, va="top", linespacing=1.55)

    encart(ax, 6, 9.6, 88, 6.6,
           "Périmètre final : 94 points livrés sur 96 engagés. Reste le screencast (S2-11, 2 pts).",
           couleur=VERT, fond=VERT_CLAIR)
    pied(ax, 9)
    pdf.savefig(fig, facecolor=SURFACE)
    plt.close(fig)


def diapo_enseignement(pdf):
    fig, ax = nouvelle_diapo()
    titre(ax, "L'enseignement du sprint",
          "24 points assignés à quelqu'un qui n'avait pas les droits de push.")

    ax.text(6, 74, "« N'a pas contribué » et « n'a pas pu contribuer » n'appellent pas la même réponse.",
            fontsize=15, fontweight="bold", color=INK_PRIMARY, va="top")

    ax.text(6, 66, "Ibrahima n'a jamais été collaborateur du dépôt. Ce n'est pas un problème de motivation mais\n"
                   "d'onboarding — et l'équipe ne s'en est aperçue que le 05/08, à quatre jours du rendu. Le premier cas\n"
                   "appelle une redistribution des tâches, le second l'ouverture d'un accès. Traiter le second comme le\n"
                   "premier, c'est redistribuer du travail sans corriger la cause.",
            fontsize=11, color=INK_SECONDARY, va="top", linespacing=1.6)

    carte(ax, 6, 48, 42, ROUGE, ROUGE_CLAIR, "Le coût réel", [
        "Aucune rotation des rôles possible :",
        "elle suppose deux contributeurs",
        "disponibles avec les mêmes droits.",
        "",
        "Arthur a tenu PM et dev principal du",
        "30/07 au 06/08, sans regard extérieur.",
    ], taille_ligne=9.5, interligne=4.0)
    carte(ax, 52, 48, 42, VERT, VERT_CLAIR, "Ce qu'on change au prochain sprint", [
        "Vérifier les accès avant d'assigner —",
        "contrôle d'ouverture de sprint, 1 minute.",
        "",
        "Estimer sur la vélocité mesurée (16 pts),",
        "pas sur l'effectif déclaré, et fermer",
        "l'issue depuis la PR : Closes #N.",
    ], taille_ligne=9.5, interligne=4.0)

    ax.text(6, 11, "Symptôme du même angle mort : daily logs, rétrospective et support de soutenance "
                   "n'avaient aucun ticket au backlog jusqu'au 05/08.",
            fontsize=10, color=INK_MUTED, va="top")
    pied(ax, 10)
    pdf.savefig(fig, facecolor=SURFACE)
    plt.close(fig)


def diapo_retro(pdf):
    fig, ax = nouvelle_diapo()
    titre(ax, "Rétrospective",
          "Keep / Drop / Try — retour critique sur la gestion du sprint.")

    carte(ax, 6, 76, 28, VERT, VERT_CLAIR, "Keep", [
        "Estimer et découper dès J1 :",
        "le backlog chiffré existait",
        "avant la première ligne de code.",
        "",
        "Écrire les ADR au moment",
        "de la décision.",
        "",
        "Branche + PR + CI verte,",
        "sans exception.",
        "",
        "Le lot Docker/CI livré d'un",
        "bloc : le seul périmètre",
        "réellement délégué.",
    ], taille_ligne=9.5, interligne=3.9)

    carte(ax, 36.5, 76, 28, ROUGE, ROUGE_CLAIR, "Drop", [
        "Estimer sur l'effectif déclaré",
        "plutôt qu'observé.",
        "",
        "Le board comme vitrine : cinq",
        "tickets livrés sont restés",
        "ouverts jusqu'au 05/08.",
        "",
        "L'assignation nominative",
        "non vérifiée.",
        "",
        "Le rattrapage des artefacts",
        "en fin de course.",
    ], taille_ligne=9.5, interligne=3.9)

    carte(ax, 67, 76, 28, BLEU, BLEU_CLAIR, "Try", [
        "Vérifier les accès avant",
        "d'assigner.",
        "",
        "Estimer sur la vélocité",
        "mesurée : base 16 points.",
        "",
        "Fermer l'issue depuis la PR",
        "— le board se met à jour",
        "seul au merge.",
        "",
        "Un ticket par livrable du",
        "cahier des charges,",
        "artefacts PM inclus.",
    ], taille_ligne=9.5, interligne=3.9)

    ax.text(6, 12, "Ces artefacts ont documenté le projet au lieu de le piloter : un burn-down à jour au 02/08 "
                   "rendait le décrochage visible quatre jours plus tôt.",
            fontsize=10, color=INK_MUTED, va="top")
    pied(ax, 11)
    pdf.savefig(fig, facecolor=SURFACE)
    plt.close(fig)


def diapo_conclusion(pdf):
    fig, ax = nouvelle_diapo()
    titre(ax, "Ce qui est livré",
          "Le dépôt reflète l'état réel du projet : main est à jour.")

    tableau(ax, 6, 76, [40, 26, 22], ["Livrable", "État", "Où"], [
        ["Application complète (front + back + BDD)", "*Livré", "docker compose up"],
        ["Conteneurisation dev et prod", "*Livré", "docker-compose*.yml"],
        ["Schéma d'architecture + 7 ADR", "*Livré", "docs/"],
        ["Kanban, backlog estimé, 9 daily logs", "*Livré", "pm/ + GitHub Projects"],
        ["Burn-down idéal vs réel", "*Livré", "pm/burndown.png"],
        ["Rétrospective Keep / Drop / Try", "*Livré", "pm/retrospective.md"],
        ["Screencast de démo", "*En cours", "docs/screencast.mp4"],
    ], hauteur_ligne=5.2, taille=10.5)

    ax.text(6, 30, "Deux chiffres pour finir", fontsize=13, fontweight="bold",
            color=INK_PRIMARY, va="top")
    ax.text(6, 25, "94 points livrés sur 96 engagés. Et 16 points — la vélocité réellement mesurée sur le seul sprint clos,\n"
                   "celle sur laquelle on estimera le prochain.",
            fontsize=11, color=INK_SECONDARY, va="top", linespacing=1.6)

    encart(ax, 6, 9.6, 88, 6.6, "Démonstration en direct — création, assignation, résolution d'un ticket.",
           couleur=BLEU, fond=BLEU_CLAIR, taille=11.5)
    pied(ax, 12)
    pdf.savefig(fig, facecolor=SURFACE)
    plt.close(fig)


def main():
    sortie = DOCS / "presentation.pdf"
    diapos = [
        diapo_titre, diapo_produit, diapo_architecture, diapo_adr,
        diapo_observabilite, diapo_qualite, diapo_docker, diapo_burndown,
        diapo_velocite, diapo_enseignement, diapo_retro, diapo_conclusion,
    ]
    assert len(diapos) == TOTAL_DIAPOS, "TOTAL_DIAPOS ne correspond plus au nombre de diapositives"

    with PdfPages(sortie) as pdf:
        for diapo in diapos:
            diapo(pdf)
        infos = pdf.infodict()
        infos["Title"] = "TaskForge — support de soutenance"
        infos["Author"] = "Arthur, Abd-Ellah, Ibrahima"
        infos["Subject"] = "Hackathon ForgeWorks — MVP de gestion de tickets d'incidents"
        infos["Keywords"] = "TaskForge, helpdesk, NestJS, React, Docker, Scrum"

    print(f"Généré : {sortie} ({TOTAL_DIAPOS} diapositives)")


if __name__ == "__main__":
    main()
