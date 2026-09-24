/**
 * PDI NORMATIVE ENGINE — PIPING SPECIFICATION RESOLVER
 * Reference: SPEC-01 (Piping Specification Resolver)
 * 
 * Moteur déterministe d'orchestration et de résolution d'admissibilité
 * d'un composant au sein d'une spécification de tuyauterie (Piping Spec).
 * 
 * RÈGLE ARCHITECTURALE ABSOLUE :
 * - Aucune conversion automatique (NPS != DN, Class != PN).
 * - Aucun fuzzy matching, aucun score, aucune heuristique.
 * - Délégation stricte des décisions normatives à NORM-13 (NormativeCompatibilityEngine).
 * - Injection explicite des dépendances (PipingSpecification lookup + CompatibilityEngine).
 */

import type {
  IPipingSpecResolver,
  PipingSpecResolutionContext,
  PipingSpecResolutionResult,
  PipingSpecLookupFunction,
} from "../types/pipingSpecResolverTypes";
import type { PipingSpecification } from "../types/pipingSpecTypes";
import type {
  INormativeCompatibilityEngine,
} from "./normativeCompatibilityEngine";
import type {
  NormativeCompatibilityContext,
} from "../types/normativeCompatibilityTypes";
import { validatePipingSpecResolutionContext } from "../validators/pipingSpecResolverValidator";

export class PipingSpecResolver implements IPipingSpecResolver {
  private readonly lookupSpec: PipingSpecLookupFunction;
  private readonly compatibilityEngine: INormativeCompatibilityEngine;

  constructor(
    specLookup: PipingSpecLookupFunction | readonly PipingSpecification[],
    compatibilityEngine: INormativeCompatibilityEngine
  ) {
    if (typeof specLookup === "function") {
      this.lookupSpec = specLookup;
    } else if (Array.isArray(specLookup)) {
      const specs = specLookup;
      this.lookupSpec = (id: string) => specs.find((s) => s.id === id);
    } else {
      throw new Error("PipingSpecResolver: specLookup must be a lookup function or a readonly array of PipingSpecification.");
    }

    if (!compatibilityEngine || typeof compatibilityEngine.evaluate !== "function") {
      throw new Error("PipingSpecResolver: compatibilityEngine must be an explicit INormativeCompatibilityEngine instance.");
    }
    this.compatibilityEngine = compatibilityEngine;
  }

  /**
   * Résout l'admissibilité d'un composant au regard de la spécification de tuyauterie et des règles de compatibilité.
   */
  public resolve(context: PipingSpecResolutionContext): PipingSpecResolutionResult {
    // 1. Validation structurelle et sémantique du contexte
    const validation = validatePipingSpecResolutionContext(context);
    if (!validation.valid) {
      return {
        status: "INVALID",
        specificationId: typeof context?.specificationId === "string" ? context.specificationId : "",
        componentType: typeof context?.componentType === "string" ? context.componentType : "",
        matchedRuleIds: [],
        evidenceIds: [],
        message: `INVALID_CONTEXT: ${validation.errors.join("; ")}`,
      };
    }

    // 2. Résolution de la spécification de tuyauterie
    const spec = this.lookupSpec(context.specificationId);
    if (!spec) {
      return {
        status: "INVALID",
        specificationId: context.specificationId,
        componentType: context.componentType,
        matchedRuleIds: [],
        evidenceIds: [],
        message: `SPEC_NOT_FOUND: Specification with id '${context.specificationId}' was not found.`,
      };
    }

    // 3. Vérification de l'admissibilité du matériau demandé
    if (context.materialId) {
      const isMaterialInSpecList = spec.materialReferenceIds.includes(context.materialId);
      const isMaterialInPipeRules = spec.pipeRules.some((r) => r.materialId === context.materialId);
      const isMaterialInFittingRules = spec.fittingRules.some((r) => r.materialId === context.materialId);
      const isMaterialInFlangeRules = spec.flangeRules.some((r) => r.materialId === context.materialId);
      const isMaterialInValveRules = spec.valveRules.some((r) => r.materialId === context.materialId);

      const hasMaterialConstraints =
        spec.materialReferenceIds.length > 0 ||
        spec.pipeRules.some((r) => r.materialId !== undefined) ||
        spec.fittingRules.some((r) => r.materialId !== undefined) ||
        spec.flangeRules.some((r) => r.materialId !== undefined) ||
        spec.valveRules.some((r) => r.materialId !== undefined);

      if (
        hasMaterialConstraints &&
        !isMaterialInSpecList &&
        !isMaterialInPipeRules &&
        !isMaterialInFittingRules &&
        !isMaterialInFlangeRules &&
        !isMaterialInValveRules
      ) {
        return {
          status: "INCOMPATIBLE",
          specificationId: spec.id,
          componentType: context.componentType,
          matchedRuleIds: [],
          evidenceIds: [],
          message: `MATERIAL_NOT_AUTHORIZED: Material '${context.materialId}' is not authorized in specification '${spec.id}'.`,
        };
      }
    }

    // 4. Analyse des règles structurelles de la Piping Specification
    const upperType = context.componentType.toUpperCase();

    if (upperType === "PIPE") {
      if (spec.pipeRules.length === 0) {
        return {
          status: "UNVERIFIED",
          specificationId: spec.id,
          componentType: context.componentType,
          matchedRuleIds: [],
          evidenceIds: [],
          message: `NO_PIPE_RULES: Specification '${spec.id}' defines 0 pipe rules.`,
        };
      }

      // Vérifier le standard dimensionnel
      if (context.dimensionalStandardId) {
        const matchesDimStd = spec.pipeRules.some(
          (r) => r.pipeDimensionalStandardId === context.dimensionalStandardId
        );
        if (!matchesDimStd) {
          return {
            status: "INCOMPATIBLE",
            specificationId: spec.id,
            componentType: context.componentType,
            matchedRuleIds: [],
            evidenceIds: [],
            message: `DIMENSIONAL_STANDARD_MISMATCH: Pipe dimensional standard '${context.dimensionalStandardId}' is not authorized in specification '${spec.id}'.`,
          };
        }
      }

      // Vérifier le schedule
      if (context.schedule) {
        const rulesWithSchedule = spec.pipeRules.filter((r) => r.schedule !== undefined);
        if (rulesWithSchedule.length > 0) {
          const matchesSched = rulesWithSchedule.some((r) => r.schedule === context.schedule);
          if (!matchesSched) {
            return {
              status: "INCOMPATIBLE",
              specificationId: spec.id,
              componentType: context.componentType,
              matchedRuleIds: [],
              evidenceIds: [],
              message: `SCHEDULE_MISMATCH: Schedule '${context.schedule}' is not authorized for pipes in specification '${spec.id}'.`,
            };
          }
        }
      }

      // Vérifier la taille nominale
      if (context.nominalSize) {
        const rulesWithSizes = spec.pipeRules.filter(
          (r) => r.nominalSizes && r.nominalSizes.length > 0
        );
        if (rulesWithSizes.length > 0) {
          const matchesSize = rulesWithSizes.some(
            (r) => r.nominalSizes && r.nominalSizes.includes(context.nominalSize!)
          );
          if (!matchesSize) {
            return {
              status: "INCOMPATIBLE",
              specificationId: spec.id,
              componentType: context.componentType,
              matchedRuleIds: [],
              evidenceIds: [],
              message: `NOMINAL_SIZE_MISMATCH: Nominal size '${context.nominalSize}' is not covered for pipes in specification '${spec.id}'.`,
            };
          }
        }
      }
    } else if (upperType === "FITTING") {
      if (spec.fittingRules.length === 0) {
        return {
          status: "UNVERIFIED",
          specificationId: spec.id,
          componentType: context.componentType,
          matchedRuleIds: [],
          evidenceIds: [],
          message: `NO_FITTING_RULES: Specification '${spec.id}' defines 0 fitting rules.`,
        };
      }

      // Vérifier le productStandardId
      if (context.productStandardId) {
        const matchesProductStd = spec.fittingRules.some(
          (r) => r.fittingStandardId === context.productStandardId
        );
        if (!matchesProductStd) {
          return {
            status: "INCOMPATIBLE",
            specificationId: spec.id,
            componentType: context.componentType,
            matchedRuleIds: [],
            evidenceIds: [],
            message: `PRODUCT_STANDARD_MISMATCH: Fitting product standard '${context.productStandardId}' is not authorized in specification '${spec.id}'.`,
          };
        }
      }

      // Vérifier le fittingType
      if (context.fittingType) {
        const rulesWithTypes = spec.fittingRules.filter(
          (r) => r.fittingTypes && r.fittingTypes.length > 0
        );
        if (rulesWithTypes.length > 0) {
          const matchesType = rulesWithTypes.some(
            (r) => r.fittingTypes && r.fittingTypes.includes(context.fittingType as any)
          );
          if (!matchesType) {
            return {
              status: "INCOMPATIBLE",
              specificationId: spec.id,
              componentType: context.componentType,
              matchedRuleIds: [],
              evidenceIds: [],
              message: `FITTING_TYPE_MISMATCH: Fitting type '${context.fittingType}' is not authorized in specification '${spec.id}'.`,
            };
          }
        }
      }

      // Vérifier le connectionType
      if (context.connectionType) {
        const rulesWithConn = spec.fittingRules.filter(
          (r) => r.connectionTypes && r.connectionTypes.length > 0
        );
        if (rulesWithConn.length > 0) {
          const matchesConn = rulesWithConn.some(
            (r) => r.connectionTypes && r.connectionTypes.includes(context.connectionType as any)
          );
          if (!matchesConn) {
            return {
              status: "INCOMPATIBLE",
              specificationId: spec.id,
              componentType: context.componentType,
              matchedRuleIds: [],
              evidenceIds: [],
              message: `CONNECTION_TYPE_MISMATCH: Fitting connection type '${context.connectionType}' is not authorized in specification '${spec.id}'.`,
            };
          }
        }
      }
    } else if (upperType === "FLANGE") {
      if (spec.flangeRules.length === 0) {
        return {
          status: "UNVERIFIED",
          specificationId: spec.id,
          componentType: context.componentType,
          matchedRuleIds: [],
          evidenceIds: [],
          message: `NO_FLANGE_RULES: Specification '${spec.id}' defines 0 flange rules.`,
        };
      }

      // Vérifier le productStandardId
      if (context.productStandardId) {
        const matchesProductStd = spec.flangeRules.some(
          (r) => r.flangeStandardId === context.productStandardId
        );
        if (!matchesProductStd) {
          return {
            status: "INCOMPATIBLE",
            specificationId: spec.id,
            componentType: context.componentType,
            matchedRuleIds: [],
            evidenceIds: [],
            message: `PRODUCT_STANDARD_MISMATCH: Flange product standard '${context.productStandardId}' is not authorized in specification '${spec.id}'.`,
          };
        }
      }

      // Vérifier le ratingSystem
      if (context.ratingSystem) {
        const rulesWithRatingSys = spec.flangeRules.filter((r) => r.ratingSystem !== undefined);
        if (rulesWithRatingSys.length > 0) {
          const matchesRatingSys = rulesWithRatingSys.some(
            (r) => r.ratingSystem === context.ratingSystem
          );
          if (!matchesRatingSys) {
            return {
              status: "INCOMPATIBLE",
              specificationId: spec.id,
              componentType: context.componentType,
              matchedRuleIds: [],
              evidenceIds: [],
              message: `RATING_SYSTEM_MISMATCH: Flange rating system '${context.ratingSystem}' is not authorized in specification '${spec.id}'.`,
            };
          }
        }
      }

      // Vérifier la valeur de rating
      if (context.ratingValue) {
        const rulesWithRating = spec.flangeRules.filter((r) => r.rating !== undefined);
        if (rulesWithRating.length > 0) {
          const matchesRating = rulesWithRating.some((r) => r.rating === context.ratingValue);
          if (!matchesRating) {
            return {
              status: "INCOMPATIBLE",
              specificationId: spec.id,
              componentType: context.componentType,
              matchedRuleIds: [],
              evidenceIds: [],
              message: `RATING_VALUE_MISMATCH: Flange rating '${context.ratingValue}' is not authorized in specification '${spec.id}'.`,
            };
          }
        }
      }
    } else if (upperType === "VALVE") {
      if (spec.valveRules.length === 0) {
        return {
          status: "UNVERIFIED",
          specificationId: spec.id,
          componentType: context.componentType,
          matchedRuleIds: [],
          evidenceIds: [],
          message: `NO_VALVE_RULES: Specification '${spec.id}' defines 0 valve rules.`,
        };
      }

      // Vérifier le productStandardId
      if (context.productStandardId) {
        const rulesWithProd = spec.valveRules.filter((r) => r.productStandardId !== undefined);
        if (rulesWithProd.length > 0) {
          const matchesProd = rulesWithProd.some(
            (r) => r.productStandardId === context.productStandardId
          );
          if (!matchesProd) {
            return {
              status: "INCOMPATIBLE",
              specificationId: spec.id,
              componentType: context.componentType,
              matchedRuleIds: [],
              evidenceIds: [],
              message: `PRODUCT_STANDARD_MISMATCH: Valve product standard '${context.productStandardId}' is not authorized in specification '${spec.id}'.`,
            };
          }
        }
      }

      // Vérifier le dimensionalStandardId
      if (context.dimensionalStandardId) {
        const rulesWithDim = spec.valveRules.filter((r) => r.dimensionalStandardId !== undefined);
        if (rulesWithDim.length > 0) {
          const matchesDim = rulesWithDim.some(
            (r) => r.dimensionalStandardId === context.dimensionalStandardId
          );
          if (!matchesDim) {
            return {
              status: "INCOMPATIBLE",
              specificationId: spec.id,
              componentType: context.componentType,
              matchedRuleIds: [],
              evidenceIds: [],
              message: `DIMENSIONAL_STANDARD_MISMATCH: Valve dimensional standard '${context.dimensionalStandardId}' is not authorized in specification '${spec.id}'.`,
            };
          }
        }
      }

      // Vérifier le connectionType
      if (context.connectionType) {
        const rulesWithConn = spec.valveRules.filter(
          (r) => r.connectionTypes && r.connectionTypes.length > 0
        );
        if (rulesWithConn.length > 0) {
          const matchesConn = rulesWithConn.some(
            (r) => r.connectionTypes && r.connectionTypes.includes(context.connectionType as any)
          );
          if (!matchesConn) {
            return {
              status: "INCOMPATIBLE",
              specificationId: spec.id,
              componentType: context.componentType,
              matchedRuleIds: [],
              evidenceIds: [],
              message: `CONNECTION_TYPE_MISMATCH: Valve connection type '${context.connectionType}' is not authorized in specification '${spec.id}'.`,
            };
          }
        }
      }
    }

    // 5. Délégation à NORM-13 (NormativeCompatibilityEngine)
    const compatContext: NormativeCompatibilityContext = {
      standardId: (context.productStandardId || context.dimensionalStandardId) as any,
      componentType: context.componentType,
      connectionType: context.connectionType,
      nominalSize: context.nominalSize,
      schedule: context.schedule,
      pressureRating: context.ratingValue,
      materialId: context.materialId,
      designCodeId: (context.designCodeId || spec.designCodeId) as any,
      pipingSpecId: spec.id,
      evidenceIds: context.evidenceIds,
    };

    const compatDecision = this.compatibilityEngine.evaluate(compatContext);

    const matchedRuleIds: string[] = [];
    if (compatDecision.ruleId) {
      matchedRuleIds.push(compatDecision.ruleId);
    } else if (compatDecision.matchedRule?.ruleId) {
      matchedRuleIds.push(compatDecision.matchedRule.ruleId);
    }

    const evidenceIds: string[] = [];
    if (compatDecision.evidenceIds && compatDecision.evidenceIds.length > 0) {
      evidenceIds.push(...compatDecision.evidenceIds);
    } else if (context.evidenceIds) {
      evidenceIds.push(...context.evidenceIds);
    }

    return {
      status: compatDecision.status,
      specificationId: spec.id,
      componentType: context.componentType,
      matchedRuleIds,
      evidenceIds,
      message: compatDecision.message,
    };
  }
}
