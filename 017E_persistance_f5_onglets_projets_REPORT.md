# PATCH 017E - Persistance F5, onglets, ecran Mes projets

## Symptomes signales
1. F5 efface tout le dessin.
2. "Mes projets" affiche des onglets vides.
3. L acces aux onglets n est pas conforme : il devrait etre visible et direct.

## Diagnostic
- Les cles d autosauvegarde du moteur ISO sont prefixees par l identifiant
  utilisateur : `isometrie.autosave.v474.user.<uid>.current`. Le code calcule
  `autosavePrefix = userUid ? ... : ""`. Sans compte Firebase et sans profil
  `sonelgaz_user_profile`, `userUid` vaut `null` : le prefixe est vide,
  l autosauvegarde est explicitement suspendue et **rien n est jamais ecrit**.
  C est la cause exacte de la perte du dessin a chaque F5.
- Meme avec une sauvegarde valide, la restauration passait par une fenetre de
  confirmation. Un simple rechargement affichait donc un plan vide.
- L autosauvegarde etait differee de 700 ms, sans ecriture sur `beforeunload` :
  les dernieres actions pouvaient etre perdues.
- Le module `projects` n etait pas dans la liste des modules rendus : le menu
  "Mes projets" tombait sur le panneau generique, sans aucun projet.
- La barre d onglets etait `grid-row:2` avec `align-self:start` dans la meme
  cellule que le contenu : elle se superposait au contenu et n etait affichee
  que s il existait deja un onglet. Dans l editeur ISO, elle etait totalement
  absente car la coquille est court-circuitee.

## Correctifs
1. Identite locale de secours `pdi.localUid.v1` : l autosauvegarde fonctionne
   meme sans compte, tout en restant cloisonnee par profil.
2. Restauration silencieuse de la session courante au demarrage. La fenetre de
   recuperation ne sert plus qu aux archives precedentes ou corrompues.
3. Ecriture immediate sur `beforeunload`, `pagehide` et passage en arriere-plan.
4. Barre d onglets sur sa propre ligne de grille, toujours visible, avec
   compteur, bouton `+` et bouton `Projets`.
5. Dock d onglets flottant et repliable dans l editeur ISO.
6. Ecran "Mes projets" reel : nom du projet, nombre de noeuds et de tronçons,
   date, statut (session courante / archive precedente) et ouverture directe.

## Tests
1. Dessiner deux tronçons, attendre "Autosauvegarde" dans la barre d etat,
   puis F5 : le dessin revient, message "Session restauree automatiquement".
2. Dessiner puis F5 immediatement : le dessin revient aussi (flush beforeunload).
3. Fermer l onglet du navigateur, revenir sur l application : dessin present.
4. Barre d onglets visible en permanence dans la coquille, meme sans onglet.
5. Dans l editeur ISO, le dock ONGLETS est visible en bas a gauche, repliable,
   et permet de changer d onglet, d en creer un, d aller sur Projets.
6. Menu compte > Mes projets : la session locale est listee avec ses compteurs
   et le bouton Ouvrir dans l editeur fonctionne.
7. `npm run lint` puis `npm run build`.

## Limite connue
Si une authentification Firebase se resout apres coup, l identifiant passe de
`local-...` a l uid du compte et la page se recharge une fois : les sessions
enregistrees en mode local restent listees dans "Mes projets" mais ne sont plus
restaurees automatiquement sous le nouveau compte. Un import/export JSON reste
disponible pour les transferer.
