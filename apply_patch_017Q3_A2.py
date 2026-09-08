#!/usr/bin/env python3
"""
PD&I — PATCH 017Q3-A2
Firestore Sensitive Collections Lockdown

Précondition :
- PATCH 017Q3-A1 doit avoir été appliqué :
    allow read, write: if request.auth != null;

Objectif :
- Conserver l'accès des utilisateurs authentifiés aux collections non sensibles.
- Cloisonner les collections sensibles par rôle / propriétaire.
- Empêcher un utilisateur standard de lire/modifier :
    auth_credentials
    license_keys
    system_config
    payment_transactions
- Cloisonner :
    profiles
    connection_logs
    user_feedbacks
    subscriber_usage
- Refuser commercial_visits côté client après la suppression de l'accès anonyme.

ATTENTION :
Cette règle suppose que Firebase Authentication est la source d'identité
(request.auth.uid / request.auth.token.email). Le dépôt contient encore un
flux d'authentification maison basé sur Firestore; celui-ci devra être migré
dans un patch séparé avant la mise en production SaaS.

Usage:
    python apply_patch_017Q3_A2.py /chemin/vers/pd-i-vis-dz

Le script:
1. Vérifie que firestore.rules correspond exactement à la baseline A1 attendue.
2. Crée firestore.rules.bak_017Q3_A2.
3. Remplace le bloc catch-all A1 par des règles cloisonnées.
4. Vérifie le résultat et n'écrit que firestore.rules.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

EXPECTED_BLOCK = """    // Baseline de sécurité :
    // aucune lecture/écriture anonyme.
    // Le cloisonnement fin par collection/projet sera traité dans le patch suivant.
    match /{document=**} {
      allow read, write: if request.auth != null;
    }"""

NEW_BLOCK = """    // ============================================================
    // 017Q3-A2 — Cloisonnement SaaS des collections sensibles
    // ============================================================

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isSuperAdmin() {
      return isSignedIn() && (
        request.auth.token.email == 'boudjada.youcef@gmail.com' ||
        request.auth.token.email == 'Boudjada.youcef@gmail.com' ||
        (
          exists(/databases/$(database)/documents/profiles/$(request.auth.uid)) &&
          (
            get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'super_admin' ||
            get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'Super Administrateur'
          )
        )
      );
    }

    function emailMatchesAuth(email) {
      return isSignedIn() &&
        request.auth.token.email != null &&
        email == request.auth.token.email;
    }

    // ------------------------------------------------------------
    // Profils utilisateurs
    // ------------------------------------------------------------
    match /profiles/{userId} {
      allow read: if isSuperAdmin() || isOwner(userId);

      allow create: if isOwner(userId)
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.role in ['client', 'guest', 'demo'];

      allow update: if isSuperAdmin() || (
        isOwner(userId) &&
        request.resource.data.uid == resource.data.uid &&
        request.resource.data.role == resource.data.role
      );

      allow delete: if isSuperAdmin();
    }

    // ------------------------------------------------------------
    // Journaux de connexion
    // ------------------------------------------------------------
    match /connection_logs/{logId} {
      allow read: if isSuperAdmin() ||
        (isSignedIn() && resource.data.userId == request.auth.uid);

      allow create: if isSignedIn()
        && request.resource.data.userId == request.auth.uid
        && emailMatchesAuth(request.resource.data.userEmail);

      allow update, delete: if isSuperAdmin();
    }

    // ------------------------------------------------------------
    // Feedback utilisateur
    // ------------------------------------------------------------
    match /user_feedbacks/{feedbackId} {
      allow read: if isSuperAdmin() ||
        (isSignedIn() && resource.data.userId == request.auth.uid);

      allow create: if isSignedIn()
        && request.resource.data.userId == request.auth.uid
        && emailMatchesAuth(request.resource.data.userEmail)
        && request.resource.data.status == 'new'
        && !request.resource.data.keys().hasAny(['adminNotes']);

      allow update: if isSuperAdmin() || (
        isSignedIn() &&
        resource.data.userId == request.auth.uid &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'title', 'message', 'rating', 'category'
        ])
      );

      allow delete: if isSuperAdmin();
    }

    // ------------------------------------------------------------
    // Usage abonné
    // ------------------------------------------------------------
    match /subscriber_usage/{usageId} {
      allow read: if isSuperAdmin() ||
        (isSignedIn() && resource.data.userId == request.auth.uid);

      allow create: if isSignedIn()
        && request.resource.data.userId == request.auth.uid
        && emailMatchesAuth(request.resource.data.userEmail);

      allow update, delete: if isSuperAdmin();
    }

    // ------------------------------------------------------------
    // Transactions de paiement
    // Client : lecture de ses propres transactions.
    // Écriture : Super Admin uniquement.
    // ------------------------------------------------------------
    match /payment_transactions/{transactionId} {
      allow read: if isSuperAdmin() ||
        (isSignedIn() && resource.data.userId == request.auth.uid);

      allow create, update, delete: if isSuperAdmin();
    }

    // ------------------------------------------------------------
    // Configuration globale
    // ------------------------------------------------------------
    match /system_config/{configId} {
      allow read, write: if isSuperAdmin();
    }

    // ------------------------------------------------------------
    // Identifiants sensibles / licences
    // ------------------------------------------------------------
    match /auth_credentials/{credentialId} {
      allow read, write: if isSuperAdmin();
    }

    match /license_keys/{licenseKeyId} {
      allow read, write: if isSuperAdmin();
    }

    // ------------------------------------------------------------
    // Télémétrie commerciale :
    // pas d'accès client direct depuis Firestore Rules A2.
    // À journaliser plus tard via un endpoint sécurisé / Analytics.
    // ------------------------------------------------------------
    match /commercial_visits/{visitId} {
      allow read, write: if isSuperAdmin();
    }

    // ------------------------------------------------------------
    // Autres collections historiques de l'application :
    // les utilisateurs authentifiés conservent l'accès tant qu'elles
    // ne font pas partie des zones sensibles ci-dessus.
    // ------------------------------------------------------------
    match /{document=**} {
      allow read, write: if isSignedIn();
    }
"""

BACKUP_SUFFIX = ".bak_017Q3_A2"


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python apply_patch_017Q3_A2.py /chemin/vers/pd-i-vis-dz")
        return 2

    repo = Path(sys.argv[1]).expanduser().resolve()
    rules = repo / "firestore.rules"

    if not repo.is_dir():
        print(f"ERREUR: dépôt introuvable: {repo}")
        return 1

    if not rules.is_file():
        print(f"ERREUR: fichier introuvable: {rules}")
        return 1

    text = rules.read_text(encoding="utf-8")

    if NEW_BLOCK in text:
        print("PATCH 017Q3-A2 déjà présent : aucune modification.")
        return 0

    if EXPECTED_BLOCK not in text:
        print("ERREUR: la baseline exacte de PATCH 017Q3-A1 n'a pas été trouvée.")
        print("Le patch refuse de s'appliquer sur un état inconnu.")
        print("Aucun fichier n'a été modifié.")
        return 1

    backup = rules.with_name(rules.name + BACKUP_SUFFIX)
    if backup.exists():
        print(f"ERREUR: sauvegarde déjà présente: {backup}")
        print("Pour éviter tout écrasement, aucun fichier n'a été modifié.")
        return 1

    patched = text.replace(EXPECTED_BLOCK, NEW_BLOCK, 1)

    if EXPECTED_BLOCK in patched:
        print("ERREUR: l'ancien bloc A1 est encore présent.")
        return 1

    if patched.count("match /{document=**}") != 1:
        print("ERREUR: validation échouée : le catch-all final doit être unique.")
        return 1

    if "match /auth_credentials/{credentialId}" not in patched:
        print("ERREUR: règle auth_credentials absente.")
        return 1

    if "allow read, write: if isSuperAdmin();" not in patched:
        print("ERREUR: au moins une règle admin sensible est absente.")
        return 1

    backup.write_text(text, encoding="utf-8")
    rules.write_text(patched, encoding="utf-8")

    print("PATCH 017Q3-A2 appliqué avec succès.")
    print(f"Fichier modifié : {rules}")
    print(f"Sauvegarde       : {backup}")
    print("")
    print("Collections cloisonnées :")
    print("  - profiles")
    print("  - connection_logs")
    print("  - user_feedbacks")
    print("  - subscriber_usage")
    print("  - payment_transactions")
    print("  - system_config")
    print("  - auth_credentials")
    print("  - license_keys")
    print("  - commercial_visits")
    print("")
    print("Aucun push Git n'est effectué par ce script.")
    print("Migration du flux d'authentification Firestore -> Firebase Auth à traiter séparément.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
