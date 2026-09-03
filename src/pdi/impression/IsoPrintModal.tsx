/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * COPYRIGHT (C) 2026 ORTHOGONAL - ENG. ALL RIGHTS RESERVED.
 * PROPRIETARY INDUSTRIAL PIPING CAD & ISOMETRIC ENGINE.
 * DIALOGUE MODAL D'IMPRESSION PROFESSIONNEL A5 - A0 (PATCH 020F).
 */

import React, { useState, useMemo } from "react";
import {
  IsoNode,
  IsoSegment,
  IsoDimension,
  PipingJoint,
} from "../isometric/types/isoGraphTypes";
import {
  IsoPaperFormat,
  IsoOrientation,
  ISO_SCALES,
  IsoPrintConfig,
  DEFAULT_PRINT_CONFIG,
} from "./isoSheetStandards";
import { generateIsoDrawingSvg, BomRow } from "./isoSvgGenerator";
import { Printer, Download, X, Layers, CheckSquare, Eye, FileText, Settings2 } from "lucide-react";
import { pdiFeuilleImpression017L, PDI_STYLE_IMPRESSION_017L } from "./pdiImpression017L";

export interface IsoPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  wilaya: string;
  pressDesign: number;
  hydrotest: number;
  nodes: IsoNode[];
  segments: IsoSegment[];
  dimensions: IsoDimension[];
  joints: PipingJoint[];
  bomRows: BomRow[];
  initialUnitSystem?: "metric" | "imperial";
}

export const IsoPrintModal: React.FC<IsoPrintModalProps> = ({
  isOpen,
  onClose,
  projectName,
  wilaya,
  pressDesign,
  hydrotest,
  nodes,
  segments,
  dimensions,
  joints,
  bomRows,
  initialUnitSystem,
}) => {
  const [config, setConfig] = useState<IsoPrintConfig>(() => ({
    ...DEFAULT_PRINT_CONFIG,
    documentTitle: projectName || "PLAN ISOMÉTRIQUE TUYAUTERIE INDUSTRIELLE",
    pressureDesign: pressDesign,
    hydrotestPressure: hydrotest,
    wilayaOrSite: wilaya || "SITE INDUSTRIEL",
    unitSystem: initialUnitSystem || "metric",
  }));

  const [activeTab, setActiveTab] = useState<"layout" | "metadata" | "layers">("layout");

  // Rendu vectoriel SVG de la planche en temps réel
  const drawingResult = useMemo(() => {
    return generateIsoDrawingSvg(nodes, segments, dimensions, joints, bomRows, config);
  }, [nodes, segments, dimensions, joints, bomRows, config]);

  if (!isOpen) return null;

  /**
   * Lance l'impression papier ou l'export PDF via la boîte de dialogue native du navigateur
   */
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres pop-up pour afficher le module d'impression.");
      return;
    }

    const cssBase = pdiFeuilleImpression017L();
    const isLandscape = config.orientation === "landscape";
    const pageSize = `${config.format} ${isLandscape ? "landscape" : "portrait"}`;

    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>${config.documentTitle} — ${config.documentNumber} [${config.format}]</title>
  <style>
    @page {
      size: ${pageSize};
      margin: 0;
    }
    ${PDI_STYLE_IMPRESSION_017L}
    ${cssBase}
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #ffffff;
      color: #0f172a;
      overflow: hidden;
    }
    .print-sheet-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
    }
    .print-sheet-container svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  </style>
</head>
<body>
  <div class="print-sheet-container">
    ${drawingResult.svgMarkup}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  /**
   * Télécharge directement le fichier SVG vectoriel pur de la planche
   */
  const handleDownloadSvg = () => {
    const blob = new Blob([drawingResult.svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = config.documentTitle.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
    link.href = url;
    link.download = `${safeTitle}_${config.format}_${config.orientation}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[10050] bg-black/80 backdrop-blur-md flex items-center justify-center p-3">
      <div className="w-[96vw] max-w-[1440px] h-[92vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* En-tête du dialogue */}
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/40 text-cyan-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-wide text-white uppercase">
                  Module d'Impression Normalisé ISO 216 / 7200 / 5457
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-900/60 border border-cyan-700/40 text-cyan-300">
                  Palier 1 · Patch 020F
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Génération vectorielle certifiée ORTHOGONAL - ENG pour formats A5 à A0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-200 transition-colors"
              title="Télécharger le plan en format SVG vectoriel haute définition"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exporter SVG Vectoriel</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-lg transition-colors"
              title="Ouvrir le menu d'impression / export PDF du navigateur"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer / Exporter PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corps principal : Volet de configuration à gauche + Prévisualisation à droite */}
        <div className="flex-1 flex min-h-0">
          {/* Panneau de configuration latéral */}
          <div className="w-[380px] border-r border-zinc-800 flex flex-col bg-zinc-900/30 overflow-y-auto">
            {/* Onglets de paramétrage */}
            <div className="flex border-b border-zinc-800 px-3 pt-2 gap-1 bg-zinc-900/50">
              <button
                type="button"
                onClick={() => setActiveTab("layout")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === "layout"
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Mise en page</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("metadata")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === "metadata"
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Cartouche ISO</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("layers")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === "layers"
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Calques & Éléments</span>
              </button>
            </div>

            {/* Contenu Onglet 1 : Mise en page */}
            {activeTab === "layout" && (
              <div className="p-4 space-y-4 text-xs">
                {/* Format de papier ISO 216 */}
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Format de planche (ISO 216)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["A5", "A4", "A3", "A2", "A1", "A0"] as IsoPaperFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, format: fmt }))}
                        className={`px-3 py-2 rounded-lg font-mono font-bold text-center border transition-all ${
                          config.format === fmt
                            ? "bg-cyan-950 border-cyan-500 text-cyan-300 shadow"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500">
                    Dimensions : {drawingResult.widthMm} × {drawingResult.heightMm} mm
                  </div>
                </div>

                {/* Orientation */}
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Orientation</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, orientation: "landscape" }))}
                      className={`px-3 py-2 rounded-lg font-bold text-center border transition-all ${
                        config.orientation === "landscape"
                          ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      Paysage (Standard ISO)
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, orientation: "portrait" }))}
                      className={`px-3 py-2 rounded-lg font-bold text-center border transition-all ${
                        config.orientation === "portrait"
                          ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      Portrait
                    </button>
                  </div>
                </div>

                {/* Échelle normalisée */}
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Échelle de représentation
                  </label>
                  <select
                    value={config.scale}
                    onChange={(e) => setConfig((prev) => ({ ...prev, scale: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyan-500 font-medium"
                  >
                    {ISO_SCALES.map((sc) => (
                      <option key={sc.value} value={sc.value}>
                        {sc.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-[11px] text-zinc-500">
                    Échelle effective appliquée : {drawingResult.scaleApplied}
                  </div>
                </div>

                {/* Système d'Unités Bi-Système (019U) */}
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Système d'unités (ISO 80000 / IEEE SI 10)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, unitSystem: "metric" }))}
                      className={`px-2.5 py-2 rounded-lg font-bold text-left border transition-all ${
                        config.unitSystem !== "imperial"
                          ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <div className="font-bold text-xs">Métrique (SI)</div>
                      <div className="text-[10px] text-zinc-400">m, mm, bar, kg, °C</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, unitSystem: "imperial" }))}
                      className={`px-2.5 py-2 rounded-lg font-bold text-left border transition-all ${
                        config.unitSystem === "imperial"
                          ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <div className="font-bold text-xs">Impérial / US</div>
                      <div className="text-[10px] text-zinc-400">ft-in, in, psi, lbs, °F</div>
                    </button>
                  </div>
                </div>

                {/* Les 4 cases à cocher obligatoires (020F2) */}
                <div className="pt-2 border-t border-zinc-800 space-y-2.5">
                  <div className="text-[11px] font-black uppercase text-zinc-400 tracking-wider">
                    Options Réglementaires & Standards
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showCartoucheIso7200}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, showCartoucheIso7200: e.target.checked }))
                      }
                      className="mt-0.5 rounded border-zinc-700 text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <div className="font-bold text-zinc-200">Cartouche Normalisé ISO 7200</div>
                      <div className="text-[11px] text-zinc-500">
                        Bloc technique 180×55mm avec révisions, intervenants et données process
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showAdaptiveLegend}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, showAdaptiveLegend: e.target.checked }))
                      }
                      className="mt-0.5 rounded border-zinc-700 text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <div className="font-bold text-zinc-200">Légende Technique Adaptative</div>
                      <div className="text-[11px] text-zinc-500">
                        Affiche uniquement les composants réels présents dans le réseau
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showIso5457Grid}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, showIso5457Grid: e.target.checked }))
                      }
                      className="mt-0.5 rounded border-zinc-700 text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <div className="font-bold text-zinc-200">Cadre & Quadrillage ISO 5457</div>
                      <div className="text-[11px] text-zinc-500">
                        Marge de reliure (20mm), repères de centrage et coordonnées (A-D, 1-6)
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showWatermarkFootprint}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          showWatermarkFootprint: e.target.checked,
                        }))
                      }
                      className="mt-0.5 rounded border-zinc-700 text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <div className="font-bold text-zinc-200">
                        Pied de planche certifié ORTHOGONAL - ENG
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Signature logicielle inviolable et mention de copyright contractuel
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Contenu Onglet 2 : Métadonnées du Cartouche */}
            {activeTab === "metadata" && (
              <div className="p-4 space-y-3.5 text-xs">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Titre du document</label>
                  <input
                    type="text"
                    value={config.documentTitle}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, documentTitle: e.target.value }))
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">Numéro de plan</label>
                    <input
                      type="text"
                      value={config.documentNumber}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, documentNumber: e.target.value }))
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">Indice de révision</label>
                    <input
                      type="text"
                      value={config.revision}
                      onChange={(e) => setConfig((prev) => ({ ...prev, revision: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Dessiné par</label>
                  <input
                    type="text"
                    value={config.drawnBy}
                    onChange={(e) => setConfig((prev) => ({ ...prev, drawnBy: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">Vérifié par</label>
                    <input
                      type="text"
                      value={config.checkedBy}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, checkedBy: e.target.value }))
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">Approuvé par</label>
                    <input
                      type="text"
                      value={config.approvedBy}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, approvedBy: e.target.value }))
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">
                      Pression service (bar)
                    </label>
                    <input
                      type="number"
                      value={config.pressureDesign || ""}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          pressureDesign: Number(e.target.value),
                        }))
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">
                      Épreuve hydro (bar)
                    </label>
                    <input
                      type="number"
                      value={config.hydrotestPressure || ""}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          hydrotestPressure: Number(e.target.value),
                        }))
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Fluide / Service</label>
                  <input
                    type="text"
                    value={config.serviceFluid || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, serviceFluid: e.target.value }))
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* Contenu Onglet 3 : Calques & Composants */}
            {activeTab === "layers" && (
              <div className="p-4 space-y-3 text-xs">
                <div className="text-[11px] font-black uppercase text-zinc-400 tracking-wider">
                  Visibilité des calques et annotations
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showBomTable}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, showBomTable: e.target.checked }))
                    }
                    className="rounded border-zinc-700 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="font-bold text-zinc-200">
                    Tableau de nomenclature matériel (BOM)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showDimensions}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, showDimensions: e.target.checked }))
                    }
                    className="rounded border-zinc-700 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="font-bold text-zinc-200">Cotations dimensionnelles</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showWelds}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, showWelds: e.target.checked }))
                    }
                    className="rounded border-zinc-700 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="font-bold text-zinc-200">
                    Numéros et symboles de soudure (Wxxx)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showPipeLabels}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, showPipeLabels: e.target.checked }))
                    }
                    className="rounded border-zinc-700 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="font-bold text-zinc-200">
                    Étiquettes des tuyaux (Diamètre / Longueur)
                  </span>
                </label>

                <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-500">
                  Total : {nodes.length} nœuds, {segments.length} tronçons, {joints.length} soudures
                </div>
              </div>
            )}
          </div>

          {/* Zone de prévisualisation en direct (Aperçu SVG interactif) */}
          <div className="flex-1 bg-zinc-950 p-6 flex flex-col items-center justify-center overflow-auto relative">
            <div className="absolute top-3 left-4 flex items-center gap-2 text-[11px] font-bold text-zinc-400 bg-zinc-900/80 border border-zinc-800 px-2.5 py-1 rounded-lg">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Aperçu WYSIWYG à l'échelle {drawingResult.scaleApplied}</span>
            </div>

            {/* Cadre de la feuille simulée */}
            <div
              className="bg-white rounded shadow-2xl p-0.5 border border-zinc-400 max-w-full max-h-[78vh] flex items-center justify-center overflow-hidden"
              style={{
                aspectRatio: `${drawingResult.widthMm} / ${drawingResult.heightMm}`,
              }}
              dangerouslySetInnerHTML={{ __html: drawingResult.svgMarkup }}
            />
          </div>
        </div>

        {/* Pied de dialogue */}
        <div className="px-5 py-2.5 border-t border-zinc-800 bg-zinc-900/70 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Format conforme ISO 216 · Cartouche conforme ISO 7200 · Dessin conforme ISO 5457</span>
          </div>
          <div>Propulsé par ORTHOGONAL - ENG · Moteur PD&I v4.8d</div>
        </div>
      </div>
    </div>
  );
};
