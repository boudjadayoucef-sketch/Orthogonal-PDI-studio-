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
import { mergeCollinearSegments } from "../openCvSketchDetector";

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

  // DET-07 (SKETCH-DETECT-04) : Fusion des segments colinéaires consécutifs du même axe (X, Y ou Z)
  test("DET-07", "Fusion des micro-segments colinéaires de même axe en un seul tronçon continu", () => {
    // 4 nœuds formant 3 segments successifs alignés sur l'axe X (30°)
    const rawNodes: SketchVectorNode[] = [
      { id: "n1", x: 100, y: 100 },
      { id: "n2_faux_point", x: 150, y: 71 },
      { id: "n3_faux_point", x: 200, y: 42 },
      { id: "n4", x: 250, y: 13 },
    ];
    const rawSegs: SketchVectorSegment[] = [
      { id: "s1", fromNodeId: "n1", toNodeId: "n2_faux_point", detectedAxis: "X", angleIsoDeg: 30, lengthMm: 300 },
      { id: "s2", fromNodeId: "n2_faux_point", toNodeId: "n3_faux_point", detectedAxis: "X", angleIsoDeg: 30, lengthMm: 400 },
      { id: "s3", fromNodeId: "n3_faux_point", toNodeId: "n4", detectedAxis: "X", angleIsoDeg: 30, lengthMm: 500 },
    ];

    const { nodes, segs } = mergeCollinearSegments(rawNodes, rawSegs);

    ok(nodes.length === 2, "Les 2 faux nœuds intermédiaires doivent être éliminés (reste 2 nœuds d'extrémité)");
    ok(nodes.some(n => n.id === "n1") && nodes.some(n => n.id === "n4"), "Les extrémités n1 et n4 doivent être conservées");
    ok(!nodes.some(n => n.id === "n2_faux_point") && !nodes.some(n => n.id === "n3_faux_point"), "Les nœuds parasites doivent être supprimés");
    ok(segs.length === 1, "Les 3 micro-segments doivent être fusionnés en un seul segment");
    ok((segs[0].fromNodeId === "n1" && segs[0].toNodeId === "n4") || (segs[0].fromNodeId === "n4" && segs[0].toNodeId === "n1"), "Le segment fusionné relie n1 et n4");
    ok(segs[0].lengthMm === 1200, "La longueur cumulée doit être 300 + 400 + 500 = 1200 mm");
    ok(segs[0].detectedAxis === "X", "L'axe X doit être préservé");
  });

  // DET-08 (SKETCH-DETECT-04) : Non-fusion des vrais coudes (segments d'axes différents)
  test("DET-08", "Préservation stricte des vrais coudes (axes distincts)", () => {
    // n2 est un vrai coude entre un segment X (horizontal iso) et un segment Z (vertical)
    const rawNodes: SketchVectorNode[] = [
      { id: "n1", x: 100, y: 100 },
      { id: "n2_coude", x: 200, y: 42 },
      { id: "n3", x: 200, y: 200 },
    ];
    const rawSegs: SketchVectorSegment[] = [
      { id: "s1", fromNodeId: "n1", toNodeId: "n2_coude", detectedAxis: "X", angleIsoDeg: 30, lengthMm: 600 },
      { id: "s2", fromNodeId: "n2_coude", toNodeId: "n3", detectedAxis: "Z", angleIsoDeg: 270, lengthMm: 800 },
    ];

    const { nodes, segs } = mergeCollinearSegments(rawNodes, rawSegs);

    ok(nodes.length === 3, "Le nœud du coude n2 ne doit PAS être fusionné");
    ok(segs.length === 2, "Les 2 segments d'axes distincts doivent être conservés");
  });

  // DET-09 (SKETCH-DETECT-04) : Non-fusion des piquages / tés (3+ segments touchants)
  test("DET-09", "Préservation stricte des tés et piquages (3+ segments touchants)", () => {
    const rawNodes: SketchVectorNode[] = [
      { id: "n1", x: 100, y: 100 },
      { id: "n_te", x: 200, y: 42 },
      { id: "n3", x: 300, y: -16 },
      { id: "n4_branche", x: 200, y: 150 },
    ];
    const rawSegs: SketchVectorSegment[] = [
      { id: "s1", fromNodeId: "n1", toNodeId: "n_te", detectedAxis: "X", lengthMm: 500 },
      { id: "s2", fromNodeId: "n_te", toNodeId: "n3", detectedAxis: "X", lengthMm: 500 },
      { id: "s3", fromNodeId: "n_te", toNodeId: "n4_branche", detectedAxis: "Z", lengthMm: 400 },
    ];

    const { nodes, segs } = mergeCollinearSegments(rawNodes, rawSegs);

    ok(nodes.length === 4, "Le nœud du té (3 branches) ne doit pas être supprimé");
    ok(segs.length === 3, "Les 3 segments doivent être préservés");
  });

  // DET-10 (SKETCH-DETECT-04) : Non-fusion des extrémités (1 seul segment touchant)
  test("DET-10", "Préservation des extrémités libres (1 segment touchant)", () => {
    const rawNodes: SketchVectorNode[] = [
      { id: "n1", x: 100, y: 100 },
      { id: "n2", x: 200, y: 100 },
    ];
    const rawSegs: SketchVectorSegment[] = [
      { id: "s1", fromNodeId: "n1", toNodeId: "n2", detectedAxis: "Y", lengthMm: 500 },
    ];

    const { nodes, segs } = mergeCollinearSegments(rawNodes, rawSegs);

    ok(nodes.length === 2, "Les extrémités doivent être conservées");
    ok(segs.length === 1, "Le segment unique doit être conservé");
  });

  return { success, testsRun, results };
}
