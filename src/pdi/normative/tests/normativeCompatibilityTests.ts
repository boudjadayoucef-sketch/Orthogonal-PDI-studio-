/**
 * PDI NORMATIVE ENGINE — NORMATIVE COMPATIBILITY MATRIX TESTS
 * Reference: NORM-13 (Normative Compatibility Matrix)
 * 
 * Suite de tests unitaires et d'intégration validant les 20 exigences de NORM-13.
 * DONNÉES STRICTEMENT SYNTHÉTIQUES (aucun standard réel préchargé).
 */

import { NormativeCompatibilityRegistry } from "../registry/normativeCompatibilityRegistry";
import { NormativeCompatibilityEngine } from "../engine/normativeCompatibilityEngine";
import { NormativeEvidenceRegistry } from "../registry/normativeEvidenceRegistry";
import { NormativeEvidenceResolver } from "../registry/normativeEvidenceResolver";
import { validateNormativeCompatibilityRule } from "../validators/normativeCompatibilityValidator";
import type {
  NormativeCompatibilityRule,
  NormativeCompatibilityContext,
} from "../types/normativeCompatibilityTypes";
import type { NormativeEvidence } from "../types/normativeEvidenceTypes";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`NORM-13 TEST FAILED: ${message}`);
  }
}

export function runNormativeCompatibilityTests(): {
  success: boolean;
  testsRun: number;
  results: string[];
} {
  const results: string[] = [];
  let testsRun = 0;

  // Helper pour créer un Evidence Registry & Resolver avec des preuves synthétiques
  const evidenceRegistry = new NormativeEvidenceRegistry();

  const evVerified1: NormativeEvidence = {
    evidenceId: "SYNTHETIC_EV_NORM13_VERIFIED_01",
    standardId: "SYNTHETIC_STANDARD_NORM13" as any,
    editionId: "SYNTHETIC_EDITION_2026",
    clauseReference: "CLAUSE_4.1",
    sourceType: "VERIFIED_INTERNAL_REFERENCE",
    sourceReference: "SYNTHETIC_DOC_REF_01",
    verificationStatus: "VERIFIED",
    verifiedBy: "SYSTEM_VALIDATOR",
    verifiedAt: "2026-01-01T00:00:00.000Z",
  };

  const evVerified2: NormativeEvidence = {
    evidenceId: "SYNTHETIC_EV_NORM13_VERIFIED_02",
    standardId: "SYNTHETIC_STANDARD_NORM13" as any,
    editionId: "SYNTHETIC_EDITION_2026",
    clauseReference: "CLAUSE_4.2",
    sourceType: "VERIFIED_INTERNAL_REFERENCE",
    sourceReference: "SYNTHETIC_DOC_REF_02",
    verificationStatus: "VERIFIED",
    verifiedBy: "SYSTEM_VALIDATOR",
    verifiedAt: "2026-01-01T00:00:00.000Z",
  };

  const evUnverified: NormativeEvidence = {
    evidenceId: "SYNTHETIC_EV_NORM13_UNVERIFIED_01",
    standardId: "SYNTHETIC_STANDARD_NORM13" as any,
    editionId: "SYNTHETIC_EDITION_2026",
    clauseReference: "CLAUSE_UNVERIFIED",
    sourceType: "LEGACY_REFERENCE",
    sourceReference: "SYNTHETIC_UNVERIFIED_REF",
    verificationStatus: "UNVERIFIED",
  };

  evidenceRegistry.register(evVerified1);
  evidenceRegistry.register(evVerified2);
  evidenceRegistry.register(evUnverified);

  const evidenceResolver = new NormativeEvidenceResolver(evidenceRegistry);

  // =========================================================================
  // TEST 1 : Registry vide au démarrage
  // =========================================================================
  testsRun++;
  const reg1 = new NormativeCompatibilityRegistry();
  assert(reg1.count() === 0, "TEST 1: registry count must be 0 initially");
  assert(reg1.list().length === 0, "TEST 1: registry list must be empty initially");
  results.push("✅ PASS: TEST 1 — Registry vide au démarrage");

  // =========================================================================
  // TEST 2 : Insertion d'une règle synthétique valide
  // =========================================================================
  testsRun++;
  const validRule: NormativeCompatibilityRule = {
    ruleId: "SYNTHETIC_RULE_001",
    description: "Synthetic pipe to flange compatibility",
    standardId: "SYNTHETIC_STANDARD_NORM13",
    componentType: "SYNTHETIC_PIPE",
    connectionType: "SYNTHETIC_BUTT_WELD",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_NORM13_VERIFIED_01"],
  };
  const reg2Res = reg1.register(validRule);
  assert(reg2Res.success === true, "TEST 2: valid rule registration must succeed");
  assert(reg1.has("SYNTHETIC_RULE_001"), "TEST 2: registry must have registered rule");
  assert(reg1.get("SYNTHETIC_RULE_001")?.ruleId === "SYNTHETIC_RULE_001", "TEST 2: get must return rule");
  assert(reg1.count() === 1, "TEST 2: count must be 1");
  results.push("✅ PASS: TEST 2 — Insertion d'une règle synthétique valide");

  // =========================================================================
  // TEST 3 : Duplicate ruleId rejeté
  // =========================================================================
  testsRun++;
  const dupRes = reg1.register(validRule);
  assert(dupRes.success === false, "TEST 3: duplicate rule registration must fail");
  assert(reg1.count() === 1, "TEST 3: count must remain 1 after duplicate attempt");
  results.push("✅ PASS: TEST 3 — Duplicate ruleId rejeté");

  // =========================================================================
  // TEST 4 : Objet invalide rejeté
  // =========================================================================
  testsRun++;
  assert(validateNormativeCompatibilityRule(null).valid === false, "TEST 4: null rejected");
  assert(validateNormativeCompatibilityRule(123).valid === false, "TEST 4: number rejected");
  assert(validateNormativeCompatibilityRule({}).valid === false, "TEST 4: empty object rejected");
  assert(
    validateNormativeCompatibilityRule({ ruleId: "", description: "test", status: "COMPATIBLE" }).valid === false,
    "TEST 4: empty ruleId rejected"
  );
  assert(
    validateNormativeCompatibilityRule({ ruleId: "R1", description: "", status: "COMPATIBLE" }).valid === false,
    "TEST 4: empty description rejected"
  );
  assert(
    validateNormativeCompatibilityRule({ ruleId: "R1", description: "test", status: "INVALID_STATUS_XYZ" }).valid === false,
    "TEST 4: invalid status rejected"
  );
  assert(
    validateNormativeCompatibilityRule({ ruleId: "R1", description: "test", status: "COMPATIBLE", evidenceIds: [""] }).valid === false,
    "TEST 4: empty string in evidenceIds rejected"
  );
  results.push("✅ PASS: TEST 4 — Objet invalide rejeté");

  // =========================================================================
  // TEST 5 : COMPATIBLE avec evidence VERIFIED -> COMPATIBLE
  // =========================================================================
  testsRun++;
  const regEngineTest = new NormativeCompatibilityRegistry();
  regEngineTest.register({
    ruleId: "SYNTHETIC_RULE_COMPAT_VERIFIED",
    description: "Fully verified compatibility",
    standardId: "SYNTHETIC_STANDARD_NORM13",
    componentType: "SYNTHETIC_PIPE",
    nominalSize: "SYNTHETIC_SIZE_01",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_NORM13_VERIFIED_01"],
  });
  const engine = new NormativeCompatibilityEngine(regEngineTest, evidenceResolver);
  const res5 = engine.evaluate({
    standardId: "SYNTHETIC_STANDARD_NORM13",
    componentType: "SYNTHETIC_PIPE",
    nominalSize: "SYNTHETIC_SIZE_01",
  });
  assert(res5.status === "COMPATIBLE", `TEST 5: expected COMPATIBLE, got ${res5.status}`);
  assert(res5.ruleId === "SYNTHETIC_RULE_COMPAT_VERIFIED", "TEST 5: ruleId must match");
  results.push("✅ PASS: TEST 5 — COMPATIBLE avec evidence VERIFIED → COMPATIBLE");

  // =========================================================================
  // TEST 6 : COMPATIBLE sans evidence -> UNVERIFIED
  // =========================================================================
  testsRun++;
  const regNoEv = new NormativeCompatibilityRegistry();
  regNoEv.register({
    ruleId: "SYNTHETIC_RULE_NO_EVIDENCE",
    description: "Rule claiming compatibility without evidence",
    standardId: "SYNTHETIC_STANDARD_NORM13",
    componentType: "SYNTHETIC_PIPE",
    status: "COMPATIBLE",
    // evidenceIds missing
  });
  const engineNoEv = new NormativeCompatibilityEngine(regNoEv, evidenceResolver);
  const res6 = engineNoEv.evaluate({
    standardId: "SYNTHETIC_STANDARD_NORM13",
    componentType: "SYNTHETIC_PIPE",
  });
  assert(res6.status === "UNVERIFIED", `TEST 6: expected UNVERIFIED, got ${res6.status}`);
  results.push("✅ PASS: TEST 6 — COMPATIBLE sans evidence → UNVERIFIED");

  // =========================================================================
  // TEST 7 : COMPATIBLE avec evidence UNVERIFIED -> UNVERIFIED
  // =========================================================================
  testsRun++;
  const regUnverifiedEv = new NormativeCompatibilityRegistry();
  regUnverifiedEv.register({
    ruleId: "SYNTHETIC_RULE_UNVERIFIED_EV",
    description: "Rule with unverified evidence",
    standardId: "SYNTHETIC_STANDARD_NORM13",
    componentType: "SYNTHETIC_PIPE",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_NORM13_UNVERIFIED_01"],
  });
  const engineUnverifiedEv = new NormativeCompatibilityEngine(regUnverifiedEv, evidenceResolver);
  const res7 = engineUnverifiedEv.evaluate({
    standardId: "SYNTHETIC_STANDARD_NORM13",
    componentType: "SYNTHETIC_PIPE",
  });
  assert(res7.status === "UNVERIFIED", `TEST 7: expected UNVERIFIED, got ${res7.status}`);
  results.push("✅ PASS: TEST 7 — COMPATIBLE avec evidence UNVERIFIED → UNVERIFIED");

  // =========================================================================
  // TEST 8 : Evidence inexistante -> UNVERIFIED
  // =========================================================================
  testsRun++;
  const regMissingEv = new NormativeCompatibilityRegistry();
  regMissingEv.register({
    ruleId: "SYNTHETIC_RULE_MISSING_EV",
    description: "Rule referencing non-existent evidence",
    standardId: "SYNTHETIC_STANDARD_NORM13",
    componentType: "SYNTHETIC_PIPE",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_DOES_NOT_EXIST"],
  });
  const engineMissingEv = new NormativeCompatibilityEngine(regMissingEv, evidenceResolver);
  const res8 = engineMissingEv.evaluate({
    standardId: "SYNTHETIC_STANDARD_NORM13",
    componentType: "SYNTHETIC_PIPE",
  });
  assert(res8.status === "UNVERIFIED", `TEST 8: expected UNVERIFIED, got ${res8.status}`);
  results.push("✅ PASS: TEST 8 — Evidence inexistante → UNVERIFIED");

  // =========================================================================
  // TEST 9 : Règle INCOMPATIBLE avec evidence VERIFIED -> INCOMPATIBLE
  // =========================================================================
  testsRun++;
  const regIncompat = new NormativeCompatibilityRegistry();
  regIncompat.register({
    ruleId: "SYNTHETIC_RULE_INCOMPAT_VERIFIED",
    description: "Verified incompatibility between components",
    standardId: "SYNTHETIC_STANDARD_NORM13",
    componentType: "SYNTHETIC_PIPE",
    materialId: "SYNTHETIC_MAT_INCOMPATIBLE",
    status: "INCOMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_NORM13_VERIFIED_01"],
  });
  const engineIncompat = new NormativeCompatibilityEngine(regIncompat, evidenceResolver);
  const res9 = engineIncompat.evaluate({
    standardId: "SYNTHETIC_STANDARD_NORM13",
    componentType: "SYNTHETIC_PIPE",
    materialId: "SYNTHETIC_MAT_INCOMPATIBLE",
  });
  assert(res9.status === "INCOMPATIBLE", `TEST 9: expected INCOMPATIBLE, got ${res9.status}`);
  assert(res9.ruleId === "SYNTHETIC_RULE_INCOMPAT_VERIFIED", "TEST 9: ruleId must match");
  results.push("✅ PASS: TEST 9 — Règle INCOMPATIBLE avec evidence VERIFIED → INCOMPATIBLE");

  // =========================================================================
  // TEST 10 : Aucune règle -> UNVERIFIED (l'absence de règle n'est PAS INCOMPATIBLE)
  // =========================================================================
  testsRun++;
  const emptyEngine = new NormativeCompatibilityEngine(new NormativeCompatibilityRegistry(), evidenceResolver);
  const res10 = emptyEngine.evaluate({
    standardId: "SYNTHETIC_STANDARD_UNKNOWN",
    componentType: "SYNTHETIC_VALVE",
  });
  assert(res10.status === "UNVERIFIED", `TEST 10: expected UNVERIFIED on no matching rule, got ${res10.status}`);
  results.push("✅ PASS: TEST 10 — Aucune règle → UNVERIFIED");

  // =========================================================================
  // TEST 11 : Matching exact de plusieurs dimensions
  // =========================================================================
  testsRun++;
  const multiDimReg = new NormativeCompatibilityRegistry();
  multiDimReg.register({
    ruleId: "SYNTHETIC_RULE_MULTI_DIM",
    description: "Multi-dimensional matching rule",
    standardId: "SYNTHETIC_STANDARD_NORM13",
    editionId: "SYNTHETIC_EDITION_2026",
    componentType: "SYNTHETIC_PIPE",
    connectionType: "SYNTHETIC_BUTT_WELD",
    nominalSize: "SYNTHETIC_SIZE_100",
    schedule: "SYNTHETIC_SCH_40",
    pressureRating: "SYNTHETIC_CLASS_300",
    materialId: "SYNTHETIC_MAT_A",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_NORM13_VERIFIED_01"],
  });
  const multiEngine = new NormativeCompatibilityEngine(multiDimReg, evidenceResolver);
  const res11 = multiEngine.evaluate({
    standardId: "SYNTHETIC_STANDARD_NORM13",
    editionId: "SYNTHETIC_EDITION_2026",
    componentType: "SYNTHETIC_PIPE",
    connectionType: "SYNTHETIC_BUTT_WELD",
    nominalSize: "SYNTHETIC_SIZE_100",
    schedule: "SYNTHETIC_SCH_40",
    pressureRating: "SYNTHETIC_CLASS_300",
    materialId: "SYNTHETIC_MAT_A",
  });
  assert(res11.status === "COMPATIBLE", `TEST 11: expected COMPATIBLE, got ${res11.status}`);
  results.push("✅ PASS: TEST 11 — Matching exact de plusieurs dimensions");

  // =========================================================================
  // TEST 12 : Une différence sur une dimension explicitement définie empêche le match
  // =========================================================================
  testsRun++;
  const res12 = multiEngine.evaluate({
    standardId: "SYNTHETIC_STANDARD_NORM13",
    editionId: "SYNTHETIC_EDITION_2026",
    componentType: "SYNTHETIC_PIPE",
    connectionType: "SYNTHETIC_BUTT_WELD",
    nominalSize: "SYNTHETIC_SIZE_100",
    schedule: "SYNTHETIC_SCH_80", // DIFFÈRE DE SCH_40
    pressureRating: "SYNTHETIC_CLASS_300",
    materialId: "SYNTHETIC_MAT_A",
  });
  assert(res12.status === "UNVERIFIED", `TEST 12: dimension mismatch must result in UNVERIFIED, got ${res12.status}`);
  results.push("✅ PASS: TEST 12 — Différence sur une dimension définie empêche le match");

  // =========================================================================
  // TEST 13 : Absence de dimension dans le contexte ne doit pas être transformée en incompatibilité
  // =========================================================================
  testsRun++;
  const res13 = multiEngine.evaluate({
    standardId: "SYNTHETIC_STANDARD_NORM13",
    componentType: "SYNTHETIC_PIPE",
    // Missing other dimensions defined by rule
  });
  assert(res13.status === "UNVERIFIED", `TEST 13: expected UNVERIFIED (never INCOMPATIBLE for missing data), got ${res13.status}`);
  results.push("✅ PASS: TEST 13 — Absence de dimension dans le contexte → UNVERIFIED (pas d'incompatibilité)");

  // =========================================================================
  // TEST 14 : Aucune conversion NPS / DN
  // =========================================================================
  testsRun++;
  const npsDnReg = new NormativeCompatibilityRegistry();
  npsDnReg.register({
    ruleId: "SYNTHETIC_RULE_DN",
    description: "DN rule",
    nominalSize: "DN 50",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_NORM13_VERIFIED_01"],
  });
  const npsDnEngine = new NormativeCompatibilityEngine(npsDnReg, evidenceResolver);
  const res14 = npsDnEngine.evaluate({
    nominalSize: "NPS 2", // Ne doit JAMAIS matcher implicitement "DN 50"
  });
  assert(res14.status === "UNVERIFIED", `TEST 14: NPS must not match DN automatically, got ${res14.status}`);
  results.push("✅ PASS: TEST 14 — Aucune conversion NPS/DN implicite");

  // =========================================================================
  // TEST 15 : Aucune conversion Class / PN
  // =========================================================================
  testsRun++;
  const classPnReg = new NormativeCompatibilityRegistry();
  classPnReg.register({
    ruleId: "SYNTHETIC_RULE_CLASS",
    description: "Class rule",
    pressureRating: "Class 150",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_NORM13_VERIFIED_01"],
  });
  const classPnEngine = new NormativeCompatibilityEngine(classPnReg, evidenceResolver);
  const res15 = classPnEngine.evaluate({
    pressureRating: "PN 20", // Ne doit JAMAIS matcher implicitement "Class 150"
  });
  assert(res15.status === "UNVERIFIED", `TEST 15: PN must not match Class automatically, got ${res15.status}`);
  results.push("✅ PASS: TEST 15 — Aucune conversion Class/PN implicite");

  // =========================================================================
  // TEST 16 : Aucun fuzzy matching
  // =========================================================================
  testsRun++;
  const fuzzyReg = new NormativeCompatibilityRegistry();
  fuzzyReg.register({
    ruleId: "SYNTHETIC_RULE_CASE",
    description: "Strict casing rule",
    componentType: "PIPE",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_NORM13_VERIFIED_01"],
  });
  const fuzzyEngine = new NormativeCompatibilityEngine(fuzzyReg, evidenceResolver);
  const res16a = fuzzyEngine.evaluate({ componentType: "pipe" });
  assert(res16a.status === "UNVERIFIED", "TEST 16: lowercase must not match uppercase");
  const res16b = fuzzyEngine.evaluate({ componentType: "PIPE_SPECIAL" });
  assert(res16b.status === "UNVERIFIED", "TEST 16: substring must not match");
  results.push("✅ PASS: TEST 16 — Aucun fuzzy matching");

  // =========================================================================
  // TEST 17 : Tokens heuristiques interdits rejetés
  // =========================================================================
  testsRun++;
  const badTokenRule: any = {
    ruleId: "MAT_CS_123",
    description: "Heuristic token rule",
    status: "COMPATIBLE",
  };
  const val17a = validateNormativeCompatibilityRule(badTokenRule);
  assert(val17a.valid === false, "TEST 17: rule with forbidden token ruleId must be rejected");

  const badTokenFieldRule: any = {
    ruleId: "SYNTHETIC_RULE_VALID_ID",
    description: "Rule with bad material token",
    materialId: "CARBON_STEEL_A",
    status: "COMPATIBLE",
  };
  const val17b = validateNormativeCompatibilityRule(badTokenFieldRule);
  assert(val17b.valid === false, "TEST 17: rule with forbidden token in materialId must be rejected");

  const badTokenContext: NormativeCompatibilityContext = {
    materialId: "_CS_PIPE",
  };
  const engineContextCheck = new NormativeCompatibilityEngine(reg1, evidenceResolver);
  const res17c = engineContextCheck.evaluate(badTokenContext);
  assert(res17c.status === "INVALID", "TEST 17: context with forbidden token must be INVALID");
  results.push("✅ PASS: TEST 17 — Tokens heuristiques interdits rejetés");

  // =========================================================================
  // TEST 18 : Plusieurs règles compatibles vérifiées restent déterministes
  // =========================================================================
  testsRun++;
  const multiVerifiedReg = new NormativeCompatibilityRegistry();
  multiVerifiedReg.register({
    ruleId: "SYNTHETIC_RULE_V1",
    description: "First verified rule",
    componentType: "SYNTHETIC_PIPE",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_NORM13_VERIFIED_01"],
  });
  multiVerifiedReg.register({
    ruleId: "SYNTHETIC_RULE_V2",
    description: "Second verified rule",
    componentType: "SYNTHETIC_PIPE",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_NORM13_VERIFIED_02"],
  });
  const detEngine = new NormativeCompatibilityEngine(multiVerifiedReg, evidenceResolver);
  const res18a = detEngine.evaluate({ componentType: "SYNTHETIC_PIPE" });
  const res18b = detEngine.evaluate({ componentType: "SYNTHETIC_PIPE" });
  assert(res18a.status === "COMPATIBLE", "TEST 18: status must be COMPATIBLE");
  assert(res18a.ruleId === res18b.ruleId, "TEST 18: repeated evaluations must be deterministic");
  results.push("✅ PASS: TEST 18 — Plusieurs règles compatibles vérifiées restent déterministes");

  // =========================================================================
  // TEST 19 : Une règle compatible non vérifiée ne masque JAMAIS une règle vérifiée
  // =========================================================================
  testsRun++;
  const priorityReg = new NormativeCompatibilityRegistry();
  // Règle non vérifiée enregistrée EN PREMIER
  priorityReg.register({
    ruleId: "SYNTHETIC_UNVERIFIED_FIRST",
    description: "Unverified rule registered first",
    componentType: "SYNTHETIC_FITTING",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_NORM13_UNVERIFIED_01"],
  });
  // Règle vérifiée enregistrée EN DEUXIÈME
  priorityReg.register({
    ruleId: "SYNTHETIC_VERIFIED_SECOND",
    description: "Verified rule registered second",
    componentType: "SYNTHETIC_FITTING",
    status: "COMPATIBLE",
    evidenceIds: ["SYNTHETIC_EV_NORM13_VERIFIED_01"],
  });
  const priorityEngine = new NormativeCompatibilityEngine(priorityReg, evidenceResolver);
  const res19 = priorityEngine.evaluate({ componentType: "SYNTHETIC_FITTING" });
  assert(res19.status === "COMPATIBLE", `TEST 19: expected COMPATIBLE, got ${res19.status}`);
  assert(res19.ruleId === "SYNTHETIC_VERIFIED_SECOND", "TEST 19: verified rule must be selected over unverified");
  results.push("✅ PASS: TEST 19 — Une règle non vérifiée ne masque jamais une règle vérifiée");

  // =========================================================================
  // TEST 20 : Registry reste vide si aucune règle n'est enregistrée
  // =========================================================================
  testsRun++;
  const cleanReg = new NormativeCompatibilityRegistry();
  assert(cleanReg.count() === 0, "TEST 20: count must be 0");
  assert(cleanReg.list().length === 0, "TEST 20: list must be empty");
  cleanReg.clear();
  assert(cleanReg.count() === 0, "TEST 20: count must remain 0 after clear");
  results.push("✅ PASS: TEST 20 — Registry reste vide si aucune règle n'est enregistrée");

  return {
    success: true,
    testsRun,
    results,
  };
}
