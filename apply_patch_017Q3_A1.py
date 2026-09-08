#!/usr/bin/env python3
"""
PD&I — PATCH 017Q3-A1
Firestore Security Baseline

Objectif:
- Supprimer l'accès public global à Firestore.
- Exiger une authentification pour toute lecture/écriture.
- Ne modifier aucun autre fichier du projet.

Usage:
    python apply_patch_017Q3_A1.py /chemin/vers/pd-i-vis-dz

Le script:
1. Vérifie que firestore.rules contient bien la règle publique attendue.
2. Crée une sauvegarde firestore.rules.bak_017Q3_A1.
3. Remplace uniquement:
       allow read, write: if true;
   par:
       allow read, write: if request.auth != null;
4. Vérifie le résultat.
"""

from __future__ import annotations

import sys
from pathlib import Path

OLD = "allow read, write: if true;"
NEW = "allow read, write: if request.auth != null;"
BACKUP_SUFFIX = ".bak_017Q3_A1"


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python apply_patch_017Q3_A1.py /chemin/vers/pd-i-vis-dz")
        return 2

    repo = Path(sys.argv[1]).expanduser().resolve()
    rules = repo / "firestore.rules"

    if not repo.is_dir():
        print(f"ERREUR: dépôt introuvable: {repo}")
        return 1

    if not rules.is_file():
        print(f"ERREUR: fichier introuvable: {rules}")
        return 1

    text = rules.read_text(encoding="utf-8")

    occurrences = text.count(OLD)

    if occurrences == 0:
        if NEW in text:
            print("Aucune modification nécessaire: la baseline authentifiée est déjà présente.")
            return 0

        print("ERREUR: la règle publique attendue n'a pas été trouvée.")
        print("Aucun fichier n'a été modifié.")
        return 1

    if occurrences != 1:
        print(
            f"ERREUR: règle publique trouvée {occurrences} fois; "
            "le patch refuse d'appliquer une modification ambiguë."
        )
        print("Aucun fichier n'a été modifié.")
        return 1

    backup = rules.with_name(rules.name + BACKUP_SUFFIX)
    if backup.exists():
        print(f"ERREUR: sauvegarde déjà présente: {backup}")
        print("Pour éviter tout écrasement, aucun fichier n'a été modifié.")
        return 1

    backup.write_text(text, encoding="utf-8")

    patched = text.replace(OLD, NEW, 1)

    # Vérification minimale du patch avant écriture finale.
    if OLD in patched or NEW not in patched:
        print("ERREUR: vérification du contenu patché échouée.")
        backup.unlink(missing_ok=True)
        return 1

    rules.write_text(patched, encoding="utf-8")

    print("PATCH 017Q3-A1 appliqué avec succès.")
    print(f"Fichier modifié : {rules}")
    print(f"Sauvegarde       : {backup}")
    print("")
    print("Changement exact :")
    print(f"  - {OLD}")
    print(f"  + {NEW}")
    print("")
    print("Aucun autre fichier n'a été modifié.")
    print("Le cloisonnement fin par utilisateur/projet reste à traiter dans un patch ultérieur.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
