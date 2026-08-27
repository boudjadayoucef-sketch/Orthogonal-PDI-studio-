# RAPPORT PATCH 017P4 - Te collé et convention au cartouche

## Defaut corrige

Le 017P3 avait ramene les noeuds simples a leur centre, mais le Te est un
glyphe COMPOSITE qui restait peint en pixels figes (lignes 7022-7026) :

- cercle r = 7 a 9 px fixes,
- branches ecrites M -10 0 L 10 0 M 0 0 L 0 -12, soit 10 et 12 px en dur,
- trois pastilles de port placees a cx = -12, cx = 12, cy = -14.

Or un Te conserve volontairement sa cote centre-a-face (0,20 m), qui vaut
a l ecran 0,20 x 28 x zoom. A 182 pour cent cela fait environ 10 px face a
une pastille peinte a 12 px, et l ecart grandit avec le zoom. Surtout, ces
coordonnees en dur NE TOURNENT PAS : apres une rotation, le glyphe restait
couche alors que les ports avaient pivote.

## Correction

Le scope de rendu calculait deja, pour tout noeud, nativePorts avec des
offsets ecran sx / sy issus de portWorldPosition puis isoProjectV4. Le Te
est desormais construit sur cette seule source : ses trois branches vont du
centre vers ses ports reels, ses pastilles se posent sur ces ports. Echelle
et orientation deviennent donc justes par construction, a tout zoom et
apres toute rotation. Un Te ancien depourvu de ports garde le trace de
repli, pour ne jamais disparaitre du plan.

Le rayon du cercle passe sous la borne 3-10 px du module d axes, et la
convention de metre manquait au cartouche imprime : elle y figure a present
sous le metre total.

## Journal d execution

- APPLIQUE : backup cree IsometrieModuleV48d.tsx.before017P4
- MESURE : E1 glyphe du Te derive de ses ports reels : plage remplacee 7024-7028
- APPLIQUE : E1 glyphe du Te derive de ses ports reels
- APPLIQUE : E2 convention de metre dans le cartouche imprime
- MESURE : lignes 9158 -> 9156
- MESURE : md5 avant 095cd3e1207fc71dafd49dcf6753b417
- MESURE : md5 apres 3023c919a423860795781fbaf4494f0d

## Verifications : 14/14

- [x] plus aucun rayon de Te en pixels figes
- [x] rayon du Te borne par le module d axes
- [x] branches du Te tracees vers les ports projetes
- [x] plus aucune pastille de port du Te en dur
- [x] repli conserve pour un Te sans port declare
- [x] ports du Te restent cliquables (piquage preserve)
- [x] convention de metre presente dans le cartouche
- [x] convention de metre desormais affichee 5 fois
- [x] acquis 017P3 intact : noeud simple au centre
- [x] acquis 017P3 intact : triedre en haut a droite
- [x] rose des vents toujours reservee a l impression
- [x] aucune alert() navigateur introduite
- [x] aucun commentaire JSX en attribut (R14)
- [x] backup du moteur present
