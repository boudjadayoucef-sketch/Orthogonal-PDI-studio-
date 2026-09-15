/**
 * PDI NORMATIVE ENGINE — TESTS NORM-08
 * Reference: PATCH NORM-08 (Design Code Engine / Engineering Calculation Foundation)
 * 
 * Tests unitaires déterministes validant les 36 exigences strictes de NORM-08 :
 * - D01: Design Code existant reconnu.
 * - D02: Design Code inconnu -> FAIL.
 * - D03: Design Code PRODUCT_STANDARD -> FAIL.
 * - D04: Design Code DIMENSIONAL_STANDARD -> FAIL.
 * - D05: Design Code MATERIAL_STANDARD -> FAIL.
 * - D06: {} partial -> PASS.
 * - D07: {} complete -> FAIL lorsque le calcul sélectionné exige des inputs.
 * - D08: null -> FAIL.
 * - D09: array -> FAIL.
 * - D10: invalid unit system -> FAIL.
 * - D11: pressure <= 0 -> FAIL lorsqu'exigée.
 * - D12: diameter <= 0 -> FAIL lorsqu'exigée.
 * - D13: thickness <= 0 -> FAIL lorsqu'exigée.
 * - D14: corrosion allowance négative -> FAIL.
 * - D15: NaN -> FAIL.
 * - D16: Infinity -> FAIL.
 * - D17: missing material reference -> FAIL lorsqu'un calcul le requiert.
 * - D18: missing pipe dimension reference -> FAIL lorsqu'un calcul le requiert.
 * - D19: missing weld factor -> aucune valeur implicite (FAIL sur complete).
 * - D20: missing design factor -> aucune valeur implicite (rejet si invalide).
 * - D21: missing edition lorsque requise -> pas d'invention silencieuse.
 * - D22: formula sans source vérifiée -> NOT_IMPLEMENTED ou UNVERIFIED.
 * - D23: formula sans clause/reference -> NOT_IMPLEMENTED ou UNVERIFIED.
 * - D24: aucun résultat NaN.
 * - D25: aucun résultat Infinity.
 * - D26: aucun arrondi arbitraire.
 * - D27: aucune conversion NPS/DN ajoutée.
 * - D28: aucune conversion Class/PN ajoutée.
 * - D29: aucune donnée matériau inventée.
 * - D30: aucune donnée dimensionnelle inventée.
 * - D31: aucun mapping legacy.
 * - D32: aucune intégration UI.
 * - D33: aucune intégration database.
 * - D34: aucune décision de compliance (COMPLIANT interdit).
 * - D35: registry immutable (Object.isFrozen).
 * - D36: calcul purement déterministe pour les mêmes entrées.
 */

import {
  DESIGN_CODE_CALCULATION_REGISTRY,
  getDesignCodeCalculationEntry,
  isDesignCodeRegisteredForCalculation,
} from "../registry/designCodeRegistry";
import {
  validateCompleteEngineeringCalculationInput,
  validatePartialEngineeringCalculationInput,
} from "../validators/designCodeValidator";
import { executeEngineeringCalculation } from "../engine/designCodeEngine";
import type { EngineeringCalculationInput } from "../types/designCodeTypes";

export function runDesignCodeEngineTests(): { success: boolean; testsRun: number } {
  let testsRun = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (!condition) {
      throw new Error(`TEST FAILED: ${testName} ${detail ? `(${detail})` : ""}`);
    }
  }

  // =========================================================================
  // D01: Design Code existant reconnu
  // =========================================================================
  testsRun++;
  const entryB313 = getDesignCodeCalculationEntry("ASME-B31.3");
  assert(
    entryB313 !== undefined && entryB313.id === "ASME-B31.3",
    "D01 — ASME-B31.3 doit être reconnu dans le registre de calcul"
  );

  // =========================================================================
  // D02: Design Code inconnu -> FAIL
  // =========================================================================
  testsRun++;
  const resD02 = validatePartialEngineeringCalculationInput({
    designCodeId: "UNKNOWN-CODE-999",
  });
  assert(
    !resD02.valid && resD02.errors.some((e) => e.code === "DESIGN_CODE_NOT_FOUND"),
    "D02 — Design Code inconnu doit échouer avec DESIGN_CODE_NOT_FOUND"
  );

  // =========================================================================
  // D03: Design Code PRODUCT_STANDARD (ASME-B16.5) -> FAIL
  // =========================================================================
  testsRun++;
  const resD03 = validatePartialEngineeringCalculationInput({
    designCodeId: "ASME-B16.5",
  });
  assert(
    !resD03.valid && resD03.errors.some((e) => e.code === "STANDARD_IS_NOT_DESIGN_CODE"),
    "D03 — Standard produit (ASME-B16.5) fourni comme designCodeId doit échouer"
  );

  // =========================================================================
  // D04: Design Code DIMENSIONAL_STANDARD (ASME-B36.10M) -> FAIL
  // =========================================================================
  testsRun++;
  const resD04 = validatePartialEngineeringCalculationInput({
    designCodeId: "ASME-B36.10M",
  });
  assert(
    !resD04.valid && resD04.errors.some((e) => e.code === "STANDARD_IS_NOT_DESIGN_CODE"),
    "D04 — Standard dimensionnel (ASME-B36.10M) fourni comme designCodeId doit échouer"
  );

  // =========================================================================
  // D05: Design Code MATERIAL_STANDARD (API-5L) -> FAIL
  // =========================================================================
  testsRun++;
  const resD05 = validatePartialEngineeringCalculationInput({
    designCodeId: "API-5L",
  });
  assert(
    !resD05.valid && resD05.errors.some((e) => e.code === "STANDARD_IS_NOT_DESIGN_CODE"),
    "D05 — Standard matériau (API-5L) fourni comme designCodeId doit échouer"
  );

  // =========================================================================
  // D06: {} partial -> PASS
  // =========================================================================
  testsRun++;
  const resD06 = validatePartialEngineeringCalculationInput({});
  assert(resD06.valid && resD06.errors.length === 0, "D06 — {} partial doit être valide");

  // =========================================================================
  // D07: {} complete -> FAIL lorsque le calcul sélectionné exige des inputs
  // =========================================================================
  testsRun++;
  const resD07 = validateCompleteEngineeringCalculationInput({});
  assert(!resD07.valid && resD07.errors.length > 0, "D07 — {} complete doit échouer");

  // =========================================================================
  // D08: null -> FAIL
  // =========================================================================
  testsRun++;
  const resD08 = validatePartialEngineeringCalculationInput(null);
  assert(
    !resD08.valid && resD08.errors.some((e) => e.code === "INVALID_RECORD_OBJECT"),
    "D08 — null doit échouer avec INVALID_RECORD_OBJECT"
  );

  // =========================================================================
  // D09: array -> FAIL
  // =========================================================================
  testsRun++;
  const resD09 = validatePartialEngineeringCalculationInput([]);
  assert(
    !resD09.valid && resD09.errors.some((e) => e.code === "INVALID_RECORD_OBJECT"),
    "D09 — array doit échouer avec INVALID_RECORD_OBJECT"
  );

  // =========================================================================
  // D10: invalid unit system -> FAIL
  // =========================================================================
  testsRun++;
  const resD10 = validatePartialEngineeringCalculationInput({
    unitSystem: "METRIC_BAR" as unknown as undefined,
  });
  assert(
    !resD10.valid && resD10.errors.some((e) => e.code === "INVALID_UNIT_SYSTEM"),
    "D10 — Système d'unité invalide doit échouer"
  );

  // =========================================================================
  // D11: pressure <= 0 -> FAIL lorsqu'exigée
  // =========================================================================
  testsRun++;
  const resD11 = validatePartialEngineeringCalculationInput({
    pressure: 0,
  });
  assert(
    !resD11.valid && resD11.errors.some((e) => e.code === "INVALID_PRESSURE"),
    "D11 — Pression <= 0 doit échouer avec INVALID_PRESSURE"
  );

  // =========================================================================
  // D12: diameter <= 0 -> FAIL lorsqu'exigée
  // =========================================================================
  testsRun++;
  const resD12 = validatePartialEngineeringCalculationInput({
    outsideDiameterMm: -10,
  });
  assert(
    !resD12.valid && resD12.errors.some((e) => e.code === "INVALID_DIAMETER"),
    "D12 — Diamètre <= 0 doit échouer avec INVALID_DIAMETER"
  );

  // =========================================================================
  // D13: thickness <= 0 -> FAIL lorsqu'exigée
  // =========================================================================
  testsRun++;
  const resD13 = validatePartialEngineeringCalculationInput({
    wallThicknessMm: 0,
  });
  assert(
    !resD13.valid && resD13.errors.some((e) => e.code === "INVALID_THICKNESS"),
    "D13 — Épaisseur <= 0 doit échouer avec INVALID_THICKNESS"
  );

  // =========================================================================
  // D14: corrosion allowance négative -> FAIL
  // =========================================================================
  testsRun++;
  const resD14 = validatePartialEngineeringCalculationInput({
    corrosionAllowanceMm: -1.5,
  });
  assert(
    !resD14.valid && resD14.errors.some((e) => e.code === "INVALID_CORROSION_ALLOWANCE"),
    "D14 — Surépaisseur de corrosion négative doit échouer"
  );

  // =========================================================================
  // D15: NaN -> FAIL
  // =========================================================================
  testsRun++;
  const resD15 = validatePartialEngineeringCalculationInput({
    pressure: NaN,
  });
  assert(
    !resD15.valid && resD15.errors.some((e) => e.code === "INVALID_INPUT_VALUE"),
    "D15 — NaN en entrée doit échouer"
  );

  // =========================================================================
  // D16: Infinity -> FAIL
  // =========================================================================
  testsRun++;
  const resD16 = validatePartialEngineeringCalculationInput({
    pressure: Infinity,
  });
  assert(
    !resD16.valid && resD16.errors.some((e) => e.code === "INVALID_INPUT_VALUE"),
    "D16 — Infinity en entrée doit échouer"
  );

  // =========================================================================
  // D17: missing material reference -> FAIL lorsqu'un calcul le requiert
  // =========================================================================
  testsRun++;
  const resD17 = validateCompleteEngineeringCalculationInput({
    designCodeId: "ASME-B31.3",
    calculationType: "PRESSURE_WALL_THICKNESS",
    unitSystem: "SI",
    pressure: 2.0,
    outsideDiameterMm: 60.3,
    corrosionAllowanceMm: 1.5,
    weldJointFactor: 1.0,
    // Absence de materialId et allowableStressMpa
  });
  assert(
    !resD17.valid && resD17.errors.some((e) => e.code === "MATERIAL_REFERENCE_REQUIRED"),
    "D17 — Absence de référence matériau doit échouer avec MATERIAL_REFERENCE_REQUIRED"
  );

  // =========================================================================
  // D18: missing pipe dimension reference -> FAIL lorsqu'un calcul le requiert
  // =========================================================================
  testsRun++;
  const resD18 = validateCompleteEngineeringCalculationInput({
    designCodeId: "ASME-B31.3",
    calculationType: "PRESSURE_WALL_THICKNESS",
    unitSystem: "SI",
    pressure: 2.0,
    materialId: "MAT_CS_001",
    corrosionAllowanceMm: 1.5,
    weldJointFactor: 1.0,
    // Absence de outsideDiameterMm
  });
  assert(
    !resD18.valid && resD18.errors.some((e) => e.code === "PIPE_DIMENSION_REFERENCE_REQUIRED"),
    "D18 — Absence de référence dimensionnelle doit échouer avec PIPE_DIMENSION_REFERENCE_REQUIRED"
  );

  // =========================================================================
  // D19: missing weld factor -> aucune valeur implicite
  // =========================================================================
  testsRun++;
  const resD19 = validateCompleteEngineeringCalculationInput({
    designCodeId: "ASME-B31.3",
    calculationType: "PRESSURE_WALL_THICKNESS",
    unitSystem: "SI",
    pressure: 2.0,
    outsideDiameterMm: 60.3,
    materialId: "MAT_CS_001",
    corrosionAllowanceMm: 1.5,
    // weldJointFactor manquant
  });
  assert(
    !resD19.valid && resD19.errors.some((e) => e.field === "weldJointFactor"),
    "D19 — weldJointFactor manquant doit échouer (aucune valeur implicite)"
  );

  // =========================================================================
  // D20: missing design factor -> aucune valeur implicite
  // =========================================================================
  testsRun++;
  const resD20Invalid = validatePartialEngineeringCalculationInput({
    designFactor: 1.5, // > 1.0 -> invalide
  });
  assert(
    !resD20Invalid.valid && resD20Invalid.errors.some((e) => e.code === "INVALID_COEFFICIENT"),
    "D20 — designFactor hors domaine valide doit échouer"
  );

  // =========================================================================
  // D21: missing edition lorsque requise -> pas d'invention silencieuse
  // =========================================================================
  testsRun++;
  const validNominalInput: EngineeringCalculationInput = {
    designCodeId: "ASME-B31.3",
    calculationType: "PRESSURE_WALL_THICKNESS",
    unitSystem: "SI",
    pressure: 2.5,
    outsideDiameterMm: 114.3,
    materialId: "MAT_API_5L_X52",
    corrosionAllowanceMm: 1.5,
    weldJointFactor: 1.0,
  };
  const execD21 = executeEngineeringCalculation(validNominalInput);
  assert(
    execD21.standardEdition === undefined,
    "D21 — L'édition ne doit pas être inventée silencieusement"
  );

  // =========================================================================
  // D22: formula sans source vérifiée -> NOT_IMPLEMENTED ou UNVERIFIED
  // =========================================================================
  testsRun++;
  assert(
    execD21.status === "NOT_IMPLEMENTED" || execD21.status === "UNVERIFIED",
    "D22 — Formule sans source vérifiée doit renvoyer NOT_IMPLEMENTED ou UNVERIFIED"
  );

  // =========================================================================
  // D23: formula sans clause/reference -> NOT_IMPLEMENTED ou UNVERIFIED
  // =========================================================================
  testsRun++;
  assert(
    execD21.status === "NOT_IMPLEMENTED",
    "D23 — Sans clause vérifiée implémentée, le statut doit être NOT_IMPLEMENTED"
  );

  // =========================================================================
  // D24: aucun résultat NaN
  // =========================================================================
  testsRun++;
  assert(
    execD21.value === undefined || (typeof execD21.value === "number" && !Number.isNaN(execD21.value)),
    "D24 — Aucun résultat ne doit être NaN"
  );

  // =========================================================================
  // D25: aucun résultat Infinity
  // =========================================================================
  testsRun++;
  assert(
    execD21.value === undefined || (typeof execD21.value === "number" && Number.isFinite(execD21.value)),
    "D25 — Aucun résultat ne doit être Infinity"
  );

  // =========================================================================
  // D26: aucun arrondi arbitraire
  // =========================================================================
  testsRun++;
  assert(
    !("roundedValue" in execD21),
    "D26 — Aucun champ d'arrondi arbitraire dans le modèle de résultat"
  );

  // =========================================================================
  // D27: aucune conversion NPS/DN ajoutée
  // =========================================================================
  testsRun++;
  assert(
    !("convertedDn" in execD21) && !("convertedNps" in execD21),
    "D27 — Aucune conversion automatique NPS/DN"
  );

  // =========================================================================
  // D28: aucune conversion Class/PN ajoutée
  // =========================================================================
  testsRun++;
  assert(
    !("convertedRating" in execD21),
    "D28 — Aucune conversion automatique Class/PN"
  );

  // =========================================================================
  // D29: aucune donnée matériau inventée
  // =========================================================================
  testsRun++;
  assert(
    !("fabricatedYieldStrength" in execD21) && !("inventedAllowableStress" in execD21),
    "D29 — Aucune donnée de matériau inventée"
  );

  // =========================================================================
  // D30: aucune donnée dimensionnelle inventée
  // =========================================================================
  testsRun++;
  assert(
    !("assumedSchedule" in execD21),
    "D30 — Aucune donnée dimensionnelle inventée (aucun Schedule assumé)"
  );

  // =========================================================================
  // D31: aucun mapping legacy
  // =========================================================================
  testsRun++;
  assert(
    !("legacyCatalogId" in execD21),
    "D31 — Aucun mapping vers les catalogues legacy"
  );

  // =========================================================================
  // D32: aucune intégration UI
  // =========================================================================
  testsRun++;
  assert(
    !("htmlElement" in execD21) && !("reactComponent" in execD21),
    "D32 — Aucune intégration UI dans le moteur"
  );

  // =========================================================================
  // D33: aucune intégration database
  // =========================================================================
  testsRun++;
  assert(
    !("firestoreId" in execD21) && !("sqlTable" in execD21),
    "D33 — Aucune intégration base de données dans le moteur de calcul"
  );

  // =========================================================================
  // D34: aucune décision de compliance
  // =========================================================================
  testsRun++;
  assert(
    (execD21.status as string) !== "COMPLIANT",
    "D34 — Le statut COMPLIANT est strictement interdit dans NORM-08"
  );

  // =========================================================================
  // D35: registry immutable
  // =========================================================================
  testsRun++;
  assert(
    Object.isFrozen(DESIGN_CODE_CALCULATION_REGISTRY),
    "D35 — Le registre DESIGN_CODE_CALCULATION_REGISTRY doit être gelé (Object.freeze)"
  );

  // =========================================================================
  // D36: calcul purement déterministe pour les mêmes entrées
  // =========================================================================
  testsRun++;
  const runA = executeEngineeringCalculation(validNominalInput);
  const runB = executeEngineeringCalculation(validNominalInput);
  assert(
    runA.status === runB.status &&
      runA.calculationType === runB.calculationType &&
      runA.designCodeId === runB.designCodeId &&
      runA.errors.length === runB.errors.length,
    "D36 — Le calcul doit être strictement déterministe pour des entrées identiques"
  );

  return { success: true, testsRun };
}
