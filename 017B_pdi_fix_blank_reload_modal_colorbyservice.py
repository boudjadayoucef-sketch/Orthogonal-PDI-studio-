#!/usr/bin/env python3
# PATCH 017B - Correction page blanche apres rechargement + modal Project Setup
#              + garde-fou module + couleur par service
import os, shutil, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(ROOT, "src", "pdi", "app", "PdiUnifiedApp.tsx")
ENGINE = os.path.join(ROOT, "src", "pdi", "isometric", "engine", "IsometrieModuleV48d.tsx")
REPORT = os.path.join(ROOT, "017B_fix_blank_reload_REPORT.md")
notes = []


def sub(s, old, new, note):
    if new in s:
        notes.append("DEJA APPLIQUE : " + note)
        return s
    if old not in s:
        notes.append("NON TROUVE : " + note)
        return s
    notes.append(note)
    return s.replace(old, new, 1)


# ---------------------------------------------------------------- APP -------
MODULES_OLD = 'const PDI_AUTH_KEY = "pdi.auth.mode.v1";'
MODULES_NEW = MODULES_OLD + '''

// PATCH 017B : modules reellement rendus par la coquille.
// Un module absent de cette liste (ex: "projects" ou une valeur heritee)
// provoquait un espace de travail vide apres rechargement.
const PDI_RENDERABLE_MODULES: PdiModule[] = [
  "home", "isometric", "drive", "vision", "sketch", "cad", "json", "pdf",
  "assistant", "profile", "subscription", "security",
  "super_admin_console", "license_keys",
];
const pdiSafeModule = (value: unknown, fallback: PdiModule): PdiModule => {
  return PDI_RENDERABLE_MODULES.includes(value as PdiModule) ? (value as PdiModule) : fallback;
};'''

INIT_OLD = '''      if (isConnected) {
        return (saved && saved !== "home") ? saved : "isometric";
      }
      return saved || "home";'''
INIT_NEW = '''      if (isConnected) {
        // PATCH 017B : on ne restaure qu'un module reellement affichable.
        return (saved && saved !== "home") ? pdiSafeModule(saved, "isometric") : "isometric";
      }
      return pdiSafeModule(saved, "home");'''

BOUNDARY_OLD = 'import React, { useEffect, useMemo, useState } from "react";'
BOUNDARY_NEW = BOUNDARY_OLD + '''

// PATCH 017B : filet de securite. Une erreur d execution dans l editeur ISO
// affichait une page totalement vide apres rechargement. On affiche desormais
// un message et un bouton de reinitialisation de l espace de travail.
class PdiModuleErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { failed: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown) {
    return { failed: true, message: error instanceof Error ? error.message : String(error) };
  }

  resetWorkspace = () => {
    try {
      const keys = [
        "pdi.activeModule.v1",
        "pdi.tabs.v1",
        "pdi.activeTabId.v1",
        "pdi.commandPromptHidden.v1",
        "pdi.workspaceVisualStyle.v1",
      ];
      keys.forEach(k => window.localStorage.removeItem(k));
      window.localStorage.setItem("pdi.activeModule.v1", "isometric");
    } catch {}
    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", background: "#070B12", color: "#E5EDF8", display: "grid", placeItems: "center", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ maxWidth: 620, border: "1px solid rgba(103,232,249,.35)", borderRadius: 20, padding: 24, background: "linear-gradient(180deg,#111C2A,#08111C)" }}>
          <div style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", color: "#67E8F9" }}>Espace de travail PD&amp;I</div>
          <h2 style={{ margin: "8px 0 10px", fontSize: 22 }}>Le module n a pas pu s afficher</h2>
          <p style={{ color: "#AFC4DD", fontWeight: 700, lineHeight: 1.6 }}>
            Une erreur est survenue au chargement. Vos plans enregistres ne sont pas perdus :
            seuls les reglages d affichage vont etre reinitialises.
          </p>
          <pre style={{ background: "#050B12", border: "1px solid rgba(103,232,249,.25)", borderRadius: 10, padding: 10, color: "#A7F3D0", fontSize: 11, whiteSpace: "pre-wrap" }}>{this.state.message}</pre>
          <button type="button" onClick={this.resetWorkspace} style={{ marginTop: 12, border: 0, borderRadius: 14, padding: "12px 16px", fontWeight: 900, color: "white", background: "linear-gradient(135deg,#0284C7,#22D3EE)", cursor: "pointer" }}>
            Reinitialiser l espace de travail
          </button>
        </div>
      </div>
    );
  }
}'''

RENDER_OLD = '  if (activeModule === "isometric") return <PdiIsometricEditor />;'
RENDER_NEW = '''  // PATCH 017B : editeur ISO protege par un filet de securite.
  if (activeModule === "isometric") return (
    <PdiModuleErrorBoundary>
      <PdiIsometricEditor />
    </PdiModuleErrorBoundary>
  );'''

FALLBACK_OLD = '        {activeModule === "assistant" && <ComingSoonPanel title="Assistant et agents sp\u00e9cialis\u00e9s">'
FALLBACK_NEW = '''        {/* PATCH 017B : plus jamais d ecran vide pour un module sans rendu. */}
        {!PDI_RENDERABLE_MODULES.includes(activeModule) && <ComingSoonPanel title="Espace projets PD&I">
          <p>Ce module n a pas encore d ecran dedie. Reprenez le travail dans l editeur isometrique.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <button type="button" className="pdi-start-primary" onClick={() => setActiveModule("isometric")}>Ouvrir l editeur ISO</button>
            <button type="button" className="pdi-start-primary" onClick={() => setActiveModule("home")}>Retour accueil</button>
          </div>
        </ComingSoonPanel>}
''' + FALLBACK_OLD


# ------------------------------------------------------------- ENGINE -------
def move_project_setup_modal(s):
    if "PATCH 017B : modal Project Setup repositionne" in s:
        notes.append("DEJA APPLIQUE : modal Project Setup repositionne")
        return s
    start_tag = "{/* PATCH 017A : Project Setup PD&I */}"
    i = s.find(start_tag)
    if i < 0:
        notes.append("NON TROUVE : bloc modal Project Setup")
        return s
    end_tag = "\n    {/* PATCH 016A: bouton BOM"
    j = s.find(end_tag, i)
    if j < 0:
        notes.append("NON TROUVE : fin du bloc modal Project Setup")
        return s
    line_start = s.rfind("\n", 0, i) + 1
    block = s[i:j]
    s = s[:line_start] + s[j + 1:]
    anchor = "    {/* PATCH 016A \u2014 Ligne de commande masquable"
    if anchor not in s:
        notes.append("NON TROUVE : ancre de replacement du modal")
        return s
    replacement = (
        "    {/* PATCH 017B : modal Project Setup repositionne au niveau racine */}\n"
        + "    " + block.strip() + "\n\n" + anchor
    )
    notes.append("Modal Project Setup sorti de la barre superieure et repositionne")
    return s.replace(anchor, replacement, 1)


SERVICE_COLOR_OLD = '  const tagIssues = segments.filter(s => s.tag && !pdiValidateTag(s.tag, segments.map(x => x.tag || ""), activeTagFormat).ok).length;'
SERVICE_COLOR_NEW = SERVICE_COLOR_OLD + '''

  // PATCH 017B : code couleur par service (revue de plan).
  const [colorByService, setColorByService] = useState(false);
  const segmentStrokeColor = (seg: IsoSegment) => {
    if (colorByService && seg.service) {
      const sv = projectSetup.services.find(x => x.code === seg.service);
      if (sv) return sv.color;
    }
    return seg.color || workspaceVisualStyle.defaultPipeColor;
  };'''

STROKE_OLD = 'stroke={s.color||workspaceVisualStyle.defaultPipeColor}'
STROKE_NEW = 'stroke={segmentStrokeColor(s)}'

CMD_OLD = '''    if (["autotag"].includes(rawVerb)) {
      autoTagAllSegments();
      return;
    }'''
CMD_NEW = CMD_OLD + '''
    if (["colorbyservice", "couleurservice", "cbs"].includes(rawVerb)) {
      const on = ["on", "1", "oui", "true"].includes((rawArg || "").toLowerCase());
      const off = ["off", "0", "non", "false"].includes((rawArg || "").toLowerCase());
      const next = off ? false : on ? true : !colorByService;
      setColorByService(next);
      setAutocadPrompt("COULEUR PAR SERVICE : " + (next ? "ON" : "OFF") + ".");
      return;
    }'''


def main():
    for path in (APP, ENGINE):
        if not os.path.isfile(path):
            print("ERREUR : fichier introuvable :", path)
            return 1

    for path, suffix in ((APP, ".before017B"), (ENGINE, ".before017B")):
        backup = path + suffix
        if not os.path.isfile(backup):
            shutil.copyfile(path, backup)

    a = open(APP, encoding="utf-8").read()
    a = sub(a, MODULES_OLD, MODULES_NEW, "Liste blanche des modules affichables ajoutee")
    a = sub(a, INIT_OLD, INIT_NEW, "Restauration du module actif securisee")
    a = sub(a, BOUNDARY_OLD, BOUNDARY_NEW, "Filet de securite (error boundary) ajoute")
    a = sub(a, RENDER_OLD, RENDER_NEW, "Editeur ISO protege par le filet de securite")
    a = sub(a, FALLBACK_OLD, FALLBACK_NEW, "Ecran de repli ajoute pour tout module sans rendu")
    open(APP, "w", encoding="utf-8").write(a)

    e = open(ENGINE, encoding="utf-8").read()
    e = move_project_setup_modal(e)
    e = sub(e, SERVICE_COLOR_OLD, SERVICE_COLOR_NEW, "Couleur par service ajoutee")
    e = sub(e, STROKE_OLD, STROKE_NEW, "Rendu des tuyauteries branche sur la couleur par service")
    e = sub(e, CMD_OLD, CMD_NEW, "Commande COLORBYSERVICE ajoutee")
    open(ENGINE, "w", encoding="utf-8").write(e)

    with open(REPORT, "w", encoding="utf-8") as f:
        f.write("# PATCH 017B - Correction page blanche + modal Project Setup\n\n")
        f.write("Date : " + datetime.datetime.now().isoformat(timespec="seconds") + "\n\n")
        f.write("## Cause racine de la page blanche\n")
        f.write("- La coquille restaurait le module enregistre dans pdi.activeModule.v1 sans verifier\n")
        f.write("  qu un ecran existe pour ce module. Les valeurs sans rendu (ex: projects) affichaient\n")
        f.write("  une zone de travail totalement vide apres rechargement.\n")
        f.write("- Aucun filet de securite n entourait l editeur ISO : toute erreur d execution\n")
        f.write("  produisait un ecran noir sans message.\n\n")
        f.write("## Modifications\n")
        for n in notes:
            f.write("- " + n + "\n")
        f.write("\n## Tests\n")
        f.write("1. Recharger la page en etant connecte : l editeur ISO doit revenir directement.\n")
        f.write("2. Menu profil > Mes projets, puis recharger : ecran de repli avec boutons, jamais du vide.\n")
        f.write("3. Ouvrir PROJECTSETUP : le modal doit etre centre plein ecran, pas coince dans la barre du haut.\n")
        f.write("4. Taper COLORBYSERVICE : les tuyauteries prennent la couleur de leur service.\n")
        f.write("5. Taper COLORBYSERVICE OFF : retour aux couleurs de style.\n")
        f.write("6. npm run lint puis npm run build.\n")

    print("PATCH 017B applique localement.")
    for n in notes:
        print("- " + n)
    print("Rapport : " + REPORT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
