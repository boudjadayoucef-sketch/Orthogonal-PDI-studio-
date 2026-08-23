#!/usr/bin/env python3
"""
PATCH 014 — Ligne de commande type AutoCAD / Plant 3D + préparation 3D & exports BOM

Usage:
  1) Copier ce fichier à la racine du projet PD&I.
  2) Lancer: python3 014_pdi_autocad_command_line_plant3d_bom3d.py
  3) Tester: npm run lint && npm run build

Objectif:
- Ajouter/compléter les commandes texte AutoCAD + Plant 3D fournies.
- Préparer un tableau de correspondance pour futur passage 3D.
- Préparer les catégories/champs utiles pour exports BOM.
- Garder les commandes non encore implémentées comme "préparées" avec message clair,
  sans casser le moteur ISO actuel.
"""
from pathlib import Path
from datetime import datetime
import re
import shutil

ROOT = Path(__file__).resolve().parent
ENGINE = ROOT / "src/pdi/isometric/engine/IsometrieModuleV48d.tsx"
CAD_ENGINE = ROOT / "src/pdi/isometric/engine/CadAutocadEngine.ts"
REPORT = ROOT / "014_autocad_command_line_plant3d_bom3d_REPORT.md"
TABLE_MD = ROOT / "014_COMMANDES_PLANT3D_BOM3D_TABLE.md"

COMMANDS_TS = r'''

// PATCH 014 — Plant 3D / AutoCAD command registry for PD&I.
// Ces commandes servent à la ligne de commande type AutoCAD, au futur passage 3D,
// et aux exports BOM. Les commandes non encore natives sont déclarées en mode prepared.
export type PdiCommandReadiness = "implemented" | "prepared" | "future_3d" | "bom_export";
export type PdiCommandDomain =
  | "piping_3d"
  | "equipment_nozzle"
  | "supports"
  | "structure"
  | "iso_ortho"
  | "project_data"
  | "edit"
  | "clipboard"
  | "navigation_3d"
  | "bom";

export interface PdiPlant3dCommandRow {
  id: string;
  command: string;
  aliases: string[];
  domain: PdiCommandDomain;
  description: string;
  readiness: PdiCommandReadiness;
  pdiAction: string;
  bomCategory?: "pipe" | "fitting" | "valve" | "equipment" | "support" | "structure" | "weld" | "document";
  future3dEntity?: "pipeRoute" | "connector" | "spec" | "equipment" | "nozzle" | "support" | "steel" | "ortho" | "iso" | "project" | "view";
}

export const PDI_PLANT3D_COMMAND_TABLE: PdiPlant3dCommandRow[] = [
  { id:"plantpipeadd", command:"PLANTPIPEADD", aliases:["PPA","PIPEADD","ROUTEPIPE","TUBE3D"], domain:"piping_3d", description:"Route une ligne de tuyauterie et insère des composants", readiness:"future_3d", pdiAction:"Préparer routage tuyauterie 3D depuis graph ISO", bomCategory:"pipe", future3dEntity:"pipeRoute" },
  { id:"plantconnect", command:"PLANTCONNECT", aliases:["CONNECT","CONNEXION","PCONNECT"], domain:"piping_3d", description:"Force la connexion automatique entre deux composants", readiness:"prepared", pdiAction:"Connecter ports/nœuds sélectionnés", future3dEntity:"connector" },
  { id:"plantspecviewer", command:"PLANTSPECVIEWER", aliases:["SV","SPEC","SPECVIEWER"], domain:"piping_3d", description:"Ouvre le visualiseur de spécifications", readiness:"prepared", pdiAction:"Ouvrir/futur panneau Spec PD&I", future3dEntity:"spec" },
  { id:"plantspecupdatecheck", command:"PLANTSPECUPDATECHECK", aliases:["SPECUPDATE","CHECKSPEC"], domain:"piping_3d", description:"Vérifie et applique les mises à jour de classe Spec", readiness:"prepared", pdiAction:"Contrôler cohérence DN/spec du projet", future3dEntity:"spec" },
  { id:"plantconvertline", command:"PLANTCONVERTLINE", aliases:["PCL","CONVERTLINE","CONVERTIRLIGNE"], domain:"piping_3d", description:"Convertit une ligne/polyligne 3D en tuyauterie", readiness:"future_3d", pdiAction:"Convertir entités 2D/3D en segments PD&I", bomCategory:"pipe", future3dEntity:"pipeRoute" },
  { id:"plantfittingmove", command:"PLANTFITTINGMOVE", aliases:["FITTINGMOVE","MOVEFITTING","DEPLACERRACCORD"], domain:"piping_3d", description:"Déplace un raccord le long d'un segment", readiness:"implemented", pdiAction:"Déplacer équipement sur tube", bomCategory:"fitting", future3dEntity:"connector" },
  { id:"plantflipfitting", command:"PLANTFLIPFITTING", aliases:["FLIPFITTING","FLIP","RETOURNERRACCORD"], domain:"piping_3d", description:"Aligne ou retourne un raccord inséré", readiness:"implemented", pdiAction:"Miroir/retourner équipement sélectionné", bomCategory:"fitting", future3dEntity:"connector" },

  { id:"plantequipmentcreate", command:"PLANTEQUIPMENTCREATE", aliases:["PEC","EQUIPMENT","EQUIPEMENT"], domain:"equipment_nozzle", description:"Crée équipements standards", readiness:"future_3d", pdiAction:"Créer équipement intelligent PD&I", bomCategory:"equipment", future3dEntity:"equipment" },
  { id:"plantequipmentconvert", command:"PLANTEQUIPMENTCONVERT", aliases:["PECONV","CONVERTEQUIPMENT"], domain:"equipment_nozzle", description:"Convertit un solide 3D en équipement intelligent", readiness:"future_3d", pdiAction:"Convertir volume/bloc en équipement", bomCategory:"equipment", future3dEntity:"equipment" },
  { id:"plantnozzleadd", command:"PLANTNOZZLEADD", aliases:["NOZZLE","PIQUAGE","AJOUTPIQUAGE"], domain:"equipment_nozzle", description:"Ajoute/modifie un piquage sur équipement", readiness:"future_3d", pdiAction:"Créer port/piquage sur équipement", bomCategory:"fitting", future3dEntity:"nozzle" },

  { id:"plantsupportadd", command:"PLANTSUPPORTADD", aliases:["PSA","SUPPORT","SUPPORTADD"], domain:"supports", description:"Insère un support de tuyauterie", readiness:"future_3d", pdiAction:"Ajouter support attaché au tube", bomCategory:"support", future3dEntity:"support" },
  { id:"plantsupportconvert", command:"PLANTSUPPORTCONVERT", aliases:["SUPPORTCONVERT"], domain:"supports", description:"Convertit bloc/solide en support intelligent", readiness:"future_3d", pdiAction:"Convertir objet en support", bomCategory:"support", future3dEntity:"support" },

  { id:"plantsteelmember", command:"PLANTSTEELMEMBER", aliases:["STEELMEMBER","PROFILE","PROFIL"], domain:"structure", description:"Crée profilé métallique standard", readiness:"future_3d", pdiAction:"Préparer profilé structure", bomCategory:"structure", future3dEntity:"steel" },
  { id:"plantsteelplate", command:"PLANTSTEELPLATE", aliases:["STEELPLATE","PLATE","TOLE"], domain:"structure", description:"Crée plaque/tôle", readiness:"future_3d", pdiAction:"Préparer plaque structure", bomCategory:"structure", future3dEntity:"steel" },
  { id:"plantsteelfooting", command:"PLANTSTEELFOOTING", aliases:["FOOTING","FONDATION"], domain:"structure", description:"Dessine fondation béton", readiness:"future_3d", pdiAction:"Préparer fondation", bomCategory:"structure", future3dEntity:"steel" },
  { id:"plantsteelstair", command:"PLANTSTEELSTAIR", aliases:["STAIR","ESCALIER"], domain:"structure", description:"Génère escalier industriel", readiness:"future_3d", pdiAction:"Préparer escalier", bomCategory:"structure", future3dEntity:"steel" },
  { id:"plantsteelrack", command:"PLANTSTEELRACK", aliases:["RACK","ECHELLE"], domain:"structure", description:"Dessine échelles/crinolines", readiness:"future_3d", pdiAction:"Préparer rack/échelle", bomCategory:"structure", future3dEntity:"steel" },
  { id:"plantsteelhandrail", command:"PLANTSTEELHANDRAIL", aliases:["HANDRAIL","GARDECORPS"], domain:"structure", description:"Crée garde-corps", readiness:"future_3d", pdiAction:"Préparer garde-corps", bomCategory:"structure", future3dEntity:"steel" },
  { id:"plantsteelrail", command:"PLANTSTEELRAIL", aliases:["RAIL","LISSE"], domain:"structure", description:"Édite lisses/poteaux garde-corps", readiness:"future_3d", pdiAction:"Éditer garde-corps", bomCategory:"structure", future3dEntity:"steel" },

  { id:"plantorthocreate", command:"PLANTORTHOCREATE", aliases:["ORTHO","ORTHOCREATE"], domain:"iso_ortho", description:"Crée vue plane/élévation depuis modèle 3D", readiness:"future_3d", pdiAction:"Préparer vue ortho", bomCategory:"document", future3dEntity:"ortho" },
  { id:"plantorthoupdate", command:"PLANTORTHOUPDATE", aliases:["ORTHOUPDATE"], domain:"iso_ortho", description:"Met à jour vue orthogonale", readiness:"future_3d", pdiAction:"Mettre à jour vue ortho", future3dEntity:"ortho" },
  { id:"plantisoview", command:"PLANTISOVIEW", aliases:["ISOVIEW","ISO"], domain:"iso_ortho", description:"Ouvre gestionnaire de plans isométriques", readiness:"implemented", pdiAction:"Ouvrir module ISO", bomCategory:"document", future3dEntity:"iso" },
  { id:"plantisoproduction", command:"PLANTISOPRODUCTION", aliases:["ISOPROD","PRODUCTIONISO"], domain:"iso_ortho", description:"Génère dessins ISO fabrication", readiness:"bom_export", pdiAction:"Préparer export ISO + BOM", bomCategory:"document", future3dEntity:"iso" },
  { id:"plantisoquick", command:"PLANTISOQUICK", aliases:["ISOQUICK","QUICKISO"], domain:"iso_ortho", description:"Crée plan ISO de test", readiness:"implemented", pdiAction:"Basculer mode planche ISO", bomCategory:"document", future3dEntity:"iso" },

  { id:"projectmanager", command:"PROJECTMANAGER", aliases:["PM","PROJET"], domain:"project_data", description:"Affiche gestionnaire de projets", readiness:"prepared", pdiAction:"Ouvrir projets PD&I", future3dEntity:"project" },
  { id:"datamanager", command:"DATAMANAGER", aliases:["DM","DATA","DONNEES"], domain:"project_data", description:"Ouvre gestionnaire données/attributs", readiness:"bom_export", pdiAction:"Ouvrir propriétés + table BOM", bomCategory:"document", future3dEntity:"project" },
  { id:"plantaudit", command:"PLANTAUDIT", aliases:["AUDIT","REPAIR"], domain:"project_data", description:"Répare erreurs modèle/base", readiness:"prepared", pdiAction:"Audit graph/ports/soudures", future3dEntity:"project" },
  { id:"compressproject", command:"COMPRESSPROJECT", aliases:["COMPRESS","OPTIMISER"], domain:"project_data", description:"Compresse caches projet", readiness:"prepared", pdiAction:"Optimiser projet local", future3dEntity:"project" },
  { id:"auditproject", command:"AUDITPROJECT", aliases:["AUDITPROJET"], domain:"project_data", description:"Vérifie intégrité projet", readiness:"prepared", pdiAction:"Audit complet projet", future3dEntity:"project" },
  { id:"plantvalidate", command:"PLANTVALIDATE", aliases:["VALIDATE","VALIDER"], domain:"project_data", description:"Valide P&ID / modèle 3D", readiness:"prepared", pdiAction:"Valider cohérence graphe/BOM", future3dEntity:"project" },

  { id:"move", command:"MOVE", aliases:["M","DEPLACER","MOVE"], domain:"edit", description:"Déplace les objets sélectionnés", readiness:"implemented", pdiAction:"Commande guidée déplacement" },
  { id:"copy", command:"COPY", aliases:["CO","CP","COPIE","COPY"], domain:"edit", description:"Copie les objets sélectionnés", readiness:"implemented", pdiAction:"Commande guidée copie" },
  { id:"scale", command:"SCALE", aliases:["SC","ECHELLE"], domain:"edit", description:"Change échelle objets", readiness:"prepared", pdiAction:"Préparer échelle sélection" },
  { id:"rotate", command:"ROTATE", aliases:["RO","ROTATION"], domain:"edit", description:"Rotation autour point base", readiness:"implemented", pdiAction:"Rotation sélection" },
  { id:"erase", command:"ERASE", aliases:["E","EFFACER","DELETE","SUPPR"], domain:"edit", description:"Efface/Supprime", readiness:"implemented", pdiAction:"Supprimer sélection" },
  { id:"explode", command:"EXPLODE", aliases:["X","EXPLOSER"], domain:"edit", description:"Décompose objet composite", readiness:"prepared", pdiAction:"Préparer décomposition groupe" },
  { id:"mirror", command:"MIRROR", aliases:["MI","MIROIR"], domain:"edit", description:"Symétrie miroir", readiness:"implemented", pdiAction:"Miroir sélection" },
  { id:"stretch", command:"STRETCH", aliases:["S","ETIRER"], domain:"edit", description:"Étire objets", readiness:"prepared", pdiAction:"Préparer stretch sélection" },
  { id:"trim", command:"TRIM", aliases:["TR","AJUSTER","COUPER"], domain:"edit", description:"Ajuste/coupe objets", readiness:"prepared", pdiAction:"Préparer trim" },
  { id:"extend", command:"EXTEND", aliases:["EX","PROLONGER"], domain:"edit", description:"Prolonge objets", readiness:"prepared", pdiAction:"Préparer extend" },
  { id:"fillet", command:"FILLET", aliases:["F","RACCORD","CONGE"], domain:"edit", description:"Raccorde avec arc/congé", readiness:"prepared", pdiAction:"Préparer congé/coude automatique", bomCategory:"fitting" },
  { id:"chamfer", command:"CHAMFER", aliases:["CHA","CHANFREIN"], domain:"edit", description:"Biseauter arêtes", readiness:"prepared", pdiAction:"Préparer chanfrein" },
  { id:"offset", command:"OFFSET", aliases:["O","DECALER"], domain:"edit", description:"Crée parallèles/concentriques", readiness:"prepared", pdiAction:"Préparer offset" },
  { id:"array", command:"ARRAY", aliases:["AR","RESEAU"], domain:"edit", description:"Copies multiples en réseau", readiness:"prepared", pdiAction:"Préparer array" },

  { id:"copyclip", command:"COPYCLIP", aliases:["CTRL+C","COPIERCLIP"], domain:"clipboard", description:"Copie sélection presse-papiers", readiness:"implemented", pdiAction:"Copier sélection" },
  { id:"copybase", command:"COPYBASE", aliases:["CTRL+SHIFT+C","COPIERBASE"], domain:"clipboard", description:"Copie avec point de base", readiness:"implemented", pdiAction:"Copie guidée point base" },
  { id:"pasteclip", command:"PASTECLIP", aliases:["CTRL+V","COLLER"], domain:"clipboard", description:"Colle presse-papiers", readiness:"implemented", pdiAction:"Coller au clic" },
  { id:"pasteorig", command:"PASTEORIG", aliases:["COLLERORIG"], domain:"clipboard", description:"Colle aux coordonnées origine", readiness:"prepared", pdiAction:"Coller coordonnées origine" },
  { id:"pasteblock", command:"PASTEBLOCK", aliases:["CTRL+SHIFT+V","COLLERBLOC"], domain:"clipboard", description:"Colle comme bloc", readiness:"prepared", pdiAction:"Créer groupe/bloc" },
  { id:"cutclip", command:"CUTCLIP", aliases:["CTRL+X","COUPER"], domain:"clipboard", description:"Coupe vers presse-papiers", readiness:"implemented", pdiAction:"Copier puis supprimer" },

  { id:"zoom", command:"ZOOM", aliases:["Z","ZOOM"], domain:"navigation_3d", description:"Zoom vue courante", readiness:"implemented", pdiAction:"Zoom/recentrage", future3dEntity:"view" },
  { id:"pan", command:"PAN", aliases:["P","PANORAMIQUE","MAIN"], domain:"navigation_3d", description:"Déplace la vue", readiness:"implemented", pdiAction:"Mode main/pan", future3dEntity:"view" },
  { id:"3dorbit", command:"3DORBIT", aliases:["3DO","ORBIT","ORBITE3D"], domain:"navigation_3d", description:"Pivoter autour modèle 3D", readiness:"future_3d", pdiAction:"Préparer orbite 3D", future3dEntity:"view" },
  { id:"vpoint", command:"VPOINT", aliases:["VUE3D","POINTVUE"], domain:"navigation_3d", description:"Direction visualisation 3D", readiness:"future_3d", pdiAction:"Préparer vues 3D", future3dEntity:"view" },
  { id:"regen", command:"REGEN", aliases:["RE","ACTUALISER"], domain:"navigation_3d", description:"Régénère dessin", readiness:"implemented", pdiAction:"Recalcul graphe/BOM/vue", future3dEntity:"view" },

  { id:"bom", command:"BOM", aliases:["BOM","METRE","NOMENCLATURE","MATERIEL","LISTE"], domain:"bom", description:"Ouvre/prépare nomenclature et métré", readiness:"bom_export", pdiAction:"Ouvrir tableau BOM/export", bomCategory:"document" },
];

export const PDI_BOM_EXPORT_COLUMNS = [
  "itemNo", "category", "lineNumber", "service", "spec", "dn", "nps", "description",
  "material", "rating", "schedule", "quantity", "unit", "lengthM", "weightKg",
  "weldCount", "tag", "fromNode", "toNode", "sourceCommand", "future3dEntity"
] as const;
'''

REPORT_TEMPLATE = """# PATCH 014 — Ligne de commande AutoCAD / Plant 3D + BOM/3D

Date: {date}

## Ajouts
- Registre `PDI_PLANT3D_COMMAND_TABLE` avec commandes AutoCAD Plant 3D + AutoCAD de base.
- Alias français/anglais : `COPIE`, `COPY`, `CO`, `PLANTPIPEADD`, `PPA`, etc.
- Statuts de préparation : `implemented`, `prepared`, `future_3d`, `bom_export`.
- Colonnes `PDI_BOM_EXPORT_COLUMNS` pour préparer export BOM.
- Tableau Markdown `014_COMMANDES_PLANT3D_BOM3D_TABLE.md`.

## Principe
Les commandes déjà supportées peuvent lancer les actions existantes. Les commandes Plant 3D non encore natives restent déclarées et renvoient un message de préparation, afin de préparer proprement le passage 3D sans casser l’ISO actuel.

## Tests recommandés
- npm run lint
- npm run build
- Tester dans la barre de commande : `COPIE`, `CO`, `MOVE`, `COUDE`, `BOM`, `PLANTPIPEADD`, `PPA`, `DATAMANAGER`, `3DORBIT`.
"""

def backup(path: Path):
    b = path.with_suffix(path.suffix + ".before014")
    if path.exists() and not b.exists():
        shutil.copy2(path, b)

def ensure_file(path: Path, label: str):
    if not path.exists():
        raise FileNotFoundError(f"Fichier introuvable: {path} ({label})")

def patch_cad_engine():
    ensure_file(CAD_ENGINE, "CadAutocadEngine")
    backup(CAD_ENGINE)
    s = CAD_ENGINE.read_text(encoding="utf-8")
    if "PDI_PLANT3D_COMMAND_TABLE" not in s:
        s += COMMANDS_TS
    CAD_ENGINE.write_text(s, encoding="utf-8")

def patch_engine_executor():
    ensure_file(ENGINE, "IsometrieModuleV48d")
    backup(ENGINE)
    s = ENGINE.read_text(encoding="utf-8")

    # Importer la table si l'import CadAutocadEngine existe.
    if "PDI_PLANT3D_COMMAND_TABLE" not in s:
        s = s.replace(
            "searchCadCommands,",
            "searchCadCommands,\n  PDI_PLANT3D_COMMAND_TABLE,",
            1,
        )

    # Ajouter un fallback dans executeCadCommand pour les commandes préparées.
    marker = """    } else {
      setAutocadPrompt(`Commande : \"${cmdId}\". Tapez REC, TRI, L, C, COPIER, COLLER...`);
    }
  };"""
    replacement = """    } else {
      const plant3dCommand = PDI_PLANT3D_COMMAND_TABLE?.find((item) =>
        item.id.toLowerCase() === cmdId ||
        item.command.toLowerCase() === cmdId ||
        item.aliases.some((alias) => alias.toLowerCase() === cmdId),
      );
      if (plant3dCommand) {
        if (plant3dCommand.id === "datamanager" || plant3dCommand.id === "bom") {
          setRightPanelOpen(true);
          setRightPanelTab("bom");
        }
        if (plant3dCommand.id === "plantisoview" || plant3dCommand.id === "plantisoquick") {
          setIsoMode("planche");
        }
        if (plant3dCommand.id === "pan") {
          setInteractionMode("main");
        }
        if (plant3dCommand.id === "zoom" || plant3dCommand.id === "regen") {
          resetView();
        }
        setAutocadPrompt(`COMMANDE [${plant3dCommand.command}] : ${plant3dCommand.pdiAction}. Statut: ${plant3dCommand.readiness}.`);
        setStatusMessage(`${plant3dCommand.command} — ${plant3dCommand.description}`);
      } else {
        setAutocadPrompt(`Commande inconnue : \"${cmdId}\". Essayez COPIE, MOVE, COUDE, BOM, PLANTPIPEADD, DATAMANAGER...`);
      }
    }
  };"""
    if marker in s and "plant3dCommand" not in s:
        s = s.replace(marker, replacement, 1)

    ENGINE.write_text(s, encoding="utf-8")

def write_table():
    rows = [
        ("PLANTPIPEADD", "PPA", "Piping 3D", "future_3d", "pipeRoute", "pipe"),
        ("PLANTCONNECT", "-", "Piping 3D", "prepared", "connector", "-"),
        ("PLANTSPECVIEWER", "SV", "Spec", "prepared", "spec", "-"),
        ("PLANTCONVERTLINE", "PCL", "Piping 3D", "future_3d", "pipeRoute", "pipe"),
        ("PLANTFITTINGMOVE", "-", "Fitting", "implemented", "connector", "fitting"),
        ("PLANTFLIPFITTING", "-", "Fitting", "implemented", "connector", "fitting"),
        ("PLANTEQUIPMENTCREATE", "PEC", "Equipment", "future_3d", "equipment", "equipment"),
        ("PLANTNOZZLEADD", "-", "Nozzle", "future_3d", "nozzle", "fitting"),
        ("PLANTSUPPORTADD", "PSA", "Support", "future_3d", "support", "support"),
        ("PLANTSTEELMEMBER", "-", "Structure", "future_3d", "steel", "structure"),
        ("PLANTORTHOCREATE", "-", "Ortho", "future_3d", "ortho", "document"),
        ("PLANTISOPRODUCTION", "-", "ISO fabrication", "bom_export", "iso", "document"),
        ("PROJECTMANAGER", "PM", "Projet", "prepared", "project", "-"),
        ("DATAMANAGER", "DM", "Données/BOM", "bom_export", "project", "document"),
        ("PLANTAUDIT", "-", "Audit", "prepared", "project", "-"),
        ("PLANTVALIDATE", "-", "Validation", "prepared", "project", "-"),
        ("MOVE", "M", "Édition", "implemented", "-", "-"),
        ("COPY", "CO/CP", "Édition", "implemented", "-", "-"),
        ("ROTATE", "RO", "Édition", "implemented", "-", "-"),
        ("ERASE", "E", "Édition", "implemented", "-", "-"),
        ("FILLET", "F", "Édition", "prepared", "connector", "fitting"),
        ("COPYBASE", "CTRL+SHIFT+C", "Clipboard", "implemented", "-", "-"),
        ("PASTECLIP", "CTRL+V", "Clipboard", "implemented", "-", "-"),
        ("ZOOM", "Z", "Navigation", "implemented", "view", "-"),
        ("PAN", "P", "Navigation", "implemented", "view", "-"),
        ("3DORBIT", "3DO", "Navigation 3D", "future_3d", "view", "-"),
        ("REGEN", "RE", "Navigation", "implemented", "view", "-"),
        ("BOM", "METRE", "Export", "bom_export", "project", "document"),
    ]
    md = ["# Tableau PATCH 014 — Commandes Plant 3D / AutoCAD vers PD&I", "", "| Commande | Alias | Domaine | Statut | Entité 3D future | Catégorie BOM |", "|---|---|---|---|---|---|"]
    md += [f"| {a} | {b} | {c} | {d} | {e} | {f} |" for a,b,c,d,e,f in rows]
    md += ["", "## Colonnes BOM préparées", "", "`itemNo, category, lineNumber, service, spec, dn, nps, description, material, rating, schedule, quantity, unit, lengthM, weightKg, weldCount, tag, fromNode, toNode, sourceCommand, future3dEntity`", ""]
    TABLE_MD.write_text("\n".join(md), encoding="utf-8")

def main():
    patch_cad_engine()
    patch_engine_executor()
    write_table()
    REPORT.write_text(REPORT_TEMPLATE.format(date=datetime.now().isoformat(timespec="seconds")), encoding="utf-8")
    print("PATCH 014 appliqué localement.")
    print("- Commandes Plant 3D / AutoCAD ajoutées au registre")
    print("- Fallback ligne de commande ajouté")
    print("- Tableau 3D/BOM généré:", TABLE_MD)
    print("- Rapport:", REPORT)

if __name__ == "__main__":
    main()
