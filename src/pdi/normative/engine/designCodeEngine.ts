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
} from "../validators/designCodeValidator";
import {
  getDesignCodeCalculationEntry,
} from "../registry/designCodeRegistry";

/**
 * Exécute un calcul d'ingénierie selon le code de conception spécifié.
 * Garantit qu'aucune valeur par défaut ou hypothèse cachée n'est injectée.
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

  // 3. Vérification de l'implémentation de la formule
  // Dans NORM-08, chaque code est rigoureusement à NOT_IMPLEMENTED
  // Aucune formule n'est exécutée avec des constantes inventées.
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
        `FORMULA_NOT_IMPLEMENTED: Aucun calcul vérifié et sourcé pour ${input.calculationType} selon ${input.designCodeId} dans NORM-08.`,
      ]),
    });
  }

  // Si ultérieurement une formule vérifiée est activée, elle doit respecter la non-finitude
  return Object.freeze({
    status: "UNVERIFIED",
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
    errors: Object.freeze(["FORMULA_SOURCE_UNVERIFIED: Formule non qualifiée."]),
  });
}
