/**
 * PDI NORMATIVE ENGINE — PIPING SPECIFICATION RESOLVER TESTS (SPEC-01)
 * 
 * Suite de tests unitaires et d'intégration pour le Piping Specification Resolver.
 * Validation déterministe avec données 100% synthétiques (aucun contenu inventé en prod).
 */

import { NormativeEvidenceRegistry } from "../registry/normativeEvidenceRegistry";
import { NormativeEvidenceResolver } from "../registry/normativeEvidenceResolver";
import { NormativeCompatibilityRegistry } from "../registry/normativeCompatibilityRegistry";
import { NormativeCompatibilityEngine } from "../engine/normativeCompatibilityEngine";
import { PipingSpecResolver } from "../engine/pipingSpecResolver";
import type { PipingSpecification } from "../types/pipingSpecTypes";
import type { PipingSpecResolutionContext } from "../types/pipingSpecResolverTypes";

export interface Spec01TestResult {
  readonly success: boolean;
  readonly testsRun: number;
  readonly results: readonly string[];
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[SPEC-01 ASSERTION FAILED] ${message}`);
  }
}

/**
 * Exécute l'ensemble des tests SPEC-01.
 */
export function runPipingSpecResolverTests(): Spec01TestResult {
  const results: string[] = [];
  let testsRun = 0;

  // 1. Initialisation des registres synthétiques
  const evRegistry = new NormativeEvidenceRegistry();
  evRegistry.register({
    evidenceId: "SYNTHETIC_EV_SPEC01_VERIFIED_01",
    standardId: "SYNTHETIC_STANDARD_SPEC01" as any,
    editionId: "SYNTHETIC_EDITION_2026",
    clauseReference: "CLAUSE_SPEC_01",
    sourceType: "VERIFIED_INTERNAL_REFERENCE",
    sourceReference: "SYNTHETIC_DOC_REF_01",
    verificationStatus: "VERIFIED",
    verifiedBy: "SYNTHETIC_AUDITOR",
    verifiedAt: "2026-01-01T00:00:00.000Z",
  });
  evRegistry.register({
    evidenceId: "SYNTHETIC_EV_SPEC01_UNVERIFIED_01",
    standardId: "SYNTHETIC_STANDARD_SPEC01" as any,
    editionId: "SYNTHETIC_EDITION_2026",
    clauseReference: "CLAUSE_SPEC_02",
    sourceType: "LEGACY_REFERENCE",
    sourceReference: "SYNTHETIC_DOC_REF_02",
    verificationStatus: "UNVERIFIED",
  });

  const evidenceResolver = new NormativeEvidenceResolver(evRegistry);
  const compatRegistry = new NormativeCompatibilityRegistry();

  // Règle 1 : Règle tuyau compatible
  compatRegistry.register({
    ruleId: "SYNTHETIC_COMPAT_RULE_PIPE_OK",
    description: "Synthetic pipe compatibility rule",
    componentType: "PIPE",
    nominalSize: "2",
    schedule: "SCH 40",
    materialId: "SYNTHETIC_MAT_CARBON_STEEL",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_SPEC01_VERIFIED_01"],
  });

  // Règle 1b : Règle tuyau compatible générique (sans contrainte matériau au niveau compatibilité)
  compatRegistry.register({
    ruleId: "SYNTHETIC_COMPAT_RULE_PIPE_GENERIC",
    description: "Synthetic generic pipe compatibility rule",
    componentType: "PIPE",
    nominalSize: "2",
    schedule: "SCH 40",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_SPEC01_VERIFIED_01"],
  });

  // Règle 2 : Règle incompatible explicite
  compatRegistry.register({
    ruleId: "SYNTHETIC_COMPAT_RULE_INCOMPAT",
    description: "Synthetic incompatible rule",
    componentType: "PIPE",
    nominalSize: "10",
    schedule: "SCH 160",
    materialId: "SYNTHETIC_MAT_CARBON_STEEL",
    status: "INCOMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_SPEC01_VERIFIED_01"],
  });

  // Règle 3 : Règle fitting
  compatRegistry.register({
    ruleId: "SYNTHETIC_COMPAT_RULE_FITTING",
    description: "Synthetic fitting rule",
    componentType: "FITTING",
    connectionType: "BUTT_WELD",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_SPEC01_VERIFIED_01"],
  });

  // Règle 4 : Règle flange
  compatRegistry.register({
    ruleId: "SYNTHETIC_COMPAT_RULE_FLANGE",
    description: "Synthetic flange rule",
    componentType: "FLANGE",
    pressureRating: "Class 150",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_SPEC01_VERIFIED_01"],
  });

  // Règle 5 : Règle valve
  compatRegistry.register({
    ruleId: "SYNTHETIC_COMPAT_RULE_VALVE",
    description: "Synthetic valve rule",
    componentType: "VALVE",
    connectionType: "FLANGED",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_SPEC01_VERIFIED_01"],
  });

  // Règle 6 : Règle avec preuve UNVERIFIED
  compatRegistry.register({
    ruleId: "SYNTHETIC_COMPAT_RULE_UNVERIFIED_EV",
    description: "Rule with unverified evidence",
    componentType: "SYNTHETIC_SPECIAL",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_SPEC01_UNVERIFIED_01"],
  });

  // Règle 7 : Règle avec preuve inexistante
  compatRegistry.register({
    ruleId: "SYNTHETIC_COMPAT_RULE_MISSING_EV",
    description: "Rule with missing evidence",
    componentType: "SYNTHETIC_MISSING",
    status: "COMPATIBLE",
    evidenceIds: ["NON_EXISTENT_EV_999"],
  });

  // Règle 8 : Règle sans conversion NPS/DN
  compatRegistry.register({
    ruleId: "SYNTHETIC_RULE_EXACT_NPS_2",
    description: "Rule requiring exact NPS 2 string",
    componentType: "SYNTHETIC_EXACT",
    nominalSize: "NPS 2",
    pressureRating: "Class 150",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_SPEC01_VERIFIED_01"],
  });

  const compatEngine = new NormativeCompatibilityEngine(compatRegistry, evidenceResolver);

  // Spécification de tuyauterie synthétique de test
  const syntheticSpec: PipingSpecification = {
    id: "SYNTHETIC_SPEC_001",
    code: "SYNTH_CS150",
    name: "Synthetic Carbon Steel Class 150 Spec",
    designCodeId: "ASME-B31.3",
    serviceClass: "CLASS_150_PROCESS",
    fluidService: "SYNTHETIC_PROCESS_FLUID",
    materialReferenceIds: ["SYNTHETIC_MAT_CARBON_STEEL", "SYNTHETIC_MAT_STAINLESS_STEEL"],
    pipeRules: [
      {
        pipeDimensionalStandardId: "ASME-B36.10M",
        schedule: "SCH 40",
        nominalSizes: ["2", "3", "4", "6", "8", "10"],
        materialId: "SYNTHETIC_MAT_CARBON_STEEL",
        sourceStatus: "VERIFIED",
        sourceReference: "SYNTHETIC_SPEC_DOC_P01",
      },
    ],
    fittingRules: [
      {
        fittingStandardId: "ASME-B16.9",
        fittingTypes: ["ELBOW", "TEE", "REDUCER"],
        connectionTypes: ["BUTT_WELD"],
        materialId: "SYNTHETIC_MAT_CARBON_STEEL",
        sourceStatus: "VERIFIED",
      },
    ],
    flangeRules: [
      {
        flangeStandardId: "ASME-B16.5",
        flangeTypes: ["WELD_NECK", "BLIND"],
        ratingSystem: "ASME_CLASS",
        rating: "Class 150",
        materialId: "SYNTHETIC_MAT_CARBON_STEEL",
        sourceStatus: "VERIFIED",
      },
    ],
    valveRules: [
      {
        productStandardId: "API-600",
        dimensionalStandardId: "ASME-B16.10",
        valveTypes: ["GATE", "GLOBE", "CHECK"],
        connectionTypes: ["FLANGED"],
        materialId: "SYNTHETIC_MAT_CARBON_STEEL",
        sourceStatus: "VERIFIED",
      },
    ],
    sourceStatus: "VERIFIED",
    sourceReference: "SYNTHETIC_MASTER_SPEC_DOC",
  };

  const syntheticSpecEmptyRules: PipingSpecification = {
    id: "SYNTHETIC_SPEC_EMPTY_RULES",
    code: "SYNTH_EMPTY",
    name: "Synthetic Empty Rules Spec",
    materialReferenceIds: [],
    pipeRules: [],
    fittingRules: [],
    flangeRules: [],
    valveRules: [],
    sourceStatus: "UNVERIFIED",
  };

  const specLookup = (id: string): PipingSpecification | undefined => {
    if (id === "SYNTHETIC_SPEC_001") return syntheticSpec;
    if (id === "SYNTHETIC_SPEC_EMPTY_RULES") return syntheticSpecEmptyRules;
    return undefined;
  };

  const resolver = new PipingSpecResolver(specLookup, compatEngine);

  // =========================================================================
  // TEST 1 : Contexte valide + règle compatible -> COMPATIBLE
  // =========================================================================
  testsRun++;
  const res1 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "PIPE",
    nominalSize: "2",
    schedule: "SCH 40",
    dimensionalStandardId: "ASME-B36.10M",
    materialId: "SYNTHETIC_MAT_CARBON_STEEL",
  });
  assert(res1.status === "COMPATIBLE", `TEST 1: expected COMPATIBLE, got ${res1.status}`);
  assert(res1.matchedRuleIds.includes("SYNTHETIC_COMPAT_RULE_PIPE_OK"), "TEST 1: ruleId mismatch");
  results.push("✅ PASS: TEST 1 — Contexte valide + règle compatible → COMPATIBLE");

  // =========================================================================
  // TEST 2 : Contexte valide + règle incompatible -> INCOMPATIBLE
  // =========================================================================
  testsRun++;
  const res2 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "PIPE",
    nominalSize: "10",
    schedule: "SCH 160",
    dimensionalStandardId: "ASME-B36.10M",
    materialId: "SYNTHETIC_MAT_CARBON_STEEL",
  });
  assert(res2.status === "INCOMPATIBLE", `TEST 2: expected INCOMPATIBLE, got ${res2.status}`);
  results.push("✅ PASS: TEST 2 — Contexte valide + règle incompatible → INCOMPATIBLE");

  // =========================================================================
  // TEST 3 : Spécification inexistante -> INVALID
  // =========================================================================
  testsRun++;
  const res3 = resolver.resolve({
    specificationId: "NON_EXISTENT_SPEC_999",
    componentType: "PIPE",
  });
  assert(res3.status === "INVALID", `TEST 3: expected INVALID for missing spec, got ${res3.status}`);
  results.push("✅ PASS: TEST 3 — Spécification inexistante → INVALID");

  // =========================================================================
  // TEST 4 : Aucune règle correspondante -> UNVERIFIED
  // =========================================================================
  testsRun++;
  const res4 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_EMPTY_RULES",
    componentType: "SYNTHETIC_UNKNOWN_COMPONENT",
  });
  assert(res4.status === "UNVERIFIED", `TEST 4: expected UNVERIFIED for unmatched component, got ${res4.status}`);
  results.push("✅ PASS: TEST 4 — Aucune règle correspondante → UNVERIFIED");

  // =========================================================================
  // TEST 5 : Matériau autorisé par la spécification (poursuit la résolution)
  // =========================================================================
  testsRun++;
  const res5 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "PIPE",
    nominalSize: "2",
    schedule: "SCH 40",
    dimensionalStandardId: "ASME-B36.10M",
    materialId: "SYNTHETIC_MAT_CARBON_STEEL",
  });
  assert(res5.status === "COMPATIBLE", `TEST 5: authorized material must resolve successfully, got ${res5.status}`);
  results.push("✅ PASS: TEST 5 — Matériau autorisé par la spécification validé");

  // =========================================================================
  // TEST 6 : Matériau absent de la spécification -> INCOMPATIBLE
  // =========================================================================
  testsRun++;
  const res6 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "PIPE",
    materialId: "SYNTHETIC_UNAUTHORIZED_TITANIUM",
  });
  assert(res6.status === "INCOMPATIBLE", `TEST 6: expected INCOMPATIBLE for unauthorized material, got ${res6.status}`);
  results.push("✅ PASS: TEST 6 — Matériau absent de la spécification → INCOMPATIBLE");

  // =========================================================================
  // TEST 7 : Règle Fitting applicable
  // =========================================================================
  testsRun++;
  const res7 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "FITTING",
    productStandardId: "ASME-B16.9",
    fittingType: "ELBOW",
    connectionType: "BUTT_WELD",
  });
  assert(res7.status === "COMPATIBLE", `TEST 7: expected COMPATIBLE for valid fitting, got ${res7.status}`);
  results.push("✅ PASS: TEST 7 — Fitting rule applicable validée");

  // =========================================================================
  // TEST 8 : Règle Flange applicable
  // =========================================================================
  testsRun++;
  const res8 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "FLANGE",
    productStandardId: "ASME-B16.5",
    ratingSystem: "ASME_CLASS",
    ratingValue: "Class 150",
  });
  assert(res8.status === "COMPATIBLE", `TEST 8: expected COMPATIBLE for valid flange, got ${res8.status}`);
  results.push("✅ PASS: TEST 8 — Flange rule applicable validée");

  // =========================================================================
  // TEST 9 : Règle Valve applicable
  // =========================================================================
  testsRun++;
  const res9 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "VALVE",
    productStandardId: "API-600",
    dimensionalStandardId: "ASME-B16.10",
    connectionType: "FLANGED",
  });
  assert(res9.status === "COMPATIBLE", `TEST 9: expected COMPATIBLE for valid valve, got ${res9.status}`);
  results.push("✅ PASS: TEST 9 — Valve rule applicable validée");

  // =========================================================================
  // TEST 10 : Règle Pipe applicable
  // =========================================================================
  testsRun++;
  const res10 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "PIPE",
    dimensionalStandardId: "ASME-B36.10M",
    nominalSize: "2",
    schedule: "SCH 40",
  });
  assert(res10.status === "COMPATIBLE", `TEST 10: expected COMPATIBLE for valid pipe, got ${res10.status}`);
  results.push("✅ PASS: TEST 10 — Pipe rule applicable validée");

  // =========================================================================
  // TEST 11 : Nominal size non couvert par la spec -> INCOMPATIBLE
  // =========================================================================
  testsRun++;
  const res11 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "PIPE",
    nominalSize: "48", // Pas dans ["2", "3", "4", "6", "8", "10"]
    dimensionalStandardId: "ASME-B36.10M",
  });
  assert(res11.status === "INCOMPATIBLE", `TEST 11: expected INCOMPATIBLE for unsupported size, got ${res11.status}`);
  results.push("✅ PASS: TEST 11 — Nominal size non couvert par la spécification → INCOMPATIBLE");

  // =========================================================================
  // TEST 12 : Schedule manquant ou absent de la règle -> UNVERIFIED / INCOMPATIBLE
  // =========================================================================
  testsRun++;
  const res12 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "PIPE",
    schedule: "SCH 10", // Spécifié SCH 40 dans spec
    dimensionalStandardId: "ASME-B36.10M",
  });
  assert(res12.status === "INCOMPATIBLE", `TEST 12: expected INCOMPATIBLE for mismatch schedule, got ${res12.status}`);
  results.push("✅ PASS: TEST 12 — Schedule non autorisé dans la spécification → INCOMPATIBLE");

  // =========================================================================
  // TEST 13 : Connection type mismatch -> INCOMPATIBLE
  // =========================================================================
  testsRun++;
  const res13 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "FITTING",
    productStandardId: "ASME-B16.9",
    connectionType: "SOCKET_WELD", // Seul BUTT_WELD est autorisé
  });
  assert(res13.status === "INCOMPATIBLE", `TEST 13: expected INCOMPATIBLE for connection mismatch, got ${res13.status}`);
  results.push("✅ PASS: TEST 13 — Connection type mismatch → INCOMPATIBLE");

  // =========================================================================
  // TEST 14 : Product standard mismatch -> INCOMPATIBLE
  // =========================================================================
  testsRun++;
  const res14 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "FITTING",
    productStandardId: "ASME-B16.11", // Spec a ASME-B16.9
  });
  assert(res14.status === "INCOMPATIBLE", `TEST 14: expected INCOMPATIBLE for product standard mismatch, got ${res14.status}`);
  results.push("✅ PASS: TEST 14 — Product standard mismatch → INCOMPATIBLE");

  // =========================================================================
  // TEST 15 : Dimensional standard mismatch -> INCOMPATIBLE
  // =========================================================================
  testsRun++;
  const res15 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "PIPE",
    dimensionalStandardId: "ASME-B36.19M", // Spec a ASME-B36.10M
  });
  assert(res15.status === "INCOMPATIBLE", `TEST 15: expected INCOMPATIBLE for dimensional std mismatch, got ${res15.status}`);
  results.push("✅ PASS: TEST 15 — Dimensional standard mismatch → INCOMPATIBLE");

  // =========================================================================
  // TEST 16 : Rating system mismatch -> INCOMPATIBLE
  // =========================================================================
  testsRun++;
  const res16 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "FLANGE",
    productStandardId: "ASME-B16.5",
    ratingSystem: "EN_PN", // Spec a ASME_CLASS
  });
  assert(res16.status === "INCOMPATIBLE", `TEST 16: expected INCOMPATIBLE for rating system mismatch, got ${res16.status}`);
  results.push("✅ PASS: TEST 16 — Rating system mismatch → INCOMPATIBLE");

  // =========================================================================
  // TEST 17 : Evidence VERIFIED correctement résolue -> COMPATIBLE
  // =========================================================================
  testsRun++;
  const res17 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "PIPE",
    nominalSize: "2",
    schedule: "SCH 40",
    dimensionalStandardId: "ASME-B36.10M",
    materialId: "SYNTHETIC_MAT_CARBON_STEEL",
    evidenceIds: ["SYNTHETIC_EV_SPEC01_VERIFIED_01"],
  });
  assert(res17.status === "COMPATIBLE", `TEST 17: expected COMPATIBLE with verified evidence, got ${res17.status}`);
  results.push("✅ PASS: TEST 17 — Evidence VERIFIED correctement résolue → COMPATIBLE");

  // =========================================================================
  // TEST 18 : Evidence UNVERIFIED -> UNVERIFIED
  // =========================================================================
  testsRun++;
  const res18 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "SYNTHETIC_SPECIAL",
    evidenceIds: ["SYNTHETIC_EV_SPEC01_UNVERIFIED_01"],
  });
  assert(res18.status === "UNVERIFIED", `TEST 18: expected UNVERIFIED for unverified evidence, got ${res18.status}`);
  results.push("✅ PASS: TEST 18 — Evidence UNVERIFIED → UNVERIFIED");

  // =========================================================================
  // TEST 19 : Evidence inexistante -> UNVERIFIED
  // =========================================================================
  testsRun++;
  const res19 = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "SYNTHETIC_MISSING",
    evidenceIds: ["NON_EXISTENT_EV_999"],
  });
  assert(res19.status === "UNVERIFIED", `TEST 19: expected UNVERIFIED for missing evidence, got ${res19.status}`);
  results.push("✅ PASS: TEST 19 — Evidence inexistante → UNVERIFIED");

  // =========================================================================
  // TEST 20 : Aucune conversion implicite (NPS != DN, Class != PN)
  // =========================================================================
  testsRun++;
  // 20.a : "NPS 2" ne doit JAMAIS correspondre automatiquement à "DN 50"
  const res20a = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "SYNTHETIC_EXACT",
    nominalSize: "DN 50", // Règle exige "NPS 2"
    ratingValue: "Class 150",
  });
  assert(res20a.status === "UNVERIFIED", `TEST 20a: expected UNVERIFIED without implicit conversion, got ${res20a.status}`);

  // 20.b : "Class 150" ne doit JAMAIS correspondre automatiquement à "PN 20"
  const res20b = resolver.resolve({
    specificationId: "SYNTHETIC_SPEC_001",
    componentType: "SYNTHETIC_EXACT",
    nominalSize: "NPS 2",
    ratingValue: "PN 20", // Règle exige "Class 150"
  });
  assert(res20b.status === "UNVERIFIED", `TEST 20b: expected UNVERIFIED without implicit conversion, got ${res20b.status}`);
  results.push("✅ PASS: TEST 20 — Aucune conversion implicite (NPS != DN, Class != PN)");

  return {
    success: true,
    testsRun,
    results,
  };
}
