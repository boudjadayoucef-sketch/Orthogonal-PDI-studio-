#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Patch prompt SKETCH-ISO-01 pour Google AI Studio / agent de code.

Ce script n'exécute aucune modification GitHub.
Il affiche le prompt exact à transmettre à AI Studio.
"""

PROMPT = r'''# PATCH DIRECT — SKETCH-ISO-01 — Consolidation passerelle Croquis -> Éditeur ISO
# Cible : projet PDI Vision / repo GitHub
# Base de travail : commit actuel de `main`.
#
# IMPORTANT :
# - Appliquer UNE SEULE correction cohérente.
# - Ne faire AUCUN commit.
# - Ne faire AUCUN push.
# - Ne pas modifier la branche distante.
# - Après implémentation + tests : STOP.
# - Ne toucher à aucune autre fonctionnalité (normative F01, sécurité, gestion
#   de projet). Ce patch est strictement scopé à la passerelle croquis -> ISO.
#
# CONTEXTE DU BUG
# Fichier concerné : src/pdi/isometric/engine/IsometrieModuleV48d.tsx
# Fichier concerné : src/pdi/sketch/SketchToIsoModule.tsx
#
# Symptôme : quand l'utilisateur clique sur "Valider & Ouvrir ISO" depuis le
# module croquis, l'éditeur ISO s'ouvre mais reste VIDE. Aucune erreur console.
#
# CAUSE RACINE IDENTIFIÉE
# Dans IsometrieModuleV48d.tsx, la passerelle d'injection (commentée
# "ÉTAPE 5") est un useEffect avec un tableau de dépendances vide `[]`.
# Cela signifie que le check de `localStorage.getItem("pdi.pending_iso_injection")`
# ne s'exécute qu'UNE SEULE FOIS, au tout premier montage de ce composant.
#
# Si ce composant est déjà monté en mémoire (cas probable vu l'architecture
# "workspace multi-écrans" du projet, où plusieurs modules peuvent rester
# montés en parallèle dans le même shell SaaS) au moment où
# SketchToIsoModule.tsx écrit dans le storage et dispatch l'événement
# "pdi:inject-iso-graph", alors :
#   - le listener d'événement custom (window.addEventListener) EST actif et
#     devrait fonctionner en théorie
#   - MAIS il existe une race condition : SketchToIsoModule.tsx appelle
#     `onLoadProjectToEditor(model, projectName)` (qui change la vue/le
#     module actif) PUIS dispatch immédiatement l'événement, sans laisser le
#     temps à React de démonter/remonter ou de stabiliser l'éditeur ISO.
#   - le mécanisme de fallback (check localStorage au montage) ne se
#     redéclenche jamais si le composant ISO ne se démonte/remonte pas
#     réellement lors du changement de vue (cas fréquent avec un routing
#     par état plutôt que par démontage réel de composant).
#
# OBJECTIF
# Rendre la passerelle d'injection robuste à TOUS les cas de montage/démontage
# possibles, sans dépendre d'un timing implicite entre deux composants.
#
# CORRECTION ATTENDUE
#
# 1. EXTRACTION (réduction dette technique)
#    Extraire la logique d'injection hors de IsometrieModuleV48d.tsx (fichier
#    de plus de 13 000 lignes) vers un nouveau fichier dédié :
#      src/pdi/isometric/engine/useIsoInjection.ts
#    Ce fichier doit exporter un hook `useIsoInjection({ onCommit })` qui
#    encapsule TOUTE la logique d'écoute et de consommation du payload
#    (remplace le bloc "ÉTAPE 5" actuel dans IsometrieModuleV48d.tsx par un
#    simple appel à ce hook).
#
# 2. TRIPLE MÉCANISME DE DÉTECTION (le coeur du correctif)
#    Le hook doit détecter une injection en attente via TROIS canaux
#    indépendants, pour couvrir tous les cas de cycle de vie React :
#
#    a) Événement temps réel "pdi:inject-iso-graph"
#       (comportement existant, à conserver)
#
#    b) Check au montage du composant (useEffect avec [])
#       (comportement existant, à conserver comme filet de sécurité)
#
#    c) NOUVEAU — Check déclenché quand le module ISO redevient actif dans
#       l'application, même si le composant n'a jamais été démonté. Pour
#       cela :
#       - émettre un nouvel événement custom "pdi:active-module-changed"
#         depuis le point de l'application qui gère le changement de module
#         actif (le shell SaaS / PdiUnifiedApp, ou directement depuis
#         SketchToIsoModule.tsx au moment de l'appel à
#         onLoadProjectToEditor)
#       - le hook useIsoInjection écoute ce nouvel événement et relance le
#         check du localStorage à chaque déclenchement
#       - vérifier aussi la clé localStorage "pdi.activeModule.v1" (déjà
#         utilisée dans le projet pour retenir le module actif) au moment de
#         cet événement, pour confirmer que c'est bien le module "isometric"
#         qui redevient actif avant de consommer le payload
#
# 3. CÔTÉ ÉMETTEUR (SketchToIsoModule.tsx)
#    Dans la fonction qui gère le clic "Valider & Ouvrir ISO" :
#    - écrire le payload dans localStorage ET sessionStorage AVANT tout
#      changement de vue (ordre actuel à vérifier et corriger si besoin)
#    - émettre le nouvel événement "pdi:active-module-changed" juste après
#      avoir écrit "pdi.activeModule.v1" = "isometric" dans le localStorage
#      (l'événement natif "storage" ne se déclenche pas pour les écritures
#      faites par le document courant lui-même — c'est pour cela qu'un
#      événement custom local est nécessaire en complément)
#    - retarder le dispatch de "pdi:inject-iso-graph" d'environ 100-150ms
#      après l'appel à onLoadProjectToEditor(), pour laisser le temps au
#      composant ISO de finir son rendu si un démontage/remontage réel a
#      lieu. Ce délai est un filet de sécurité supplémentaire, pas le
#      mécanisme principal (le mécanisme principal est le point 2c
#      ci-dessus qui ne dépend d'aucun timing arbitraire).
#
# 4. IDEMPOTENCE — RÈGLE ABSOLUE
#    Le payload doit être consommé et supprimé du storage (localStorage ET
#    sessionStorage) dès sa première lecture réussie, pour qu'un
#    remontage ultérieur du composant ISO (ex: navigation arrière) ne
#    réinjecte pas le même modèle une seconde fois et n'écrase pas un
#    travail en cours de l'utilisateur.
#
# 5. NON-RÉGRESSION EXPLICITE
#    - Le comportement pour l'import DXF (si une passerelle similaire existe
#      pour le DXF) NE DOIT PAS être modifié par ce patch.
#    - La fonction commitGraph() et sa signature ne doivent pas changer.
#    - Aucune donnée du moteur normatif (F01, NormativeEvidenceRegistry) ne
#      doit être touchée par ce patch — la passerelle croquis->ISO ne
#      transporte que de la géométrie brute (nodes, segments, lines,
#      dimensions, supports, cad2d), jamais de résultat de calcul normatif.
#
# TESTS À AJOUTER
# Créer ou compléter un fichier de tests pour useIsoInjection.ts couvrant :
#   INJ-01 : payload en attente au montage initial -> consommé correctement
#   INJ-02 : payload arrivant via événement "pdi:inject-iso-graph" pendant
#            que le composant est déjà monté -> consommé correctement
#   INJ-03 : payload en attente + événement "pdi:active-module-changed"
#            déclenché APRÈS le montage initial (composant jamais démonté)
#            -> consommé correctement (c'est le scénario exact du bug)
#   INJ-04 : payload vide ou nodes.length === 0 -> aucune consommation,
#            aucune erreur
#   INJ-05 : payload déjà consommé une fois -> un second déclenchement de
#            "pdi:active-module-changed" ne doit PAS réinjecter le même
#            modèle (test d'idempotence)
#   INJ-06 : "pdi:active-module-changed" déclenché avec
#            "pdi.activeModule.v1" != "isometric" -> aucune consommation
#
# VALIDATION FINALE OBLIGATOIRE
# Exécuter et faire passer :
#   - npm / pnpm / yarn test selon le projet (tests INJ-01 à INJ-06 inclus)
#   - TypeScript noEmit / typecheck
#   - build production
#   - test manuel : depuis le module croquis, créer un tracé simple, cliquer
#     "Valider & Ouvrir ISO", confirmer que l'isométrie s'affiche
#     immédiatement dans l'éditeur ISO sans rechargement de page nécessaire
#
# Ensuite fournir uniquement un rapport de patch :
#   1. fichiers réellement modifiés/créés
#   2. résumé précis de la correction (les 3 canaux de détection)
#   3. nombre exact de tests exécutés et réussis (INJ-01 à INJ-06)
#   4. résultat TypeScript
#   5. résultat build
#   6. confirmation explicite que F01/normative et l'import DXF n'ont pas
#      été touchés
#
# NE PAS COMMIT.
# NE PAS PUSH.
# STOP APRÈS LE RAPPORT.
'''


if __name__ == "__main__":
    print(PROMPT)
