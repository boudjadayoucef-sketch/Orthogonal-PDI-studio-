#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PATCH 017F1 - PD&I : projets isoles, onglets renommables, inspecteur cible

  A. Isolation par projet : chaque onglet ISO a son propre plan et sa propre
     cle de sauvegarde locale. Un nouvel onglet = plan vierge.
  B. Renommage d un onglet par double-clic sur son titre (saisie directe).
  C. Index de projets pdi.projects.index.v1 + ecran Mes projets reel
     (ouvrir / renommer / supprimer un projet).
  D. Inspecteur cible : les proprietes affichees correspondent exactement a
     l element selectionne (troncon / noeud-te-coude / equipement).
  E. Commande PROPS (PR, PROPRIETES) declaree ET traitee (Regle 8).

Prerequis : patch 017E applique.
Idempotent. Sauvegardes .before017F1. Rapport genere.
"""

import os
import shutil
import sys

ROOT = os.getcwd()
ENGINE = os.path.join(ROOT, "src/pdi/isometric/engine/IsometrieModuleV48d.tsx")
CADENG = os.path.join(ROOT, "src/pdi/isometric/engine/CadAutocadEngine.ts")
WRAPPER = os.path.join(ROOT, "src/pdi/isometric/PdiIsometricEditor.tsx")
APP = os.path.join(ROOT, "src/pdi/app/PdiUnifiedApp.tsx")

notes = []


def read(path):
    with open(path, "r", encoding="utf-8") as fh:
        return fh.read()


def write(path, content):
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)


def backup(path):
    bak = path + ".before017F1"
    if not os.path.exists(bak):
        shutil.copy2(path, bak)


def sub(src, old, new, label):
    if old in src:
        notes.append("OK : " + label)
        return src.replace(old, new, 1)
    notes.append("NON TROUVE : " + label)
    return src


def check_files():
    missing = [p for p in (ENGINE, CADENG, WRAPPER, APP) if not os.path.exists(p)]
    if missing:
        print("ERREUR : fichiers introuvables :")
        for m in missing:
            print("   - " + m)
        sys.exit(1)
    if "PATCH 017E" not in read(APP):
        print("ERREUR : le patch 017E n est pas applique sur ce build.")
        print("Appliquer 017E_pdi_persistance_f5_onglets_projets.py d abord.")
        sys.exit(1)


# ============================================================ A. MOTEUR ISO
OLD_SIGNATURE = "function IsometrieModule() {"
NEW_SIGNATURE = ("// PATCH 017F1 : le moteur recoit le projet actif de l onglet.\n"
                 "function IsometrieModule(props: { projectId?: string }) {\n"
                 "  const projectId = props?.projectId;")

OLD_PREFIX = '  const autosavePrefix=userUid?`isometrie.autosave.v474.user.${userUid}`:"";'
NEW_PREFIX = """  // PATCH 017F1 : isolation par projet. Chaque onglet ISO ecrit dans sa propre
  // cle locale, donc un nouvel onglet demarre sur un plan vierge et deux
  // projets ne se recouvrent plus jamais.
  const activeProjectKey=(projectId&&projectId.trim())?projectId.trim():"default";
  const autosavePrefix=userUid?`isometrie.autosave.v474.user.${userUid}.project.${activeProjectKey}`:"";"""

OLD_MIGRATE = ('      setSaveState("error");setStatusMessage("Autosauvegarde suspendue \u00b7 utilisateur non identifi\u00e9");'
               'setRecoveryChecked(true);return;\n    }')
NEW_MIGRATE = OLD_MIGRATE + """
    // PATCH 017F1 : migration unique de l ancienne archive globale du profil
    // vers le projet par defaut, pour ne perdre aucun plan existant.
    try{
      if(activeProjectKey==="default"&&!localStorage.getItem(AUTOSAVE_CURRENT_KEY)){
        const legacyScoped=localStorage.getItem(`isometrie.autosave.v474.user.${userUid}.current`);
        if(legacyScoped)localStorage.setItem(AUTOSAVE_CURRENT_KEY,legacyScoped);
      }
    }catch{}"""

OLD_CMD_ANCHOR = "    // PATCH 017C : affichage des tags, renumerotation, gestionnaire de donnees."
NEW_CMD = """    // PATCH 017F1 : inspecteur cible de l element selectionne (Regle 8).
    if (["props", "pr", "proprietes", "propriete", "properties"].includes(rawVerb)) {
      setRightPanelOpen(true);
      setRightPanelTab("properties");
      const totalSelected = selectedNodeIds.length + selectedSegmentIds.length + selectedFittingIds.length;
      setAutocadPrompt(totalSelected === 0
        ? "PROPS : selectionnez un element sur le plan pour inspecter ses proprietes."
        : "PROPS : inspecteur ouvert sur " + totalSelected + " element(s).");
      setStatusMessage("Inspecteur de proprietes ouvert");
      return;
    }
""" + OLD_CMD_ANCHOR

OLD_INSPECTOR_ANCHOR = """          {rightPanelTab === "properties" && (
            <div className="space-y-3 text-xs">"""

NEW_INSPECTOR = OLD_INSPECTOR_ANCHOR + """
              {/* PATCH 017F1 : inspecteur cible. Les champs affiches dependent du
                  type reel de l element selectionne, plus de table generique. */}
              {(() => {
                const totalTargeted = selectedNodeIds.length + selectedSegmentIds.length + selectedFittingIds.length;
                if (totalTargeted !== 1) return null;
                const line = (label: string, value: string, key: string) => (
                  <div key={key} className="flex justify-between gap-2 text-[11px]">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-bold text-slate-100 text-right">{value}</span>
                  </div>
                );
                if (selectedSegmentIds.length === 1) {
                  const seg = segments.find((s) => s.id === selectedSegmentIds[0]);
                  if (!seg) return null;
                  const rows: Array<[string, string]> = [
                    ["Tag", String(seg.tag || "non tagge")],
                    ["Diametre", "DN" + String(seg.dn)],
                    ["Service / fluide", String(seg.service || "-")],
                    ["Spec", String(seg.spec || "-")],
                    ["Materiau", String(seg.material || "-")],
                    ["Classe", String(seg.pressureClass || seg.pn || "-")],
                    ["Longueur", (Number(seg.length) || 0).toFixed(3) + " m"],
                    ["Type", String(seg.type || "-")],
                    ["Isolation", String(seg.insulation || "-")],
                    ["Ligne", String(seg.lineId || "-")],
                    ["Raccords", String((seg.fittings || []).length)],
                  ];
                  return (
                    <div className="p-3 rounded-xl bg-slate-950 border border-cyan-700/70 space-y-1.5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-[10px] font-black text-cyan-400 uppercase">Troncon selectionne</span>
                        <span className="font-mono text-[9px] text-cyan-300">{seg.id}</span>
                      </div>
                      {rows.map(([label, value]) => line(label, value, label))}
                    </div>
                  );
                }
                const targetedId = selectedNodeIds[0] || selectedFittingIds[0];
                const node = nodes.find((n) => n.id === targetedId);
                if (!node) return null;
                const linked = segments.filter((s) => s.fromNodeId === node.id || s.toNodeId === node.id);
                const rows: Array<[string, string]> = [
                  ["Repere", String(node.name || node.id)],
                  ["Type", String(node.type || "-")],
                  ["Equipement", String(node.equipmentLabel || node.equipmentType || "-")],
                  ["Diametre", node.dn ? "DN" + String(node.dn) : "-"],
                  ["Angle de branche", node.branchAngle != null ? String(node.branchAngle) + " deg" : "-"],
                  ["Direction de coude", String(node.bendDirection || "-")],
                  ["Rotation", node.rotation != null ? String(node.rotation) + " deg" : "-"],
                  ["Miroir", node.mirrored ? "oui" : "non"],
                  ["Position X / Y / Z", Number(node.x || 0).toFixed(2) + " / " + Number(node.y || 0).toFixed(2) + " / " + Number(node.z || 0).toFixed(2)],
                  ["Troncons relies", String(linked.length)],
                  ["Reference", String(node.reference || "-")],
                  ["Fabricant", String(node.manufacturer || "-")],
                ];
                return (
                  <div className="p-3 rounded-xl bg-slate-950 border border-amber-700/70 space-y-1.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-[10px] font-black text-amber-400 uppercase">
                        {selectedFittingIds.length === 1 ? "Raccord selectionne" : "Noeud selectionne"}
                      </span>
                      <span className="font-mono text-[9px] text-amber-300">{node.id}</span>
                    </div>
                    {rows.map(([label, value]) => line(label, value, label))}
                    {linked.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
                        {linked.map((s) => (
                          <button key={s.id} type="button" onClick={() => selectSegmentV44(s.id, false)} className="mr-1 mb-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold">
                            {s.tag || s.id} · DN{String(s.dn)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}"""


def patch_engine():
    src = read(ENGINE)
    if "PATCH 017F1" in src:
        notes.append("OK (deja) : moteur ISO (projet isole, PROPS, inspecteur)")
        return
    backup(ENGINE)
    src = sub(src, OLD_SIGNATURE, NEW_SIGNATURE, "moteur : reception du projet actif")
    src = sub(src, OLD_PREFIX, NEW_PREFIX, "moteur : cle de sauvegarde par projet")
    src = sub(src, OLD_MIGRATE, NEW_MIGRATE, "moteur : migration de l ancienne archive du profil")
    src = sub(src, OLD_CMD_ANCHOR, NEW_CMD, "moteur : commande PROPS")
    src = sub(src, OLD_INSPECTOR_ANCHOR, NEW_INSPECTOR, "moteur : inspecteur cible par type d element")
    write(ENGINE, src)


# ==================================================== B. CATALOGUE COMMANDES
OLD_CATALOG = """  {
    id: "tagdisplay","""

NEW_CATALOG = """  {
    id: "props",
    name: "PROPS",
    aliases: ["PROPS", "PR", "PROPRIETES", "PROPRIETE", "PROPERTIES"],
    description: "Ouvre l inspecteur de proprietes de l element selectionne",
    category: "Affichage",
    shortcut: "PR",
    icon: "Info",
  },
  {
    id: "tagdisplay","""


def patch_catalog():
    src = read(CADENG)
    if 'id: "props"' in src:
        notes.append("OK (deja) : catalogue de commandes (PROPS)")
        return
    backup(CADENG)
    src = sub(src, OLD_CATALOG, NEW_CATALOG, "catalogue : commande PROPS declaree")
    write(CADENG, src)


# ============================================================ C. WRAPPER ISO
OLD_WRAPPER_FN = """export default function PdiIsometricEditor() {"""
NEW_WRAPPER_FN = """// PATCH 017F1 : le wrapper transmet le projet de l onglet actif au moteur.
export default function PdiIsometricEditor(props: { projectId?: string }) {"""

OLD_WRAPPER_CALL = "      <IsometrieModule />"
NEW_WRAPPER_CALL = "      <IsometrieModule projectId={props.projectId} />"


def patch_wrapper():
    src = read(WRAPPER)
    if "PATCH 017F1" in src:
        notes.append("OK (deja) : wrapper ISO")
        return
    backup(WRAPPER)
    src = sub(src, OLD_WRAPPER_FN, NEW_WRAPPER_FN, "wrapper : signature avec projectId")
    src = sub(src, OLD_WRAPPER_CALL, NEW_WRAPPER_CALL, "wrapper : transmission du projectId")
    write(WRAPPER, src)


# ============================================================== D. COQUILLE
OLD_INDEX_ANCHOR = "// PATCH 017E : sessions locales autosauvegardees par l editeur ISO."

NEW_INDEX = """// PATCH 017F1 : index des projets PD&I de ce poste.
// Un projet survit a la fermeture de son onglet : il reste ouvrable depuis
// l ecran Mes projets, avec sa propre sauvegarde locale.
const PDI_PROJECT_INDEX_KEY = "pdi.projects.index.v1";

type PdiProjectIndexEntry = { projectId: string; title: string; module: PdiModule; updatedAt: string };

function pdiReadProjectIndex(): PdiProjectIndexEntry[] {
  try {
    const raw = window.localStorage.getItem(PDI_PROJECT_INDEX_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => entry && typeof entry.projectId === "string");
  } catch { return []; }
}

function pdiWriteProjectIndex(entries: PdiProjectIndexEntry[]) {
  try { window.localStorage.setItem(PDI_PROJECT_INDEX_KEY, JSON.stringify(entries)); } catch {}
}

function pdiUpsertProject(entry: { projectId: string; title: string; module: PdiModule }) {
  const list = pdiReadProjectIndex();
  const now = new Date().toISOString();
  const found = list.find((item) => item.projectId === entry.projectId);
  if (found) { found.title = entry.title; found.module = entry.module; found.updatedAt = now; }
  else list.push({ projectId: entry.projectId, title: entry.title, module: entry.module, updatedAt: now });
  pdiWriteProjectIndex(list);
}

function pdiRemoveProject(projectId: string) {
  pdiWriteProjectIndex(pdiReadProjectIndex().filter((item) => item.projectId !== projectId));
  try {
    const doomed: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.indexOf(".project." + projectId + ".") !== -1) doomed.push(key);
    }
    doomed.forEach((key) => window.localStorage.removeItem(key));
  } catch {}
}

""" + OLD_INDEX_ANCHOR

OLD_DOCK_STATE = "  const [isoTabDockOpen, setIsoTabDockOpen] = useState(true);"

NEW_DOCK_STATE = """  const [isoTabDockOpen, setIsoTabDockOpen] = useState(true);
  // PATCH 017F1 : projet actif de l onglet, renommage en ligne, rafraichissement
  // de l ecran Mes projets.
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [projectsRefresh, setProjectsRefresh] = useState(0);
  const activeWorkspaceTab = workspaceTabs.find((t) => t.id === activeTabId) || null;
  const activeProjectId = activeWorkspaceTab?.projectId || "default";
  const beginRenameTab = (tab: PdiWorkspaceTab) => { setRenamingTabId(tab.id); setRenameDraft(tab.title); };
  const commitRenameTab = (id: string) => {
    const cleaned = renameDraft.trim();
    setRenamingTabId(null);
    if (!cleaned) return;
    const tabs = workspaceTabs.map((t) => (t.id === id ? { ...t, title: cleaned } : t));
    setWorkspaceTabs(tabs);
    persistTabs(tabs, activeTabId);
    const target = tabs.find((t) => t.id === id);
    if (target) pdiUpsertProject({ projectId: target.projectId, title: cleaned, module: target.module });
    setProjectsRefresh((v) => v + 1);
  };
  const openProjectInTab = (entry: { projectId: string; title: string; module: PdiModule }) => {
    const existing = workspaceTabs.find((t) => t.projectId === entry.projectId);
    if (existing) { switchTab(existing.id); return; }
    openModuleInTab(entry.module || "isometric", entry.title, entry.projectId);
  };"""

OLD_OPEN_SIGNATURE = "  const openModuleInTab = (module: PdiModule, title?: string) => {"
NEW_OPEN_SIGNATURE = "  const openModuleInTab = (module: PdiModule, title?: string, projectId?: string) => {"

OLD_OPEN_BODY = ('    const next: PdiWorkspaceTab = { id, title: title || navItems.find(x=>x.id===module)?.title || '
                 '"Projet PD&I", module, projectId: `project-${Date.now().toString(36)}`, dirty: false, '
                 'createdAt: new Date().toISOString() };\n'
                 '    const tabs = [...workspaceTabs, next]; setWorkspaceTabs(tabs); setActiveTabId(id); '
                 'setActiveModule(module); persistTabs(tabs,id);')

NEW_OPEN_BODY = """    // PATCH 017F1 : un onglet = un projet identifie, reutilisable et renommable.
    const resolvedTitle = title || navItems.find(x=>x.id===module)?.title || "Projet PD&I";
    const resolvedProjectId = projectId || `project-${Date.now().toString(36)}`;
    const next: PdiWorkspaceTab = { id, title: resolvedTitle, module, projectId: resolvedProjectId, dirty: false, createdAt: new Date().toISOString() };
    const tabs = [...workspaceTabs, next]; setWorkspaceTabs(tabs); setActiveTabId(id); setActiveModule(module); persistTabs(tabs,id);
    pdiUpsertProject({ projectId: resolvedProjectId, title: resolvedTitle, module });
    setProjectsRefresh((v) => v + 1);"""

# --- barre d onglets de la coquille : renommage par double-clic
OLD_SHELL_TABS = ('        {workspaceTabs.map(tab=><button key={tab.id} className={activeTabId===tab.id?"active":""} '
                  'onClick={()=>switchTab(tab.id)} title={tab.title}>{tab.title}<span onClick={(e)=>{e.stopPropagation(); '
                  'closeTab(tab.id)}}>\u00d7</span></button>)}')

NEW_SHELL_TABS = """        {workspaceTabs.map(tab => renamingTabId === tab.id
          ? <input key={tab.id} autoFocus defaultValue={tab.title} onChange={(e) => setRenameDraft(e.target.value)} onBlur={() => commitRenameTab(tab.id)} onKeyDown={(e) => { if (e.key === "Enter") commitRenameTab(tab.id); if (e.key === "Escape") setRenamingTabId(null); }} style={{ height: 24, minWidth: 140, borderRadius: 8, border: "1px solid #67E8F9", background: "#0B111A", color: "#E5EDF8", fontSize: 11, fontWeight: 800, padding: "0 8px", outline: "none" }} />
          : <button key={tab.id} className={activeTabId===tab.id?"active":""} onClick={()=>switchTab(tab.id)} onDoubleClick={() => beginRenameTab(tab)} title={tab.title + " - double-clic pour renommer"}>{tab.title}<span onClick={(e)=>{e.stopPropagation(); closeTab(tab.id)}}>\u00d7</span></button>)}"""

# --- dock d onglets de l editeur ISO : renommage par double-clic
OLD_DOCK_TABS = """        {isoTabDockOpen && workspaceTabs.map(tab => (
          <button key={tab.id} type="button" onClick={() => switchTab(tab.id)} title={tab.title} style={{ border: activeTabId === tab.id ? "1px solid #67E8F9" : "1px solid #263241", background: activeTabId === tab.id ? "linear-gradient(135deg,#0284C7,#22D3EE)" : "#111827", color: activeTabId === tab.id ? "white" : "#CBD5E1", borderRadius: 8, height: 24, padding: "0 8px", fontSize: 10, fontWeight: 900, whiteSpace: "nowrap", cursor: "pointer" }}>
            {tab.title}
            <span onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} style={{ marginLeft: 6, opacity: .7 }}>\u00d7</span>
          </button>
        ))}"""

NEW_DOCK_TABS = """        {isoTabDockOpen && workspaceTabs.map(tab => renamingTabId === tab.id ? (
          /* PATCH 017F1 : saisie directe du nom de l onglet. */
          <input key={tab.id} autoFocus defaultValue={tab.title} onChange={(e) => setRenameDraft(e.target.value)} onBlur={() => commitRenameTab(tab.id)} onKeyDown={(e) => { if (e.key === "Enter") commitRenameTab(tab.id); if (e.key === "Escape") setRenamingTabId(null); }} style={{ height: 24, minWidth: 150, borderRadius: 8, border: "1px solid #67E8F9", background: "#0B111A", color: "#E5EDF8", fontSize: 10, fontWeight: 900, padding: "0 8px", outline: "none" }} />
        ) : (
          <button key={tab.id} type="button" onClick={() => switchTab(tab.id)} onDoubleClick={() => beginRenameTab(tab)} title={tab.title + " - double-clic pour renommer"} style={{ border: activeTabId === tab.id ? "1px solid #67E8F9" : "1px solid #263241", background: activeTabId === tab.id ? "linear-gradient(135deg,#0284C7,#22D3EE)" : "#111827", color: activeTabId === tab.id ? "white" : "#CBD5E1", borderRadius: 8, height: 24, padding: "0 8px", fontSize: 10, fontWeight: 900, whiteSpace: "nowrap", cursor: "pointer" }}>
            {tab.title}
            <span onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} style={{ marginLeft: 6, opacity: .7 }}>\u00d7</span>
          </button>
        ))}"""

OLD_EDITOR_CALL = "      <PdiIsometricEditor />"
NEW_EDITOR_CALL = ("      {/* PATCH 017F1 : remontage propre du moteur a chaque changement de projet. */}\n"
                   "      <div key={activeProjectId} style={{ width: \"100%\", height: \"100%\" }}>\n"
                   "        <PdiIsometricEditor projectId={activeProjectId} />\n"
                   "      </div>")

OLD_PROJECTS_INTRO = ('          <p>Sessions enregistrees sur ce poste. L editeur restaure automatiquement '
                      'la derniere session au rechargement (F5).</p>')

NEW_PROJECTS_INTRO = """          <p>Projets PD&I de ce poste. Chaque projet possede son propre plan et sa propre sauvegarde locale. Double-cliquez sur le titre d un onglet pour le renommer.</p>
          {/* PATCH 017F1 : index des projets, independant des onglets ouverts. */}
          <div key={projectsRefresh} style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {pdiReadProjectIndex().length === 0 && <span style={{ color: "#94A3B8", fontWeight: 800 }}>Aucun projet enregistre. Cliquez sur Nouveau plan ISO.</span>}
            {pdiReadProjectIndex().map(entry => (
              <div key={entry.projectId} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, border: "1px solid rgba(103,232,249,.35)", borderRadius: 14, padding: "10px 12px", background: "#0B111A" }}>
                <b style={{ color: "#E5EDF8" }}>{entry.title}</b>
                <span style={{ color: "#64748B", fontSize: 10, fontWeight: 800 }}>{entry.projectId}</span>
                <span style={{ color: "#94A3B8", fontSize: 11, fontWeight: 800 }}>{String(entry.updatedAt).slice(0, 16).replace("T", " ")}</span>
                <button type="button" className="pdi-start-primary" style={{ marginLeft: "auto", padding: "8px 12px" }} onClick={() => openProjectInTab(entry)}>Ouvrir</button>
                <button type="button" style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #7F1D1D", background: "#1F0B0B", color: "#FCA5A5", fontSize: 11, fontWeight: 900, cursor: "pointer" }} onClick={() => { if (window.confirm("Supprimer definitivement le projet \\"" + entry.title + "\\" et sa sauvegarde locale ?")) { pdiRemoveProject(entry.projectId); setProjectsRefresh((v) => v + 1); } }}>Supprimer</button>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 16 }}>Sauvegardes locales detectees sur ce poste :</p>"""


def patch_app():
    src = read(APP)
    if "PATCH 017F1" in src:
        notes.append("OK (deja) : coquille (projets, renommage, ouverture)")
        return
    backup(APP)
    src = sub(src, OLD_INDEX_ANCHOR, NEW_INDEX, "coquille : index des projets PD&I")
    src = sub(src, OLD_DOCK_STATE, NEW_DOCK_STATE, "coquille : etat projet actif + renommage")
    src = sub(src, OLD_OPEN_SIGNATURE, NEW_OPEN_SIGNATURE, "coquille : ouverture avec projet impose")
    src = sub(src, OLD_OPEN_BODY, NEW_OPEN_BODY, "coquille : creation d onglet indexee")
    src = sub(src, OLD_SHELL_TABS, NEW_SHELL_TABS, "coquille : renommage par double-clic (barre d onglets)")
    src = sub(src, OLD_DOCK_TABS, NEW_DOCK_TABS, "coquille : renommage par double-clic (dock ISO)")
    src = sub(src, OLD_EDITOR_CALL, NEW_EDITOR_CALL, "coquille : editeur monte sur le projet actif")
    src = sub(src, OLD_PROJECTS_INTRO, NEW_PROJECTS_INTRO, "coquille : ecran Mes projets pilote par l index")
    write(APP, src)


REPORT = os.path.join(ROOT, "017F1_projets_isoles_onglets_renommables_inspecteur_REPORT.md")

REPORT_BODY = """# PATCH 017F1 - Projets isoles, onglets renommables, inspecteur cible

## Symptomes traites
1. Un nouvel onglet ISO affichait le meme dessin que l onglet precedent.
2. Impossible de nommer un onglet / un projet.
3. Le panneau Proprietes n affichait pas les donnees de l element selectionne.

## Diagnostic
- `openModuleInTab` creait bien un `projectId`, mais le rendu etait
  `<PdiIsometricEditor />` **sans aucune propriete** : le `projectId` n etait ni
  transmis, ni lu par le moteur.
- La cle d autosauvegarde etait unique par utilisateur
  (`isometrie.autosave.v474.user.<uid>.current`) : un seul document pour tous
  les onglets. Les onglets etaient des onglets de navigation, pas de document.
- Aucun index de projets : fermer un onglet perdait le projet.
- Le panneau Proprietes ne traitait explicitement que la selection multiple.

## Correctifs
1. Le moteur accepte `projectId` et prefixe ses cles par
   `...user.<uid>.project.<projectId>` -> un onglet = un plan.
2. Migration automatique de l ancienne archive du profil vers le projet
   `default` : aucun plan existant n est perdu.
3. `key={activeProjectId}` sur l editeur : remontage propre au changement
   d onglet, sans fuite d etat d un projet vers l autre.
4. Index `pdi.projects.index.v1` : un projet survit a la fermeture de son
   onglet et reste ouvrable, renommable, supprimable depuis Mes projets
   (suppression = index + sauvegardes locales du projet).
5. Renommage par **double-clic sur le titre de l onglet**, dans la barre de la
   coquille comme dans le dock de l editeur ISO : saisie directe, Entree valide,
   Echap annule, la perte de focus valide aussi. Le nom se propage a l index.
6. Inspecteur cible : formulaire distinct selon le type selectionne.
   - Troncon : tag, DN, service, spec, materiau, classe, longueur, type,
     isolation, ligne, nombre de raccords.
   - Noeud / raccord / equipement : repere, type, equipement, DN, angle de
     branche, direction de coude, rotation, miroir, position XYZ, troncons
     relies (cliquables), reference, fabricant.
7. Commande `PROPS` (`PR`, `PROPRIETES`) declaree dans `AUTOCAD_COMMANDS` **et**
   traitee dans le dispatcher (Regle 8) : ouvre le panneau sur la selection.

## Tests
1. Onglet A : dessiner 3 noeuds. `+` -> onglet B doit afficher `0 noeuds`.
2. Revenir sur A : les 3 noeuds sont la. Retour sur B : toujours vide.
3. F5 avec 2 onglets : chaque onglet retrouve son propre contenu.
4. Double-clic sur le titre d un onglet : saisir `Gazoduc Est`, Entree.
   Le nom change dans la barre, dans le dock et dans Mes projets.
5. Double-clic puis Echap : le nom d origine est conserve.
6. Fermer un onglet, aller dans Mes projets : le projet est toujours liste,
   bouton Ouvrir le remonte avec son dessin.
7. Supprimer un projet depuis Mes projets : confirmation, puis disparition ;
   les autres projets restent intacts.
8. Cliquer un troncon : carte Troncon selectionne avec tag, DN, spec, longueur.
   Cliquer un noeud ou un te : carte Noeud avec angle de branche et ports.
9. Taper `PROPS` dans la zone de commande : le panneau Proprietes s ouvre.
10. `npm run lint` puis `npm run build`.

## Reste pour 017F2
- Edition en place dans l inspecteur avec validation par spec
  (`pdiSpecAllowsDn` toujours non branche sur l UI).
- Volet Anomalies cliquable.
- Raccourci clavier `Ctrl+1`.
- Refonte du modele de donnees en typed arrays + nettoyage des
  `passive event listener` (prerequis GPU / 3D).
"""


def main():
    print("PATCH 017F1 - projets isoles, onglets renommables, inspecteur cible")
    print("Racine : " + ROOT)
    check_files()
    patch_engine()
    patch_catalog()
    patch_wrapper()
    patch_app()
    with open(REPORT, "w", encoding="utf-8") as fh:
        fh.write(REPORT_BODY)
    notes.append("OK : rapport 017F1_projets_isoles_onglets_renommables_inspecteur_REPORT.md")
    print("")
    for note in notes:
        print("  " + note)
    ko = len([n for n in notes if n.startswith("NON TROUVE")])
    print("")
    print("Resultat : %d/%d" % (len(notes) - ko, len(notes)))
    if ko:
        print("Des ancres n ont pas ete trouvees : verifier que 017E est bien applique.")


if __name__ == "__main__":
    main()
