# 017Q1 — Brief AI Studio

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

Fichiers inspectés : 244
Fichiers avec occurrences : 233
Occurrences : 13610

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
