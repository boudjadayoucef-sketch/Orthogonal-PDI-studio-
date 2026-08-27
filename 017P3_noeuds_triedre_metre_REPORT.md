# RAPPORT PATCH 017P3 - Noeuds, triedre X Y Z et metre par convention

## Cause racine corrigee

Deux conventions d echelle coexistaient dans le moteur :

- le cercle du noeud etait dessine en PIXELS FIXES (r = 5 a 7 px),
- le depart du tube etait calcule en UNITES MONDE (demi-longueur 0,20 m),
- la projection vaut 28 px par metre, donc l ecart valait 0,20 x 28 x zoom :
  8 px a 142 %, 24 px a 435 %, 49 px a 883 %, 130 px a 2327 %.

La rotation ne creait pas le defaut : elle le revelait, en faisant pivoter
les 6 faces auxiliaires d un noeud qui n aurait jamais du en avoir.

## Corrections

1. Un noeud simple est un POINT : le tube part de son centre. Les cotes
   centre-a-face ne sont conservees que pour les vrais composants
   (equipements et tes), conformement a la pratique isometrique.
2. Le rayon du cercle suit le zoom, borne entre 3 et 10 px : il ne peut
   plus mentir sur la position du point.
3. La rose des vents N/E/S/O de l ecran (indication geographique, sans
   lien avec le modele) est remplacee par un triedre X / Y / Z place en
   HAUT A DROITE. Les directions sont derivees de la projection du moteur,
   jamais ecrites en dur : X+ = (+cos, +sin), Y+ = (-cos, +sin), Z+ = (0, -1).
   Ce meme triedre servira de base a l orbite 3D (jalon 018).
4. La rose des vents reste sur la planche imprimee, ou elle a un sens.
5. Le metre devient exact : les tronçons etant desormais mesures de centre
   a centre pour les noeuds simples, chaque tronçon gagne les 2 x 0,20 m
   qui etaient perdus. La convention est affichee sous chaque total.

## Consequence a verifier au test

Les valeurs de longueur totale et de poids AUGMENTENT par rapport aux
anciennes valeurs (qui etaient fausses par defaut). Le BOM suit.

## Journal d execution

- DEJA : module pdiAxes017P3.ts identique
- APPLIQUE : backup cree IsometrieModuleV48d.tsx.before017P3
- APPLIQUE : E1 import du module d axes
- APPLIQUE : E2 noeud simple sans dimension (tube au centre)
- APPLIQUE : E3 rayon de noeud mis a l echelle et borne 3-10 px
- APPLIQUE : E4 triedre X Y Z en haut a droite (remplace la rose des vents ecran)
- APPLIQUE : E5 convention de metre sous le BOM
- APPLIQUE : E6 convention de metre sous le panneau lateral
- APPLIQUE : E7 convention de metre sur la planche imprimee
- MESURE : lignes 9154 -> 9158
- MESURE : md5 avant b33b7a10ef2a76594f154437aebb36aa
- MESURE : md5 apres 095cd3e1207fc71dafd49dcf6753b417

## Verifications : 13/13

- [x] module pdiAxes017P3.ts present
- [x] module expose les 5 utilitaires attendus
- [x] import branche dans le moteur
- [x] noeud simple ramene au centre dans portWorldPosition
- [x] plus aucun rayon de noeud en pixels figes
- [x] rayon borne effectivement appele
- [x] rose des vents supprimee de l ecran
- [x] triedre X Y Z present en haut a droite
- [x] triedre derive de la projection (aucune direction en dur)
- [x] rose des vents conservee sur la planche imprimee
- [x] convention de metre affichee 3 fois (BOM, panneau, impression)
- [x] aucune alert() navigateur introduite
- [x] backup du moteur present
