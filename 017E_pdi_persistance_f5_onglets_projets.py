#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PATCH 017E - PD&I : persistance F5 + onglets + ecran Mes projets

  1. Identite locale de secours : sans compte Firebase ni profil plateforme,
     le prefixe d autosauvegarde etait vide -> AUCUNE sauvegarde locale.
     C est la cause de la perte du dessin a chaque F5.
  2. Restauration silencieuse de la session courante au rechargement.
  3. Sauvegarde immediate sur beforeunload / changement d onglet navigateur.
  4. Barre d onglets toujours visible, sur sa propre ligne (plus en surimpression).
  5. Acces direct aux onglets depuis l editeur ISO (dock flottant).
  6. Ecran "Mes projets" reel : sessions locales listees et ouvrables.

Idempotent. Sauvegardes .before017E. Rapport genere.
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
    bak = path + ".before017E"
    if not os.path.exists(bak):
        shutil.copy2(path, bak)


def check_files():
    missing = [p for p in (ENGINE, APP) if not os.path.exists(p)]
    if missing:
        print("ERREUR : fichiers introuvables :")
        for m in missing:
            print("   - " + m)
        print("Lancer ce patch a la racine du depot.")
        sys.exit(1)


def sub(src, old, new, label):
    global notes
    if old in src:
        notes.append("OK : " + label)
        return src.replace(old, new, 1)
    notes.append("NON TROUVE : " + label)
    return src


# =============================================================== MOTEUR ISO
OLD_UID = "  const resolveStableUid=()=>auth.currentUser?.uid||readPlatformProfileUid();"

NEW_UID = """  // PATCH 017E : identite locale de secours.
  // Sans compte Firebase ni profil plateforme, autosavePrefix restait vide et
  // TOUTE sauvegarde locale etait desactivee : le dessin disparaissait a F5.
  const readLocalFallbackUid=()=>{
    try{
      const existing=localStorage.getItem("pdi.localUid.v1");
      if(existing&&existing.trim())return existing.trim();
      const generated="local-"+Math.random().toString(36).slice(2,10)+Date.now().toString(36);
      localStorage.setItem("pdi.localUid.v1",generated);
      return generated;
    }catch{return "local-session";}
  };
  const resolveStableUid=()=>auth.currentUser?.uid||readPlatformProfileUid()||readLocalFallbackUid();"""

OLD_RECOVER = """    if(recovered){
      setRecoveryCandidate(recovered.snapshot);setRecoverySource(recovered.source);
      if(recovered.source==="previous")setStatusMessage("Sauvegarde pr\u00e9c\u00e9dente r\u00e9cup\u00e9r\u00e9e");
    }else if(invalidFound){"""

NEW_RECOVER = """    if(recovered&&recovered.source==="current"){
      // PATCH 017E : la session courante est restauree silencieusement.
      // Auparavant il fallait confirmer une fenetre de recuperation, donc un
      // simple F5 affichait un plan vide.
      try{
        applyProjectSnapshot(recovered.snapshot,"Session restauree automatiquement");
        autosaveBaselineRef.current=persistenceFingerprint(recovered.snapshot);
        setSaveState("autosaved");
      }catch{
        setRecoveryCandidate(recovered.snapshot);setRecoverySource(recovered.source);
      }
    }else if(recovered){
      setRecoveryCandidate(recovered.snapshot);setRecoverySource(recovered.source);
      if(recovered.source==="previous")setStatusMessage("Sauvegarde pr\u00e9c\u00e9dente r\u00e9cup\u00e9r\u00e9e");
    }else if(invalidFound){"""

OLD_RUNCMD = "  const runWorkspaceCommand=(action:()=>void,label:string)=>{action();setCommandPaletteOpen(false);setStatusMessage(label);};"

NEW_RUNCMD = """  // PATCH 017E : sauvegarde immediate avant fermeture ou rechargement (F5).
  // L autosauvegarde differee de 700 ms pouvait perdre les dernieres actions.
  useEffect(()=>{
    if(!authReady||!userUid||!recoveryChecked||recoveryCandidate||recoveryFailure)return;
    const flush=()=>{
      try{
        const snapshot=buildProjectFileV474();
        if(snapshot.model.nodes.length===0&&snapshot.model.segments.length===0)return;
        const serialized=JSON.stringify(snapshot);
        const previous=localStorage.getItem(AUTOSAVE_CURRENT_KEY);
        if(previous&&previous!==serialized)localStorage.setItem(AUTOSAVE_PREVIOUS_KEY,previous);
        localStorage.setItem(AUTOSAVE_CURRENT_KEY,serialized);
      }catch{}
    };
    const onVisibility=()=>{if(document.visibilityState==="hidden")flush();};
    window.addEventListener("beforeunload",flush);
    window.addEventListener("pagehide",flush);
    document.addEventListener("visibilitychange",onVisibility);
    return()=>{
      window.removeEventListener("beforeunload",flush);
      window.removeEventListener("pagehide",flush);
      document.removeEventListener("visibilitychange",onVisibility);
    };
  },[authReady,userUid,recoveryChecked,recoveryCandidate,recoveryFailure,projectName,lines,nodes,segments,dimensions,cad2dEntities,cad2dLayers,projectSetup,viewport]);

""" + OLD_RUNCMD


def patch_engine():
    src = read(ENGINE)
    if "PATCH 017E" in src:
        notes.append("OK (deja) : moteur ISO (identite locale, restauration, flush)")
        return
    backup(ENGINE)
    src = sub(src, OLD_UID, NEW_UID, "identite locale de secours pour l autosauvegarde")
    src = sub(src, OLD_RECOVER, NEW_RECOVER, "restauration silencieuse de la session courante")
    src = sub(src, OLD_RUNCMD, NEW_RUNCMD, "sauvegarde immediate avant rechargement (F5)")
    write(ENGINE, src)


# =============================================================== COQUILLE
OLD_MODULES = """const PDI_RENDERABLE_MODULES: PdiModule[] = [
  "home", "isometric", "drive", "vision", "sketch", "cad", "json", "pdf",
  "assistant", "profile", "subscription", "security",
  "super_admin_console", "license_keys",
];"""

NEW_MODULES = """const PDI_RENDERABLE_MODULES: PdiModule[] = [
  "home", "isometric", "drive", "vision", "sketch", "cad", "json", "pdf",
  "projects", "assistant", "profile", "subscription", "security",
  "super_admin_console", "license_keys",
];

// PATCH 017E : sessions locales autosauvegardees par l editeur ISO.
// Sert d ecran "Mes projets" reel au lieu d un espace vide.
type PdiLocalSession = {
  key: string;
  name: string;
  nodes: number;
  segments: number;
  updatedAt: string;
  archive: boolean;
};

function pdiListLocalSessions(): PdiLocalSession[] {
  const out: PdiLocalSession[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || key.indexOf("isometrie.autosave.") !== 0) continue;
      const isCurrent = key.slice(-8) === ".current";
      const isPrevious = key.slice(-9) === ".previous";
      if (!isCurrent && !isPrevious) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      try {
        const snap = JSON.parse(raw);
        const nodes = Array.isArray(snap?.model?.nodes) ? snap.model.nodes.length : 0;
        const segments = Array.isArray(snap?.model?.segments) ? snap.model.segments.length : 0;
        if (nodes === 0 && segments === 0) continue;
        out.push({
          key,
          name: String(snap?.project?.name || "Projet isometrique"),
          nodes,
          segments,
          updatedAt: String(snap?.project?.updatedAt || "").slice(0, 16).replace("T", " "),
          archive: isPrevious,
        });
      } catch {}
    }
  } catch {}
  return out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}"""

# --- CSS : la barre d onglets devient une vraie ligne de la grille
CSS_PAIRS = [
    ("grid-template-columns:96px 1fr;grid-template-rows:72px 1fr}",
     "grid-template-columns:96px 1fr;grid-template-rows:72px 40px 1fr}",
     "grille de la coquille : ligne dediee aux onglets"),
    (".pdi-main-nav{grid-row:2;display:flex",
     ".pdi-main-nav{grid-row:2/4;display:flex",
     "barre laterale etendue sur les deux lignes"),
    (".pdi-content{grid-column:2;grid-row:2;min-width:0",
     ".pdi-content{grid-column:2;grid-row:3;min-width:0",
     "contenu place sous la barre d onglets"),
    (".pdi-tabsbar{grid-column:2;grid-row:2;align-self:start;z-index:8;display:flex;gap:6px;padding:8px 14px;",
     ".pdi-tabsbar{grid-column:2;grid-row:2;align-self:stretch;z-index:8;display:flex;align-items:center;gap:6px;padding:4px 12px;",
     "barre d onglets non superposee au contenu"),
    ("@media(max-width:900px){.pdi-unified-root{grid-template-columns:1fr;grid-template-rows:72px auto 1fr}",
     "@media(max-width:900px){.pdi-unified-root{grid-template-columns:1fr;grid-template-rows:72px auto 40px 1fr}.pdi-tabsbar{grid-column:1;grid-row:3}",
     "grille mobile : ligne d onglets"),
    (".pdi-content{grid-column:1;grid-row:3;padding:12px}",
     ".pdi-content{grid-column:1;grid-row:4;padding:12px}",
     "contenu mobile place sous les onglets"),
]

OLD_TABSBAR = ('      {workspaceTabs.length>0 && <div className="pdi-tabsbar">'
               '{workspaceTabs.map(tab=><button key={tab.id} className={activeTabId===tab.id?"active":""} '
               'onClick={()=>switchTab(tab.id)}>{tab.title}<span onClick={(e)=>{e.stopPropagation(); '
               'closeTab(tab.id)}}>\u00d7</span></button>)}<button className="plus" '
               'onClick={()=>openModuleInTab("isometric","Nouveau plan ISO")}>+</button></div>}')

NEW_TABSBAR = """      {/* PATCH 017E : barre d onglets toujours visible et directement accessible. */}
      <div className="pdi-tabsbar">
        <span style={{ color: "#64748B", fontSize: 10, fontWeight: 900, letterSpacing: ".08em", marginRight: 4 }}>ONGLETS</span>
        {workspaceTabs.map(tab=><button key={tab.id} className={activeTabId===tab.id?"active":""} onClick={()=>switchTab(tab.id)} title={tab.title}>{tab.title}<span onClick={(e)=>{e.stopPropagation(); closeTab(tab.id)}}>\u00d7</span></button>)}
        {workspaceTabs.length===0 && <span style={{ color: "#64748B", fontSize: 11, fontWeight: 800 }}>Aucun onglet ouvert - cliquez sur + pour un nouveau plan ISO</span>}
        <button className="plus" onClick={()=>openModuleInTab("isometric","Nouveau plan ISO")} title="Nouvel onglet ISO">+</button>
        <button className="plus" style={{ minWidth: 70 }} onClick={()=>setActiveModule("projects")} title="Mes projets PD&I">Projets</button>
      </div>"""

OLD_ISO_BRANCH = """  if (activeModule === "isometric") return (
    <PdiModuleErrorBoundary>
      <PdiIsometricEditor />
    </PdiModuleErrorBoundary>
  );"""

NEW_ISO_BRANCH = """  if (activeModule === "isometric") return (
    <PdiModuleErrorBoundary>
      {/* PATCH 017E : acces direct aux onglets depuis l editeur ISO. */}
      <div style={{ position: "fixed", left: 100, bottom: 56, zIndex: 10040, display: "flex", alignItems: "center", gap: 6, padding: "4px 6px", borderRadius: 12, border: "1px solid rgba(103,232,249,.35)", background: "rgba(2,6,23,.92)", boxShadow: "0 10px 30px rgba(0,0,0,.45)", maxWidth: "min(70vw,760px)", overflowX: "auto" }}>
        <button type="button" onClick={() => setIsoTabDockOpen(v => !v)} title="Onglets PD&I" style={{ border: "1px solid rgba(103,232,249,.35)", background: "linear-gradient(135deg,#0284C7,#22D3EE)", color: "white", borderRadius: 8, height: 24, padding: "0 8px", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>
          {isoTabDockOpen ? "\u25be" : "\u25b8"} ONGLETS ({workspaceTabs.length})
        </button>
        {isoTabDockOpen && workspaceTabs.map(tab => (
          <button key={tab.id} type="button" onClick={() => switchTab(tab.id)} title={tab.title} style={{ border: activeTabId === tab.id ? "1px solid #67E8F9" : "1px solid #263241", background: activeTabId === tab.id ? "linear-gradient(135deg,#0284C7,#22D3EE)" : "#111827", color: activeTabId === tab.id ? "white" : "#CBD5E1", borderRadius: 8, height: 24, padding: "0 8px", fontSize: 10, fontWeight: 900, whiteSpace: "nowrap", cursor: "pointer" }}>
            {tab.title}
            <span onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} style={{ marginLeft: 6, opacity: .7 }}>\u00d7</span>
          </button>
        ))}
        {isoTabDockOpen && <button type="button" onClick={() => openModuleInTab("isometric", "Nouveau plan ISO")} title="Nouvel onglet ISO" style={{ border: "1px solid #263241", background: "#111827", color: "#CBD5E1", borderRadius: 8, height: 24, minWidth: 26, fontSize: 12, fontWeight: 900, cursor: "pointer" }}>+</button>}
        {isoTabDockOpen && <button type="button" onClick={() => setActiveModule("projects")} title="Mes projets PD&I" style={{ border: "1px solid #263241", background: "#111827", color: "#CBD5E1", borderRadius: 8, height: 24, padding: "0 8px", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>PROJETS</button>}
      </div>
      <PdiIsometricEditor />
    </PdiModuleErrorBoundary>
  );"""

OLD_DOCK_STATE = '  const persistTabs = (tabs: PdiWorkspaceTab[], id: string | null) =>'
NEW_DOCK_STATE = ('  // PATCH 017E : dock d onglets de l editeur ISO.\n'
                  '  const [isoTabDockOpen, setIsoTabDockOpen] = useState(true);\n'
                  '  const persistTabs = (tabs: PdiWorkspaceTab[], id: string | null) =>')

OLD_PROJECTS_ANCHOR = "        {/* PATCH 017B : plus jamais d ecran vide pour un module sans rendu. */}"

NEW_PROJECTS = """        {/* PATCH 017E : ecran "Mes projets" reel, alimente par les sessions locales. */}
        {activeModule === "projects" && <ComingSoonPanel title="Mes projets PD&I">
          <p>Sessions enregistrees sur ce poste. L editeur restaure automatiquement la derniere session au rechargement (F5).</p>
          <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
            {pdiListLocalSessions().length === 0 && <span style={{ color: "#94A3B8", fontWeight: 800 }}>Aucune session enregistree pour le moment. Dessinez un tronçon dans l editeur ISO : la sauvegarde locale est automatique.</span>}
            {pdiListLocalSessions().map(session => (
              <div key={session.key} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, border: "1px solid rgba(103,232,249,.25)", borderRadius: 14, padding: "10px 12px", background: "#0B111A" }}>
                <b style={{ color: "#E5EDF8" }}>{session.name}</b>
                <span style={{ color: "#67E8F9", fontWeight: 900, fontSize: 11 }}>{session.nodes} noeuds · {session.segments} tronçons</span>
                <span style={{ color: "#94A3B8", fontSize: 11, fontWeight: 800 }}>{session.updatedAt}</span>
                <span style={{ color: "#64748B", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{session.archive ? "archive precedente" : "session courante"}</span>
                <button type="button" className="pdi-start-primary" style={{ marginLeft: "auto", padding: "8px 12px" }} onClick={() => setActiveModule("isometric")}>Ouvrir dans l editeur</button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="pdi-start-primary" onClick={() => openModuleInTab("isometric", "Nouveau plan ISO")}>Nouveau plan ISO</button>
          </div>
        </ComingSoonPanel>}

""" + OLD_PROJECTS_ANCHOR


def patch_app():
    src = read(APP)
    if "PATCH 017E" in src:
        notes.append("OK (deja) : coquille (onglets, dock ISO, Mes projets)")
        return
    backup(APP)
    src = sub(src, OLD_MODULES, NEW_MODULES, "module projets rendu + lecture des sessions locales")
    for old, new, label in CSS_PAIRS:
        src = sub(src, old, new, label)
    src = sub(src, OLD_DOCK_STATE, NEW_DOCK_STATE, "etat du dock d onglets ISO")
    src = sub(src, OLD_TABSBAR, NEW_TABSBAR, "barre d onglets permanente avec acces Projets")
    src = sub(src, OLD_ISO_BRANCH, NEW_ISO_BRANCH, "dock d onglets flottant dans l editeur ISO")
    src = sub(src, OLD_PROJECTS_ANCHOR, NEW_PROJECTS, "ecran Mes projets alimente par les sessions locales")
    write(APP, src)


REPORT = os.path.join(ROOT, "017E_persistance_f5_onglets_projets_REPORT.md")

REPORT_BODY = """# PATCH 017E - Persistance F5, onglets, ecran Mes projets

## Symptomes signales
1. F5 efface tout le dessin.
2. "Mes projets" affiche des onglets vides.
3. L acces aux onglets n est pas conforme : il devrait etre visible et direct.

## Diagnostic
- Les cles d autosauvegarde du moteur ISO sont prefixees par l identifiant
  utilisateur : `isometrie.autosave.v474.user.<uid>.current`. Le code calcule
  `autosavePrefix = userUid ? ... : ""`. Sans compte Firebase et sans profil
  `sonelgaz_user_profile`, `userUid` vaut `null` : le prefixe est vide,
  l autosauvegarde est explicitement suspendue et **rien n est jamais ecrit**.
  C est la cause exacte de la perte du dessin a chaque F5.
- Meme avec une sauvegarde valide, la restauration passait par une fenetre de
  confirmation. Un simple rechargement affichait donc un plan vide.
- L autosauvegarde etait differee de 700 ms, sans ecriture sur `beforeunload` :
  les dernieres actions pouvaient etre perdues.
- Le module `projects` n etait pas dans la liste des modules rendus : le menu
  "Mes projets" tombait sur le panneau generique, sans aucun projet.
- La barre d onglets etait `grid-row:2` avec `align-self:start` dans la meme
  cellule que le contenu : elle se superposait au contenu et n etait affichee
  que s il existait deja un onglet. Dans l editeur ISO, elle etait totalement
  absente car la coquille est court-circuitee.

## Correctifs
1. Identite locale de secours `pdi.localUid.v1` : l autosauvegarde fonctionne
   meme sans compte, tout en restant cloisonnee par profil.
2. Restauration silencieuse de la session courante au demarrage. La fenetre de
   recuperation ne sert plus qu aux archives precedentes ou corrompues.
3. Ecriture immediate sur `beforeunload`, `pagehide` et passage en arriere-plan.
4. Barre d onglets sur sa propre ligne de grille, toujours visible, avec
   compteur, bouton `+` et bouton `Projets`.
5. Dock d onglets flottant et repliable dans l editeur ISO.
6. Ecran "Mes projets" reel : nom du projet, nombre de noeuds et de tronçons,
   date, statut (session courante / archive precedente) et ouverture directe.

## Tests
1. Dessiner deux tronçons, attendre "Autosauvegarde" dans la barre d etat,
   puis F5 : le dessin revient, message "Session restauree automatiquement".
2. Dessiner puis F5 immediatement : le dessin revient aussi (flush beforeunload).
3. Fermer l onglet du navigateur, revenir sur l application : dessin present.
4. Barre d onglets visible en permanence dans la coquille, meme sans onglet.
5. Dans l editeur ISO, le dock ONGLETS est visible en bas a gauche, repliable,
   et permet de changer d onglet, d en creer un, d aller sur Projets.
6. Menu compte > Mes projets : la session locale est listee avec ses compteurs
   et le bouton Ouvrir dans l editeur fonctionne.
7. `npm run lint` puis `npm run build`.

## Limite connue
Si une authentification Firebase se resout apres coup, l identifiant passe de
`local-...` a l uid du compte et la page se recharge une fois : les sessions
enregistrees en mode local restent listees dans "Mes projets" mais ne sont plus
restaurees automatiquement sous le nouveau compte. Un import/export JSON reste
disponible pour les transferer.
"""


def main():
    print("PATCH 017E - persistance F5, onglets, Mes projets")
    print("Racine : " + ROOT)
    check_files()
    patch_engine()
    patch_app()
    with open(REPORT, "w", encoding="utf-8") as fh:
        fh.write(REPORT_BODY)
    notes.append("OK : rapport 017E_persistance_f5_onglets_projets_REPORT.md")
    print("")
    for n in notes:
        print("  " + n)
    ko = len([n for n in notes if n.startswith("NON TROUVE")])
    print("")
    print("Resultat : %d/%d" % (len(notes) - ko, len(notes)))
    if ko:
        print("Des ancres n ont pas ete trouvees : verifier le build utilise.")


if __name__ == "__main__":
    main()
