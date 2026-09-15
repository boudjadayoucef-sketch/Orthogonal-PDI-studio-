/**
 * PDI NORMATIVE ENGINE — DESIGN CODE REGISTRY
 * Reference: PATCH NORM-08 (Design Code Engine / Engineering Calculation Foundation)
 * 
 * Registre central, déterministe et immuable des codes de conception
 * et de leur statut de support de calcul.
 * 
 * RÈGLE ARCHITECTURALE ABSOLUE :
 * - Les codes déclarés dans NORM-01 (ASME-B31.3, ASME-B31.4, ASME-B31.8, EN-13480, ISO-13623)
 *   sont inscrits avec leur statut réel d'implémentation.
 * - Aucune formule n'est prétendue implémentée si ses paramètres, sa clause,
 *   son édition et ses coefficients ne sont pas intégralement vérifiés.
 * - Statut initial rigoureux : NOT_IMPLEMENTED pour tous les codes jusqu'à validation
 *   de formules vérifiées/licenciées complètes.
 */

import type { DesignCodeId } from "../types/normativeCoreTypes";
import type {
  DesignCodeRegistryEntry,
  EngineeringCalculationType,
} from "../types/designCodeTypes";

/**
 * Registre immuable des codes de conception et de leurs capacités de calcul.
 * Chaque entrée documente le statut de support exact sans aucune fausse promesse.
 */
export const DESIGN_CODE_CALCULATION_REGISTRY: readonly DesignCodeRegistryEntry[] = Object.freeze([
  Object.freeze({
    id: "ASME-B31.3",
    status: "NOT_IMPLEMENTED",
    supportedCalculationTypes: Object.freeze([] as EngineeringCalculationType[]),
    formulaReferences: Object.freeze([]),
  }),
  Object.freeze({
    id: "ASME-B31.4",
    status: "NOT_IMPLEMENTED",
    supportedCalculationTypes: Object.freeze([] as EngineeringCalculationType[]),
    formulaReferences: Object.freeze([]),
  }),
  Object.freeze({
    id: "ASME-B31.8",
    status: "NOT_IMPLEMENTED",
    supportedCalculationTypes: Object.freeze([] as EngineeringCalculationType[]),
    formulaReferences: Object.freeze([]),
  }),
  Object.freeze({
    id: "EN-13480",
    status: "NOT_IMPLEMENTED",
    supportedCalculationTypes: Object.freeze([] as EngineeringCalculationType[]),
    formulaReferences: Object.freeze([]),
  }),
  Object.freeze({
    id: "ISO-13623",
    status: "NOT_IMPLEMENTED",
    supportedCalculationTypes: Object.freeze([] as EngineeringCalculationType[]),
    formulaReferences: Object.freeze([]),
  }),
]);

/**
 * Recherche une entrée du registre de calcul par identifiant de code de conception.
 */
export function getDesignCodeCalculationEntry(
  designCodeId: DesignCodeId
): DesignCodeRegistryEntry | undefined {
  return DESIGN_CODE_CALCULATION_REGISTRY.find((entry) => entry.id === designCodeId);
}

/**
 * Vérifie si un code de conception est enregistré dans le catalogue de calcul.
 */
export function isDesignCodeRegisteredForCalculation(designCodeId: string): boolean {
  return DESIGN_CODE_CALCULATION_REGISTRY.some((entry) => entry.id === designCodeId);
}
