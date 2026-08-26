# PATCH 017F2B - refus visible, tag reconstruit, champs resynchronises

## Defauts constates (captures 4:30 / 4:32 PM)

| # | Symptome | Cause |
|---|---|---|
| 1 | Refus de spec sans aucun message | `setStatusMessage` seul, non rendu dans l inspecteur |
| 2 | Champ DN garde `500` alors que le modele vaut `150` | input non controle, `key` inchangee car la valeur du modele n a pas bouge |
| 3 | `DN300` tague `150-HC-001-CS150` | tag non reconstruit apres edition du DN |

## Correctif

| # | Effet |
|---|---|
| A | `segEditError017F2B`, `segEditRev017F2B`, `pdiRejectSegmentEdit017F2B()` |
| B | Diametre invalide -> refus visible |
| C | Spec incompatible -> `Refuse : DN500 hors plage. La spec CS600 n admet que DN15 a DN400` |
| D | Tag reconstruit par `pdiBuildTag` / `pdiNextTagNumber` (si deja tague) |
| E-F | Champs DN / Longueur remontes apres un refus |
| G | Bloc rouge dans la carte du troncon |

## Identifiants

`segEditError017F2B`, `segEditRev017F2B`, `pdiRejectSegmentEdit017F2B(message)`, marqueur `// PATCH 017F2B`

## Resultat

Appliques : 7 | Deja presents : 0 | Echecs : 0

[APPLIQ] A. etat de refus + helper pdiRejectSegmentEdit017F2B
[APPLIQ] B. branche diametre invalide : refus visible
[APPLIQ] C. branche spec incompatible : refus visible + plage admise
[APPLIQ] D. reconstruction du tag industriel apres edition
[APPLIQ] E. champ DN : remontage apres refus
[APPLIQ] F. champ Longueur : remontage apres refus
[APPLIQ] G. affichage du message de refus dans l inspecteur
