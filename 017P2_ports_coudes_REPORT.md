# PATCH 017P2 - reorientation des ports et des coudes

Controles : 12/12

## Ce que le patch corrige

1. Le tube etait trace entre les FACES des noeuds, jamais entre leurs centres.
   portWorldPosition decale chaque extremite de 0.08 a 0.20 m selon port.dx/dy
   et node.rotation. Aucune commande geometrique ne reorientait ces faces :
   apres un alignement le tube restait suspendu a cote des noeuds.
2. Les coudes sont desormais adaptes a la geometrie : rotation et sens deduits
   des deux voisins reels, puis angle ramene sur le catalogue normalise
   (90, 45, 30, 22.5). Un ecart superieur a 5 degres est signale, jamais
   silencieusement fabrique : un coude hors catalogue ne s achete pas.
3. L apercu du trace suivait la grille pure alors que la creation suivait
   l accroche : d ou l impression de colle a 142 pourcent puis decolle a 435.
4. La tolerance d accrochage etait exprimee en unites viewBox ; elle est
   convertie en pixels ecran reels, donc constante quelle que soit la fenetre.
5. Un alignement sans effet affichait un message identique a un succes.
6. Le menu Alignement etait grise sans explication sur des noeuds empiles.

## Perimetre volontairement restreint

- Les faces de role branch (piquage) ne sont jamais reorientees : leur
  direction est un choix metier, pas une consequence de la geometrie.
- Les equipements non coudes (vannes, brides, reductions) gardent leur
  orientation : elle depend du sens de service, pas du trace.
- Le verrouillage angulaire interactif (pdiSnapAngleDeg) attend le ruban 017M.
- Les marqueurs differencies par type d accroche restent a faire.

## Journal

- OK   module pdiPorts017P2 present
- OK   catalogue de coudes normalise
- OK   import dans le moteur
- OK   apercu du trace accroche
- OK   apercu sans grille pure
- OK   tolerances a l echelle ecran (4)
- OK   commitGraph reoriente les faces
- OK   coudes adaptes a la geometrie
- OK   setNodesRaw utilise le graphe reoriente
- OK   alignement sans effet signale
- OK   menu Alignement toujours cliquable
- OK   astuce noeuds empiles
