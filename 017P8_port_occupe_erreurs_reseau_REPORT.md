# PATCH 017P8 - port occupe et erreurs reseau explicitees

## 1. W002 ne genere plus de branche

Deux causes, corrigees toutes les deux.

Cause A, introduite par le 017P7 : la branche de rendu du
te-equipement dessinait son propre jeu de pastilles
data-iso-port, en doublon de la boucle des joints qui suit
immediatement. Cette boucle distingue correctement le port
libre du port soude, et rend la croix de soudure avec
pointerEvents=none. Le doublon, dessine dessous, restait
cliquable : le clic traversait la croix et creait une branche
sur un port deja soude. Le doublon est supprime.

Cause B, structurelle : le gestionnaire de clic ne verifiait
jamais l occupation du port avant d appeler setBranchDrawing.
Un garde-fou teste desormais si un troncon occupe le port et
refuse la branche avec un message visible, quelle que soit la
provenance du clic.

Le te natif recoit la meme regle : il n avait pas de boucle de
joints, ses ports soudes deviennent des croix non cliquables.

## 2. Erreurs reseau explicitees

Le compteur rouge en haut affichait un nombre sans detail et
n etait pas cliquable. Il devient un bouton : le survol liste
les messages, le clic ouvre le controle reseau et ecrit le
detail dans la ligne de commande. Les alertes sont desormais
distinguees des erreurs, en ambre.

L entree Controle reseau de la ligne de commande existait mais
ne repondait rien : elle ouvrait un panneau sans message. Elle
renvoie maintenant le code et le libelle des anomalies (R8).

## Codes d anomalie du controle reseau

- MISSING_NODE : troncon dont un noeud est absent
- MISSING_PORT : troncon dont le port de raccordement est absent
- MISSING_LINE : troncon sans ligne de tuyauterie
- ZERO_LENGTH : troncon de longueur nulle
- PORT_CAPACITY : port connecte plus d une fois
- DN_MISMATCH : diametre different entre noeud et troncon (alerte)

## Incoherence constatee, a traiter au 017P9

Le bandeau haut et le volet Anomalies comptent deux choses
differentes : le bandeau vient de validateProjectGraph, le
volet recalcule ses propres regles au rendu. D ou 2 erreurs en
haut et 0 anomalie dans le panneau. Une source unique est a
etablir.

## Verifications

VERIFICATIONS : 21/21

## Journal

- MESURE : racine retenue /app/applet
- MESURE : md5 avant b908f7d7341e371823c1ea1d39c6a41e
- APPLIQUE : backup cree IsometrieModuleV48d.tsx.before017P8
- MESURE : dangerouslySetInnerHTML avant = 3
- APPLIQUE : E1 refus de branche sur un port deja soude
- APPLIQUE : E2 suppression des pastilles en doublon du te-equipement
- APPLIQUE : E3 port soude non cliquable sur le te natif
- APPLIQUE : E4 compteur d erreurs cliquable et explicite
- APPLIQUE : E5 entree Controle reseau configuree
- MESURE : dangerouslySetInnerHTML apres = 3
- MESURE : md5 apres 68678e21fc00ed92be44555c0fdc11e8
- MESURE : lignes apres 9160
- OK : port occupe detecte avant toute branche
- OK : refus visible dans la ligne de commande (R8)
- OK : aucune branche creee quand le port est occupe
- OK : le port libre cree toujours la branche
- OK : CAUSE W002 : plus de pastilles en doublon sur le te-equipement
- OK : le te-equipement garde son repere central et ses branches
- OK : les pastilles du te-equipement viennent de la boucle des joints
- OK : port soude non cliquable sur le te natif
- OK : la croix de soudure du te natif ignore le pointeur
- OK : compteur d erreurs devenu cliquable
- OK : messages d erreur listes au survol
- OK : les alertes sont distinguees des erreurs
- OK : entree Controle reseau configuree
- OK : le code d anomalie est affiche a l utilisateur
- OK : non-regression coude derive des ports
- OK : non-regression 017P5 echelle des glyphes inline
- OK : non-regression 017P7 badge de version
- OK : non-regression 017P3 triedre et cote centre a face
- OK : R14 aucun commentaire JSX en attribut
- OK : aucun window.alert introduit
- OK : backup present
