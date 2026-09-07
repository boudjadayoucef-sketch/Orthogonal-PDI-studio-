/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * UNIVERSAL CAO ENTITY ADAPTER
 * 
 * Passerelle universelle de lecture et mise à jour bidirectionnelle :
 * Convertit un Nœud, Segment, Fitting, Support ou Entité 2D en PdiUniversalEntity
 * et applique toute modification de façon atomique et cohérente sur le graphe.
 */

import type {
  IsoNode,
  IsoSegment,
  IsoFitting,
  Cad2dEntity,
  IsoFittingType,
} from "../isometric/types/isoGraphTypes";
import type { IsoPipingSupport } from "../isometric/supports/pdiMssSupportEngine";
import {
  PdiUniversalEntity,
  UniversalEntityCategory,
  INDUSTRIAL_STANDARD_DNS,
} from "./pdiUniversalEntity";

function getInchFromDn(dn: number): string {
  const match = INDUSTRIAL_STANDARD_DNS.find((d) => d.dn === dn);
  return match ? match.inch : `${(dn / 25.4).toFixed(1)}"`;
}

function getOdFromDn(dn: number): number {
  const match = INDUSTRIAL_STANDARD_DNS.find((d) => d.dn === dn);
  return match ? match.od : Number((dn * 1.05).toFixed(1));
}

export function nodeToUniversalEntity(
  node: IsoNode,
  linkedSegments: IsoSegment[] = []
): PdiUniversalEntity {
  const isEquipment = !!node.equipmentType;
  let category: UniversalEntityCategory = "node";
  const eqType = (node.equipmentType || "") as string;

  if (eqType.includes("vanne") || eqType.includes("clapet") || eqType.includes("soupape") || eqType.includes("robinet")) {
    category = "valve";
  } else if (eqType.includes("te_") || eqType.includes("piquage") || eqType.includes("weldolet") || eqType.includes("sockolet") || eqType.includes("croix")) {
    category = "fitting";
  } else if (eqType.includes("coude")) {
    category = "fitting";
  } else if (eqType.includes("bride") || eqType.includes("joint")) {
    category = "flange";
  } else if (isEquipment) {
    category = "equipment";
  }

  const primaryDn = node.dn || linkedSegments[0]?.dn || 50;

  return {
    identity: {
      id: node.id,
      type: node.equipmentType || node.type || "node",
      category,
      name: node.name || node.equipmentLabel || node.id,
      labelFr: node.equipmentLabel || node.name || "Nœud / Composant",
      description: `Composant tuyauterie ${node.equipmentType || node.type}`,
      locked: false,
    },
    geometry: {
      x: Number((node.x || 0).toFixed(3)),
      y: Number((node.y || 0).toFixed(3)),
      z: Number((node.z || 0).toFixed(3)),
      rotation: node.rotation || 0,
      elevation: Number((node.z || 0).toFixed(3)),
      branchAngle: node.branchAngle,
      mirrored: !!node.mirrored,
      bendDirection: node.bendDirection,
      length: node.length,
    },
    connection: {
      connectedSegmentIds: linkedSegments.map((s) => s.id),
      ports: (node.ports || []).map((p, idx) => ({
        portId: p.id || `port-${idx}`,
        index: p.index ?? idx,
        role: (p.role === "branch" ? "branch" : p.role === "inline-out" ? "out" : "in") as any,
        connectionType: p.connectionType as any,
        endPreparation: p.endPreparation,
      })),
      connectionType: "inline",
    },
    dn: {
      dn: primaryDn,
      inch: getInchFromDn(primaryDn),
      outerDiameterMm: getOdFromDn(primaryDn),
      reducedDn: (node as any).reducedDn || undefined,
      reducedInch: (node as any).reducedDn ? getInchFromDn((node as any).reducedDn) : undefined,
      unit: "mm",
    },
    pn: {
      rating: (node as any).pn || linkedSegments[0]?.pn || "Class 150",
      designPressureBar: (node as any).designPressureBar || 16,
      operatingPressureBar: (node as any).operatingPressureBar || 10,
    },
    material: {
      grade: (node as any).material || linkedSegments[0]?.material || "Acier API 5L X52",
      schedule: (node as any).schedule || "SCH 40 / STD",
      wallThicknessMm: (node as any).wallThicknessMm || 6.35,
    },
    service: {
      code: node.service || linkedSegments[0]?.service || "PROC",
      description: (node as any).serviceDescription || "Fluide procédé",
    },
    spec: {
      pmsCode: node.spec || linkedSegments[0]?.spec || "PMS-01",
      classRating: (node as any).pn || "Class 150",
    },
    tag: {
      fullTag: node.tag || node.name || node.id,
      lineId: node.lineId || linkedSegments[0]?.lineId,
    },
    fabrication: {
      location: (node as any).fabricationLocation || "shop",
      spoolNumber: (node as any).spoolNumber || "SP-01",
      weldType: "butt_weld",
      ndtRequirement: "VT",
    },
    documentation: {
      catalogRef: node.reference || "",
      manufacturer: node.manufacturer || "",
      notes: (node as any).notes || "",
    },
    specific: {
      valve: category === "valve" ? {
        flowType: (node as any).flowType || "passage_total",
        actuatorType: (node as any).actuatorType || "manuel_volant",
        faceToFaceMm: (node as any).faceToFaceMm || Math.round(primaryDn * 2.5),
        flowCoefficientKv: (node as any).flowCoefficientKv || Math.round(primaryDn * 1.8),
      } : undefined,
      tee: category === "fitting" && eqType.includes("te") ? {
        teeType: eqType.includes("reduit") ? "reduit" : eqType.includes("barre") ? "barre_raclable" : "egal",
        runDn: primaryDn,
        branchDn: (node as any).reducedDn || primaryDn,
        branchAngle: node.branchAngle || 90,
      } : undefined,
      elbow: category === "fitting" && eqType.includes("coude") ? {
        angle: eqType.includes("45") ? 45 : eqType.includes("30") ? 30 : eqType.includes("22_5") ? 22.5 : 90,
        radiusType: eqType.includes("3d") ? "3D" : eqType.includes("5d") ? "5D" : "1.5D_LR",
      } : undefined,
      flange: category === "flange" ? {
        flangeType: eqType.includes("so") ? "SO" : eqType.includes("pleine") ? "BL" : "WN",
        facing: "RF",
      } : undefined,
    },
  };
}

export function segmentToUniversalEntity(
  seg: IsoSegment,
  fromNode?: IsoNode,
  toNode?: IsoNode
): PdiUniversalEntity {
  const fromName = fromNode?.name || seg.fromNodeId;
  const toName = toNode?.name || seg.toNodeId;

  return {
    identity: {
      id: seg.id,
      type: "pipe",
      category: "pipe",
      name: seg.tag || seg.sourceName || `Tube DN${seg.dn} (${fromName} → ${toName})`,
      labelFr: `Tronçon de tuyauterie DN${seg.dn}`,
      description: `Tuyauterie ${seg.type === "riser" ? "colonne montante" : "ligne droite"} ${seg.material}`,
      locked: false,
    },
    geometry: {
      x: Number((fromNode?.x || 0).toFixed(3)),
      y: Number((fromNode?.y || 0).toFixed(3)),
      z: Number((fromNode?.z || 0).toFixed(3)),
      elevation: Number((fromNode?.z || 0).toFixed(3)),
      length: Number((seg.length || 0).toFixed(3)),
    },
    connection: {
      fromEntityId: seg.fromNodeId,
      toEntityId: seg.toNodeId,
      fromPortId: seg.fromPortId,
      toPortId: seg.toPortId,
      ports: [
        { portId: "in", index: 0, role: "in", connectionType: "butt_weld" },
        { portId: "out", index: 1, role: "out", connectionType: "butt_weld" },
      ],
      connectionType: "butt_weld",
    },
    dn: {
      dn: seg.dn || 50,
      inch: getInchFromDn(seg.dn || 50),
      outerDiameterMm: getOdFromDn(seg.dn || 50),
      unit: "mm",
    },
    pn: {
      rating: seg.pn || seg.pressureClass || "Class 150",
      designPressureBar: (seg as any).designPressure || 16,
      operatingPressureBar: (seg as any).operatingPressure || 10,
    },
    material: {
      grade: seg.material || "Acier API 5L X52",
      schedule: (seg as any).schedule || "SCH 40 / STD",
      wallThicknessMm: (seg as any).wallThicknessMm || 6.35,
    },
    service: {
      code: seg.service || "PROC",
      description: (seg as any).serviceDescription || "Fluide procédé",
    },
    spec: {
      pmsCode: seg.spec || "PMS-01",
      classRating: seg.pn || "Class 150",
    },
    tag: {
      fullTag: seg.tag || `L-${seg.dn}`,
      lineId: seg.lineId,
    },
    fabrication: {
      location: (seg as any).fabricationLocation || "shop",
      spoolNumber: (seg as any).spoolNumber || "SP-01",
      weldType: "butt_weld",
      ndtRequirement: "VT",
    },
    documentation: {
      catalogRef: (seg as any).catalogRef || "",
      manufacturer: (seg as any).manufacturer || "Vallourec / Mannesmann",
      notes: (seg as any).notes || "",
    },
    specific: {
      pipe: {
        type: seg.type,
        insulation: !!seg.insulation,
        insulationThicknessMm: (seg as any).insulationThicknessMm || 30,
        color: seg.color,
      },
    },
  };
}

export function fittingToUniversalEntity(
  fitting: IsoFitting,
  parentSegment: IsoSegment
): PdiUniversalEntity {
  const fType = fitting.type;
  let category: UniversalEntityCategory = "fitting";

  if (fType.includes("vanne") || fType.includes("clapet") || fType.includes("soupape") || fType.includes("robinet")) {
    category = "valve";
  } else if (fType.includes("bride") || fType.includes("joint")) {
    category = "flange";
  }

  const dn = fitting.dn || parentSegment.dn || 50;

  return {
    identity: {
      id: fitting.id,
      type: fitting.type,
      category,
      name: fitting.label || fitting.type,
      labelFr: fitting.label || "Raccord en ligne",
      description: `Raccord ${fitting.type} sur tronçon ${parentSegment.id}`,
    },
    geometry: {
      x: 0,
      y: 0,
      z: 0,
      length: fitting.length,
      rotation: fitting.orientation || 0,
    },
    connection: {
      fromEntityId: parentSegment.id,
      ports: [
        { portId: "p1", index: 0, role: "in", connectionType: "butt_weld" },
        { portId: "p2", index: 1, role: "out", connectionType: "butt_weld" },
      ],
      connectionType: "inline",
    },
    dn: {
      dn,
      inch: getInchFromDn(dn),
      outerDiameterMm: getOdFromDn(dn),
      unit: "mm",
    },
    pn: {
      rating: parentSegment.pn || "Class 150",
    },
    material: {
      grade: parentSegment.material || "Acier API 5L X52",
      schedule: "SCH 40 / STD",
    },
    service: {
      code: parentSegment.service || "PROC",
    },
    spec: {
      pmsCode: parentSegment.spec || "PMS-01",
    },
    tag: {
      fullTag: fitting.label || fitting.id,
      lineId: parentSegment.lineId,
    },
    fabrication: {
      location: "shop",
      spoolNumber: "SP-01",
      weldType: "butt_weld",
    },
    documentation: {
      catalogRef: fitting.reference || "",
      manufacturer: fitting.manufacturer || "",
    },
    specific: {
      valve: category === "valve" ? {
        flowType: "passage_total",
        actuatorType: "manuel_volant",
      } : undefined,
    },
  };
}

export function cad2dToUniversalEntity(cad: Cad2dEntity): PdiUniversalEntity {
  const firstPt = cad.points?.[0] || cad.center || { x: 0, y: 0 };

  return {
    identity: {
      id: cad.id,
      type: cad.type,
      category: "cad2d",
      name: cad.text || `${cad.type.toUpperCase()} 2D (${cad.id})`,
      labelFr: `Entité CAO 2D ${cad.type}`,
      description: `Dessin géométrique sur calque ${cad.layerId}`,
    },
    geometry: {
      x: Number((firstPt.x || 0).toFixed(3)),
      y: Number((firstPt.y || 0).toFixed(3)),
      z: 0,
      rotation: cad.rotation || 0,
      length: cad.length,
      width: cad.width,
      height: cad.height,
      radius: cad.radius,
      points: cad.points,
    },
    connection: {
      ports: [],
      connectionType: "mechanical",
    },
    dn: {
      dn: cad.metadata?.dn || 0,
      unit: "mm",
    },
    pn: {
      rating: "N/A",
    },
    material: {
      grade: "Standard CAD",
    },
    service: {
      code: "DRAFT",
    },
    spec: {
      pmsCode: "CAD-2D",
    },
    tag: {
      fullTag: cad.text || cad.id,
    },
    fabrication: {
      location: "shop",
    },
    documentation: {
      notes: cad.metadata?.intent || "Dessin d'axe ou structure génie civil",
    },
    specific: {
      cad2d: {
        layerId: cad.layerId,
        strokeColor: cad.color,
        strokeWidth: cad.lineWeight || 1.5,
        strokeDash: cad.lineType || "continuous",
        fillColor: cad.fill,
        fillOpacity: cad.fillOpacity,
        hatchPattern: cad.hatchPattern,
        fontSize: cad.fontSize,
        fontFamily: cad.fontFamily,
        textValue: cad.text,
      },
    },
  };
}

export function supportToUniversalEntity(sup: IsoPipingSupport, parentSegment?: IsoSegment | null): PdiUniversalEntity {
  const targetDn = parentSegment?.dn || (sup as any).dn || 100;
  return {
    identity: {
      id: sup.id,
      type: sup.type,
      category: "support",
      name: sup.tag,
      labelFr: `Supportage MSS SP-58 (${sup.tag})`,
      description: `Support tuyauterie MSS ${sup.type}`,
    },
    geometry: {
      x: Number((sup.worldPos.x || 0).toFixed(3)),
      y: Number((sup.worldPos.y || 0).toFixed(3)),
      z: Number((sup.elevationZ || 0).toFixed(3)),
      elevation: sup.elevationZ,
    },
    connection: {
      fromEntityId: sup.segmentId,
      ports: [],
      connectionType: "mechanical",
    },
    dn: {
      dn: targetDn,
      inch: getInchFromDn(targetDn),
      outerDiameterMm: getOdFromDn(targetDn),
      unit: "mm",
    },
    pn: {
      rating: "MSS SP-58",
    },
    material: {
      grade: "Acier galvanisé à chaud / Inox",
    },
    service: {
      code: "SUPPORT",
    },
    spec: {
      pmsCode: "MSS-SP-58",
    },
    tag: {
      fullTag: sup.tag,
      lineId: sup.segmentId,
    },
    fabrication: {
      location: "field",
    },
    documentation: {
      catalogRef: `MSS-${sup.type}`,
      manufacturer: "Lisega / Carpenter & Paterson / Hilti",
      notes: `Ancrage à ${sup.distanceFromFromNodeM.toFixed(2)}m du nœud amont`,
    },
    specific: {
      support: {
        mssType: sup.type,
        loadCapacityKn: (sup as any).designLoadKn || (sup.customLoads?.fz ? Math.abs(sup.customLoads.fz) : 15),
        concretePad: !!sup.civilSpec,
      },
    },
  };
}

export interface UniversalGraphState {
  nodes: IsoNode[];
  segments: IsoSegment[];
  cad2dEntities: Cad2dEntity[];
  supports: IsoPipingSupport[];
}

/**
 * Applique de façon atomique et bidirectionnelle une entité modifiée au graphe du modèle CAO
 */
export function applyUniversalEntityToGraph(
  updated: PdiUniversalEntity,
  state: UniversalGraphState
): UniversalGraphState {
  const { nodes, segments, cad2dEntities, supports } = state;

  if (updated.identity.category === "cad2d") {
    const nextCad = cad2dEntities.map((c) => {
      if (c.id !== updated.identity.id) return c;
      return {
        ...c,
        text: updated.identity.name || c.text,
        layerId: updated.specific.cad2d?.layerId || c.layerId,
        color: updated.specific.cad2d?.strokeColor || c.color,
        lineWeight: updated.specific.cad2d?.strokeWidth || c.lineWeight,
        fill: updated.specific.cad2d?.fillColor || c.fill,
        fillOpacity: updated.specific.cad2d?.fillOpacity ?? c.fillOpacity,
        rotation: updated.geometry.rotation != null ? updated.geometry.rotation : c.rotation,
        length: updated.geometry.length != null ? updated.geometry.length : c.length,
        width: updated.geometry.width != null ? updated.geometry.width : c.width,
        height: updated.geometry.height != null ? updated.geometry.height : c.height,
        radius: updated.geometry.radius != null ? updated.geometry.radius : c.radius,
        metadata: {
          ...c.metadata,
          elevationZ: updated.geometry.z != null ? updated.geometry.z : c.metadata?.elevationZ,
          dn: updated.dn.dn || c.metadata?.dn,
        },
      };
    });
    return { ...state, cad2dEntities: nextCad };
  }

  if (updated.identity.category === "support") {
    const nextSup = supports.map((s) => {
      if (s.id !== updated.identity.id) return s;
      return {
        ...s,
        tag: updated.tag.fullTag || s.tag,
        type: (updated.specific.support?.mssType as any) || s.type,
        orientationAngleDeg: updated.geometry.rotation != null ? updated.geometry.rotation : s.orientationAngleDeg,
        elevationZ: updated.geometry.z != null ? updated.geometry.z : s.elevationZ,
        worldPos: {
          x: updated.geometry.x != null ? updated.geometry.x : s.worldPos.x,
          y: updated.geometry.y != null ? updated.geometry.y : s.worldPos.y,
          z: updated.geometry.z != null ? updated.geometry.z : s.worldPos.z,
        },
      };
    });
    return { ...state, supports: nextSup };
  }

  if (updated.identity.category === "pipe") {
    const nextSeg = segments.map((s) => {
      if (s.id !== updated.identity.id) return s;
      return {
        ...s,
        sourceName: updated.identity.name || s.sourceName,
        tag: updated.tag.fullTag || s.tag,
        dn: updated.dn.dn || s.dn,
        pn: updated.pn.rating || s.pn,
        material: updated.material.grade || s.material,
        schedule: updated.material.schedule || s.schedule,
        service: updated.service.code || s.service,
        spec: updated.spec.pmsCode || s.spec,
        length: updated.geometry.length != null ? updated.geometry.length : s.length,
        insulation: updated.specific.pipe?.insulation || s.insulation,
      };
    });
    return { ...state, segments: nextSeg };
  }

  // Nœud / Équipement / Vanne / Bride / Té / Raccord
  const isNode = nodes.some((n) => n.id === updated.identity.id);
  if (isNode) {
    const nextNodes = nodes.map((n) => {
      if (n.id !== updated.identity.id) return n;
      return {
        ...n,
        name: updated.identity.name || n.name,
        equipmentLabel: updated.identity.labelFr || n.equipmentLabel,
        dn: updated.dn.dn || n.dn,
        reducedDn: updated.dn.reducedDn || (n as any).reducedDn,
        pn: updated.pn.rating || (n as any).pn,
        material: updated.material.grade || (n as any).material,
        schedule: updated.material.schedule || (n as any).schedule,
        service: updated.service.code || (n as any).service,
        spec: updated.spec.pmsCode || (n as any).spec,
        tag: updated.tag.fullTag || (n as any).tag,
        reference: updated.documentation.catalogRef || (n as any).reference,
        manufacturer: updated.documentation.manufacturer || (n as any).manufacturer,
        x: updated.geometry.x != null ? updated.geometry.x : n.x,
        y: updated.geometry.y != null ? updated.geometry.y : n.y,
        z: updated.geometry.z != null ? updated.geometry.z : n.z,
        rotation: updated.geometry.rotation != null ? updated.geometry.rotation : n.rotation,
        branchAngle: updated.geometry.branchAngle != null ? updated.geometry.branchAngle : n.branchAngle,
      };
    });
    return { ...state, nodes: nextNodes };
  }

  // Fitting imbriqué dans segment
  const nextSeg = segments.map((s) => {
    const hasFitting = s.fittings?.some((f) => f.id === updated.identity.id);
    if (!hasFitting) return s;
    return {
      ...s,
      fittings: s.fittings.map((f) => {
        if (f.id !== updated.identity.id) return f;
        return {
          ...f,
          label: updated.identity.name || f.label,
          dn: updated.dn.dn || f.dn,
          reference: updated.documentation.catalogRef || f.reference,
          manufacturer: updated.documentation.manufacturer || f.manufacturer,
        };
      }),
    };
  });

  return { ...state, segments: nextSeg };
}
