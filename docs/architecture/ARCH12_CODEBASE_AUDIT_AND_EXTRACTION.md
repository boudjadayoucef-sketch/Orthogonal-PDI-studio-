# ARCH-12 — REAL CODEBASE AUDIT & FIRST SAFE MODULAR EXTRACTION

**Repository:** `boudjadayoucef-sketch/Orthogonal-PDI-studio-`  
**Branch:** `main`  
**Starting Commit:** `88d8ff01714853b08267a0c430758a08267a0c4` (`ARCH-11-FIX-01`)  
**Task ID:** `ARCH-12`

---

## 1. EXECUTIVE SUMMARY

`ARCH-12` initiates the modularization roadmap for **Orthogonal PD&I Studio** with:
1. **Phase A — Real Codebase Audit & Dependency Map:** An empirical inspection of the 5 largest production modules, their exact line/byte counts, runtime entry points, cross-module dependencies, and prior unintegrated partial files (`isoGraphTypes.ts`, `IsoTopologyGraph.ts`, `isoProjection.ts`).
2. **Phase B — First Safe Production-Code Extraction:** Extraction and integration of the pure Isometric 3D Graph Types, Constants, Topological Graph Validation, Port Geometry, Legacy Migration, and Line BOM Calculation engine from `src/pdi/isometric/engine/IsometrieModuleV48d.tsx` into:
   - `src/pdi/isometric/types/isoGraphTypes.ts`
   - `src/pdi/isometric/core/IsoTopologyGraph.ts`

`IsometrieModuleV48d.tsx` now imports and re-exports these symbols cleanly, reducing `IsometrieModuleV48d.tsx` by **908 lines (~36.8 KB)** without changing any runtime behavior, public exports, or UI behavior.

---

## 2. PHASE A — REAL CODEBASE AUDIT & DEPENDENCY MAP

### 2.1 Measured File Sizes (Before vs. After ARCH-12)

| File Path | Role in Runtime | Before ARCH-12 (Lines / Bytes) | After ARCH-12 (Lines / Bytes) | Status |
| :--- | :--- | :--- | :--- | :--- |
| `src/pdi/isometric/engine/IsometrieModuleV48d.tsx` | Core 3D Isometric Editor, Canvas Renderer, Export & Inspector Engine | 15,274 lines / 831,724 B (~812 KB) | **14,366 lines / 794,909 B (~776 KB)** | Active Core Engine (Reduced by 908 lines) |
| `src/components/Calculators.tsx` | Multi-disciplinary Engineering Calculators UI & local helper formulas | 8,402 lines / 589,708 B (~576 KB) | 8,402 lines / 589,708 B | Active UI Module |
| `src/pdi/app/PdiUnifiedApp.tsx` | Primary Unified Application Shell, Project Hub, Navigation & Workspace Host | 2,002 lines / 106,450 B (~104 KB) | 2,002 lines / 106,450 B | Primary Runtime Entry Shell (`App.tsx`) |
| `src/pdi/workspace/PdiSecondaryWorkspaceApp.tsx` | Legacy/Secondary Workspace Host | 1,648 lines / 71,699 B (~70 KB) | 1,648 lines / 71,699 B | Secondary / Non-Primary Shell |
| `src/pdi/sketch/SketchToIsoModule.tsx` | 2D Sketch-to-Isometric Recognition & Conversion Module | 1,039 lines / 44,507 B (~43 KB) | 1,039 lines / 44,507 B | Active Feature Module |

---

### 2.2 Detailed Dependency & Architecture Map of the 5 Monoliths

#### 1. `src/pdi/isometric/engine/IsometrieModuleV48d.tsx`
- **Inbound Dependents (Who imports it):**
  - `src/pdi/isometric/PdiIsometricEditor.tsx` (imports default `IsometrieModuleV48d` and `IsoInjectedPayload`)
  - `src/pdi/impression/isoSvgGenerator.ts` (imports `PipingLine`, `IsoNode`, `IsoSegment`, `IsoFitting`, `IsoAnnotation`, `segmentEndpoints`, `FITTING_LABELS`)
  - `src/pdi/isometric/tests/isoInjectionTests.ts` (imports `IsoInjectedPayload`)
- **Outbound Dependencies (What it imports):**
  - `lucide-react`, `jspdf`, `../../dexieDb`
  - `../../pipeline/PipeSpecs`, `../../piping/FlangeSpecs`, `../../piping/FittingDimensions`
  - `../../normative/integrations/isometricNormativeBridge`
  - `../../impression/ImpressionEngine`, `../../impression/ImpressionModal`
  - `../../ui/PdiNotice`, `../ui/PdiUniversalPropertyInspector`, `../adapters/isoUniversalEntityAdapter`
  - `./pdiAxes017P3`, `./pdiAnomalies017P9`
  - **Now integrated in ARCH-12:** `../types/isoGraphTypes` and `../core/IsoTopologyGraph`
- **Internal Coupling & Hazards Discovered During Audit:**
  - Prior to ARCH-12, `src/pdi/isometric/types/isoGraphTypes.ts` and `src/pdi/isometric/core/IsoTopologyGraph.ts` existed on disk as partial drafts from an earlier step, **but were never imported anywhere** (`IsometrieModuleV48d.tsx` still defined duplicate copies inline, and `IsoTopologyGraph.ts` lacked `FITTING_TYPES` node checks in `computeLineBom` as well as port offset support).
  - Similarly, `src/pdi/isometric/isoProjection.ts` exists on disk as an unintegrated helper, whereas `IsometrieModuleV48d.tsx` uses module-scoped mutable variables (`globalCurrentViewMode`, `globalCurrentYaw`, `globalCurrentPitch`, `globalModelCenter`) inside `isoProject()` for camera-dependent 2D projection. Extracting `isoProject()` before decoupling those module-global camera state variables would be unsafe.
  - By contrast, the **3D Graph Types, Constants, Port World Geometry, Topological Validation, Legacy Fitting Migration, Cumulative Distance, and BOM Engine** are 100% pure functions of `(nodes, segments, line)` and have zero dependency on React state or camera globals.

#### 2. `src/components/Calculators.tsx`
- **Inbound Dependents:**
  - `src/pdi/app/PdiUnifiedApp.tsx` (lazy-loaded via `React.lazy(() => import("../../components/Calculators"))`)
  - `src/pdi/workspace/PdiSecondaryWorkspaceApp.tsx`
- **Outbound Dependencies:**
  - `lucide-react`, `recharts`, `jspdf`, `jspdf-autotable`
  - `../pdi/ui/PdiNotice`
  - `../pdi/normative/integrations/calculatorsNormativeBridge`
- **Internal Structure:**
  - Houses multiple engineering calculator tabs (pressure containment, piping thickness, hydrotest, PSV sizing, orifice sizing, thermal expansion, bolt torque, etc.) plus PDF report generation in a single file.

#### 3. `src/pdi/app/PdiUnifiedApp.tsx`
- **Inbound Dependents:**
  - `src/App.tsx` (Primary application entry point)
- **Outbound Dependencies:**
  - `../storage/pdiProjectStore`, `../storage/pdiFileFormat`
  - `../normative/ui/PdiProjectCodeSelector`, `../normative/ui/PdiComplianceSummaryPanel`, `../normative/ui/PdiEquipmentRegisterPanel`
  - `../ui/PdiCommandPalette`, `../ui/PdiNotice`
  - Lazy-loads `PdiPidEditor`, `PdiIsometricEditor`, `SketchToIsoModule`, `Calculators`, `DataSheets`, `InspectionModule`, `HeatExchangerModule`, `ProjectSpecsModule`, `GuideModule`, `NormativeCenterModule`.

#### 4. `src/pdi/workspace/PdiSecondaryWorkspaceApp.tsx`
- **Inbound Dependents:**
  - Only referenced in `src/pdi/index.ts` as `PdiSecondaryWorkspaceApp`. Not mounted by `src/App.tsx`.
- **Outbound Dependencies:**
  - Direct static imports of `Calculators`, `DataSheets`, `InspectionModule`, `HeatExchangerModule`, `ProjectSpecsModule`, `GuideModule`, `PdiIsometricEditor`, `SketchToIsoModule`, `PidCanvasV2`.

#### 5. `src/pdi/sketch/SketchToIsoModule.tsx`
- **Inbound Dependents:**
  - `src/pdi/app/PdiUnifiedApp.tsx`, `src/pdi/workspace/PdiSecondaryWorkspaceApp.tsx`, `src/pdi/index.ts`
- **Outbound Dependencies:**
  - `../isometric/PdiIsometricEditor` (`IsoInjectedPayload`)
  - `../pipeline/PipeSpecs`, `../ui/PdiNotice`, `./sketchDxfImport`

---

## 3. PHASE B — FIRST SAFE MODULAR EXTRACTION

### 3.1 What Was Extracted & Consolidated

1. **`src/pdi/isometric/types/isoGraphTypes.ts`** (Already aligned with production types):
   - Core graph and domain types: `IsoNodeType`, `IsoFittingType`, `JointConnectionType`, `IsoPort`, `PipingJoint`, `IsoSupportType`, `IsoNode`, `IsoSegment`, `IsoFitting`, `IsoAnnotation`, `Cad2DElement`, `CustomSymbol`, `PipingLine`, `IsoInjectedPayload`, `GraphIssue`.
   - Normative/physical lookup tables & constants: `FITTING_TYPES`, `FITTING_LABELS`, `JOINT_Connection_TYPES`, `DIAMETER_BY_DN`, `WALL_BY_SCHEDULE`, `ISO_GRAPH_LIMITS`.

2. **`src/pdi/isometric/core/IsoTopologyGraph.ts`** (Upgraded to full production parity and wired into `IsometrieModuleV48d.tsx`):
   - `DEFAULT_LINE_ID`, `pdiUid(prefix)`, `pdiClamp(v, min, max)`, `pdiDia(dn)`, `EQUIPMENT_NODE_TYPES`, `isEquipmentNode(n)`, `equipmentLabel(n)`
   - `elbowAngle(type)`
   - `defaultFreeNodePorts()`
   - `makeNode(name, x, y, z, type)`
   - `makeFitting(type, localPosition, dn)`
   - `defaultEquipmentPorts(type)`
   - `equipmentPortConnectionType(type, index)`
   - `makeEquipmentNode(type, name, x, y, z, dn, rotation)`
   - `pointOnSegment(a, b, t)`
   - `portByIndex(node, index)`
   - `availablePortId(node, segments, preferred)`
   - `portWorldPosition(node, portId, nodes, segments)`
   - `segmentEndpoints(segment, nodes, segments)`
   - `rotateWorldPoint(point, pivot, angleDeg)`
   - `downstreamNodeIds(startId, segments, excludedSegmentId)`
   - `inferJointType(node, portId)` & `isWeldableConnection(type)`
   - `deriveProjectJoints(nodes, segments)`
   - `validateProjectGraph(nodes, segments, lines)`
   - `normalizedGraphPorts(nodes, segments)`
   - `cloneSegmentBetween(s, fromNodeId, toNodeId, length, type)`
   - `migrateLegacyFittings(nodes, segments)`
   - `cumulativeData(nodes, segments)`
   - `reorderFittings(list, fromIndex, toIndex)`
   - `materialRows(nodes, segments)`
   - `getFittingSvgGraphic(type, isPrint)`

3. **Backward-Compatible Re-exports in `IsometrieModuleV48d.tsx`**:
   - `IsometrieModuleV48d.tsx` imports these types, constants, and functions and re-exports `IsoNodeType`, `IsoFittingType`, `JointConnectionType`, `IsoPort`, `PipingJoint`, `IsoSupportType`, `IsoNode`, `IsoSegment`, `IsoFitting`, `IsoAnnotation`, `Cad2DElement`, `CustomSymbol`, `PipingLine`, `IsoInjectedPayload`, `FITTING_LABELS`, and `segmentEndpoints` so external callers (`PdiIsometricEditor.tsx`, `isoSvgGenerator.ts`, `isoInjectionTests.ts`) require zero breaking changes.

---

## 4. PRIORITIZED ROADMAP (ARCH-13 TO ARCH-16)

- **ARCH-13 — Isometric Projection & Camera State Decoupling (`src/pdi/isometric/core/isoProjectionEngine.ts`):**
  - Encapsulate camera view state (`viewMode`, `yaw`, `pitch`, `modelCenter`) into an explicit projection context object, eliminating module-global mutable state in `IsometrieModuleV48d.tsx` and unifying with `src/pdi/isometric/isoProjection.ts`.
- **ARCH-14 — Isometric Import/Export & DXF/PCF/CSV Serialization Extraction (`src/pdi/isometric/io/`):**
  - Extract pure PCF, DXF, CSV BOM, and JSON line serialization/deserialization helpers out of `IsometrieModuleV48d.tsx`.
- **ARCH-15 — Calculators Pure Engineering Formula Extraction (`src/pdi/calculators/engine/`):**
  - Extract pure deterministic calculation helpers and unit conversion utilities out of `src/components/Calculators.tsx` while keeping normative governance anchored to the Normative Engine.
- **ARCH-16 — Dead/Secondary Workspace Cleanup & Lazy Boundary Hardening:**
  - Audit and deprecate or consolidate `src/pdi/workspace/PdiSecondaryWorkspaceApp.tsx` and unreferenced legacy components (`src/components/Isometrie.tsx`) to reduce bundle surface area.
