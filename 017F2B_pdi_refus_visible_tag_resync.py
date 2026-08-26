#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PATCH 017F2B - PD&I VIS DZ
REFUS D EDITION VISIBLE + TAG RECONSTRUIT + CHAMPS RESYNCHRONISES

RETOUR DE TEST 017F2 (4:36 PM)
------------------------------
Tests 2, 3, 4, 5, 8 : OK. Tests 6 et 7 en anomalie sur les captures :

  Capture 2 : Diametre = DN300  MAIS  Tag = 150-HC-001-CS150
  Capture 3 : champ DN = 500, Spec = CS600 (DN15-400)
              -> Diametre reste DN150 (le refus a bien eu lieu)
              -> AUCUN message de refus visible
              -> le champ conserve la valeur invalide 500

TROIS DEFAUTS REELS
-------------------
1. REFUS INVISIBLE : applySegmentEdit017F2 appelait uniquement
   setStatusMessage(). Le message n etait pas rendu dans l inspecteur, donc le
   refus paraissait etre un "rien ne se passe".
2. CHAMP DESYNCHRONISE : les champs DN / Longueur sont non controles
   (defaultValue + key = seg.id + valeur). Sur un refus, la valeur du modele ne
   change pas -> la key ne change pas -> React ne remonte pas l input, qui garde
   la saisie invalide (500) alors que le modele vaut 150.
3. TAG FIGE : la partie diametre du tag industriel n etait pas reconstruite apres
   une edition du DN / service / spec, d ou DN300 tague 150-HC-001-CS150.

CORRECTIF 017F2B
----------------
A. Etat de refus (segEditError017F2B) + compteur de revision (segEditRev017F2B)
   + helper pdiRejectSegmentEdit017F2B() : barre de statut + invite AutoCAD +
   message rouge dans la carte du troncon, et remontage des champs.
B. Branche "Diametre invalide" -> refus visible.
C. Branche "Refuse : la spec ... n admet que DN.. a DN.." -> refus visible.
D. Reconstruction du tag via pdiBuildTag / pdiNextTagNumber apres chaque edition
   acceptee (uniquement si le troncon etait deja tague), + effacement du message.
E/F. Les key des champs DN et Longueur integrent segEditRev017F2B :
   apres un refus, le champ revient a la valeur reelle du modele.
G. Affichage du message de refus dans l inspecteur (bloc rouge).

REGLES : R1 patch .py idempotent + backup + rapport / R2 codage Claude /
R5 test avant patch suivant / R6 explication avant code / R8 commande declaree
et dispatchee.

PREREQUIS : 017F2 applique (helper applySegmentEdit017F2 present).
USAGE : python3 017F2B_pdi_refus_visible_tag_resync.py [racine_du_projet]
"""

import os
import sys
import shutil

SUFFIX = ".before017F2B"
ENGINE = "src/pdi/isometric/engine/IsometrieModuleV48d.tsx"
applied = 0
skipped = 0
failed = 0
log = []


def read(path):
    with open(path, "r", encoding="utf-8") as fh:
        return fh.read()


def write(path, content):
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)


def backup(path):
    bak = path + SUFFIX
    if not os.path.exists(bak):
        shutil.copy2(path, bak)


def step(label, path, marker, old, new, root):
    global applied, skipped, failed
    full = os.path.join(root, path)
    if not os.path.exists(full):
        failed += 1
        log.append("[ECHEC ] " + label + " : fichier absent (" + path + ")")
        return
    src = read(full)
    if marker in src:
        skipped += 1
        log.append("[DEJA  ] " + label)
        return
    if src.count(old) != 1:
        failed += 1
        log.append("[ECHEC ] " + label + " : ancre trouvee " + str(src.count(old)) + " fois")
        return
    backup(full)
    write(full, src.replace(old, new, 1))
    applied += 1
    log.append("[APPLIQ] " + label)


# ---------------------------------------------------------------------------
# A. etat de refus + helper
# ---------------------------------------------------------------------------
A_OLD = "  // PATCH 017F2 : edition en place d un troncon depuis l inspecteur, refusee\n"
A_NEW = "\n".join([
    "  // PATCH 017F2B : refus d edition rendu visible.",
    "  // segEditError017F2B porte le message affiche dans la carte du troncon.",
    "  // segEditRev017F2B est un compteur de revision : il entre dans la key des",
    "  // champs non controles (DN, Longueur) pour les remonter apres un refus et",
    "  // ainsi effacer la saisie invalide restee a l ecran.",
    '  const [segEditError017F2B, setSegEditError017F2B] = useState<string>("");',
    "  const [segEditRev017F2B, setSegEditRev017F2B] = useState<number>(0);",
    "  const pdiRejectSegmentEdit017F2B = (message: string) => {",
    "    setSegEditError017F2B(message);",
    "    setSegEditRev017F2B((n) => n + 1);",
    "    setStatusMessage(message);",
    "    setAutocadPrompt(message);",
    "  };",
    "",
    "  // PATCH 017F2 : edition en place d un troncon depuis l inspecteur, refusee",
    "",
])

# ---------------------------------------------------------------------------
# B. diametre invalide
# ---------------------------------------------------------------------------
B_OLD = "\n".join([
    "    if (!(nextDn > 0)) {",
    '      setStatusMessage("Diametre invalide : une valeur superieure a 0 est attendue");',
    "      return;",
    "    }",
])
B_NEW = "\n".join([
    "    if (!(nextDn > 0)) {",
    "      // PATCH 017F2B : refus visible au lieu d un simple message de statut.",
    '      pdiRejectSegmentEdit017F2B("Diametre invalide : une valeur superieure a 0 est attendue");',
    "      return;",
    "    }",
])

# ---------------------------------------------------------------------------
# C. spec incompatible
# ---------------------------------------------------------------------------
C_OLD = "\n".join([
    "    if (specObj && !pdiSpecAllowsDn(specObj, nextDn)) {",
    "      setStatusMessage(",
    '        "Refuse : la spec " + specObj.code + " n admet que DN" + specObj.minDn + " a DN" + specObj.maxDn',
    "      );",
    "      return;",
    "    }",
])
C_NEW = "\n".join([
    "    if (specObj && !pdiSpecAllowsDn(specObj, nextDn)) {",
    "      // PATCH 017F2B : refus visible + resynchronisation du champ saisi.",
    "      pdiRejectSegmentEdit017F2B(",
    '        "Refuse : DN" + nextDn + " hors plage. La spec " + specObj.code +',
    '          " n admet que DN" + specObj.minDn + " a DN" + specObj.maxDn',
    "      );",
    "      return;",
    "    }",
])

# ---------------------------------------------------------------------------
# D. reconstruction du tag + effacement du message
# ---------------------------------------------------------------------------
D_OLD = "\n".join([
    "      if (patch.length != null && Number.isFinite(patch.length) && patch.length > 0) updated.length = patch.length;",
    "      return updated;",
    "    }));",
    '    setStatusMessage("Troncon " + (target.tag || id) + " mis a jour");',
])
D_NEW = "\n".join([
    "      if (patch.length != null && Number.isFinite(patch.length) && patch.length > 0) updated.length = patch.length;",
    "      // PATCH 017F2B : le tag industriel doit suivre le DN / service / spec.",
    "      // Avant : DN300 restait tague 150-HC-001-CS150 (partie diametre figee).",
    "      if (s.tag) {",
    "        const svc = String(updated.service || defaultService).toUpperCase();",
    "        const sp = String(updated.spec || defaultSpec).toUpperCase();",
    "        const known = prev.map((x) => x.tag || \"\");",
    "        const num = s.tagNumber || pdiNextTagNumber(known, svc, nextDn, activeTagFormat);",
    "        updated.tagNumber = num;",
    "        updated.tagFormatName = activeTagFormat.name;",
    "        updated.tag = pdiBuildTag(",
    "          { nominalDiameter: nextDn, service: svc, number: num, spec: sp },",
    "          activeTagFormat",
    "        );",
    "      }",
    "      return updated;",
    "    }));",
    "    // PATCH 017F2B : edition acceptee, le message de refus est efface.",
    '    setSegEditError017F2B("");',
    '    setStatusMessage("Troncon " + (target.tag || id) + " mis a jour vers DN" + nextDn);',
])

# ---------------------------------------------------------------------------
# E / F. resynchronisation des champs non controles
# ---------------------------------------------------------------------------
E_OLD = '                            key={"dn-" + seg.id + "-" + String(seg.dn)}\n'
# NB : aucun commentaire JSX entre les attributs d une balise (syntaxe invalide).
E_NEW = '                            key={"dn-" + seg.id + "-" + String(seg.dn) + "-" + String(segEditRev017F2B)}\n'

F_OLD = '                            key={"len-" + seg.id + "-" + String(seg.length)}\n'
F_NEW = '                            key={"len-" + seg.id + "-" + String(seg.length) + "-" + String(segEditRev017F2B)}\n'

# ---------------------------------------------------------------------------
# G. affichage du refus dans l inspecteur
# ---------------------------------------------------------------------------
G_OLD = "                      {/* PATCH 017F2 : edition en place validee par la spec du projet. */}\n"
G_NEW = "\n".join([
    "                      {/* PATCH 017F2 : edition en place validee par la spec du projet. */}",
    "                      {/* PATCH 017F2B : retour visible du refus de validation. */}",
    "                      {segEditError017F2B ? (",
    '                        <div className="mt-1 px-2 py-1 rounded-lg bg-red-950 border border-red-600 text-[10px] font-bold text-red-300 leading-snug">',
    "                          {segEditError017F2B}",
    "                        </div>",
    "                      ) : null}",
    "",
])


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    root = os.path.abspath(root)
    print("PATCH 017F2B - refus visible, tag reconstruit, champs resynchronises")
    print("Racine : " + root)
    print("-" * 72)

    step("A. etat de refus + helper pdiRejectSegmentEdit017F2B",
         ENGINE, "pdiRejectSegmentEdit017F2B = (", A_OLD, A_NEW, root)

    step("B. branche diametre invalide : refus visible",
         ENGINE, 'pdiRejectSegmentEdit017F2B("Diametre invalide',
         B_OLD, B_NEW, root)

    step("C. branche spec incompatible : refus visible + plage admise",
         ENGINE, '" hors plage. La spec "', C_OLD, C_NEW, root)

    step("D. reconstruction du tag industriel apres edition",
         ENGINE, "PATCH 017F2B : le tag industriel doit suivre",
         D_OLD, D_NEW, root)

    step("E. champ DN : remontage apres refus",
         ENGINE, 'String(seg.dn) + "-" + String(segEditRev017F2B)',
         E_OLD, E_NEW, root)

    step("F. champ Longueur : remontage apres refus",
         ENGINE, 'String(seg.length) + "-" + String(segEditRev017F2B)',
         F_OLD, F_NEW, root)

    step("G. affichage du message de refus dans l inspecteur",
         ENGINE, "PATCH 017F2B : retour visible du refus",
         G_OLD, G_NEW, root)

    print("\n".join(log))
    print("-" * 72)
    print("Appliques : " + str(applied) + " | Deja presents : " + str(skipped) + " | Echecs : " + str(failed))

    report = os.path.join(root, "017F2B_refus_visible_tag_resync_REPORT.md")
    with open(report, "w", encoding="utf-8") as fh:
        fh.write("# PATCH 017F2B - refus visible, tag reconstruit, champs resynchronises\n\n")
        fh.write("## Defauts constates (captures 4:30 / 4:32 PM)\n\n")
        fh.write("| # | Symptome | Cause |\n|---|---|---|\n")
        fh.write("| 1 | Refus de spec sans aucun message | `setStatusMessage` seul, non rendu dans l inspecteur |\n")
        fh.write("| 2 | Champ DN garde `500` alors que le modele vaut `150` | input non controle, `key` inchangee car la valeur du modele n a pas bouge |\n")
        fh.write("| 3 | `DN300` tague `150-HC-001-CS150` | tag non reconstruit apres edition du DN |\n\n")
        fh.write("## Correctif\n\n")
        fh.write("| # | Effet |\n|---|---|\n")
        fh.write("| A | `segEditError017F2B`, `segEditRev017F2B`, `pdiRejectSegmentEdit017F2B()` |\n")
        fh.write("| B | Diametre invalide -> refus visible |\n")
        fh.write("| C | Spec incompatible -> `Refuse : DN500 hors plage. La spec CS600 n admet que DN15 a DN400` |\n")
        fh.write("| D | Tag reconstruit par `pdiBuildTag` / `pdiNextTagNumber` (si deja tague) |\n")
        fh.write("| E-F | Champs DN / Longueur remontes apres un refus |\n")
        fh.write("| G | Bloc rouge dans la carte du troncon |\n\n")
        fh.write("## Identifiants\n\n")
        fh.write("`segEditError017F2B`, `segEditRev017F2B`, `pdiRejectSegmentEdit017F2B(message)`, ")
        fh.write("marqueur `// PATCH 017F2B`\n\n")
        fh.write("## Resultat\n\n")
        fh.write("Appliques : " + str(applied) + " | Deja presents : " + str(skipped))
        fh.write(" | Echecs : " + str(failed) + "\n\n")
        fh.write("\n".join(log) + "\n")
    print("Rapport : " + report)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
