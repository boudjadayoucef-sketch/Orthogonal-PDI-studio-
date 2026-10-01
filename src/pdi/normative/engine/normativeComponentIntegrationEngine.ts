/**
 * PDI NORMATIVE ENGINE — NORMATIVE COMPONENT INTEGRATION ENGINE
 * Reference: NORM-14-09 (Integration with COMPONENT-01 → COMPONENT-05)
 * 
 * Moteur d'intégration déterministe reliant la résolution de composants (COMPONENT-01..05)
 * à l'intégration Spec ↔ Compatibilité (NORM-14-08) et à la multi-compatibilité (NORM-14-07).
 * 
 * RÈGLES DE CONCEPTION STRICTES :
 * 1. Orchestration & intégration pures : délègue sans recalculer ni créer de règles normatives.
 * 2. NORM-14-01 reste l'unique source de vérité pour la compatibilité normative.
 * 3. SPEC-01 reste l'unique source de vérité pour les règles de Piping Spec.
 * 4. COMPONENT-01..05 restent les sources des contrats de sélection de composants.
 * 5. Aucune deuxième source de vérité, aucune règle codée en dur, aucun second registre.
 * 6. Directionnalité stricte (pas d'inversion automatique).
 * 7. Préservation absolue de la traçabilité : union, déduplication, tri et gel des matchedRuleIds, evidenceIds et conflictCodes.
 * 8. Consolidation des statuts : INVALID > INCOMPATIBLE > UNVERIFIED > COMPATIBLE.
 * 9. Aucune promotion d'évidence, aucun fuzzy matching, aucun ranking.
 */

import type {
  INormativeComponentIntegrationEngine,
  NormativeComponentIntegrationQuery,
  NormativeComponentIntegrationResult,
  NormativeComponentIntegrationStatus,
} from "../types/normativeComponentIntegrationTypes";
import type {
  ComponentResolutionResult,
  IComponentResolutionEngine,
} from "../types/componentResolutionTypes";
import type {
  INormativeSpecCompatibilityIntegrationEngine,
  NormativeSpecCompatibilityIntegrationResult,
} from "../types/normativeSpecCompatibilityIntegrationTypes";
import { validateNormativeComponentIntegrationQuery } from "../validators/normativeComponentIntegrationValidator";

export class NormativeComponentIntegrationEngine
  implements INormativeComponentIntegrationEngine
{
  private readonly specCompatibilityEngine: INormativeSpecCompatibilityIntegrationEngine;
  private readonly componentEngine?: IComponentResolutionEngine;

  constructor(
    dep1: INormativeSpecCompatibilityIntegrationEngine | IComponentResolutionEngine,
    dep2?: INormativeSpecCompatibilityIntegrationEngine | IComponentResolutionEngine
  ) {
    if (!dep1) {
      throw new Error(
        "COMPONENT_INTEGRATION_ENGINE_ERROR: Dependencies must be provided by injection."
      );
    }

    if (dep2) {
      if (
        (dep1 as any).candidateResolver ||
        (dep1 as any).resolveBySpecification ||
        dep1.constructor.name.includes("Component") ||
        dep2.constructor.name.includes("Spec") ||
        (dep2 as any).multiCompatibilityEngine
      ) {
        this.componentEngine = dep1 as IComponentResolutionEngine;
        this.specCompatibilityEngine = dep2 as INormativeSpecCompatibilityIntegrationEngine;
      } else if (
        (dep2 as any).candidateResolver ||
        (dep2 as any).resolveBySpecification ||
        dep2.constructor.name.includes("Component") ||
        dep1.constructor.name.includes("Spec") ||
        (dep1 as any).multiCompatibilityEngine
      ) {
        this.specCompatibilityEngine = dep1 as INormativeSpecCompatibilityIntegrationEngine;
        this.componentEngine = dep2 as IComponentResolutionEngine;
      } else {
        // Ordre par défaut Section 6 : (componentEngine, specCompatibilityEngine)
        this.componentEngine = dep1 as IComponentResolutionEngine;
        this.specCompatibilityEngine = dep2 as INormativeSpecCompatibilityIntegrationEngine;
      }
    } else {
      this.specCompatibilityEngine = dep1 as INormativeSpecCompatibilityIntegrationEngine;
      this.componentEngine = undefined;
    }

    if (
      !this.specCompatibilityEngine ||
      typeof this.specCompatibilityEngine.resolve !== "function"
    ) {
      throw new Error(
        "COMPONENT_INTEGRATION_ENGINE_ERROR: A valid INormativeSpecCompatibilityIntegrationEngine instance must be injected."
      );
    }
  }

  /**
   * Intègre la sélection/résolution de composant avec l'intégration SPEC-01 et la multi-compatibilité NORM-14-07.
   */
  public resolve(
    query: NormativeComponentIntegrationQuery
  ): NormativeComponentIntegrationResult {
    // 1. Validation structurelle de la requête
    const validation = validateNormativeComponentIntegrationQuery(query);

    if (!validation.valid) {
      const errorMsg = validation.errors
        .map((e) => `[${e.code}] ${e.message}`)
        .join("; ");

      const fallbackComponentRes: ComponentResolutionResult = Object.freeze({
        status: "INVALID" as const,
        specificationId:
          query && typeof query === "object" && query.componentContext && typeof query.componentContext.specificationId === "string"
            ? query.componentContext.specificationId
            : "",
        componentType:
          query && typeof query === "object" && query.componentContext && typeof query.componentContext.componentType === "string"
            ? query.componentContext.componentType
            : ("PIPE" as const),
        evaluatedCandidateIds: Object.freeze([]),
        eligibleCandidateIds: Object.freeze([]),
        unverifiedCandidateIds: Object.freeze([]),
        invalidCandidateIds: Object.freeze([]),
        matchedRuleIds: Object.freeze([]),
        compatibilityRuleIds: Object.freeze([]),
        evidenceIds: Object.freeze([]),
        message: "Component integration query validation failed.",
      });

      const fallbackSpecResult: NormativeSpecCompatibilityIntegrationResult = Object.freeze({
        status: "INVALID" as const,
        specResolution: Object.freeze({
          status: "INVALID" as const,
          specificationId: "",
          componentType: "",
          matchedRuleIds: Object.freeze([]),
          compatibilityRuleIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
        }),
        compatibilityResult: Object.freeze({
          status: "INVALID" as const,
          constraintResults: Object.freeze([]),
          matchedRuleIds: Object.freeze([]),
          evidenceIds: Object.freeze([]),
          message: "Query validation failed.",
          conflictCodes: Object.freeze(["INVALID_COMPONENT_INTEGRATION_QUERY"]),
        }),
        matchedRuleIds: Object.freeze([]),
        evidenceIds: Object.freeze([]),
        message: "Query validation failed.",
        conflictCodes: Object.freeze(["INVALID_COMPONENT_INTEGRATION_QUERY"]),
      });

      return Object.freeze({
        status: "INVALID",
        componentResolution: fallbackComponentRes,
        specCompatibilityResult: fallbackSpecResult,
        matchedRuleIds: Object.freeze([]),
        evidenceIds: Object.freeze([]),
        conflictCodes: Object.freeze(["INVALID_COMPONENT_INTEGRATION_QUERY"]),
        message: `INVALID_COMPONENT_INTEGRATION_QUERY: ${errorMsg}`,
      });
    }

    // 2. Résolution du composant (COMPONENT-01..05)
    let compRes: ComponentResolutionResult;
    if (query.componentResolution) {
      compRes = query.componentResolution;
    } else if (this.componentEngine) {
      compRes = this.componentEngine.resolve({
        specificationId: query.componentContext.specificationId,
        context: query.componentContext,
      });
    } else {
      compRes = Object.freeze({
        status: "RESOLVED" as const,
        specificationId: query.componentContext.specificationId,
        componentType: query.componentContext.componentType,
        evaluatedCandidateIds: Object.freeze([]),
        eligibleCandidateIds: Object.freeze([]),
        unverifiedCandidateIds: Object.freeze([]),
        invalidCandidateIds: Object.freeze([]),
        matchedRuleIds: Object.freeze([]),
        compatibilityRuleIds: Object.freeze([]),
        evidenceIds: Object.freeze([]),
        message: "Component context accepted.",
      });
    }

    // 3. Délégation exclusive à NORM-14-08 (Spec ↔ Compatibility)
    const specCompatResult = this.specCompatibilityEngine.resolve({
      specResolution: query.specResolution,
      compatibilityQuery: query.compatibilityQuery,
    });

    // 4. Consolidation des statuts : INVALID > INCOMPATIBLE > UNVERIFIED > COMPATIBLE
    let normCompStatus: NormativeComponentIntegrationStatus;
    if (compRes.status === "INVALID") {
      normCompStatus = "INVALID";
    } else if (
      compRes.status === "NO_CANDIDATE" ||
      compRes.status === "INCOMPATIBLE" ||
      compRes.status === ("INELIGIBLE" as any)
    ) {
      normCompStatus = "INCOMPATIBLE";
    } else if (
      compRes.status === "UNVERIFIED" ||
      compRes.status === "AMBIGUOUS"
    ) {
      normCompStatus = "UNVERIFIED";
    } else {
      normCompStatus = "COMPATIBLE";
    }

    const specCompatStatus = specCompatResult.status;

    let finalStatus: NormativeComponentIntegrationStatus = "COMPATIBLE";
    if (normCompStatus === "INVALID" || specCompatStatus === "INVALID") {
      finalStatus = "INVALID";
    } else if (
      normCompStatus === "INCOMPATIBLE" ||
      specCompatStatus === "INCOMPATIBLE"
    ) {
      finalStatus = "INCOMPATIBLE";
    } else if (
      normCompStatus === "UNVERIFIED" ||
      specCompatStatus === "UNVERIFIED"
    ) {
      finalStatus = "UNVERIFIED";
    } else {
      finalStatus = "COMPATIBLE";
    }

    // 5. Traçabilité globale intégrée : union, déduplication, tri et gel
    const allRuleIds: string[] = [
      ...(compRes.matchedRuleIds || []),
      ...(compRes.compatibilityRuleIds || []),
      ...(specCompatResult.matchedRuleIds || []),
    ];

    const allEvidenceIds: string[] = [
      ...(compRes.evidenceIds || []),
      ...(specCompatResult.evidenceIds || []),
    ];

    const allConflictCodes: string[] = [
      ...(specCompatResult.conflictCodes || []),
    ];

    if (normCompStatus === "INCOMPATIBLE" && compRes.status === "NO_CANDIDATE") {
      allConflictCodes.push("COMPONENT_NO_CANDIDATE");
    }

    const sortedMatchedRuleIds = Object.freeze(
      Array.from(new Set(allRuleIds)).sort()
    );
    const sortedEvidenceIds = Object.freeze(
      Array.from(new Set(allEvidenceIds)).sort()
    );
    const sortedConflictCodes = Object.freeze(
      Array.from(new Set(allConflictCodes)).sort()
    );

    const message = `Component resolution '${compRes.status}' integrated with Spec/Compatibility '${specCompatStatus}' -> Consolidated status '${finalStatus}'.`;

    return Object.freeze({
      status: finalStatus,
      componentResolution: Object.freeze({ ...compRes }),
      specCompatibilityResult: specCompatResult,
      matchedRuleIds: sortedMatchedRuleIds,
      evidenceIds: sortedEvidenceIds,
      conflictCodes: sortedConflictCodes,
      message,
    });
  }
}
