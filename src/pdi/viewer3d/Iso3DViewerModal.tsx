/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * COPYRIGHT (C) 2026 ORTHOGONAL - ENG. ALL RIGHTS RESERVED.
 * 
 * MODULE : MODALE INTERACTIVE 3D SOLIDE EXTRUDÉE & ORBITE
 * Référentiels : ASME B31.3, ASME B16.9, ASME B16.5, MSS SP-58.
 * Version : 021C-ETAPE-C (05 Septembre 2026)
 */

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  RotateCw,
  Camera,
  Maximize2,
  Minimize2,
  X,
  Layers,
  Compass,
  Grid,
  Flame,
  Wrench,
  Download,
  Eye,
  Info,
  Sliders,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Pdi3dSceneManager } from "./pdi3dSceneManager";
import type {
  Viewer3dOptions,
  Viewer3dDataPayload,
  Selected3dEntity,
  CameraViewPreset,
  RenderShadingMode,
  CameraProjectionType,
} from "./types3d";

interface Iso3DViewerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  data: Viewer3dDataPayload;
  onSwitchToIso?: () => void;
  onSwitchToWeldMap?: () => void;
  onEntitySelected?: (entity: Selected3dEntity | null) => void;
  embedded?: boolean;
}

export const Iso3DViewerModal: React.FC<Iso3DViewerModalProps> = ({
  isOpen = true,
  onClose,
  data,
  onSwitchToIso,
  onSwitchToWeldMap,
  onEntitySelected,
  embedded = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<Pdi3dSceneManager | null>(null);

  // Options du viewer
  const [options, setOptions] = useState<Viewer3dOptions>({
    shadingMode: "color_by_spool",
    projection: "perspective",
    showWelds: true,
    showSupports: true,
    showDimensions: false,
    showGroundGrid: true,
    showCompassAxes: true,
    autoRotate: false,
    clippingPlaneEnabled: false,
    clippingZPercent: 100,
    selectedSpoolId: "all",
    ambientOcclusion: true,
    bloomHighlights: true,
    wallThicknessVisible: true,
  });

  const [selectedEntity, setSelectedEntity] = useState<Selected3dEntity | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<Selected3dEntity | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);

  // Initialisation et gestion du canvas 3D WebGL
  useEffect(() => {
    if ((!isOpen && !embedded) || !containerRef.current) return;

    const manager = new Pdi3dSceneManager(
      containerRef.current,
      options,
      (entity) => {
        setSelectedEntity(entity);
        onEntitySelected?.(entity);
      },
      (entity) => setHoveredEntity(entity)
    );
    sceneManagerRef.current = manager;

    manager.buildModel(data, options);

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      manager.onKeyDown(e);
      if (e.key === "Escape" && onClose) {
        onClose();
      } else if (e.key === "0" || e.key === "Home") {
        manager.fitToExtents();
      } else if (e.key === "1") {
        manager.setViewPreset("iso_sw");
      } else if (e.key === "2") {
        manager.setViewPreset("iso_se");
      } else if (e.key === "3") {
        manager.setViewPreset("top");
      } else if (e.key === "4") {
        manager.setViewPreset("front");
      } else if (e.key === "r" || e.key === "R") {
        setOptions((prev) => {
          const next = !prev.autoRotate;
          manager.setAutoRotate(next);
          return { ...prev, autoRotate: next };
        });
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
      } else if (e.key === "+" || e.key === "=" || e.key === "PageUp") {
        e.preventDefault();
        manager.zoomStep(0.88);
      } else if (e.key === "-" || e.key === "_" || e.key === "PageDown") {
        e.preventDefault();
        manager.zoomStep(1.14);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      manager.onKeyUp(e);
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("keyup", handleKeyUp, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("keyup", handleKeyUp, { capture: true });
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, [isOpen, embedded]);

  // Répercuter les changements de données
  useEffect(() => {
    if (sceneManagerRef.current && (isOpen || embedded)) {
      sceneManagerRef.current.buildModel(data, options);
    }
  }, [data, options.selectedSpoolId, options.shadingMode, options.showWelds, options.showSupports]);

  if (!isOpen && !embedded) return null;

  const handleShadingChange = (mode: RenderShadingMode) => {
    setOptions((prev) => ({ ...prev, shadingMode: mode }));
    sceneManagerRef.current?.setShadingMode(mode);
  };

  const handleProjectionChange = (proj: CameraProjectionType) => {
    setOptions((prev) => ({ ...prev, projection: proj }));
    sceneManagerRef.current?.setProjection(proj);
  };

  const handlePresetChange = (preset: CameraViewPreset) => {
    sceneManagerRef.current?.setViewPreset(preset);
  };

  const toggleAutoRotate = () => {
    const next = !options.autoRotate;
    setOptions((prev) => ({ ...prev, autoRotate: next }));
    sceneManagerRef.current?.setAutoRotate(next);
  };

  const handleFit = () => {
    sceneManagerRef.current?.fitToExtents();
  };

  const handleSnapshot = () => {
    if (!sceneManagerRef.current) return;
    const dataUrl = sceneManagerRef.current.takeSnapshotPng(data.projectName || "PD&I 3D Piping");
    const link = document.createElement("a");
    link.download = `PDI-3D-EXTRUDED-${(data.projectName || "PIPING").replace(/\s+/g, "_")}.png`;
    link.href = dataUrl;
    link.click();
    setSnapshotSuccess(true);
    setTimeout(() => setSnapshotSuccess(false), 2500);
  };

  const content = (
    <div
      className={`bg-[#0A0F18] border border-cyan-500/40 flex flex-col overflow-hidden text-slate-100 transition-all duration-300 w-full h-full ${
        embedded ? "rounded-none border-none" : fullscreen ? "rounded-none" : "rounded-2xl shadow-2xl max-w-7xl h-[92vh]"
      }`}
    >
        {/* Barre d'outils supérieure 3D */}
        <header className="px-4 py-2.5 bg-[#0e1626] border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          {/* Titre, Statut & Bascule des 3 Rendus */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-cyan-900/40">
                <Box className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white tracking-wider uppercase">Vue 3D Solide Extrudée</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-700/50">
                    ASME B31.3
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {data.segments.length} tubes · {data.welds.length} soudures · {data.spools.length} spools
                  </span>
                </div>
              </div>
            </div>

            {/* Sélecteur rapide des 3 Rendus de Tuyauterie (uniquement en mode modal) */}
            {!embedded && (
              <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 gap-1">
                {onSwitchToIso && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSwitchToIso();
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1.5"
                    title="Basculer vers le Schéma Isométrique 2D (ISO 30°)"
                  >
                    <span>📐 1. Vue ISO 2D</span>
                  </button>
                )}
                {onSwitchToWeldMap && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSwitchToWeldMap();
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-300 hover:text-white hover:bg-amber-950/60 transition-all flex items-center gap-1.5"
                    title="Basculer vers le Plan de Soudage & Carnet de Spools (Weld Map)"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>2. Soudures & Spools</span>
                  </button>
                )}
                <div className="px-2.5 py-1 rounded-lg text-xs font-black bg-cyan-600 text-white shadow-sm flex items-center gap-1.5 border border-cyan-400/40">
                  <Box className="w-3.5 h-3.5 text-cyan-200" />
                  <span>3. 3D Solide Extrudée</span>
                </div>
              </div>
            )}
          </div>

          {/* Contrôles centraux : Rendu, Vues et Spools */}
          <div className="flex items-center gap-1.5 bg-[#060b13] p-1 rounded-xl border border-slate-800 flex-wrap">
            {/* Mode d'ombrage */}
            <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-800">
              <button
                type="button"
                onClick={() => handleShadingChange("color_by_spool")}
                title="Coloration par Spool (Recommandé)"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  options.shadingMode === "color_by_spool"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Spools
              </button>
              <button
                type="button"
                onClick={() => handleShadingChange("realistic")}
                title="Rendu PBR Acier Réaliste"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  options.shadingMode === "realistic"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Acier PBR
              </button>
              <button
                type="button"
                onClick={() => handleShadingChange("color_by_service")}
                title="Coloration par Fluide / Service"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  options.shadingMode === "color_by_service"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" /> Fluides
              </button>
              <button
                type="button"
                onClick={() => handleShadingChange("wireframe")}
                title="Filaire / Rayons X"
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  options.shadingMode === "wireframe"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Filaire
              </button>
            </div>

            {/* Presets de vue */}
            <div className="flex items-center gap-1 px-1.5 border-r border-slate-800">
              <button
                type="button"
                onClick={() => handlePresetChange("iso_sw")}
                title="Isométrique Sud-Ouest (1)"
                className="px-2 py-1 rounded text-xs font-mono font-bold bg-slate-800/80 hover:bg-slate-700 text-cyan-300"
              >
                ISO
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange("top")}
                title="Vue de Dessus (3)"
                className="px-2 py-1 rounded text-xs font-mono font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300"
              >
                Top
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange("front")}
                title="Vue de Face (4)"
                className="px-2 py-1 rounded text-xs font-mono font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300"
              >
                Face
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange("side")}
                title="Vue de Profil"
                className="px-2 py-1 rounded text-xs font-mono font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300"
              >
                Côté
              </button>
            </div>

            {/* Projection Perspective / Ortho */}
            <button
              type="button"
              onClick={() => handleProjectionChange(options.projection === "perspective" ? "orthographic" : "perspective")}
              title="Bascule Caméra Perspective / Orthographique"
              className="px-2 py-1 rounded text-xs font-bold text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700"
            >
              {options.projection === "perspective" ? "3D Persp" : "3D Ortho"}
            </button>

            {/* Filtre Spool */}
            <select
              value={options.selectedSpoolId || "all"}
              onChange={(e) => setOptions((prev) => ({ ...prev, selectedSpoolId: e.target.value }))}
              aria-label="Filtrer par Spool préfabriqué"
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
            >
              <option value="all">Tous les spools</option>
              {data.spools.map((spool) => (
                <option key={spool.id} value={spool.id}>
                  {spool.label || spool.id} ({spool.totalLengthM}m - {spool.estimatedWeightKg}kg)
                </option>
              ))}
            </select>
          </div>

          {/* Actions : Fit, Auto-Rotate, Snapshot, Plein écran, Fermer */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleFit}
              title="Recentrer et ajuster la vue (Touche 0)"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={toggleAutoRotate}
              title="Rotation automatique (R)"
              className={`p-1.5 rounded-lg transition-colors ${
                options.autoRotate ? "bg-amber-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              }`}
            >
              <RotateCw className={`w-4 h-4 ${options.autoRotate ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={handleSnapshot}
              title="Exporter Capture HD (PNG)"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/40"
            >
              {snapshotSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
              {snapshotSuccess ? "Exporté !" : "Photo HD"}
            </button>
            <button
              type="button"
              onClick={() => setFullscreen((v) => !v)}
              title="Plein écran"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            {!embedded && (
              <button
                type="button"
                onClick={onClose}
                title="Fermer (Échap)"
                className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Zone centrale du visualiseur 3D */}
        <div className="relative flex-1 bg-[#070b12] overflow-hidden">
          {/* Conteneur WebGL Three.js */}
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Badge d'aide aux commandes au survol / bas gauche */}
          <div className="absolute bottom-3 left-3 pointer-events-none bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3.5 py-2.5 text-[11px] text-slate-300 flex flex-col gap-1.5 shadow-xl max-w-md">
            <div className="flex items-center gap-3 text-slate-200">
              <span className="flex items-center gap-1 font-semibold text-cyan-300">
                ⌨️ Flèches <kbd className="px-1 py-0.2 bg-slate-800 border border-slate-700 rounded text-[10px]">⬅️</kbd><kbd className="px-1 py-0.2 bg-slate-800 border border-slate-700 rounded text-[10px]">➡️</kbd><kbd className="px-1 py-0.2 bg-slate-800 border border-slate-700 rounded text-[10px]">⬆️</kbd><kbd className="px-1 py-0.2 bg-slate-800 border border-slate-700 rounded text-[10px]">⬇️</kbd>
              </span>
              <span>: <b>Nav. Horizontale & Latérale</b></span>
            </div>
            <div className="flex items-center gap-2.5 text-[10px] text-slate-400">
              <span><b>Shift + Flèches</b> : Rotation 360°</span>
              <span>·</span>
              <span><b>Ctrl + ⬆️/⬇️</b> : Zoom</span>
              <span>·</span>
              <span><b>0</b> : Cadrer</span>
            </div>
            <div className="flex items-center gap-2.5 text-[10px] text-slate-400">
              <span>🖱️ Clic gauche : <b>Orbite</b></span>
              <span>·</span>
              <span>Clic droit : <b>Panoramique</b></span>
              <span>·</span>
              <span>Double-clic : <b>Centrer</b></span>
            </div>
          </div>

          {/* Pavé de navigation D-Pad interactif (bas droit) */}
          <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-2 shadow-2xl flex flex-col items-center gap-1 z-10 select-none">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Navigation</span>
            <div className="grid grid-cols-3 gap-1">
              <div />
              <button
                type="button"
                onPointerDown={() => sceneManagerRef.current?.startPanContinuous(0, 1)}
                onPointerUp={() => sceneManagerRef.current?.stopPanContinuous()}
                onPointerLeave={() => sceneManagerRef.current?.stopPanContinuous()}
                onClick={() => sceneManagerRef.current?.panLateral(0, 1)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-cyan-600 active:scale-95 text-slate-200 hover:text-white flex items-center justify-center transition-all border border-slate-700/60 shadow-sm"
                title="Déplacer vers le haut (Maintenir ou Flèche Haut)"
              >
                ▲
              </button>
              <div />

              <button
                type="button"
                onPointerDown={() => sceneManagerRef.current?.startPanContinuous(-1, 0)}
                onPointerUp={() => sceneManagerRef.current?.stopPanContinuous()}
                onPointerLeave={() => sceneManagerRef.current?.stopPanContinuous()}
                onClick={() => sceneManagerRef.current?.panLateral(-1, 0)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-cyan-600 active:scale-95 text-slate-200 hover:text-white flex items-center justify-center transition-all border border-slate-700/60 shadow-sm"
                title="Navigation latérale gauche (Maintenir ou Flèche Gauche)"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={handleFit}
                className="w-8 h-8 rounded-lg bg-cyan-950 hover:bg-cyan-800 active:scale-95 text-cyan-300 hover:text-white flex items-center justify-center text-[10px] font-black transition-all border border-cyan-700/60 shadow-sm"
                title="Recadrer tout (Touche 0)"
              >
                🎯
              </button>
              <button
                type="button"
                onPointerDown={() => sceneManagerRef.current?.startPanContinuous(1, 0)}
                onPointerUp={() => sceneManagerRef.current?.stopPanContinuous()}
                onPointerLeave={() => sceneManagerRef.current?.stopPanContinuous()}
                onClick={() => sceneManagerRef.current?.panLateral(1, 0)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-cyan-600 active:scale-95 text-slate-200 hover:text-white flex items-center justify-center transition-all border border-slate-700/60 shadow-sm"
                title="Navigation latérale droite (Maintenir ou Flèche Droite)"
              >
                ▶
              </button>

              <div />
              <button
                type="button"
                onPointerDown={() => sceneManagerRef.current?.startPanContinuous(0, -1)}
                onPointerUp={() => sceneManagerRef.current?.stopPanContinuous()}
                onPointerLeave={() => sceneManagerRef.current?.stopPanContinuous()}
                onClick={() => sceneManagerRef.current?.panLateral(0, -1)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-cyan-600 active:scale-95 text-slate-200 hover:text-white flex items-center justify-center transition-all border border-slate-700/60 shadow-sm"
                title="Déplacer vers le bas (Maintenir ou Flèche Bas)"
              >
                ▼
              </button>
              <div />
            </div>

            {/* Boutons rapides Zoom & Rotation */}
            <div className="flex items-center gap-1 mt-1 pt-1 border-t border-slate-800 w-full justify-center">
              <button
                type="button"
                onPointerDown={() => sceneManagerRef.current?.startOrbitContinuous(-1, 0)}
                onPointerUp={() => sceneManagerRef.current?.stopOrbitContinuous()}
                onPointerLeave={() => sceneManagerRef.current?.stopOrbitContinuous()}
                onClick={() => sceneManagerRef.current?.rotateOrbital(-0.15, 0)}
                className="px-1.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-300 hover:text-white"
                title="Pivoter à gauche (Shift+Gauche)"
              >
                ↺
              </button>
              <button
                type="button"
                onPointerDown={() => sceneManagerRef.current?.startZoomContinuous(-1)}
                onPointerUp={() => sceneManagerRef.current?.stopZoomContinuous()}
                onPointerLeave={() => sceneManagerRef.current?.stopZoomContinuous()}
                onClick={() => sceneManagerRef.current?.zoomStep(0.85)}
                className="px-2 py-1 rounded bg-slate-800/80 hover:bg-cyan-700 text-[11px] font-bold text-slate-200 hover:text-white"
                title="Zoom Avant (+)"
              >
                +
              </button>
              <button
                type="button"
                onPointerDown={() => sceneManagerRef.current?.startZoomContinuous(1)}
                onPointerUp={() => sceneManagerRef.current?.stopZoomContinuous()}
                onPointerLeave={() => sceneManagerRef.current?.stopZoomContinuous()}
                onClick={() => sceneManagerRef.current?.zoomStep(1.15)}
                className="px-2 py-1 rounded bg-slate-800/80 hover:bg-cyan-700 text-[11px] font-bold text-slate-200 hover:text-white"
                title="Zoom Arrière (-)"
              >
                -
              </button>
              <button
                type="button"
                onPointerDown={() => sceneManagerRef.current?.startOrbitContinuous(1, 0)}
                onPointerUp={() => sceneManagerRef.current?.stopOrbitContinuous()}
                onPointerLeave={() => sceneManagerRef.current?.stopOrbitContinuous()}
                onClick={() => sceneManagerRef.current?.rotateOrbital(0.15, 0)}
                className="px-1.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-300 hover:text-white"
                title="Pivoter à droite (Shift+Droite)"
              >
                ↻
              </button>
            </div>
          </div>

          {/* Encart technique inspecteur d'élément sélectionné ou survolé (haut droit) */}
          {(selectedEntity || hoveredEntity) && (
            <div className="absolute top-3 right-3 w-80 bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
              {(() => {
                const item = selectedEntity || hoveredEntity!;
                return (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-xs font-black text-white uppercase tracking-wider">{item.label}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300">
                        {item.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {item.dn && (
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                          <span className="text-slate-400 block text-[10px]">Diamètre Nominal</span>
                          <span className="font-bold text-cyan-300">DN {item.dn}</span>
                        </div>
                      )}
                      {item.odMm && (
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                          <span className="text-slate-400 block text-[10px]">Diamètre Extérieur</span>
                          <span className="font-bold text-slate-200">{item.odMm.toFixed(1)} mm</span>
                        </div>
                      )}
                      {item.material && (
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 col-span-2">
                          <span className="text-slate-400 block text-[10px]">Nuance d'Acier / Spécification</span>
                          <span className="font-bold text-amber-300">{item.material}</span>
                        </div>
                      )}
                      {item.spoolId && (
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 col-span-2 flex items-center justify-between">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Spool de préfabrication</span>
                            <span className="font-bold text-emerald-400">{item.spoolId}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOptions((prev) => ({ ...prev, selectedSpoolId: item.spoolId }))}
                            className="px-2 py-1 rounded bg-emerald-700/60 hover:bg-emerald-600 text-white text-[10px] font-bold"
                          >
                            Isoler ce Spool
                          </button>
                        </div>
                      )}
                      {item.lengthM && (
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                          <span className="text-slate-400 block text-[10px]">Longueur</span>
                          <span className="font-bold text-slate-200">{item.lengthM.toFixed(2)} m</span>
                        </div>
                      )}
                      {item.weldInfo && (
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 col-span-2 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400 text-[10px]">Contrôle CND :</span>
                            <span className="text-cyan-300 font-bold">{item.weldInfo.ndtRequired}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 text-[10px]">Cahier WPS :</span>
                            <span className="text-slate-300 font-mono">{item.weldInfo.wpsRef}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Pied de page technique avec signature inaltérable R30 */}
        <footer className="px-4 py-2 bg-[#0a0f18] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-cyan-400 font-bold">ORTHOGONAL - ENG</span>
            <span>·</span>
            <span>Moteur 3D Solide Extrudé & Orbit Controls</span>
            <span>·</span>
            <span className="text-slate-500">Conforme ASME B31.3 & ASME B16.9</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={options.showWelds}
                onChange={(e) => setOptions((prev) => ({ ...prev, showWelds: e.target.checked }))}
                className="rounded bg-slate-800 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
              />
              Soudures 3D
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={options.showSupports}
                onChange={(e) => setOptions((prev) => ({ ...prev, showSupports: e.target.checked }))}
                className="rounded bg-slate-800 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
              />
              Supports MSS
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={options.showGroundGrid}
                onChange={(e) => setOptions((prev) => ({ ...prev, showGroundGrid: e.target.checked }))}
                className="rounded bg-slate-800 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
              />
              Grille
            </label>
          </div>
        </footer>
      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[100050] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
      {content}
    </div>
  );
};
