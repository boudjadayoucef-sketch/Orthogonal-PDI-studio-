# PATCH 017C - Registre de commandes, TAGDISPLAY, RENUMBER, DATAMANAGER

Date : 2026-08-24T12:19:35

## Cause racine : commandes invisibles
- Les commandes PD&I (PROJECTSETUP, TAG, TAGFORMAT, SERVICE, SPEC, AUTOTAG, HIDE...)
  etaient traitees par executeCadCommand mais absentes de AUTOCAD_COMMANDS.
- La liste de suggestions n affiche que le catalogue : 0 resultat = liste masquee,
  d ou l impression que les commandes n existent pas (saisies project / color).
- La recherche ignorait les accents, les id et ne classait pas les resultats.

## Modifications
- 13 commandes PD&I ajoutees au catalogue d autocompletion
- Recherche de commandes normalisee et classee par pertinence
- Liste de suggestions jamais vide (execution directe en repli)
- Execution de la saisie brute avec ses arguments
- Liste de commandes remontee au premier plan
- Etats tagDisplay et dataManagerOpen ajoutes
- Moteur de renumerotation des tags ajoute
- Commandes TAGDISPLAY / RENUMBER / DATAMANAGER ajoutees
- Tags affiches sur le plan de travail
- Fenetre Data Manager ajoutee

## Tests
1. Taper project : PROJECTSETUP doit apparaitre en tete de liste, Entree ouvre la fenetre.
2. Taper color : COULEUR et COULEURSERVICE apparaissent.
3. Taper tag : TAG, TAGFORMAT, TAGDISPLAY, AUTOTAG apparaissent.
4. Taper une commande inconnue : ligne Executer cette saisie, jamais de liste vide.
5. TAG HC CS300 sur un troncon, puis TAGDISPLAY ON : le tag s affiche sur le plan.
6. RENUMBER HC 10 : les tags HC repartent de 010.
7. DATAMANAGER ou DM : table de tous les troncons, clic sur une ligne = selection.
8. npm run lint puis npm run build.
