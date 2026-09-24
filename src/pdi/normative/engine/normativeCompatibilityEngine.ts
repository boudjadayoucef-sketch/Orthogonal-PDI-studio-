/**
 * PDI NORMATIVE ENGINE — NORMATIVE COMPATIBILITY ENGINE
 * Reference: NORM-13 (Normative Compatibility Matrix)
 * 
 * Moteur déterministe d'évaluation de la compatibilité normative.
 * RÈGLES DE FONCTIONNEMENT (NORM-13) :
 * 1. Étape 1 : Validation structurelle du contexte. Contexte invalide → INVALID.
 * 2. Étape 2 : Recherche des règles correspondant au contexte par matching dimensionnel strict.
 *    - Une règle ne correspond que si tous les critères non-undefined de la règle sont strictement égaux aux valeurs du contexte.
 *    - Aucun fuzzy matching, aucun ranking arbitraire, aucune conversion implicite (NPS↔DN, Class↔PN).
 * 3. Étape 3 : Résolution basée sur les preuves normatives (NORM-09 Evidence Resolver).
 *    - COMPATIBLE avec evidence VERIFIED → COMPATIBLE.
 *    - INCOMPATIBLE avec evidence VERIFIED → INCOMPATIBLE.
 *    - Règle sans evidence ou evidence UNVERIFIED/NOT_FOUND → UNVERIFIED.
 *    - Absence de règle correspondante → UNVERIFIED (l'absence de règle n'est JAMAIS une incompatibilité).
 *    - Une règle non vérifiée ne masque JAMAIS une règle vérifiée.
 */

import type {
  NormativeCompatibilityContext,
  NormativeCompatibilityResult,
  NormativeCompatibilityRule,
} from "../types/normativeCompatibilityTypes";
import type { INormativeCompatibilityRegistry } from "../registry/normativeCompatibilityRegistry";
import { defaultCompatibilityRegistry } from "../registry/normativeCompatibilityRegistry";
import type { INormativeEvidenceResolver } from "../registry/normativeEvidenceResolver";
import { NormativeEvidenceResolver } from "../registry/normativeEvidenceResolver";
import { validateNormativeCompatibilityContext } from "../validators/normativeCompatibilityValidator";

export interface INormativeCompatibilityEngine {
  evaluate(context: NormativeCompatibilityContext): NormativeCompatibilityResult;
}

const MATCH_FIELDS: readonly (keyof NormativeCompatibilityContext & keyof NormativeCompatibilityRule)[] = Object.freeze([
  "standardId",
  "editionId",
  "componentType",
  "connectionType",
  "nominalSize",
  "schedule",
  "pressureRating",
  "materialId",
  "materialForm",
  "designCodeId",
  "pipingSpecId",
]);

export class NormativeCompatibilityEngine implements INormativeCompatibilityEngine {
  constructor(
    private readonly registry: INormativeCompatibilityRegistry = defaultCompatibilityRegistry,
    private readonly evidenceResolver: INormativeEvidenceResolver = new NormativeEvidenceResolver()
  ) {}

  /**
   * Évalue un contexte de caractéristiques industrielles par rapport aux règles de compatibilité enregistrées.
   */
  public evaluate(context: NormativeCompatibilityContext): NormativeCompatibilityResult {
    // ÉTAPE 1 : Validation du contexte
    const contextValidation = validateNormativeCompatibilityContext(context);
    if (!contextValidation.valid) {
      const errorMsg = contextValidation.errors
        .map((e) => `[${e.code}] ${e.message}`)
        .join("; ");
      return {
        status: "INVALID",
        message: `INVALID_COMPATIBILITY_CONTEXT: ${errorMsg}`,
      };
    }

    // ÉTAPE 2 : Recherche des règles candidates
    const allRules = this.registry.list();
    const matchingRules = allRules.filter((rule) => this.doesRuleMatchContext(rule, context));

    if (matchingRules.length === 0) {
      return {
        status: "UNVERIFIED",
        message: "No matching compatibility rule found in registry.",
      };
    }

    // ÉTAPE 3 : Résolution déterministe avec vérification d'évidence
    // Structure interne pour stocker l'évaluation d'une règle
    interface EvaluatedRule {
      readonly rule: NormativeCompatibilityRule;
      readonly isEvidenceVerified: boolean;
      readonly evidenceIds: readonly string[];
    }

    const evaluatedRules: EvaluatedRule[] = matchingRules.map((rule) => {
      const eIds = rule.evidenceIds ?? [];
      let isVerified = false;

      if (eIds.length > 0) {
        const resolution = this.evidenceResolver.resolveEvidenceSet(eIds);
        isVerified = resolution.allVerified && resolution.totalRequested > 0;
      }

      return {
        rule,
        isEvidenceVerified: isVerified,
        evidenceIds: eIds,
      };
    });

    // 1. Chercher d'abord les règles INCOMPATIBLE vérifiées
    const verifiedIncompatible = evaluatedRules.find(
      (er) => er.rule.status === "INCOMPATIBLE" && er.isEvidenceVerified
    );
    if (verifiedIncompatible) {
      return {
        status: "INCOMPATIBLE",
        ruleId: verifiedIncompatible.rule.ruleId,
        matchedRule: verifiedIncompatible.rule,
        evidenceIds: verifiedIncompatible.evidenceIds,
        message: verifiedIncompatible.rule.description,
      };
    }

    // 2. Chercher les règles COMPATIBLE vérifiées (une règle non vérifiée ne masque pas une règle vérifiée)
    const verifiedCompatible = evaluatedRules.find(
      (er) => er.rule.status === "COMPATIBLE" && er.isEvidenceVerified
    );
    if (verifiedCompatible) {
      return {
        status: "COMPATIBLE",
        ruleId: verifiedCompatible.rule.ruleId,
        matchedRule: verifiedCompatible.rule,
        evidenceIds: verifiedCompatible.evidenceIds,
        message: verifiedCompatible.rule.description,
      };
    }

    // 3. Si des règles correspondent mais qu'aucune n'a de preuve vérifiée complète → UNVERIFIED
    const firstMatch = evaluatedRules[0];
    return {
      status: "UNVERIFIED",
      ruleId: firstMatch.rule.ruleId,
      matchedRule: firstMatch.rule,
      evidenceIds: firstMatch.evidenceIds,
      message: `Matching rule '${firstMatch.rule.ruleId}' lacks valid VERIFIED normative evidence.`,
    };
  }

  /**
   * Vérifie si tous les critères définis sur une règle correspondent exactement aux valeurs fournies dans le contexte.
   */
  private doesRuleMatchContext(
    rule: NormativeCompatibilityRule,
    context: NormativeCompatibilityContext
  ): boolean {
    for (const field of MATCH_FIELDS) {
      const ruleVal = rule[field];
      if (ruleVal !== undefined) {
        const ctxVal = context[field];
        if (ctxVal === undefined || ctxVal !== ruleVal) {
          return false;
        }
      }
    }
    return true;
  }
}
