/**
 * PDI 017Q — Module Haute Précision ALIGN & PARALLEL
 * 
 * Fonctions géométriques professionnelles :
 * - Calcul dynamique des points d'ancrage (endpoints, ports, centre/milieu) à partir du modèle existant
 * - Alignement multi-objets (2, 3, N objets) selon les axes X, Y, Z ou référence/ancrage arbitraire
 * - Parallélisme multi-tronçons avec choix de l'ancrage pivot (from, to, midpoint) et direction exacte/ISO
 * - Vérification topologique QA (anti-confusion de nœuds)
 * - Rétrocompatibilité totale et intégration avec commitGraph / pushHistory (Undo/Redo)
 */

import type { IsoNode, IsoSegment } from "../types/isoGraphTypes";
import { pdiRound3, pdiSnapValue, pdiFindCoincidentNodes, pdiSnapDirectionIso } from "./pdiPrecision017P";

export type AnchorType = "node" | "endpoint_from" | "endpoint_to" | "midpoint" | "port" | "center" | "custom";

export interface PdiAnchorPoint {
  id: string;
  entityId: string;
  entityKind: "node" | "segment" | "cad2d";
  type: AnchorType;
  label: string;
  x: number;
  y: number;
  z: number;
}

/**
 * Extrait les points d'ancrage réels à partir du modèle existant
 * (sans duplication de géométrie ni création d'entités fictives).
 */
export function extractEntityAnchors(
  nodes: IsoNode[],
  segments: IsoSegment[],
  filterEntityIds?: Set<string>
): PdiAnchorPoint[] {
  const anchors: PdiAnchorPoint[] = [];
  const nodeMap = new Map<string, IsoNode>(nodes.map((n) => [n.id, n]));

  // 1. Ancrages sur les nœuds (centre + ports d'équipements)
  for (const node of nodes) {
    if (filterEntityIds && !filterEntityIds.has(node.id)) continue;
    anchors.push({
      id: `anchor-node-${node.id}`,
      entityId: node.id,
      entityKind: "node",
      type: "node",
      label: `Nœud ${node.name || node.id}`,
      x: pdiRound3(node.x),
      y: pdiRound3(node.y),
      z: pdiRound3(node.z || 0),
    });

    // Ports réels de l'équipement
    if (Array.isArray(node.ports)) {
      node.ports.forEach((port, idx) => {
        const px = node.x + (port.dx || 0);
        const py = node.y + (port.dy || 0);
        const pz = (node.z || 0) + (port.dz || 0);
        anchors.push({
          id: `anchor-port-${node.id}-${port.id || idx}`,
          entityId: node.id,
          entityKind: "node",
          type: "port",
          label: `Port ${port.role || `#${idx + 1}`} (${node.name})`,
          x: pdiRound3(px),
          y: pdiRound3(py),
          z: pdiRound3(pz),
        });
      });
    }
  }

  // 2. Ancrages sur les tronçons (Début, Fin, Milieu)
  for (const seg of segments) {
    if (filterEntityIds && !filterEntityIds.has(seg.id)) continue;
    const a = nodeMap.get(seg.fromNodeId);
    const b = nodeMap.get(seg.toNodeId);
    if (!a || !b) continue;

    anchors.push({
      id: `anchor-seg-from-${seg.id}`,
      entityId: seg.id,
      entityKind: "segment",
      type: "endpoint_from",
      label: `Début tube (${a.name || a.id})`,
      x: pdiRound3(a.x),
      y: pdiRound3(a.y),
      z: pdiRound3(a.z || 0),
    });

    anchors.push({
      id: `anchor-seg-to-${seg.id}`,
      entityId: seg.id,
      entityKind: "segment",
      type: "endpoint_to",
      label: `Fin tube (${b.name || b.id})`,
      x: pdiRound3(b.x),
      y: pdiRound3(b.y),
      z: pdiRound3(b.z || 0),
    });

    anchors.push({
      id: `anchor-seg-mid-${seg.id}`,
      entityId: seg.id,
      entityKind: "segment",
      type: "midpoint",
      label: `Milieu tube (${seg.id})`,
      x: pdiRound3((a.x + b.x) / 2),
      y: pdiRound3((a.y + b.y) / 2),
      z: pdiRound3(((a.z || 0) + (b.z || 0)) / 2),
    });
  }

  return anchors;
}

/**
 * Calcule les identifiants de nœuds avals connectés
 */
export function getDownstreamNodeIds(
  startId: string,
  segments: IsoSegment[],
  excludedSegmentId?: string
): Set<string> {
  const found = new Set<string>([startId]);
  const queue = [startId];
  while (queue.length) {
    const id = queue.shift()!;
    for (const seg of segments) {
      if (seg.id === excludedSegmentId || seg.fromNodeId !== id || found.has(seg.toNodeId)) continue;
      found.add(seg.toNodeId);
      queue.push(seg.toNodeId);
    }
  }
  return found;
}

export interface UniversalAlignParams {
  axis: "x" | "y" | "z";
  nodes: IsoNode[];
  segments: IsoSegment[];
  selectedNodeIds: string[];
  selectedSegmentIds: string[];
  activeAnchor?: PdiAnchorPoint | null;
  explicitReferenceId?: string;
  snapGrid?: boolean;
  snapStep?: number;
}

export interface UniversalAlignOutput {
  success: boolean;
  nextNodes: IsoNode[];
  referenceValue: number;
  referenceLabel: string;
  movedNodeCount: number;
  message: string;
}

/**
 * ALIGN UNIVERSEL DIRECT
 * Fonctionne directement avec 2 objets, 3 objets ou N objets sélectionnés
 * (nœuds, tronçons, ou combinaison des deux).
 */
export function performUniversalAlign(params: UniversalAlignParams): UniversalAlignOutput {
  const {
    axis,
    nodes,
    segments,
    selectedNodeIds,
    selectedSegmentIds,
    activeAnchor,
    explicitReferenceId,
    snapGrid = false,
    snapStep = 0.5,
  } = params;

  // Rassembler l'ensemble des nœuds cibles et segments cibles
  const nodeMap = new Map<string, IsoNode>(nodes.map((n) => [n.id, n]));
  const targetNodeIdSet = new Set<string>(selectedNodeIds);
  
  // Les segments sélectionnés ajoutent leurs nœuds de terminaison
  selectedSegmentIds.forEach((segId) => {
    const s = segments.find((item) => item.id === segId);
    if (s) {
      targetNodeIdSet.add(s.fromNodeId);
      targetNodeIdSet.add(s.toNodeId);
    }
  });

  if (targetNodeIdSet.size < 2 && !activeAnchor && !explicitReferenceId) {
    return {
      success: false,
      nextNodes: nodes,
      referenceValue: 0,
      referenceLabel: "",
      movedNodeCount: 0,
      message: `Aligner ${axis.toUpperCase()} : sélectionner au moins 2 éléments (nœuds ou tronçons)`,
    };
  }

  // Détermination de la référence
  let refValue: number = 0;
  let refLabel: string = "";
  let refNodeId: string | null = null;

  if (activeAnchor) {
    refValue = activeAnchor[axis];
    refLabel = `Ancrage ${activeAnchor.label}`;
    if (activeAnchor.entityKind === "node") refNodeId = activeAnchor.entityId;
  } else if (explicitReferenceId && nodeMap.has(explicitReferenceId)) {
    const refNode = nodeMap.get(explicitReferenceId)!;
    refValue = Number(refNode[axis] || 0);
    refLabel = refNode.name || refNode.id;
    refNodeId = refNode.id;
  } else if (selectedSegmentIds.length > 0 && selectedNodeIds.length === 0) {
    // Si uniquement des segments sont sélectionnés, le dernier segment est la référence
    const refSegId = selectedSegmentIds[selectedSegmentIds.length - 1];
    const refSeg = segments.find((s) => s.id === refSegId);
    if (refSeg) {
      const a = nodeMap.get(refSeg.fromNodeId);
      const b = nodeMap.get(refSeg.toNodeId);
      if (a && b) {
        // Aligner sur le point milieu ou point de début du tube référence
        refValue = (Number(a[axis] || 0) + Number(b[axis] || 0)) / 2;
        refLabel = `Tube ${refSeg.id} (milieu)`;
      }
    }
  } else {
    // Dernier nœud sélectionné comme référence par défaut
    const lastId = selectedNodeIds.length
      ? selectedNodeIds[selectedNodeIds.length - 1]
      : Array.from(targetNodeIdSet)[targetNodeIdSet.size - 1];
    const refNode = nodeMap.get(lastId);
    if (refNode) {
      refValue = Number(refNode[axis] || 0);
      refLabel = refNode.name || refNode.id;
      refNodeId = refNode.id;
    }
  }

  // Application du pas de grille si actif
  const finalRefValue = snapGrid && snapStep > 0 ? pdiSnapValue(refValue, snapStep) : pdiRound3(refValue);

  // Déplacement des nœuds cibles
  let movedCount = 0;
  const nextNodes = nodes.map((node) => {
    // Le nœud de référence exact ne bouge pas
    if (refNodeId && node.id === refNodeId) return node;
    if (!targetNodeIdSet.has(node.id)) return node;

    const currentVal = Number(node[axis] || 0);
    const delta = finalRefValue - currentVal;
    if (Math.abs(delta) < 1e-6) return node;

    movedCount++;
    return {
      ...node,
      [axis]: pdiRound3(currentVal + delta),
    };
  });

  if (movedCount === 0) {
    return {
      success: true,
      nextNodes: nodes,
      referenceValue: finalRefValue,
      referenceLabel: refLabel,
      movedNodeCount: 0,
      message: `Alignement ${axis.toUpperCase()} : éléments déjà alignés sur ${finalRefValue.toFixed(3)} m`,
    };
  }

  // Contrôle QA anti-collision (ne jamais créer de nœuds confondus)
  const auditConflict = pdiFindCoincidentNodes(nextNodes, 0.001);
  if (auditConflict) {
    return {
      success: false,
      nextNodes: nodes,
      referenceValue: finalRefValue,
      referenceLabel: refLabel,
      movedNodeCount: 0,
      message: `Alignement ${axis.toUpperCase()} refusé : ${auditConflict}`,
    };
  }

  return {
    success: true,
    nextNodes,
    referenceValue: finalRefValue,
    referenceLabel: refLabel,
    movedNodeCount: movedCount,
    message: `Alignement ${axis.toUpperCase()} sur ${finalRefValue.toFixed(3)} m (${movedCount} nœud(s) ajusté(s) · Réf: ${refLabel})`,
  };
}

export interface UniversalParallelParams {
  nodes: IsoNode[];
  segments: IsoSegment[];
  selectedSegmentIds: string[];
  referenceSegmentId?: string;
  pivotAnchor?: "from" | "to" | "midpoint";
  snapToIsoAxis?: boolean;
  preserveDirectionSense?: boolean;
}

export interface UniversalParallelOutput {
  success: boolean;
  nextNodes: IsoNode[];
  affectedSegmentCount: number;
  directionLabel: string;
  message: string;
}

/**
 * PARALLÈLE UNIVERSEL DIRECT
 * Fonctionne directement sur la sélection (2 tubes, 3 tubes, N tubes)
 * avec choix du pivot d'ancrage et préservation des longueurs de tube.
 */
export function performUniversalParallel(params: UniversalParallelParams): UniversalParallelOutput {
  const {
    nodes,
    segments,
    selectedSegmentIds,
    referenceSegmentId,
    pivotAnchor = "from",
    snapToIsoAxis = true,
    preserveDirectionSense = true,
  } = params;

  if (selectedSegmentIds.length < 2 && !referenceSegmentId) {
    return {
      success: false,
      nextNodes: nodes,
      affectedSegmentCount: 0,
      directionLabel: "",
      message: "Rendre parallèle : sélectionner au moins 2 tronçons (cible puis référence)",
    };
  }

  // Référence : soit spécifiée, soit le dernier segment sélectionné
  const refId = referenceSegmentId || selectedSegmentIds[selectedSegmentIds.length - 1];
  const refSeg = segments.find((s) => s.id === refId);
  if (!refSeg) {
    return {
      success: false,
      nextNodes: nodes,
      affectedSegmentCount: 0,
      directionLabel: "",
      message: "Tronçon de référence introuvable",
    };
  }

  const nodeMap = new Map<string, IsoNode>(nodes.map((n) => [n.id, n]));
  const ra = nodeMap.get(refSeg.fromNodeId);
  const rb = nodeMap.get(refSeg.toNodeId);
  if (!ra || !rb) {
    return {
      success: false,
      nextNodes: nodes,
      affectedSegmentCount: 0,
      directionLabel: "",
      message: "Nœuds du tronçon de référence introuvables",
    };
  }

  // Vecteur de référence
  const rv = { x: rb.x - ra.x, y: rb.y - ra.y, z: (rb.z || 0) - (ra.z || 0) };
  let uDir: { x: number; y: number; z: number; label: string };

  if (snapToIsoAxis) {
    const snapped = pdiSnapDirectionIso(rv);
    uDir = { x: snapped.x, y: snapped.y, z: snapped.z, label: snapped.label };
  } else {
    const len = Math.hypot(rv.x, rv.y, rv.z) || 1;
    uDir = {
      x: rv.x / len,
      y: rv.y / len,
      z: rv.z / len,
      label: `3D (${(rv.x / len).toFixed(2)}, ${(rv.y / len).toFixed(2)}, ${(rv.z / len).toFixed(2)})`,
    };
  }

  // Segments cibles à rendre parallèles (tous les sélectionnés sauf la référence)
  const targetSegIds = selectedSegmentIds.filter((id) => id !== refId);
  if (targetSegIds.length === 0) {
    return {
      success: false,
      nextNodes: nodes,
      affectedSegmentCount: 0,
      directionLabel: uDir.label,
      message: "Aucun tronçon cible à aligner (le tronçon sélectionné est la référence)",
    };
  }

  let currentNodes = nodes.map((n) => ({ ...n }));
  let affectedCount = 0;

  for (const tgtId of targetSegIds) {
    const tgt = segments.find((s) => s.id === tgtId);
    if (!tgt) continue;

    const ta = currentNodes.find((n) => n.id === tgt.fromNodeId);
    const tb = currentNodes.find((n) => n.id === tgt.toNodeId);
    if (!ta || !tb) continue;

    const tVec = { x: tb.x - ta.x, y: tb.y - ta.y, z: (tb.z || 0) - (ta.z || 0) };
    const tLen = Math.max(0.05, tgt.length || Math.hypot(tVec.x, tVec.y, tVec.z));

    // Conserver le sens général d'écoulement du tube si désiré
    const dot = tVec.x * uDir.x + tVec.y * uDir.y + tVec.z * uDir.z;
    const sign = preserveDirectionSense && dot < 0 ? -1 : 1;
    const finalDir = { x: uDir.x * sign, y: uDir.y * sign, z: uDir.z * sign };

    if (pivotAnchor === "to") {
      // Pivot autour de toNodeId (tb reste fixe, ta bouge)
      const pnx = pdiRound3(tb.x - finalDir.x * tLen);
      const pny = pdiRound3(tb.y - finalDir.y * tLen);
      const pnz = pdiRound3((tb.z || 0) - finalDir.z * tLen);
      currentNodes = currentNodes.map((n) => (n.id === ta.id ? { ...n, x: pnx, y: pny, z: pnz } : n));
    } else if (pivotAnchor === "midpoint") {
      // Pivot autour du milieu (les 2 extrémités se déplacent symétriquement)
      const mx = (ta.x + tb.x) / 2;
      const my = (ta.y + tb.y) / 2;
      const mz = ((ta.z || 0) + (tb.z || 0)) / 2;
      const halfLen = tLen / 2;

      const nax = pdiRound3(mx - finalDir.x * halfLen);
      const nay = pdiRound3(my - finalDir.y * halfLen);
      const naz = pdiRound3(mz - finalDir.z * halfLen);

      const nbx = pdiRound3(mx + finalDir.x * halfLen);
      const nby = pdiRound3(my + finalDir.y * halfLen);
      const nbz = pdiRound3(mz + finalDir.z * halfLen);

      currentNodes = currentNodes.map((n) => {
        if (n.id === ta.id) return { ...n, x: nax, y: nay, z: naz };
        if (n.id === tb.id) return { ...n, x: nbx, y: nby, z: nbz };
        return n;
      });
    } else {
      // Pivot par défaut : "from" (ta reste fixe, tb bouge + aval suit)
      const pnx = pdiRound3(ta.x + finalDir.x * tLen);
      const pny = pdiRound3(ta.y + finalDir.y * tLen);
      const pnz = pdiRound3((ta.z || 0) + finalDir.z * tLen);
      const pdx = pdiRound3(pnx - tb.x);
      const pdy = pdiRound3(pny - tb.y);
      const pdz = pdiRound3(pnz - (tb.z || 0));

      const downstream = getDownstreamNodeIds(tb.id, segments, tgt.id);

      currentNodes = currentNodes.map((node) => {
        if (node.id === tb.id) return { ...node, x: pnx, y: pny, z: pnz };
        if (!downstream.has(node.id)) return node;
        return {
          ...node,
          x: pdiRound3(node.x + pdx),
          y: pdiRound3(node.y + pdy),
          z: pdiRound3((node.z || 0) + pdz),
        };
      });
    }

    affectedCount++;
  }

  // Contrôle QA anti-collision
  const auditConflict = pdiFindCoincidentNodes(currentNodes, 0.001);
  if (auditConflict) {
    return {
      success: false,
      nextNodes: nodes,
      affectedSegmentCount: 0,
      directionLabel: uDir.label,
      message: `Rendre parallèle refusé : ${auditConflict}`,
    };
  }

  return {
    success: true,
    nextNodes: currentNodes,
    affectedSegmentCount: affectedCount,
    directionLabel: uDir.label,
    message: `Parallèle appliqué sur ${affectedCount} tube(s) · Direction : ${uDir.label} (Pivot: ${pivotAnchor})`,
  };
}

export interface ObjectAlignParams {
  nodes: IsoNode[];
  segments: IsoSegment[];
  refSegmentId?: string;
  refNodeId?: string;
  targetSegmentId?: string;
  targetNodeId?: string;
  targetNodeIds?: string[];
  scaleMode?: "keep" | "match"; // "keep": conserver même échelle/longueur; "match": prendre l'échelle/longueur de l'objet référence
}

export interface ObjectAlignOutput {
  success: boolean;
  nextNodes: IsoNode[];
  message: string;
  refLabel: string;
  targetLabel: string;
  scaleApplied: "keep" | "match";
}

/**
 * ALIGNEMENT RELATIF À UN OBJET & SON ORIENTATION (AutoCAD / CAO Tuyauterie)
 * Aligne l'objet cible (tronçon ou équipement/nœud) par rapport à l'axe et l'orientation
 * de l'objet de référence, avec choix interactif d'échelle (garder ou adopter l'échelle).
 */
export function performObjectAlign(params: ObjectAlignParams): ObjectAlignOutput {
  const {
    nodes,
    segments,
    refSegmentId,
    refNodeId,
    targetSegmentId,
    targetNodeId,
    targetNodeIds = [],
    scaleMode = "keep",
  } = params;

  const nodeMap = new Map<string, IsoNode>(nodes.map((n) => [n.id, n]));

  // 1. Extraire la géométrie de référence (droite support + vecteur unitaire + longueur)
  let refA: IsoNode | undefined;
  let refB: IsoNode | undefined;
  let refLabel = "Objet de référence";

  if (refSegmentId) {
    const seg = segments.find((s) => s.id === refSegmentId);
    if (!seg) {
      return { success: false, nextNodes: nodes, message: "Tronçon de référence introuvable", refLabel: "", targetLabel: "", scaleApplied: scaleMode };
    }
    refA = nodeMap.get(seg.fromNodeId);
    refB = nodeMap.get(seg.toNodeId);
    refLabel = `Tube ${seg.tag || seg.id} (${refA?.name || "?"} ➔ ${refB?.name || "?"})`;
  } else if (refNodeId) {
    refA = nodeMap.get(refNodeId);
    refLabel = `Nœud/Équipement ${refA?.name || refNodeId}`;
  }

  if (!refA) {
    return { success: false, nextNodes: nodes, message: "Référence d'alignement introuvable", refLabel: "", targetLabel: "", scaleApplied: scaleMode };
  }

  // Vecteur directeur de référence
  let uDir: { x: number; y: number; z: number };
  let refLength = 1.0;
  let refAngleDeg = 0;

  if (refB) {
    const vx = refB.x - refA.x;
    const vy = refB.y - refA.y;
    const vz = (refB.z || 0) - (refA.z || 0);
    refLength = Math.hypot(vx, vy, vz) || 1.0;
    uDir = { x: vx / refLength, y: vy / refLength, z: vz / refLength };
    refAngleDeg = ((Math.atan2(vy, vx) * 180) / Math.PI + 360) % 360;
  } else {
    // Si la référence est un équipement avec rotation
    const rot = refA.rotation || 0;
    const rad = (rot * Math.PI) / 180;
    uDir = { x: Math.cos(rad), y: Math.sin(rad), z: 0 };
    refAngleDeg = rot;
  }

  // 2. Traitement selon la cible (tronçon cible OU équipement/nœud cible)
  let currentNodes = nodes.map((n) => ({ ...n }));
  let targetLabel = "Objet cible";

  if (targetSegmentId) {
    const tgtSeg = segments.find((s) => s.id === targetSegmentId);
    if (!tgtSeg) {
      return { success: false, nextNodes: nodes, message: "Tronçon cible introuvable", refLabel, targetLabel: "", scaleApplied: scaleMode };
    }
    const ta = nodeMap.get(tgtSeg.fromNodeId);
    const tb = nodeMap.get(tgtSeg.toNodeId);
    if (!ta || !tb) {
      return { success: false, nextNodes: nodes, message: "Nœuds du tronçon cible introuvables", refLabel, targetLabel: "", scaleApplied: scaleMode };
    }
    targetLabel = `Tube ${tgtSeg.tag || tgtSeg.id} (${ta.name} ➔ ${tb.name})`;

    const origTgtVec = { x: tb.x - ta.x, y: tb.y - ta.y, z: (tb.z || 0) - (ta.z || 0) };
    const origTgtLen = Math.hypot(origTgtVec.x, origTgtVec.y, origTgtVec.z) || tgtSeg.length || 1.0;

    // Choix d'échelle :
    // - "keep" : conserve l'échelle / longueur d'origine du tronçon cible
    // - "match" : adopte l'échelle / longueur exacte de l'objet de référence
    const targetLength = scaleMode === "match" ? refLength : origTgtLen;

    // Positionnement colinéaire / dans l'axe de la référence :
    // Si la référence est un segment distinct, on aligne ta sur la droite de référence
    // en projetant le point ta sur la droite de refA avec un décalage ou au bout de refB
    let newTaX: number;
    let newTaY: number;
    let newTaZ: number;

    if (refB && tgtSeg.id !== refSegmentId) {
      // Projection orthogonale de ta sur la droite (refA -> refB)
      const dot = (ta.x - refA.x) * uDir.x + (ta.y - refA.y) * uDir.y + ((ta.z || 0) - (refA.z || 0)) * uDir.z;
      // Pour éviter de superposer exactement les nœuds s'ils sont proches, projeter sur l'axe
      newTaX = pdiRound3(refA.x + dot * uDir.x);
      newTaY = pdiRound3(refA.y + dot * uDir.y);
      newTaZ = pdiRound3((refA.z || 0) + dot * uDir.z);

      // Si ta est très proche de refB, on le cale en continuité directe
      const distToRefB = Math.hypot(ta.x - refB.x, ta.y - refB.y, (ta.z || 0) - (refB.z || 0));
      if (distToRefB < 0.25) {
        newTaX = refB.x;
        newTaY = refB.y;
        newTaZ = refB.z || 0;
      }
    } else {
      newTaX = ta.x;
      newTaY = ta.y;
      newTaZ = ta.z || 0;
    }

    const newTbX = pdiRound3(newTaX + uDir.x * targetLength);
    const newTbY = pdiRound3(newTaY + uDir.y * targetLength);
    const newTbZ = pdiRound3(newTaZ + uDir.z * targetLength);

    const deltaTbX = pdiRound3(newTbX - tb.x);
    const deltaTbY = pdiRound3(newTbY - tb.y);
    const deltaTbZ = pdiRound3(newTbZ - (tb.z || 0));

    const downstream = getDownstreamNodeIds(tb.id, segments, tgtSeg.id);

    currentNodes = currentNodes.map((n) => {
      if (n.id === ta.id) {
        return { ...n, x: newTaX, y: newTaY, z: newTaZ };
      }
      if (n.id === tb.id) {
        return { ...n, x: newTbX, y: newTbY, z: newTbZ };
      }
      if (downstream.has(n.id)) {
        return {
          ...n,
          x: pdiRound3(n.x + deltaTbX),
          y: pdiRound3(n.y + deltaTbY),
          z: pdiRound3((n.z || 0) + deltaTbZ),
        };
      }
      return n;
    });

  } else if (targetNodeId || targetNodeIds.length > 0) {
    const tgtIds = targetNodeId ? [targetNodeId] : targetNodeIds;
    targetLabel = tgtIds.length === 1 ? (nodeMap.get(tgtIds[0])?.name || tgtIds[0]) : `${tgtIds.length} nœuds`;

    currentNodes = currentNodes.map((n) => {
      if (!tgtIds.includes(n.id)) return n;
      // Pour un nœud / équipement cible :
      // 1. Projeter sa position sur la droite support de l'objet référence
      const dot = (n.x - refA.x) * uDir.x + (n.y - refA.y) * uDir.y + ((n.z || 0) - (refA.z || 0)) * uDir.z;
      const projX = pdiRound3(refA.x + dot * uDir.x);
      const projY = pdiRound3(refA.y + dot * uDir.y);
      const projZ = pdiRound3((refA.z || 0) + dot * uDir.z);

      // 2. Orienter l'équipement selon l'orientation exacte de la référence
      const nextRotation = n.equipmentType ? refAngleDeg : n.rotation;

      return {
        ...n,
        x: projX,
        y: projY,
        z: projZ,
        rotation: nextRotation,
      };
    });
  } else {
    return { success: false, nextNodes: nodes, message: "Aucun objet cible sélectionné pour l'alignement", refLabel, targetLabel: "", scaleApplied: scaleMode };
  }

  const scaleMsg = scaleMode === "match"
    ? `Échelle ajustée sur référence (${refLength.toFixed(2)}m)`
    : "Échelle d'origine conservée";

  return {
    success: true,
    nextNodes: currentNodes,
    refLabel,
    targetLabel,
    scaleApplied: scaleMode,
    message: `Alignement réussi : ${targetLabel} aligné sur ${refLabel} · Angle: ${refAngleDeg.toFixed(1)}° (${scaleMsg})`,
  };
}

/**
 * PARALLÈLE RELATIF À UN TRONÇON DE RÉFÉRENCE (Orientation exacte, sans snap cartésien)
 */
export function performObjectParallel(params: {
  nodes: IsoNode[];
  segments: IsoSegment[];
  refSegmentId: string;
  targetSegmentId: string;
  pivotAnchor?: "from" | "to" | "midpoint";
}): {
  success: boolean;
  nextNodes: IsoNode[];
  message: string;
  refLabel: string;
  targetLabel: string;
  refAngleDeg: number;
} {
  const { nodes, segments, refSegmentId, targetSegmentId, pivotAnchor = "from" } = params;

  const nodeMap = new Map<string, IsoNode>(nodes.map((n) => [n.id, n]));
  const refSeg = segments.find((s) => s.id === refSegmentId);
  const tgtSeg = segments.find((s) => s.id === targetSegmentId);

  if (!refSeg || !tgtSeg) {
    return {
      success: false,
      nextNodes: nodes,
      message: "Tronçon de référence ou cible introuvable",
      refLabel: "",
      targetLabel: "",
      refAngleDeg: 0,
    };
  }

  const ra = nodeMap.get(refSeg.fromNodeId);
  const rb = nodeMap.get(refSeg.toNodeId);
  const ta = nodeMap.get(tgtSeg.fromNodeId);
  const tb = nodeMap.get(tgtSeg.toNodeId);

  if (!ra || !rb || !ta || !tb) {
    return {
      success: false,
      nextNodes: nodes,
      message: "Nœuds des tronçons introuvables",
      refLabel: "",
      targetLabel: "",
      refAngleDeg: 0,
    };
  }

  // Vecteur directeur exact du tronçon de référence (SANS AUCUN ARRONDI D'AXE OU SNAP ISO)
  const rvx = rb.x - ra.x;
  const rvy = rb.y - ra.y;
  const rvz = (rb.z || 0) - (ra.z || 0);
  const rLen = Math.hypot(rvx, rvy, rvz) || 1.0;
  const uDir = { x: rvx / rLen, y: rvy / rLen, z: rvz / rLen };
  const refAngleDeg = ((Math.atan2(rvy, rvx) * 180) / Math.PI + 360) % 360;

  // Longueur du tronçon cible (strictement préservée)
  const tvx = tb.x - ta.x;
  const tvy = tb.y - ta.y;
  const tvz = (tb.z || 0) - (ta.z || 0);
  const tLen = Math.hypot(tvx, tvy, tvz) || tgtSeg.length || 1.0;

  // Conserver le sens d'écoulement si dot product négatif
  const dot = tvx * uDir.x + tvy * uDir.y + tvz * uDir.z;
  const sign = dot < 0 ? -1 : 1;
  const finalDir = { x: uDir.x * sign, y: uDir.y * sign, z: uDir.z * sign };

  let currentNodes = nodes.map((n) => ({ ...n }));

  if (pivotAnchor === "to") {
    // tb reste fixe, ta bouge
    const nax = pdiRound3(tb.x - finalDir.x * tLen);
    const nay = pdiRound3(tb.y - finalDir.y * tLen);
    const naz = pdiRound3((tb.z || 0) - finalDir.z * tLen);
    currentNodes = currentNodes.map((n) => (n.id === ta.id ? { ...n, x: nax, y: nay, z: naz } : n));
  } else if (pivotAnchor === "midpoint") {
    // Milieu reste fixe, les deux extrémités pivotent
    const mx = (ta.x + tb.x) / 2;
    const my = (ta.y + tb.y) / 2;
    const mz = ((ta.z || 0) + (tb.z || 0)) / 2;
    const half = tLen / 2;
    const nax = pdiRound3(mx - finalDir.x * half);
    const nay = pdiRound3(my - finalDir.y * half);
    const naz = pdiRound3(mz - finalDir.z * half);
    const nbx = pdiRound3(mx + finalDir.x * half);
    const nby = pdiRound3(my + finalDir.y * half);
    const nbz = pdiRound3(mz + finalDir.z * half);
    currentNodes = currentNodes.map((n) => {
      if (n.id === ta.id) return { ...n, x: nax, y: nay, z: naz };
      if (n.id === tb.id) return { ...n, x: nbx, y: nby, z: nbz };
      return n;
    });
  } else {
    // Pivot "from" : ta reste fixe, tb bouge et le sous-réseau aval suit
    const nbx = pdiRound3(ta.x + finalDir.x * tLen);
    const nby = pdiRound3(ta.y + finalDir.y * tLen);
    const nbz = pdiRound3((ta.z || 0) + finalDir.z * tLen);
    const pdx = pdiRound3(nbx - tb.x);
    const pdy = pdiRound3(nby - tb.y);
    const pdz = pdiRound3(nbz - (tb.z || 0));

    const downstream = getDownstreamNodeIds(tb.id, segments, tgtSeg.id);

    currentNodes = currentNodes.map((n) => {
      if (n.id === tb.id) return { ...n, x: nbx, y: nby, z: nbz };
      if (!downstream.has(n.id)) return n;
      return {
        ...n,
        x: pdiRound3(n.x + pdx),
        y: pdiRound3(n.y + pdy),
        z: pdiRound3((n.z || 0) + pdz),
      };
    });
  }

  const refLabel = `Tube ${refSeg.tag || refSeg.id} (${ra.name} ➔ ${rb.name})`;
  const tgtLabel = `Tube ${tgtSeg.tag || tgtSeg.id} (${ta.name} ➔ ${tb.name})`;

  return {
    success: true,
    nextNodes: currentNodes,
    refLabel,
    targetLabel: tgtLabel,
    refAngleDeg,
    message: `Parallèle réussi : ${tgtLabel} est maintenant parfaitement parallèle à ${refLabel} (Angle: ${refAngleDeg.toFixed(1)}°, Longueur: ${tLen.toFixed(2)}m)`,
  };
}

