/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * DÉTECTION DE TOPOLOGIE CROQUIS 100% LOCALE PAR OPENCV.JS & TESSERACT.JS
 * 
 * Pipeline de vision par ordinateur classique (offline, 0 API, 0 IA Cloud) :
 * 1. Niveaux de gris (cv.cvtColor)
 * 2. Réduction de bruit gaussienne (cv.GaussianBlur)
 * 3. Binarisation adaptative (cv.adaptiveThreshold)
 * 4. Squelettisation morphologique (Amincissement Zhang-Suen 1px)
 * 5. Détection de segments par transformée de Hough probabiliste (cv.HoughLinesP)
 * 6. Détection de symboles ronds (cv.HoughCircles)
 * 7. Fusion en graphe topologique (nœuds, arêtes, connexions)
 * 8. Snapping isométrique strict (snapToIsometricAngle)
 * 9. OCR local des cotes (Tesseract.js avec whitelist restreinte)
 * 10. Critère de confiance strict : retourne NULL si la confiance est insuffisante (AUCUN réseau inventé)
 */

import {
  SketchVectorNode,
  SketchVectorSegment,
  SketchVectorFitting,
  SketchVectorEquipment,
  snapToIsometricAngle,
  SketchPoint2D,
  ISO_STANDARD_ANGLES
} from "./sketchRasterEngine";
import type { LocalDetectionResult } from "./localSketchDetector";

// Cache singleton pour l'instance WebAssembly d'OpenCV
let openCvInstance: any = null;
let openCvLoadingPromise: Promise<any> | null = null;

/**
 * Chargeur asynchrone (Lazy loading) d'OpenCV.js
 */
export async function getOpenCv(): Promise<any> {
  if (openCvInstance && openCvInstance.Mat) {
    return openCvInstance;
  }

  if (openCvLoadingPromise) {
    return openCvLoadingPromise;
  }

  openCvLoadingPromise = (async () => {
    try {
      const cvModule = await import("@techstark/opencv-js");
      const readyCv = await (cvModule.default || cvModule);
      openCvInstance = readyCv;
      return readyCv;
    } catch (err) {
      console.error("[OpenCV Loader] Impossible d'initialiser OpenCV.js :", err);
      openCvLoadingPromise = null;
      throw err;
    }
  })();

  return openCvLoadingPromise;
}

/**
 * Exécute l'amincissement morphologique de Zhang-Suen sur un buffer binaire 2D (0 = fond, 255 = trait)
 */
function zhangSuenThinning(
  binary: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  const skeleton = new Uint8Array(binary);
  let changing = true;
  const toRemove: number[] = [];

  const getPixel = (x: number, y: number): number => {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    return skeleton[y * width + x] === 255 ? 1 : 0;
  };

  while (changing) {
    changing = false;

    // Étape 1
    toRemove.length = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (skeleton[idx] !== 255) continue;

        const p2 = getPixel(x, y - 1);
        const p3 = getPixel(x + 1, y - 1);
        const p4 = getPixel(x + 1, y);
        const p5 = getPixel(x + 1, y + 1);
        const p6 = getPixel(x, y + 1);
        const p7 = getPixel(x - 1, y + 1);
        const p8 = getPixel(x - 1, y);
        const p9 = getPixel(x - 1, y - 1);

        const neighbors = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (neighbors < 2 || neighbors > 6) continue;

        // Nombre de transitions 0 -> 1
        const transitions =
          (p2 === 0 && p3 === 1 ? 1 : 0) +
          (p3 === 0 && p4 === 1 ? 1 : 0) +
          (p4 === 0 && p5 === 1 ? 1 : 0) +
          (p5 === 0 && p6 === 1 ? 1 : 0) +
          (p6 === 0 && p7 === 1 ? 1 : 0) +
          (p7 === 0 && p8 === 1 ? 1 : 0) +
          (p8 === 0 && p9 === 1 ? 1 : 0) +
          (p9 === 0 && p2 === 1 ? 1 : 0);

        if (transitions !== 1) continue;

        if (p2 * p4 * p6 !== 0) continue;
        if (p4 * p6 * p8 !== 0) continue;

        toRemove.push(idx);
      }
    }

    if (toRemove.length > 0) {
      changing = true;
      for (const idx of toRemove) {
        skeleton[idx] = 0;
      }
    }

    // Étape 2
    toRemove.length = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (skeleton[idx] !== 255) continue;

        const p2 = getPixel(x, y - 1);
        const p3 = getPixel(x + 1, y - 1);
        const p4 = getPixel(x + 1, y);
        const p5 = getPixel(x + 1, y + 1);
        const p6 = getPixel(x, y + 1);
        const p7 = getPixel(x - 1, y + 1);
        const p8 = getPixel(x - 1, y);
        const p9 = getPixel(x - 1, y - 1);

        const neighbors = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (neighbors < 2 || neighbors > 6) continue;

        const transitions =
          (p2 === 0 && p3 === 1 ? 1 : 0) +
          (p3 === 0 && p4 === 1 ? 1 : 0) +
          (p4 === 0 && p5 === 1 ? 1 : 0) +
          (p5 === 0 && p6 === 1 ? 1 : 0) +
          (p6 === 0 && p7 === 1 ? 1 : 0) +
          (p7 === 0 && p8 === 1 ? 1 : 0) +
          (p8 === 0 && p9 === 1 ? 1 : 0) +
          (p9 === 0 && p2 === 1 ? 1 : 0);

        if (transitions !== 1) continue;

        if (p2 * p4 * p8 !== 0) continue;
        if (p2 * p6 * p8 !== 0) continue;

        toRemove.push(idx);
      }
    }

    if (toRemove.length > 0) {
      changing = true;
      for (const idx of toRemove) {
        skeleton[idx] = 0;
      }
    }
  }

  return skeleton;
}

/**
 * OCR localisé via Tesseract.js pour extraire les cotes métriques (mm) et DN
 */
async function extractDimensionsWithOcr(
  canvas: HTMLCanvasElement
): Promise<Array<{ text: string; valueMm: number }>> {
  const ocrResults: Array<{ text: string; valueMm: number }> = [];

  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    await worker.setParameters({
      tessedit_char_whitelist: "0123456789DNdnMm.- ",
    });

    const ret = await worker.recognize(canvas);
    await worker.terminate();

    const text = ret.data.text;
    const matches = text.match(/\b\d{2,5}\b/g) || [];

    const seenValues = new Set<number>();
    for (const m of matches) {
      const val = parseInt(m, 10);
      if (val >= 25 && val <= 25000 && !seenValues.has(val)) {
        seenValues.add(val);
        ocrResults.push({
          text: `${val} mm`,
          valueMm: val,
        });
      }
    }
  } catch (err) {
    console.warn("[Tesseract OCR] Analyse OCR ignorée ou non disponible :", err);
  }

  return ocrResults;
}

/**
 * Détection de topologie par OpenCV.js (WebAssembly, 100% local)
 * Retourne LocalDetectionResult si la confiance est satisfaisante, ou null si échec/faible confiance.
 */
export async function detectSketchTopologyOpenCv(
  imageDataUrl: string,
  canvasWidth = 1188,
  canvasHeight = 840
): Promise<LocalDetectionResult | null> {
  if (typeof window === "undefined" || typeof Image === "undefined" || !imageDataUrl) {
    return null;
  }

  const cv = await getOpenCv();

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      // Préparation du canvas d'échantillonnage
      const sampleW = Math.min(canvasWidth, 1200);
      const sampleH = Math.min(canvasHeight, 850);

      const offscreen = document.createElement("canvas");
      offscreen.width = sampleW;
      offscreen.height = sampleH;
      const ctx = offscreen.getContext("2d", { willReadFrequently: true });

      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0, sampleW, sampleH);
      const imgData = ctx.getImageData(0, 0, sampleW, sampleH);

      let srcMat: any = null;
      let grayMat: any = null;
      let blurMat: any = null;
      let threshMat: any = null;
      let linesMat: any = null;
      let circlesMat: any = null;
      let skeletonMat: any = null;

      try {
        // Matrice source RGBA
        srcMat = cv.matFromImageData(imgData);
        grayMat = new cv.Mat();
        blurMat = new cv.Mat();
        threshMat = new cv.Mat();
        linesMat = new cv.Mat();
        circlesMat = new cv.Mat();
        skeletonMat = new cv.Mat(sampleH, sampleW, cv.CV_8UC1);

        // a) Niveaux de gris
        cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);

        // b) Réduction de bruit gaussienne légère (3x3)
        const ksize = new cv.Size(3, 3);
        cv.GaussianBlur(grayMat, blurMat, ksize, 0);

        // c) Binarisation adaptative (inversée : traits blancs = 255, fond = 0)
        cv.adaptiveThreshold(
          blurMat,
          threshMat,
          255,
          cv.ADAPTIVE_THRESH_GAUSSIAN_C,
          cv.THRESH_BINARY_INV,
          15,
          4
        );

        // d) Squelettisation morphologique par amincissement de Zhang-Suen
        const binaryBuffer = threshMat.data;
        const skeletonBuffer = zhangSuenThinning(binaryBuffer, sampleW, sampleH);
        skeletonMat.data.set(skeletonBuffer);

        // e) Détection de segments par transformée de Hough probabiliste (HoughLinesP)
        // Seuil ajusté pour traits de croquis
        cv.HoughLinesP(skeletonMat, linesMat, 1, Math.PI / 180, 20, 25, 12);

        // f) Détection des cercles (vannes, brides, piquages, symboles)
        try {
          cv.HoughCircles(
            blurMat,
            circlesMat,
            cv.HOUGH_GRADIENT,
            1.2,
            25,
            50,
            28,
            6,
            45
          );
        } catch (circleErr) {
          console.warn("[OpenCV Circles] HoughCircles pass skipped:", circleErr);
        }

        // Extraction et filtrage des lignes brutes
        interface RawLine {
          x1: number;
          y1: number;
          x2: number;
          y2: number;
          length: number;
          angleDeg: number;
          isIsoAligned: boolean;
        }

        const rawLines: RawLine[] = [];
        const numLines = linesMat.rows;

        for (let i = 0; i < numLines; i++) {
          const x1 = linesMat.data32S[i * 4];
          const y1 = linesMat.data32S[i * 4 + 1];
          const x2 = linesMat.data32S[i * 4 + 2];
          const y2 = linesMat.data32S[i * 4 + 3];

          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.hypot(dx, dy);

          if (len < 15) continue; // Ignorer le micro-bruit

          const snap = snapToIsometricAngle({ x: x1, y: y1 }, { x: x2, y: y2 }, 22);

          rawLines.push({
            x1,
            y1,
            x2,
            y2,
            length: len,
            angleDeg: snap.angleDeg,
            isIsoAligned: snap.isSnapped,
          });
        }

        // =========================================================================
        // PARTIE C — CRITÈRES DE CONFIANCE STRICTS (AUCUN RÉSULTAT INVENTÉ)
        // =========================================================================
        // Seuil 1: Au moins 2 segments détectés
        // Seuil 2: Au moins 35% des segments alignés sur un angle isométrique
        // Si ces critères ne sont pas remplis, la détection est considérée non fiable -> return null.
        const isoAlignedCount = rawLines.filter((l) => l.isIsoAligned).length;
        const isoRatio = rawLines.length > 0 ? isoAlignedCount / rawLines.length : 0;

        if (rawLines.length < 2 || (rawLines.length >= 3 && isoRatio < 0.35)) {
          console.warn(
            `[OpenCV Sketch Detector] Confiance insuffisante : ${rawLines.length} segments, ratio isométrique ${(isoRatio * 100).toFixed(1)}%. Bascule en pointage manuel assisté.`
          );
          resolve(null);
          return;
        }

        // g) Construction du graphe topologique (Nœuds & Tronçons)
        const clusterTolerancePx = 20; // Rayon de regroupement des extrémités
        const detectedNodes: SketchVectorNode[] = [];
        const detectedSegs: SketchVectorSegment[] = [];
        const detectedFittings: SketchVectorFitting[] = [];
        const detectedEquip: SketchVectorEquipment[] = [];

        // Helper pour trouver ou créer un nœud
        const getOrCreateNode = (pt: SketchPoint2D): SketchVectorNode => {
          let closest: SketchVectorNode | null = null;
          let minDist = clusterTolerancePx;

          for (const n of detectedNodes) {
            const d = Math.hypot(n.x - pt.x, n.y - pt.y);
            if (d < minDist) {
              minDist = d;
              closest = n;
            }
          }

          if (closest) {
            return closest;
          }

          const newNode: SketchVectorNode = {
            id: `node_${detectedNodes.length + 1}`,
            x: Math.round(pt.x),
            y: Math.round(pt.y),
            elevation: 0,
            label: `N-${detectedNodes.length + 1}`,
            dn: 80,
          };
          detectedNodes.push(newNode);
          return newNode;
        };

        // Traiter les lignes filtrées pour créer les segments
        const processedPairs = new Set<string>();

        for (const line of rawLines) {
          const n1 = getOrCreateNode({ x: line.x1, y: line.y1 });
          const n2 = getOrCreateNode({ x: line.x2, y: line.y2 });

          if (n1.id === n2.id) continue;

          const pairKey1 = `${n1.id}_${n2.id}`;
          const pairKey2 = `${n2.id}_${n1.id}`;

          if (processedPairs.has(pairKey1) || processedPairs.has(pairKey2)) {
            continue;
          }
          processedPairs.add(pairKey1);
          processedPairs.add(pairKey2);

          const snap = snapToIsometricAngle(n1, n2, 25);
          const segId = `seg_${detectedSegs.length + 1}`;
          const distPx = Math.hypot(n2.x - n1.x, n2.y - n1.y);

          detectedSegs.push({
            id: segId,
            fromNodeId: n1.id,
            toNodeId: n2.id,
            nominalDiameter: 80,
            pressureClass: "Class 300",
            material: "Acier ASTM A106 Gr. B",
            lengthMm: Math.round(distPx / 0.25),
            angleIsoDeg: snap.angleDeg,
          });
        }

        // Vérification post-graphe : si moins de 2 nœuds ou 1 segment, échec explicite
        if (detectedNodes.length < 2 || detectedSegs.length === 0) {
          console.warn("[OpenCV Sketch Detector] Graphe incomplet après clustering. Bascule manuelle.");
          resolve(null);
          return;
        }

        // Traitement des cercles détectés pour les vannes/brides
        if (circlesMat && circlesMat.cols > 0) {
          for (let i = 0; i < Math.min(circlesMat.cols, 8); i++) {
            const cx = circlesMat.data32F[i * 3];
            const cy = circlesMat.data32F[i * 3 + 1];
            const radius = circlesMat.data32F[i * 3 + 2];

            // Trouver le segment ou nœud le plus proche
            let nearestSeg: SketchVectorSegment | null = null;
            let minSegDist = 30;

            for (const seg of detectedSegs) {
              const sn1 = detectedNodes.find((n) => n.id === seg.fromNodeId);
              const sn2 = detectedNodes.find((n) => n.id === seg.toNodeId);
              if (!sn1 || !sn2) continue;

              const midX = (sn1.x + sn2.x) / 2;
              const midY = (sn1.y + sn2.y) / 2;
              const dist = Math.hypot(midX - cx, midY - cy);

              if (dist < minSegDist) {
                minSegDist = dist;
                nearestSeg = seg;
              }
            }

            if (nearestSeg) {
              detectedFittings.push({
                id: `fit_v_${detectedFittings.length + 1}`,
                segmentId: nearestSeg.id,
                type: radius > 22 ? "ballon_horizontal" : "valve",
                label: `V-${100 + detectedFittings.length + 1}`,
                nominalDiameter: 80,
              });
            }
          }
        }

        // h) OCR des cotes millimétriques via Tesseract.js
        const ocrDimensions = await extractDimensionsWithOcr(offscreen);

        // Calcul du facteur de calibrage précis à partir des cotes OCR
        let calculatedScale = 0.25;
        if (ocrDimensions.length > 0) {
          const totalMm = ocrDimensions.reduce((acc, d) => acc + d.valueMm, 0);
          const totalSegPx = detectedSegs.reduce((acc, s) => {
            const n1 = detectedNodes.find((n) => n.id === s.fromNodeId);
            const n2 = detectedNodes.find((n) => n.id === s.toNodeId);
            return acc + (n1 && n2 ? Math.hypot(n2.x - n1.x, n2.y - n1.y) : 0);
          }, 0);

          if (totalSegPx > 40 && totalMm > 0) {
            calculatedScale = Number((totalSegPx / totalMm).toFixed(4));
          }
        }

        const result: LocalDetectionResult = {
          detectedTitle: "CROQUIS TOPOLOGIE EXTRAITE (OPENCV.JS)",
          service: "TUYAUTERIE INDUSTRIELLE",
          lineReference: `LIGNE DN80 (${detectedSegs.length} TRONÇONS)`,
          drawingNumber: "SK-LOCAL-01",
          nominalDiameter: 80,
          calibrationScale: calculatedScale,
          summary: `Extraction OpenCV.js réussie : ${detectedNodes.length} nœuds, ${detectedSegs.length} tronçons détectés, ${detectedFittings.length} symbole(s) identifié(s). Échelle calculée : ${calculatedScale} px/mm.`,
          ocrDimensions,
          nodes: detectedNodes,
          segments: detectedSegs,
          fittings: detectedFittings,
          equipment: detectedEquip,
        };

        resolve(result);
      } catch (procErr) {
        console.error("[OpenCV Sketch Detector] Erreur lors du traitement d'image :", procErr);
        resolve(null);
      } finally {
        // Nettoyage impératif de la mémoire WebAssembly OpenCV
        if (srcMat) srcMat.delete();
        if (grayMat) grayMat.delete();
        if (blurMat) blurMat.delete();
        if (threshMat) threshMat.delete();
        if (linesMat) linesMat.delete();
        if (circlesMat) circlesMat.delete();
        if (skeletonMat) skeletonMat.delete();
      }
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = imageDataUrl;
  });
}
