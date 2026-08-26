# PATCH 017P - Precision geometrique du moteur isometrique

Regle R24 : precision avant volume. Aucune fonctionnalite 3D n est ajoutee ici.

## Ce que le patch corrige

1. Accroche a la creation. `snapIsoV4` n etait applique qu au glissement.
   Les creations de noeud, de te et de coude ne retenaient QUE la grille et
   ignoraient l accroche detectee (port, extremite, milieu) : c est la cause
   premiere du dessin imprecis. Elles passent par `pdiCreatePoint`.
2. Tolerances d accroche. Valeurs 14 / 14 / 12 / 8 codees en dur remplacees
   par `PDI_SNAP_TOL_PX`, en pixels ecran, donc stables a tout zoom.
3. Alignement. La coordonnee de reference est ramenee sur le pas de grille,
   sans re-snap lateral (le PATCH 013 n est pas regresse), et la commande
   refuse de valider si deux noeuds deviennent confondus.
4. Rendre parallele. La direction de reference est ramenee sur un des 6 axes
   ISO, le tube pivote autour de son noeud AMONT et tout l aval est
   translate. Avant, seul `toNodeId` bougeait et le reseau se dechirait.
5. Rotation transactionnelle. Un seul `commitGraph`, refus de validation si
   le nombre de noeuds a varie, et controle geometrique affiche.
6. Arrondi 3 decimales EN SORTIE seulement, via `pdiRound3`.

## Tests

1. Poser un noeud exactement sur un port existant : le reticule cyan
   apparait, le noeud se cree sur le port, pas a cote.
2. Zoomer a 284 % puis 100 % : la distance d accrochage ressentie est
   identique (tolerance en pixels).
3. Selectionner deux noeuds, Aligner X : la valeur affichee dans la barre
   d etat est un multiple du pas de snap.
4. Selectionner deux tubes, Rendre parallele : le tube cible se met sur un
   axe ISO et les noeuds aval suivent (le compteur est affiche).
5. Selectionner un noeud et faire R plusieurs fois : le compteur de noeuds
   et de troncons de l entete ne change jamais.
6. Aligner deux noeuds deja superposes : la commande est refusee avec un
   message explicite au lieu de creer une geometrie degeneree.

## Hors perimetre assume

- Verrouillage angulaire interactif a la souris : `pdiSnapAngleDeg` est
  livre et teste mais n est pas encore cable sur le trace a la souris.
- Marqueurs differencies par type d accroche (carre, triangle, croix) :
  le reticule cyan unique est conserve pour limiter la taille du patch.
- Coherence diametre / region entre etiquette de troncon et cartouche.
- Les 8 window.confirm restants : PATCH 017K3.

## Journal

    PATCH 017P - PRECISION GEOMETRIQUE
    ROOT : /app/applet
    APPLIQUE : module pdiPrecision017P.ts
    BACKUP : src/pdi/isometric/engine/IsometrieModuleV48d.tsx.before017P
    APPLIQUE : E1 import du module de precision (1 site(s))
    APPLIQUE : E2 tolerance PORT en pixels (1 site(s))
    APPLIQUE : E3 tolerance EXTREMITE en pixels (1 site(s))
    APPLIQUE : E4 tolerance MILIEU en pixels (1 site(s))
    APPLIQUE : E5 tolerance GRILLE en pixels (1 site(s))
    APPLIQUE : E6 fonction pdiCreatePoint (1 site(s))
    APPLIQUE : E7 accroche respectee a la creation (3 site(s))
    APPLIQUE : E8 alignement sur le pas de grille (1 site(s))
    APPLIQUE : E9 QA de l alignement (1 site(s))
    APPLIQUE : E10 parallele : axe ISO + propagation aval (1 site(s))
    APPLIQUE : E11 rotation transactionnelle (1 site(s))
    APPLIQUE : E12 accroche du piquage (1 site(s))
    APPLIQUE : E13 accroche unique du trace de branche (1 site(s))
    ECRIT : src/pdi/isometric/engine/IsometrieModuleV48d.tsx
    
    VERIFICATIONS : 11/11
      [x] module pdiPrecision017P.ts en place
      [x] import du module dans le moteur
      [x] 4 tolerances d accroche en pixels
      [x] aucune tolerance codee en dur restante
      [x] fonction pdiCreatePoint definie
      [x] accroche respectee sur les 5 chemins de creation
      [x] alignement ramene sur le pas de grille
      [x] QA de l alignement active
      [x] parallele sur axe ISO
      [x] propagation aval du parallele
      [x] rotation transactionnelle controlee
    
    MD5 IsometrieModuleV48d.tsx : eed218a61deb96ea70af0393566bc881
    MD5 pdiPrecision017P.ts     : 2ef8a2d9690d9529d93d13cdb54eb0aa
