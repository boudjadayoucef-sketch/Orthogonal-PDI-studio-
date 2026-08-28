#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PATCH 017M2 - TOUTES LES COMMANDES DANS LE RUBAN.

OBJET
  Le 017M a construit le ruban a 9 onglets et y a fait passer les 47 entrees
  de menu. Mais les deux tables de commandes du moteur restaient dehors :
    AUTOCAD_COMMANDS ............ 46 commandes
    PDI_PLANT3D_COMMAND_TABLE ... 56 commandes
    dont 3 declarees dans les deux (BOM, DATAMANAGER, ZOOM)
    => 99 commandes distinctes, dont 80 sans aucun bouton.
  Consequence constatee par l utilisateur : DEPLACER, ROTATION, MIROIR,
  ECHELLE, LIGNE, RECTANGLE, TAG... existent mais ne se voient pas.
  Ce patch les declare TOUTES et prepare les onglets 3D, Donnees et
  Catalogue pour les jalons suivants.

CE QUE LE PATCH A VERIFIE DANS LE CODE AVANT D ETRE ECRIT
  Le moteur execute les commandes en DEUX etages :
    Etage A - executeCadCommand (l. 2905) : une chaine if/else if sur cmdId,
              plus 55 verbes captes en amont. 30 identifiants + ces verbes
              declenchent une VRAIE action.
    Etage B - branche finale Plant3D (l. 3205) : si la commande n est pas
              prevue, le code se contente de setAutocadPrompt(...) puis
              setStatusMessage(...). AUCUNE action sur le dessin.
  Releve exact :
    AUTOCAD_COMMANDS ........... 45 agissent / 46 (seule HIDE est inerte)
    PDI_PLANT3D_COMMAND_TABLE .. 14 agissent / 56 (42 sont des annonces)
  Le drapeau readiness:"implemented" de la table Plant3D ne prouve donc RIEN :
  SCALE, TRIM, EXTEND, FILLET, CHAMFER, OFFSET, STRETCH, ARRAY, EXPLODE sont
  declarees mais ne font qu afficher un message.

DECISION QUI EN DECOULE
  Une commande qui n agit pas recoit un bouton GRISE avec son jalon en
  infobulle, jamais un bouton actif. Un bouton actif qui n agit pas est
  exactement le defaut de W002 : l utilisateur clique et rien ne se passe.
  On montre la feuille de route, on ne simule pas une fonction.

UNE SEULE VOIE D EXECUTION (regle R8)
  Les entrees ajoutees ici ne redecrivent aucune action. Elles portent un
  champ commande, et le ruban appelle executeCadCommand(commande) : le bouton
  emprunte exactement le chemin du clavier. Ruban et ligne de commande ne
  peuvent plus divergier.

SYNONYMES FUSIONNES, PAS DUPLIQUES
  Les deux tables se recouvrent bien au-dela des 3 doublons de nom :
  MOVE/DEPLACER, ERASE/EFFACER, MIRROR/MIROIR, ROTATE/ROTATION,
  COPYCLIP/COPYBASE/COPY/COPIER, PASTECLIP/PASTEBLOCK/PASTEORIG/COLLER,
  CUTCLIP/COUPER, PAN/MAIN, REGEN/ZOOM/AJUSTER designent la meme action.
  Un seul bouton par action, tous les noms restant tapables comme alias.
  Le nombre de BOUTONS est donc inferieur a 99, mais les 99 NOMS sont
  presents et le patch echoue s il en manque un seul.

HORS PERIMETRE, ASSUME
  Grouper / Associer / Bloc restent grises (jalon 017Q1). Ce sont de vraies
  fonctions : un groupe doit etre stocke dans le graphe, sauve dans le JSON,
  et compris par annuler/retablir. Les melanger a un patch de declaration
  casserait la regle R5 et mettrait le modele de donnees en risque.
  A noter : ROTATION agit deja sur la selection courante (l. 3095). Le groupe
  n est necessaire que pour faire tourner plusieurs objets comme un seul bloc.
  Le troisieme plancher silencieux (l. 6814) reste au 017K3, avec la
  suppression des saisies d exemple.

IDEMPOTENT - relancable sans risque. Sauvegardes .before017M2.
"""

import hashlib
import json
import os
import re
import sys
import tempfile
import zlib

PATCH = "017M2"
SUFFIXE = ".before017M2"

REL_MOTEUR = "src/pdi/isometric/engine/IsometrieModuleV48d.tsx"
REL_REGISTRE = "src/pdi/isometric/engine/pdiRegistreCommandes.v1.ts"
REL_CAD = "src/pdi/isometric/engine/CadAutocadEngine.ts"
REL_VERSION = "src/pdi/pdiVersion.ts"

ENTETES_ZLIB = (b"\x78\x01", b"\x78\x5e", b"\x78\x9c", b"\x78\xda")

verifs = []


# --------------------------------------------------------------------------
# SOCLE R29 : integrite des entrees/sorties
# --------------------------------------------------------------------------
def empreinte(octets):
    return hashlib.md5(octets).hexdigest()


def lire(chemin):
    """Lecture qui repare d abord une queue zlib si le fichier en porte une."""
    with open(chemin, "rb") as f:
        brut = f.read()
    try:
        return brut.decode("utf-8")
    except UnicodeDecodeError as err:
        pos = err.start
        for delta in range(-16, 17):
            p = pos + delta
            if p <= 0 or p + 2 > len(brut):
                continue
            if brut[p:p + 2] not in ENTETES_ZLIB:
                continue
            try:
                sortie = zlib.decompressobj(15).decompress(brut[p:])
                recolle = brut[:p] + sortie
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
        raise SystemExit(
            "ARRET : %s est illisible et la reparation a echoue." % chemin)


def ecrire(chemin, texte):
    """Ecriture atomique puis relecture octet par octet."""
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
    ici = os.path.abspath(os.path.dirname(__file__))
    for _ in range(6):
        if os.path.exists(os.path.join(ici, REL_MOTEUR)):
            return ici
        ici = os.path.dirname(ici)
    cwd = os.path.abspath(os.getcwd())
    for _ in range(6):
        if os.path.exists(os.path.join(cwd, REL_MOTEUR)):
            return cwd
        cwd = os.path.dirname(cwd)
    raise SystemExit(
        "ARRET : %s introuvable. Lancez le patch a la racine du projet."
        % REL_MOTEUR)


# --------------------------------------------------------------------------
# LECTURE DES DEUX TABLES : la liste des commandes n est pas ecrite ici,
# elle est RELEVEE dans le code. Impossible d en oublier une.
# --------------------------------------------------------------------------
def bloc_tableau(texte, nom):
    """Extrait le tableau litteral qui suit une declaration.

    Le crochet du TYPE (CadCommandItem[]) ne doit pas etre confondu avec
    celui du tableau : on part donc du signe egal.
    """
    i = texte.index(nom)
    j = texte.index("[", texte.index("=", i))
    prof = 0
    for k in range(j, len(texte)):
        if texte[k] == "[":
            prof += 1
        elif texte[k] == "]":
            prof -= 1
            if prof == 0:
                return texte[j:k + 1]
    raise SystemExit("ARRET : tableau %s non delimite." % nom)


def relever_commandes(cad):
    b_auto = bloc_tableau(cad, "AUTOCAD_COMMANDS")
    b_plant = bloc_tableau(cad, "PDI_PLANT3D_COMMAND_TABLE")
    noms_auto = re.findall(r'name\s*:\s*"([^"]+)"', b_auto)
    noms_plant = re.findall(r'command\s*:\s*"([^"]+)"', b_plant)
    return noms_auto, noms_plant


# --------------------------------------------------------------------------
# 1. ALIAS AJOUTES A DES ENTREES 017M EXISTANTES (synonymes, pas de doublon)
# --------------------------------------------------------------------------
ALIAS_SUPPLEMENTAIRES = [
    ("edition.copier", ["COPY", "COPYCLIP", "COPYBASE", "CO", "CP"]),
    ("edition.coller", ["PASTECLIP", "PASTEBLOCK", "PASTEORIG", "PASTE"]),
    ("edition.couper", ["CUTCLIP", "CUT"]),
    ("affichage.ajuster", ["ZOOM", "REGEN", "ZOOM_ALL"]),
    ("dessin.main", ["PAN", "P"]),
    ("fichier.planche", ["PLANTISOVIEW", "PLANTISOQUICK", "ISOVIEW"]),
    ("trois_d.profile", ["PLANTSTEELMEMBER"]),
    ("trois_d.gardecorps", ["PLANTSTEELHANDRAIL"]),
]

# --------------------------------------------------------------------------
# 2. NOUVELLES ENTREES
#    (id, nomFr, nomEn, alias, icone, onglet, groupe, portee, etat,
#     jalon_ou_None, commande_ou_None)
#    commande renseignee UNIQUEMENT quand l action repond vraiment.
# --------------------------------------------------------------------------
NOUVELLES = [
    # ---- EDITION : transformer (actions reelles, verifiees) ----
    ("edition.deplacer", "Deplacer", "Move",
     ["DEPLACER", "MOVE", "M", "TRANSLATION", "DEPLACE"], "\u2725",
     "edition", "Transformer", "selection", "actif", None, "DEPLACER"),
    ("edition.rotation", "Rotation", "Rotate",
     ["ROTATION", "ROTATE", "RO", "TOURNER"], "\u21bb",
     "edition", "Transformer", "selection", "actif", None, "ROTATION"),
    ("edition.miroir", "Miroir", "Mirror",
     ["MIROIR", "MIRROR", "MI"], "\u21c4",
     "edition", "Transformer", "selection", "actif", None, "MIROIR"),
    ("edition.effacer", "Effacer", "Erase",
     ["EFFACER", "ERASE", "E"], "\u2327",
     "edition", "Transformer", "selection", "actif", None, "EFFACER"),

    # ---- EDITION : modifier la geometrie (declarees, inertes) ----
    ("edition.echelle", "Echelle", "Scale", ["SCALE", "ECHELLE"], "\u2921",
     "edition", "Modifier la geometrie", "selection", "grise", "019B", None),
    ("edition.ajuster2d", "Ajuster", "Trim", ["TRIM", "AJUSTER"], "\u2702",
     "edition", "Modifier la geometrie", "selection", "grise", "019B", None),
    ("edition.prolonger", "Prolonger", "Extend", ["EXTEND", "PROLONGER"],
     "\u27f6", "edition", "Modifier la geometrie", "selection", "grise",
     "019B", None),
    ("edition.raccord", "Raccord", "Fillet", ["FILLET", "RACCORD"], "\u25e0",
     "edition", "Modifier la geometrie", "selection", "grise", "019B", None),
    ("edition.chanfrein", "Chanfrein", "Chamfer", ["CHAMFER", "CHANFREIN"],
     "\u25e2", "edition", "Modifier la geometrie", "selection", "grise",
     "019B", None),
    ("edition.decaler", "Decaler", "Offset", ["OFFSET", "DECALER"], "\u2016",
     "edition", "Modifier la geometrie", "selection", "grise", "019B", None),
    ("edition.etirer", "Etirer", "Stretch", ["STRETCH", "ETIRER"], "\u2194",
     "edition", "Modifier la geometrie", "selection", "grise", "019B", None),
    ("edition.reseau", "Reseau", "Array", ["ARRAY", "RESEAU"], "\u2237",
     "edition", "Modifier la geometrie", "selection", "grise", "019B", None),
    ("edition.decomposer", "Decomposer", "Explode", ["EXPLODE", "DECOMPOSER"],
     "\u2604", "edition", "Modifier la geometrie", "selection", "grise",
     "019B", None),

    # ---- DESSIN 2D (actions reelles via startCadDraft) ----
    ("dessin.ligne", "Ligne", "Line", ["LIGNE", "LINE", "L"], "\u2571",
     "dessin", "Dessin 2D", "document", "actif", None, "LIGNE"),
    ("dessin.polyligne", "Polyligne", "Polyline", ["POLYLIGNE", "POLYLINE"],
     "\u2934", "dessin", "Dessin 2D", "document", "actif", None, "POLYLIGNE"),
    ("dessin.rectangle", "Rectangle", "Rectangle",
     ["RECTANGLE", "RECT"], "\u25ad",
     "dessin", "Dessin 2D", "document", "actif", None, "RECTANGLE"),
    ("dessin.triangle", "Triangle", "Triangle", ["TRIANGLE"], "\u25b3",
     "dessin", "Dessin 2D", "document", "actif", None, "TRIANGLE"),
    ("dessin.polygone", "Polygone", "Polygon", ["POLYGONE", "POLYGON"],
     "\u2b20", "dessin", "Dessin 2D", "document", "actif", None, "POLYGONE"),
    ("dessin.cercle", "Cercle", "Circle", ["CERCLE", "CIRCLE", "C"], "\u25cb",
     "dessin", "Dessin 2D", "document", "actif", None, "CERCLE"),
    ("dessin.arc", "Arc", "Arc", ["ARC"], "\u25e1",
     "dessin", "Dessin 2D", "document", "actif", None, "ARC"),

    # ---- AFFICHAGE : apparence (actions reelles) ----
    ("affichage.epaisseur", "Epaisseur de trait", "Line weight",
     ["EPAISSEUR", "LW", "LINEWEIGHT"], "\u2501",
     "affichage", "Apparence", "vue", "actif", None, "EPAISSEUR"),
    ("affichage.couleur", "Couleur", "Color", ["COULEUR", "COLOR"], "\u25c9",
     "affichage", "Apparence", "vue", "actif", None, "COULEUR"),
    ("affichage.couleurservice", "Couleur par service", "Color by service",
     ["COULEURSERVICE", "COLORBYSERVICE", "CBS"], "\u25d1",
     "affichage", "Apparence", "vue", "actif", None, "COULEURSERVICE"),
    ("affichage.style", "Style actif", "Active style", ["STYLE"], "\u2712",
     "affichage", "Apparence", "vue", "actif", None, "STYLE"),
    ("affichage.perf", "Performance", "Performance", ["PERF"], "\u23f1",
     "affichage", "Outils", "session", "actif", None, "PERF"),
    ("affichage.masquer", "Masquer", "Hide", ["HIDE", "MASQUER"], "\u25cc",
     "affichage", "Apparence", "vue", "grise", "019C", None),

    # ---- DONNEES : tags et proprietes (actions reelles) ----
    ("donnees.tag", "Tag du troncon", "Segment tag", ["TAG"], "\u25a3",
     "donnees", "Tags", "selection", "actif", None, "TAG"),
    ("donnees.tagformat", "Format de tag", "Tag format",
     ["TAGFORMAT", "TF"], "\u2263",
     "donnees", "Tags", "projet", "actif", None, "TAGFORMAT"),
    ("donnees.tagdisplay", "Afficher les tags", "Show tags",
     ["TAGDISPLAY", "TD", "AFFICHETAG", "TAGON"], "\u25a4",
     "donnees", "Tags", "vue", "actif", None, "TAGDISPLAY"),
    ("donnees.autotag", "Tag automatique", "Auto tag", ["AUTOTAG"], "\u2699",
     "donnees", "Tags", "projet", "actif", None, "AUTOTAG"),
    ("donnees.renumber", "Renumeroter", "Renumber",
     ["RENUMBER", "RN", "RENUMEROTER"], "\u2116",
     "donnees", "Tags", "projet", "actif", None, "RENUMBER"),
    ("donnees.service", "Service / fluide", "Service",
     ["SERVICE", "FLUIDE"], "\u2708",
     "donnees", "Tags", "selection", "actif", None, "SERVICE"),
    ("donnees.datamanager", "Gestionnaire de donnees", "Data manager",
     ["DATAMANAGER", "DM", "TABLEAU"], "\u2338",
     "donnees", "Tables", "projet", "actif", None, "DATAMANAGER"),
    ("donnees.proprietes", "Inspecteur de proprietes", "Properties",
     ["PROPRIETES", "PROPS", "PR", "PROPERTIES"], "\u2261",
     "donnees", "Tables", "selection", "actif", None, "PROPRIETES"),

    # ---- DONNEES : production ortho et iso (declarees, inertes) ----
    ("donnees.orthocreate", "Creer vue ortho", "Create ortho",
     ["PLANTORTHOCREATE"], "\u25f0",
     "donnees", "Production", "document", "grise", "020F", None),
    ("donnees.orthoupdate", "Mettre a jour ortho", "Update ortho",
     ["PLANTORTHOUPDATE"], "\u25f1",
     "donnees", "Production", "document", "grise", "020F", None),
    ("donnees.isoproduction", "Production iso", "Iso production",
     ["PLANTISOPRODUCTION"], "\u25f2",
     "donnees", "Production", "document", "grise", "020F", None),

    # ---- FICHIER : projet (actions reelles) ----
    ("fichier.reglages", "Reglages du projet", "Project setup",
     ["PROJECTSETUP", "PS", "SETUP", "PROJET"], "\u2692",
     "fichier", "Projet", "projet", "actif", None, "PROJECTSETUP"),
    ("fichier.restaurer", "Restaurer une sauvegarde", "Restore",
     ["RESTAURER", "RESTORE"], "\u21ba",
     "fichier", "Enregistrement", "projet", "actif", None, "RESTAURER"),
    ("fichier.gestionprojets", "Gestion des projets", "Project manager",
     ["PROJECTMANAGER"], "\u2263",
     "fichier", "Projet", "session", "actif", None, "PROJECTMANAGER"),
    ("fichier.compacter", "Compacter le projet", "Compress project",
     ["COMPRESSPROJECT"], "\u2b0c",
     "fichier", "Projet", "projet", "grise", "018", None),

    # ---- PRECISION : verification ----
    ("precision.specviewer", "Visionneuse de spec", "Spec viewer",
     ["PLANTSPECVIEWER"], "\u2637",
     "precision", "Verification", "projet", "actif", None, "PLANTSPECVIEWER"),
    ("precision.plantvalidate", "Valider la tuyauterie", "Validate piping",
     ["PLANTVALIDATE"], "\u2714",
     "precision", "Verification", "projet", "grise", "018", None),
    ("precision.plantaudit", "Audit tuyauterie", "Piping audit",
     ["PLANTAUDIT"], "\u2691",
     "precision", "Verification", "projet", "grise", "018", None),
    ("precision.auditproject", "Audit du projet", "Project audit",
     ["AUDITPROJECT"], "\u2690",
     "precision", "Verification", "projet", "grise", "018", None),
    ("precision.specupdatecheck", "Controle de mise a jour spec",
     "Spec update check", ["PLANTSPECUPDATECHECK"], "\u2691",
     "precision", "Verification", "projet", "grise", "018", None),

    # ---- 3D : navigation et tuyauterie volumique ----
    # Groupe "Navigation" et non "Navigation 3D" : le 017M a deja cree un
    # groupe "Navigation" dans cet onglet, et deux groupes aux noms voisins
    # dans le meme onglet seraient illisibles.
    ("trois_d.orbite", "Orbite 3D", "3D orbit", ["3DORBIT", "ORBITE"],
     "\u25d4", "trois_d", "Navigation", "vue", "grise", "019C", None),
    ("trois_d.pointvue", "Point de vue", "View point", ["VPOINT"], "\u25d5",
     "trois_d", "Navigation", "vue", "grise", "019C", None),
    ("trois_d.pipeadd", "Ajouter tube 3D", "Add pipe", ["PLANTPIPEADD"],
     "\u2b1a", "trois_d", "Tuyauterie 3D", "document", "grise", "019C", None),
    ("trois_d.nozzle", "Ajouter piquage", "Add nozzle", ["PLANTNOZZLEADD"],
     "\u22c8", "trois_d", "Tuyauterie 3D", "document", "grise", "019C", None),
    ("trois_d.equipcreate", "Creer equipement", "Create equipment",
     ["PLANTEQUIPMENTCREATE"], "\u2b1c",
     "trois_d", "Equipements", "document", "grise", "019C", None),
    ("trois_d.equipconvert", "Convertir en equipement", "Convert equipment",
     ["PLANTEQUIPMENTCONVERT"], "\u2b1b",
     "trois_d", "Equipements", "selection", "grise", "019C", None),
    ("trois_d.convertline", "Convertir en ligne", "Convert line",
     ["PLANTCONVERTLINE"], "\u2500",
     "trois_d", "Tuyauterie 3D", "selection", "grise", "019C", None),
    ("trois_d.fittingmove", "Deplacer un raccord", "Move fitting",
     ["PLANTFITTINGMOVE"], "\u2b83",
     "trois_d", "Tuyauterie 3D", "selection", "grise", "019C", None),
    ("trois_d.flipfitting", "Retourner un raccord", "Flip fitting",
     ["PLANTFLIPFITTING"], "\u2b82",
     "trois_d", "Tuyauterie 3D", "selection", "grise", "019C", None),
    ("trois_d.connect", "Connecter", "Connect", ["PLANTCONNECT"], "\u22c4",
     "trois_d", "Tuyauterie 3D", "selection", "grise", "019C", None),

    # ---- 3D : structure et genie civil ----
    ("trois_d.platine_acier", "Platine acier", "Steel plate",
     ["PLANTSTEELPLATE"], "\u25ac",
     "trois_d", "Structure et genie civil", "document", "grise",
     "019S+", None),
    ("trois_d.semelle", "Semelle", "Footing", ["PLANTSTEELFOOTING"],
     "\u2b1f", "trois_d", "Structure et genie civil", "document", "grise",
     "019S+", None),
    ("trois_d.escalier", "Escalier", "Stair", ["PLANTSTEELSTAIR"], "\u2b67",
     "trois_d", "Structure et genie civil", "document", "grise",
     "019S+", None),
    ("trois_d.rack", "Rack a tuyaux", "Pipe rack", ["PLANTSTEELRACK"],
     "\u2263", "trois_d", "Structure et genie civil", "document", "grise",
     "019S+", None),
    ("trois_d.rail", "Rail", "Rail", ["PLANTSTEELRAIL"], "\u2550",
     "trois_d", "Structure et genie civil", "document", "grise",
     "019S+", None),
    ("trois_d.support_ajout", "Ajouter un support", "Add support",
     ["PLANTSUPPORTADD"], "\u2534",
     "trois_d", "Supports", "document", "grise", "019S+", None),
    ("trois_d.support_convert", "Convertir en support", "Convert support",
     ["PLANTSUPPORTCONVERT"], "\u252c",
     "trois_d", "Supports", "selection", "grise", "019S+", None),
]


# --------------------------------------------------------------------------
# GENERATION DU TEXTE TYPESCRIPT DES NOUVELLES ENTREES
# --------------------------------------------------------------------------
def ts(valeur):
    """Chaine TypeScript sure : accents et symboles en echappements \\uXXXX."""
    return json.dumps(valeur, ensure_ascii=True)


def bloc_nouvelles_entrees():
    ordres = {}
    par_onglet = {}
    for e in NOUVELLES:
        par_onglet.setdefault(e[5], []).append(e)
    morceaux = ["", "  // ==================================================",
                "  // PATCH 017M2 : les commandes des deux tables du moteur.",
                "  // etat \"actif\" = verifie comme agissant dans",
                "  // executeCadCommand. etat \"grise\" = declaree mais le code",
                "  // ne fait qu annoncer la commande : pas de bouton actif.",
                "  // =================================================="]
    for onglet in ["fichier", "edition", "dessin", "annoter", "precision",
                   "insertion", "trois_d", "donnees", "affichage"]:
        entrees = par_onglet.get(onglet)
        if not entrees:
            continue
        morceaux.append("  // ---- onglet %s ----" % onglet)
        for (ident, fr, en, alias, icone, ong, groupe, portee, etat,
             jalon, commande) in entrees:
            cle = (ong, groupe)
            # Decalage de 50 : certains groupes existent deja au 017M
            # (Enregistrement, Outils). Sans ce decalage, deux entrees
            # porteraient le meme ordre et l affichage serait arbitraire.
            ordres[cle] = ordres.get(cle, 50) + 1
            champs = [
                "id:%s" % ts(ident),
                "nomFr:%s" % ts(fr),
                "nomEn:%s" % ts(en),
                "aliases:[%s]" % ",".join(ts(a) for a in alias),
                "icone:%s" % ts(icone),
                "onglet:%s" % ts(ong),
                "groupe:%s" % ts(groupe),
                "ordre:%d" % ordres[cle],  # noqa: E501
                "portee:%s" % ts(portee),
                "etat:%s" % ts(etat),
            ]
            if commande:
                champs.append("commande:%s" % ts(commande))
            if jalon:
                champs.append("jalon:%s" % ts(jalon))
            morceaux.append("  { " + ", ".join(champs) + " },")
    return "\n".join(morceaux) + "\n"


# --------------------------------------------------------------------------
# ANCRES
# --------------------------------------------------------------------------
ANCRE_TYPE = """  /** Pour les grisees : jalon qui activera la commande. */
  jalon?: string;
}"""

NOUVEAU_TYPE = """  /** Pour les grisees : jalon qui activera la commande. */
  jalon?: string;
  /**
   * PATCH 017M2 : commande equivalente au clavier. Quand ce champ est
   * renseigne, le ruban appelle executeCadCommand(commande) : le bouton
   * emprunte exactement le chemin de la ligne de commande. Une seule voie
   * d execution, donc aucune divergence possible (regle R8).
   */
  commande?: string;
}"""

ANCRE_FIN_TABLEAU = """ source:{menu:"Outils",index:3} },
];"""

ANCIEN_RESOLVEUR = """  const pdiCibleRuban017M = (entree: PdiEntreeRuban017M) => {
    if (!entree.source) return undefined;
    const groupe = cadMenuGroups.find((g) => g.title === entree.source!.menu);
    if (!groupe) return undefined;
    return groupe.items[entree.source!.index];
  };"""

NOUVEAU_RESOLVEUR = """  const pdiCibleRuban017M = (
    entree: PdiEntreeRuban017M,
  ): { label: string; hint?: string; run: () => void; disabled?: boolean } | undefined => {
    // PATCH 017M2 : deux origines d action possibles.
    // 1. source = { menu, index } : action historique du moteur, reutilisee
    //    telle quelle, sans reecriture.
    if (entree.source) {
      const groupe = cadMenuGroups.find((g) => g.title === entree.source!.menu);
      if (!groupe) return undefined;
      return groupe.items[entree.source!.index];
    }
    // 2. commande : on passe par executeCadCommand, exactement comme si
    //    l utilisateur avait tape la commande au clavier. Le ruban et la ligne
    //    de commande partagent ainsi UNE seule voie d execution.
    if (entree.commande) {
      const cmd017M2 = entree.commande;
      return {
        label: entree.nomFr,
        hint: "Equivaut a taper " + cmd017M2 + " dans la ligne de commande",
        run: () => executeCadCommand(cmd017M2),
      };
    }
    return undefined;
  };"""


def ajouter_alias(registre, ident, nouveaux):
    """Complete la liste d alias d une entree existante, sans doublon."""
    motif = re.compile(r'(\{ id:"' + re.escape(ident)
                       + r'",[^\n]*?aliases:\[)([^\]]*)(\])')
    m = motif.search(registre)
    if not m:
        return registre, False
    presents = re.findall(r'"([^"]+)"', m.group(2))
    ajouts = [a for a in nouveaux if a not in presents]
    if not ajouts:
        return registre, True
    liste = ",".join(ts(a) for a in presents + ajouts)
    return registre[:m.start()] + m.group(1).replace(
        m.group(1), m.group(1)) + liste + m.group(3) \
        + registre[m.end():], True


# --------------------------------------------------------------------------
# PROGRAMME
# --------------------------------------------------------------------------
def main():
    racine = trouver_racine()
    chemin_moteur = os.path.join(racine, REL_MOTEUR)
    chemin_registre = os.path.join(racine, REL_REGISTRE)
    chemin_cad = os.path.join(racine, REL_CAD)
    chemin_version = os.path.join(racine, REL_VERSION)

    print("=" * 72)
    print("PATCH %s - TOUTES LES COMMANDES DANS LE RUBAN" % PATCH)
    print("=" * 72)
    print("Projet : %s" % racine)

    # --- 1. prerequis ---
    print("\n--- 1. Prerequis ---")
    if not os.path.exists(chemin_registre):
        raise SystemExit(
            "ARRET : %s absent. Appliquez d abord le patch 017M."
            % REL_REGISTRE)
    registre = lire(chemin_registre)
    moteur = lire(chemin_moteur)
    cad = lire(chemin_cad)
    # Le moteur n utilise PAS le nom du tableau : il importe les onglets et
    # les deux fonctions d aide. C est cet import qu il faut tester.
    if './pdiRegistreCommandes.v1"' not in moteur \
            or "pdiGroupesOnglet017M" not in moteur:
        raise SystemExit(
            "ARRET : le moteur n importe pas le registre. Appliquez 017M.")
    if "executeCadCommand" not in moteur:
        raise SystemExit("ARRET : executeCadCommand introuvable dans le moteur.")
    print("  OK    017M present, executeCadCommand present")

    # --- 2. releve des commandes dans le code ---
    print("\n--- 2. Releve des deux tables du moteur ---")
    noms_auto, noms_plant = relever_commandes(cad)
    union = sorted(set(n.upper() for n in noms_auto)
                   | set(n.upper() for n in noms_plant))
    doublons = sorted(set(n.upper() for n in noms_auto)
                      & set(n.upper() for n in noms_plant))
    print("  AUTOCAD_COMMANDS ........... %3d" % len(noms_auto))
    print("  PDI_PLANT3D_COMMAND_TABLE .. %3d" % len(noms_plant))
    print("  declarees dans les deux .... %3d  %s"
          % (len(doublons), ", ".join(doublons)))
    print("  COMMANDES DISTINCTES ....... %3d" % len(union))

    # --- 3. alias supplementaires ---
    print("\n--- 3. Synonymes rattaches aux boutons existants ---")
    for ident, alias in ALIAS_SUPPLEMENTAIRES:
        registre, trouve = ajouter_alias(registre, ident, alias)
        note(trouve, "synonymes de %s : %s" % (ident, ", ".join(alias)))

    # --- 4. nouvelles entrees ---
    print("\n--- 4. Declaration des commandes manquantes ---")
    if "commande?: string;" in registre:
        deja("le champ commande existe dans le type")
    else:
        if ANCRE_TYPE not in registre:
            raise SystemExit(
                "ARRET : ancre du type PdiEntreeRuban017M introuvable.")
        registre = registre.replace(ANCRE_TYPE, NOUVEAU_TYPE, 1)
        note("commande?: string;" in registre,
             "champ commande ajoute au type")

    if "PATCH 017M2 : les commandes des deux tables" in registre:
        deja("les commandes sont deja declarees")
    else:
        if ANCRE_FIN_TABLEAU not in registre:
            raise SystemExit(
                "ARRET : fin du tableau PDI_REGISTRE_RUBAN_017M introuvable.")
        remplacement = (' source:{menu:"Outils",index:3} },\n'
                        + bloc_nouvelles_entrees() + "];")
        registre = registre.replace(ANCRE_FIN_TABLEAU, remplacement, 1)
        note("PATCH 017M2" in registre, "%d commandes declarees"
             % len(NOUVELLES))

    # --- 5. verification : aucune commande oubliee ---
    print("\n--- 5. Verification : les %d commandes sont-elles listees ? ---"
          % len(union))
    majuscule = registre.upper()
    manquantes = []
    for nom in union:
        if ('"%s"' % nom) not in majuscule:
            manquantes.append(nom)
    if manquantes:
        print("  MANQUANTES : %s" % ", ".join(manquantes))
    note(not manquantes, "les %d commandes des deux tables sont listees"
         % len(union))

    actifs = registre.count('etat:"actif"')
    grises = registre.count('etat:"grise"')
    total = registre.count('{ id:"')
    note(total >= 125, "registre garni : %d entrees (%d actives, %d grisees)"
         % (total, actifs, grises))
    attendu_cmd = sum(1 for e in NOUVELLES if e[10])
    note(registre.count('commande:"') == attendu_cmd,
         "%d entrees executent une commande reelle (attendu %d)"
         % (registre.count('commande:"'), attendu_cmd))
    note("019B" in registre and "019C" in registre and "019S+" in registre
         and "020F" in registre and "018" in registre,
         "jalons annonces : 018, 019B, 019C, 019S+, 020F")

    ecrire(chemin_registre, registre)

    # --- 6. branchement dans le moteur ---
    print("\n--- 6. Une seule voie d execution ---")
    if "PATCH 017M2 : deux origines d action" in moteur:
        deja("le resolveur accepte deja les commandes")
    else:
        if ANCIEN_RESOLVEUR not in moteur:
            raise SystemExit(
                "ARRET : resolveur pdiCibleRuban017M introuvable. "
                "Le patch 017M a-t-il ete modifie ?")
        sauvegarder(chemin_moteur)
        moteur = moteur.replace(ANCIEN_RESOLVEUR, NOUVEAU_RESOLVEUR, 1)
        note("executeCadCommand(cmd017M2)" in moteur,
             "le ruban passe par executeCadCommand, comme le clavier")
        ecrire(chemin_moteur, moteur)

    # --- 7. pastille ---
    print("\n--- 7. Pastille de version ---")
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
  1. Pastille : 017M2.
  2. Onglet EDITION : un groupe "Transformer" apparait avec
     Deplacer, Rotation, Miroir, Effacer. Selectionnez un noeud puis
     cliquez Rotation : la commande doit repondre comme si vous aviez
     tape ROTATION au clavier.
  3. Onglet EDITION, groupe "Modifier la geometrie" : Echelle, Ajuster,
     Prolonger, Raccord, Chanfrein, Decaler, Etirer, Reseau, Decomposer
     sont VISIBLES mais GRISES. Survolez Echelle : l infobulle annonce
     le jalon 019B. C est volontaire : ces commandes sont declarees dans
     le moteur mais n executent rien aujourd hui.
  4. Onglet DESSIN, groupe "Dessin 2D" : Ligne, Polyligne, Rectangle,
     Triangle, Polygone, Cercle, Arc. Cliquez Rectangle : l outil doit
     s armer, comme la commande RECT.
  5. Onglet 3D : quatre groupes remplis et entierement grises
     (Navigation 3D, Tuyauterie 3D, Equipements, Structure et genie
     civil, Supports). L interface est prete pour le passage a la 3D.
  6. Onglet DONNEES : groupes Tags, Tables et Production. Tag,
     Renumeroter, Gestionnaire de donnees repondent ; la Production
     ortho et iso est grisee au jalon 020F.
  7. Onglet AFFICHAGE : Epaisseur, Couleur, Couleur par service, Style
     repondent. Masquer est grise (jalon 019C).
  8. Tapez ZOOM puis REGEN dans la ligne de commande : les deux doivent
     agir. Ce sont maintenant des synonymes du meme bouton Ajuster.
  9. Grouper, Associer, Bloc restent grises au jalon 017Q1. Rotation
     fonctionne deja sur la selection : le groupe ne servira qu a faire
     tourner plusieurs objets comme un seul bloc.
 10. Non-regression : les boutons du 017M (Tube, Te, Coude, Aligner X/Y/Z,
     Rendre parallele, Redresser ISO, Controle reseau, BOM) repondent
     comme avant, ANOMALIES reste d accord avec le compteur du bandeau,
     et la longueur 0 est toujours refusee.
""")


if __name__ == "__main__":
    main()
