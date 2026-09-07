# 017Q — Rapport d'Audit Pré-Implémentation & Architecture

**Date :** 2026-09-07  
**Objectif :** Progression de la maturité PD&I de ~76% à ~85% en conservant le moteur unique et en consolidant les opérations géométriques, universelles et transactionnelles.  
**Règle appliquée :** Audit approfondi du code existant avant toute modification fonctionnelle. Aucun code logique modifié dans cette phase.

---

## 1. Synthèse de l'Architecture Réelle du Dépôt

L'application PD&I repose sur une architecture SPA React + Vite + Canvas/SVG avec rendu vectoriel isométrique principal, enrichie d'une vue 3D projetée en Three.js et d'un inspecteur de propriétés universel.

### Fichiers Principaux Réellement Utilisés
| Composant / Rôle | Fichier Réel | Lignes | Responsabilité |
|---|---|---|---|
| **Moteur Isométrique Central** | `src/pdi/isometric/engine/IsometrieModuleV48d.tsx` | 11111 | Gère tout l'état interactif : graphe (`nodes`, `segments`, `lines`, `dimensions`, `supports`, `cad2dEntities`), canvas SVG, raccourcis, commandes AutoCAD, drag & drop, historique. |
| **Types du Graphe Isométrique** | `src/pdi/isometric/types/isoGraphTypes.ts` | 370 | Définitions de `IsoNode`, `IsoSegment`, `IsoFitting`, `IsoDimension`, `IsoPipingSupport`, `Cad2dEntity`. |
| **Modèle Universel d'Entités** | `src/pdi/model/pdiUniversalEntity.ts` | 315 | Interface normalisée `PdiUniversalEntity` englobant identité, géométrie, tuyauterie, matière, service, etc. |
| **Adaptateur Bidirectionnel** | `src/pdi/model/pdiUniversalAdapter.ts` | 450 | Fonctions de conversion `nodeToUniversalEntity`, `segmentToUniversalEntity`, `fittingToUniversalEntity`, `cad2dToUniversalEntity` et leurs inverses. |
| **Inspecteur Universel UI** | `src/pdi/isometric/ui/PdiUniversalPropertyInspector.tsx` | 822 | Panneau d'inspection tabulaire des propriétés industrielles (DN, PN, matériau, tag, épaisseur, etc.). |
| **Moteur Commandes AutoCAD** | `src/pdi/isometric/engine/CadAutocadEngine.ts` | 898 | Table des commandes AutoCAD (`AUTOCAD_COMMANDS`), analyseur de commande, aide en ligne. |
| **Registre des Commandes** | `src/pdi/isometric/engine/pdiRegistreCommandes.v1.ts` | 275 | Table de liaison ruban / raccourcis / commandes tuyauterie. |
| **Précision & Contrôles QA** | `src/pdi/isometric/engine/pdiPrecision017P.ts` | 96 | Fonctions de snap (`pdiSnapValue`, `pdiSnapDirectionIso`) et détection de nœuds confondus (`pdiFindCoincidentNodes`). |
| **Viewer 3D Solide Extrudé** | `src/pdi/viewer3d/Iso3DViewerModal.tsx` & `pdi3dSceneManager.ts` | 532 + 721 | Vue Three.js projetant les `nodes` et `segments` en maillages 3D (tubes, coudes, brides, vannes). |

---

## 2. Tableau d'Audit des Fonctions Cibles (avec Lignes Réelles du Dépôt)

Conformément au brief, voici l'identification exhaustive des handlers et états actuels :

| Fonction | Fichier | Ligne | Handler réel | État actuel | Modification requise |
|---|---|---:|---|---|---|
| **Sélection** | `src/pdi/isometric/engine/IsometrieModuleV48d.tsx` | 4850–5020 | `handlePointerDownIso`, `selectSegmentV44`, `handleMultiSelectBox` | 4 états disjoints (`selectedNodeIds`, `selectedSegmentIds`, `selectedFittingIds`, `selectedCad2dIds`). Pas d'ancrage pivot mémorisé. | Unifier la sélection multi-types avec identification d'une entité pivot / référence active (`activeAnchor`). |
| **Ancrage** | `src/pdi/isometric/engine/IsometrieModuleV48d.tsx` | 5450–5535, 6046 | `handlePointerMoveIso` (snaps : PORTS, ENDPOINTS, MIDPOINTS, GRID), `dimensionPick` | Détection dynamique à la souris (`detectedSnap`) sans point d'ancrage d'origine fixé pour les transformations d'alignement ou translation. | Introduire un ancrage d'origine explicite mémorisé (`anchorPoint` / `anchorNodeId`) transmis aux opérations de géométrie. |
| **Align** | `src/pdi/isometric/engine/IsometrieModuleV48d.tsx` | 6053–6091 | `alignSelectedNodesAxis(axis: "x" \| "y" \| "z")` | Fonctionne uniquement sur les nœuds, prend arbitrairement le dernier nœud (`referenceId = selectedNodeIds[selectedNodeIds.length - 1]`). Pas de support pour tronçons ou 2D. | Étendre l'alignement : référence au choix (ancrage ou premier/dernier), support des tronçons entiers sans distorsion, prévisualisation. |
| **Parallèle** | `src/pdi/isometric/engine/IsometrieModuleV48d.tsx` | 6112–6166 | `makeSelectedSegmentsParallel()` | Aligne la direction 3D du 2e segment sur le 1er segment en pivotant autour de `fromNodeId`. Échoue si les nœuds adjacents sont contraints. | Robustifier : préservation des longueurs, choix du point fixe d'ancrage, détection préalable des contraintes et feedback utilisateur. |
| **Grouper** | `src/pdi/isometric/engine/IsometrieModuleV48d.tsx` | 6817 (UI menu), types | Aucun au niveau entité | Aucun concept de groupe (`groupId`) dans le graphe ou le modèle. | Ajouter le support `groupId` dans `IsoNode`, `IsoSegment`, `Cad2dEntity` + commandes AutoCAD `GROUP` / `UNGROUP`. |
| **Associer** | `src/pdi/isometric/engine/IsometrieModuleV48d.tsx` | — | Aucun au niveau entité | Aucun lien de contrainte parent-enfant (ex: cote liée à un équipement ou support lié à un segment). | Introduire les relations d'association (`associatedEntityIds`) avec propagation des translations de l'élément maître. |
| **Undo/Redo** | `src/pdi/isometric/engine/IsometrieModuleV48d.tsx` | 1934, 2515–2590 | `commitGraph()`, `pushHistory()`, `undoGraph()`, `redoGraph()` | Clone `(nodes, segments, lines, dimensions, cad2dEntities, cad2dLayers, supports)`. | Inclure les métadonnées de groupe/association et préserver la stabilité des sélections lors de l'annulation. |
| **JSON** | `src/pdi/isometric/engine/IsometrieModuleV48d.tsx` | 6648–6663 | `exportProjectJson()`, `importProjectJson(file)` | Exporte et importe le schéma V4.7.4. | Assurer la rétrocompatibilité : nouveaux attributs optionnels avec fallback propre sans perte de données. |

---

## 3. Analyse des Dépendances & Relations Inter-Modules

```
┌─────────────────────────────────────────────────────────────────┐
│                      IsometrieModuleV48d                        │
│   (Graphe, Canvas SVG, Sélections, Historique, Commandes CAD)   │
└──────────────┬──────────────────┬─────────────────┬─────────────┘
               │                  │                 │
               ▼                  ▼                 ▼
┌─────────────────────────┐  ┌──────────────┐  ┌──────────────────┐
│  pdiUniversalAdapter    │  │ Viewer 3D    │  │  pdiPrecision    │
│  (node / segment /      │  │ (Vue Three.js│  │  (Snaps,         │
│   fitting / cad2d)      │  │  du même     │  │   coïncidence,   │
└──────────────┬──────────┘  │  graphe)     │  │   QA anomalies)  │
               ▼             └──────────────┘  └──────────────────┘
┌─────────────────────────┐
│  PdiUniversalProperty   │
│  Inspector              │
│  (Édition bidirection)  │
└─────────────────────────┘
```

1. **Relation Renderer 2D ↔ Viewer 3D :**
   - Le viewer 3D (`Iso3DViewerModal.tsx`) est bien une vue passive du graphe `(nodes, segments, supports, welds)`.
   - Il n'y a PAS de second moteur de calcul piping distinct.
   - Les données modifiées dans l'inspecteur ou sur le canvas 2D se répercutent instantanément lors de l'ouverture du viewer 3D.
2. **Relation Modèle Isométrique ↔ PdiUniversalEntity :**
   - Les conversions `nodeToUniversalEntity` et `segmentToUniversalEntity` s'exécutaient bien, mais `IsoNode` et `IsoSegment` manquaient de champs persistants pour stocker les modifications (`schedule`, `wallThicknessMm`, `service`, `notes`, `insulation`, etc.), provoquant des pertes de modifications lors des rééditions.
   - Le typage a été harmonisé dans `isoGraphTypes.ts`. L'adaptateur `pdiUniversalAdapter.ts` doit maintenant mapper de manière 100% bidirectionnelle tous les champs.

---

## 4. Problèmes Identifiés & Risques

1. **Risque de distorsion topologique sur "Align" et "Parallèle" :**
   - Si un nœud partagé par plusieurs tronçons est déplacé pour aligner un segment, tous les segments adjacents sont étirés ou pivotés.
   - *Parade :* Vérifier si le nœud déplacé a un degré de connexion > 1. Si oui, soit déplacer l'ensemble du sous-graphe connecté, soit avertir l'utilisateur avec proposition de découplage/ancrage explicite.
2. **Risque de nœuds confondus (coïncidents) :**
   - Un alignement X, Y ou Z mal calculé peut superposer deux nœuds existants.
   - *Parade :* La fonction `pdiFindCoincidentNodes(nextNodes, 0.001)` existe déjà et bloque l'opération si une coïncidence est détectée. Conserver ce garde-fou systématiquement dans `commitGraph`.
3. **Risque de rupture du format d'export JSON :**
   - Si `buildProjectFileV474()` attend une structure stricte, tout ajout non optionnel pourrait invalider l'importation.
   - *Parade :* Conserver `schemaVersion` intact ou incrémenter de façon rétrocompatible avec valeurs par défaut.

---

## 5. Découpage Méthodique des Patchs Suivants

- **PATCH 1 (Ce livrable) :** Audit + Architecture + Tableaux de concordance réels (`017Q-AUDIT.md`).
- **PATCH 2 :** Align & Parallèle professionnels (sélection directe + ancrage pivot + prévisualisation + préservation topologique).
- **PATCH 3 :** Système de Groupes (`GROUP` / `UNGROUP`) et Associations (`ASSOC`).
- **PATCH 4 :** Propriétés Universelles 100% Bidirectionnelles (Sauvegarde complète de tous les champs dans `IsoNode` / `IsoSegment` / `Cad2dEntity` + édition de sélection multiple).
- **PATCH 5 :** Robustesse Undo/Redo transactionnel + Validation QA complète du graphe.
- **PATCH 6 :** Tests de validation (14 tests obligatoires du brief) & Rapport final.
