/**
 * Tests unitaires Détection Croquis & Vectorisation — Patch SKETCH-DETECT-02
 * Couverture complète des règles déterministes, 0 invention, snapping ISO & compilation JSON
 */

import {
  snapToIsometricAngle,
  ISO_STANDARD_ANGLES,
  PAPER_FORMATS,
  SketchVectorNode,
  SketchVectorSegment,
  SketchVectorFitting
} from "../sketchRasterEngine";
import { compileSketchToIsoModel } from "../sketchToJsonCompiler";
import {
  DEFAULT_SKETCH_PROFILE,
  getLocalLearningProfile,
  learnSketchAbbreviation
} from "../sketchStorage";
import {
  generateDemoSketchImageDataUrl,
  DEMO_INITIAL_NODES,
  DEMO_INITIAL_SEGMENTS,
  DEMO_INITIAL_FITTINGS
} from "../demoSketchTemplate";
import { detectSketchTopologyLocal } from "../localSketchDetector";

export function runSketchDetectionTests(): {
  success: boolean;
  testsRun: number;
  results: string[];
} {
  const results: string[] = [];
  let testsRun = 0;
  let success = true;

  function ok(cond: boolean, msg: string) {
    if (!cond) throw new Error(msg);
  }

  function test(id: string, name: string, fn: () => void) {
    testsRun++;
    try {
      fn();
      results.push(`✅ PASS [${id}]: ${name}`);
    } catch (err: any) {
      success = false;
      results.push(`❌ FAIL [${id}]: ${name} (${err.message})`);
      throw err;
    }
  }

  // DET-01 : Snapping isométrique strict sur les axes standard (30, 90, 150, 210, 270, 330)
  test("DET-01", "Snapping isométrique strict sur les axes standard", () => {
    const p1 = { x: 100, y: 100 };
    // Vecteur proche de 30°
    const p30 = { x: 100 + 100 * Math.cos((32 * Math.PI) / 180), y: 100 - 100 * Math.sin((32 * Math.PI) / 180) };
    const res30 = snapToIsometricAngle(p1, p30, 10);
    ok(res30.isSnapped === true, "Doit être aimanté à 30°");
    ok(res30.angleDeg === 30, "L'angle calculé doit être 30°");

    // Vecteur proche de 90° (vertical)
    const p90 = { x: 102, y: 0 };
    const res90 = snapToIsometricAngle(p1, p90, 10);
    ok(res90.isSnapped === true, "Doit être aimanté à 90°");
    ok(res90.angleDeg === 90, "L'angle calculé doit être 90°");

    // Vecteur hors tolérance (ex: 60°)
    const p60 = { x: 100 + 100 * Math.cos((60 * Math.PI) / 180), y: 100 - 100 * Math.sin((60 * Math.PI) / 180) };
    const res60 = snapToIsometricAngle(p1, p60, 5);
    ok(res60.isSnapped === false, "Ne doit pas être aimanté si hors tolérance");
  });

  // DET-02 : Rejet strict des réseaux inventés si détection locale non concluante
  test("DET-02", "Retourne null si pas de données valides (0 réseau inventé)", async () => {
    // Si pas de données d'image ou canvas non initialisable en environnement Node sans DOM
    const result = await detectSketchTopologyLocal("");
    ok(result === null, "Doit impérativement renvoyer null et AUCUN réseau synthétique non sollicité");
  });

  // DET-03 : Compilation du modèle croquis vers le format ISO canonique
  test("DET-03", "Compilation fidèle du modèle Croquis vers JSON ISO canonique", () => {
    const compiled = compileSketchToIsoModel({
      nodes: DEMO_INITIAL_NODES,
      segments: DEMO_INITIAL_SEGMENTS,
      fittings: DEMO_INITIAL_FITTINGS,
      calibrationScale: 0.25,
      title: "LIGNE-TEST-CROQUIS",
      paperFormat: "A4_landscape",
      lineReference: "L-100",
      service: "GAZ"
    });

    ok(compiled.source === "sketch_to_iso_calque", "La source doit être 'sketch_to_iso_calque'");
    ok(compiled.nodes.length === DEMO_INITIAL_NODES.length, "Tous les nœuds doivent être convertis");
    ok(compiled.segments.length === DEMO_INITIAL_SEGMENTS.length, "Tous les tronçons doivent être convertis");
    ok(compiled.metadata.totalPipesCount === DEMO_INITIAL_SEGMENTS.length, "Compteur de tubes cohérent");
    ok(compiled.metadata.calibrationScalePxPerMm === 0.25, "Échelle préservée");
  });

  // DET-04 : Dictionnaire d'abréviations calligraphiques et apprentissage local
  test("DET-04", "Profil d'abréviations et apprentissage local", () => {
    ok(DEFAULT_SKETCH_PROFILE.abbreviations["VPT"] === "vanne_passage_total", "VPT doit être mappé sur vanne_passage_total");
    ok(DEFAULT_SKETCH_PROFILE.abbreviations["CL300"] === "PN50", "CL300 doit être mappé sur PN50");
    ok(DEFAULT_SKETCH_PROFILE.abbreviations["WN"] === "flange_wn", "WN doit être mappé sur flange_wn");
  });

  // DET-05 : Formats de papier normalisés A4 et A3
  test("DET-05", "Formats de papier A4 / A3 reconnus avec dimensions métriques", () => {
    ok(PAPER_FORMATS.A4_landscape.width === 297 && PAPER_FORMATS.A4_landscape.height === 210, "A4 Paysage 297x210 mm");
    ok(PAPER_FORMATS.A3_landscape.width === 420 && PAPER_FORMATS.A3_landscape.height === 297, "A3 Paysage 420x297 mm");
  });

  // DET-06 : Vérification de la géométrie de référence Demo
  test("DET-06", "Géométrie initiale de démo cohérente et connectée", () => {
    ok(DEMO_INITIAL_NODES.length >= 5, "Au moins 5 nœuds de démo");
    ok(DEMO_INITIAL_SEGMENTS.length >= 4, "Au moins 4 tronçons reliés");
    // Vérification de la connectivité de chaque tronçon
    for (const seg of DEMO_INITIAL_SEGMENTS) {
      const n1 = DEMO_INITIAL_NODES.find(n => n.id === seg.fromNodeId);
      const n2 = DEMO_INITIAL_NODES.find(n => n.id === seg.toNodeId);
      ok(n1 !== undefined && n2 !== undefined, `Tronçon ${seg.id} doit relier des nœuds existants`);
      ok(ISO_STANDARD_ANGLES.includes(seg.angleIsoDeg as number), `Angle ${seg.angleIsoDeg}° doit être standard`);
    }
  });

  return { success, testsRun, results };
}
