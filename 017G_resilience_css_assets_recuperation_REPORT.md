# PATCH 017G - Resilience CSS et service des assets

## Constat sur le build 19
Tous les marqueurs sont bien presents apres application de 017F2 :

| Patch | Moteur ISO | Coquille |
|---|---|---|
| 017C | 5 | - |
| 017D | 3 | - |
| 017E | 3 | 5 |
| 017F1 | 8 | 7 |
| 017F1B | 3 | 1 |
| 017F2 | 4 | 6 |

Le JS livre est donc bien celui de 017F2 (les deux onglets renommes sont
visibles sur la capture). Le probleme n est pas dans le code applicatif : c est
**la feuille de styles qui n arrive pas au navigateur**, et le garde-fou 017D
qui le signale correctement.

## Cause structurelle trouvee dans server.ts

```
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
```

En production, toute requete non resolue par `express.static` renvoyait
`index.html` avec un code **200**. Donc quand `dist/index.html` reference un CSS
hache qui n existe plus (deploiement partiel, cache CDN, build CSS non emis),
la requete du `.css` recevait du **HTML** avec le type `text/html`. Le
navigateur ignore silencieusement la feuille : aucun 404, aucune erreur en
console, et l application s affiche brute. Exactement le symptome observe.

## Correctifs

### A. server.ts
1. Toute requete comportant une extension de fichier renvoie desormais un
   **404 explicite** en `text/plain` au lieu d index.html.
2. `index.html` est servi en `Cache-Control: no-store` : plus de HTML en cache
   pointant vers des assets disparus.
3. Nouvelle sonde **`/api/health/assets`** : elle repond `distExists`,
   `indexHtml`, la liste reelle des `.css` de `dist/assets` et le nombre de JS.
   C est le test de deploiement a faire en premier a la prochaine mise en ligne.

### B. index.html : CSS critique en ligne
Une feuille critique inline fournit l ossature minimale quand le bundle manque :
grille de la coquille (72px / 40px / 1fr), barre superieure, barre d onglets,
zone de contenu, boutons, champs, taille des icones et bandeau d alerte.
Elle est portee par `html.pdi-no-tailwind`, donc active uniquement en mode
secours. Aucune classe utilitaire Tailwind n y est definie (surtout pas
`.hidden`) pour ne pas fausser la sonde 017D.

### C. src/main.tsx : recuperation automatique
Quand la sonde echoue, `pdiTryRecoverStylesheet()` :
1. relit `/index.html` en `no-store` et injecte chaque `href="....css"` trouve ;
2. interroge `/api/health/assets` et injecte `/assets/<nom>.css` pour chaque CSS
   reellement present, en journalisant la liste ;
3. re-teste la sonde ; en cas de succes le bandeau disparait de lui-meme.

Deux tentatives au maximum, aucune boucle possible. Si rien n est recuperable,
la console indique explicitement que le bundle n a pas ete genere.

## Tests
1. Recharger l application : la mise en page doit revenir. Si le bandeau
   apparait brievement puis disparait, la recuperation a fonctionne (console :
   `[PD&I 017G] Feuille de styles injectee : ...`).
2. Ouvrir `https://<domaine>/api/health/assets` : verifier que `css` contient au
   moins un fichier. Si la liste est vide, le build CSS n a pas ete produit :
   relancer `npm ci && npm run build` et verifier `dist/assets/*.css`.
3. Demander un asset inexistant, par exemple `/assets/inexistant.css` : un 404
   texte doit apparaitre, plus jamais du HTML.
4. Recharger deux fois de suite : aucun clignotement, aucune boucle de
   rechargement.
5. Verifier que les acquis 017F1B et 017F2 sont intacts : panneaux fermes au
   demarrage, Echap actif, inspecteur editable, volet Anomalies, Ctrl+1.
6. `npm run lint` puis `npm run build`.

## Note importante
017G rend l application resiliente et rend la panne diagnosticable en une URL,
mais si `/api/health/assets` renvoie une liste `css` vide, la cause est en amont
dans la chaine de build de la plateforme, pas dans le code : il faut un
rebuild propre.
