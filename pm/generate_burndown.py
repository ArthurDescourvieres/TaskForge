"""Génère le burn-down chart du sprint à partir de pm/burndown-data.csv.

Usage : python pm/generate_burndown.py

Pour la mise à jour quotidienne, ajouter une ligne dans burndown-data.csv
(date, points restants en fin de journée, commentaire) puis relancer ce script.
"""

import csv
from datetime import date, timedelta
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

# --- Configuration du sprint ---------------------------------------------
SPRINT_NAME = "Sprint 1"
SPRINT_START = date(2026, 7, 30)
SPRINT_END = date(2026, 8, 2)  # weekend inclus
TOTAL_POINTS = 52

# --- Palette (surface claire) --------------------------------------------
SURFACE = "#fcfcfb"
INK_PRIMARY = "#0b0b0b"
INK_SECONDARY = "#52514e"
INK_MUTED = "#898781"
GRIDLINE = "#e1e0d9"
AXIS = "#c3c2b7"
SERIE_REEL = "#2a78d6"

PM_DIR = Path(__file__).parent


def sprint_days():
    """Liste des jours du sprint, bornes incluses."""
    days = []
    current = SPRINT_START
    while current <= SPRINT_END:
        days.append(current)
        current += timedelta(days=1)
    return days


def load_actuals():
    """Lit le CSV et retourne {date: points_restants}."""
    actuals = {}
    with open(PM_DIR / "burndown-data.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            jour = date.fromisoformat(row["date"].strip())
            actuals[jour] = float(row["points_restants"])
    return actuals


def main():
    days = sprint_days()
    actuals = load_actuals()

    inconnues = sorted(d for d in actuals if d not in days)
    if inconnues:
        raise SystemExit(
            "Dates hors du sprint dans burndown-data.csv : "
            + ", ".join(d.isoformat() for d in inconnues)
        )

    # Axe X : un point de départ (avant J1) puis chaque jour du sprint.
    x = list(range(len(days) + 1))
    labels = ["Départ"] + [f"J{i}\n{d.strftime('%d/%m')}" for i, d in enumerate(days, 1)]

    # Ligne idéale : décroissance linéaire de TOTAL_POINTS à 0.
    ideal = [TOTAL_POINTS - (TOTAL_POINTS / len(days)) * i for i in range(len(days) + 1)]

    # Ligne réelle : s'arrête au dernier jour renseigné.
    reel_x, reel_y = [0], [float(TOTAL_POINTS)]
    for i, jour in enumerate(days, 1):
        if jour not in actuals:
            break
        reel_x.append(i)
        reel_y.append(actuals[jour])

    fig, ax = plt.subplots(figsize=(10, 6), dpi=150)
    fig.patch.set_facecolor(SURFACE)
    ax.set_facecolor(SURFACE)

    ax.plot(
        x, ideal,
        linestyle="--", linewidth=2, color=INK_MUTED,
        marker="o", markersize=5, label="Idéal",
        zorder=2,
    )
    ax.plot(
        reel_x, reel_y,
        linestyle="-", linewidth=2, color=SERIE_REEL,
        marker="o", markersize=8,
        markeredgecolor=SURFACE, markeredgewidth=2,
        label="Réel", zorder=3,
    )

    # Label direct sur le dernier point réel uniquement.
    ax.annotate(
        f"{reel_y[-1]:.0f} pts",
        xy=(reel_x[-1], reel_y[-1]),
        xytext=(10, 6), textcoords="offset points",
        color=INK_SECONDARY, fontsize=11, fontweight="bold",
    )

    ax.set_title(
        f"Burn-down chart — {SPRINT_NAME}",
        color=INK_PRIMARY, fontsize=15, fontweight="bold", pad=16, loc="left",
    )
    periode = f"{SPRINT_START.strftime('%d/%m')} → {SPRINT_END.strftime('%d/%m/%Y')}"
    ax.text(
        0, 1.02, f"{TOTAL_POINTS} story points · {periode}",
        transform=ax.transAxes, color=INK_MUTED, fontsize=10.5,
    )

    ax.set_xlabel("Jours du sprint", color=INK_SECONDARY, fontsize=11, labelpad=10)
    ax.set_ylabel("Story points restants", color=INK_SECONDARY, fontsize=11, labelpad=10)
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_ylim(0, TOTAL_POINTS * 1.08)
    ax.set_xlim(-0.25, len(days) + 0.25)

    ax.grid(axis="y", color=GRIDLINE, linewidth=1, zorder=0)
    ax.set_axisbelow(True)
    for cote in ("top", "right"):
        ax.spines[cote].set_visible(False)
    for cote in ("left", "bottom"):
        ax.spines[cote].set_color(AXIS)
    ax.tick_params(colors=INK_MUTED, labelsize=10, length=0)

    legende = ax.legend(frameon=False, loc="upper right", fontsize=11)
    for texte in legende.get_texts():
        texte.set_color(INK_SECONDARY)

    fig.tight_layout()
    sortie = PM_DIR / "burndown.png"
    fig.savefig(sortie, facecolor=SURFACE)
    print(f"Généré : {sortie}")


if __name__ == "__main__":
    main()
