#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PATCH 017P10 - REFUS EXPLICITE DE SAISIE (fin de la ligne 017P)
Projet PD&I - Youcef Boudjada
Date : 2026-08-27

POURQUOI CE PATCH
  Deux defauts constates a l ecran le 27/08 a 16h54, apres application du 017P9.

  DEFAUT A - le plancher de longueur est silencieux.
    Saisir 0 dans le champ Longueur ne donne jamais 0 : la valeur devient 0,05
    puis parfois 0,15 apres accrochage, sans que rien ne l explique.
    Cause : ligne 3435, setSegmentLength faisait
        const desired = Math.max(.05, Number(value) || .05);
    Or Number(0) vaut 0, et 0 || .05 vaut .05 : la saisie 0 est remplacee en
    silence. Ensuite recalcSegmentLengths reapplique l accrochage, d ou 0,15.
    Un logiciel de precision ne substitue pas une valeur sans le dire (R24).

  DEFAUT B - un CINQUIEME point de verite, et il se contredit.
    La carte du troncon affichait en rouge
        "Diametre invalide : une valeur superieure a 0 est attendue"
    alors que DN valait 150, que ANOMALIES affichait 0 et que le bandeau
    affichait "Graphe valide".
    Deux causes cumulees, ligne 2717 et suivantes :
      1. Vider le champ DN pour le retaper envoie dn = 0, ce qui declenche le
         refus immediatement, avant meme la fin de la frappe.
      2. segEditError017F2B n est JAMAIS remis a vide. Aucun chemin de code ne
         l effface. Le message rouge reste donc affiche indefiniment, y compris
         apres une correction reussie, et contredit les quatre autres points
         d affichage unifies par le 017P9.
    De plus le message nomme le diametre meme quand la saisie en cause est la
    longueur.

CE QUE FAIT LE PATCH
  1. Cree src/pdi/isometric/engine/pdiSaisie017P10.ts : les regles de
     validation de saisie, au meme endroit et une seule fois.
  2. setSegmentLength refuse une longueur invalide avec un message qui dit
     pourquoi et quel est le minimum, au lieu de substituer une valeur.
  3. Quand l accrochage modifie malgre tout la longueur obtenue, le patch le
     DIT : "Longueur saisie 2,000 m, appliquee 2,250 m apres accrochage."
  4. Le message de refus du diametre nomme le bon champ.
  5. Nouveau pdiAcceptSegmentEdit017P10 : toute edition acceptee efface le
     message rouge. Fin du message fantome.
  6. Incremente PDI_PATCH_VERSION a 017P10.

CE QUE LE PATCH NE FAIT PAS
  - Il ne touche pas aux planchers geometriques internes (lignes 594, 2322,
    4562, 4667, 5113). Ceux-la protegent des longueurs CALCULEES a partir de
    coordonnees, ce qui est legitime. Seule la saisie clavier change.
  - Il ne supprime pas les donnees d exemple ("8" Constantine", DN150 par
    defaut, line_default). C est du debranding : perimetre 017K3.
  - Il n ajoute aucune regle metier nouvelle : celles-la vont au 018.

UTILISATION
  1. Poser ce fichier a la racine du projet, a cote du dossier src.
  2. Double-cliquer, ou : python 017P10_pdi_saisie_refus_explicite.py
  3. La derniere ligne doit dire : VERIFICATIONS : n/n

GARANTIES (R1 et R29) : idempotent, sauvegarde .before017P10, lecture
auto-reparante, ecriture atomique relue et verifiee. Aucune dependance.
"""

import hashlib
import os
import re
import shutil
import sys
import tempfile
import zlib

PATCH = "017P10"
SUFFIXE = ".before017P10"

REL_MOTEUR = os.path.join("src", "pdi", "isometric", "engine", "IsometrieModuleV48d.tsx")
REL_VERSION = os.path.join("src", "pdi", "pdiVersion.ts")
REL_MODULE = os.path.join("src", "pdi", "isometric", "engine", "pdiSaisie017P10.ts")

verifs = []
journal = []


def note(ok, libelle):
    verifs.append((bool(ok), libelle))
    print(("  OK    " if ok else "  ECHEC ") + libelle)


def deja(libelle):
    verifs.append((True, libelle))
    print("  DEJA : " + libelle)


# --------------------------------------------------------------------------
# Socle d entrees/sorties R29 (integre : un seul fichier a poser)
# --------------------------------------------------------------------------

ENTETES_ZLIB = (b"\x78\x01", b"\x78\x5e", b"\x78\x9c", b"\x78\xda")


def lire(chemin):
    with open(chemin, "rb") as f:
        data = f.read()
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError as err:
        approx = err.start
    for delta in range(-16, 17):
        pos = approx + delta
        if pos < 1 or pos + 2 > len(data):
            continue
        if data[pos:pos + 2] not in ENTETES_ZLIB:
            continue
        try:
            queue = zlib.decompressobj(15).decompress(data[pos:])
        except zlib.error:
            continue
        try:
            texte = (data[:pos] + queue).decode("utf-8")
        except UnicodeDecodeError:
            continue
        secours = chemin + ".beforerepair"
        if not os.path.exists(secours):
            with open(secours, "wb") as f:
                f.write(data)
        with open(chemin, "w", encoding="utf-8", newline="") as f:
            f.write(texte)
        print("  REPARE : %s (flux zlib a l octet %d, %d octets restitues)"
              % (os.path.basename(chemin), pos, len(queue)))
        journal.append("RECOLLAGE %s" % os.path.basename(chemin))
        return texte
    raise SystemExit(
        "ARRET : %s n est pas lisible et n a pas pu etre reconstitue." % chemin)


def ecrire(chemin, texte):
    attendu = texte.encode("utf-8")
    dossier = os.path.dirname(os.path.abspath(chemin))
    fd, provisoire = tempfile.mkstemp(dir=dossier, suffix=".pditmp")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(attendu)
            f.flush()
            os.fsync(f.fileno())
        os.replace(provisoire, chemin)
    except BaseException:
        if os.path.exists(provisoire):
            os.unlink(provisoire)
        raise
    with open(chemin, "rb") as f:
        relu = f.read()
    if relu != attendu:
        raise SystemExit("ARRET : %s mal ecrit (%d attendus, %d relus)."
                         % (chemin, len(attendu), len(relu)))
    journal.append("ECRITURE %s : %d octets, relu et verifie"
                   % (os.path.basename(chemin), len(attendu)))


def empreinte(chemin):
    with open(chemin, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()


def sauvegarder(chemin):
    copie = chemin + SUFFIXE
    if not os.path.exists(copie):
        shutil.copy2(chemin, copie)
        print("  SAUVEGARDE : " + os.path.basename(copie))


def trouver_racine():
    for depart in [os.getcwd(), os.path.dirname(os.path.abspath(__file__))]:
        courant = depart
        for _ in range(6):
            if os.path.isfile(os.path.join(courant, REL_MOTEUR)):
                return courant
            parent = os.path.dirname(courant)
            if parent == courant:
                break
            courant = parent
    return None


# --------------------------------------------------------------------------
# Nouveau module : les regles de validation de saisie, en un seul endroit
# --------------------------------------------------------------------------

MODULE_TS = u'''// PATCH 017P10 : REGLES DE VALIDATION DE SAISIE PD&I.
//
// Le 017P9 a unifie les anomalies du MODELE (11 codes, un seul module).
// Restait un cinquieme point de verite que personne n avait vu : le validateur
// des champs du volet Proprietes, qui avait ses propres regles, ses propres
// messages, et surtout aucun moyen de s effacer.
//
// Ce module porte les regles de SAISIE. Elles sont distinctes des anomalies du
// modele, et c est voulu :
//   - pdiAnomalies017P9 decrit un etat du modele qui est faux ;
//   - pdiSaisie017P10 empeche une frappe clavier de rendre le modele faux.
// Mais elles ne doivent plus se contredire a l ecran, ni rester affichees
// apres correction.
//
// Regle : tout message de refus de saisie s ecrit ICI, nulle part ailleurs, et
// dit toujours trois choses : quel champ, pourquoi, ce qui a ete conserve.

// Longueur minimale d un troncon saisissable au clavier, en metres.
// Valeur reprise du plancher historique de setSegmentLength (0,05 m = 50 mm).
export const PDI_LONGUEUR_MIN_017P10 = 0.05;

export interface PdiControleSaisie017P10 {
  ok: boolean;
  valeur: number;
  message?: string;
}

function refus(message: string): PdiControleSaisie017P10 {
  return { ok: false, valeur: 0, message: message };
}

/**
 * Controle de la longueur saisie au clavier.
 *
 * Avant le 017P10, saisir 0 donnait 0,05 sans explication, parce que
 * "Number(0) || 0.05" vaut 0.05. On refuse desormais, et on dit pourquoi.
 */
export function pdiValiderLongueur017P10(valeur: unknown): PdiControleSaisie017P10 {
  const n = Number(valeur);
  if (!Number.isFinite(n)) {
    return refus(
      "Longueur refusee : saisissez un nombre, en metres. " +
      "La longueur precedente est conservee.",
    );
  }
  if (n <= 0) {
    return refus(
      "Longueur refusee : un troncon de longueur nulle ou negative n existe pas. " +
      "La longueur precedente est conservee.",
    );
  }
  if (n < PDI_LONGUEUR_MIN_017P10) {
    return refus(
      "Longueur refusee : minimum " + PDI_LONGUEUR_MIN_017P10.toFixed(2) + " m (" +
      String(Math.round(PDI_LONGUEUR_MIN_017P10 * 1000)) + " mm). " +
      "La longueur precedente est conservee.",
    );
  }
  return { ok: true, valeur: n };
}

/**
 * Controle du diametre saisi au clavier.
 *
 * Vider le champ pour le retaper envoyait 0, donc un refus immediat en pleine
 * frappe. Le message nomme maintenant le bon champ et annonce ce qui est garde.
 */
export function pdiValiderDn017P10(valeur: unknown): PdiControleSaisie017P10 {
  const n = Number(valeur);
  if (!Number.isFinite(n) || n <= 0) {
    return refus(
      "DN refuse : le diametre doit etre un nombre superieur a 0. " +
      "Le diametre precedent est conserve.",
    );
  }
  return { ok: true, valeur: Math.round(n) };
}

/**
 * Message a afficher quand l accrochage a modifie la valeur saisie.
 * Retourne une chaine vide s il n y a rien a signaler : l appelant peut donc
 * transmettre le resultat tel quel.
 */
export function pdiEcartAccrochage017P10(demandee: number, obtenue: number): string {
  if (!Number.isFinite(demandee) || !Number.isFinite(obtenue)) return "";
  if (Math.abs(obtenue - demandee) <= 0.001) return "";
  return (
    "Longueur saisie " + demandee.toFixed(3) + " m, appliquee " +
    obtenue.toFixed(3) + " m apres accrochage."
  );
}
'''

# --------------------------------------------------------------------------
# Fragments
# --------------------------------------------------------------------------

ANCIEN_IMPORT = ('import { pdiUnifyAnomalies017P9, pdiAnomalieKind017P9, '
                 'pdiAnomalieLibelle017P9 } from "./pdiAnomalies017P9";')
NOUVEL_IMPORT = ANCIEN_IMPORT + (
    '\n// PATCH 017P10 : regles de validation de saisie (un seul endroit).\n'
    'import { pdiValiderLongueur017P10, pdiValiderDn017P10, '
    'pdiEcartAccrochage017P10 } from "./pdiSaisie017P10";'
)

ANCIEN_REJET = "\n".join([
    '  const pdiRejectSegmentEdit017F2B = (message: string) => {',
    '    setSegEditError017F2B(message);',
    '    setSegEditRev017F2B((n) => n + 1);',
    '    setStatusMessage(message);',
    '    setAutocadPrompt(message);',
    '  };',
])
NOUVEAU_REJET = ANCIEN_REJET + "\n".join([
    '',
    '',
    '  // PATCH 017P10 : contrepartie du refus, qui manquait totalement.',
    '  // segEditError017F2B n etait jamais remis a vide : le message rouge',
    '  // restait affiche apres correction et contredisait les quatre points',
    '  // d affichage unifies par le 017P9. Toute edition acceptee l efface.',
    '  const pdiAcceptSegmentEdit017P10 = (notice?: string) => {',
    '    setSegEditError017F2B("");',
    '    if (notice) {',
    '      setStatusMessage(notice);',
    '      setAutocadPrompt(notice);',
    '    }',
    '  };',
])

ANCIEN_DN = "\n".join([
    '    if (!(nextDn > 0)) {',
    '      // PATCH 017F2B : refus visible au lieu d un simple message de statut.',
    '      pdiRejectSegmentEdit017F2B("Diametre invalide : une valeur superieure a 0 est attendue");',
    '      return;',
    '    }',
])
NOUVEAU_DN = "\n".join([
    '    // PATCH 017P10 : le message nomme le champ reellement en cause et dit',
    '    // ce qui est conserve. Regle ecrite dans pdiSaisie017P10.',
    '    const controleDn017P10 = pdiValiderDn017P10(nextDn);',
    '    if (!controleDn017P10.ok) {',
    '      pdiRejectSegmentEdit017F2B(controleDn017P10.message || "DN refuse");',
    '      return;',
    '    }',
])

ANCIEN_ACCEPT = '    const anySpec = specObj as any;'
NOUVEAU_ACCEPT = "\n".join([
    '    // PATCH 017P10 : les controles sont passes, on efface le message rouge.',
    '    pdiAcceptSegmentEdit017P10();',
    '    const anySpec = specObj as any;',
])

ANCIEN_LONGUEUR = "\n".join([
    '  const setSegmentLength=(id:string,value:number)=>{',
    '    const desired=Math.max(.05,Number(value)||.05);',
    '    const s=segments.find(x=>x.id===id);',
    '    if(!s)return;',
    '    const a=nodes.find(n=>n.id===s.fromNodeId),b=nodes.find(n=>n.id===s.toNodeId);',
    '    if(!a||!b)return;',
    '    const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;',
    '    const current=Math.hypot(dx,dy,dz);',
    '    const ux=current>.0001?dx/current:1,uy=current>.0001?dy/current:0,uz=current>.0001?dz/current:0;',
    '    const nextNodes=nodes.map(n=>n.id===b.id?{...n,x:a.x+ux*desired,y:a.y+uy*desired,z:a.z+uz*desired}:n);',
    '    commitGraph(nextNodes,recalcSegmentLengths(nextNodes,segments));',
    '  };',
])
NOUVEAU_LONGUEUR = "\n".join([
    '  const setSegmentLength=(id:string,value:number)=>{',
    '    // PATCH 017P10 : refus explicite au lieu du plancher silencieux.',
    '    // Avant : Math.max(.05,Number(value)||.05) transformait une saisie 0 en',
    '    // 0,05 sans rien dire, puis l accrochage donnait parfois 0,15.',
    '    const controle017P10=pdiValiderLongueur017P10(value);',
    '    if(!controle017P10.ok){',
    '      pdiRejectSegmentEdit017F2B(controle017P10.message||"Longueur refusee");',
    '      return;',
    '    }',
    '    const desired=controle017P10.valeur;',
    '    const s=segments.find(x=>x.id===id);',
    '    if(!s)return;',
    '    const a=nodes.find(n=>n.id===s.fromNodeId),b=nodes.find(n=>n.id===s.toNodeId);',
    '    if(!a||!b)return;',
    '    const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;',
    '    const current=Math.hypot(dx,dy,dz);',
    '    const ux=current>.0001?dx/current:1,uy=current>.0001?dy/current:0,uz=current>.0001?dz/current:0;',
    '    const nextNodes=nodes.map(n=>n.id===b.id?{...n,x:a.x+ux*desired,y:a.y+uy*desired,z:a.z+uz*desired}:n);',
    '    // PATCH 017P10 : on regarde ce que l accrochage a REELLEMENT applique,',
    '    // et on le dit au lieu de laisser l utilisateur deviner.',
    '    const nextSegments017P10=recalcSegmentLengths(nextNodes,segments);',
    '    const obtenu017P10=nextSegments017P10.find(x=>x.id===id);',
    '    pdiAcceptSegmentEdit017P10(obtenu017P10?pdiEcartAccrochage017P10(desired,Number(obtenu017P10.length)):"");',
    '    commitGraph(nextNodes,nextSegments017P10);',
    '  };',
])


def main():
    print("=" * 72)
    print("PATCH %s - REFUS EXPLICITE DE SAISIE" % PATCH)
    print("=" * 72)

    racine = trouver_racine()
    if racine is None:
        print("")
        print("ARRET : je ne trouve pas le projet.")
        print("        Placez ce fichier a la racine, la ou se trouve le dossier 'src'.")
        return 2
    print("Projet : %s" % racine)

    moteur = os.path.join(racine, REL_MOTEUR)
    version = os.path.join(racine, REL_VERSION)
    module = os.path.join(racine, REL_MODULE)

    print("")
    print("--- 1. Prerequis : le 017P9 doit etre applique ---")
    tsx = lire(moteur)
    md5_avant = empreinte(moteur)
    print("  %d octets, %d lignes, MD5 %s"
          % (len(tsx.encode("utf-8")), tsx.count("\n"), md5_avant))
    if "pdiAnomalies017P9" not in tsx:
        print("")
        print("ARRET : le 017P9 n est pas applique sur ce depot.")
        print("        Appliquez d abord 017P9_pdi_anomalies_source_unique.py.")
        return 2
    note(True, "017P9 detecte, le socle de source unique est en place")

    print("")
    print("--- 2. Module pdiSaisie017P10.ts ---")
    if os.path.isfile(module) and "pdiValiderLongueur017P10" in lire(module):
        deja("le module de regles de saisie existe")
    else:
        ecrire(module, MODULE_TS)
        note(os.path.isfile(module), "module de regles de saisie cree")
    m = lire(module)
    note("pdiValiderLongueur017P10" in m, "controle de longueur exporte")
    note("pdiValiderDn017P10" in m, "controle de diametre exporte")
    note("pdiEcartAccrochage017P10" in m, "signalement d ecart d accrochage exporte")
    note("PDI_LONGUEUR_MIN_017P10 = 0.05" in m, "longueur minimale declaree une seule fois")

    print("")
    print("--- 3. Branchement dans le moteur ---")
    sauvegarder(moteur)

    if "pdiSaisie017P10" in tsx:
        deja("le moteur importe les regles de saisie")
    elif ANCIEN_IMPORT in tsx:
        tsx = tsx.replace(ANCIEN_IMPORT, NOUVEL_IMPORT, 1)
        note("pdiSaisie017P10" in tsx, "import des regles de saisie ajoute")
    else:
        note(False, "import : ancre du 017P9 introuvable")

    print("")
    print("--- 4. Defaut B : le message rouge qui ne s effacait jamais ---")
    if "pdiAcceptSegmentEdit017P10" in tsx:
        deja("la fonction d acceptation existe")
    elif ANCIEN_REJET in tsx:
        tsx = tsx.replace(ANCIEN_REJET, NOUVEAU_REJET, 1)
        note("pdiAcceptSegmentEdit017P10 = (notice" in tsx,
             "fonction d acceptation ajoutee (efface segEditError017F2B)")
    else:
        note(False, "acceptation : ancre du rejet 017F2B introuvable")

    if "controleDn017P10" in tsx:
        deja("le refus de DN nomme le bon champ")
    elif ANCIEN_DN in tsx:
        tsx = tsx.replace(ANCIEN_DN, NOUVEAU_DN, 1)
        note("pdiValiderDn017P10(nextDn)" in tsx, "refus de DN passe par la regle unique")
    else:
        note(False, "refus de DN : ancre introuvable")

    if "pdiAcceptSegmentEdit017P10();" in tsx:
        deja("l edition acceptee efface le message")
    elif ANCIEN_ACCEPT in tsx:
        tsx = tsx.replace(ANCIEN_ACCEPT, NOUVEAU_ACCEPT, 1)
        note("pdiAcceptSegmentEdit017P10();" in tsx,
             "effacement branche sur l edition reussie")
    else:
        note(False, "effacement : ancre anySpec introuvable")

    print("")
    print("--- 5. Defaut A : le plancher de longueur silencieux ---")
    if "controle017P10" in tsx:
        deja("la saisie de longueur est deja controlee")
    elif ANCIEN_LONGUEUR in tsx:
        tsx = tsx.replace(ANCIEN_LONGUEUR, NOUVEAU_LONGUEUR, 1)
        note("pdiValiderLongueur017P10(value)" in tsx, "saisie de longueur controlee")
        note("pdiEcartAccrochage017P10(desired" in tsx, "ecart d accrochage annonce")
    else:
        note(False, "longueur : ancre de setSegmentLength introuvable")

    note("const desired=Math.max(.05,Number(value)||.05);" not in tsx,
         "plus aucun plancher silencieux sur la saisie clavier")
    note("Diametre invalide : une valeur superieure a 0 est attendue" not in tsx,
         "ancien message trompeur supprime")
    note(tsx.count("Math.max(.05,") >= 3,
         "planchers geometriques internes preserves (longueurs calculees)")

    print("")
    print("--- 6. Ecriture ---")
    ecrire(moteur, tsx)
    print("  MD5 avant %s" % md5_avant)
    print("  MD5 apres %s" % empreinte(moteur))

    print("")
    print("--- 7. Pastille de version ---")
    v = lire(version)
    if 'PDI_PATCH_VERSION = "017P10"' in v:
        deja("la pastille affiche 017P10")
    else:
        sauvegarder(version)
        v = re.sub(r'PDI_PATCH_VERSION\s*=\s*"[^"]*"',
                   'PDI_PATCH_VERSION = "017P10"', v, count=1)
        v = re.sub(r'PDI_PATCH_DATE\s*=\s*"[^"]*"',
                   'PDI_PATCH_DATE = "2026-08-27"', v, count=1)
        ecrire(version, v)
        note('PDI_PATCH_VERSION = "017P10"' in lire(version),
             "pastille passee a 017P10")

    print("")
    print("=" * 72)
    ok = sum(1 for a, _ in verifs if a)
    print("VERIFICATIONS : %d/%d" % (ok, len(verifs)))
    for l in journal:
        print("  " + l)
    print("=" * 72)

    if ok != len(verifs):
        print("")
        print("Des verifications ont echoue. Sauvegardes %s en place :" % SUFFIXE)
        print("  renommez-les sans le suffixe pour revenir en arriere.")
        return 1

    print("")
    print("A TESTER APRES CE PATCH")
    print("  1. Pastille : elle doit afficher 017P10.")
    print("  2. Selectionner un troncon, mettre 0 dans Longueur, valider.")
    print("     Attendu : la longueur NE CHANGE PAS, et un message rouge dit")
    print("     'Longueur refusee : un troncon de longueur nulle ... n existe pas.'")
    print("  3. Mettre 0,02 : refus avec le minimum annonce (0,05 m / 50 mm).")
    print("  4. Mettre 3 : accepte. Si l accrochage donne autre chose, la barre")
    print("     d etat le DIT : 'Longueur saisie 3,000 m, appliquee X m ...'.")
    print("  5. Le message rouge doit DISPARAITRE des qu une saisie passe.")
    print("     C est le defaut principal corrige : avant, il restait affiche.")
    print("  6. Vider le champ DN puis retaper 150 : le refus doit parler du DN,")
    print("     puis disparaitre une fois 150 valide.")
    print("  7. Non-regression 017P9 : ANOMALIES et le compteur du bandeau")
    print("     doivent toujours afficher le meme chiffre.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
