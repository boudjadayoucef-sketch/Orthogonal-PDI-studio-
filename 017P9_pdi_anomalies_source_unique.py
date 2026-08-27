#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PATCH 017P9 - SOURCE UNIQUE DES ANOMALIES
Projet PD&I - Youcef Boudjada
Date : 2026-08-27

OBJET
  Jusqu au 017P8, deux jeux de regles d anomalies coexistaient sans se parler :
    (a) validateProjectGraph (moteur, ligne 544) : 7 codes structurels, qui
        alimentent le bandeau haut, le panneau Controle du reseau et la barre
        d etat.
    (b) le volet Anomalies du 017F2 : 4 regles supplementaires recalculees
        DANS le JSX au moment du rendu, que le premier jeu ignore.
  D ou l affichage contradictoire "2 erreur(s)" en haut / "ANOMALIES 0" dans le
  volet. Ce ne sont pas deux calculs du meme controle, ce sont deux controles
  differents.

  Le 017P9 cree un module unique qui fait l UNION des deux jeux (11 codes),
  branche les quatre points d affichage dessus, et supprime le calcul en ligne
  du JSX. Le clic-vers-entite du 017F2 est conserve.

  Le 017P9 corrige aussi un oubli du 017P8 : la pastille de version affichait
  encore 017P7.

CE QUE LE PATCH NE FAIT PAS
  Aucune regle metier nouvelle (epaisseur, pression, materiau). Le 017P9
  unifie, il n invente pas de controle. Les regles nouvelles iront au 018 avec
  la Line List. Ce patch ne touche pas non plus a l impression, qui est le
  jalon 020F.

UTILISATION (aucune connaissance de developpement requise)
  1. Poser ce fichier a la racine du projet, a cote du dossier src.
  2. Double-cliquer, ou dans un terminal :  python 017P9_pdi_anomalies_source_unique.py
  3. Lire le rapport affiche a la fin. Il doit finir par : VERIFICATIONS : n/n

GARANTIES (regles R1 et R29)
  - Idempotent : relancer le patch ne casse rien, il affiche "DEJA :".
  - Sauvegarde .before017P9 creee avant toute modification.
  - Lecture auto-reparante : si un fichier moteur porte la queue compressee
    constatee le 27/08, le patch la recolle au lieu d echouer.
  - Ecriture atomique, puis relecture et comparaison octet par octet. Le patch
    ne peut pas annoncer un succes qu il n a pas obtenu.
  - Aucune dependance a installer, aucun acces reseau (R7).
"""

import hashlib
import os
import shutil
import sys
import tempfile
import zlib

PATCH = "017P9"
SUFFIXE_SAUVEGARDE = ".before017P9"

RELATIF_MOTEUR = os.path.join("src", "pdi", "isometric", "engine", "IsometrieModuleV48d.tsx")
RELATIF_VERSION = os.path.join("src", "pdi", "pdiVersion.ts")
RELATIF_MODULE = os.path.join("src", "pdi", "isometric", "engine", "pdiAnomalies017P9.ts")

verifications = []
journal = []


def note(ok, libelle):
    verifications.append((bool(ok), libelle))
    print(("  OK   " if ok else "  ECHEC ") + libelle)


def deja(libelle):
    verifications.append((True, libelle))
    print("  DEJA : " + libelle)


# ---------------------------------------------------------------------------
# Socle d entrees/sorties (regle R29, integre pour ne livrer qu un seul fichier)
# ---------------------------------------------------------------------------

ENTETES_ZLIB = (b"\x78\x01", b"\x78\x5e", b"\x78\x9c", b"\x78\xda")


def _tenter_recollage(donnees):
    """Retourne le texte recolle si le fichier porte une queue zlib, sinon None.

    Piege a connaitre : l en-tete zlib est 78 9c. L octet 0x78 se lit "x" en
    ASCII, donc Python signale l erreur UTF-8 a l octet SUIVANT le debut du
    flux. Couper a l offset de l erreur laisse un "x" parasite dans le code.
    Il faut donc localiser l en-tete, pas se fier a l offset de l erreur.
    """
    try:
        donnees.decode("utf-8")
        return None
    except UnicodeDecodeError as err:
        approx = err.start

    for delta in range(-16, 17):
        pos = approx + delta
        if pos < 1 or pos + 2 > len(donnees):
            continue
        if donnees[pos:pos + 2] not in ENTETES_ZLIB:
            continue
        try:
            queue = zlib.decompressobj(15).decompress(donnees[pos:])
        except zlib.error:
            continue
        recolle = donnees[:pos] + queue
        try:
            texte = recolle.decode("utf-8")
        except UnicodeDecodeError:
            continue
        journal.append(
            "RECOLLAGE %s : flux zlib a l octet %d, %d octets restitues"
            % (os.path.basename(getattr(_tenter_recollage, "_chemin", "?")), pos, len(queue))
        )
        return texte
    return None


def lire(chemin):
    with open(chemin, "rb") as flux:
        donnees = flux.read()
    try:
        return donnees.decode("utf-8")
    except UnicodeDecodeError:
        pass
    _tenter_recollage._chemin = chemin
    texte = _tenter_recollage(donnees)
    if texte is None:
        raise SystemExit(
            "ARRET : %s n est pas lisible et n a pas pu etre reconstitue.\n"
            "        Recuperez une copie saine de ce fichier avant de relancer." % chemin
        )
    secours = chemin + ".beforerepair"
    if not os.path.exists(secours):
        with open(secours, "wb") as flux:
            flux.write(donnees)
    with open(chemin, "w", encoding="utf-8", newline="") as flux:
        flux.write(texte)
    print("  REPARE : %s (copie d origine dans %s)" % (os.path.basename(chemin), os.path.basename(secours)))
    return texte


def ecrire(chemin, texte):
    """Ecriture atomique, puis relecture et comparaison octet par octet."""
    attendu = texte.encode("utf-8")
    dossier = os.path.dirname(os.path.abspath(chemin))
    descripteur, provisoire = tempfile.mkstemp(dir=dossier, suffix=".pditmp")
    try:
        with os.fdopen(descripteur, "wb") as flux:
            flux.write(attendu)
            flux.flush()
            os.fsync(flux.fileno())
        os.replace(provisoire, chemin)
    except BaseException:
        if os.path.exists(provisoire):
            os.unlink(provisoire)
        raise
    with open(chemin, "rb") as flux:
        relu = flux.read()
    if relu != attendu:
        raise SystemExit(
            "ARRET : %s n a pas ete ecrit correctement (%d octets attendus, %d relus)."
            % (chemin, len(attendu), len(relu))
        )
    journal.append("ECRITURE %s : %d octets, relu et verifie" % (os.path.basename(chemin), len(attendu)))


def empreinte(chemin):
    with open(chemin, "rb") as flux:
        return hashlib.md5(flux.read()).hexdigest()


def sauvegarder(chemin):
    copie = chemin + SUFFIXE_SAUVEGARDE
    if not os.path.exists(copie):
        shutil.copy2(chemin, copie)
        print("  SAUVEGARDE : " + os.path.basename(copie))
    return copie


def trouver_racine():
    """Cherche la racine du projet depuis le dossier courant, puis vers le haut."""
    candidats = [os.getcwd(), os.path.dirname(os.path.abspath(__file__))]
    for depart in candidats:
        courant = depart
        for _ in range(6):
            if os.path.isfile(os.path.join(courant, RELATIF_MOTEUR)):
                return courant
            parent = os.path.dirname(courant)
            if parent == courant:
                break
            courant = parent
    return None


# ---------------------------------------------------------------------------
# Contenu du nouveau module : la source unique des anomalies
# ---------------------------------------------------------------------------

MODULE_TS = u'''// PATCH 017P9 : SOURCE UNIQUE DES ANOMALIES DU RESEAU PD&I.
//
// Ce fichier est le SEUL endroit du projet ou une regle d anomalie est ecrite.
// Avant le 017P9, deux jeux de regles coexistaient sans se connaitre :
//   (a) validateProjectGraph (IsometrieModuleV48d.tsx) : 7 codes structurels,
//       affiches par le bandeau haut, le panneau Controle du reseau et la
//       barre d etat.
//   (b) le volet Anomalies du 017F2 : 4 regles recalculees dans le JSX, que le
//       jeu (a) ignorait totalement. D ou "2 erreur(s)" en haut et
//       "ANOMALIES 0" juste a cote.
//
// pdiUnifyAnomalies017P9 prend la liste du jeu (a) et y ajoute les regles du
// jeu (b), sans doublon. Resultat : 11 codes, une seule liste, quatre points
// d affichage servis par la meme verite.
//
// Regle : toute regle d anomalie nouvelle s ajoute ICI, et nulle part ailleurs.

export type PdiSeverite017P9 = "error" | "warning";

export interface PdiAnomalie017P9 {
  id: string;
  severity: PdiSeverite017P9;
  code: string;
  message: string;
  entityId?: string;
}

// Vues minimales des entites. On ne reimporte pas IsoNode / IsoSegment depuis
// IsometrieModuleV48d.tsx pour ne pas creer de dependance circulaire.
export interface PdiNoeudVu017P9 {
  id: string;
  name?: string;
  type?: string;
  equipmentType?: string;
}

export interface PdiTronconVu017P9 {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  dn?: number;
  length?: number;
  tag?: string;
  spec?: string;
}

// Les 11 codes. Les 7 premiers viennent de validateProjectGraph, les 4 derniers
// du volet Anomalies du 017F2.
export const PDI_ANOMALIE_CODES_017P9 = [
  "MISSING_NODE",
  "MISSING_PORT",
  "MISSING_LINE",
  "ZERO_LENGTH",
  "PORT_CAPACITY",
  "DN_MISMATCH",
  "ISOLATED_EQUIPMENT",
  "SEGMENT_UNTAGGED",
  "NODE_ISOLATED",
  "TEE_INCOMPLETE",
  "SPEC_DN_VIOLATION",
];

// Libelle court, pour le volet lateral ou la place manque.
export const PDI_ANOMALIE_LIBELLES_017P9: Record<string, string> = {
  MISSING_NODE: "Noeud absent",
  MISSING_PORT: "Port invalide",
  MISSING_LINE: "Ligne de tuyauterie absente",
  ZERO_LENGTH: "Longueur nulle",
  PORT_CAPACITY: "Port surcharge",
  DN_MISMATCH: "DN incoherent",
  ISOLATED_EQUIPMENT: "Equipement non raccorde",
  SEGMENT_UNTAGGED: "Troncon non tagge",
  NODE_ISOLATED: "Noeud isole",
  TEE_INCOMPLETE: "Te incomplet",
  SPEC_DN_VIOLATION: "DN hors spec",
};

export function pdiAnomalieLibelle017P9(issue: PdiAnomalie017P9): string {
  return PDI_ANOMALIE_LIBELLES_017P9[issue.code] || issue.code;
}

// Le volet Anomalies a besoin de savoir s il doit selectionner un noeud ou un
// troncon quand l utilisateur clique la ligne.
export function pdiAnomalieKind017P9(
  issue: PdiAnomalie017P9,
  nodes: PdiNoeudVu017P9[],
): "node" | "segment" {
  const cible = issue.entityId || issue.id;
  return nodes.some((n) => n.id === cible) ? "node" : "segment";
}

/**
 * Union des deux jeux de regles.
 *
 * @param base      liste produite par validateProjectGraph (jeu a)
 * @param nodes     noeuds du projet
 * @param segments  troncons du projet
 * @param specAutorise  rappel fourni par l appelant : (codeSpec, dn) => boolean.
 *                  Passe en parametre pour que ce module reste sans dependance.
 */
export function pdiUnifyAnomalies017P9(
  base: PdiAnomalie017P9[],
  nodes: PdiNoeudVu017P9[],
  segments: PdiTronconVu017P9[],
  specAutorise?: (codeSpec: string, dn: number) => boolean,
): PdiAnomalie017P9[] {
  const issues: PdiAnomalie017P9[] = base.slice();

  const cleDe = (a: PdiAnomalie017P9) => a.code + "|" + (a.entityId || a.id);
  const vues = new Set(issues.map(cleDe));
  const ajoute = (a: PdiAnomalie017P9) => {
    const cle = cleDe(a);
    if (!vues.has(cle)) {
      vues.add(cle);
      issues.push(a);
    }
  };

  // Deja signale par le jeu (a) : on ne redit pas la meme chose autrement.
  const longueurDejaVue = new Set(
    base.filter((i) => i.code === "ZERO_LENGTH").map((i) => i.entityId || i.id),
  );
  const equipementDejaIsole = new Set(
    base.filter((i) => i.code === "ISOLATED_EQUIPMENT").map((i) => i.entityId || i.id),
  );

  // Nombre de raccordements par noeud, calcule une seule fois.
  const raccordements = new Map<string, number>();
  for (const seg of segments) {
    raccordements.set(seg.fromNodeId, (raccordements.get(seg.fromNodeId) || 0) + 1);
    raccordements.set(seg.toNodeId, (raccordements.get(seg.toNodeId) || 0) + 1);
  }

  for (const seg of segments) {
    // Regle volet 1 : troncon sans tag industriel.
    if (!seg.tag) {
      ajoute({
        id: "untagged_" + seg.id,
        severity: "warning",
        code: "SEGMENT_UNTAGGED",
        message: "Troncon " + seg.id + " : aucun tag industriel",
        entityId: seg.id,
      });
    }

    // Complement du jeu (a) : validateProjectGraph teste length <= 0.001, ce qui
    // laisse passer une longueur non renseignee (NaN). On comble le trou sous le
    // code existant plutot que d en inventer un nouveau.
    const longueur = Number(seg.length);
    if (!(longueur > 0) && !longueurDejaVue.has(seg.id)) {
      ajoute({
        id: "length_nr_" + seg.id,
        severity: "error",
        code: "ZERO_LENGTH",
        message: "Troncon " + seg.id + " : longueur non renseignee",
        entityId: seg.id,
      });
    }

    // Regle volet 2 : DN hors de la spec affectee au troncon.
    if (seg.spec && typeof specAutorise === "function" && !specAutorise(seg.spec, Number(seg.dn))) {
      ajoute({
        id: "spec_" + seg.id,
        severity: "error",
        code: "SPEC_DN_VIOLATION",
        message: "Troncon " + seg.id + " : DN" + String(seg.dn) + " hors spec " + seg.spec,
        entityId: seg.id,
      });
    }
  }

  for (const node of nodes) {
    const relies = raccordements.get(node.id) || 0;

    // Regle volet 3 : noeud isole. Le jeu (a) ne signalait que les equipements ;
    // le volet signalait tous les noeuds. On garde la portee large, sans
    // doublonner ce que le jeu (a) a deja dit.
    if (relies === 0) {
      if (!equipementDejaIsole.has(node.id)) {
        ajoute({
          id: "isole_" + node.id,
          severity: "warning",
          code: "NODE_ISOLATED",
          message: (node.name || node.id) + " n est raccorde a aucun troncon",
          entityId: node.id,
        });
      }
      continue;
    }

    // Regle volet 4 : te a moins de trois branches.
    if (node.type === "tee" && relies < 3) {
      ajoute({
        id: "te_" + node.id,
        severity: "warning",
        code: "TEE_INCOMPLETE",
        message: (node.name || node.id) + " : te incomplet (" + String(relies) + " branche(s))",
        entityId: node.id,
      });
    }
  }

  return issues;
}
'''

# ---------------------------------------------------------------------------
# Fragments recherches et remplaces
# ---------------------------------------------------------------------------

ANCIEN_IMPORT = 'import { pdiGlyphScale017P5 } from "./pdiGlyphes017P5";'
NOUVEL_IMPORT = (
    'import { pdiGlyphScale017P5 } from "./pdiGlyphes017P5";\n'
    '// PATCH 017P9 : source unique des anomalies (11 codes, un seul module).\n'
    'import { pdiUnifyAnomalies017P9, pdiAnomalieKind017P9, pdiAnomalieLibelle017P9 } from "./pdiAnomalies017P9";'
)

ANCIEN_MEMO = (
    '  const graphIssues=useMemo(()=>validateProjectGraph(nodes,segments,lines),'
    '[nodes,segments,lines]);'
)
NOUVEAU_MEMO = (
    '  // PATCH 017P9 : le graphe d anomalies est desormais l union des deux jeux\n'
    '  // de regles. Bandeau, panneau Controle du reseau, volet Anomalies et barre\n'
    '  // d etat lisent tous cette seule liste.\n'
    '  const graphIssues=useMemo(()=>pdiUnifyAnomalies017P9('
    'validateProjectGraph(nodes,segments,lines),nodes,segments,'
    '(codeSpec:string,dn:number)=>{const so=pdiFindSpec(projectSetup,codeSpec);'
    'return so?pdiSpecAllowsDn(so,dn):true;}),[nodes,segments,lines,projectSetup]);'
)

ANCIEN_VOLET = "\n".join([
    '                const issues: Array<{ id: string; kind: "segment" | "node"; label: string }> = [];',
    '                segments.forEach((s) => {',
    '                  const specObj = s.spec ? pdiFindSpec(projectSetup, s.spec) : undefined;',
    '                  if (specObj && !pdiSpecAllowsDn(specObj, Number(s.dn))) {',
    '                    issues.push({ id: s.id, kind: "segment", label: "DN" + String(s.dn) + " hors spec " + specObj.code });',
    '                  }',
    '                  if (!s.tag) issues.push({ id: s.id, kind: "segment", label: "Troncon non tagge" });',
    '                  if (!(Number(s.length) > 0)) issues.push({ id: s.id, kind: "segment", label: "Longueur nulle" });',
    '                });',
    '                nodes.forEach((n) => {',
    '                  const linked = segments.filter((s) => s.fromNodeId === n.id || s.toNodeId === n.id).length;',
    '                  if (linked === 0) issues.push({ id: n.id, kind: "node", label: "Noeud isole" });',
    '                  else if (n.type === "tee" && linked < 3) {',
    '                    issues.push({ id: n.id, kind: "node", label: "Te incomplet (" + String(linked) + " branche(s))" });',
    '                  }',
    '                });',
])

NOUVEAU_VOLET = "\n".join([
    '                // PATCH 017P9 : le volet ne calcule plus ses propres regles. Il lit la',
    '                // source unique (graphIssues). Le clic-vers-entite du 017F2 est conserve.',
    '                const issues: Array<{ id: string; kind: "segment" | "node"; label: string }> =',
    '                  graphIssues.map((issue) => ({',
    '                    id: issue.entityId || issue.id,',
    '                    kind: pdiAnomalieKind017P9(issue, nodes),',
    '                    label: pdiAnomalieLibelle017P9(issue),',
    '                  }));',
])


def main():
    print("=" * 72)
    print("PATCH %s - SOURCE UNIQUE DES ANOMALIES" % PATCH)
    print("=" * 72)

    racine = trouver_racine()
    if racine is None:
        print("")
        print("ARRET : je ne trouve pas le projet.")
        print("        Placez ce fichier a la racine du projet, la ou se trouve le")
        print("        dossier 'src', puis relancez-le.")
        return 2
    print("Projet : %s" % racine)

    chemin_moteur = os.path.join(racine, RELATIF_MOTEUR)
    chemin_version = os.path.join(racine, RELATIF_VERSION)
    chemin_module = os.path.join(racine, RELATIF_MODULE)

    print("")
    print("--- 1. Lecture du moteur ---")
    tsx = lire(chemin_moteur)
    md5_avant = empreinte(chemin_moteur)
    print("  %d octets, %d lignes, MD5 %s" % (len(tsx.encode("utf-8")), tsx.count("\n"), md5_avant))

    print("")
    print("--- 2. Module pdiAnomalies017P9.ts ---")
    if os.path.isfile(chemin_module) and "pdiUnifyAnomalies017P9" in lire(chemin_module):
        deja("le module de source unique existe")
    else:
        ecrire(chemin_module, MODULE_TS)
        note(os.path.isfile(chemin_module), "module de source unique cree (11 codes)")
    contenu_module = lire(chemin_module)
    note("pdiUnifyAnomalies017P9" in contenu_module, "fonction d union exportee")
    note("pdiAnomalieKind017P9" in contenu_module, "aide au clic-vers-entite exportee")
    note("pdiAnomalieLibelle017P9" in contenu_module, "libelles courts exportes")
    note(contenu_module.count('"SPEC_DN_VIOLATION"') >= 1, "code SPEC_DN_VIOLATION declare")
    note(contenu_module.count('"TEE_INCOMPLETE"') >= 1, "code TEE_INCOMPLETE declare")

    print("")
    print("--- 3. Branchement dans le moteur ---")
    sauvegarder(chemin_moteur)

    if "pdiAnomalies017P9" in tsx:
        deja("le moteur importe le module de source unique")
    elif ANCIEN_IMPORT in tsx:
        tsx = tsx.replace(ANCIEN_IMPORT, NOUVEL_IMPORT, 1)
        note("pdiAnomalies017P9" in tsx, "import du module ajoute")
    else:
        note(False, "import du module : ancre d import introuvable")

    if "pdiUnifyAnomalies017P9(" in tsx and "graphIssues=useMemo" in tsx:
        deja("graphIssues est deja alimente par l union")
    elif ANCIEN_MEMO in tsx:
        tsx = tsx.replace(ANCIEN_MEMO, NOUVEAU_MEMO, 1)
        note("pdiUnifyAnomalies017P9(validateProjectGraph" in tsx, "graphIssues branche sur l union")
    else:
        note(False, "graphIssues : ancre du useMemo introuvable")

    print("")
    print("--- 4. Volet Anomalies : suppression du calcul en ligne ---")
    if "pdiAnomalieKind017P9(issue, nodes)" in tsx:
        deja("le volet lit deja la source unique")
    elif ANCIEN_VOLET in tsx:
        tsx = tsx.replace(ANCIEN_VOLET, NOUVEAU_VOLET, 1)
        note("pdiAnomalieKind017P9(issue, nodes)" in tsx, "calcul en ligne du JSX remplace")
    else:
        note(False, "volet Anomalies : ancre du calcul en ligne introuvable")

    note('label: "Troncon non tagge"' not in tsx, "plus aucune regle ecrite dans le JSX")
    note("selectSegmentV44(issue.id, false)" in tsx, "clic-vers-entite du 017F2 conserve")
    note("Aucune anomalie detectee." in tsx, "message du volet conserve")
    note("graphIssues.slice(0,8)" in tsx, "infobulle du bandeau conservee (point 1)")
    note("CONTROLE RESEAU :" in tsx, "detail en barre d etat conserve (point 2)")
    note("erreur(s) réseau" in tsx, "compteur de la barre d etat conserve (point 3)")

    print("")
    print("--- 5. Ecriture du moteur ---")
    ecrire(chemin_moteur, tsx)
    md5_apres = empreinte(chemin_moteur)
    print("  MD5 avant %s" % md5_avant)
    print("  MD5 apres %s" % md5_apres)

    print("")
    print("--- 6. Pastille de version (oubli du 017P8) ---")
    version = lire(chemin_version)
    if 'PDI_PATCH_VERSION = "017P9"' in version:
        deja("la pastille affiche 017P9")
    else:
        sauvegarder(chemin_version)
        import re as _re
        version = _re.sub(
            r'PDI_PATCH_VERSION\s*=\s*"[^"]*"',
            'PDI_PATCH_VERSION = "017P9"',
            version,
            count=1,
        )
        version = _re.sub(
            r'PDI_PATCH_DATE\s*=\s*"[^"]*"',
            'PDI_PATCH_DATE = "2026-08-27"',
            version,
            count=1,
        )
        ecrire(chemin_version, version)
        note('PDI_PATCH_VERSION = "017P9"' in lire(chemin_version), "pastille de version passee a 017P9")

    print("")
    print("=" * 72)
    reussies = sum(1 for ok, _ in verifications if ok)
    total = len(verifications)
    print("VERIFICATIONS : %d/%d" % (reussies, total))
    for ligne in journal:
        print("  " + ligne)
    print("=" * 72)

    if reussies != total:
        print("")
        print("Des verifications ont echoue. Les sauvegardes %s sont en place :" % SUFFIXE_SAUVEGARDE)
        print("  renommez-les sans le suffixe pour revenir en arriere.")
        return 1

    print("")
    print("A TESTER APRES CE PATCH")
    print("  1. La pastille devant votre nom doit afficher 017P9.")
    print("  2. Creer un troncon sans tag : le volet Anomalies doit afficher")
    print("     'Troncon non tagge', et le compteur du bandeau doit bouger aussi.")
    print("  3. Supprimer un noeud portant un troncon : le nombre affiche en haut")
    print("     et le nombre affiche dans le volet doivent etre IDENTIQUES.")
    print("  4. Cliquer une ligne du volet : l entite doit se selectionner et le")
    print("     panneau de proprietes s ouvrir, comme avant.")
    print("  5. Un projet sain doit afficher 'Graphe valide' en haut ET")
    print("     'Aucune anomalie detectee.' dans le volet, jamais l un sans l autre.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
