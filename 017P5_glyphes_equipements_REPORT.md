# PATCH 017P5 - glyphes d equipements a l echelle des ports

## Symptome

Retour utilisateur : le Te reduit reste detache des tubes a
1080 pour cent et 1439 pour cent, alors que le noeud simple
et le coude sont corrects.

## Cause racine

Un Te reduit porte equipmentType, il passe donc par la branche
isEquip et non par isTee corrigee au 017P4. Cette branche
dessinait le glyphe avec scale(1.3) figee, alors que les
glyphes de getFittingSvgGraphic sont nominaux a +/- 7 unites :
demi-branche de 9.1 px constants contre des ports a
0.20 m x 28 px/m x zoom, soit 60 px a 1080 pour cent.
Le coude, lui, etait deja trace de p0 a p1, d ou son exactitude.

## Corrections

- pdiGlyphScale017P5 : echelle derivee de la distance ecran
  moyenne centre -> ports, bornee entre 0.9 et 40.
- Pattes de raccordement du centre vers chaque port, garantie
  de continuite visuelle meme pour un glyphe non conforme.
- Cadres de selection et de survol mis a la meme echelle.

## Verifications

VERIFICATIONS : 18/18

## Journal

- MESURE : md5 avant 3023c919a423860795781fbaf4494f0d
- APPLIQUE : backup cree IsometrieModuleV48d.tsx.before017P5
- DEJA : module pdiGlyphes017P5.ts present
- MESURE : module : 1224 octets
- MESURE : dangerouslySetInnerHTML avant = 3
- APPLIQUE : E1 import du module d echelle des glyphes
- APPLIQUE : E2 declaration de kGlyph dans le scope de rendu du noeud
- APPLIQUE : E3 cadre de selection a l echelle du glyphe
- APPLIQUE : E4 cadre de survol a l echelle du glyphe
- APPLIQUE : E5 glyphe d equipement mis a l echelle de ses ports
- MESURE : dangerouslySetInnerHTML apres = 3
- MESURE : md5 apres fb81618c513a2ec2db245c6ba21563c9
- MESURE : lignes apres 9158
- OK : module : fonction pdiGlyphScale017P5 exportee
- OK : module : demi-taille nominale 7 unites documentee
- OK : module : bornes 0.9 et 40 declarees
- OK : module : calcul 100 pour cent local, aucun import externe (R7)
- OK : moteur : import du module present
- OK : moteur : kGlyph declare une seule fois
- OK : CAUSE RACINE : plus aucun scale(1.3 figee
- OK : glyphe mis a l echelle des ports : scale(${kGlyph}
- OK : pattes de raccordement centre -> ports
- OK : cadre de selection a l echelle
- OK : cadre de survol a l echelle
- OK : non-regression coude : toujours derive de p0/p1
- OK : non-regression 017P4 : branches du Te natif
- OK : non-regression 017P3 : rayon borne et cote centre a face
- OK : non-regression 017P3 : triedre en haut a droite
- OK : R14 : aucun commentaire JSX dans la ligne du glyphe
- OK : aucun window.alert introduit
- OK : backup present
