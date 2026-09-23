# BALISE TECHNIQUE & WORKFLOW PD&I — V2.7 (23 SEPTEMBRE 2026)
*Document de référence unique de gouvernance, d'architecture et de feuille de route industrielle.*  
*Éditeur : **ORTHOGONAL - ENG** · Direction Technique : **Youcef Seif Eddine Boudjada***

---

## 1. DÉCISION STRATÉGIQUE ET STATUT INDUSTRIEL (Règles R20 & R30)

1. **Statut Logiciel Professionnel Autonome** :
   PD&I est une suite CAO d'ingénierie tuyauterie et isométrie industrielle 100% autonome, exécutant ses algorithmes géométriques, topologiques, normatifs et vectoriels en **Local-First** (zéro dépendance vers des serveurs ou API de calcul tiers).
2. **Propriété Intellectuelle & Signature Technique Inaltérable (R30)** :
   Le moteur, les registres de commandes, les algorithmes analytiques et les modèles exportés portent la signature certifiée de **`ORTHOGONAL - ENG`**. Les cartouches de planches normalisées ISO 7200, les exports SVG/PDF et les fichiers projets `.pdi` intègrent l'empreinte logicielle inaltérable.
3. **Architecture Tri-Cible Unifiée (R20)** :
   - **SaaS Web Pro** : Exécution dans le navigateur via React 18 / TypeScript / Vite, sans calcul serveur.
   - **Desktop Autonome** : Packaging Tauri v2 (~10 Mo), stockage des fichiers de projets physiques `.pdi` sur disque dur local, fonctionnement déconnecté garanti.
   - **Chantier / Tablette** : Relevé de métrés, capture de croquis et vérification des assemblages sur site.

---

## 2. ÉTAT DES LIEUX TECHNIQUE DÉTAILLÉ

### A. Modules Achevés et Validés
- **Palier 0 — Socle, Modularité & Sécurité** :
  - Découplage de la topologie pure (`IsoTopologyGraph.ts` sans JSX ni dépendance DOM).
  - Sécurisation des en-têtes HTTP de distribution (`server.ts` : CSP, `X-Content-Type-Options: nosniff`, masquage `x-powered-by`, signature `X-Engine-Vendor: ORTHOGONAL-ENG`).
  - Système d'historique robuste (Undo/Redo) avec sérialisation déterministe.
- **Palier 1 — Module d'Impression & Exportation Industrielle (020F & Patch Centrage 04/09)** :
  - Prise en charge intégrale des formats normalisés **ISO 216** du **A5 au A0** (Portrait / Paysage).
  - Échelles normalisées (1:1, 1:20, 1:50, 1:100, NTS / Ajusté).
  - Cartouche technique normalisé **ISO 7200** (180 × 55 mm) paramétrable avec révision, fluide, pressions, signature d'entreprise.
  - Cadre, repères de centrage et marges de reliure normalisés **ISO 5457**.
  - Légende adaptative filtrée (uniquement les composants et diamètres effectivement présents).
  - Moteur d'exportation vectorielle directe **SVG** et flux d'impression vectoriel navigateur `@page`.
  - **Centrage dynamique & Bounding Box rigoureuse (04/09/2026)** : Élimination du faux offset de 12 m sur les massifs de supports, calcul du barycentre exact avec prise en compte des découpes de raccords (`segmentEndpoints`) et centrage symétrique strict dans la zone utile de la feuille (dégagement sous titre et au-dessus du cartouche).
  - **Calage manuel d'ajustement fin** : Contrôle X/Y au millimètre (±5 mm) avec réinitialisation instantanée au centrage automatique.
  - **Ergonomie spatiale du canvas** : Panneau rail latéral rétractable pour maximiser l'espace de modélisation 3D.
- **Palier 2A — Moteur d'Unités Bi-Système Universel (019U)** :
  - Implémentation conforme aux normes métrologiques **ISO 80000-1 / ISO 80000-3**, **NIST SP 811** et **IEEE/ASTM SI 10**.
  - Bascule instantanée sans altération du modèle physique (stockage interne invariant en unités SI de référence).
  - Prise en charge intégrale du système **Métrique** (m, mm, bar, kg, °C) et du système **Impérial / US Customary** (ft-in fractionnaires ASME, in décimaux, psi, lbs, °F).
  - Parseur intelligent d'entrées utilisateur (ex: `12'-4 3/8"`, `150 mm`, `4.5 m`, `150 psi`).
  - Répercussion synchronisée dans les cotes du canvas, la barre de commande AutoCAD, le cartouche ISO 7200, la nomenclature matérielle BOM et le carnet de soudage.
- **Palier 2B — Outils de Modification Géométrique Transactionnelle 2D / Isométrie (019B)** :
  - Moteur géométrique analytique transactionnel dédié (`cad2dModifyEngine.ts`).
  - **TRIM (`AJUSTER`, `TR`, `COUPER`)** : Calcul des intersections sécantes, scission en sous-segments et suppression du segment ciblé (actif sur polylignes, lignes 2D et tronçons de tuyauterie avec insertion automatique de nœuds de coupe).
  - **EXTEND (`PROLONGER`, `EX`)** : Prolongation collinéaire de l'extrémité la plus proche vers la ligne frontière sécante la plus proche.
  - **OFFSET (`DECALER`, `O`)** : Calcul géométrique des parallèles pour lignes, cercles concentriques et polygones décalés à distance paramétrique spécifiée.
  - **FILLET (`RACCORD`, `F`, `CONGE`)** : Raccordement d'angle par arc tangentiel selon rayon spécifié.
  - **SCALE (`ECHELLE`, `SC`)** : Mise à l'échelle uniforme avec sélection du point de base et facteur d'échelle.
  - **CHAMFER (`CHANFREIN`, `CHA`)** : Biseautage d'angle avec calcul d'intersection et segment de chanfrein.
  - **HATCH (`HACHURE`, `H`)** : Motifs de hachures conformes (ANSI31 45°, ANSI32 quadrillé, DOTS, SOLID) avec motifs vectoriels SVG intégrés.
  - Intégration complète à la barre de commande avec annulation `Échap` sans effet de bord et historisation Undo/Redo.
- **Palier 2C — Supports Normalisés MSS SP-58 & Quantitatifs Génie Civil (019S)** :
  - Catalogue analytique complet conforme **MSS SP-58 / MSS SP-69** et **ASME B31.3** (`pdiMssSupportEngine.ts`).
  - Types normalisés implémentés : Type 1 (Pendard simple réglable), Type 35 (Guide coulissant réglable), Type 39 (Patin de guidage soudé / Pipe shoe), Type 51 (Support à ressort variable), Type 57 (Point fixe rigide d'ancrage / Anchor).
  - Rendu vectoriel SVG isométrique dynamique (`IsoSupportRenderer.tsx`) avec symboles graphiques normés, badges de repérage et surbrillance de sélection.
  - Outil de placement interactif sur tronçon de tuyauterie avec calcul automatique de l'abscisse curviligne et de l'élévation Z.
  - Vérificateur automatique des portées maximales admissibles entre supports selon **ASME B31.3 Table 321.1.3** (service eau / gaz avec détection d'excès de portée et alertes visuelles).
  - Dimensionnement et quantitatifs des interfaces **Génie Civil** : platines métalliques (épaisseur, dimensions, nuance d'acier, masse volumique 7850 kg/m³), chevilles & goujons d'ancrage normalisés **EN 1992-4** (M12 à M30, profondeur d'ancrage), et massifs de fondation béton (volume m³, classe C20/25 à C35/45).
  - Panneau interactif d'ingénierie et d'inspection dédié (`PdiSupportCivilPanel.tsx`) intégré au panneau latéral droit et accessible via raccourcis `SUP`, `ANCHOR`, `GUIDE`, `HANGER`, `SHOE`, `SPRING`.
  - Exportation MTO Supportage & Génie Civil en CSV tabulaire industriel.
  - Sérialisation et persistance complètes dans le schéma de projet `IsoProjectFileV474` avec historisation Undo/Redo.
- **Palier 2D — Moteur Normatif Calculatoire Déterministe & Modèle d'Évidence (NORM-01 à NORM-11)** :
  - Architecture étanche : `IDENTIFICATION → QUALIFICATION → EVIDENCE → VERIFIED VALUE → CALCULATION BOUNDARY`.
  - Modules de calculs d'ingénierie normés : Tuyauterie dimensionnelle (`NORM-02`), Raccords B16.9 (`NORM-03`), Brides B16.5 (`NORM-04`), Robinetterie (`NORM-05`), Matériaux métalliques (`NORM-06`), Spécifications de tuyauterie (`NORM-07`), Moteur de calculs sous pression (`NORM-08`).
  - Modèle de preuves documentaires auditables (`MASTER-02`, `NORM-09`) : Registre déterministe `NormativeEvidenceRegistry` et résolveur d'intégrité `NormativeEvidenceResolver`.
  - Gardes stricts de valeurs vérifiées (`NORM-10`) : Interdiction formelle d'élévation non justifiée d'une valeur sans preuve auditable.
  - Frontière de calcul hermétique (`NORM-11`) : `NormativeCalculationBoundary` interdisant à toute valeur non vérifiée de franchir la frontière d'un calcul de conception.
  - 12 suites de tests automatisées (413 tests unitaires, 100% PASS, 0 heuristique, fixtures synthétiques strictes sans injection illégale de normes sous copyright).
- **Palier 3A — Passerelle Robuste Croquis vers Éditeur ISO (Patch SKETCH-ISO-01)** :
  - Résolution de la race condition d'injection lors du transfert Croquis A4/A3 vers le canevas d'édition ISO.
  - Extraction modulaire du hook dédié `useIsoInjection.ts` (< 150 lignes).
  - Triple mécanisme de détection temps réel + montage initial + changement de module actif (`pdi:active-module-changed`).
  - Idempotence absolue et nettoyage immédiat du storage (`localStorage` & `sessionStorage`).
  - Validation complète par suite de tests `INJ-01` à `INJ-06` (100% PASS).

---

## 3. AVIS COMPARATIF RÉEL (ANALYSE SANS COMPLAISANCE FACE AUX STANDARDS DU MARCHÉ)

| Critère d'évaluation | AutoCAD Plant 3D / CADWorx | SmartPlant Isometrics / Spoolgen | **PD&I (ORTHOGONAL - ENG)** | Évaluation réelle / Constat objectif |
| :--- | :--- | :--- | :--- | :--- |
| **Vitesse de mise en plan isométrique** | Moyenne (dépendance d'un modèle 3D volumineux complet, génération Iso batch souvent capricieuse) | Élevée (logiciel dédié fabrication d'éprouvettes et spools) | **Très élevée (temps réel)** | PD&I permet de générer une isométrie cotée avec nomenclature en moins de 5 minutes, sans modélisation de maquette générale préalable. |
| **Légèreté & Démarrage** | Très lourd (5 à 15 Go d'empreinte disque, démarrage 45-90 secondes, prérequis machine de CAO lourde) | Lourd (suite Windows dédiée, dongle de licence HASP, serveurs Oracle/MSSQL) | **Ultra-léger (< 15 Mo)** | Démarrage instantané en navigateur ou exécutable léger. Fonctionne sur un PC de bureau ordinaire ou un PC portable de chantier. |
| **Flexibilité de modification (TRIM / EXTEND / DRAFT)** | Puissant en 2D native mais découplé du modèle Piping | Faible (édition rigide des PCF/IDF, pas de dessin libre) | **Hybride puissant** | Combinaison unique d'un graphe isométrique de tuyauterie rigide (ASME/ISO) et d'outils de DAO libres vectoriels (lignes, cotes, hachures, décalages). |
| **Gestion bi-système d'unités (SI ↔ US)** | Complexe (changement de catalogue et de gabarit de projet lourd, conversion rétroactive quasi-impossible) | Rigide (souvent fixé au niveau du fichier PCF d'entrée) | **Natif et dynamique (ISO/NIST)** | Bascule instantanée en 1 clic métrique ↔ impérial avec conversion exacte des longueurs, cotes fractionnaires, pressions et masses. |
| **Gestion des supports industriels** | Complète (catalogues standards fournis, mais insertion souvent laborieuse) | Dépendance des attributs PCF de modélisation amont | **En cours de complétion (Palier 2C)** | La bibliothèque MSS SP-58 / SP-69 et le quantitatif GC sont programmés au palier immédiat pour atteindre la parité industrielle. |
| **Extraction automatique depuis croquis chantier** | Inexistante (modélisation manuelle intégrale obligatoire) | Inexistante (nécessite fichier PCF généré numériquement) | **Module Croquis-to-ISO (Palier 3)** | Avantage concurrentiel décisif : conversion semi-automatique d'un relevé à main levée scanné en isométrie vectorielle normée. |
| **Coût & Dépendance de licence** | Très onéreux (abonnements annuels récurrents > 2500€/an/poste, gestion de licences Cloud contraignante) | Très onéreux (licences grands comptes, support lourd) | **Modèle autonome & abordable** | Zéro dépendance cloud obligatoire. Licences cryptographiques Ed25519 locales pour PME et bureaux d'études indépendants. |

---

## 4. LE RESTE DU WORKFLOW — FEUILLE DE ROUTE OPÉRATIONNELLE

```
┌────────────────────────────────────────────────────────────────────────┐
│ PALIER 2C : SUPPORTS INDUSTRIELS MSS SP-58 & GÉNIE CIVIL (PROCHAIN)    │
│ 1. Bibliothèque normalisée MSS SP-58 / SP-69 (Guides Type 35,          │
│    Pendards Type 1, Points fixes Type 57, Patins Type 39, Ressorts).   │
│ 2. Accrochage automatique sur tronçon (projection normale, repère PDI).│
│ 3. Vérification des portées maximales admissibles (ASME B31.3/B31.8).  │
│ 4. Quantitatifs Génie Civil : platines acier (kg), ancrages EN 1992-4, │
│    massifs béton (m³).                                                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PALIER 3 : ATELIER CROQUIS VERS ISO V1 (020I - SKETCH-TO-ISO)          │
│ 1. Ingestion de scan / photo de croquis chantier (PNG/JPG/PDF).        │
│ 2. Pipeline de vectorisation topologique (lignes 30°, coudes, tés).    │
│ 3. 5 jalons de contrôle opérateur (Cadrage, Squelette, OCR, Métier).   │
│ 4. Injection directe dans le graphe IsoTopologyGraph sans ressaisie.   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PALIER 4 : PACKAGING DESKTOP TAURI V2 & LICENCES ED25519 (022 - 023)   │
│ 1. Configuration Tauri v2 pour Windows (.msi/.exe), macOS et Linux.   │
│ 2. Format physique de projet unifié `.pdi` (JSON compressé chiffré).   │
│ 3. Générateur de clés de licence cryptographiques hors-ligne Ed25519.  │
│ 4. Validation finale des performances en conditions réelles.           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. RÈGLES PERMANENTES DU PROJET (R1 à R30)

- **R1** : Tout correctif/évolution est structuré, modulaire, vérifié et documenté avec explication claire.
- **R2** : Développement rigoureux TypeScript / React / Node.
- **R3** : Revue et audit architectural permanent.
- **R4** : Prompting et spécifications déterministes.
- **R5** : Une étape/palier validé à la fois : vérification et tests avant de passer au suivant.
- **R6** : Explication conceptuelle en texte clair avant toute modification majeure.
- **R7** : **Zéro API tierce pour le calcul d'ingénierie (Local-First)** : Dessin, géométrie, calculs de contraintes, nomenclature BOM, vérification de specs et génération vectorielle s'exécutent 100% sur le poste client.
- **R8** : Toute commande CAO doit être répertoriée dans le registre unifié et dispatchée.
- **R9** : Intégrité stricte des fichiers : pas d'altération destructrice.
- **R10** : 404 explicite pour les assets manquants.
- **R11** : Zéro dépendance à des CDN externes dans le chemin critique d'impression ou de calcul.
- **R12** : Échelle de z-index documentée et respectée.
- **R13** : Cascade CSS propre : feuilles de style structurelles en premier, utilitaires en dernier.
- **R14** : Syntaxe JSX saine, zéro commentaire mal placé.
- **R15** : **Zéro référence client en dur** : Données de cartouche et raison sociale proviennent de la configuration avec repli générique.
- **R16** : Normes citées par référence déterministe (ASME B31.3, B16.5, ISO 5457, ISO 7200, MSS SP-58).
- **R17** : Formats de planche déverrouillés du A5 au A0, orientations et échelles dynamiques.
- **R18** : Aucun secret, mot de passe ou clé d'API en clair dans le code source client.
- **R19** : Audit de sécurité systématique (CORS, injections, sanitization).
- **R20** : Architecture tri-cible unifiée : un seul socle logique pour Web, Desktop et Tablette.
- **R21** : Organisation ergonomique standard : Ruban par onglets fonctionnels, ligne de commande type console industrielle, barre d'accrochage.
- **R22** : Débrander sans désactiver : les fonctions calculatoires et normatives sont préservées et internationalisées.
- **R23** : Moteur Croquis indépendant dialoguant via le schéma `SchemaGraph` standardisé.
- **R24** : Précision géométrique absolue avant tout rendu. Accrochages transactionnels et coordonnées déterministes.
- **R25** : Tests systématiquement corrélés aux fichiers et lignes réelles.
- **R26** : Écriture atomique et fichiers sources non fragmentés.
- **R27** : Relecture intégrale de la balise avant toute modification d'envergure.
- **R28** : La Balise est le point de reprise unique du projet.
- **R29** : **Modularité absolue** : Découpage systématique des logiques en modules dédiés.
- **R30** : **Watermark & Protection de Propriété Intellectuelle** : Tout module, document exporté, cartouche de plan et fichier `.pdi` porte la signature contractuelle inaltérable **`ORTHOGONAL - ENG`**.

---

## 6. TABLEAU DE BORD D'AVANCEMENT GLOBAL

| Palier / Phase | Intitulé | Statut | Date de Validation |
| :--- | :--- | :--- | :--- |
| **Palier 0** | Socle, Watermark `ORTHOGONAL - ENG`, Sécurité server.ts | `[VALIDÉ]` | 02/09/2026 |
| **Palier 1** | Module d'Impression Industrielle ISO 216 (A5-A0) & ISO 7200 + Centrage | `[VALIDÉ]` | 04/09/2026 |
| **Palier 2A** | Moteur Bi-Système Métrique (SI) ↔ Impérial (US Cust) NIST | `[VALIDÉ]` | 02/09/2026 |
| **Palier 2B** | Outils 2D Transactionnels (TRIM, EXTEND, OFFSET, FILLET, SCALE, HATCH) | `[VALIDÉ]` | 03/09/2026 |
| **Palier 2C** | Supports Normalisés MSS SP-58 & Quantitatifs Génie Civil | `[VALIDÉ]` | 03/09/2026 |
| **Palier 2D** | Moteur Normatif Déterministe & Modèle d'Évidence (NORM-01 à NORM-11) | `[VALIDÉ]` | 23/09/2026 |
| **Palier 3A** | Passerelle Robuste Croquis vers ISO (useIsoInjection / Patch SKETCH-ISO-01) | `[VALIDÉ]` | 23/09/2026 |
| **Palier 3B** | Atelier Croquis vers ISO V1 (Ingestion, vectorisation, tolérances) | `[PROCHAINE ÉTAPE ACTIVE]` | *Prêt au lancement* |
| **Palier 4** | Packaging Desktop Tauri v2 & Système de Licences Ed25519 | `[PROGRAMMÉ]` | *Étape finale* |
