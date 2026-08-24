#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PATCH 017H - PD&I VIS DZ
CSS EMBARQUE DANS LE BUNDLE JS (contournement des 403 sur /assets/*.css)

DIAGNOSTIC (build 19, console navigateur)
-----------------------------------------
  GET https://ais-pre-...run.app/assets/index-XXXX.css
  net::ERR_ABORTED 403 (Forbidden)
  [PD&I 017D] Feuille de styles principale absente : affichage de secours actif.
  [PD&I 017G] Aucune feuille de styles recuperable.

Le bundle CSS EST bien genere (le JS hache est servi correctement depuis le meme
dossier /assets). C'est la plateforme d'hebergement / le proxy d'apercu qui
refuse la requete du fichier .css avec un code 403. Aucun rebuild ne peut donc
corriger le probleme : il faut supprimer la requete .css elle-meme.

CORRECTIF 017H
--------------
A. src/pdiInlineStyles.ts (nouveau) : chaque CSS du projet est importe en mode
   Vite "?inline" (le contenu devient une chaine JS embarquee dans le bundle)
   puis injecte dans une balise <style> au demarrage. Plus aucun fichier .css
   n'est demande au serveur -> plus aucun 403 possible.
B. src/main.tsx : les imports CSS a effet de bord sont remplaces par l'import
   unique de pdiInlineStyles.
C. src/pdi/landing/PdiLandingV4.tsx : CSS de la landing centralise en inline.
D. src/components/ProjectMapViewer.tsx : CSS leaflet injecte en inline.
E. src/vite-env.d.ts : declaration de type pour "*.css?inline".
F. vite.config.ts : cssCodeSplit desactive (aucun asset CSS residuel eclate).
G. server.ts : nouvelle route de secours GET /api/style/main.css qui concatene
   les CSS de dist/assets et les sert en text/css (route /api/* non filtree).
H. src/main.tsx : la recuperation 017G tente /api/style/main.css en dernier
   recours avant d'abandonner.

REGLES : R1 patch .py idempotent + backup + rapport / R2 codage Claude /
R5 test avant patch suivant / R10 jamais index.html a la place d'un asset.

USAGE :  python3 017H_pdi_css_inline_bundle_403.py [racine_du_projet]
"""

import os
import sys
import shutil

SUFFIX = ".before017H"
applied = 0
skipped = 0
failed = 0
log = []


def read(path):
    with open(path, "r", encoding="utf-8") as fh:
        return fh.read()


def write(path, content):
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)


def backup(path):
    bak = path + SUFFIX
    if not os.path.exists(bak):
        shutil.copy2(path, bak)


def step(label, path, marker, old, new, root):
    """Remplacement unique et idempotent."""
    global applied, skipped, failed
    full = os.path.join(root, path)
    if not os.path.exists(full):
        failed += 1
        log.append("[ECHEC ] " + label + " : fichier absent (" + path + ")")
        return
    src = read(full)
    if marker in src:
        skipped += 1
        log.append("[DEJA  ] " + label)
        return
    if src.count(old) != 1:
        failed += 1
        log.append("[ECHEC ] " + label + " : ancre trouvee " + str(src.count(old)) + " fois")
        return
    backup(full)
    write(full, src.replace(old, new, 1))
    applied += 1
    log.append("[APPLIQ] " + label)


def create(label, path, content, root):
    global applied, skipped
    full = os.path.join(root, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    if os.path.exists(full) and "PATCH 017H" in read(full):
        skipped += 1
        log.append("[DEJA  ] " + label)
        return
    if os.path.exists(full):
        backup(full)
    write(full, content)
    applied += 1
    log.append("[APPLIQ] " + label)


# ---------------------------------------------------------------------------
# A. src/pdiInlineStyles.ts
# ---------------------------------------------------------------------------
INLINE_STYLES = "\n".join([
    "// PATCH 017H : feuilles de styles embarquees dans le bundle JavaScript.",
    "//",
    "// Contexte : sur la plateforme d hebergement, les requetes vers",
    "// /assets/*.css repondent 403 (Forbidden) alors que les bundles .js du meme",
    "// dossier sont servis normalement. Le navigateur ignorait donc silencieusement",
    "// la feuille de styles et l application basculait sur l affichage de secours",
    "// 017D (html.pdi-no-tailwind + bandeau orange).",
    "//",
    "// Solution : importer chaque CSS avec le suffixe Vite \"?inline\". Vite renvoie",
    "// alors le CSS compile (Tailwind inclus) sous forme de chaine de caracteres",
    "// integree au bundle JS. On l injecte dans une balise <style> au demarrage.",
    "// Consequence : plus aucun fichier .css n est demande au serveur.",
    "import baseCss from \"./index.css?inline\";",
    "import precisionCss from \"./pdiIsoPrecisionUx.css?inline\";",
    "import landingCss from \"./pdi/landing/pdiLandingV4.css?inline\";",
    "",
    "type PdiInlineSheet = { id: string; css: string };",
    "",
    "const PDI_INLINE_SHEETS: PdiInlineSheet[] = [",
    "  { id: \"pdi-inline-base-017h\", css: baseCss },",
    "  { id: \"pdi-inline-precision-017h\", css: precisionCss },",
    "  { id: \"pdi-inline-landing-017h\", css: landingCss },",
    "];",
    "",
    "/** Injecte un CSS deja embarque. Retourne true si une balise a ete creee. */",
    "export function pdiInjectInlineCss(id: string, css: string): boolean {",
    "  try {",
    "    if (!css || typeof css !== \"string\") return false;",
    "    if (document.getElementById(id)) return false;",
    "    const style = document.createElement(\"style\");",
    "    style.id = id;",
    "    style.setAttribute(\"data-pdi-inline-css\", \"017H\");",
    "    style.textContent = css;",
    "    document.head.appendChild(style);",
    "    return true;",
    "  } catch {",
    "    return false;",
    "  }",
    "}",
    "",
    "/** Injecte toutes les feuilles du projet et desactive l affichage de secours. */",
    "export function pdiInstallInlineStyles(): number {",
    "  let count = 0;",
    "  let bytes = 0;",
    "  PDI_INLINE_SHEETS.forEach((sheet) => {",
    "    if (pdiInjectInlineCss(sheet.id, sheet.css)) {",
    "      count += 1;",
    "      bytes += sheet.css.length;",
    "    }",
    "  });",
    "  if (count > 0) {",
    "    try {",
    "      document.documentElement.classList.remove(\"pdi-no-tailwind\");",
    "      const alertBar = document.getElementById(\"pdi-style-alert\");",
    "      if (alertBar) alertBar.remove();",
    "    } catch {}",
    "  }",
    "  console.info(",
    "    \"[PD&I 017H] Feuilles de styles embarquees : \" + count + \" (\" + bytes + \" octets)\"",
    "  );",
    "  return count;",
    "}",
    "",
    "pdiInstallInlineStyles();",
    "",
])

# ---------------------------------------------------------------------------
# Fragments
# ---------------------------------------------------------------------------
MAIN_OLD_HEAD = 'import "./pdiIsoPrecisionUx.css";\n'
MAIN_NEW_HEAD = "\n".join([
    "// PATCH 017H : les CSS ne sont plus des assets separes (403 sur /assets/*.css).",
    "// pdiInlineStyles importe chaque feuille en \"?inline\" et l injecte au demarrage.",
    'import "./pdiInlineStyles";',
    "",
])

MAIN_OLD_INDEX = "import './index.css';\n"
MAIN_NEW_INDEX = "// PATCH 017H : index.css est injecte par ./pdiInlineStyles (bundle JS).\n"

LANDING_OLD = 'import "./pdiLandingV4.css";'
LANDING_NEW = "// PATCH 017H : pdiLandingV4.css est injecte par src/pdiInlineStyles (bundle JS)."

MAP_OLD = 'import "leaflet/dist/leaflet.css";'
MAP_NEW = "\n".join([
    "// PATCH 017H : CSS leaflet embarque dans le bundle (aucun asset .css servi).",
    'import leafletCss from "leaflet/dist/leaflet.css?inline";',
    'import { pdiInjectInlineCss } from "../pdiInlineStyles";',
    'pdiInjectInlineCss("pdi-inline-leaflet-017h", leafletCss);',
])

ENV_OLD = '/// <reference types="vite/client" />\n'
ENV_NEW = "\n".join([
    '/// <reference types="vite/client" />',
    "",
    "// PATCH 017H : CSS importes en chaine de caracteres (embarques dans le bundle).",
    'declare module "*.css?inline" {',
    "  const css: string;",
    "  export default css;",
    "}",
    "",
])

VITE_OLD = "      chunkSizeWarningLimit: 1200,\n"
VITE_NEW = "\n".join([
    "      chunkSizeWarningLimit: 1200,",
    "      // PATCH 017H : aucun asset CSS eclate ; les styles sont embarques en JS.",
    "      cssCodeSplit: false,",
    "",
])

SERVER_OLD = '    app.get("*", (req, res) => {\n'
SERVER_NEW = "\n".join([
    "    // PATCH 017H : route de secours pour les styles. Certaines plateformes",
    "    // repondent 403 sur /assets/*.css ; /api/* reste accessible. On concatene",
    "    // les CSS presents dans dist/assets et on les sert en text/css.",
    '    app.get("/api/style/main.css", (_req, res) => {',
    "      try {",
    '        const assetsDir = path.join(distPath, "assets");',
    "        const files = fs.existsSync(assetsDir)",
    '          ? fs.readdirSync(assetsDir).filter((f) => f.endsWith(".css"))',
    "          : [];",
    "        if (files.length === 0) {",
    '          res.status(404).type("text/plain").send("Aucun bundle CSS dans dist/assets");',
    "          return;",
    "        }",
    "        const css = files",
    '          .map((f) => fs.readFileSync(path.join(assetsDir, f), "utf-8"))',
    '          .join("\\n");',
    '        res.setHeader("Content-Type", "text/css; charset=utf-8");',
    '        res.setHeader("Cache-Control", "no-store");',
    "        res.send(css);",
    "      } catch (err: any) {",
    '        res.status(500).type("text/plain").send("Erreur lecture CSS: " + String(err));',
    "      }",
    "    });",
    "",
    '    app.get("*", (req, res) => {',
    "",
])

RECOVER_OLD = "  if (injected === 0) {\n"
RECOVER_NEW = "\n".join([
    "  // PATCH 017H : dernier recours, la route serveur /api/style/main.css",
    "  // (utile quand /assets/*.css est refuse en 403 par la plateforme).",
    "  if (injected === 0) {",
    '    if (pdiInjectStylesheet("/api/style/main.css")) injected += 1;',
    "  }",
    "  if (injected === 0) {",
    "",
])


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    root = os.path.abspath(root)
    print("PATCH 017H - CSS embarque dans le bundle JS (contournement 403)")
    print("Racine : " + root)
    print("-" * 72)

    create("A. src/pdiInlineStyles.ts (injection des CSS embarques)",
           "src/pdiInlineStyles.ts", INLINE_STYLES, root)

    step("B1. main.tsx : import de pdiInlineStyles",
         "src/main.tsx", 'import "./pdiInlineStyles";',
         MAIN_OLD_HEAD, MAIN_NEW_HEAD, root)

    step("B2. main.tsx : retrait de l import direct de index.css",
         "src/main.tsx", "index.css est injecte par ./pdiInlineStyles",
         MAIN_OLD_INDEX, MAIN_NEW_INDEX, root)

    step("C. PdiLandingV4.tsx : CSS landing centralise",
         "src/pdi/landing/PdiLandingV4.tsx", "PATCH 017H",
         LANDING_OLD, LANDING_NEW, root)

    step("D. ProjectMapViewer.tsx : CSS leaflet embarque",
         "src/components/ProjectMapViewer.tsx", "pdi-inline-leaflet-017h",
         MAP_OLD, MAP_NEW, root)

    step("E. vite-env.d.ts : declaration *.css?inline",
         "src/vite-env.d.ts", '*.css?inline',
         ENV_OLD, ENV_NEW, root)

    step("F. vite.config.ts : cssCodeSplit desactive",
         "vite.config.ts", "cssCodeSplit",
         VITE_OLD, VITE_NEW, root)

    step("G. server.ts : route de secours /api/style/main.css",
         "server.ts", "/api/style/main.css",
         SERVER_OLD, SERVER_NEW, root)

    step("H. main.tsx : recuperation via /api/style/main.css",
         "src/main.tsx", '"/api/style/main.css"',
         RECOVER_OLD, RECOVER_NEW, root)

    print("\n".join(log))
    print("-" * 72)
    print("Appliques : " + str(applied) + " | Deja presents : " + str(skipped) + " | Echecs : " + str(failed))

    report = os.path.join(root, "017H_css_inline_bundle_403_REPORT.md")
    with open(report, "w", encoding="utf-8") as fh:
        fh.write("# PATCH 017H - CSS embarque dans le bundle JS\n\n")
        fh.write("## Cause racine\n\n")
        fh.write("Les requetes `/assets/*.css` reviennent en **403 Forbidden** ")
        fh.write("(`net::ERR_ABORTED 403`) alors que les bundles `.js` du meme dossier ")
        fh.write("sont servis. Le bundle CSS est donc bien genere : c'est son acces HTTP ")
        fh.write("qui est refuse. La sonde 017D basculait alors en affichage de secours ")
        fh.write("et 017G ne pouvait rien recuperer (les liens injectes reprenaient 403).\n\n")
        fh.write("## Correctif\n\n")
        fh.write("| # | Fichier | Effet |\n|---|---|---|\n")
        fh.write("| A | `src/pdiInlineStyles.ts` (nouveau) | Imports `?inline` + injection `<style>` |\n")
        fh.write("| B | `src/main.tsx` | Import unique de `pdiInlineStyles` |\n")
        fh.write("| C | `src/pdi/landing/PdiLandingV4.tsx` | CSS landing centralise |\n")
        fh.write("| D | `src/components/ProjectMapViewer.tsx` | CSS leaflet embarque |\n")
        fh.write("| E | `src/vite-env.d.ts` | Type `*.css?inline` |\n")
        fh.write("| F | `vite.config.ts` | `cssCodeSplit: false` |\n")
        fh.write("| G | `server.ts` | Route `GET /api/style/main.css` (text/css) |\n")
        fh.write("| H | `src/main.tsx` | 017G tente `/api/style/main.css` en dernier recours |\n\n")
        fh.write("## Identifiants\n\n")
        fh.write("`pdiInstallInlineStyles()`, `pdiInjectInlineCss(id, css)`, ")
        fh.write("`data-pdi-inline-css=\"017H\"`, `pdi-inline-base-017h`, ")
        fh.write("`pdi-inline-precision-017h`, `pdi-inline-landing-017h`, ")
        fh.write("`pdi-inline-leaflet-017h`, `/api/style/main.css`, ")
        fh.write("log `[PD&I 017H] Feuilles de styles embarquees : `\n\n")
        fh.write("## Resultat\n\n")
        fh.write("Appliques : " + str(applied) + " | Deja presents : " + str(skipped))
        fh.write(" | Echecs : " + str(failed) + "\n\n")
        fh.write("\n".join(log) + "\n")
    print("Rapport : " + report)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
