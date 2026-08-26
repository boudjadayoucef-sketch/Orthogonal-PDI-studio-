# PATCH 017I - molette non passive, badge de sauvegarde, SAVE/RESTORE

## Operations
- BACKUP : IsometrieModuleV48d.tsx.before017I
- BACKUP : CadAutocadEngine.ts.before017I
- APPLIQUE : registre SAVE/RESTORE (2 commandes)
- APPLIQUE : ecoute molette native { passive: false }
- APPLIQUE : retrait de onWheel={wheel} (double traitement evite)
- APPLIQUE : badge de sauvegarde visible sur le plan
- APPLIQUE : dispatch SAVE/RESTORE (R8 respectee)

## Verifications
- [x] registre SAVE declare
- [x] registre RESTORE declare
- [x] ecoute native passive:false
- [x] onWheel React retire
- [x] badge visible
- [x] dispatch SAVE
- [x] dispatch RESTORE

## Contenu
1. **Molette** : ecoute native `wheel` avec `{ passive: false }` sur `svgRef`,
   et retrait de `onWheel={wheel}`. React enregistre `wheel` en passif, donc
   `preventDefault()` y etait ignore : la page pouvait defiler pendant le zoom
   et la console affichait `Unable to preventDefault inside passive event
   listener invocation`. Les deux disparaissent.
2. **Badge de sauvegarde** : l ancien badge vivait dans la barre d etat portant
   la classe `hidden`, il n a donc jamais ete visible. Nouveau badge ancre en
   haut a droite du plan, 4 etats : Pret / Modifications non sauvegardees /
   Autosauvegarde a hh:mm / Erreur de sauvegarde.
3. **SAVE et RESTORE** : declarees dans `AUTOCAD_COMMANDS` **et** dispatchees
   (R8). SAUVER decale l archive courante vers `.previous` avant d ecrire,
   met a jour l empreinte de reference et l horodatage. RESTAURER reutilise la
   modale de recuperation existante, avec repli sur `.previous`.

## Hors perimetre, reporte en 017I2
Les tableaux typees `Float32Array` ne sont **pas** inclus. Les introduire sans
consommateur reel serait du code mort, et les brancher sur la projection exige
de toucher la boucle de rendu : c est un patch de performance a part entiere,
a mesurer avant et apres. Il sera traite en **017I2**, apres 017M.

## Tests
1. Molette sur le plan : le zoom fonctionne et **la page ne defile plus**.
   Console : plus aucun message `Unable to preventDefault`.
2. Ctrl + molette (pincement pave tactile) : zoom fin toujours operationnel.
   Maj + molette : panoramique horizontal.
3. Badge visible en haut a droite du plan. Deplacez un noeud : il passe en
   ambre `Modifications non sauvegardees`, puis en vert `Autosauvegarde a hh:mm`.
4. Tapez `SAUVER` (ou `SAVE`, `SV`) : badge vert immediat a l heure courante,
   message `Sauvegarde locale effectuee a hh:mm`.
5. Tapez `RESTAURER` (ou `RESTORE`) : la modale de recuperation s ouvre avec le
   nom du projet et le nombre de noeuds et de troncons.
6. `Ctrl+K` puis `SAU` : les deux commandes apparaissent dans la palette.
