#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PATCH 017D - PD&I : hotfix build 18
  1. Garde de feuille de styles (fallback critique sans Tailwind) : l UI ne
     s effondre plus si le bundle CSS n est pas charge par le serveur.
  2. CSS de secours autonome pour le squelette du studio (dock, boutons,
     panneaux, canvas) applique via html.pdi-no-tailwind.
  3. Restauration des regressions de la passe UI compacte :
       - dock de commande a nouveau masquable (HIDE),
       - bouton flottant de restauration de la ligne de commande,
       - variable --pdi-command-reserved-bottom coherente avec HIDE.
Idempotent. Sauvegardes .before017D. Rapport genere.
"""

import os
import shutil
import sys

ROOT = os.getcwd()
ENGINE = os.path.join(ROOT, "src/pdi/isometric/engine/IsometrieModuleV48d.tsx")
CSS = os.path.join(ROOT, "src/pdiIsoPrecisionUx.css")
MAIN = os.path.join(ROOT, "src/main.tsx")

notes = []


def read(path):
    with open(path, "r", encoding="utf-8") as fh:
        return fh.read()


def write(path, content):
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)


def backup(path):
    bak = path + ".before017D"
    if not os.path.exists(bak):
        shutil.copy2(path, bak)


def check_files():
    missing = [p for p in (ENGINE, CSS, MAIN) if not os.path.exists(p)]
    if missing:
        print("ERREUR : fichiers introuvables :")
        for m in missing:
            print("   - " + m)
        print("Lancer ce patch a la racine du depot.")
        sys.exit(1)


# ---------------------------------------------------------------- 1. CSS
CSS_BLOCK = """
/* PATCH 017D - Affichage de secours si la feuille de styles principale
   (Tailwind) n est pas chargee par le serveur. Ces regles sont du CSS pur :
   elles ne dependent d aucun utilitaire genere. */

#pdi-style-alert {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2147483000;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 6px 12px;
  background: #7f1d1d;
  color: #fff;
  font: 700 12px/1.2 system-ui, -apple-system, sans-serif;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
}

#pdi-style-alert button {
  background: #f97316;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 4px 12px;
  font: 800 11px/1.2 system-ui, sans-serif;
  cursor: pointer;
}

html.pdi-no-tailwind,
html.pdi-no-tailwind body {
  background: #0b0f14 !important;
  color: #e6edf3 !important;
  font-family: system-ui, -apple-system, sans-serif;
  margin: 0;
}

html.pdi-no-tailwind [data-pdi-studio] {
  position: fixed;
  inset: 0;
  padding: 30px 10px 58px 10px;
  overflow: auto;
  box-sizing: border-box;
}

html.pdi-no-tailwind [data-pdi-studio] svg {
  width: 100%;
  height: 62vh;
  background: #05080d;
  border: 1px solid #30363d;
  border-radius: 10px;
}

html.pdi-no-tailwind button {
  background: #161b22;
  color: #e6edf3;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 4px 9px;
  margin: 2px;
  font: 700 11px/1.2 system-ui, sans-serif;
  cursor: pointer;
}

html.pdi-no-tailwind input,
html.pdi-no-tailwind select,
html.pdi-no-tailwind textarea {
  background: #05080d;
  color: #e6edf3;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 4px 7px;
  font: 600 12px/1.2 ui-monospace, monospace;
}

html.pdi-no-tailwind .pdi-cmd-dock-017d {
  position: fixed !important;
  left: 10px;
  right: 10px;
  bottom: 8px;
  z-index: 10030;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #020617;
  border: 1px solid rgba(34, 211, 238, 0.4);
  border-radius: 12px;
  box-sizing: border-box;
}

html.pdi-no-tailwind .pdi-cmd-dock-017d input[type="text"] {
  flex: 1 1 auto;
  min-width: 120px;
}

html.pdi-no-tailwind .pdi-cmd-restore-017d {
  position: fixed !important;
  left: 10px;
  bottom: 8px;
  z-index: 10030;
}
"""


def patch_css():
    src = read(CSS)
    if "PATCH 017D" in src:
        notes.append("OK (deja) : CSS de secours autonome")
        return
    backup(CSS)
    write(CSS, src.rstrip() + "\n" + CSS_BLOCK)
    notes.append("OK : CSS de secours autonome ajoute (html.pdi-no-tailwind)")


# ---------------------------------------------------------------- 2. main.tsx
GUARD = '''
// PATCH 017D : garde de feuille de styles.
// Si le bundle CSS principal n est pas charge (echec de build ou asset 404),
// l application basculait en affichage brut sans mise en page. On detecte le
// cas avec une sonde et on active un affichage de secours + un bandeau.
function pdiCheckStylesheet(): boolean {
  try {
    const probe = document.createElement("div");
    probe.className = "hidden";
    probe.setAttribute("data-pdi-style-probe", "1");
    document.body.appendChild(probe);
    const loaded = window.getComputedStyle(probe).display === "none";
    probe.remove();
    if (loaded) {
      document.documentElement.classList.remove("pdi-no-tailwind");
      const old = document.getElementById("pdi-style-alert");
      if (old) old.remove();
      return true;
    }
    document.documentElement.classList.add("pdi-no-tailwind");
    console.error(
      "[PD&I 017D] Feuille de styles principale absente : affichage de secours actif. " +
        "Verifier la generation du bundle CSS (vite build / @tailwindcss/vite)."
    );
    if (!document.getElementById("pdi-style-alert")) {
      const bar = document.createElement("div");
      bar.id = "pdi-style-alert";
      const msg = document.createElement("span");
      msg.textContent =
        "Feuille de styles non chargee - affichage de secours actif (reconstruire le bundle CSS).";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Recharger";
      btn.addEventListener("click", () => window.location.reload());
      bar.appendChild(msg);
      bar.appendChild(btn);
      document.body.appendChild(bar);
    }
    return false;
  } catch {
    return true;
  }
}

window.setTimeout(pdiCheckStylesheet, 700);
window.addEventListener("load", () => window.setTimeout(pdiCheckStylesheet, 250));
'''


def patch_main():
    src = read(MAIN)
    if "PATCH 017D" in src:
        notes.append("OK (deja) : garde de feuille de styles dans main.tsx")
        return
    backup(MAIN)
    write(MAIN, src.rstrip() + "\n" + GUARD)
    notes.append("OK : garde de feuille de styles ajoutee (sonde + bandeau)")


# ---------------------------------------------------------------- 3. moteur
OLD_VAR = 'style={{ "--pdi-command-reserved-bottom": !propertiesModalOpen ? "44px" : "0px" } as React.CSSProperties}'
NEW_VAR = 'style={{ "--pdi-command-reserved-bottom": (!propertiesModalOpen && !commandPromptHidden) ? "44px" : "0px" } as React.CSSProperties} /* PATCH 017D */'

OLD_DOCK = ('    {/* Ligne de commande compacte et permanente */}\n'
            '    {!propertiesModalOpen && <div className="fixed left-[92px] right-3 bottom-2 '
            'z-[10030] rounded-xl border border-cyan-500/30 bg-slate-950/95 shadow-xl '
            'backdrop-blur-md px-2 py-1 flex items-center gap-2">')

NEW_DOCK = ('    {/* PATCH 017D : ligne de commande compacte, masquable par HIDE */}\n'
            '    {!propertiesModalOpen && !commandPromptHidden && <div className="pdi-cmd-dock-017d '
            'fixed left-[92px] right-3 bottom-2 z-[10030] rounded-xl border border-cyan-500/30 '
            'bg-slate-950/95 shadow-xl backdrop-blur-md px-2 py-1 flex items-center gap-2">')

OLD_TAIL = ('        <span className="w-8 text-right text-cyan-300 text-[10px]">'
            '{pipeStrokeScale.toFixed(2)}\u00d7</span>\n'
            '      </label>\n'
            '    </div>}\n')

NEW_TAIL = ('        <span className="w-8 text-right text-cyan-300 text-[10px]">'
            '{pipeStrokeScale.toFixed(2)}\u00d7</span>\n'
            '      </label>\n'
            '    </div>}\n'
            '    {/* PATCH 017D : bouton de restauration de la ligne de commande */}\n'
            '    {!propertiesModalOpen && commandPromptHidden && <button type="button" '
            'onClick={() => setCommandPromptHidden(false)} '
            'className="pdi-cmd-restore-017d fixed left-[92px] bottom-2 z-[10030] rounded-lg '
            'border border-cyan-500/40 bg-slate-950/95 px-3 py-1.5 text-[11px] font-black '
            'text-cyan-200 shadow-xl" title="Afficher la ligne de commande (HIDE)">'
            '\u2328 Commande</button>}\n')


def patch_engine():
    src = read(ENGINE)
    if "PATCH 017D" in src:
        notes.append("OK (deja) : dock masquable et bouton de restauration")
        return
    backup(ENGINE)
    ok = 0

    if OLD_VAR in src:
        src = src.replace(OLD_VAR, NEW_VAR, 1)
        notes.append("OK : espace reserve du dock coherent avec HIDE")
        ok += 1
    elif '(!propertiesModalOpen && !commandPromptHidden) ? "44px"' in src:
        notes.append("OK (deja) : espace reserve du dock")
        ok += 1
    else:
        notes.append("NON TROUVE : variable --pdi-command-reserved-bottom")

    if OLD_DOCK in src:
        src = src.replace(OLD_DOCK, NEW_DOCK, 1)
        notes.append("OK : dock de commande a nouveau masquable (HIDE)")
        ok += 1
    else:
        notes.append("NON TROUVE : conteneur du dock de commande")

    if OLD_TAIL in src:
        src = src.replace(OLD_TAIL, NEW_TAIL, 1)
        notes.append("OK : bouton flottant de restauration restaure")
        ok += 1
    else:
        notes.append("NON TROUVE : fin du bloc dock (curseur d epaisseur)")

    write(ENGINE, src)
    return ok


REPORT = os.path.join(ROOT, "017D_hotfix_stylesheet_guard_command_dock_REPORT.md")

REPORT_BODY = """# PATCH 017D - Hotfix build 18 : styles absents et dock de commande

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
"""


def main():
    print("PATCH 017D - hotfix styles et dock de commande")
    print("Racine : " + ROOT)
    check_files()
    patch_css()
    patch_main()
    patch_engine()
    with open(REPORT, "w", encoding="utf-8") as fh:
        fh.write(REPORT_BODY)
    notes.append("OK : rapport 017D_hotfix_stylesheet_guard_command_dock_REPORT.md")
    print("")
    for n in notes:
        print("  " + n)
    ko = len([n for n in notes if n.startswith("NON TROUVE")])
    print("")
    print("Resultat : %d/%d" % (len(notes) - ko, len(notes)))
    if ko:
        print("Des ancres n ont pas ete trouvees : verifier le build utilise.")


if __name__ == "__main__":
    main()
