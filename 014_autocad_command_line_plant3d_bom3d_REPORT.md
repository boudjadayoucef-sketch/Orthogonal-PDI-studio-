# PATCH 014 — Ligne de commande AutoCAD / Plant 3D + BOM/3D

Date: 2026-08-23T13:59:49

## Ajouts
- Registre `PDI_PLANT3D_COMMAND_TABLE` avec commandes AutoCAD Plant 3D + AutoCAD de base.
- Alias français/anglais : `COPIE`, `COPY`, `CO`, `PLANTPIPEADD`, `PPA`, etc.
- Statuts de préparation : `implemented`, `prepared`, `future_3d`, `bom_export`.
- Colonnes `PDI_BOM_EXPORT_COLUMNS` pour préparer export BOM.
- Tableau Markdown `014_COMMANDES_PLANT3D_BOM3D_TABLE.md`.

## Principe
Les commandes déjà supportées peuvent lancer les actions existantes. Les commandes Plant 3D non encore natives restent déclarées et renvoient un message de préparation, afin de préparer proprement le passage 3D sans casser l’ISO actuel.

## Tests recommandés
- npm run lint
- npm run build
- Tester dans la barre de commande : `COPIE`, `CO`, `MOVE`, `COUDE`, `BOM`, `PLANTPIPEADD`, `PPA`, `DATAMANAGER`, `3DORBIT`.
