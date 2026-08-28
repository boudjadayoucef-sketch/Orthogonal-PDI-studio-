#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PATCH 017K3 - LA CLASSE DE PRESSION VIENT DE LA SPEC, PAS D UNE SAISIE.

QUESTION POSEE
  Le formulaire de creation proposait "Class 600" alors que la spec active du
  projet est CS150, donc Class 150. Lequel fait foi ?

CE QUE DISENT LES NORMES
  ASME B16.5 (Pipe Flanges and Flanged Fittings) definit SEPT classes de
  pression : 150, 300, 400, 600, 900, 1500, 2500. La classe ne se choisit pas
  par habitude : on entre dans la table pression-temperature du groupe de
  materiau, on part de la colonne Class 150 et on va vers la droite jusqu a
  trouver une pression admissible superieure ou egale a la pression de calcul
  a la temperature de calcul. La premiere colonne qui satisfait la condition
  EST la classe requise.
  ASME B31.3 par. 302.2(a) : un composant conforme a une norme listee, comme
  B16.5, est reconnu apte a la pression que cette norme lui attribue.
  Pratique des specifications de tuyauterie (piping material specification) :
  chaque ligne porte une classe de ligne, et les composants sont specifies
  pour la pleine capacite de la classe de la ligne. La classe est donc une
  propriete de la SPEC, pas un champ libre du formulaire.

  Conclusion applicable ici : une valeur "Class 600" ecrite en dur, sans
  aucune pression de calcul renseignee, n est justifiable par aucune norme.
  Class 600 tient jusqu a environ 103 bar a temperature ambiante, Class 150
  jusqu a environ 20 bar : proposer 600 par defaut sur un projet declare en
  CS150 revient a surdimensionner toute la ligne au premier clic, et a
  fabriquer une incoherence entre le tag (CS150) et la classe du troncon.

CE QUE FAIT LE PATCH
  1. La classe et le materiau proposes par defaut sont LUS dans la spec
     active du projet. Projet en CS150 -> Class 150 et Acier carbone.
     Projet en CS600 -> Class 600. Plus aucune valeur en dur.
  2. Les listes deroulantes de classe affichent les SEPT classes de
     l ASME B16.5, et non plus trois. PN16 et PN40 sont conserves : ce sont
     des designations ISO/EN, necessaires pour les specs GRE et PE100 qui
     existent deja dans le projet.
  3. Si l utilisateur choisit sciemment une classe differente de celle de la
     spec, un message le signale sans l empecher : la derogation reste
     possible, elle devient visible.

  Ce que le patch NE fait PAS, volontairement : il ne supprime pas les
  saisies d exemple ('8" Constantine', le projet de demonstration). Vous avez
  demande que cette suppression se fasse dans le patch de debranding : elle
  reste au 017L.

IDEMPOTENT - relancable sans risque. Sauvegardes .before017K3.
"""

import hashlib
import os
import re
import sys
import tempfile
import zlib

PATCH = "017K3"
SUFFIXE = ".before017K3"

REL_MOTEUR = "src/pdi/isometric/engine/IsometrieModuleV48d.tsx"
REL_MODULE = "src/pdi/isometric/engine/pdiClassePression017K3.ts"
REL_VERSION = "src/pdi/pdiVersion.ts"

ENTETES_ZLIB = (b"\x78\x01", b"\x78\x5e", b"\x78\x9c", b"\x78\xda")

verifs = []


# --------------------------------------------------------------------------
# SOCLE R29
# --------------------------------------------------------------------------
def lire(chemin):
    with open(chemin, "rb") as f:
        brut = f.read()
    try:
        return brut.decode("utf-8")
    except UnicodeDecodeError as err:
        for delta in range(-16, 17):
            p = err.start + delta
            if p <= 0 or p + 2 > len(brut) or brut[p:p + 2] not in ENTETES_ZLIB:
                continue
            try:
                recolle = brut[:p] + zlib.decompressobj(15).decompress(brut[p:])
                texte = recolle.decode("utf-8")
            except Exception:
                continue
            with open(chemin + ".beforerepair", "wb") as f:
                f.write(brut)
            with open(chemin, "wb") as f:
                f.write(recolle)
            print("  REPARATION %s : flux zlib recolle a l octet %d"
                  % (os.path.basename(chemin), p))
            return texte
        raise SystemExit("ARRET : %s illisible, reparation impossible." % chemin)


def ecrire(chemin, texte):
    attendu = texte.encode("utf-8")
    dossier = os.path.dirname(chemin) or "."
    fd, tmp = tempfile.mkstemp(dir=dossier, suffix=".tmp")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(attendu)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, chemin)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise
    with open(chemin, "rb") as f:
        relu = f.read()
    if relu != attendu:
        raise SystemExit("ARRET : relecture differente de l ecriture : %s"
                         % chemin)
    print("  ECRITURE %s : %d octets, relu et verifie"
          % (os.path.basename(chemin), len(relu)))


def sauvegarder(chemin):
    cible = chemin + SUFFIXE
    if os.path.exists(cible):
        print("  SAUVEGARDE deja presente : %s" % os.path.basename(cible))
        return
    with open(chemin, "rb") as f:
        contenu = f.read()
    with open(cible, "wb") as f:
        f.write(contenu)
    print("  SAUVEGARDE : %s" % os.path.basename(cible))


def note(ok, libelle):
    verifs.append((bool(ok), libelle))
    print("  %-5s %s" % ("OK" if ok else "ECHEC", libelle))


def deja(libelle):
    verifs.append((True, libelle))
    print("  DEJA : %s" % libelle)


def trouver_racine():
    for depart in (os.path.abspath(os.path.dirname(__file__)),
                   os.path.abspath(os.getcwd())):
        ici = depart
        for _ in range(6):
            if os.path.exists(os.path.join(ici, REL_MOTEUR)):
                return ici
            ici = os.path.dirname(ici)
    raise SystemExit("ARRET : %s introuvable. Lancez le patch a la racine "
                     "du projet." % REL_MOTEUR)


# --------------------------------------------------------------------------
# NOUVEAU MODULE
# --------------------------------------------------------------------------
MODULE_TS = '''// PATCH 017K3 : la classe de pression est une propriete de la SPEC.
//
// POURQUOI CE FICHIER EXISTE
// Le formulaire de creation de troncon proposait "Class 600" en dur, alors
// que la spec active du projet etait CS150, donc Class 150. Les deux ne
// peuvent pas etre vrais en meme temps, et c est la spec qui fait foi.
//
// CE QUE DISENT LES NORMES
//   ASME B16.5 : sept classes de pression normalisees. La classe requise se
//     determine en entrant dans la table pression-temperature du groupe de
//     materiau avec la pression et la temperature de calcul, en partant de
//     Class 150 et en allant vers la droite jusqu a une valeur admissible
//     superieure ou egale au besoin.
//   ASME B31.3 par. 302.2(a) : un composant conforme a une norme listee est
//     apte a la pression que cette norme lui attribue.
//   Specification de tuyauterie : la classe de ligne s applique a tous les
//     composants de la ligne. Elle n est pas un champ libre.
//
// Ce module ne calcule PAS la classe a partir d une pression de calcul :
// le projet ne saisit pas encore pression et temperature de calcul. Il fait
// la seule chose defendable en attendant : il lit la classe dans la spec
// declaree du projet, au lieu de l inventer.

import { PDI_DEFAULT_SPECS, pdiFindSpec } from "./pdiTagging";
import type { PdiProjectSetup } from "./pdiTagging";

/** Les sept classes de l ASME B16.5, dans l ordre croissant. */
export const PDI_CLASSES_B165_017K3: string[] = [
  "Class 150",
  "Class 300",
  "Class 400",
  "Class 600",
  "Class 900",
  "Class 1500",
  "Class 2500",
];

/**
 * Designations PN, conservees pour les specs non metalliques deja declarees
 * dans le projet (GRE, PE100). Ce ne sont pas des classes ASME B16.5.
 */
export const PDI_DESIGNATIONS_PN_017K3: string[] = ["PN16", "PN40"];

/** Classe de repli quand aucun projet n est encore charge. */
export const PDI_CLASSE_PAR_DEFAUT_017K3: string =
  PDI_DEFAULT_SPECS[0]?.pressureClass ?? "Class 150";

/** Materiau de repli, lu dans la meme spec que la classe. */
export const PDI_MATERIAU_PAR_DEFAUT_017K3: string =
  PDI_DEFAULT_SPECS[0]?.material ?? "Acier carbone";

/** Spec active du projet : celle qui est explicitement demandee, sinon la premiere declaree. */
function specActive017K3(setup?: PdiProjectSetup, code?: string) {
  if (!setup) return undefined;
  if (code) {
    const trouvee = pdiFindSpec(setup, code);
    if (trouvee) return trouvee;
  }
  return setup.specs && setup.specs.length > 0 ? setup.specs[0] : undefined;
}

/** Classe de pression imposee par la spec du projet. */
export function pdiClasseDeSpec017K3(
  setup?: PdiProjectSetup,
  code?: string,
): string {
  const spec = specActive017K3(setup, code);
  return spec?.pressureClass || PDI_CLASSE_PAR_DEFAUT_017K3;
}

/** Materiau impose par la spec du projet. */
export function pdiMateriauDeSpec017K3(
  setup?: PdiProjectSetup,
  code?: string,
): string {
  const spec = specActive017K3(setup, code);
  return spec?.material || PDI_MATERIAU_PAR_DEFAUT_017K3;
}

/** Vrai si la classe choisie est bien celle de la spec. */
export function pdiClasseConforme017K3(
  classe: string,
  setup?: PdiProjectSetup,
  code?: string,
): boolean {
  return classe === pdiClasseDeSpec017K3(setup, code);
}

/**
 * Message de derogation. On n interdit pas : un projet reel comporte des
 * ruptures de spec. On rend la derogation visible au lieu de la subir.
 */
export function pdiMessageDerogation017K3(
  classe: string,
  attendue: string,
): string {
  return (
    "Classe " +
    classe +
    " differente de la spec du projet (" +
    attendue +
    "). La specification de tuyauterie fixe la classe de la ligne : la classe " +
    "se determine a partir de la pression et de la temperature de calcul " +
    "(table pression-temperature ASME B16.5). Verifiez la rupture de spec."
  );
}
'''


# --------------------------------------------------------------------------
# ANCRES MOTEUR
# --------------------------------------------------------------------------
ANCRE_IMPORT = ('import { PDI_ONGLETS_RUBAN_017M, PDI_INVITE_COMMANDE_017M, '
                'pdiGroupesOnglet017M, pdiEntreesGroupe017M } from '
                '"./pdiRegistreCommandes.v1";')

NOUVEL_IMPORT = ANCRE_IMPORT + "\n" + (
    'import { PDI_CLASSES_B165_017K3, PDI_DESIGNATIONS_PN_017K3, '
    'PDI_CLASSE_PAR_DEFAUT_017K3, pdiClasseDeSpec017K3, '
    'pdiMateriauDeSpec017K3, pdiClasseConforme017K3, '
    'pdiMessageDerogation017K3 } from "./pdiClassePression017K3";'
)

ANCRE_PN = 'const [newPN,setNewPN]=useState("Class 600");'
NOUVEAU_PN = ('const [newPN,setNewPN]=useState(()=>'
              'pdiClasseDeSpec017K3(projectSetup));'
              '  // 017K3 : la spec fixe la classe, pas une valeur en dur.')

ANCRE_MAT = 'const [newMaterial,setNewMaterial]=useState("Acier API 5L Gr. B");'
NOUVEAU_MAT = ('const [newMaterial,setNewMaterial]=useState(()=>'
               'pdiMateriauDeSpec017K3(projectSetup));'
               '  // 017K3 : materiau lu dans la spec.')

ANCRE_CLASSE_DURE = 'pressureClass:"Class 600"'
NOUVELLE_CLASSE_DURE = 'pressureClass:PDI_CLASSE_PAR_DEFAUT_017K3'

ANCRE_ADDSEGMENT = "  const addSegment=()=>{"

AIDE_DEROGATION = '''  // PATCH 017K3 : signaler une classe qui s ecarte de la spec du projet.
  // On n interdit pas la derogation : une rupture de spec est legitime dans
  // un projet reel. On la rend visible, conformement au principe des
  // specifications de tuyauterie ou la classe appartient a la ligne.
  const pdiSignalerClasse017K3 = (classe: string) => {
    if (pdiClasseConforme017K3(classe, projectSetup)) return;
    setStatusMessage(
      pdiMessageDerogation017K3(classe, pdiClasseDeSpec017K3(projectSetup)),
    );
  };

'''

ANCRE_ONCHANGE = ('<select value={newPN} onChange={e=>setNewPN(e.target.value)}')
NOUVEAU_ONCHANGE = ('<select value={newPN} onChange={e=>{setNewPN(e.target.value);'
                    'pdiSignalerClasse017K3(e.target.value);}}')

ANCRE_OPTIONS_INLINE = ('<option>PN16</option><option>PN40</option>'
                        '<option>Class 150</option><option>Class 300</option>'
                        '<option>Class 600</option>')

MOTIF_OPTIONS_BLOC = re.compile(
    r'\n(\s*)<option>PN16</option>'
    r'\n\s*<option>PN40</option>'
    r'\n\s*<option>Class 150</option>'
    r'\n\s*<option>Class 300</option>'
    r'\n\s*<option>Class 600</option>'
)

CLASSES = ["Class 150", "Class 300", "Class 400", "Class 600",
           "Class 900", "Class 1500", "Class 2500"]
PN = ["PN16", "PN40"]


def options_inline():
    return "".join("<option>%s</option>" % v for v in CLASSES + PN)


def options_bloc(indent):
    lignes = ["%s<option>%s</option>" % (indent, v) for v in CLASSES + PN]
    return "\n" + "\n".join(lignes)


# --------------------------------------------------------------------------
# PROGRAMME
# --------------------------------------------------------------------------
def main():
    racine = trouver_racine()
    chemin_moteur = os.path.join(racine, REL_MOTEUR)
    chemin_module = os.path.join(racine, REL_MODULE)
    chemin_version = os.path.join(racine, REL_VERSION)

    print("=" * 72)
    print("PATCH %s - LA CLASSE DE PRESSION VIENT DE LA SPEC" % PATCH)
    print("=" * 72)
    print("Projet : %s" % racine)

    # --- 1. prerequis ---
    print("\n--- 1. Prerequis ---")
    moteur = lire(chemin_moteur)
    if "pdiFindSpec" not in moteur:
        raise SystemExit("ARRET : pdiFindSpec absent du moteur.")
    if "projectSetup" not in moteur:
        raise SystemExit("ARRET : projectSetup absent du moteur.")
    print("  OK    systeme de specs present (pdiFindSpec, projectSetup)")

    # --- 2. module de conformite ---
    print("\n--- 2. Module de conformite aux normes ---")
    if os.path.exists(chemin_module) and "PDI_CLASSES_B165_017K3" in \
            lire(chemin_module):
        deja("module pdiClassePression017K3.ts present")
    else:
        ecrire(chemin_module, MODULE_TS)
        note(os.path.exists(chemin_module),
             "module pdiClassePression017K3.ts cree (7 classes ASME B16.5)")

    # --- 3. branchement ---
    print("\n--- 3. Branchement dans le moteur ---")
    sauvegarder(chemin_moteur)

    if "pdiClassePression017K3" in moteur:
        deja("le moteur importe deja le module")
    else:
        if ANCRE_IMPORT not in moteur:
            raise SystemExit("ARRET : ligne d import du registre introuvable.")
        moteur = moteur.replace(ANCRE_IMPORT, NOUVEL_IMPORT, 1)
        note("pdiClassePression017K3" in moteur, "import ajoute")

    if ANCRE_PN in moteur:
        moteur = moteur.replace(ANCRE_PN, NOUVEAU_PN, 1)
        note("pdiClasseDeSpec017K3(projectSetup))" in moteur,
             "classe par defaut lue dans la spec (au lieu de Class 600 en dur)")
    elif "pdiClasseDeSpec017K3(projectSetup))" in moteur:
        deja("la classe par defaut est deja lue dans la spec")
    else:
        raise SystemExit("ARRET : etat newPN introuvable.")

    if ANCRE_MAT in moteur:
        moteur = moteur.replace(ANCRE_MAT, NOUVEAU_MAT, 1)
        note("pdiMateriauDeSpec017K3(projectSetup))" in moteur,
             "materiau par defaut lu dans la spec")
    elif "pdiMateriauDeSpec017K3(projectSetup))" in moteur:
        deja("le materiau par defaut est deja lu dans la spec")
    else:
        note(False, "etat newMaterial introuvable")

    n_dur = moteur.count(ANCRE_CLASSE_DURE)
    if n_dur:
        moteur = moteur.replace(ANCRE_CLASSE_DURE, NOUVELLE_CLASSE_DURE)
        note(moteur.count(ANCRE_CLASSE_DURE) == 0,
             "%d ligne(s) de repli : Class 600 en dur remplace par la spec"
             % n_dur)
    else:
        deja("aucune classe en dur dans les lignes de repli")

    # --- 4. derogation visible ---
    print("\n--- 4. Derogation signalee, jamais bloquee ---")
    if "pdiSignalerClasse017K3" in moteur:
        deja("le controle de derogation est en place")
    else:
        if ANCRE_ADDSEGMENT not in moteur:
            raise SystemExit("ARRET : addSegment introuvable.")
        moteur = moteur.replace(ANCRE_ADDSEGMENT,
                                AIDE_DEROGATION + ANCRE_ADDSEGMENT, 1)
        if ANCRE_ONCHANGE not in moteur:
            raise SystemExit("ARRET : liste deroulante de classe introuvable.")
        moteur = moteur.replace(ANCRE_ONCHANGE, NOUVEAU_ONCHANGE, 1)
        note("pdiSignalerClasse017K3(e.target.value)" in moteur,
             "changer de classe hors spec affiche un avertissement")

    # --- 5. les sept classes ASME B16.5 ---
    print("\n--- 5. Les sept classes de l ASME B16.5 dans les listes ---")
    if "<option>Class 2500</option>" in moteur:
        deja("les sept classes sont deja proposees")
    else:
        avant = moteur
        if ANCRE_OPTIONS_INLINE in moteur:
            moteur = moteur.replace(ANCRE_OPTIONS_INLINE, options_inline())
        moteur = MOTIF_OPTIONS_BLOC.sub(
            lambda m: options_bloc(m.group(1)), moteur)
        note(moteur != avant and moteur.count("<option>Class 2500</option>") >= 3,
             "%d listes completees : 150, 300, 400, 600, 900, 1500, 2500 "
             "(+ PN16 et PN40 pour GRE et PE100)"
             % moteur.count("<option>Class 2500</option>"))

    ecrire(chemin_moteur, moteur)

    # --- 6. pastille ---
    print("\n--- 6. Pastille de version ---")
    version = lire(chemin_version)
    if 'PDI_PATCH_VERSION = "%s"' % PATCH in version:
        deja("la pastille affiche %s" % PATCH)
    else:
        sauvegarder(chemin_version)
        version = re.sub(r'PDI_PATCH_VERSION\s*=\s*"[^"]*"',
                         'PDI_PATCH_VERSION = "%s"' % PATCH, version, count=1)
        note('"%s"' % PATCH in version, "pastille passee a %s" % PATCH)
        ecrire(chemin_version, version)

    # --- bilan ---
    ok = sum(1 for v, _ in verifs if v)
    print("\n" + "=" * 72)
    print("VERIFICATIONS : %d/%d" % (ok, len(verifs)))
    print("=" * 72)
    if ok != len(verifs):
        for v, libelle in verifs:
            if not v:
                print("  ECHEC : %s" % libelle)
        sys.exit(1)

    print("""
A TESTER APRES CE PATCH
  1. Pastille : 017K3.
  2. Ouvrez le formulaire AJOUTER UN TRONCON. La classe proposee doit etre
     Class 150 et le materiau Acier carbone, parce que la spec de votre
     projet est CS150. Plus de Class 600 ni d Acier API 5L Gr. B imposes.
  3. Ouvrez la liste des classes : sept entrees ASME B16.5 (150, 300, 400,
     600, 900, 1500, 2500) plus PN16 et PN40 pour les specs GRE et PE100.
  4. Choisissez Class 600 alors que la spec est CS150 : un message doit
     apparaitre en bas expliquant la rupture de spec. Le choix reste
     accepte : c est un avertissement, pas un blocage.
  5. Revenez a Class 150 : le message ne doit plus reapparaitre.
  6. Creez un troncon : son tag doit rester coherent (…-CS150) et sa classe
     doit correspondre.
  7. Non-regression : ANOMALIES reste a 0 sur un reseau sain, la longueur 0
     est toujours refusee, et le ruban 017M2 repond comme avant.

RESTE AU 017L (debranding), comme vous l avez demande : suppression de
'8" Constantine', du projet de demonstration et de toutes les autres saisies
d exemple, les 2 CDN externes, les 8 window.confirm, et les points d audit
R19 encore ouverts.
""")


if __name__ == "__main__":
    main()
