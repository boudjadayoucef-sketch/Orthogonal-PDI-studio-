/**
 * PDI NORMATIVE ENGINE & TECHNICAL WORKFLOW — ARCH-05 TEST SUITE
 * Reference: ARCH-05 (Technical Workflow P&ID → Piping → Isometric)
 *
 * Test suite verifying:
 * - A to Y Mandatory Tests:
 *   A — Project identity
 *   B — Document identity
 *   C — Process reference
 *   D — No process inference
 *   E — Pressure safety (operating != design)
 *   F — Temperature safety (operating != design)
 *   G — Material safety
 *   H — Dimension safety (DN alone never creates NPS)
 *   I — OD safety (DN alone never creates OD)
 *   J — Schedule safety (DN alone never creates Schedule)
 *   K — Piping identity
 *   L — ISO reference
 *   M — Universal identity
 *   N — Normative isolation
 *   O — No compatibility promotion
 *   P — Evidence isolation
 *   Q — Project / Workspace separation
 *   R — Save (Piping -> IsoProjectFile)
 *   S — Load (IsoProjectFile -> context)
 *   T — Schema (schemaVersion === "4.7.4")
 *   U — No mutation (Immutability)
 *   V — No loop (Directed acyclic flow)
 *   W — 3D isolation (Three.js representation only)
 *   X — 2D isolation (CAD representation only)
 *   Y — Legacy compatibility
 * - Non-regression of NORM-01..14, ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-04-FIX-01
 */

import {
  createTechnicalWorkflowContext,
  transitionTechnicalWorkflow,
  isValidWorkflowTransition,
  adaptProcessInputToPipingDesign,
  adaptPipingDesignToIsometricModel,
  adaptIsometricDocumentToWorkflowReference,
  deriveUniversalEntitiesFromWorkflow,
  validateTechnicalWorkflowContext,
} from "../../model/pdiTechnicalWorkflowAdapter";
import type {
  PdiTechnicalWorkflowContext,
  PdiProcessInputReference,
  PdiPipingDesignReference,
} from "../../model/pdiTechnicalWorkflow";
import {
  createProjectContext,
  createDocument,
  createDefaultProjectBundle,
  isoProjectFileV474ToProjectBundle,
  projectBundleToIsoProjectFileV474,
  deriveUniversalEntitiesFromDocument,
} from "../../model/pdiProjectAdapter";
import type { IsoNode, IsoSegment, IsoProjectFileV474 } from "../../isometric/types/isoGraphTypes";
import { runNormativeGlobalIntegrationTests } from "./normativeGlobalIntegrationTests";
import { runArch01IsometricNormativeBridgeTests } from "./arch01IsometricNormativeBridgeTests";
import { runArch02PmsAuthorityUnificationTests } from "./arch02PmsAuthorityUnificationTests";
import { runArch03UniversalModelTests } from "./arch03UniversalModelTests";
import { runArch04ProjectWorkspaceDataTests } from "./arch04ProjectWorkspaceDataTests";

export interface Arch05TestResult {
  readonly success: boolean;
  readonly testsRun: number;
  readonly testsPassed: number;
  readonly testsFailed: number;
  readonly results: readonly string[];
  readonly failures: readonly string[];
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ARCH-05 ASSERTION FAILED] ${message}`);
  }
}

export function runArch05TechnicalWorkflowTests(): Arch05TestResult {
  const results: string[] = [];
  const failures: string[] = [];
  let testsRun = 0;
  let testsPassed = 0;
  let testsFailed = 0;

  function runTest(testName: string, fn: () => void): void {
    testsRun++;
    try {
      fn();
      testsPassed++;
      results.push(`[PASS] ${testName}`);
    } catch (err: unknown) {
      testsFailed++;
      const msg = err instanceof Error ? err.message : String(err);
      results.push(`[FAIL] ${testName} — ${msg}`);
      failures.push(`${testName}: ${msg}`);
    }
  }

  // =========================================================================
  // TEST A: Project identity
  // =========================================================================
  runTest("TEST A [ARCH-05]: Project identity (conserve projectId à travers le workflow)", () => {
    const wf = createTechnicalWorkflowContext({
      projectId: "PROJ_HASSI_R_MEL_01",
      documentId: "DOC_ISO_COLLECTOR_01",
    });
    assert(wf.projectId === "PROJ_HASSI_R_MEL_01", "projectId doit être conservé exactement");
    const val = validateTechnicalWorkflowContext(wf);
    assert(val.valid === true, `Validation context échouée: ${val.errors.join(", ")}`);
  });

  // =========================================================================
  // TEST B: Document identity
  // =========================================================================
  runTest("TEST B [ARCH-05]: Document identity (conserve documentId dans la référence piping)", () => {
    const wf = createTechnicalWorkflowContext({
      projectId: "PROJ_001",
      documentId: "DOC_PIPING_MAIN_01",
    });
    assert(wf.documentId === "DOC_PIPING_MAIN_01", "documentId doit être conservé");
  });

  // =========================================================================
  // TEST C: Process reference
  // =========================================================================
  runTest("TEST C [ARCH-05]: Process reference explicite conservée", () => {
    const processInput: PdiProcessInputReference = {
      sourceId: "PID_DWG_1001",
      sourceType: "PID",
      documentNumber: "PID-2026-001",
      revision: "0",
      lines: [
        {
          processLineId: "PLINE_GAZ_01",
          lineNumber: "10\"-G-1001-A1",
          service: "Gaz naturel haute pression",
          fluid: "Natural Gas",
          fromEquipment: "V-101",
          toEquipment: "E-102",
          nominalDiameterMm: 250,
          conditions: {
            operatingPressureBar: 40,
            operatingTemperatureC: 45,
          },
        },
      ],
    };

    const pipingDesign = adaptProcessInputToPipingDesign(processInput);
    assert(pipingDesign.lines.length === 1, "Une ligne de piping doit être créée");
    assert(pipingDesign.lines[0].sourceProcessLineId === "PLINE_GAZ_01", "sourceProcessLineId doit être tracé");
    assert(pipingDesign.lines[0].tag === "10\"-G-1001-A1", "Tag de ligne conservé");
  });

  // =========================================================================
  // TEST D: No process inference
  // =========================================================================
  runTest("TEST D [ARCH-05]: No process inference (donnée process ne devient pas design sans mapping explicite)", () => {
    const processInput: PdiProcessInputReference = {
      sourceId: "PID_DWG_1002",
      sourceType: "PID",
      lines: [
        {
          processLineId: "PL_02",
          lineNumber: "L-02",
          conditions: {
            operatingPressureBar: 25,
            operatingTemperatureC: 30,
          },
        },
      ],
    };

    const pipingDesign = adaptProcessInputToPipingDesign(processInput);
    assert(pipingDesign.lines[0].designPressureBar === undefined, "operatingPressure ne doit PAS devenir designPressure");
    assert(pipingDesign.lines[0].designTemperatureC === undefined, "operatingTemperature ne doit PAS devenir designTemperature");
  });

  // =========================================================================
  // TEST E: Pressure safety
  // =========================================================================
  runTest("TEST E [ARCH-05]: Pressure safety (pression de service != pression de calcul)", () => {
    const processInput: PdiProcessInputReference = {
      sourceId: "PID_PRESSURE_SAFE",
      sourceType: "PROCESS_LINE",
      lines: [
        {
          processLineId: "PL_PRESS",
          lineNumber: "L-PRESS",
          conditions: {
            operatingPressureBar: 40, // Pression opératoire
            // Pas de designPressureBar
          },
        },
      ],
    };

    const piping = adaptProcessInputToPipingDesign(processInput);
    assert(piping.lines[0].designPressureBar === undefined, "Absence de designPressure doit rester undefined");
    assert((piping.lines[0] as any).operatingPressureBar === undefined, "operatingPressure non mélangé dans piping design");
  });

  // =========================================================================
  // TEST F: Temperature safety
  // =========================================================================
  runTest("TEST F [ARCH-05]: Temperature safety (température opératoire != température de calcul)", () => {
    const processInput: PdiProcessInputReference = {
      sourceId: "PID_TEMP_SAFE",
      sourceType: "PROCESS_DATA",
      lines: [
        {
          processLineId: "PL_TEMP",
          lineNumber: "L-TEMP",
          conditions: {
            operatingTemperatureC: 60,
          },
        },
      ],
    };

    const piping = adaptProcessInputToPipingDesign(processInput);
    assert(piping.lines[0].designTemperatureC === undefined, "Température opératoire ne devient pas température de calcul");
  });

  // =========================================================================
  // TEST G: Material safety
  // =========================================================================
  runTest("TEST G [ARCH-05]: Material safety (matériau absent reste undefined, pas de déduction de fluide)", () => {
    const processInput: PdiProcessInputReference = {
      sourceId: "PID_MAT_SAFE",
      sourceType: "PID",
      lines: [
        {
          processLineId: "PL_MAT",
          lineNumber: "L-MAT",
          fluid: "Eau de mer", // Fluide corrosif
        },
      ],
    };

    const piping = adaptProcessInputToPipingDesign(processInput);
    assert(piping.lines[0].materialGrade === undefined, "Matériau ne doit JAMAIS être déduit du fluide");
  });

  // =========================================================================
  // TEST H: Dimension safety (DN seul ne crée pas NPS)
  // =========================================================================
  runTest("TEST H [ARCH-05]: Dimension safety (DN seul ne crée JAMAIS NPS)", () => {
    const processInput: PdiProcessInputReference = {
      sourceId: "PID_DIM_SAFE",
      sourceType: "PID",
      lines: [
        {
          processLineId: "PL_DN100",
          lineNumber: "L-DN100",
          nominalDiameterMm: 100,
        },
      ],
    };

    const piping = adaptProcessInputToPipingDesign(processInput);
    assert(piping.lines[0].nominalDiameterMm === 100, "DN 100 transporté");
    assert(piping.lines[0].nominalDiameterInch === undefined, "NPS inch doit rester undefined");
  });

  // =========================================================================
  // TEST I: OD safety (DN seul ne crée pas OD)
  // =========================================================================
  runTest("TEST I [ARCH-05]: OD safety (DN seul ne crée JAMAIS outerDiameterMm)", () => {
    const node: IsoNode = {
      id: "N_WF_01",
      name: "Point départ",
      x: 10,
      y: 10,
      z: 0,
      type: "normal",
      dn: 150,
    };
    const doc = createDocument({
      documentId: "DOC_OD_SAFE",
      projectId: "PROJ_OD",
      model: { nodes: [node] },
    });

    const wf = createTechnicalWorkflowContext({
      projectId: "PROJ_OD",
      documentId: "DOC_OD_SAFE",
    });

    const entities = deriveUniversalEntitiesFromWorkflow(wf, doc);
    assert(entities[0].dn.dn === 150, "DN 150 transporté");
    assert(entities[0].dn.outerDiameterMm === undefined, "outerDiameterMm doit rester undefined");
  });

  // =========================================================================
  // TEST J: Schedule safety (DN seul ne crée pas Schedule)
  // =========================================================================
  runTest("TEST J [ARCH-05]: Schedule safety (DN seul ne crée JAMAIS Schedule ou épaisseur)", () => {
    const node: IsoNode = {
      id: "N_SCH_SAFE",
      name: "Point DN200",
      x: 0,
      y: 0,
      z: 0,
      type: "normal",
      dn: 200,
    };
    const doc = createDocument({
      documentId: "DOC_SCH_SAFE",
      projectId: "PROJ_SCH",
      model: { nodes: [node] },
    });

    const entities = deriveUniversalEntitiesFromDocument(doc);
    assert(entities[0].material.schedule === undefined, "schedule doit rester undefined (pas de SCH 40 inventé)");
    assert(entities[0].material.wallThicknessMm === undefined, "wallThicknessMm doit rester undefined");
  });

  // =========================================================================
  // TEST K: Piping identity
  // =========================================================================
  runTest("TEST K [ARCH-05]: Piping identity (Piping Line conserve son identité stable)", () => {
    const processInput: PdiProcessInputReference = {
      sourceId: "PID_IDENT",
      sourceType: "PID",
      lines: [
        {
          processLineId: "PL_FIXED_ID",
          lineNumber: "L-24-GAZ-001",
        },
      ],
    };

    const piping = adaptProcessInputToPipingDesign(processInput);
    assert(typeof piping.lines[0].pipingLineId === "string" && piping.lines[0].pipingLineId.length > 0, "ID valide");
    assert(piping.lines[0].sourceProcessLineId === "PL_FIXED_ID", "Lien vers la ligne procédé d'origine");
  });

  // =========================================================================
  // TEST L: ISO reference
  // =========================================================================
  runTest("TEST L [ARCH-05]: ISO reference (document ISO conserve documentId et comptages)", () => {
    const doc = createDocument({
      documentId: "DOC_ISO_REF_01",
      projectId: "PROJ_ISO_REF",
      revision: "B",
      model: {
        nodes: [
          { id: "N1", name: "P1", x: 0, y: 0, z: 0, type: "normal", dn: 100 },
          { id: "N2", name: "P2", x: 10, y: 0, z: 0, type: "normal", dn: 100 },
        ],
        segments: [
          {
            id: "S1",
            fromNodeId: "N1",
            toNodeId: "N2",
            dn: 100,
            pn: "PN16",
            material: "API 5L X52",
            length: 10,
            type: "straight",
            fittings: [],
          },
        ],
      },
    });

    const isoRef = adaptIsometricDocumentToWorkflowReference(doc);
    assert(isoRef.documentId === "DOC_ISO_REF_01", "documentId conservé");
    assert(isoRef.projectId === "PROJ_ISO_REF", "projectId conservé");
    assert(isoRef.revision === "B", "Révision B conservée");
    assert(isoRef.nodeCount === 2, "2 nœuds comptés");
    assert(isoRef.segmentCount === 1, "1 segment compté");
  });

  // =========================================================================
  // TEST M: Universal identity
  // =========================================================================
  runTest("TEST M [ARCH-05]: Universal identity (Universal Entity conserve son entityId)", () => {
    const doc = createDocument({
      documentId: "DOC_UE_ID",
      projectId: "PROJ_UE",
      model: {
        nodes: [{ id: "NODE_STABLE_99", name: "P99", x: 0, y: 0, z: 0, type: "normal", dn: 80 }],
      },
    });

    const wf = createTechnicalWorkflowContext({
      projectId: "PROJ_UE",
      documentId: "DOC_UE_ID",
    });

    const entities = deriveUniversalEntitiesFromWorkflow(wf, doc);
    assert(entities[0].identity.id === "NODE_STABLE_99", "identity.id conservé fidèlement");
  });

  // =========================================================================
  // TEST N: Normative isolation
  // =========================================================================
  runTest("TEST N [ARCH-05]: Normative isolation (le workflow ne contourne pas le Normative Engine)", () => {
    const wf = createTechnicalWorkflowContext({
      projectId: "PROJ_NORM_ISO",
      documentId: "DOC_NORM_ISO",
      initialState: "PROCESS_DEFINED",
    });

    // Vérifie que le workflow ne possède pas de verdict de conformité local
    assert((wf as any).isCompliant === undefined, "Workflow ne s'auto-déclare pas compliant");
    assert((wf as any).qualification === undefined, "Workflow ne s'auto-qualifie pas");
  });

  // =========================================================================
  // TEST O: No compatibility promotion
  // =========================================================================
  runTest("TEST O [ARCH-05]: No compatibility promotion (absence de règle reste UNVERIFIED)", () => {
    const doc = createDocument({
      documentId: "DOC_UNVERIFIED",
      projectId: "PROJ_UNVERIFIED",
    });

    const wf = createTechnicalWorkflowContext({
      projectId: "PROJ_UNVERIFIED",
      documentId: "DOC_UNVERIFIED",
    });

    const ues = deriveUniversalEntitiesFromWorkflow(wf, doc);
    assert(ues.length === 0, "Aucune entité fictive créée");
  });

  // =========================================================================
  // TEST P: Evidence isolation
  // =========================================================================
  runTest("TEST P [ARCH-05]: Evidence isolation (aucune preuve fabriquée dans le workflow)", () => {
    const wf = createTechnicalWorkflowContext({
      projectId: "PROJ_EV_SAFE",
      documentId: "DOC_EV_SAFE",
    });

    assert(wf.normativeRefs === undefined, "normativeRefs absent reste undefined");
  });

  // =========================================================================
  // TEST Q: Project / Workspace separation
  // =========================================================================
  runTest("TEST Q [ARCH-05]: Project / Workspace separation (Workspace ne devient pas source de vérité métier)", () => {
    const bundle = createDefaultProjectBundle({
      projectId: "PROJ_WS_SEP",
      projectName: "Test Séparation Workspace",
    });

    assert(bundle.workspace.projectId === "PROJ_WS_SEP", "Workspace pointe vers projectId");
    assert((bundle.workspace as any).lines === undefined, "Workspace ne stocke pas les lignes métier");
    assert((bundle.workspace as any).designPressure === undefined, "Workspace ne stocke pas les pressions");
  });

  // =========================================================================
  // TEST R: Save (Piping -> IsoProjectFile via adapter)
  // =========================================================================
  runTest("TEST R [ARCH-05]: Save (Piping Design -> IsoProjectFileV474 via adaptateur)", () => {
    const pipingDesign: PdiPipingDesignReference = {
      designId: "DES_001",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: [
        {
          pipingLineId: "LINE_GAS_24",
          tag: "24\"-G-100",
          service: "Gaz HP",
          designPressureBar: 70,
          nominalDiameterMm: 600,
          components: [],
        },
      ],
    };

    const docModel = adaptPipingDesignToIsometricModel(pipingDesign);
    const doc = createDocument({
      documentId: "DOC_ISO_SAVE",
      projectId: "PROJ_SAVE",
      model: docModel,
    });

    const bundle = createDefaultProjectBundle({
      projectId: "PROJ_SAVE",
      projectName: "Projet Sauvegarde",
      pressDesign: 70,
    });
    const docsMap = new Map();
    docsMap.set(doc.documentId, doc);

    const bundleWithDoc = {
      ...bundle,
      documents: docsMap,
      project: {
        ...bundle.project,
        activeDocumentId: doc.documentId,
      },
    };

    const file = projectBundleToIsoProjectFileV474(bundleWithDoc);
    assert(file.schemaVersion === "4.7.4", "schemaVersion 4.7.4 préservé");
    assert(file.model.lines.length === 1, "Ligne de tuyauterie exportée");
    assert(file.model.lines[0].lineNumber === "24\"-G-100", "Ligne exportée fidèlement");
    assert(file.project.pressDesign === 70, "Pression de calcul 70 bar exportée");
  });

  // =========================================================================
  // TEST S: Load (IsoProjectFile -> context)
  // =========================================================================
  runTest("TEST S [ARCH-05]: Load (IsoProjectFileV474 -> bundle et workflow)", () => {
    const rawFile = {
      schemaVersion: "4.7.4",
      exportedAt: new Date().toISOString(),
      project: {
        id: "PROJ_LOAD_01",
        ownerUid: "USER_01",
        name: "Projet Rechargé",
        wilaya: "Laghouat",
        pressDesign: 50,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      model: {
        lines: [
          {
            id: "L_REC",
            lineNumber: "L-50",
            service: "Gaz",
            dn: 50,
            nps: "2\"",
            material: "A106",
            pressureClass: "Class 300",
            color: "#3B82F6",
          },
        ],
        nodes: [{ id: "N_REC", name: "P1", x: 0, y: 0, z: 0, type: "normal", dn: 50 }],
        segments: [],
      },
      workspace: {
        showGrid: true,
        showDimensions: true,
        showPipeLabels: true,
        showLabels: true,
        showWelds: true,
        isoSnapStep: 0.5,
        viewport: { zoom: 1, panX: 0, panY: 0 },
      },
    } as unknown as IsoProjectFileV474;

    const bundle = isoProjectFileV474ToProjectBundle(rawFile);
    assert(bundle.project.projectId === "PROJ_LOAD_01", "projectId rechargé");
    assert(bundle.project.metadata.pressDesign === 50, "Pression 50 bar rechargée");

    const wf = createTechnicalWorkflowContext({
      projectId: bundle.project.projectId,
      documentId: bundle.project.activeDocumentId,
      initialState: "ISO_GENERATED",
      isRestoration: true,
    });
    assert(wf.state === "ISO_GENERATED", "Workflow initialisé dans l'état ISO_GENERATED via restauration");
  });

  // =========================================================================
  // TEST T: Schema (schemaVersion === "4.7.4")
  // =========================================================================
  runTest("TEST T [ARCH-05]: Schema (schemaVersion '4.7.4' strictement conservé)", () => {
    const bundle = createDefaultProjectBundle({
      projectId: "PROJ_SCHEMA_CHECK",
    });
    const file = projectBundleToIsoProjectFileV474(bundle);
    assert(file.schemaVersion === "4.7.4", "schemaVersion doit être exactement 4.7.4");
  });

  // =========================================================================
  // TEST U: No mutation (Immutability)
  // =========================================================================
  runTest("TEST U [ARCH-05]: No mutation (les adaptateurs ne mutent JAMAIS l'objet source)", () => {
    const sourceProcess: PdiProcessInputReference = Object.freeze({
      sourceId: "PID_IMMUTABLE",
      sourceType: "PID",
      lines: Object.freeze([
        Object.freeze({
          processLineId: "PL_IMM",
          lineNumber: "L-IMM",
          conditions: Object.freeze({
            operatingPressureBar: 16,
          }),
        }),
      ]),
    });

    const piping = adaptProcessInputToPipingDesign(sourceProcess);
    assert(sourceProcess.lines[0].lineNumber === "L-IMM", "Source non altérée");
    assert(piping.lines[0].tag === "L-IMM", "Cible générée");
  });

  // =========================================================================
  // TEST V: No loop (Flux orienté sans cycles incontrôlés)
  // =========================================================================
  runTest("TEST V [ARCH-05]: No loop (Transitions de workflow dirigées et validées)", () => {
    const wf = createTechnicalWorkflowContext({
      projectId: "PROJ_FLOW",
      documentId: "DOC_FLOW",
      initialState: "DRAFT",
    });

    assert(isValidWorkflowTransition("DRAFT", "PROCESS_DEFINED") === true, "DRAFT -> PROCESS_DEFINED permis");
    assert(isValidWorkflowTransition("DRAFT", "READY_FOR_DELIVERABLE") === false, "DRAFT -> READY_FOR_DELIVERABLE interdit");

    const wfStep1 = transitionTechnicalWorkflow(wf, "PROCESS_DEFINED");
    assert(wfStep1.state === "PROCESS_DEFINED", "Transition vers PROCESS_DEFINED effectuée");
    assert(wfStep1.transitions.length === 2, "Historique de transitions tracé");
  });

  // =========================================================================
  // TEST W: 3D isolation (Three.js reste une représentation)
  // =========================================================================
  runTest("TEST W [ARCH-05]: 3D isolation (le viewer 3D ne crée pas de données métier)", () => {
    const doc = createDocument({
      documentId: "DOC_3D_ISO",
      projectId: "PROJ_3D",
      kind: "VIEW_3D",
      model: {
        nodes: [{ id: "N_3D", name: "P3D", x: 100, y: 200, z: 300, type: "normal", dn: 100 }],
      },
    });

    const isoRef = adaptIsometricDocumentToWorkflowReference(doc);
    assert(isoRef.has3dCoordinates === true, "Coordonnées 3D détectées");
    // Vérifie qu'aucune métadonnée métier fictive n'est injectée
    const entities = deriveUniversalEntitiesFromDocument(doc);
    assert(entities[0].geometry.x === 100, "X conservé");
    assert(entities[0].geometry.y === 200, "Y conservé");
    assert(entities[0].geometry.z === 300, "Z conservé");
    assert(entities[0].pn.rating === undefined, "Pas de rating 3D injecté");
  });

  // =========================================================================
  // TEST X: 2D isolation (CAD 2D reste une représentation)
  // =========================================================================
  runTest("TEST X [ARCH-05]: 2D isolation (les calques 2D ne deviennent pas vérité métier)", () => {
    const doc = createDocument({
      documentId: "DOC_CAD_ISO",
      projectId: "PROJ_CAD",
      kind: "CAD_2D",
    });

    assert(doc.model.cad2d.layers.length === 3, "Calques 2D par défaut initialisés");
    assert(doc.model.nodes.length === 0, "Aucun nœud métier injecté");
  });

  // =========================================================================
  // TEST Y: Legacy compatibility
  // =========================================================================
  runTest("TEST Y [ARCH-05]: Legacy compatibility (anciens documents v4.7.4 restent compatibles)", () => {
    const legacyRaw = {
      schemaVersion: "4.7.4",
      project: {
        id: "PROJ_OLD_01",
        name: "Projet Ancien Format",
        wilaya: "Ouargla",
      },
      model: {
        nodes: [{ id: "N_OLD", name: "P_OLD", x: 0, y: 0, z: 0, type: "normal" }],
        segments: [],
      },
      workspace: {},
    };

    const bundle = isoProjectFileV474ToProjectBundle(legacyRaw);
    assert(bundle.project.projectId === "PROJ_OLD_01", "Projet legacy accepté");
    assert(bundle.project.metadata.pressDesign === undefined, "Pas de pression inventée pour le legacy");
  });

  // =========================================================================
  // ARCH-05-FIX-01: TESTS AA TO AO — NON-INVENTION ET NON-FABRICATION DE VALEURS
  // =========================================================================

  // TEST AA: Piping line sans DN
  runTest("TEST AA [ARCH-05-FIX-01]: Piping line sans DN produit dn === undefined (jamais 0)", () => {
    const pipingDesign: PdiPipingDesignReference = {
      designId: "DES_NO_DN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: [
        {
          pipingLineId: "PL_NO_DN",
          tag: "L-NO-DN",
          // pas de nominalDiameterMm
          components: [],
        },
      ],
    };
    const model = adaptPipingDesignToIsometricModel(pipingDesign);
    assert(model.lines[0].dn === undefined, "dn absent doit être undefined");
    assert(model.lines[0].dn !== 0, "dn absent ne doit JAMAIS être 0");
  });

  // TEST AB: Piping line sans NPS
  runTest("TEST AB [ARCH-05-FIX-01]: Piping line sans NPS produit nps === undefined (jamais \"\")", () => {
    const pipingDesign: PdiPipingDesignReference = {
      designId: "DES_NO_NPS",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: [
        {
          pipingLineId: "PL_NO_NPS",
          tag: "L-NO-NPS",
          components: [],
        },
      ],
    };
    const model = adaptPipingDesignToIsometricModel(pipingDesign);
    assert(model.lines[0].nps === undefined, "nps absent doit être undefined");
    assert(model.lines[0].nps !== "", "nps absent ne doit JAMAIS être une chaîne vide");
  });

  // TEST AC: Piping line sans matériau
  runTest("TEST AC [ARCH-05-FIX-01]: Piping line sans matériau produit material === undefined (jamais \"\")", () => {
    const pipingDesign: PdiPipingDesignReference = {
      designId: "DES_NO_MAT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: [
        {
          pipingLineId: "PL_NO_MAT",
          tag: "L-NO-MAT",
          components: [],
        },
      ],
    };
    const model = adaptPipingDesignToIsometricModel(pipingDesign);
    assert(model.lines[0].material === undefined, "material absent doit être undefined");
    assert(model.lines[0].material !== "", "material absent ne doit JAMAIS être une chaîne vide");
  });

  // TEST AD: Piping line sans pipingSpec
  runTest("TEST AD [ARCH-05-FIX-01]: Piping line sans pipingSpec produit pressureClass === undefined", () => {
    const pipingDesign: PdiPipingDesignReference = {
      designId: "DES_NO_SPEC",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: [
        {
          pipingLineId: "PL_NO_SPEC",
          tag: "L-NO-SPEC",
          components: [],
        },
      ],
    };
    const model = adaptPipingDesignToIsometricModel(pipingDesign);
    assert(model.lines[0].pressureClass === undefined, "pressureClass absent doit être undefined");
    assert(model.lines[0].pressureClass !== "", "pressureClass absent ne doit JAMAIS être une chaîne vide");
  });

  // TEST AE: Piping line sans service
  runTest("TEST AE [ARCH-05-FIX-01]: Piping line sans service produit service === undefined", () => {
    const pipingDesign: PdiPipingDesignReference = {
      designId: "DES_NO_SERV",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: [
        {
          pipingLineId: "PL_NO_SERV",
          tag: "L-NO-SERV",
          components: [],
        },
      ],
    };
    const model = adaptPipingDesignToIsometricModel(pipingDesign);
    assert(model.lines[0].service === undefined, "service absent doit être undefined");
    assert(model.lines[0].service !== "", "service absent ne doit JAMAIS être une chaîne vide");
  });

  // TEST AF: Piping line sans design pressure
  runTest("TEST AF [ARCH-05-FIX-01]: Piping line sans design pressure produit designPressure === undefined", () => {
    const pipingDesign: PdiPipingDesignReference = {
      designId: "DES_NO_DP",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: [
        {
          pipingLineId: "PL_NO_DP",
          tag: "L-NO-DP",
          components: [],
        },
      ],
    };
    const model = adaptPipingDesignToIsometricModel(pipingDesign);
    assert(model.lines[0].designPressure === undefined, "designPressure absent doit être undefined");
    assert(model.lines[0].designPressure !== 0, "designPressure ne doit pas valoir 0 par défaut");
    assert(model.lines[0].designPressure !== 40, "designPressure ne doit pas valoir 40 par défaut");
  });

  // TEST AG: Piping line sans design temperature
  runTest("TEST AG [ARCH-05-FIX-01]: Piping line sans design temperature produit designTemperature === undefined", () => {
    const pipingDesign: PdiPipingDesignReference = {
      designId: "DES_NO_DT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: [
        {
          pipingLineId: "PL_NO_DT",
          tag: "L-NO-DT",
          components: [],
        },
      ],
    };
    const model = adaptPipingDesignToIsometricModel(pipingDesign);
    assert(model.lines[0].designTemperature === undefined, "designTemperature absent doit être undefined");
    assert(model.lines[0].designTemperature !== 0, "designTemperature ne doit pas valoir 0 par défaut");
  });

  // TEST AH: Aucune valeur technique 0 n'est introduite pour remplacer une absence
  runTest("TEST AH [ARCH-05-FIX-01]: Aucune valeur technique 0 n'est introduite pour remplacer une absence", () => {
    const processInput: PdiProcessInputReference = {
      sourceId: "PID_ZERO_CHECK",
      sourceType: "PID",
      lines: [
        {
          processLineId: "PL_ZERO",
          lineNumber: "L-ZERO",
        },
      ],
    };
    const piping = adaptProcessInputToPipingDesign(processInput);
    assert(piping.lines[0].nominalDiameterMm === undefined, "nominalDiameterMm absent n'est pas 0");
    assert(piping.lines[0].designPressureBar === undefined, "designPressureBar absent n'est pas 0");
    assert(piping.lines[0].designTemperatureC === undefined, "designTemperatureC absent n'est pas 0");
  });

  // TEST AI: Aucune chaîne vide n'est utilisée pour représenter une donnée technique absente
  runTest("TEST AI [ARCH-05-FIX-01]: Aucune chaîne vide n'est utilisée pour représenter une donnée technique absente", () => {
    const processInput: PdiProcessInputReference = {
      sourceId: "PID_EMPTY_STR_CHECK",
      sourceType: "PID",
      lines: [
        {
          processLineId: "PL_EMPTY",
          lineNumber: "L-EMPTY",
        },
      ],
    };
    const piping = adaptProcessInputToPipingDesign(processInput);
    assert(piping.lines[0].service === undefined, "service absent n'est pas \"\"");
    assert(piping.lines[0].materialGrade === undefined, "materialGrade absent n'est pas \"\"");
    assert(piping.lines[0].pipingSpecId === undefined, "pipingSpecId absent n'est pas \"\"");
  });

  // TEST AJ: Un DN explicite est conservé exactement
  runTest("TEST AJ [ARCH-05-FIX-01]: Un DN explicite est conservé exactement", () => {
    const processInput: PdiProcessInputReference = {
      sourceId: "PID_DN_EXP",
      sourceType: "PID",
      lines: [
        {
          processLineId: "PL_DN300",
          lineNumber: "L-DN300",
          nominalDiameterMm: 300,
        },
      ],
    };
    const piping = adaptProcessInputToPipingDesign(processInput);
    assert(piping.lines[0].nominalDiameterMm === 300, "DN 300 conservé fidèlement");
    const model = adaptPipingDesignToIsometricModel(piping);
    assert(model.lines[0].dn === 300, "DN 300 transporté dans le modèle isométrique");
  });

  // TEST AK: Un NPS explicite est conservé exactement
  runTest("TEST AK [ARCH-05-FIX-01]: Un NPS explicite est conservé exactement sans conversion", () => {
    const pipingDesign: PdiPipingDesignReference = {
      designId: "DES_NPS_EXP",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: [
        {
          pipingLineId: "PL_NPS_12",
          tag: "L-12INCH",
          nominalDiameterInch: "12\"",
          components: [],
        },
      ],
    };
    const model = adaptPipingDesignToIsometricModel(pipingDesign);
    assert(model.lines[0].nps === "12\"", "NPS 12\" explicite transporté");
    assert(model.lines[0].dn === undefined, "DN reste undefined car non fourni (pas de conversion NPS -> DN)");
  });

  // TEST AL: Un matériau explicite est conservé exactement
  runTest("TEST AL [ARCH-05-FIX-01]: Un matériau explicite est conservé exactement", () => {
    const pipingDesign: PdiPipingDesignReference = {
      designId: "DES_MAT_EXP",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: [
        {
          pipingLineId: "PL_MAT_X70",
          tag: "L-X70",
          materialGrade: "API 5L X70",
          components: [],
        },
      ],
    };
    const model = adaptPipingDesignToIsometricModel(pipingDesign);
    assert(model.lines[0].material === "API 5L X70", "Matériau explicite transporté");
  });

  // TEST AM: Un pipingSpec explicite est conservé comme référence, sans qualification normative automatique
  runTest("TEST AM [ARCH-05-FIX-01]: Un pipingSpec explicite est conservé comme référence déclarée", () => {
    const processInput: PdiProcessInputReference = {
      sourceId: "PID_PMS_EXP",
      sourceType: "PID",
      lines: [
        {
          processLineId: "PL_PMS",
          lineNumber: "L-PMS",
          pmsReference: "PMS-GAZ-600",
        },
      ],
    };
    const piping = adaptProcessInputToPipingDesign(processInput);
    assert(piping.lines[0].pipingSpecId === "PMS-GAZ-600", "pmsReference transporté comme référence");
    assert((piping.lines[0] as any).isCompliant === undefined, "Pas d'auto-certification");
  });

  // TEST AN: Aucune conversion DN → NPS/OD/Schedule
  runTest("TEST AN [ARCH-05-FIX-01]: Aucune conversion dimensionnelle implicite DN -> NPS/OD/Schedule", () => {
    const node: IsoNode = {
      id: "N_NO_CONV",
      name: "Point Test",
      x: 0,
      y: 0,
      z: 0,
      type: "normal",
      dn: 50,
    };
    const doc = createDocument({
      documentId: "DOC_NO_CONV",
      projectId: "PROJ_NO_CONV",
      model: { nodes: [node] },
    });
    const entities = deriveUniversalEntitiesFromDocument(doc);
    assert(entities[0].dn.dn === 50, "DN 50 transporté");
    assert(entities[0].dn.inch === undefined, "NPS inch doit être undefined");
    assert(entities[0].dn.outerDiameterMm === undefined, "outerDiameterMm doit être undefined");
    assert(entities[0].material.schedule === undefined, "schedule doit être undefined");
  });

  // TEST AO: Aucune promotion normative
  runTest("TEST AO [ARCH-05-FIX-01]: Aucune promotion normative (WorkflowContext ne s'auto-qualifie pas)", () => {
    const wf = createTechnicalWorkflowContext({
      projectId: "PROJ_NO_PROM",
      documentId: "DOC_NO_PROM",
      initialState: "PIPING_DESIGN_STARTED",
    });
    assert((wf as any).status === undefined, "WorkflowContext ne possède pas de champ 'status' auto-certifié");
    assert((wf as any).isCompliant === undefined, "WorkflowContext ne possède pas de champ 'isCompliant'");
    assert((wf as any).qualificationStatus === undefined, "WorkflowContext ne s'auto-qualifie pas");
  });

  // =========================================================================
  // TEST Z1: Non-régression NORM-01..14
  // =========================================================================
  runTest("TEST Z1 [ARCH-05]: Non-régression globale NORM-01..14", () => {
    const res = runNormativeGlobalIntegrationTests();
    assert(res.success === true, `NORM-01..14 échoué`);
  });

  // =========================================================================
  // TEST Z2: Non-régression ARCH-01
  // =========================================================================
  runTest("TEST Z2 [ARCH-05]: Non-régression globale ARCH-01", () => {
    const res = runArch01IsometricNormativeBridgeTests();
    assert(res.success === true, `ARCH-01 échoué`);
  });

  // =========================================================================
  // TEST Z3: Non-régression ARCH-02
  // =========================================================================
  runTest("TEST Z3 [ARCH-05]: Non-régression globale ARCH-02", () => {
    const res = runArch02PmsAuthorityUnificationTests();
    assert(res.success === true, `ARCH-02 échoué`);
  });

  // =========================================================================
  // TEST Z4: Non-régression ARCH-03
  // =========================================================================
  runTest("TEST Z4 [ARCH-05]: Non-régression globale ARCH-03", () => {
    const res = runArch03UniversalModelTests();
    assert(res.success === true, `ARCH-03 échoué`);
  });

  // =========================================================================
  // TEST Z5: Non-régression ARCH-04 & ARCH-04-FIX-01
  // =========================================================================
  runTest("TEST Z5 [ARCH-05]: Non-régression globale ARCH-04 & ARCH-04-FIX-01", () => {
    const res = runArch04ProjectWorkspaceDataTests();
    assert(res.success === true, `ARCH-04 échoué`);
  });

  return Object.freeze({
    success: testsFailed === 0 && testsRun >= 45,
    testsRun,
    testsPassed,
    testsFailed,
    results: Object.freeze(results),
    failures: Object.freeze(failures),
  });
}
