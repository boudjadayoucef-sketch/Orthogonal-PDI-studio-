/**
 * PDI NORMATIVE ENGINE — PIPE DIMENSIONAL VALIDATOR
 * Reference: PATCH NORM-02-R1 (Conditional Type Rules)
 * 
 * Validateur d'intégrité structurelle pour `PipeDimensionalRecord`.
 * 
 * RÈGLE FONDAMENTALE (NORM-02-R1) :
 * - Ce validateur garantit la cohérence des données saisies selon leur propre statut et structure.
 * - Il ne calcule PAS de conformité normative ASME/DIN/ISO (pas de Barlow, pas de calcul d'épaisseur).
 * - Il n'effectue AUCUNE conversion automatique (ex: NPS ↔ DN, Schedule → épaisseur).
 */

import { PDI_STANDARDS_REGISTRY } from "../registry/standardsRegistry";
import type { PipeDimensionalRecord, PipeType } from "../types/pipeDimensionalTypes";

/**
 * Codes d'erreur fortement typés pour la traçabilité et la validation NORM-02-R1.
 */
export type PipeDimensionalValidationErrorCode =
  | "INVALID_STANDARD_ID"
  | "STANDARD_IS_NOT_DIMENSIONAL"
  | "MISSING_SOURCE_REFERENCE"
  | "VERIFIED_RECORD_REQUIRES_SOURCE_REFERENCE"
  | "LICENSED_RECORD_REQUIRES_SOURCE_REFERENCE"
  | "INVALID_DN"
  | "INVALID_OUTSIDE_DIAMETER"
  | "INVALID_WALL_THICKNESS"
  | "EMPTY_NPS"
  | "EMPTY_SCHEDULE"
  | "INVALID_PIPE_TYPE";

export interface PipeDimensionalValidationError {
  readonly code: PipeDimensionalValidationErrorCode;
  readonly field?: string;
  readonly message: string;
}

export interface PipeDimensionalValidationResult {
  readonly valid: boolean;
  readonly errors: readonly PipeDimensionalValidationError[];
}

const VALID_PIPE_TYPES: readonly PipeType[] = Object.freeze([
  "WELDED",
  "SEAMLESS",
  "WELDED_OR_SEAMLESS",
  "UNKNOWN",
]);

/**
 * Valide un enregistrement PipeDimensionalRecord selon les 14 règles conditionnelles NORM-02-R1.
 */
export function validatePipeDimensionalRecord(
  record: Partial<PipeDimensionalRecord>
): PipeDimensionalValidationResult {
  const errors: PipeDimensionalValidationError[] = [];

  // RÈGLE CONDITIONNELLE 1 & 2 & 3 & 4 — SOURCE TRACEABILITY (VERIFIED / LICENSED / UNVERIFIED / LEGACY)
  if (record.sourceStatus === "VERIFIED") {
    if (!record.sourceReference || record.sourceReference.trim().length === 0) {
      errors.push({
        code: "VERIFIED_RECORD_REQUIRES_SOURCE_REFERENCE",
        field: "sourceReference",
        message: "Un enregistrement VERIFIED requiert obligatoirement une référence de source non vide.",
      });
      errors.push({
        code: "MISSING_SOURCE_REFERENCE",
        field: "sourceReference",
        message: "Référence source manquante.",
      });
    }
  } else if (record.sourceStatus === "LICENSED") {
    if (!record.sourceReference || record.sourceReference.trim().length === 0) {
      errors.push({
        code: "LICENSED_RECORD_REQUIRES_SOURCE_REFERENCE",
        field: "sourceReference",
        message: "Un enregistrement LICENSED requiert obligatoirement une référence de licence/source non vide.",
      });
      errors.push({
        code: "MISSING_SOURCE_REFERENCE",
        field: "sourceReference",
        message: "Référence source manquante.",
      });
    }
  }

  // RÈGLE CONDITIONNELLE 6 — STANDARD ID & CLASSIFICATION
  if (record.standardId) {
    const standard = PDI_STANDARDS_REGISTRY[record.standardId];
    if (!standard) {
      errors.push({
        code: "INVALID_STANDARD_ID",
        field: "standardId",
        message: `Le standard ${record.standardId} n'est pas enregistré dans le registre normatif NORM-01.`,
      });
    } else if (standard.standardType !== "DIMENSIONAL_STANDARD") {
      errors.push({
        code: "STANDARD_IS_NOT_DIMENSIONAL",
        field: "standardId",
        message: `Le standard ${record.standardId} (${standard.standardType}) n'est pas un standard dimensionnel (DIMENSIONAL_STANDARD).`,
      });
      errors.push({
        code: "INVALID_STANDARD_ID",
        field: "standardId",
        message: `Le standard ${record.standardId} n'est pas valide pour un tube dimensionnel.`,
      });
    }
  }

  // RÈGLE CONDITIONNELLE 7 — OUTSIDE DIAMETER
  if (record.outsideDiameterMm !== undefined) {
    if (typeof record.outsideDiameterMm !== "number" || isNaN(record.outsideDiameterMm) || record.outsideDiameterMm <= 0) {
      errors.push({
        code: "INVALID_OUTSIDE_DIAMETER",
        field: "outsideDiameterMm",
        message: "Le diamètre extérieur (outsideDiameterMm) doit être un nombre strictement positif (> 0).",
      });
    }
  }

  // RÈGLE CONDITIONNELLE 8 — WALL THICKNESS
  if (record.wallThicknessMm !== undefined) {
    if (typeof record.wallThicknessMm !== "number" || isNaN(record.wallThicknessMm) || record.wallThicknessMm <= 0) {
      errors.push({
        code: "INVALID_WALL_THICKNESS",
        field: "wallThicknessMm",
        message: "L'épaisseur de paroi (wallThicknessMm) doit être un nombre strictly positif (> 0).",
      });
    }
  }

  // RÈGLE CONDITIONNELLE 9 — DN
  if (record.dn !== undefined) {
    if (typeof record.dn !== "number" || isNaN(record.dn) || record.dn <= 0) {
      errors.push({
        code: "INVALID_DN",
        field: "dn",
        message: "Le diamètre nominal DN (dn) doit être un nombre entier/strictement positif (> 0).",
      });
    }
  }

  // RÈGLE CONDITIONNELLE 10 — NPS
  if (record.nps !== undefined) {
    if (typeof record.nps !== "string" || record.nps.trim().length === 0) {
      errors.push({
        code: "EMPTY_NPS",
        field: "nps",
        message: "La désignation NPS (nps) ne peut pas être une chaîne vide.",
      });
    }
  }

  // RÈGLE CONDITIONNELLE 11 — SCHEDULE
  if (record.schedule !== undefined) {
    if (typeof record.schedule !== "string" || record.schedule.trim().length === 0) {
      errors.push({
        code: "EMPTY_SCHEDULE",
        field: "schedule",
        message: "Le Schedule déclaratif (schedule) ne peut pas être une chaîne vide.",
      });
    }
  }

  // RÈGLE CONDITIONNELLE 12 — PIPE TYPE
  if (record.pipeType !== undefined) {
    if (!VALID_PIPE_TYPES.includes(record.pipeType as any)) {
      errors.push({
        code: "INVALID_PIPE_TYPE",
        field: "pipeType",
        message: `Le procédé de fabrication (pipeType) '${record.pipeType}' n'appartient pas au vocabulaire valide (WELDED, SEAMLESS, WELDED_OR_SEAMLESS, UNKNOWN).`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
