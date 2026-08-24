#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PATCH 017G - PD&I : resilience de la feuille de styles et service des assets

Symptome apres application de 017F2 : l application se charge, le JS est a jour
(les onglets 017F2 sont bien la), mais AUCUNE feuille de styles n est appliquee.
Le garde-fou 017D fait son travail et affiche "Feuille de styles non chargee".
Le defaut est donc dans la livraison du CSS, pas dans le code applicatif.

Trois causes possibles, toutes traitees ici :
  1. dist/index.html reference un CSS hache qui n existe plus (deploiement
     partiel) : le SPA fallback renvoyait index.html AVEC un code 200 pour la
     requete du .css, donc le navigateur recevait du HTML en text/html et
     ignorait silencieusement la feuille (aucun 404 en console).
  2. index.html mis en cache par le navigateur / le CDN, pointant sur d anciens
     assets.
  3. bundle CSS reellement absent : il faut alors un affichage de secours
     utilisable, pas une page brute.

Correctifs :
  A. server.ts : plus jamais index.html a la place d un asset (404 explicite),
     index.html en no-store, et une sonde /api/health/assets qui liste les CSS
     reellement presents dans dist/assets.
  B. index.html : CSS critique en ligne (coquille, barre d onglets, panneaux,
     boutons) pour que l application reste utilisable sans le bundle.
  C. src/main.tsx : recuperation automatique. En cas d echec de la sonde, on
     relit /index.html et /api/health/assets, on injecte les feuilles trouvees,
     puis on re-teste. Le bandeau ne reste que si la recuperation echoue.

Idempotent. Sauvegardes .before017G. Rapport genere.
"""

import os
import shutil
import sys

ROOT = os.getcwd()
SERVER = os.path.join(ROOT, "server.ts")
INDEX = os.path.join(ROOT, "index.html")
MAIN = os.path.join(ROOT, "src/main.tsx")

notes = []


def read(path):
    with open(path, "r", encoding="utf-8") as fh:
        return fh.read()


def write(path, content):
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)


def backup(path):
    bak = path + ".before017G"
    if not os.path.exists(bak):
        shutil.copy2(path, bak)


def sub(src, old, new, label):
    if old in src:
        notes.append("OK : " + label)
        return src.replace(old, new, 1)
    notes.append("NON TROUVE : " + label)
    return src


def check_files():
    for path in (SERVER, INDEX, MAIN):
        if not os.path.exists(path):
            print("ERREUR : fichier introuvable : " + path)
            sys.exit(1)
    if "PATCH 017D" not in read(MAIN):
        print("ERREUR : le garde-fou 017D n est pas present dans src/main.tsx.")
        sys.exit(1)


# =============================================================== A. SERVER.TS
OLD_IMPORT_PATH = 'import path from "path";'
NEW_IMPORT_PATH = 'import path from "path";\n// PATCH 017G : inspection reelle du dossier dist/assets.\nimport fs from "fs";'

OLD_STATIC = """    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });"""

NEW_STATIC = """    const distPath = path.join(process.cwd(), "dist");
    // PATCH 017G : index.html ne doit jamais etre mis en cache, sinon il
    // continue de pointer vers des assets haches qui n existent plus.
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith("index.html")) res.setHeader("Cache-Control", "no-store");
        },
      })
    );

    // PATCH 017G : sonde de diagnostic des assets reellement livres.
    app.get("/api/health/assets", (_req, res) => {
      try {
        const assetsDir = path.join(distPath, "assets");
        const files = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
        res.json({
          distExists: fs.existsSync(distPath),
          indexHtml: fs.existsSync(path.join(distPath, "index.html")),
          css: files.filter((f) => f.endsWith(".css")),
          jsCount: files.filter((f) => f.endsWith(".js")).length,
        });
      } catch (err: any) {
        res.status(500).json({ error: String(err?.message || err) });
      }
    });

    app.get("*", (req, res) => {
      // PATCH 017G : ne jamais renvoyer index.html a la place d un asset.
      // C est ce fallback qui masquait l absence du bundle CSS : le navigateur
      // recevait du HTML en text/html et ignorait la feuille sans erreur.
      if (path.extname(req.path)) {
        res.status(404).type("text/plain").send("Asset introuvable: " + req.path);
        return;
      }
      res.setHeader("Cache-Control", "no-store");
      res.sendFile(path.join(distPath, "index.html"));
    });"""


def patch_server():
    src = read(SERVER)
    if "PATCH 017G" in src:
        notes.append("OK (deja) : server.ts (assets 404 explicites, sonde, no-store)")
        return
    backup(SERVER)
    src = sub(src, OLD_IMPORT_PATH, NEW_IMPORT_PATH, "server : import fs")
    src = sub(src, OLD_STATIC, NEW_STATIC, "server : 404 assets + no-store + /api/health/assets")
    write(SERVER, src)


# ============================================================= B. INDEX.HTML
# Important : ne JAMAIS definir .hidden ici, la sonde 017D s en sert pour
# detecter la presence du bundle Tailwind.
OLD_HEAD_CLOSE = "  </head>"

NEW_HEAD_CLOSE = """    <!-- PATCH 017G : CSS critique en ligne. Sert d ossature minimale quand le
         bundle Tailwind n est pas livre. N inclut volontairement aucune classe
         utilitaire Tailwind (dont .hidden) pour ne pas fausser la sonde 017D. -->
    <style id="pdi-critical-017g">
      #root { min-height: 100vh; }
      html.pdi-no-tailwind body {
        background: #020617;
        color: #E5EDF8;
        font-family: system-ui, -apple-system, sans-serif;
      }
      html.pdi-no-tailwind .pdi-unified-root {
        display: grid;
        grid-template-rows: 72px 40px 1fr;
        min-height: 100vh;
      }
      html.pdi-no-tailwind .pdi-unified-topbar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 16px;
        background: #060B14;
        border-bottom: 1px solid rgba(103, 232, 249, 0.25);
      }
      html.pdi-no-tailwind .pdi-tabsbar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 12px;
        background: #0B111A;
        border-bottom: 1px solid rgba(103, 232, 249, 0.2);
        overflow-x: auto;
      }
      html.pdi-no-tailwind .pdi-content {
        padding: 16px;
        overflow: auto;
      }
      html.pdi-no-tailwind button,
      html.pdi-no-tailwind .pdi-start-primary {
        min-height: 30px;
        padding: 6px 12px;
        border-radius: 10px;
        border: 1px solid rgba(103, 232, 249, 0.45);
        background: #0F172A;
        color: #E5EDF8;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
      }
      html.pdi-no-tailwind input,
      html.pdi-no-tailwind select {
        padding: 6px 8px;
        border-radius: 8px;
        border: 1px solid #334155;
        background: #0B111A;
        color: #E5EDF8;
      }
      html.pdi-no-tailwind svg { width: 18px; height: 18px; }
      html.pdi-no-tailwind #pdi-style-alert {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 8px 12px;
        background: #7C2D12;
        color: #FFEDD5;
        font-size: 12px;
        font-weight: 800;
      }
    </style>
  </head>"""


def patch_index():
    src = read(INDEX)
    if "PATCH 017G" in src:
        notes.append("OK (deja) : index.html (CSS critique en ligne)")
        return
    backup(INDEX)
    src = sub(src, OLD_HEAD_CLOSE, NEW_HEAD_CLOSE, "index.html : CSS critique de secours")
    write(INDEX, src)


# ================================================================ C. MAIN.TSX
OLD_SCHEDULE = """window.setTimeout(pdiCheckStylesheet, 700);
window.addEventListener("load", () => window.setTimeout(pdiCheckStylesheet, 250));"""

NEW_SCHEDULE = """// PATCH 017G : recuperation automatique de la feuille de styles.
// Cas traite : dist/index.html en cache pointe sur un asset disparu, ou la
// balise <link> a ete perdue. On relit index.html cote serveur et la sonde
// /api/health/assets, on injecte les CSS trouves, puis on re-teste.
let pdiStyleRecoveryAttempts = 0;

function pdiInjectStylesheet(href: string): boolean {
  try {
    const already = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(
      (node) => (node as HTMLLinkElement).getAttribute("href") === href
    );
    if (already) return false;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-pdi-recovered", "017G");
    document.head.appendChild(link);
    console.warn("[PD&I 017G] Feuille de styles injectee : " + href);
    return true;
  } catch {
    return false;
  }
}

async function pdiTryRecoverStylesheet(): Promise<void> {
  if (pdiStyleRecoveryAttempts >= 2) return;
  pdiStyleRecoveryAttempts += 1;
  let injected = 0;
  try {
    const res = await fetch("/index.html", { cache: "no-store" });
    if (res.ok) {
      const html = await res.text();
      const matches = html.match(/href=\"([^\"]+\\.css)\"/g) || [];
      matches.forEach((raw) => {
        const href = raw.slice(6, -1);
        if (pdiInjectStylesheet(href)) injected += 1;
      });
    }
  } catch {}
  try {
    const res = await fetch("/api/health/assets", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const list: string[] = Array.isArray(data?.css) ? data.css : [];
      console.warn("[PD&I 017G] CSS presents dans dist/assets : " + (list.join(", ") || "aucun"));
      list.forEach((name) => {
        if (pdiInjectStylesheet("/assets/" + name)) injected += 1;
      });
    }
  } catch {}
  if (injected === 0) {
    console.error(
      "[PD&I 017G] Aucune feuille de styles recuperable. Le bundle CSS n a pas ete " +
        "genere : relancer npm ci && npm run build, puis verifier dist/assets/*.css."
    );
    return;
  }
  window.setTimeout(() => {
    if (!pdiCheckStylesheet()) void pdiTryRecoverStylesheet();
  }, 400);
}

window.setTimeout(() => {
  if (!pdiCheckStylesheet()) void pdiTryRecoverStylesheet();
}, 700);
window.addEventListener("load", () =>
  window.setTimeout(() => {
    if (!pdiCheckStylesheet()) void pdiTryRecoverStylesheet();
  }, 250)
);"""


def patch_main():
    src = read(MAIN)
    if "PATCH 017G" in src:
        notes.append("OK (deja) : src/main.tsx (recuperation automatique du CSS)")
        return
    backup(MAIN)
    src = sub(src, OLD_SCHEDULE, NEW_SCHEDULE, "main.tsx : recuperation automatique de la feuille de styles")
    write(MAIN, src)


REPORT = os.path.join(ROOT, "017G_resilience_css_assets_recuperation_REPORT.md")

REPORT_BODY = """# PATCH 017G - Resilience CSS et service des assets

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
"""


def main():
    print("PATCH 017G - resilience CSS et service des assets")
    print("Racine : " + ROOT)
    check_files()
    patch_server()
    patch_index()
    patch_main()
    with open(REPORT, "w", encoding="utf-8") as fh:
        fh.write(REPORT_BODY)
    notes.append("OK : rapport 017G_resilience_css_assets_recuperation_REPORT.md")
    print("")
    for note in notes:
        print("  " + note)
    ko = len([n for n in notes if n.startswith("NON TROUVE")])
    print("")
    print("Resultat : %d/%d" % (len(notes) - ko, len(notes)))
    if ko:
        print("Des ancres n ont pas ete trouvees : verifier server.ts, index.html et src/main.tsx.")


if __name__ == "__main__":
    main()
