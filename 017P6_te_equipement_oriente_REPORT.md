# PATCH 017P6 - te-equipement oriente par ses ports

## Symptome

Retour utilisateur : zoom corrige, coude correct, mais le Te
reste mal oriente apres rotation.

## Cause racine

angle = atan2(p1.sy - p0.sy, p1.sx - p0.sx) n aligne le glyphe
que sur l axe inline. La branche est peinte en dur a M 0 0 V -7,
soit 90 degres dans le plan ecran, alors qu en projection
isometrique deux axes orthogonaux du monde apparaissent a
environ 120 degres. Une rotation plane unique ne peut pas
placer trois directions : le defaut est structurel.

## Correction

Tout fitting portant un port de role branch est desormais
trace depuis ses ports projetes : corps de p0 a p1, branche du
centre vers le port de branche, sans aucune rotation. Meme
methode que le coude (path Q) et que le Te natif du 017P4.
Les fittings inline (vannes, brides, JMI) conservent le glyphe
tournant : pour eux rotate est exact car leurs ports sont
colineaires.

## Verifications

VERIFICATIONS : 16/16

## Journal

- MESURE : md5 avant fb81618c513a2ec2db245c6ba21563c9
- APPLIQUE : backup cree IsometrieModuleV48d.tsx.before017P6
- MESURE : dangerouslySetInnerHTML avant = 3
- APPLIQUE : E1 reperage du port de branche du fitting
- APPLIQUE : E2 te-equipement trace depuis ses ports, sans rotation
- MESURE : dangerouslySetInnerHTML apres = 3
- MESURE : md5 apres 78bd1cb084e9ecb9c4a5d79b7b858740
- MESURE : lignes apres 9159
- OK : port de branche repere une seule fois
- OK : CAUSE RACINE : te-equipement trace sans rotation
- OK : corps du te : de p0 a p1
- OK : branche du te : du centre au port de branche
- OK : le te-equipement ne passe plus par la fabrique de glyphes
- OK : le glyphe tournant reste reserve aux fittings inline
- OK : non-regression coude : toujours derive de p0/p1
- OK : non-regression 017P5 : echelle des glyphes conservee
- OK : non-regression 017P5 : pattes de raccordement conservees
- OK : non-regression 017P5 : cadres a l echelle
- OK : non-regression 017P4 : branches du Te natif
- OK : non-regression 017P3 : rayon borne et cote centre a face
- OK : non-regression 017P3 : triedre en haut a droite
- OK : R14 : aucun commentaire JSX dans la ligne du glyphe
- OK : aucun window.alert introduit
- OK : backup present
