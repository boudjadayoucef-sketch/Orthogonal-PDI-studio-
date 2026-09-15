/**
 * PDI NORMATIVE ENGINE — DESIGN CODE ENGINE
 * Reference: PATCH NORM-08 (Design Code Engine / Engineering Calculation Foundation)
 * 
 * Moteur d'exécution des calculs d'ingénierie selon codes de conception.
 * 
 * RÈGLE ARCHITECTURALE ABSOLUE :
 * - Déterministe, immuable, auditable, traçable.
 * - Indépendant de React, de l'UI, de Firestore et des catalogues legacy.
 * - Aucune formule inventée ou constante arbitraire.
 * - Tout calcul dont la formule, la clause, les coefficients ou l'édition
 *   ne sont pas intégralement vérifiés retourne NOT_IMPLEMENTED.
 * - AUCUN statut COMPLIANT n'est délivré (réservé à NORM-09).
 * - Vérification stricte contre NaN et Infinity.
 */

import type {
  EngineeringCalculationInput,
  EngineeringCalculationContext,
  EngineeringCalculationResult,
} from "../types/designCodeTypes";
import {
  validateCompleteEngineeringCalculationInput,
  validateDesignCodeFormulaReference,
  isFormulaQualified,
} from "../validators/designCodeValidator";
import {
  getDesignCodeCalculationEntry,
} from "../registry/designCodeRegistry";

/**
 * Exécute un calcul d'ingénierie selon le code de conception spécifié.
 * RÈGLE ARCHITECTURALE ABSOLUE (NORM-08-R1) :
 * - Déterministe, immuable, auditable, traçable.
 * - Aucune formule inventée ou constante arbitraire.
 * - Le statut CALCULATED ne peut jamais être retourné tant qu'aucune formule réelle n'est activée.
 * - Toute sortie éventuelle est strictement vérifiée par Number.isFinite.
 */
export function executeEngineeringCalculation(
  input: EngineeringCalculationInput,
  context?: EngineeringCalculationContext
): EngineeringCalculationResult {
  // 1. Validation de l'entrée de calcul
  const validation = validateCompleteEngineeringCalculationInput(input);
  if (!validation.valid) {
    const errorMessages = validation.errors.map((e) => `${e.code}: ${e.message}`);
    return Object.freeze({
      status: "INVALID_INPUT",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: input.standardEdition ?? context?.standardEdition,
      inputs: Object.freeze({
        pressure: input.pressure,
        temperature: input.temperature,
        outsideDiameterMm: input.outsideDiameterMm,
        wallThicknessMm: input.wallThicknessMm,
        materialId: input.materialId ?? context?.materialId,
        corrosionAllowanceMm: input.corrosionAllowanceMm,
        weldJointFactor: input.weldJointFactor,
        designFactor: input.designFactor,
        unitSystem: input.unitSystem,
      }),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze(errorMessages),
    });
  }

  // 2. Recherche du statut dans le registre des codes de conception
  const registryEntry = getDesignCodeCalculationEntry(input.designCodeId);
  if (!registryEntry) {
    return Object.freeze({
      status: "OUT_OF_SCOPE",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: input.standardEdition ?? context?.standardEdition,
      inputs: Object.freeze({
        pressure: input.pressure,
        unitSystem: input.unitSystem,
      }),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze([`DESIGN_CODE_NOT_SUPPORTED: Le code ${input.designCodeId} n'est pas supporté.`]),
    });
  }

  // 3. Vérification du support du type de calcul par le code
  if (
    registryEntry.status === "NOT_IMPLEMENTED" ||
    !registryEntry.supportedCalculationTypes.includes(input.calculationType)
  ) {
    return Object.freeze({
      status: "NOT_IMPLEMENTED",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: input.standardEdition ?? context?.standardEdition,
      inputs: Object.freeze({
        pressure: input.pressure,
        temperature: input.temperature,
        outsideDiameterMm: input.outsideDiameterMm,
        wallThicknessMm: input.wallThicknessMm,
        materialId: input.materialId ?? context?.materialId,
        corrosionAllowanceMm: input.corrosionAllowanceMm,
        weldJointFactor: input.weldJointFactor,
        designFactor: input.designFactor,
        unitSystem: input.unitSystem,
      }),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze([
        `FORMULA_NOT_IMPLEMENTED: Aucun calcul vérifié et sourcé pour ${input.calculationType} selon ${input.designCodeId} dans NORM-08-R1.`,
      ]),
    });
  }

  // 4. FORMULA EXECUTION GATE (Section 17)
  // Recherche d'une formule associée dans le registre
  const formula = registryEntry.formulaReferences.find(
    (f) => f.calculationType === input.calculationType || !f.calculationType
  );

  if (!formula || formula.status === "NOT_IMPLEMENTED") {
    return Object.freeze({
      status: "NOT_IMPLEMENTED",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: input.standardEdition ?? context?.standardEdition,
      formulaId: formula?.id,
      clauseReference: formula?.clauseReference,
      sourceReference: formula?.sourceReference,
      formulaReference: formula,
      inputs: Object.freeze({
        pressure: input.pressure,
        temperature: input.temperature,
        outsideDiameterMm: input.outsideDiameterMm,
        wallThicknessMm: input.wallThicknessMm,
        materialId: input.materialId ?? context?.materialId,
        corrosionAllowanceMm: input.corrosionAllowanceMm,
        weldJointFactor: input.weldJointFactor,
        designFactor: input.designFactor,
        unitSystem: input.unitSystem,
      }),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze([
        `FORMULA_NOT_IMPLEMENTED: Aucune formule implémentée pour ${input.calculationType} sous ${input.designCodeId}.`,
      ]),
    });
  }

  // Vérification de la qualification de la formule (Section 11 & 17)
  const formulaValidation = validateDesignCodeFormulaReference(formula);
  if (!formulaValidation.valid || !isFormulaQualified(formula)) {
    return Object.freeze({
      status: "UNVERIFIED",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: input.standardEdition ?? context?.standardEdition,
      formulaId: formula.id,
      clauseReference: formula.clauseReference,
      sourceReference: formula.sourceReference,
      formulaReference: formula,
      inputs: Object.freeze({
        pressure: input.pressure,
        temperature: input.temperature,
        outsideDiameterMm: input.outsideDiameterMm,
        wallThicknessMm: input.wallThicknessMm,
        materialId: input.materialId ?? context?.materialId,
        corrosionAllowanceMm: input.corrosionAllowanceMm,
        weldJointFactor: input.weldJointFactor,
        designFactor: input.designFactor,
        unitSystem: input.unitSystem,
      }),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze([
        "FORMULA_SOURCE_UNVERIFIED: Formule non qualifiée ou clause/source absente.",
      ]),
    });
  }

  // Cohérence designCodeId (Section 17)
  if (formula.designCodeId !== input.designCodeId) {
    return Object.freeze({
      status: "NOT_IMPLEMENTED",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: input.standardEdition ?? context?.standardEdition,
      inputs: Object.freeze({
        pressure: input.pressure,
        unitSystem: input.unitSystem,
      }),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze([
        `FORMULA_DESIGN_CODE_MISMATCH: La formule ${formula.id} est dédiée à ${formula.designCodeId}, pas ${input.designCodeId}.`,
      ]),
    });
  }

  // Dans NORM-08-R1, AUCUN calcul numérique réel n'est activé (Section 18).
  // Le moteur garantit qu'aucune valeur numérique n'est calculée arbitrairement.
  return Object.freeze({
    status: "UNVERIFIED",
    calculationType: input.calculationType,
    designCodeId: input.designCodeId,
    standardEdition: input.standardEdition ?? context?.standardEdition,
    formulaId: formula.id,
    clauseReference: formula.clauseReference,
    sourceReference: formula.sourceReference,
    formulaReference: formula,
    inputs: Object.freeze({
      pressure: input.pressure,
      temperature: input.temperature,
      outsideDiameterMm: input.outsideDiameterMm,
      wallThicknessMm: input.wallThicknessMm,
      materialId: input.materialId ?? context?.materialId,
      corrosionAllowanceMm: input.corrosionAllowanceMm,
      weldJointFactor: input.weldJointFactor,
      designFactor: input.designFactor,
      unitSystem: input.unitSystem,
    }),
    assumptions: Object.freeze([]),
    warnings: Object.freeze([]),
    errors: Object.freeze(["FORMULA_NOT_IMPLEMENTED: Formule qualifiée mais calcul non activé dans NORM-08-R1."]),
  });
}
