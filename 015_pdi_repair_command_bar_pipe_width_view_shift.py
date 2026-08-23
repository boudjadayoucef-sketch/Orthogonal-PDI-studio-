#!/usr/bin/env python3
"""
PATCH 015 — Réparation urgente éditeur ISO

Corrige les régressions signalées après PATCH 014 :
1) la ligne de commande n'est pas visible car elle est injectée dans le panneau droit ;
2) les dessins semblent décalés / l'espace utile est perturbé ;
3) l'épaisseur des lignes de tuyauterie n'est pas configurable.

Usage :
  - Copier ce fichier à la racine du projet PD&I.
  - Lancer : python3 015_pdi_repair_command_bar_pipe_width_view_shift.py
  - Tester : npm run lint && npm run build

Ce patch ne touche pas GitHub. Il modifie seulement les fichiers locaux du projet.
"""
from pathlib import Path
from datetime import datetime
import re
import shutil

ROOT = Path(__file__).resolve().parent
ENGINE = ROOT / "src/pdi/isometric/engine/IsometrieModuleV48d.tsx"
REPORT = ROOT / "015_repair_command_bar_pipe_width_view_shift_REPORT.md"


def backup(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"Fichier introuvable: {path}")
    b = path.with_suffix(path.suffix + ".before015")
    if not b.exists():
        shutil.copy2(path, b)


def replace_once(text: str, old: str, new: str, label: str, notes: list[str]) -> str:
    if old in text:
        notes.append(label)
        return text.replace(old, new, 1)
    notes.append(f"NON TROUVÉ: {label}")
    return text


def patch_engine():
    backup(ENGINE)
    s = ENGINE.read_text(encoding="utf-8")
    notes: list[str] = []

    # ------------------------------------------------------------------
    # 1) Ajouter un état global pour l'épaisseur graphique des tuyauteries.
    # ------------------------------------------------------------------
    state_anchor = '  const [autocadPrompt, setAutocadPrompt] = useState("Tapez une commande (ex: LIGNE, RECT, TRIANGLE, COPIER, COLLER...)");'
    state_injection = state_anchor + '''
  const [pipeStrokeScale, setPipeStrokeScale] = useState<number>(() => {
    try {
      const saved = Number(window.localStorage.getItem("pdi.pipeStrokeScale.v1") || "1");
      return Number.isFinite(saved) ? Math.min(3, Math.max(0.35, saved)) : 1;
    } catch { return 1; }
  });'''
    if "pipeStrokeScale" not in s:
        s = replace_once(s, state_anchor, state_injection, "État pipeStrokeScale ajouté", notes)
    else:
        notes.append("État pipeStrokeScale déjà présent")

    persist_anchor = "  const autocadCmdInputRef = useRef<HTMLInputElement>(null);"
    persist_injection = '''  useEffect(() => {
    try { window.localStorage.setItem("pdi.pipeStrokeScale.v1", String(pipeStrokeScale)); } catch {}
  }, [pipeStrokeScale]);
  const autocadCmdInputRef = useRef<HTMLInputElement>(null);'''
    if 'String(pipeStrokeScale)' not in s:
        s = replace_once(s, persist_anchor, persist_injection, "Persistance pipeStrokeScale ajoutée", notes)
    else:
        notes.append("Persistance pipeStrokeScale déjà présente")

    # ------------------------------------------------------------------
    # 2) Utiliser l'épaisseur configurable pour les segments ISO.
    # ------------------------------------------------------------------
    old_width = 'const width=clamp(s.dn/25,3,12),mx=(p1.x+p2.x)/2,my=(p1.y+p2.y)/2;'
    new_width = 'const width=clamp((s.dn/25)*pipeStrokeScale,2,24),mx=(p1.x+p2.x)/2,my=(p1.y+p2.y)/2;'
    s = replace_once(s, old_width, new_width, "Épaisseur tuyauterie rendue configurable", notes)

    # ------------------------------------------------------------------
    # 3) Corriger export/planche pour respecter aussi l'épaisseur configurée.
    # ------------------------------------------------------------------
    old_print_width = 'const pipeWidth = clamp((s.dn || 100) / 35, 2.5, 7);'
    new_print_width = 'const pipeWidth = clamp(((s.dn || 100) / 35) * pipeStrokeScale, 1.5, 14);'
    if old_print_width in s:
        s = s.replace(old_print_width, new_print_width, 1)
        notes.append("Épaisseur export/planche liée à pipeStrokeScale")

    # ------------------------------------------------------------------
    # 4) La zone de commande était dans le panneau droit, donc invisible panneau fermé.
    #    On supprime ce bloc local pour éviter les doublons et on ajoute une vraie barre fixe.
    # ------------------------------------------------------------------
    cmd_block = re.compile(
        r'\n\s*\{\/\* AutoCAD Command Line Bar \*\/\}\s*\n'
        r'\s*<div className="p-2 bg-slate-950\/95 border-t border-slate-800\/80">\s*\n'
        r'\s*<CadCommandLineBar\s*\n'
        r'\s*input=\{autocadCmdInput\}\s*\n'
        r'\s*setInput=\{setAutocadCmdInput\}\s*\n'
        r'\s*prompt=\{autocadPrompt\}\s*\n'
        r'\s*onExecuteCommand=\{\(cmd\) => executeCadCommand\(cmd\)\}\s*\n'
        r'\s*cadDraftSession=\{cadDraftSession\}\s*\n'
        r'\s*onCancelDraft=\{cancelCadDraft\}\s*\n'
        r'\s*onApplyNumericInput=\{applyNumericDraftInput\}\s*\n'
        r'\s*\/?>\s*\n'
        r'\s*<\/div>\s*',
        re.S,
    )
    s, removed = cmd_block.subn("\n", s, 1)
    notes.append(f"Ancienne barre commande dans panneau supprimée: {removed}")

    fixed_bar = r'''

    {/* PATCH 015 — Ligne de commande AutoCAD visible en permanence + réglage épaisseur tuyauterie */}
    <div className="fixed left-[92px] right-3 bottom-3 z-[10030] rounded-2xl border border-cyan-500/35 bg-slate-950/96 shadow-2xl backdrop-blur-xl p-2 flex items-center gap-2 pdi-command-dock-015">
      <div className="min-w-[150px] hidden md:flex flex-col gap-1 px-2 border-r border-slate-800">
        <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300">Commande</span>
        <span className="text-[9px] text-slate-500">Tapez LIGNE, COPIE, COUDE, BOM…</span>
      </div>
      <div className="flex-1 min-w-0">
        <CadCommandLineBar
          input={autocadCmdInput}
          setInput={setAutocadCmdInput}
          prompt={autocadPrompt}
          onExecuteCommand={(cmd) => executeCadCommand(cmd)}
          cadDraftSession={cadDraftSession}
          onCancelDraft={cancelCadDraft}
          onApplyNumericInput={applyNumericDraftInput}
        />
      </div>
      <label className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-black text-slate-200" title="Épaisseur graphique des lignes de tuyauterie">
        <span className="text-slate-400">Ép.</span>
        <input
          type="range"
          min="0.35"
          max="3"
          step="0.05"
          value={pipeStrokeScale}
          onChange={(e) => setPipeStrokeScale(Number(e.target.value))}
          className="w-24 accent-cyan-400"
        />
        <span className="w-9 text-right text-cyan-300">{pipeStrokeScale.toFixed(2)}×</span>
      </label>
    </div>
'''

    # Insérer la barre fixe juste avant le status dock caché, ou avant la fermeture racine.
    insert_anchor = '    <div className={`hidden pdi-status-docked'
    if "pdi-command-dock-015" not in s:
        if insert_anchor in s:
            s = s.replace(insert_anchor, fixed_bar + "\n" + insert_anchor, 1)
            notes.append("Barre de commande fixe ajoutée en bas")
        else:
            s = s.replace("  </div>;\n}\n\nexport { IsometrieModule };", fixed_bar + "\n  </div>;\n}\n\nexport { IsometrieModule };", 1)
            notes.append("Barre de commande fixe ajoutée avant fin composant")
    else:
        notes.append("Barre de commande fixe déjà présente")

    # ------------------------------------------------------------------
    # 5) Réserver de l'espace en bas pour que la barre ne masque pas le dessin,
    #    sans changer la projection ni les coordonnées du modèle.
    # ------------------------------------------------------------------
    css_anchor = "[data-pdi-studio] .pdi-status-docked{display:none!important}"
    css_add = """[data-pdi-studio] .pdi-status-docked{display:none!important}
        [data-pdi-studio] .pdi-command-dock-015{font-family:Inter,ui-sans-serif,system-ui,sans-serif}
        [data-pdi-studio] .pdi-v48d-primary-workspace{padding-bottom:74px!important}
        @media(max-width:900px){[data-pdi-studio] .pdi-command-dock-015{left:8px!important;right:8px!important;bottom:8px!important}.pdi-command-dock-015 label{display:none!important}}"""
    if css_anchor in s and "pdi-command-dock-015" not in s[s.find(css_anchor):s.find(css_anchor)+500]:
        s = s.replace(css_anchor, css_add, 1)
        notes.append("CSS dock commande + marge basse ajouté")

    # ------------------------------------------------------------------
    # 6) Ajouter un contrôle d'épaisseur dans la toolbar haute, près du snap,
    #    pour test rapide même si la barre commande est masquée par écran petit.
    # ------------------------------------------------------------------
    snap_anchor = '<select value={isoSnapStep} onChange={e=>setIsoSnapStep(Number(e.target.value))} className="h-8 bg-slate-950 border border-slate-700 rounded px-2 text-[10px] font-black"><option value={.1}>Snap 0,10 m</option><option value={.25}>Snap 0,25 m</option><option value={.5}>Snap 0,50 m</option><option value={1}>Snap 1,00 m</option></select>'
    toolbar_width_control = snap_anchor + '<label className="h-8 px-2 rounded border border-slate-700 bg-slate-950 text-[10px] font-black flex items-center gap-1" title="Épaisseur tuyauterie"><span>Ép.</span><input type="number" min="0.35" max="3" step="0.05" value={pipeStrokeScale} onChange={e=>setPipeStrokeScale(Number(e.target.value)||1)} className="w-12 bg-slate-900 border border-slate-700 rounded px-1 text-cyan-300"/></label>'
    if snap_anchor in s and 'title="Épaisseur tuyauterie"' not in s:
        s = s.replace(snap_anchor, toolbar_width_control, 1)
        notes.append("Contrôle épaisseur ajouté près du Snap")

    # ------------------------------------------------------------------
    # 7) Sécurité: ne pas toucher isoProject/isoUnproject. Le décalage visuel
    #    est traité par emplacement UI, pas par coordonnées.
    # ------------------------------------------------------------------
    ENGINE.write_text(s, encoding="utf-8")
    return notes


def main():
    notes = patch_engine()
    REPORT.write_text(
        "# PATCH 015 — Réparation commande visible, décalage dessin, épaisseur tuyauterie\n\n"
        f"Date: {datetime.now().isoformat(timespec='seconds')}\n\n"
        "## Corrections\n"
        + "\n".join(f"- {n}" for n in notes)
        + "\n\n## Points importants\n"
        "- La ligne de commande est maintenant un dock fixe en bas, visible même si le panneau droit est fermé.\n"
        "- L'ancien emplacement dans le panneau droit est supprimé pour éviter le doublon.\n"
        "- Le dessin n'est pas recalculé ni déplacé : on réserve seulement une marge basse pour l'UI.\n"
        "- L'épaisseur des lignes de tuyauterie est configurable globalement via `Ép.`.\n"
        "- La valeur est mémorisée dans `localStorage` : `pdi.pipeStrokeScale.v1`.\n\n"
        "## Tests à faire\n"
        "1. Ouvrir ISO : la commande doit être visible en bas.\n"
        "2. Taper `COPIE`, `COUDE`, `BOM` : le prompt doit répondre.\n"
        "3. Modifier `Ép.` : les lignes de tuyauterie doivent changer d'épaisseur sans déplacer les points.\n"
        "4. Vérifier que le dessin n'est plus repoussé/décalé par le panneau de commande.\n"
        "5. Lancer `npm run lint` puis `npm run build`.\n",
        encoding="utf-8",
    )
    print("PATCH 015 prêt/appliqué localement.")
    for n in notes:
        print("-", n)
    print("Rapport:", REPORT)


if __name__ == "__main__":
    main()
