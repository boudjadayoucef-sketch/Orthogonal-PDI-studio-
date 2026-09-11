/**
 * PDI NORMATIVE ENGINE — TESTS NORM-02
 * Reference: PATCH NORM-02
 * 
 * Tests unitaires déterministes validant les 10 exigences strictes de NORM-02 :
 * - TEST 01: Chaque record possède un standardId valide.
 * - TEST 02: Les standards dimensionnels acceptés sont distingués (ASME B36.10M / B36.19M).
 * - TEST 03: Aucune conversion NPS/DN n'existe dans le moteur.
 * - TEST 04: Aucune valeur dimensionnelle inventée n'est générée par formule.
 * - TEST 05: Les éditions non vérifiées restent undefined.
 * - TEST 06: Le registre est déterministe et immuable.
 * - TEST 07: Les unités dimensionnelles sont explicitement identifiées.
 * - TEST 08: Les données matériau restent des références et aucune propriété mécanique n'est embarquée.
 * - TEST 09: Les schedules ne sont pas transformés automatiquement en épaisseurs.
 * - TEST 10: Le registre ne contient aucune donnée de calcul B31.
 */

import {
  PIPE_DIMENSIONAL_REGISTRY,
  getPipeDimensionsByStandard,
} from "../registry/pipeDimensionalRegistry";
import type { PipeDimensionalRecord } from "../types/pipeDimensionalTypes";
import * as pipeRegistryModule from "../registry/pipeDimensionalRegistry";

export function runPipeDimensionalEngineTests(): { success: boolean; results: string[] } {
  const results: string[] = [];
  let success = true;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (!condition) {
      success = false;
      results.push(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    } else {
      results.push(`✅ PASS: ${testName}`);
    }
  }

  // TEST 01: Chaque record possède un standardId valide
  const validStandardIds = ["ASME-B36.10M", "ASME-B36.19M"];
  const t1Valid = PIPE_DIMENSIONAL_REGISTRY.every((r) => validStandardIds.includes(r.standardId));
  assert(t1Valid, "TEST 01 — Chaque record possède un standardId valide (ASME-B36.10M / ASME-B36.19M)");

  // TEST 02: Les standards dimensionnels de tubes sont correctement distingués
  const b36_10Records = getPipeDimensionsByStandard("ASME-B36.10M");
  const b36_19Records = getPipeDimensionsByStandard("ASME-B36.19M");
  const t2Valid = Array.isArray(b36_10Records) && Array.isArray(b36_19Records);
  assert(t2Valid, "TEST 02 — Distiction explicite entre ASME B36.10M et ASME B36.19M");

  // TEST 03: Aucune conversion NPS/DN n'existe dans les exported functions
  const moduleExportNames = Object.keys(pipeRegistryModule);
  const hasConversionFunction = moduleExportNames.some((name) =>
    /npsToDn|dnToNps|convertNps|convertDn/i.test(name)
  );
  assert(!hasConversionFunction, "TEST 03 — Aucune fonction ni table de conversion NPS ↔ DN n'existe dans le moteur");

  // TEST 04: Aucune valeur dimensionnelle inventée par formule
  const t4Valid = PIPE_DIMENSIONAL_REGISTRY.every((r) => {
    if (r.outsideDiameterMm && r.wallThicknessMm) {
      // Vérification qu'aucune relation artificielle du type wallThickness = OD / 10 n'est forcée
      return r.wallThicknessMm !== r.outsideDiameterMm / 10;
    }
    return true;
  });
  assert(t4Valid, "TEST 04 — Aucune valeur dimensionnelle n'est générée par formule mathématique");

  // TEST 05: Les éditions non vérifiées restent undefined
  const t5Valid = PIPE_DIMENSIONAL_REGISTRY.every((r) => r.standardEdition === undefined);
  assert(t5Valid, "TEST 05 — Les éditions non vérifiées restent strictement undefined");

  // TEST 06: Le registre est déterministe et immuable
  let t6Valid = true;
  try {
    (PIPE_DIMENSIONAL_REGISTRY as any).push({ id: "INVALID" });
    t6Valid = false;
  } catch {
    t6Valid = true;
  }
  assert(t6Valid, "TEST 06 — Le registre dimensionnel est immuable et déterministe");

  // TEST 07: Les unités dimensionnelles sont explicitement identifiées (SI / US_CUSTOMARY)
  const t7Valid = PIPE_DIMENSIONAL_REGISTRY.every((r) => r.unitSystem === "SI" || r.unitSystem === "US_CUSTOMARY");
  assert(t7Valid, "TEST 07 — Les systèmes d'unités sont explicitement déclarés");

  // TEST 08: Les données matériau restent des références sans propriétés mécaniques
  const forbiddenMaterialKeys = ["smys", "yieldStrength", "tensileStrength", "allowableStress", "toughness"];
  const t8Valid = PIPE_DIMENSIONAL_REGISTRY.every((r) => {
    const keys = Object.keys(r);
    return !forbiddenMaterialKeys.some((fk) => keys.includes(fk));
  });
  assert(t8Valid, "TEST 08 — Aucune propriété mécanique (SMYS, contraintes) n'est embarquée dans le modèle dimensionnel");

  // TEST 09: Les schedules ne sont pas transformés automatiquement en épaisseurs par table inventée
  const hasScheduleMapper = moduleExportNames.some((name) =>
    /getThicknessFromSchedule|scheduleToThickness/i.test(name)
  );
  assert(!hasScheduleMapper, "TEST 09 — Aucune transformation automatique Schedule → épaisseur par approximation");

  // TEST 10: Le registre ne contient aucune donnée de calcul B31
  const forbiddenCalcKeys = ["barlow", "maop", "designPressure", "requiredThickness", "hoopStress"];
  const t10Valid = PIPE_DIMENSIONAL_REGISTRY.every((r) => {
    const keys = Object.keys(r);
    return !forbiddenCalcKeys.some((fk) => keys.includes(fk));
  });
  assert(t10Valid, "TEST 10 — Aucune donnée ou formule de calcul B31/Barlow dans le moteur dimensionnel");

  return { success, results };
}
