/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * SKETCH-TO-ISO MASTER MODULE — STEP 5: CALQUE A4/A3 WORKSPACE & COMPILER INTEGRATION
 */
import React, { useState, useEffect, useRef } from "react";
import {
  SketchVectorNode,
  SketchVectorSegment,
  SketchVectorFitting,
  PaperFormat,
  PAPER_FORMATS
} from "./sketchRasterEngine";
import { SketchCanvasOverlay } from "./SketchCanvasOverlay";
import { SketchReviewTable } from "./SketchReviewTable";
import { compileSketchToIsoModel, CompiledIsoModel } from "./sketchToJsonCompiler";
import {
  getLocalLearningProfile,
  saveLocalLearningProfile,
  SketchLearningProfile
} from "./sketchStorage";
import {
  generateDemoSketchImageDataUrl,
  DEMO_INITIAL_NODES,
  DEMO_INITIAL_SEGMENTS,
  DEMO_INITIAL_FITTINGS
} from "./demoSketchTemplate";

export interface SketchToIsoModuleProps {
  onLoadProjectToEditor?: (isoJson: any, name: string) => void;
}

export const SketchToIsoModule: React.FC<SketchToIsoModuleProps> = ({
  onLoadProjectToEditor
}) => {
  // Paper & Filters
  const [format, setFormat] = useState<PaperFormat>("A4_landscape");
  const [opacity, setOpacity] = useState<number>(75);
  const [contrastThreshold, setContrastThreshold] = useState<number>(145);
  const [brightness, setBrightness] = useState<number>(10);
  const [invert, setInvert] = useState<boolean>(false);
  const [rotationDeg] = useState<number>(0);
  const [snapAngleToleranceDeg, setSnapAngleToleranceDeg] = useState<number>(12);

  // Calibration
  const [calibrationScale, setCalibrationScale] = useState<number>(0.25); // px per mm

  // Tools
  const [activeTool, setActiveTool] = useState<"select" | "pipe" | "fitting" | "calibrate" | "erase">("pipe");
  const [selectedFittingType, setSelectedFittingType] = useState<SketchVectorFitting["type"]>("valve");

  // Geometry
  const [nodes, setNodes] = useState<SketchVectorNode[]>([]);
  const [segments, setSegments] = useState<SketchVectorSegment[]>([]);
  const [fittings, setFittings] = useState<SketchVectorFitting[]>([]);

  // Project Info
  const [projectName, setProjectName] = useState("LIGNE-CROQUIS-001");
  const [service, setService] = useState("PROC-CHIM");

  // Image Source
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 1188, height: 840 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calligraphy Learning Profile
  const [profile, setProfile] = useState<SketchLearningProfile>(() => getLocalLearningProfile());

  // Show live compiled JSON modal
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [compiledJsonPreview, setCompiledJsonPreview] = useState<CompiledIsoModel | null>(null);

  // Status message
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Auto-clear notification after 4s
  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  // Load Initial Demo Plan on mount if canvas is empty
  useEffect(() => {
    if (!imageDataUrl && nodes.length === 0) {
      loadDemoCroquis();
    }
  }, []);

  const loadDemoCroquis = () => {
    const demoUrl = generateDemoSketchImageDataUrl();
    setImageDataUrl(demoUrl);
    setImageDimensions({ width: 1188, height: 840 });
    setNodes(DEMO_INITIAL_NODES);
    setSegments(DEMO_INITIAL_SEGMENTS);
    setFittings(DEMO_INITIAL_FITTINGS);
    setCalibrationScale(0.24);
    setStatusMessage("✅ Croquis de démonstration A4 chargé avec succès.");
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
          setImageDataUrl(result);
          setNodes([]);
          setSegments([]);
          setFittings([]);
          setStatusMessage(`📸 Image "${file.name}" importée (${img.width}x${img.height}px).`);
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Compile JSON
  const handleCompileJson = (): CompiledIsoModel => {
    const model = compileSketchToIsoModel({
      nodes,
      segments,
      fittings,
      calibrationScale,
      title: projectName,
      paperFormat: format,
      lineReference: projectName,
      service
    });
    setCompiledJsonPreview(model);
    return model;
  };

  // Transfer to Isometric Editor (Passerelle d'injection Étape 5)
  const handleTransferToIsometricEditor = () => {
    if (nodes.length === 0 || segments.length === 0) {
      alert("Veuillez tracer ou charger au moins un tronçon de tuyauterie avant de valider l'isométrie.");
      return;
    }

    const model = handleCompileJson();

    // Auto-save model to local storage & pending injection for the ISO engine
    try {
      const sanitizedName = (projectName || "L-100-PROC-01").replace(/\s+/g, "_");
      const autosaveKey = `isometrie.autosave.${sanitizedName}`;
      const payload = {
        name: projectName,
        nodes: model.nodes,
        segments: model.segments,
        lines: model.lines,
        dimensions: model.dimensions,
        workspace: {
          showDimensions: true,
          showGrid: true,
          showPipeLabels: true,
          showWelds: true
        },
        open3d: true,
        updatedAt: new Date().toISOString()
      };
      window.localStorage.setItem(autosaveKey, JSON.stringify(payload));
      window.localStorage.setItem("pdi.pending_iso_injection", JSON.stringify(payload));
      window.sessionStorage.setItem("pdi.pending_iso_injection", JSON.stringify(payload));
      window.localStorage.setItem("pdi.activeModule.v1", "isometric");

      // Dispatch real-time injection event for active ISO editor instances
      window.dispatchEvent(
        new CustomEvent("pdi:inject-iso-graph", {
          detail: {
            data: model,
            name: projectName,
            open3d: true
          }
        })
      );
    } catch (err) {
      console.warn("Storage warning:", err);
    }

    if (onLoadProjectToEditor) {
      onLoadProjectToEditor(model, projectName);
    } else {
      setStatusMessage("🚀 Modèle injecté avec succès ! Basculement vers l'éditeur ISO...");
    }
  };

  // Download JSON file
  const handleDownloadJson = () => {
    const model = handleCompileJson();
    const jsonStr = JSON.stringify(model, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_iso_pdi.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage("💾 Fichier JSON standard PD&I téléchargé.");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "#030712",
        color: "#F1F5F9",
        fontFamily: "Inter, system-ui, sans-serif",
        overflow: "hidden"
      }}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/png,image/jpeg,image/webp,image/bmp"
        style={{ display: "none" }}
      />

      {/* TOP CONTROL RIBBON */}
      <header
        style={{
          background: "linear-gradient(180deg, #0F172A 0%, #0B1120 100%)",
          borderBottom: "1px solid #1E293B",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap"
        }}
      >
        {/* Left: Brand / Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              background: "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)",
              color: "#FFFFFF",
              fontWeight: 900,
              fontSize: 11,
              padding: "4px 8px",
              borderRadius: 6,
              letterSpacing: "0.08em"
            }}
          >
            CRQ → ISO
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#F8FAFC" }}>
              Atelier Calque A4/A3 & Numérisation Croquis
            </h2>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>
              Reconnaissance de tracé manuel, vectorisation isométrique 30° et export CAO
            </div>
          </div>
        </div>

        {/* Center: Tools Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#020617", padding: 4, borderRadius: 8, border: "1px solid #1E293B" }}>
          {[
            { id: "pipe", label: "📏 Tuyau (ISO)", icon: "●" },
            { id: "fitting", label: "⭕ Accessoire", icon: "❖" },
            { id: "calibrate", label: "📐 Étalonner 1:1", icon: "⇿" },
            { id: "select", label: "🔍 Sélectionner", icon: "↗" }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTool(t.id as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                background: activeTool === t.id ? "#0284C7" : "transparent",
                color: activeTool === t.id ? "#FFFFFF" : "#94A3B8",
                transition: "all 0.15s ease"
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}

          {/* Fitting Subtype if fitting tool active */}
          {activeTool === "fitting" && (
            <select
              value={selectedFittingType}
              onChange={(e) => setSelectedFittingType(e.target.value as any)}
              style={{
                background: "#0F172A",
                color: "#38BDF8",
                border: "1px solid #0284C7",
                borderRadius: 6,
                fontSize: 11,
                padding: "4px 8px",
                fontWeight: 700
              }}
            >
              <option value="valve">Vanne Passage Total</option>
              <option value="check_valve">Clapet</option>
              <option value="flange">Bride WN</option>
              <option value="elbow_90">Coude 90°</option>
              <option value="elbow_45">Coude 45°</option>
              <option value="tee">Té égal</option>
              <option value="reducer">Réduction</option>
              <option value="instrument">Manomètre</option>
              <option value="support">Support</option>
            </select>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "7px 12px",
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: 6,
              color: "#F8FAFC",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            📂 Importer Scan / Photo
          </button>

          <button
            type="button"
            onClick={loadDemoCroquis}
            style={{
              padding: "7px 12px",
              background: "#0F172A",
              border: "1px solid #0284C7",
              borderRadius: 6,
              color: "#38BDF8",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            ⚡ Exemple Démo
          </button>

          <button
            type="button"
            onClick={() => {
              handleCompileJson();
              setShowJsonModal(true);
            }}
            style={{
              padding: "7px 12px",
              background: "#1E293B",
              border: "1px solid #475569",
              borderRadius: 6,
              color: "#A7F3D0",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            📄 Voir JSON
          </button>

          <button
            type="button"
            onClick={handleTransferToIsometricEditor}
            style={{
              padding: "7px 16px",
              background: "linear-gradient(135deg, #0284C7 0%, #059669 100%)",
              border: "none",
              borderRadius: 6,
              color: "#FFFFFF",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(2, 132, 199, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
            title="Valider la tuyauterie du croquis et ouvrir immédiatement l'isométrie 2D cotée et la vue 3D solide"
          >
            <span>🚀 Valider &amp; Ouvrir dans l'Éditeur ISO</span>
          </button>
        </div>
      </header>

      {/* FILTER & PAPER FORMAT CONTROLS SUB-BAR */}
      <div
        style={{
          background: "#090E17",
          borderBottom: "1px solid #1E293B",
          padding: "6px 16px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 11,
          color: "#94A3B8",
          flexWrap: "wrap"
        }}
      >
        {/* Paper Format */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, color: "#E2E8F0" }}>Format Papier :</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as PaperFormat)}
            style={{
              background: "#0F172A",
              color: "#F8FAFC",
              border: "1px solid #334155",
              borderRadius: 4,
              padding: "2px 6px",
              fontSize: 11
            }}
          >
            {Object.entries(PAPER_FORMATS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label} ({v.width} × {v.height} mm)
              </option>
            ))}
          </select>
        </div>

        {/* Opacity slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>Opacité Calque :</span>
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            style={{ width: 70 }}
          />
          <span style={{ width: 26, textAlign: "right" }}>{opacity}%</span>
        </div>

        {/* Contrast / B&W Threshold */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>Filtre Encre N&B :</span>
          <input
            type="range"
            min={0}
            max={255}
            value={contrastThreshold}
            onChange={(e) => setContrastThreshold(Number(e.target.value))}
            style={{ width: 70 }}
          />
          <span style={{ width: 26, textAlign: "right" }}>{contrastThreshold}</span>
        </div>

        {/* Invert */}
        <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={invert}
            onChange={(e) => setInvert(e.target.checked)}
          />
          <span>Inverser fond/traits</span>
        </label>

        {/* Angle Snap Tolerance */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>Tolérance Aimantation ISO :</span>
          <input
            type="range"
            min={5}
            max={25}
            value={snapAngleToleranceDeg}
            onChange={(e) => setSnapAngleToleranceDeg(Number(e.target.value))}
            style={{ width: 60 }}
          />
          <span>±{snapAngleToleranceDeg}°</span>
        </div>

        {/* Notification Toast in sub-bar */}
        {statusMessage && (
          <div
            style={{
              marginLeft: "auto",
              color: "#38BDF8",
              fontWeight: 700,
              animation: "fadeIn 0.2s"
            }}
          >
            {statusMessage}
          </div>
        )}
      </div>

      {/* MAIN DUAL-PANE WORKSPACE */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>
        {/* LEFT: CALQUE CANVAS OVERLAY */}
        <div style={{ flex: 1.6, height: "100%", position: "relative" }}>
          <SketchCanvasOverlay
            imageBlob={null}
            imageDataUrl={imageDataUrl}
            imageDimensions={imageDimensions}
            format={format}
            opacity={opacity}
            contrastThreshold={contrastThreshold}
            brightness={brightness}
            invert={invert}
            rotationDeg={rotationDeg}
            snapAngleToleranceDeg={snapAngleToleranceDeg}
            nodes={nodes}
            segments={segments}
            fittings={fittings}
            calibrationScale={calibrationScale}
            activeTool={activeTool}
            selectedFittingType={selectedFittingType}
            onNodesChange={setNodes}
            onSegmentsChange={setSegments}
            onFittingsChange={setFittings}
            onCalibrationChange={(newScale) => {
              setCalibrationScale(newScale);
              setStatusMessage(`📐 Échelle étalonnée : ${newScale.toFixed(3)} px/mm.`);
            }}
          />
        </div>

        {/* RIGHT: REVIEW & CORRECTION TABLE */}
        <div style={{ flex: 1, minWidth: 360, maxWidth: 460, height: "100%" }}>
          <SketchReviewTable
            nodes={nodes}
            segments={segments}
            fittings={fittings}
            profile={profile}
            calibrationScale={calibrationScale}
            onNodesChange={setNodes}
            onSegmentsChange={setSegments}
            onFittingsChange={setFittings}
            onProfileChange={(p) => {
              setProfile(p);
              saveLocalLearningProfile(p);
            }}
          />
        </div>
      </div>

      {/* JSON PREVIEW MODAL */}
      {showJsonModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 24
          }}
        >
          <div
            style={{
              background: "#0B1120",
              border: "1px solid #0284C7",
              borderRadius: 12,
              width: "100%",
              maxWidth: 720,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)"
            }}
          >
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 14, color: "#38BDF8", fontWeight: 800 }}>
                Modèle JSON Isométrique Normalisé (PD&I V4.8d)
              </h3>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                style={{ background: "transparent", border: "none", color: "#94A3B8", fontSize: 16, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              <pre
                style={{
                  margin: 0,
                  background: "#020617",
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 11,
                  color: "#38BDF8",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap"
                }}
              >
                {JSON.stringify(compiledJsonPreview, null, 2)}
              </pre>
            </div>

            <div style={{ padding: "12px 16px", borderTop: "1px solid #1E293B", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={handleDownloadJson}
                style={{
                  padding: "6px 14px",
                  background: "#0284C7",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                💾 Télécharger le fichier .json
              </button>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                style={{
                  padding: "6px 14px",
                  background: "#1E293B",
                  color: "#94A3B8",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
