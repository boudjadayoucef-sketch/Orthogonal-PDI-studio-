/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * COPYRIGHT (C) 2026 ORTHOGONAL - ENG. ALL RIGHTS RESERVED.
 * PROPRIETARY INDUSTRIAL PIPING CAD & ISOMETRIC ENGINE.
 * UNAUTHORIZED COPYING, REVERSE ENGINEERING OR DISTRIBUTION IS STRICTLY PROHIBITED.
 */

import { TriangleType, ArcCreationMode } from "./../engine/CadAutocadEngine";
import type { IsoPipingSupport } from "../supports/pdiMssSupportEngine";

export type IsoNodeType =
  | "normal" | "entree_poste" | "sortie_poste"
  | "piquage" | "gare_depart" | "gare_arrivee" | "tee";

export type IsoFittingType =
  | "te_egal" | "te_reduit"
  | "reduction_concentrique" | "reduction_excentrique"
  | "coude_90" | "coude_45" | "coude_30" | "coude_22_5"
  | "bride_wn" | "bride_so" | "joint" | "jmi"
  | "vanne_boisseau" | "vanne_papillon" | "vanne_passage_total"
  | "clapet" | "soupape" | "purge" | "event"
  | "manometre" | "prise_pression" | "piquage"
  | "poste_sectionnement" | "poste_coupure" | "poste_detente"
  | "gare_racleur_depart" | "gare_racleur_arrivee";

export type IsoEquipmentType = IsoFittingType;
export type IsoPortRole = "inline-in" | "inline-out" | "branch" | "aux";
export type JointConnectionType = "butt_weld" | "socket_weld" | "fillet_weld" | "flanged" | "threaded" | "mechanical" | "unknown";

export interface IsoPort {
  id: string;
  index: number;
  role: IsoPortRole;
  dx: number;
  dy: number;
  dz: number;
  connectedSegmentIds?: string[];
  connectionType?: JointConnectionType;
  endPreparation?: "bevel" | "plain" | "socket" | "flange_face";
}

export interface IsoNode {
  id: string;
  branchAngle?: number;
  name: string;
  x: number;
  y: number;
  z: number;
  type: IsoNodeType;
  equipmentType?: IsoEquipmentType;
  equipmentLabel?: string;
  dn?: number;
  reference?: string;
  manufacturer?: string;
  rotation?: number;
  mirrored?: boolean;
  bendDirection?: 1 | -1;
  length?: number;
  ports?: IsoPort[];
  lineId?: string;
  tag?: string;
  tagFormatName?: string;
  service?: string;
  spec?: string;
  tagNumber?: number;
}

export interface IsoFitting {
  id: string;
  type: IsoFittingType;
  label: string;
  localPosition: number;
  cumulativePosition: number;
  dn?: number;
  reference?: string;
  manufacturer?: string;
  orientation?: number;
  length?: number;
}

export interface IsoSegment {
  id: string;
  fromNodeId: string;
  fromPortId?: string;
  toNodeId: string;
  toPortId?: string;
  dn: number;
  pn: string;
  material: string;
  length: number;
  type: "straight" | "riser" | "branch";
  fittings: IsoFitting[];
  color?: string;
  sourceName?: string;
  lineId?: string;
  tag?: string;
  tagFormatName?: string;
  service?: string;
  spec?: string;
  tagNumber?: number;
  pressureClass?: string;
  insulation?: boolean;
  lineFunction?: string;
}

export interface PipingLine {
  id: string;
  lineNumber: string;
  service: string;
  dn: number;
  nps: string;
  material: string;
  pressureClass: string;
  schedule?: string;
  designPressure?: number;
  designTemperature?: number;
  color: string;
}

export type Cad2dEntityType = "line" | "polyline" | "circle" | "arc" | "triangle" | "polygon" | "rectangle" | "text";
export type Cad2dPoint = { x: number; y: number };
export type Cad2dEntity = {
  id: string;
  type: Cad2dEntityType;
  layerId: string;
  color: string;
  subType?: string;
  sides?: number;
  length?: number;
  width?: number;
  height?: number;
  closed?: boolean;
  fill?: string;
  fillOpacity?: number;
  hatchPattern?: "none" | "ansi31" | "ansi32" | "solid" | "dots";
  hatchScale?: number;
  lineWeight?: number;
  lineType?: "continuous" | "dashed" | "center" | "hidden";
  opacity?: number;
  locked?: boolean;
  visible?: boolean;
  points?: Cad2dPoint[];
  center?: Cad2dPoint;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  rotation?: number;
  metadata?: {
    intent?: "draft" | "pipe_axis" | "equipment" | "annotation" | "dimension";
    dn?: number;
    elevationZ?: number;
    catalogRef?: string;
    source?: string;
    length?: number;
    width?: number;
    sides?: number;
    radius?: number;
    subType?: string;
    [key: string]: any;
  };
};

export interface CadDraftSession {
  tool: Cad2dEntityType | "paste_target" | "move_target";
  subType?: TriangleType | ArcCreationMode;
  sides?: number;
  length?: number;
  width?: number;
  height?: number;
  radius?: number;
  angle?: number;
  step: number;
  points: Cad2dPoint[];
  center?: Cad2dPoint;
  currentLengthInput: string;
  currentWidthInput: string;
  currentAngleInput: string;
  currentRadiusInput: string;
  mouseWorld: Cad2dPoint;
}

export type Cad2dLayer = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
};

export interface PipingJoint {
  id: string;
  segmentId: string;
  endpoint: "from" | "to";
  nodeId: string;
  portId: string;
  lineId: string;
  connectionType: JointConnectionType;
  weldNumber?: string;
  location?: "shop" | "field";
}

export interface GraphIssue {
  id: string;
  severity: "error" | "warning";
  code: string;
  message: string;
  entityId?: string;
}

export type IsoDimensionAnchor = {
  kind: "node" | "port";
  nodeId: string;
  portId?: string;
};

export interface IsoDimension {
  id: string;
  type: "distance" | "deltaX" | "deltaY" | "deltaZ";
  a: IsoDimensionAnchor;
  b: IsoDimensionAnchor;
  label?: string;
  offset?: { x: number; y: number };
  unit: "m" | "mm" | "ft-in" | "in";
  locked?: boolean;
}

export interface IsoProjectFileV474 {
  schemaVersion: "4.7.4";
  exportedAt: string;
  project: {
    id: string;
    ownerUid: string;
    name: string;
    wilaya: string;
    pressDesign: number;
    createdAt: string;
    updatedAt: string;
    unitSystem?: "metric" | "imperial";
  };
  model: {
    lines: PipingLine[];
    nodes: IsoNode[];
    segments: IsoSegment[];
    dimensions?: IsoDimension[];
    supports?: IsoPipingSupport[];
    cad2d?: {
      layers: Cad2dLayer[];
      entities: Cad2dEntity[];
    };
  };
  workspace: {
    showGrid: boolean;
    showDimensions: boolean;
    showPipeLabels: boolean;
    showLabels: boolean;
    showWelds: boolean;
    isoSnapStep: number;
    viewport: { zoom: number; panX: number; panY: number };
  };
}

export const DIAMETERS = [
  [25, '1"', 33.7, 2.41], [50, '2"', 60.3, 5.44], [80, '3"', 88.9, 11.3],
  [100, '4"', 114.3, 16.1], [125, '5"', 139.7, 21.8], [150, '6"', 168.3, 28.3],
  [200, '8"', 219.1, 42.6], [250, '10"', 273, 60.5], [300, '12"', 323.9, 73.8],
  [350, '14"', 355.6, 81], [400, '16"', 406.4, 97.8], [450, '18"', 457.2, 117],
  [500, '20"', 508, 135], [550, '22"', 559, 155], [600, '24"', 610, 178],
  [650, '26"', 660.4, 190], [700, '28"', 711.2, 215]
] as const;

export type DiameterSpec = {
  dn: number;
  inch: string;
  od: number;
  weight: number;
};

export const DIAMETER_BY_DN: Record<number, DiameterSpec> =
  Object.fromEntries(DIAMETERS.map(([dn, inch, od, weight]) =>
    [dn, { dn, inch, od, weight }]
  ));

export const FITTING_LABELS: Record<IsoFittingType, string> = {
  te_egal: "Té égal", te_reduit: "Té réduit",
  reduction_concentrique: "Réduction concentrique",
  reduction_excentrique: "Réduction excentrique",
  coude_90: "Coude 90°", coude_45: "Coude 45°",
  coude_30: "Coude 30°", coude_22_5: "Coude 22,5°",
  bride_wn: "Bride WN", bride_so: "Bride SO", joint: "Joint", jmi: "Joint monobloc isolant JMI",
  vanne_boisseau: "Vanne à boisseau sphérique",
  vanne_papillon: "Vanne papillon",
  vanne_passage_total: "Vanne à passage total",
  clapet: "Clapet anti-retour", soupape: "Soupape de sécurité",
  purge: "Purge", event: "Évent", manometre: "Manomètre",
  prise_pression: "Prise de pression", piquage: "Piquage",
  poste_sectionnement: "Poste de sectionnement",
  poste_coupure: "Poste de coupure", poste_detente: "Poste de détente",
  gare_racleur_depart: "Gare racleur départ",
  gare_racleur_arrivee: "Gare racleur arrivée"
};

export const FITTING_TYPES = Object.keys(FITTING_LABELS) as IsoFittingType[];
