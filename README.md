# Orthogonal PD&I Studio

> **Plant Design & Industrial (PD&I) Engineering Platform**  
> A modular, multi-domain industrial engineering application for piping systems, pipelines, packaged process skids, and industrial equipment.

---

## 1. Overview

**Orthogonal PD&I Studio** is a browser-based, high-performance industrial engineering and piping isometric drafting platform. It integrates deterministic engineering rules, multi-domain model representations, automated Bill of Materials (BOM/MTO), normative compliance engines, and interactive 2D/3D visualization into a single unified engineering workspace.

The platform is designed around strict industrial separation of concerns:
- **Client-Neutral Core**: Fully decoupled from any single operating organization, client entity, or proprietary schema.
- **Multi-Domain Support**: Native representation of **Piping**, **Pipeline**, **Package / Skid**, and **Equipment** disciplines under a shared common model.
- **Deterministic Normative Authority**: Traceable calculations and rule verifications aligned with international engineering standards (ASME B31.3, with reference architectures for ASME B31.8 and ASME B31.12).

---

## 2. Multi-Domain Architecture (ARCH-08)

Orthogonal PD&I Studio implements a tiered, multi-domain architecture ensuring that engineering domains share common geometry and quantification engines while maintaining their distinct technical constraints.

```text
                     PD&I ENGINEERING PLATFORM
                                 │
             ┌───────────────────┼───────────────────┐
             │                   │                   │
          PIPELINE             PIPING           PACKAGE/SKID
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 │
                             EQUIPMENT
                                 │
                                 ▼
                     COMMON ENGINEERING MODEL
                        (PdiUniversalEntity)
                                 │
             ┌───────────────────┼───────────────────┐
             │                   │                   │
          GEOMETRY           NORMATIVE          QUANTIFICATION
             │                   │                   │
          2D / 3D          CODES / RULES           BOM/MTO
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 │
                            DELIVERABLES
               (Isometrics, Spool Sheets, BoQ, DXF/PDF)
```

### Supported Engineering Domains

| Domain | Scope | Standards & Codes | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **PIPING** | In-plant process and utility piping within battery limits | ASME B31.3, ASME B16.5, ASME B16.9 | 3D Routing, Spooling, Welding, MTO, Stress Verification |
| **PIPELINE** | Cross-country and regional gas & liquid hydrocarbon transmission | ASME B31.8, ASME B31.12 (Hydrogen), API 5L | Route Alignment, Wall Thickness, Sectionalizing Valves |
| **PACKAGE / SKID** | Modular skids, structural envelopes, multi-line skids | Multi-code, Battery Limits Interfaces | Volume Envelopes, Tie-in Points, Skid Transport Weights |
| **EQUIPMENT** | Static & rotating mechanical equipment, vessels, tanks | ASME Section VIII, API 650, TEMA | Nozzle Orientations, Vessel Routing, Anchor Interfaces |

---

## 3. Architectural Principles

### 3.1 Common Engineering Model (`PdiUniversalEntity`)
All engineering disciplines project their components (pipes, fittings, flanges, valves, instruments, equipment nozzles) onto a single canonical entity model. Domain-specific attributes are attached as typed projections without creating duplicate, divergent models.

### 3.2 Client Neutrality & Industrial Isolation (ARCH-07)
The platform engine is strictly client-neutral:
- **Layer 1: Common Engineering Model** (`PdiUniversalEntity`) — Zero external or organizational dependencies.
- **Layer 2: Normative Authority & Codes** — Verified engineering data, dimensions, and rating matrices.
- **Layer 3: Physical Quantification (MTO/BOM)** — Calculates physical quantities without commercial assumptions.
- **Layer 4: Commercial Layer (Price Book & BoQ)** — Dynamic, client-configurable costing isolated from the engineering core.
- **Layer 5: Organization & Client Profile** — Neutral default profile, dynamic branding, zero hardcoded legacy client identifiers.

### 3.3 Normative Evidence & Determinism
Every normative decision (wall thickness calculation, pressure-temperature rating validation, component dimensional compatibility) is tracked through immutable evidence records and reproducible calculation bridges.

---

## 4. Key Platform Features

- **Interactive 2D / 3D Canvas**: Real-time isometric drafting, 3D spatial navigation, orthogonal axis snapping, and dimension editing.
- **Technical Workflow Integration**: Seamless flow from P&ID schematics to 3D piping routing and automated isometric deliverable generation.
- **Automated Spool & Weld Management**: Generation of fabrication spools, weld IDs, NDT requirements, and workshop cut-lists.
- **BOM & BoQ Engine**: Real-time extraction of physical material take-offs (MTO) and priced Bills of Quantities (BoQ) with multi-currency support.
- **Deliverables Generation**: One-click generation of PDF isometric production drawings, DXF CAD files, and structured JSON project exports.

---

## 5. Getting Started

### Prerequisites
- **Node.js**: `20.x` or higher
- **npm**: `10.x` or higher

### Installation

```bash
# Clone repository
git clone https://github.com/boudjadayoucef-sketch/Orthogonal-PDI-studio-.git
cd Orthogonal-PDI-studio-

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

Launches the application development server at `http://localhost:3000`.

### Production Build

```bash
npm run build
```

Compiles the frontend assets via Vite and creates the Node.js production server bundle in `dist/`.

To launch the built server:
```bash
npm start
```

---

## 6. Testing & Architectural Validation

The platform includes automated architectural and normative test suites using **Vitest**:

```bash
# Run all architectural and normative tests once
npm test

# Run tests in watch mode during development
npm run test:watch

# Validate TypeScript type-checking across the codebase
npm run lint
```

### Verified Test Suites
- **ARCH-08 Multi-Domain Architecture Suite**: Domain registry, boundary validations, capability orthogonality, non-duplication enforcement.
- **ARCH-07 Industrial Architecture Suite**: Client neutrality, commercial boundary isolation, layer integrity, audit ledger.
- **NORM-01..14 Global Normative Integration Suite**: End-to-end normative compatibility, component resolution, traceability, and evidence registry.
- **ARCH-01..06 Suites**: Universal model, isometric normative bridge, technical workflow, and component selection compatibility.

---

## 7. License & Compliance

Orthogonal PD&I Studio is provided for industrial plant design and engineering workflows. All engineering calculation engines comply with standard international engineering references and codes of practice.
