#!/usr/bin/env python3
"""
PATCH 016B — Commandes guidées (DEPLACER / COPIE / ROTATION) avec prévisualisation
                + corrections restantes de 016A / 016A2

Corrections UI restantes :
  1) Échap ferme vraiment la liste des commandes (la liste restait ouverte car une
     recherche vide renvoyait toutes les commandes).
  2) Hide : le plan de travail grandit réellement (hauteur du canvas dynamique,
     pas seulement un padding).
  3) La ligne "Accès direct" est supprimée du composant, plus seulement masquée en CSS.

Nouveau moteur 016B :
  4) DEPLACER / MOVE / M          : sélection -> point de base -> point cible -> aperçu -> clic
  5) COPIE / COPY / CO            : idem, mais duplique la sélection
  6) ROTATION / ROTATE / RO       : sélection -> point de base -> angle souris -> aperçu -> clic
  7) Aperçu fantôme en pointillé avant application
  8) Échap annule la commande guidée sans rien modifier

Usage :
  Copier ce fichier à la racine du projet PD&I puis :
    python3 016B_pdi_guided_commands_preview_ui_fixes.py
    npm run lint && npm run build

Aucune action GitHub : uniquement des fichiers locaux.
"""
from pathlib import Path
from datetime import datetime
import re
import shutil

ROOT = Path(__file__).resolve().parent
ENGINE = ROOT / "src/pdi/isometric/engine/IsometrieModuleV48d.tsx"
BAR = ROOT / "src/pdi/isometric/components/CadCommandLineBar.tsx"
REPORT = ROOT / "016B_guided_commands_preview_REPORT.md"

notes = []


def backup(p: Path, suffix: str):
    if not p.exists():
        raise FileNotFoundError(f"Fichier introuvable : {p}")
    b = p.with_suffix(p.suffix + suffix)
    if not b.exists():
        shutil.copy2(p, b)


def sub(s: str, old: str, new: str, label: str) -> str:
    if old in s:
        notes.append(label)
        return s.replace(old, new, 1)
    notes.append("NON TROUVE : " + label)
    return s


# ---------------------------------------------------------------------------
# 1. CadCommandLineBar : Echap + suppression Acces direct
# ---------------------------------------------------------------------------
def patch_bar():
    global notes
    backup(BAR, ".before016B")
    s = BAR.read_text(encoding="utf-8")

    # 1.a Une saisie vide ne doit plus proposer toute la liste.
    s = sub(
        s,
        "  const suggestions = searchCadCommands(input);",
        "  const suggestions = input.trim().length > 0 ? searchCadCommands(input) : [];",
        "Suggestions vides quand la saisie est vide",
    )

    # 1.b Echap global ferme la liste meme si le focus n'est pas dans l'input.
    if "PATCH 016B global escape" not in s:
        anchor = "  useEffect(() => {\n    setSelectedIndex(0);"
        addition = '''  // PATCH 016B global escape : Echap ferme toujours la liste de commandes.
  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setShowSuggestions(false);
      setSelectedIndex(0);
      setInput("");
      if (cadDraftSession) onCancelDraft();
    };
    window.addEventListener("keydown", onEscape, true);
    return () => window.removeEventListener("keydown", onEscape, true);
  }, [cadDraftSession]);

'''
        s = sub(s, anchor, addition + anchor, "Ecoute Echap globale ajoutee dans la barre de commande")

    # 1.c Suppression definitive de la ligne "Acces direct".
    start = s.find("        {/* Quick AutoCAD Command Pills */}")
    if start != -1:
        end = s.find("      </div>\n    </div>\n  );", start)
        if end != -1:
            s = s[:start] + s[end:]
            notes.append("Ligne Acces direct supprimee du composant")
        else:
            notes.append("NON TROUVE : fin du bloc Acces direct")
    else:
        notes.append("Ligne Acces direct deja absente")

    # Nettoyage des imports devenus inutiles est volontairement evite (aucun risque de build).
    BAR.write_text(s, encoding="utf-8")


# ---------------------------------------------------------------------------
# 2. Moteur : hauteur dynamique + commandes guidees
# ---------------------------------------------------------------------------
def patch_engine():
    backup(ENGINE, ".before016B")
    s = ENGINE.read_text(encoding="utf-8")

    # 2.a Hide agrandit reellement le plan : hauteur du canvas dynamique.
    s = sub(
        s,
        '"h-[clamp(520px,70vh,820px)]"',
        '(commandPromptHidden ? "h-[clamp(560px,86vh,1200px)]" : "h-[clamp(520px,70vh,820px)]")',
        "Hauteur du canvas dynamique selon Hide",
    )

    # 2.b Etat de la commande guidee.
    if "guidedCmd" not in s:
        anchor = "  const [cadDraftSession, setCadDraftSession] = useState<CadDraftSession | null>(null);"
        addition = '''
  // PATCH 016B : session de commande guidee (deplacer / copier / rotation) avec apercu.
  const [guidedCmd, setGuidedCmd] = useState<null | {
    type: "move" | "copy" | "rotate";
    step: "base" | "target";
    base?: { x: number; y: number; z: number };
    preview?: { x: number; y: number; z: number };
  }>(null);
'''
        s = sub(s, anchor, anchor + addition, "Etat guidedCmd ajoute")

    # 2.c Helpers de commande guidee, inseres avant moveSelection.
    if "applyGuidedCommand" not in s:
        anchor = "  const moveSelection=(dx:number,dy:number,dz:number)=>{"
        helpers = '''  // ----- PATCH 016B : commandes guidees avec apercu -----
  const guidedSelectionNodeIds = () => {
    const ids = new Set<string>(selectedNodeIds);
    if (selectedSegmentIds.length) {
      segments.filter(sg => selectedSegmentIds.includes(sg.id)).forEach(sg => { ids.add(sg.fromNodeId); ids.add(sg.toNodeId); });
    }
    return Array.from(ids);
  };

  const startGuidedCommand = (type: "move" | "copy" | "rotate") => {
    const ids = guidedSelectionNodeIds();
    if (!ids.length) {
      setAutocadPrompt("Selectionnez d'abord un ou plusieurs elements, puis relancez la commande.");
      setStatusMessage("Aucune selection pour la commande guidee");
      return;
    }
    setGuidedCmd({ type, step: "base" });
    const label = type === "move" ? "DEPLACER" : type === "copy" ? "COPIE" : "ROTATION";
    setAutocadPrompt(`[${label}] Specifiez le point de base (clic sur le plan). Echap pour annuler.`);
    setStatusMessage(`${label} : point de base attendu`);
  };

  const cancelGuidedCommand = () => {
    if (!guidedCmd) return;
    setGuidedCmd(null);
    setAutocadPrompt("Commande guidee annulee. Aucune modification appliquee.");
  };

  const guidedDelta = (base: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }) => ({
    dx: snapIsoV4(target.x - base.x, isoSnapStep),
    dy: snapIsoV4(target.y - base.y, isoSnapStep),
  });

  const guidedAngle = (base: { x: number; y: number }, target: { x: number; y: number }) =>
    Math.atan2(target.y - base.y, target.x - base.x);

  const applyGuidedCommand = (target: { x: number; y: number; z: number }) => {
    if (!guidedCmd || !guidedCmd.base) return;
    const ids = guidedSelectionNodeIds();
    if (!ids.length) { setGuidedCmd(null); return; }
    const base = guidedCmd.base;

    if (guidedCmd.type === "move") {
      const { dx, dy } = guidedDelta(base, target);
      const nextNodes = nodes.map(n => ids.includes(n.id)
        ? { ...n, x: snapIsoV4(n.x + dx, isoSnapStep), y: snapIsoV4(n.y + dy, isoSnapStep) }
        : n);
      commitGraph(nextNodes, recalcSegmentLengths(nextNodes, segments));
      setAutocadPrompt(`[DEPLACER] Applique : dX ${dx.toFixed(2)} m, dY ${dy.toFixed(2)} m.`);
    } else if (guidedCmd.type === "copy") {
      const { dx, dy } = guidedDelta(base, target);
      const stamp = Date.now().toString(36);
      const idMap = new Map<string, string>();
      const clonedNodes = nodes.filter(n => ids.includes(n.id)).map((n, i) => {
        const newId = `${n.id}-c${stamp}${i}`;
        idMap.set(n.id, newId);
        return {
          ...n,
          id: newId,
          name: `${n.name}-C`,
          x: snapIsoV4(n.x + dx, isoSnapStep),
          y: snapIsoV4(n.y + dy, isoSnapStep),
        };
      });
      const clonedSegments = segments
        .filter(sg => idMap.has(sg.fromNodeId) && idMap.has(sg.toNodeId))
        .map((sg, i) => ({
          ...sg,
          id: `${sg.id}-c${stamp}${i}`,
          fromNodeId: idMap.get(sg.fromNodeId)!,
          toNodeId: idMap.get(sg.toNodeId)!,
          fittings: Array.isArray(sg.fittings) ? sg.fittings.map(f => ({ ...f })) : [],
        }));
      const nextNodes = [...nodes, ...clonedNodes];
      commitGraph(nextNodes, recalcSegmentLengths(nextNodes, [...segments, ...clonedSegments]));
      setSelectedNodeIds(clonedNodes.map(n => n.id));
      setAutocadPrompt(`[COPIE] ${clonedNodes.length} noeud(s) et ${clonedSegments.length} troncon(s) copies.`);
    } else {
      const angle = guidedAngle(base, target);
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const nextNodes = nodes.map(n => {
        if (!ids.includes(n.id)) return n;
        const rx = n.x - base.x, ry = n.y - base.y;
        return {
          ...n,
          x: snapIsoV4(base.x + rx * cos - ry * sin, isoSnapStep),
          y: snapIsoV4(base.y + rx * sin + ry * cos, isoSnapStep),
        };
      });
      commitGraph(nextNodes, recalcSegmentLengths(nextNodes, segments));
      setAutocadPrompt(`[ROTATION] Applique : ${(angle * 180 / Math.PI).toFixed(1)} deg autour du point de base.`);
    }
    setGuidedCmd(null);
  };

  // Le clic sur le plan alimente la commande guidee avant tout autre comportement.
  const handleGuidedPointerDown = (world: { x: number; y: number; z: number }) => {
    if (!guidedCmd) return false;
    if (guidedCmd.step === "base") {
      setGuidedCmd({ ...guidedCmd, step: "target", base: world, preview: world });
      const label = guidedCmd.type === "move" ? "DEPLACER" : guidedCmd.type === "copy" ? "COPIE" : "ROTATION";
      setAutocadPrompt(guidedCmd.type === "rotate"
        ? `[${label}] Bougez la souris pour l'angle puis cliquez pour appliquer. Echap pour annuler.`
        : `[${label}] Specifiez le point de destination puis cliquez pour appliquer. Echap pour annuler.`);
      return true;
    }
    applyGuidedCommand(world);
    return true;
  };

  const guidedPreviewNodes = (() => {
    if (!guidedCmd || guidedCmd.step !== "target" || !guidedCmd.base || !guidedCmd.preview) return [];
    const ids = guidedSelectionNodeIds();
    const base = guidedCmd.base, target = guidedCmd.preview;
    if (guidedCmd.type === "rotate") {
      const angle = guidedAngle(base, target);
      const cos = Math.cos(angle), sin = Math.sin(angle);
      return nodes.filter(n => ids.includes(n.id)).map(n => {
        const rx = n.x - base.x, ry = n.y - base.y;
        return { ...n, x: base.x + rx * cos - ry * sin, y: base.y + rx * sin + ry * cos };
      });
    }
    const { dx, dy } = guidedDelta(base, target);
    return nodes.filter(n => ids.includes(n.id)).map(n => ({ ...n, x: n.x + dx, y: n.y + dy }));
  })();

'''
        s = sub(s, anchor, helpers + anchor, "Moteur de commandes guidees ajoute")

    # 2.d Interception dans pointerDown.
    anchor_down = """    const target=e.target as Element;
    const additive=e.ctrlKey||e.metaKey||e.shiftKey;
    const { sx, sy } = getSvgCoordinates(e.clientX, e.clientY, svgRef.current || (e.currentTarget as unknown as SVGSVGElement));"""
    if "// PATCH 016B guided pointer down" not in s:
        addition = anchor_down + '''

    // PATCH 016B guided pointer down : la commande guidee capture le clic.
    if (guidedCmd) {
      const guidedWorld = isoUnprojectV4(sx, sy, viewport.zoom, viewport.panX, viewport.panY, nodeZ || 0);
      if (handleGuidedPointerDown({ x: guidedWorld.x, y: guidedWorld.y, z: guidedWorld.z ?? (nodeZ || 0) })) {
        e.preventDefault();
        return;
      }
    }'''
        s = sub(s, anchor_down, addition, "Interception du clic pour commande guidee")

    # 2.e Suivi souris pour l'apercu.
    anchor_move = """    if (updateCad2dPointer(e)) return;"""
    if "// PATCH 016B guided pointer move" not in s:
        addition = '''    // PATCH 016B guided pointer move : mise a jour de l'apercu avant application.
    if (guidedCmd && guidedCmd.step === "target") {
      const { sx: gsx, sy: gsy } = getSvgCoordinates(e.clientX, e.clientY, svgRef.current || (e.currentTarget as unknown as SVGSVGElement));
      const gw = isoUnprojectV4(gsx, gsy, viewport.zoom, viewport.panX, viewport.panY, nodeZ || 0);
      setGuidedCmd(prev => (prev ? { ...prev, preview: { x: gw.x, y: gw.y, z: gw.z ?? (nodeZ || 0) } } : prev));
    }

''' + anchor_move
        s = sub(s, anchor_move, addition, "Apercu souris de la commande guidee")

    # 2.f Echap annule la commande guidee.
    if "cancelGuidedCommand();" not in s:
        anchor_esc = '      // ESC: Global Escape closes all panels, modals, context menus, and resets active operations\n      if (e.key === "Escape") {'
        addition = '      // PATCH 016B : Echap annule d\'abord la commande guidee.\n      if (e.key === "Escape" && guidedCmd) {\n        e.preventDefault();\n        cancelGuidedCommand();\n        return;\n      }\n' + anchor_esc
        s = sub(s, anchor_esc, addition, "Echap annule la commande guidee")

    # 2.g Interception des commandes dans executeCadCommand.
    if "startGuidedCommand(\"move\")" not in s:
        anchor_cmd = '''    if (["style"].includes(rawVerb)) {'''
        addition = '''    if (["deplacer", "deplace", "move", "m", "translation"].includes(rawVerb)) {
      startGuidedCommand("move");
      return;
    }
    if (["copie", "copier", "copy", "co", "cp"].includes(rawVerb)) {
      startGuidedCommand("copy");
      return;
    }
    if (["rotation", "rotate", "ro", "tourner"].includes(rawVerb)) {
      startGuidedCommand("rotate");
      return;
    }
''' + anchor_cmd
        s = sub(s, anchor_cmd, addition, "Commandes DEPLACER / COPIE / ROTATION branchees")

    # 2.h Rendu de l'apercu fantome.
    anchor_preview = '              {showGrid && <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#pdiGridMajor)" opacity="0.88" pointerEvents="none" />}'
    if "pdi-guided-preview-016b" not in s:
        addition = anchor_preview + '''

              {/* PATCH 016B : apercu fantome de la commande guidee */}
              {guidedPreviewNodes.length > 0 && (
                <g className="pdi-guided-preview-016b" pointerEvents="none">
                  {segments.filter(sg => guidedPreviewNodes.some(n => n.id === sg.fromNodeId) && guidedPreviewNodes.some(n => n.id === sg.toNodeId)).map(sg => {
                    const a = guidedPreviewNodes.find(n => n.id === sg.fromNodeId)!;
                    const b = guidedPreviewNodes.find(n => n.id === sg.toNodeId)!;
                    const pa = isoProjectV4(a.x, a.y, a.z || 0, viewport.zoom, viewport.panX, viewport.panY);
                    const pb = isoProjectV4(b.x, b.y, b.z || 0, viewport.zoom, viewport.panX, viewport.panY);
                    return <line key={`gp-${sg.id}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3" opacity="0.9" />;
                  })}
                  {guidedPreviewNodes.map(n => {
                    const p = isoProjectV4(n.x, n.y, n.z || 0, viewport.zoom, viewport.panX, viewport.panY);
                    return <circle key={`gpn-${n.id}`} cx={p.x} cy={p.y} r="5" fill="none" stroke="#f59e0b" strokeWidth="1.6" strokeDasharray="3 2" />;
                  })}
                  {guidedCmd?.base && (() => {
                    const pb = isoProjectV4(guidedCmd.base!.x, guidedCmd.base!.y, guidedCmd.base!.z || 0, viewport.zoom, viewport.panX, viewport.panY);
                    return <g><circle cx={pb.x} cy={pb.y} r="4" fill="#22d3ee" /><text x={pb.x + 8} y={pb.y - 6} fill="#22d3ee" fontSize="8" fontWeight="bold">BASE</text></g>;
                  })()}
                </g>
              )}'''
        s = sub(s, anchor_preview, addition, "Apercu fantome rendu dans le canvas")

    ENGINE.write_text(s, encoding="utf-8")


def main():
    patch_bar()
    patch_engine()
    REPORT.write_text(
        "# PATCH 016B — Commandes guidees + corrections UI\n\n"
        f"Date : {datetime.now().isoformat(timespec='seconds')}\n\n"
        "## Modifications\n" + "\n".join(f"- {n}" for n in notes) +
        "\n\n## Tests\n"
        "1. Taper une lettre : la liste s'ouvre. Appuyer Echap : la liste se ferme et la saisie se vide.\n"
        "2. Cliquer Hide : le canvas doit gagner en hauteur (84vh au lieu de 70vh).\n"
        "3. Verifier que la ligne 'Acces direct' n'existe plus du tout.\n"
        "4. Selectionner un ou deux noeuds, taper DEPLACER, cliquer un point de base,\n"
        "   bouger la souris (apercu orange en pointille), cliquer pour appliquer.\n"
        "5. Meme test avec COPIE : la selection est dupliquee, l'original reste.\n"
        "6. Meme test avec ROTATION : l'apercu tourne autour du point de base.\n"
        "7. Pendant une commande, appuyer Echap : rien ne doit etre modifie.\n"
        "8. npm run lint puis npm run build.\n",
        encoding="utf-8",
    )
    print("PATCH 016B applique localement.")
    for n in notes:
        print("-", n)
    print("Rapport :", REPORT)


if __name__ == "__main__":
    main()
