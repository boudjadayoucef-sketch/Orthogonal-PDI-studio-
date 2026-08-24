# PATCH 017F2 - Inspecteur editable, anomalies, conflit projets / onglets

## A. Conflit "projets en bas" / creation d onglet

### Diagnostic
L ecran Mes projets affichait deux listes de nature differente :
- l **index des projets** (`pdi.projects.index.v1`), pilote par les onglets ;
- les **sauvegardes locales brutes**, lues cle par cle dans localStorage.

La seconde liste comptait `*.current` **et** `*.previous` : chaque projet
apparaissait donc deux fois, et un plan migre depuis l ancienne cle globale
apparaissait une troisieme fois. Surtout, son bouton appelait simplement
`setActiveModule("isometric")` : la sauvegarde etait ouverte dans l onglet
ACTIF, donc dans un autre projet que le sien. C est la collision que tu as
ressentie entre les projets du bas et la creation d un nouvel onglet.

### Correctifs
1. Les archives `.previous` ne sont plus listees, et une seule ligne (la plus
   recente) est conservee par projet.
2. Chaque sauvegarde extrait son `projectId` de la cle
   `isometrie.autosave.v474.user.<uid>.project.<projectId>.current` et l affiche.
3. Le bouton devient **Ouvrir dans son onglet** : il appelle `openProjectInTab`,
   qui reutilise l onglet existant du projet ou en cree un correctement rattache.
   Plus aucune ecriture croisee d un projet dans un autre.
4. Nouveau bouton **Recuperer les sauvegardes orphelines** : toute sauvegarde
   sans entree d index (plan dessine avant 017F1, ou index perdu) devient un
   projet visible et ouvrable.

## B. Inspecteur editable, valide par la spec
Le bloc *Troncon selectionne* recoit quatre champs modifiables : **DN**,
**Longueur (m)**, **Service** et **Spec**. Toute modification passe par
`applySegmentEdit017F2`, qui :
- refuse un diametre nul ou negatif ;
- refuse un couple spec / DN interdit via `pdiSpecAllowsDn` et affiche la plage
  admise, par exemple : `Refuse : la spec CS150 n admet que DN15 a DN300` ;
- recopie materiau et classe de pression de la spec choisie quand ils existent.

## C. Volet Anomalies cliquable
Nouveau bloc dans l onglet Proprietes, recalcule en direct :
- DN hors spec ;
- troncon non tagge ;
- longueur nulle ;
- noeud isole ;
- te incomplet (moins de trois branches).

Chaque ligne est un bouton : le clic selectionne l element sur le plan et ouvre
l inspecteur. Au dela de 40 anomalies, le reste est compte.

## D. Raccourci Ctrl+1
Ouvre le panneau droit sur l onglet Proprietes, en complement de la commande
`PROPS` livree en 017F1.

## Tests
1. Mes projets : chaque projet n apparait qu une seule fois dans les
   sauvegardes locales, avec son badge `projet <id>`.
2. Cliquer **Ouvrir dans son onglet** sur une sauvegarde : l onglet du projet
   correspondant s ouvre (ou est reactive), et le plan affiche est bien le sien.
3. Creer un nouvel onglet puis revenir a Mes projets : aucune ligne parasite,
   aucun plan recopie.
4. Cliquer **Recuperer les sauvegardes orphelines** : les anciens plans
   remontent dans la liste des projets.
5. Selectionner un troncon : changer DN a 150 puis Entree, le plan et la liste
   se mettent a jour.
6. Choisir une spec incompatible avec le DN courant : la modification est
   refusee et la barre de statut donne la plage admise.
7. Volet Anomalies : cliquer une ligne selectionne l element concerne.
8. Appuyer sur `Ctrl+1` : l inspecteur s ouvre.
9. `npm run lint` puis `npm run build`.

## Reporte a 017G
Refonte **typed arrays** (`Float32Array`) du rendu et nettoyage des
`passive event listener` : ces travaux touchent la boucle de rendu complete et
meritent un patch isole, testable seul.
