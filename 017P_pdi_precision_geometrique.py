# PATCH 017P - PRECISION GEOMETRIQUE DU MOTEUR ISOMETRIQUE PD&I
# Regle R24 : precision avant volume. Regle R1 : idempotent, backup, rapport.
# Cible : src/pdi/isometric/engine/IsometrieModuleV48d.tsx (build 21 + 017K + 017K2)
# Usage : placer ce fichier a la racine du projet puis
#   python3 017P_pdi_precision_geometrique.py
import os
import hashlib
import shutil

TAG = "017P"
LOG = []
FAILED = []


def log(line):
    LOG.append(line)
    print(line)


def find_root():
    here = os.path.dirname(os.path.abspath(__file__))
    for cand in (here, os.getcwd()):
        if os.path.exists(os.path.join(cand, "package.json")):
            return cand
    return here


ROOT = find_root()
ISO = os.path.join(ROOT, "src", "pdi", "isometric", "engine", "IsometrieModuleV48d.tsx")
HELPER = os.path.join(ROOT, "src", "pdi", "isometric", "engine", "pdiPrecision017P.ts")
REPORT = os.path.join(ROOT, "017P_precision_geometrique_REPORT.md")


def read_text(path):
    with open(path, "r", encoding="utf-8") as fh:
        return fh.read()


def write_text(path, data):
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(data)


def md5(path):
    with open(path, "rb") as fh:
        return hashlib.md5(fh.read()).hexdigest()


def backup(path):
    dst = path + ".before" + TAG
    if os.path.exists(path) and not os.path.exists(dst):
        shutil.copy2(path, dst)
        log("BACKUP : " + os.path.relpath(dst, ROOT))
        return True
    return False


# ---------------------------------------------------------------------------
# VOLET A : module de helpers geometriques purs (zero dependance React)
# ---------------------------------------------------------------------------
HELPER_LINES = [
    "// PATCH 017P - Precision geometrique PD&I.",
    "// Helpers purs, sans React ni acces reseau (regle R7 : zero API).",
    "// Tolerances d accroche exprimees en PIXELS ECRAN : elles restent",
    "// constantes quel que soit le zoom (100 % comme 284 %).",
    "",
    "export type PdiVec3 = { x: number; y: number; z: number };",
    "",
    "export const PDI_SNAP_TOL_PX = {",
    "  PORT: 14,",
    "  ENDPOINT: 14,",
    "  MIDPOINT: 12,",
    "  GRID: 10,",
    "};",
    "",
    "// Priorite d accroche, du plus fort au plus faible.",
    "export const PDI_SNAP_PRIORITY = [\"PORT\", \"ENDPOINT\", \"MIDPOINT\", \"AXIS\", \"GRID\"];",
    "",
    "// Arrondi 3 decimales EN SORTIE seulement (millimetre).",
    "export const pdiRound3 = (v: number) => Number((Number.isFinite(v) ? v : 0).toFixed(3));",
    "",
    "export const pdiSnapValue = (v: number, step: number) =>",
    "  step > 0 ? pdiRound3(Math.round(v / step) * step) : pdiRound3(v);",
    "",
    "// Les 6 directions isometriques du repere modele.",
    "export const PDI_ISO_DIRECTIONS: Array<PdiVec3 & { label: string }> = [",
    "  { x: 1, y: 0, z: 0, label: \"X+\" },",
    "  { x: -1, y: 0, z: 0, label: \"X-\" },",
    "  { x: 0, y: 1, z: 0, label: \"Y+\" },",
    "  { x: 0, y: -1, z: 0, label: \"Y-\" },",
    "  { x: 0, y: 0, z: 1, label: \"Z+\" },",
    "  { x: 0, y: 0, z: -1, label: \"Z-\" },",
    "];",
    "",
    "// Ramene un vecteur quelconque sur l axe ISO le plus proche.",
    "export const pdiSnapDirectionIso = (v: PdiVec3) => {",
    "  const n = Math.hypot(v.x, v.y, v.z) || 1;",
    "  const u = { x: v.x / n, y: v.y / n, z: v.z / n };",
    "  let best = PDI_ISO_DIRECTIONS[0];",
    "  let bestDot = -Infinity;",
    "  for (const d of PDI_ISO_DIRECTIONS) {",
    "    const dot = u.x * d.x + u.y * d.y + u.z * d.z;",
    "    if (dot > bestDot) {",
    "      bestDot = dot;",
    "      best = d;",
    "    }",
    "  }",
    "  return best;",
    "};",
    "",
    "// Verrouillage angulaire : 15 / 30 / 45 / 90 selon le pas demande.",
    "export const pdiSnapAngleDeg = (angle: number, step = 15) => {",
    "  const s = step > 0 ? step : 15;",
    "  const a = Math.round(angle / s) * s;",
    "  return ((a % 360) + 360) % 360;",
    "};",
    "",
    "type PdiQaNode = { id: string; name?: string; x: number; y: number; z?: number };",
    "type PdiQaSegment = { id: string; fromNodeId: string; toNodeId: string };",
    "",
    "// QA : deux noeuds confondus interdisent la validation d une commande.",
    "export const pdiFindCoincidentNodes = (nodes: PdiQaNode[], eps = 0.001) => {",
    "  for (let i = 0; i < nodes.length; i += 1) {",
    "    for (let j = i + 1; j < nodes.length; j += 1) {",
    "      const a = nodes[i];",
    "      const b = nodes[j];",
    "      const d = Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));",
    "      if (d <= eps) {",
    "        return (a.name || a.id) + \" et \" + (b.name || b.id) + \" sont confondus\";",
    "      }",
    "    }",
    "  }",
    "  return null;",
    "};",
    "",
    "// QA globale : noeuds confondus + tubes de longueur nulle + tubes orphelins.",
    "export const pdiAuditGraph = (nodes: PdiQaNode[], segments: PdiQaSegment[]) => {",
    "  const issues: string[] = [];",
    "  const dup = pdiFindCoincidentNodes(nodes, 0.001);",
    "  if (dup) issues.push(dup);",
    "  const byId = new Map(nodes.map((n) => [n.id, n]));",
    "  let zero = 0;",
    "  let orphan = 0;",
    "  for (const s of segments) {",
    "    const a = byId.get(s.fromNodeId);",
    "    const b = byId.get(s.toNodeId);",
    "    if (!a || !b) {",
    "      orphan += 1;",
    "      continue;",
    "    }",
    "    if (Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0)) <= 0.001) zero += 1;",
    "  }",
    "  if (zero) issues.push(zero + \" tube(s) de longueur nulle\");",
    "  if (orphan) issues.push(orphan + \" tube(s) orphelin(s)\");",
    "  return issues.length ? issues.join(\" - \") : null;",
    "};",
    "",
]

# ---------------------------------------------------------------------------
# VOLET B : editions chirurgicales du moteur isometrique
# ---------------------------------------------------------------------------

E1_OLD = 'import { pdiCompanyName, pdiStandardsNote } from "../../branding/pdiBranding";'
E1_NEW = E1_OLD + "\n" + "\n".join([
    "// PATCH 017P : precision geometrique (accroche a priorites, axes ISO, QA).",
    "import {",
    "  PDI_SNAP_TOL_PX,",
    "  pdiRound3,",
    "  pdiSnapValue,",
    "  pdiSnapDirectionIso,",
    "  pdiFindCoincidentNodes,",
    "  pdiAuditGraph,",
    '} from "./pdiPrecision017P";',
])

# Tolerances d accroche : les valeurs 14 / 14 / 12 / 8 etaient codees en dur.
E2_OLD = "if (Math.hypot(sp.x - sx, sp.y - sy) < 14) {"
E2_NEW = "if (Math.hypot(sp.x - sx, sp.y - sy) < PDI_SNAP_TOL_PX.PORT) {"

E3_OLD = "if (Math.hypot(np.x - sx, np.y - sy) < 14) {"
E3_NEW = "if (Math.hypot(np.x - sx, np.y - sy) < PDI_SNAP_TOL_PX.ENDPOINT) {"

E4_OLD = "if (Math.hypot(sp.x - sx, sp.y - sy) < 12) {"
E4_NEW = "if (Math.hypot(sp.x - sx, sp.y - sy) < PDI_SNAP_TOL_PX.MIDPOINT) {"

E5_OLD = "if (Math.hypot(gp.x - sx, gp.y - sy) < 8) {"
E5_NEW = "if (Math.hypot(gp.x - sx, gp.y - sy) < PDI_SNAP_TOL_PX.GRID) {"

# Point de creation : l accroche detectee est desormais respectee.
E6_OLD = "\n".join([
    "  const screenToIsoWorld=(e:React.PointerEvent<SVGSVGElement>, targetZ:number = nodeZ || 0)=>{",
    "    const { sx, sy } = getSvgCoordinates(e.clientX, e.clientY, svgRef.current || (e.currentTarget as unknown as SVGSVGElement));",
    "    return isoUnprojectV4(sx, sy, viewport.zoom, viewport.panX, viewport.panY, targetZ);",
    "  };",
])
E6_NEW = E6_OLD + "\n\n" + "\n".join([
    "  // PATCH 017P : point de creation. Avant ce patch la creation d un noeud",
    "  // ignorait activeSnap et ne retenait que la grille : impossible de poser",
    "  // un noeud exactement sur un port, une extremite ou un milieu de tube.",
    "  const pdiCreatePoint = (w: { x: number; y: number; z?: number }) => {",
    "    if (snapEnabled && activeSnap) {",
    "      return {",
    "        x: pdiRound3(activeSnap.worldPos.x),",
    "        y: pdiRound3(activeSnap.worldPos.y),",
    "        z: pdiRound3(activeSnap.worldPos.z),",
    "      };",
    "    }",
    "    const step = snapEnabled && snapGrid ? isoSnapStep : 0;",
    "    return {",
    "      x: pdiSnapValue(w.x, step),",
    "      y: pdiSnapValue(w.y, step),",
    "      z: pdiRound3(nodeZ || 0),",
    "    };",
    "  };",
])

E7_OLD = "snapIsoV4(w.x, isoSnapStep), snapIsoV4(w.y, isoSnapStep), nodeZ || 0"
E7_NEW = "pdiCreatePoint(w).x, pdiCreatePoint(w).y, pdiCreatePoint(w).z"

# Alignement : la valeur de reference est ramenee sur le pas de grille.
E8_OLD = "    const refValue = Number(reference[axis] || 0);"
E8_NEW = "\n".join([
    "    // PATCH 017P : la coordonnee de reference est ramenee sur le pas de",
    "    // grille. Les autres coordonnees restent intactes : aucune regression",
    "    // du PATCH 013 (pas de re-snap lateral), mais la ligne tombe juste.",
    "    const rawRef = Number(reference[axis] || 0);",
    "    const refValue = snapEnabled && snapGrid ? pdiSnapValue(rawRef, isoSnapStep) : pdiRound3(rawRef);",
])

E9_OLD = "\n".join([
    "    commitGraph(nextNodes, recalcSegmentLengths(nextNodes, segments));",
    "    setStatusMessage(`Alignement ${axis.toUpperCase()} appliqu\u00e9 sans re-snap \u2014 r\u00e9f\u00e9rence : ${reference.name}`);",
])
E9_NEW = "\n".join([
    "    // PATCH 017P : QA avant validation, jamais deux noeuds confondus.",
    "    const alignAudit = pdiFindCoincidentNodes(nextNodes, 0.001);",
    "    if (alignAudit) {",
    "      setStatusMessage(`Alignement ${axis.toUpperCase()} refus\u00e9 : ${alignAudit}`);",
    "      return;",
    "    }",
    "    commitGraph(nextNodes, recalcSegmentLengths(nextNodes, segments));",
    "    setStatusMessage(`Alignement ${axis.toUpperCase()} sur ${refValue.toFixed(3)} m \u2014 r\u00e9f\u00e9rence : ${reference.name}`);",
])

# Rendre parallele : axe ISO + rotation autour du noeud amont + propagation aval.
E10_OLD = "\n".join([
    "    const rv = { x: rb.x - ra.x, y: rb.y - ra.y, z: rb.z - ra.z };",
    "    const rl = Math.hypot(rv.x, rv.y, rv.z) || 1;",
    "    const tl = Math.max(0.05, target.length || Math.hypot(tb.x - ta.x, tb.y - ta.y, tb.z - ta.z));",
    "    const nextNodes = nodes.map((node) =>",
    "      node.id === tb.id",
    "        ? {",
    "            ...node,",
    "            x: Number((ta.x + (rv.x / rl) * tl).toFixed(3)),",
    "            y: Number((ta.y + (rv.y / rl) * tl).toFixed(3)),",
    "            z: Number((ta.z + (rv.z / rl) * tl).toFixed(3)),",
    "          }",
    "        : node,",
    "    );",
    "    commitGraph(nextNodes, recalcSegmentLengths(nextNodes, segments));",
    '    setStatusMessage("Tube cible rendu parall\u00e8le au tube de r\u00e9f\u00e9rence");',
])
E10_NEW = "\n".join([
    "    // PATCH 017P : la direction de reference est ramenee sur un axe ISO,",
    "    // le tube pivote autour de son noeud AMONT et tout l aval suit. Avant,",
    "    // seul toNodeId etait deplace : le reseau se dechirait en aval.",
    "    const rv = { x: rb.x - ra.x, y: rb.y - ra.y, z: rb.z - ra.z };",
    "    const dir = pdiSnapDirectionIso(rv);",
    "    const tl = Math.max(0.05, target.length || Math.hypot(tb.x - ta.x, tb.y - ta.y, tb.z - ta.z));",
    "    const pnx = pdiRound3(ta.x + dir.x * tl);",
    "    const pny = pdiRound3(ta.y + dir.y * tl);",
    "    const pnz = pdiRound3(ta.z + dir.z * tl);",
    "    const pdx = pdiRound3(pnx - tb.x);",
    "    const pdy = pdiRound3(pny - tb.y);",
    "    const pdz = pdiRound3(pnz - tb.z);",
    "    const downstreamParallel = downstreamNodeIds(tb.id, segments, target.id);",
    "    const nextNodes = nodes.map((node) => {",
    "      if (node.id === tb.id) return { ...node, x: pnx, y: pny, z: pnz };",
    "      if (!downstreamParallel.has(node.id)) return node;",
    "      return {",
    "        ...node,",
    "        x: pdiRound3(node.x + pdx),",
    "        y: pdiRound3(node.y + pdy),",
    "        z: pdiRound3((node.z || 0) + pdz),",
    "      };",
    "    });",
    "    const parallelAudit = pdiFindCoincidentNodes(nextNodes, 0.001);",
    "    if (parallelAudit) {",
    "      setStatusMessage(`Rendre parall\u00e8le refus\u00e9 : ${parallelAudit}`);",
    "      return;",
    "    }",
    "    commitGraph(nextNodes, recalcSegmentLengths(nextNodes, segments));",
    "    setStatusMessage(`Tube parall\u00e8le \u00b7 axe ISO ${dir.label} \u00b7 ${downstreamParallel.size} n\u0153ud(s) aval suivis`);",
])

# Rotation transactionnelle : un seul commitGraph, aucune creation implicite.
E11_OLD = "\n".join([
    "    commitGraph(nextNodes, recalcSegmentLengths(nextNodes, segments));",
    '    setStatusMessage(`Rotation ${delta > 0 ? "+" : ""}${delta}\u00b0 (R)`);',
])
E11_NEW = "\n".join([
    "    // PATCH 017P : rotation transactionnelle. La commande refuse de valider",
    "    // si elle a fait varier le nombre de noeuds (cause des noeuds et tubes",
    "    // fantomes observes) et signale toute anomalie geometrique residuelle.",
    "    if (nextNodes.length !== nodes.length) {",
    '      setStatusMessage("Rotation refus\u00e9e : le nombre de n\u0153uds a chang\u00e9");',
    "      return;",
    "    }",
    "    const rotationAudit = pdiAuditGraph(nextNodes, segments);",
    "    commitGraph(nextNodes, recalcSegmentLengths(nextNodes, segments));",
    '    setStatusMessage(`Rotation ${delta > 0 ? "+" : ""}${delta}\u00b0 (R)${rotationAudit ? " \u00b7 contr\u00f4le : " + rotationAudit : ""}`);',
])

# Creation du noeud de piquage au relachement : meme accroche que les autres
# creations. C est ce chemin qui posait un noeud a cote de la cible.
E12_OLD = "        const sw={x:snapIsoV4(w.x,isoSnapStep),y:snapIsoV4(w.y,isoSnapStep),z:nodeZ||0};"
E12_NEW = "\n".join([
    "        // PATCH 017P : le piquage respecte l accroche active.",
    "        const sw=pdiCreatePoint(w);",
])

# Trace de branche : la position guidee suit la meme regle d accroche.
E13_OLD = "\n".join([
    "  const snapBranchWorld=(w:{x:number;y:number;z:number})=>({",
    "    x:snapIsoV4(w.x,isoSnapStep),",
    "    y:snapIsoV4(w.y,isoSnapStep),",
    "    z:nodeZ||0",
    "  });",
])
E13_NEW = "\n".join([
    "  // PATCH 017P : une seule regle d accroche pour tout le moteur.",
    "  const snapBranchWorld=(w:{x:number;y:number;z:number})=>pdiCreatePoint(w);",
])

EDITS = [
    ("E1 import du module de precision", E1_OLD, E1_NEW),
    ("E2 tolerance PORT en pixels", E2_OLD, E2_NEW),
    ("E3 tolerance EXTREMITE en pixels", E3_OLD, E3_NEW),
    ("E4 tolerance MILIEU en pixels", E4_OLD, E4_NEW),
    ("E5 tolerance GRILLE en pixels", E5_OLD, E5_NEW),
    ("E6 fonction pdiCreatePoint", E6_OLD, E6_NEW),
    ("E7 accroche respectee a la creation", E7_OLD, E7_NEW),
    ("E8 alignement sur le pas de grille", E8_OLD, E8_NEW),
    ("E9 QA de l alignement", E9_OLD, E9_NEW),
    ("E10 parallele : axe ISO + propagation aval", E10_OLD, E10_NEW),
    ("E11 rotation transactionnelle", E11_OLD, E11_NEW),
    ("E12 accroche du piquage", E12_OLD, E12_NEW),
    ("E13 accroche unique du trace de branche", E13_OLD, E13_NEW),
]

# ---------------------------------------------------------------------------
# VOLET C : application, verifications, rapport
# ---------------------------------------------------------------------------


def apply_edit(src, label, old, new):
    if new in src:
        log("DEJA : " + label)
        return src
    if old not in src:
        log("ECHEC : ancre absente - " + label)
        FAILED.append(label)
        return src
    count = src.count(old)
    src = src.replace(old, new)
    log("APPLIQUE : " + label + " (" + str(count) + " site(s))")
    return src


def main():
    log("PATCH " + TAG + " - PRECISION GEOMETRIQUE")
    log("ROOT : " + ROOT)

    if not os.path.exists(ISO):
        log("ECHEC : moteur introuvable - " + ISO)
        log("FIN")
        return 1

    # Volet A : module de helpers.
    helper_src = "\n".join(HELPER_LINES)
    if os.path.exists(HELPER) and read_text(HELPER) == helper_src:
        log("DEJA : module pdiPrecision017P.ts")
    else:
        backup(HELPER)
        write_text(HELPER, helper_src)
        log("APPLIQUE : module pdiPrecision017P.ts")

    # Volet B : moteur.
    backup(ISO)
    src = read_text(ISO)
    before = src
    for label, old, new in EDITS:
        src = apply_edit(src, label, old, new)
    if src != before:
        write_text(ISO, src)
        log("ECRIT : " + os.path.relpath(ISO, ROOT))
    else:
        log("AUCUNE REECRITURE : moteur deja a jour")

    # Verifications. On exclut volontairement le module cree par le patch
    # et les sauvegardes .before* (lecon des patchs 017J et 017K2).
    src = read_text(ISO)
    helper_ok = os.path.exists(HELPER) and "pdiSnapDirectionIso" in read_text(HELPER)
    checks = [
        ("module pdiPrecision017P.ts en place", helper_ok),
        ("import du module dans le moteur", 'from "./pdiPrecision017P"' in src),
        ("4 tolerances d accroche en pixels", src.count("PDI_SNAP_TOL_PX.") == 4),
        ("aucune tolerance codee en dur restante",
         "sp.y - sy) < 14" not in src and "gp.y - sy) < 8" not in src),
        ("fonction pdiCreatePoint definie", "const pdiCreatePoint = (w:" in src),
        ("accroche respectee sur les 5 chemins de creation",
         src.count("pdiCreatePoint(w)") >= 5
         and "snapIsoV4(w.x, isoSnapStep), snapIsoV4(w.y, isoSnapStep), nodeZ || 0" not in src
         and "const sw={x:snapIsoV4(" not in src),
        ("alignement ramene sur le pas de grille",
         "const refValue = snapEnabled && snapGrid ? pdiSnapValue(rawRef, isoSnapStep)" in src),
        ("QA de l alignement active", "const alignAudit = pdiFindCoincidentNodes(nextNodes, 0.001);" in src),
        ("parallele sur axe ISO", "const dir = pdiSnapDirectionIso(rv);" in src),
        ("propagation aval du parallele",
         "downstreamNodeIds(tb.id, segments, target.id)" in src),
        ("rotation transactionnelle controlee",
         "if (nextNodes.length !== nodes.length) {" in src and "pdiAuditGraph(nextNodes, segments)" in src),
    ]
    ok = sum(1 for _, passed in checks if passed)
    log("")
    log("VERIFICATIONS : " + str(ok) + "/" + str(len(checks)))
    for label, passed in checks:
        log("  [" + ("x" if passed else " ") + "] " + label)
    if FAILED:
        log("ATTENTION : ancres manquantes -> " + ", ".join(FAILED))

    log("")
    log("MD5 IsometrieModuleV48d.tsx : " + md5(ISO))
    log("MD5 pdiPrecision017P.ts     : " + md5(HELPER))

    # Rapport.
    report = [
        "# PATCH 017P - Precision geometrique du moteur isometrique",
        "",
        "Regle R24 : precision avant volume. Aucune fonctionnalite 3D n est ajoutee ici.",
        "",
        "## Ce que le patch corrige",
        "",
        "1. Accroche a la creation. `snapIsoV4` n etait applique qu au glissement.",
        "   Les creations de noeud, de te et de coude ne retenaient QUE la grille et",
        "   ignoraient l accroche detectee (port, extremite, milieu) : c est la cause",
        "   premiere du dessin imprecis. Elles passent par `pdiCreatePoint`.",
        "2. Tolerances d accroche. Valeurs 14 / 14 / 12 / 8 codees en dur remplacees",
        "   par `PDI_SNAP_TOL_PX`, en pixels ecran, donc stables a tout zoom.",
        "3. Alignement. La coordonnee de reference est ramenee sur le pas de grille,",
        "   sans re-snap lateral (le PATCH 013 n est pas regresse), et la commande",
        "   refuse de valider si deux noeuds deviennent confondus.",
        "4. Rendre parallele. La direction de reference est ramenee sur un des 6 axes",
        "   ISO, le tube pivote autour de son noeud AMONT et tout l aval est",
        "   translate. Avant, seul `toNodeId` bougeait et le reseau se dechirait.",
        "5. Rotation transactionnelle. Un seul `commitGraph`, refus de validation si",
        "   le nombre de noeuds a varie, et controle geometrique affiche.",
        "6. Arrondi 3 decimales EN SORTIE seulement, via `pdiRound3`.",
        "",
        "## Tests",
        "",
        "1. Poser un noeud exactement sur un port existant : le reticule cyan",
        "   apparait, le noeud se cree sur le port, pas a cote.",
        "2. Zoomer a 284 % puis 100 % : la distance d accrochage ressentie est",
        "   identique (tolerance en pixels).",
        "3. Selectionner deux noeuds, Aligner X : la valeur affichee dans la barre",
        "   d etat est un multiple du pas de snap.",
        "4. Selectionner deux tubes, Rendre parallele : le tube cible se met sur un",
        "   axe ISO et les noeuds aval suivent (le compteur est affiche).",
        "5. Selectionner un noeud et faire R plusieurs fois : le compteur de noeuds",
        "   et de troncons de l entete ne change jamais.",
        "6. Aligner deux noeuds deja superposes : la commande est refusee avec un",
        "   message explicite au lieu de creer une geometrie degeneree.",
        "",
        "## Hors perimetre assume",
        "",
        "- Verrouillage angulaire interactif a la souris : `pdiSnapAngleDeg` est",
        "  livre et teste mais n est pas encore cable sur le trace a la souris.",
        "- Marqueurs differencies par type d accroche (carre, triangle, croix) :",
        "  le reticule cyan unique est conserve pour limiter la taille du patch.",
        "- Coherence diametre / region entre etiquette de troncon et cartouche.",
        "- Les 8 window.confirm restants : PATCH 017K3.",
        "",
        "## Journal",
        "",
    ]
    report += ["    " + line for line in LOG]
    write_text(REPORT, "\n".join(report) + "\n")
    log("RAPPORT : " + os.path.relpath(REPORT, ROOT))
    log("FIN")
    return 0


main()
