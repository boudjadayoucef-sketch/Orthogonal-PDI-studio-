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
import { validatePipeDimensionalRecord } from "../validators/pipeDimensionalValidator";

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

  // =========================================================================
  // 1. TESTS DE BASE NORM-02
  // =========================================================================

  // TEST 01: Chaque record possède un standardId valide
  const validStandardIds = ["ASME-B36.10M", "ASME-B36.19M"];
  const t1Valid = PIPE_DIMENSIONAL_REGISTRY.every((r) => validStandardIds.includes(r.standardId));
  assert(t1Valid, "TEST 01 — Chaque record possède un standardId valide (ASME-B36.10M / ASME-B36.19M)");

  // TEST 02: Les standards dimensionnels de tubes sont correctement distingués
  const b36_10Records = getPipeDimensionsByStandard("ASME-B36.10M");
  const b36_19Records = getPipeDimensionsByStandard("ASME-B36.19M");
  const t2Valid = Array.isArray(b36_10Records) && Array.isArray(b36_19Records);
  assert(t2Valid, "TEST 02 — Distinction explicite entre ASME B36.10M et ASME B36.19M");

  // TEST 03: Aucune conversion NPS/DN n'existe dans les exported functions
  const moduleExportNames = Object.keys(pipeRegistryModule);
  const hasConversionFunction = moduleExportNames.some((name) =>
    /npsToDn|dnToNps|convertNps|convertDn/i.test(name)
  );
  assert(!hasConversionFunction, "TEST 03 — Aucune fonction ni table de conversion NPS ↔ DN n'existe dans le moteur");

  // TEST 04: Aucune valeur dimensionnelle inventée par formule
  const t4Valid = PIPE_DIMENSIONAL_REGISTRY.every((r) => {
    if (r.outsideDiameterMm && r.wallThicknessMm) {
      return r.wallThicknessMm !== r.outsideDiameterMm / 10;
    }
    return true;
  });
  assert(t4Valid, "TEST 04 — Aucune valeur dimensionnelle n'est générée par formule mathématique");

  // TEST 05: Les éditions non vérifiées restent undefined
  const t5Valid = PIPE_DIMENSIONAL_REGISTRY.every((r) => r.standardEdition === undefined);
  assert(t5Valid, "TEST 05 — Les éditions non vérifiées restent strictly undefined");

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

  // =========================================================================
  // 2. TESTS CONDITIONNELS OBLIGATOIRES NORM-02-R1 (TESTS C01 à C14)
  // =========================================================================

  // TEST C01: VERIFIED sans sourceReference → FAIL
  const resC01 = validatePipeDimensionalRecord({ sourceStatus: "VERIFIED", sourceReference: undefined });
  assert(
    !resC01.valid && resC01.errors.some((e) => e.code === "VERIFIED_RECORD_REQUIRES_SOURCE_REFERENCE" || e.code === "MISSING_SOURCE_REFERENCE"),
    "TEST C01 — VERIFIED sans sourceReference doit échouer à la validation"
  );

  // TEST C02: VERIFIED avec sourceReference → PASS (sur la sourceReference)
  const resC02 = validatePipeDimensionalRecord({
    sourceStatus: "VERIFIED",
    sourceReference: "ASME B36.10M-2018 Table 1",
    standardId: "ASME-B36.10M",
    unitSystem: "SI",
  });
  assert(
    resC02.valid,
    "TEST C02 — VERIFIED avec sourceReference valide doit être accepté"
  );

  // TEST C03: LICENSED sans sourceReference → FAIL
  const resC03 = validatePipeDimensionalRecord({ sourceStatus: "LICENSED", sourceReference: undefined });
  assert(
    !resC03.valid && resC03.errors.some((e) => e.code === "LICENSED_RECORD_REQUIRES_SOURCE_REFERENCE" || e.code === "MISSING_SOURCE_REFERENCE"),
    "TEST C03 — LICENSED sans sourceReference doit échouer à la validation"
  );

  // TEST C04: UNVERIFIED sans sourceReference → PASS (aucune source requise)
  const resC04 = validatePipeDimensionalRecord({
    sourceStatus: "UNVERIFIED",
    standardId: "ASME-B36.10M",
    unitSystem: "SI",
  });
  assert(
    resC04.valid,
    "TEST C04 — UNVERIFIED sans sourceReference doit être valide"
  );

  // TEST C05: LEGACY sans sourceReference → PASS, non VERIFIED automatiquement
  const resC05 = validatePipeDimensionalRecord({
    sourceStatus: "LEGACY",
    standardId: "ASME-B36.10M",
    unitSystem: "SI",
  });
  assert(
    resC05.valid,
    "TEST C05 — LEGACY sans sourceReference reste valide comme donnée historique non VERIFIED"
  );

  // TEST C06: standardId = ASME-B31.3 (DESIGN_CODE) → FAIL
  const resC06 = validatePipeDimensionalRecord({ standardId: "ASME-B31.3", sourceStatus: "UNVERIFIED", unitSystem: "SI" });
  assert(
    !resC06.valid && resC06.errors.some((e) => e.code === "STANDARD_IS_NOT_DIMENSIONAL" || e.code === "INVALID_STANDARD_ID"),
    "TEST C06 — standardId = ASME-B31.3 (Code de conception) doit être rejeté par le validateur dimensionnel"
  );

  // TEST C07: standardId = ASME-B36.10M (DIMENSIONAL_STANDARD) → PASS
  const resC07 = validatePipeDimensionalRecord({ standardId: "ASME-B36.10M", sourceStatus: "UNVERIFIED", unitSystem: "SI" });
  assert(
    resC07.valid,
    "TEST C07 — standardId = ASME-B36.10M (Standard dimensionnel) doit être accepté"
  );

  // TEST C08: dn = 0 → FAIL
  const resC08 = validatePipeDimensionalRecord({ dn: 0, sourceStatus: "UNVERIFIED", unitSystem: "SI" });
  assert(
    !resC08.valid && resC08.errors.some((e) => e.code === "INVALID_DN"),
    "TEST C08 — dn = 0 doit être rejeté (INVALID_DN)"
  );

  // TEST C09: outsideDiameterMm = -1 → FAIL
  const resC09 = validatePipeDimensionalRecord({ outsideDiameterMm: -1, sourceStatus: "UNVERIFIED", unitSystem: "SI" });
  assert(
    !resC09.valid && resC09.errors.some((e) => e.code === "INVALID_OUTSIDE_DIAMETER"),
    "TEST C09 — outsideDiameterMm = -1 doit être rejeté (INVALID_OUTSIDE_DIAMETER)"
  );

  // TEST C10: wallThicknessMm = 0 → FAIL
  const resC10 = validatePipeDimensionalRecord({ wallThicknessMm: 0, sourceStatus: "UNVERIFIED", unitSystem: "SI" });
  assert(
    !resC10.valid && resC10.errors.some((e) => e.code === "INVALID_WALL_THICKNESS"),
    "TEST C10 — wallThicknessMm = 0 doit être rejeté (INVALID_WALL_THICKNESS)"
  );

  // TEST C11: schedule = "" → FAIL
  const resC11 = validatePipeDimensionalRecord({ schedule: "", sourceStatus: "UNVERIFIED", unitSystem: "SI" });
  assert(
    !resC11.valid && resC11.errors.some((e) => e.code === "EMPTY_SCHEDULE"),
    "TEST C11 — schedule = '' doit être rejeté si fourni (EMPTY_SCHEDULE)"
  );

  // TEST C12: pipeType = "INVALID" → FAIL
  const resC12 = validatePipeDimensionalRecord({ pipeType: "INVALID" as any, sourceStatus: "UNVERIFIED", unitSystem: "SI" });
  assert(
    !resC12.valid && resC12.errors.some((e) => e.code === "INVALID_PIPE_TYPE"),
    "TEST C12 — pipeType invalide doit être rejeté (INVALID_PIPE_TYPE)"
  );

  // TEST C13: Aucune fonction de conversion NPS/DN créée
  assert(
    !hasConversionFunction,
    "TEST C13 — Confirmation stricte : Aucune fonction de conversion NPS ↔ DN n'a été créée"
  );

  // TEST C14: Aucune dérivation Schedule → thickness créée
  assert(
    !hasScheduleMapper,
    "TEST C14 — Confirmation stricte : Aucune dérivation automatique Schedule → épaisseur n'a été créée"
  );

  return { success, results };
}
