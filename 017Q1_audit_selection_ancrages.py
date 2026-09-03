#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDI 017Q1 — AUDIT + BRIEF AI STUDIO

Patch préparatoire pour :
sélection / points d'ancrage / Align / Parallèle / Grouper / Associer.

Ce script n'altère PAS le moteur et ne pousse rien sur GitHub.
Il inspecte le dépôt local puis produit :
  017Q1_AUDIT_SELECTION_ANCRAGES_REPORT.md
  017Q1_AI_IMPLEMENTATION_BRIEF.md

Règles fonctionnelles :
- Align et Parallèle doivent fonctionner directement avec une sélection.
- Grouper et Associer facilitent les relations, mais ne sont pas des
  prérequis artificiels.
- Les points d'ancrage doivent provenir de la géométrie/ports réels.
- Une opération = preview -> validation -> transaction Undo/Redo.
- Le JSON doit conserver les IDs et relations.
- Réutiliser les stores, types et renderer existants.
"""

from pathlib import Path
from dataclasses import dataclass

ROOT = Path.cwd()
REPORT = ROOT / "017Q1_AUDIT_SELECTION_ANCRAGES_REPORT.md"
BRIEF = ROOT / "017Q1_AI_IMPLEMENTATION_BRIEF.md"

EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".py", ".css", ".scss"
}
SKIP = {".git", "node_modules", "dist", "build", ".next"}

KEYWORDS = [
    "align", "aligned",
    "parallel", "parallele", "parallèle",
    "grouper", "groupe", "group",
    "associer", "association",
    "anchor", "ancrage", "snap",
    "selection", "sélection", "select",
    "undo", "redo", "history",
    "IsoNode", "IsoSegment", "fitting",
    "port", "point",
    "rotation", "translate", "move", "drag",
]


@dataclass
class Hit:
    path: str
    line: int
    keyword: str
    text: str


def iter_source_files():
    for p in ROOT.rglob("*"):
        if not p.is_file():
            continue
        if p.suffix.lower() not in EXTENSIONS:
            continue
        if any(part in SKIP for part in p.parts):
            continue
        yield p


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="replace")


def audit():
    hits = []
    scanned = 0
    files_with_hits = set()

    for path in iter_source_files():
        scanned += 1
        rel = str(path.relative_to(ROOT))

        for line_no, line in enumerate(read_text(path).splitlines(), 1):
            low = line.lower()

            for keyword in KEYWORDS:
                if keyword.lower() in low:
                    hits.append(
                        Hit(rel, line_no, keyword, line.strip()[:240])
                    )
                    files_with_hits.add(rel)

    return scanned, files_with_hits, hits


def build_report(scanned, files_with_hits, hits):
    grouped = {}
    for hit in hits:
        grouped.setdefault(hit.path, []).append(hit)

    lines = [
        "# 017Q1 — Audit sélection / ancrages / Align / Parallèle / Grouper / Associer",
        "",
        "> Audit préparatoire. Aucun moteur PDI n'est modifié par ce script.",
        "",
        "## Résultat",
        "",
        f"- Fichiers inspectés : **{scanned}**",
        f"- Fichiers avec occurrences : **{len(files_with_hits)}**",
        f"- Occurrences trouvées : **{len(hits)}**",
        "",
        "## Règle d'interprétation",
        "",
        "Une occurrence textuelle ne prouve pas qu'une fonction fonctionne.",
        "AI Studio doit suivre le code jusqu'au handler réellement exécuté.",
        "",
        "## Occurrences par fichier",
        "",
    ]

    if not grouped:
        lines.append("Aucune occurrence détectée : audit manuel obligatoire.")
    else:
        for filename, file_hits in sorted(grouped.items()):
            lines.append(f"### `{filename}`")
            for hit in file_hits[:100]:
                lines.append(
                    f"- L{hit.line} — `{hit.keyword}` — `{hit.text}`"
                )
            if len(file_hits) > 100:
                lines.append(
                    f"- … {len(file_hits) - 100} occurrences supplémentaires."
                )

    lines += [
        "",
        "## Plan 017Q1",
        "",
        "### 1. Sélection",
        "- Identifier la source de vérité existante.",
        "- Conserver sélection simple et multiple.",
        "- Ne pas créer un deuxième système de sélection.",
        "",
        "### 2. Points d'ancrage",
        "- Réutiliser ports, extrémités, centres, branches et sommets existants.",
        "- Ne pas créer une géométrie parallèle au moteur ISO.",
        "",
        "### 3. ALIGN",
        "Sélection → référence → point d'ancrage → axe/direction",
        "→ preview → validation → Undo.",
        "",
        "**Align doit fonctionner directement sur la sélection.**",
        "",
        "### 4. PARALLÈLE",
        "Sélection → référence → direction/axe ou second point",
        "→ preview → validation → Undo.",
        "",
        "**Parallèle doit fonctionner directement sur la sélection.**",
        "",
        "### 5. GROUPER",
        "Relation légère entre entités, sans duplication, compatible JSON et Undo/Redo.",
        "",
        "### 6. ASSOCIER",
        "Relation entre entités sans fusionner leurs identités, persistante dans JSON.",
        "",
        "### 7. Undo / Redo",
        "Une opération utilisateur doit former une transaction cohérente.",
        "",
        "### 8. JSON",
        "IDs stables, relations persistantes, import/export sans doublons.",
        "",
        "## Critères d'acceptation",
        "",
        "- [ ] Sélection simple",
        "- [ ] Sélection multiple",
        "- [ ] Align sur 2 éléments",
        "- [ ] Align sur 3 éléments ou plus",
        "- [ ] Align avec point d'ancrage",
        "- [ ] Parallèle sur 2 éléments",
        "- [ ] Parallèle avec référence",
        "- [ ] Grouper puis déplacement collectif",
        "- [ ] Associer",
        "- [ ] Undo",
        "- [ ] Redo",
        "- [ ] Export JSON",
        "- [ ] Import JSON",
        "- [ ] Aucun objet non sélectionné ne bouge",
        "- [ ] Renderer ISO affiche le résultat",
        "",
        "## Interdictions",
        "",
        "- Pas de deuxième renderer.",
        "- Pas de deuxième store de sélection.",
        "- Pas de transformation purement CSS/SVG.",
        "- Grouper/Associer ne sont pas des prérequis pour Align/Parallèle.",
        "- Pas de push GitHub automatique.",
        "",
        "## Suite",
        "",
        "AI Studio doit d'abord identifier les vrais fichiers, types, stores et",
        "handlers. Ensuite seulement il génère le patch moteur 017Q1.",
    ]

    return "\n".join(lines)


def build_brief(scanned, files_with_hits, hits):
    return f"""# 017Q1 — Brief AI Studio

## Mission

Implémenter 017Q1 dans le dépôt PDI actuel.

Workflow cible :

Sélection
→ Référence
→ Point d'ancrage
→ Opération
→ Preview
→ Validation
→ Undo

Fonctions :
- Align
- Parallèle
- Grouper
- Associer

## Règle fondamentale

**Align et Parallèle doivent fonctionner directement avec une sélection.**

Grouper et Associer servent à faciliter/conserver les relations, mais ne
doivent pas devenir des prérequis artificiels.

## Contraintes

- Réutiliser le runtime ISO existant.
- Réutiliser le store de sélection existant.
- Réutiliser les ports et la géométrie existants.
- Réutiliser Undo/Redo existant.
- Conserver la sérialisation JSON.
- Pas de deuxième renderer.
- Pas de deuxième store de sélection.
- IDs stables.
- Un seul patch 017Q1.
- Aucun push GitHub automatique.

## Audit automatique

Fichiers inspectés : {scanned}
Fichiers avec occurrences : {len(files_with_hits)}
Occurrences : {len(hits)}

## Avant toute modification

Produire ce tableau avec les vraies lignes du dépôt :

| Fonction | Fichier | Ligne | Handler réel | État actuel | Modification |
|---|---|---:|---|---|---|
| Sélection | … | … | … | … | … |
| Ancrage | … | … | … | … | … |
| Align | … | … | … | … | … |
| Parallèle | … | … | … | … | … |
| Grouper | … | … | … | … | … |
| Associer | … | … | … | … | … |
| Undo/Redo | … | … | … | … | … |
| JSON | … | … | … | … | … |

## Tests obligatoires

1. Sélection simple.
2. Sélection multiple.
3. Align 2 éléments.
4. Align 3+ éléments.
5. Align avec ancrage.
6. Parallèle 2 éléments.
7. Parallèle avec référence.
8. Grouper.
9. Associer.
10. Undo.
11. Redo.
12. Export JSON.
13. Import JSON.
14. Vérification visuelle dans le renderer ISO.

Ne jamais considérer une recherche textuelle comme preuve de fonctionnement.
Suivre le code jusqu'au handler réellement exécuté.
"""


def main():
    print("=" * 72)
    print("PDI 017Q1 — AUDIT SELECTION / ANCRAGES / ALIGN / PARALLELE")
    print("=" * 72)
    print(f"Racine : {ROOT}")

    scanned, files_with_hits, hits = audit()

    REPORT.write_text(
        build_report(scanned, files_with_hits, hits),
        encoding="utf-8",
    )
    BRIEF.write_text(
        build_brief(scanned, files_with_hits, hits),
        encoding="utf-8",
    )

    print()
    print("Audit terminé. Aucun fichier moteur n'a été modifié.")
    print(f"Rapport : {REPORT}")
    print(f"Brief   : {BRIEF}")


if __name__ == "__main__":
    main()
