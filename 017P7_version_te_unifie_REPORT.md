# PATCH 017P7 - badge de version + te unifie

## 1. Badge de version dans le panneau Profil

src/pdi/pdiVersion.ts devient le point de verite unique.
La valeur est affichee devant le nom du profil, ce qui permet
de verifier de visu quel patch est reellement charge.
Chaque patch suivant met a jour PDI_PATCH_VERSION.

## 2. Te-equipement : meme logique que le te natif

Symptome : les tes ne marchent toujours pas.

Cause : le rendu du 017P6 tracait bien le corps et la branche
depuis les ports, mais sans repere central. Or les ports d un
te sont a half = max(0.08, (length||0.4)/2) = 0.20 m, soit
0.20 x 28 x zoom en pixels : seulement 8.8 px a 158 pour cent.
Le te etait donc dessine juste, mais illisible et paraissant
detache du tube.

Le te natif, lui, fonctionne parce qu il combine un cercle
central borne entre 3 et 10 px (pdiNodeRadius017P3) avec des
branches vers les ports projetes. Le te-equipement adopte
desormais exactement ce rendu, en vert, et sa condition ne
depend plus de p0/p1.

## Reste a traiter (annonce, hors perimetre de ce patch)

- Impression : ligne 5309, screenAngle n applique le trace
  derive des ports qu au coude. Un te imprime reste mal
  oriente. A corriger au 017P8.
- Dimension reelle du te : half est un defaut a 0.20 m et non
  la cote centre-a-face normalisee du DN. A traiter avec la
  bibliotheque parametrique (019).

## Verifications

VERIFICATIONS : 17/17

## Journal

- MESURE : racine retenue /app/applet
- MESURE : md5 avant 78bd1cb084e9ecb9c4a5d79b7b858740
- APPLIQUE : backup cree IsometrieModuleV48d.tsx.before017P7
- APPLIQUE : pdiVersion.ts cree sur 017P7
- MESURE : dangerouslySetInnerHTML avant = 3
- APPLIQUE : E1 import du point de verite de version
- APPLIQUE : E2 badge de version devant le nom du profil
- APPLIQUE : E3 te-equipement rendu avec la logique du te natif
- MESURE : dangerouslySetInnerHTML apres = 3
- MESURE : md5 apres b908f7d7341e371823c1ea1d39c6a41e
- MESURE : lignes apres 9160
- OK : point de verite : PDI_PATCH_VERSION sur 017P7
- OK : module de version sans dependance externe (R7)
- OK : import de la version dans le moteur
- OK : badge affiche devant le nom du profil
- OK : badge declare une seule fois
- OK : CAUSE RACINE : repere central borne pour le te-equipement
- OK : branches du te-equipement vers tous les ports projetes
- OK : ports du te-equipement cliquables pour le piquage
- OK : la condition ne depend plus de p0/p1
- OK : plus aucune trace du rendu 017P6 remplace
- OK : non-regression coude : toujours derive de p0/p1
- OK : non-regression 017P5 : echelle des glyphes inline
- OK : non-regression 017P4 : branches du te natif
- OK : non-regression 017P3 : cote centre a face et triedre
- OK : R14 : aucun commentaire JSX en attribut
- OK : aucun window.alert introduit
- OK : backup present
