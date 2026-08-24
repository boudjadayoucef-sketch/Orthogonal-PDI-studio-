# PATCH 016B — Commandes guidees + corrections UI

Date : 2026-08-23T15:32:36

## Modifications
- Suggestions vides quand la saisie est vide
- Ecoute Echap globale ajoutee dans la barre de commande
- Ligne Acces direct supprimee du composant
- Hauteur du canvas dynamique selon Hide
- Etat guidedCmd ajoute
- Moteur de commandes guidees ajoute
- Interception du clic pour commande guidee
- Apercu souris de la commande guidee
- Echap annule la commande guidee
- Commandes DEPLACER / COPIE / ROTATION branchees
- Apercu fantome rendu dans le canvas

## Tests
1. Taper une lettre : la liste s'ouvre. Appuyer Echap : la liste se ferme et la saisie se vide.
2. Cliquer Hide : le canvas doit gagner en hauteur (84vh au lieu de 70vh).
3. Verifier que la ligne 'Acces direct' n'existe plus du tout.
4. Selectionner un ou deux noeuds, taper DEPLACER, cliquer un point de base,
   bouger la souris (apercu orange en pointille), cliquer pour appliquer.
5. Meme test avec COPIE : la selection est dupliquee, l'original reste.
6. Meme test avec ROTATION : l'apercu tourne autour du point de base.
7. Pendant une commande, appuyer Echap : rien ne doit etre modifie.
8. npm run lint puis npm run build.
