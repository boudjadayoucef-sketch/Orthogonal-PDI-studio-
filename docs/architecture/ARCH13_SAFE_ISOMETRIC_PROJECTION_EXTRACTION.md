# ARCH-13 — SAFE ISOMETRIC PROJECTION EXTRACTION

**Repository:** `boudjadayoucef-sketch/Orthogonal-PDI-studio-`  
**Branch:** `main`  
**Starting Commit:** `e74c6ea1fc4f5d9fc27795f59a270ee03eace69a`  
**Task ID:** `ARCH-13`  

---

## 1. EXECUTIVE SUMMARY

`ARCH-13` continues the modularization roadmap for **Orthogonal PD&I Studio** by safely extracting the multi-view isometric projection and unprojection engine out of `src/pdi/isometric/engine/IsometrieModuleV48d.tsx` into a dedicated core engine module (`src/pdi/isometric/core/isoProjectionEngine.ts`), backed by automated Vitest tests.

---

## 2. PROJECTION STATE & DEPENDENCY MAP

### 2.1 Projection State Variables
- `globalCurrentViewMode` (string: `"iso"` | `"top"` | `"front"` | `"side"` | `"free"`)
- `globalCurrentYaw` (number: radian rotation angle around Z)
- `globalCurrentPitch` (number: radian tilt angle)
- `globalModelCenter` (`{ x: number, y: number, z: number }`)

### 2.2 Dependency & Data Flow
- **Input:** 3D world coordinates `(x, y, z)`, camera view parameters (`zoom`, `panX`, `panY`), and active view mode (`mode`, `yaw`, `pitch`, `modelCenter`).
- **Transformation:** Computes orthonormal projection axes via `getProjectionAxes()` and applies 3D orthographic / isometric matrix transformation with screen scaling and panning offset (`310 + panX`, `210 + panY`).
- **Output:** 2D screen coordinates `(x, y)`.

---

## 3. FILES CHANGED & WHY

1. **`src/pdi/isometric/core/isoProjectionEngine.ts` (New)**:
   - Houses the extracted pure math and multi-view projection engine (`PDI_ISO_COS_017I2`, `PDI_ISO_SIN_017I2`, `getProjectionAxes`, `isoProjectV4`, `isoUnprojectV4`).
2. **`src/pdi/isometric/engine/IsometrieModuleV48d.tsx` (Modified)**:
   - Replaced inline projection functions with imports from `./core/isoProjectionEngine` while retaining backward compatibility for all local state handlers.
3. **`src/pdi/isometric/tests/arch13IsoProjectionEngineTests.spec.ts` (New)**:
   - Vitest unit tests verifying projection axes across view modes, deterministic 3D-to-2D projection and unprojection, and zoom/pan scaling behavior.
4. **`docs/architecture/ARCH13_SAFE_ISOMETRIC_PROJECTION_EXTRACTION.md` (New)**:
   - Architecture audit and extraction report.

---

## 4. EXACT EXTRACTION BOUNDARY

- **Extracted:** Axonometric 3D projection, multi-view axes computation (`iso`, `top`, `front`, `side`, `free`), screen projection (`isoProjectV4`), screen unprojection (`isoUnprojectV4`), and trigonometric constants.
- **Retained in Editor:** Canvas event handling, toolbar state, render loops, property inspection, and DOM event listeners.

---

## 5. TESTS ADDED & RESULTS

- **Test File:** `src/pdi/isometric/tests/arch13IsoProjectionEngineTests.spec.ts`
- **Tests Executed:**
  1. `computes projection axes correctly across view modes` (Passed)
  2. `projects and unprojects world points deterministically in iso mode` (Passed)
  3. `handles zoom and pan scaling correctly` (Passed)
- **Total Test Suites:** 8 test files, 17 tests passed with **100% success**.

---

## 6. VALIDATION RESULTS

1. **Vitest Unit Test Suite (`npx vitest run`)**: **PASSED (17/17 tests green)**.
2. **TypeScript Linter (`npx tsc --noEmit`)**: **PASSED WITH ZERO ERRORS**.
3. **Production Build (`npm run build`)**: **BUILD SUCCEEDED SUCCESSFULLY**.

---

## 7. DIFF SUMMARY & REMAINING RISKS

- **Diff Summary:** Clean extraction of projection math into `isoProjectionEngine.ts`, wired into production module with zero breaking changes.
- **Remaining Risks:** None. All view modes and unprojection fallback routines are fully covered by automated tests.

---

## 8. RECOMMENDED NEXT STEP

- Proceed to **ARCH-14** (Isometric Import/Export & DXF/PCF Serialization Extraction) when requested.

**ARCH-13: IMPLEMENTED**
