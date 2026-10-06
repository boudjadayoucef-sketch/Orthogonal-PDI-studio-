/**
 * PDI NORMATIVE & ARCHITECTURE TEST SUITE
 * Reference: MASTER-ARCH-06 (Component Selection + Catalog + Compatibility)
 *
 * Tests unitaires et d'intégration couvrant les critères AC-01 à AC-20
 * et garantissant la non-régression de ARCH-01..05 et NORM-01..14.
 */

import {
  createCatalogComponent,
  createCatalogRegistry,
  type PdiCatalogComponent,
  type PdiCatalogComponentType,
} from "../../model/pdiCatalogComponent";
import {
  checkComponentCompatibility,
  selectCatalogComponent,
  adaptCatalogComponentToUniversalEntity,
  adaptUniversalEntityToCatalogComponent,
  adaptTrouvayCauvinCatalogToPdiCatalog,
  adaptCatalogComponentToCandidate,
  type PdiComponentSelectionRequest,
  type PdiPipingSpecConstraint,
} from "../../model/pdiCatalogSelectionAdapter";
import { runNormativeGlobalIntegrationTests } from "./normativeGlobalIntegrationTests";
import { runArch01IsometricNormativeBridgeTests } from "./arch01IsometricNormativeBridgeTests";
import { runArch02PmsAuthorityUnificationTests } from "./arch02PmsAuthorityUnificationTests";
import { runArch03UniversalModelTests } from "./arch03UniversalModelTests";
import { runArch04ProjectWorkspaceDataTests } from "./arch04ProjectWorkspaceDataTests";
import { runArch05TechnicalWorkflowTests } from "./arch05TechnicalWorkflowTests";

export interface Arch06TestResult {
  readonly success: boolean;
  readonly testsRun: number;
  readonly testsPassed: number;
  readonly testsFailed: number;
  readonly failures: readonly string[];
}

export function runArch06ComponentSelectionCompatibilityTests(): Arch06TestResult {
  let testsRun = 0;
  let testsPassed = 0;
  let testsFailed = 0;
  const failures: string[] = [];

  function assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  function runTest(name: string, fn: () => void) {
    testsRun++;
    try {
      fn();
      testsPassed++;
    } catch (err: any) {
      testsFailed++;
      failures.push(`${name}: ${err.message || String(err)}`);
    }
  }

  // =========================================================================
  // AC-01 : Un composant catalogue correctement renseigné peut être chargé.
  // =========================================================================
  runTest("TEST AC-01: Composant catalogue complet chargé correctement", () => {
    const comp = createCatalogComponent({
      id: "SYNTH_CAT_PIPE_001",
      componentType: "PIPE",
      description: "Synthetic Test Carbon Steel Pipe",
      shortName: "Pipe Synth",
      manufacturer: "Synthetic Forge",
      manufacturerPartNumber: "SF-P-100",
      standard: "SYNTHETIC_STD_B3610",
      material: "SYNTH_A106_GRB",
      nominalDiameter: 100,
      nominalDiameterUnit: "mm",
      nominalSize: "4\"",
      outerDiameterMm: 114.3,
      pressureClass: "Class 300",
      schedule: "Sch 40",
      wallThicknessMm: 6.02,
      connectionType: "butt_weld",
      weightKg: 16.07,
      evidenceIds: ["EVID_SYNTH_01"],
    });

    assert(comp.id === "SYNTH_CAT_PIPE_001", "ID conservé");
    assert(comp.componentType === "PIPE", "Type PIPE");
    assert(comp.nominalDiameter === 100, "DN 100");
    assert(comp.nominalSize === "4\"", "NPS 4\"");
    assert(comp.outerDiameterMm === 114.3, "OD 114.3");
    assert(comp.material === "SYNTH_A106_GRB", "Material grade conservé");
    assert(comp.pressureClass === "Class 300", "Class 300 conservé");
    assert(comp.connectionType === "butt_weld", "Connexion butt_weld");
    assert(Array.isArray(comp.evidenceIds) && comp.evidenceIds[0] === "EVID_SYNTH_01", "Evidence ID conservé");
  });

  // =========================================================================
  // AC-02 : Propriétés techniques absentes restent undefined.
  // =========================================================================
  runTest("TEST AC-02: Propriétés techniques absentes restent strictement undefined", () => {
    const comp = createCatalogComponent({
      id: "SYNTH_CAT_MINIMAL_01",
      componentType: "VALVE",
      description: "Minimal Valve Without Technical Specs",
    });

    assert(comp.id === "SYNTH_CAT_MINIMAL_01", "ID conservé");
    assert(comp.nominalDiameter === undefined, "nominalDiameter est undefined");
    assert(comp.nominalSize === undefined, "nominalSize est undefined");
    assert(comp.outerDiameterMm === undefined, "outerDiameterMm est undefined");
    assert(comp.material === undefined, "material est undefined");
    assert(comp.pressureClass === undefined, "pressureClass est undefined");
    assert(comp.schedule === undefined, "schedule est undefined");
    assert(comp.wallThicknessMm === undefined, "wallThicknessMm est undefined");
    assert(comp.faceType === undefined, "faceType est undefined");
    assert(comp.connectionType === undefined, "connectionType est undefined");
    assert(comp.weightKg === undefined, "weightKg est undefined");
    assert(comp.evidenceIds === undefined, "evidenceIds est undefined");
  });

  // =========================================================================
  // AC-03 : Aucun DN par défaut (pas de 0 ni de DN50 inventé).
  // =========================================================================
  runTest("TEST AC-03: Aucun DN par défaut", () => {
    const comp = createCatalogComponent({
      id: "SYNTH_NO_DN_01",
      componentType: "ELBOW",
    });

    assert(comp.nominalDiameter === undefined, "DN ne doit pas valoir 0 ou 50");
    assert(comp.nominalDiameter !== 0, "DN !== 0");
  });

  // =========================================================================
  // AC-04 : Aucun NPS par défaut (pas de chaîne vide ni de 2\" inventé).
  // =========================================================================
  runTest("TEST AC-04: Aucun NPS par défaut", () => {
    const comp = createCatalogComponent({
      id: "SYNTH_NO_NPS_01",
      componentType: "TEE",
    });

    assert(comp.nominalSize === undefined, "NPS ne doit pas être inventé");
    assert(comp.nominalSize !== "", "NPS !== ''");
  });

  // =========================================================================
  // AC-05 : Aucun Class/PN par défaut (pas de Class 150 ou PN16 inventé).
  // =========================================================================
  runTest("TEST AC-05: Aucun Class/PN par défaut", () => {
    const comp = createCatalogComponent({
      id: "SYNTH_NO_CLASS_01",
      componentType: "FLANGE",
    });

    assert(comp.pressureClass === undefined, "pressureClass ne doit pas valoir Class 150 ou PN16");
    assert(comp.pressureClass !== "", "pressureClass !== ''");
  });

  // =========================================================================
  // AC-06 : Aucune conversion DN ↔ NPS.
  // =========================================================================
  runTest("TEST AC-06: Aucune conversion implicite DN ↔ NPS", () => {
    const compDnOnly = createCatalogComponent({
      id: "SYNTH_DN_ONLY",
      componentType: "PIPE",
      nominalDiameter: 50,
    });
    assert(compDnOnly.nominalDiameter === 50, "DN est 50");
    assert(compDnOnly.nominalSize === undefined, "NPS ne doit pas être automatiquement calculé comme 2\"");

    const compNpsOnly = createCatalogComponent({
      id: "SYNTH_NPS_ONLY",
      componentType: "PIPE",
      nominalSize: "2\"",
    });
    assert(compNpsOnly.nominalSize === "2\"", "NPS est 2\"");
    assert(compNpsOnly.nominalDiameter === undefined, "DN ne doit pas être automatiquement calculé comme 50");
  });

  // =========================================================================
  // AC-07 : Aucune conversion Class ↔ PN.
  // =========================================================================
  runTest("TEST AC-07: Aucune conversion implicite Class ↔ PN", () => {
    const compClassOnly = createCatalogComponent({
      id: "SYNTH_CLASS_ONLY",
      componentType: "FLANGE",
      pressureClass: "Class 150",
    });
    assert(compClassOnly.pressureClass === "Class 150", "Class 150 préservé");

    const compPnOnly = createCatalogComponent({
      id: "SYNTH_PN_ONLY",
      componentType: "FLANGE",
      pressureClass: "PN16",
    });
    assert(compPnOnly.pressureClass === "PN16", "PN16 préservé");

    // Vérification de compatibilité entre Class 150 et PN16 -> INCOMPATIBLE
    const compat = checkComponentCompatibility(compClassOnly, compPnOnly);
    assert(compat.overallStatus === "INCOMPATIBLE" || compat.overallStatus === "INSUFFICIENT_DATA", "Pas d'équivalence Class 150 = PN16");
  });

  // =========================================================================
  // AC-08 : Deux composants compatibles explicitement identifiés retournent COMPATIBLE.
  // =========================================================================
  runTest("TEST AC-08: Deux composants compatibles retournent COMPATIBLE", () => {
    const pipe = createCatalogComponent({
      id: "SYNTH_COMPAT_PIPE_01",
      componentType: "PIPE",
      nominalDiameter: 100,
      nominalSize: "4\"",
      pressureClass: "Class 300",
      material: "SYNTH_A106_B",
      connectionType: "butt_weld",
      standard: "SYNTH_ASME_B3610",
      evidenceIds: ["EVID_SYNTH_01"],
    });

    const elbow = createCatalogComponent({
      id: "SYNTH_COMPAT_ELBOW_01",
      componentType: "ELBOW",
      nominalDiameter: 100,
      nominalSize: "4\"",
      pressureClass: "Class 300",
      material: "SYNTH_A106_B",
      connectionType: "butt_weld",
      standard: "SYNTH_ASME_B169",
      evidenceIds: ["EVID_SYNTH_02"],
    });

    const res = checkComponentCompatibility(pipe, elbow);
    assert(res.overallStatus === "COMPATIBLE", "Status COMPATIBLE");
    assert(res.dimensions.find((d) => d.dimension === "connection")?.status === "COMPATIBLE", "Connexion compatible");
    assert(res.dimensions.find((d) => d.dimension === "nominalSize")?.status === "COMPATIBLE", "DN compatible");
    assert(res.dimensions.find((d) => d.dimension === "pressureRating")?.status === "COMPATIBLE", "Rating compatible");
    assert(res.dimensions.find((d) => d.dimension === "material")?.status === "COMPATIBLE", "Material compatible");
    assert(res.evidenceIds.includes("EVID_SYNTH_01"), "Evidence 1 incluse");
    assert(res.evidenceIds.includes("EVID_SYNTH_02"), "Evidence 2 incluse");
  });

  // =========================================================================
  // AC-09 : Deux composants explicitement incompatibles retournent INCOMPATIBLE.
  // =========================================================================
  runTest("TEST AC-09: Deux composants de diamètres différents retournent INCOMPATIBLE", () => {
    const pipe100 = createCatalogComponent({
      id: "SYNTH_PIPE_DN100",
      componentType: "PIPE",
      nominalDiameter: 100,
      connectionType: "butt_weld",
      pressureClass: "Class 150",
      material: "SYNTH_CS",
    });

    const pipe150 = createCatalogComponent({
      id: "SYNTH_PIPE_DN150",
      componentType: "PIPE",
      nominalDiameter: 150,
      connectionType: "butt_weld",
      pressureClass: "Class 150",
      material: "SYNTH_CS",
    });

    const res = checkComponentCompatibility(pipe100, pipe150);
    assert(res.overallStatus === "INCOMPATIBLE", "Status global INCOMPATIBLE");
    const dim = res.dimensions.find((d) => d.dimension === "nominalSize");
    assert(dim?.status === "INCOMPATIBLE", "Dimension nominalSize INCOMPATIBLE");
  });

  // =========================================================================
  // AC-10 : Données insuffisantes → UNVERIFIED ou INSUFFICIENT_DATA.
  // =========================================================================
  runTest("TEST AC-10: Données techniques incomplètes retournent INSUFFICIENT_DATA ou UNVERIFIED", () => {
    const compA = createCatalogComponent({
      id: "SYNTH_INCOMPLETE_A",
      componentType: "PIPE",
      nominalDiameter: 100,
      // connectionType, material, pressureClass absents
    });

    const compB = createCatalogComponent({
      id: "SYNTH_INCOMPLETE_B",
      componentType: "VALVE",
      nominalDiameter: 100,
      // connectionType, material, pressureClass absents
    });

    const res = checkComponentCompatibility(compA, compB);
    assert(
      res.overallStatus === "INSUFFICIENT_DATA" || res.overallStatus === "UNVERIFIED",
      "Doit être INSUFFICIENT_DATA ou UNVERIFIED"
    );
    assert(res.overallStatus !== "COMPATIBLE", "Ne doit jamais être COMPATIBLE");
    assert(res.overallStatus !== "INCOMPATIBLE", "Ne doit pas être faussement INCOMPATIBLE");
  });

  // =========================================================================
  // AC-11 : Aucun evidenceId inventé.
  // =========================================================================
  runTest("TEST AC-11: Aucun evidenceId inventé", () => {
    const comp = createCatalogComponent({
      id: "SYNTH_NO_EVID_01",
      componentType: "PIPE",
      nominalDiameter: 80,
    });

    assert(comp.evidenceIds === undefined, "evidenceIds reste undefined");

    const comp2 = createCatalogComponent({
      id: "SYNTH_NO_EVID_02",
      componentType: "PIPE",
      nominalDiameter: 80,
    });

    const compat = checkComponentCompatibility(comp, comp2);
    assert(compat.evidenceIds.length === 0, "Aucun evidenceId inventé par le moteur de compatibilité");
  });

  // =========================================================================
  // AC-12 : Aucune qualification normative inventée à partir d'un simple nom de matériau.
  // =========================================================================
  runTest("TEST AC-12: Pas d'auto-qualification sur sous-chaîne matière", () => {
    const compA = createCatalogComponent({
      id: "SYNTH_MAT_CS1",
      componentType: "PIPE",
      nominalDiameter: 50,
      connectionType: "butt_weld",
      pressureClass: "Class 150",
      material: "CS Carbon Steel Grade X",
    });

    const compB = createCatalogComponent({
      id: "SYNTH_MAT_CS2",
      componentType: "ELBOW",
      nominalDiameter: 50,
      connectionType: "butt_weld",
      pressureClass: "Class 150",
      material: "CS Carbon Steel Grade Y",
    });

    const compat = checkComponentCompatibility(compA, compB);
    const matDim = compat.dimensions.find((d) => d.dimension === "material");
    assert(matDim?.status === "UNVERIFIED", "Matières différentes mais contenant toutes deux 'CS' doivent être UNVERIFIED");
    assert(matDim?.status !== "COMPATIBLE", "Ne doit pas s'auto-qualifier COMPATIBLE");
  });

  // =========================================================================
  // AC-13 : La Piping Specification est utilisée comme contrainte lorsqu'elle est disponible.
  // =========================================================================
  runTest("TEST AC-13: Piping Specification appliquée comme contrainte de sélection", () => {
    const registry = createCatalogRegistry([
      createCatalogComponent({
        id: "SYNTH_VALVE_CL150",
        componentType: "VALVE",
        nominalDiameter: 100,
        pressureClass: "Class 150",
        material: "SYNTH_CS_A",
      }),
      createCatalogComponent({
        id: "SYNTH_VALVE_CL300",
        componentType: "VALVE",
        nominalDiameter: 100,
        pressureClass: "Class 300",
        material: "SYNTH_CS_A",
      }),
    ]);

    const specConstraint: PdiPipingSpecConstraint = {
      pipingSpecId: "PMS_SYNTH_300",
      pressureClass: "Class 300",
      materialGrade: "SYNTH_CS_A",
      evidenceIds: ["EVID_PMS_300"],
    };

    const selReq: PdiComponentSelectionRequest = {
      componentType: "VALVE",
      nominalDiameter: 100,
      pipingSpecConstraint: specConstraint,
    };

    const selRes = selectCatalogComponent(registry, selReq);
    assert(selRes.status === "SELECTED", "Statut SELECTED");
    assert(selRes.selectedComponent?.id === "SYNTH_VALVE_CL300", "Seule la vanne Class 300 est retenue");
    assert(selRes.pipingSpecConstraintsApplied === true, "Contraintes PMS appliquées");
    assert(selRes.evidenceIds.includes("EVID_PMS_300"), "Preuve PMS conservée");
  });

  // =========================================================================
  // AC-14 : Absence de Piping Specification → pas de valeur par défaut inventée.
  // =========================================================================
  runTest("TEST AC-14: Absence de Piping Spec ne génère pas de spec par défaut", () => {
    const registry = createCatalogRegistry([
      createCatalogComponent({
        id: "SYNTH_COMP_A",
        componentType: "PIPE",
        nominalDiameter: 50,
      }),
    ]);

    const req: PdiComponentSelectionRequest = {
      componentType: "PIPE",
      nominalDiameter: 50,
      // pas de pipingSpecConstraint
    };

    const res = selectCatalogComponent(registry, req);
    assert(res.pipingSpecConstraintsApplied === false, "Pas de contrainte PMS appliquée");
  });

  // =========================================================================
  // AC-15 : Le Universal Model n'est pas utilisé comme source d'autorité normative.
  // =========================================================================
  runTest("TEST AC-15: Universal Model n'auto-certifie pas de conformité normative", () => {
    const comp = createCatalogComponent({
      id: "SYNTH_FOR_UNIVERSAL",
      componentType: "PIPE",
      nominalDiameter: 100,
      pressureClass: "Class 150",
      material: "SYNTH_MAT",
    });

    const universalEntity = adaptCatalogComponentToUniversalEntity(comp);
    assert(universalEntity.identity.source === "CATALOG", "Source CATALOG");
    assert(universalEntity.dn.dn === 100, "DN conservé");
    // L'adaptation ne fabrique aucun calcul normatif
    assert(universalEntity.pn.testPressureBar === undefined, "Pression d'épreuve non inventée");
  });

  // =========================================================================
  // AC-16 : Le catalogue n'est pas utilisé comme preuve normative.
  // =========================================================================
  runTest("TEST AC-16: Présence au catalogue ≠ Preuve normative automatique", () => {
    const tcCatalog = adaptTrouvayCauvinCatalogToPdiCatalog();
    assert(tcCatalog.length > 0, "Catalogue Trouvay & Cauvin converti");

    const sample = tcCatalog[0];
    assert(sample.id.length > 0, "ID valide");
    assert(sample.evidenceIds === undefined, "Aucun evidenceId normatif fabriqué pour un composant catalogue");
  });

  // =========================================================================
  // AC-17 : Les identifiants catalogue restent stables.
  // =========================================================================
  runTest("TEST AC-17: Stabilité des identifiants catalogue", () => {
    const id = "SYNTH_STABLE_ID_001";
    const comp = createCatalogComponent({
      id,
      componentType: "FLANGE",
      nominalDiameter: 200,
    });

    const uEntity = adaptCatalogComponentToUniversalEntity(comp);
    const compBack = adaptUniversalEntityToCatalogComponent(uEntity);

    assert(comp.id === id, "ID initial");
    assert(uEntity.identity.id === `entity_${id}`, "ID Universal dérivé de manière stable");
    assert(compBack.id === `entity_${id}`, "ID restauré de façon stable");
  });

  // =========================================================================
  // AC-18 : Aucune mutation des données source.
  // =========================================================================
  runTest("TEST AC-18: Immutabilité totale des données source", () => {
    const compA = createCatalogComponent({
      id: "SYNTH_FROZEN_A",
      componentType: "PIPE",
      nominalDiameter: 50,
      connectionType: "butt_weld",
    });

    const compB = createCatalogComponent({
      id: "SYNTH_FROZEN_B",
      componentType: "PIPE",
      nominalDiameter: 50,
      connectionType: "butt_weld",
    });

    const strA = JSON.stringify(compA);
    const strB = JSON.stringify(compB);

    checkComponentCompatibility(compA, compB);

    assert(JSON.stringify(compA) === strA, "compA non muté");
    assert(JSON.stringify(compB) === strB, "compB non muté");
  });

  // =========================================================================
  // AC-19 : Sélection répétée avec les mêmes inputs → résultat déterministe.
  // =========================================================================
  runTest("TEST AC-19: Déterminisme strict de la sélection de composants", () => {
    const registry = createCatalogRegistry([
      createCatalogComponent({ id: "CAND_B", componentType: "ELBOW", nominalDiameter: 100 }),
      createCatalogComponent({ id: "CAND_A", componentType: "ELBOW", nominalDiameter: 100 }),
    ]);

    const req: PdiComponentSelectionRequest = {
      componentType: "ELBOW",
      nominalDiameter: 100,
    };

    const run1 = selectCatalogComponent(registry, req);
    const run2 = selectCatalogComponent(registry, req);
    const run3 = selectCatalogComponent(registry, req);

    assert(run1.status === "ELIGIBLE", "Statut ELIGIBLE");
    assert(run1.selectedComponent?.id === run2.selectedComponent?.id, "run1 === run2");
    assert(run2.selectedComponent?.id === run3.selectedComponent?.id, "run2 === run3");
    assert(run1.selectedComponent?.id === "CAND_A", "Tri alphabétique déterministe CAND_A en tête");
  });

  // =========================================================================
  // AC-20 : Un changement de composant entraîne une nouvelle évaluation de compatibilité.
  // =========================================================================
  runTest("TEST AC-20: Réévaluation dynamique lors du changement de composant", () => {
    const pipe50 = createCatalogComponent({
      id: "SYNTH_P50",
      componentType: "PIPE",
      nominalDiameter: 50,
      connectionType: "butt_weld",
    });

    const elbow50 = createCatalogComponent({
      id: "SYNTH_E50",
      componentType: "ELBOW",
      nominalDiameter: 50,
      connectionType: "butt_weld",
    });

    const elbow80 = createCatalogComponent({
      id: "SYNTH_E80",
      componentType: "ELBOW",
      nominalDiameter: 80,
      connectionType: "butt_weld",
    });

    const res1 = checkComponentCompatibility(pipe50, elbow50);
    const res2 = checkComponentCompatibility(pipe50, elbow80);

    assert(res1.overallStatus === "COMPATIBLE" || res1.overallStatus === "INSUFFICIENT_DATA", "res1 statut conforme");
    assert(res2.overallStatus === "INCOMPATIBLE", "res2 devient INCOMPATIBLE avec elbow80");
    assert(res1.dimensions.find((d) => d.dimension === "nominalSize")?.status === "COMPATIBLE", "res1 DN compatible");
    assert(res2.dimensions.find((d) => d.dimension === "nominalSize")?.status === "INCOMPATIBLE", "res2 DN incompatible");
  });

  // =========================================================================
  // AC-21 : Adaptation de PdiCatalogComponent vers ComponentCandidate
  // =========================================================================
  runTest("TEST AC-21: Conversion PdiCatalogComponent vers ComponentCandidate", () => {
    const comp = createCatalogComponent({
      id: "SYNTH_CAND_01",
      componentType: "FLANGE",
      nominalDiameter: 150,
      nominalSize: "6\"",
      pressureClass: "Class 300",
      material: "SYNTH_ASTM_A105",
      standard: "SYNTH_B165",
      connectionType: "flanged",
      evidenceIds: ["EVID_CAND_01"],
    });

    const candidate = adaptCatalogComponentToCandidate(comp);
    assert(candidate.candidateId === "SYNTH_CAND_01", "candidateId conservé");
    assert(candidate.componentType === "FLANGE", "type FLANGE");
    assert(candidate.productStandardId === "SYNTH_B165", "standard conservé");
    assert(candidate.ratingValue === "Class 300", "rating conservé");
    assert(candidate.materialId === "SYNTH_ASTM_A105", "matériau conservé");
    assert(Array.isArray(candidate.evidenceIds) && candidate.evidenceIds[0] === "EVID_CAND_01", "evidenceIds conservés");
  });

  // =========================================================================
  // AC-22 : Incompatibilité de face de bride (RF vs RTJ)
  // =========================================================================
  runTest("TEST AC-22: Face de bride incompatible (RF vs RTJ) retourne INCOMPATIBLE", () => {
    const flangeRF = createCatalogComponent({
      id: "SYNTH_FLANGE_RF",
      componentType: "FLANGE",
      nominalDiameter: 100,
      connectionType: "flanged",
      faceType: "RF",
      pressureClass: "Class 300",
      material: "SYNTH_CS",
    });

    const flangeRTJ = createCatalogComponent({
      id: "SYNTH_FLANGE_RTJ",
      componentType: "FLANGE",
      nominalDiameter: 100,
      connectionType: "flanged",
      faceType: "RTJ",
      pressureClass: "Class 300",
      material: "SYNTH_CS",
    });

    const res = checkComponentCompatibility(flangeRF, flangeRTJ);
    assert(res.overallStatus === "INCOMPATIBLE", "Statut global INCOMPATIBLE");
    const faceDim = res.dimensions.find((d) => d.dimension === "faceType");
    assert(faceDim?.status === "INCOMPATIBLE", "Dimension faceType INCOMPATIBLE");
  });

  // =========================================================================
  // AC-23 : Raccordement fileté mâle / femelle compatible
  // =========================================================================
  runTest("TEST AC-23: Raccordement fileté mâle/femelle compatible", () => {
    const nipple = createCatalogComponent({
      id: "SYNTH_NIPPLE_M",
      componentType: "OTHER",
      nominalDiameter: 25,
      connectionType: "male_threaded",
      pressureClass: "Class 800",
      material: "SYNTH_CS",
    });

    const valve = createCatalogComponent({
      id: "SYNTH_VALVE_F",
      componentType: "VALVE",
      nominalDiameter: 25,
      connectionType: "female_threaded",
      pressureClass: "Class 800",
      material: "SYNTH_CS",
    });

    const res = checkComponentCompatibility(nipple, valve);
    assert(res.overallStatus === "COMPATIBLE", "Statut COMPATIBLE");
    const connDim = res.dimensions.find((d) => d.dimension === "connection");
    assert(connDim?.status === "COMPATIBLE", "Connexion mâle/femelle COMPATIBLE");
  });

  // =========================================================================
  // AC-24 : Sélection avec données incomplètes sur les candidats
  // =========================================================================
  runTest("TEST AC-24: Sélection avec candidats incomplets retourne UNVERIFIED", () => {
    const registry = createCatalogRegistry([
      createCatalogComponent({
        id: "SYNTH_INCOMPLETE_CAND_01",
        componentType: "VALVE",
        // pas de DN ni de matériau
      }),
    ]);

    const req: PdiComponentSelectionRequest = {
      componentType: "VALVE",
      nominalDiameter: 100,
      material: "SYNTH_CS_A",
    };

    const res = selectCatalogComponent(registry, req);
    assert(res.status === "UNVERIFIED", "Statut UNVERIFIED car le candidat n'a pas les données nécessaires");
  });

  // =========================================================================
  // AC-25 : Registre de catalogue (batching, comptage, filtrage)
  // =========================================================================
  runTest("TEST AC-25: Fonctionnalités complètes du registre de catalogue", () => {
    const registry = createCatalogRegistry();
    assert(registry.count() === 0, "Registre initial vide");

    const comp1 = createCatalogComponent({ id: "REG_PIPE_1", componentType: "PIPE", nominalDiameter: 50 });
    const comp2 = createCatalogComponent({ id: "REG_PIPE_2", componentType: "PIPE", nominalDiameter: 100 });
    const comp3 = createCatalogComponent({ id: "REG_VALVE_1", componentType: "VALVE", nominalDiameter: 50 });

    registry.registerBatch([comp1, comp2, comp3]);
    assert(registry.count() === 3, "3 composants enregistrés");
    assert(registry.has("REG_PIPE_1"), "Possède REG_PIPE_1");
    assert(registry.get("REG_PIPE_2")?.nominalDiameter === 100, "Récupération par ID");
    assert(registry.findByType("PIPE").length === 2, "2 PIPE trouvés");
    assert(registry.findByType("VALVE").length === 1, "1 VALVE trouvée");
    assert(registry.filter((c) => c.nominalDiameter === 50).length === 2, "2 composants DN50");

    registry.clear();
    assert(registry.count() === 0, "Registre vidé");
  });

  // =========================================================================
  // AC-26 : Erreur explicite sur ID invalide
  // =========================================================================
  runTest("TEST AC-26: Rejet immédiat sur ID de composant vide ou invalide", () => {
    let errorCaught = false;
    try {
      createCatalogComponent({
        id: "   ",
        componentType: "PIPE",
      });
    } catch {
      errorCaught = true;
    }
    assert(errorCaught, "Exception levée sur ID vide");
  });

  // =========================================================================
  // AC-27 : Erreur explicite sur type de composant invalide
  // =========================================================================
  runTest("TEST AC-27: Rejet immédiat sur type de composant invalide", () => {
    let errorCaught = false;
    try {
      createCatalogComponent({
        id: "SYNTH_INVALID_TYPE",
        componentType: "INVALID_UNKNOWN_TYPE" as any,
      });
    } catch {
      errorCaught = true;
    }
    assert(errorCaught, "Exception levée sur componentType inconnu");
  });

  // =========================================================================
  // AC-28 : Erreur sur ID en doublon dans le registre
  // =========================================================================
  runTest("TEST AC-28: Rejet des ID dupliqués dans le registre de catalogue", () => {
    const registry = createCatalogRegistry();
    const comp = createCatalogComponent({ id: "DUP_ID", componentType: "PIPE" });
    registry.register(comp);

    let dupCaught = false;
    try {
      registry.register(comp);
    } catch {
      dupCaught = true;
    }
    assert(dupCaught, "Exception levée sur ID dupliqué");
  });

  // =========================================================================
  // AC-29 : Rejet par Piping Specification sur classe de pression
  // =========================================================================
  runTest("TEST AC-29: Rejet par contrainte Piping Spec sur classe de pression", () => {
    const registry = createCatalogRegistry([
      createCatalogComponent({
        id: "SYNTH_TEE_CL150",
        componentType: "TEE",
        nominalDiameter: 50,
        pressureClass: "Class 150",
      }),
    ]);

    const req: PdiComponentSelectionRequest = {
      componentType: "TEE",
      nominalDiameter: 50,
      pipingSpecConstraint: {
        pipingSpecId: "PMS_CL600",
        pressureClass: "Class 600",
      },
    };

    const res = selectCatalogComponent(registry, req);
    assert(res.status === "NO_CANDIDATE", "Rejet car la classe 150 ne satisfait pas la spec Class 600");
  });

  // =========================================================================
  // AC-30 : Rejet par Piping Specification sur nuance de matériau
  // =========================================================================
  runTest("TEST AC-30: Rejet par contrainte Piping Spec sur nuance de matériau", () => {
    const registry = createCatalogRegistry([
      createCatalogComponent({
        id: "SYNTH_ELBOW_CS",
        componentType: "ELBOW",
        nominalDiameter: 80,
        material: "SYNTH_CARBON_STEEL",
      }),
    ]);

    const req: PdiComponentSelectionRequest = {
      componentType: "ELBOW",
      nominalDiameter: 80,
      pipingSpecConstraint: {
        pipingSpecId: "PMS_SS316",
        materialGrade: "SYNTH_STAINLESS_316L",
      },
    };

    const res = selectCatalogComponent(registry, req);
    assert(res.status === "NO_CANDIDATE", "Rejet car le matériau acier carbone ne satisfait pas la spec inox 316L");
  });

  // =========================================================================
  // NON-RÉGRESSION ARCH-01..05 & NORM-01..14
  // =========================================================================
  runTest("TEST NON-REGRESSION: NORM-01..14 Global Integration Tests", () => {
    const res = runNormativeGlobalIntegrationTests();
    assert(res.success, `NORM Global tests failed (${res.failed} failures)`);
  });

  runTest("TEST NON-REGRESSION: ARCH-01 Isometric Normative Bridge Tests", () => {
    const res = runArch01IsometricNormativeBridgeTests();
    assert(res.success, "ARCH-01 tests failed");
  });

  runTest("TEST NON-REGRESSION: ARCH-02 PMS Authority Unification Tests", () => {
    const res = runArch02PmsAuthorityUnificationTests();
    assert(res.success, "ARCH-02 tests failed");
  });

  runTest("TEST NON-REGRESSION: ARCH-03 Universal Model Tests", () => {
    const res = runArch03UniversalModelTests();
    assert(res.success, "ARCH-03 tests failed");
  });

  runTest("TEST NON-REGRESSION: ARCH-04 Project Workspace Data Tests", () => {
    const res = runArch04ProjectWorkspaceDataTests();
    assert(res.success, "ARCH-04 tests failed");
  });

  runTest("TEST NON-REGRESSION: ARCH-05 Technical Workflow Tests", () => {
    const res = runArch05TechnicalWorkflowTests();
    assert(res.success, "ARCH-05 tests failed");
  });

  return Object.freeze({
    success: testsFailed === 0 && testsRun >= 36,
    testsRun,
    testsPassed,
    testsFailed,
    failures: Object.freeze(failures),
  });
}
