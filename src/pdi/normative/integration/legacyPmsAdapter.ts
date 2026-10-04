/**
 * PDI NORMATIVE ENGINE — LEGACY PMS ISOLATION ADAPTER
 * Reference: ARCH-02 (PMS / Normative Authority Unification)
 *
 * @deprecated DEPRECATED PMS ADAPTER — NON-NORMATIVE
 * This module isolates and encapsulates the legacy heuristic PMS checks
 * (`pdiClassePression017K3`) to prevent them from acting as an independent
 * normative authority or bypassing the official Normative Engine.
 *
 * STRICT ARCHITECTURAL INVARIANTS (ARCH-02):
 * 1. SOLE NORMATIVE AUTHORITY: The Normative Engine (`src/pdi/normative/`)
 *    is the exclusive authority for all normative decisions.
 * 2. NO SILENT PROMOTION: Legacy PMS can NEVER transform an `UNVERIFIED`,
 *    `INCOMPATIBLE`, or `INVALID` normative status into `COMPATIBLE`.
 * 3. NO EVIDENCE FABRICATION: Legacy PMS contains zero normative evidence,
 *    zero verified values, and zero ASME/API/EN qualifications.
 * 4. NO CONVERSIONS: Legacy PMS cannot perform NPS <-> DN or Class <-> PN conversions.
 * 5. EXPLICIT CONFLICTS: When Legacy PMS presets contradict the Normative Engine,
 *    the conflict is explicitly surfaced via `LEGACY_PMS_NORMATIVE_CONFLICT`.
 */

import type {
  IsometricNormativeContext,
  IsometricNormativeStatus,
  LegacyPmsComparisonSnapshot,
} from "./isometricNormativeContext";

/**
 * Structural definition of a legacy spec entry in a project setup.
 */
export interface LegacyPmsSpecEntry {
  readonly code: string;
  readonly material: string;
  readonly pressureClass: string;
  readonly minDn?: number;
  readonly maxDn?: number;
}

/**
 * Structural definition of a legacy project setup.
 */
export interface LegacyPmsProjectSetup {
  readonly specs?: readonly LegacyPmsSpecEntry[];
}

/**
 * Result of resolving a Legacy PMS evaluation against a normative decision.
 */
export interface LegacyPmsResolution {
  readonly status: IsometricNormativeStatus;
  readonly snapshot?: LegacyPmsComparisonSnapshot;
  readonly conflictCode?: string;
}

/**
 * Public contract for the Legacy PMS Isolation Adapter.
 */
export interface ILegacyPmsAdapter {
  evaluate(
    context: IsometricNormativeContext,
    normativeStatus: IsometricNormativeStatus,
    legacySetup?: LegacyPmsProjectSetup
  ): LegacyPmsResolution;

  getExpectedPressureClass(
    legacySetup?: LegacyPmsProjectSetup,
    specCode?: string
  ): string | undefined;

  getExpectedMaterial(
    legacySetup?: LegacyPmsProjectSetup,
    specCode?: string
  ): string | undefined;

  isClassConformant(
    classe: string,
    legacySetup?: LegacyPmsProjectSetup,
    specCode?: string
  ): boolean;
}

/**
 * Default fallback values for legacy UI dropdowns (non-normative).
 */
export const LEGACY_DEFAULT_PRESSURE_CLASS = "Class 150";
export const LEGACY_DEFAULT_MATERIAL = "Acier carbone";

/**
 * Implementation of the Legacy PMS Adapter.
 * Pure diagnostic comparison — never overrides the normative engine.
 */
export class LegacyPmsAdapter implements ILegacyPmsAdapter {
  /**
   * Reads the expected pressure class from the legacy project setup for a given spec code.
   */
  public getExpectedPressureClass(
    legacySetup?: LegacyPmsProjectSetup,
    specCode?: string
  ): string | undefined {
    if (!legacySetup?.specs || legacySetup.specs.length === 0) {
      return undefined;
    }
    if (specCode) {
      const match = legacySetup.specs.find((s) => s.code === specCode);
      if (match?.pressureClass) return match.pressureClass;
    }
    return legacySetup.specs[0]?.pressureClass ?? LEGACY_DEFAULT_PRESSURE_CLASS;
  }

  /**
   * Reads the expected material from the legacy project setup for a given spec code.
   */
  public getExpectedMaterial(
    legacySetup?: LegacyPmsProjectSetup,
    specCode?: string
  ): string | undefined {
    if (!legacySetup?.specs || legacySetup.specs.length === 0) {
      return undefined;
    }
    if (specCode) {
      const match = legacySetup.specs.find((s) => s.code === specCode);
      if (match?.material) return match.material;
    }
    return legacySetup.specs[0]?.material ?? LEGACY_DEFAULT_MATERIAL;
  }

  /**
   * Checks whether a pressure rating string matches the legacy spec preset.
   */
  public isClassConformant(
    classe: string,
    legacySetup?: LegacyPmsProjectSetup,
    specCode?: string
  ): boolean {
    const expected = this.getExpectedPressureClass(legacySetup, specCode);
    if (!expected || !classe) return false;
    return classe.trim().toLowerCase() === expected.trim().toLowerCase();
  }

  /**
   * Evaluates Legacy PMS presets against an authoritative normative decision.
   *
   * ARCH-02 Core Invariants:
   * 1. If Normative Engine returned COMPATIBLE but Legacy PMS says non-conformant:
   *    -> Surfaces `LEGACY_PMS_NORMATIVE_CONFLICT` and conservatively downgrades to `UNVERIFIED`.
   * 2. If Normative Engine returned INCOMPATIBLE but Legacy PMS says conformant:
   *    -> Retains `INCOMPATIBLE`, surfaces `LEGACY_PMS_NORMATIVE_CONFLICT`.
   * 3. If Normative Engine returned UNVERIFIED but Legacy PMS says conformant:
   *    -> Retains `UNVERIFIED` (Legacy PMS is NEVER allowed to promote to COMPATIBLE).
   * 4. If Normative Engine returned INVALID:
   *    -> Retains `INVALID`.
   */
  public evaluate(
    context: IsometricNormativeContext,
    normativeStatus: IsometricNormativeStatus,
    legacySetup?: LegacyPmsProjectSetup
  ): LegacyPmsResolution {
    if (!legacySetup?.specs || legacySetup.specs.length === 0) {
      return { status: normativeStatus };
    }

    const expectedClass = this.getExpectedPressureClass(legacySetup, context.pipingSpecId);
    const expectedMaterial = this.getExpectedMaterial(legacySetup, context.pipingSpecId);
    const classConformant = context.pressureRating
      ? this.isClassConformant(context.pressureRating, legacySetup, context.pipingSpecId)
      : false;

    // INVARIANT: Normative Engine is COMPATIBLE, but Legacy PMS preset expects a different class
    if (normativeStatus === "COMPATIBLE" && !classConformant) {
      const conflictCode = "LEGACY_PMS_NORMATIVE_CONFLICT";
      return {
        status: "UNVERIFIED",
        conflictCode,
        snapshot: Object.freeze({
          evaluated: true,
          legacyExpectedPressureClass: expectedClass,
          legacyExpectedMaterial: expectedMaterial,
          legacyClassConformant: classConformant,
          hasConflict: true,
          conflictCode,
          message: `Conflict between Normative Engine (COMPATIBLE) and Legacy PMS preset (expected '${expectedClass ?? ""}', got '${context.pressureRating ?? ""}'). Conservative decision: UNVERIFIED.`,
        }),
      };
    }

    // INVARIANT: Normative Engine is INCOMPATIBLE, but Legacy PMS claimed conformant
    if (normativeStatus === "INCOMPATIBLE" && classConformant) {
      const conflictCode = "LEGACY_PMS_NORMATIVE_CONFLICT";
      return {
        status: "INCOMPATIBLE",
        conflictCode,
        snapshot: Object.freeze({
          evaluated: true,
          legacyExpectedPressureClass: expectedClass,
          legacyExpectedMaterial: expectedMaterial,
          legacyClassConformant: classConformant,
          hasConflict: true,
          conflictCode,
          message: `Conflict between Normative Engine (INCOMPATIBLE) and Legacy PMS preset (conformant with '${expectedClass ?? ""}'). Normative authority retained: INCOMPATIBLE.`,
        }),
      };
    }

    // INVARIANT: Normative Engine is UNVERIFIED, even if Legacy PMS claims conformant
    // -> MUST NEVER PROMOTE TO COMPATIBLE!
    return {
      status: normativeStatus,
      snapshot: Object.freeze({
        evaluated: true,
        legacyExpectedPressureClass: expectedClass,
        legacyExpectedMaterial: expectedMaterial,
        legacyClassConformant: classConformant,
        hasConflict: false,
      }),
    };
  }
}

/**
 * Default singleton instance of the Legacy PMS Adapter.
 */
export const defaultLegacyPmsAdapter: ILegacyPmsAdapter = new LegacyPmsAdapter();
