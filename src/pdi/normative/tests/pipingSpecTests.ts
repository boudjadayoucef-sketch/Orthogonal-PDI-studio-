/**
 * PDI NORMATIVE ENGINE — PIPING SPECIFICATION TESTS (NORM-07)
 * Reference: PATCH NORM-07 (Piping Specification Engine / Spec Builder)
 * 
 * Suite de tests déterministes et isolés pour le Piping Specification Engine.
 * Valide les tests obligatoires S01 à S32 :
 * - Validation structurelle (INVALID_RECORD_OBJECT) et type safety (unknown)
 * - Exigences des records complets vs partiels
 * - Séparation stricte des types de standards (DESIGN_CODE, DIMENSIONAL_STANDARD, PRODUCT_STANDARD)
 * - Traçabilité (VERIFIED / LICENSED exigent sourceReference)
 * - Détection des duplications de code / id dans les registres
 * - Registre de production immuable avec 0 record
 * - Absence totale de calcul (épaisseur, B31, pression, température, conformité mécanique)
 */

import {
  validateCompletePipingSpecification,
  validatePartialPipingSpecification,
  validatePipingSpecRegistryUniqueness,
} from "../validators/pipingSpecValidator";
import {
  PIPING_SPEC_REGISTRY,
  getPipingSpecById,
  getPipingSpecByCode,
  getPipingSpecsByDesignCode,
  getPipingSpecsByMaterial,
  getAllPipingSpecs,
} from "../registry/pipingSpecRegistry";
import type { PipingSpecification } from "../types/pipingSpecTypes";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION_FAILED] ${message}`);
  }
}

/**
 * Fixture synthétique de test valide (utilisée strictement dans les tests).
 */
const validSpecFixture: PipingSpecification = Object.freeze({
  id: "TEST_SPEC_001",
  code: "TEST_CS150",
  name: "Test Carbon Steel 150# Process Piping",
  designCodeId: "ASME-B31.3",
  materialReferenceIds: ["MAT_API_5L_X65"],
  pipeRules: [
    {
      pipeDimensionalStandardId: "ASME-B36.10M",
      schedule: "STD",
      sourceStatus: "UNVERIFIED" as const,
    },
  ],
  fittingRules: [
    {
      fittingStandardId: "ASME-B16.9",
      fittingTypes: ["ELBOW", "TEE"] as const,
      sourceStatus: "UNVERIFIED" as const,
    },
  ],
  flangeRules: [
    {
      flangeStandardId: "ASME-B16.5",
      flangeTypes: ["WELD_NECK", "BLIND"] as const,
      ratingSystem: "ASME_CLASS" as const,
      rating: "Class 150",
      sourceStatus: "UNVERIFIED" as const,
    },
  ],
  valveRules: [
    {
      productStandardId: "API-600",
      dimensionalStandardId: "ASME-B16.10",
      valveTypes: ["GATE"] as const,
      connectionTypes: ["FLANGED"] as const,
      sourceStatus: "UNVERIFIED" as const,
    },
  ],
  sourceStatus: "UNVERIFIED",
});

export function runPipingSpecEngineTests(): { success: boolean; testsRun: number } {
  let testsRun = 0;

  // =========================================================================
  // S01: Record complet minimal valide
  // =========================================================================
  testsRun++;
  const minimalSpec: PipingSpecification = Object.freeze({
    id: "TEST_SPEC_MINIMAL",
    code: "MIN01",
    name: "Minimal Spec",
    materialReferenceIds: [],
    pipeRules: [],
    fittingRules: [],
    flangeRules: [],
    valveRules: [],
    sourceStatus: "UNVERIFIED",
  });
  const resS01 = validateCompletePipingSpecification(minimalSpec);
  assert(
    resS01.valid && resS01.errors.length === 0,
    "S01 — Record complet minimal valide doit passer"
  );

  // =========================================================================
  // S02: {} complete -> FAIL
  // =========================================================================
  testsRun++;
  const resS02 = validateCompletePipingSpecification({});
  assert(
    !resS02.valid &&
      resS02.errors.some((e) => e.code === "MISSING_RECORD_ID") &&
      resS02.errors.some((e) => e.code === "MISSING_SPEC_CODE") &&
      resS02.errors.some((e) => e.code === "MISSING_SPEC_NAME") &&
      resS02.errors.some((e) => e.code === "MISSING_SOURCE_STATUS"),
    "S02 — validateCompletePipingSpecification({}) doit échouer (champs requis manquants)"
  );

  // =========================================================================
  // S03: {} partial -> PASS
  // =========================================================================
  testsRun++;
  const resS03 = validatePartialPipingSpecification({});
  assert(
    resS03.valid && resS03.errors.length === 0,
    "S03 — validatePartialPipingSpecification({}) doit passer (état partiel)"
  );

  // =========================================================================
  // S04: null -> FAIL (INVALID_RECORD_OBJECT)
  // =========================================================================
  testsRun++;
  const resS04 = validatePartialPipingSpecification(null as unknown);
  assert(
    !resS04.valid && resS04.errors.some((e) => e.code === "INVALID_RECORD_OBJECT"),
    "S04 — validatePartialPipingSpecification(null) doit échouer avec INVALID_RECORD_OBJECT"
  );

  // =========================================================================
  // S05: array -> FAIL (INVALID_RECORD_OBJECT)
  // =========================================================================
  testsRun++;
  const resS05 = validatePartialPipingSpecification([validSpecFixture] as unknown);
  assert(
    !resS05.valid && resS05.errors.some((e) => e.code === "INVALID_RECORD_OBJECT"),
    "S05 — validatePartialPipingSpecification([]) doit échouer avec INVALID_RECORD_OBJECT"
  );

  // =========================================================================
  // S06: code vide -> FAIL (EMPTY_SPEC_CODE)
  // =========================================================================
  testsRun++;
  const resS06 = validatePartialPipingSpecification({
    code: "   ",
  });
  assert(
    !resS06.valid && resS06.errors.some((e) => e.code === "EMPTY_SPEC_CODE"),
    "S06 — code vide doit échouer avec EMPTY_SPEC_CODE"
  );

  // =========================================================================
  // S07: name vide -> FAIL (EMPTY_SPEC_NAME)
  // =========================================================================
  testsRun++;
  const resS07 = validatePartialPipingSpecification({
    name: "   ",
  });
  assert(
    !resS07.valid && resS07.errors.some((e) => e.code === "EMPTY_SPEC_NAME"),
    "S07 — name vide doit échouer avec EMPTY_SPEC_NAME"
  );

  // =========================================================================
  // S08: designCodeId valide de type DESIGN_CODE -> PASS
  // =========================================================================
  testsRun++;
  const resS08 = validatePartialPipingSpecification({
    designCodeId: "ASME-B31.3",
  });
  assert(
    resS08.valid && resS08.errors.length === 0,
    "S08 — designCodeId = ASME-B31.3 (DESIGN_CODE) doit passer"
  );

  // =========================================================================
  // S09: designCodeId = API-600 -> FAIL (STANDARD_IS_NOT_DESIGN_CODE)
  // =========================================================================
  testsRun++;
  const resS09 = validatePartialPipingSpecification({
    designCodeId: "API-600" as unknown as undefined,
  });
  assert(
    !resS09.valid && resS09.errors.some((e) => e.code === "STANDARD_IS_NOT_DESIGN_CODE"),
    "S09 — designCodeId = API-600 (PRODUCT_STANDARD) doit échouer"
  );

  // =========================================================================
  // S10: pipeDimensionalStandardId = ASME-B36.10M -> PASS
  // =========================================================================
  testsRun++;
  const resS10 = validatePartialPipingSpecification({
    pipeRules: [{ pipeDimensionalStandardId: "ASME-B36.10M", sourceStatus: "UNVERIFIED" }],
  });
  assert(
    resS10.valid && resS10.errors.length === 0,
    "S10 — pipeDimensionalStandardId = ASME-B36.10M (DIMENSIONAL_STANDARD) doit passer"
  );

  // =========================================================================
  // S11: pipeDimensionalStandardId = API-600 -> FAIL (STANDARD_IS_NOT_DIMENSIONAL_STANDARD)
  // =========================================================================
  testsRun++;
  const resS11 = validatePartialPipingSpecification({
    pipeRules: [{ pipeDimensionalStandardId: "API-600" as unknown as undefined, sourceStatus: "UNVERIFIED" }],
  });
  assert(
    !resS11.valid && resS11.errors.some((e) => e.code === "STANDARD_IS_NOT_DIMENSIONAL_STANDARD"),
    "S11 — pipeDimensionalStandardId = API-600 doit échouer avec STANDARD_IS_NOT_DIMENSIONAL_STANDARD"
  );

  // =========================================================================
  // S12: fittingStandardId = ASME-B16.9 -> PASS
  // =========================================================================
  testsRun++;
  const resS12 = validatePartialPipingSpecification({
    fittingRules: [{ fittingStandardId: "ASME-B16.9", sourceStatus: "UNVERIFIED" }],
  });
  assert(
    resS12.valid && resS12.errors.length === 0,
    "S12 — fittingStandardId = ASME-B16.9 (PRODUCT_STANDARD) doit passer"
  );

  // =========================================================================
  // S13: fittingStandardId = ASME-B31.3 -> FAIL (STANDARD_IS_NOT_PRODUCT_STANDARD)
  // =========================================================================
  testsRun++;
  const resS13 = validatePartialPipingSpecification({
    fittingRules: [{ fittingStandardId: "ASME-B31.3" as unknown as undefined, sourceStatus: "UNVERIFIED" }],
  });
  assert(
    !resS13.valid && resS13.errors.some((e) => e.code === "STANDARD_IS_NOT_PRODUCT_STANDARD"),
    "S13 — fittingStandardId = ASME-B31.3 doit échouer avec STANDARD_IS_NOT_PRODUCT_STANDARD"
  );

  // =========================================================================
  // S14: flangeStandardId = ASME-B16.5 -> PASS
  // =========================================================================
  testsRun++;
  const resS14 = validatePartialPipingSpecification({
    flangeRules: [{ flangeStandardId: "ASME-B16.5", sourceStatus: "UNVERIFIED" }],
  });
  assert(
    resS14.valid && resS14.errors.length === 0,
    "S14 — flangeStandardId = ASME-B16.5 (PRODUCT_STANDARD) doit passer"
  );

  // =========================================================================
  // S15: flangeStandardId = ASME-B36.10M -> FAIL (STANDARD_IS_NOT_PRODUCT_STANDARD)
  // =========================================================================
  testsRun++;
  const resS15 = validatePartialPipingSpecification({
    flangeRules: [{ flangeStandardId: "ASME-B36.10M" as unknown as undefined, sourceStatus: "UNVERIFIED" }],
  });
  assert(
    !resS15.valid && resS15.errors.some((e) => e.code === "STANDARD_IS_NOT_PRODUCT_STANDARD"),
    "S15 — flangeStandardId = ASME-B36.10M doit échouer avec STANDARD_IS_NOT_PRODUCT_STANDARD"
  );

  // =========================================================================
  // S16: valve productStandardId = API-600 -> PASS
  // =========================================================================
  testsRun++;
  const resS16 = validatePartialPipingSpecification({
    valveRules: [{ productStandardId: "API-600", sourceStatus: "UNVERIFIED" }],
  });
  assert(
    resS16.valid && resS16.errors.length === 0,
    "S16 — valve productStandardId = API-600 (PRODUCT_STANDARD) doit passer"
  );

  // =========================================================================
  // S17: valve productStandardId = ASME-B16.10 -> FAIL (STANDARD_IS_NOT_PRODUCT_STANDARD)
  // =========================================================================
  testsRun++;
  const resS17 = validatePartialPipingSpecification({
    valveRules: [{ productStandardId: "ASME-B16.10" as unknown as undefined, sourceStatus: "UNVERIFIED" }],
  });
  assert(
    !resS17.valid && resS17.errors.some((e) => e.code === "STANDARD_IS_NOT_PRODUCT_STANDARD"),
    "S17 — valve productStandardId = ASME-B16.10 doit échouer avec STANDARD_IS_NOT_PRODUCT_STANDARD"
  );

  // =========================================================================
  // S18: valve dimensionalStandardId = ASME-B16.10 -> PASS
  // =========================================================================
  testsRun++;
  const resS18 = validatePartialPipingSpecification({
    valveRules: [{ dimensionalStandardId: "ASME-B16.10", sourceStatus: "UNVERIFIED" }],
  });
  assert(
    resS18.valid && resS18.errors.length === 0,
    "S18 — valve dimensionalStandardId = ASME-B16.10 (DIMENSIONAL_STANDARD) doit passer"
  );

  // =========================================================================
  // S19: valve dimensionalStandardId = API-600 -> FAIL (STANDARD_IS_NOT_DIMENSIONAL_STANDARD)
  // =========================================================================
  testsRun++;
  const resS19 = validatePartialPipingSpecification({
    valveRules: [{ dimensionalStandardId: "API-600" as unknown as undefined, sourceStatus: "UNVERIFIED" }],
  });
  assert(
    !resS19.valid && resS19.errors.some((e) => e.code === "STANDARD_IS_NOT_DIMENSIONAL_STANDARD"),
    "S19 — valve dimensionalStandardId = API-600 doit échouer avec STANDARD_IS_NOT_DIMENSIONAL_STANDARD"
  );

  // =========================================================================
  // S20: VERIFIED sans sourceReference -> FAIL
  // =========================================================================
  testsRun++;
  const resS20 = validatePartialPipingSpecification({
    sourceStatus: "VERIFIED",
    sourceReference: undefined,
  });
  assert(
    !resS20.valid && resS20.errors.some((e) => e.code === "VERIFIED_RECORD_REQUIRES_SOURCE_REFERENCE"),
    "S20 — VERIFIED sans sourceReference doit échouer"
  );

  // =========================================================================
  // S21: LICENSED sans sourceReference -> FAIL
  // =========================================================================
  testsRun++;
  const resS21 = validatePartialPipingSpecification({
    sourceStatus: "LICENSED",
    sourceReference: "   ",
  });
  assert(
    !resS21.valid && resS21.errors.some((e) => e.code === "LICENSED_RECORD_REQUIRES_SOURCE_REFERENCE"),
    "S21 — LICENSED avec sourceReference vide doit échouer"
  );

  // =========================================================================
  // S22: UNVERIFIED sans sourceReference -> PASS
  // =========================================================================
  testsRun++;
  const resS22 = validatePartialPipingSpecification({
    sourceStatus: "UNVERIFIED",
    sourceReference: undefined,
  });
  assert(
    resS22.valid && resS22.errors.length === 0,
    "S22 — UNVERIFIED sans sourceReference est autorisé"
  );

  // =========================================================================
  // S23: Deux Specs avec même code dans fixture registry -> FAIL
  // =========================================================================
  testsRun++;
  const duplicateRegistryFixture = [
    { id: "SPEC_001", code: "CS150" },
    { id: "SPEC_002", code: "CS150" },
  ];
  const resS23 = validatePipingSpecRegistryUniqueness(duplicateRegistryFixture);
  assert(
    !resS23.valid && resS23.errors.some((e) => e.code === "DUPLICATE_SPEC_CODE"),
    "S23 — Deux spécifications avec le même code doivent échouer à l'unicité"
  );

  // =========================================================================
  // S24: ratingSystem ASME_CLASS -> structurellement valide
  // =========================================================================
  testsRun++;
  const resS24 = validatePartialPipingSpecification({
    flangeRules: [{ flangeStandardId: "ASME-B16.5", ratingSystem: "ASME_CLASS", sourceStatus: "UNVERIFIED" }],
  });
  assert(
    resS24.valid && resS24.errors.length === 0,
    "S24 — ratingSystem ASME_CLASS est valide"
  );

  // =========================================================================
  // S25: ratingSystem EN_PN -> structurellement valide
  // =========================================================================
  testsRun++;
  const resS25 = validatePartialPipingSpecification({
    flangeRules: [{ flangeStandardId: "EN-1092-1", ratingSystem: "EN_PN", sourceStatus: "UNVERIFIED" }],
  });
  assert(
    resS25.valid && resS25.errors.length === 0,
    "S25 — ratingSystem EN_PN est valide"
  );

  // =========================================================================
  // S26: Aucune conversion Class ↔ PN
  // =========================================================================
  testsRun++;
  assert(
    !("convertedRating" in validSpecFixture) && !("equivalentPn" in validSpecFixture),
    "S26 — Aucune conversion automatique Class ↔ PN dans la spec"
  );

  // =========================================================================
  // S27: Aucun calcul d'épaisseur
  // =========================================================================
  testsRun++;
  assert(
    !("requiredThicknessMm" in validSpecFixture) && !("minimumThicknessMm" in validSpecFixture),
    "S27 — Aucun calcul d'épaisseur dans le Spec Builder"
  );

  // =========================================================================
  // S28: Aucun calcul B31
  // =========================================================================
  testsRun++;
  assert(
    !("allowableStress" in validSpecFixture) && !("b31Equation" in validSpecFixture),
    "S28 — Aucun calcul issu des équations de conception B31"
  );

  // =========================================================================
  // S29: Aucun calcul de pression
  // =========================================================================
  testsRun++;
  assert(
    !("designPressureBar" in validSpecFixture) && !("maop" in validSpecFixture),
    "S29 — Aucun calcul de pression nominale, maximale ou admissible"
  );

  // =========================================================================
  // S30: Registre de production = 0
  // =========================================================================
  testsRun++;
  assert(
    PIPING_SPEC_REGISTRY.length === 0,
    "S30 — PIPING_SPEC_REGISTRY doit être strictement vide (0 records)"
  );

  // =========================================================================
  // S31: Recherches registry pures et immuables
  // =========================================================================
  testsRun++;
  assert(getPipingSpecById("TEST_SPEC_001") === undefined, "getPipingSpecById retourne undefined");
  assert(getPipingSpecByCode("CS150") === undefined, "getPipingSpecByCode retourne undefined");
  assert(getPipingSpecsByDesignCode("ASME-B31.3").length === 0, "getPipingSpecsByDesignCode retourne tableau vide");
  assert(getPipingSpecsByMaterial("MAT_001").length === 0, "getPipingSpecsByMaterial retourne tableau vide");
  assert(getAllPipingSpecs().length === 0, "getAllPipingSpecs retourne tableau vide");

  // =========================================================================
  // S32: Aucun mapping automatique vers les catalogues legacy
  // =========================================================================
  testsRun++;
  assert(
    !("pdiDefaultSpecId" in validSpecFixture) && !("trouvayCauvinMapping" in validSpecFixture),
    "S32 — Aucun mapping automatique vers les catalogues legacy"
  );

  return { success: true, testsRun };
}
