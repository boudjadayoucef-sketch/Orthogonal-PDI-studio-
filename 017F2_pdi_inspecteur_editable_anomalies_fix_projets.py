#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PATCH 017F2 - PD&I

A. Correction du conflit entre la liste "Sauvegardes locales" et la creation
   d un nouvel onglet :
   - une seule ligne par projet (les archives .previous ne sont plus listees) ;
   - chaque sauvegarde affiche le projet auquel elle appartient ;
   - "Ouvrir" ouvre l onglet DU projet concerne au lieu d injecter le plan dans
     l onglet actif ;
   - bouton de recuperation des sessions orphelines dans l index des projets.

B. Inspecteur editable, valide par la spec du projet (pdiSpecAllowsDn) :
   DN, service, spec et longueur modifiables directement sur le troncon.

C. Volet Anomalies cliquable (DN hors spec, troncon non tagge, longueur nulle,
   noeud isole, te incomplet).

D. Raccourci Ctrl+1 : ouvre l inspecteur de proprietes.

Prerequis : 017E, 017F1 et 017F1B appliques.
Idempotent. Sauvegardes .before017F2. Rapport genere.
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
    bak = path + ".before017F2"
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
    if "PATCH 017F1B" not in read(APP):
        print("ERREUR : le patch 017F1B n est pas applique sur ce build.")
        sys.exit(1)


# ============================================================ A. COQUILLE
OLD_SESSION_TYPE = """type PdiLocalSession = {
  key: string;
  name: string;
  nodes: number;
  segments: number;
  updatedAt: string;
  archive: boolean;
};"""

NEW_SESSION_TYPE = """type PdiLocalSession = {
  key: string;
  name: string;
  nodes: number;
  segments: number;
  updatedAt: string;
  // PATCH 017F2 : chaque sauvegarde sait a quel projet elle appartient.
  projectId: string;
  archive: boolean;
};"""

OLD_SESSION_FILTER = """      const isCurrent = key.slice(-8) === ".current";
      const isPrevious = key.slice(-9) === ".previous";
      if (!isCurrent && !isPrevious) continue;"""

NEW_SESSION_FILTER = """      // PATCH 017F2 : les archives ".previous" ne sont plus listees. Elles
      // dupliquaient chaque projet et rendaient l ouverture ambigue.
      const isCurrent = key.slice(-8) === ".current";
      if (!isCurrent) continue;
      const isPrevious = false;"""

OLD_SESSION_PUSH = """        out.push({
          key,
          name: String(snap?.project?.name || "Projet isometrique"),"""

NEW_SESSION_PUSH = """        // PATCH 017F2 : identification du projet porteur de la sauvegarde.
        const marker = ".project.";
        const at = key.indexOf(marker);
        const projectId = at >= 0 ? key.slice(at + marker.length, key.lastIndexOf(".")) : "default";
        out.push({
          key,
          projectId,
          name: String(snap?.project?.name || "Projet isometrique"),"""

OLD_SESSION_RETURN = "  return out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));\n}"

NEW_SESSION_RETURN = """  // PATCH 017F2 : une seule ligne par projet, la plus recente.
  const sorted = out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const seen: Record<string, boolean> = {};
  return sorted.filter((session) => {
    if (seen[session.projectId]) return false;
    seen[session.projectId] = true;
    return true;
  });
}

// PATCH 017F2 : une sauvegarde locale sans entree d index (plan dessine avant
// 017F1, ou projet supprime de l index par erreur) devient un projet visible.
function pdiAdoptOrphanSessions(): number {
  let added = 0;
  try {
    const index = pdiReadProjectIndex();
    pdiListLocalSessions().forEach((session) => {
      if (index.some((entry) => entry.projectId === session.projectId)) return;
      pdiUpsertProject({
        projectId: session.projectId,
        title: session.name || "Projet isometrique",
        module: "isometric",
      });
      added += 1;
    });
  } catch {}
  return added;
}"""

OLD_SESSION_BADGE = '{session.archive ? "archive precedente" : "session courante"}'
NEW_SESSION_BADGE = '{"projet " + session.projectId}'

OLD_SESSION_BUTTON = 'onClick={() => setActiveModule("isometric")}>Ouvrir dans l editeur</button>'
NEW_SESSION_BUTTON = (
    'onClick={() => openProjectInTab({ projectId: session.projectId, '
    'title: session.name || "Projet isometrique", module: "isometric" })}'
    '>Ouvrir dans son onglet</button>'
)

OLD_NEW_ISO_BUTTON = (
    '<button type="button" className="pdi-start-primary" '
    'onClick={() => openModuleInTab("isometric", "Nouveau plan ISO")}>Nouveau plan ISO</button>'
)

NEW_NEW_ISO_BUTTON = OLD_NEW_ISO_BUTTON + """
            {/* PATCH 017F2 : recuperation des sauvegardes orphelines. */}
            <button type="button" className="pdi-start-primary" onClick={() => { const added = pdiAdoptOrphanSessions(); setProjectsRefresh((v) => v + 1); window.alert(added > 0 ? added + " projet(s) recupere(s) depuis les sauvegardes locales." : "Aucune sauvegarde orpheline a recuperer."); }}>Recuperer les sauvegardes orphelines</button>"""


def patch_app():
    src = read(APP)
    if "PATCH 017F2" in src:
        notes.append("OK (deja) : coquille (sessions dedoublonnees, ouverture par projet)")
        return
    backup(APP)
    src = sub(src, OLD_SESSION_TYPE, NEW_SESSION_TYPE, "coquille : projectId sur les sauvegardes locales")
    src = sub(src, OLD_SESSION_FILTER, NEW_SESSION_FILTER, "coquille : archives .previous plus listees")
    src = sub(src, OLD_SESSION_PUSH, NEW_SESSION_PUSH, "coquille : extraction du projet porteur")
    src = sub(src, OLD_SESSION_RETURN, NEW_SESSION_RETURN, "coquille : dedoublonnage + adoption des orphelines")
    src = sub(src, OLD_SESSION_BADGE, NEW_SESSION_BADGE, "coquille : badge projet sur chaque sauvegarde")
    src = sub(src, OLD_SESSION_BUTTON, NEW_SESSION_BUTTON, "coquille : ouverture dans l onglet du projet")
    src = sub(src, OLD_NEW_ISO_BUTTON, NEW_NEW_ISO_BUTTON, "coquille : bouton de recuperation des orphelines")
    write(APP, src)


# ============================================================== B/C/D. MOTEUR
OLD_IMPORT = """import {
  PDI_DEFAULT_PROJECT_SETUP,
  pdiActiveFormat,
  pdiBuildTag,
  pdiFindSpec,
  pdiNextTagNumber,
  pdiValidateTag,
} from "./pdiTagging";"""

NEW_IMPORT = """import {
  PDI_DEFAULT_PROJECT_SETUP,
  pdiActiveFormat,
  pdiBuildTag,
  pdiFindSpec,
  pdiNextTagNumber,
  pdiSpecAllowsDn,
  pdiValidateTag,
} from "./pdiTagging";"""

OLD_DEFAULT_SPEC = '  const defaultSpec = projectSetup.specs[0] ? projectSetup.specs[0].code : "CS150";'

NEW_DEFAULT_SPEC = OLD_DEFAULT_SPEC + """

  // PATCH 017F2 : edition en place d un troncon depuis l inspecteur, refusee
  // si la spec du projet n admet pas le diametre demande.
  const applySegmentEdit017F2 = (
    id: string,
    patch: { dn?: number; service?: string; spec?: string; length?: number }
  ) => {
    const target = segments.find((s) => s.id === id);
    if (!target) return;
    const nextDn = patch.dn != null && Number.isFinite(patch.dn) ? Math.round(patch.dn) : Number(target.dn);
    if (!(nextDn > 0)) {
      setStatusMessage("Diametre invalide : une valeur superieure a 0 est attendue");
      return;
    }
    const nextSpecCode = patch.spec != null ? patch.spec : (target.spec || "");
    const specObj = nextSpecCode ? pdiFindSpec(projectSetup, nextSpecCode) : undefined;
    if (specObj && !pdiSpecAllowsDn(specObj, nextDn)) {
      setStatusMessage(
        "Refuse : la spec " + specObj.code + " n admet que DN" + specObj.minDn + " a DN" + specObj.maxDn
      );
      return;
    }
    const anySpec = specObj as any;
    setSegments((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      const updated: any = { ...s, dn: nextDn };
      if (patch.service != null) updated.service = patch.service || undefined;
      if (patch.spec != null) {
        updated.spec = patch.spec || undefined;
        if (anySpec && anySpec.material) updated.material = anySpec.material;
        if (anySpec && anySpec.pressureClass) updated.pressureClass = anySpec.pressureClass;
      }
      if (patch.length != null && Number.isFinite(patch.length) && patch.length > 0) updated.length = patch.length;
      return updated;
    }));
    setStatusMessage("Troncon " + (target.tag || id) + " mis a jour");
  };"""

OLD_SEG_ROWS = """                      {rows.map(([label, value]) => line(label, value, label))}
                    </div>
                  );
                }"""

NEW_SEG_ROWS = """                      {rows.map(([label, value]) => line(label, value, label))}
                      {/* PATCH 017F2 : edition en place validee par la spec du projet. */}
                      <div className="pt-1.5 border-t border-slate-800 grid grid-cols-2 gap-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase">
                          DN
                          <input
                            key={"dn-" + seg.id + "-" + String(seg.dn)}
                            type="number"
                            defaultValue={String(seg.dn)}
                            onBlur={(e) => applySegmentEdit017F2(seg.id, { dn: Number(e.target.value) })}
                            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                            className="w-full mt-0.5 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-[11px] font-bold"
                          />
                        </label>
                        <label className="text-[9px] font-black text-slate-400 uppercase">
                          Longueur (m)
                          <input
                            key={"len-" + seg.id + "-" + String(seg.length)}
                            type="number"
                            step="0.001"
                            defaultValue={String(Number(seg.length) || 0)}
                            onBlur={(e) => applySegmentEdit017F2(seg.id, { length: Number(e.target.value) })}
                            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                            className="w-full mt-0.5 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-[11px] font-bold"
                          />
                        </label>
                        <label className="text-[9px] font-black text-slate-400 uppercase">
                          Service
                          <select
                            value={String(seg.service || "")}
                            onChange={(e) => applySegmentEdit017F2(seg.id, { service: e.target.value })}
                            className="w-full mt-0.5 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-[11px] font-bold"
                          >
                            <option value="">-</option>
                            {projectSetup.services.map((sv) => (
                              <option key={sv.code} value={sv.code}>{sv.code}</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-[9px] font-black text-slate-400 uppercase">
                          Spec
                          <select
                            value={String(seg.spec || "")}
                            onChange={(e) => applySegmentEdit017F2(seg.id, { spec: e.target.value })}
                            className="w-full mt-0.5 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-[11px] font-bold"
                          >
                            <option value="">-</option>
                            {projectSetup.specs.map((sp) => (
                              <option key={sp.code} value={sp.code}>
                                {sp.code + " (DN" + sp.minDn + "-" + sp.maxDn + ")"}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  );
                }"""

OLD_MULTI_IIFE = """              {(() => {
                const totalSel = selectedNodeIds.length + selectedSegmentIds.length + selectedFittingIds.length;"""

NEW_MULTI_IIFE = """              {/* PATCH 017F2 : volet Anomalies cliquable. */}
              {(() => {
                const issues: Array<{ id: string; kind: "segment" | "node"; label: string }> = [];
                segments.forEach((s) => {
                  const specObj = s.spec ? pdiFindSpec(projectSetup, s.spec) : undefined;
                  if (specObj && !pdiSpecAllowsDn(specObj, Number(s.dn))) {
                    issues.push({ id: s.id, kind: "segment", label: "DN" + String(s.dn) + " hors spec " + specObj.code });
                  }
                  if (!s.tag) issues.push({ id: s.id, kind: "segment", label: "Troncon non tagge" });
                  if (!(Number(s.length) > 0)) issues.push({ id: s.id, kind: "segment", label: "Longueur nulle" });
                });
                nodes.forEach((n) => {
                  const linked = segments.filter((s) => s.fromNodeId === n.id || s.toNodeId === n.id).length;
                  if (linked === 0) issues.push({ id: n.id, kind: "node", label: "Noeud isole" });
                  else if (n.type === "tee" && linked < 3) {
                    issues.push({ id: n.id, kind: "node", label: "Te incomplet (" + String(linked) + " branche(s))" });
                  }
                });
                return (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-[10px] font-black text-amber-300 uppercase">Anomalies</span>
                      <span className={`font-mono text-[10px] font-black px-2 py-0.5 rounded border ${issues.length === 0 ? "text-emerald-300 border-emerald-800 bg-emerald-950" : "text-amber-300 border-amber-800 bg-amber-950"}`}>
                        {issues.length}
                      </span>
                    </div>
                    {issues.length === 0 && (
                      <div className="text-[11px] text-emerald-300 font-bold">Aucune anomalie detectee.</div>
                    )}
                    {issues.slice(0, 40).map((issue, idx) => (
                      <button
                        key={issue.kind + issue.id + String(idx)}
                        type="button"
                        onClick={() => {
                          if (issue.kind === "segment") selectSegmentV44(issue.id, false);
                          else selectNodeV44(issue.id, false);
                          setRightPanelOpen(true);
                          setRightPanelTab("properties");
                        }}
                        className="w-full text-left px-1.5 py-1 rounded bg-slate-900 border border-slate-700 hover:border-amber-600 text-[10px] font-bold text-slate-300"
                      >
                        <span className="text-amber-300">{issue.label}</span>
                        <span className="font-mono text-slate-500"> · {issue.id}</span>
                      </button>
                    ))}
                    {issues.length > 40 && (
                      <div className="text-[10px] text-slate-500 font-bold">... et {issues.length - 40} autre(s).</div>
                    )}
                  </div>
                );
              })()}
              {(() => {
                const totalSel = selectedNodeIds.length + selectedSegmentIds.length + selectedFittingIds.length;"""

OLD_CTRL1 = "      // PATCH 016B : Echap annule d'abord la commande guidee."

NEW_CTRL1 = """      // PATCH 017F2 : Ctrl+1 ouvre l inspecteur de proprietes.
      if ((e.ctrlKey || e.metaKey) && e.key === "1") {
        e.preventDefault();
        setRightPanelOpen(true);
        setRightPanelTab("properties");
        setStatusMessage("Inspecteur de proprietes ouvert");
        return;
      }
""" + OLD_CTRL1


def patch_engine():
    src = read(ENGINE)
    if "PATCH 017F2" in src:
        notes.append("OK (deja) : moteur ISO (inspecteur editable, anomalies, Ctrl+1)")
        return
    backup(ENGINE)
    src = sub(src, OLD_IMPORT, NEW_IMPORT, "moteur : import de pdiSpecAllowsDn")
    src = sub(src, OLD_DEFAULT_SPEC, NEW_DEFAULT_SPEC, "moteur : applySegmentEdit017F2 validee par spec")
    src = sub(src, OLD_SEG_ROWS, NEW_SEG_ROWS, "moteur : champs editables DN / longueur / service / spec")
    src = sub(src, OLD_MULTI_IIFE, NEW_MULTI_IIFE, "moteur : volet Anomalies cliquable")
    src = sub(src, OLD_CTRL1, NEW_CTRL1, "moteur : raccourci Ctrl+1")
    write(ENGINE, src)


REPORT = os.path.join(ROOT, "017F2_inspecteur_editable_anomalies_fix_projets_REPORT.md")

REPORT_BODY = """# PATCH 017F2 - Inspecteur editable, anomalies, conflit projets / onglets

## A. Conflit "projets en bas" / creation d onglet

### Diagnostic
L ecran Mes projets affichait deux listes de nature differente :
- l **index des projets** (`pdi.projects.index.v1`), pilote par les onglets ;
- les **sauvegardes locales brutes**, lues cle par cle dans localStorage.

La seconde liste comptait `*.current` **et** `*.previous` : chaque projet
apparaissait donc deux fois, et un plan migre depuis l ancienne cle globale
apparaissait une troisieme fois. Surtout, son bouton appelait simplement
`setActiveModule("isometric")` : la sauvegarde etait ouverte dans l onglet
ACTIF, donc dans un autre projet que le sien. C est la collision que tu as
ressentie entre les projets du bas et la creation d un nouvel onglet.

### Correctifs
1. Les archives `.previous` ne sont plus listees, et une seule ligne (la plus
   recente) est conservee par projet.
2. Chaque sauvegarde extrait son `projectId` de la cle
   `isometrie.autosave.v474.user.<uid>.project.<projectId>.current` et l affiche.
3. Le bouton devient **Ouvrir dans son onglet** : il appelle `openProjectInTab`,
   qui reutilise l onglet existant du projet ou en cree un correctement rattache.
   Plus aucune ecriture croisee d un projet dans un autre.
4. Nouveau bouton **Recuperer les sauvegardes orphelines** : toute sauvegarde
   sans entree d index (plan dessine avant 017F1, ou index perdu) devient un
   projet visible et ouvrable.

## B. Inspecteur editable, valide par la spec
Le bloc *Troncon selectionne* recoit quatre champs modifiables : **DN**,
**Longueur (m)**, **Service** et **Spec**. Toute modification passe par
`applySegmentEdit017F2`, qui :
- refuse un diametre nul ou negatif ;
- refuse un couple spec / DN interdit via `pdiSpecAllowsDn` et affiche la plage
  admise, par exemple : `Refuse : la spec CS150 n admet que DN15 a DN300` ;
- recopie materiau et classe de pression de la spec choisie quand ils existent.

## C. Volet Anomalies cliquable
Nouveau bloc dans l onglet Proprietes, recalcule en direct :
- DN hors spec ;
- troncon non tagge ;
- longueur nulle ;
- noeud isole ;
- te incomplet (moins de trois branches).

Chaque ligne est un bouton : le clic selectionne l element sur le plan et ouvre
l inspecteur. Au dela de 40 anomalies, le reste est compte.

## D. Raccourci Ctrl+1
Ouvre le panneau droit sur l onglet Proprietes, en complement de la commande
`PROPS` livree en 017F1.

## Tests
1. Mes projets : chaque projet n apparait qu une seule fois dans les
   sauvegardes locales, avec son badge `projet <id>`.
2. Cliquer **Ouvrir dans son onglet** sur une sauvegarde : l onglet du projet
   correspondant s ouvre (ou est reactive), et le plan affiche est bien le sien.
3. Creer un nouvel onglet puis revenir a Mes projets : aucune ligne parasite,
   aucun plan recopie.
4. Cliquer **Recuperer les sauvegardes orphelines** : les anciens plans
   remontent dans la liste des projets.
5. Selectionner un troncon : changer DN a 150 puis Entree, le plan et la liste
   se mettent a jour.
6. Choisir une spec incompatible avec le DN courant : la modification est
   refusee et la barre de statut donne la plage admise.
7. Volet Anomalies : cliquer une ligne selectionne l element concerne.
8. Appuyer sur `Ctrl+1` : l inspecteur s ouvre.
9. `npm run lint` puis `npm run build`.

## Reporte a 017G
Refonte **typed arrays** (`Float32Array`) du rendu et nettoyage des
`passive event listener` : ces travaux touchent la boucle de rendu complete et
meritent un patch isole, testable seul.
"""


def main():
    print("PATCH 017F2 - inspecteur editable, anomalies, fix projets / onglets")
    print("Racine : " + ROOT)
    check_files()
    patch_app()
    patch_engine()
    with open(REPORT, "w", encoding="utf-8") as fh:
        fh.write(REPORT_BODY)
    notes.append("OK : rapport 017F2_inspecteur_editable_anomalies_fix_projets_REPORT.md")
    print("")
    for note in notes:
        print("  " + note)
    ko = len([n for n in notes if n.startswith("NON TROUVE")])
    print("")
    print("Resultat : %d/%d" % (len(notes) - ko, len(notes)))
    if ko:
        print("Des ancres n ont pas ete trouvees : verifier 017F1 et 017F1B.")


if __name__ == "__main__":
    main()
