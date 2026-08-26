# PATCH 017I2 - projection Float32Array, selection indexee, PERF

## Operations
- BACKUP : IsometrieModuleV48d.tsx.before017I2
- BACKUP : CadAutocadEngine.ts.before017I2
- APPLIQUE : constantes trigonometriques hissees (isoProjectV4)
- APPLIQUE : constantes reutilisees (isoUnprojectV4)
- APPLIQUE : cache de projection Float32Array + index des noeuds
- APPLIQUE : selection par fenetre lit le cache
- APPLIQUE : recherche indexee des extremites de troncon
- APPLIQUE : registre PERF
- APPLIQUE : dispatch PERF (R8 respectee)

## Verifications
- [x] constantes trigonometriques au module
- [x] isoUnprojectV4 sans trigonometrie
- [x] cache Float32Array
- [x] index nodeById017I2
- [x] selection fenetre sur cache
- [x] recherche indexee des extremites
- [x] registre PERF declare
- [x] dispatch PERF

## Mesures qui ont motive ce patch
- `isoProjectV4` recalculait `Math.PI/6`, `Math.cos` et `Math.sin` a **chaque
  appel**, soit deux appels trigonometriques par point et par rendu.
- La selection par fenetre executait `nodes.find()` **deux fois par troncon**,
  a chaque mouvement de souris : complexite O(n x m).
- Aucun `requestAnimationFrame` et aucun `useCallback` dans le moteur : la
  suite du travail de performance est identifiee, mais hors de ce patch.

## Ce que fait le patch
1. Constantes `PDI_ISO_COS_017I2` et `PDI_ISO_SIN_017I2` evaluees une fois au
   chargement du module, reutilisees par la projection et la reprojection.
2. Cache `Float32Array` de deux flottants par noeud, memoise sur
   `[nodes, viewport]`, avec index `id -> position`. Un plan de 500 noeuds tient
   dans 4 000 octets contigus au lieu de 500 objets a recollecter par rendu.
3. La selection par fenetre lit le cache et utilise une `Map` d index :
   O(n x m) devient O(n + m).
4. Commande `PERF`, declaree **et** dispatchee (R8), qui affiche le nombre de
   noeuds en cache, sa taille en octets, le nombre de reprojections et le cout
   de la derniere. C est la mesure, pas une impression.

## Reporte, volontairement
Le lissage des mises a jour de `viewport` par `requestAnimationFrame` et la
separation du panoramique et du zoom dans un `<g transform>` unique (pour ne
plus reprojeter du tout au zoom) touchent la boucle de rendu et la modale de
cotation. A traiter **apres 017M**, quand la structure d interface sera figee.

## Tests
1. Le plan s affiche a l identique : la projection est mathematiquement la meme,
   seules les constantes changent de place. **Aucun decalage ne doit apparaitre.**
2. Zoom molette, Ctrl+molette, Maj+molette, panoramique : comportement inchange.
3. Selection par fenetre de gauche a droite (englobante) puis de droite a gauche
   (secante) : les noeuds et troncons attendus sont bien captures.
4. Tapez `PERF` : le nombre de noeuds annonce correspond a la barre d etat, et la
   duree annoncee est de l ordre de quelques centiemes de milliseconde.
5. Tapez `PERF` apres plusieurs zooms : le compteur de reprojections augmente.
6. Cotations et alignements (AX, AY, AZ) : toujours corrects, car ils passent par
   la meme projection.
