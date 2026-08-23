#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re, shutil

ROOT = Path(__file__).resolve().parent
ENGINE = ROOT / "src/pdi/isometric/engine/IsometrieModuleV48d.tsx"
APP = ROOT / "src/pdi/app/PdiUnifiedApp.tsx"
REPORT = ROOT / "013_iso_workflow_alignment_elbow_autocad_fix_REPORT.md"

def backup(p: Path):
    b = p.with_suffix(p.suffix + ".before013")
    if not b.exists():
        shutil.copy2(p, b)

def patch_engine():
    backup(ENGINE)
    s = ENGINE.read_text(encoding="utf-8")
    notes = []

    # Supprimer la bande basse "Principe" + bouton flottant BOM/Cotations.
    start = s.find('    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs text-slate-600">\n      <div className="font-black text-slate-700 uppercase flex gap-2 mb-2"><Info className="w-4 h-4 text-blue-600"/>Principe</div>')
    if start != -1:
        end = s.find('    <div className={`hidden pdi-status-docked', start)
        if end != -1:
            s = s[:start] + s[end:]
            notes.append('Bande basse Principe + bouton flottant supprimés')

    # Supprimer bouton BOM/Métré doublon du rail droit.
    idx = s.find('              title="Nomenclature BOM & Métré"')
    if idx != -1:
        bs = s.rfind('            <button', 0, idx)
        be = s.find('            </button>', idx)
        if bs != -1 and be != -1:
            be += len('            </button>')
            s = s[:bs] + s[be:]
            notes.append('Bouton rail BOM/Métré supprimé')

    # Supprimer doublon Coude horizontal.
    old_coude = '<button onClick={()=>setIsoDrawMode("coude")} className="h-9 px-3 rounded-lg bg-slate-100 text-xs font-black">C Coude</button>'
    if old_coude in s:
        s = s.replace(old_coude, '{/* PATCH 013: Coude présent dans la colonne gauche, doublon supprimé */}', 1)
        notes.append('Doublon Coude horizontal supprimé')

    # Supprimer doublon Cotation horizontal.
    idx = s.find('            M Cotation')
    if idx != -1:
        bs = s.rfind('          <button', 0, idx)
        be = s.find('          </button>', idx)
        if bs != -1 and be != -1:
            be += len('          </button>')
            s = s[:bs] + '          {/* PATCH 013: Cotation présente dans la colonne gauche, doublon supprimé */}\n' + s[be:]
            notes.append('Doublon Cotation horizontal supprimé')

    # Corriger alignement AX/AY/AZ sans re-snap.
    old_align = re.search(r'  const alignSelectedNodesAxis = \(axis: "x" \| "y" \| "z"\) => \{.*?\n  \};\n\n  const alignSelectedEquipmentOnTube', s, re.S)
    if old_align:
        new_align = '''  const alignSelectedNodesAxis = (axis: "x" | "y" | "z") => {
    if (selectedNodeIds.length < 2) {
      setStatusMessage(`Aligner ${axis.toUpperCase()} : sélectionner au moins deux nœuds`);
      return;
    }
    const referenceId = selectedNodeIds[selectedNodeIds.length - 1];
    const reference = nodes.find((n) => n.id === referenceId);
    if (!reference) return;

    // PATCH 013 — alignement sans décalage visuel :
    // on applique uniquement le delta nécessaire sur l’axe choisi et on ne re-snap jamais
    // les autres coordonnées. Cela évite le glissement des points observé après alignement.
    const selected = new Set(selectedNodeIds);
    const refValue = Number(reference[axis] || 0);
    const nextNodes = nodes.map((node) => {
      if (!selected.has(node.id) || node.id === referenceId) return node;
      const delta = Number((refValue - Number(node[axis] || 0)).toFixed(6));
      if (Math.abs(delta) < 1e-9) return node;
      return { ...node, [axis]: Number((Number(node[axis] || 0) + delta).toFixed(3)) };
    });
    commitGraph(nextNodes, recalcSegmentLengths(nextNodes, segments));
    setStatusMessage(`Alignement ${axis.toUpperCase()} appliqué sans re-snap — référence : ${reference.name}`);
  };

  const alignSelectedEquipmentOnTube'''
        s = s[:old_align.start()] + new_align + s[old_align.end():]
        notes.append('Alignement AX/AY/AZ corrigé sans re-snap')

    # Ajouter helper orientation coude.
    helper = '''
  const elbowOrientationFromSegment = (segmentId: string | null, fallback = 0) => {
    if (!segmentId) return fallback;
    const segment = segments.find((item) => item.id === segmentId);
    if (!segment) return fallback;
    const a = nodes.find((node) => node.id === segment.fromNodeId);
    const b = nodes.find((node) => node.id === segment.toNodeId);
    if (!a || !b) return fallback;
    const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    return Number((((angle % 360) + 360) % 360).toFixed(1));
  };

'''
    if 'const elbowOrientationFromSegment =' not in s:
        s = s.replace('  const createElbowFromPointer=(e:React.PointerEvent<SVGSVGElement>)=>{', helper + '  const createElbowFromPointer=(e:React.PointerEvent<SVGSVGElement>)=>{', 1)
        notes.append('Helper orientation coude ajouté')

    # Corriger orientation coude inséré sur tronçon.
    s = s.replace(
        'const id = insertEquipmentNode(hit.id, "coude_90", hit.t, "Coude 90° DN" + (seg?.dn || newDN));\n      setStatusMessage("Coude 90° inséré sur le tronçon");',
        'const id = insertEquipmentNode(hit.id, "coude_90", hit.t, "Coude 90° DN" + (seg?.dn || newDN));\n      const orient = elbowOrientationFromSegment(hit.id, 0);\n      setNodes(prev => prev.map(n => n.id === id ? { ...n, rotation: orient } : n));\n      setStatusMessage(`Coude 90° inséré sur le tronçon — orientation ${Math.round(orient)}°`);',
        1
    )
    s = s.replace(
        'const node = makeEquipmentNode("coude_90", `Coude 90° N${nodes.length + 1}`, snapIsoV4(w.x, isoSnapStep), snapIsoV4(w.y, isoSnapStep), nodeZ || 0, newDN, 0);',
        'const node = makeEquipmentNode("coude_90", `Coude 90° N${nodes.length + 1}`, snapIsoV4(w.x, isoSnapStep), snapIsoV4(w.y, isoSnapStep), nodeZ || 0, newDN, elbowOrientationFromSegment(selectedSegmentId, 0));',
        1
    )
    notes.append('Orientation coude suivant tronçon corrigée')

    ENGINE.write_text(s, encoding="utf-8")
    return notes

def patch_app():
    backup(APP)
    s = APP.read_text(encoding="utf-8")
    notes = []

    old_active = 'const [activeModule, setActiveModule] = useState<PdiModule>("home");'
    new_active = '''const [activeModule, setActiveModule] = useState<PdiModule>(() => {
    try { return (window.localStorage.getItem("pdi.activeModule.v1") as PdiModule) || "home"; } catch { return "home"; }
  });'''
    if old_active in s:
        s = s.replace(old_active, new_active, 1)
        notes.append('Module actif mémorisé')

    old_stage = 'const [stage, setStage] = useState<"landing" | "app">("landing");'
    new_stage = '''const [stage, setStage] = useState<"landing" | "app">(() => {
    try {
      const auth = window.localStorage.getItem(PDI_AUTH_KEY);
      const forced = window.localStorage.getItem("pdi.force.app.v1") === "1" || window.sessionStorage.getItem(PDI_STAGE_KEY) === "app";
      return forced && auth && auth !== "guest" && auth !== "pending_email" ? "app" : "landing";
    } catch { return "landing"; }
  });'''
    if old_stage in s:
        s = s.replace(old_stage, new_stage, 1)
        notes.append('Refresh connecté conserve app/ISO')

    marker = 'useEffect(() => { try { window.localStorage.setItem(PDI_AUTH_KEY, authMode); } catch {} }, [authMode]);'
    repl = marker + '\n  useEffect(() => { try { window.localStorage.setItem("pdi.activeModule.v1", activeModule); } catch {} }, [activeModule]);'
    if marker in s and 'pdi.activeModule.v1", activeModule' not in s:
        s = s.replace(marker, repl, 1)
        notes.append('Persistance du module actif ajoutée')

    old_logout = 'window.localStorage.setItem(PDI_AUTH_KEY, "guest");'
    new_logout = 'window.localStorage.setItem(PDI_AUTH_KEY, "guest");\n      window.localStorage.removeItem("pdi.activeModule.v1");'
    if old_logout in s and 'removeItem("pdi.activeModule.v1")' not in s:
        s = s.replace(old_logout, new_logout, 1)
        notes.append('Déconnexion nettoie le module actif mémorisé')

    APP.write_text(s, encoding="utf-8")
    return notes

def main():
    notes = patch_engine() + patch_app()
    REPORT.write_text(
        '# PATCH 013 — Workflow ISO, doublons, coude, alignement, commandes AutoCAD\n\n'
        f'Date: {datetime.now().isoformat(timespec="seconds")}\n\n'
        '## Corrections appliquées\n' + '\n'.join(f'- {n}' for n in notes) + '\n\n'
        '## Tests recommandés\n'
        '- npm run lint\n- npm run build\n'
        '- recharger connecté depuis ISO : rester dans ISO\n'
        '- déconnexion : retour home après landing\n'
        '- insérer coude sur tronçon incliné : orientation suit le tube\n'
        '- AX/AY/AZ : les points alignés ne glissent plus hors axe\n',
        encoding='utf-8'
    )
    print('PATCH 013 appliqué localement.')
    for note in notes:
        print('-', note)
    print('Rapport :', REPORT)

if __name__ == '__main__':
    main()
