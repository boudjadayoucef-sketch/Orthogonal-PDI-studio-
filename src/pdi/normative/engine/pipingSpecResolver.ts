/**
 * PDI NORMATIVE ENGINE — PIPING SPECIFICATION RESOLVER
 * Reference: SPEC-01, SPEC-01-FIX-01 (Authority & Evidence Fix)
 * 
 * Moteur déterministe d'orchestration et de résolution d'admissibilité
 * d'un composant au sein d'une spécification de tuyauterie (Piping Spec).
 * 
 * RÈGLES ARCHITECTURALES (SPEC-01-FIX-01) :
 * 1. La règle Piping Specification est la condition d'autorité obligatoire :
 *    - NO VERIFIED PIPING-SPEC RULE → NO COMPATIBLE RESULT.
 *    - Une règle Piping Spec UNVERIFIED ou sans preuve vérifiée (NORM-09) produit au maximum UNVERIFIED.
 * 2. Précédence stricte du matériau de composant :
 *    - spec.materialReferenceIds est la borne supérieure globale.
 *    - componentRule.materialId est la contrainte spécifique obligatoire.
 * 3. Preuves normatives (NORM-09) :
 *    - Les preuves associées à la règle (rule.evidenceIds) doivent être résolues comme FOUND_VERIFIED.
 * 4. Délégation déterministe à NORM-13 (NormativeCompatibilityEngine).
 * 5. Aucune conversion automatique (NPS != DN, Class != PN), aucun score, aucun fuzzy matching.
 */

import type {
  IPipingSpecResolver,
  PipingSpecResolutionContext,
  PipingSpecResolutionResult,
  PipingSpecLookupFunction,
} from "../types/pipingSpecResolverTypes";
import type {
  PipingSpecification,
  PipingSpecPipeRule,
  PipingSpecFittingRule,
  PipingSpecFlangeRule,
  PipingSpecValveRule,
} from "../types/pipingSpecTypes";
import type {
  INormativeCompatibilityEngine,
} from "./normativeCompatibilityEngine";
import type {
  INormativeEvidenceResolver,
} from "../registry/normativeEvidenceResolver";
import type {
  NormativeCompatibilityContext,
} from "../types/normativeCompatibilityTypes";
import { validatePipingSpecResolutionContext } from "../validators/pipingSpecResolverValidator";

type GenericSpecRule =
  | PipingSpecPipeRule
  | PipingSpecFittingRule
  | PipingSpecFlangeRule
  | PipingSpecValveRule;

export class PipingSpecResolver implements IPipingSpecResolver {
  private readonly lookupSpec: PipingSpecLookupFunction;
  private readonly compatibilityEngine: INormativeCompatibilityEngine;
  private readonly evidenceResolver: INormativeEvidenceResolver;

  constructor(
    specLookup: PipingSpecLookupFunction | readonly PipingSpecification[],
    compatibilityEngine: INormativeCompatibilityEngine,
    evidenceResolver: INormativeEvidenceResolver
  ) {
    if (typeof specLookup === "function") {
      this.lookupSpec = specLookup;
    } else if (Array.isArray(specLookup)) {
      const specs = specLookup;
      this.lookupSpec = (id: string) => specs.find((s) => s.id === id);
    } else {
      throw new Error(
        "PipingSpecResolver: specLookup must be a lookup function or a readonly array of PipingSpecification."
      );
    }

    if (!compatibilityEngine || typeof compatibilityEngine.evaluate !== "function") {
      throw new Error(
        "PipingSpecResolver: compatibilityEngine must be an explicit INormativeCompatibilityEngine instance."
      );
    }
    this.compatibilityEngine = compatibilityEngine;

    if (!evidenceResolver || typeof evidenceResolver.resolveEvidenceSet !== "function") {
      throw new Error(
        "PipingSpecResolver: evidenceResolver must be an explicit INormativeEvidenceResolver instance."
      );
    }
    this.evidenceResolver = evidenceResolver;
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

    // 3. Vérification de la borne supérieure des matériaux au niveau de la spec (Fix 02 / Fix 03)
    if (context.materialId) {
      if (
        spec.materialReferenceIds.length > 0 &&
        !spec.materialReferenceIds.includes(context.materialId)
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

    // 4. Identification et évaluation des règles de composant dans la Piping Specification
    const upperType = context.componentType.toUpperCase();
    const evaluation = this.evaluatePipingSpecRules(spec, upperType, context);

    if (evaluation.status !== "ADMISSIBLE") {
      return {
        status: evaluation.status,
        specificationId: spec.id,
        componentType: context.componentType,
        matchedRuleIds: evaluation.matchedRuleIds,
        evidenceIds: evaluation.evidenceIds,
        message: evaluation.message,
      };
    }

    const matchedRule = evaluation.matchedRule;
    const ruleEvidenceIds = evaluation.evidenceIds;
    const matchedRuleIds = evaluation.matchedRuleIds;

    // 5. Vérification de l'autorité normative de la règle Piping Spec (Fix 01 & Fix 04)
    // Une règle PipingSpec UNVERIFIED ne peut JAMAIS produire COMPATIBLE.
    const ruleSourceStatus = matchedRule.sourceStatus || spec.sourceStatus;
    if (ruleSourceStatus !== "VERIFIED") {
      return {
        status: "UNVERIFIED",
        specificationId: spec.id,
        componentType: context.componentType,
        matchedRuleIds,
        evidenceIds: ruleEvidenceIds,
        message: `PIPING_SPEC_RULE_UNVERIFIED: Matched rule in specification '${spec.id}' has sourceStatus '${ruleSourceStatus}'.`,
      };
    }

    // Résolution formelle des preuves de la règle via NORM-09
    if (ruleEvidenceIds.length === 0) {
      return {
        status: "UNVERIFIED",
        specificationId: spec.id,
        componentType: context.componentType,
        matchedRuleIds,
        evidenceIds: [],
        message: `PIPING_SPEC_RULE_LACKS_EVIDENCE: Matched rule in specification '${spec.id}' has no associated normative evidence.`,
      };
    }

    const evidenceResolution = this.evidenceResolver.resolveEvidenceSet(ruleEvidenceIds);
    if (!evidenceResolution.allVerified || evidenceResolution.totalRequested === 0) {
      return {
        status: "UNVERIFIED",
        specificationId: spec.id,
        componentType: context.componentType,
        matchedRuleIds,
        evidenceIds: ruleEvidenceIds,
        message: `PIPING_SPEC_EVIDENCE_NOT_VERIFIED: Normative evidence for matched rule in specification '${spec.id}' is unverified or missing.`,
      };
    }

    // 6. Délégation déterministe à NORM-13 (NormativeCompatibilityEngine)
    const combinedEvidenceIds = Array.from(
      new Set([...ruleEvidenceIds, ...(context.evidenceIds ?? [])])
    );

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
      evidenceIds: combinedEvidenceIds,
    };

    const compatDecision = this.compatibilityEngine.evaluate(compatContext);

    const finalMatchedRuleIds = [...matchedRuleIds];
    if (compatDecision.ruleId && !finalMatchedRuleIds.includes(compatDecision.ruleId)) {
      finalMatchedRuleIds.push(compatDecision.ruleId);
    } else if (
      compatDecision.matchedRule?.ruleId &&
      !finalMatchedRuleIds.includes(compatDecision.matchedRule.ruleId)
    ) {
      finalMatchedRuleIds.push(compatDecision.matchedRule.ruleId);
    }

    const finalEvidenceIds = Array.from(
      new Set([
        ...ruleEvidenceIds,
        ...(compatDecision.evidenceIds ?? []),
        ...(context.evidenceIds ?? []),
      ])
    );

    return {
      status: compatDecision.status,
      specificationId: spec.id,
      componentType: context.componentType,
      matchedRuleIds: finalMatchedRuleIds,
      evidenceIds: finalEvidenceIds,
      message: compatDecision.message,
    };
  }

  /**
   * Évalue les règles d'une spécification pour un composant donné.
   */
  private evaluatePipingSpecRules(
    spec: PipingSpecification,
    upperType: string,
    context: PipingSpecResolutionContext
  ): {
    status: "ADMISSIBLE" | "INCOMPATIBLE" | "UNVERIFIED" | "INVALID";
    matchedRule: GenericSpecRule;
    matchedRuleIds: string[];
    evidenceIds: string[];
    message?: string;
  } {
    const defaultEvidence = spec.evidenceIds ?? [];

    if (upperType === "PIPE") {
      if (spec.pipeRules.length === 0) {
        return {
          status: "UNVERIFIED",
          matchedRule: {} as any,
          matchedRuleIds: [],
          evidenceIds: [],
          message: `NO_PIPE_RULES: Specification '${spec.id}' defines 0 pipe rules.`,
        };
      }

      return this.matchPipeRules(spec, context, defaultEvidence);
    }

    if (upperType === "FITTING") {
      if (spec.fittingRules.length === 0) {
        return {
          status: "UNVERIFIED",
          matchedRule: {} as any,
          matchedRuleIds: [],
          evidenceIds: [],
          message: `NO_FITTING_RULES: Specification '${spec.id}' defines 0 fitting rules.`,
        };
      }

      return this.matchFittingRules(spec, context, defaultEvidence);
    }

    if (upperType === "FLANGE") {
      if (spec.flangeRules.length === 0) {
        return {
          status: "UNVERIFIED",
          matchedRule: {} as any,
          matchedRuleIds: [],
          evidenceIds: [],
          message: `NO_FLANGE_RULES: Specification '${spec.id}' defines 0 flange rules.`,
        };
      }

      return this.matchFlangeRules(spec, context, defaultEvidence);
    }

    if (upperType === "VALVE") {
      if (spec.valveRules.length === 0) {
        return {
          status: "UNVERIFIED",
          matchedRule: {} as any,
          matchedRuleIds: [],
          evidenceIds: [],
          message: `NO_VALVE_RULES: Specification '${spec.id}' defines 0 valve rules.`,
        };
      }

      return this.matchValveRules(spec, context, defaultEvidence);
    }

    // Composant sans famille standard
    return {
      status: "UNVERIFIED",
      matchedRule: {} as any,
      matchedRuleIds: [],
      evidenceIds: [],
      message: `UNKNOWN_COMPONENT_FAMILY: Family '${upperType}' has no dedicated rule set in specification '${spec.id}'.`,
    };
  }

  private matchPipeRules(
    spec: PipingSpecification,
    context: PipingSpecResolutionContext,
    specEvidence: readonly string[]
  ) {
    const candidates = spec.pipeRules;

    // Vérification stricte des incompatibilités structurelles
    if (context.dimensionalStandardId) {
      const hasDim = candidates.some(
        (r) => r.pipeDimensionalStandardId === context.dimensionalStandardId
      );
      if (!hasDim) {
        return {
          status: "INCOMPATIBLE" as const,
          matchedRule: {} as any,
          matchedRuleIds: [],
          evidenceIds: [],
          message: `DIMENSIONAL_STANDARD_MISMATCH: Pipe dimensional standard '${context.dimensionalStandardId}' is not authorized in specification '${spec.id}'.`,
        };
      }
    }

    if (context.schedule) {
      const rulesWithSched = candidates.filter((r) => r.schedule !== undefined);
      if (rulesWithSched.length > 0) {
        const hasSched = rulesWithSched.some((r) => r.schedule === context.schedule);
        if (!hasSched) {
          return {
            status: "INCOMPATIBLE" as const,
            matchedRule: {} as any,
            matchedRuleIds: [],
            evidenceIds: [],
            message: `SCHEDULE_MISMATCH: Schedule '${context.schedule}' is not authorized for pipes in specification '${spec.id}'.`,
          };
        }
      }
    }

    if (context.nominalSize) {
      const rulesWithSizes = candidates.filter(
        (r) => r.nominalSizes && r.nominalSizes.length > 0
      );
      if (rulesWithSizes.length > 0) {
        const hasSize = rulesWithSizes.some((r) => r.nominalSizes!.includes(context.nominalSize!));
        if (!hasSize) {
          return {
            status: "INCOMPATIBLE" as const,
            matchedRule: {} as any,
            matchedRuleIds: [],
            evidenceIds: [],
            message: `NOMINAL_SIZE_MISMATCH: Nominal size '${context.nominalSize}' is not covered for pipes in specification '${spec.id}'.`,
          };
        }
      }
    }

    if (context.materialId) {
      const rulesWithMat = candidates.filter((r) => r.materialId !== undefined);
      if (rulesWithMat.length > 0) {
        const hasMat = rulesWithMat.some((r) => r.materialId === context.materialId);
        if (!hasMat) {
          return {
            status: "INCOMPATIBLE" as const,
            matchedRule: {} as any,
            matchedRuleIds: [],
            evidenceIds: [],
            message: `MATERIAL_MISMATCH: Material '${context.materialId}' is not authorized by pipe rules in specification '${spec.id}'.`,
          };
        }
      }
    }

    // Filtrer les règles correspondant au contexte
    const matching = candidates.filter((rule) => {
      if (
        context.dimensionalStandardId &&
        rule.pipeDimensionalStandardId !== context.dimensionalStandardId
      ) {
        return false;
      }
      if (context.schedule && rule.schedule && rule.schedule !== context.schedule) {
        return false;
      }
      if (
        context.nominalSize &&
        rule.nominalSizes &&
        !rule.nominalSizes.includes(context.nominalSize)
      ) {
        return false;
      }
      if (context.materialId && rule.materialId && rule.materialId !== context.materialId) {
        return false;
      }
      return true;
    });

    return this.resolveRuleCandidates(matching, specEvidence, "pipe");
  }

  private matchFittingRules(
    spec: PipingSpecification,
    context: PipingSpecResolutionContext,
    specEvidence: readonly string[]
  ) {
    const candidates = spec.fittingRules;

    if (context.productStandardId) {
      const hasProd = candidates.some((r) => r.fittingStandardId === context.productStandardId);
      if (!hasProd) {
        return {
          status: "INCOMPATIBLE" as const,
          matchedRule: {} as any,
          matchedRuleIds: [],
          evidenceIds: [],
          message: `PRODUCT_STANDARD_MISMATCH: Fitting product standard '${context.productStandardId}' is not authorized in specification '${spec.id}'.`,
        };
      }
    }

    if (context.fittingType) {
      const rulesWithTypes = candidates.filter(
        (r) => r.fittingTypes && r.fittingTypes.length > 0
      );
      if (rulesWithTypes.length > 0) {
        const hasType = rulesWithTypes.some((r) =>
          r.fittingTypes!.includes(context.fittingType as any)
        );
        if (!hasType) {
          return {
            status: "INCOMPATIBLE" as const,
            matchedRule: {} as any,
            matchedRuleIds: [],
            evidenceIds: [],
            message: `FITTING_TYPE_MISMATCH: Fitting type '${context.fittingType}' is not authorized in specification '${spec.id}'.`,
          };
        }
      }
    }

    if (context.connectionType) {
      const rulesWithConn = candidates.filter(
        (r) => r.connectionTypes && r.connectionTypes.length > 0
      );
      if (rulesWithConn.length > 0) {
        const hasConn = rulesWithConn.some((r) =>
          r.connectionTypes!.includes(context.connectionType as any)
        );
        if (!hasConn) {
          return {
            status: "INCOMPATIBLE" as const,
            matchedRule: {} as any,
            matchedRuleIds: [],
            evidenceIds: [],
            message: `CONNECTION_TYPE_MISMATCH: Fitting connection type '${context.connectionType}' is not authorized in specification '${spec.id}'.`,
          };
        }
      }
    }

    if (context.materialId) {
      const rulesWithMat = candidates.filter((r) => r.materialId !== undefined);
      if (rulesWithMat.length > 0) {
        const hasMat = rulesWithMat.some((r) => r.materialId === context.materialId);
        if (!hasMat) {
          return {
            status: "INCOMPATIBLE" as const,
            matchedRule: {} as any,
            matchedRuleIds: [],
            evidenceIds: [],
            message: `MATERIAL_MISMATCH: Material '${context.materialId}' is not authorized by fitting rules in specification '${spec.id}'.`,
          };
        }
      }
    }

    const matching = candidates.filter((rule) => {
      if (context.productStandardId && rule.fittingStandardId !== context.productStandardId) {
        return false;
      }
      if (
        context.fittingType &&
        rule.fittingTypes &&
        !rule.fittingTypes.includes(context.fittingType as any)
      ) {
        return false;
      }
      if (
        context.connectionType &&
        rule.connectionTypes &&
        !rule.connectionTypes.includes(context.connectionType as any)
      ) {
        return false;
      }
      if (context.materialId && rule.materialId && rule.materialId !== context.materialId) {
        return false;
      }
      return true;
    });

    return this.resolveRuleCandidates(matching, specEvidence, "fitting");
  }

  private matchFlangeRules(
    spec: PipingSpecification,
    context: PipingSpecResolutionContext,
    specEvidence: readonly string[]
  ) {
    const candidates = spec.flangeRules;

    if (context.productStandardId) {
      const hasProd = candidates.some((r) => r.flangeStandardId === context.productStandardId);
      if (!hasProd) {
        return {
          status: "INCOMPATIBLE" as const,
          matchedRule: {} as any,
          matchedRuleIds: [],
          evidenceIds: [],
          message: `PRODUCT_STANDARD_MISMATCH: Flange product standard '${context.productStandardId}' is not authorized in specification '${spec.id}'.`,
        };
      }
    }

    if (context.ratingSystem) {
      const rulesWithRatingSys = candidates.filter((r) => r.ratingSystem !== undefined);
      if (rulesWithRatingSys.length > 0) {
        const hasRatingSys = rulesWithRatingSys.some((r) => r.ratingSystem === context.ratingSystem);
        if (!hasRatingSys) {
          return {
            status: "INCOMPATIBLE" as const,
            matchedRule: {} as any,
            matchedRuleIds: [],
            evidenceIds: [],
            message: `RATING_SYSTEM_MISMATCH: Flange rating system '${context.ratingSystem}' is not authorized in specification '${spec.id}'.`,
          };
        }
      }
    }

    if (context.ratingValue) {
      const rulesWithRating = candidates.filter((r) => r.rating !== undefined);
      if (rulesWithRating.length > 0) {
        const hasRating = rulesWithRating.some((r) => r.rating === context.ratingValue);
        if (!hasRating) {
          return {
            status: "INCOMPATIBLE" as const,
            matchedRule: {} as any,
            matchedRuleIds: [],
            evidenceIds: [],
            message: `RATING_VALUE_MISMATCH: Flange rating '${context.ratingValue}' is not authorized in specification '${spec.id}'.`,
          };
        }
      }
    }

    if (context.materialId) {
      const rulesWithMat = candidates.filter((r) => r.materialId !== undefined);
      if (rulesWithMat.length > 0) {
        const hasMat = rulesWithMat.some((r) => r.materialId === context.materialId);
        if (!hasMat) {
          return {
            status: "INCOMPATIBLE" as const,
            matchedRule: {} as any,
            matchedRuleIds: [],
            evidenceIds: [],
            message: `MATERIAL_MISMATCH: Material '${context.materialId}' is not authorized by flange rules in specification '${spec.id}'.`,
          };
        }
      }
    }

    const matching = candidates.filter((rule) => {
      if (context.productStandardId && rule.flangeStandardId !== context.productStandardId) {
        return false;
      }
      if (context.ratingSystem && rule.ratingSystem && rule.ratingSystem !== context.ratingSystem) {
        return false;
      }
      if (context.ratingValue && rule.rating && rule.rating !== context.ratingValue) {
        return false;
      }
      if (context.materialId && rule.materialId && rule.materialId !== context.materialId) {
        return false;
      }
      return true;
    });

    return this.resolveRuleCandidates(matching, specEvidence, "flange");
  }

  private matchValveRules(
    spec: PipingSpecification,
    context: PipingSpecResolutionContext,
    specEvidence: readonly string[]
  ) {
    const candidates = spec.valveRules;

    if (context.productStandardId) {
      const rulesWithProd = candidates.filter((r) => r.productStandardId !== undefined);
      if (rulesWithProd.length > 0) {
        const hasProd = rulesWithProd.some((r) => r.productStandardId === context.productStandardId);
        if (!hasProd) {
          return {
            status: "INCOMPATIBLE" as const,
            matchedRule: {} as any,
            matchedRuleIds: [],
            evidenceIds: [],
            message: `PRODUCT_STANDARD_MISMATCH: Valve product standard '${context.productStandardId}' is not authorized in specification '${spec.id}'.`,
          };
        }
      }
    }

    if (context.dimensionalStandardId) {
      const rulesWithDim = candidates.filter((r) => r.dimensionalStandardId !== undefined);
      if (rulesWithDim.length > 0) {
        const hasDim = rulesWithDim.some(
          (r) => r.dimensionalStandardId === context.dimensionalStandardId
        );
        if (!hasDim) {
          return {
            status: "INCOMPATIBLE" as const,
            matchedRule: {} as any,
            matchedRuleIds: [],
            evidenceIds: [],
            message: `DIMENSIONAL_STANDARD_MISMATCH: Valve dimensional standard '${context.dimensionalStandardId}' is not authorized in specification '${spec.id}'.`,
          };
        }
      }
    }

    if (context.connectionType) {
      const rulesWithConn = candidates.filter(
        (r) => r.connectionTypes && r.connectionTypes.length > 0
      );
      if (rulesWithConn.length > 0) {
        const hasConn = rulesWithConn.some((r) =>
          r.connectionTypes!.includes(context.connectionType as any)
        );
        if (!hasConn) {
          return {
            status: "INCOMPATIBLE" as const,
            matchedRule: {} as any,
            matchedRuleIds: [],
            evidenceIds: [],
            message: `CONNECTION_TYPE_MISMATCH: Valve connection type '${context.connectionType}' is not authorized in specification '${spec.id}'.`,
          };
        }
      }
    }

    if (context.materialId) {
      const rulesWithMat = candidates.filter((r) => r.materialId !== undefined);
      if (rulesWithMat.length > 0) {
        const hasMat = rulesWithMat.some((r) => r.materialId === context.materialId);
        if (!hasMat) {
          return {
            status: "INCOMPATIBLE" as const,
            matchedRule: {} as any,
            matchedRuleIds: [],
            evidenceIds: [],
            message: `MATERIAL_MISMATCH: Material '${context.materialId}' is not authorized by valve rules in specification '${spec.id}'.`,
          };
        }
      }
    }

    const matching = candidates.filter((rule) => {
      if (
        context.productStandardId &&
        rule.productStandardId &&
        rule.productStandardId !== context.productStandardId
      ) {
        return false;
      }
      if (
        context.dimensionalStandardId &&
        rule.dimensionalStandardId &&
        rule.dimensionalStandardId !== context.dimensionalStandardId
      ) {
        return false;
      }
      if (
        context.connectionType &&
        rule.connectionTypes &&
        !rule.connectionTypes.includes(context.connectionType as any)
      ) {
        return false;
      }
      if (context.materialId && rule.materialId && rule.materialId !== context.materialId) {
        return false;
      }
      return true;
    });

    return this.resolveRuleCandidates(matching, specEvidence, "valve");
  }

  /**
   * Résout une liste de règles candidates de façon déterministe avec détection de conflits.
   */
  private resolveRuleCandidates<T extends GenericSpecRule>(
    matching: readonly T[],
    specEvidence: readonly string[],
    familyName: string
  ): {
    status: "ADMISSIBLE" | "INCOMPATIBLE" | "UNVERIFIED" | "INVALID";
    matchedRule: GenericSpecRule;
    matchedRuleIds: string[];
    evidenceIds: string[];
    message?: string;
  } {
    if (matching.length === 0) {
      return {
        status: "UNVERIFIED",
        matchedRule: {} as any,
        matchedRuleIds: [],
        evidenceIds: [],
        message: `NO_MATCHING_RULE: No ${familyName} rule in specification matched the exact context.`,
      };
    }

    // Détection de conflit direct entre règles contradictoires
    // Deux règles sont contradictoires si elles définissent des contraintes incompatibles pour un même statut
    // ou si une règle est déclarée VERIFIED avec des contraintes matérielles/dimensionnelles opposées
    if (matching.length > 1) {
      const distinctMaterials = new Set(
        matching.map((r) => r.materialId).filter((m) => m !== undefined)
      );
      if (distinctMaterials.size > 1) {
        return {
          status: "INVALID",
          matchedRule: {} as any,
          matchedRuleIds: matching.map((r) => r.ruleId ?? "UNNAMED_RULE"),
          evidenceIds: [],
          message: `NORMATIVE_RULE_CONFLICT: Detected contradictory ${familyName} rules with conflicting material constraints.`,
        };
      }
    }

    const primaryRule = matching[0];
    const matchedRuleIds = matching
      .map((r) => r.ruleId)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    const ruleEvIds = primaryRule.evidenceIds ?? specEvidence;

    return {
      status: "ADMISSIBLE",
      matchedRule: primaryRule,
      matchedRuleIds,
      evidenceIds: Array.from(new Set(ruleEvIds)),
    };
  }
}
