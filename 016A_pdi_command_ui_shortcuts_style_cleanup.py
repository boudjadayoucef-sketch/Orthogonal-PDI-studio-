#!/usr/bin/env python3
"""
PATCH 016A — Command UI + raccourcis + style global

Objectif : stabiliser l'interface avant les commandes guidées 016B.
- Le tableau propriétés/BOM ne passe plus derrière la barre de commande.
- Ajout d'un bouton Hide/Show prompt pour maximiser l'espace.
- Suppression de la ligne Accès direct de la commande.
- Suppression du bouton BOM & Métré placé au mauvais endroit dans la topbar.
- Ajout d'un mode Raccourcis clavier ON/OFF.
- Quand les raccourcis sont OFF, taper sur le plan envoie le texte vers la ligne de commande.
- Remplacement du slider isolé par un style global : épaisseur + couleur.
- Ajout commandes style : LW / LINEWEIGHT / EPAISSEUR / COLOR / COULEUR / STYLE.

Usage :
  1) Copier ce fichier à la racine du projet PD&I.
  2) Lancer : python3 016A_pdi_command_ui_shortcuts_style_cleanup.py
  3) Tester : npm run lint && npm run build

Ce script n'applique rien sur GitHub. Il modifie uniquement le projet local.
"""
from pathlib import Path
from datetime import datetime
import re
import shutil

ROOT = Path(__file__).resolve().parent
ENGINE = ROOT / "src/pdi/isometric/engine/IsometrieModuleV48d.tsx"
REPORT = ROOT / "016A_command_ui_shortcuts_style_cleanup_REPORT.md"


def backup(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"Fichier introuvable : {path}")
    b = path.with_suffix(path.suffix + ".before016A")
    if not b.exists():
        shutil.copy2(path, b)


def insert_after_once(s: str, anchor: str, addition: str, note: str, notes: list[str]) -> str:
    if addition.strip() in s:
        notes.append(note + " déjà présent")
        return s
    if anchor in s:
        notes.append(note)
        return s.replace(anchor, anchor + addition, 1)
    notes.append("NON TROUVÉ : " + note)
    return s


def patch_engine():
    backup(ENGINE)
    s = ENGINE.read_text(encoding="utf-8")
    notes: list[str] = []

    # ------------------------------------------------------------
    # 1) Ajouter états UI : prompt cachable, raccourcis ON/OFF,
    #    style global de plan de travail.
    # ------------------------------------------------------------
    if "commandPromptHidden" not in s:
        anchor = '  const [autocadPrompt, setAutocadPrompt] = useState("Tapez une commande (ex: LIGNE, RECT, TRIANGLE, COPIER, COLLER...)");'
        addition = '''
  const [commandPromptHidden, setCommandPromptHidden] = useState<boolean>(() => {
    try { return window.localStorage.getItem("pdi.commandPromptHidden.v1") === "1"; } catch { return false; }
  });
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useState<boolean>(() => {
    try { return window.localStorage.getItem("pdi.keyboardShortcutsEnabled.v1") === "1"; } catch { return false; }
  });
  const [workspaceVisualStyle, setWorkspaceVisualStyle] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("pdi.workspaceVisualStyle.v1") || "{}");
      return {
        pipeStrokeScale: Number.isFinite(Number(saved.pipeStrokeScale)) ? Math.min(3, Math.max(0.35, Number(saved.pipeStrokeScale))) : 1,
        cad2dStrokeScale: Number.isFinite(Number(saved.cad2dStrokeScale)) ? Math.min(3, Math.max(0.35, Number(saved.cad2dStrokeScale))) : 1,
        defaultPipeColor: typeof saved.defaultPipeColor === "string" ? saved.defaultPipeColor : "#0EA5E9",
        defaultCadColor: typeof saved.defaultCadColor === "string" ? saved.defaultCadColor : "#E5E7EB",
      };
    } catch { return { pipeStrokeScale: 1, cad2dStrokeScale: 1, defaultPipeColor: "#0EA5E9", defaultCadColor: "#E5E7EB" }; }
  });
  const pipeStrokeScale = workspaceVisualStyle.pipeStrokeScale;
'''
        if anchor in s:
            s = s.replace(anchor, anchor + addition, 1)
            notes.append("États UI/style ajoutés")
        else:
            notes.append("NON TROUVÉ : ancre état autocadPrompt")
    else:
        notes.append("États UI/style déjà présents")

    # Si patch 015 a déjà créé un useState pipeStrokeScale séparé, on le neutralise pour éviter conflit.
    s = re.sub(
        r'\n\s*const \[pipeStrokeScale, setPipeStrokeScale\] = useState<number>\(\(\) => \{.*?\n\s*\}\);',
        '',
        s,
        count=1,
        flags=re.S,
    )

    # Persistance des nouveaux états.
    if "pdi.workspaceVisualStyle.v1" not in s[s.find("useEffect") if "useEffect" in s else 0:]:
        anchor = '  const autocadCmdInputRef = useRef<HTMLInputElement>(null);'
        addition = '''  useEffect(() => {
    try { window.localStorage.setItem("pdi.commandPromptHidden.v1", commandPromptHidden ? "1" : "0"); } catch {}
  }, [commandPromptHidden]);
  useEffect(() => {
    try { window.localStorage.setItem("pdi.keyboardShortcutsEnabled.v1", keyboardShortcutsEnabled ? "1" : "0"); } catch {}
  }, [keyboardShortcutsEnabled]);
  useEffect(() => {
    try { window.localStorage.setItem("pdi.workspaceVisualStyle.v1", JSON.stringify(workspaceVisualStyle)); } catch {}
  }, [workspaceVisualStyle]);
  const setPipeStrokeScale = (value: number) => setWorkspaceVisualStyle((prev) => ({ ...prev, pipeStrokeScale: Math.min(3, Math.max(0.35, Number(value) || 1)) }));
  const setCad2dStrokeScale = (value: number) => setWorkspaceVisualStyle((prev) => ({ ...prev, cad2dStrokeScale: Math.min(3, Math.max(0.35, Number(value) || 1)) }));
  const setDefaultPipeColor = (value: string) => setWorkspaceVisualStyle((prev) => ({ ...prev, defaultPipeColor: value || prev.defaultPipeColor }));
  const setDefaultCadColor = (value: string) => setWorkspaceVisualStyle((prev) => ({ ...prev, defaultCadColor: value || prev.defaultCadColor }));
'''
        if anchor in s:
            s = s.replace(anchor, addition + anchor, 1)
            notes.append("Persistance UI/style ajoutée")
        else:
            notes.append("NON TROUVÉ : ancre autocadCmdInputRef")

    # ------------------------------------------------------------
    # 2) Éviter que les raccourcis clavier interceptent la saisie.
    #    Dans les handlers clavier, on retourne si shortcuts OFF.
    # ------------------------------------------------------------
    if "PATCH 016A keyboard shortcuts guard" not in s:
        # On cible le début du handler clavier document/window le plus courant.
        s = re.sub(
            r'(const handleKeyDown\s*=\s*\(e:KeyboardEvent\)\s*=>\s*\{)',
            r'\1\n      // PATCH 016A keyboard shortcuts guard : si OFF, les lettres vont vers la commande.\n      if (!keyboardShortcutsEnabled && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {\n        const target = e.target as HTMLElement | null;\n        const tag = target?.tagName?.toLowerCase();\n        if (tag !== "input" && tag !== "textarea" && !(target as any)?.isContentEditable) {\n          e.preventDefault();\n          setAutocadCmdInput((prev) => prev + e.key);\n          setTimeout(() => (document.getElementById("cad-command-input") as HTMLInputElement | null)?.focus(), 0);\n          return;\n        }\n      }',
            s,
            count=1,
        )
        notes.append("Garde raccourcis clavier ajouté")

    # ------------------------------------------------------------
    # 3) Commandes style + raccourcis ON/OFF dans executeCadCommand.
    # ------------------------------------------------------------
    if "PATCH 016A style commands" not in s:
        style_cmd = '''
    // PATCH 016A style commands : LW/EPAISSEUR/COLOR/STYLE + raccourcis ON/OFF.
    const rawCommandText = typeof cmdInput === "string" ? cmdInput.trim() : cmdInput.name;
    const rawParts = rawCommandText.split(/\s+/).filter(Boolean);
    const rawVerb = (rawParts[0] || "").toLowerCase();
    const rawArg = rawParts[1];
    const colorMap: Record<string, string> = { cyan: "#0EA5E9", bleu: "#0EA5E9", blue: "#0EA5E9", rouge: "#EF4444", red: "#EF4444", vert: "#22C55E", green: "#22C55E", jaune: "#FACC15", yellow: "#FACC15", blanc: "#E5E7EB", white: "#E5E7EB", gris: "#9CA3AF", gray: "#9CA3AF", grey: "#9CA3AF" };
    if (["lw", "lineweight", "epaisseur", "épaisseur"].includes(rawVerb)) {
      const value = Math.min(3, Math.max(0.35, Number(rawArg || "1")));
      setPipeStrokeScale(value);
      setCad2dStrokeScale(value);
      setAutocadPrompt(`COMMANDE [${rawVerb.toUpperCase()}] : épaisseur globale réglée à ${value.toFixed(2)}×.`);
      setStatusMessage(`Épaisseur globale ${value.toFixed(2)}×`);
      return;
    }
    if (["color", "couleur"].includes(rawVerb)) {
      const color = colorMap[(rawArg || "").toLowerCase()] || rawArg;
      if (color && /^#?[0-9a-f]{6}$/i.test(color)) {
        const normalized = color.startsWith("#") ? color : `#${color}`;
        setDefaultPipeColor(normalized);
        setDefaultCadColor(normalized);
        setAutocadPrompt(`COMMANDE [COULEUR] : couleur active ${normalized}.`);
        setStatusMessage(`Couleur active ${normalized}`);
        return;
      }
      if (color && color.startsWith("#")) {
        setDefaultPipeColor(color);
        setDefaultCadColor(color);
        setAutocadPrompt(`COMMANDE [COULEUR] : couleur active ${color}.`);
        return;
      }
      setAutocadPrompt("COMMANDE [COULEUR] : indiquez cyan, rouge, vert, jaune, blanc, gris ou #RRGGBB.");
      return;
    }
    if (["style"].includes(rawVerb)) {
      setAutocadPrompt(`STYLE ACTIF : tube ${workspaceVisualStyle.pipeStrokeScale.toFixed(2)}× ${workspaceVisualStyle.defaultPipeColor}, 2D ${workspaceVisualStyle.cad2dStrokeScale.toFixed(2)}× ${workspaceVisualStyle.defaultCadColor}.`);
      return;
    }
    if (["shortcuts", "raccourcis", "raccourci"].includes(rawVerb)) {
      const next = ["on", "1", "oui", "true"].includes((rawArg || "").toLowerCase());
      const off = ["off", "0", "non", "false"].includes((rawArg || "").toLowerCase());
      setKeyboardShortcutsEnabled(off ? false : next ? true : !keyboardShortcutsEnabled);
      setAutocadPrompt(`RACCOURCIS CLAVIER : ${off ? "OFF" : next ? "ON" : !keyboardShortcutsEnabled ? "ON" : "OFF"}.`);
      return;
    }
'''
        # Insérer juste après la déclaration de fonction executeCadCommand et avant cmdId.
        pattern = r'(  const executeCadCommand = \(cmdInput: CadCommandItem \| string\) => \{\n)'
        s, n = re.subn(pattern, lambda m: m.group(1) + style_cmd, s, count=1)
        notes.append(f"Commandes style/raccourcis ajoutées: {n}")

    # ------------------------------------------------------------
    # 4) Appliquer couleur/épaisseur globale aux tubes et objets 2D.
    # ------------------------------------------------------------
    s = s.replace(
        'const width=clamp((s.dn/25)*pipeStrokeScale,2,24),mx=(p1.x+p2.x)/2,my=(p1.y+p2.y)/2;',
        'const width=clamp((s.dn/25)*pipeStrokeScale,2,24),mx=(p1.x+p2.x)/2,my=(p1.y+p2.y)/2;',
    )
    s = s.replace(
        '<path d={path} stroke={s.color||"#9CA3AF"} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none"/>',
        '<path d={path} stroke={s.color||workspaceVisualStyle.defaultPipeColor} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none"/>',
    )
    # Objets 2D : multiplier lineWeight par cad2dStrokeScale si le rendu utilise entity.lineWeight.
    s = s.replace(
        'strokeWidth: selected ? 2.5 : (entity.lineWeight || 1.5),',
        'strokeWidth: selected ? 2.5 * workspaceVisualStyle.cad2dStrokeScale : ((entity.lineWeight || 1.5) * workspaceVisualStyle.cad2dStrokeScale),',
    )
    notes.append("Style global appliqué aux tubes/objets 2D")

    # ------------------------------------------------------------
    # 5) Barre commande : cacher derrière modal, hide prompt, enlever accès direct.
    # ------------------------------------------------------------
    # Remplacer condition d'affichage du dock 015 par condition qui respecte modal et hidden.
    s = s.replace(
        '    {/* PATCH 015 — Ligne de commande AutoCAD visible en permanence + réglage épaisseur tuyauterie */}\n    <div className="fixed left-[92px] right-3 bottom-3 z-[10030] rounded-2xl border border-cyan-500/35 bg-slate-950/96 shadow-2xl backdrop-blur-xl p-2 flex items-center gap-2 pdi-command-dock-015">',
        '    {/* PATCH 016A — Ligne de commande masquable, non affichée derrière modal */}\n    {!propertiesModalOpen && !commandPromptHidden && <div className="fixed left-[92px] right-3 bottom-3 z-[10030] rounded-2xl border border-cyan-500/35 bg-slate-950/96 shadow-2xl backdrop-blur-xl p-2 flex items-center gap-2 pdi-command-dock-015">',
    )
    s = s.replace(
        '    </div>\n\n    <div className={`hidden pdi-status-docked',
        '    </div>}\n    {!propertiesModalOpen && commandPromptHidden && <button type="button" onClick={() => setCommandPromptHidden(false)} className="fixed left-[92px] bottom-3 z-[10030] rounded-xl border border-cyan-500/40 bg-slate-950 px-3 py-2 text-xs font-black text-cyan-200 shadow-xl">⌨ Commande</button>}\n\n    <div className={`hidden pdi-status-docked',
        1,
    )
    # Ajouter boutons Hide + raccourcis dans le dock avant label épaisseur.
    if "Masquer prompt" not in s:
        s = s.replace(
            '<label className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-black text-slate-200" title="Épaisseur graphique des lignes de tuyauterie">',
            '<button type="button" onClick={() => setKeyboardShortcutsEnabled(v => !v)} className={`h-9 px-2 rounded-xl border text-[10px] font-black ${keyboardShortcutsEnabled ? "border-amber-500/60 bg-amber-950/40 text-amber-200" : "border-slate-700 bg-slate-900 text-slate-300"}`} title="Activer/désactiver les raccourcis clavier">⌨ {keyboardShortcutsEnabled ? "ON" : "OFF"}</button>\n      <button type="button" onClick={() => setCommandPromptHidden(true)} className="h-9 px-2 rounded-xl border border-slate-700 bg-slate-900 text-[10px] font-black text-slate-300" title="Masquer prompt">Hide</button>\n      <label className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-black text-slate-200" title="Épaisseur graphique des lignes de tuyauterie">',
            1,
        )
        notes.append("Boutons raccourcis ON/OFF + Hide ajoutés")

    # Enlever ligne Accès direct dans CadCommandLineBar par CSS robuste.
    if "pdi-cad-command-wrapper" in s and "pdi-hide-direct-access-016a" not in s:
        css_anchor = "[data-pdi-studio] .pdi-command-dock-015{font-family:Inter,ui-sans-serif,system-ui,sans-serif}"
        css_add = css_anchor + "\n        [data-pdi-studio] .pdi-command-dock-015 .pdi-hide-direct-access-016a{display:none!important}\n        [data-pdi-studio] .pdi-command-dock-015 [class*=\\\"direct\\\"], [data-pdi-studio] .pdi-command-dock-015 .pdi-cad-command-wrapper > div:last-child{display:none!important}"
        if css_anchor in s:
            s = s.replace(css_anchor, css_add, 1)
            notes.append("CSS suppression accès direct ajouté")

    # ------------------------------------------------------------
    # 6) Supprimer bouton BOM & Métré topbar mal placé.
    # ------------------------------------------------------------
    # Bouton texte BOM & Métré dans header/topbar : suppression par bloc button autour du libellé.
    idx = s.find('BOM &')
    removed_bom = False
    while idx != -1:
        context = s[max(0, idx-300):idx+300]
        if 'button' in context and ('Métré' in context or 'Metre' in context):
            bs = s.rfind('<button', 0, idx)
            be = s.find('</button>', idx)
            if bs != -1 and be != -1:
                s = s[:bs] + '{/* PATCH 016A: bouton BOM & Métré topbar supprimé */}' + s[be+len('</button>'):]
                removed_bom = True
                break
        idx = s.find('BOM &', idx + 1)
    notes.append("Bouton BOM & Métré topbar supprimé" if removed_bom else "Bouton BOM & Métré topbar non trouvé ou déjà absent")

    # ------------------------------------------------------------
    # 7) Remplacer input épaisseur dans dock pour style global déjà géré.
    # ------------------------------------------------------------
    s = s.replace(
        'onChange={(e) => setPipeStrokeScale(Number(e.target.value))}',
        'onChange={(e) => setPipeStrokeScale(Number(e.target.value))}',
    )

    ENGINE.write_text(s, encoding="utf-8")
    return notes


def main():
    notes = patch_engine()
    REPORT.write_text(
        "# PATCH 016A — Command UI + raccourcis + style global\n\n"
        f"Date: {datetime.now().isoformat(timespec='seconds')}\n\n"
        "## Corrections appliquées\n"
        + "\n".join(f"- {n}" for n in notes)
        + "\n\n## Tests à faire avant 016B\n"
        "1. Ouvrir l'éditeur : le bouton BOM & Métré orange ne doit plus être dans la topbar.\n"
        "2. Ouvrir le tableau propriétés/BOM : la ligne de commande ne doit plus passer devant.\n"
        "3. Fermer le tableau : la ligne de commande revient.\n"
        "4. Cliquer Hide : la commande se réduit à un bouton `⌨ Commande`.\n"
        "5. Vérifier que la ligne Accès direct n'est plus affichée.\n"
        "6. Raccourcis OFF : taper directement `copie` sur le plan doit écrire dans la commande, pas activer des outils.\n"
        "7. Raccourcis ON : les raccourcis habituels peuvent fonctionner.\n"
        "8. Tester commandes `LW 2`, `EPAISSEUR 1.2`, `COLOR cyan`, `STYLE`.\n"
        "9. Vérifier que l'épaisseur/couleur s'applique aux tubes et que l'épaisseur 2D suit le style global.\n"
        "10. Lancer `npm run lint` puis `npm run build`.\n\n"
        "## Note\n"
        "Ce patch ne crée pas encore les commandes guidées MOVE/COPY/ROTATE avec prévisualisation souris. Cela sera PATCH 016B après validation visuelle de 016A.\n",
        encoding="utf-8",
    )
    print("PATCH 016A prêt/appliqué localement.")
    for n in notes:
        print("-", n)
    print("Rapport:", REPORT)


if __name__ == "__main__":
    main()
