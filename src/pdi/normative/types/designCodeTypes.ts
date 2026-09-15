/**
 * PDI NORMATIVE ENGINE — DESIGN CODE TYPES
 * Reference: PATCH NORM-08 (Design Code Engine / Engineering Calculation Foundation)
 * 
 * Modèle typé, déterministe et immuable pour l'exécution et la traçabilité
 * des calculs d'ingénierie selon les codes de conception.
 * 
 * RÈGLE ARCHITECTURALE ABSOLUE :
 * - NORM-08 ne contient AUCUNE formule inventée, constante inventée, coefficient inventé,
 *   ou facteur de sécurité inventé.
 * - Tout calcul doit être traçable, déterministe et sourcé.
 * - En l'absence de formule vérifiée/licenciée complète avec domaine de validité documenté,
 *   le statut DOIT être NOT_IMPLEMENTED ou UNVERIFIED.
 * - AUCUN statut COMPLIANT n'est émis ici (réservé exclusivement à NORM-09).
 */

import type {
  DesignCodeId,
  StandardEdition,
} from "./normativeCoreTypes";

/**
 * Codes de conception initiaux enregistrés dans NORM-01.
 */
export type SupportedDesignCodeId =
  | "ASME-B31.3"
  | "ASME-B31.4"
  | "ASME-B31.8"
  | "EN-13480"
  | "ISO-13623";

/**
 * Statut de support d'un code de conception dans le moteur.
 */
export type DesignCodeSupportStatus =
  | "SUPPORTED"
  | "PARTIAL"
  | "UNVERIFIED"
  | "NOT_IMPLEMENTED";

/**
 * Vocabulaire typé pour les types de calculs d'ingénierie.
 */
export type EngineeringCalculationType =
  | "PRESSURE_WALL_THICKNESS"
  | "ALLOWABLE_PRESSURE"
  | "HOOP_STRESS"
  | "TEST_PRESSURE"
  | "OTHER";

/**
 * Statut d'exécution et de qualification d'un calcul d'ingénierie.
 * Note: COMPLIANT est strictement interdit dans NORM-08.
 */
export type CalculationStatus =
  | "CALCULATED"
  | "UNVERIFIED"
  | "NOT_IMPLEMENTED"
  | "INVALID_INPUT"
  | "OUT_OF_SCOPE";

/**
 * Système d'unités explicite pour les calculs d'ingénierie.
 */
export type EngineeringUnitSystem = "SI" | "US_CUSTOMARY";

/**
 * Statut de qualification et de licence d'une formule normative.
 */
export type DesignCodeFormulaStatus =
  | "VERIFIED"
  | "LICENSED"
  | "UNVERIFIED"
  | "NOT_IMPLEMENTED";

/**
 * Contrat d'unités explicite attendu par une formule normative.
 */
export interface FormulaUnitContract {
  readonly unitSystem?: EngineeringUnitSystem;
  readonly pressureUnit?: string;
  readonly diameterUnit?: string;
  readonly thicknessUnit?: string;
  readonly temperatureUnit?: string;
  readonly stressUnit?: string;
  readonly outputUnit?: string;
}

/**
 * Régime ou domaine géométrique/physique d'une formule.
 */
export type FormulaRegime = "THIN_WALL" | "THICK_WALL" | "HIGH_TEMP" | "ALL";

/**
 * Domaine de validité et limites d'utilisation d'une formule.
 */
export interface FormulaDomain {
  readonly regime?: FormulaRegime;
  readonly minimumPressure?: number;
  readonly maximumPressure?: number;
  readonly minimumTemperature?: number;
  readonly maximumTemperature?: number;
  readonly minimumDiameterMm?: number;
  readonly maximumDiameterMm?: number;
  readonly minimumThicknessMm?: number;
  readonly maximumThicknessMm?: number;
  readonly applicableDesignCodes?: readonly DesignCodeId[];
}

/**
 * Traçabilité et statut d'une formule normative.
 */
export interface DesignCodeFormulaReference {
  readonly id: string;
  readonly designCodeId: DesignCodeId;
  readonly standardEdition?: StandardEdition;
  readonly calculationType?: EngineeringCalculationType;
  readonly clauseReference?: string;
  readonly sourceReference?: string;
  readonly status: DesignCodeFormulaStatus;
  readonly domain?: FormulaDomain;
  readonly units?: FormulaUnitContract;
}

/**
 * Paramètres d'entrée pour un calcul d'ingénierie selon code de conception.
 */
export interface EngineeringCalculationInput {
  readonly designCodeId: DesignCodeId;
  readonly calculationType: EngineeringCalculationType;
  readonly standardEdition?: StandardEdition;

  readonly pressure?: number;
  readonly temperature?: number;

  readonly outsideDiameterMm?: number;
  readonly wallThicknessMm?: number;

  readonly materialId?: string;
  readonly allowableStressMpa?: number;

  readonly corrosionAllowanceMm?: number;

  readonly weldJointFactor?: number;
  readonly designFactor?: number;

  readonly unitSystem: EngineeringUnitSystem;
}

/**
 * Contexte de calcul (optionnel, pour l'ancrage projet et spécification).
 */
export interface EngineeringCalculationContext {
  readonly projectId?: string;
  readonly pipingSpecificationId?: string;
  readonly designCodeId: DesignCodeId;
  readonly standardEdition?: StandardEdition;
  readonly materialId?: string;
  readonly unitSystem: EngineeringUnitSystem;
}

/**
 * Résultat immuable, auditable et traçable d'un calcul d'ingénierie.
 */
export interface EngineeringCalculationResult {
  readonly status: CalculationStatus;
  readonly calculationType: EngineeringCalculationType;
  readonly designCodeId: DesignCodeId;
  readonly standardEdition?: StandardEdition;

  readonly formulaId?: string;
  readonly clauseReference?: string;
  readonly sourceReference?: string;

  readonly value?: number;
  readonly unit?: string;

  readonly inputs: Readonly<Record<string, number | string | undefined>>;

  readonly formulaReference?: DesignCodeFormulaReference;
  readonly domain?: FormulaDomain;

  readonly assumptions: readonly string[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

/**
 * Fiche d'enregistrement d'un code de conception dans le registre de calcul.
 */
export interface DesignCodeRegistryEntry {
  readonly id: DesignCodeId;
  readonly status: DesignCodeSupportStatus;
  readonly supportedCalculationTypes: readonly EngineeringCalculationType[];
  readonly formulaReferences: readonly DesignCodeFormulaReference[];
}
