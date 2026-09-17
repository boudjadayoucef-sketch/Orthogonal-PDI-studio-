#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Patch prompt NORM-08-F01 pour Google AI Studio / agent de code.

Ce script n'exécute aucune modification GitHub.
Il affiche le prompt exact à transmettre à AI Studio.
"""

PROMPT = r'''# PATCH DIRECT — NORM-08-F01 — ASME B31.3-2024
# Cible : projet PDI Vision / repo GitHub
# Base de travail : commit actuel de `main`.
# Le dernier commit connu `58e21ab4a6e6f83ca15912f978c6b7527fa16d6c`
# contient surtout l'intégration du dashboard normatif ; ne pas traiter cette
# intégration UI comme une preuve de correction de F01.
#
# IMPORTANT :
# - Appliquer UNE SEULE correction cohérente.
# - Ne faire AUCUN commit.
# - Ne faire AUCUN push.
# - Ne pas modifier la branche distante.
# - Après implémentation + tests : STOP.
# - Ne toucher à aucune autre fonctionnalité normative.
#
# OBJECTIF
# Finaliser la correction de NORM-08-F01 :
# ASME B31.3-2024 — Internal Pressure Wall Thickness
# Clause 304.1.2(a), Eq. (3a)/(3b), avec séparation stricte :
# Contract Verified != Value Verified.
#
# FORMULES QUALIFIÉES
#
# Eq. (3a), diamètre extérieur D :
#     t = P D / [2(SEW + P Y)]
#
# Eq. (3b), diamètre intérieur d :
#     t = P(d + 2c) / [2(SEW - P(1-Y))]
#
# Epaisseur mécanique :
#     tm = t + c
#
# Avec :
# P = internal design gage pressure
# D = outside diameter
# d = inside diameter
# c = mechanical + corrosion + erosion allowances
# S = basic allowable stress
# E = weld/casting quality factor
# W = weld joint strength reduction factor
# Y = coefficient de la Table 304.1.1-1
#
# DOMAINE
# - F01 est limité à Eq. (3a)/(3b).
# - Ne jamais substituer une autre formule si le domaine n’est pas respecté.
# - Si t >= D/6 ou si P/(SE) > 0.385 :
#     status = OUT_OF_SCOPE
#     warning/error explicite = SPECIAL_CONSIDERATION_REQUIRED
# - Ne pas transformer ce cas en CALCULATED.
#
# DIAMETER BASIS
# - OUTSIDE  -> Eq. (3a)
# - INSIDE   -> Eq. (3b)
# - les deux diamètres fournis sans basis explicite :
#     INVALID_INPUT / DIAMETER_BASIS_REQUIRED
# - aucun diamètre exploitable :
#     INVALID_INPUT / PIPE_DIMENSION_REFERENCE_REQUIRED
#
# UNITÉS — RÈGLE ABSOLUE
# Le contrat F01 qualifié est SI uniquement :
#   pressure = MPa
#   diameter = mm
#   thickness = mm
#   temperature = °C
#   stress = MPa
#   output = mm
#
# Donc :
# - SI = seul système pouvant produire CALCULATED.
# - US_CUSTOMARY ne doit PAS être implicitement converti.
# - aucune conversion cachée.
# - US_CUSTOMARY pour F01 => résultat non calculé,
#   idéalement UNVERIFIED avec erreur explicite de contrat d’unités.
# - ne pas ajouter une pseudo-qualification US sans source/contrat distinct.
#
# CORRECTION CRITIQUE 1 — SUPPRIMER LES FALLBACKS W
# Dans `designCodeEngine.ts`, éliminer toute logique de type :
#   componentType === "SEAMLESS" -> W = 1.0
# ou :
#   materialFamily === "FERRITIC" && temperature <= ... -> W = 1.0
#
# Ces fallbacks sont interdits car ils peuvent produire VALUE VERIFIED avec
# un contexte insuffisant.
#
# W doit être VALUE VERIFIED uniquement si une branche qualifiée est
# explicitement identifiable avec son contexte et sa provenance.
#
# Branches F01 déterministiquement qualifiées selon le rapport de qualification :
#   W-01
#   W-02
#   W-03
#   W-04
#   W-06
#
# Branches conditionnelles :
#   W-05
#   W-07
# Ces branches ne peuvent être utilisées que si le contexte/grille d’entrée
# explicitement qualifié est présent.
#
# Branches exclues/non qualifiées dans F01 :
#   W-08 = CSEF
#   W-09 = autres matériaux creep non listés
#
# Pour toute situation où W ne peut pas être résolu de façon déterministe
# avec contexte + provenance :
#   ne pas inventer W,
#   ne pas utiliser 1.0,
#   ne pas utiliser une valeur par défaut,
#   retourner UNVERIFIED / INVALID_INPUT selon le cas.
#
# CORRECTION CRITIQUE 2 — SUPPRIMER LES FALLBACKS Y
# Interdire les règles génériques du type :
#   ferritic <= 482 °C -> Y = 0.4
#   austenitic <= 566 °C -> Y = 0.4
# et toute variante équivalente.
#
# Y doit être résolu à partir d’un contexte explicitement qualifié :
#   material family
#   temperature
#   règle/branche qualifiée
#   sourceReference
#
# Pas de valeur universelle par défaut.
# Pas d’extrapolation.
# Pas d’interpolation hors domaine qualifié.
# Si le contexte qualifié est absent :
#   UNVERIFIED / INVALID_INPUT selon le contrat.
#
# CORRECTION CRITIQUE 3 — S (ALLOWABLE STRESS)
# Pour qu’un allowable stress soit VALUE VERIFIED, exiger simultanément,
# dans les limites du modèle réellement présent dans le repo :
#   - valeur numérique finie et positive
#   - materialReference ou materialId
#   - temperature
#   - unit cohérente avec le contrat F01
#   - sourceReference non vide
#   - qualificationStatus explicite et accepté
#
# IMPORTANT :
# - Une simple valeur numérique + source ne suffit pas.
# - Le dataset A-1/A-1C embarqué ne doit pas être présenté comme VERIFIED
#   s’il n’est pas qualifié comme source de valeurs utilisables.
# - Ne pas ajouter de table normative complète au code.
# - Les valeurs certifiées restent traçables par leur provenance.
#
# CORRECTION CRITIQUE 4 — E (QUALITY FACTOR)
# E doit être VALUE VERIFIED seulement si :
#   - factorValue valide
#   - sourceReference non vide
#   - contexte de qualification suffisant pour la branche concernée
#
# Une valeur brute isolée ne suffit pas si le contexte requis est absent.
#
# CORRECTION CRITIQUE 5 — CONTRAT DE VALIDATION
# Vérifier `validateCompleteEngineeringCalculationInput`.
#
# Le validateur ne doit pas exiger uniquement les anciens champs bruts
# `weldJointFactor` / `allowableStressMpa` si F01 utilise maintenant les
# entrées qualifiées avec métadonnées/provenance.
#
# Il faut accepter les entrées F01 qualifiées correspondant au modèle actuel,
# tout en conservant la stricte validation sémantique.
#
# Ne pas rendre les facteurs optionnels de façon permissive.
# Au contraire, un facteur absent ou non qualifié doit bloquer CALCULATED.
#
# CORRECTION CRITIQUE 6 — STATUT FINAL
# Le moteur ne doit retourner CALCULATED que si :
#   - tous les inputs numériques utilisés sont valides
#   - le système d’unités est compatible avec F01
#   - diameterBasis est explicite
#   - P, diamètre et c sont valides
#   - S est VALUE VERIFIED
#   - E est VALUE VERIFIED
#   - W est VALUE VERIFIED
#   - Y est VALUE VERIFIED
#   - aucune branche normative non qualifiée n’a été utilisée
#   - le domaine de l’équation est respecté
#   - denominator > 0 et fini
#   - résultat fini et positif
#
# Sinon :
#   UNVERIFIED, INVALID_INPUT ou OUT_OF_SCOPE selon la cause.
#
# TRACEABILITÉ
# Chaque résultat F01 doit conserver, via la structure existante ou une
# extension minimale strictement nécessaire :
#   designCodeId
#   standardEdition = 2024
#   formulaId
#   clauseReference = 304.1.2(a)
#   sourceReference
#   diameterBasis
#   inputs
#   resolvedFactors
#   status
#   unit
#   warnings/errors
#
# Ne pas faire de refactor global.
#
# FICHIERS À MODIFIER
# Scope prioritaire strict :
#   1. src/pdi/normative/types/designCodeTypes.ts
#   2. src/pdi/normative/registry/designCodeRegistry.ts
#   3. src/pdi/normative/validators/designCodeValidator.ts
#   4. src/pdi/normative/engine/designCodeEngine.ts
#   5. src/pdi/normative/tests/designCodeTests.ts
#
# UI :
# - Aucune évolution UI.
# - `src/pdi/modals/PdiInfoModals.tsx` ne doit PAS être modifié pour ajouter
#   des métriques/dashboards.
# - Les modifications UI introduites par les commits F01 précédents doivent
#   être retirées seulement si nécessaire afin de revenir à l’état pré-F01.
# - Ne rien changer d’autre dans l’UI.
#
# IMPORTANT SUR LE DERNIER COMMIT UI
# Le commit `58e21ab4a6e6f83ca15912f978c6b7527fa16d6c` a ajouté principalement
# l’intégration du dashboard normatif dans `PdiInfoModals.tsx`.
# Cette modification ne constitue pas la correction F01 demandée.
# Si elle fait partie de l’état de travail courant, la neutraliser/revenir à
# l’état pré-F01 de ce fichier uniquement, sans conserver de logique UI de
# dashboard pour justifier la qualification F01.
#
# TESTS — OBLIGATOIRES
# Ajouter de vrais tests F01 dédiés dans `designCodeTests.ts`.
#
# Couvrir au minimum :
# F01-01  : identification du code + édition 2024
# F01-02  : formulaId exact
# F01-03  : clause 304.1.2(a)
# F01-04  : Eq. 3a OUTSIDE
# F01-05  : Eq. 3b INSIDE
# F01-06  : deux diamètres + absence de basis
# F01-07  : aucun diamètre exploitable
# F01-08  : SI accepté
# F01-09  : US_CUSTOMARY bloqué pour F01
# F01-10  : pression invalide
# F01-11  : diamètre invalide
# F01-12  : corrosion allowance négative
# F01-13  : S absent
# F01-14  : S numérique mais sans provenance
# F01-15  : S sans température
# F01-16  : S avec mauvaise unité
# F01-17  : S VALUE VERIFIED correctement qualifié
# F01-18  : E absent
# F01-19  : E numérique sans source
# F01-20  : E correctement qualifié
# F01-21  : W absent
# F01-22  : W = 1 par fallback SEAMLESS => doit être refusé
# F01-23  : W = 1 par fallback FERRITIC/temp => doit être refusé
# F01-24  : W-01 explicitement qualifié
# F01-25  : W-02 explicitement qualifié
# F01-26  : W-03 explicitement qualifié
# F01-27  : W-04 explicitement qualifié
# F01-28  : W-06 explicitement qualifié
# F01-29  : W-05 sans contexte => non calculé
# F01-30  : W-07 sans contexte => non calculé
# F01-31  : W-08 CSEF => non calculé
# F01-32  : W-09 => non calculé
# F01-33  : Y absent
# F01-34  : Y=0.4 sans contexte => refusé
# F01-35  : Y qualifié avec materialFamily + temperature + source
# F01-36  : pas d’extrapolation Y
# F01-37  : pas d’interpolation Y hors domaine
# F01-38  : denominator <= 0
# F01-39  : résultat non fini
# F01-40  : t positif et fini sur cas qualifié
# F01-41  : tm = t + c
# F01-42  : domaine t >= D/6
# F01-43  : stress ratio > 0.385
# F01-44  : SPECIAL_CONSIDERATION_REQUIRED
# F01-45  : séparation Contract Verified / Value Verified
# F01-46  : seul un résultat entièrement qualifié peut être CALCULATED
# F01-47  : provenance propagée dans resolvedFactors
# F01-48  : édition 2024 propagée
# F01-49  : unité mm propagée pour résultat SI
# F01-50  : absence de conversion US implicite
# F01-51  : corrosion allowance effectivement ajoutée à tm
# F01-52  : Eq3a avec valeurs simples auditables
# F01-53  : Eq3b avec valeurs simples auditables
# F01-54  : erreur si diamètre sélectionné impossible
# F01-55  : pas de valeur normative implicite
# F01-56  : pas de fallback W
# F01-57  : pas de fallback Y
# F01-58  : provenance S suffisante
# F01-59  : provenance E suffisante
# F01-60  : provenance W suffisante
# F01-61  : provenance Y suffisante
# F01-62  : non-régression des autres design codes / statuts
#
# Adapter les noms/types aux structures réellement présentes dans le repo.
# Ne pas inventer de nouvelles APIs si une structure existante suffit.
#
# RÈGLE SPÉCIALE SUR LES ANCIENS TESTS
# Les tests historiques qui supposaient que B31.3 était NOT_IMPLEMENTED avant
# F01 peuvent désormais devoir être ajustés.
#
# Ne pas affaiblir F01 pour conserver artificiellement un ancien test.
# Corriger le test afin qu’il vérifie le nouveau contrat F01 exact.
#
# VALIDATION FINALE OBLIGATOIRE
# Exécuter et faire passer :
#   - npm / pnpm / yarn test selon le projet
#   - les tests normatifs dédiés
#   - TypeScript noEmit / typecheck
#   - build production
#
# Ensuite fournir uniquement un rapport de patch :
#   1. fichiers réellement modifiés
#   2. résumé précis des corrections F01
#   3. nombre exact de tests exécutés et réussis
#   4. résultat TypeScript
#   5. résultat build
#   6. éventuels points restant OUT_OF_SCOPE / UNVERIFIED
#
# NE PAS COMMIT.
# NE PAS PUSH.
# STOP APRÈS LE RAPPORT.
'''


if __name__ == "__main__":
    print(PROMPT)
