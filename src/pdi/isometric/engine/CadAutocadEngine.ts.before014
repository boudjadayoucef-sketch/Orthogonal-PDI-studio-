// =========================================================================
// PD&I - AutoCAD Engine & Shape Math
// Triangle, Polygon, Arc, Rectangle & AutoCAD Command System
// =========================================================================

export type TriangleType = "equilateral" | "rectangle" | "isocele" | "scalene" | "3pts";
export type ArcCreationMode = "3points" | "center_radius_angle" | "start_end_radius";

export interface Cad2dPoint {
  x: number;
  y: number;
}

/** Distance euclidienne entre 2 points 2D */
export function cadDist(a: Cad2dPoint, b: Cad2dPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Angle d'un vecteur (A -> B) en degrés [-180, 180] */
export function cadAngleDeg(a: Cad2dPoint, b: Cad2dPoint): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

/** Rotation d'un point autour d'un pivot en degrés */
export function cadRotatePoint(point: Cad2dPoint, pivot: Cad2dPoint, angleDeg: number): Cad2dPoint {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  return {
    x: Number((pivot.x + dx * cos - dy * sin).toFixed(3)),
    y: Number((pivot.y + dx * sin + dy * cos).toFixed(3)),
  };
}

/**
 * Génère un triangle équilatéral à partir de 2 points (base ou centre/sommet)
 */
export function buildEquilateralTriangle(p1: Cad2dPoint, p2: Cad2dPoint): Cad2dPoint[] {
  const len = cadDist(p1, p2);
  if (len < 0.001) return [p1, { x: p1.x + 2, y: p1.y }, { x: p1.x + 1, y: p1.y + Math.sqrt(3) }, p1];
  const p3 = cadRotatePoint(p2, p1, 60);
  return [p1, p2, p3, p1];
}

/**
 * Génère un triangle rectangle
 * P1 = sommet de l'angle droit
 * P2 = direction de la base (longueur)
 * P3 = direction ou hauteur de la perpendiculaire
 */
export function buildRightTriangle(p1: Cad2dPoint, p2: Cad2dPoint, height: number = 0, mousePoint?: Cad2dPoint): Cad2dPoint[] {
  const baseLen = cadDist(p1, p2);
  if (baseLen < 0.001) {
    const h = height || 2;
    return [p1, { x: p1.x + 2, y: p1.y }, { x: p1.x, y: p1.y + h }, p1];
  }
  const ux = (p2.x - p1.x) / baseLen;
  const uy = (p2.y - p1.y) / baseLen;
  // Vecteur normal perpendiculaire
  let nx = -uy;
  let ny = ux;
  if (mousePoint) {
    const dot = (mousePoint.x - p1.x) * nx + (mousePoint.y - p1.y) * ny;
    if (dot < 0) {
      nx = -nx;
      ny = -ny;
    }
  }
  const h = Math.abs(height) > 0.001 ? Math.abs(height) : (mousePoint ? Math.max(0.2, Math.abs((mousePoint.x - p1.x) * nx + (mousePoint.y - p1.y) * ny)) : baseLen * 0.75);
  const p3: Cad2dPoint = {
    x: Number((p1.x + nx * h).toFixed(3)),
    y: Number((p1.y + ny * h).toFixed(3)),
  };
  return [p1, p2, p3, p1];
}

/**
 * Génère un triangle isocèle (2 côtés égaux)
 * P1, P2 = base
 * P3 = sommet au milieu de la base élevé perpendiculairement
 */
export function buildIsoscelesTriangle(p1: Cad2dPoint, p2: Cad2dPoint, height: number = 0, mousePoint?: Cad2dPoint): Cad2dPoint[] {
  const baseLen = cadDist(p1, p2);
  if (baseLen < 0.001) {
    const h = height || 2;
    return [p1, { x: p1.x + 2, y: p1.y }, { x: p1.x + 1, y: p1.y + h }, p1];
  }
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const ux = (p2.x - p1.x) / baseLen;
  const uy = (p2.y - p1.y) / baseLen;
  let nx = -uy;
  let ny = ux;
  if (mousePoint) {
    const dot = (mousePoint.x - mx) * nx + (mousePoint.y - my) * ny;
    if (dot < 0) {
      nx = -nx;
      ny = -ny;
    }
  }
  const h = Math.abs(height) > 0.001 ? Math.abs(height) : (mousePoint ? Math.max(0.2, Math.abs((mousePoint.x - mx) * nx + (mousePoint.y - my) * ny)) : baseLen * 0.86);
  const p3: Cad2dPoint = {
    x: Number((mx + nx * h).toFixed(3)),
    y: Number((my + ny * h).toFixed(3)),
  };
  return [p1, p2, p3, p1];
}

/**
 * Génère un polygone régulier à N côtés (3 = triangle, 4 = carré, 5 = pentagone, 6 = hexagone, 8 = octogone...)
 */
export function buildRegularPolygon(center: Cad2dPoint, radiusPoint: Cad2dPoint, sides: number = 6): Cad2dPoint[] {
  const n = Math.max(3, Math.min(32, Math.round(sides || 6)));
  const radius = cadDist(center, radiusPoint);
  if (radius < 0.001) {
    const defaultR = 1.5;
    const pts: Cad2dPoint[] = [];
    for (let i = 0; i < n; i++) {
      const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
      pts.push({
        x: Number((center.x + defaultR * Math.cos(angle)).toFixed(3)),
        y: Number((center.y + defaultR * Math.sin(angle)).toFixed(3)),
      });
    }
    pts.push(pts[0]);
    return pts;
  }
  const startAngle = Math.atan2(radiusPoint.y - center.y, radiusPoint.x - center.x);
  const pts: Cad2dPoint[] = [];
  for (let i = 0; i < n; i++) {
    const angle = startAngle + (i * 2 * Math.PI) / n;
    pts.push({
      x: Number((center.x + radius * Math.cos(angle)).toFixed(3)),
      y: Number((center.y + radius * Math.sin(angle)).toFixed(3)),
    });
  }
  pts.push(pts[0]); // Fermeture de la polyligne
  return pts;
}

/**
 * Génère un rectangle façon AutoCAD :
 * 1er point cliqué (P1)
 * 2ème point ou direction souris pour Côté 1 (Longueur L)
 * 3ème point ou direction souris pour Côté 2 (Largeur W)
 */
export function buildAutocadRectangle(
  p1: Cad2dPoint,
  dirPoint1: Cad2dPoint,
  length: number = 0,
  dirPoint2?: Cad2dPoint,
  width: number = 0
): { points: Cad2dPoint[]; p1: Cad2dPoint; p2: Cad2dPoint; p3: Cad2dPoint; p4: Cad2dPoint; length: number; width: number } {
  const rawDist1 = cadDist(p1, dirPoint1);
  const actualLength = length > 0.001 ? length : Math.max(0.1, rawDist1 || 2);
  let ux = 1;
  let uy = 0;
  if (rawDist1 > 0.001) {
    ux = (dirPoint1.x - p1.x) / rawDist1;
    uy = (dirPoint1.y - p1.y) / rawDist1;
  }
  const p2: Cad2dPoint = {
    x: Number((p1.x + ux * actualLength).toFixed(3)),
    y: Number((p1.y + uy * actualLength).toFixed(3)),
  };

  // Direction normale pour le 2ème côté
  let nx = -uy;
  let ny = ux;
  if (dirPoint2) {
    const dot = (dirPoint2.x - p1.x) * nx + (dirPoint2.y - p1.y) * ny;
    if (dot < 0) {
      nx = -nx;
      ny = -ny;
    }
  }

  let actualWidth = 0;
  if (width > 0.001) {
    actualWidth = width;
  } else if (dirPoint2) {
    actualWidth = Math.max(0.1, Math.abs((dirPoint2.x - p1.x) * nx + (dirPoint2.y - p1.y) * ny));
  } else {
    actualWidth = Math.max(0.1, actualLength * 0.6);
  }

  const p3: Cad2dPoint = {
    x: Number((p2.x + nx * actualWidth).toFixed(3)),
    y: Number((p2.y + ny * actualWidth).toFixed(3)),
  };
  const p4: Cad2dPoint = {
    x: Number((p1.x + nx * actualWidth).toFixed(3)),
    y: Number((p1.y + ny * actualWidth).toFixed(3)),
  };

  return {
    points: [p1, p2, p3, p4, p1],
    p1,
    p2,
    p3,
    p4,
    length: Number(actualLength.toFixed(3)),
    width: Number(actualWidth.toFixed(3)),
  };
}

/**
 * Calcule le centre, le rayon et les angles de départ/fin d'un arc passant par 3 points (P1 -> P2 -> P3)
 */
export function calculate3PointArc(
  p1: Cad2dPoint,
  p2: Cad2dPoint,
  p3: Cad2dPoint
): { center: Cad2dPoint; radius: number; startAngle: number; endAngle: number } | null {
  const d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
  if (Math.abs(d) < 1e-6) {
    // Points colinéaires
    return null;
  }
  const p1Sq = p1.x * p1.x + p1.y * p1.y;
  const p2Sq = p2.x * p2.x + p2.y * p2.y;
  const p3Sq = p3.x * p3.x + p3.y * p3.y;

  const cx = (p1Sq * (p2.y - p3.y) + p2Sq * (p3.y - p1.y) + p3Sq * (p1.y - p2.y)) / d;
  const cy = (p1Sq * (p3.x - p2.x) + p2Sq * (p1.x - p3.x) + p3Sq * (p2.x - p1.x)) / d;
  const center: Cad2dPoint = { x: Number(cx.toFixed(3)), y: Number(cy.toFixed(3)) };
  const radius = Number(cadDist(center, p1).toFixed(3));

  let startAngle = (Math.atan2(p1.y - cy, p1.x - cx) * 180) / Math.PI;
  let midAngle = (Math.atan2(p2.y - cy, p2.x - cx) * 180) / Math.PI;
  let endAngle = (Math.atan2(p3.y - cy, p3.x - cx) * 180) / Math.PI;

  if (startAngle < 0) startAngle += 360;
  if (midAngle < 0) midAngle += 360;
  if (endAngle < 0) endAngle += 360;

  return {
    center,
    radius,
    startAngle: Number(startAngle.toFixed(1)),
    endAngle: Number(endAngle.toFixed(1)),
  };
}

// =========================================================================
// Système de commandes AutoCAD (French & English Aliases)
// =========================================================================

export interface CadCommandItem {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  category: "Dessin 2D" | "Tuyauterie" | "Édition" | "Affichage" | "Données";
  shortcut?: string;
  icon: string;
}

export const AUTOCAD_COMMANDS: CadCommandItem[] = [
  // ÉDITION & PRESSE-PAPIERS
  {
    id: "copy",
    name: "COPIER",
    aliases: ["CO", "CP", "COPY", "COPIE"],
    description: "Copie les nœuds, tronçons ou objets 2D sélectionnés",
    category: "Édition",
    shortcut: "Ctrl+C",
    icon: "Copy",
  },
  {
    id: "paste",
    name: "COLLER",
    aliases: ["PA", "PASTE", "COLLEZ", "COLL", "INSERER"],
    description: "Colle le presse-papiers avec choix du point par clic souris",
    category: "Édition",
    shortcut: "Ctrl+V",
    icon: "Clipboard",
  },
  {
    id: "move",
    name: "DEPLACER",
    aliases: ["M", "MOVE", "DEPLACE", "TRANSLATION"],
    description: "Déplace la sélection d'un point de base vers une cible au clic",
    category: "Édition",
    shortcut: "M",
    icon: "Move",
  },
  {
    id: "delete",
    name: "EFFACER",
    aliases: ["E", "DEL", "DELETE", "SUPPRIMER", "SUPPR", "ERASE"],
    description: "Supprime les éléments sélectionnés du plan",
    category: "Édition",
    shortcut: "Suppr",
    icon: "Trash2",
  },
  {
    id: "duplicate",
    name: "DUPLIQUER",
    aliases: ["DUP", "DUPLICATE", "CLONER"],
    description: "Duplique immédiatement la sélection avec un décalage",
    category: "Édition",
    shortcut: "Ctrl+D",
    icon: "CopyPlus",
  },
  {
    id: "rotate",
    name: "ROTATION",
    aliases: ["RO", "ROTATE", "TOURNER", "PIVOTER"],
    description: "Fait pivoter les éléments sélectionnés (+15°, +45°, +90°)",
    category: "Édition",
    shortcut: "R",
    icon: "RotateCw",
  },
  {
    id: "mirror",
    name: "MIROIR",
    aliases: ["MI", "MIRROR", "SYMETRIE"],
    description: "Applique une symétrie miroir horizontale sur la sélection",
    category: "Édition",
    shortcut: "Alt+M",
    icon: "ArrowRightLeft",
  },
  {
    id: "undo",
    name: "ANNULER",
    aliases: ["U", "UNDO", "RETOUR"],
    description: "Annule la dernière action",
    category: "Édition",
    shortcut: "Ctrl+Z",
    icon: "Undo2",
  },
  {
    id: "redo",
    name: "RETABLIR",
    aliases: ["REDO", "RE", "AVANCER"],
    description: "Rétablit l'action précédemment annulée",
    category: "Édition",
    shortcut: "Ctrl+Y",
    icon: "Redo2",
  },

  // DESSIN 2D & GÉOMÉTRIE
  {
    id: "rectangle",
    name: "RECTANGLE",
    aliases: ["REC", "RECT", "RECTANGLE", "CARRE", "BOX"],
    description: "Dessine un rectangle interactif (Point 1 -> Longueur -> Largeur)",
    category: "Dessin 2D",
    shortcut: "REC",
    icon: "Square",
  },
  {
    id: "triangle",
    name: "TRIANGLE",
    aliases: ["TRI", "TRIA", "TRIANGLE", "DELTA"],
    description: "Dessine un triangle (équilatéral, rectangle, isocèle, 3 points)",
    category: "Dessin 2D",
    shortcut: "TRI",
    icon: "Triangle",
  },
  {
    id: "polygon",
    name: "POLYGONE",
    aliases: ["POL", "POLYGON", "POLYGONE", "PENTAGONE", "HEXAGONE", "OCTOGONE"],
    description: "Dessine un polygone régulier avec choix du nombre de côtés (3 à 32)",
    category: "Dessin 2D",
    shortcut: "POL",
    icon: "Hexagon",
  },
  {
    id: "line",
    name: "LIGNE",
    aliases: ["L", "LINE", "LIGNE", "DROITE"],
    description: "Dessine une ligne 2D entre deux points",
    category: "Dessin 2D",
    shortcut: "L",
    icon: "Slash",
  },
  {
    id: "polyline",
    name: "POLYLIGNE",
    aliases: ["PL", "PLINE", "POLYLINE", "POLYLIGNE"],
    description: "Dessine une polyligne continue multi-sommets",
    category: "Dessin 2D",
    shortcut: "PL",
    icon: "Spline",
  },
  {
    id: "circle",
    name: "CERCLE",
    aliases: ["C", "CIRCLE", "CERCLE", "ROND"],
    description: "Dessine un cercle à partir du centre et du rayon",
    category: "Dessin 2D",
    shortcut: "C",
    icon: "Circle",
  },
  {
    id: "arc",
    name: "ARC",
    aliases: ["A", "ARC", "ARCCERCLE"],
    description: "Dessine un arc de cercle (par 3 points ou Centre-Rayon-Angle)",
    category: "Dessin 2D",
    shortcut: "A",
    icon: "Disc3",
  },
  {
    id: "text",
    name: "TEXTE",
    aliases: ["T", "DT", "TEXT", "TEXTE", "ANNOTATION", "LABEL"],
    description: "Place un texte ou une annotation 2D sur le plan",
    category: "Dessin 2D",
    shortcut: "T",
    icon: "Type",
  },
  {
    id: "dimension",
    name: "COTATION",
    aliases: ["DIM", "D", "COTATION", "COTE", "MESURE", "DIST"],
    description: "Place une cotation dimensionnelle entre 2 points/ancres",
    category: "Dessin 2D",
    shortcut: "DIM",
    icon: "Ruler",
  },

  // TUYAUTERIE & PIPING
  {
    id: "pipe",
    name: "TUBE",
    aliases: ["TUBE", "PIPE", "TRONCON", "TUYAU"],
    description: "Dessine un tronçon de tuyauterie isométrique",
    category: "Tuyauterie",
    shortcut: "T",
    icon: "Spline",
  },
  {
    id: "node",
    name: "NOEUD",
    aliases: ["N", "NODE", "NOEUD", "POINT"],
    description: "Crée un nœud ou point de connexion",
    category: "Tuyauterie",
    shortcut: "N",
    icon: "CircleDot",
  },
  {
    id: "tee",
    name: "TE",
    aliases: ["TE", "TEE", "DERIVATION", "PIQUAGE"],
    description: "Insère une dérivation Té sur la tuyauterie",
    category: "Tuyauterie",
    shortcut: "E",
    icon: "GitFork",
  },
  {
    id: "elbow",
    name: "COUDE",
    aliases: ["COUDE", "ELBOW", "BEND"],
    description: "Insère un coude 90°, 45° ou 30°",
    category: "Tuyauterie",
    shortcut: "C",
    icon: "CornerDownRight",
  },
  {
    id: "valve",
    name: "VANNE",
    aliases: ["VANNE", "VALVE", "ROBINET"],
    description: "Insère une vanne de sectionnement ou régulation",
    category: "Tuyauterie",
    shortcut: "V",
    icon: "Flame",
  },

  // AFFICHAGE & DONNÉES
  {
    id: "zoom_all",
    name: "ZOOM",
    aliases: ["Z", "ZOOM", "ETENDUE", "FIT", "RECENTRER"],
    description: "Recentre et ajuste la vue à l'ensemble du dessin (Zoom Tout)",
    category: "Affichage",
    shortcut: "0 / F",
    icon: "Maximize2",
  },
  {
    id: "grid",
    name: "GRILLE",
    aliases: ["G", "GRID", "GRILLE"],
    description: "Affiche ou masque la grille isométrique et le repère",
    category: "Affichage",
    shortcut: "G",
    icon: "LayoutGrid",
  },
  {
    id: "bom",
    name: "BOM",
    aliases: ["BOM", "METRE", "NOMENCLATURE", "MATERIEL", "LISTE"],
    description: "Ouvre la nomenclature des matériels et longueurs de tubes",
    category: "Données",
    shortcut: "BOM",
    icon: "FileText",
  },
  {
    id: "properties",
    name: "PROPRIETES",
    aliases: ["PR", "PROPS", "PROPRIETES", "PROPERTIES"],
    description: "Ouvre le panneau d'inspection des propriétés de l'élément",
    category: "Données",
    shortcut: "P",
    icon: "SlidersHorizontal",
  },
];

/**
 * Recherche intelligente de commandes AutoCAD par mot-clé / alias
 */
export function searchCadCommands(query: string): CadCommandItem[] {
  const clean = query.trim().toUpperCase();
  if (!clean) return AUTOCAD_COMMANDS.slice(0, 10);
  return AUTOCAD_COMMANDS.filter((cmd) => {
    if (cmd.name.toUpperCase().includes(clean)) return true;
    if (cmd.aliases.some((alias) => alias.toUpperCase().startsWith(clean) || alias.toUpperCase().includes(clean))) return true;
    if (cmd.description.toUpperCase().includes(clean)) return true;
    return false;
  });
}
