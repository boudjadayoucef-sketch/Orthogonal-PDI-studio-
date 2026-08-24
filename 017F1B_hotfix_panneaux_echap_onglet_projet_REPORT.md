# PATCH 017F1B - Hotfix panneaux, Echap, onglet du projet supprime

## Retours de test 017F1
Tests 1, 2, 3, 4, 5, 6, 8 et 9 : conformes.
Test 7 : le projet etait bien supprime, mais son onglet restait affiche.
Nouveaux defauts signales : panneaux ouverts d office, Echap sans effet.

## Diagnostic

### Echap sans effet (panneaux, menu contextuel, deselection)
Trois gestionnaires clavier coexistent dans le moteur :
- le capteur de saisie natif du patch 016A2, enregistre en phase de **capture**
  (`window.addEventListener("keydown", onNativeType, true)`) ;
- le gestionnaire de raccourcis du plan ;
- le gestionnaire global (fermeture des panneaux, du menu contextuel,
  deselection complete).

La branche `Escape` du capteur appelait `e.preventDefault()` **et**
`e.stopPropagation()`. En phase de capture, `stopPropagation()` empeche les deux
autres gestionnaires de recevoir l evenement : Echap ne servait plus qu a vider
la ligne de commande. C est exactement le symptome observe (menu contextuel de
la photo 05 impossible a fermer, objet selectionne jamais deselectionne).

### Panneaux ouverts a chaque session
`leftPanelOpen` et `rightPanelOpen` etaient initialises a `true` en dur : toute
ouverture de session, y compris une session deja active rechargee, ouvrait la
Bibliotheque equipements et le panneau BOM / Proprietes.

### Onglet du projet supprime
`pdiRemoveProject` nettoyait l index et les sauvegardes locales, mais pas la
liste des onglets ouverts (`pdi.tabs.v1`).

## Correctifs
1. La branche `Escape` du capteur ne coupe plus la propagation : elle vide la
   ligne de commande puis laisse l evenement suivre son cours. Echap ferme donc
   a nouveau les panneaux, le menu contextuel, annule la commande guidee et
   deselectionne.
2. Panneaux gauche et droit **fermes par defaut**, avec memorisation de l etat
   dans `pdi.leftPanelOpen.v1` et `pdi.rightPanelOpen.v1`. Le panneau droit
   reste ouvrable par la commande `PROPS` ou par son onglet.
3. `closeTabsForProject` : la suppression d un projet ferme ses onglets, met a
   jour l onglet actif et bascule sur Mes projets s il n en reste aucun.

## Tests
1. Recharger l application : ni la Bibliotheque ni le panneau BOM ne doivent
   s ouvrir. Ouvrir le panneau droit, recharger : il doit revenir ouvert.
2. Selectionner un troncon, appuyer sur **Echap** : la selection disparait,
   le statut repasse a Pret.
3. Ouvrir le menu contextuel d un troncon (clic droit), appuyer sur **Echap** :
   le menu se ferme.
4. Panneaux ouverts + **Echap** : les deux panneaux se ferment.
5. Taper `TUBE` puis **Echap** : la commande guidee est annulee.
6. Mes projets : supprimer un projet ouvert. Son onglet doit disparaitre de la
   barre et du dock ; s il n en reste aucun, l ecran Mes projets s affiche.
7. `npm run lint` puis `npm run build`.

## Reste pour 017F2
Edition en place dans l inspecteur avec validation par spec, volet Anomalies
cliquable, raccourci `Ctrl+1`, refonte typed arrays et nettoyage des
`passive event listener`.
