/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * SKETCH-TO-ISO ENGINE — STEP 4: CANONICAL JSON COMPILER & TOPOLOGY MAPPER
 */
import {
  SketchVectorNode,
  SketchVectorSegment,
  SketchVectorFitting
} from "./sketchRasterEngine";
import {
  IsoNode,
  IsoSegment,
  IsoFitting,
  IsoFittingType,
  PipingLine,
  IsoDimension
} from "../isometric/types/isoGraphTypes";

export interface CompiledIsoModel {
  version: string;
  generatedAt: string;
  source: "sketch_to_iso_calque";
  metadata: {
    title: string;
    paperFormat: string;
    calibrationScalePxPerMm: number;
    totalPipesCount: number;
    totalFittingsCount: number;
    lineReference: string;
    service: string;
  };
  lines: PipingLine[];
  nodes: IsoNode[];
  segments: IsoSegment[];
  dimensions: IsoDimension[];
}

// Convert sketch fitting type to official IsoFittingType
export function mapSketchFittingTypeToIso(type: string): IsoFittingType {
  switch (type) {
    case "valve":
    case "vanne":
    case "vanne_passage_total":
      return "vanne_passage_total";
    case "vanne_opercule":
      return "vanne_opercule";
    case "vanne_soupape":
      return "vanne_soupape";
    case "vanne_boisseau":
      return "vanne_boisseau";
    case "vanne_papillon":
      return "vanne_papillon";
    case "check_valve":
    case "clapet":
      return "clapet";
    case "flange":
    case "bride":
    case "bride_wn":
      return "bride_wn";
    case "bride_so":
      return "bride_so";
    case "elbow_90":
    case "coude_90":
      return "coude_90";
    case "elbow_45":
    case "coude_45":
      return "coude_45";
    case "tee":
    case "te_egal":
      return "te_egal";
    case "reducer":
    case "reduction_concentrique":
      return "reduction_concentrique";
    case "reduction_excentrique":
      return "reduction_excentrique";
    case "instrument":
    case "manometre":
      return "manometre";
    case "support":
    case "purge":
      return "purge";
    case "ballon_horizontal":
    case "vessel_horizontal":
      return "poste_sectionnement";
    case "ballon_vertical":
    case "vessel_vertical":
      return "poste_detente";
    case "pompe":
    case "pompe_centrifuge":
      return "gare_racleur_depart";
    case "echangeur":
      return "poste_coupure";
    default:
      return "vanne_passage_total";
  }
}

/**
 * Compiles sketch vector data into standard PD&I Iso JSON model.
 */
export function compileSketchToIsoModel(params: {
  nodes: SketchVectorNode[];
  segments: SketchVectorSegment[];
  fittings: SketchVectorFitting[];
  calibrationScale: number; // px per mm
  title?: string;
  paperFormat?: string;
  lineReference?: string;
  service?: string;
}): CompiledIsoModel {
  const {
    nodes,
    segments,
    fittings,
    calibrationScale,
    title = "Ligne Extraite de Croquis",
    paperFormat = "A4_LANDSCAPE",
    lineReference = "L-SKETCH-01",
    service = "PROC-CHIM"
  } = params;

  const scale = calibrationScale > 0 ? calibrationScale : 1;
  const lineId = `line_${Date.now()}`;

  // 1. Create Default Piping Line
  const defaultLine: PipingLine = {
    id: lineId,
    lineNumber: lineReference,
    service: service,
    dn: segments[0]?.nominalDiameter || 150,
    nps: `${Math.round((segments[0]?.nominalDiameter || 150) / 25.4)}"`,
    material: segments[0]?.material || "Acier API 5L Gr. B",
    pressureClass: segments[0]?.pressureClass || "Class 300",
    color: "#0284C7"
  };

  // 2. Map Nodes (Convert pixel coordinates to isometric world coordinate system in meters)
  // In the PD&I isometric engine, 1 world unit = 1 meter, and projection scale is 28 px/m * zoom.
  // Standard sketch canvas coordinates (typically 0-1200px) are mapped to meters (~0-10m).
  const minX = nodes.length > 0 ? Math.min(...nodes.map((n) => n.x)) : 0;
  const minY = nodes.length > 0 ? Math.min(...nodes.map((n) => n.y)) : 0;

  // Conversion factor from sketch px to world meters:
  // Default calibration scale is ~0.25 px/mm = 250 px/m, or if uncalibrated, 100 px ≈ 1 m.
  const pxPerMeter = scale > 0 ? (scale >= 1 ? scale : scale * 1000) : 100;

  // 2. Map Nodes using isometric 3D pipe routing
  // Convert sketch segments and angles to true 3D orthogonal coordinates (in meters)
  const nodeCoords3D = new Map<string, { x: number; y: number; z: number }>();

  if (nodes.length > 0) {
    // Initialize starting node
    const firstNode = nodes[0];
    nodeCoords3D.set(firstNode.id, {
      x: 0,
      y: 0,
      z: Number(((firstNode.elevation || 0) / 1000).toFixed(3))
    });

    // BFS propagation along segments to establish 3D coordinates aligned with isometric axes
    const visited = new Set<string>([firstNode.id]);
    const queue = [firstNode.id];

    while (queue.length > 0) {
      const currId = queue.shift()!;
      const currCoord = nodeCoords3D.get(currId)!;

      const outgoing = segments.filter((s) => s.fromNodeId === currId || s.toNodeId === currId);
      for (const seg of outgoing) {
        const isForward = seg.fromNodeId === currId;
        const nextId = isForward ? seg.toNodeId : seg.fromNodeId;

        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push(nextId);

          const fromN = nodes.find((n) => n.id === currId);
          const nextN = nodes.find((n) => n.id === nextId);

          const lenM = seg.lengthMm 
            ? seg.lengthMm / 1000 
            : (fromN && nextN ? Math.hypot(nextN.x - fromN.x, nextN.y - fromN.y) / pxPerMeter : 1.0);

          const ang = seg.angleIsoDeg !== undefined 
            ? (isForward ? seg.angleIsoDeg : (seg.angleIsoDeg + 180) % 360) 
            : 30;

          let dx = 0, dy = 0, dz = 0;
          if (ang === 90) {
            dz = lenM;
          } else if (ang === 270) {
            dz = -lenM;
          } else if (ang === 30) {
            dx = lenM;
          } else if (ang === 210) {
            dx = -lenM;
          } else if (ang === 150) {
            dy = -lenM;
          } else if (ang === 330) {
            dy = lenM;
          } else {
            // Décomposition d'angle général
            const rad = (ang * Math.PI) / 180;
            dx = lenM * Math.cos(rad);
            dy = lenM * Math.sin(rad);
          }

          const targetZ = nextN?.elevation !== undefined 
            ? nextN.elevation / 1000 
            : currCoord.z + dz;

          nodeCoords3D.set(nextId, {
            x: Number((currCoord.x + dx).toFixed(3)),
            y: Number((currCoord.y + dy).toFixed(3)),
            z: Number(targetZ.toFixed(3))
          });
        }
      }
    }
  }

  const isoNodes: IsoNode[] = nodes.map((node, index) => {
    // Check if node is an elbow or tee based on connectivity
    const connectedSegs = segments.filter(
      (s) => s.fromNodeId === node.id || s.toNodeId === node.id
    );

    let nodeType: IsoNode["type"] = "normal";
    if (connectedSegs.length >= 3) {
      nodeType = "tee";
    }

    // Check if any fitting is assigned directly to this node
    const nodeFitting = fittings.find((f) => f.nodeId === node.id);
    const coords = nodeCoords3D.get(node.id) || {
      x: Number(((node.x - minX) / pxPerMeter).toFixed(3)),
      y: Number(((node.y - minY) / pxPerMeter).toFixed(3)),
      z: Number(((node.elevation || 0) / 1000).toFixed(3))
    };

    return {
      id: node.id,
      name: `N-${index + 1}`,
      x: coords.x,
      y: coords.y,
      z: coords.z,
      type: nodeType,
      dn: node.dn || segments[0]?.nominalDiameter || 150,
      equipmentType: nodeFitting ? mapSketchFittingTypeToIso(nodeFitting.type) : (node.equipmentType ? mapSketchFittingTypeToIso(node.equipmentType) : undefined),
      equipmentLabel: nodeFitting?.label || node.equipmentLabel || (node.equipmentType ? (node.label || node.equipmentType) : undefined),
      material: defaultLine.material,
      pn: defaultLine.pressureClass,
      lineId: lineId
    };
  });

  // 3. Map Segments (Pipes) and attach inline fittings
  const dimensions: CompiledIsoModel["dimensions"] = [];

  const isoSegments: IsoSegment[] = segments.map((seg, index) => {
    const fromN = nodes.find((n) => n.id === seg.fromNodeId);
    const toN = nodes.find((n) => n.id === seg.toNodeId);

    let computedLength = seg.lengthMm ? seg.lengthMm / 1000 : 0;
    if (!computedLength && fromN && toN) {
      const distPx = Math.hypot(toN.x - fromN.x, toN.y - fromN.y);
      computedLength = Number((distPx / pxPerMeter).toFixed(3));
    }
    if (!computedLength || computedLength <= 0) computedLength = 1.0;

    // Find fittings attached to this segment
    const segFittings = fittings.filter((f) => f.segmentId === seg.id);
    const mappedFittings: IsoFitting[] = segFittings.map((fit, fitIdx) => {
      return {
        id: fit.id,
        type: mapSketchFittingTypeToIso(fit.type),
        label: fit.label || `ACC-${index + 1}.${fitIdx + 1}`,
        localPosition: 0.5,
        cumulativePosition: Number((computedLength * 0.5).toFixed(3)),
        dn: fit.nominalDiameter || seg.nominalDiameter || 150,
        pn: seg.pressureClass || defaultLine.pressureClass,
        material: seg.material || defaultLine.material
      };
    });

    // Add dimension annotation conforming to IsoDimension
    if (fromN && toN) {
      const displayMm = Math.round(computedLength * 1000);
      dimensions.push({
        id: `dim_${seg.id}`,
        type: "distance",
        a: { kind: "node", nodeId: seg.fromNodeId },
        b: { kind: "node", nodeId: seg.toNodeId },
        unit: "mm",
        label: `${displayMm}`,
        offset: { x: 0, y: -20 },
        locked: false
      });
    }

    return {
      id: seg.id,
      fromNodeId: seg.fromNodeId,
      toNodeId: seg.toNodeId,
      dn: seg.nominalDiameter || 150,
      pn: seg.pressureClass || "Class 300",
      material: seg.material || "Acier API 5L Gr. B",
      length: computedLength,
      type: "straight",
      lineId: lineId,
      fittings: mappedFittings
    };
  });

  return {
    version: "PD&I-ISO-4.8d",
    generatedAt: new Date().toISOString(),
    source: "sketch_to_iso_calque",
    metadata: {
      title,
      paperFormat,
      calibrationScalePxPerMm: scale,
      totalPipesCount: isoSegments.length,
      totalFittingsCount: fittings.length,
      lineReference,
      service
    },
    lines: [defaultLine],
    nodes: isoNodes,
    segments: isoSegments,
    dimensions
  };
}
