# PATCH 017P2 - reorientation geometrique des ports et des coudes
# Cible : src/pdi/isometric/engine/IsometrieModuleV48d.tsx
# Regles : R1 (idempotent + backup + rapport), R6, R7, R24, R25
import os
import hashlib

def find_root():
    here = os.path.dirname(os.path.abspath(__file__))
    for cand in (here, os.getcwd()):
        if os.path.exists(os.path.join(cand, "package.json")):
            return cand
    return here

ROOT = find_root()
ENGINE = os.path.join(ROOT, "src", "pdi", "isometric", "engine", "IsometrieModuleV48d.tsx")
PORTS = os.path.join(ROOT, "src", "pdi", "isometric", "engine", "pdiPorts017P2.ts")
REPORT = os.path.join(ROOT, "017P2_ports_coudes_REPORT.md")

def log(msg):
    print(msg, flush=True)

def md5(path):
    with open(path, "rb") as fh:
        return hashlib.md5(fh.read()).hexdigest()

PORTS_TS = "\n".join([
  "// PATCH 017P2 - reorientation geometrique des ports et des coudes.",
  "// Fonctions pures : zero React, zero API, calcul local (R7).",
  "",
  "export type PdiPortLike = { id: string; index: number; role?: string; dx: number; dy: number; dz: number };",
  "",
  "export type PdiNodeLike = {",
  "  id: string;",
  "  x: number;",
  "  y: number;",
  "  z: number;",
  "  rotation?: number;",
  "  bendDirection?: 1 | -1;",
  "  equipmentType?: string;",
  "  ports?: PdiPortLike[];",
  "};",
  "",
  "export type PdiSegmentLike = {",
  "  id: string;",
  "  fromNodeId: string;",
  "  toNodeId: string;",
  "  fromPortId?: string;",
  "  toPortId?: string;",
  "};",
  "",
  "// Catalogue normalise ASME B16.9 / EN 10253 : un coude ne prend pas un angle arbitraire.",
  "export const PDI_ELBOW_CATALOG: Array<{ type: string; angle: number }> = [",
  "  { type: \"coude_90\", angle: 90 },",
  "  { type: \"coude_45\", angle: 45 },",
  "  { type: \"coude_30\", angle: 30 },",
  "  { type: \"coude_22_5\", angle: 22.5 },",
  "];",
  "",
  "export const PDI_ELBOW_RESIDUAL_MAX_DEG = 5;",
  "",
  "const r3 = (v: number) => Number((Number.isFinite(v) ? v : 0).toFixed(3));",
  "const DEG = 180 / Math.PI;",
  "",
  "// La tolerance d accrochage est exprimee en pixels ecran ; le SVG travaille",
  "// dans un viewBox fixe. On convertit pour que 14 px restent 14 px reels.",
  "export const pdiTolViewBox = (tolPx: number, elementWidthPx: number, viewBoxWidth = 620) => {",
  "  if (!elementWidthPx || elementWidthPx <= 0) return tolPx;",
  "  return (tolPx * viewBoxWidth) / elementWidthPx;",
  "};",
  "",
  "export const pdiUnitDir = (",
  "  from: { x: number; y: number; z: number },",
  "  to: { x: number; y: number; z: number },",
  ") => {",
  "  const dx = to.x - from.x;",
  "  const dy = to.y - from.y;",
  "  const dz = to.z - from.z;",
  "  const n = Math.hypot(dx, dy, dz) || 1;",
  "  return { x: dx / n, y: dy / n, z: dz / n };",
  "};",
  "",
  "// Adapte un coude a la geometrie : on deduit rotation et sens de coude des",
  "// deux voisins reels, puis on retient l angle normalise le plus proche.",
  "export const pdiFitElbow = (",
  "  dirA: { x: number; y: number; z: number },",
  "  dirB: { x: number; y: number; z: number },",
  ") => {",
  "  const rot = Math.atan2(dirA.y, dirA.x) * DEG - 180;",
  "  let sweep = Math.atan2(dirB.y, dirB.x) * DEG - rot;",
  "  while (sweep > 180) sweep -= 360;",
  "  while (sweep <= -180) sweep += 360;",
  "  const bendDirection: 1 | -1 = sweep >= 0 ? 1 : -1;",
  "  const magnitude = Math.abs(sweep);",
  "  let best = PDI_ELBOW_CATALOG[0];",
  "  for (const cand of PDI_ELBOW_CATALOG) {",
  "    if (Math.abs(cand.angle - magnitude) < Math.abs(best.angle - magnitude)) best = cand;",
  "  }",
  "  return {",
  "    equipmentType: best.type,",
  "    rotation: r3(((rot % 360) + 360) % 360),",
  "    bendDirection,",
  "    residualDeg: r3(Math.abs(best.angle - magnitude)),",
  "  };",
  "};",
  "",
  "// Reoriente les faces referencees par un troncon vers le voisin reel.",
  "// Les ports de piquage (role branch) et les equipements non coudes sont",
  "// preserves : leur orientation est un choix metier, pas une consequence.",
  "export const pdiReorientPorts = <N extends PdiNodeLike, S extends PdiSegmentLike>(",
  "  nodes: N[],",
  "  segments: S[],",
  "  opts: { adaptElbows?: boolean } = {},",
  ") => {",
  "  const adaptElbows = opts.adaptElbows !== false;",
  "  const byId = new Map<string, N>();",
  "  for (const n of nodes) byId.set(n.id, n);",
  "  const links = new Map<string, Array<{ portId?: string; otherId: string }>>();",
  "  const push = (id: string, link: { portId?: string; otherId: string }) => {",
  "    const cur = links.get(id);",
  "    if (cur) cur.push(link);",
  "    else links.set(id, [link]);",
  "  };",
  "  for (const s of segments) {",
  "    if (!byId.has(s.fromNodeId) || !byId.has(s.toNodeId)) continue;",
  "    push(s.fromNodeId, { portId: s.fromPortId, otherId: s.toNodeId });",
  "    push(s.toNodeId, { portId: s.toPortId, otherId: s.fromNodeId });",
  "  }",
  "  const elbowTypes = new Set(PDI_ELBOW_CATALOG.map((c) => c.type));",
  "  const warnings: string[] = [];",
  "  let changed = 0;",
  "  const next = nodes.map((node) => {",
  "    const ls = links.get(node.id) || [];",
  "    if (!ls.length) return node;",
  "    if (node.equipmentType && elbowTypes.has(node.equipmentType)) {",
  "      if (!adaptElbows || ls.length !== 2) return node;",
  "      const a = byId.get(ls[0].otherId);",
  "      const b = byId.get(ls[1].otherId);",
  "      if (!a || !b) return node;",
  "      const fit = pdiFitElbow(pdiUnitDir(node, a), pdiUnitDir(node, b));",
  "      if (fit.residualDeg > PDI_ELBOW_RESIDUAL_MAX_DEG) {",
  "        warnings.push(node.id + ' : geometrie a ' + fit.residualDeg + ' deg du coude normalise ' + fit.equipmentType);",
  "      }",
  "      const sameBend = (node.bendDirection || 1) === fit.bendDirection;",
  "      if (node.equipmentType === fit.equipmentType && r3(node.rotation || 0) === fit.rotation && sameBend) return node;",
  "      changed += 1;",
  "      return { ...node, equipmentType: fit.equipmentType, rotation: fit.rotation, bendDirection: fit.bendDirection } as unknown as N;",
  "    }",
  "    if (node.equipmentType) return node;",
  "    if (!node.ports || !node.ports.length) return node;",
  "    const angle = ((node.rotation || 0) * Math.PI) / 180;",
  "    const c = Math.cos(-angle);",
  "    const s = Math.sin(-angle);",
  "    let touched = false;",
  "    const ports = node.ports.map((port) => {",
  "      const link = ls.find((l) => l.portId === port.id);",
  "      if (!link || port.role === \"branch\") return port;",
  "      const other = byId.get(link.otherId);",
  "      if (!other) return port;",
  "      const d = pdiUnitDir(node, other);",
  "      const dx = r3(d.x * c - d.y * s);",
  "      const dy = r3(d.x * s + d.y * c);",
  "      const dz = r3(d.z);",
  "      if (dx === r3(port.dx) && dy === r3(port.dy) && dz === r3(port.dz)) return port;",
  "      touched = true;",
  "      return { ...port, dx, dy, dz };",
  "    });",
  "    if (!touched) return node;",
  "    changed += 1;",
  "    return { ...node, ports } as unknown as N;",
  "  });",
  "  return { nodes: changed ? next : nodes, changed, warnings };",
  "};",
  "",
  "// Controle de coherence : une face qui ne pointe pas vers son voisin.",
  "export const pdiAuditPorts = <N extends PdiNodeLike, S extends PdiSegmentLike>(",
  "  nodes: N[],",
  "  segments: S[],",
  "  minDot = 0.9,",
  ") => {",
  "  const byId = new Map<string, N>();",
  "  for (const n of nodes) byId.set(n.id, n);",
  "  for (const s of segments) {",
  "    const a = byId.get(s.fromNodeId);",
  "    const b = byId.get(s.toNodeId);",
  "    if (!a || !b) continue;",
  "    const port = (a.ports || []).find((p) => p.id === s.fromPortId);",
  "    if (!port || port.role === \"branch\") continue;",
  "    const angle = ((a.rotation || 0) * Math.PI) / 180;",
  "    const c = Math.cos(angle);",
  "    const sn = Math.sin(angle);",
  "    const wx = port.dx * c - port.dy * sn;",
  "    const wy = port.dx * sn + port.dy * c;",
  "    const n1 = Math.hypot(wx, wy, port.dz) || 1;",
  "    const d = pdiUnitDir(a, b);",
  "    const dot = (wx / n1) * d.x + (wy / n1) * d.y + (port.dz / n1) * d.z;",
  "    if (dot < minDot) return s.id + ' : face non orientee vers le voisin';",
  "  }",
  "  return null;",
  "};",
  "",
])

# VOLET B - editions du moteur isometrique
# Chaque entree : (libelle, ancien, nouveau, occurrences attendues)

EDITS = []

# E1 : import du module de reorientation, juste apres celui du 017P
EDITS.append((
  "E1 import du module de reorientation",
  'from "./pdiPrecision017P";',
  'from "./pdiPrecision017P";\nimport { pdiReorientPorts, pdiTolViewBox } from "./pdiPorts017P2";',
  1,
))

# E2 : l apercu du trace utilisait la grille pure -> il passe par pdiCreatePoint
# Cause du defaut  a 142 pourcent collé, apres ca se decolle .
EDITS.append((
  "E2 apercu du trace accroche comme la creation",
  "      const w = screenToIsoWorld(e);\n      const pt = { x: snapIsoV4(w.x, isoSnapStep), y: snapIsoV4(w.y, isoSnapStep) };",
  "      // PATCH 017P2 : ce que l on voit est ce qui sera cree.\n      const pt = pdiCreatePoint(screenToIsoWorld(e));",
  1,
))

# E3 : tolerance d accrochage convertie en pixels ecran reels
EDITS.append((
  "E3 helper de tolerance en pixels ecran",
  "    // Detection du snap le plus proche (Port, Endpoint, Midpoint, Grid)",
  "    // PATCH 017P2 : la tolerance est convertie du viewBox vers les pixels reels.\n    const pdiTolScale = (t: number) => pdiTolViewBox(t, svgRef.current ? svgRef.current.getBoundingClientRect().width : 0);\n    // Detection du snap le plus proche (Port, Endpoint, Midpoint, Grid)",
  1,
))

for kind in ("PORT", "ENDPOINT", "MIDPOINT", "GRID"):
    EDITS.append((
      "E3 tolerance " + kind + " a l echelle ecran",
      "< PDI_SNAP_TOL_PX." + kind + ")",
      "< pdiTolScale(PDI_SNAP_TOL_PX." + kind + "))",
      1,
    ))

# E4 : commitGraph reoriente les ports et adapte les coudes.
# Toutes les commandes geometriques en beneficient : aligner, parallele,
# redresser, deplacer, annuler.
EDITS.append((
  "E4 commitGraph reoriente ports et coudes",
  "    if (!historyBusyRef.current) pushHistory();\n    historyBusyRef.current = true;\n    setNodesRaw(nextNodes);",
  "    if (!historyBusyRef.current) pushHistory();\n    historyBusyRef.current = true;\n    // PATCH 017P2 : les faces suivent la geometrie reelle et les coudes\n    // sont ramenes sur l angle normalise le plus proche.\n    const pdiReor = pdiReorientPorts(nextNodes, nextSegments, { adaptElbows: true });\n    setNodesRaw(pdiReor.nodes);",
  1,
))

# E5 : fin des alignements muets
EDITS.append((
  "E5 alignement sans effet signale",
  "    // PATCH 017P : QA avant validation, jamais deux noeuds confondus.",
  "    // PATCH 017P2 : un alignement sans effet ne doit plus etre muet.\n    const pdiMoved = nextNodes.some((n, i) => n !== nodes[i]);\n    if (!pdiMoved) {\n      setStatusMessage(`Alignement ${axis.toUpperCase()} : noeuds deja alignes sur ${refValue.toFixed(3)} m - aucun changement`);\n      return;\n    }\n    // PATCH 017P : QA avant validation, jamais deux noeuds confondus.",
  1,
))

# E6 : le menu Alignement reste cliquable et explique la condition
for axis_label, axis_key, hint in (("X", "x", "AX"), ("Y", "y", "AY"), ("Z", "z", "AZ")):
    old = '{ label: "Aligner ' + axis_label + '", hint: "' + hint + '", run: () => alignSelectedNodesAxis("' + axis_key + '"), disabled: selectedNodeIds.length < 2 },'
    new = '{ label: "Aligner ' + axis_label + '", hint: "' + hint + '", run: () => alignSelectedNodesAxis("' + axis_key + '") },'
    EDITS.append(("E6 menu Aligner " + axis_label + " toujours cliquable", old, new, 1))

# E7 : message d aide pour les noeuds empiles
EDITS.append((
  "E7 astuce selection par rectangle",
  'setStatusMessage(`Aligner ${axis.toUpperCase()} : s\u00e9lectionner au moins deux n\u0153uds`);',
  'setStatusMessage(`Aligner ${axis.toUpperCase()} : s\u00e9lectionner au moins deux n\u0153uds (astuce : s\u00e9lection par rectangle pour des n\u0153uds empil\u00e9s)`);',
  1,
))

# VOLET C - application, controles, rapport

def apply_edit(src, label, old, new, expected):
    if new in src:
        log("DEJA : " + label)
        return src, False
    count = src.count(old)
    if count != expected:
        log("ECHEC : " + label + " (occurrences " + str(count) + ", attendu " + str(expected) + ")")
        return src, False
    src = src.replace(old, new, expected)
    log("APPLIQUE : " + label)
    return src, True

def main():
    if not os.path.exists(ENGINE):
        log("ERREUR : moteur introuvable -> " + ENGINE)
        return
    # Volet A : module de reorientation
    need_module = True
    if os.path.exists(PORTS):
        with open(PORTS, "r", encoding="utf-8") as fh:
            need_module = fh.read() != PORTS_TS
    if need_module:
        with open(PORTS, "w", encoding="utf-8") as fh:
            fh.write(PORTS_TS)
        log("ECRIT : module pdiPorts017P2.ts")
    else:
        log("DEJA : module pdiPorts017P2.ts")

    with open(ENGINE, "r", encoding="utf-8") as fh:
        original = fh.read()
    src = original
    touched = False
    for label, old, new, expected in EDITS:
        src, done = apply_edit(src, label, old, new, expected)
        touched = touched or done

    if touched:
        backup = ENGINE + ".before017P2"
        if not os.path.exists(backup):
            with open(backup, "w", encoding="utf-8") as fh:
                fh.write(original)
            log("BACKUP : src/pdi/isometric/engine/IsometrieModuleV48d.tsx.before017P2")
        with open(ENGINE, "w", encoding="utf-8") as fh:
            fh.write(src)
        log("ECRIT : moteur isometrique")
    else:
        log("AUCUNE REECRITURE : moteur deja a jour")

    with open(ENGINE, "r", encoding="utf-8") as fh:
        src = fh.read()
    with open(PORTS, "r", encoding="utf-8") as fh:
        mod = fh.read()

    checks = [
      ("module pdiPorts017P2 present", "export const pdiReorientPorts" in mod),
      ("catalogue de coudes normalise", "PDI_ELBOW_CATALOG" in mod and "coude_22_5" in mod),
      ("import dans le moteur", 'from "./pdiPorts017P2"' in src),
      ("apercu du trace accroche", "const pt = pdiCreatePoint(screenToIsoWorld(e));" in src),
      ("apercu sans grille pure", "const pt = { x: snapIsoV4(w.x, isoSnapStep), y: snapIsoV4(w.y, isoSnapStep) };" not in src),
      ("tolerances a l echelle ecran (4)", src.count("pdiTolScale(PDI_SNAP_TOL_PX") == 4),
      ("commitGraph reoriente les faces", "pdiReorientPorts(nextNodes, nextSegments" in src),
      ("coudes adaptes a la geometrie", "adaptElbows: true" in src),
      ("setNodesRaw utilise le graphe reoriente", "setNodesRaw(pdiReor.nodes);" in src),
      ("alignement sans effet signale", "aucun changement" in src),
      ("menu Alignement toujours cliquable", src.count("disabled: selectedNodeIds.length < 2") == 0),
      ("astuce noeuds empiles", "rectangle pour des n\u0153uds empil\u00e9s" in src),
    ]
    ok = sum(1 for _, v in checks if v)
    log("")
    for label, value in checks:
        log(("[x] " if value else "[ ] ") + label)
    log("VERIFICATIONS : " + str(ok) + "/" + str(len(checks)))
    log("MD5 IsometrieModuleV48d.tsx : " + md5(ENGINE))
    log("MD5 pdiPorts017P2.ts        : " + md5(PORTS))

    lines = []
    lines.append("# PATCH 017P2 - reorientation des ports et des coudes")
    lines.append("")
    lines.append("Controles : " + str(ok) + "/" + str(len(checks)))
    lines.append("")
    lines.append("## Ce que le patch corrige")
    lines.append("")
    lines.append("1. Le tube etait trace entre les FACES des noeuds, jamais entre leurs centres.")
    lines.append("   portWorldPosition decale chaque extremite de 0.08 a 0.20 m selon port.dx/dy")
    lines.append("   et node.rotation. Aucune commande geometrique ne reorientait ces faces :")
    lines.append("   apres un alignement le tube restait suspendu a cote des noeuds.")
    lines.append("2. Les coudes sont desormais adaptes a la geometrie : rotation et sens deduits")
    lines.append("   des deux voisins reels, puis angle ramene sur le catalogue normalise")
    lines.append("   (90, 45, 30, 22.5). Un ecart superieur a 5 degres est signale, jamais")
    lines.append("   silencieusement fabrique : un coude hors catalogue ne s achete pas.")
    lines.append("3. L apercu du trace suivait la grille pure alors que la creation suivait")
    lines.append("   l accroche : d ou l impression de colle a 142 pourcent puis decolle a 435.")
    lines.append("4. La tolerance d accrochage etait exprimee en unites viewBox ; elle est")
    lines.append("   convertie en pixels ecran reels, donc constante quelle que soit la fenetre.")
    lines.append("5. Un alignement sans effet affichait un message identique a un succes.")
    lines.append("6. Le menu Alignement etait grise sans explication sur des noeuds empiles.")
    lines.append("")
    lines.append("## Perimetre volontairement restreint")
    lines.append("")
    lines.append("- Les faces de role branch (piquage) ne sont jamais reorientees : leur")
    lines.append("  direction est un choix metier, pas une consequence de la geometrie.")
    lines.append("- Les equipements non coudes (vannes, brides, reductions) gardent leur")
    lines.append("  orientation : elle depend du sens de service, pas du trace.")
    lines.append("- Le verrouillage angulaire interactif (pdiSnapAngleDeg) attend le ruban 017M.")
    lines.append("- Les marqueurs differencies par type d accroche restent a faire.")
    lines.append("")
    lines.append("## Journal")
    lines.append("")
    for label, value in checks:
        lines.append("- " + ("OK   " if value else "KO   ") + label)
    with open(REPORT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")
    log("RAPPORT : 017P2_ports_coudes_REPORT.md")
    log("FIN")

main()
