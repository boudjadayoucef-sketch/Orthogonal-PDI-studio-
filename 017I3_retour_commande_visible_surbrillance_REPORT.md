# PATCH 017I3 - retour de commande visible, surbrillance allegee

## Operations
- BACKUP : IsometrieModuleV48d.tsx.before017I3
- BACKUP : CadCommandLineBar.tsx.before017I3
- APPLIQUE : zone de retour de commande permanente
- APPLIQUE : surbrillance selection 0.35 -> 0.16, largeur +8 -> +5
- APPLIQUE : surbrillance survol 0.30 -> 0.12, largeur +4 -> +3
- APPLIQUE : halo des raccords 0.96 -> 0.28

## Verifications
- [x] retour de commande permanent
- [x] selection allegee
- [x] survol allege
- [x] halo raccords allege

## Cause du defaut PERF
Tu n as pas mal compris : **PERF fonctionnait, sa reponse etait invisible.**
Dans `CadCommandLineBar.tsx`, le texte `prompt` etait rendu a l interieur du
bloc `{cadDraftSession && ( ... )}`. Hors session de dessin, aucune reponse
n etait affichee. Le defaut ne touchait pas seulement PERF : **toutes** les
commandes qui repondent par un texte etaient muettes (SAUVER, RESTAURER, TAG,
RENUMBER, AUTOTAG, SPEC, SERVICE, STYLE, EPAISSEUR...). C est un manquement de
fait a R8 : une commande dispatchee dont l utilisateur ne voit pas le resultat
est indistinguable d une commande morte.

## Correctifs
1. Zone de retour **permanente** dans la barre de commande, a gauche du champ
   de saisie : puce cyan + texte tronque + infobulle contenant le message
   complet. L indicateur de session de dessin reste inchange quand une session
   est active, il n y a donc jamais deux blocs concurrents.
2. Surbrillance des troncons : selection `+8 px / opacite 0.35` devient
   `+5 px / 0.16` ; survol `+4 px / 0.30` devient `+3 px / 0.12`. La couleur de
   service du tube et les reperes de soudure redeviennent lisibles sous le halo.
3. Halo blanc des raccords : opacite 0.96 (quasi opaque) ramenee a 0.28.

## Tests
1. Tapez `PERF` : la reponse s affiche **maintenant** a gauche du champ CMD,
   avec le nombre de noeuds, la taille du cache en octets et la duree en ms.
   Survolez le texte pour voir le message complet en infobulle.
2. Tapez `SAUVER` puis `STYLE` puis `EPAISSEUR 1.5` : chaque commande affiche
   sa reponse. Plus aucune commande muette.
3. Selectionnez un troncon : le halo est discret, la couleur de service et les
   reperes de soudure W001 a W005 restent parfaitement lisibles.
4. Survolez un troncon non selectionne : le halo de survol est visible mais tres
   leger, et se distingue nettement de la selection.
5. Lancez une session de dessin (`T` pour un tube) : l indicateur `[SEGMENT]`
   clignotant reapparait comme avant, sans doublon avec la zone de retour.
