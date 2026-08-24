#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PATCH 017F1B - PD&I : hotfix panneaux, Echap, onglet du projet supprime

Retours de test 017F1 : 1,2,3,4,5,6,8,9 OK.

  1. Les panneaux Bibliothequee (gauche) et BOM / Proprietes (droite) ne
     s ouvrent plus automatiquement a l ouverture d une session. Leur etat est
     memorise (ferme par defaut).
  2. Echap redevient global : il ferme les panneaux, le menu contextuel et
     desselectionne. Cause : le capteur de saisie natif (016A2) appelait
     e.stopPropagation() en phase de capture et confisquait la touche.
  3. Test 7 : supprimer un projet ferme aussi son onglet (le nom restait
     affiche dans la barre d onglets).

Prerequis : patchs 017E et 017F1 appliques.
Idempotent. Sauvegardes .before017F1B. Rapport genere.
"""

import os
import shutil
import sys

ROOT = os.getcwd()
ENGINE = os.path.join(ROOT, "src/pdi/isometric/engine/IsometrieModuleV48d.tsx")
APP = os.path.join(ROOT, "src/pdi/app/PdiUnifiedApp.tsx")

notes = []


def read(path):
    with open(path, "r", encoding="utf-8") as fh:
        return fh.read()


def write(path, content):
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)


def backup(path):
    bak = path + ".before017F1B"
    if not os.path.exists(bak):
        shutil.copy2(path, bak)


def sub(src, old, new, label):
    if old in src:
        notes.append("OK : " + label)
        return src.replace(old, new, 1)
    notes.append("NON TROUVE : " + label)
    return src


def check_files():
    for path in (ENGINE, APP):
        if not os.path.exists(path):
            print("ERREUR : fichier introuvable : " + path)
            sys.exit(1)
    if "PATCH 017F1" not in read(APP):
        print("ERREUR : le patch 017F1 n est pas applique sur ce build.")
        sys.exit(1)


# ==================================================== 1. ECHAP REDEVIENT GLOBAL
OLD_ESCAPE = """      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setAutocadCmdInput("");
        setAutocadPrompt("Commande annul\u00e9e.");
        return;
      }"""

NEW_ESCAPE = """      // PATCH 017F1B : Echap ne doit plus etre confisque par le capteur de saisie
      // natif. Ce gestionnaire est en phase de CAPTURE sur window : appeler
      // stopPropagation() empechait les gestionnaires globaux de fermer les
      // panneaux, le menu contextuel et de desselectionner.
      if (e.key === "Escape") {
        setAutocadCmdInput("");
        setAutocadPrompt("Commande annul\u00e9e.");
        return;
      }"""

# ============================================= 2. PANNEAUX NON AUTO-OUVERTS
OLD_LEFT = "  const [leftPanelOpen,setLeftPanelOpen]=useState(true);"
NEW_LEFT = """  // PATCH 017F1B : plus d ouverture automatique des panneaux a l ouverture
  // d une session. L etat choisi par l utilisateur est memorise.
  const [leftPanelOpen,setLeftPanelOpen]=useState<boolean>(()=>{
    try{return window.localStorage.getItem("pdi.leftPanelOpen.v1")==="1";}catch{return false;}
  });"""

OLD_RIGHT = "  const [rightPanelOpen, setRightPanelOpen] = useState(true);"
NEW_RIGHT = """  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(()=>{
    try{return window.localStorage.getItem("pdi.rightPanelOpen.v1")==="1";}catch{return false;}
  });"""

OLD_AUTOHIDE = "  const [autoHideRightPanel, setAutoHideRightPanel] = useState(false);"
NEW_AUTOHIDE = """  const [autoHideRightPanel, setAutoHideRightPanel] = useState(false);
  // PATCH 017F1B : memorisation de l etat des deux panneaux.
  useEffect(()=>{
    try{window.localStorage.setItem("pdi.leftPanelOpen.v1",leftPanelOpen?"1":"0");}catch{}
  },[leftPanelOpen]);
  useEffect(()=>{
    try{window.localStorage.setItem("pdi.rightPanelOpen.v1",rightPanelOpen?"1":"0");}catch{}
  },[rightPanelOpen]);"""


def patch_engine():
    src = read(ENGINE)
    if "PATCH 017F1B" in src:
        notes.append("OK (deja) : moteur ISO (Echap global, panneaux memorises)")
        return
    backup(ENGINE)
    src = sub(src, OLD_ESCAPE, NEW_ESCAPE, "moteur : Echap rendu aux gestionnaires globaux")
    src = sub(src, OLD_LEFT, NEW_LEFT, "moteur : panneau Bibliotheque ferme par defaut")
    src = sub(src, OLD_RIGHT, NEW_RIGHT, "moteur : panneau BOM / Proprietes ferme par defaut")
    src = sub(src, OLD_AUTOHIDE, NEW_AUTOHIDE, "moteur : memorisation de l etat des panneaux")
    write(ENGINE, src)


# ======================================== 3. SUPPRESSION PROJET = ONGLET FERME
OLD_OPEN_PROJECT = "  const openProjectInTab = (entry: { projectId: string; title: string; module: PdiModule }) => {"

NEW_OPEN_PROJECT = """  // PATCH 017F1B : supprimer un projet doit aussi fermer ses onglets, sinon le
  // nom reste affiche dans la barre alors que le projet n existe plus.
  const closeTabsForProject = (projectId: string) => {
    const tabs = workspaceTabs.filter((t) => t.projectId !== projectId);
    if (tabs.length === workspaceTabs.length) return;
    const next = tabs[tabs.length - 1] || null;
    setWorkspaceTabs(tabs);
    setActiveTabId(next?.id || null);
    persistTabs(tabs, next?.id || null);
    if (!next) setActiveModule("projects");
    else if (renamingTabId && !tabs.some((t) => t.id === renamingTabId)) setRenamingTabId(null);
  };
""" + OLD_OPEN_PROJECT

OLD_DELETE_CALL = "{ pdiRemoveProject(entry.projectId); setProjectsRefresh((v) => v + 1); }"
NEW_DELETE_CALL = "{ pdiRemoveProject(entry.projectId); closeTabsForProject(entry.projectId); setProjectsRefresh((v) => v + 1); }"


def patch_app():
    src = read(APP)
    if "PATCH 017F1B" in src:
        notes.append("OK (deja) : coquille (fermeture des onglets du projet supprime)")
        return
    backup(APP)
    src = sub(src, OLD_OPEN_PROJECT, NEW_OPEN_PROJECT, "coquille : fermeture des onglets d un projet supprime")
    src = sub(src, OLD_DELETE_CALL, NEW_DELETE_CALL, "coquille : branchement sur le bouton Supprimer")
    write(APP, src)


REPORT = os.path.join(ROOT, "017F1B_hotfix_panneaux_echap_onglet_projet_REPORT.md")

REPORT_BODY = """# PATCH 017F1B - Hotfix panneaux, Echap, onglet du projet supprime

## Retours de test 017F1
Tests 1, 2, 3, 4, 5, 6, 8 et 9 : conformes.
Test 7 : le projet etait bien supprime, mais son onglet restait affiche.
Nouveaux defauts signales : panneaux ouverts d office, Echap sans effet.

## Diagnostic

### Echap sans effet (panneaux, menu contextuel, deselection)
Trois gestionnaires clavier coexistent dans le moteur :
- le capteur de saisie natif du patch 016A2, enregistre en phase de **capture**
  (`window.addEventListener("keydown", onNativeType, true)`) ;
- le gestionnaire de raccourcis du plan ;
- le gestionnaire global (fermeture des panneaux, du menu contextuel,
  deselection complete).

La branche `Escape` du capteur appelait `e.preventDefault()` **et**
`e.stopPropagation()`. En phase de capture, `stopPropagation()` empeche les deux
autres gestionnaires de recevoir l evenement : Echap ne servait plus qu a vider
la ligne de commande. C est exactement le symptome observe (menu contextuel de
la photo 05 impossible a fermer, objet selectionne jamais deselectionne).

### Panneaux ouverts a chaque session
`leftPanelOpen` et `rightPanelOpen` etaient initialises a `true` en dur : toute
ouverture de session, y compris une session deja active rechargee, ouvrait la
Bibliotheque equipements et le panneau BOM / Proprietes.

### Onglet du projet supprime
`pdiRemoveProject` nettoyait l index et les sauvegardes locales, mais pas la
liste des onglets ouverts (`pdi.tabs.v1`).

## Correctifs
1. La branche `Escape` du capteur ne coupe plus la propagation : elle vide la
   ligne de commande puis laisse l evenement suivre son cours. Echap ferme donc
   a nouveau les panneaux, le menu contextuel, annule la commande guidee et
   deselectionne.
2. Panneaux gauche et droit **fermes par defaut**, avec memorisation de l etat
   dans `pdi.leftPanelOpen.v1` et `pdi.rightPanelOpen.v1`. Le panneau droit
   reste ouvrable par la commande `PROPS` ou par son onglet.
3. `closeTabsForProject` : la suppression d un projet ferme ses onglets, met a
   jour l onglet actif et bascule sur Mes projets s il n en reste aucun.

## Tests
1. Recharger l application : ni la Bibliotheque ni le panneau BOM ne doivent
   s ouvrir. Ouvrir le panneau droit, recharger : il doit revenir ouvert.
2. Selectionner un troncon, appuyer sur **Echap** : la selection disparait,
   le statut repasse a Pret.
3. Ouvrir le menu contextuel d un troncon (clic droit), appuyer sur **Echap** :
   le menu se ferme.
4. Panneaux ouverts + **Echap** : les deux panneaux se ferment.
5. Taper `TUBE` puis **Echap** : la commande guidee est annulee.
6. Mes projets : supprimer un projet ouvert. Son onglet doit disparaitre de la
   barre et du dock ; s il n en reste aucun, l ecran Mes projets s affiche.
7. `npm run lint` puis `npm run build`.

## Reste pour 017F2
Edition en place dans l inspecteur avec validation par spec, volet Anomalies
cliquable, raccourci `Ctrl+1`, refonte typed arrays et nettoyage des
`passive event listener`.
"""


def main():
    print("PATCH 017F1B - hotfix panneaux, Echap, onglet du projet supprime")
    print("Racine : " + ROOT)
    check_files()
    patch_engine()
    patch_app()
    with open(REPORT, "w", encoding="utf-8") as fh:
        fh.write(REPORT_BODY)
    notes.append("OK : rapport 017F1B_hotfix_panneaux_echap_onglet_projet_REPORT.md")
    print("")
    for note in notes:
        print("  " + note)
    ko = len([n for n in notes if n.startswith("NON TROUVE")])
    print("")
    print("Resultat : %d/%d" % (len(notes) - ko, len(notes)))
    if ko:
        print("Des ancres n ont pas ete trouvees : verifier que 017F1 est bien applique.")


if __name__ == "__main__":
    main()
