/**
 * PDI NORMATIVE ENGINE — EVIDENCE MODEL UNIT TESTS
 * Reference: MASTER-02 (Evidence Model Foundation)
 * 
 * Tests unitaires validant l'ensemble des 10 exigences strictes MASTER-02 :
 * 
 * - TEST 1 : Une "NormativeEvidence" structurellement valide peut être créée.
 * - TEST 2 : Une Evidence avec `verificationStatus: "UNVERIFIED"` reste "UNVERIFIED".
 * - TEST 3 : Une Evidence "VERIFIED" doit respecter les contraintes structurelles nécessaires (verifiedBy, verifiedAt obligatoires).
 * - TEST 4 : Une "NormativeQualification" sans evidence exploitable ne doit pas devenir "QUALIFIED".
 * - TEST 5 : Une qualification qui référence uniquement une Evidence "UNVERIFIED" ne doit pas devenir "QUALIFIED".
 * - TEST 6 : Une qualification qui référence les Evidence nécessaires et "VERIFIED" peut être "QUALIFIED".
 * - TEST 7 : Un identifiant `MAT_CS_123` ne doit jamais être considéré comme une Evidence.
 * - TEST 8 : Le cas F01 actuel insuffisamment documenté doit rester "UNVERIFIED" et ne doit pas devenir automatiquement "CALCULATED".
 * - TEST 9 : Une fonctionnalité F01 actuellement "CALCULATED" ne doit pas être cassée uniquement parce que le nouveau modèle d'Evidence existe.
 * - TEST 10: Une fonctionnalité actuellement "UNVERIFIED" ne doit pas devenir "CALCULATED" simplement parce que les nouveaux types ont été ajoutés.
 * 
 * Tests complémentaires :
 * - Contrat NormativeEdition et validation.
 * - Contrat NormativeVerifiedValue<T>.
 * - Rejet des tokens heuristiques (_CS_, CS_, CRMO, CR_MO, etc.) comme preuves.
 */

import type {
  NormativeEvidence,
  NormativeEdition,
  NormativeQualification,
  NormativeVerifiedValue,
} from "../types/normativeEvidenceTypes";
import {
  validateNormativeEvidence,
  validateNormativeEdition,
  validateNormativeQualification,
  validateNormativeVerifiedValue,
  isDisallowedTokenHeuristic,
} from "../validators/normativeEvidenceValidator";
import { executeEngineeringCalculation } from "../engine/designCodeEngine";
import type { EngineeringCalculationInput } from "../types/designCodeTypes";

export function runNormativeEvidenceTests(): {
  success: boolean;
  testsRun: number;
  results: string[];
} {
  const results: string[] = [];
  let success = true;
  let testsRun = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    testsRun++;
    if (!condition) {
      success = false;
      const msg = `❌ FAIL: ${testName}${detail ? ` (${detail})` : ""}`;
      results.push(msg);
      throw new Error(msg);
    } else {
      results.push(`✅ PASS: ${testName}`);
    }
  }

  // =========================================================================
  // TEST 1 : Une "NormativeEvidence" structurellement valide peut être créée
  // =========================================================================
  const validVerifiedEvidence: NormativeEvidence = {
    evidenceId: "EVID_ASME_B31_3_2024_T302_3_5_1_W02",
    standardId: "ASME-B31.3",
    editionId: "ED_ASME_B31_3_2024",
    clauseReference: "Table 302.3.5-1, Item W-02",
    sourceType: "LICENSED_STANDARD",
    sourceReference: "ASME B31.3-2024 Section 302.3.5",
    verificationStatus: "VERIFIED",
    verifiedBy: "Senior Piping Engineering Reviewer #42",
    verifiedAt: "2026-09-21T10:00:00.000Z",
    checksum: "sha256-abcdef1234567890",
    notes: "Verified against authentic ASME licensed text.",
  };
  const val1 = validateNormativeEvidence(validVerifiedEvidence);
  assert(
    val1.valid === true && val1.errors.length === 0,
    "TEST 1 — Une NormativeEvidence structurellement valide peut être créée et validée"
  );

  // =========================================================================
  // TEST 2 : Une Evidence verificationStatus: "UNVERIFIED" reste "UNVERIFIED"
  // =========================================================================
  const unverifiedEvidence: NormativeEvidence = {
    evidenceId: "EVID_UNVERIFIED_DRAFT_001",
    standardId: "ASME-B31.3",
    editionId: "ED_DRAFT_2026",
    clauseReference: "Pending Clause 304.1",
    sourceType: "MANUFACTURER_DATA",
    sourceReference: "Vendor Catalog Preliminary",
    verificationStatus: "UNVERIFIED",
  };
  const val2 = validateNormativeEvidence(unverifiedEvidence);
  assert(
    val2.valid === true && unverifiedEvidence.verificationStatus === "UNVERIFIED",
    "TEST 2 — Une Evidence verificationStatus: 'UNVERIFIED' reste 'UNVERIFIED' et valide structurellement"
  );

  // =========================================================================
  // TEST 3 : Une Evidence "VERIFIED" doit respecter les contraintes structurelles (verifiedBy & verifiedAt)
  // =========================================================================
  const invalidVerifiedEvidenceMissingBy = {
    evidenceId: "EVID_BAD_001",
    standardId: "ASME-B31.3",
    editionId: "ED_ASME_2024",
    clauseReference: "Table 302.3.5-1",
    sourceType: "LICENSED_STANDARD",
    sourceReference: "ASME B31.3-2024",
    verificationStatus: "VERIFIED",
    // verifiedBy et verifiedAt absents
  };
  const val3a = validateNormativeEvidence(invalidVerifiedEvidenceMissingBy);
  assert(
    val3a.valid === false &&
      val3a.errors.some((e) => e.code === "VERIFIED_EVIDENCE_REQUIRES_VERIFIED_BY") &&
      val3a.errors.some((e) => e.code === "VERIFIED_EVIDENCE_REQUIRES_VERIFIED_AT"),
    "TEST 3 — Une Evidence 'VERIFIED' sans verifiedBy/verifiedAt est rejetée"
  );

  const invalidVerifiedEvidenceBadDate = {
    evidenceId: "EVID_BAD_002",
    standardId: "ASME-B31.3",
    editionId: "ED_ASME_2024",
    clauseReference: "Table 302.3.5-1",
    sourceType: "LICENSED_STANDARD",
    sourceReference: "ASME B31.3-2024",
    verificationStatus: "VERIFIED",
    verifiedBy: "Engineer",
    verifiedAt: "not-a-valid-date-string",
  };
  const val3b = validateNormativeEvidence(invalidVerifiedEvidenceBadDate);
  assert(
    val3b.valid === false &&
      val3b.errors.some((e) => e.code === "INVALID_VERIFIED_AT_DATE"),
    "TEST 3b — Une Evidence 'VERIFIED' avec date invalide est rejetée"
  );

  // =========================================================================
  // TEST 4 : Une "NormativeQualification" sans evidence exploitable ne doit pas devenir "QUALIFIED"
  // =========================================================================
  const qualificationWithoutEvidence: NormativeQualification = {
    qualificationId: "QUAL_W02_NO_EVID",
    subjectId: "BRANCH_W_02",
    ruleId: "ASME_B31_3_TABLE_302_3_5_1",
    status: "QUALIFIED",
    evidenceIds: [], // Liste vide
    reason: "Attempting to claim qualified status without evidence",
  };
  const val4 = validateNormativeQualification(qualificationWithoutEvidence);
  assert(
    val4.valid === false &&
      val4.errors.some((e) => e.code === "QUALIFIED_REQUIRES_EVIDENCE_IDS"),
    "TEST 4 — Une NormativeQualification sans evidenceIds ne peut pas être 'QUALIFIED'"
  );

  // =========================================================================
  // TEST 5 : Une qualification qui référence uniquement une Evidence "UNVERIFIED" ne doit pas devenir "QUALIFIED"
  // =========================================================================
  const evidenceStore = new Map<string, NormativeEvidence>([
    [validVerifiedEvidence.evidenceId, validVerifiedEvidence],
    [unverifiedEvidence.evidenceId, unverifiedEvidence],
  ]);

  const qualificationReferencingUnverified: NormativeQualification = {
    qualificationId: "QUAL_W02_UNVERIFIED_EVID",
    subjectId: "BRANCH_W_02",
    ruleId: "ASME_B31_3_TABLE_302_3_5_1",
    status: "QUALIFIED",
    evidenceIds: [unverifiedEvidence.evidenceId],
    reason: "Claiming qualified using unverified evidence",
  };
  const val5 = validateNormativeQualification(
    qualificationReferencingUnverified,
    (id) => evidenceStore.get(id)
  );
  assert(
    val5.valid === false &&
      val5.errors.some((e) => e.code === "QUALIFIED_EVIDENCE_UNVERIFIED"),
    "TEST 5 — Une qualification référençant une Evidence 'UNVERIFIED' ne peut pas être 'QUALIFIED'"
  );

  // =========================================================================
  // TEST 6 : Une qualification qui référence les Evidence nécessaires et "VERIFIED" peut être "QUALIFIED"
  // =========================================================================
  const qualificationFullyVerified: NormativeQualification = {
    qualificationId: "QUAL_W02_VERIFIED_EVID",
    subjectId: "BRANCH_W_02",
    ruleId: "ASME_B31_3_TABLE_302_3_5_1",
    status: "QUALIFIED",
    evidenceIds: [validVerifiedEvidence.evidenceId],
    reason: "Fully supported by licensed ASME B31.3 Table 302.3.5-1 verified evidence",
  };
  const val6 = validateNormativeQualification(
    qualificationFullyVerified,
    (id) => evidenceStore.get(id)
  );
  assert(
    val6.valid === true && val6.errors.length === 0,
    "TEST 6 — Une qualification référençant des Evidence 'VERIFIED' valides est admise comme 'QUALIFIED'"
  );

  // =========================================================================
  // TEST 7 : Un identifiant MAT_CS_123 ne doit jamais être considéré comme une Evidence
  // =========================================================================
  assert(
    isDisallowedTokenHeuristic("MAT_CS_123") === true &&
      isDisallowedTokenHeuristic("_CS_") === true &&
      isDisallowedTokenHeuristic("CS_") === true &&
      isDisallowedTokenHeuristic("CARBON_STEEL_") === true &&
      isDisallowedTokenHeuristic("CRMO") === true &&
      isDisallowedTokenHeuristic("CR_MO") === true &&
      isDisallowedTokenHeuristic("CRMO_P22") === true &&
      isDisallowedTokenHeuristic("AUSTENITIC") === true,
    "TEST 7a — Les motifs heuristiques de tokens sont formellement reconnus comme interdits"
  );

  const heuristicTokenEvidenceAttempt = {
    evidenceId: "MAT_CS_123", // Tentative d'utiliser un token heuristique comme evidenceId
    standardId: "ASME-B31.3",
    editionId: "ED_ASME_2024",
    clauseReference: "Clause 304.1",
    sourceType: "LICENSED_STANDARD",
    sourceReference: "ASME B31.3",
    verificationStatus: "VERIFIED",
    verifiedBy: "Inspector",
    verifiedAt: "2026-09-21T00:00:00Z",
  };
  const val7a = validateNormativeEvidence(heuristicTokenEvidenceAttempt);
  assert(
    val7a.valid === false &&
      val7a.errors.some((e) => e.code === "TOKEN_HEURISTIC_DISALLOWED"),
    "TEST 7b — MAT_CS_123 utilisé comme evidenceId est strictement rejeté"
  );

  const qualificationUsingHeuristicToken = {
    qualificationId: "QUAL_HEURISTIC_ATTEMPT",
    subjectId: "SUBJECT_01",
    ruleId: "RULE_01",
    status: "QUALIFIED",
    evidenceIds: ["MAT_CS_123"],
  };
  const val7b = validateNormativeQualification(qualificationUsingHeuristicToken);
  assert(
    val7b.valid === false &&
      val7b.errors.some(
        (e) => e.code === "DISALLOWED_TOKEN_HEURISTIC_USED_AS_EVIDENCE"
      ),
    "TEST 7c — MAT_CS_123 utilisé comme élément dans evidenceIds est strictement rejeté"
  );

  // =========================================================================
  // TEST 8 : Le cas F01 actuel insuffisamment documenté doit rester UNVERIFIED
  // =========================================================================
  const f01Baseline: EngineeringCalculationInput = {
    designCodeId: "ASME-B31.3",
    standardEdition: { year: "2024" },
    calculationType: "PRESSURE_WALL_THICKNESS",
    unitSystem: "SI",
    pressure: 2.0, // MPa
    temperature: 100, // °C
    outsideDiameterMm: 114.3, // mm
    corrosionAllowanceMm: 1.5,
    diameterBasis: "OUTSIDE",
    componentType: "SEAMLESS",
    materialId: "MAT_CS_ASTM_A106_B",
    allowableStressInput: {
      value: 138.0,
      unit: "MPa",
      temperature: 100,
      materialReference: "ASTM A106 Grade B",
      qualificationStatus: "VERIFIED",
      sourceReference: "ASME B31.3-2024 Table A-1",
    },
    qualityFactorInput: {
      factorValue: 1.0,
      productSpecification: "ASTM A106 Seamless",
      qualificationStatus: "VERIFIED",
      sourceReference: "ASME B31.3-2024 Table 302.3.4",
    },
    weldReductionFactorInput: {
      factorValue: 1.0,
      branchId: "W-01",
      componentType: "SEAMLESS",
      qualificationStatus: "VERIFIED",
      sourceReference: "ASME B31.3-2024 para. 302.3.5(e)",
    },
    yCoefficientInput: {
      factorValue: 0.4,
      materialFamily: "FERRITIC",
      temperature: 100,
      qualificationStatus: "VERIFIED",
      sourceReference: "ASME B31.3 Table 304.1.1",
    },
  };

  // Sans température ou avec W non documenté (W-05 sans données suffisantes), le résultat reste UNVERIFIED
  const rF01_Undocumented = executeEngineeringCalculation({
    ...f01Baseline,
    componentType: "WELDED",
    weldReductionFactorInput: {
      factorValue: 1.0,
      branchId: "W-05", // W-05 non documenté
      sourceReference: "Preliminary note",
    },
  });
  assert(
    rF01_Undocumented.status === "UNVERIFIED",
    "TEST 8 — Le cas F01 insuffisamment documenté reste strictement UNVERIFIED"
  );

  // =========================================================================
  // TEST 9 : Une fonctionnalité F01 actuellement "CALCULATED" ne doit pas être cassée
  // =========================================================================
  const rF01_SeamlessCalculated = executeEngineeringCalculation(f01Baseline);
  assert(
    rF01_SeamlessCalculated.status === "CALCULATED" &&
      rF01_SeamlessCalculated.value !== undefined &&
      rF01_SeamlessCalculated.value > 0,
    "TEST 9 — Le calcul F01 qualifié (SEAMLESS W-01) produit toujours CALCULATED"
  );

  // =========================================================================
  // TEST 10 : Une fonctionnalité actuellement "UNVERIFIED" ne doit pas devenir "CALCULATED"
  // =========================================================================
  const rF01_W06_Unverified = executeEngineeringCalculation({
    ...f01Baseline,
    componentType: "WELDED",
    temperature: 100,
    weldReductionFactorInput: {
      factorValue: 1.0,
      branchId: "W-06",
      componentType: "WELDED",
      materialGroup: "CRMO",
      temperature: 100,
      sourceReference: "ASME B31.3 Table 302.3.5-1 W-06",
      qualificationStatus: "VERIFIED",
    },
  });
  assert(
    rF01_W06_Unverified.status === "UNVERIFIED" &&
      rF01_W06_Unverified.resolvedFactors?.W?.valueVerified === false,
    "TEST 10 — La branche W-06 non formellement qualifiée par NORM-06 reste strictement UNVERIFIED"
  );

  // =========================================================================
  // TESTS SUPPLÉMENTAIRES : NormativeEdition & NormativeVerifiedValue
  // =========================================================================
  const validEdition: NormativeEdition = {
    id: "ED_ASME_B31_3_2024",
    standardId: "ASME-B31.3",
    year: 2024,
    status: "CURRENT",
    sourceReference: "ASME B31.3-2024 Process Piping Official Standard",
    verificationStatus: "VERIFIED",
  };
  const valEdition = validateNormativeEdition(validEdition);
  assert(
    valEdition.valid === true,
    "TEST EXTRA 1 — NormativeEdition valide est confirmée"
  );

  const invalidEditionBadYear = {
    id: "ED_BAD",
    standardId: "ASME-B31.3",
    year: 1750, // Année hors domaine
    status: "CURRENT",
    sourceReference: "Ref",
    verificationStatus: "VERIFIED",
  };
  const valEditionBad = validateNormativeEdition(invalidEditionBadYear);
  assert(
    valEditionBad.valid === false &&
      valEditionBad.errors.some((e) => e.code === "INVALID_YEAR"),
    "TEST EXTRA 2 — NormativeEdition avec année invalide est rejetée"
  );

  const verifiedValueContract: NormativeVerifiedValue<number> = {
    value: 138,
    verificationStatus: "VERIFIED",
    evidenceIds: [validVerifiedEvidence.evidenceId],
    sourceReference: "ASME B31.3 Table A-1",
  };
  assert(
    validateNormativeVerifiedValue(verifiedValueContract, (v) => typeof v === "number" && v > 0),
    "TEST EXTRA 3 — NormativeVerifiedValue<T> validée"
  );

  const unverifiedValueWithoutEvidence: NormativeVerifiedValue<number> = {
    value: 138,
    verificationStatus: "VERIFIED",
    evidenceIds: [], // Invalide : VERIFIED sans evidenceIds
  };
  assert(
    validateNormativeVerifiedValue(unverifiedValueWithoutEvidence) === false,
    "TEST EXTRA 4 — NormativeVerifiedValue déclarée 'VERIFIED' sans evidenceIds est rejetée"
  );

  return { success, testsRun, results };
}
