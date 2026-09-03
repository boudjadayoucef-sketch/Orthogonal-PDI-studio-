/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * COPYRIGHT (C) 2026 ORTHOGONAL - ENG. ALL RIGHTS RESERVED.
 * PROPRIETARY INDUSTRIAL PIPING CAD & ISOMETRIC ENGINE.
 * GÉNÉRATEUR VECTORIEL DE PLANCHES NORMALISÉES ISO (PATCH 020F).
 */

import {
  IsoNode,
  IsoSegment,
  IsoDimension,
  PipingJoint,
  DIAMETER_BY_DN,
} from "../isometric/types/isoGraphTypes";
import {
  IsoPrintConfig,
  getIsoPaperDimensions,
  buildAdaptiveLegend,
} from "./isoSheetStandards";
import {
  segmentEndpoints,
  portWorldPosition,
  elbowAngle,
  equipmentLabel,
} from "../isometric/core/IsoTopologyGraph";
import { pdiCompanyName, pdiStandardsNote } from "../branding/pdiBranding";
import { PDI_ENGINE_IDENTITY, PDI_WATERMARK_SIGNATURE } from "../core/pdiWatermark";
import { formatLength, formatPressure } from "../units/pdiUnitSystem";

const PDI_ISO_ANGLE = Math.PI / 6;
const PDI_ISO_COS = Math.cos(PDI_ISO_ANGLE);
const PDI_ISO_SIN = Math.sin(PDI_ISO_ANGLE);

export interface BomRow {
  index: number;
  designation: string;
  dn: number;
  inch: string;
  qty: number;
  unit: string;
  length: number;
  reference: string;
}

/**
 * Projette les coordonnées mondiales 3D vers le plan 2D isométrique centré
 */
function isoProjectPrint(
  x: number,
  y: number,
  z: number,
  cx: number,
  cy: number,
  scale: number
): { x: number; y: number } {
  return {
    x: cx + (x - y) * PDI_ISO_COS * scale,
    y: cy + (x + y) * PDI_ISO_SIN * scale - z * scale,
  };
}

/**
 * Calcule l'emprise englobante du modèle 3D projeté
 */
function computeBoundingBox(
  nodes: IsoNode[],
  segments: IsoSegment[]
): { minX: number; maxX: number; minY: number; maxY: number; centerX: number; centerY: number } {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 10, minY: 0, maxY: 10, centerX: 5, centerY: 5 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach((n) => {
    const rawX = (n.x - n.y) * PDI_ISO_COS;
    const rawY = (n.x + n.y) * PDI_ISO_SIN - (n.z || 0);
    if (rawX < minX) minX = rawX;
    if (rawX > maxX) maxX = rawX;
    if (rawY < minY) minY = rawY;
    if (rawY > maxY) maxY = rawY;
  });

  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

/**
 * Génère le SVG complet et certifié de la planche normalisée
 */
export function generateIsoDrawingSvg(
  nodes: IsoNode[],
  segments: IsoSegment[],
  dimensions: IsoDimension[],
  joints: PipingJoint[],
  bomRows: BomRow[],
  config: IsoPrintConfig
): {
  svgMarkup: string;
  widthMm: number;
  heightMm: number;
  scaleApplied: string;
} {
  const paper = getIsoPaperDimensions(config.format, config.orientation);
  const W = paper.widthMm;
  const H = paper.heightMm;

  // Marges ISO 5457
  const leftM = paper.bindingMarginMm;
  const rightM = paper.outerMarginMm;
  const topM = paper.outerMarginMm;
  const bottomM = paper.outerMarginMm;

  const innerW = W - leftM - rightM;
  const innerH = H - topM - bottomM;

  // Cartouche ISO 7200 dimensions (largeur max 180mm standard, hauteur 55mm)
  const cartoucheW = Math.min(180, innerW * 0.45);
  const cartoucheH = Math.min(55, innerH * 0.3);
  const cartoucheX = leftM + innerW - cartoucheW;
  const cartoucheY = topM + innerH - cartoucheH;

  // Légende dynamique dimensions
  const legendW = Math.min(130, innerW * 0.35);
  const legendX = leftM + 4;
  const legendY = topM + 4;

  // Nomenclature BOM dimensions
  const bomW = Math.min(130, innerW * 0.35);
  const bomX = leftM + 4;
  const bomY = legendY + (config.showAdaptiveLegend ? 65 : 0);

  // Zone graphique utile
  const drawAreaX = config.showAdaptiveLegend || config.showBomTable ? leftM + bomW + 8 : leftM + 8;
  const drawAreaW = innerW - (config.showAdaptiveLegend || config.showBomTable ? bomW + 16 : 16);
  const drawAreaY = topM + 12;
  const drawAreaH = innerH - (config.showCartoucheIso7200 ? cartoucheH + 16 : 24);

  // Calcul d'échelle isométrique
  const bbox = computeBoundingBox(nodes, segments);
  const rawModelW = Math.max(1, bbox.maxX - bbox.minX);
  const rawModelH = Math.max(1, bbox.maxY - bbox.minY);

  let scaleMm = 1;
  let scaleAppliedLabel = config.scale;

  if (config.scale === "fit") {
    const scaleX = (drawAreaW * 0.75) / rawModelW;
    const scaleY = (drawAreaH * 0.75) / rawModelH;
    scaleMm = Math.max(0.2, Math.min(scaleX, scaleY));
    scaleAppliedLabel = "Ajustée (NTS)";
  } else {
    // Calcul de l'échelle numérique 1:50 => 1 mètre réel = 20 mm
    const parts = config.scale.split(":");
    if (parts.length === 2 && Number(parts[1]) > 0) {
      const ratio = Number(parts[0]) / Number(parts[1]);
      scaleMm = 1000 * ratio; // 1m = 1000mm * ratio
    } else {
      scaleMm = 10;
    }
  }

  const modelCenterIsoX = drawAreaX + drawAreaW / 2 - bbox.centerX * scaleMm;
  const modelCenterIsoY = drawAreaY + drawAreaH / 2 - bbox.centerY * scaleMm;

  let svgContent = "";

  // 1. FOND DE PLANCHE BLANC
  svgContent += `<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`;

  // 2. CADRE NORMALISÉ ISO 5457 (DOUBLE CADRE + GRILLE ALPHANUMÉRIQUE)
  if (config.showIso5457Grid) {
    // Cadre extérieur de découpe
    svgContent += `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="#64748b" stroke-width="0.35" stroke-dasharray="2,2"/>`;

    // Cadre de dessin intérieur officiel
    svgContent += `<rect x="${leftM}" y="${topM}" width="${innerW}" height="${innerH}" fill="none" stroke="#0f172a" stroke-width="0.7"/>`;

    // Repères de centrage (4 triangles au centre des côtés)
    const midX = W / 2;
    const midY = H / 2;
    svgContent += `<polygon points="${midX - 2.5},${topM - 5} ${midX + 2.5},${topM - 5} ${midX},${topM}" fill="#0f172a"/>`;
    svgContent += `<polygon points="${midX - 2.5},${topM + innerH + 5} ${midX + 2.5},${topM + innerH + 5} ${midX},${topM + innerH}" fill="#0f172a"/>`;
    svgContent += `<polygon points="${leftM - 5},${midY - 2.5} ${leftM - 5},${midY + 2.5} ${leftM},${midY}" fill="#0f172a"/>`;
    svgContent += `<polygon points="${leftM + innerW + 5},${midY - 2.5} ${leftM + innerW + 5},${midY + 2.5} ${leftM + innerW},${midY}" fill="#0f172a"/>`;

    // Quadrillage de repérage (Lettres et Chiffres)
    const colStep = innerW / paper.columnsCount;
    for (let c = 0; c < paper.columnsCount; c++) {
      const x = leftM + c * colStep;
      svgContent += `<line x1="${x}" y1="${topM}" x2="${x}" y2="${topM - 3}" stroke="#0f172a" stroke-width="0.4"/>`;
      svgContent += `<line x1="${x}" y1="${topM + innerH}" x2="${x}" y2="${topM + innerH + 3}" stroke="#0f172a" stroke-width="0.4"/>`;
      svgContent += `<text x="${x + colStep / 2}" y="${topM - 1}" text-anchor="middle" font-size="2.2" font-family="monospace" font-weight="bold" fill="#0f172a">${c + 1}</text>`;
      svgContent += `<text x="${x + colStep / 2}" y="${topM + innerH + 3}" text-anchor="middle" font-size="2.2" font-family="monospace" font-weight="bold" fill="#0f172a">${c + 1}</text>`;
    }

    const rowStep = innerH / paper.rowsCount;
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    for (let r = 0; r < paper.rowsCount; r++) {
      const y = topM + r * rowStep;
      const letter = letters[r] || "Z";
      svgContent += `<line x1="${leftM}" y1="${y}" x2="${leftM - 3}" y2="${y}" stroke="#0f172a" stroke-width="0.4"/>`;
      svgContent += `<line x1="${leftM + innerW}" y1="${y}" x2="${leftM + innerW + 3}" y2="${y}" stroke="#0f172a" stroke-width="0.4"/>`;
      svgContent += `<text x="${leftM - 1.5}" y="${y + rowStep / 2 + 0.8}" text-anchor="middle" font-size="2.2" font-family="monospace" font-weight="bold" fill="#0f172a">${letter}</text>`;
      svgContent += `<text x="${leftM + innerW + 2}" y="${y + rowStep / 2 + 0.8}" text-anchor="middle" font-size="2.2" font-family="monospace" font-weight="bold" fill="#0f172a">${letter}</text>`;
    }
  }

  // 3. ROSE DES VENTS ISOMÉTRIQUE
  const compassX = leftM + innerW - 25;
  const compassY = topM + 25;
  svgContent += `<g transform="translate(${compassX}, ${compassY})">
    <circle r="9" fill="#f8fafc" stroke="#0f172a" stroke-width="0.5"/>
    <line x1="0" y1="0" x2="6.5" y2="-3.75" stroke="#dc2626" stroke-width="1" stroke-linecap="round"/>
    <polygon points="6.5,-3.75 4.5,-5 5,-2" fill="#dc2626"/>
    <text x="7.5" y="-4.5" font-size="2.6" font-family="sans-serif" font-weight="bold" fill="#dc2626">N</text>
    <line x1="0" y1="0" x2="-6.5" y2="3.75" stroke="#64748b" stroke-width="0.6"/>
    <line x1="0" y1="0" x2="6.5" y2="3.75" stroke="#64748b" stroke-width="0.6"/>
    <line x1="0" y1="0" x2="-6.5" y2="-3.75" stroke="#64748b" stroke-width="0.6"/>
    <text x="-8" y="5" font-size="2" font-family="sans-serif" fill="#64748b">S</text>
    <text x="7.5" y="5" font-size="2" font-family="sans-serif" fill="#64748b">E</text>
    <text x="-8" y="-4" font-size="2" font-family="sans-serif" fill="#64748b">O</text>
    <text x="0" y="12" font-size="1.8" text-anchor="middle" font-weight="bold" fill="#475569">AXE ISO 30°</text>
  </g>`;

  // 4. TITRE DU PLAN EN HAUT DE PAGE
  svgContent += `<g transform="translate(${drawAreaX + drawAreaW / 2}, ${topM + 7})">
    <text text-anchor="middle" font-size="3.8" font-family="sans-serif" font-weight="bold" fill="#0f172a">${config.documentTitle}</text>
    <text text-anchor="middle" y="3.2" font-size="2" font-family="sans-serif" fill="#64748b">${config.wilayaOrSite || "INSTALLATION INDUSTRIELLE"} · SERVICE : ${config.serviceFluid || "PROCESS"} · FEUILLE ${config.pageNumber}/${config.totalPages}</text>
  </g>`;

  // 5. TRACÉ ISOMÉTRIQUE TUYAUTERIE
  svgContent += `<g id="pdi-piping-iso-model">`;

  // Tronçons de tuyauterie
  segments.forEach((seg) => {
    const fromNode = nodes.find((n) => n.id === seg.fromNodeId);
    const toNode = nodes.find((n) => n.id === seg.toNodeId);
    if (!fromNode || !toNode) return;

    const endpoints = segmentEndpoints(seg, nodes);
    const p1 = endpoints
      ? isoProjectPrint(endpoints.from.x, endpoints.from.y, endpoints.from.z, modelCenterIsoX, modelCenterIsoY, scaleMm)
      : isoProjectPrint(fromNode.x, fromNode.y, fromNode.z, modelCenterIsoX, modelCenterIsoY, scaleMm);
    const p2 = endpoints
      ? isoProjectPrint(endpoints.to.x, endpoints.to.y, endpoints.to.z, modelCenterIsoX, modelCenterIsoY, scaleMm)
      : isoProjectPrint(toNode.x, toNode.y, toNode.z, modelCenterIsoX, modelCenterIsoY, scaleMm);

    const isHp = seg.pressureClass?.includes("600") || seg.pn?.includes("600");
    const stroke = isHp ? "#d97706" : "#0284c7";
    const strokeWidth = Math.max(0.8, Math.min(2.5, seg.dn / 150));

    svgContent += `<line x1="${p1.x.toFixed(2)}" y1="${p1.y.toFixed(2)}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}" stroke="${stroke}" stroke-width="${strokeWidth.toFixed(2)}" stroke-linecap="round"/>`;

    // Étiquette du tronçon
    if (config.showPipeLabels) {
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      const diaInch = DIAMETER_BY_DN[seg.dn]?.inch || `DN${seg.dn}`;
      const lengthStr = formatLength(seg.length, config.unitSystem || "metric");
      const lbl = `${diaInch} · L=${lengthStr}`;
      svgContent += `<g transform="translate(${mx.toFixed(2)}, ${(my - 2.5).toFixed(2)})">
        <rect x="-14" y="-2" width="28" height="4" rx="0.8" fill="#ffffff" stroke="#94a3b8" stroke-width="0.3"/>
        <text x="0" y="0.8" text-anchor="middle" font-size="1.8" font-family="sans-serif" font-weight="bold" fill="#0f172a">${lbl}</text>
      </g>`;
    }
  });

  // Nœuds et Équipements
  nodes.forEach((n) => {
    const p = isoProjectPrint(n.x, n.y, n.z, modelCenterIsoX, modelCenterIsoY, scaleMm);

    if (n.equipmentType) {
      const eq = n.equipmentType;
      if (eq.includes("vanne")) {
        svgContent += `<g transform="translate(${p.x.toFixed(2)}, ${p.y.toFixed(2)}) scale(0.65)">
          <path d="M -5 -3 L 0 0 L -5 3 Z" fill="#0284c7" stroke="#0284c7" stroke-width="0.6"/>
          <path d="M 5 -3 L 0 0 L 5 3 Z" fill="#0284c7" stroke="#0284c7" stroke-width="0.6"/>
          <line x1="0" y1="0" x2="0" y2="-4" stroke="#0284c7" stroke-width="0.8"/>
          <line x1="-2" y1="-4" x2="2" y2="-4" stroke="#0284c7" stroke-width="0.8"/>
        </g>`;
      } else if (eq.startsWith("coude")) {
        svgContent += `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="1.5" fill="#ffffff" stroke="#d97706" stroke-width="0.8"/>`;
      } else if (eq.startsWith("bride") || eq === "joint" || eq === "jmi") {
        svgContent += `<g transform="translate(${p.x.toFixed(2)}, ${p.y.toFixed(2)})">
          <line x1="-1.2" y1="-3" x2="-1.2" y2="3" stroke="#b45309" stroke-width="0.8"/>
          <line x1="1.2" y1="-3" x2="1.2" y2="3" stroke="#b45309" stroke-width="0.8"/>
        </g>`;
      } else {
        svgContent += `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="1.4" fill="#0284c7"/>`;
      }

      // Libellé de l'équipement
      const label = equipmentLabel(n);
      svgContent += `<text x="${(p.x + 3).toFixed(2)}" y="${(p.y - 1).toFixed(2)}" font-size="2" font-family="sans-serif" font-weight="bold" fill="#0f172a">${label}</text>`;
    } else if (n.type === "entree_poste") {
      svgContent += `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="2.2" fill="#16a34a"/>
      <text x="${(p.x + 3).toFixed(2)}" y="${(p.y + 0.8).toFixed(2)}" font-size="2.2" font-family="sans-serif" font-weight="bold" fill="#16a34a">ENTRÉE ${n.name}</text>`;
    } else if (n.type === "sortie_poste") {
      svgContent += `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="2.2" fill="#dc2626"/>
      <text x="${(p.x + 3).toFixed(2)}" y="${(p.y + 0.8).toFixed(2)}" font-size="2.2" font-family="sans-serif" font-weight="bold" fill="#dc2626">SORTIE ${n.name}</text>`;
    } else {
      svgContent += `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="1.2" fill="#475569"/>
      <text x="${(p.x + 2).toFixed(2)}" y="${(p.y - 1).toFixed(2)}" font-size="1.8" font-family="sans-serif" fill="#64748b">${n.name}</text>`;
    }
  });

  // Soudures et Repères
  if (config.showWelds) {
    joints
      .filter((j) => j.weldNumber)
      .forEach((joint) => {
        const node = nodes.find((n) => n.id === joint.nodeId);
        if (!node) return;
        const wPos = portWorldPosition(node, joint.portId);
        const pt = isoProjectPrint(wPos.x, wPos.y, wPos.z, modelCenterIsoX, modelCenterIsoY, scaleMm);
        const isField = joint.location === "field";
        const color = isField ? "#dc2626" : "#b45309";

        svgContent += `<g transform="translate(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})">
          <circle r="1.6" fill="#ffffff" stroke="${color}" stroke-width="0.5"/>
          <line x1="0" y1="-1.6" x2="2.5" y2="-4" stroke="${color}" stroke-width="0.3"/>
          <text x="3" y="-3.5" font-size="1.8" font-family="monospace" font-weight="bold" fill="${color}">${joint.weldNumber}</text>
        </g>`;
      });
  }

  // Cotations Normalisées
  if (config.showDimensions) {
    dimensions.forEach((dim) => {
      const aNode = nodes.find((n) => n.id === dim.a.nodeId);
      const bNode = nodes.find((n) => n.id === dim.b.nodeId);
      if (!aNode || !bNode) return;

      const p1 = isoProjectPrint(aNode.x, aNode.y, aNode.z, modelCenterIsoX, modelCenterIsoY, scaleMm);
      const p2 = isoProjectPrint(bNode.x, bNode.y, bNode.z, modelCenterIsoX, modelCenterIsoY, scaleMm);
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;

      const dist = Math.hypot(bNode.x - aNode.x, bNode.y - aNode.y, bNode.z - aNode.z);
      const label = dim.label || (dim.unit === "mm" ? `${Math.round(dist * 1000)} mm` : `${dist.toFixed(2)} m`);

      svgContent += `<g>
        <line x1="${p1.x.toFixed(2)}" y1="${(p1.y - 4).toFixed(2)}" x2="${p2.x.toFixed(2)}" y2="${(p2.y - 4).toFixed(2)}" stroke="#0891b2" stroke-width="0.4" stroke-dasharray="1,1"/>
        <line x1="${p1.x.toFixed(2)}" y1="${p1.y.toFixed(2)}" x2="${p1.x.toFixed(2)}" y2="${(p1.y - 4.5).toFixed(2)}" stroke="#94a3b8" stroke-width="0.25"/>
        <line x1="${p2.x.toFixed(2)}" y1="${p2.y.toFixed(2)}" x2="${p2.x.toFixed(2)}" y2="${(p2.y - 4.5).toFixed(2)}" stroke="#94a3b8" stroke-width="0.25"/>
        <rect x="${(mx - 8).toFixed(2)}" y="${(my - 5.5).toFixed(2)}" width="16" height="3" rx="0.6" fill="#ffffff" stroke="#0891b2" stroke-width="0.3"/>
        <text x="${mx.toFixed(2)}" y="${(my - 3.4).toFixed(2)}" text-anchor="middle" font-size="1.8" font-family="sans-serif" font-weight="bold" fill="#0891b2">${label}</text>
      </g>`;
    });
  }

  svgContent += `</g>`;

  // 6. LÉGENDE ADAPTATIVE (SEULEMENT COMPOSANTS RÉELS)
  if (config.showAdaptiveLegend) {
    const legendItems = buildAdaptiveLegend(nodes, segments, joints);
    const lHeight = Math.min(60, 8 + legendItems.length * 5.2);

    svgContent += `<g transform="translate(${legendX}, ${legendY})">
      <rect x="0" y="0" width="${legendW}" height="${lHeight}" rx="1.5" fill="#f8fafc" stroke="#cbd5e1" stroke-width="0.5"/>
      <rect x="0" y="0" width="${legendW}" height="5" rx="1.5" fill="#e2e8f0"/>
      <text x="4" y="3.5" font-size="2.2" font-family="sans-serif" font-weight="bold" fill="#0f172a">LÉGENDE TECHNIQUE ADAPTATIVE (ISO 7200)</text>`;

    legendItems.slice(0, 10).forEach((item, idx) => {
      const iy = 8 + idx * 5.2;
      svgContent += `<g transform="translate(4, ${iy})">
        <g transform="scale(0.35)">${item.svgIconMarkup}</g>
        <text x="12" y="3" font-size="1.9" font-family="sans-serif" fill="#334155">${item.label}</text>
      </g>`;
    });

    svgContent += `</g>`;
  }

  // 7. NOMENCLATURE DU MATÉRIEL (BOM)
  if (config.showBomTable && bomRows.length > 0) {
    const tableRows = bomRows.slice(0, 12);
    const bomHeight = Math.min(innerH - bomY - 5, 8 + tableRows.length * 4.2);

    svgContent += `<g transform="translate(${bomX}, ${bomY})">
      <rect x="0" y="0" width="${bomW}" height="${bomHeight}" rx="1.5" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.5"/>
      <rect x="0" y="0" width="${bomW}" height="4.5" rx="1.5" fill="#0284c7"/>
      <text x="4" y="3.2" font-size="2.2" font-family="sans-serif" font-weight="bold" fill="#ffffff">NOMENCLATURE DU MATÉRIEL (BOM)</text>
      <text x="${bomW - 4}" y="3.2" text-anchor="end" font-size="1.8" font-family="sans-serif" fill="#e0f2fe">${bomRows.length} repères</text>`;

    // En-tête de colonnes
    svgContent += `<g transform="translate(0, 4.5)" font-size="1.8" font-family="sans-serif" font-weight="bold" fill="#475569">
      <rect x="0" y="0" width="${bomW}" height="3.5" fill="#f1f5f9"/>
      <text x="3" y="2.5">RP</text>
      <text x="12" y="2.5">DÉSIGNATION</text>
      <text x="${bomW - 32}" y="2.5">DN</text>
      <text x="${bomW - 18}" y="2.5">QTÉ</text>
      <text x="${bomW - 4}" y="2.5" text-anchor="end">LONG.</text>
    </g>`;

    // Lignes de tableau
    tableRows.forEach((r, idx) => {
      const ry = 8 + idx * 4.2;
      const bg = idx % 2 === 1 ? ' fill="#f8fafc"' : "";
      svgContent += `<g transform="translate(0, ${ry})">
        <rect x="0" y="0" width="${bomW}" height="4.2"${bg}/>
        <line x1="0" y1="4.2" x2="${bomW}" y2="4.2" stroke="#f1f5f9" stroke-width="0.3"/>
        <text x="3" y="3" font-size="1.7" font-weight="bold" fill="#0284c7">${r.index}</text>
        <text x="12" y="3" font-size="1.7" fill="#1e293b">${r.designation.slice(0, 26)}</text>
        <text x="${bomW - 32}" y="3" font-size="1.7" fill="#475569">DN${r.dn}</text>
        <text x="${bomW - 18}" y="3" font-size="1.7" font-weight="bold" fill="#0f172a">${r.qty}</text>
        <text x="${bomW - 4}" y="3" text-anchor="end" font-size="1.7" fill="#475569">${r.length > 0 ? formatLength(r.length, config.unitSystem || "metric") : "-"}</text>
      </g>`;
    });

    svgContent += `</g>`;
  }

  // 8. CARTOUCHE TECHNIQUE CONFORME ISO 7200
  if (config.showCartoucheIso7200) {
    const compName = pdiCompanyName();
    const stdNote = pdiStandardsNote();
    const pressureDesignFormatted = formatPressure(config.pressureDesign || 75, config.unitSystem || "metric");
    const hydrotestFormatted = formatPressure(config.hydrotestPressure || 112.5, config.unitSystem || "metric");

    svgContent += `<g id="iso-7200-title-block" transform="translate(${cartoucheX}, ${cartoucheY})">
      <rect x="0" y="0" width="${cartoucheW}" height="${cartoucheH}" fill="#ffffff" stroke="#0f172a" stroke-width="0.7"/>

      <!-- Bloc supérieur : Titre et Organisation -->
      <line x1="0" y1="14" x2="${cartoucheW}" y2="14" stroke="#0f172a" stroke-width="0.4"/>
      <line x1="${cartoucheW * 0.5}" y1="0" x2="${cartoucheW * 0.5}" y2="14" stroke="#0f172a" stroke-width="0.4"/>

      <!-- Logo & Société -->
      <text x="3" y="4.5" font-size="2.2" font-family="sans-serif" font-weight="bold" fill="#64748b">PROPRIÉTAIRE DU PLAN / ORGANISME</text>
      <text x="3" y="9.5" font-size="4" font-family="sans-serif" font-weight="900" fill="#0f172a">${compName}</text>
      <text x="3" y="12.5" font-size="1.8" font-family="sans-serif" fill="#64748b">${config.wilayaOrSite || "INSTALLATION GAZ"}</text>

      <!-- Titre principal du document -->
      <text x="${cartoucheW * 0.5 + 3}" y="4.5" font-size="2.2" font-family="sans-serif" font-weight="bold" fill="#64748b">TITRE DU DOCUMENT (ISO 7200)</text>
      <text x="${cartoucheW * 0.5 + 3}" y="9.5" font-size="3.6" font-family="sans-serif" font-weight="bold" fill="#0284c7">${config.documentTitle.slice(0, 32)}</text>
      <text x="${cartoucheW * 0.5 + 3}" y="12.5" font-size="1.8" font-family="sans-serif" fill="#64748b">RÉF : ${config.documentNumber} · INDICE ${config.revision}</text>

      <!-- Bloc intermédiaire : Approbations & Intervenants -->
      <line x1="0" y1="28" x2="${cartoucheW}" y2="28" stroke="#0f172a" stroke-width="0.4"/>
      <line x1="${cartoucheW * 0.33}" y1="14" x2="${cartoucheW * 0.33}" y2="28" stroke="#0f172a" stroke-width="0.3"/>
      <line x1="${cartoucheW * 0.66}" y1="14" x2="${cartoucheW * 0.66}" y2="28" stroke="#0f172a" stroke-width="0.3"/>

      <!-- Dessiné -->
      <text x="3" y="17.5" font-size="1.8" font-family="sans-serif" fill="#64748b">DESSINÉ PAR :</text>
      <text x="3" y="22" font-size="2.4" font-family="sans-serif" font-weight="bold" fill="#0f172a">${config.drawnBy}</text>
      <text x="3" y="26" font-size="1.6" font-family="sans-serif" fill="#64748b">${new Date().toISOString().slice(0, 10)}</text>

      <!-- Vérifié -->
      <text x="${cartoucheW * 0.33 + 3}" y="17.5" font-size="1.8" font-family="sans-serif" fill="#64748b">VÉRIFIÉ PAR :</text>
      <text x="${cartoucheW * 0.33 + 3}" y="22" font-size="2.4" font-family="sans-serif" font-weight="bold" fill="#0f172a">${config.checkedBy}</text>
      <text x="${cartoucheW * 0.33 + 3}" y="26" font-size="1.6" font-family="sans-serif" fill="#64748b">CONFORME CAO</text>

      <!-- Approuvé -->
      <text x="${cartoucheW * 0.66 + 3}" y="17.5" font-size="1.8" font-family="sans-serif" fill="#64748b">APPROUVÉ PAR :</text>
      <text x="${cartoucheW * 0.66 + 3}" y="22" font-size="2.4" font-family="sans-serif" font-weight="bold" fill="#0f172a">${config.approvedBy}</text>
      <text x="${cartoucheW * 0.66 + 3}" y="26" font-size="1.6" font-family="sans-serif" fill="#16a34a">BON POUR EXÉCUTION</text>

      <!-- Bloc Données Spécifications Process -->
      <line x1="0" y1="42" x2="${cartoucheW}" y2="42" stroke="#0f172a" stroke-width="0.4"/>
      <line x1="${cartoucheW * 0.25}" y1="28" x2="${cartoucheW * 0.25}" y2="42" stroke="#0f172a" stroke-width="0.3"/>
      <line x1="${cartoucheW * 0.5}" y1="28" x2="${cartoucheW * 0.5}" y2="42" stroke="#0f172a" stroke-width="0.3"/>
      <line x1="${cartoucheW * 0.75}" y1="28" x2="${cartoucheW * 0.75}" y2="42" stroke="#0f172a" stroke-width="0.3"/>

      <!-- Données process -->
      <text x="3" y="32" font-size="1.8" font-family="sans-serif" fill="#64748b">PRESSION SERVICE</text>
      <text x="3" y="38" font-size="2.8" font-family="sans-serif" font-weight="bold" fill="#0284c7">${pressureDesignFormatted}</text>

      <text x="${cartoucheW * 0.25 + 3}" y="32" font-size="1.8" font-family="sans-serif" fill="#64748b">ÉPREUVE HYDRO</text>
      <text x="${cartoucheW * 0.25 + 3}" y="38" font-size="2.8" font-family="sans-serif" font-weight="bold" fill="#dc2626">${hydrotestFormatted}</text>

      <text x="${cartoucheW * 0.5 + 3}" y="32" font-size="1.8" font-family="sans-serif" fill="#64748b">ÉCHELLE PLANCHE</text>
      <text x="${cartoucheW * 0.5 + 3}" y="38" font-size="2.6" font-family="sans-serif" font-weight="bold" fill="#0f172a">${scaleAppliedLabel}</text>

      <text x="${cartoucheW * 0.75 + 3}" y="32" font-size="1.8" font-family="sans-serif" fill="#64748b">FORMAT FEUILLE</text>
      <text x="${cartoucheW * 0.75 + 3}" y="38" font-size="3" font-family="sans-serif" font-weight="bold" fill="#0f172a">${config.format} ${config.orientation === "landscape" ? "PAYSAGE" : "PORTRAIT"}</text>

      <!-- Pied du cartouche : Normes et signature logicielle -->
      <rect x="0" y="42" width="${cartoucheW}" height="${cartoucheH - 42}" fill="#f8fafc"/>
      <text x="3" y="47" font-size="1.8" font-family="sans-serif" fill="#475569">NORMES : ${stdNote}</text>
      <text x="3" y="51" font-size="1.6" font-family="sans-serif" fill="#94a3b8">FOLIO ${config.pageNumber} SUR ${config.totalPages} · SYSTÈME DE GESTION CAO INDUSTRIEL CONFORME ISO 7200 / ISO 5457</text>
      <text x="${cartoucheW - 3}" y="49" text-anchor="end" font-size="2.2" font-family="sans-serif" font-weight="bold" fill="#0f172a">${PDI_ENGINE_IDENTITY.vendor}</text>
    </g>`;
  }

  // 9. WATERMARK EN PIED DE PLANCHE
  if (config.showWatermarkFootprint) {
    const wmX = leftM + 5;
    const wmY = topM + innerH - 2.5;
    svgContent += `<text x="${wmX}" y="${wmY}" font-size="1.8" font-family="sans-serif" font-weight="bold" fill="#94a3b8">
      POWERED BY ${PDI_ENGINE_IDENTITY.vendor} · ${PDI_ENGINE_IDENTITY.product} v${PDI_ENGINE_IDENTITY.version} · ${PDI_ENGINE_IDENTITY.copyright} [${PDI_WATERMARK_SIGNATURE}]
    </text>`;
  }

  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" style="background:#ffffff;">
    ${svgContent}
  </svg>`;

  return {
    svgMarkup,
    widthMm: W,
    heightMm: H,
    scaleApplied: scaleAppliedLabel,
  };
}
