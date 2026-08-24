# PATCH 017A - Project Setup + Tagging industriel

Date : 2026-08-24T08:54:09

## Modifications
- Module pdiTagging.ts cree
- Import du moteur de tagging ajoute
- Champs de tag ajoutes sur IsoNode
- Champs de tag ajoutes sur IsoSegment
- Etat projectSetup + persistance ajoutes
- Moteur de tagging ajoute
- Commandes PROJECTSETUP / TAGFORMAT / TAG / SERVICE / SPEC / AUTOTAG
- Bloc Tag industriel ajoute dans l inspecteur
- Fenetre Project Setup ajoutee

## Tests
1. Taper PROJECTSETUP (ou PS) : la fenetre Project Setup doit s ouvrir.
2. Verifier le format actif Tag_Ligne_Standard et l exemple 100-HC-001-CS300.
3. Selectionner un troncon, ouvrir l inspecteur : bloc Tag industriel visible.
4. Choisir un service puis une spec : le tag se genere, le materiau suit la spec.
5. Taper TAG HC CS300 sur une selection : tag applique sans doublon.
6. Taper AUTOTAG : tous les troncons recoivent un tag numerote.
7. Recharger la page : le Project Setup doit etre conserve.
8. npm run lint puis npm run build.
