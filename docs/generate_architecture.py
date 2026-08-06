"""Génère le diagramme de composants du projet (S2-10).

Usage : python docs/generate_architecture.py

Produit docs/architecture.png. Le diagramme est généré par script, comme le
burn-down, pour rester régénérable et versionnable : une image dessinée à la
main diverge du code dès la première refonte.
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch

# --- Palette, alignée sur pm/generate_burndown.py ------------------------
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
GRIS_CLAIR = "#f0efe9"

DOCS = Path(__file__).parent


def boite(ax, x, y, largeur, hauteur, titre, lignes, couleur, fond):
    """Composant : titre en gras, détails en dessous."""
    ax.add_patch(
        FancyBboxPatch(
            (x, y),
            largeur,
            hauteur,
            boxstyle="round,pad=0.6,rounding_size=1.2",
            linewidth=1.6,
            edgecolor=couleur,
            facecolor=fond,
            zorder=2,
        )
    )
    ax.text(
        x + largeur / 2,
        y + hauteur - 2.6,
        titre,
        ha="center",
        va="top",
        fontsize=11,
        fontweight="bold",
        color=INK_PRIMARY,
        zorder=3,
    )
    for i, ligne in enumerate(lignes):
        ax.text(
            x + largeur / 2,
            y + hauteur - 6.4 - i * 3.1,
            ligne,
            ha="center",
            va="top",
            fontsize=8.5,
            color=INK_SECONDARY,
            zorder=3,
        )


def fleche(ax, depart, arrivee, etiquette, decalage=(0, 1.6), couleur=BLEU):
    ax.add_patch(
        FancyArrowPatch(
            depart,
            arrivee,
            arrowstyle="-|>",
            mutation_scale=14,
            linewidth=1.5,
            color=couleur,
            zorder=4,
            shrinkA=2,
            shrinkB=2,
        )
    )
    milieu_x = (depart[0] + arrivee[0]) / 2 + decalage[0]
    milieu_y = (depart[1] + arrivee[1]) / 2 + decalage[1]
    ax.text(
        milieu_x,
        milieu_y,
        etiquette,
        ha="center",
        va="center",
        fontsize=8,
        color=INK_SECONDARY,
        bbox=dict(facecolor=SURFACE, edgecolor="none", pad=1.4),
        zorder=5,
    )


def main():
    fig, ax = plt.subplots(figsize=(13, 8.5), dpi=150)
    fig.patch.set_facecolor(SURFACE)
    ax.set_facecolor(SURFACE)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    ax.text(
        2, 96, "TaskForge — diagramme de composants",
        fontsize=16, fontweight="bold", color=INK_PRIMARY,
    )
    ax.text(
        2, 92.4,
        "Services, flux de données et sondes de santé · généré par docs/generate_architecture.py",
        fontsize=9.5, color=INK_MUTED,
    )

    # --- Client, hors conteneur ---
    boite(ax, 6, 79, 24, 9, "Navigateur",
          ["React SPA, jeton JWT en mémoire"], AXIS, GRIS_CLAIR)

    # --- Frontière Docker Compose ---
    ax.add_patch(
        FancyBboxPatch(
            (3, 8), 94, 63,
            boxstyle="round,pad=0.8,rounding_size=1.5",
            linewidth=1.4, linestyle=(0, (5, 4)),
            edgecolor=AXIS, facecolor="none", zorder=1,
        )
    )
    ax.text(5.5, 68.5, "Réseau Docker Compose", fontsize=9,
            color=INK_MUTED, style="italic", zorder=3)

    # --- Services ---
    boite(ax, 6, 44, 21, 20, "Frontend",
          ["React 19 + Vite + Tailwind",
           "dev : Vite  ·  5173",
           "prod : nginx non-root · 8080",
           "GET /healthz"],
          BLEU, BLEU_CLAIR)

    boite(ax, 39, 20, 27, 44, "Backend — API NestJS",
          ["Node 22  ·  port 3000",
           "",
           "AuthModule — JWT + RolesGuard",
           "TicketsModule — CRUD, filtres,",
           "assignation, stats",
           "UsersModule — comptes et rôles",
           "HealthModule — /health, /ready",
           "MetricsModule — /metrics",
           "LoggingModule — logs JSON"],
          BLEU, BLEU_CLAIR)

    boite(ax, 73, 44, 22, 20, "PostgreSQL 16.6",
          ["Accès via Prisma 7",
           "port 5432",
           "volume postgres_data",
           "sonde pg_isready"],
          VERT, VERT_CLAIR)

    boite(ax, 73, 20, 22, 16, "Volume logs",
          ["JSON Lines · une ligne par événement",
           "timestamp, level, message,",
           "request_id, user_id"],
          AMBRE, AMBRE_CLAIR)

    # --- Flux ---
    # Le label HTTP est remonté au-dessus de la frontière Docker (y = 71) :
    # posé au milieu de la flèche il se superposait au cadre en pointillés.
    fleche(ax, (16, 78.4), (16, 65.4), "HTTP", decalage=(-4.5, 4.2))
    fleche(ax, (27.6, 54), (38.4, 54), "REST /tickets, /auth\nBearer JWT", decalage=(0, 5.4))
    fleche(ax, (66.6, 54), (72.4, 54), "Prisma\nTCP 5432", decalage=(0, 4.6), couleur=VERT)
    fleche(ax, (66.6, 28), (72.4, 28), "écriture\nJSON", decalage=(0, 4.2), couleur=AMBRE)

    # --- Sondes Docker ---
    ax.text(
        6, 13.4,
        "Health checks Docker  ·  frontend : GET /healthz   ·   backend : GET /health/ready   ·   postgres : pg_isready",
        fontsize=8.5, color=INK_SECONDARY,
    )
    ax.text(
        6, 10.2,
        "depends_on: condition service_healthy  →  aucun service ne démarre avant que sa dépendance ne réponde.",
        fontsize=8.5, color=INK_MUTED,
    )

    fig.tight_layout()
    sortie = DOCS / "architecture.png"
    fig.savefig(sortie, facecolor=SURFACE)
    plt.close(fig)
    print(f"Généré : {sortie}")


if __name__ == "__main__":
    main()
