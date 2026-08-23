#!/usr/bin/env python3
"""
PATCH 016A2 — Hotfix après test 016A

Corrige :
1) Hide commande : le plan de travail regagne automatiquement la hauteur.
2) Bords de l'ardoise/canvas trop épais : affinage visuel.
3) Propriétés élément : clic/propriétés ouvre l'inspecteur ciblé, pas le grand tableau global.
4) Saisie native sur plan : les lettres tapées vont vers la commande quand raccourcis OFF.
5) Le raccourci P/Impression ne se déclenche plus quand raccourcis OFF.
6) Le bouton/tableau global reste accessible seulement par commande BOM/TABLE ou menu volontaire.

Usage :
  Copier à la racine du projet, puis :
  python3 016A2_pdi_hotfix_hide_canvas_properties_keyboard.py
"""
from pathlib import Path
from datetime import datetime
import re, shutil

ROOT = Path(__file__).resolve().parent
ENGINE = ROOT / "src/pdi/isometric/engine/IsometrieModuleV48d.tsx"
REPORT = ROOT / "016A2_hotfix_hide_canvas_properties_keyboard_REPORT.md"

def backup(p: Path):
    if not p.exists():
        raise FileNotFoundError(f"Fichier introuvable: {p}")
    b = p.with_suffix(p.suffix + ".before016A2")
    if not b.exists():
        shutil.copy2(p, b)

def patch():
    backup(ENGINE)
    s = ENGINE.read_text(encoding="utf-8")
    notes=[]

    # 1) Hide doit libérer la hauteur du plan : remplacer padding-bottom fixe par variable selon prompt.
    s = s.replace(
        '[data-pdi-studio] .pdi-v48d-primary-workspace{padding-bottom:74px!important}',
        '[data-pdi-studio] .pdi-v48d-primary-workspace{padding-bottom:var(--pdi-command-reserved-bottom,0px)!important}',
    )
    # Injecter variable CSS dans root data-pdi-studio si possible.
    if '"--pdi-command-reserved-bottom"' not in s:
        # Ajoute style inline au conteneur principal data-pdi-studio le plus courant.
        s = re.sub(
            r'(<div\s+data-pdi-studio[^>]*className=\{`[^`]*`\})',
            r'\1 style={{ "--pdi-command-reserved-bottom": (!propertiesModalOpen && !commandPromptHidden) ? "74px" : "0px" } as React.CSSProperties}',
            s,
            count=1,
        )
    notes.append("Hide libère la hauteur du plan via variable CSS")

    # 2) Bords de l'ardoise plus fins : ajouter CSS override ciblé.
    css_anchor='[data-pdi-studio] .pdi-command-dock-015{font-family:Inter,ui-sans-serif,system-ui,sans-serif}'
    css_add='''[data-pdi-studio] .pdi-command-dock-015{font-family:Inter,ui-sans-serif,system-ui,sans-serif}
        [data-pdi-studio] .pdi-v48d-primary-workspace svg,
        [data-pdi-studio] .pdi-v48d-primary-workspace .rounded-\[28px\],
        [data-pdi-studio] .pdi-v48d-primary-workspace [class*="rounded"]{border-width:1px!important}
        [data-pdi-studio] .pdi-v48d-primary-workspace{border-width:1px!important}'''
    if css_anchor in s and 'border-width:1px!important' not in s[s.find(css_anchor):s.find(css_anchor)+800]:
        s=s.replace(css_anchor,css_add,1)
        notes.append("Bords ardoise/canvas affinés")

    # 3) Propriétés élément ciblées : remplacer les actions qui ouvrent le grand tableau depuis contexte élément.
    # Conserver F2/table global pour BOM, mais contexte node/segment ne doit pas ouvrir all.
    replacements = [
        ('setPropertiesModalOpen(true); setPropertiesActiveTab("all"); setContextMenu(null);', 'setRightPanelOpen(true); setRightPanelTab("properties"); setContextMenu(null);'),
        ('setPropertiesModalOpen(true); setPropertiesActiveTab("segments"); setContextMenu(null);', 'setRightPanelOpen(true); setRightPanelTab("properties"); setContextMenu(null);'),
        ('setPropertiesModalOpen(true); setPropertiesActiveTab("nodes"); setContextMenu(null);', 'setRightPanelOpen(true); setRightPanelTab("properties"); setContextMenu(null);'),
    ]
    count=0
    for old,new in replacements:
        c=s.count(old)
        if c:
            s=s.replace(old,new)
            count+=c
    notes.append(f"Actions propriétés élément redirigées vers inspecteur ciblé: {count}")

    # 4) Boutons menu command palette Table/Propriétés globaux : garder BOM via commande, éviter ouverture accidentelle du tableau global.
    s=s.replace('{ label: "📋 Tableau Propriétés & BOM", hint: "F2", run: () => { setPropertiesModalOpen(true); setPropertiesActiveTab("all"); } },','{ label: "📋 BOM / Tableau global", hint: "BOM", run: () => { setRightPanelOpen(true); setRightPanelTab("bom"); } },')
    s=s.replace('{ label: "📋 Tableau Propriétés & BOM", hint: "Table", run: () => { setPropertiesModalOpen(true); setPropertiesActiveTab("all"); } },','{ label: "📋 BOM / Tableau global", hint: "BOM", run: () => { setRightPanelOpen(true); setRightPanelTab("bom"); } },')
    notes.append("Ouvertures globales remplacées par panneau BOM sauf export volontaire")

    # 5) Saisie native sur plan : le handler actuel est trop tardif / mauvais nom. Ajouter capture globale robuste.
    if 'PATCH 016A2 native command typing capture' not in s:
        insert_after='''  useEffect(() => {
    try { window.localStorage.setItem("pdi.workspaceVisualStyle.v1", JSON.stringify(workspaceVisualStyle)); } catch {}
  }, [workspaceVisualStyle]);'''
        addition='''

  // PATCH 016A2 native command typing capture : quand raccourcis OFF,
  // taper sur le plan écrit dans la ligne de commande au lieu de déclencher P/impression, C/coude, etc.
  useEffect(() => {
    const onNativeType = (e: KeyboardEvent) => {
      if (keyboardShortcutsEnabled) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (target as any)?.isContentEditable) return;
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (autocadCmdInput.trim()) executeCadCommand(autocadCmdInput.trim());
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setAutocadCmdInput("");
        setAutocadPrompt("Commande annulée.");
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        e.stopPropagation();
        setAutocadCmdInput((prev) => prev.slice(0, -1));
        return;
      }
      if (e.key.length === 1) {
        e.preventDefault();
        e.stopPropagation();
        setAutocadCmdInput((prev) => prev + e.key);
        setCommandPromptHidden(false);
        setTimeout(() => (document.getElementById("cad-command-input") as HTMLInputElement | null)?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onNativeType, true);
    return () => window.removeEventListener("keydown", onNativeType, true);
  }, [keyboardShortcutsEnabled, autocadCmdInput]);'''
        if insert_after in s:
            s=s.replace(insert_after,insert_after+addition,1)
            notes.append("Capture native clavier ajoutée avant raccourcis")
        else:
            notes.append("Ancre persistance style non trouvée pour capture clavier")

    # 6) Sécurité supplémentaire : dans ancien handler, désactiver raccourcis si OFF avant p/impression.
    old='''      if(key==="p"){printPlanSheet();return;}'''
    new='''      if(!keyboardShortcutsEnabled && key.length===1){return;}
      if(key==="p"){printPlanSheet();return;}'''
    if old in s:
        s=s.replace(old,new,1)
        notes.append("Ancien raccourci P protégé quand raccourcis OFF")

    # 7) Le bouton compact Commande doit aussi libérer et être petit; OK mais position moins intrusive.
    s=s.replace(
        'className="fixed left-[92px] bottom-3 z-[10030] rounded-xl border border-cyan-500/40 bg-slate-950 px-3 py-2 text-xs font-black text-cyan-200 shadow-xl"',
        'className="fixed left-[92px] bottom-2 z-[10030] rounded-lg border border-cyan-500/35 bg-slate-950/90 px-3 py-1.5 text-[11px] font-black text-cyan-200 shadow-xl"',
    )

    ENGINE.write_text(s,encoding='utf-8')
    return notes


def main():
    notes=patch()
    REPORT.write_text('# PATCH 016A2 — Hotfix hide/canvas/propriétés/clavier\n\nDate: '+datetime.now().isoformat(timespec='seconds')+'\n\n## Corrections\n'+'\n'.join('- '+n for n in notes)+'\n\n## Tests\n1. Hide commande : le plan doit reprendre toute la hauteur.\n2. Les bords du canvas doivent être plus fins.\n3. Clic propriétés sur nœud/tube/té : inspecteur ciblé, pas grand tableau.\n4. Raccourcis OFF : taper `copy` sur le plan ne doit plus lancer impression.\n5. Entrée exécute la commande saisie.\n6. BOM/tableau global uniquement via BOM/Table volontaire.\n',encoding='utf-8')
    print('PATCH 016A2 prêt/appliqué localement.')
    for n in notes: print('-',n)
    print('Rapport:',REPORT)

if __name__=='__main__':
    main()
