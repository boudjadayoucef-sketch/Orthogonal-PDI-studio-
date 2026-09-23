# BALISE WORKFLOW PD&I V2.7 — INDUSTRIALISATION & ÉVOLUTION LOGICIELLE

*Mise à jour officielle du **23 septembre 2026** · Éditeur : **ORTHOGONAL - ENG** · Direction Technique : **Youcef Seif Eddine Boudjada***  
*Document de référence unique de reprise et de gouvernance technique (Règles R1 à R30)*

---

## 1. DÉCISION STRATÉGIQUE MAJEURE (R20 & R30)

1. **Passage au statut de Logiciel Industriel Commercial Autonome** :
   PD&I n'est plus un prototype ou un outil interne. C'est un logiciel technique générique, conforme aux standards internationaux (ASME, ISO, EN, MSS, Eurocodes), distribué sous licence professionnelle.
2. **Propriété Intellectuelle & Signature Technique Inaltérable (R30)** :
   L'ensemble du moteur, des algorithmes de calcul, des bibliothèques normatives et des interfaces est la propriété exclusive de **ORTHOGONAL - ENG**. Un watermark logiciel et contractuel est intégré à la source, dans les modèles JSON exportés, dans les métadonnées et sur les cartouches de planches ISO 7200.
3. **Architecture Tri-Cible Unifiée (R20)** :
   - **SaaS Web** : Navigateur web, calculs 100% locaux, cloud pour la synchronisation de projets.
   - **Desktop Autonome** : Tauri v2 (~10 Mo), zéro connexion requise, fichiers projets `.pdi` physiques sur disque.
   - **Android** : Consultation, métrés de chantier et acquisition de croquis terrain.

---

## 2. FEUILLE DE ROUTE OPÉRATIONNELLE PAR PALIERS

```
┌────────────────────────────────────────────────────────────────────────┐
│ PALIER 0 : NETTOYAGE ARCHITECTURAL, WATERMARK & SÉCURITÉ (EN COURS)    │
│ - Watermark officiel "ORTHOGONAL - ENG" dans les sources et exports    │
│ - Sécurisation absolue de server.ts (requireAuth, CSP, rate-limit)     │
│ - Découpage modulaire du monolithe IsometrieModuleV48d (< 400 lignes)  │
│ - Isolation du noyau topologique pur (IsoTopologyGraph.ts sans JSX)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PALIER 1 : MODULE D'IMPRESSION PROFESSIONNEL A5 - A0 (020F)            │
│ - 020F1 : Formats ISO 216 (A5 à A0), portrait/paysage, échelles, marges│
│ - 020F2 : Cartouche ISO 7200 et Légende adaptative (composants réels)  │
│ - 020F3 : Boîte de dialogue, prévisualisation, export vectoriel A0     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PALIER 2 : GÉOMÉTRIE 2D, SUPPORTS MSS SP-58 & UNITÉS (019U/B/S)        │
│ - 019U : Moteur Universel Bi-Système Métrique (SI) ↔ Impérial (US Cust) │
│ - 019B : Câblage des commandes 2D (TRIM, EXTEND, OFFSET, FILLET...)    │
│ - 019S : Supports normalisés MSS SP-58/69 et quantitatifs génie civil  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PALIER 3 : ATELIER CROQUIS VERS ISO V1 (020I - SKETCH-TO-ISO)          │
│ - Intégration en mode acquisition de données (Variante B : relecture)  │
│ - 5 jalons de contrôle (Cadrage, Traits, Textes/OCR, Topologie, Métier)│
│ - Sortie directe en objet IsoProjectFileV474 sans duplication          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PALIER 4 : PACKAGING DESKTOP & LICENCES SANS SERVEUR (022 - 023)       │
│ - Packaging desktop Tauri v2 sous Windows (.msi/.exe), Linux et Mac    │
│ - Fichiers de projets physiques .pdi                                   │
│ - Système de licences cryptographiques hors-ligne Ed25519             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. RÈGLES PERMANENTES DU PROJET (R1 à R30)

- **R1** : Tout correctif/évolution est structuré, modulaire, vérifié et documenté avec explication claire.
- **R2** : Développement rigoureux TypeScript / React / Node.
- **R3** : Revue et audit architectural permanent.
- **R4** : Prompting et spécifications déterministes.
- **R5** : Une étape/palier validé à la fois : vérification et tests avant de passer au suivant.
- **R6** : Explication conceptuelle en texte clair avant toute modification majeure.
- **R7** : **Zéro API tierce pour le calcul d'ingénierie (Local-First)** : Dessin, géométrie, calculs de contraintes, nomenclature BOM, vérification de specs et génération vectorielle s'exécutent 100% sur le poste de l'utilisateur. Le serveur ne gère que les comptes, la persistance optionnelle et les licences.
- **R7b** : `server.ts` est conservé pour le backend SaaS et la communication sécurisée.
- **R8** : Toute commande CAO doit être répertoriée dans le registre unifié et dispatchée.
- **R9** : Intégrité stricte des fichiers : pas d'altération destructrice.
- **R10** : 404 explicite pour les assets manquants.
- **R11** : Zéro dépendance à des CDN externes dans le chemin critique d'impression ou de calcul.
- **R12** : Échelle de z-index documentée et respectée.
- **R13** : Cascade CSS propre : feuilles de style structurelles en premier, utilitaires en dernier.
- **R14** : Syntaxe JSX saine, zéro commentaire mal placé.
- **R15** : **Zéro référence client en dur** : Données de cartouche, raison sociale et logos proviennent de `pdiBranding` ou du profil utilisateur, avec repli générique.
- **R16** : Normes citées par référence déterministe (ASME B31.3, B16.5, ISO 5457, ISO 7200), jamais de recopies illégales de textes protégés.
- **R17** : Formats de planche déverrouillés du A5 au A0, orientations et échelles dynamiques.
- **R18** : Aucun secret, mot de passe ou clé d'API en clair dans le code source client.
- **R19** : Audit de sécurité systématique (CORS, injections, sanitization, validation des routes API).
- **R20** : Architecture tri-cible unifiée : un seul socle logique pour Web, Desktop et Android.
- **R21** : Organisation ergonomique standard : Ruban 9 onglets (64 px), ligne de commande en bas, barre de statut d'accrochage, navigation claire.
- **R22** : Débrander sans désactiver : les fonctions calculatoires et normatives sont préservées et internationalisées.
- **R23** : Moteur Croquis (Python/OpenCV) indépendant, dialoguant via le schéma `SchemaGraph` standardisé.
- **R24** : Précision géométrique absolue avant tout rendu 3D. Accrochages transactionnels et coordonnées déterministes.
- **R25** : Tests systématiquement corrélés aux fichiers et lignes réelles.
- **R26** : Écriture atomique et fichiers sources non fragmentés.
- **R27** : Relecture intégrale de la balise avant toute modification d'envergure.
- **R28** : La Balise est le point de reprise unique du projet.
- **R29** : **Modularité absolue** : Interdiction formelle de surcharger des fichiers au-delà de 400-500 lignes. Toute sous-fonction est scindée en modules dédiés.
- **R30 [NOUVEAU]** : **Watermark & Protection de Propriété Intellectuelle** : Tout module, document exporté, cartouche de plan et fichier `.pdi` doit porter la signature contractuelle inaltérable **`ORTHOGONAL - ENG`**.

---

## 4. RÉFÉRENTIEL TECHNIQUE ET NORMATIF

| Domaine | Référentiel International |
| :--- | :--- |
| Tuyauteries industrielles | ASME B31.3 (Procédés), B31.8 (Transport gaz), EN 13480, ISO 14692 |
| Composants & Brides | ASME B16.5 (Brides Class 150 à 2500), B16.9 (Raccords BW), B16.11 (SW/NPT), B36.10M / B36.19M |
| Unités et Mesures | ISO 80000-1 / ISO 80000-3 (Grandeurs & Unités SI), NIST SP 811, IEEE/ASTM SI 10 (US Customary) |
| Représentation Isométrique | ISO 6412-1 / 6412-2, ISO 128, ISO 129-1 (Cotation) |
| Formats et Cartouches | ISO 216 (A5-A0), ISO 5457 (Mise en page des dessins), ISO 7200 (Champs du cartouche) |
| Carnet de Soudage | ISO 2553 (Symboles de soudure), ISO 5817, ASME Section IX |
| Supports de tuyauterie | MSS SP-58, MSS SP-69, MSS SP-89, NORSOK L-002 |
| Génie Civil & Charpente | Eurocode 2 (Béton), Eurocode 3 (Acier), EN 1992-4 (Ancrages), AISC 360 |

---

## 5. SUIVI DE L'ÉTAT D'AVANCEMENT

| Palier / Module | Statut | Date | Validation |
| :--- | :--- | :--- | :--- |
| **Balise V2.0 & Cadrage** | `[OK - VALIDÉ]` | 02/09/2026 | Accord Direction Technique |
| **Palier 0 : Watermark & Sécurité server.ts** | `[OK - VALIDÉ]` | 02/09/2026 | Headers nosniff/X-Engine, signatures, exports signés |
| **Palier 0 : Découpage Modulaire (Topologie & UI)** | `[OK - VALIDÉ]` | 02/09/2026 | IsoTopologyGraph, IsoRibbonBar, IsoCommandDock, isoGraphTypes |
| **Palier 1 : Impression Pro A5-A0 (020F)** | `[OK - VALIDÉ]` | 04/09/2026 | Formats ISO 216 (A5-A0), ISO 7200, ISO 5457, Légende adaptative, Export SVG |
| **Palier 2A : Moteur d'Unités Bi-Système (019U)** | `[OK - VALIDÉ]` | 02/09/2026 | Moteur NIST SP 811, Commutateur SI ↔ US, Cotations fractionnaires ft-in, BOM, Cartouche, Persistance .pdi |
| **Palier 2B : Outils 2D Transactionnels (019B)** | `[OK - VALIDÉ]` | 03/09/2026 | TRIM, EXTEND, OFFSET, FILLET, SCALE, HATCH, Primitives libres |
| **Palier 2C : Supports MSS SP-58 & GC (019S)** | `[OK - VALIDÉ]` | 03/09/2026 | Guides, pendards, points fixes, patins, quantitatifs béton/acier |
| **Palier 2D : Moteur Normatif Déterministe (NORM-01 à NORM-11)** | `[OK - VALIDÉ]` | 23/09/2026 | Evidence Model, Evidence Registry/Resolver, Verified Values, Calculation Boundary |
| **Palier 3A : Passerelle Croquis vers ISO (SKETCH-ISO-01)** | `[OK - VALIDÉ]` | 23/09/2026 | useIsoInjection, Triple détection, Idempotence, tests INJ-01 à INJ-06 |
| **Palier 3B : Croquis vers ISO V1 (020I)** | `[PROGRAMMÉ]` | - | Pipeline ingestion OpenCV & tolérances métier |
| **Palier 4 : Desktop Tauri & Licences Ed25519** | `[PROGRAMMÉ]` | - | Prévu Palier 4 |

---

## 6. PROTOCOLE DE VALIDATION PAR TESTS SYSTÉMATIQUES

Chaque palier fait l'objet d'un protocole d'essais strict devant être exécuté et vérifié avant tout passage au palier suivant.

### 📋 Tests du Palier 0 (Sécurité, Watermark & Modularité)
- [x] **Test 0.1 - Signature d'intégrité** : Vérifier que l'empreinte `ORTHOGONAL - ENG` est présente dans `src/pdi/core/pdiWatermark.ts`.
- [x] **Test 0.2 - Headers HTTP sécurisés** : Requête sur `/api/health` confirmant la présence des en-têtes `X-Engine-Vendor`, `X-Content-Type-Options: nosniff` et l'absence de `x-powered-by`.
- [x] **Test 0.3 - Export certifié** : Télécharger un fichier projet `.pdi` et vérifier qu'il contient la clé `_watermark` signée par `ORTHOGONAL - ENG`.
- [x] **Test 0.4 - Compilation découplée** : Vérifier que `IsoTopologyGraph.ts` s'exécute sans aucune dépendance DOM/JSX.

### 📋 Tests du Palier 1 (Impression Professionnelle A5 à A0 - Patch 020F)
- [x] **Test 1.1 - Déclenchement du dialogue** : Clic sur "Imprimer" (ou touche raccourci clavier `P` ou ruban) ouvre la modale d'impression `IsoPrintModal`.
- [x] **Test 1.2 - Sélecteur de formats ISO 216** : Commutation instantanée entre A5, A4, A3, A2, A1, A0. Vérifier la mise à jour des dimensions en mm (ex: A3 = 420x297 mm, A0 = 1189x841 mm).
- [x] **Test 1.3 - Orientation Paysage / Portrait** : Basculement de l'orientation avec adaptation dynamique du ratio d'aspect.
- [x] **Test 1.4 - Échelles normalisées** : Test des échelles 1:1, 1:20, 1:50, 1:100 et "Ajuster à la feuille (NTS)".
- [x] **Test 1.5 - Cartouche ISO 7200** : Présence du bloc technique 180x55mm, titre, révision, dessinateur, vérificateur, pressions service/épreuve et marque `ORTHOGONAL - ENG`.
- [x] **Test 1.6 - Légende adaptative** : Vérifier que seuls les éléments présents dans le tracé (tubes réels, vannes, coudes, soudures) apparaissent dans la légende technique.
- [x] **Test 1.7 - Cadre & Quadrillage ISO 5457** : Marge de reliure 20mm, repères de centrage triangulaires et coordonnées A..D / 1..6.
- [x] **Test 1.8 - Export vectoriel SVG direct** : Clic sur "Exporter SVG Vectoriel", téléchargement du fichier SVG vectoriel pur à l'échelle.
- [x] **Test 1.9 - Impression / PDF Navigateur** : Clic sur "Imprimer / Exporter PDF", ouverture propre avec CSS `@page { size: ... }` sans dépendance réseau externe.

### 📋 Tests du Palier 2A (Moteur d'Unités Bi-Système Métrique ↔ Impérial - Patch 019U)
- [x] **Test 2A.1 - Sélecteur global d'unités** : Bascule immédiate entre système Métrique (m, mm, bar, kg, °C) et Impérial / US Customary (ft-in, in, psi, lbs, °F).
- [x] **Test 2A.2 - Cotations en pieds-pouces fractionnaires** : Formatage automatique des cotes au format architectural ASME (ex: `12'-4 3/8"`, `0'-9 1/2"` ou pouces décimaux `148.37 in`).
- [x] **Test 2A.3 - Conversion des pressions** : Conversion déterministe bar ↔ psi (1 bar = 14.5038 psi) sur la pression de service et d'épreuve hydrostatique.
- [x] **Test 2A.4 - Conversion des masses** : Poids total tuyauterie et composants calculé en kilogrammes ou en livres (1 kg = 2.20462 lbs).
- [x] **Test 2A.5 - Nomenclature matérielle (BOM)** : Tableau de nomenclature avec longueurs et unités adaptées (m ou ft-in / tronçon / u).
- [x] **Test 2A.6 - Cartouche et impression** : Les valeurs de cartouche et de légende reflètent le système d'unités actif avec indication explicite de l'unité.

### 📋 Tests du Palier 2B (Outils 2D CAD Transactionnels - Patch 019B)
- [x] **Test 2B.1 - Commande TRIM (Ajuster)** : Découpe d'un segment de tuyauterie ou ligne 2D à l'intersection avec une frontière de coupe.
- [x] **Test 2B.2 - Commande EXTEND (Prolonger)** : Prolongation d'un élément jusqu'à une arête de référence.
- [x] **Test 2B.3 - Commande OFFSET (Décaler)** : Création d'une parallèle équidistante à une distance spécifiée en mm ou pouces.
- [x] **Test 2B.4 - Primitives libres & hachures** : Dessin de lignes, polylignes, rectangles, cercles et textes d'annotation MTEXT.

### 📋 Tests du Palier 2C (Supports Industriels MSS SP-58 & Génie Civil - Patch 019S)
- [x] **Test 2C.1 - Bibliothèque normalisée MSS SP-58** : Insertion de supports types (Guide Type 35, Pendard Type 1, Point fixe Type 57, Patin Type 39, Ressort Type 51).
- [x] **Test 2C.2 - Accrochage automatique sur tube** : Détection du segment porteur, orientation normale et calcul de la coordonnée kilométrique du support.
- [x] **Test 2C.3 - Calcul de charge admissible** : Vérification des portées maximales recommandées selon ASME B31.3 / B31.8 pour chaque diamètre nominal.
- [x] **Test 2C.4 - Quantitatifs Génie Civil** : Métrés de platines acier (kg), tiges d'ancrage (unités) et volumes de massifs béton (m3).

### 📋 Tests du Palier 2D (Moteur Normatif & Modèle d'Évidence - NORM-01 à NORM-11)
- [x] **Test 2D.1 - Intégrité de la chaîne** : `IDENTIFICATION → QUALIFICATION → EVIDENCE → VERIFIED VALUE → CALCULATION BOUNDARY`.
- [x] **Test 2D.2 - Moteur de composants & calculs sous pression** : Validation des 8 modules analytiques (413 tests, 100% PASS).
- [x] **Test 2D.3 - Registre & Résolveur d'Évidence** : `NormativeEvidenceRegistry` déterministe et `NormativeEvidenceResolver`.
- [x] **Test 2D.4 - Gardes stricts de valeurs vérifiées** : Rejet de toute élévation de statut sans preuve auditable.
- [x] **Test 2D.5 - Frontière de calcul** : `NormativeCalculationBoundary` hermétique, interdiction d'injection de valeurs non vérifiées.

### 📋 Tests du Palier 3A (Passerelle Croquis vers ISO - Patch SKETCH-ISO-01)
- [x] **Test 3A.1 - useIsoInjection & Idempotence** : Consommation unique, suppression immédiate du storage (`INJ-01` à `INJ-06`).
- [x] **Test 3A.2 - Triple canal de détection** : Événement direct + montage initial + bascule de module actif sans démontage.

### 📋 Tests du Palier 3B (Croquis vers ISO V1 - OpenCV / Patch 020I)
- [ ] **Test 3B.1 - Ingestion d'image de croquis** : Import PNG/JPG d'un croquis tracé à main levée ou scanné.
- [ ] **Test 3B.2 - Vectorisation du squelette** : Détection des lignes isométriques à 30°, des nœuds et des embranchements.
- [ ] **Test 3B.3 - Génération du graphe SchemaGraph** : Conversion déterministe vers la structure `IsoNode[]` et `IsoSegment[]`.

### 📋 Tests du Palier 4 (Packaging Desktop & Licence Ed25519 - Patchs 020K & 020L)
- [ ] **Test 4.1 - Compilation Desktop** : Exécution de l'application hors ligne complète.
- [ ] **Test 4.2 - Contrôle de licence Ed25519** : Vérification cryptographique de la clé de licence sans appel serveur tiers.

