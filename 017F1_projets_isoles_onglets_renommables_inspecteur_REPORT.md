# PATCH 017F1 - Projets isoles, onglets renommables, inspecteur cible

## Symptomes traites
1. Un nouvel onglet ISO affichait le meme dessin que l onglet precedent.
2. Impossible de nommer un onglet / un projet.
3. Le panneau Proprietes n affichait pas les donnees de l element selectionne.

## Diagnostic
- `openModuleInTab` creait bien un `projectId`, mais le rendu etait
  `<PdiIsometricEditor />` **sans aucune propriete** : le `projectId` n etait ni
  transmis, ni lu par le moteur.
- La cle d autosauvegarde etait unique par utilisateur
  (`isometrie.autosave.v474.user.<uid>.current`) : un seul document pour tous
  les onglets. Les onglets etaient des onglets de navigation, pas de document.
- Aucun index de projets : fermer un onglet perdait le projet.
- Le panneau Proprietes ne traitait explicitement que la selection multiple.

## Correctifs
1. Le moteur accepte `projectId` et prefixe ses cles par
   `...user.<uid>.project.<projectId>` -> un onglet = un plan.
2. Migration automatique de l ancienne archive du profil vers le projet
   `default` : aucun plan existant n est perdu.
3. `key={activeProjectId}` sur l editeur : remontage propre au changement
   d onglet, sans fuite d etat d un projet vers l autre.
4. Index `pdi.projects.index.v1` : un projet survit a la fermeture de son
   onglet et reste ouvrable, renommable, supprimable depuis Mes projets
   (suppression = index + sauvegardes locales du projet).
5. Renommage par **double-clic sur le titre de l onglet**, dans la barre de la
   coquille comme dans le dock de l editeur ISO : saisie directe, Entree valide,
   Echap annule, la perte de focus valide aussi. Le nom se propage a l index.
6. Inspecteur cible : formulaire distinct selon le type selectionne.
   - Troncon : tag, DN, service, spec, materiau, classe, longueur, type,
     isolation, ligne, nombre de raccords.
   - Noeud / raccord / equipement : repere, type, equipement, DN, angle de
     branche, direction de coude, rotation, miroir, position XYZ, troncons
     relies (cliquables), reference, fabricant.
7. Commande `PROPS` (`PR`, `PROPRIETES`) declaree dans `AUTOCAD_COMMANDS` **et**
   traitee dans le dispatcher (Regle 8) : ouvre le panneau sur la selection.

## Tests
1. Onglet A : dessiner 3 noeuds. `+` -> onglet B doit afficher `0 noeuds`.
2. Revenir sur A : les 3 noeuds sont la. Retour sur B : toujours vide.
3. F5 avec 2 onglets : chaque onglet retrouve son propre contenu.
4. Double-clic sur le titre d un onglet : saisir `Gazoduc Est`, Entree.
   Le nom change dans la barre, dans le dock et dans Mes projets.
5. Double-clic puis Echap : le nom d origine est conserve.
6. Fermer un onglet, aller dans Mes projets : le projet est toujours liste,
   bouton Ouvrir le remonte avec son dessin.
7. Supprimer un projet depuis Mes projets : confirmation, puis disparition ;
   les autres projets restent intacts.
8. Cliquer un troncon : carte Troncon selectionne avec tag, DN, spec, longueur.
   Cliquer un noeud ou un te : carte Noeud avec angle de branche et ports.
9. Taper `PROPS` dans la zone de commande : le panneau Proprietes s ouvre.
10. `npm run lint` puis `npm run build`.

## Reste pour 017F2
- Edition en place dans l inspecteur avec validation par spec
  (`pdiSpecAllowsDn` toujours non branche sur l UI).
- Volet Anomalies cliquable.
- Raccourci clavier `Ctrl+1`.
- Refonte du modele de donnees en typed arrays + nettoyage des
  `passive event listener` (prerequis GPU / 3D).
