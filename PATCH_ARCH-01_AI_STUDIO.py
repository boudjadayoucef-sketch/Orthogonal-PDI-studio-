#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Patch prompt ARCH-01 pour Google AI Studio / agent de code.

Ce script n'exécute aucune modification GitHub.
Il affiche le prompt exact à transmettre à AI Studio.
"""

PROMPT = r'''# PATCH DIRECT — ARCH-01 — Découpage architectural de ProjectManagement.tsx
# Cible : projet PDI Vision / repo GitHub
# Base de travail : commit actuel de `main`, APRÈS application et validation du
# patch SKETCH-ISO-01 (ne pas appliquer ce patch avant SKETCH-ISO-01).
#
# IMPORTANT :
# - Ne faire AUCUN commit.
# - Ne faire AUCUN push.
# - Ne pas modifier la branche distante.
# - Après implémentation + tests : STOP.
# - Ne toucher à AUCUNE logique métier. Ce patch est un déplacement de code
#   (extraction de fichiers), pas une réécriture. Le comportement observable
#   de l'application doit être strictement identique avant/après.
# - Ne pas toucher à IsometrieModuleV48d.tsx, Calculators.tsx, ni à quoi que
#   ce soit hors de ProjectManagement.tsx et de ses nouveaux fichiers extraits
#   dans ce patch (ce sont des chantiers séparés, à traiter dans d'autres
#   patchs : ARCH-02 pour IsometrieModuleV48d.tsx, ARCH-03 pour Calculators.tsx).
#
# CONTEXTE
# Fichier concerné : src/components/ProjectManagement.tsx (13 974 lignes)
#
# Ce fichier contient :
#   - lignes 1 à 1344 : interfaces, types, constantes, fonctions utilitaires
#     pures (getProjectDisplayLength, createDefaultFicheSuivi,
#     generateKMLString, getWilayaCoordinates, computeProgressFromCanvas,
#     STATIC_PLAN_DE_CONTROLE_TASKS, etc.) — DÉJÀ largement autonomes, sans
#     dépendance au state React du composant.
#   - ligne 1345 à la fin (12 629 lignes) : un unique composant
#     `export default function ProjectManagement(...)` avec plusieurs
#     dizaines de useState et de fonctions handle*/render* internes.
#
# Ce composant s'organise déjà, dans son JSX de rendu, autour de MODULES et
# SOUS-ONGLETS clairement identifiés par des valeurs de state discriminées :
#   - activeModule: "charge" | "gestion" | "dashboard" | "report" | "bordereau"
#   - activeSubTab (à l'intérieur du module "gestion", pour un projet
#     sélectionné): "planning" | "identity" | "etude" | "expertise" |
#     "travaux" | "gaz" | "bordereau"
#
# Chaque module/onglet a déjà sa propre fonction de rendu dédiée dans le code
# actuel (ex: renderPlanDeCharge, renderTableauDeBord, renderBordereauPrixModule,
# renderRapportMensuel, renderVisualGantt, etc.) — CE SONT LES FRONTIÈRES DE
# DÉCOUPAGE À UTILISER. Ne pas inventer d'autres découpages.
#
# CONTRAINTE D'INTERFACE PUBLIQUE — À NE JAMAIS CASSER
# Le type `Project` exporté par ce fichier est importé ailleurs dans le repo :
#   - src/components/ProjectMapViewer.tsx  (import { Project } from "./ProjectManagement")
#   - src/components/ProjectAltitudeProfile.tsx  (import { Project } from "./ProjectManagement")
# Après le patch, `import { Project } from "./ProjectManagement"` DOIT
# continuer de fonctionner sans aucune modification dans ces deux fichiers
# (soit Project reste défini dans ProjectManagement.tsx et est ré-exporté,
# soit ProjectManagement.tsx importe Project depuis son nouvel emplacement et
# le ré-exporte avec `export type { Project }`).
#
# OBJECTIF
# Découper ProjectManagement.tsx en plusieurs fichiers, chacun avec une seule
# responsabilité claire, SANS changer le comportement de l'application. Il
# n'y a pas d'objectif de nombre de lignes rigide et identique pour chaque
# fichier — la taille de chaque fichier doit découler de sa responsabilité
# réelle, pas d'une découpe arbitraire par tranche de N lignes. Cible
# indicative : la plupart des fichiers extraits entre 150 et 800 lignes ;
# le composant "coquille" final qui reste dans ProjectManagement.tsx peut
# rester plus long (orchestration des useState partagés + composition JSX)
# mais doit être significativement réduit par rapport à 13 974 lignes.
#
# DÉCOUPAGE ATTENDU (structure de dossiers à créer)
#
# src/components/project-management/
#   types.ts
#     -> Interfaces et types : PlanDeControleItemStatus, FicheSuivi,
#        ContractDetails, ProjectLot, Project, PlanDeControleItem
#     -> `export type { Project }` doit rester utilisable depuis
#        "./ProjectManagement" pour compat ascendante (voir contrainte
#        d'interface publique ci-dessus)
#
#   constants.ts
#     -> DEFAULT_TRAVAUX_LIGNE, DEFAULT_TRAVAUX_POSTES,
#        STATIC_PLAN_DE_CONTROLE_TASKS
#
#   projectUtils.ts
#     -> Fonctions utilitaires pures sans dépendance React :
#        computeProgressFromCanvas, getProjectDisplayLength,
#        createDefaultFicheSuivi, getWilayaCoordinates, generateKMLString,
#        getPipelineSequence, isUserPolesMatched, isUserDirectionsMatched
#
#   hooks/useProjectsData.ts
#     -> Hook extrayant la logique de chargement des projets et profils
#        (le useState([projects, setProjects]), useState([profilesList,...]),
#        useState([loading,...]) et le useEffect de chargement associé, avec
#        les fonctions CRUD qui vont avec si elles sont clairement isolables)
#
#   hooks/useExportHandlers.ts
#     -> Toutes les fonctions handleDownloadKMZ, handlePrintPlanDeCharge,
#        handleExportPlanDeChargeWord, handleExportPlanDeChargePDF,
#        handleExportActivePanePDF, handlePrintFicheProjet,
#        handleExportFicheProjetWord, handleExportFicheProjetPDF,
#        handleExportGenesisWord, handleExportGenesisPDF, handleUploadKMZ,
#        handleDeleteKMZ. Ce sont des fonctions volumineuses et
#        interdépendantes uniquement par leur besoin d'accéder à `projects`/
#        `selectedProjectId` — les faire prendre ces valeurs en paramètres
#        explicites plutôt qu'en closure implicite, pour rester autonomes.
#
#   views/PlanDeChargeView.tsx
#     -> Le contenu de renderPlanDeCharge() et les états UI qui ne servent
#        qu'à cette vue (planDeChargeSearch, planDeChargeFilter,
#        planDeChargeAnnee, planDeChargePole, planDeChargeWilaya,
#        planDeChargeDirection, planDeChargeContrainte,
#        planDeChargeObjectif, isFullscreenPlanDeCharge,
#        planDeChargeFullscreenMode, meetingSelectedProject,
#        showFullscreenMenu, hiddenColumns, showColumnSelector)
#
#   views/TableauDeBordView.tsx
#     -> Le contenu de renderTableauDeBord()
#
#   views/BordereauPrixView.tsx
#     -> Le contenu de renderBordereauPrixModule() et les états
#        showPrintBordereauModal, bordereauActivePart,
#        bordereauSelectedProjectId, bePrices, gefPrices, travauxPrices
#
#   views/RapportMensuelView.tsx
#     -> Le contenu de renderRapportMensuel()
#
#   views/GestionProjetView.tsx
#     -> Le contenu du bloc activeModule === "gestion" (sélection de projet +
#        les sous-onglets planning/identity/etude/expertise/travaux/gaz/
#        bordereau). Si ce bloc est lui-même trop volumineux après
#        extraction (> ~1200 lignes), le découper une seconde fois par
#        sous-onglet dans un sous-dossier views/gestion/ (ex:
#        PlanningTab.tsx, IdentityTab.tsx, EtudeTab.tsx, TravauxTab.tsx,
#        GazTab.tsx) — seulement si nécessaire, ne pas sur-découper un
#        sous-onglet déjà raisonnable en taille.
#
#   ProjectManagement.tsx (fichier final, à la racine de src/components/,
#   remplace l'ancien fichier de 13 974 lignes)
#     -> Composant "coquille" : déclare les useState partagés entre plusieurs
#        vues (selectedProjectId, activeSubTab, activeModule, et tout autre
#        state réellement partagé entre plusieurs des fichiers views/
#        ci-dessus), importe les hooks et vues extraits, et compose le JSX
#        de haut niveau (la structure de navigation entre modules).
#     -> `export type { Project } from "./project-management/types"` pour la
#        compatibilité ascendante.
#     -> `export default function ProjectManagement(...)` inchangé côté
#        signature (props isAdmin, currentUser, userProfile identiques).
#
# MÉTHODE DE TRAVAIL OBLIGATOIRE
# 1. Ne PAS réécrire la logique. Couper-coller le code existant dans les
#    nouveaux fichiers, en ajustant uniquement les imports/exports et le
#    passage de props/paramètres nécessaire suite au découpage.
# 2. Si une fonction ou un state est utilisé par plusieurs des vues
#    découpées, le laisser dans le composant coquille ProjectManagement.tsx
#    et le passer en props aux sous-composants — ne pas le dupliquer.
# 3. Traiter les fichiers dans l'ordre suivant, et valider (typecheck) après
#    chaque étape avant de passer à la suivante, pour isoler tout problème :
#    a) types.ts + constants.ts + projectUtils.ts (aucune dépendance React,
#       risque le plus faible)
#    b) hooks/useProjectsData.ts
#    c) hooks/useExportHandlers.ts
#    d) views/PlanDeChargeView.tsx
#    e) views/TableauDeBordView.tsx
#    f) views/BordereauPrixView.tsx
#    g) views/RapportMensuelView.tsx
#    h) views/GestionProjetView.tsx (la plus volumineuse, traiter en dernier)
#    i) ProjectManagement.tsx final (assemblage)
#
# NON-RÉGRESSION EXPLICITE
# - src/components/ProjectMapViewer.tsx et
#   src/components/ProjectAltitudeProfile.tsx ne doivent nécessiter AUCUNE
#   modification de leur import `{ Project } from "./ProjectManagement"`.
# - Toute fonctionnalité accessible aujourd'hui (chaque module, chaque
#   sous-onglet, chaque export PDF/Word/KMZ) doit rester accessible et
#   fonctionner de façon identique après le patch.
# - Ne pas modifier le comportement du composant, uniquement son
#   organisation en fichiers.
#
# VALIDATION FINALE OBLIGATOIRE
# Exécuter et faire passer :
#   - TypeScript noEmit / typecheck sur l'ensemble du projet
#   - build production
#   - test manuel de navigation : ouvrir chaque module (charge, gestion,
#     dashboard, report, bordereau) et, dans "gestion", chaque sous-onglet
#     (planning, identity, etude, expertise, travaux, gaz, bordereau) sur un
#     projet existant, et confirmer que l'affichage est identique à avant le
#     patch
#   - vérifier que ProjectMapViewer.tsx et ProjectAltitudeProfile.tsx
#     compilent toujours sans modification
#
# Ensuite fournir uniquement un rapport de patch :
#   1. liste complète des fichiers créés, avec leur nombre de lignes final
#   2. nombre de lignes final de ProjectManagement.tsx (avant: 13974)
#   3. confirmation que Project reste importable depuis "./ProjectManagement"
#   4. résultat TypeScript
#   5. résultat build
#   6. toute vue ou sous-onglet qui n'a pas pu être extrait proprement, avec
#      la raison précise
#
# NE PAS COMMIT.
# NE PAS PUSH.
# STOP APRÈS LE RAPPORT.
'''


if __name__ == "__main__":
    print(PROMPT)
