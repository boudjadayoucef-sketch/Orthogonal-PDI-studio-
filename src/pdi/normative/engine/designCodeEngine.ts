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
  DesignCodeFormulaReference,
  DiameterBasis,
  ResolvedNormativeFactor,
} from "../types/designCodeTypes";
import type {
  StandardEdition,
} from "../types/normativeCoreTypes";
import {
  validateCompleteEngineeringCalculationInput,
  validateDesignCodeFormulaReference,
  isFormulaQualified,
  isRecordObject,
} from "../validators/designCodeValidator";
import {
  getDesignCodeCalculationEntry,
} from "../registry/designCodeRegistry";

function buildInputsRecord(
  input: EngineeringCalculationInput,
  diameterBasis?: DiameterBasis
): Readonly<Record<string, number | string | undefined>> {
  return Object.freeze({
    pressure: input.pressure,
    temperature: input.temperature,
    outsideDiameterMm: input.outsideDiameterMm,
    insideDiameterMm: input.insideDiameterMm,
    wallThicknessMm: input.wallThicknessMm,
    diameterBasis: diameterBasis ?? input.diameterBasis,
    materialId: input.materialId,
    allowableStressMpa: input.allowableStressMpa ?? input.allowableStressInput?.value,
    corrosionAllowanceMm: input.corrosionAllowanceMm,
    weldJointFactor: input.weldJointFactor ?? input.qualityFactorInput?.factorValue,
    weldReductionFactor: input.weldReductionFactor ?? input.weldReductionFactorInput?.factorValue,
    yCoefficient: input.yCoefficient ?? input.yCoefficientInput?.factorValue,
    designFactor: input.designFactor,
    unitSystem: input.unitSystem,
  });
}

/**
 * Exécution qualifiée de la formule F01 : ASME B31.3-2024 para. 304.1.2(a) Équations (3a) et (3b).
 */
function executeAsmeB313F01Calculation(
  input: EngineeringCalculationInput,
  formula: DesignCodeFormulaReference,
  effectiveEdition: StandardEdition | undefined
): EngineeringCalculationResult {
  const P = input.pressure;
  if (typeof P !== "number" || !Number.isFinite(P) || P <= 0) {
    return Object.freeze({
      status: "INVALID_INPUT",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      inputs: buildInputsRecord(input),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze(["INVALID_PRESSURE: P doit être un nombre fini strictement positif (> 0)."]),
    });
  }

  const c = input.corrosionAllowanceMm;
  if (typeof c !== "number" || !Number.isFinite(c) || c < 0) {
    return Object.freeze({
      status: "INVALID_INPUT",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      inputs: buildInputsRecord(input),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze([
        "INVALID_CORROSION_ALLOWANCE: La surépaisseur de corrosion (c) doit être un nombre fini positif ou nul (>= 0).",
      ]),
    });
  }

  // Vérification stricte des diamètres
  const hasOutside = typeof input.outsideDiameterMm === "number" && Number.isFinite(input.outsideDiameterMm);
  const hasInside = typeof input.insideDiameterMm === "number" && Number.isFinite(input.insideDiameterMm);

  if (hasOutside && input.outsideDiameterMm! <= 0) {
    return Object.freeze({
      status: "INVALID_INPUT",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      inputs: buildInputsRecord(input),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze(["INVALID_DIAMETER: outsideDiameterMm doit être strictement positif (> 0)."]),
    });
  }
  if (hasInside && input.insideDiameterMm! <= 0) {
    return Object.freeze({
      status: "INVALID_INPUT",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      inputs: buildInputsRecord(input),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze(["INVALID_DIAMETER: insideDiameterMm doit être strictement positif (> 0)."]),
    });
  }
  if (!hasOutside && !hasInside) {
    return Object.freeze({
      status: "INVALID_INPUT",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      inputs: buildInputsRecord(input),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze([
        "PIPE_DIMENSION_REFERENCE_REQUIRED: outsideDiameterMm ou insideDiameterMm est obligatoire.",
      ]),
    });
  }
  if (hasOutside && hasInside && !input.diameterBasis) {
    return Object.freeze({
      status: "INVALID_INPUT",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      inputs: buildInputsRecord(input),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze([
        "DIAMETER_BASIS_REQUIRED: Les deux diamètres sont fournis sans diameterBasis. Déclarer explicitement diameterBasis ('OUTSIDE' ou 'INSIDE').",
      ]),
    });
  }

  let diameterBasis: DiameterBasis;
  if (hasOutside && hasInside) {
    diameterBasis = input.diameterBasis!;
  } else if (hasOutside) {
    diameterBasis = "OUTSIDE";
  } else {
    diameterBasis = "INSIDE";
  }

  // 1. Facteur S (Contrainte admissible)
  let S: number | undefined;
  let sContractVerified = false;
  let sValueVerified = false;
  let sSource: string | undefined;

  if (isRecordObject(input.allowableStressInput) && typeof input.allowableStressInput.value === "number") {
    S = input.allowableStressInput.value;
    sContractVerified = Number.isFinite(S);
    if (
      input.allowableStressInput.qualificationStatus === "VERIFIED" &&
      typeof input.allowableStressInput.sourceReference === "string" &&
      input.allowableStressInput.sourceReference.trim().length > 0 &&
      Boolean(input.allowableStressInput.materialReference || input.materialId)
    ) {
      sValueVerified = true;
      sSource = input.allowableStressInput.sourceReference;
    }
  } else if (typeof input.allowableStressMpa === "number") {
    S = input.allowableStressMpa;
    sContractVerified = Number.isFinite(S);
    sValueVerified = false; // Une valeur numérique brute sans provenance n'est JAMAIS VALUE VERIFIED
  }

  if (S === undefined) {
    return Object.freeze({
      status: "INVALID_INPUT",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      diameterBasis,
      inputs: buildInputsRecord(input, diameterBasis),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze(["MISSING_REQUIRED_INPUT: S (contrainte admissible) est obligatoire."]),
    });
  }
  if (!Number.isFinite(S) || S <= 0) {
    return Object.freeze({
      status: "INVALID_INPUT",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      diameterBasis,
      inputs: buildInputsRecord(input, diameterBasis),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze(["INVALID_INPUT_VALUE: S doit être un nombre fini strictement positif (> 0)."]),
    });
  }

  // 2. Facteur E (Facteur de qualité de joint)
  let E: number | undefined;
  let eContractVerified = false;
  let eValueVerified = false;
  let eSource: string | undefined;

  if (isRecordObject(input.qualityFactorInput) && typeof input.qualityFactorInput.factorValue === "number") {
    E = input.qualityFactorInput.factorValue;
    eContractVerified = Number.isFinite(E);
    if (
      input.qualityFactorInput.qualificationStatus === "VERIFIED" &&
      typeof input.qualityFactorInput.sourceReference === "string" &&
      input.qualityFactorInput.sourceReference.trim().length > 0
    ) {
      eValueVerified = true;
      eSource = input.qualityFactorInput.sourceReference;
    }
  } else if (typeof input.weldJointFactor === "number") {
    E = input.weldJointFactor;
    eContractVerified = Number.isFinite(E);
    eValueVerified = false; // Valeur brute sans provenance
  }

  if (E === undefined) {
    return Object.freeze({
      status: "INVALID_INPUT",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      diameterBasis,
      inputs: buildInputsRecord(input, diameterBasis),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze(["MISSING_REQUIRED_INPUT: E (facteur de joint) est obligatoire."]),
    });
  }
  if (!Number.isFinite(E) || E <= 0 || E > 1.0) {
    return Object.freeze({
      status: "INVALID_INPUT",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      diameterBasis,
      inputs: buildInputsRecord(input, diameterBasis),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze(["INVALID_COEFFICIENT: E doit être un nombre fini dans ]0, 1.0]."]),
    });
  }

  // 3. Facteur W (Réduction de résistance du joint soudé)
  let W: number | undefined;
  let wContractVerified = false;
  let wValueVerified = false;
  let wSource: string | undefined;

  const wInput = input.weldReductionFactorInput;
  if (
    wInput?.materialGroup === "CSEF" ||
    wInput?.applicability === "W-08" ||
    wInput?.applicability === "W-09" ||
    wInput?.selectionContext?.includes("W-08") ||
    wInput?.selectionContext?.includes("W-09")
  ) {
    return Object.freeze({
      status: "UNVERIFIED",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      formulaId: formula.id,
      clauseReference: formula.clauseReference,
      sourceReference: formula.sourceReference,
      diameterBasis,
      inputs: buildInputsRecord(input, diameterBasis),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze([
        "BRANCH_BLOCKED: Les branches W-08 (aciers CSEF) et W-09 (matériaux hors fluage listé) sont hors périmètre F01.",
      ]),
    });
  }

  if (isRecordObject(wInput) && typeof wInput.factorValue === "number") {
    W = wInput.factorValue;
    wContractVerified = Number.isFinite(W);
    if (
      wInput.qualificationStatus === "VERIFIED" &&
      typeof wInput.sourceReference === "string" &&
      wInput.sourceReference.trim().length > 0
    ) {
      wValueVerified = true;
      wSource = wInput.sourceReference;
    }
  } else if (typeof input.weldReductionFactor === "number") {
    W = input.weldReductionFactor;
    wContractVerified = Number.isFinite(W);
    wValueVerified = false;
  } else if (input.componentType === "SEAMLESS") {
    W = 1.0;
    wContractVerified = true;
    wValueVerified = true;
    wSource = "ASME B31.3-2024 para. 302.3.5(e)";
  } else if (
    input.materialFamily === "FERRITIC" &&
    input.temperature !== undefined &&
    input.temperature <= 538
  ) {
    W = 1.0;
    wContractVerified = true;
    wValueVerified = true;
    wSource = "ASME B31.3-2024 Table 302.3.5-1 (Carbon Steel T <= 538°C)";
  }

  if (W === undefined) {
    return Object.freeze({
      status: "UNVERIFIED",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      formulaId: formula.id,
      clauseReference: formula.clauseReference,
      sourceReference: formula.sourceReference,
      diameterBasis,
      inputs: buildInputsRecord(input, diameterBasis),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze([
        "VALUE_UNVERIFIED: Le facteur W n'a pas pu être résolu ou n'est pas qualifié.",
      ]),
    });
  }
  if (!Number.isFinite(W) || W <= 0 || W > 1.0) {
    return Object.freeze({
      status: "INVALID_INPUT",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      diameterBasis,
      inputs: buildInputsRecord(input, diameterBasis),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze(["INVALID_COEFFICIENT: W doit être un nombre fini dans ]0, 1.0]."]),
    });
  }

  // 4. Coefficient Y
  let Y: number | undefined;
  let yContractVerified = false;
  let yValueVerified = false;
  let ySource: string | undefined;

  const yInput = input.yCoefficientInput;
  if (isRecordObject(yInput) && typeof yInput.factorValue === "number") {
    Y = yInput.factorValue;
    yContractVerified = Number.isFinite(Y);
    if (
      yInput.qualificationStatus === "VERIFIED" &&
      typeof yInput.sourceReference === "string" &&
      yInput.sourceReference.trim().length > 0
    ) {
      yValueVerified = true;
      ySource = yInput.sourceReference;
    }
  } else if (typeof input.yCoefficient === "number") {
    Y = input.yCoefficient;
    yContractVerified = Number.isFinite(Y);
    yValueVerified = false;
  } else if (
    input.materialFamily === "FERRITIC" &&
    (input.temperature === undefined || input.temperature <= 482)
  ) {
    Y = 0.4;
    yContractVerified = true;
    yValueVerified = true;
    ySource = "ASME B31.3-2024 Table 304.1.1-1 (Ferritic steel T <= 482°C)";
  } else if (
    input.materialFamily === "AUSTENITIC" &&
    (input.temperature === undefined || input.temperature <= 566)
  ) {
    Y = 0.4;
    yContractVerified = true;
    yValueVerified = true;
    ySource = "ASME B31.3-2024 Table 304.1.1-1 (Austenitic steel T <= 566°C)";
  }

  if (Y === undefined) {
    return Object.freeze({
      status: "UNVERIFIED",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      formulaId: formula.id,
      clauseReference: formula.clauseReference,
      sourceReference: formula.sourceReference,
      diameterBasis,
      inputs: buildInputsRecord(input, diameterBasis),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze([
        "VALUE_UNVERIFIED: Le coefficient Y n'a pas pu être résolu ou n'est pas qualifié.",
      ]),
    });
  }
  if (!Number.isFinite(Y) || Y < 0 || Y > 0.7) {
    return Object.freeze({
      status: "INVALID_INPUT",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      diameterBasis,
      inputs: buildInputsRecord(input, diameterBasis),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze(["INVALID_COEFFICIENT: Y doit être un nombre fini dans [0.0, 0.7]."]),
    });
  }

  const resolvedFactors: Record<string, ResolvedNormativeFactor> = {
    S: Object.freeze({
      name: "Basic Allowable Stress",
      value: S,
      contractVerified: sContractVerified,
      valueVerified: sValueVerified,
      sourceReference: sSource,
    }),
    E: Object.freeze({
      name: "Quality Factor",
      value: E,
      contractVerified: eContractVerified,
      valueVerified: eValueVerified,
      sourceReference: eSource,
    }),
    W: Object.freeze({
      name: "Weld Joint Strength Reduction Factor",
      value: W,
      contractVerified: wContractVerified,
      valueVerified: wValueVerified,
      sourceReference: wSource,
    }),
    Y: Object.freeze({
      name: "Wall Thickness Coefficient Y",
      value: Y,
      contractVerified: yContractVerified,
      valueVerified: yValueVerified,
      sourceReference: ySource,
    }),
  };

  // Contrat CONTRACT VERIFIED vs VALUE VERIFIED (Section 6 & 16)
  const unverifiedFactors: string[] = [];
  if (!sValueVerified) unverifiedFactors.push("S (contrainte admissible)");
  if (!eValueVerified) unverifiedFactors.push("E (facteur de joint)");
  if (!wValueVerified) unverifiedFactors.push("W (facteur de réduction soudure)");
  if (!yValueVerified) unverifiedFactors.push("Y (coefficient d'épaisseur)");

  if (unverifiedFactors.length > 0) {
    return Object.freeze({
      status: "UNVERIFIED",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      formulaId: formula.id,
      clauseReference: formula.clauseReference,
      sourceReference: formula.sourceReference,
      diameterBasis,
      inputs: buildInputsRecord(input, diameterBasis),
      resolvedFactors: Object.freeze(resolvedFactors),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze([
        `VALUE_UNVERIFIED: Les facteurs suivants ne sont pas VALUE VERIFIED : ${unverifiedFactors.join(", ")}. Statut CALCULATED interdit sans provenance qualifiée complète.`,
      ]),
    });
  }

  // Contrôle P / (S * E) > 0.385 (Section 4 & 12)
  const stressRatio = P / (S * E);
  if (stressRatio > 0.385) {
    return Object.freeze({
      status: "OUT_OF_SCOPE",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      formulaId: formula.id,
      clauseReference: formula.clauseReference,
      sourceReference: formula.sourceReference,
      diameterBasis,
      inputs: buildInputsRecord(input, diameterBasis),
      resolvedFactors: Object.freeze(resolvedFactors),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze([
        `SPECIAL_CONSIDERATION_REQUIRED: ASME B31.3-2024 para. 304.1.2(b): Le ratio P/(SE) = ${stressRatio.toFixed(4)} excède 0.385. Une analyse spéciale (théorie de rupture, fatigue, contraintes thermiques) est obligatoire.`,
      ]),
    });
  }

  // Calcul numérique et contrôle du domaine paroi mince t < D/6
  let t: number;
  let clauseReference: string;

  if (diameterBasis === "OUTSIDE") {
    clauseReference = "para. 304.1.2(a) Eq. (3a)";
    const D = input.outsideDiameterMm!;
    const denominator = 2 * (S * E * W + P * Y);
    if (denominator <= 0 || !Number.isFinite(denominator)) {
      return Object.freeze({
        status: "INVALID_INPUT",
        calculationType: input.calculationType,
        designCodeId: input.designCodeId,
        standardEdition: effectiveEdition,
        inputs: buildInputsRecord(input, diameterBasis),
        assumptions: Object.freeze([]),
        warnings: Object.freeze([]),
        errors: Object.freeze([
          "INVALID_DENOMINATOR: Le dénominateur de l'Équation (3a) 2*(S*E*W + P*Y) est nul ou négatif.",
        ]),
      });
    }
    t = (P * D) / denominator;

    // Critère non-circulaire t < D/6 (équivalent à P*(3 - Y) < S*E*W)
    if (t >= D / 6 || !Number.isFinite(t) || t <= 0) {
      if (t >= D / 6) {
        return Object.freeze({
          status: "OUT_OF_SCOPE",
          calculationType: input.calculationType,
          designCodeId: input.designCodeId,
          standardEdition: effectiveEdition,
          formulaId: formula.id,
          clauseReference,
          sourceReference: formula.sourceReference,
          diameterBasis,
          inputs: buildInputsRecord(input, diameterBasis),
          resolvedFactors: Object.freeze(resolvedFactors),
          assumptions: Object.freeze([]),
          warnings: Object.freeze([]),
          errors: Object.freeze([
            `SPECIAL_CONSIDERATION_REQUIRED: ASME B31.3-2024 para. 304.1.2(b): t (${t.toFixed(4)} mm) >= D/6 (${(D / 6).toFixed(4)} mm). Calcul hors domaine de validité paroi mince.`,
          ]),
        });
      }
      return Object.freeze({
        status: "INVALID_INPUT",
        calculationType: input.calculationType,
        designCodeId: input.designCodeId,
        standardEdition: effectiveEdition,
        inputs: buildInputsRecord(input, diameterBasis),
        assumptions: Object.freeze([]),
        warnings: Object.freeze([]),
        errors: Object.freeze(["INVALID_INPUT_VALUE: Valeur calculée pour t non valide."]),
      });
    }
  } else {
    clauseReference = "para. 304.1.2(a) Eq. (3b)";
    const d = input.insideDiameterMm!;
    const denominator = 2 * (S * E * W - P * (1 - Y));
    if (denominator <= 0 || !Number.isFinite(denominator)) {
      return Object.freeze({
        status: "INVALID_INPUT",
        calculationType: input.calculationType,
        designCodeId: input.designCodeId,
        standardEdition: effectiveEdition,
        inputs: buildInputsRecord(input, diameterBasis),
        assumptions: Object.freeze([]),
        warnings: Object.freeze([]),
        errors: Object.freeze([
          "INVALID_DENOMINATOR: Le dénominateur de l'Équation (3b) 2*[S*E*W - P*(1 - Y)] est nul ou négatif.",
        ]),
      });
    }
    t = (P * (d + 2 * c)) / denominator;

    // Critère non-circulaire t < (d + 2c)/4 (équivalent à t < Deq/6)
    const maxThinWallThickness = (d + 2 * c) / 4;
    if (t >= maxThinWallThickness || !Number.isFinite(t) || t <= 0) {
      if (t >= maxThinWallThickness) {
        return Object.freeze({
          status: "OUT_OF_SCOPE",
          calculationType: input.calculationType,
          designCodeId: input.designCodeId,
          standardEdition: effectiveEdition,
          formulaId: formula.id,
          clauseReference,
          sourceReference: formula.sourceReference,
          diameterBasis,
          inputs: buildInputsRecord(input, diameterBasis),
          resolvedFactors: Object.freeze(resolvedFactors),
          assumptions: Object.freeze([]),
          warnings: Object.freeze([]),
          errors: Object.freeze([
            `SPECIAL_CONSIDERATION_REQUIRED: ASME B31.3-2024 para. 304.1.2(b): t (${t.toFixed(4)} mm) >= Deq/6. Calcul hors domaine de validité paroi mince.`,
          ]),
        });
      }
      return Object.freeze({
        status: "INVALID_INPUT",
        calculationType: input.calculationType,
        designCodeId: input.designCodeId,
        standardEdition: effectiveEdition,
        inputs: buildInputsRecord(input, diameterBasis),
        assumptions: Object.freeze([]),
        warnings: Object.freeze([]),
        errors: Object.freeze(["INVALID_INPUT_VALUE: Valeur calculée pour t non valide."]),
      });
    }
  }

  const tm = t + c;
  if (!Number.isFinite(tm) || tm <= 0) {
    return Object.freeze({
      status: "INVALID_INPUT",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      inputs: buildInputsRecord(input, diameterBasis),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze(["INVALID_INPUT_VALUE: Épaisseur minimale requise tm non valide."]),
    });
  }

  return Object.freeze({
    status: "CALCULATED",
    calculationType: input.calculationType,
    designCodeId: input.designCodeId,
    standardEdition: effectiveEdition,
    formulaId: formula.id,
    clauseReference,
    sourceReference: formula.sourceReference,
    diameterBasis,
    value: t,
    minimumRequiredThicknessMm: tm,
    unit: input.unitSystem === "SI" ? "mm" : "in",
    inputs: buildInputsRecord(input, diameterBasis),
    resolvedFactors: Object.freeze(resolvedFactors),
    formulaReference: formula,
    domain: formula.domain,
    assumptions: Object.freeze([
      "Formule de paroi mince selon ASME B31.3-2024 para. 304.1.2(a).",
      `Base dimensionnelle sélectionnée : ${diameterBasis}.`,
      "Tous les facteurs normatifs (S, E, W, Y) sont audités et VALUE VERIFIED.",
    ]),
    warnings: Object.freeze([]),
    errors: Object.freeze([]),
  });
}

/**
 * Exécute un calcul d'ingénierie selon le code de conception spécifié.
 * RÈGLE ARCHITECTURALE ABSOLUE (NORM-08) :
 * - Déterministe, immuable, auditable, traçable.
 * - Aucune formule inventée ou constante arbitraire.
 * - Le statut CALCULATED exige que toutes les valeurs normatives soient VALUE VERIFIED.
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
      inputs: buildInputsRecord(input),
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
      inputs: buildInputsRecord(input),
      assumptions: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze([
        `FORMULA_NOT_IMPLEMENTED: Aucun calcul vérifié et sourcé pour ${input.calculationType} selon ${input.designCodeId} dans NORM-08.`,
      ]),
    });
  }

  // 4. FORMULA EXECUTION GATE (Section 17)
  // Recherche d'une formule associée dans le registre
  const effectiveEdition = input.standardEdition ?? context?.standardEdition;
  const formula = registryEntry.formulaReferences.find(
    (f) =>
      (f.calculationType === input.calculationType || !f.calculationType) &&
      (!f.standardEdition || (effectiveEdition && f.standardEdition.year === effectiveEdition.year))
  );

  if (!formula || formula.status === "NOT_IMPLEMENTED") {
    return Object.freeze({
      status: "NOT_IMPLEMENTED",
      calculationType: input.calculationType,
      designCodeId: input.designCodeId,
      standardEdition: effectiveEdition,
      formulaId: formula?.id,
      clauseReference: formula?.clauseReference,
      sourceReference: formula?.sourceReference,
      formulaReference: formula,
      inputs: buildInputsRecord(input),
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
      standardEdition: effectiveEdition,
      formulaId: formula.id,
      clauseReference: formula.clauseReference,
      sourceReference: formula.sourceReference,
      formulaReference: formula,
      inputs: buildInputsRecord(input),
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
      standardEdition: effectiveEdition,
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

  // 5. Exécution de la formule F01 : ASME-B31.3-2024 PRESSURE_WALL_THICKNESS
  if (
    formula.id === "NORM-08-F01-ASME-B31.3-2024-PRESSURE-WALL-THICKNESS" &&
    input.designCodeId === "ASME-B31.3" &&
    effectiveEdition?.year === "2024" &&
    input.calculationType === "PRESSURE_WALL_THICKNESS"
  ) {
    return executeAsmeB313F01Calculation(input, formula, effectiveEdition);
  }

  return Object.freeze({
    status: "UNVERIFIED",
    calculationType: input.calculationType,
    designCodeId: input.designCodeId,
    standardEdition: effectiveEdition,
    formulaId: formula.id,
    clauseReference: formula.clauseReference,
    sourceReference: formula.sourceReference,
    formulaReference: formula,
    inputs: buildInputsRecord(input),
    assumptions: Object.freeze([]),
    warnings: Object.freeze([]),
    errors: Object.freeze([
      `FORMULA_NOT_IMPLEMENTED: Formule ${formula.id} qualifiée mais non activée pour exécution.`,
    ]),
  });
}
