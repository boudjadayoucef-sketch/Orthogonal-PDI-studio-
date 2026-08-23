# PATCH 015 — Réparation commande visible, décalage dessin, épaisseur tuyauterie

Date: 2026-08-23T14:18:32

## Corrections
- État pipeStrokeScale ajouté
- Persistance pipeStrokeScale ajoutée
- Épaisseur tuyauterie rendue configurable
- Ancienne barre commande dans panneau supprimée: 1
- Barre de commande fixe ajoutée en bas
- CSS dock commande + marge basse ajouté

## Points importants
- La ligne de commande est maintenant un dock fixe en bas, visible même si le panneau droit est fermé.
- L'ancien emplacement dans le panneau droit est supprimé pour éviter le doublon.
- Le dessin n'est pas recalculé ni déplacé : on réserve seulement une marge basse pour l'UI.
- L'épaisseur des lignes de tuyauterie est configurable globalement via `Ép.`.
- La valeur est mémorisée dans `localStorage` : `pdi.pipeStrokeScale.v1`.

## Tests à faire
1. Ouvrir ISO : la commande doit être visible en bas.
2. Taper `COPIE`, `COUDE`, `BOM` : le prompt doit répondre.
3. Modifier `Ép.` : les lignes de tuyauterie doivent changer d'épaisseur sans déplacer les points.
4. Vérifier que le dessin n'est plus repoussé/décalé par le panneau de commande.
5. Lancer `npm run lint` puis `npm run build`.
