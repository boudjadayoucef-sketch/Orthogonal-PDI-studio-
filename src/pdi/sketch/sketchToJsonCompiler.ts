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
export function mapSketchFittingTypeToIso(type: SketchVectorFitting["type"]): IsoFittingType {
  switch (type) {
    case "valve":
      return "vanne_passage_total";
    case "check_valve":
      return "clapet";
    case "flange":
      return "bride_wn";
    case "elbow_90":
      return "coude_90";
    case "elbow_45":
      return "coude_45";
    case "tee":
      return "te_egal";
    case "reducer":
      return "reduction_concentrique";
    case "instrument":
      return "manometre";
    case "support":
      return "purge"; // or generic fitting
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

    // Compute isometric 3D offsets in meters (rounded to 3 decimals)
    const normX = Number(((node.x - minX) / pxPerMeter).toFixed(3));
    const normY = Number(((node.y - minY) / pxPerMeter).toFixed(3));
    // Elevation in meters
    const normZ = Number(((node.elevation || 0) / 1000).toFixed(3));

    return {
      id: node.id,
      name: `N-${index + 1}`,
      x: normX,
      y: normY,
      z: normZ,
      type: nodeType,
      dn: segments[0]?.nominalDiameter || 150,
      equipmentType: nodeFitting ? mapSketchFittingTypeToIso(nodeFitting.type) : undefined,
      equipmentLabel: nodeFitting?.label || undefined,
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
