/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * COPYRIGHT (C) 2026 ORTHOGONAL - ENG. ALL RIGHTS RESERVED.
 * PROPRIETARY INDUSTRIAL PIPING CAD & ISOMETRIC ENGINE.
 * TOPOLOGY & GRAPH MATHEMATICS CORE MODULE.
 */

import {
  IsoNode,
  IsoSegment,
  IsoPort,
  IsoFittingType,
  JointConnectionType,
  PipingJoint,
  GraphIssue,
  PipingLine,
  FITTING_LABELS,
  FITTING_TYPES,
} from "../types/isoGraphTypes";
import { pdiNodeHasFaceOffset017P3 } from "../engine/pdiAxes017P3";

export const DEFAULT_LINE_ID = "line_default";

export const pdiUid = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const pdiClamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

export function elbowAngle(type: IsoFittingType): number {
  if (type === "coude_90") return 90;
  if (type === "coude_45") return 45;
  if (type === "coude_30") return 30;
  if (type === "coude_22_5") return 22.5;
  return 0;
}

export function equipmentLabel(n: IsoNode): string {
  return n.equipmentLabel || (n.equipmentType ? FITTING_LABELS[n.equipmentType] : n.name);
}

export function defaultFreeNodePorts(): IsoPort[] {
  return [
    { id: pdiUid("port"), index: 0, role: "aux", dx: -1, dy: 0, dz: 0 },
    { id: pdiUid("port"), index: 1, role: "aux", dx: 1, dy: 0, dz: 0 },
    { id: pdiUid("port"), index: 2, role: "aux", dx: 0, dy: -1, dz: 0 },
    { id: pdiUid("port"), index: 3, role: "aux", dx: 0, dy: 1, dz: 0 },
    { id: pdiUid("port"), index: 4, role: "aux", dx: 0, dy: 0, dz: 1 },
    { id: pdiUid("port"), index: 5, role: "aux", dx: 0, dy: 0, dz: -1 },
  ];
}

export function defaultEquipmentPorts(type: IsoFittingType): IsoPort[] {
  const bend = elbowAngle(type);
  if (bend) {
    const a = (bend * Math.PI) / 180;
    return [
      { id: pdiUid("port"), index: 0, role: "inline-in", dx: -1, dy: 0, dz: 0 },
      { id: pdiUid("port"), index: 1, role: "inline-out", dx: Math.cos(a), dy: Math.sin(a), dz: 0 },
    ];
  }
  if (type === "te_egal" || type === "te_reduit" || type === "piquage") {
    return [
      { id: pdiUid("port"), index: 0, role: "inline-in", dx: -1, dy: 0, dz: 0 },
      { id: pdiUid("port"), index: 1, role: "inline-out", dx: 1, dy: 0, dz: 0 },
      { id: pdiUid("port"), index: 2, role: "branch", dx: 0, dy: -1, dz: 0 },
    ];
  }
  if (type === "jmi" || type.startsWith("bride") || type === "joint") {
    return [
      { id: pdiUid("port"), index: 0, role: "inline-in", dx: -1, dy: 0, dz: 0 },
      { id: pdiUid("port"), index: 1, role: "inline-out", dx: 1, dy: 0, dz: 0 },
    ];
  }
  if (
    type === "manometre" ||
    type === "prise_pression" ||
    type === "purge" ||
    type === "event" ||
    type === "soupape"
  ) {
    return [
      { id: pdiUid("port"), index: 0, role: "inline-in", dx: -1, dy: 0, dz: 0 },
      { id: pdiUid("port"), index: 1, role: "inline-out", dx: 1, dy: 0, dz: 0 },
      { id: pdiUid("port"), index: 2, role: "aux", dx: 0, dy: -1, dz: 0 },
    ];
  }
  return [
    { id: pdiUid("port"), index: 0, role: "inline-in", dx: -1, dy: 0, dz: 0 },
    { id: pdiUid("port"), index: 1, role: "inline-out", dx: 1, dy: 0, dz: 0 },
  ];
}

export function equipmentPortConnectionType(type: IsoFittingType, index: number): JointConnectionType {
  if (type === "bride_wn") return index === 0 ? "butt_weld" : "flanged";
  if (type === "bride_so") return index === 0 ? "fillet_weld" : "flanged";
  if (type === "joint" || type === "jmi") return "mechanical";
  if (
    (type === "manometre" || type === "prise_pression" || type === "purge" || type === "event") &&
    index === 2
  ) {
    return "threaded";
  }
  return "butt_weld";
}

export function makeEquipmentNode(
  type: IsoFittingType,
  name: string,
  x: number,
  y: number,
  z: number,
  dn: number,
  rotation = 0
): IsoNode {
  return {
    id: pdiUid("equip"),
    name,
    x,
    y,
    z,
    type: type === "te_egal" || type === "te_reduit" || type === "piquage" ? "tee" : "normal",
    equipmentType: type,
    equipmentLabel: name,
    dn,
    rotation,
    ports: defaultEquipmentPorts(type).map((port) => ({
      ...port,
      connectionType: equipmentPortConnectionType(type, port.index),
      endPreparation:
        equipmentPortConnectionType(type, port.index) === "flanged" ? "flange_face" : "bevel",
    })),
  };
}

export function pointOnSegment(a: IsoNode, b: IsoNode, t: number) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

export function portByIndex(node: IsoNode | undefined, index: number) {
  return node?.ports?.find((p) => p.index === index);
}

export function availablePortId(node: IsoNode | undefined, segments: IsoSegment[], preferred: number) {
  if (!node?.ports?.length) return undefined;
  const used = new Set(
    segments.flatMap((s) => [s.fromPortId, s.toPortId].filter((id): id is string => !!id))
  );
  return (
    node.ports.find((p) => p.index === preferred && !used.has(p.id))?.id ||
    node.ports.find((p) => !used.has(p.id))?.id ||
    node.ports.find((p) => p.index === preferred)?.id ||
    node.ports[0]?.id
  );
}

export function portWorldPosition(node: IsoNode, portId?: string) {
  const port = node.ports?.find((p) => p.id === portId);
  if (!port) return { x: node.x, y: node.y, z: node.z };
  if (!pdiNodeHasFaceOffset017P3(node)) return { x: node.x, y: node.y, z: node.z };
  let portDx = port.dx,
    portDy = port.dy;
  const bend = node.equipmentType ? elbowAngle(node.equipmentType) : 0;
  if (bend && port.index === 0) {
    portDx = -1;
    portDy = 0;
  }
  if (bend && port.index === 1) {
    const portAngle = ((bend * (node.bendDirection || 1)) * Math.PI) / 180;
    portDx = Math.cos(portAngle);
    portDy = Math.sin(portAngle);
  }
  const angle = ((node.rotation || 0) * Math.PI) / 180;
  const c = Math.cos(angle),
    sin = Math.sin(angle);
  const half = Math.max(0.08, (node.length || 0.4) / 2);
  return {
    x: node.x + (portDx * c - portDy * sin) * half,
    y: node.y + (portDx * sin + portDy * c) * half,
    z: node.z + port.dz * half,
  };
}

export function segmentEndpoints(segment: IsoSegment, nodes: IsoNode[]) {
  const fromNode = nodes.find((n) => n.id === segment.fromNodeId);
  const toNode = nodes.find((n) => n.id === segment.toNodeId);
  if (!fromNode || !toNode) return null;
  return {
    fromNode,
    toNode,
    from: portWorldPosition(fromNode, segment.fromPortId),
    to: portWorldPosition(toNode, segment.toPortId),
  };
}

export function inferJointType(node: IsoNode | undefined, portId?: string): JointConnectionType {
  const explicit = node?.ports?.find((port) => port.id === portId)?.connectionType;
  if (explicit) return explicit;
  const type = node?.equipmentType;
  if (!type) return "unknown";
  return equipmentPortConnectionType(type, node?.ports?.find((port) => port.id === portId)?.index || 0);
}

export const isWeldableConnection = (type: JointConnectionType) =>
  type === "butt_weld" || type === "socket_weld" || type === "fillet_weld";

export function deriveProjectJoints(nodes: IsoNode[], segments: IsoSegment[]): PipingJoint[] {
  let weldIndex = 1;
  const joints: PipingJoint[] = [];
  for (const seg of segments) {
    for (const endpoint of ["from", "to"] as const) {
      const nodeId = endpoint === "from" ? seg.fromNodeId : seg.toNodeId;
      const portId = endpoint === "from" ? seg.fromPortId : seg.toPortId;
      if (!portId) continue;
      const connectionType = inferJointType(
        nodes.find((n) => n.id === nodeId),
        portId
      );
      const weldable = isWeldableConnection(connectionType);
      joints.push({
        id: `joint_${seg.id}_${endpoint}`,
        segmentId: seg.id,
        endpoint,
        nodeId,
        portId,
        lineId: seg.lineId || DEFAULT_LINE_ID,
        connectionType,
        weldNumber: weldable ? `W${String(weldIndex++).padStart(3, "0")}` : undefined,
        location: weldable ? "shop" : undefined,
      });
    }
  }
  return joints;
}

export function validateProjectGraph(
  nodes: IsoNode[],
  segments: IsoSegment[],
  lines: PipingLine[]
): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const lineIds = new Set(lines.map((l) => l.id));
  const portUsage = new Map<string, number>();

  for (const seg of segments) {
    const from = nodeById.get(seg.fromNodeId),
      to = nodeById.get(seg.toNodeId);
    if (!from)
      issues.push({
        id: `missing_from_${seg.id}`,
        severity: "error",
        code: "MISSING_NODE",
        message: `Tronçon ${seg.id}: nœud origine absent`,
        entityId: seg.id,
      });
    if (!to)
      issues.push({
        id: `missing_to_${seg.id}`,
        severity: "error",
        code: "MISSING_NODE",
        message: `Tronçon ${seg.id}: nœud destination absent`,
        entityId: seg.id,
      });
    if (!seg.fromPortId || !from?.ports?.some((p) => p.id === seg.fromPortId))
      issues.push({
        id: `from_port_${seg.id}`,
        severity: "error",
        code: "MISSING_PORT",
        message: `Tronçon ${seg.id}: port origine invalide`,
        entityId: seg.id,
      });
    if (!seg.toPortId || !to?.ports?.some((p) => p.id === seg.toPortId))
      issues.push({
        id: `to_port_${seg.id}`,
        severity: "error",
        code: "MISSING_PORT",
        message: `Tronçon ${seg.id}: port destination invalide`,
        entityId: seg.id,
      });
    if (seg.fromPortId) portUsage.set(seg.fromPortId, (portUsage.get(seg.fromPortId) || 0) + 1);
    if (seg.toPortId) portUsage.set(seg.toPortId, (portUsage.get(seg.toPortId) || 0) + 1);
    if (!lineIds.has(seg.lineId || DEFAULT_LINE_ID))
      issues.push({
        id: `line_${seg.id}`,
        severity: "error",
        code: "MISSING_LINE",
        message: `Tronçon ${seg.id}: ligne de tuyauterie absente`,
        entityId: seg.id,
      });
    if (seg.length <= 0.001)
      issues.push({
        id: `length_${seg.id}`,
        severity: "error",
        code: "ZERO_LENGTH",
        message: `Tronçon ${seg.id}: longueur nulle`,
        entityId: seg.id,
      });
    if (from?.dn && from.dn !== seg.dn)
      issues.push({
        id: `dn_from_${seg.id}`,
        severity: "warning",
        code: "DN_MISMATCH",
        message: `DN différent entre ${from.name} et le tronçon`,
        entityId: seg.id,
      });
    if (to?.dn && to.dn !== seg.dn)
      issues.push({
        id: `dn_to_${seg.id}`,
        severity: "warning",
        code: "DN_MISMATCH",
        message: `DN différent entre ${to.name} et le tronçon`,
        entityId: seg.id,
      });
  }

  for (const [portId, count] of portUsage) {
    if (count > 1)
      issues.push({
        id: `port_capacity_${portId}`,
        severity: "error",
        code: "PORT_CAPACITY",
        message: `Port ${portId} connecté ${count} fois`,
        entityId: portId,
      });
  }

  for (const node of nodes) {
    if (
      node.equipmentType &&
      !segments.some((s) => s.fromNodeId === node.id || s.toNodeId === node.id)
    ) {
      issues.push({
        id: `isolated_${node.id}`,
        severity: "warning",
        code: "ISOLATED_EQUIPMENT",
        message: `${equipmentLabel(node)} n’est raccordé à aucun tronçon`,
        entityId: node.id,
      });
    }
  }

  return issues;
}
