# PATCH 016A2 — Hotfix hide/canvas/propriétés/clavier

Date: 2026-08-23T15:06:44

## Corrections
- Hide libère la hauteur du plan via variable CSS
- Bords ardoise/canvas affinés
- Actions propriétés élément redirigées vers inspecteur ciblé: 4
- Ouvertures globales remplacées par panneau BOM sauf export volontaire
- Capture native clavier ajoutée avant raccourcis
- Ancien raccourci P protégé quand raccourcis OFF

## Tests
1. Hide commande : le plan doit reprendre toute la hauteur.
2. Les bords du canvas doivent être plus fins.
3. Clic propriétés sur nœud/tube/té : inspecteur ciblé, pas grand tableau.
4. Raccourcis OFF : taper `copy` sur le plan ne doit plus lancer impression.
5. Entrée exécute la commande saisie.
6. BOM/tableau global uniquement via BOM/Table volontaire.
