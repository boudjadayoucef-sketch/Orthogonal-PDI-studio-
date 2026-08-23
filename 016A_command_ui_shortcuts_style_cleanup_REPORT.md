# PATCH 016A — Command UI + raccourcis + style global

Date: 2026-08-23T14:47:27

## Corrections appliquées
- États UI/style ajoutés
- Garde raccourcis clavier ajouté
- Commandes style/raccourcis ajoutées: 1
- Style global appliqué aux tubes/objets 2D
- Boutons raccourcis ON/OFF + Hide ajoutés
- Bouton BOM & Métré topbar supprimé

## Tests à faire avant 016B
1. Ouvrir l'éditeur : le bouton BOM & Métré orange ne doit plus être dans la topbar.
2. Ouvrir le tableau propriétés/BOM : la ligne de commande ne doit plus passer devant.
3. Fermer le tableau : la ligne de commande revient.
4. Cliquer Hide : la commande se réduit à un bouton `⌨ Commande`.
5. Vérifier que la ligne Accès direct n'est plus affichée.
6. Raccourcis OFF : taper directement `copie` sur le plan doit écrire dans la commande, pas activer des outils.
7. Raccourcis ON : les raccourcis habituels peuvent fonctionner.
8. Tester commandes `LW 2`, `EPAISSEUR 1.2`, `COLOR cyan`, `STYLE`.
9. Vérifier que l'épaisseur/couleur s'applique aux tubes et que l'épaisseur 2D suit le style global.
10. Lancer `npm run lint` puis `npm run build`.

## Note
Ce patch ne crée pas encore les commandes guidées MOVE/COPY/ROTATE avec prévisualisation souris. Cela sera PATCH 016B après validation visuelle de 016A.
