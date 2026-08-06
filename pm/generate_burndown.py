"""Génère les burn-down charts du projet à partir de pm/burndown-data.csv.

Usage : python pm/generate_burndown.py

Pour la mise à jour quotidienne, ajouter une ligne dans burndown-data.csv puis
relancer ce script. Les colonnes attendues sont :

    date                      jour concerné (ISO)
    sprint                    numéro du sprint (1 ou 2)
    points_restants_sprint    reste à faire en fin de journée, à l'échelle du sprint
    points_restants_projet    reste à faire en fin de journée, à l'échelle des 2 semaines
    commentaire               ce qui a été livré ce jour-là

Trois fichiers sont produits :

    burndown.png            vue projet sur les 2 semaines (livrable attendu au CDC)
    burndown-sprint-1.png   détail du sprint 1
    burndown-sprint-2.png   détail du sprint 2

Les 36 points non terminés à la fin du sprint 1 sont reportés dans le périmètre
du sprint 2 : sa ligne de base est donc 80 pts (36 reportés + 44 engagés) et non
44. C'est ce report qui explique la marche de la courbe réelle au 03/08.
"""

import csv
from datetime import date, timedelta
from pathlib import Path
from typing import NamedTuple

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


# --- Configuration des sprints -------------------------------------------
class Sprint(NamedTuple):
    numero: int
    debut: date
    fin: date  # weekend inclus
    points: int


SPRINTS = [
    Sprint(numero=1, debut=date(2026, 7, 30), fin=date(2026, 8, 2), points=52),
    Sprint(numero=2, debut=date(2026, 8, 3), fin=date(2026, 8, 9), points=80),
]

# Périmètre engagé sur les 2 semaines : 104 pts au backlog moins les 8 pts de
# S2-12, bonus explicitement optionnel. Le burn-down suit l'engagement, pas
# l'optionnel — sinon la courbe paraît en retard sur du travail jamais promis.
PROJET_POINTS = 96
PROJET_DEBUT = SPRINTS[0].debut
PROJET_FIN = SPRINTS[-1].fin

# --- Palette (surface claire) --------------------------------------------
SURFACE = "#fcfcfb"
INK_PRIMARY = "#0b0b0b"
INK_SECONDARY = "#52514e"
INK_MUTED = "#898781"
GRIDLINE = "#e1e0d9"
AXIS = "#c3c2b7"
SERIE_REEL = "#2a78d6"

PM_DIR = Path(__file__).parent


def jours(debut, fin):
    """Liste des jours entre deux bornes, incluses."""
    resultat = []
    courant = debut
    while courant <= fin:
        resultat.append(courant)
        courant += timedelta(days=1)
    return resultat


def charger_releves():
    """Lit le CSV et retourne la liste des relevés, triée par date."""
    releves = []
    with open(PM_DIR / "burndown-data.csv", encoding="utf-8") as f:
        for ligne in csv.DictReader(f):
            releves.append(
                {
                    "date": date.fromisoformat(ligne["date"].strip()),
                    "sprint": int(ligne["sprint"]),
                    "sprint_restant": float(ligne["points_restants_sprint"]),
                    "projet_restant": float(ligne["points_restants_projet"]),
                    "commentaire": ligne["commentaire"],
                }
            )
    return sorted(releves, key=lambda r: r["date"])


def valider(releves):
    """Vérifie que chaque relevé tombe dans le sprint qu'il déclare."""
    par_numero = {s.numero: s for s in SPRINTS}
    for releve in releves:
        sprint = par_numero.get(releve["sprint"])
        if sprint is None:
            raise SystemExit(
                f"{releve['date'].isoformat()} : sprint {releve['sprint']} inconnu."
            )
        if not sprint.debut <= releve["date"] <= sprint.fin:
            raise SystemExit(
                f"{releve['date'].isoformat()} est déclaré dans le sprint "
                f"{sprint.numero} mais sort de ses bornes "
                f"({sprint.debut.isoformat()} → {sprint.fin.isoformat()})."
            )


def tracer(titre, sous_titre, plage, total, reel_par_jour, sortie, largeur=10):
    """Trace un burn-down : ligne idéale en pointillés, ligne réelle pleine."""
    x = list(range(len(plage) + 1))
    labels = ["Départ"] + [f"J{i}\n{d.strftime('%d/%m')}" for i, d in enumerate(plage, 1)]
    ideal = [total - (total / len(plage)) * i for i in range(len(plage) + 1)]

    # La ligne réelle s'arrête au dernier jour renseigné : une courbe qui
    # plongerait à 0 sur des jours non encore vécus serait mensongère.
    reel_x, reel_y = [0], [float(total)]
    for i, jour in enumerate(plage, 1):
        if jour not in reel_par_jour:
            break
        reel_x.append(i)
        reel_y.append(reel_par_jour[jour])

    fig, ax = plt.subplots(figsize=(largeur, 6), dpi=150)
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

    # Frontière entre les deux sprints, seulement sur la vue projet.
    if plage[0] == PROJET_DEBUT and plage[-1] == PROJET_FIN:
        frontiere = len(jours(SPRINTS[0].debut, SPRINTS[0].fin)) + 0.5
        ax.axvline(frontiere, color=AXIS, linewidth=1, linestyle=":", zorder=1)
        ax.text(
            frontiere - 0.15, total * 0.94, "Sprint 1",
            color=INK_MUTED, fontsize=9.5, ha="right",
        )
        ax.text(
            frontiere + 0.15, total * 0.94, "Sprint 2",
            color=INK_MUTED, fontsize=9.5, ha="left",
        )

    ax.annotate(
        f"{reel_y[-1]:.0f} pts",
        xy=(reel_x[-1], reel_y[-1]),
        xytext=(10, 6), textcoords="offset points",
        color=INK_SECONDARY, fontsize=11, fontweight="bold",
    )

    ax.set_title(
        titre, color=INK_PRIMARY, fontsize=15, fontweight="bold", pad=16, loc="left",
    )
    ax.text(
        0, 1.02, sous_titre,
        transform=ax.transAxes, color=INK_MUTED, fontsize=10.5,
    )

    ax.set_xlabel("Jours", color=INK_SECONDARY, fontsize=11, labelpad=10)
    ax.set_ylabel("Story points restants", color=INK_SECONDARY, fontsize=11, labelpad=10)
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_ylim(0, total * 1.08)
    ax.set_xlim(-0.25, len(plage) + 0.25)

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
    fig.savefig(sortie, facecolor=SURFACE)
    plt.close(fig)
    print(f"Généré : {sortie}")


def main():
    releves = charger_releves()
    valider(releves)

    # Vue projet.
    tracer(
        titre="Burn-down chart — Projet TaskForge",
        sous_titre=(
            f"{PROJET_POINTS} story points engagés · "
            f"{PROJET_DEBUT.strftime('%d/%m')} → {PROJET_FIN.strftime('%d/%m/%Y')} · "
            "hors bonus optionnel S2-12"
        ),
        plage=jours(PROJET_DEBUT, PROJET_FIN),
        total=PROJET_POINTS,
        reel_par_jour={r["date"]: r["projet_restant"] for r in releves},
        sortie=PM_DIR / "burndown.png",
        largeur=12,
    )

    # Vue par sprint.
    for sprint in SPRINTS:
        reel = {
            r["date"]: r["sprint_restant"]
            for r in releves
            if r["sprint"] == sprint.numero
        }
        report = ""
        if sprint.numero == 2:
            report = " · dont 36 pts reportés du sprint 1"
        tracer(
            titre=f"Burn-down chart — Sprint {sprint.numero}",
            sous_titre=(
                f"{sprint.points} story points · "
                f"{sprint.debut.strftime('%d/%m')} → {sprint.fin.strftime('%d/%m/%Y')}"
                f"{report}"
            ),
            plage=jours(sprint.debut, sprint.fin),
            total=sprint.points,
            reel_par_jour=reel,
            sortie=PM_DIR / f"burndown-sprint-{sprint.numero}.png",
        )


if __name__ == "__main__":
    main()
