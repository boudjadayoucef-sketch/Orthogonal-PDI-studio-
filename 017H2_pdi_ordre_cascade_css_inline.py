#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PATCH 017H2 - PD&I VIS DZ
ORDRE DE LA CASCADE CSS APRES L EMBARQUEMENT INLINE (017H)

CONSTAT (retour utilisateur, 4:07 PM)
-------------------------------------
017H fonctionne : console = "[PD&I 017H] Feuilles de styles embarquees : 3
(219942 octets)", aucun 403, plus de bandeau orange, la coquille est stylee.
MAIS : la barre de commandes et le dock ONGLETS/PROJETS passent DEVANT le reste
(modale "A propos" incluse), et la page defile verticalement au lieu que l espace
de travail occupe la hauteur disponible.

CAUSE RACINE
------------
017H a inverse l ordre de la cascade. Ordre d origine reel (ordre d evaluation
des modules) :
    1. src/pdiIsoPrecisionUx.css     (main.tsx ligne 1)
    2. leaflet/dist/leaflet.css      (via App -> ProjectMapViewer)
    3. src/pdi/landing/pdiLandingV4.css (via App -> PdiLandingV4)
    4. src/index.css = @import "tailwindcss"   (main.tsx ligne 7, EN DERNIER)
Tailwind etait donc charge en DERNIER et ses utilitaires (position, z-index,
flex, h-full, overflow) gagnaient la specificite egale.

017H injectait dans l ordre : base(Tailwind) -> precision -> landing, donc les
feuilles maison ecrasent desormais les utilitaires Tailwind : d ou les z-index
et les hauteurs incorrects.

CORRECTIF 017H2
---------------
A. src/pdiInlineStyles.ts : leaflet integre a la liste et ordre d injection
   rétabli -> precision, leaflet, landing, PUIS base (Tailwind en dernier).
B. src/components/ProjectMapViewer.tsx : l injection locale du CSS leaflet est
   retiree (elle arrivait apres Tailwind) ; elle est centralisee en A.

REGLES : R1 patch .py idempotent + backup + rapport / R2 codage Claude /
R5 test avant patch suivant / R6 explication avant code.

PREREQUIS : 017H deja applique.
USAGE : python3 017H2_pdi_ordre_cascade_css_inline.py [racine_du_projet]
"""

import os
import sys
import shutil

SUFFIX = ".before017H2"
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


# ---------------------------------------------------------------------------
# A1. imports : ajout de leaflet
# ---------------------------------------------------------------------------
IMPORTS_OLD = "\n".join([
    'import baseCss from "./index.css?inline";',
    'import precisionCss from "./pdiIsoPrecisionUx.css?inline";',
    'import landingCss from "./pdi/landing/pdiLandingV4.css?inline";',
])

IMPORTS_NEW = "\n".join([
    "// PATCH 017H2 : l ordre des imports ne pilote plus la cascade ; c est l ordre",
    "// du tableau PDI_INLINE_SHEETS ci-dessous qui fait foi (Tailwind en dernier).",
    'import baseCss from "./index.css?inline";',
    'import precisionCss from "./pdiIsoPrecisionUx.css?inline";',
    'import landingCss from "./pdi/landing/pdiLandingV4.css?inline";',
    'import leafletCss from "leaflet/dist/leaflet.css?inline";',
])

# ---------------------------------------------------------------------------
# A2. ordre d injection
# ---------------------------------------------------------------------------
SHEETS_OLD = "\n".join([
    "const PDI_INLINE_SHEETS: PdiInlineSheet[] = [",
    '  { id: "pdi-inline-base-017h", css: baseCss },',
    '  { id: "pdi-inline-precision-017h", css: precisionCss },',
    '  { id: "pdi-inline-landing-017h", css: landingCss },',
    "];",
])

SHEETS_NEW = "\n".join([
    "// PATCH 017H2 : ordre de cascade identique a la chaine de build d origine.",
    "// Les feuilles maison d abord, Tailwind (index.css) EN DERNIER, sinon les",
    "// regles maison ecrasent les utilitaires (z-index, hauteurs, overflow) et la",
    "// barre de commandes / le dock ONGLETS passent devant les modales.",
    "const PDI_INLINE_SHEETS: PdiInlineSheet[] = [",
    '  { id: "pdi-inline-precision-017h", css: precisionCss },',
    '  { id: "pdi-inline-leaflet-017h", css: leafletCss },',
    '  { id: "pdi-inline-landing-017h", css: landingCss },',
    '  { id: "pdi-inline-base-017h", css: baseCss },',
    "];",
])

# ---------------------------------------------------------------------------
# B. ProjectMapViewer : injection locale retiree
# ---------------------------------------------------------------------------
MAP_OLD = "\n".join([
    "// PATCH 017H : CSS leaflet embarque dans le bundle (aucun asset .css servi).",
    'import leafletCss from "leaflet/dist/leaflet.css?inline";',
    'import { pdiInjectInlineCss } from "../pdiInlineStyles";',
    'pdiInjectInlineCss("pdi-inline-leaflet-017h", leafletCss);',
])

MAP_NEW = "\n".join([
    "// PATCH 017H2 : CSS leaflet injecte par src/pdiInlineStyles, AVANT Tailwind.",
    "// (l injection locale arrivait apres Tailwind et cassait la cascade).",
])


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    root = os.path.abspath(root)
    print("PATCH 017H2 - ordre de la cascade CSS inline")
    print("Racine : " + root)
    print("-" * 72)

    step("A1. pdiInlineStyles.ts : import leaflet inline",
         "src/pdiInlineStyles.ts", "leaflet/dist/leaflet.css?inline",
         IMPORTS_OLD, IMPORTS_NEW, root)

    step("A2. pdiInlineStyles.ts : Tailwind injecte en dernier",
         "src/pdiInlineStyles.ts", "PATCH 017H2 : ordre de cascade",
         SHEETS_OLD, SHEETS_NEW, root)

    step("B. ProjectMapViewer.tsx : injection leaflet centralisee",
         "src/components/ProjectMapViewer.tsx", "PATCH 017H2",
         MAP_OLD, MAP_NEW, root)

    print("\n".join(log))
    print("-" * 72)
    print("Appliques : " + str(applied) + " | Deja presents : " + str(skipped) + " | Echecs : " + str(failed))

    report = os.path.join(root, "017H2_ordre_cascade_css_inline_REPORT.md")
    with open(report, "w", encoding="utf-8") as fh:
        fh.write("# PATCH 017H2 - ordre de la cascade CSS inline\n\n")
        fh.write("## Cause racine\n\n")
        fh.write("017H a supprime les 403 sur `/assets/*.css` mais a inverse l ordre ")
        fh.write("de la cascade : Tailwind (`index.css`) etait injecte en premier au ")
        fh.write("lieu du dernier. Les feuilles maison ecrasaient donc les utilitaires ")
        fh.write("(`z-index`, `position`, hauteurs, `overflow`), d ou la barre de ")
        fh.write("commandes et le dock ONGLETS passant devant les modales et la page ")
        fh.write("qui defile.\n\n")
        fh.write("## Ordre retabli\n\n")
        fh.write("1. `pdiIsoPrecisionUx.css`\n2. `leaflet.css`\n")
        fh.write("3. `pdiLandingV4.css`\n4. `index.css` (Tailwind) **en dernier**\n\n")
        fh.write("## Fichiers\n\n")
        fh.write("| # | Fichier | Effet |\n|---|---|---|\n")
        fh.write("| A | `src/pdiInlineStyles.ts` | leaflet inline + ordre de cascade corrige |\n")
        fh.write("| B | `src/components/ProjectMapViewer.tsx` | injection locale retiree |\n\n")
        fh.write("## Resultat\n\n")
        fh.write("Appliques : " + str(applied) + " | Deja presents : " + str(skipped))
        fh.write(" | Echecs : " + str(failed) + "\n\n")
        fh.write("\n".join(log) + "\n")
    print("Rapport : " + report)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
