#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PATCH 017M - REGISTRE UNIQUE DE COMMANDES + RUBAN A 9 ONGLETS
Projet PD&I - Youcef Boudjada
Date : 2026-08-27

CE PATCH ABSORBE 017M1 + 017M2 + 017M3 + 017N + 017Q1.

POURQUOI
  Vos captures du 27/08 montrent neuf entrees en haut : Fichier, Edition,
  Affichage, Dessin, Cotation, Alignement, Insertion, Impression, Outils.
  Le compte tombe juste PAR HASARD : ce sont les anciens menus deroulants, pas
  le ruban arbitre. Il manque Annoter, Precision, 3D et Donnees, et Impression
  occupe un onglet alors qu elle doit etre un groupe de Fichier.

  Trois sources concurrentes decrivaient les commandes, sans jamais se parler :
    - 47 entrees de menu ecrites a la main dans le moteur (lignes 5639-5735) ;
    - AUTOCAD_COMMANDS, 46 commandes (CadAutocadEngine.ts ligne 261) ;
    - PDI_PLANT3D_COMMAND_TABLE, 56 commandes (ligne 752).
  Une commande pouvait donc exister dans la ligne de commande sans figurer dans
  aucun menu, et inversement. C est la Regle 8 qui n etait pas tenable.

  Constat annexe verifie dans le code : les classes CSS .pdi-cad-ribbon et
  .pdi-ribbon-group sont DEFINIES (lignes 5796-5800) mais utilisees NULLE PART
  dans le JSX. Un ruban avait ete style puis jamais construit. Ce patch les
  reutilise : aucun style en double n est cree.

CE QUE FAIT LE PATCH
  1. Cree src/pdi/isometric/engine/pdiRegistreCommandes.v1.ts : la description
     unique et bilingue du ruban. 9 onglets, leurs groupes, et pour chaque
     commande : nom francais, nom anglais, alias, icone, raccourci, onglet,
     groupe, ordre, portee, etat.
  2. Construit le ruban a 9 onglets a partir de ce registre.
  3. IMPORTANT - il ne reecrit AUCUNE des 47 actions existantes. Le registre les
     designe par (groupe, index) et le ruban les reutilise telles quelles. Le
     code qui fonctionne n est pas touche. C est ce qui rend ce patch sur.
  4. Declare en GRISE, avec infobulle indiquant le jalon, tout ce qui n existe
     pas encore : 3D, Donnees (Line List, Metre, BOM genie civil, Catalogue),
     supports et massifs (019S+), textes et reperes (019B), export PDF/DXF
     (020F), import Sketch-to-ISO (R23), et Grouper / Associer / Bloc (017Q1).
     Une commande grisee est VISIBLE mais non cliquable : elle annonce la
     feuille de route au lieu de la cacher.
  5. Supprime le doublon BOM : l entree existait dans Fichier ET dans Outils.
     Le ruban ne la declare qu une fois, dans Donnees. 46 des 47 entrees sont
     reprises, la 47e est ce doublon, retire volontairement.
  6. Unifie l invite de la ligne de commande : elle annoncait un vocabulaire 2D
     (LIGNE, RECT, TRIANGLE) alors que le champ de saisie propose TUBE, TE,
     COUDE. L invite est desormais lue dans le registre.
  7. Ctrl+F1 replie et deplie le ruban, etat retenu dans pdi.ribbon.collapsed.v1.
  8. Incremente PDI_PATCH_VERSION a 017M.

CE QUE LE PATCH NE FAIT PAS, ET POURQUOI
  - Il ne supprime pas les 47 entrees de menu : elles restent la SOURCE DES
    ACTIONS du ruban. Elles ne sont plus affichees, donc il n y a qu une seule
    surface cliquable : pas de doublon comme celui qui a cause W002.
  - Il ne fusionne pas encore AUTOCAD_COMMANDS et PDI_PLANT3D_COMMAND_TABLE
    dans le registre. Ces deux tables alimentent la ligne de commande et les
    exports, et les brancher exige de rejouer le dispatch. Le registre est
    concu pour les accueillir : c est l etape suivante, pas celle-ci.
  - Il ne corrige pas le TROISIEME plancher silencieux, ligne 6814 :
        onChange={e=>setNewLength(Number(e.target.value)||.05)}
    C est le 0,05 visible dans votre formulaire "Ajouter un troncon". Le
    corriger proprement oblige a toucher aussi la ligne 4698
    (length:Math.max(.05,newLength)), donc le formulaire de creation. Ce
    formulaire doit de toute facon etre revu au 017K3 pour retirer les saisies
    d exemple ("8" Constantine", DN150, Class 600). Les deux corrections iront
    ensemble : un seul sujet par patch (R5).

UTILISATION
  1. Poser ce fichier a la racine du projet, a cote du dossier src.
  2. Double-cliquer, ou : python 017M_pdi_registre_commandes_ruban.py
  3. La derniere ligne doit dire : VERIFICATIONS : n/n

GARANTIES (R1 et R29) : idempotent, sauvegarde .before017M, lecture
auto-reparante, ecriture atomique relue et verifiee. Aucune dependance.
"""

import hashlib
import os
import re
import shutil
import sys
import tempfile
import zlib

PATCH = "017M"
SUFFIXE = ".before017M"

REL_MOTEUR = os.path.join("src", "pdi", "isometric", "engine", "IsometrieModuleV48d.tsx")
REL_VERSION = os.path.join("src", "pdi", "pdiVersion.ts")
REL_REGISTRE = os.path.join("src", "pdi", "isometric", "engine", "pdiRegistreCommandes.v1.ts")

# Inventaire releve dans le moteur avant modification. Si le moteur a change,
# les index du registre ne veulent plus rien dire : le patch refuse d agir.
INVENTAIRE_ATTENDU = [
    (u"Fichier", 9), (u"\u00c9dition", 9), (u"Affichage", 6), (u"Dessin", 6),
    (u"Cotation", 3), (u"Alignement", 6), (u"Insertion", 2),
    (u"Impression", 2), (u"Outils", 4),
]

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


def inventaire_menus(tsx):
    """Releve (titre, nombre d entrees) de cadMenuGroups dans le moteur."""
    lignes = tsx.split("\n")
    try:
        debut = next(i for i, l in enumerate(lignes) if "const cadMenuGroups" in l)
        fin = next(i for i in range(debut, len(lignes)) if lignes[i].rstrip() == "  ];")
    except StopIteration:
        return []
    resultat = []
    titre = None
    compte = 0
    for i in range(debut, fin + 1):
        l = lignes[i]
        m = re.match(r'\s*title:\s*"(.+?)",\s*$', l)
        if m:
            if titre is not None:
                resultat.append((titre, compte))
            titre = m.group(1)
            compte = 0
            continue
        if titre and re.match(r'\s*\{\s*label:\s*.+?,\s*(hint|run)', l):
            compte += 1
    if titre is not None:
        resultat.append((titre, compte))
    return resultat


# --------------------------------------------------------------------------
# Le registre : description unique et bilingue du ruban
# --------------------------------------------------------------------------

REGISTRE_TS = u'''// PATCH 017M : REGISTRE UNIQUE DES COMMANDES PD&I.
//
// Point de verite unique du ruban. Avant ce fichier, trois sources decrivaient
// les commandes sans se parler :
//   - 47 entrees de menu ecrites a la main dans IsometrieModuleV48d.tsx ;
//   - AUTOCAD_COMMANDS (46 commandes) dans CadAutocadEngine.ts ;
//   - PDI_PLANT3D_COMMAND_TABLE (56 commandes) dans le meme fichier.
// Une commande pouvait donc etre tapable sans etre cliquable, ou l inverse.
//
// REGLE : le ruban n affiche QUE ce qui est declare ici. Pour ajouter une
// commande au ruban, on ajoute une entree dans ce tableau. Nulle part ailleurs.
//
// COMMENT LES ACTIONS SONT RETROUVEES
// Les 47 actions existantes ne sont PAS reecrites ici : elles vivent dans le
// moteur sous forme de fermetures qui capturent l etat React, et les deplacer
// dans un module serait long et risque. Chaque entree les designe donc par
// source = { menu, index } : le titre du groupe de menu historique et le rang de
// l entree. Le moteur resout ce couple et reutilise l action telle quelle.
// C est volontairement conservateur : le code qui fonctionne n est pas touche.
//
// ETAT DES ENTREES
//   "actif" : l action existe et repond.
//   "grise" : la commande est declaree, visible, non cliquable, et son
//             infobulle annonce le jalon qui l activera. On montre la feuille
//             de route au lieu de la cacher.

export type PdiOngletRuban017M =
  | "fichier"
  | "edition"
  | "dessin"
  | "annoter"
  | "precision"
  | "insertion"
  | "trois_d"
  | "donnees"
  | "affichage";

export type PdiEtatCommande017M = "actif" | "grise";

export type PdiPorteeCommande017M =
  | "projet"
  | "selection"
  | "vue"
  | "document"
  | "session";

export interface PdiSourceAction017M {
  /** Titre exact du groupe de menu historique dans le moteur. */
  menu: string;
  /** Rang de l entree dans ce groupe, a partir de 0. */
  index: number;
}

export interface PdiEntreeRuban017M {
  id: string;
  nomFr: string;
  nomEn: string;
  aliases: string[];
  icone: string;
  raccourci?: string;
  onglet: PdiOngletRuban017M;
  groupe: string;
  ordre: number;
  portee: PdiPorteeCommande017M;
  etat: PdiEtatCommande017M;
  source?: PdiSourceAction017M;
  /** Pour les bascules : afficher le libelle vivant plutot que nomFr. */
  suivreLibelle?: boolean;
  /** Pour les grisees : jalon qui activera la commande. */
  jalon?: string;
}

export const PDI_ONGLETS_RUBAN_017M: Array<{
  id: PdiOngletRuban017M;
  nomFr: string;
  nomEn: string;
}> = [
  { id: "fichier", nomFr: "Fichier", nomEn: "File" },
  { id: "edition", nomFr: "Edition", nomEn: "Edit" },
  { id: "dessin", nomFr: "Dessin", nomEn: "Draw" },
  { id: "annoter", nomFr: "Annoter", nomEn: "Annotate" },
  { id: "precision", nomFr: "Precision", nomEn: "Precision" },
  { id: "insertion", nomFr: "Insertion", nomEn: "Insert" },
  { id: "trois_d", nomFr: "3D", nomEn: "3D" },
  { id: "donnees", nomFr: "Donnees", nomEn: "Data" },
  { id: "affichage", nomFr: "Affichage", nomEn: "View" },
];

/** Invite de la ligne de commande, alignee sur le vocabulaire tuyauterie. */
export const PDI_INVITE_COMMANDE_017M =
  "Tapez une commande (ex: TUBE, TE, COUDE, COTER, ALIGNER, BOM...)";

export const PDI_REGISTRE_RUBAN_017M: PdiEntreeRuban017M[] = [
  // ================= 1. FICHIER =================
  { id:"fichier.nouveau", nomFr:"Nouveau projet", nomEn:"New project", aliases:["NOUVEAU","NEW"], icone:"\\u2726", onglet:"fichier", groupe:"Nouveau et ouverture", ordre:1, portee:"projet", etat:"actif", source:{menu:"Fichier",index:0} },
  { id:"fichier.accueil", nomFr:"Accueil", nomEn:"Home", aliases:["ACCUEIL","HOME"], icone:"\\u2302", onglet:"fichier", groupe:"Nouveau et ouverture", ordre:2, portee:"session", etat:"actif", source:{menu:"Fichier",index:1} },
  { id:"fichier.landing", nomFr:"Presentation", nomEn:"Landing", aliases:["LANDING"], icone:"\\u25c8", onglet:"fichier", groupe:"Nouveau et ouverture", ordre:3, portee:"session", etat:"actif", source:{menu:"Fichier",index:2} },
  { id:"fichier.ouvrir", nomFr:"Ouvrir JSON", nomEn:"Open JSON", aliases:["OUVRIR","OPEN","IMPORT"], icone:"\\u{1F4C2}", onglet:"fichier", groupe:"Nouveau et ouverture", ordre:4, portee:"projet", etat:"actif", source:{menu:"Fichier",index:6} },
  { id:"fichier.exemple.poste", nomFr:"Exemple poste", nomEn:"Station sample", aliases:["EXEMPLEPOSTE"], icone:"\\u25a6", onglet:"fichier", groupe:"Exemples", ordre:1, portee:"projet", etat:"actif", source:{menu:"Fichier",index:3} },
  { id:"fichier.exemple.gare", nomFr:"Exemple gare racleur", nomEn:"Pig trap sample", aliases:["EXEMPLEGARE"], icone:"\\u25a7", onglet:"fichier", groupe:"Exemples", ordre:2, portee:"projet", etat:"actif", source:{menu:"Fichier",index:4} },
  { id:"fichier.sauver", nomFr:"Sauver JSON", nomEn:"Save JSON", aliases:["SAUVER","SAVE","EXPORT"], icone:"\\u{1F4BE}", raccourci:"Ctrl+S", onglet:"fichier", groupe:"Enregistrement", ordre:1, portee:"projet", etat:"actif", source:{menu:"Fichier",index:7} },
  { id:"fichier.planche", nomFr:"Planche ISO A3", nomEn:"ISO sheet A3", aliases:["PLANCHE","A3"], icone:"\\u25a4", raccourci:"A3", onglet:"fichier", groupe:"Impression et export", ordre:1, portee:"document", etat:"actif", source:{menu:"Impression",index:0} },
  { id:"fichier.imprimer", nomFr:"Imprimer", nomEn:"Print", aliases:["IMPRIMER","PRINT","PLOT"], icone:"\\u2399", raccourci:"P", onglet:"fichier", groupe:"Impression et export", ordre:2, portee:"document", etat:"actif", source:{menu:"Impression",index:1} },
  { id:"fichier.export.pdf", nomFr:"Export PDF A5 a A0", nomEn:"Export PDF A5-A0", aliases:["PDF","EXPORTPDF"], icone:"\\u{1F5CE}", onglet:"fichier", groupe:"Impression et export", ordre:3, portee:"document", etat:"grise", jalon:"020F - impression et export" },
  { id:"fichier.export.dxf", nomFr:"Export DXF", nomEn:"Export DXF", aliases:["DXF","EXPORTDXF"], icone:"\\u25f1", onglet:"fichier", groupe:"Impression et export", ordre:4, portee:"document", etat:"grise", jalon:"020F - impression et export" },
  { id:"fichier.deconnexion", nomFr:"Deconnexion", nomEn:"Sign out", aliases:["DECONNEXION","LOGOUT"], icone:"\\u238b", onglet:"fichier", groupe:"Session", ordre:1, portee:"session", etat:"actif", source:{menu:"Fichier",index:8} },

  // ================= 2. EDITION =================
  { id:"edition.annuler", nomFr:"Annuler", nomEn:"Undo", aliases:["ANNULER","UNDO","U"], icone:"\\u21b6", raccourci:"Ctrl+Z", onglet:"edition", groupe:"Annulation", ordre:1, portee:"projet", etat:"actif", source:{menu:"\\u00c9dition",index:0} },
  { id:"edition.retablir", nomFr:"Retablir", nomEn:"Redo", aliases:["RETABLIR","REDO"], icone:"\\u21b7", raccourci:"Ctrl+Y", onglet:"edition", groupe:"Annulation", ordre:2, portee:"projet", etat:"actif", source:{menu:"\\u00c9dition",index:1} },
  { id:"edition.copier", nomFr:"Copier", nomEn:"Copy", aliases:["CO","CP","COPY","COPIER"], icone:"\\u29c9", raccourci:"Ctrl+C", onglet:"edition", groupe:"Presse-papiers", ordre:1, portee:"selection", etat:"actif", source:{menu:"\\u00c9dition",index:2} },
  { id:"edition.couper", nomFr:"Couper", nomEn:"Cut", aliases:["COUPER","CUT"], icone:"\\u2702", raccourci:"Ctrl+X", onglet:"edition", groupe:"Presse-papiers", ordre:2, portee:"selection", etat:"actif", source:{menu:"\\u00c9dition",index:3} },
  { id:"edition.coller", nomFr:"Coller", nomEn:"Paste", aliases:["PA","PASTE","COLLER"], icone:"\\u{1F4CB}", raccourci:"Ctrl+V", onglet:"edition", groupe:"Presse-papiers", ordre:3, portee:"selection", etat:"actif", source:{menu:"\\u00c9dition",index:4} },
  { id:"edition.dupliquer", nomFr:"Dupliquer", nomEn:"Duplicate", aliases:["DUPLIQUER","DUP"], icone:"\\u29c9", raccourci:"Ctrl+D", onglet:"edition", groupe:"Presse-papiers", ordre:4, portee:"selection", etat:"actif", source:{menu:"\\u00c9dition",index:5} },
  { id:"edition.tout", nomFr:"Tout selectionner", nomEn:"Select all", aliases:["TOUT","SELECTALL"], icone:"\\u2b1a", raccourci:"Ctrl+A", onglet:"edition", groupe:"Selection", ordre:1, portee:"selection", etat:"actif", source:{menu:"\\u00c9dition",index:6} },
  { id:"edition.deselectionner", nomFr:"Deselectionner", nomEn:"Deselect", aliases:["DESELECT"], icone:"\\u2b1c", raccourci:"Esc", onglet:"edition", groupe:"Selection", ordre:2, portee:"selection", etat:"actif", source:{menu:"\\u00c9dition",index:8} },
  { id:"edition.supprimer", nomFr:"Supprimer", nomEn:"Delete", aliases:["SUPPR","DELETE","E"], icone:"\\u{1F5D1}", raccourci:"Suppr", onglet:"edition", groupe:"Selection", ordre:3, portee:"selection", etat:"actif", source:{menu:"\\u00c9dition",index:7} },
  { id:"edition.grouper", nomFr:"Grouper", nomEn:"Group", aliases:["GROUPER","GROUP","G"], icone:"\\u25f0", onglet:"edition", groupe:"Groupes et blocs", ordre:1, portee:"selection", etat:"grise", jalon:"017Q1 - fusionne dans 017M, implementation a suivre" },
  { id:"edition.associer", nomFr:"Associer", nomEn:"Associate", aliases:["ASSOCIER","ASSOC"], icone:"\\u26ad", onglet:"edition", groupe:"Groupes et blocs", ordre:2, portee:"selection", etat:"grise", jalon:"017Q1 - fusionne dans 017M, implementation a suivre" },
  { id:"edition.bloc", nomFr:"Bloc", nomEn:"Block", aliases:["BLOC","BLOCK","B"], icone:"\\u25a3", onglet:"edition", groupe:"Groupes et blocs", ordre:3, portee:"selection", etat:"grise", jalon:"017Q1 - fusionne dans 017M, implementation a suivre" },

  // ================= 3. DESSIN =================
  { id:"dessin.selection", nomFr:"Selection", nomEn:"Select", aliases:["SELECTION","SELECT"], icone:"\\u2196", raccourci:"V", onglet:"dessin", groupe:"Outils de pointage", ordre:1, portee:"vue", etat:"actif", source:{menu:"Dessin",index:0} },
  { id:"dessin.main", nomFr:"Main / Pan", nomEn:"Pan", aliases:["MAIN","PAN"], icone:"\\u270b", raccourci:"H", onglet:"dessin", groupe:"Outils de pointage", ordre:2, portee:"vue", etat:"actif", source:{menu:"Dessin",index:1} },
  { id:"dessin.noeud", nomFr:"Noeud", nomEn:"Node", aliases:["NOEUD","NODE","POINT"], icone:"\\u25cf", raccourci:"N", onglet:"dessin", groupe:"Elements tuyauterie", ordre:1, portee:"projet", etat:"actif", source:{menu:"Dessin",index:2} },
  { id:"dessin.tube", nomFr:"Tube", nomEn:"Pipe", aliases:["TUBE","PIPE","TRONCON"], icone:"\\u2571", raccourci:"T", onglet:"dessin", groupe:"Elements tuyauterie", ordre:2, portee:"projet", etat:"actif", source:{menu:"Dessin",index:3} },
  { id:"dessin.te", nomFr:"Te de derivation", nomEn:"Branch tee", aliases:["TE","TEE","PIQUAGE"], icone:"\\u22a5", raccourci:"E", onglet:"dessin", groupe:"Elements tuyauterie", ordre:3, portee:"projet", etat:"actif", source:{menu:"Dessin",index:4} },
  { id:"dessin.coude", nomFr:"Coude 90", nomEn:"Elbow 90", aliases:["COUDE","ELBOW"], icone:"\\u2229", raccourci:"C", onglet:"dessin", groupe:"Elements tuyauterie", ordre:4, portee:"projet", etat:"actif", source:{menu:"Dessin",index:5} },

  // ================= 4. ANNOTER =================
  { id:"annoter.coter", nomFr:"Coter", nomEn:"Dimension", aliases:["COTER","DIM","COTATION"], icone:"\\u2194", raccourci:"M", onglet:"annoter", groupe:"Cotation", ordre:1, portee:"document", etat:"actif", source:{menu:"Cotation",index:0} },
  { id:"annoter.cotes.voir", nomFr:"Afficher cotations", nomEn:"Show dimensions", aliases:["COTES"], icone:"\\u{1F441}", raccourci:"D", onglet:"annoter", groupe:"Cotation", ordre:2, portee:"vue", etat:"actif", source:{menu:"Cotation",index:1}, suivreLibelle:true },
  { id:"annoter.cote.suppr", nomFr:"Supprimer derniere cote", nomEn:"Delete last dimension", aliases:["SUPPRCOTE"], icone:"\\u232b", onglet:"annoter", groupe:"Cotation", ordre:3, portee:"document", etat:"actif", source:{menu:"Cotation",index:2} },
  { id:"annoter.pipelines", nomFr:"Afficher pipelines", nomEn:"Show pipelines", aliases:["PIPELINES"], icone:"\\u{1F3F7}", onglet:"annoter", groupe:"Etiquettes", ordre:1, portee:"vue", etat:"actif", source:{menu:"Affichage",index:4}, suivreLibelle:true },
  { id:"annoter.soudures", nomFr:"Afficher soudures", nomEn:"Show welds", aliases:["SOUDURES","WELDS"], icone:"\\u2b24", onglet:"annoter", groupe:"Etiquettes", ordre:2, portee:"vue", etat:"actif", source:{menu:"Affichage",index:5}, suivreLibelle:true },
  { id:"annoter.texte", nomFr:"Texte", nomEn:"Text", aliases:["TEXTE","TEXT","DTEXT"], icone:"Aa", onglet:"annoter", groupe:"Textes et reperes", ordre:1, portee:"document", etat:"grise", jalon:"019B - annotation et habillage" },
  { id:"annoter.repere", nomFr:"Repere", nomEn:"Leader", aliases:["REPERE","LEADER"], icone:"\\u2197", onglet:"annoter", groupe:"Textes et reperes", ordre:2, portee:"document", etat:"grise", jalon:"019B - annotation et habillage" },

  // ================= 5. PRECISION =================
  { id:"precision.alignerx", nomFr:"Aligner X", nomEn:"Align X", aliases:["AX","ALIGNERX"], icone:"X", raccourci:"AX", onglet:"precision", groupe:"Alignement", ordre:1, portee:"selection", etat:"actif", source:{menu:"Alignement",index:0} },
  { id:"precision.alignery", nomFr:"Aligner Y", nomEn:"Align Y", aliases:["AY","ALIGNERY"], icone:"Y", raccourci:"AY", onglet:"precision", groupe:"Alignement", ordre:2, portee:"selection", etat:"actif", source:{menu:"Alignement",index:1} },
  { id:"precision.alignerz", nomFr:"Aligner Z", nomEn:"Align Z", aliases:["AZ","ALIGNERZ"], icone:"Z", raccourci:"AZ", onglet:"precision", groupe:"Alignement", ordre:3, portee:"selection", etat:"actif", source:{menu:"Alignement",index:2} },
  { id:"precision.eqsurtube", nomFr:"Equipement sur tube", nomEn:"Fitting on pipe", aliases:["AT"], icone:"\\u29b8", raccourci:"AT", onglet:"precision", groupe:"Alignement", ordre:4, portee:"selection", etat:"actif", source:{menu:"Alignement",index:3} },
  { id:"precision.parallele", nomFr:"Rendre parallele", nomEn:"Make parallel", aliases:["PARALLELE"], icone:"\\u2225", onglet:"precision", groupe:"Alignement", ordre:5, portee:"selection", etat:"actif", source:{menu:"Alignement",index:4} },
  { id:"precision.redresser", nomFr:"Redresser ISO", nomEn:"Straighten ISO", aliases:["REDRESSER","ISO"], icone:"\\u2b21", onglet:"precision", groupe:"Alignement", ordre:6, portee:"selection", etat:"actif", source:{menu:"Alignement",index:5} },
  { id:"precision.controle", nomFr:"Controle reseau", nomEn:"Network check", aliases:["CONTROLE","AUDIT","VALIDATE"], icone:"\\u2713", onglet:"precision", groupe:"Controle", ordre:1, portee:"projet", etat:"actif", source:{menu:"Outils",index:1} },

  // ================= 6. INSERTION =================
  { id:"insertion.bibliotheque", nomFr:"Bibliotheque", nomEn:"Library", aliases:["BIBLIO","LIBRARY"], icone:"\\u29c9", onglet:"insertion", groupe:"Bibliotheque", ordre:1, portee:"vue", etat:"actif", source:{menu:"Insertion",index:0}, suivreLibelle:true },
  { id:"insertion.vanne", nomFr:"Vanne", nomEn:"Valve", aliases:["VANNE","VALVE"], icone:"\\u25c6", onglet:"insertion", groupe:"Bibliotheque", ordre:2, portee:"projet", etat:"actif", source:{menu:"Insertion",index:1} },
  { id:"insertion.supportfixe", nomFr:"Support fixe", nomEn:"Fixed support", aliases:["SUPPORTFIXE","PSA"], icone:"\\u22a5", onglet:"insertion", groupe:"Supports et massifs", ordre:1, portee:"projet", etat:"grise", jalon:"019S+ - supports et genie civil" },
  { id:"insertion.supportglissant", nomFr:"Support glissant", nomEn:"Sliding support", aliases:["SUPPORTGLISSANT"], icone:"\\u2913", onglet:"insertion", groupe:"Supports et massifs", ordre:2, portee:"projet", etat:"grise", jalon:"019S+ - supports et genie civil" },
  { id:"insertion.supportguide", nomFr:"Support guide", nomEn:"Guide support", aliases:["SUPPORTGUIDE"], icone:"\\u21d5", onglet:"insertion", groupe:"Supports et massifs", ordre:3, portee:"projet", etat:"grise", jalon:"019S+ - supports et genie civil" },
  { id:"insertion.massif", nomFr:"Massif beton", nomEn:"Concrete plinth", aliases:["MASSIF"], icone:"\\u25ac", onglet:"insertion", groupe:"Supports et massifs", ordre:4, portee:"projet", etat:"grise", jalon:"019S+ - EN 1992-1-1, EN 206" },
  { id:"insertion.platine", nomFr:"Platine et ancrage", nomEn:"Base plate", aliases:["PLATINE","TIGEANCRAGE"], icone:"\\u229e", onglet:"insertion", groupe:"Supports et massifs", ordre:5, portee:"projet", etat:"grise", jalon:"019S+ - EN 1992-4, ASTM F1554" },
  { id:"insertion.sketch", nomFr:"Import Sketch-to-ISO", nomEn:"Sketch-to-ISO import", aliases:["SKETCH"], icone:"\\u270e", onglet:"insertion", groupe:"Import", ordre:1, portee:"projet", etat:"grise", jalon:"R23 - depot separe, interface JSON SchemaGraph" },

  // ================= 7. 3D =================
  { id:"trois_d.vue", nomFr:"Vue 3D", nomEn:"3D view", aliases:["VUE3D","3D"], icone:"\\u25f0", onglet:"trois_d", groupe:"Navigation", ordre:1, portee:"vue", etat:"grise", jalon:"019C - passage volumique" },
  { id:"trois_d.profile", nomFr:"Profile metallique", nomEn:"Steel member", aliases:["PROFIL","STEELMEMBER"], icone:"\\u2b12", onglet:"trois_d", groupe:"Structure et genie civil", ordre:1, portee:"projet", etat:"grise", jalon:"019S+ - Eurocode 3, AISC 360" },
  { id:"trois_d.dalle", nomFr:"Dalle et fondation", nomEn:"Slab and footing", aliases:["DALLE","FOOTING"], icone:"\\u25a4", onglet:"trois_d", groupe:"Structure et genie civil", ordre:2, portee:"projet", etat:"grise", jalon:"019S+ - EN 1992-1-1, ACI 318" },
  { id:"trois_d.gardecorps", nomFr:"Garde-corps et escalier", nomEn:"Handrail and stair", aliases:["GARDECORPS","ESCALIER"], icone:"\\u2591", onglet:"trois_d", groupe:"Structure et genie civil", ordre:3, portee:"projet", etat:"grise", jalon:"019S+ - ASCE 7, RPA 99 v2003" },
  { id:"trois_d.rendu", nomFr:"Rendu", nomEn:"Render", aliases:["RENDU","RENDER"], icone:"\\u25d1", onglet:"trois_d", groupe:"Rendu", ordre:1, portee:"document", etat:"grise", jalon:"018G - rendu et presentation" },

  // ================= 8. DONNEES =================
  { id:"donnees.bom", nomFr:"BOM / Nomenclature", nomEn:"BOM", aliases:["BOM","NOMENCLATURE"], icone:"\\u{1F4CB}", raccourci:"BOM", onglet:"donnees", groupe:"Nomenclature", ordre:1, portee:"projet", etat:"actif", source:{menu:"Outils",index:0} },
  { id:"donnees.linelist", nomFr:"Line List", nomEn:"Line list", aliases:["LINELIST","LIGNES"], icone:"\\u2263", onglet:"donnees", groupe:"Lignes", ordre:1, portee:"projet", etat:"grise", jalon:"018 - Line List et regles metier" },
  { id:"donnees.catalogue", nomFr:"Catalogue", nomEn:"Catalog", aliases:["CATALOGUE","SPEC"], icone:"\\u2637", onglet:"donnees", groupe:"Lignes", ordre:2, portee:"projet", etat:"grise", jalon:"018 - catalogue et specs" },
  { id:"donnees.metre", nomFr:"Metre", nomEn:"Take-off", aliases:["METRE","TAKEOFF"], icone:"\\u{1F4CF}", onglet:"donnees", groupe:"Quantitatifs", ordre:1, portee:"projet", etat:"grise", jalon:"020 - metre et quantitatifs" },
  { id:"donnees.bomgc", nomFr:"BOM genie civil", nomEn:"Civil BOM", aliases:["BOMGC"], icone:"\\u25a5", onglet:"donnees", groupe:"Quantitatifs", ordre:2, portee:"projet", etat:"grise", jalon:"019S+ - quantitatifs genie civil" },

  // ================= 9. AFFICHAGE =================
  { id:"affichage.zoomplus", nomFr:"Zoom +", nomEn:"Zoom in", aliases:["ZOOM+"], icone:"\\u2295", raccourci:"+", onglet:"affichage", groupe:"Zoom", ordre:1, portee:"vue", etat:"actif", source:{menu:"Affichage",index:0} },
  { id:"affichage.zoommoins", nomFr:"Zoom -", nomEn:"Zoom out", aliases:["ZOOM-"], icone:"\\u2296", raccourci:"-", onglet:"affichage", groupe:"Zoom", ordre:2, portee:"vue", etat:"actif", source:{menu:"Affichage",index:1} },
  { id:"affichage.ajuster", nomFr:"Ajuster", nomEn:"Zoom fit", aliases:["AJUSTER","FIT"], icone:"\\u26f6", raccourci:"0", onglet:"affichage", groupe:"Zoom", ordre:3, portee:"vue", etat:"actif", source:{menu:"Affichage",index:2} },
  { id:"affichage.grille", nomFr:"Afficher grille", nomEn:"Show grid", aliases:["GRILLE","GRID"], icone:"\\u25a6", raccourci:"G", onglet:"affichage", groupe:"Reperes", ordre:1, portee:"vue", etat:"actif", source:{menu:"Affichage",index:3}, suivreLibelle:true },
  { id:"affichage.palette", nomFr:"Palette commandes", nomEn:"Command palette", aliases:["PALETTE"], icone:"\\u2318", raccourci:"Ctrl+K", onglet:"affichage", groupe:"Outils", ordre:1, portee:"session", etat:"actif", source:{menu:"Outils",index:2} },
  { id:"affichage.raccourcis", nomFr:"Raccourcis clavier", nomEn:"Keyboard shortcuts", aliases:["RACCOURCIS"], icone:"?", raccourci:"?", onglet:"affichage", groupe:"Outils", ordre:2, portee:"session", etat:"actif", source:{menu:"Outils",index:3} },
];

/** Groupes d un onglet, dans l ordre de premiere apparition. */
export function pdiGroupesOnglet017M(onglet: string): string[] {
  const vus: string[] = [];
  PDI_REGISTRE_RUBAN_017M.forEach((e) => {
    if (e.onglet === onglet && vus.indexOf(e.groupe) === -1) vus.push(e.groupe);
  });
  return vus;
}

/** Entrees d un groupe, triees par ordre. */
export function pdiEntreesGroupe017M(
  onglet: string,
  groupe: string,
): PdiEntreeRuban017M[] {
  return PDI_REGISTRE_RUBAN_017M.filter(
    (e) => e.onglet === onglet && e.groupe === groupe,
  ).sort((a, b) => a.ordre - b.ordre);
}

/** Recherche par nom ou alias, insensible a la casse et bilingue. */
export function pdiChercherCommande017M(saisie: string): PdiEntreeRuban017M[] {
  const q = String(saisie || "").trim().toUpperCase();
  if (!q) return [];
  return PDI_REGISTRE_RUBAN_017M.filter((e) => {
    if (e.nomFr.toUpperCase().indexOf(q) === 0) return true;
    if (e.nomEn.toUpperCase().indexOf(q) === 0) return true;
    return e.aliases.some((a) => a.toUpperCase() === q);
  });
}
'''

# --------------------------------------------------------------------------
# Fragments a inserer dans le moteur
# --------------------------------------------------------------------------

ANCIEN_IMPORT = ('import { pdiValiderLongueur017P10, pdiValiderDn017P10, '
                 'pdiEcartAccrochage017P10 } from "./pdiSaisie017P10";')
NOUVEL_IMPORT = ANCIEN_IMPORT + (
    '\n// PATCH 017M : registre unique des commandes, source du ruban.\n'
    'import { PDI_ONGLETS_RUBAN_017M, PDI_INVITE_COMMANDE_017M, '
    'pdiGroupesOnglet017M, pdiEntreesGroupe017M } from "./pdiRegistreCommandes.v1";\n'
    'import type { PdiEntreeRuban017M } from "./pdiRegistreCommandes.v1";'
)

ANCIENNE_INVITE_1 = ('const [autocadPrompt, setAutocadPrompt] = useState("Tapez une '
                     'commande (ex: LIGNE, RECT, TRIANGLE, COPIER, COLLER...)");')
NOUVELLE_INVITE_1 = ('// PATCH 017M : invite lue dans le registre (vocabulaire tuyauterie).\n'
                     '  const [autocadPrompt, setAutocadPrompt] = useState(PDI_INVITE_COMMANDE_017M);')

ANCIENNE_INVITE_2 = ('setAutocadPrompt("Pr\u00eat. Tapez une commande '
                     '(ex: LIGNE, RECT, TRIANGLE, COPIER, COLLER...)");')
NOUVELLE_INVITE_2 = 'setAutocadPrompt("Pr\u00eat. " + PDI_INVITE_COMMANDE_017M);'

ANCRE_ETAT = "\n".join([
    '        { label: "Raccourcis clavier", hint: "?", run: () => setShortcutsOpen(true) },',
    '      ],',
    '    },',
    '  ];',
    '',
    '  return <div',
])
NOUVEL_ETAT = "\n".join([
    '        { label: "Raccourcis clavier", hint: "?", run: () => setShortcutsOpen(true) },',
    '      ],',
    '    },',
    '  ];',
    '',
    '  // PATCH 017M : etat du ruban. Le registre decrit QUOI afficher, ces',
    '  // quelques lignes decrivent OU on en est dans la navigation.',
    '  const [rubanOnglet017M, setRubanOnglet017M] = useState<string>("dessin");',
    '  const [rubanReplie017M, setRubanReplie017M] = useState<boolean>(() => {',
    '    try { return localStorage.getItem("pdi.ribbon.collapsed.v1") === "1"; }',
    '    catch { return false; }',
    '  });',
    '  useEffect(() => {',
    '    try { localStorage.setItem("pdi.ribbon.collapsed.v1", rubanReplie017M ? "1" : "0"); }',
    '    catch { /* stockage indisponible : le ruban reste utilisable */ }',
    '  }, [rubanReplie017M]);',
    '  useEffect(() => {',
    '    const surTouche = (e: KeyboardEvent) => {',
    '      if ((e.ctrlKey || e.metaKey) && e.key === "F1") {',
    '        e.preventDefault();',
    '        setRubanReplie017M((v) => !v);',
    '      }',
    '    };',
    '    window.addEventListener("keydown", surTouche);',
    '    return () => window.removeEventListener("keydown", surTouche);',
    '  }, []);',
    '',
    '  // PATCH 017M : resolution de l action. Le registre designe une entree de',
    '  // menu par (groupe, index) ; on reutilise la fermeture existante telle',
    '  // quelle. Aucune des 47 actions n est reecrite : c est ce qui rend le',
    '  // passage au ruban sans risque pour le code qui fonctionne.',
    '  const pdiCibleRuban017M = (entree: PdiEntreeRuban017M) => {',
    '    if (!entree.source) return undefined;',
    '    const groupe = cadMenuGroups.find((g) => g.title === entree.source!.menu);',
    '    if (!groupe) return undefined;',
    '    return groupe.items[entree.source!.index];',
    '  };',
    '  const pdiInfobulleRuban017M = (entree: PdiEntreeRuban017M, indice?: string) => {',
    '    const base = entree.nomFr + " / " + entree.nomEn',
    '      + (entree.raccourci ? "  [" + entree.raccourci + "]" : "")',
    '      + (indice ? "  (" + indice + ")" : "");',
    '    return entree.etat === "grise"',
    '      ? base + "\\nPrevu au jalon : " + (entree.jalon || "a definir")',
    '      : base;',
    '  };',
    '',
    '  return <div',
])

ANCIENNE_NAV = "\n".join([
    '            <nav className="pdi-cad-menubar hidden md:flex" aria-label="Menus PD & I">',
    '              {cadMenuGroups.map((group) => (',
    '                <div key={group.title} className="pdi-cad-menu">',
    '                  <button type="button" className="pdi-cad-menu-trigger">',
    '                    {group.title}',
    '                  </button>',
    '                  <div className="pdi-cad-menu-panel">',
    '                    {group.items.map((item) => (',
    '                      <button',
    '                        key={`${group.title}-${item.label}`}',
    '                        type="button"',
    '                        disabled={item.disabled}',
    '                        onClick={() => {',
    '                          item.run();',
    '                          setStatusMessage(`${group.title} · ${item.label}`);',
    '                        }}',
    '                        className="pdi-cad-menu-item"',
    '                      >',
    '                        <span>{item.label}</span>',
    '                        {item.hint && <span className="pdi-cad-menu-hint">{item.hint}</span>}',
    '                      </button>',
    '                    ))}',
    '                  </div>',
    '                </div>',
    '              ))}',
    '            </nav>',
])
NOUVELLE_NAV = "\n".join([
    '            {/* PATCH 017M : bande d onglets. Les anciens menus deroulants ne',
    '                sont plus affiches ; ils restent la source des actions du',
    '                ruban, donc il n existe qu une seule surface cliquable. */}',
    '            <nav className="pdi-cad-menubar hidden md:flex" aria-label="Onglets du ruban PD & I">',
    '              {PDI_ONGLETS_RUBAN_017M.map((onglet) => (',
    '                <button',
    '                  key={onglet.id}',
    '                  type="button"',
    '                  onClick={() => { setRubanOnglet017M(onglet.id); setRubanReplie017M(false); }}',
    '                  className={"pdi-ruban-onglet" + (rubanOnglet017M === onglet.id && !rubanReplie017M ? " actif" : "")}',
    '                  title={onglet.nomFr + " / " + onglet.nomEn}',
    '                >',
    '                  {onglet.nomFr}',
    '                </button>',
    '              ))}',
    '              <button',
    '                type="button"',
    '                onClick={() => setRubanReplie017M((v) => !v)}',
    '                className="pdi-ruban-onglet"',
    '                title="Replier ou deplier le ruban (Ctrl+F1)"',
    '              >',
    '                {rubanReplie017M ? "\\u25be" : "\\u25b4"}',
    '              </button>',
    '            </nav>',
])

ANCRE_RUBAN = "\n".join([
    '        </header>',
    '        <aside className="pdi-studio-rail fixed bottom-0 left-0 top-[54px] z-[10005] w-[86px] py-2 px-1.5 flex flex-col items-center gap-1.5 overflow-y-auto">',
])
NOUVEAU_RUBAN = "\n".join([
    '        </header>',
    '        {/* PATCH 017M : rangee de groupes du ruban, lue depuis',
    '            pdiRegistreCommandes.v1. Une commande grisee est visible mais non',
    '            cliquable : son infobulle annonce le jalon qui l activera. */}',
    '        {!rubanReplie017M && (',
    '          <div className="pdi-cad-ribbon" data-pdi-ruban="017m">',
    '            {pdiGroupesOnglet017M(rubanOnglet017M).map((groupe) => (',
    '              <div key={groupe} className="pdi-ribbon-group">',
    '                <div className="pdi-ruban-boutons">',
    '                  {pdiEntreesGroupe017M(rubanOnglet017M, groupe).map((entree) => {',
    '                    const cible = pdiCibleRuban017M(entree);',
    '                    const inactif = entree.etat === "grise" || !cible || !!cible.disabled;',
    '                    const libelle = entree.suivreLibelle && cible ? cible.label : entree.nomFr;',
    '                    return (',
    '                      <button',
    '                        key={entree.id}',
    '                        type="button"',
    '                        disabled={inactif}',
    '                        title={pdiInfobulleRuban017M(entree, cible ? cible.hint : undefined)}',
    '                        onClick={() => { if (cible) { cible.run(); setStatusMessage(entree.nomFr); } }}',
    '                      >',
    '                        {entree.icone ? entree.icone + " " : ""}{libelle}',
    '                      </button>',
    '                    );',
    '                  })}',
    '                </div>',
    '                <span>{groupe}</span>',
    '              </div>',
    '            ))}',
    '          </div>',
    '        )}',
    '        <aside className="pdi-studio-rail fixed bottom-0 left-0 top-[54px] z-[10005] w-[86px] py-2 px-1.5 flex flex-col items-center gap-1.5 overflow-y-auto">',
])

ANCRE_CSS = ('        [data-pdi-studio] .pdi-ribbon-group button:hover'
             '{background:#2563EB;color:white;border-color:#60A5FA}')
NOUVEAU_CSS = ANCRE_CSS + "\n" + "\n".join([
    '        /* PATCH 017M : ruban a 9 onglets. Les classes .pdi-cad-ribbon et',
    '           .pdi-ribbon-group existaient deja mais n etaient utilisees nulle',
    '           part : elles sont enfin branchees, sans style en double. */',
    '        [data-pdi-studio] .pdi-ruban-onglet{height:26px;padding:0 11px;border-radius:6px 6px 0 0;color:#9CA3AF;background:transparent;font-size:11px;font-weight:900;white-space:nowrap;border:1px solid transparent;border-bottom:0}',
    '        [data-pdi-studio] .pdi-ruban-onglet:hover{background:#1F2937;color:#E6EDF3}',
    '        [data-pdi-studio] .pdi-ruban-onglet.actif{background:#151B24;color:#22D3EE;border-color:#30363D}',
    '        [data-pdi-studio] .pdi-cad-ribbon{display:flex;align-items:stretch;gap:10px;padding:5px 10px;min-height:64px;overflow-x:auto}',
    '        [data-pdi-studio] .pdi-ribbon-group{height:auto;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:3px}',
    '        [data-pdi-studio] .pdi-ruban-boutons{display:flex;align-items:center;gap:4px}',
    '        [data-pdi-studio] .pdi-ribbon-group button:disabled{opacity:.42;cursor:not-allowed;background:#161B22;color:#7D8590;border-color:#262C36}',
    '        @media(max-width:900px){[data-pdi-studio] .pdi-cad-ribbon{display:none!important}}',
])


def main():
    print("=" * 72)
    print("PATCH %s - REGISTRE UNIQUE DE COMMANDES + RUBAN A 9 ONGLETS" % PATCH)
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
    registre = os.path.join(racine, REL_REGISTRE)

    print("")
    print("--- 1. Prerequis ---")
    tsx = lire(moteur)
    md5_avant = empreinte(moteur)
    print("  %d octets, %d lignes, MD5 %s"
          % (len(tsx.encode("utf-8")), tsx.count("\n"), md5_avant))

    if "pdiSaisie017P10" not in tsx:
        print("")
        print("ARRET : le 017P10 n est pas applique sur ce depot.")
        print("        Appliquez d abord 017P10_pdi_saisie_refus_explicite.py.")
        return 2
    note(True, "017P10 detecte")
    note("useEffect" in tsx, "useEffect disponible dans le moteur")

    print("")
    print("--- 2. Controle de l inventaire des menus (securite) ---")
    releve = inventaire_menus(tsx)
    total = sum(n for _, n in releve)
    print("  releve : %d groupes, %d entrees" % (len(releve), total))
    if releve != INVENTAIRE_ATTENDU:
        print("")
        print("ARRET : la structure des menus a change depuis l ecriture du registre.")
        print("        Les index du registre ne designeraient plus les bonnes actions.")
        print("        Attendu : %s" % INVENTAIRE_ATTENDU)
        print("        Releve  : %s" % releve)
        return 2
    note(True, "inventaire conforme : 9 groupes, 47 entrees, index fiables")

    print("")
    print("--- 3. Registre pdiRegistreCommandes.v1.ts ---")
    contenu_registre = REGISTRE_TS.replace("\\\\u", "\\u")
    if os.path.isfile(registre) and "PDI_REGISTRE_RUBAN_017M" in lire(registre):
        deja("le registre existe")
    else:
        ecrire(registre, contenu_registre)
        note(os.path.isfile(registre), "registre cree")
    r = lire(registre)
    note("PDI_ONGLETS_RUBAN_017M" in r, "les 9 onglets sont declares")
    note(r.count('id:"') >= 60, "registre garni (au moins 60 commandes declarees)")
    note('etat:"grise"' in r, "commandes grisees declarees avec leur jalon")
    note("pdiChercherCommande017M" in r, "recherche bilingue par alias exportee")
    note("PDI_INVITE_COMMANDE_017M" in r, "invite de la ligne de commande centralisee")
    nb_sources = r.count("source:{menu:")
    note(nb_sources == 46,
         "46 des 47 entrees reprises (le 47e est le doublon BOM, retire) - releve %d" % nb_sources)

    print("")
    print("--- 4. Branchement dans le moteur ---")
    sauvegarder(moteur)

    if "pdiRegistreCommandes.v1" in tsx:
        deja("le moteur importe le registre")
    elif ANCIEN_IMPORT in tsx:
        tsx = tsx.replace(ANCIEN_IMPORT, NOUVEL_IMPORT, 1)
        note("PDI_ONGLETS_RUBAN_017M" in tsx, "import du registre ajoute")
    else:
        note(False, "import : ancre du 017P10 introuvable")

    if "rubanOnglet017M" in tsx:
        deja("l etat du ruban existe")
    elif ANCRE_ETAT in tsx:
        tsx = tsx.replace(ANCRE_ETAT, NOUVEL_ETAT, 1)
        note("setRubanReplie017M" in tsx, "etat du ruban + Ctrl+F1 ajoutes")
        note("pdiCibleRuban017M" in tsx, "resolveur d action ajoute (reutilise les 47 actions)")
    else:
        note(False, "etat : ancre de fin de cadMenuGroups introuvable")

    if "Onglets du ruban PD & I" in tsx:
        deja("la bande d onglets est en place")
    elif ANCIENNE_NAV in tsx:
        tsx = tsx.replace(ANCIENNE_NAV, NOUVELLE_NAV, 1)
        note("pdi-ruban-onglet" in tsx, "anciens menus deroulants remplaces par 9 onglets")
    else:
        note(False, "onglets : ancre de la barre de menus introuvable")

    if 'data-pdi-ruban="017m"' in tsx:
        deja("la rangee de groupes est en place")
    elif ANCRE_RUBAN in tsx:
        tsx = tsx.replace(ANCRE_RUBAN, NOUVEAU_RUBAN, 1)
        note('data-pdi-ruban="017m"' in tsx, "rangee de groupes du ruban inseree")
    else:
        note(False, "ruban : ancre de fermeture du bandeau introuvable")

    if "PATCH 017M : ruban a 9 onglets" in tsx:
        deja("le style du ruban est en place")
    elif ANCRE_CSS in tsx:
        tsx = tsx.replace(ANCRE_CSS, NOUVEAU_CSS, 1)
        note(".pdi-ruban-onglet.actif" in tsx, "style des onglets ajoute")
    else:
        note(False, "style : ancre CSS introuvable")

    print("")
    print("--- 5. Invite de la ligne de commande unifiee ---")
    if "useState(PDI_INVITE_COMMANDE_017M)" in tsx:
        deja("invite initiale lue dans le registre")
    elif ANCIENNE_INVITE_1 in tsx:
        tsx = tsx.replace(ANCIENNE_INVITE_1, NOUVELLE_INVITE_1, 1)
        note("useState(PDI_INVITE_COMMANDE_017M)" in tsx, "invite initiale unifiee")
    else:
        note(False, "invite initiale : ancre introuvable")

    if 'setAutocadPrompt("Pr\u00eat. " + PDI_INVITE_COMMANDE_017M)' in tsx:
        deja("invite de retour au repos lue dans le registre")
    elif ANCIENNE_INVITE_2 in tsx:
        tsx = tsx.replace(ANCIENNE_INVITE_2, NOUVELLE_INVITE_2, 1)
        note('"Pr\u00eat. " + PDI_INVITE_COMMANDE_017M' in tsx, "invite de repos unifiee")
    else:
        note(False, "invite de repos : ancre introuvable")

    note("LIGNE, RECT, TRIANGLE" not in tsx,
         "plus aucun vocabulaire 2D concurrent dans l invite")

    print("")
    print("--- 6. Ecriture ---")
    ecrire(moteur, tsx)
    print("  MD5 avant %s" % md5_avant)
    print("  MD5 apres %s" % empreinte(moteur))

    print("")
    print("--- 7. Pastille de version ---")
    v = lire(version)
    if 'PDI_PATCH_VERSION = "017M"' in v:
        deja("la pastille affiche 017M")
    else:
        sauvegarder(version)
        v = re.sub(r'PDI_PATCH_VERSION\s*=\s*"[^"]*"',
                   'PDI_PATCH_VERSION = "017M"', v, count=1)
        ecrire(version, v)
        note('PDI_PATCH_VERSION = "017M"' in lire(version), "pastille passee a 017M")

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
    print("  1. Pastille : 017M.")
    print("  2. En haut, NEUF onglets : Fichier, Edition, Dessin, Annoter,")
    print("     Precision, Insertion, 3D, Donnees, Affichage.")
    print("     Impression n est plus un onglet : elle est un groupe de Fichier.")
    print("  3. Sous les onglets, une rangee de groupes encadres et etiquetes.")
    print("     Cliquer un onglet change la rangee.")
    print("  4. Onglet Dessin, bouton Tube : doit activer l outil tube comme")
    print("     avant. Idem Te et Coude 90. Ce sont les MEMES actions qu avant.")
    print("  5. Onglet 3D et onglet Donnees : boutons visibles mais GRISES.")
    print("     Survolez-les : l infobulle annonce le jalon (019C, 018, 020...).")
    print("  6. Ctrl+F1 replie le ruban, Ctrl+F1 le rouvre. Rechargez la page :")
    print("     l etat est retenu.")
    print("  7. Onglet Donnees : BOM n apparait QU UNE FOIS (le doublon du menu")
    print("     Fichier a ete retire).")
    print("  8. La ligne de commande annonce TUBE, TE, COUDE et non plus")
    print("     LIGNE, RECT, TRIANGLE.")
    print("  9. Non-regression 017P9 et 017P10 : ANOMALIES et le compteur du")
    print("     bandeau restent d accord ; la longueur 0 est toujours refusee.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
