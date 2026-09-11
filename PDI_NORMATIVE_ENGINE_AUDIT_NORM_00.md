# PDI — NORMATIVE ENGINE
## PATCH NORM-00 — AUDIT-ONLY / SPECIFICATION
### Intégration des normes industrielles dans le SaaS de conception de piping & isométrie

---

- **Projet :** PD&I / Orthogonal-Eng (PDI Vision SaaS)
- **Document :** Rapport d'Audit & Spécification Technique
- **Statut :** AUDIT-ONLY / SPECIFICATION (Conforme aux règles de gel de code)
- **Date :** 11 Septembre 2026

---

## 1. EXECUTIVE SUMMARY

L'audit approfondi du référentiel technique de PD&I confirme que **l'application dispose d'un moteur géométrique et isométrique 2D/3D performant** (gestion spatiale X/Y/Z, accrochages, gestion des ports de composants, caleponrage de spools, carnet de soudures, nomenclature BOM, supports MSS SP-58 et mise en plan A3/A4 normalisée), **mais est totalement dépourvue d'un moteur normatif unifié, découplé et auditable**.

### Constats majeurs :
1. **Absence d'abstraction normative unifiée :** Les codes et standards (ASME B31.3, B31.4, B31.8, B16.5, B16.9, API 5L, EN 1092-1, DIN) apparaissent sous forme de chaînes de caractères brutes (*string literals* non typées) dans les libellés de tags (`pdiTagging.ts`), les désignations de composants (`trouvayCauvinCatalog.ts`) et les descriptions textuelles de nomenclature.
2. **Absence de gestion des éditions de normes :** Le système traite les normes sans millésime ni révision (ex. `"ASME B16.5"` au lieu de `"ASME B16.5:2020"`). Il est impossible de retracer quelle édition a gouverné le choix d'un composant, son épaisseur ou sa contrainte admissible.
3. **Hardcodage dimensionnel et métallurgique :** Les relations entre DN, Schedules (Sch 40, Sch 80...), diamètres extérieurs réels (OD) et épaisseurs de paroi sont codées en dur de manière parcellaire (ex. switch-cases limités dans `isoWeldSpoolEngine.ts` ou dimensionnements tronqués dans le catalogue statique).
4. **Calculs déconnectés des codes de conception :** Les calculs (pression d'épreuve, formule de Barlow / contrainte circonférentielle) présents dans `Calculators.tsx` ne sont pas instanciés via une Piping Spec ou un Code de conception sélectionnable ; ils emploient des formules isolées dans des composants React sans traçabilité des coefficients de qualité de joint ($E$), de tolérance de laminage ($c$) ni de facteur de conception ($F$).
5. **Couplage UI / Données :** Les catalogues et les règles de validation sont injectés directement dans le cycle de vie React (`IsometrieModuleV48d.tsx`), rendant tout contrôle déterministe ou moteur de conformité impossible en dehors de l'interface graphique.

---

## 2. CURRENT ARCHITECTURE

L'architecture actuelle du SaaS s'articule en 4 couches :

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND REACT (Vite 6 + React 19)                 │
│  - IsometrieModuleV48d.tsx (Moteur Isométrique 2D SVG & Canvas)         │
│  - Iso3DViewerModal.tsx / Three.js (Visualisation 3D)                   │
│  - Calculators.tsx (Calculs épreuve hydraulique, pose sablonneuse, etc.)│
│  - IsoPrintModal.tsx / isoSheetStandards.ts (Planches A3/A4 ISO)        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     MOTEURS MÉTIER CLIENT (TypeScript)                  │
│  - trouvayCauvinCatalog.ts : Catalogues de dimensions & vignettes SVG   │
│  - pdiTagging.ts : Générateur de tag de ligne (DN-Service-Num-Spec)     │
│  - pdiClassePression017K3.ts : Vérification statique Spec / Rating      │
│  - pdiMssSupportEngine.ts : Catalogue supports MSS SP-58 (Types 1..57)  │
│  - isoWeldSpoolEngine.ts : Détection soudures & découpage Spools        │
│  - pdiUnitSystem.ts : Conversion d'unités (NIST SP 811)                 │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND & PERSISTENCE                         │
│  - server.ts : Express 4 / Node.js avec proxy Vite                     │
│  - Drizzle ORM (schema.ts) : PostgreSQL (users, projects, drive_files)  │
│  - Firestore : Stockage temps réel / synchronisation multi-utilisateurs │
│  - Projet sérialisé : Blob JSON unique stocké dans projects.data         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. NORMATIVE DEPENDENCY MAP

Le flux actuel des informations normatives dans le code source :

```
[PdiProjectSetup] (pdiTagging.ts)
  │  - standard: "ANSI" | "DIN"  <-- Sélecteur binaire global restrictif
  │  - specs: PdiSpec[]          <-- ex: CS150, CS300, SS150, DIN-PN16
  ▼
[pdiClassePression017K3.ts]
  │  - Lit la classe de pression dans la Spec active (ex: "Class 150")
  │  - Alerte en cas de discordance lors de l'insertion d'un tronçon
  ▼
[IsometrieModuleV48d.tsx] (Composant monolithique)
  │  ├── Appel makeNode() / makeEquipmentNode()
  │  │     └── Attribue: dn, schedule, wallThicknessMm, pn, material
  │  ├── Appel materialRows() [Génération de la BOM]
  │  │     └── Jointure sur IsoFittingType via PDI_INTERNATIONAL_PIPING_CATALOG
  │  └── Validation manuelle visuelle sans Compliance Engine
  ▼
[isoWeldSpoolEngine.ts]
     ├── getStdSchedule(dn) --> Épaisseur Sch 40 par défaut hardcodée
     ├── dnToNps(dn) --> Switch-case hardcodé (sans distinction OD métrique/impérial)
     └── Estimation masse = (DN / 25) * 4.2 kg/m + masse raccords catalogue
```

---

## 4. CURRENT DATA MODEL

### 4.1 Modèle de Projet (`PdiProjectSetup` dans `pdiTagging.ts`)
```typescript
export interface PdiProjectSetup {
  projectName: string;
  projectCode: string;
  client: string;
  unit: "mm" | "inch";
  standard: "ANSI" | "DIN"; // Trop restrictif : amalgame ANSI/ASME et DIN/EN
  tagFormatName: string;
  formats: PdiTagFormat[];
  services: PdiService[];
  specs: PdiSpec[];
}
```

### 4.2 Modèle de Spécification (`PdiSpec` dans `pdiTagging.ts`)
```typescript
export interface PdiSpec {
  code: string;           // ex: "CS150", "CS600"
  material: string;       // Libellé texte brut, ex: "Acier carbone ASTM A106 Gr.B"
  pressureClass: string;  // Libellé texte brut, ex: "Class 150", "PN16"
  minDn: number;          // Borne DN minimale
  maxDn: number;          // Borne DN maximale
}
```

### 4.3 Modèle de Nœud / Segment (`IsoNode` & `IsoSegment` dans `isoGraphTypes.ts`)
Les champs normatifs sont tous des chaînes ou des nombres isolés :
- `dn?: number` (ex. `100`)
- `pn?: string` (utilisé indifféremment pour `"Class 150"` ou `"PN16"`)
- `pressureClass?: string`
- `schedule?: string` (ex. `"Sch 40"`, `"STD"`)
- `material?: string`
- `wallThicknessMm?: number`

**Manque critique :** Aucune clé étrangère vers une entité standard (`standardId`), aucune édition (`edition`), aucun certificat matière (MTC / EN 10204 3.1), aucun code de calcul (`designCode`).

### 4.4 Modèle de Composant Catalogue (`TcComponentDefinition` dans `trouvayCauvinCatalog.ts`)
```typescript
export interface TcComponentDefinition {
  id: IsoFittingType;
  code: string;
  labelFr: string;
  labelEn: string;
  shortName: string;
  category: TcCategory;
  standard: string;        // Chaîne composite libre, ex: "ASME B16.9 / EN 10253-2"
  materialDefault: string; // Chaîne libre
  connectionDefault: JointConnectionType;
  pressureClasses: string[];
  dimensions: TcDimensionEntry[];
}
```

---

## 5. HARDCODED NORMATIVE DATA

L'audit a identifié les occurrences normatives codées en dur :

| Fichier | Ligne / Symbole | Donnée Hardcodée | Source Normative Implicite | Risque | Recommandation |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `isoWeldSpoolEngine.ts` | L.119–130 (`getStdSchedule`) | `dn <= 25 -> 3.38mm`, `dn <= 50 -> 3.91mm`... jusqu'à DN 400 | ASME B36.10M (Sch 40 / STD) | **P0** | Remplacer par une table dimensionnelle complète indexée par (NPS, Schedule) |
| `isoWeldSpoolEngine.ts` | L.133–156 (`dnToNps`) | Table de correspondance statique `switch (dn)` | ASME B36.10M / ISO 6708 | **P1** | Remplacer par un registre formel d'équivalence dimensionnelle |
| `isoWeldSpoolEngine.ts` | L.437 | Masse tube : `(s.dn / 25) * 4.2 kg/m` | Approximation empirique non normative | **P1** | Calculer la masse linéaire théorique $M = \pi \cdot (OD - t) \cdot t \cdot \rho$ |
| `pdiClassePression017K3.ts` | L.28–36 | `PDI_CLASSES_B165_017K3` (7 classes ASME) | ASME B16.5 | **P2** | Intégrer au registre de standards produit |
| `pdiClassePression017K3.ts` | L.41 | `PDI_DESIGNATIONS_PN_017K3` (PN10 à PN400) | EN 1092-1 / DIN | **P2** | Intégrer au registre des ratings EN |
| `trouvayCauvinCatalog.ts` | L.64..860 | Cotes Face-to-Face, Center-to-End, masses | ASME B16.9, B16.5, B16.10 | **P1** | Relier les dimensions à un `DimensionalCatalogue` structuré |
| `pdiTagging.ts` | L.58–73 | `PDI_DEFAULT_SPECS` (14 specs pré-définies) | ASME B31.3 / B31.4 / EN 13480 | **P1** | Migrer vers le `PipingSpecEngine` |
| `Calculators.tsx` | L.1948 | `hoopStressLow = (pLowPoint * diameterGauvin) / (20 * thicknessGauvin)` | Formule de Barlow (simplifiée sans tolérance ni joint factor) | **P0** | Remplacer par l'implémentation formelle ASME B31.4 / B31.8 / B31.3 |

---

## 6. STANDARD COVERAGE MATRIX

| Standard | Présent | Partiel | Absent | Fichiers Concernés | Risque & Analyse |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **ASME B31.3** (Process Piping) | | **X** | | `pdiTagging.ts`, `trouvayCauvinCatalog.ts` | **P1** : Mentionné dans les libellés de services, mais aucune formule de calcul d'épaisseur minimum requise ($t_m$) selon par. 304.1.2. |
| **ASME B31.4** (Liquid Pipelines) | | **X** | | `pdiTagging.ts` | **P1** : Mentionné pour les fluides HC. Manque le calcul de contrainte circonférentielle avec facteur de conception $F = 0.72$. |
| **ASME B31.8** (Gas Transmission) | | **X** | | `pdiTagging.ts` | **P1** : Mentionné pour le gaz naturel. Manque la distinction des classes d'emplacement (Location Class 1, 2, 3, 4). |
| **ASME B16.5** (Flanges NPS 1/2-24) | | **X** | | `trouvayCauvinCatalog.ts`, `pdiClassePression017K3.ts` | **P1** : Brides WN, SO, BL présentes jusqu'au DN 300, mais tables complètes de perçage (PCD, boulonnerie) absentes. |
| **ASME B16.47** (Large Flanges > 24") | | | **X** | Aucun | **P2** : Aucune donnée sur les séries A et B au-delà du DN 600 (NPS 24). |
| **ASME B16.9** (BW Fittings) | | **X** | | `trouvayCauvinCatalog.ts` | **P1** : Coudes 90/45, tés, réductions présents pour quelques DN. Épaisseurs Sch 40/80 mélangées. Pas de traçabilité d'édition. |
| **ASME B16.10** (Face-to-Face Valves) | | **X** | | `trouvayCauvinCatalog.ts` | **P1** : Cotes Face-to-Face présentes mais non indexées par rating Class 150/300/600. |
| **ASME B16.11** (Forged Fittings SW/THD) | | **X** | | `trouvayCauvinCatalog.ts` | **P2** : Uniquement sockolet/threadolet sommaires. Coudes/tés 3000#/6000# absents. |
| **ASME B36.10M** (Carbon Steel Pipes) | | **X** | | `isoWeldSpoolEngine.ts` | **P0** : Réduit à un switch statique sur Sch 40. Tables complètes STD, XS, XXS, Sch 10..160 absentes. |
| **ASME B36.19M** (Stainless Steel Pipes) | | | **X** | Aucun | **P1** : Épaisseurs spécifiques acier inoxydable (Sch 5S, 10S, 40S, 80S) absentes. |
| **API 5L** (Line Pipe) | | **X** | | `pdiTagging.ts`, `trouvayCauvinCatalog.ts` | **P1** : Grades mentionnés dans les libellés (Gr.B, X52, X65, X70), sans propriétés mécaniques associées ($SMYS$, $SMTS$). |
| **API 6D** (Pipeline Valves) | | **X** | | `trouvayCauvinCatalog.ts` | **P1** : Mentionné pour té barré et vannes, sans spécification d'étanchéité ni de DBB. |
| **API 594** (Check Valves) | | | **X** | Aucun | **P2** : Clapets double battant / wafer non distingués selon ce standard. |
| **API 600** (Steel Gate Valves) | | | **X** | Aucun | **P2** : Vannes à opercule traitées de manière générique sans référence aux épaisseurs de corps API 600. |
| **API 602** (Compact Steel Valves) | | | **X** | Aucun | **P2** : Robinetterie forgée compacte non implémentée. |
| **API 609** (Butterfly Valves) | | | **X** | Aucun | **P2** : Vannes papillon sans distinction Catégorie A / B. |
| **ISO 13623** (Pipeline Transport) | | | **X** | Aucun | **P2** : Non référencé dans les modèles de calcul ou de tags. |
| **EN 13480** (Tuyauteries métalliques) | | **X** | | `pdiTagging.ts` | **P1** : Nuances européennes mentionnées (P235GH, P265GH), mais règles de calcul EN 13480-3 absentes. |
| **EN 1092-1** (Brides circulaires PN) | | **X** | | `pdiTagging.ts`, `pdiClassePression017K3.ts` | **P1** : Classes PN10..PN400 présentes comme labels, mais sans tables dimensionnelles de collerette Type 11. |
| **DIN (Historique)** | | **X** | | `pdiTagging.ts` | **P2** : Résiduel, utilisé comme synonyme d'EN 1092-1. Risque de confusion historique. |

---

## 7. DATA MODEL GAPS

1. **Absence de l'entité `NormativeStandard` :** Il n'existe aucune entité définissant une norme avec `id`, `organization` (ASME, API, ISO, EN), `code`, `title`, `edition`, `status` (active, superseded, withdrawn).
2. **Absence de l'entité `PipingClass` / `PipingSpecification` :** L'interface actuelle `PdiSpec` ne définit que 5 champs (code, matériau, classe, minDn, maxDn). Une véritable Piping Spec industrielle requiert la définition précise composant par composant (type de tube, nuance, schedule, type de raccord, norme dimensionnelle, type de joint, boulonnerie).
3. **Absence de la table dimensionnelle de tuyauterie (`PipeDimensionalRecord`) :** Aucun modèle ne dissocie le NPS, le DN, le diamètre extérieur exact en millimètres ($OD$), l'épaisseur nominale ($t$), le Schedule, et le poids linéique théorique.
4. **Absence d'entité `MaterialSpecification` :** Les matériaux sont des chaînes libres (`"Acier carbone ASTM A106 Gr.B"`). Il manque les propriétés physiques : limite d'élasticité ($SMYS$), contrainte admissible en température ($S$), coefficient de dilatation thermique ($\alpha$), module d'élasticité ($E$).
5. **Absence de traçabilité des règles de conformité :** Aucune structure ne conserve le lien entre un choix de modélisation et la clause normative qui l'autorise ou le restreint.

---

## 8. ARCHITECTURAL GAPS

1. **Mélange entre Code de Conception et Standard Produit :** Le système traite au même niveau logique un code de calcul (ASME B31.3) et un standard dimensionnel de raccord (ASME B16.9).
2. **Couplage monolithique dans l'IHM (`IsometrieModuleV48d.tsx`) :** L'insertion, le calcul géométrique, la cotation, le typage des ports et la génération de la BOM sont encapsulés dans un unique composant React de plus de 13 000 lignes.
3. **Absence de moteur de calcul découplé :** Les calculs techniques (perte de charge, contraintes, dilatation thermique, épaisseur minimale) sont soit codés directement dans les formulaires de l'interface (`Calculators.tsx`), soit simulés par des approximations au moment de la génération de Spools (`isoWeldSpoolEngine.ts`).
4. **Persistance en Document Unique :** Le schéma de base de données PostgreSQL (`schema.ts`) sauvegarde l'intégralité d'un réseau de piping sous la forme d'un blob JSON opaque (`projects.data`). Il est impossible d'effectuer des requêtes relationnelles pour auditer l'utilisation d'un composant standard à l'échelle d'une entreprise.

---

## 9. SAFETY / ENGINEERING RISKS

| ID | Risque d'Ingénierie | Niveau | Cause Racine Identifiée | Conséquence Réelle sur Chantier / Usine |
| :--- | :--- | :---: | :--- | :--- |
| **RISK-01** | Sous-dimensionnement d'épaisseur de paroi sous haute pression | **P0** | `getStdSchedule` force Sch 40 par défaut si non spécifié | Éclatement de la conduite en cas d'utilisation sur un réseau HP (Class 600 / 900) où Sch 80 ou Sch 160 était requis. |
| **RISK-02** | Calcul de contrainte circonférentielle optimiste (Formule de Barlow incomplète) | **P0** | Omission du facteur de joint de soudure $E$ et de la surépaisseur de corrosion $c$ dans `Calculators.tsx` | Pression maximale admissible (MAOP) surestimée de 15% à 30%, violation directe des codes de sécurité transport gaz/liquide. |
| **RISK-03** | Confusion dimensionnelle NPS vs DN | **P1** | Correspondances approximatives dans `dnToNps` | Erreur de commande matière ou incompatibilité géométrique d'accostage lors du soudage bout à bout. |
| **RISK-04** | Fausses équivalences Class ASME / PN DIN | **P1** | Assimilation implicite de ratings sur certaines lignes hybrides | Défaillance de tenue mécanique des brides : Class 150 (20 bar max à froid) utilisé pour un service PN25 ou PN40. |
| **RISK-05** | Masse de transport et levage de Spools erronée | **P1** | Formule linéaire simplifiée `(DN / 25) * 4.2 kg/m` | Incident lors du grutage sur site ou dépassement de charge d'essieu en convoi routier. |

---

## 10. IP / LICENSING RISKS

Les organismes de normalisation (ASME, API, ISO, AFNOR/CEN, DIN) protègent rigoureusement leurs droits de propriété intellectuelle :
1. **Risque de contrefaçon :** L'intégration directe et intégrale des tables protégées (par exemple, reproduction exhaustive des tables de pression-température de l'ASME B16.5 ou des courbes de flexibilité B31.3) expose la plateforme à des actions en contrefaçon de droits d'auteur.
2. **Recommandation stratégique :**
   - Implémenter des **formules mathématiques d'ingénierie ouvertes** (formules d'épaisseurs, moments d'inertie, calculs de perte de charge).
   - Stocker les dimensions fonctionnelles essentielles d'accostage industriel (diamètres extérieurs, encombrements face-à-face) sous forme de **structures de données techniques d'interopérabilité**.
   - Proposer un système de **"Bring Your Own License" (BYOL)** ou d'importation de catalogues fabricants / bibliothèques privées d'entreprises.
   - Ne **JAMAIS** héberger ou distribuer des copies textuelles, extraits intégraux ou PDF de normes au sein du SaaS.

---

## 11. TARGET ARCHITECTURE

```
                               ┌─────────────────────────┐
                               │     PROJECT CONTEXT     │
                               │  (Code, Fluids, Units)  │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │   PIPING SPEC ENGINE    │
                               │ (Specs: CS150, SS300...)│
                               └────────────┬────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
  │   DESIGN CODE ENGINE    │  │   DIMENSIONAL ENGINE    │  │     MATERIAL ENGINE     │
  │ (ASME B31.3/4/8, EN...) │  │ (B16.5, B16.9, B36.10M) │  │  (ASTM, API 5L, EN...)  │
  │  - Formules d'épaisseur │  │  - OD, Wall Thickness   │  │  - Limite élastique     │
  │  - Facteurs de calcul   │  │  - Cotes Face-to-Face   │  │  - Contraintes admiss.  │
  └────────────┬────────────┘  └────────────┬────────────┘  └────────────┬────────────┘
               │                            │                            │
               └────────────────────────────┼────────────────────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │   ENGINEERING MODEL     │
                               │  (Nodes, Segments, etc.)│
                               └────────────┬────────────┘
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
  ┌─────────────────────────┐                               ┌─────────────────────────┐
  │    COMPLIANCE ENGINE    │                               │     ISOMETRIC ENGINE    │
  │  - Vérification épaisseur│                               │  - Cotation automatique │
  │  - Vérification rating  │                               │  - Carnet de soudage    │
  │  - Rapport de conformité│                               │  - BOM / MTO vérifié    │
  └─────────────────────────┘                               └─────────────────────────┘
```

---

## 12. PATCH ROADMAP

Découpage progressif et déterministe pour l'implémentation du moteur normatif :

- **NORM-01 : Types et Structures de Domaine Normatif (Core Registry)**
  - Déclaration des interfaces : `NormativeStandard`, `StandardEdition`, `DesignCodeReference`.
  - Registre central immuable des normes référencées.
- **NORM-02 : Moteur Dimensionnel des Tubes (ASME B36.10M / B36.19M)**
  - Base de données dimensionnelle certifiée : NPS, DN, OD, épaisseurs exactes pour tous les Schedules, masses linéiques précises.
- **NORM-03 : Moteur Dimensionnel des Raccords (ASME B16.9 / MSS SP-97)**
  - Coudes (LR/SR/3D/5D), tés égaux et réduits, réductions concentriques/excentriques, fonds bombés.
- **NORM-04 : Moteur des Brides et Raccordements (ASME B16.5 / EN 1092-1)**
  - Séparation stricte des ratings ASME (Class 150 à 2500) et EN (PN10 à PN400). Cotes de raccordement et d'encombrement.
- **NORM-05 : Moteur de Robinetterie Industrielle (ASME B16.10 / API 6D / API 600)**
  - Cotes Face-to-Face paramétriques selon le type, le diamètre et la classe de pression.
- **NORM-06 : Moteur des Matériaux et Propriétés Mécaniques (ASTM / API / EN)**
  - Nuances, groupes de matériaux, contraintes admissibles, résiliences, adéquation aux fluides.
- **NORM-07 : Piping Specification Engine (Spec Builder)**
  - Assemblage de classes de tuyauterie cohérentes liant tube, raccords, brides, vannes et joints.
- **NORM-08 : Moteur de Calcul d'Ingénierie (Design Code Formulation)**
  - Implémentation mathématique des équations d'épaisseur minimale ASME B31.3 (par. 304.1.2), ASME B31.4 et B31.8.
- **NORM-09 : Moteur de Conformité (Compliance Engine)**
  - Validation automatique : adéquation rating/pression/température, surépaisseur de corrosion, espacement des supports.
- **NORM-10 : Interfaçage avec le Modèle Isométrique et la BOM**
  - Consommation des composants certifiés dans l'éditeur isométrique, affichage des statuts de conformité dans l'inspecteur et sur les plans A3/A4.

---

## 13. FIRST PATCH PROPOSAL (NORM-01)

### Intitulé : NORM-01 — Normative Domain Foundation & Core Types
- **Objectif :** Poser le socle typé du domaine normatif dans un répertoire dédié (`/src/pdi/normative/`), sans modifier aucun composant UI ni altérer les flux de production actuels.
- **Périmètre prévu :**
  1. `src/pdi/normative/types/normativeCoreTypes.ts` : Définition des types `NormativeStandard`, `StandardEdition`, `DesignCodeId`, `ProductStandardId`, `MaterialStandardId`.
  2. `src/pdi/normative/registry/standardsRegistry.ts` : Registre des standards référencés (ASME B31.3, B31.4, B31.8, B16.5, B16.9, B16.10, B36.10M, API 5L, API 6D, EN 13480, EN 1092-1) avec leur statut et leur domaine d'application.
  3. `src/pdi/normative/types/complianceTypes.ts` : Définition de `ComplianceCheckResult` et des niveaux de sévérité (`compliant`, `warning`, `non_compliant`, `unverified`).
- **Impact sur le code existant :** **ZÉRO**. Aucun refactoring, aucune régression.

---

## 14. TEST STRATEGY

Suites de tests unitaires à préparer :
1. **Tests d'intégrité du registre normatif :**
   - Vérifier qu'aucun standard n'est déclaré sans organisation, numéro ou statut.
   - Vérifier que chaque code de conception possède une liste explicite de standards produits admissibles.
2. **Tests de précision dimensionnelle :**
   - Comparer les cotes de tubes (OD, épaisseurs Sch 40, Sch 80, Sch 160, STD, XS) avec les tables ASME B36.10M.
   - Vérifier que la conversion $NPS \leftrightarrow DN$ rejette toute extrapolation non standardisée.
3. **Tests d'indépendance des ratings :**
   - Vérifier qu'une tentative d'association directe entre `Class 150` et `PN20` ou `PN16` déclenche une alerte de traçabilité et ne produit pas d'équivalence silencieuse.
4. **Tests de validation des formules de calcul :**
   - Vérifier le calcul d'épaisseur sous pression ASME B31.3 sur des cas de test académiques calibrés (comparaison avec résultats manuels certifiés).

---

## 15. GO / NO-GO

### Recommandation formelle : **GO**

**Justification :**
- L'audit démontre clairement la faisabilité technique de l'intégration : le moteur graphique et isométrique actuel est stable et dispose déjà des points d'ancrage fonctionnels nécessaires (`IsoNode`, `IsoSegment`, `PdiProjectSetup`, `materialRows`).
- L'architecture cible proposée garantit un découplage total entre le moteur normatif et le rendu graphique React.
- L'implémentation phasée (commençant par le socle isolé `NORM-01`) n'engendre aucun risque de régression sur les fonctionnalités existantes de dessin, d'export de Spools ou d'impression de plans.

---
*Fin du rapport d'audit PATCH NORM-00. Aucun code ni fichier de production n'a été altéré.*
