# PATCH 013 — Workflow ISO, doublons, coude, alignement, commandes AutoCAD

Date: 2026-08-23T13:45:51

## Corrections appliquées
- Bande basse Principe + bouton flottant supprimés
- Bouton rail BOM/Métré supprimé
- Doublon Coude horizontal supprimé
- Doublon Cotation horizontal supprimé
- Alignement AX/AY/AZ corrigé sans re-snap
- Helper orientation coude ajouté
- Orientation coude suivant tronçon corrigée
- Module actif mémorisé
- Refresh connecté conserve app/ISO
- Persistance du module actif ajoutée
- Déconnexion nettoie le module actif mémorisé

## Tests recommandés
- npm run lint
- npm run build
- recharger connecté depuis ISO : rester dans ISO
- déconnexion : retour home après landing
- insérer coude sur tronçon incliné : orientation suit le tube
- AX/AY/AZ : les points alignés ne glissent plus hors axe
