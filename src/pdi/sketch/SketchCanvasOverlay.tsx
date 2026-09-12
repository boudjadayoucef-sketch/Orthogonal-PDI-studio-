/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * SKETCH-TO-ISO ENGINE — STEP 2: DUAL-LAYER INTERACTIVE CALQUE CANVAS (A4/A3)
 */
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  SketchPoint2D,
  SketchVectorNode,
  SketchVectorSegment,
  SketchVectorFitting,
  PaperFormat,
  PAPER_FORMATS,
  snapToIsometricAngle,
  applyImageFilters
} from "./sketchRasterEngine";

export interface SketchCanvasOverlayProps {
  imageBlob: Blob | null;
  imageDataUrl: string | null;
  imageDimensions: { width: number; height: number };
  format: PaperFormat;
  opacity: number; // 0 à 100
  contrastThreshold: number; // 0 à 255
  brightness: number; // -100 à 100
  invert: boolean;
  rotationDeg: number;
  snapAngleToleranceDeg: number;
  nodes: SketchVectorNode[];
  segments: SketchVectorSegment[];
  fittings: SketchVectorFitting[];
  calibrationScale: number; // px par mm
  activeTool: "select" | "pipe" | "fitting" | "calibrate" | "erase" | "pan";
  selectedFittingType: SketchVectorFitting["type"];
  recenterTrigger?: number;
  onNodesChange: (nodes: SketchVectorNode[]) => void;
  onSegmentsChange: (segments: SketchVectorSegment[]) => void;
  onFittingsChange: (fittings: SketchVectorFitting[]) => void;
  onCalibrationChange: (newScale: number) => void;
}

export const SketchCanvasOverlay: React.FC<SketchCanvasOverlayProps> = ({
  imageDataUrl,
  imageDimensions,
  format,
  opacity,
  contrastThreshold,
  brightness,
  invert,
  rotationDeg,
  snapAngleToleranceDeg,
  nodes,
  segments,
  fittings,
  calibrationScale,
  activeTool,
  selectedFittingType,
  recenterTrigger,
  onNodesChange,
  onSegmentsChange,
  onFittingsChange,
  onCalibrationChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const vectorCanvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport Pan & Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Dragging in Select mode
  const [isDraggingNode, setIsDraggingNode] = useState(false);

  // Drawing state
  const [pipeStartNodeId, setPipeStartNodeId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<SketchPoint2D | null>(null);
  const [calibrateP1, setCalibrateP1] = useState<SketchPoint2D | null>(null);
  const [calibrateP2, setCalibrateP2] = useState<SketchPoint2D | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  // Offscreen source image for fast rendering
  const sourceImageRef = useRef<HTMLImageElement | null>(null);

  // Recenter function
  const handleRecenter = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const targetW = imageDimensions.width || 1200;
    const targetH = imageDimensions.height || 850;

    const scaleX = (cw - 60) / targetW;
    const scaleY = (ch - 60) / targetH;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.2), 2.5);

    const newPanX = (cw - targetW * newZoom) / 2;
    const newPanY = (ch - targetH * newZoom) / 2;

    setZoom(newZoom);
    setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
  }, [imageDimensions]);

  // Trigger recenter when recenterTrigger changes
  useEffect(() => {
    if (recenterTrigger !== undefined && recenterTrigger > 0) {
      handleRecenter();
    }
  }, [recenterTrigger, handleRecenter]);

  // Load image when url changes
  useEffect(() => {
    if (!imageDataUrl) {
      sourceImageRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      sourceImageRef.current = img;
      renderBackground();
      setTimeout(handleRecenter, 50);
    };
    img.src = imageDataUrl;
  }, [imageDataUrl, handleRecenter]);

  // Render background image with filters
  const renderBackground = useCallback(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext("2d");
    if (!ctx) return;

    const paper = PAPER_FORMATS[format];
    const targetW = imageDimensions.width || 1200;
    const targetH = imageDimensions.height || 850;

    bgCanvas.width = targetW;
    bgCanvas.height = targetH;

    ctx.clearRect(0, 0, targetW, targetH);

    // Draw paper outline & grid
    ctx.fillStyle = "#FDFBF7";
    ctx.fillRect(0, 0, targetW, targetH);

    // If source image exists, render with filters
    if (sourceImageRef.current) {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = sourceImageRef.current.width;
      tempCanvas.height = sourceImageRef.current.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx) {
        tempCtx.drawImage(sourceImageRef.current, 0, 0);
        applyImageFilters(tempCanvas, bgCanvas, {
          opacity: opacity / 100,
          contrastThreshold,
          brightness,
          invert
        });
      }
    }

    // Isometric background grid guides (30 deg lines)
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#0284C7";
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = -targetH * 2; x < targetW * 2; x += step) {
      // 30 deg line
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + targetH * Math.tan((60 * Math.PI) / 180), targetH);
      ctx.stroke();

      // 150 deg line
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - targetH * Math.tan((60 * Math.PI) / 180), targetH);
      ctx.stroke();

      // Vertical 90 deg line
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, targetH);
      ctx.stroke();
    }
    ctx.restore();
  }, [format, imageDimensions, opacity, contrastThreshold, brightness, invert]);

  // Re-render background on filter adjustments
  useEffect(() => {
    renderBackground();
  }, [renderBackground]);

  // Render vector overlay (Pipes, Nodes, Fittings, Snapping Guides)
  const renderVectorOverlay = useCallback(() => {
    const vCanvas = vectorCanvasRef.current;
    if (!vCanvas) return;
    const ctx = vCanvas.getContext("2d");
    if (!ctx) return;

    const targetW = imageDimensions.width || 1200;
    const targetH = imageDimensions.height || 850;

    vCanvas.width = targetW;
    vCanvas.height = targetH;
    ctx.clearRect(0, 0, targetW, targetH);

    // Draw Segments (Pipes)
    segments.forEach((seg) => {
      const n1 = nodes.find((n) => n.id === seg.fromNodeId);
      const n2 = nodes.find((n) => n.id === seg.toNodeId);
      if (!n1 || !n2) return;

      const isSelected = selectedSegmentId === seg.id;
      ctx.strokeStyle = isSelected ? "#F59E0B" : "#0284C7";
      ctx.lineWidth = isSelected ? 4 : 3;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.stroke();

      // Pipe text annotation (DN / length)
      const midX = (n1.x + n2.x) / 2;
      const midY = (n1.y + n2.y) / 2;
      ctx.fillStyle = isSelected ? "#B45309" : "#0369A1";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "center";
      const lengthMm = seg.lengthMm || (calibrationScale > 0 ? Math.round(Math.hypot(n2.x - n1.x, n2.y - n1.y) / calibrationScale) : null);
      const label = `DN${seg.nominalDiameter || 150}${lengthMm ? ` • ${lengthMm}mm` : ""}`;
      ctx.fillText(label, midX, midY - 6);
    });

    // Draw Active Pipe Drawing guide if active
    if (activeTool === "pipe" && pipeStartNodeId && mousePos) {
      const startNode = nodes.find((n) => n.id === pipeStartNodeId);
      if (startNode) {
        const snap = snapToIsometricAngle(startNode, mousePos, snapAngleToleranceDeg);
        ctx.strokeStyle = snap.isSnapped ? "#10B981" : "#EF4444";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);

        ctx.beginPath();
        ctx.moveTo(startNode.x, startNode.y);
        ctx.lineTo(snap.snappedPoint.x, snap.snappedPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Angle indicator
        ctx.fillStyle = snap.isSnapped ? "#059669" : "#DC2626";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.fillText(`${snap.angleDeg}° ${snap.isSnapped ? "✓ (ISO)" : "⚠"}`, snap.snappedPoint.x + 10, snap.snappedPoint.y - 10);
      }
    }

    // Draw Nodes
    nodes.forEach((n) => {
      const isSelected = selectedNodeId === n.id;
      const isStart = pipeStartNodeId === n.id;
      ctx.fillStyle = isStart ? "#10B981" : isSelected ? "#F59E0B" : "#1E293B";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(n.x, n.y, isSelected || isStart ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Draw Fittings
    fittings.forEach((fit) => {
      let posX = 0;
      let posY = 0;

      if (fit.nodeId) {
        const n = nodes.find((node) => node.id === fit.nodeId);
        if (n) {
          posX = n.x;
          posY = n.y;
        }
      } else if (fit.segmentId) {
        const seg = segments.find((s) => s.id === fit.segmentId);
        if (seg) {
          const n1 = nodes.find((n) => n.id === seg.fromNodeId);
          const n2 = nodes.find((n) => n.id === seg.toNodeId);
          if (n1 && n2) {
            posX = (n1.x + n2.x) / 2;
            posY = (n1.y + n2.y) / 2;
          }
        }
      }

      if (posX && posY) {
        ctx.fillStyle = "#E11D48";
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.arc(posX, posY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#9F1239";
        ctx.font = "bold 9px Inter, sans-serif";
        ctx.fillText(fit.type.toUpperCase().slice(0, 4), posX + 8, posY + 3);
      }
    });

    // Draw Calibration line if in progress
    if (activeTool === "calibrate" && calibrateP1 && (calibrateP2 || mousePos)) {
      const pEnd = calibrateP2 || mousePos!;
      ctx.strokeStyle = "#8B5CF6";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(calibrateP1.x, calibrateP1.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const distPx = Math.round(Math.hypot(pEnd.x - calibrateP1.x, pEnd.y - calibrateP1.y));
      ctx.fillStyle = "#6D28D9";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.fillText(`📏 ${distPx} px`, (calibrateP1.x + pEnd.x) / 2, (calibrateP1.y + pEnd.y) / 2 - 8);
    }
  }, [
    imageDimensions,
    nodes,
    segments,
    fittings,
    selectedNodeId,
    selectedSegmentId,
    activeTool,
    pipeStartNodeId,
    mousePos,
    snapAngleToleranceDeg,
    calibrationScale,
    calibrateP1,
    calibrateP2
  ]);

  useEffect(() => {
    renderVectorOverlay();
  }, [renderVectorOverlay]);

  // Screen to Canvas coordinate conversion
  const getCanvasCoords = (e: React.MouseEvent): SketchPoint2D => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom
    };
  };

  // Find nearest node within snap distance
  const findNearestNode = (pt: SketchPoint2D, maxDistPx = 15): SketchVectorNode | null => {
    let nearest: SketchVectorNode | null = null;
    let minDist = maxDistPx;
    for (const n of nodes) {
      const d = Math.hypot(n.x - pt.x, n.y - pt.y);
      if (d < minDist) {
        minDist = d;
        nearest = n;
      }
    }
    return nearest;
  };

  // Handle Canvas Click
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isPanning) return;
    const pt = getCanvasCoords(e);

    // TOOL: PIPE DRAWING
    if (activeTool === "pipe") {
      const clickedNode = findNearestNode(pt);

      if (!pipeStartNodeId) {
        // Start new pipe
        if (clickedNode) {
          setPipeStartNodeId(clickedNode.id);
        } else {
          const newNode: SketchVectorNode = {
            id: `node_${Date.now()}`,
            x: Math.round(pt.x),
            y: Math.round(pt.y),
            elevation: 0
          };
          onNodesChange([...nodes, newNode]);
          setPipeStartNodeId(newNode.id);
        }
      } else {
        // Finish pipe segment
        const startNode = nodes.find((n) => n.id === pipeStartNodeId);
        if (!startNode) {
          setPipeStartNodeId(null);
          return;
        }

        const snap = snapToIsometricAngle(startNode, pt, snapAngleToleranceDeg);
        let endNode = clickedNode;

        if (!endNode) {
          endNode = {
            id: `node_${Date.now()}`,
            x: Math.round(snap.snappedPoint.x),
            y: Math.round(snap.snappedPoint.y),
            elevation: 0
          };
          onNodesChange([...nodes, endNode]);
        }

        if (endNode.id !== startNode.id) {
          const newSeg: SketchVectorSegment = {
            id: `seg_${Date.now()}`,
            fromNodeId: startNode.id,
            toNodeId: endNode.id,
            nominalDiameter: 150,
            pressureClass: "Class 300",
            material: "Acier API 5L Gr. B",
            angleIsoDeg: snap.angleDeg
          };
          onSegmentsChange([...segments, newSeg]);
        }

        // Chain to next segment if Shift key is not pressed
        setPipeStartNodeId(endNode.id);
      }
      return;
    }

    // TOOL: FITTING
    if (activeTool === "fitting") {
      const clickedNode = findNearestNode(pt);
      const newFit: SketchVectorFitting = {
        id: `fit_${Date.now()}`,
        nodeId: clickedNode?.id,
        type: selectedFittingType,
        nominalDiameter: 150
      };
      onFittingsChange([...fittings, newFit]);
      return;
    }

    // TOOL: CALIBRATE SCALE
    if (activeTool === "calibrate") {
      if (!calibrateP1) {
        setCalibrateP1(pt);
      } else {
        setCalibrateP2(pt);
        const distPx = Math.hypot(pt.x - calibrateP1.x, pt.y - calibrateP1.y);
        const userMmStr = window.prompt(`Longueur réelle mesurée pour cette ligne (${Math.round(distPx)} pixels) en millimètres :`, "1000");
        if (userMmStr && !isNaN(Number(userMmStr)) && Number(userMmStr) > 0) {
          const scale = distPx / Number(userMmStr);
          onCalibrationChange(scale);
        }
        setCalibrateP1(null);
        setCalibrateP2(null);
      }
      return;
    }

    // TOOL: SELECT
    if (activeTool === "select") {
      const clickedNode = findNearestNode(pt);
      setSelectedNodeId(clickedNode ? clickedNode.id : null);
      setPipeStartNodeId(null);
    }
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
      return;
    }

    const pt = getCanvasCoords(e);
    setMousePos(pt);

    // Node dragging in select mode
    if (isDraggingNode && selectedNodeId && activeTool === "select") {
      onNodesChange(
        nodes.map((n) =>
          n.id === selectedNodeId ? { ...n, x: Math.round(pt.x), y: Math.round(pt.y) } : n
        )
      );
    }
  };

  // Pan with Tool "pan" or Space / Middle Click / Alt+Click
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === "pan" && e.button === 0) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      };
      return;
    }

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      };
      return;
    }

    if (activeTool === "select" && e.button === 0) {
      const pt = getCanvasCoords(e);
      const clickedNode = findNearestNode(pt);
      if (clickedNode) {
        setSelectedNodeId(clickedNode.id);
        setIsDraggingNode(true);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingNode(false);
  };

  // Zoom with wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((z) => Math.min(Math.max(z * zoomFactor, 0.2), 6));
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
      onContextMenu={(e) => {
        e.preventDefault();
        setPipeStartNodeId(null); // Cancel current pipe on right click
      }}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 520,
        backgroundColor: "#0B1120",
        overflow: "hidden",
        cursor:
          isPanning
            ? "grabbing"
            : activeTool === "pan"
            ? "grab"
            : activeTool === "pipe"
            ? "crosshair"
            : activeTool === "select"
            ? "default"
            : "default",
        userSelect: "none"
      }}
    >
      {/* Zoom / Pan Container */}
      <div
        style={{
          position: "absolute",
          transformOrigin: "0 0",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotationDeg}deg)`
        }}
      >
        {/* Layer 0: Background Canvas (Sketch image with filters) */}
        <canvas
          ref={bgCanvasRef}
          style={{
            display: "block",
            boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
            borderRadius: 4
          }}
        />

        {/* Layer 1: Vector Overlay Canvas (Nodes, Pipes, Snap Guides) */}
        <canvas
          ref={vectorCanvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none"
          }}
        />
      </div>

      {/* Floating Canvas Info & Quick Actions HUD */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          background: "rgba(15, 23, 42, 0.9)",
          backdropFilter: "blur(8px)",
          border: "1px solid #334155",
          borderRadius: 8,
          padding: "6px 12px",
          color: "#94A3B8",
          fontSize: 11,
          display: "flex",
          alignItems: "center",
          gap: 12,
          zIndex: 15,
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)"
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleRecenter();
          }}
          title="Recentrer et adapter le scan à l'écran"
          style={{
            background: "#0284C7",
            border: "none",
            borderRadius: 5,
            color: "#FFFFFF",
            padding: "3px 8px",
            fontSize: 10,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4
          }}
        >
          <span>🎯 Recentrer</span>
        </button>

        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.15)" }} />

        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span>Échelle: {calibrationScale > 0 ? `${calibrationScale.toFixed(2)} px/mm` : "Non étalonné"}</span>
        <span>Nœuds: {nodes.length}</span>
        <span>Tronçons: {segments.length}</span>
        {pipeStartNodeId && <span style={{ color: "#10B981", fontWeight: 700 }}>● Traçage en cours (Clic droit pour clore)</span>}
      </div>
    </div>
  );
};
