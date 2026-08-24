# PATCH 017D - Hotfix build 18 : styles absents et dock de commande

## Symptome
Apres application du patch, l editeur ISO s affiche en HTML brut : plus aucune
mise en page, elements empiles, dock de commande hors ecran.

## Diagnostic
- Les 3 fichiers source modifies (moteur, CadAutocadEngine, CadCommandLineBar)
  passent le typecheck : aucune erreur TypeScript.
- Les trois feuilles CSS (index.css, pdiIsoPrecisionUx.css, pdiLandingV4.css)
  sont intactes et equilibrees, identiques au build precedent.
- Le symptome correspond a l absence du bundle CSS unique produit par Vite :
  Tailwind ET les regles .pdi-* disparaissent en meme temps, ce qui n arrive
  que si la feuille generee n est pas servie a la page.
- L application n avait aucun filet de securite pour ce cas : sans CSS, les
  elements `fixed` retombent dans le flux et l interface devient inutilisable.
- Regression parallele detectee dans la passe UI compacte du build 18 :
  le bouton de restauration de la ligne de commande a ete supprime et le dock
  ne respecte plus l etat `commandPromptHidden` : la commande HIDE n a plus
  d effet visible et l espace reserve en bas reste occupe.

## Correctifs
1. Sonde de feuille de styles au demarrage : si l utilitaire `hidden` n a aucun
   effet, la classe `pdi-no-tailwind` est posee sur `html`, un bandeau rouge
   avec bouton Recharger apparait et un message explicite est ecrit en console.
2. CSS de secours autonome (CSS pur, sans utilitaires) : squelette du studio,
   canvas, boutons, champs, dock et bouton de restauration restent positionnes
   et utilisables meme sans le bundle principal.
3. Dock de commande a nouveau masquable, bouton flottant de restauration
   restaure, variable --pdi-command-reserved-bottom coherente avec HIDE.

## Tests
1. Recharger l editeur ISO : mise en page normale, aucun bandeau rouge.
2. Console : aucun message `[PD&I 017D]` si le bundle CSS est correct.
3. Simuler la panne (desactiver la feuille de styles dans DevTools) : bandeau
   rouge, interface de secours lisible, dock visible en bas.
4. Taper `HIDE` : le dock disparait, le bouton `Commande` apparait en bas a
   gauche, le plan de travail occupe l espace libere.
5. Cliquer `Commande` : le dock revient.
6. Taper `project`, `tag`, `dm` : suggestions et Data Manager (017C) intacts.
7. `npm run lint` puis `npm run build` : verifier que la feuille CSS est bien
   emise dans dist/assets (fichier .css present).
