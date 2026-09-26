/**
 * PDI NORMATIVE ENGINE — ASME B31.3 DATA INGESTION & GOVERNANCE TESTS
 * Reference: B31.3-02 (Controlled Normative Data Ingestion)
 * 
 * Suite complète de tests unitaires et d'intégration validant le modèle,
 * la gouvernance de la chaîne de traçabilité, le registre et le résolveur de données B31.3.
 * 
 * RÈGLE FONDAMENTALE (Section 12) :
 * - Utilisation EXCLUSIVE d'identifiants synthétiques (`SYNTHETIC_*`).
 * - Aucune vraie valeur normative comme fixture.
 */

import {
  NormativeSourceDocumentRegistry,
} from "../registry/normativeSourceDocumentRegistry";
import {
  NormativeSourceDocumentResolver,
} from "../registry/normativeSourceDocumentResolver";
import {
  NormativeEvidenceRegistry,
} from "../registry/normativeEvidenceRegistry";
import {
  NormativeEvidenceResolver,
} from "../registry/normativeEvidenceResolver";
import {
  B31_3DataRegistry,
} from "../data/b31_3/b31_3DataRegistry";
import {
  B31_3DataResolver,
} from "../data/b31_3/b31_3DataResolver";
import type {
  B31_3NormativeDataRecord,
} from "../types/b31_3DataTypes";
import type {
  NormativeSourceDocument,
} from "../types/normativeSourceDocumentTypes";
import type {
  NormativeEvidence,
} from "../types/normativeEvidenceTypes";
import {
  validateB31_3DataRecordStructure,
  validateB31_3DataRecordGovernance,
} from "../data/b31_3/b31_3DataValidator";

export interface B31_3DataTestResult {
  readonly success: boolean;
  readonly testsRun: number;
  readonly results: readonly string[];
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[B31.3-02 ASSERTION FAILED] ${message}`);
  }
}

/**
 * Exécute la suite complète de tests B31.3-02.
 */
export function runB31_3DataTests(): B31_3DataTestResult {
  const results: string[] = [];
  let testsRun = 0;

  function runTest(testName: string, testFn: () => void) {
    testsRun++;
    try {
      testFn();
      results.push(`✅ PASS: ${testName}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push(`❌ FAIL: ${testName} (${msg})`);
    }
  }

  // =========================================================================
  // FIXTURES SYNTHÉTIQUES STRICTES
  // =========================================================================

  const verifiedDoc: NormativeSourceDocument = Object.freeze({
    documentId: "SYNTHETIC_SOURCE_DOCUMENT_VERIFIED",
    title: "Synthetic Source Document",
    standardId: "SYNTHETIC_STANDARD_01",
    editionId: "SYNTHETIC_EDITION_01",
    documentReference: "SYNTHETIC_REF_DOC_01",
    status: "VERIFIED",
    verifiedBy: "SYNTHETIC_AUDITOR",
    verifiedAt: "2026-01-01T00:00:00.000Z",
  });

  const unverifiedDoc: NormativeSourceDocument = Object.freeze({
    documentId: "SYNTHETIC_SOURCE_DOCUMENT_UNVERIFIED",
    title: "Synthetic Unverified Document",
    standardId: "SYNTHETIC_STANDARD_01",
    editionId: "SYNTHETIC_EDITION_01",
    documentReference: "SYNTHETIC_REF_DOC_02",
    status: "UNVERIFIED",
  });

  const verifiedEvidence: NormativeEvidence = Object.freeze({
    evidenceId: "SYNTHETIC_EVIDENCE_VERIFIED",
    standardId: "SYNTHETIC_STANDARD_01",
    editionId: "SYNTHETIC_EDITION_01",
    clauseReference: "SYNTHETIC_CLAUSE_01",
    sourceType: "LICENSED_STANDARD",
    sourceReference: "SYNTHETIC_REF_DOC_01",
    sourceDocumentId: "SYNTHETIC_SOURCE_DOCUMENT_VERIFIED",
    verificationStatus: "VERIFIED",
    verifiedBy: "SYNTHETIC_AUDITOR",
    verifiedAt: "2026-01-01T00:00:00.000Z",
  });

  const unverifiedEvidence: NormativeEvidence = Object.freeze({
    evidenceId: "SYNTHETIC_EVIDENCE_UNVERIFIED",
    standardId: "SYNTHETIC_STANDARD_01",
    editionId: "SYNTHETIC_EDITION_01",
    clauseReference: "SYNTHETIC_CLAUSE_02",
    sourceType: "LEGACY_REFERENCE",
    sourceReference: "SYNTHETIC_REF_DOC_02",
    sourceDocumentId: "SYNTHETIC_SOURCE_DOCUMENT_UNVERIFIED",
    verificationStatus: "UNVERIFIED",
  });

  function createTestEnvironment() {
    const docRegistry = new NormativeSourceDocumentRegistry();
    docRegistry.register(verifiedDoc);
    docRegistry.register(unverifiedDoc);
    const docResolver = new NormativeSourceDocumentResolver(docRegistry);

    const evRegistry = new NormativeEvidenceRegistry();
    evRegistry.register(verifiedEvidence);
    evRegistry.register(unverifiedEvidence);
    const evResolver = new NormativeEvidenceResolver(evRegistry);

    const dataRegistry = new B31_3DataRegistry(docResolver, evResolver);
    const dataResolver = new B31_3DataResolver(dataRegistry);

    return {
      docRegistry,
      docResolver,
      evRegistry,
      evResolver,
      dataRegistry,
      dataResolver,
    };
  }

  const validRecordSynthetic: B31_3NormativeDataRecord<number> = Object.freeze({
    dataId: "SYNTHETIC_B31_3_DATA_001",
    standardId: "SYNTHETIC_STANDARD_01",
    editionId: "SYNTHETIC_EDITION_01",
    sourceDocumentId: "SYNTHETIC_SOURCE_DOCUMENT_VERIFIED",
    evidenceId: "SYNTHETIC_EVIDENCE_VERIFIED",
    clauseReference: "SYNTHETIC_CLAUSE_01",
    dataType: "ALLOWABLE_STRESS_SYNTHETIC",
    value: 120.5,
    unit: "MPa",
    status: "VERIFIED",
    notes: "Synthetic verified test record",
  });

  // =========================================================================
  // 1. TESTS DE STRUCTURE (TESTS 01 à 09)
  // =========================================================================

  // TEST 01: record valide synthétique
  runTest("TEST 01 — Record valide synthétique passe la validation structurelle", () => {
    const res = validateB31_3DataRecordStructure(validRecordSynthetic);
    assert(res.valid, `Expected valid, got errors: ${res.errors.map((e) => e.message).join("; ")}`);
    assert(res.errors.length === 0, "Errors array must be empty");
  });

  // TEST 02: record null
  runTest("TEST 02 — Record null rejeté", () => {
    const res = validateB31_3DataRecordStructure(null);
    assert(!res.valid, "Null record must be invalid");
    assert(res.errors.some((e) => e.code === "INVALID_RECORD_OBJECT"), "Must return INVALID_RECORD_OBJECT");
  });

  // TEST 03: record array
  runTest("TEST 03 — Record array rejeté", () => {
    const res = validateB31_3DataRecordStructure([]);
    assert(!res.valid, "Array record must be invalid");
    assert(res.errors.some((e) => e.code === "INVALID_RECORD_OBJECT"), "Must return INVALID_RECORD_OBJECT");
  });

  // TEST 04: dataId vide
  runTest("TEST 04 — dataId vide rejeté", () => {
    const res = validateB31_3DataRecordStructure({
      ...validRecordSynthetic,
      dataId: "   ",
    });
    assert(!res.valid, "Empty dataId must be invalid");
    assert(res.errors.some((e) => e.code === "EMPTY_DATA_ID"), "Must return EMPTY_DATA_ID");
  });

  // TEST 05: standardId vide
  runTest("TEST 05 — standardId vide rejeté", () => {
    const res = validateB31_3DataRecordStructure({
      ...validRecordSynthetic,
      standardId: "",
    });
    assert(!res.valid, "Empty standardId must be invalid");
    assert(res.errors.some((e) => e.code === "EMPTY_STANDARD_ID"), "Must return EMPTY_STANDARD_ID");
  });

  // TEST 06: editionId vide
  runTest("TEST 06 — editionId vide rejeté", () => {
    const res = validateB31_3DataRecordStructure({
      ...validRecordSynthetic,
      editionId: "  ",
    });
    assert(!res.valid, "Empty editionId must be invalid");
    assert(res.errors.some((e) => e.code === "EMPTY_EDITION_ID"), "Must return EMPTY_EDITION_ID");
  });

  // TEST 07: sourceDocumentId vide
  runTest("TEST 07 — sourceDocumentId vide rejeté", () => {
    const res = validateB31_3DataRecordStructure({
      ...validRecordSynthetic,
      sourceDocumentId: "",
    });
    assert(!res.valid, "Empty sourceDocumentId must be invalid");
    assert(res.errors.some((e) => e.code === "EMPTY_SOURCE_DOCUMENT_ID"), "Must return EMPTY_SOURCE_DOCUMENT_ID");
  });

  // TEST 08: evidenceId vide
  runTest("TEST 08 — evidenceId vide rejeté", () => {
    const res = validateB31_3DataRecordStructure({
      ...validRecordSynthetic,
      evidenceId: "",
    });
    assert(!res.valid, "Empty evidenceId must be invalid");
    assert(res.errors.some((e) => e.code === "EMPTY_EVIDENCE_ID"), "Must return EMPTY_EVIDENCE_ID");
  });

  // TEST 09: clauseReference vide
  runTest("TEST 09 — clauseReference vide rejeté", () => {
    const res = validateB31_3DataRecordStructure({
      ...validRecordSynthetic,
      clauseReference: "  ",
    });
    assert(!res.valid, "Empty clauseReference must be invalid");
    assert(res.errors.some((e) => e.code === "EMPTY_CLAUSE_REFERENCE"), "Must return EMPTY_CLAUSE_REFERENCE");
  });

  // =========================================================================
  // 2. TESTS DU REGISTRE (TESTS 10 à 15)
  // =========================================================================

  // TEST 10: register
  runTest("TEST 10 — Enregistrement réussi d'un record valide dans le registre", () => {
    const { dataRegistry } = createTestEnvironment();
    dataRegistry.register(validRecordSynthetic);
    assert(dataRegistry.count() === 1, "Registry count must be 1");
    assert(dataRegistry.has("SYNTHETIC_B31_3_DATA_001"), "Registry must have registered record");
    const retrieved = dataRegistry.get("SYNTHETIC_B31_3_DATA_001");
    assert(retrieved !== undefined, "Retrieved record must be defined");
    assert(retrieved?.dataId === "SYNTHETIC_B31_3_DATA_001", "dataId mismatch");
    assert(retrieved?.status === "VERIFIED", "status must be VERIFIED");
  });

  // TEST 11: duplicate rejection
  runTest("TEST 11 — Doublon de dataId formellement rejeté", () => {
    const { dataRegistry } = createTestEnvironment();
    dataRegistry.register(validRecordSynthetic);
    let threw = false;
    try {
      dataRegistry.register(validRecordSynthetic);
    } catch {
      threw = true;
    }
    assert(threw, "Must throw on duplicate dataId");
    assert(dataRegistry.count() === 1, "Count must remain 1");
  });

  // TEST 12: immutable retrieval
  runTest("TEST 12 — Récupération d'une copie immuable gelée", () => {
    const { dataRegistry } = createTestEnvironment();
    dataRegistry.register(validRecordSynthetic);
    const retrieved = dataRegistry.get("SYNTHETIC_B31_3_DATA_001");
    assert(Object.isFrozen(retrieved), "Retrieved record must be frozen");
  });

  // TEST 13: deterministic list
  runTest("TEST 13 — list() déterministe et triée alphabétiquement", () => {
    const { dataRegistry, docRegistry, evRegistry } = createTestEnvironment();

    const recordB: B31_3NormativeDataRecord<number> = {
      ...validRecordSynthetic,
      dataId: "SYNTHETIC_B31_3_DATA_002",
    };
    const recordA: B31_3NormativeDataRecord<number> = {
      ...validRecordSynthetic,
      dataId: "SYNTHETIC_B31_3_DATA_001",
    };

    // Inverser l'ordre d'insertion
    dataRegistry.register(recordB);
    dataRegistry.register(recordA);

    const list = dataRegistry.list();
    assert(list.length === 2, "List length must be 2");
    assert(list[0].dataId === "SYNTHETIC_B31_3_DATA_001", "First item must be DATA_001");
    assert(list[1].dataId === "SYNTHETIC_B31_3_DATA_002", "Second item must be DATA_002");
  });

  // TEST 14: empty registry initial
  runTest("TEST 14 — Registre initialement vide sans données injectées", () => {
    const { dataRegistry } = createTestEnvironment();
    assert(dataRegistry.count() === 0, "Initial count must be 0");
    assert(dataRegistry.list().length === 0, "Initial list must be empty");
  });

  // TEST 15: clear
  runTest("TEST 15 — clear() réinitialise complètement le registre", () => {
    const { dataRegistry } = createTestEnvironment();
    dataRegistry.register(validRecordSynthetic);
    assert(dataRegistry.count() === 1, "Count must be 1 before clear");
    dataRegistry.clear();
    assert(dataRegistry.count() === 0, "Count must be 0 after clear");
    assert(!dataRegistry.has("SYNTHETIC_B31_3_DATA_001"), "has must return false after clear");
  });

  // =========================================================================
  // 3. TESTS DE LA CHAÎNE DOCUMENTAIRE / GOUVERNANCE (TESTS 16 à 20)
  // =========================================================================

  // TEST 16: VERIFIED source + VERIFIED evidence -> VERIFIED possible
  runTest("TEST 16 — Chaîne complète vérifiée (Doc VERIFIED + Evidence VERIFIED) -> Record VERIFIED accepté", () => {
    const { docResolver, evResolver, dataRegistry } = createTestEnvironment();
    const govRes = validateB31_3DataRecordGovernance(validRecordSynthetic, docResolver, evResolver);
    assert(govRes.valid, `Expected valid governance, got: ${govRes.errors.map((e) => e.message).join("; ")}`);
    dataRegistry.register(validRecordSynthetic);
    assert(dataRegistry.has("SYNTHETIC_B31_3_DATA_001"), "Registration must succeed");
  });

  // TEST 17: UNVERIFIED source -> VERIFIED bloqué
  runTest("TEST 17 — Source UNVERIFIED bloque l'enregistrement d'un record VERIFIED", () => {
    const { docResolver, evResolver, dataRegistry } = createTestEnvironment();
    const invalidRecord: B31_3NormativeDataRecord<number> = {
      ...validRecordSynthetic,
      dataId: "SYNTHETIC_DATA_UNV_SRC",
      sourceDocumentId: "SYNTHETIC_SOURCE_DOCUMENT_UNVERIFIED",
      status: "VERIFIED",
    };

    const govRes = validateB31_3DataRecordGovernance(invalidRecord, docResolver, evResolver);
    assert(!govRes.valid, "Governance validation must fail when source document is UNVERIFIED");
    assert(
      govRes.errors.some((e) => e.code === "VERIFIED_RECORD_SOURCE_DOCUMENT_UNVERIFIED"),
      "Must return VERIFIED_RECORD_SOURCE_DOCUMENT_UNVERIFIED"
    );

    let threw = false;
    try {
      dataRegistry.register(invalidRecord);
    } catch {
      threw = true;
    }
    assert(threw, "Registry must throw when registering VERIFIED record with UNVERIFIED source");
  });

  // TEST 18: NOT_FOUND source -> VERIFIED bloqué
  runTest("TEST 18 — Source NOT_FOUND bloque l'enregistrement d'un record VERIFIED", () => {
    const { docResolver, evResolver, dataRegistry } = createTestEnvironment();
    const invalidRecord: B31_3NormativeDataRecord<number> = {
      ...validRecordSynthetic,
      dataId: "SYNTHETIC_DATA_MISSING_SRC",
      sourceDocumentId: "SYNTHETIC_NON_EXISTENT_DOCUMENT",
      status: "VERIFIED",
    };

    const govRes = validateB31_3DataRecordGovernance(invalidRecord, docResolver, evResolver);
    assert(!govRes.valid, "Governance validation must fail when source document is missing");
    assert(
      govRes.errors.some((e) => e.code === "VERIFIED_RECORD_SOURCE_DOCUMENT_NOT_FOUND"),
      "Must return VERIFIED_RECORD_SOURCE_DOCUMENT_NOT_FOUND"
    );

    let threw = false;
    try {
      dataRegistry.register(invalidRecord);
    } catch {
      threw = true;
    }
    assert(threw, "Registry must throw when registering VERIFIED record with missing source");
  });

  // TEST 19: UNVERIFIED evidence -> VERIFIED bloqué
  runTest("TEST 19 — Evidence UNVERIFIED bloque l'enregistrement d'un record VERIFIED", () => {
    const { docResolver, evResolver, dataRegistry } = createTestEnvironment();
    const invalidRecord: B31_3NormativeDataRecord<number> = {
      ...validRecordSynthetic,
      dataId: "SYNTHETIC_DATA_UNV_EV",
      evidenceId: "SYNTHETIC_EVIDENCE_UNVERIFIED",
      status: "VERIFIED",
    };

    const govRes = validateB31_3DataRecordGovernance(invalidRecord, docResolver, evResolver);
    assert(!govRes.valid, "Governance validation must fail when evidence is UNVERIFIED");
    assert(
      govRes.errors.some((e) => e.code === "VERIFIED_RECORD_EVIDENCE_UNVERIFIED"),
      "Must return VERIFIED_RECORD_EVIDENCE_UNVERIFIED"
    );

    let threw = false;
    try {
      dataRegistry.register(invalidRecord);
    } catch {
      threw = true;
    }
    assert(threw, "Registry must throw when registering VERIFIED record with UNVERIFIED evidence");
  });

  // TEST 20: NOT_FOUND evidence -> VERIFIED bloqué
  runTest("TEST 20 — Evidence NOT_FOUND bloque l'enregistrement d'un record VERIFIED", () => {
    const { docResolver, evResolver, dataRegistry } = createTestEnvironment();
    const invalidRecord: B31_3NormativeDataRecord<number> = {
      ...validRecordSynthetic,
      dataId: "SYNTHETIC_DATA_MISSING_EV",
      evidenceId: "SYNTHETIC_NON_EXISTENT_EVIDENCE",
      status: "VERIFIED",
    };

    const govRes = validateB31_3DataRecordGovernance(invalidRecord, docResolver, evResolver);
    assert(!govRes.valid, "Governance validation must fail when evidence is missing");
    assert(
      govRes.errors.some((e) => e.code === "VERIFIED_RECORD_EVIDENCE_NOT_FOUND"),
      "Must return VERIFIED_RECORD_EVIDENCE_NOT_FOUND"
    );

    let threw = false;
    try {
      dataRegistry.register(invalidRecord);
    } catch {
      threw = true;
    }
    assert(threw, "Registry must throw when registering VERIFIED record with missing evidence");
  });

  // =========================================================================
  // 4. TESTS DU RESOLVER (TESTS 21 à 24)
  // =========================================================================

  // TEST 21: FOUND_VERIFIED
  runTest("TEST 21 — Résolution d'un record vérifié -> FOUND_VERIFIED", () => {
    const { dataRegistry, dataResolver } = createTestEnvironment();
    dataRegistry.register(validRecordSynthetic);

    const res = dataResolver.resolveData<number>("SYNTHETIC_B31_3_DATA_001");
    assert(res.status === "FOUND_VERIFIED", `Expected FOUND_VERIFIED, got '${res.status}'`);
    assert(res.record !== undefined, "Record must be defined");
    assert(res.record?.value === 120.5, "Value mismatch");
  });

  // TEST 22: FOUND_UNVERIFIED
  runTest("TEST 22 — Résolution d'un record non vérifié -> FOUND_UNVERIFIED", () => {
    const { dataRegistry, dataResolver } = createTestEnvironment();
    const unverifiedRecord: B31_3NormativeDataRecord<number> = {
      ...validRecordSynthetic,
      dataId: "SYNTHETIC_B31_3_DATA_UNVERIFIED",
      status: "UNVERIFIED",
    };
    dataRegistry.register(unverifiedRecord);

    const res = dataResolver.resolveData<number>("SYNTHETIC_B31_3_DATA_UNVERIFIED");
    assert(res.status === "FOUND_UNVERIFIED", `Expected FOUND_UNVERIFIED, got '${res.status}'`);
    assert(res.record !== undefined, "Record must be defined");
  });

  // TEST 23: NOT_FOUND
  runTest("TEST 23 — Résolution d'un record inexistant -> NOT_FOUND", () => {
    const { dataResolver } = createTestEnvironment();
    const res = dataResolver.resolveData("SYNTHETIC_NON_EXISTENT_ID");
    assert(res.status === "NOT_FOUND", `Expected NOT_FOUND, got '${res.status}'`);
    assert(res.record === undefined, "Record must be undefined for NOT_FOUND");
  });

  // TEST 24: INVALID
  runTest("TEST 24 — Résolution avec identifiant vide ou invalide -> INVALID", () => {
    const { dataResolver } = createTestEnvironment();
    const res1 = dataResolver.resolveData("");
    assert(res1.status === "INVALID", "Empty id must return INVALID");

    const res2 = dataResolver.resolveData("MAT_CS_A106");
    assert(res2.status === "INVALID", "Disallowed token heuristic must return INVALID");
  });

  // =========================================================================
  // 5. TESTS DE NON-PROMOTION & ANTI-HEURISTIQUE (TESTS 25 à 30)
  // =========================================================================

  // TEST 25: UNVERIFIED record ne devient jamais VERIFIED
  runTest("TEST 25 — Record UNVERIFIED ne devient jamais VERIFIED lors de la résolution", () => {
    const { dataRegistry, dataResolver } = createTestEnvironment();
    const unverifiedRecord: B31_3NormativeDataRecord<number> = {
      ...validRecordSynthetic,
      dataId: "SYNTHETIC_DATA_UNV_STRICT",
      status: "UNVERIFIED",
    };
    dataRegistry.register(unverifiedRecord);

    const res = dataResolver.resolveData("SYNTHETIC_DATA_UNV_STRICT");
    assert(res.status !== "FOUND_VERIFIED", "Must NEVER promote UNVERIFIED to FOUND_VERIFIED");
    assert(res.status === "FOUND_UNVERIFIED", "Status must be FOUND_UNVERIFIED");
  });

  // TEST 26: resolver ne modifie jamais le record
  runTest("TEST 26 — Le resolver ne modifie jamais l'objet record enregistré", () => {
    const { dataRegistry, dataResolver } = createTestEnvironment();
    dataRegistry.register(validRecordSynthetic);

    const res1 = dataResolver.resolveData<number>("SYNTHETIC_B31_3_DATA_001");
    const res2 = dataResolver.resolveData<number>("SYNTHETIC_B31_3_DATA_001");

    assert(res1.record === res2.record, "Must return reference to same frozen object");
    assert(JSON.stringify(res1.record) === JSON.stringify(validRecordSynthetic), "Object state unchanged");
  });

  // TEST 27: aucune heuristique
  runTest("TEST 27 — Rejet absolu des tokens heuristiques (MAT_CS_*, _CS_, etc.)", () => {
    const { dataRegistry } = createTestEnvironment();
    const disallowedTokens = [
      "MAT_CS_PIPE",
      "CS_A106",
      "RECORD_CS_VAL",
      "CARBON_STEEL_VAL",
      "CRMO",
      "CR_MO",
      "CRMO_VALUE",
      "CR_MO_VALUE",
      "AUSTENITIC",
    ];

    for (const tok of disallowedTokens) {
      let threw = false;
      try {
        dataRegistry.register({
          ...validRecordSynthetic,
          dataId: tok,
        });
      } catch {
        threw = true;
      }
      assert(threw, `Must throw when dataId uses heuristic token '${tok}'`);
    }
  });

  // TEST 28: aucun fallback sourceReference
  runTest("TEST 28 — sourceReference seul ne remplace jamais un sourceDocumentId + evidenceId vérifiés", () => {
    const { docResolver, evResolver } = createTestEnvironment();
    const recordWithOnlyReference = {
      ...validRecordSynthetic,
      sourceDocumentId: "SYNTHETIC_SOURCE_DOCUMENT_UNVERIFIED",
      evidenceId: "SYNTHETIC_EVIDENCE_UNVERIFIED",
      status: "VERIFIED" as const,
      notes: "Document reference claimed in notes without verified evidence",
    };

    const govRes = validateB31_3DataRecordGovernance(recordWithOnlyReference, docResolver, evResolver);
    assert(!govRes.valid, "Must reject VERIFIED record relying on unverified chain regardless of notes/reference");
  });

  // TEST 29: aucun fuzzy matching
  runTest("TEST 29 — Aucun fuzzy matching : une clé partielle ou approchée retourne NOT_FOUND", () => {
    const { dataRegistry, dataResolver } = createTestEnvironment();
    dataRegistry.register(validRecordSynthetic);

    // Essayer des clés partielles
    assert(dataResolver.resolveData("SYNTHETIC_B31_3_DATA").status === "NOT_FOUND", "Partial key must return NOT_FOUND");
    assert(dataResolver.resolveData("synthetic_b31_3_data_001").status === "NOT_FOUND", "Case mismatch must return NOT_FOUND");
    assert(dataResolver.resolveData("DATA_001").status === "NOT_FOUND", "Suffix key must return NOT_FOUND");
  });

  // TEST 30: déterminisme avec ordre inversé
  runTest("TEST 30 — Déterminisme strict indépendant de l'ordre d'insertion", () => {
    const docReg1 = new NormativeSourceDocumentRegistry();
    docReg1.register(verifiedDoc);
    const evReg1 = new NormativeEvidenceRegistry();
    evReg1.register(verifiedEvidence);
    const reg1 = new B31_3DataRegistry(
      new NormativeSourceDocumentResolver(docReg1),
      new NormativeEvidenceResolver(evReg1)
    );

    const docReg2 = new NormativeSourceDocumentRegistry();
    docReg2.register(verifiedDoc);
    const evReg2 = new NormativeEvidenceRegistry();
    evReg2.register(verifiedEvidence);
    const reg2 = new B31_3DataRegistry(
      new NormativeSourceDocumentResolver(docReg2),
      new NormativeEvidenceResolver(evReg2)
    );

    const rec1: B31_3NormativeDataRecord<number> = { ...validRecordSynthetic, dataId: "SYNTHETIC_REC_1" };
    const rec2: B31_3NormativeDataRecord<number> = { ...validRecordSynthetic, dataId: "SYNTHETIC_REC_2" };

    // reg1: 1 puis 2
    reg1.register(rec1);
    reg1.register(rec2);

    // reg2: 2 puis 1
    reg2.register(rec2);
    reg2.register(rec1);

    const list1 = reg1.list();
    const list2 = reg2.list();

    assert(list1.length === list2.length, "Lengths must match");
    assert(list1[0].dataId === list2[0].dataId, "First item dataId must match");
    assert(list1[1].dataId === list2[1].dataId, "Second item dataId must match");
  });

  // =========================================================================
  // 6. TESTS D'INTÉGRITÉ CRITIQUE (Section 14 & Batch)
  // =========================================================================

  // TEST 31: Test d'intégrité critique — sourceReference seule ne produit JAMAIS VERIFIED
  runTest("TEST 31 — Test d'intégrité critique : sourceReference seule != Evidence vérifiée", () => {
    const { docResolver, evResolver } = createTestEnvironment();
    const bareRecord: B31_3NormativeDataRecord<string> = {
      dataId: "SYNTHETIC_BARE_RECORD",
      standardId: "SYNTHETIC_STANDARD_01",
      editionId: "SYNTHETIC_EDITION_01",
      sourceDocumentId: "SYNTHETIC_NON_EXISTENT_DOC",
      evidenceId: "SYNTHETIC_NON_EXISTENT_EV",
      clauseReference: "SYNTHETIC_PARAGRAPH_304",
      dataType: "MATERIAL_SPECIFICATION",
      value: "SYNTHETIC_MATERIAL_NAME",
      status: "VERIFIED",
    };

    const res = validateB31_3DataRecordGovernance(bareRecord, docResolver, evResolver);
    assert(!res.valid, "Bare text metadata alone must never satisfy VERIFIED governance");
    assert(res.errors.length >= 2, "Must flag missing source document and missing evidence");
  });

  // TEST 32: resolveDataSet consolide fidèlement l'état d'un lot de données
  runTest("TEST 32 — resolveDataSet bilan consolidé et typé", () => {
    const { dataRegistry, dataResolver } = createTestEnvironment();
    dataRegistry.register(validRecordSynthetic);

    const unverifiedRecord: B31_3NormativeDataRecord<number> = {
      ...validRecordSynthetic,
      dataId: "SYNTHETIC_DATA_UNV",
      status: "UNVERIFIED",
    };
    dataRegistry.register(unverifiedRecord);

    const setRes = dataResolver.resolveDataSet([
      "SYNTHETIC_B31_3_DATA_001",
      "SYNTHETIC_DATA_UNV",
      "SYNTHETIC_NON_EXISTENT",
    ]);

    assert(setRes.totalRequested === 3, "totalRequested mismatch");
    assert(setRes.verifiedCount === 1, "verifiedCount mismatch");
    assert(setRes.unverifiedCount === 1, "unverifiedCount mismatch");
    assert(setRes.notFoundCount === 1, "notFoundCount mismatch");
    assert(setRes.allFound === false, "allFound must be false");
    assert(setRes.allVerified === false, "allVerified must be false");
  });

  const success = results.every((r) => r.startsWith("✅ PASS"));

  return {
    success,
    testsRun,
    results,
  };
}
